# Phase 6: Polish, sound and accessibility

**Goal:** make it feel finished and make it work for everyone: a real loading screen, sound that never surprises anyone, advancement toasts, a complete 2D page chosen automatically when needed, full keyboard and screen-reader support, and a share image.

**Ends with:** a keyboard-only run through every section passes; the 2D page passes axe with no serious issues; sound starts off and the toggle is remembered.

**Estimate:** 3 days · **Owner:** Dev C (sound, toasts, loading, OG), Dev B (2D page, a11y)

**Borrow:** woan `LoadingScreen.jsx` (MIT, adapt); DEEPCRAFT `#standard-view` fallback + reduced-motion flags (rebuild); AGENTCRAFT `MinecraftAudioManager.tsx` / DEEPCRAFT `SFX` (idea: sounds without files, rebuild with ZzFX).

---

## 6.1 Loading screen (`components/ui/LoadingScreen.tsx`)

- [ ] **Real progress**: combine drei `useProgress` (models, LUT, fonts) with the island worker's progress (generation + meshing steps report 0–100%). Weighted bar; never fake (DEEPCRAFT's bar was fake).
- [ ] Pixel-art progress bar, rotating tips ("Press 1–9 to fast-travel", "Walk into the portal to register").
- [ ] When ready: **"Enter World"** button. Clicking it is the user gesture that unlocks Web Audio (`audioCtx.resume()`), starts the intro camera, and focuses the canvas.
- [ ] A "Use the 2D version" link is always visible on the loading screen.
- [ ] Error boundary around `<Experience>`: any WebGL context loss or crash shows "The 3D island hit a problem — open the 2D version" (and `webglcontextlost` listener does the same).
- [ ] The SSR hero text underneath stays readable while loading.

## 6.2 Sound (`lib/sound.ts`)

All sounds generated with **ZzFX** + Web Audio. Zero audio files, zero licensing.

| Event | Sound |
|---|---|
| Button / hotbar click | short square blip |
| Panel open / close | soft pop up / down |
| Chest open | creak + sparkle |
| Prompt appears | tiny tick |
| Footsteps | noise bursts, pitch varies by surface (grass/path/planks) from the block under the player (DEEPCRAFT idea) |
| Portal | low hum loop whose gain rises with proximity (`1 - dist/12`) |
| Registration success | level-up arpeggio |
| All stations visited | short fanfare |
| Clock tower | bell on the hour (event time) |

- [ ] **Off by default.** Toggle (speaker icon, top-right, also **M** key) persisted in the store (`soundOn`). The first toggle creates/resumes the `AudioContext`.
- [ ] One master `GainNode`; muting sets gain to 0. **Muting must not touch anything visual** (DEEPCRAFT bug: mute also dimmed the lights).
- [ ] Respect page visibility: suspend the context when the tab is hidden.
- [ ] No background music (avoids both annoyance at events and any licensing question). Optional: a generative ambient pad you compose in code, also off by default.

## 6.3 Advancement toasts (`components/ui/Toast.tsx`)

- [ ] Slide-in pixel card, top-right: icon + "Advancement made!" + title. Queue so multiple toasts don't overlap. Auto-dismiss 5 s; pause on hover/focus.
- [ ] `role="status"` live region so screen readers announce it.
- [ ] Triggers: **Registered** (with team code), **Explorer** (visited all 9 stations), **First steps** (first station opened). Optional fun: **Tourist** (finished the tour).
- [ ] Reduced motion: fade only.

## 6.4 The 2D page (`app/2d/page.tsx`)

