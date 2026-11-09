insert into public.event_settings (registration_opens_at, registration_closes_at, team_size_min, team_size_max, max_teams)
values (now() - interval '1 day', now() + interval '30 days', 2, 4, 150)
on conflict (id) do nothing;

insert into public.tracks (slug, title) values
  ('ai-agents', 'Autonomous AI Agents'),
  ('developer-tooling', 'Developer Tooling & DX'),
  ('web3-infra', 'Next-Gen Web3 Infrastructure'),
  ('open-source', 'Open Source Innovation'),
  ('edge-compute', 'Edge Computing & IoT'),
  ('creative-media', 'Creative Tech & Generative Media'),
  ('cybersecurity', 'Zero Trust & Security'),
  ('climate-tech', 'Climate & Sustainable Tech')
on conflict (slug) do nothing;

