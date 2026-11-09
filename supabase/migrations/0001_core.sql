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

