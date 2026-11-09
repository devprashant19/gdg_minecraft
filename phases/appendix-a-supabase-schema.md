# Appendix A: Supabase schema, functions, RLS and tests

Everything here is a migration in `supabase/migrations/`. Never change production tables by hand in the dashboard. Works on the **Supabase free tier** (pg_cron and pgTAP are included).

Builds on the doc's tested `register_team` (atomic team + members insert, case-insensitive duplicate email rejection, no anon access) and adds: settings-driven deadline and team size, track foreign key, case-insensitive team names, exactly one leader, capacity limit, rate limiting, admin RLS, status function, cleanup job.

---

## `0001_core.sql`

```sql
-- ─── Settings (single row) ──────────────────────────────────────────────
create table public.event_settings (
  id                     boolean primary key default true check (id),   -- singleton
  registration_opens_at  timestamptz not null,
  registration_closes_at timestamptz not null,
  team_size_min          int  not null default 2 check (team_size_min >= 1),
  team_size_max          int  not null default 4,
  max_teams              int  check (max_teams is null or max_teams > 0),
  team_code_prefix       text not null default 'CRAFT' check (team_code_prefix ~ '^[A-Z]{2,8}$'),
  coc_version            text not null default '2026-11',
  rl_ip_max              int  not null default 30,   -- attempts per IP per 10 min
  rl_email_max           int  not null default 5,    -- attempts per leader email per hour
  check (team_size_max >= team_size_min),
  check (registration_closes_at > registration_opens_at)
);

create table public.tracks (
  slug      text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  title     text not null,
  is_active boolean not null default true
);

-- ─── Teams and members ──────────────────────────────────────────────────
create sequence public.team_code_seq;

create table public.teams (
  id                    uuid primary key default gen_random_uuid(),
  code                  text not null unique,
  name                  text not null check (char_length(btrim(name)) between 2 and 40),
  track                 text not null references public.tracks(slug),
  coc_version           text not null,
  sponsor_sharing       boolean not null default false,
  consent_at            timestamptz not null default now(),
  confirmation_sent_at  timestamptz,
  status                text not null default 'registered'
                          check (status in ('registered', 'waitlisted', 'withdrawn')),
  created_at            timestamptz not null default now()
);
create unique index teams_name_lower_key on public.teams (lower(btrim(name)));
create index teams_track_idx on public.teams (track);
create index teams_unsent_email_idx on public.teams (created_at) where confirmation_sent_at is null;

create table public.team_members (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 80),
  email       text not null check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
                                   and char_length(email) <= 254),
  institution text check (institution is null or char_length(institution) <= 120),
  is_leader   boolean not null default false,
  created_at  timestamptz not null default now()
);
create unique index team_members_email_key   on public.team_members (email);
create unique index team_members_one_leader  on public.team_members (team_id) where is_leader;
create index        team_members_team_idx    on public.team_members (team_id);

-- ─── Rate-limit log (hashed, no raw PII) ───────────────────────────────
create table public.registration_attempts (
  id         bigint generated always as identity primary key,
  ip_hash    text not null,
  email_hash text,
  created_at timestamptz not null default now()
);
create index registration_attempts_ip_idx    on public.registration_attempts (ip_hash, created_at desc);
create index registration_attempts_email_idx on public.registration_attempts (email_hash, created_at desc);
```

## `0002_security.sql` (RLS and grants)

```sql
alter table public.event_settings        enable row level security;
alter table public.tracks                enable row level security;
alter table public.teams                 enable row level security;
alter table public.team_members          enable row level security;
alter table public.registration_attempts enable row level security;

-- Defence in depth: Supabase grants table privileges to anon/authenticated by default.
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Admins (authenticated users whose app_metadata.role = 'admin') may read and set status.
-- app_metadata can only be changed with the secret key, never by the user.
create or replace function public.is_admin() returns boolean
language sql stable set search_path = '' as $$
  select coalesce((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

grant select on public.teams, public.team_members, public.tracks, public.event_settings to authenticated;
grant update (status) on public.teams to authenticated;

create policy admin_read_teams    on public.teams          for select to authenticated using (public.is_admin());
create policy admin_status_teams  on public.teams          for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy admin_read_members  on public.team_members   for select to authenticated using (public.is_admin());
create policy admin_read_tracks   on public.tracks         for select to authenticated using (public.is_admin());
create policy admin_read_settings on public.event_settings for select to authenticated using (public.is_admin());
-- No policies at all for anon. registration_attempts has no policies for anyone (server only).
```

## `0003_functions.sql`

