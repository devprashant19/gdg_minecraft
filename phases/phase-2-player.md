# Phase 2: Player

**Goal:** a third-person blocky character that walks, runs and jumps around the island on desktop and phone, can never leave the island, get stuck, fall through the ground, or move while the visitor is typing or reading a panel.

**Ends with:** walk the whole loop with WASD or a joystick; fall in the sea and reappear at the dock; type in a test field and the character stays still.

**Estimate:** 3 days · **Owner:** Dev A

**Borrow:** Homecraft `engine/input.js` (typing guard) and `engine/ui/flightpad.js` (MIT, copy and adapt); vyse12138 joystick (MIT, UX reference); Homecraft `rig.js` camera ideas (MIT).

**Rules enforced in this phase** (full list in [Appendix C](appendix-c-player-rules.md)): no leaving the island, no flying/double-jump/climbing tall props, no walking through props, speed cap, frozen while panels/fields/tour are active, camera limits, Esc/R escape hatches.

---

## 2.1 Character model

- [ ] Kenney **Blocky Characters** (CC0). Pick one as the player; others become crew NPCs in Phase 3. Keep Kenney's license file in `public/models/kenney/`.
- [ ] Re-export through gltf-transform: `gltf-transform optimize in.glb out.glb --texture-compress webp` (KTX2 comes in Phase 7). Target < 300 KB.
- [ ] Map its clips: `idle`, `walk`, `sprint` (run), `jump` (start), `jumpIdle`/`fall`, `jumpLand`. If the pack lacks a clip, reuse the nearest one with a different `timeScale`.

## 2.2 Controller (ecctrl, or plan B from the Phase 0 spike)

```tsx
// components/world/Player.tsx
const keyMap = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
  { name: 'backward', keys: ['KeyS', 'ArrowDown'] },
  { name: 'leftward', keys: ['KeyA', 'ArrowLeft'] },
  { name: 'rightward', keys: ['KeyD', 'ArrowRight'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'run', keys: ['ShiftLeft', 'ShiftRight'] },
];
// physical key codes (KeyW) → works on AZERTY/QWERTZ/Hindi layouts (Homecraft input.js idea)

const disabled = useGame(selectControlsDisabled);

<KeyboardControls map={keyMap}>
  <Ecctrl
    name="player"                       // sensors check this in Phase 3
    position={SPAWN}
    disableControl={disabled}
    maxVelLimit={4.2}                   // walk
    sprintMult={1.6}                    // run ≈ 6.7 u/s: cap, no faster
    jumpVel={5.2}                       // tune: clears exactly 1 block, not 2
    capsuleHalfHeight={0.45} capsuleRadius={0.3} floatHeight={0.3}
    camInitDis={-6} camMaxDis={-9} camMinDis={-2.5}
    camUpLimit={0.9} camLowLimit={-0.35}  // can't look from underground
    camCollision                         // pull camera in when a wall blocks it
    animated
  >
    <EcctrlAnimation characterURL="/models/player.glb" animationSet={animationSet}>
      <PlayerModel />
    </EcctrlAnimation>
  </Ecctrl>
</KeyboardControls>
```

Prop names follow ecctrl's README at the version you pinned; verify each one in the spike. Tune numbers with Leva under `?debug`, then hard-code.

- [ ] **Jump test**: from flat ground, one jump lands on a 1-block step, never on a 2-block step. No double jump (ecctrl checks grounded; verify by spamming Space).
- [ ] **Speed cap**: no input combination (diagonal + sprint) exceeds the sprint limit.

### Plan B (only if the spike failed)

Rapier `world.createCharacterController(0.01)` with `enableAutostep(0.55, 0.2, true)` (half-block steps), `enableSnapToGround(0.5)`, `setMaxSlopeClimbAngle(45°)`; a kinematic-position body; your own gravity and jump; a third-person spring-arm camera (raycast from player to camera, shorten on hit). Same props surface (`disabled`, `moveTo(point)`), so Phase 3 doesn't care which one you used.

## 2.3 Keeping players on the island

- [ ] **Shoreline ring collider**: a ring of tall thin `CuboidCollider`s (or one trimesh "fence" extruded from the shoreline polygon) just inside the water line, invisible, 6 units tall. Players can wade into shallows but not swim out.
- [ ] **Respawn**: in `useFrame`, if the player's `y < -5` → teleport to `SPAWN`, zero velocity, face the path. Also on **R**.
- [ ] **Stuck detector** (**Added**): if movement input is held for 2 s and the body moved < 0.05 units, show a small hint "Stuck? Press R".

