# Phase 0: Setup

**Goal:** a deployable skeleton every later phase plugs into: Next.js app on Vercel Hobby, an empty 3D canvas that loads after the page's text, the shared store, validated content files, a `?debug` overlay, CI, and both free Supabase projects linked.

**Ends with:** a Vercel preview URL that shows the SSR hero text, then a sky-colored canvas with a spinning test cube; `?debug` shows FPS and draw calls; CI is green.

**Estimate:** 2 days · **Owner:** everyone (pair on it, it sets conventions)

---

## 0.1 Create the app

- [ ] `pnpm create next-app@latest` → TypeScript, App Router, ESLint, Tailwind, `src/` **off**, import alias `@/*`.
- [ ] Turn on strict TypeScript: `"strict": true, "noUncheckedIndexedAccess": true`.
- [ ] Add Prettier + `prettier-plugin-tailwindcss`; `.editorconfig`; `.nvmrc` (Node LTS).
- [ ] Initialise git, push to GitHub (public repo = unlimited free Actions minutes; private = 2,000 min/month, also enough).
- [ ] **Do not** copy `ignoreBuildErrors` or `eslint.ignoreDuringBuilds` from any repo (AGENTCRAFT hides build errors this way).

### Install

```bash
# 3D
pnpm add three @react-three/fiber @react-three/drei @react-three/rapier ecctrl \
  @react-three/postprocessing postprocessing three-custom-shader-material
pnpm add -D @types/three

# state, forms, data
pnpm add zustand react-hook-form zod @hookform/resolvers \
  @supabase/supabase-js @supabase/ssr server-only

# registration extras
pnpm add @marsidev/react-turnstile resend @react-email/components

# world generation, sound, quality
pnpm add simplex-noise zzfx detect-gpu

# dev
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react \
  @testing-library/user-event @playwright/test @axe-core/playwright \
  supabase r3f-perf leva @gltf-transform/cli
```

- [ ] Pin **exact** versions (`save-exact=true` in `.npmrc`). Expect: React 19, R3F 9.x, drei 10.x, @react-three/rapier 2.x, @react-three/postprocessing 3.x, zod 4.x. three r163+ requires **WebGL2** (WebGL1 support was removed), which shapes the fallback check in 0.4.
- [ ] Add 8bitcn/ui via the shadcn CLI (`pnpm dlx shadcn@latest init`, then add 8bitcn components: button, dialog, card, input, tabs, toast). They are copied into `components/ui/8bit/`, so you own them.

### Compatibility spike (half a day, decides Phase 2's approach)

ecctrl must work with R3F v9 + rapier v2 + React 19. Before anything else:

- [ ] Put `<Physics><Ecctrl><mesh/></Ecctrl><RigidBody type="fixed">ground</RigidBody></Physics>` on a page.
- [ ] Verify: walks with WASD, jumps, `disableControl` works, `EcctrlJoystick` renders, point-to-move works.
- [ ] **If anything fails**, go with plan B in Phase 2: a ~250-line controller on Rapier's `KinematicCharacterController` (`world.createCharacterController`). Write the result in `docs/decisions.md`.

## 0.2 Fonts, base styles, metadata

