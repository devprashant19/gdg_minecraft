-- ─── 0. EXTENSIONS ────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 1. EVENT SETTINGS (Singleton) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.event_settings (
  id                     BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id),
  registration_opens_at  TIMESTAMPTZ NOT NULL,
  registration_closes_at TIMESTAMPTZ NOT NULL,
  team_size_min          INT NOT NULL DEFAULT 2 CHECK (team_size_min >= 1),
  team_size_max          INT NOT NULL DEFAULT 4,
  max_teams              INT CHECK (max_teams IS NULL OR max_teams > 0),
  team_code_prefix       TEXT NOT NULL DEFAULT 'CRAFT' CHECK (team_code_prefix ~ '^[A-Z]{2,8}$'),
  coc_version            TEXT NOT NULL DEFAULT '2026-11',
  rl_ip_max              INT NOT NULL DEFAULT 30,
  rl_email_max           INT NOT NULL DEFAULT 5,
  CHECK (team_size_max >= team_size_min),
  CHECK (registration_closes_at > registration_opens_at)
);

-- ─── 2. HACKATHON TRACKS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tracks (
  slug      TEXT PRIMARY KEY CHECK (slug ~ '^[a-z0-9-]{2,40}$'),
  title     TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ─── 3. TEAMS & MEMBERS ────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS public.team_code_seq;

CREATE TABLE IF NOT EXISTS public.teams (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                  TEXT NOT NULL UNIQUE,
  name                  TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 40),
  track                 TEXT NOT NULL REFERENCES public.tracks(slug),
  coc_version           TEXT NOT NULL,
  sponsor_sharing       BOOLEAN NOT NULL DEFAULT FALSE,
  consent_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmation_sent_at  TIMESTAMPTZ,
  status                TEXT NOT NULL DEFAULT 'registered'
                          CHECK (status IN ('registered', 'waitlisted', 'withdrawn')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS teams_name_lower_key ON public.teams (lower(btrim(name)));
CREATE INDEX IF NOT EXISTS teams_track_idx ON public.teams (track);

CREATE TABLE IF NOT EXISTS public.team_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name        TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 80),
  email       TEXT NOT NULL CHECK (email = lower(email) AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
                                   AND char_length(email) <= 254),
  institution TEXT CHECK (institution IS NULL OR char_length(institution) <= 120),
  is_leader   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS team_members_email_key  ON public.team_members (email);
CREATE UNIQUE INDEX IF NOT EXISTS team_members_one_leader ON public.team_members (team_id) WHERE is_leader;
CREATE INDEX IF NOT EXISTS team_members_team_idx   ON public.team_members (team_id);

-- ─── 4. RATE LIMIT LOG (Hashed) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.registration_attempts (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ip_hash    TEXT NOT NULL,
  email_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS registration_attempts_ip_idx    ON public.registration_attempts (ip_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS registration_attempts_email_idx ON public.registration_attempts (email_hash, created_at DESC);

-- ─── 5. GAMIFICATION: ORES & EASTER EGGS (Tier 5 System Design) ────────────
CREATE TABLE IF NOT EXISTS public.game_progress (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_or_team_id    UUID REFERENCES public.teams(id) ON DELETE CASCADE UNIQUE,
  ores_broken        INT NOT NULL DEFAULT 0,
  easter_eggs_found  JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_mined_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS game_progress_ores_idx ON public.game_progress (ores_broken DESC);

-- ─── 6. DYNAMIC NOTICES & SPONSOR SHOWCASE (Tier 4 & 5) ────────────────────
CREATE TABLE IF NOT EXISTS public.notices (
  id         SERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  priority   INT NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sponsors_dynamic (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  tier       TEXT NOT NULL CHECK (tier IN ('title', 'gold', 'silver', 'bronze', 'partner')),
  logo_url   TEXT NOT NULL,
  site_url   TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 7. INITIAL SEED DATA ──────────────────────────────────────────────────
INSERT INTO public.tracks (slug, title) VALUES
  ('web3-ai', 'Web3 & Artificial Intelligence'),
  ('cloud-devops', 'Cloud Architecture & DevOps'),
  ('fintech', 'Open Financial Technologies'),
  ('open-innovation', 'Open Innovation & Sustainability')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.event_settings (
  id,
  registration_opens_at,
  registration_closes_at,
  team_size_min,
  team_size_max,
  max_teams,
  team_code_prefix,
  coc_version
) VALUES (
  TRUE,
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '60 days',
  2,
  4,
  200,
  'NITH',
  '2026-11'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.notices (title, content, priority) VALUES
  ('Welcome to NITH Hackathon 2026', 'Registrations are officially open! Explore the island and step through the Nether Portal to register your team.', 10)
ON CONFLICT DO NOTHING;
