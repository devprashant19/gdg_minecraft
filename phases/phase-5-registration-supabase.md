# Phase 5: Registration through the portal (Supabase)

**Goal:** a team walks into the portal, it swirls and hums, and a three-step form opens: **team → members → review & consent**. On success: an advancement toast with the team code, a confirmation email to every member, and a row in Supabase. Late, duplicate, bot and spam registrations are all rejected **by the server and the database**, with clear messages, and never leave partial data behind.

**Ends with:** register a real test team from a phone, receive the email, find the team in the admin page and its CSV export.

**Estimate:** 4 days · **Owner:** Dev B. Can start right after Phase 0 (it only needs the panel shell from Phase 3, and works on the 2D page first).

**Borrow:** AGENTCRAFT `001_initial_schema.sql`, `api/submissions/route.ts` (rebuild: schema with RLS, server-side deadline, JWT admin check); Homecraft `backend/mailbox` (MIT: Turnstile + rate-limit ideas); DEEPCRAFT validation UX (rebuild: inline errors, focus first error, success state).

**Free-tier notes:** Supabase Free (no branching → separate staging project), Resend Free (~100 emails/day → one email per team + daily retry job), Turnstile free, Vercel Hobby (no WAF rules → rate limit in Postgres).

---

## 5.1 Request flow

```
Browser (RegisterForm)                     Next.js route (Vercel)                    Supabase Postgres
  zod validate per step                       
  Turnstile token (last step)                 
  POST /api/register  ───────────────▶  1. size + content-type guard
                                         2. zod parse (same schema)
                                         3. quick deadline check (cached status)
                                         4. rpc note_registration_attempt ─────▶ insert attempt, count window
                                            → 429 if over limit
                                         5. verify Turnstile (siteverify)
                                         6. rpc register_team ─────────────────▶ deadline, size, leader, capacity,
                                                                                    unique name/emails, insert team +
                                                                                    members in ONE transaction → code
                                         7. map DB errors → 400/403/409
                                         8. after(): send email, mark sent
  ◀──────── 201 { code } ─────────────
  toast + sound + success screen
```

## 5.2 Database (full SQL in [Appendix A](appendix-a-supabase-schema.md))

Improvements over the doc's starting schema, all **Added**:

| Table / function | Purpose |
|---|---|
| `event_settings` (single row) | Opens/closes timestamps, team size min/max, `max_teams`, code prefix, CoC version. **The deadline lives in the DB**, so extending it is one `update`, no redeploy |
| `tracks` | Valid track slugs; `teams.track` is a foreign key, so a forged track is rejected by the DB |
| `teams` | `code`, `name` (unique **case-insensitive** via `lower(btrim(name))` index), `track`, `coc_version`, `consent_at`, `confirmation_sent_at`, `status` |
| `team_members` | `email` unique globally, `check (email = lower(email))`; **partial unique index: exactly one leader per team** |
| `registration_attempts` | Hashed IP + hashed email + time, for rate limiting; purged daily by **pg_cron** (free tier has it) |
| `register_team(...)` | `security definer`, `search_path = ''`: checks window, size, leader count, CoC version, capacity (advisory lock), inserts team + members atomically, returns `CRAFT-0042` |
| `note_registration_attempt(...)` | Logs the attempt and returns whether the caller is under the limit |
| `registration_status()` | Open/closed, closes-at, team count, server `now()` for the countdown |
| RLS | Enabled on every table; **no anon/authenticated policies** except admin `select`/`update` via a JWT `app_metadata.role = 'admin'` claim (AGENTCRAFT's pattern) |
| Grants | `execute` on the functions revoked from `public, anon, authenticated`, granted to `service_role` only |

Workflow:
- [ ] Write migrations in `supabase/migrations/` (Appendix A), run locally with `pnpm supabase start` + `supabase db reset`.
- [ ] pgTAP tests in `supabase/tests/` (Appendix A) run with `pnpm supabase test db`, locally and in CI.
- [ ] `pnpm supabase gen types typescript --local > lib/supabase/types.ts` → typed `rpc()` calls.
- [ ] Deploy to staging with `supabase db push --linked`, then to prod the same way (never edit prod tables in the dashboard; everything is a migration).
- [ ] Seed `tracks` and `event_settings` from `supabase/seed.sql` (dev) and a one-off migration for prod values.

## 5.3 One schema, client and server (`lib/schema.ts`)

```ts
import { z } from 'zod';

export const memberSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email').max(254),
  institution: z.string().trim().max(120).optional().or(z.literal('')),
  isLeader: z.boolean(),
});

export const makeRegistrationSchema = (s: { min: number; max: number; tracks: string[] }) =>
  z.object({
    team: z.object({
      name: z.string().trim().min(2, 'At least 2 characters').max(40)
        .regex(/^[\p{L}\p{N} _.\-']+$/u, 'Letters, numbers, spaces and - _ . \' only'),
      track: z.enum(s.tracks as [string, ...string[]], { message: 'Pick a track' }),
    }),
    members: z.array(memberSchema).min(s.min).max(s.max)
      .refine((m) => m.filter((x) => x.isLeader).length === 1, 'Choose exactly one team leader')
      .refine((m) => new Set(m.map((x) => x.email)).size === m.length, 'Each member needs a different email'),
    consent: z.object({
      codeOfConduct: z.literal(true, { message: 'Required' }),
      privacy: z.literal(true, { message: 'Required' }),
      sponsorSharing: z.boolean().default(false),   // optional opt-in
      cocVersion: z.string(),
    }),
    turnstileToken: z.string().min(1, 'Please complete the check'),
    website: z.string().max(0).optional(),           // honeypot field, must stay empty
  });
```

Team size and tracks come from `content/` at build time **and** are enforced again by the DB function. If they ever disagree, the DB wins and the user sees a clear message.

## 5.4 The form (`components/ui/RegisterForm.tsx`)

- [ ] react-hook-form with `zodResolver`, `mode: 'onTouched'`; `useFieldArray` for members ("Add member" up to max, remove down to min; leader is a radio group).
- [ ] **Step 1 Team**: team name, track (cards, not a dropdown). **Step 2 Members**: one card per member. **Step 3 Review & consent**: read-only summary, consent checkboxes linking CoC and privacy notice, Turnstile widget, Submit.
- [ ] "Next" validates only that step: `await trigger(stepFields[step])`. On failure, focus the first invalid field (`setFocus`) and show a summary at the top with links to each error (DEEPCRAFT's pattern, made accessible).
- [ ] Inline errors use `aria-invalid` + `aria-describedby`; step indicator is an `<ol>` with `aria-current="step"`.
- [ ] **Draft autosave** (**Added**): debounce-save form values (minus token) to `sessionStorage`; restore when the panel reopens. Combined with the store's "Leave registration?" guard, fast-travelling can never lose typed details.
- [ ] `formState.isDirty` → `setFormDirty()` in the store. Clear on success.
- [ ] Turnstile (`@marsidev/react-turnstile`), `appearance: 'interaction-only'` so most people never see a challenge; `onExpire` resets the token; reset after every failed submit (tokens are single-use).
- [ ] Hidden honeypot input `website` (off-screen, `tabIndex={-1}`, `autoComplete="off"`).
- [ ] Submit button disabled while pending; shows a pixel spinner; double-submit impossible.
- [ ] Inputs: `inputMode="email"`, `autoComplete="name" | "email" | "organization"`, `enterKeyHint`.
- [ ] Error from server: field errors map back onto fields with `setError`; duplicate email highlights the exact member card; generic errors in a banner with a "Try again" button.
- [ ] **Closed state**: if `/api/status` says closed (or not yet open), the panel shows "Registration closed on …" / "Opens on …" instead of the form, and the portal is grey.

## 5.5 Portal walk-in

- [ ] Portal sensor (Phase 3 zone) with an inner "walk-in" sensor. Walking into the inner sensor (or pressing E / hotbar 9) triggers:
  1. `portalTransition = true` (controls frozen), portal hum rises (Phase 6 sound), the voxel vortex (Homecraft `gate.js` idea) spins up, a short white-purple flash.
  2. After ~900 ms: `open('register')`, `portalTransition = false`.
- [ ] Reduced motion: no vortex/flash; panel opens immediately.
- [ ] If registration is closed: no transition; the panel opens with the closed message.

## 5.6 API route (`app/api/register/route.ts`)

```ts
import { after } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // 1. guards
  if (!req.headers.get('content-type')?.includes('application/json')) return json(415, …);
  const raw = await req.text(); if (raw.length > 16_000) return json(413, …);

  // 2. same schema as the client (settings cached 60 s from registration_status())
  const settings = await getSettingsCached();
  const parsed = makeRegistrationSchema(settings).safeParse(JSON.parse(raw));
  if (!parsed.success) return json(400, { error: 'VALIDATION', fields: z.flattenError(parsed.error).fieldErrors });
  if (parsed.data.website) return json(201, { code: 'CRAFT-0000' });   // honeypot: pretend success

  // 3. fast deadline check (DB re-checks authoritatively)
  if (!settings.open) return json(403, { error: 'REGISTRATION_CLOSED' });

  // 4. rate limit (Postgres; Vercel Hobby has no WAF rules)
  const ip = clientIp(req);  // first x-forwarded-for entry (Vercel sets it)
  const leader = parsed.data.members.find((m) => m.isLeader)!;
  const allowed = await admin.rpc('note_registration_attempt',
    { p_ip_hash: hmac(ip), p_email_hash: hmac(leader.email) });
  if (!allowed.data) return json(429, { error: 'RATE_LIMITED' }, { 'Retry-After': '600' });

  // 5. Turnstile
  const ok = await verifyTurnstile(parsed.data.turnstileToken, ip);   // POST siteverify, 5 s timeout
  if (!ok) return json(403, { error: 'BOT_CHECK_FAILED' });

  // 6. register atomically
  const { data: code, error } = await admin.rpc('register_team', {
    p_name: parsed.data.team.name, p_track: parsed.data.team.track,
    p_members: parsed.data.members.map(toDbMember), p_coc_version: parsed.data.consent.cocVersion,
    p_sponsor_sharing: parsed.data.consent.sponsorSharing,
  });
  if (error) return mapDbError(error);   // see 5.7

  // 7. email after the response (Hobby supports after())
  after(() => sendConfirmation(code));
  umamiServerEvent?.('registered');      // optional
  return json(201, { code });
}
```

- [ ] `lib/supabase/admin.ts`: `import 'server-only'`; `createClient(url, SUPABASE_SECRET_KEY, { auth: { persistSession: false } })`.
- [ ] `hmac(value)` = HMAC-SHA256 with `RATE_LIMIT_SALT` → raw IPs and emails are never stored in the attempts table.
- [ ] Log **no PII**: log `code`, error codes and timings only.
- [ ] Return the same generic 500 message for unexpected errors; details go to Vercel logs.

## 5.7 Error mapping

| DB / check result | HTTP | User message |
|---|---|---|
| zod failure | 400 | Field-level messages |
| `REGISTRATION_CLOSED` / `REGISTRATION_NOT_OPEN` | 403 | "Registration closed on 20 Dec, 23:59 IST" / "Opens on …" |
| `EVENT_FULL` | 403 | "We've reached the team limit" (+ waitlist link if you add one) |
| `TEAM_SIZE`, `ONE_LEADER`, `INVALID_MEMBERS` | 400 | Matching field message |
| `STALE_COC` | 409 | "The code of conduct was updated; please review and accept again" |
| `23505` on `teams_name_lower_key` | 409 | "That team name is taken" → field `team.name` |
| `23505` on `team_members_email_key` | 409 | "*a@b.com* is already registered in another team" → that member's email field (email parsed from the error detail) |
| `23503` on track FK | 400 | "Pick a track" |
| Rate limit | 429 | "Too many attempts. Try again in 10 minutes." |
| Turnstile fail | 403 | "Bot check failed. Please try again." (widget reset) |

Duplicate checks happen **inside the DB function via unique constraints**, never by a lookup first, so two simultaneous sign-ups with the same email can't both succeed.

### Rate-limit numbers (careful with college Wi-Fi)

Whole classrooms often share one public IP. The limits are therefore generous on IP and tight on email:

- IP: **30 attempts / 10 min** (Turnstile is the real bot defence).
- Leader email: **5 attempts / hour**.
- Tune in `event_settings` columns (`rl_ip_max`, `rl_email_max`) without redeploying.

## 5.8 Confirmation email (Resend free tier)

- [ ] `emails/ConfirmationEmail.tsx` (React Email): event name, team code (large, monospace), team name, track, members, dates, venue, next steps, CoC link, "Add to calendar" `.ics` link, contact address. Plain-text version too.
- [ ] `sendConfirmation(code)`: loads the team + members via the admin client, sends **one email to all members** (`to: [all]`) to stay within ~100/day, with `idempotencyKey: \`team-${code}\`` so retries never duplicate, then sets `teams.confirmation_sent_at = now()`.
- [ ] Failure → leave `confirmation_sent_at` null and log. A **daily GitHub Actions job** (`.github/workflows/email-retry.yml`, free) calls `POST /api/cron/email-retry` with a bearer secret, which resends to up to 80 teams with null `confirmation_sent_at`. Admin page also has a "Resend" button.
- [ ] Verify your sending domain in Resend (SPF/DKIM DNS records). Without a domain you can only send to your own address, so do this early. If the event has no domain, ask the GDG chapter for a subdomain, or use Brevo free with a verified single sender.

## 5.9 Status endpoint (`app/api/status/route.ts`)

- [ ] Calls `registration_status()` via the admin client; returns `{ open, opensAt, closesAt, teams, maxTeams, serverNow }`.
- [ ] `Cache-Control: public, s-maxage=30, stale-while-revalidate=60` → the Vercel edge cache absorbs traffic; Supabase sees ~2 queries/minute regardless of visitors.
- [ ] Used by: Welcome stats, countdown offset, portal grey state, the form's closed state, and the keep-alive cron (Phase 7).

## 5.10 Success moment

- [ ] Panel switches to a success screen: big team code with copy button, "Check your email", add-to-calendar, "Share" (Web Share API with fallback).
- [ ] **Advancement toast** (Phase 6 component): "Advancement made! *Team Registered* — CRAFT-0042".
- [ ] Level-up sound, portal burst particles, confetti of tiny blocks (reduced motion: no particles).
- [ ] Store `registeredCode` in localStorage so a returning visitor sees "You're registered as CRAFT-0042" at the portal (**Added**).

## 5.11 Admin (free: Supabase Auth + RLS, no extra service)

- [ ] `/admin/login`: email magic link via `@supabase/ssr` (publishable key). Sign-ups are disabled; admins are created by invite in the Supabase dashboard, then given the role:
  ```sql
  update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'
  where email = 'organizer@example.com';
  ```
- [ ] `/admin` (server component): checks session + role claim, else redirects. Reads with the **user's** session, so RLS admin policies apply (no secret key in admin pages).
- [ ] Dashboard: totals (teams, participants, by track, by institution), a searchable/filterable table, team detail, actions: **Resend email**, **Mark withdrawn** (status update allowed by admin RLS policy).
- [ ] `/admin/export` route: same auth check, streams CSV (`teams` joined with `team_members`). **Escape CSV formula injection**: prefix cells that start with `= + - @ \t \r` with `'`. Filename `registrations-YYYY-MM-DD.csv`.
- [ ] `robots: noindex` on `/admin`. Never commit exports; add `*.csv` to `.gitignore`.

## 5.12 Devfolio variant

If the organizers decide registration happens on Devfolio: the portal opens the Devfolio URL in a new tab (`rel="noopener"`), the panel shows "Register on Devfolio" with the button, and 5.2–5.11 are skipped. Keep `/api/status` only for the countdown and closed state (driven by `event.json` dates).

## Tests

**pgTAP** (Appendix A): valid team → `CRAFT-0001`; duplicate email (different case) rejected with nothing saved; duplicate team name (different case/spaces) rejected; repeated email within one team rejected; 0 or 2 leaders rejected; size limits; after deadline rejected; capacity; `anon` and `authenticated` (non-admin) can't select either table or execute the functions; admin JWT can select.

**API tests** (Vitest against `supabase start` + `next dev`, or route handler invoked directly), `tests/api/register.test.ts`:
- [ ] valid team → 201 + code; missing fields → 400 with field errors; after deadline → 403; duplicate email → 409 on the right member; **two simultaneous requests with the same email** (`Promise.all`) → exactly one 201, one 409; failed Turnstile (use Cloudflare's always-fail test secret `2x0000000000000000000000000000000AA`) → 403; rate limit hit → 429; honeypot filled → 201 fake + no row.

**E2E** (Playwright, staging, Turnstile test keys): fill all three steps with keyboard only; error focus; draft survives closing and reopening the panel; "Leave registration?" appears on hotbar travel with a dirty form.

**Manual**: register a real test team from a phone on the preview URL; receive the email; see it in `/admin`; export the CSV; mark withdrawn; delete test data afterwards.

## Acceptance

- [ ] Every bad case returns a clear message and leaves **no** data behind.
- [ ] The public (anon) key can't read tables or call functions (pgTAP proves it).
- [ ] Email arrives within a minute; retry job proven by temporarily breaking the API key.
- [ ] Extending the deadline is one SQL `update` and takes effect within 60 s.
