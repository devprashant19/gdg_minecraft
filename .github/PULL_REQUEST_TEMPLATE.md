## Summary of Changes
A concise description of what this PR does, why it is needed, and how it was implemented.

Fixes #(issue number if applicable)

---

## Type of Change
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] ⚡ Performance optimization (improves framerate, bundle size, or memory)
- [ ] 🎨 Aesthetic / UI polish (pixel art, styling, shaders)
- [ ] ♿ Accessibility improvement (ARIA, keyboard navigation, 2D fallback)
- [ ] 📝 Documentation update (README, docs, guides)
- [ ] 🧪 Tests (unit or integration test additions)

---

## Architectural & Invariants Checked
- [ ] **Zero Mojang Copyrighted Assets**: No proprietary Minecraft textures, audio files, or models were added (all textures procedural or CC0).
- [ ] **3D Frame Invariants**:
  - [ ] No `setState()` calls inside Three.js `useFrame()`.
  - [ ] No object allocations (e.g. `new THREE.Vector3()`) created per frame.
  - [ ] 3D binary assets are Draco/GLTF compressed (under 3MB per file).
- [ ] **Dual-Mode Parity**: Features added or modified in 3D are fully accessible in the 2D fallback view (`/2d`).
- [ ] **Voxel Surface Coordinate Math**: Character colliders, station spawn points, and meshes maintain the `[y, y+1]` grid invariant (`pos.y = groundY + 1.85`).

---

## Verification Checklist
Run these commands locally prior to submitting:

- [ ] `pnpm test` (All Vitest suites pass)
- [ ] `pnpm typecheck` (TypeScript compiles with 0 errors)
- [ ] `pnpm lint` (ESLint completes with 0 errors)
- [ ] `pnpm build` (Production Next.js build succeeds)
- [ ] Tested in browser at 60 FPS without console errors

---

## Visual Media (Screenshots / Screen Recordings)
*Please attach screenshots or GIFs showing the change in action (especially for 3D world, shaders, UI hotbar, or 2D mode).*