The 2D page is a complete, standalone website, not a lesser copy (DEEPCRAFT's `#standard-view` pattern).

- [ ] **Server-rendered** (static, `export const revalidate = 60` for the stats), built from the **same** `components/sections/*` and `content/*` used by the panels. One content edit updates both.
- [ ] Layout: sticky header with section nav (anchors), then sections in AceHack's order: Welcome (hero + countdown + stats) → Tracks → Schedule → Prizes → Sponsors (+ benefits + become a sponsor) → Team → FAQ & Rules → Venue → Register (the same `RegisterForm`) → footer (CoC, privacy, contact, socials, "Open the 3D island").
- [ ] Pixel styling (bevels, Press Start 2P headings) but body text in a readable font at ≥ 16 px, line-height 1.6.
- [ ] Normal page zoom and scrolling (`touch-action` untouched).
- [ ] Lighthouse targets: Performance ≥ 90, Accessibility 100, Best Practices ≥ 95, SEO 100.

### When users land on it automatically

| Condition | Behaviour |
|---|---|
| No WebGL2 | Redirect to `/2d?reason=webgl` with a short notice |
| `prefers-reduced-motion: reduce` | Redirect to `/2d?reason=motion` with "Open the 3D island anyway" (remembers choice) |
| WebGL context lost / crash | Error boundary offers `/2d` |
| Save-Data header or very low memory (`navigator.deviceMemory < 2`) | Offer (don't force) the 2D page in a banner |
| Always | Header link "2D version" on the 3D page and "3D island" on the 2D page |

## 6.5 Keyboard and screen-reader pass

- [ ] **Skip link** "Skip to the 2D version" as the first focusable element on `/`.
- [ ] Canvas wrapper `tabIndex={0}` with `aria-label="3D island. Use the hotbar or press 1 to 9 to visit sections."`
- [ ] Every action reachable without a mouse: hotbar (`role="toolbar"`, arrow keys), E/Enter to open, Esc to close, Tab cycles inside panels (Radix focus trap), focus returns to the triggering element on close.
- [ ] **Help overlay** (`?` key and a "?" button): lists all controls for keyboard, mouse and touch.
- [ ] Visible focus rings everywhere (pixel-style 3 px outline, high contrast).
- [ ] Color contrast ≥ 4.5:1 for text on panels (dark translucent panel + light text); check gold-on-dark buttons.
- [ ] All icons have text labels or `aria-label`; decorative 3D nameplates `aria-hidden`.
- [ ] Forms: labels, `aria-describedby` for errors, error summary, `autocomplete` tokens.
- [ ] Respect `prefers-reduced-motion` everywhere listed (single `reducedMotion` flag in store): no loader animation, no intro swoop, no tour, no head bob, no torch flicker, no particles, slow portal, no leaf sway, teleport instead of auto-walk, fade-only toasts.
- [ ] Never `user-scalable=no` or `maximum-scale=1`.
- [ ] `lang` attribute; headings in order inside each panel (panel title = `h2`).

## 6.6 Metadata and share image

- [ ] `app/opengraph-image.png` (1200×630): a real golden-hour screenshot of the island from the hero view with the event name in Press Start 2P. Make it with `?e2e&cam=hero&time=0.72&tier=high` + a Playwright screenshot, then add text in any free editor. Static file → no runtime cost (avoid dynamic OG generation on Hobby).
- [ ] `app/icon.png` (pixel portal or grass block of **your own** design), `apple-icon.png`.
- [ ] Title, description, `openGraph`, `twitter` (summary_large_image), `alternates.canonical`, `robots` (index the home and 2D pages; noindex `/admin`).
- [ ] `app/sitemap.ts` and `app/robots.ts`.
- [ ] JSON-LD `Event` schema on the 2D page (name, dates, location, organizer, offers: free) for rich search results.

## 6.7 Small touches that make it feel great

- [ ] Settings menu (gear): quality (Auto/High/Medium/Low), time of day (Golden hour / Day / Night / Cycle), sound, show controls help, open 2D version.
- [ ] Mini "compass" or loop-progress indicator showing visited stations.
- [ ] Remember last position? **No**: always start at the dock (predictable; avoids spawning in odd spots after layout changes).
- [ ] Copy-to-clipboard feedback, empty states, error states styled consistently.
- [ ] 404 page: "This chunk didn't load" with buttons to the island and the 2D page.

## Tests

- [ ] **axe** (`@axe-core/playwright`) on `/2d` and on each open panel in 3D: zero serious/critical violations.
- [ ] **Playwright with WebGL disabled** (`--disable-gpu --disable-webgl` / `--use-angle=disabled` launch args) lands on `/2d?reason=webgl`.
- [ ] Playwright with `reducedMotion: 'reduce'` lands on `/2d?reason=motion`; "Open anyway" opens 3D without the tour.
- [ ] Vitest: sound is off initially; toggle persists across reload (mock storage); muting doesn't change any light intensity (store/scene isolation).
- [ ] Lighthouse CI on `/2d` (budgets in Appendix E).

**Manual**
- Keyboard-only: from loading screen to registering a team, never touching the mouse.
- Screen reader (NVDA on Windows, VoiceOver on iPhone) through the 2D page and one panel.
- Sound: starts off; turn on; reload; still on; hit M while typing in the form → nothing happens.

## Acceptance

- [ ] No serious accessibility issues; keyboard-only and screen-reader runs complete.
- [ ] The 2D page alone is a complete event website.
- [ ] Sound never plays until the user turns it on.
