# Third-Party Notices & Licensing

This project adheres strictly to intellectual property compliance. No official Minecraft assets (textures, audio, music, fonts, or models) are included. All procedural textures and audio are synthesized in code or sourced from permissive CC0/MIT licensed projects.

| Component / Adaptation | Upstream Source | Upstream License | Target Path in Repository | Notes / Modifications |
|---|---|---|---|---|
| Texture Painters & Tile Array Concept | `terryHu7/homecraft` | MIT | `lib/textures.ts` | Adapted procedural noise painting to custom color palette |
| Voxel Mesher & AO Calculation | `terryHu7/homecraft` | MIT | `lib/mesher.ts` | 3-neighbor baked vertex AO and diagonal flip |
| Mobile Flightpad / Touch UX | `terryHu7/homecraft` | MIT | `components/ui/TouchJoystick.tsx` | Pure DOM touch stick for mobile movement |
| Character 3D Models | Kenney (Blocky Characters) | CC0 1.0 Universal | `public/models/player.glb` | Re-exported & optimized via gltf-transform |
| Press Start 2P Font | Google Fonts (Cody Boisclair) | SIL Open Font License 1.1 | `app/layout.tsx` | Headings & button badges |
| ZzFX Procedural Sound Engine | Frank Force (ZzFX) | MIT | `lib/sound.ts` | Zero-byte runtime procedural Web Audio |

