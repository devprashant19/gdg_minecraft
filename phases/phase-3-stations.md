# Phase 3: Stations, panels and hotbar

**Goal:** turn the island into a website. Nine stations, each opened three ways (walk up + E, click/tap the object, hotbar 1–9), each showing a panel built from the same section components the 2D page uses. A guided tour on first visit.

**Ends with:** every section opens by E, by click/tap and by hotbar; no panel opens on its own; the tour visits every station and is skippable.

**Estimate:** 5 days · **Owner:** Dev A (3D side: stations, sensors, travel, tour), Dev B (section components, panel, hotbar UI). Dev B can build `components/sections/*` and the 2D page right after Phase 0 (milestone M1).

**Borrow:** DEEPCRAFT `REGIONS`, `renderPanel`, tour functions (rebuild); woan `modalStore.jsx`, `Modal.jsx`, `DetailT.jsx` hover (MIT, adapt); AGENTCRAFT `InteractiveObject.tsx` nameplate and `MinecraftHotbar.tsx` (rebuild); Homecraft `main.js` `nearestTarget`/`updatePrompt` (MIT, adapt).

---

## 3.1 One array drives everything (`content/stations.ts`)

DEEPCRAFT's best idea: a single list is the source for zones, hotbar, panels, the tour and the 2D page.

```ts
export const stations = [
  { id: 'welcome',  label: 'Welcome',  hotbarSlot: 1, icon: 'sign',
    prefab: 'signboard',  position: [0, 4, 22],  radius: 3.0, standPoint: [0, 4, 19.5],
    tourView: { cam: [4, 9, 28], look: [0, 5, 22], dwellMs: 3500 } },
  { id: 'tracks',   label: 'Tracks',   hotbarSlot: 2, icon: 'crafting', prefab: 'craftingTable', … },
  { id: 'schedule', label: 'Schedule', hotbarSlot: 3, icon: 'clock',    prefab: 'clockTower',    … },
  { id: 'prizes',   label: 'Prizes',   hotbarSlot: 4, icon: 'chest',    prefab: 'chestRow',      … },
  { id: 'sponsors', label: 'Sponsors', hotbarSlot: 5, icon: 'tv',       prefab: 'tvStand',       … },
  { id: 'team',     label: 'Team',     hotbarSlot: 6, icon: 'people',   prefab: 'crewCamp',      … },
  { id: 'faq',      label: 'FAQ & Rules', hotbarSlot: 7, icon: 'book',  prefab: 'bookshelf',     … },
  { id: 'venue',    label: 'Venue',    hotbarSlot: 8, icon: 'map',      prefab: 'mapTable',      … },
  { id: 'register', label: 'Register', hotbarSlot: 9, icon: 'portal',   prefab: 'portal',        … },
] as const satisfies readonly Station[];
```

Validated by zod (Appendix B). `standPoint` is where the player stops when travelling; a unit test checks it's open ground inside `radius`.

## 3.2 `<Station>` component

```tsx
function Station({ s }: { s: Station }) {
  return (
    <group position={s.position}>
      <StationModel prefab={s.prefab} />   {/* animated parts only; the voxels are in the island mesh */}
      <Nameplate label={s.label} />         {/* drei <Html> pixel label, distanceFactor, occlude */}
      <InteractZone id={s.id} radius={s.radius} />
      <ClickTarget id={s.id} />            {/* invisible box for hover/click */}
    </group>
  );
}
```

### Sensor zone (`InteractZone`)

```tsx
<RigidBody type="fixed" colliders={false}>
  <CylinderCollider sensor args={[2, radius]}
    onIntersectionEnter={({ other }) => isPlayer(other) && enterZone(id)}
    onIntersectionExit={({ other }) => isPlayer(other) && leaveZone(id)} />
</RigidBody>
// isPlayer: other.rigidBodyObject?.name === 'player'  — so a falling object can't open a panel
```

- [ ] Zones never overlap (unit test on `stations.ts`: centre distance > sum of radii).
- [ ] `leaveZone(id)` only clears if `nearbyStation === id`.

### Nameplate

- [ ] drei `<Html center distanceFactor={8} occlude>`: pixel font, dark translucent background, bevel. Fades in when within ~12 units, hidden beyond (cheap: toggle via a `useFrame` distance check writing to a ref, not state).
- [ ] `aria-hidden` (the 3D labels are decoration; the hotbar and 2D page are the accessible routes).

