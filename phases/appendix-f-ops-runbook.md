# Appendix F: Environments, operations and runbook

## Environments ($0)

| Env | Hosting | Database | Turnstile | Email | Who uses it |
|---|---|---|---|---|---|
| Local | `pnpm dev` | `supabase start` (Docker) | Test keys | Resend test mode / log to console | Developers |
| Preview | Vercel Hobby preview per branch | Supabase **staging** project (free #2) | Test keys | Resend, only to team addresses | PR reviews, playtests |
| Production | Vercel Hobby, main branch | Supabase **prod** project (free #1) | Real keys, prod hostname only | Resend, verified domain | Public |

If Vercel Hobby's non-commercial terms become a problem (paid sponsorship deliverables on the site), move the same repo to **Cloudflare Workers (OpenNext adapter)** or **Netlify** free tiers; Supabase, Turnstile and Resend don't change.

## Secrets

| Secret | Where | Rotate when |
|---|---|---|
| `SUPABASE_SECRET_KEY` | Vercel (server), GitHub (backup job) | Anyone leaves the team; any leak suspicion |
| `TURNSTILE_SECRET_KEY` | Vercel | Leak |
| `RESEND_API_KEY` | Vercel | Leak |
| `RATE_LIMIT_SALT` | Vercel | After the event (old hashes become useless, fine) |
| `CRON_SECRET` | Vercel + GitHub | Leak |
| `BACKUP_PASSPHRASE` | GitHub only + organizer password manager | Never lose it |

Only organizers listed as admins get Supabase dashboard access. Use the dashboard's org members feature, not shared logins.

## Admins

| Name | Email | Role |
|---|---|---|
| _fill in_ | | Lead organizer |
| _fill in_ | | Registrations |

Give each the `admin` role (SQL in Appendix A). Remove the role after the event.

## Event-week runbook

| Situation | Action | Time to take effect |
|---|---|---|
| **Extend the deadline** | `update public.event_settings set registration_closes_at = '2026-12-22T23:59:00+05:30';` | ≤ 60 s (status cache) |
| **Close registration now** | `update public.event_settings set registration_closes_at = now();` | Immediate in DB; portal greys within 30 s |
| **Cap teams** | `update public.event_settings set max_teams = 150;` | Immediate |
| **Change team size** | Update `team_size_min/max` **and** redeploy if the client copy text mentions sizes (the form reads limits from `/api/status`) | ≤ 60 s |
| **Raise rate limit for an on-site registration desk** | `update public.event_settings set rl_ip_max = 200;` and revert afterwards | Immediate |
| **Someone didn't get the email** | Admin → team → Resend; check spam; check Resend dashboard logs | Minutes |
| **Daily email limit hit** | Nothing to do: unsent teams retry next day automatically; for urgent ones, admin "Resend" after midnight UTC or switch `EMAIL_PROVIDER=brevo` | Next day |
| **Team wants to change members** | Organizer edits rows in Supabase dashboard (SQL editor) or the team withdraws and re-registers; log the change | — |
| **Spam wave** | Check `registration_attempts`; lower `rl_ip_max`; switch Turnstile widget to "Managed" mode; mark junk teams `withdrawn` | Immediate |
| **3D build broken in production** | Vercel → Deployments → **Instant rollback** to the last good deployment (free on Hobby). Or set env `FORCE_2D=1` (makes `/` redirect to `/2d`) and redeploy | ~1 min |
| **Supabase project paused** | Dashboard → Restore project (takes a few minutes); check why keep-alive failed | Minutes |
| **Data incident** | Rotate `SUPABASE_SECRET_KEY`; review Supabase logs; inform affected participants as required by law | — |

## Privacy and data retention

- [ ] Collect only what you need: name, email, institution, team, track, consents.
- [ ] Privacy notice page (`/privacy`): what is collected, why, who sees it (organizers; sponsors **only** for teams that opted in via `sponsor_sharing`), how long, contact for deletion. For an Indian event, write it with the DPDP Act 2023 in mind (notice + consent + right to erasure).
- [ ] CSV exports live only on organizers' machines, never in the repo, Drive folders shared publicly, or chat groups.
- [ ] **After the event + 30 days**: export final certificates/winners list, then
  ```sql
  delete from public.teams;                     -- cascades to team_members
  delete from public.registration_attempts;
  ```
  Delete backup artifacts (they expire after 7 days anyway) and remove admin roles.
- [ ] Keep only aggregate stats (number of teams, institutions count) for the next edition's "past editions" cards.

## Post-event

- [ ] Switch the site to "archive mode" with an env flag: portal shows "Registration closed — see you next year", add a Winners section (`prizes.json` gets `winner` fields).
- [ ] Write a short retro: what broke, what visitors used most (Umami events), what to reuse next year.
- [ ] Keep the repo; delete the prod Supabase data per the retention rule above. Pause or delete the staging project.
