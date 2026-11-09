# Phase 4: Shaders and atmosphere

**Goal:** the "voxel game with a shader pack" look: turquoise water with foam, swaying leaves, a glowing portal, a rich sky dome with a square sun, height fog that hides the world edge, drifting blocky clouds, and a post-processing stack with AgX tone mapping and a custom color grade. All behind quality tiers so phones stay smooth.

**Ends with:** golden hour that looks like a screenshot you'd post; 60 fps on a mid-range laptop at medium; 30+ fps on a mid-range phone at low.

**Estimate:** 4 days · **Owner:** Dev A (shaders), Dev C (LUT grade, tuning by eye)

**Borrow:** Homecraft `engine/world/stage.js` (time-of-day presets) and `engine/world/gate.js` (portal) (MIT, adapt); minicraft `Sky.ts`, `Clouds.ts` (rebuild); vyse12138 instanced clouds (MIT idea); tiny-world-builder water Fresnel/glint and portal particles (AGPL: **ideas only**).

---

## 4.1 Renderer setup (confirm from Phase 1)

```tsx
<Canvas flat shadows dpr={tierDpr} gl={{ antialias: false, stencil: false, depth: true,
        powerPreference: 'high-performance' }}>
```

- `flat` = no tone mapping in the renderer: tone mapping happens once, in post (AgX).
- `antialias: false`: SMAA in post handles it and keeps pixel edges sharp.

## 4.2 One time-of-day driver (`lib/timeOfDay.ts`)

Everything derives from one `timeOfDay` value (0..1) so sky, fog, sun, hemisphere and bloom always move together.

| Preset | t | Sun color, intensity | Hemisphere sky / ground | Fog | Bloom |
|---|---|---|---|---|---|
| Night | 0.0 | `#9fb7ff` (moon), 0.4 | `#1b2550` / `#0b0b12` | `#0e1430` | 1.4 |
| Dawn | 0.25 | `#ffc9a3`, 1.6 | `#a7b8e8` / `#4b3a2b` | `#e8b9a6` | 1.0 |
| Noon | 0.5 | `#fff1d6`, 2.5 | `#a8dcff` / `#7a6a45` | `#bfe3ff` | 0.6 |
| **Golden hour (default)** | 0.72 | `#ffb46b`, 3.0, low | `#8ec5ff` / `#6b4a2b` | `#f6c7a0` | 0.9 |
| Dusk | 0.82 | `#ff8a5c`, 1.4 | `#6a6fb8` / `#3a2a24` | `#c98a8a` | 1.1 |

- [ ] `sampleTimeOfDay(t)` blends between neighbouring presets (lerp colors in linear space) and returns `{ sunDir, sunColor, sunIntensity, hemiSky, hemiGround, fogColor, horizon, zenith, bloom, starAlpha }`.
- [ ] A single `<TimeOfDayDriver>` writes those values into lights, fog, sky uniforms and bloom **by ref in `useFrame`**, no React state.
- [ ] Default: golden hour, static. Optional slow cycle toggle in settings (a full day in 10 minutes). Optional "real time": map the event's local time to the cycle. No live weather (avoids a third-party API).

## 4.3 Custom shaders (all via three-custom-shader-material, so lighting/shadows/fog keep working)

Put GLSL in `shaders/*.glsl.ts` as template strings; share a `uTime` uniform object across all materials so one `useFrame` updates everything.

### Waving leaves and grass

```glsl
// vertex (added to the cutout material from Phase 1)
uniform float uTime; attribute float aSway;
void main() {
  vec3 p = position;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  float w = sin(uTime * 1.6 + wp.x * 0.8 + wp.z * 0.6) * 0.06 * aSway;
  w += sin(uTime * 3.7 + wp.x * 2.1) * 0.015 * aSway;   // flutter
  csm_Position = p + vec3(w, 0.0, w * 0.6);
}
```

- [ ] Use world position, not local, so neighbouring trees don't sway in sync.
- [ ] Shadow casters: give the depth material the same displacement (CSM supports `depthMaterial`) or the shadows won't sway. On low tier, skip it.
- [ ] Reduced motion: `uSwayScale = 0`.