### Hover and click (woan `DetailT.jsx` idea)

- [ ] `onPointerOver` → set `document.body.style.cursor = 'pointer'` and raise the station's emissive glow; `onPointerOut` → reset.
- [ ] `onClick` → `open(id)`. Ignore clicks that were actually camera drags (pointer moved > 6 px between down and up).
- [ ] Pulse the glow while the player is inside the zone.

## 3.3 Prompt

- [ ] UI component reads `nearbyStation` and `openSection`. When near and nothing is open: "Press **E** to open *Prizes*" (desktop) or a big **Open Prizes** button (touch).
- [ ] An `aria-live="polite"` region announces the same text.
- [ ] **E** (and **Enter** when the canvas has focus) opens `nearbyStation` only. E does nothing outside a zone; the hotbar is the long-distance shortcut.

## 3.4 Panel

Adapt woan's modal store/modal (MIT) onto **8bitcn Dialog (Radix)**, which gives focus trap, `role="dialog"`, `aria-modal`, Esc handling and focus return for free (fixes DEEPCRAFT's missing focus trap).

- [ ] `Panel` is driven by `openSection`; content comes from a registry `sectionComponents[id]`.
- [ ] Keeps content mounted during the exit animation (woan's trick) so it doesn't blank while closing.
- [ ] Desktop: right-side sheet (~520 px) so the island stays visible on the left. Phone: full-screen sheet.
- [ ] Header: section title, pixel close button. Footer: "Previous / Next station" buttons (walk the loop order) (**Added**).
- [ ] Opening a panel: controls disabled (store), camera eases to the station's framing; closing returns control.
- [ ] Esc / backdrop click / close button → `close()` (goes through the "Leave registration?" guard).
- [ ] **Render cost while reading** (**Added**): when a panel is open on phones, switch the canvas to `frameloop="demand"` (one frame per invalidate) to save battery and keep the form responsive; restore `always` on close.
- [ ] Analytics: `umami.track('station_open', { id, via: 'walk' | 'click' | 'hotbar' })`.

## 3.5 Section components (shared with the 2D page)

Pure content components in `components/sections/`, no store access, no 3D imports. They take content as props. AceHack's section list maps onto them:

| Component | Content | Details |
|---|---|---|
| `Welcome` | event name, tagline, dates, venue, **live countdown**, stats (registrations from `/api/status`, prize pool, tracks, mentors), "Register" button | Countdown uses server-time offset from `/api/status` so wrong device clocks don't matter |
| `Tracks` | 8 tracks + open innovation, each: icon, title, one-liner, example problems, sponsor of the track | Grid of crafting-recipe cards |
| `Schedule` | two-day timeline from `schedule.json`, "now" marker, next-up highlight | Times shown in event timezone via `Intl.DateTimeFormat({ timeZone })`; add-to-calendar `.ics` link |
| `Prizes` | tiers (chest per tier), special prizes (best beginner, all-girls team, …), swag | Pixel chest icons drawn in code, not images |
| `Sponsors` | tiers, logos (linked), sponsor benefits block, "Become a sponsor" + deck PDF link | Logos from `public/sponsors/` |
| `Team` | organizers, judges, mentors with photos/links | `next/image unoptimized` with pre-sized WebP (no Hobby image quota used) |
| `Faq` | FAQ accordion, rules, code of conduct link | Radix Accordion, searchable list |
| `Venue` | venue address, embedded map **as a link + static image** (no third-party iframe cost), travel, contact email | |
| `Register` | `RegisterForm` from Phase 5 (placeholder until then) | |

## 3.6 Station-specific world behaviour

| Station | In the world |
|---|---|
| Welcome | Signboard with pixel-text event name (`pixel-text.ts`) |
| Tracks | Crafting table; small floating item icons above it when the player is near |
| Schedule | Clock tower; clock hands show the **event-time countdown** (hours/minutes to start); bell sound at the top of the hour (Phase 6) |
| Prizes | One chest per tier (wood/iron/gold/special: your own colors); lids open with a spring animation when the panel opens |
| Sponsors | TV with a **canvas-texture slideshow** of sponsor logos (tiny-world-builder idea, rebuilt): draw logos to a 512×288 `CanvasTexture` every 4 s, `needsUpdate = true` only on change |
| Team | 3–6 crew NPCs (Kenney characters with different skins) idling, turning to face the player when near (a `lookAt` lerp on the head bone) |
| FAQ | Bookshelf wall; a book slides out when open |
| Venue | Map table with a top-down mini-map texture of the island |
| Register | Portal frame + placeholder surface (shader in Phase 4, walk-in flow in Phase 5). After the deadline it turns grey (reads `/api/status`) |

## 3.7 Hotbar

- [ ] Bottom-centre bar, 9 bevelled slots with code-drawn pixel icons, number badges, tooltip on hover/focus, `visited` checkmarks, "you are here" highlight on `nearbyStation`.
- [ ] `role="toolbar"` with arrow-key navigation; each slot is a `<button aria-label="Go to Prizes (4)">`.
- [ ] Keys **1–9** and clicks call `travelTo(id)`: closes any open panel first (guard for dirty form), then sets `playerTarget`.
- [ ] Small screens: collapses to a single "Map" button that opens a slot grid.

### Travel (`components/world/Travel.tsx`)

The doc warns that point-to-move heads straight for its target. **Added:** instead of grid pathfinding, use the **loop path's waypoints** (generated in Phase 1):

1. Find the nearest waypoint to the player and to the target's `standPoint`.
2. Walk along the loop in whichever direction is shorter, calling `moveTo()` waypoint by waypoint.
3. On arrival within 0.8 units of `standPoint`: face the station, `arrive()`, then `open(id)`.
4. **Fallbacks:** if not arrived after **4 s** per leg or the stuck detector fires, fade to black for 200 ms and **teleport** to `standPoint`. With reduced motion, always teleport (no auto-walk).
5. Any movement key cancels travel.

## 3.8 Guided tour (DEEPCRAFT idea, rebuilt)

- [ ] Starts automatically on the first visit after the intro (`tourSeen === false`); can be replayed with **T** or a "Tour" button.
- [ ] `stage = 'tour'`: player hidden/frozen, a `TourCamera` flies a `CatmullRomCurve3` through each station's `tourView`, pausing `dwellMs` at each with a caption card ("This is the clock tower: the schedule lives here").
- [ ] **Skippable**: any key, click or touch ends it; a visible "Skip tour" button. Ends at the dock with `stage = 'play'`, `tourSeen = true`.
- [ ] **Never runs for reduced-motion users**; show a static "Here's what's on the island" card instead.

## Tests

**Vitest (store)** `tests/unit/store.test.ts`:
- [ ] enter zone → `nearbyStation` set; leave a different zone → unchanged; leave same → null.
- [ ] `open(a)` then `open(b)` → only `b` open.
- [ ] `travelTo` closes panel and sets `playerTarget`.
- [ ] With `openSection = 'register'` and `formDirty`, `travelTo`/`close` set `pendingNav` and change nothing else; `confirmNav` performs it; `cancelNav` clears it.
- [ ] `visited` deduplicates.

**Vitest (content)**: zones don't overlap; slots 1–9 unique; every `standPoint` inside its radius.

**Playwright** `tests/e2e/stations.spec.ts` (WebGL works in headless Chromium via SwiftShader; slow but fine):
- [ ] For each key 1–9: press key → wait for dialog with the right heading → Esc → dialog gone.
- [ ] Hotbar buttons by accessible name do the same.
- [ ] Typing in a panel input doesn't trigger hotbar keys.
- [ ] Expose `window.__island` (only with `?e2e`) for teleport helpers so tests can stand in a zone and press E.

**Manual playtest**
- Approach each station from every side; open/close with E, click, tap, Esc.
- Hotbar from every station to every other (81 trips: split among the team).
- Skip the tour at each step. Repeat everything with reduced motion on (OS setting).
- Walk past stations without stopping: **no panel ever opens on its own**.

## Acceptance

- [ ] Every section opens three ways; no panel opens on its own.
- [ ] Never two panels at once; focus returns to the canvas/hotbar on close.
- [ ] Draw calls still under ~100 with all stations (instancing for NPCs, one mesh per animated part).
