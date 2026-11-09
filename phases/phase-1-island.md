# Phase 1: Island and base look

**Goal:** a deterministic voxel island that already looks rich (not grey) **before** any post-processing: code-painted pixel textures, baked AO and face shading, trees, a walkable loop path, flat station pads, a dock, warm sun with crisp shadows. Collision matches the visible mesh exactly.

**Ends with:** the island at golden hour, orbit camera, under **60 draw calls**, no holes, no grey.

**Estimate:** 4 days · **Owner:** Dev A (3D), Dev C (textures, prefabs)

**Borrow:** Homecraft `engine/world/textures.js`, `engine/world/voxels.js` (MIT, copy and adapt); dgreenheck `worldChunk.js` terrain/tree ideas (rebuild); minicraft `ChunkMaterial.ts` face shading (rebuild).

---

## 1.1 World dimensions and coordinates

| Constant | Value | Why |
|---|---|---|
| Grid footprint | 64 × 64 blocks (x, z), centered on origin | Shadow camera of ±30 covers it crisply |
| Max height | 24 | Clock tower is the tallest thing |
| Sea level | y = 3 (water surface at 3.4) | Room for a sandy sea floor so shallows look good |
| Island radius | ~26 blocks | Leaves a ring of shallow water inside the shadow box |
| 1 block | 1 world unit | ecctrl capsule sized to ~1.8 units tall |

All in `lib/world-constants.ts`. Station positions in `content/stations.ts` use these coordinates.

## 1.2 Pixel textures painted in code (`lib/textures.ts`)

No image files, no IP risk. Adapt Homecraft's `PAINTERS` / `createTileArray` idea:

- [ ] A painter per tile: `grass_top`, `grass_side`, `dirt`, `path` (dirt path), `sand`, `stone`, `gravel`, `oak_log_side`, `oak_log_top`, `oak_leaves` (with transparent holes), `planks`, `slab_top`, `flower_red`, `flower_yellow`, `tall_grass`, `bookshelf`, `crafting_top`, `crafting_side`, `chest_*`, `clock_face`, `portal_frame` (dark stone). Use your **own** palette, not the Minecraft one.
- [ ] Each painter draws a 16×16 tile with a seeded RNG (per-pixel noise in 3–5 shades of a base color), so the same seed always paints the same tile.
- [ ] Pack every tile into **one `THREE.DataArrayTexture`** (layer per tile). Array textures let you use mipmaps + anisotropy without atlas bleeding (tiny-world-builder's anti-shimmer trick) and allow repeating UVs if you add greedy meshing later.
- [ ] Settings, every color texture, no exceptions:
  ```ts
  tex.colorSpace = THREE.SRGBColorSpace;       // fixes washed-out blocks
  tex.magFilter = THREE.NearestFilter;         // crisp pixels up close
  tex.minFilter = THREE.NearestMipmapLinearFilter; // stops shimmer at distance
  tex.generateMipmaps = true;
  tex.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
  ```
  If mipmaps make the pixels look too soft at mid distance, fall back to the doc's `NearestFilter` + `generateMipmaps = false` and compare both in `?debug`.
- [ ] Also export a tiny `pixel-text.ts` (5×7 bitmap font, Homecraft idea) for in-world signs: dock sign, prize board, clock digits.

## 1.3 Voxel data (`lib/island.ts`)

Store voxels in a flat `Uint8Array(64 * 24 * 64)` indexed `x + z*SX + y*SX*SZ` (dgreenheck's nested objects are slow). Block IDs in `lib/blocks.ts`:

```ts
export const enum B { Air, Grass, Dirt, Path, Sand, Stone, Gravel, Log, Leaves, Planks,
  SlabPath, SlabPlanks, Flower, TallGrass, Bookshelf, CraftTable, Barrier /* invisible */ }
export const BLOCKS: Record<B, { opaque: boolean; solid: boolean; layers: FaceLayers;
  shape: 'cube' | 'slab' | 'cross'; sway?: number }> = { … };
```

### Generation, pure and seeded: `buildIsland(seed, stations) → VoxelGrid`

1. **Heightmap**: `h = base + fbm(simplex2(x*s, z*s), 4 octaves) * amp`, then multiply by a **radial falloff** `f(r) = smoothstep(1.0, 0.55, r / R)` so the island sinks into the sea at the edge. Add a slight hill toward the clock tower side so the view has layers.
2. **Station pads**: for each station, flatten a disk of `pad.radius` to `pad.height`; blend a 3-block ring back into the terrain with a smoothstep so there are no cliffs.
3. **Loop path**: a closed Catmull-Rom curve through the dock and every station in hotbar order. Rasterise it 3 blocks wide. Along the path, **smooth heights so each step rises at most half a block**: where the terrain climbs by 1, insert a `SlabPath` (half-height) block. ecctrl's character floats ~0.3 units up and can't walk up a full block without jumping.
4. **Straight corridors**: keep the path's chord between neighbouring stations clear of trees and props (the hotbar's point-to-move walks in lines between waypoints; see Phase 3).
5. **Material layers**: top block `Grass` (or `Sand` if `h <= seaLevel + 1`, or `Path` on the path), then 3 `Dirt`, then `Stone`. A sand floor at y = 1 extends 8 blocks past the shore so the water shader has shallows to show.
6. **Trees**: Poisson-disk sample positions with the seeded RNG, minimum spacing 5. Reject positions on the path, pads, spawn area and corridors. Trunk 4–6 `Log`, round canopy of `Leaves` (dgreenheck's `generateTreeCanopy` idea, rewritten). Mark leaf blocks so the mesher writes `aSway = 1`.
7. **Ground cover**: scatter `Flower` and `TallGrass` (cross-shaped billboards, `aSway = 1` on top vertices) off the path.
8. **Prefabs** (**Added**): the dock, crafting table plinth, bookshelf wall, chest platform, TV stand, clock tower, map table and portal frame are **voxel prefabs** defined as layered ASCII in `components/world/prefabs/*.ts` and stamped into the grid. They share the terrain's one material and one draw call. Only animated parts (chest lids, TV screen, portal surface, clock hands) are separate meshes.

```ts
// prefabs/clockTower.ts — one string per y layer, bottom to top
export const clockTower = { origin: [0, 0, 0], palette: { S: B.Stone, P: B.Planks, '.': B.Air },
  layers: [ 'SSSSS\nS...S\nS...S\nS...S\nSSSSS', /* … */ ] };
```

9. **Barrier blocks**: invisible `Barrier` voxels are **not** meshed visually but are added to collision. Use them sparingly; the shoreline ring and tall-prop colliders come in Phase 2.

Run generation in **`workers/island.worker.ts`** so the loading screen stays smooth; it returns typed arrays as transferables. Generation for 64×24×64 should take well under 100 ms.

## 1.4 Mesher (`lib/mesher.ts`)

Adapt Homecraft `voxels.js VoxelGrid` (MIT; keep the notice), with minicraft's shading as the reference:

- [ ] **Face culling**: emit a face only if the neighbour in that direction is not opaque. Leaves are not opaque but leaf-to-leaf faces are culled (otherwise canopies cost thousands of hidden faces).
- [ ] **Skip faces nobody sees**: bottom faces below y = 1, and side faces under the sea floor.
- [ ] **Per-vertex AO**, the standard 3-neighbour rule:
  ```ts
  const ao = (side1 && side2) ? 0 : 3 - (side1 + side2 + corner); // 0..3
  const AO_CURVE = [0.45, 0.65, 0.82, 1.0];
  ```
- [ ] **Flip the quad diagonal** when `ao[0] + ao[2] < ao[1] + ao[3]` to avoid the dark-streak artifact.
- [ ] **Face shading** multiplied in: top 1.0, north/south 0.8, east/west 0.6, bottom 0.5.
- [ ] Bake `AO_CURVE[ao] * faceShade` into a `color` attribute (vertex colors).
- [ ] Attributes per vertex: `position`, `normal`, `uv`, `aLayer` (texture layer, float), `color`, `aSway`.
- [ ] Slabs: half-height cube faces. Cross plants: two crossed quads, no AO.
- [ ] Output **three geometries**: `opaque` (terrain + prefabs), `cutout` (leaves, plants; `alphaTest: 0.5`, `side: DoubleSide` for plants), and `collision` (opaque + slabs + barriers, positions + indices only).
- [ ] Greedy meshing (minicraft `emitGreedy`) is **optional**: a face-culled 64×64 island is only ~20–40k quads. Add it in Phase 7 only if triangles are a problem.

## 1.5 Terrain material

Use `three-custom-shader-material` on `MeshStandardMaterial` so lighting, shadows and fog keep working:

```ts
const terrainMat = new CustomShaderMaterial({
  baseMaterial: THREE.MeshStandardMaterial,
  roughness: 0.95, metalness: 0,
  uniforms: { uTiles: { value: tileArray } },
  vertexShader: /* glsl */`
    attribute float aLayer; varying float vLayer; varying vec3 vAO;
    void main(){ vLayer = aLayer; vAO = color; }`,
  fragmentShader: /* glsl */`
    uniform sampler2DArray uTiles; varying float vLayer; varying vec3 vAO;
    void main(){
      vec4 t = texture(uTiles, vec3(vUv, vLayer));
      csm_DiffuseColor = vec4(t.rgb * vAO, t.a);
    }`,
});
```

- [ ] Leave `vertexColors` **off** on the base material and apply AO yourself as above, so AO isn't multiplied twice. Verify once by toggling AO in Leva.
- [ ] Same material with `alphaTest = 0.5` for the cutout mesh; the leaf sway vertex code is added in Phase 4.

## 1.6 Lighting (base look, no post yet)

- [ ] **Remove any `ambientLight`.** Use `hemisphereLight` (sky `#8ec5ff`, ground `#6b4a2b`, intensity ~1.1) + a warm `directionalLight` sun (`#ffb46b`, intensity 3.0, low angle for golden hour).
- [ ] Shadows: shadow camera fitted to the island `left/right/top/bottom = ±30`, `near 1`, `far 120`, `mapSize 2048`, `bias -0.0005`, `normalBias 0.02`. `castShadow` + `receiveShadow` on terrain; trees cast.
- [ ] Background and fog: `scene.background` and `fog` set to the golden-hour horizon `#f6c7a0` (the sky dome replaces the flat background in Phase 4).
- [ ] Renderer: `<Canvas flat>` means no tone mapping yet; colors will look a bit hot. That's expected: AgX tone mapping is added in post in Phase 4. Tune base colors so the scene already reads well.

## 1.7 Physics collider

- [ ] `<RigidBody type="fixed" colliders={false}><TrimeshCollider args={[positions, indices]} /></RigidBody>` built from the **collision geometry**, so collision always matches what players see.
- [ ] Tree trunks are in the trimesh; canopies are not (Phase 2 adds tall smooth colliders so players can't climb trees).

## 1.8 Components

```
components/world/Island.tsx      requests the worker, builds BufferGeometries, <mesh>es + collider
components/world/Dock.tsx        spawn marker, rope posts (part of prefabs)
components/world/DebugOrbit.tsx  OrbitControls for this phase (?debug only later)
```

- [ ] Dispose geometries/textures on unmount (hot reload otherwise leaks GPU memory).
- [ ] Wrap in `<Suspense>`; the worker promise feeds drei's loading progress in Phase 6.

## Tests (Vitest, `tests/unit/island.test.ts`)

- [ ] Same seed → byte-identical voxel array (hash it).
- [ ] Every station pad is flat: all top heights within the pad radius are equal.
- [ ] No step along the path rises more than 0.5 blocks.
- [ ] Corridors between consecutive stations contain no solid blocks above the path surface.
- [ ] Mesher: a single cube gives 6 faces; two adjacent cubes give 10 faces; a fully enclosed cube contributes 0 faces.
- [ ] AO: a block in an inside corner gets AO level 0 on the shared vertex.
- [ ] Spawn point and every station's stand point are in open air (2 blocks of `Air` above solid ground).

## Manual playtest

- Fly the orbit camera all around and underneath: look for holes, flickering faces (z-fighting), dark streaks, grey/washed-out colors.
- Toggle AO and face shading in Leva: the difference should be obvious.
- Check from a low angle at distance: no texture shimmer.

## Acceptance

- [ ] Under **60 draw calls** (check `?debug`).
- [ ] Looks warm and saturated with no post-processing.
- [ ] Collision mesh = visual mesh (debug-render the Rapier colliders with `<Physics debug>`).
- [ ] All unit tests pass in CI.

## Risks

| Risk | Mitigation |
|---|---|
| `sampler2DArray` + CSM injection quirks | Spike the material first (half a day); fallback is a padded 2D atlas with `NearestFilter` and no mipmaps |
| Trimesh snagging the capsule on block edges | Half-block path steps; Phase 2 tunes capsule radius and float height |
| Island looks procedural/boring | Hand-place prefabs and hero trees after generation; the seed only creates the base |
