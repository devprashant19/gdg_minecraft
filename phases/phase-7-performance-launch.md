# Phase 7: Performance, testing and launch

**Goal:** fast on every device, proven under load, safe to launch on free tiers, and kept alive until the event.

**Ends with:** the site live on its production URL; full device matrix passed; registration endpoint survives several times the expected peak; 5–10 people who have never seen the site register without help.

**Estimate:** 3 days · **Owner:** everyone

**Borrow:** woan `useGLTFWithKTX2.jsx` + `public/basis/` (MIT, adapt); CUBED `shadowMap.autoUpdate = false` and `fallback.svg` (rebuild).

---

## 7.1 Asset budget (also protects Vercel Hobby bandwidth)

| Asset | Budget |
|---|---|
| Initial JS for `/` before the 3D chunk | ≤ 120 KB gzipped |
| 3D chunk (three + R3F + drei + rapier + post) | ≤ 900 KB gzipped (Rapier WASM is the biggest piece) |
| All models | ≤ 1.5 MB |
| LUT + fonts + logos + photos | ≤ 1.5 MB |
| **Total first visit, 3D** | **≤ 5 MB** |
| `/2d` total | ≤ 600 KB |

At 5 MB per visit, 100 GB of Hobby bandwidth ≈ 20,000 full 3D visits per month; repeat visits are cached. Check with `pnpm build` output, `@next/bundle-analyzer`, and the Network tab.