```sql
-- ─── Register a team atomically ─────────────────────────────────────────
create or replace function public.register_team(
  p_name text, p_track text, p_members jsonb, p_coc_version text,
  p_sponsor_sharing boolean default false
) returns text
language plpgsql security definer set search_path = '' as $$
declare
  s          public.event_settings;
  v_team_id  uuid;
  v_count    int;
  v_leaders  int;
  v_code     text;
begin
  select * into strict s from public.event_settings where id;

  if now() <  s.registration_opens_at  then raise exception 'REGISTRATION_NOT_OPEN'; end if;
  if now() >= s.registration_closes_at then raise exception 'REGISTRATION_CLOSED';   end if;
  if p_coc_version is distinct from s.coc_version then raise exception 'STALE_COC'; end if;

  if jsonb_typeof(p_members) is distinct from 'array' then raise exception 'INVALID_MEMBERS'; end if;
  v_count := jsonb_array_length(p_members);
  if v_count < s.team_size_min or v_count > s.team_size_max then raise exception 'TEAM_SIZE'; end if;

  select count(*) into v_leaders
  from jsonb_array_elements(p_members) m
  where coalesce((m ->> 'is_leader')::boolean, false);
  if v_leaders <> 1 then raise exception 'ONE_LEADER'; end if;

  if not exists (select 1 from public.tracks where slug = p_track and is_active) then
    raise exception 'INVALID_TRACK';
  end if;

  if s.max_teams is not null then
    perform pg_advisory_xact_lock(hashtext('register_team_capacity'));   -- serialise only near the cap
    if (select count(*) from public.teams where status = 'registered') >= s.max_teams then
      raise exception 'EVENT_FULL';
    end if;
  end if;

  v_code := s.team_code_prefix || '-' || lpad(nextval('public.team_code_seq')::text, 4, '0');

  insert into public.teams (code, name, track, coc_version, sponsor_sharing)
  values (v_code, btrim(p_name), p_track, p_coc_version, coalesce(p_sponsor_sharing, false))
  returning id into v_team_id;

  insert into public.team_members (team_id, name, email, institution, is_leader)
  select v_team_id,
         btrim(m ->> 'name'),
         lower(btrim(m ->> 'email')),
         nullif(btrim(m ->> 'institution'), ''),
         coalesce((m ->> 'is_leader')::boolean, false)
  from jsonb_array_elements(p_members) m;

  return v_code;   -- any error above rolls back the whole call: never a team without members
end;
$$;

-- ─── Rate limiting ──────────────────────────────────────────────────────
create or replace function public.note_registration_attempt(p_ip_hash text, p_email_hash text)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare s public.event_settings; v_ip int; v_email int;
begin
  select * into strict s from public.event_settings where id;
  insert into public.registration_attempts (ip_hash, email_hash) values (p_ip_hash, p_email_hash);
  select count(*) into v_ip    from public.registration_attempts
   where ip_hash = p_ip_hash and created_at > now() - interval '10 minutes';
  select count(*) into v_email from public.registration_attempts
   where email_hash = p_email_hash and created_at > now() - interval '1 hour';
  return v_ip <= s.rl_ip_max and v_email <= s.rl_email_max;
end;
$$;

-- ─── Public status (called by the server, cached at the edge) ───────────
create or replace function public.registration_status() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'open',        now() >= s.registration_opens_at and now() < s.registration_closes_at
                   and (s.max_teams is null or
                        (select count(*) from public.teams where status = 'registered') < s.max_teams),
    'opensAt',     s.registration_opens_at,
    'closesAt',    s.registration_closes_at,
    'teams',       (select count(*) from public.teams where status = 'registered'),
    'maxTeams',    s.max_teams,
    'teamSizeMin', s.team_size_min,
    'teamSizeMax', s.team_size_max,
    'cocVersion',  s.coc_version,
    'tracks',      (select coalesce(jsonb_agg(slug order by slug), '[]') from public.tracks where is_active),
    'serverNow',   now())
  from public.event_settings s where s.id;
$$;

-- ─── Only the server (service_role / secret key) may call these ─────────
revoke execute on function public.register_team(text, text, jsonb, text, boolean) from public, anon, authenticated;
revoke execute on function public.note_registration_attempt(text, text)          from public, anon, authenticated;
revoke execute on function public.registration_status()                          from public, anon, authenticated;
grant  execute on function public.register_team(text, text, jsonb, text, boolean) to service_role;
grant  execute on function public.note_registration_attempt(text, text)          to service_role;
grant  execute on function public.registration_status()                          to service_role;
```

## `0004_cron.sql` (cleanup on the free tier)

```sql
create extension if not exists pg_cron;   -- if the migration lacks rights, enable pg_cron in Dashboard → Integrations
select cron.schedule('purge-registration-attempts', '15 3 * * *',
  $$delete from public.registration_attempts where created_at < now() - interval '2 days'$$);
```

## `seed.sql` (local + staging only)

```sql
insert into public.event_settings (registration_opens_at, registration_closes_at, team_size_min, team_size_max)
values (now() - interval '1 day', now() + interval '30 days', 2, 4);

insert into public.tracks (slug, title) values
  ('ai-ml', 'AI & ML'), ('web3', 'Web3'), ('health', 'HealthTech'), ('edtech', 'EdTech'),
  ('climate', 'Climate'), ('fintech', 'FinTech'), ('cloud', 'Cloud & DevOps'),
  ('games', 'Games & XR'), ('open', 'Open Innovation');
```

Production values go in a dated migration (`0005_prod_settings.sql`) or are set once with an `update`. Keep `tracks` in sync with `content/tracks.json`; a CI check compares the slugs.

