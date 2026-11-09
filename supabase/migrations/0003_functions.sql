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
    perform pg_advisory_xact_lock(hashtext('register_team_capacity'));
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

  return v_code;
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

-- ─── Revoke and grant execution rights ──────────────────────────────────
revoke execute on function public.register_team(text, text, jsonb, text, boolean) from public, anon, authenticated;
revoke execute on function public.note_registration_attempt(text, text)          from public, anon, authenticated;
revoke execute on function public.registration_status()                          from public, anon, authenticated;
grant  execute on function public.register_team(text, text, jsonb, text, boolean) to service_role;
grant  execute on function public.note_registration_attempt(text, text)          to service_role;
grant  execute on function public.registration_status()                          to service_role;