- [ ] `app/layout.tsx`: `Press_Start_2P` from `next/font/google` (`weight: '400'`, `display: 'swap'`) as `--font-pixel`; Monocraft from `next/font/local` (download the OFL release into `public/fonts/`, keep its `OFL.txt`) as `--font-mono-pixel`. Use Press Start 2P only for headings and buttons (it's hard to read in long text); Monocraft or the system font for body text.
- [ ] Tailwind v4 theme tokens in `app/globals.css`: `--color-grass`, `--color-dirt`, `--color-stone`, `--color-gold`, `--color-emerald`, `--color-ink`, `--color-panel` (dark translucent), bevel shadow utilities `.bevel` (inset box-shadow trick from woan `Button.scss`, rewritten in CSS).
- [ ] `<html lang="en">`, viewport **without** `user-scalable=no` (DEEPCRAFT bug).
- [ ] Base `metadata` (title template, description, `metadataBase` from `NEXT_PUBLIC_SITE_URL`). The OG image comes in Phase 6.

## 0.3 Home page structure: text first, 3D second

`app/page.tsx` is a **server component** that renders real, indexable HTML first, then lazy-loads the canvas:

```tsx
// app/page.tsx
import { Hero } from '@/components/sections/Welcome';
import { ExperienceGate } from '@/components/world/ExperienceGate';

export default function Home() {
  return (
    <>
      <a href="/2d" className="skip-link">Skip to the 2D version</a>
      {/* SSR: visible until the 3D world is ready, then visually hidden but kept for screen readers/SEO */}
      <main id="ssr-content"><Hero /></main>
      <ExperienceGate />
    </>
  );
}
```

```tsx
// components/world/ExperienceGate.tsx
'use client';
import dynamic from 'next/dynamic';
const Experience = dynamic(() => import('./Experience'), { ssr: false });
export function ExperienceGate() {
  // decides 3D vs redirect to /2d (see 0.4), then renders <Experience/>
}
```

```tsx
// components/world/Experience.tsx
'use client';
<Canvas flat shadows dpr={[1, 2]} gl={{ antialias: false, powerPreference: 'high-performance' }}
        camera={{ fov: 55, near: 0.1, far: 400 }} style={{ touchAction: 'none' }}>
  {/* test cube for now */}
</Canvas>
<UIOverlay />   {/* React DOM layer above the canvas, separate tree, reads the store */}
```

- [ ] `touch-action: none` on the canvas element **only** (pinch zooms the camera, not the page). The 2D page keeps normal zoom.
- [ ] The canvas wrapper is `position: fixed; inset: 0`; the UI overlay is a sibling with `pointer-events: none` on the container and `pointer-events: auto` on its widgets.

## 0.4 3D-or-2D gate (stub now, finished in Phase 6)

```ts
// lib/capabilities.ts
export function supportsWebGL2(): boolean {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
}
export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

- [ ] No WebGL2 → `router.replace('/2d?reason=webgl')`.
- [ ] Reduced motion → go to `/2d?reason=motion` with a visible "Open the 3D island anyway" link that sets `localStorage.force3d = '1'`.
- [ ] Wrap every `localStorage` access in try/catch (private mode can throw).

## 0.5 The store (`lib/store.ts`)

Shape is fixed in [README → Shared contracts](README.md#shared-contracts-every-phase-uses-these-keep-them-stable). Implement it now with actions; Phase 3 adds tests.

```ts
import { create } from 'zustand';
import { persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware';

export const useGame = create<GameState & Actions>()(
  subscribeWithSelector(persist((set, get) => ({
    stage: 'loading', nearbyStation: null, openSection: null, playerTarget: null,
    typing: false, formDirty: false, portalTransition: false, pendingNav: null,
    visited: [], timeOfDay: 0.72, qualityTier: 'medium', soundOn: false,
    reducedMotion: false, tourSeen: false,

    enterZone: (id) => set({ nearbyStation: id }),
    // only clear if leaving the zone we're in (zones can touch)
    leaveZone: (id) => get().nearbyStation === id && set({ nearbyStation: null }),

    open: (id) => {
      const s = get();
      if (s.openSection === 'register' && s.formDirty && id !== 'register')
        return set({ pendingNav: { kind: 'travel', to: id } });
      set({ openSection: id, playerTarget: null,
            visited: s.visited.includes(id) ? s.visited : [...s.visited, id] });
    },
    close: () => {
      const s = get();
      if (s.openSection === 'register' && s.formDirty) return set({ pendingNav: { kind: 'close' } });
      set({ openSection: null, typing: false });
    },
    travelTo: (id) => {
      const s = get();
      if (s.openSection === 'register' && s.formDirty) return set({ pendingNav: { kind: 'travel', to: id } });
      set({ openSection: null, typing: false, playerTarget: id });   // close first, then walk
    },
    arrive: () => set({ playerTarget: null }),
    confirmNav: () => { /* clear formDirty, then perform pendingNav */ },
    cancelNav: () => set({ pendingNav: null }),
    setTyping: (typing) => set({ typing }),
    setFormDirty: (formDirty) => set({ formDirty }),
    // setStage, setTimeOfDay, setQualityTier, toggleSound, markTourSeen …
  }), {
    name: 'island-prefs',
    storage: createJSONStorage(() => safeLocalStorage),     // try/catch wrapper
    partialize: (s) => ({ soundOn: s.soundOn, tourSeen: s.tourSeen, visited: s.visited }),
  })),
);
```

Rules baked in here (from the doc's Player rules):
- Opening a station replaces the open panel (never two at once).
- The hotbar closes the panel **before** walking.
- A dirty registration form intercepts every navigation with "Leave registration?".
- 3D code reads the store inside `useFrame` with `useGame.getState()` (no re-render), and subscribes with `useGame.subscribe(selector, cb)` for events. **Never call `set` every frame** (woan's 60 re-renders/second bug).

## 0.6 Content files and schemas

- [ ] Create every file in [Appendix B](appendix-b-content-model.md) with placeholder data: `event.json`, `tracks.json`, `schedule.json`, `prizes.json`, `sponsors.json`, `team.json`, `faq.json`, `venue.json`, plus `stations.ts`.
- [ ] `content/schemas.ts` holds the zod schemas; `content/index.ts` imports each JSON and calls `.parse()` at module load. Because it runs during `next build`, **a typo fails the build**.
- [ ] Add a `pnpm check:content` script (runs the same parse in Node) for fast feedback.
- [ ] Cross-file checks: every `stations.ts` `section` exists, hotbar slots 1–9 are unique, every prize/track referenced exists, schedule times are inside event dates.

## 0.7 Debug overlay (`?debug`)

- [ ] `components/ui/DebugOverlay.tsx`, loaded with `dynamic()` only when `?debug` is present, so it costs nothing in production.
- [ ] Shows FPS, frame ms, `gl.info.render.calls`, triangles, textures, geometries, quality tier, player position, `nearbyStation`, `openSection`. Use `r3f-perf` or read `gl.info` yourself (Homecraft's `main.js` approach).
- [ ] Leva panel (also `?debug` only) for live tuning: seed, noise scale, sun angle, fog, bloom. Values you like get copied into constants.

## 0.8 Supabase projects (free tier)

- [ ] Create two free projects: **`island-prod`** and **`island-staging`** (the free tier allows two). Same region, closest to your participants (e.g. Mumbai `ap-south-1` for India).
- [ ] `pnpm supabase init`, `pnpm supabase login`, `pnpm supabase link --project-ref <staging>`.
- [ ] Local dev uses `pnpm supabase start` (Docker). Migrations live in `supabase/migrations/`; you write the schema in Phase 5 (Appendix A), but create the folder now.
- [ ] Auth settings in both projects: **disable public sign-ups** (only invited admins can log in), enable email magic link, set Site URL and redirect URLs (localhost, preview pattern, prod).
- [ ] Use the new API keys: **publishable key** (`sb_publishable_…`, browser-safe, used only for admin login) and **secret key** (`sb_secret_…`, server-only). If your project still shows legacy `anon`/`service_role` keys, they map 1:1.

## 0.9 Environment variables

`.env.example` (committed), `.env.local` (git-ignored):

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=      # admin login only
SUPABASE_SECRET_KEY=                       # server only, never NEXT_PUBLIC_
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA   # Cloudflare test key: always passes
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA  # test secret: always passes
RESEND_API_KEY=
EMAIL_FROM="Island Hackathon <register@example.com>"
RATE_LIMIT_SALT=                           # random 32+ chars, HMACs IPs/emails
CRON_SECRET=                               # bearer token for GitHub Actions cron calls
EMAIL_PROVIDER=resend                      # resend | brevo (fallback when the daily cap is hit)
FORCE_2D=0                                 # 1 = "/" redirects to /2d (emergency switch)
NEXT_PUBLIC_UMAMI_WEBSITE_ID=
```

- [ ] `lib/env.ts` validates env with zod at startup (separate server and client schemas), so a missing key fails loudly.
- [ ] `lib/supabase/admin.ts` starts with `import 'server-only'` so the secret key can never be bundled into client code.
- [ ] In Vercel: Production env → prod Supabase + real Turnstile keys; Preview env → staging Supabase + Turnstile test keys.

## 0.10 CI and deploy

- [ ] Import the repo into Vercel Hobby. Every push gets a preview URL.
- [ ] `.github/workflows/ci.yml` (full version in [Appendix E](appendix-e-testing-ci.md)): install → `tsc --noEmit` → `eslint` → `check:content` → `vitest run` → `next build`. Cache the pnpm store to save minutes.
- [ ] Branch protection on `main`: CI must pass.
- [ ] `THIRD_PARTY_NOTICES.md` created now (empty table); every MIT file you adapt later gets a row. See [Appendix D](appendix-d-licensing-ip.md).

## Acceptance

| Check | How |
|---|---|
| Text content visible before 3D loads | Throttle to Slow 3G in DevTools: hero text paints first |
| Canvas renders | Test cube visible on the preview URL |
| Invalid content fails the build | Change a date to `"tomorrow"` → `pnpm build` fails with a zod message |
| `?debug` works | Overlay shows draw calls and FPS |
| Secrets safe | `grep -r SUPABASE_SECRET .next/static` finds nothing |
| CI | Green on every push |
| ecctrl spike | Decision recorded |

## Risks

| Risk | Mitigation |
|---|---|
| ecctrl version mismatch with R3F v9 | Spike in 0.1; plan B controller |
| Tailwind/8bitcn version drift | Components are copied into the repo; pin versions |
| Free Supabase project pauses before launch | Keep-alive workflow added in Phase 7; for now just log in weekly |
