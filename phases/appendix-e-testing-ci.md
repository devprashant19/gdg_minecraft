# Appendix E: Testing and CI

Test at the end of **every** phase, not only before launch. A phase is done when its row passes. Automated tests run on every push (GitHub Actions, free); each Vercel preview deploy is checked by hand.

## Test matrix

| Phase | Automated | Manual playtest | Pass when |
|---|---|---|---|
| 0 Setup | Build fails on invalid content (zod); typecheck + lint in CI; secret-in-bundle grep | Page loads; `?debug` shows numbers | CI green on every push |
| 1 Island | Vitest: same seed → same island; pads flat; path steps ≤ ½ block; corridors clear; mesher drops hidden faces; AO corner case; spawn/stand points open | Fly the debug camera looking for holes, flicker, grey | < 60 draw calls; collision = visuals |
| 2 Player | Vitest: controls disabled for every blocking state; key handler ignores typing targets | Walk loop; 1-block jump yes, 2 no; sea → respawn; type in field → still; real-phone joystick; Appendix C rows 2–6, 11, 13 | Never stuck, never falls through |
| 3 Stations | Vitest store (zones, open/close, travel, dirty guard); content cross-checks; Playwright: keys 1–9 + hotbar open each section, Esc closes | Every station from every side; E, click, tap, Esc; hotbar all pairs; skip tour; reduced motion | Each section opens 3 ways; none opens on its own |
| 4 Shaders | Playwright fixed-camera screenshot vs baseline; Vitest time-of-day blending | Every preset; CPU throttle → tier steps down | Frame targets met |
| 5 Registration | pgTAP (Appendix A); API tests: valid, missing fields, after deadline, duplicate email, **concurrent same email**, Turnstile fail, rate limit, honeypot | Real team from a phone; email arrives; visible in admin + CSV | Every bad case: clear message, no data left behind |
| 6 Polish | axe on `/2d` and each panel; WebGL-off → `/2d`; reduced motion → `/2d`; sound off + persisted; Lighthouse CI on `/2d` | Keyboard-only full run; screen reader on `/2d` | No serious a11y issues |
| 7 Launch | k6 at 5× peak on staging; Lighthouse; security headers check | Device matrix (Phase 7); rehearsal with 5–10 newcomers | Everyone registers unaided |

## Tooling

| Tool | Use | Config |
|---|---|---|
| Vitest | Unit tests (island, mesher, store, schema, content, time of day) | `vitest.config.ts`, `environment: 'jsdom'` for UI, `node` for lib |
| Playwright | E2E, mobile emulation, screenshots, a11y | `playwright.config.ts`: projects `chromium` (PRs), `webkit` + `firefox` + `Pixel 7` + `iPhone 14` (main only) |
| @axe-core/playwright | Accessibility | Fail on `serious`/`critical` |
| pgTAP | DB tests | `supabase/tests/*.test.sql`, `pnpm supabase test db` |
| k6 | Load | `tests/load/register.js`, run locally against staging |
| Lighthouse CI | `/2d` budgets | `lighthouserc.json`: perf ≥ 0.9, a11y = 1, seo = 1 |

### E2E helpers

With `?e2e` the app exposes `window.__island = { teleport(id), setTime(t), setTier(t), freeze() }` and disables the intro/tour, so tests are fast and deterministic. The hook is stripped from production builds unless `NEXT_PUBLIC_E2E=1` is set (only on preview/staging).

### Screenshot determinism

`?e2e&seed=1&time=0.72&cam=hero&tier=medium` + `freeze()` (stops `uTime`, clouds, NPCs). Chromium with `--use-angle=swiftshader` for identical rendering across CI runs. Tolerance `maxDiffPixelRatio: 0.02`. Update baselines intentionally with `--update-snapshots` in a dedicated PR.

## GitHub Actions: `.github/workflows/ci.yml`

```yaml
name: CI
on: [push, pull_request]
concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }   # saves free minutes

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck && pnpm lint && pnpm check:content
      - run: pnpm test -- --run
      - run: pnpm build
        env: { NEXT_PUBLIC_SITE_URL: https://example.com }   # other vars: dummy values from .env.ci
      - name: No secrets in client bundle
        run: "! grep -rE 'sb_secret_|service_role' .next/static"

  db:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: supabase start -x studio,imgproxy,inbucket,edge-runtime,logflare,vector   # only what tests need
      - run: supabase test db
      - run: supabase gen types typescript --local > /tmp/types.ts && diff -q /tmp/types.ts lib/supabase/types.ts

  e2e:
    needs: [check]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm build && pnpm exec playwright test --project=chromium
        env: { NEXT_PUBLIC_E2E: '1' }
      - uses: actions/upload-artifact@v4
        if: failure()
        with: { name: playwright-report, path: playwright-report, retention-days: 3 }
```

On `main` only, add a matrix job for `webkit`, `firefox` and mobile projects. Registration E2E against staging runs on `workflow_dispatch` (it needs staging secrets and writes rows).

## Scheduled workflows (all free)

| File | Cron | Purpose |
|---|---|---|
| `keepalive.yml` | `0 6 */3 * *` | Ping `/api/status` on prod and staging so free Supabase projects never pause |
| `email-retry.yml` | `30 4 * * *` | Retry unsent confirmation emails |
| `backup.yml` | `0 21 * * *` (during registration) | Encrypted `supabase db dump`, artifact kept 7 days |

## Review checklist for every PR

- [ ] Phase row tests added/updated.
- [ ] No `set()` in `useFrame`; no allocations per frame.
- [ ] New interactive UI is keyboard-reachable and labelled.
- [ ] Respects `reducedMotion` and `qualityTier`.
- [ ] No new asset without an entry in Appendix D sources.
- [ ] No PII in logs, fixtures or screenshots.