## pgTAP tests: `supabase/tests/register_team.test.sql`

Run with `pnpm supabase test db` (local Docker) and in CI.

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

-- fixtures
insert into public.event_settings (registration_opens_at, registration_closes_at, team_size_min, team_size_max)
values (now() - interval '1 day', now() + interval '1 day', 2, 4)
on conflict (id) do update set registration_opens_at = excluded.registration_opens_at,
  registration_closes_at = excluded.registration_closes_at, team_size_min = 2, team_size_max = 4, max_teams = null;
insert into public.tracks (slug, title) values ('ai-ml', 'AI') on conflict do nothing;

create temp table m(j jsonb);
insert into m values ('[{"name":"Asha","email":"Asha@X.com","is_leader":true},
                        {"name":"Ravi","email":"ravi@x.com"}]');

-- 1 valid team
select matches(public.register_team('Block Party', 'ai-ml', (select j from m), '2026-11'),
               '^CRAFT-\d{4}$', 'valid team gets a code');
select is((select count(*)::int from public.team_members m2 join public.teams t on t.id = m2.team_id
           where t.name = 'Block Party'), 2, 'both members saved');
select is((select email from public.team_members where name = 'Asha'), 'asha@x.com', 'email lower-cased');

-- 2 duplicates
select throws_ok($$ select public.register_team('Other', 'ai-ml',
  '[{"name":"A","email":"ASHA@x.com","is_leader":true},{"name":"B","email":"b@x.com"}]', '2026-11') $$,
  '23505', null, 'duplicate email (different case) rejected');
select is((select count(*)::int from public.teams where name = 'Other'), 0, 'no partial team saved');
select throws_ok($$ select public.register_team('  block PARTY ', 'ai-ml',
  '[{"name":"C","email":"c@x.com","is_leader":true},{"name":"D","email":"d@x.com"}]', '2026-11') $$,
  '23505', null, 'duplicate team name (case/space-insensitive) rejected');
select throws_ok($$ select public.register_team('Twins', 'ai-ml',
  '[{"name":"E","email":"e@x.com","is_leader":true},{"name":"E2","email":"e@x.com"}]', '2026-11') $$,
  '23505', null, 'repeated email inside one team rejected');

-- 3 rules
select throws_ok($$ select public.register_team('NoLead', 'ai-ml',
  '[{"name":"F","email":"f@x.com"},{"name":"G","email":"g@x.com"}]', '2026-11') $$,
  'P0001', 'ONE_LEADER', 'no leader rejected');
select throws_ok($$ select public.register_team('Solo', 'ai-ml',
  '[{"name":"H","email":"h@x.com","is_leader":true}]', '2026-11') $$,
  'P0001', 'TEAM_SIZE', 'below min size rejected');
select throws_ok($$ select public.register_team('BadTrack', 'nope',
  '[{"name":"I","email":"i@x.com","is_leader":true},{"name":"J","email":"j@x.com"}]', '2026-11') $$,
  'P0001', 'INVALID_TRACK', 'unknown track rejected');
select throws_ok($$ select public.register_team('OldCoc', 'ai-ml',
  '[{"name":"K","email":"k@x.com","is_leader":true},{"name":"L","email":"l@x.com"}]', 'old') $$,
  'P0001', 'STALE_COC', 'stale CoC version rejected');

-- 4 deadline
update public.event_settings set registration_closes_at = now() - interval '1 second',
  registration_opens_at = now() - interval '2 days';
select throws_ok($$ select public.register_team('Late', 'ai-ml',
  '[{"name":"M","email":"m@x.com","is_leader":true},{"name":"N","email":"n@x.com"}]', '2026-11') $$,
  'P0001', 'REGISTRATION_CLOSED', 'after deadline rejected');

-- 5 public roles locked out
set local role anon;
select throws_ok($$ select * from public.teams $$, '42501', null, 'anon cannot read teams');
select throws_ok($$ select public.register_team('X','ai-ml','[]','2026-11') $$, '42501', null,
                 'anon cannot call register_team');
reset role;

set local request.jwt.claims = '{"role":"authenticated","app_metadata":{"role":"user"}}';
set local role authenticated;
select is_empty($$ select * from public.team_members $$, 'non-admin sees no members');
reset role;

set local request.jwt.claims = '{"role":"authenticated","app_metadata":{"role":"admin"}}';
set local role authenticated;
select isnt_empty($$ select * from public.teams $$, 'admin can read teams');
reset role;

select * from finish();
rollback;
```

Team codes may skip numbers after failed attempts (the sequence isn't rolled back). That's harmless.

## Generated types

```bash
pnpm supabase gen types typescript --local > lib/supabase/types.ts
```

Add `pnpm db:types` and run it after every migration; CI fails if the committed file is stale (`git diff --exit-code`).

## Admin role assignment

```sql
-- after inviting the organizer via Dashboard → Authentication → Users → Invite
update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}') || '{"role":"admin"}'
where email = 'organizer@example.com';
```

The user must sign out and in again for the new claim to appear in their JWT.
