# Architecture & Compatibility Decisions

## ADR 001: ecctrl v2 Compatibility Spike & Character Controller Strategy
* **Date:** 2026-11-09
* **Context:** Phase 0.1 required a compatibility spike to verify `ecctrl` with React 19, R3F v9, and `@react-three/rapier` v2.
* **Findings:**
  1. `ecctrl@2.0.2` has no default export; it exports `{ Ecctrl }` as a named export.
  2. `EcctrlJoystick` was removed or modularized in `ecctrl` v2.0+.
  3. `Ecctrl` compiles with strict TypeScript, React 19, and `@react-three/rapier` v2.2.0.
* **Decisions:**
  1. Character movement will use `{ Ecctrl }` with verified named imports.
  2. For mobile touch controls (Phase 2), we will implement a custom virtual touch joystick modeled after Homecraft's `flightpad.js` and vyse12138, ensuring exact $\ge 48\text{px}$ touch targets and safe-area insets without relying on deprecated sub-exports.
  3. **Plan B:** A custom ~250-line controller leveraging native Rapier `world.createCharacterController` with `enableAutostep(0.55, 0.2, true)` remains fully prepared as our contingency if any animation or stepping quirks emerge during Phase 2.

