alter table public.event_settings        enable row level security;
alter table public.tracks                enable row level security;
alter table public.teams                 enable row level security;
alter table public.team_members          enable row level security;
alter table public.registration_attempts enable row level security;

-- Defence in depth: Revoke table privileges from anon/authenticated
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Admins (authenticated users whose app_metadata.role = 'admin') may read and set status
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