- [ ] **Models**: `gltf-transform optimize in.glb out.glb --compress meshopt --texture-compress ktx2` (Draco also fine). Load with drei `useGLTF` + KTX2Loader (woan's `useGLTFWithKTX2`), basis transcoder files in `public/basis/`.
- [ ] Merge the crew NPCs into one skinned mesh with instancing where possible, or share geometry/materials.
- [ ] Photos: pre-size to display size ×2, WebP, `next/image` with `unoptimized` (no Hobby optimisation quota used).
- [ ] Sponsor logos: SVG where possible.
- [ ] `Cache-Control: public, max-age=31536000, immutable` for hashed assets (Next does this) and for `public/models/*` via `headers()` in `next.config.ts` (rename files on change: `player.v2.glb`).
- [ ] Preload the island worker and the player model as soon as the gate decides on 3D.
- [ ] Tree-shake drei imports (named imports only); `optimizePackageImports` for drei and postprocessing in `next.config.ts`.

## 7.2 Rendering performance

- [ ] **Static shadows** (CUBED's trick, improved, **Added**): `gl.shadowMap.autoUpdate = false`; set `gl.shadowMap.needsUpdate = true` only when the sun moves (time-of-day change) or a shadow-casting object moves. The **player** doesn't cast into the shadow map on medium/low; it gets a cheap **blob shadow** (a dark radial-gradient quad under its feet). Island shadows are then drawn once instead of 60 times a second.
- [ ] Animated parts (chest lids, NPCs) don't cast shadows, or only on high.
- [ ] `frameloop="demand"` while a panel is open on phones (from Phase 3) and while the tab is hidden.
- [ ] Check `?debug` numbers on the hero view: draw calls < 100, triangles < 300k, textures < 20.
- [ ] Profile one frame with Spector.js or Chrome Performance: no per-frame allocations in `useFrame` (reuse vectors), no React re-renders while walking (React DevTools "highlight updates").
- [ ] Optional: greedy meshing if triangles exceed budget.
- [ ] Static `public/fallback.svg` (an illustration of the island) shown on the 2D page header and as the WebGL error image (CUBED idea).

## 7.3 Security hardening

- [ ] Security headers in `next.config.ts`: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geolocation off), `X-Frame-Options: DENY` (or CSP `frame-ancestors 'none'`).
- [ ] CSP: allow `challenges.cloudflare.com` (Turnstile script + frame), your Supabase URL (admin only), Umami's script domain, `'wasm-unsafe-eval'` (Rapier WASM), `blob:` for workers. Start in `Content-Security-Policy-Report-Only`, check the console on every page, then enforce.
- [ ] Secrets audit: `SUPABASE_SECRET_KEY`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `RATE_LIMIT_SALT`, `CRON_SECRET` exist only in Vercel env (server) and GitHub Actions secrets. Search the built client bundle for each value's prefix.
- [ ] Supabase: run the dashboard's **Security Advisor** and **Performance Advisor**; fix every warning (e.g. RLS enabled everywhere, functions have fixed `search_path`).
- [ ] Turnstile: production widget restricted to your production hostname.
- [ ] `npm audit` / Dependabot alerts on.

## 7.4 Keep the free tier alive and backed up

| Job (GitHub Actions, free) | Schedule | What |
|---|---|---|
| `keepalive.yml` | every 3 days | `curl -fsS $SITE/api/status` → queries Postgres so the free Supabase project never hits 7 days idle. Also pings staging. |
| `email-retry.yml` | daily | `POST $SITE/api/cron/email-retry` with `Authorization: Bearer $CRON_SECRET` |
| `backup.yml` | daily during registration | `supabase db dump --data-only -s public` → `gpg --symmetric` with a passphrase secret → upload as a workflow artifact (retention 7 days). **Encrypted** because it contains participant PII. Never committed. |

- [ ] Note: GitHub disables scheduled workflows in repos with no activity for 60 days; commit something (or re-enable) before the event.
- [ ] Restore drill once on staging: download artifact → decrypt → `psql < dump.sql` into a local Supabase.

## 7.5 Analytics (Umami Cloud free)

- [ ] Script with `data-website-id`, `defer`; respects Do Not Track; no cookies → no cookie banner needed.
- [ ] Events: `station_open` (`id`, `via`), `registered`, `fallback_2d` (`reason`), `tier` (final quality tier). Nothing personal.
- [ ] Registrations are counted authoritatively from Supabase (admin page), not analytics.

## 7.6 Test the full matrix

Run everything in [Appendix E](appendix-e-testing-ci.md). Manual device list:

| Device | Browser | Expect |
|---|---|---|
| Windows desktop, dGPU | Chrome, Firefox, Edge | High, 60 fps |
| Mac laptop (Apple silicon) | Safari, Chrome | High/medium, 60 fps |
| Windows laptop, integrated GPU | Chrome | Medium, 60 fps |
| iPhone (2–3 years old) | Safari | Low, ≥ 30 fps, joystick works, form keyboard doesn't break layout |
| Mid-range Android (e.g. 6 GB RAM) | Chrome | Low, ≥ 30 fps |
| Low-end Android | Chrome | Lands on low or offers 2D; never crashes |
| Any | Screen reader on `/2d` | Complete |

Check on each: load time on 4G throttling, first input delay, landscape and portrait, notch safe areas, the Turnstile widget appearance, email rendering (Gmail web + mobile, Outlook).

## 7.7 Load test the registration endpoint (k6, run locally, free)

- [ ] Target **staging** only (staging Supabase + Turnstile **test** keys), never production.
- [ ] Scenario `tests/load/register.js`: ramp to **5× expected peak** (e.g. if you expect 300 teams in the last hour, test ~25 req/s for 2 minutes), unique emails per VU, plus 10% intentional duplicates and 5% invalid payloads.
- [ ] Rate limits: since all k6 traffic comes from one IP, temporarily raise `rl_ip_max` on staging for the test, then run a separate small test that proves the 429 path.
- [ ] Pass: p95 < 800 ms, 0 5xx, every duplicate gets a 409, row count = number of 201s, no orphaned members (`select count(*) from teams t where not exists (select 1 from team_members m where m.team_id = t.id)` = 0).
- [ ] Watch the Supabase dashboard (free tier connection limits): the API uses Supabase's HTTP API (PostgREST + Supavisor), so serverless functions don't exhaust Postgres connections.
- [ ] Also confirm the deadline: set `registration_closes_at` to 1 minute ahead on staging and watch requests flip to 403 exactly on time; the portal turns grey within the 30 s cache window.

## 7.8 Launch checklist

- [ ] Production env vars set in Vercel (prod Supabase, real Turnstile keys, Resend key, salt, cron secret, Umami ID, site URL).
- [ ] Prod migrations applied (`supabase db push --linked` against prod); `event_settings` and `tracks` hold real values; `select registration_status()` looks right.
- [ ] Admin accounts invited and given the role; each admin logged in once.
- [ ] Resend domain verified; send a test registration to a Gmail and an Outlook address; check spam folder.
- [ ] Turnstile hostname = production domain.
- [ ] Keep-alive, email-retry and backup workflows enabled and green once manually (`workflow_dispatch`).
- [ ] Delete all test teams from production.
- [ ] Privacy notice and code of conduct pages live and linked from the form.
- [ ] `THIRD_PARTY_NOTICES.md` complete; IP checklist in Appendix D signed off.
- [ ] OG image previews correctly (paste the URL in WhatsApp, LinkedIn, X, Discord).
- [ ] **Rehearsal**: 5–10 people who've never seen the site register a team on their own phones, unaided. Fix every point of confusion.
- [ ] Announce.

## 7.9 After launch

See [Appendix F](appendix-f-ops-runbook.md) for the event-week runbook: extending or closing registration early, resending emails, handling a broken 3D build (point `/` to the 2D page with an env flag), and deleting data after the event.

## Acceptance (project "Done means")

- [ ] A team can register from the portal and appears in the database with a team code.
- [ ] Every section is reachable by walking, by the hotbar and on the 2D page.
- [ ] 60 fps on desktop at high quality, 30 fps on a phone at low.
- [ ] Every row of the testing matrix passes.
- [ ] No Mojang textures, sounds, music, fonts or models anywhere in the build.
- [ ] Running cost: $0/month.