### Water (`components/world/Water.tsx`)

- [ ] A 400×400 plane, 128×128 segments near the island (or a radial-density mesh), at y = 3.4.
- [ ] **Distance-to-shore texture** (**Added**): during island generation, compute a 128×128 signed distance field from the shoreline (two-pass distance transform on the height grid) and upload it as a `DataTexture`. The water shader samples it for depth color and foam. No raycasts at runtime.
- [ ] Vertex: two sine waves (amplitude 0.05–0.08) + a small one for chop; recompute normal from derivatives.
- [ ] Fragment:
  ```glsl
  float d = texture(uShoreDist, worldXZtoUV(vWorld.xz)).r;   // 0 at shore, 1 far
  vec3 water = mix(uShallow /*#3fd0c9*/, uDeep /*#1d4e89*/, smoothstep(0.0, 0.35, d));
  float fres = pow(1.0 - max(dot(normalize(vViewDir), vNormal), 0.0), 3.0);
  water = mix(water, uHorizon, fres * 0.6);                     // sky reflection
  float foam = step(0.5, fract(d * 18.0 - uTime * 0.6)) * (1.0 - smoothstep(0.0, 0.06, d));
  water += foam * 0.8;                                           // pixel-banded foam ring
  // sun glint: pow(max(dot(reflect(-L, N), V), 0.), 200.) * sunColor  (emissive > 1 → blooms)
  csm_DiffuseColor = vec4(water, mix(0.65, 0.92, smoothstep(0.0, 0.2, d)));
  ```
- [ ] Scrolling pixel normal map: paint a 32×32 noise normal tile in code (no file), sample twice with different scroll directions.
- [ ] `transparent`, `depthWrite: false`, rendered after terrain. Put it on a separate Rapier-free layer so pointer clicks pass through (dgreenheck idea).

### Portal

- [ ] Surface: plane inside the frame; fragment = animated swirl (polar coords + fbm noise, rotating), purple/magenta palette, **emissive above 1** with `toneMapped={false}` so it blooms.
- [ ] drei `<Sparkles count={40} scale={[2,3,0.5]} speed={0.4} color="#c58bff">` around it (low tier: 15).
- [ ] Two-draw-call voxel vortex for the walk-in effect (Homecraft `gate.js`, MIT) used in Phase 5.
- [ ] Uniform `uClosed` (0..1) desaturates to grey and stops the swirl after the registration deadline.
- [ ] Reduced motion: slow the swirl to 10%, no spin.

### Sky dome (replaces drei `<Sky>`, which looks hazy for this style)

- [ ] Inverted sphere (radius 300, `depthWrite: false`, `fog: false`), fragment: `mix(horizon, zenith, pow(max(dir.y, 0.), 0.6))`, warm band near the sun direction.
- [ ] **Square** sun and moon: in the fragment, project the direction onto the sun's tangent plane and use a box test (`max(abs(u), abs(v)) < size`). Sun color > 1 → blooms.
- [ ] Stars: hash of the quantised direction, alpha = `starAlpha` from the time driver.
- [ ] Also keep a small invisible-but-renderable **sun mesh** in the scene for `GodRays` (high tier).

### Height fog

- [ ] Fog color **always equals the sky horizon color** (otherwise you see a seam at the world edge).
- [ ] Use `THREE.Fog(horizon, 35, 180)` plus a height term: in the terrain/water CSM fragment, add extra fog density below y = 5 (`exp(-(y - 3.4) * 0.4)`), so the far sea dissolves into the horizon.

### Blocky clouds

- [ ] One `InstancedMesh` of ~40 flat boxes (e.g. 8×1×5 to 20×1×12) at y = 45, semi-transparent white (`opacity 0.85`), tinted by sun color, drifting +x at 0.6 u/s, wrapping around. Matrices updated in a single loop per frame; low tier: 15 clouds, no update while a panel is open.
- [ ] Simple face shading on the box (top brighter) via vertex colors.

## 4.4 Post-processing stack

Order matters: lighting effects first, color last, anti-aliasing at the end.