## 2.4 No climbing tall props

- [ ] Trees: a `CylinderCollider` from ground to canopy top + 3, smooth-sided, around each trunk. Can't jump onto the canopy.
- [ ] Clock tower, bookshelf wall, TV, portal frame: smooth `CuboidCollider`s that extend 3+ blocks above their visual height. Roof edges get a slight outward slope so you slide off.
- [ ] Generate these colliders from prefab metadata (`prefab.blockerHeight`), not by hand.
- [ ] Debug-render with `<Physics debug>` under `?debug`.

## 2.5 Freeze rules (the most important bug to prevent)

drei `KeyboardControls` listens to the whole page, so without this, typing "w" in the team-name field walks the character away.

- [ ] `disableControl` = `selectControlsDisabled` from the store: true when `stage !== 'play'`, a panel is open, a text field has focus, or the portal transition runs.
- [ ] **Typing guard** (Homecraft `typing()` idea), installed once in the UI layer:
  ```ts
  const isTypingTarget = (el: Element | null) =>
    !!el && (el.matches('input, textarea, select, [contenteditable="true"]'));
  document.addEventListener('focusin', (e) => useGame.getState().setTyping(isTypingTarget(e.target as Element)));
  document.addEventListener('focusout', () => queueMicrotask(() =>
    useGame.getState().setTyping(isTypingTarget(document.activeElement))));
  ```
- [ ] Every global key handler (E, 1–9, T, M, R, Esc, ?) returns early when `isTypingTarget(document.activeElement)`.
- [ ] When controls become disabled, zero the player's horizontal velocity so it doesn't slide.

## 2.6 Escape hatches

- [ ] **Esc**: closes the open panel (via `close()`, which respects the "Leave registration?" guard) and releases pointer lock if any. Don't use pointer lock by default at all: drag-to-look is friendlier on a website.
- [ ] **R**: respawn at the dock.
- [ ] **?**: help overlay listing controls (Phase 6 styles it).

## 2.7 Mobile controls

- [ ] Detect `matchMedia('(pointer: coarse)')`. Show `EcctrlJoystick` (or your own, using Homecraft `flightpad.js`/vyse12138 joystick as UX references): move stick bottom-left, jump + run buttons bottom-right, drag anywhere else to look, pinch to zoom the camera.
- [ ] Respect safe areas: `padding: env(safe-area-inset-*)`.
- [ ] Buttons ≥ 48 px touch targets.
- [ ] Hide the joystick while a panel is open.
- [ ] Test on a **real** phone; emulation lies about touch.

## 2.8 Point-to-move (used by the hotbar in Phase 3)

- [ ] Enable ecctrl's PointToMove mode (or plan B's `moveTo`) and expose a `moveTo(point: Vector3)` function through a ref registry (`lib/world-api.ts`), not through the store. The store only holds `playerTarget`; the Player component reacts to it.
- [ ] Any movement key cancels the auto-walk (`arrive()` with no panel).

## 2.9 Intro camera (prep for Phase 3 tour)

- [ ] Keep the controller's camera disabled during `stage === 'intro'`; a `CameraRig` component flies a `CatmullRomCurve3` from high over the sea to behind the player at the dock in ~2.5 s (woan's camera-on-a-curve idea), then sets `stage = 'play'`. Skipped entirely for reduced motion.

## Tests

**Vitest** (`tests/unit/controls.test.ts`):
- [ ] `selectControlsDisabled` is true for: each open section, `typing`, `portalTransition`, `stage = 'tour' | 'intro' | 'loading'`; false otherwise.
- [ ] Global key handler ignores E/1–9/R while an input is focused (jsdom).

**Manual playtest** (try to break every rule):
- Walk the whole loop at walk and sprint speed; never blocked on a half-step.
- Jump onto a 1-block step: works. Onto 2 blocks: can't.
- Spam jump against a tree, the clock tower, the TV: can't get on top.
- Walk into the sea: stopped by the ring. Use `?debug` teleport to drop outside: respawn at the dock.
- Push the camera into a wall and into the ground: it pulls in, never shows the underside.
- Focus a test `<input>` overlay, press W: the character doesn't move.
- Phone: joystick, jump, drag-look, pinch-zoom; page itself never zooms.

## Acceptance

- [ ] Never stuck, never falls through the ground, across a 10-minute free-roam session.
- [ ] Controls freeze in every state listed in 2.5.
- [ ] 60 fps on desktop with the player moving (no post yet).
