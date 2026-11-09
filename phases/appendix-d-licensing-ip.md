# Appendix D: Licensing and IP

The site is a **voxel/blocky-style** world with **100% original or CC0 art**. It must not look like an official Minecraft product. Official-looking assets (textures, C418 music, block sounds, Minecraft fonts, Steve and mob models) are the biggest legal risk in every analysed repo.

## What you can copy from which repo

| Repo | License | Allowed |
|---|---|---|
| terryHu7/homecraft | MIT (LICENSE file) | Copy and modify code; keep the copyright notice |
| andrewwoan/woan-minecraft-folio | MIT (LICENSE.md), code only | Copy code with notice. **Not** `public/fonts/Minecraft-*.woff2`, `public/audio/music/Sweden.*`, mob models, or the Blender build (learn-only) |
| vyse12138/minecraft-threejs | MIT, code only | Copy code with notice. **Never** `src/static/textures/`, `src/audio/`, `mc-font.otf` (official game files) |
| 0kzh/minicraft | README says MIT, no LICENSE file | Treat as **rebuild**. Never `public/textures/`, `public/sounds/`, `public/entity/steve.png`, `gui/toolbar*.png`, `Minecraft.woff`; its music streams from Mojang |
| jasonkneen/tiny-world-builder | **AGPL-3.0** | **Ideas only. Never copy a line**: it would make the whole site AGPL. Its Press Start 2P font is OFL (get it from Google Fonts instead) |
| Sushrut-Kale/AI-challenge (AGENTCRAFT) | All rights reserved | Learn, rebuild. **Do not download `AgentCraft_Team_Master_Registry.xlsx`** (real participants' PII) |
| Raghav-1407/deepcraft-hackathon-landing | None | Learn, rebuild |
| tickkkkkkyg/cubed | None | Learn, rebuild |
| dgreenheck/minecraft-threejs-clone | None | Learn, rebuild (the YouTube series is meant for re-typing as you learn); don't ship its textures or `fonts/Minecraft.ttf` |
| Eaglercraft | Port of the real client, takedowns | **Leave out entirely** |

No license file = all rights reserved. For learn-only repos: read, close, write your own version.

## Approved asset sources

| Need | Source | License |
|---|---|---|
| Block textures | Painted in code (`lib/textures.ts`) with our own palette | Ours |
| Characters | Kenney Blocky Characters | CC0 |
| Props | Our voxel prefabs; Blockbench models we make | Ours |
| Fonts | Press Start 2P (Google Fonts), Monocraft | SIL OFL 1.1 (keep `OFL.txt`) |
| UI kit | 8bitcn/ui | MIT (code copied into repo; add to notices) |
| Sound | ZzFX-generated | ZzFX is MIT; sounds are ours |
| Icons | Code-drawn pixel icons | Ours |
| LUT | Graded by us in DaVinci Resolve | Ours |
| Sponsor logos | From each sponsor, with permission and their brand guidelines | Theirs |
| GDG/Google branding | Only per Google Developer Groups brand guidelines | Google's |

## Brand rules

- [ ] Don't use "Minecraft", "Mojang", "Creeper", "Steve", or official item names in the event name, domain, logo or marketing. Say "voxel", "blocky", "block-built".
- [ ] No characters resembling official mobs (Creeper, Ghast, Enderman…): AceHack's site used official-looking mobs; don't follow that.
- [ ] Our own color palette for grass/dirt/stone; don't sample the official texture colors.
- [ ] Item and UI icons drawn by us; no copies of official items (AGENTCRAFT's icons copied real items).
- [ ] No "Steve" cursor.

## `THIRD_PARTY_NOTICES.md` template

```md
# Third-party notices

| Component | Source | License | Files in this repo |
|---|---|---|---|
| Homecraft | https://github.com/terryHu7/homecraft | MIT © <year> <author> | lib/textures.ts (adapted), lib/mesher.ts (adapted), lib/input.ts … |
| woan-minecraft-folio | https://github.com/andrewwoan/woan-minecraft-folio | MIT © <year> <author> | components/ui/LoadingScreen.tsx, components/ui/Panel.tsx … |
| Kenney Blocky Characters | https://kenney.nl | CC0 1.0 | public/models/kenney/* |
| Press Start 2P | Google Fonts | SIL OFL 1.1 | via next/font |
| Monocraft | https://github.com/IdreesInc/Monocraft | SIL OFL 1.1 | public/fonts/Monocraft* |
| 8bitcn/ui | https://www.8bitcn.com | MIT | components/ui/8bit/* |

<full MIT license text for each MIT entry>
```

Copy the exact copyright line from each repo's LICENSE file.

## Pre-launch IP sign-off

- [ ] `grep -riE "mojang|minecraft|c418|steve" public/ components/ lib/` returns nothing unexpected.
- [ ] Every file in `public/` is listed as ours, CC0, OFL, or a sponsor logo.
- [ ] No file copied from a learn-only or AGPL repo (reviewers check PRs that mention those repos).
- [ ] `THIRD_PARTY_NOTICES.md` complete.