```tsx
<EffectComposer multisampling={0} enableNormalPass={false}>
  {tier !== 'low' && <N8AO aoRadius={1.2} intensity={2.5} halfRes={tier !== 'high'} />}
  <Bloom mipmapBlur luminanceThreshold={1} intensity={bloomRef} />
  {tier === 'high' && sun && <GodRays sun={sun} samples={40} density={0.9} decay={0.93} weight={0.5} />}
  <HueSaturation saturation={0.15} />
  <BrightnessContrast contrast={0.08} />
  <ToneMapping mode={ToneMappingMode.AGX} />
  <LUT lut={gradeLut} />
  <Vignette offset={0.3} darkness={0.5} />
  <SMAA />
</EffectComposer>
```

- **N8AO**: soft contact shadows where blocks meet. Biggest depth upgrade. Off on low tier (the baked vertex AO still carries it).
- **Bloom threshold 1**: only emissive > 1 glows: portal, torches/lanterns, sun disc, water glint, chest gleam. Nothing else, so the scene stays crisp.
- **GodRays**: sun shafts through leaves, desktop high tier only.
- **AgX**: keeps saturated greens and sunset oranges from clipping to white.
- **LUT**: your grade.

### Making the LUT (free tools)

1. Set `?debug&lut=off`, golden hour, frame the hero view, screenshot at 1920×1080.
2. Grade in **DaVinci Resolve (free)**: warm highlights, slightly teal shadows, +saturation in greens/oranges, gentle S-curve. Don't crush blacks.
3. Export a 33-point `.cube` → `public/grade.cube` (~1 MB; gzip/brotli brings it way down).
4. Load: `const { texture3D } = useLoader(LUTCubeLoader, '/grade.cube')`.
5. Also bake a "neutral" LUT for A/B comparison in `?debug`.

## 4.5 Quality tiers (`lib/quality.ts`)

| | High | Medium | Low |
|---|---|---|---|
| Who | Desktop dGPU | Laptops, integrated GPU | Phones, weak devices |
| DPR | up to 2 | up to 1.5 | 1 |
| Shadows | 2048 | 1024 | 1024, static (Phase 7) |
| N8AO | full res | half res | off (baked AO only) |
| GodRays | on | off | off |
| Bloom | on | on | on (cheapest mip count) |
| Clouds | 40 | 30 | 15 |
| Sparkles | 40 | 30 | 15 |
| Leaf sway in shadows | on | on | off |

- [ ] **Initial tier**: `detect-gpu` → tier 3 = high, 2 = medium, ≤1 or mobile = low. Self-host detect-gpu's benchmark data in `public/benchmarks/` (its default fetches from a CDN at runtime).
- [ ] **Adaptive**: drei `<PerformanceMonitor onDecline={() => stepDown()} onIncline={…} flipflops={3} onFallback={() => setTier('low')}>`. Step down only, after 3 flip-flops lock the tier.
- [ ] `<AdaptiveDpr pixelated />` lowers resolution while the camera moves.
- [ ] Manual override in a settings menu (gear icon): Auto / High / Medium / Low.

## Tests

- [ ] **Playwright screenshot test**: `?e2e&seed=1&time=0.72&cam=hero&tier=medium&lut=on` freezes time and camera; compare against a stored baseline with a tolerance (`maxDiffPixelRatio: 0.02`). Catches accidental look changes. Run on Chromium only to save CI minutes.
- [ ] Vitest: `sampleTimeOfDay` returns the exact preset at each preset `t`; values are continuous between presets.

**Manual**
- Check every time-of-day preset from the hero view and at the portal.
- DevTools → Performance → CPU 4× slowdown: the tier steps down within a few seconds and stays there.
- Phone: check heat after 5 minutes; frame rate should hold.

## Acceptance

- [ ] **60 fps** on a mid-range laptop at medium; **30 fps or better** on a mid-range phone at low.
- [ ] No grey, no white clipping in sunset oranges; the far sea fades into the sky with no visible edge.
- [ ] Bloom touches only emissive objects.
- [ ] Screenshot baseline committed.
