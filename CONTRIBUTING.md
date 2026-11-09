# Contributing to Voxel Island (CraftHacks)

Welcome, and thank you for taking the time to contribute to the **Voxel Island** interactive hackathon portal! Whether you're fixing a voxel mesher edge case, refining procedural pixel-art textures, optimizing WebGL shader performance, or improving accessibility on the 2D fallback view, your help is warmly welcomed.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Core Invariants & Intellectual Property](#core-invariants--intellectual-property)
- [Prerequisites & Development Setup](#prerequisites--development-setup)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Key Development Invariants](#key-development-invariants)
- [Verification & Quality Standards](#verification--quality-standards)
- [Contribution Workflow](#contribution-workflow)
- [Conventional Commits](#conventional-commits)
- [Pull Request Checklist](#pull-request-checklist)
- [Reporting Bugs & Requesting Features](#reporting-bugs--requesting-features)

---

## Code of Conduct

All contributors, maintainers, and participants are expected to uphold the [CraftHacks Code of Conduct](CODE_OF_CONDUCT.md). Please read it before participating in issues, discussions, or pull requests.

---

## Core Invariants & Intellectual Property

To keep this project open, legally sound, and universally deployable at **$0/month**:

1. **Zero Mojang Copyrighted Assets:**
   - **Never commit** official Minecraft `.png` textures, sound files (`.ogg`/`.mp3`), `.minecraft` binary models, or proprietary fonts.
   - All voxel textures are procedurally synthesized at runtime into a `THREE.DataArrayTexture` via HTML5 canvas in [`lib/textures.ts`](file:///c:/Users/u/OneDrive/Desktop/SayOnce/gdg_hackathon/lib/textures.ts).
   - Audio is synthesized at runtime with **ZzFX** (MIT) in [`lib/sound.ts`](file:///c:/Users/u/OneDrive/Desktop/SayOnce/gdg_hackathon/lib/sound.ts).
   - Fonts used are licensed under SIL Open Font License (OFL) or MIT (e.g., *Press Start 2P*).
   - See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for complete attribution.

2. **$0/month Infrastructure Budget:**
   - The project is architected for free-tier deployment (Vercel Hobby, Supabase Free Tier, Resend Free Tier).
   - Do not introduce dependencies on paid external APIs or persistent compute servers.

3. **Dual-Mode Parity (3D & 2D Accessible):**
   - Every piece of hackathon information and registration capability accessible in the 3D voxel world **must** be equally accessible, responsive, and screen-reader compliant in the 2D view (`/2d` or toggle in UI).

---

## Prerequisites & Development Setup

### System Requirements

- **Node.js**: v20.x or higher (LTS recommended)
- **pnpm**: v9.x or higher (`corepack enable pnpm` or `npm install -g pnpm`)
- **Git**: v2.30+
- **WebGL 2.0 capable browser**: Chrome, Edge, Firefox, or Safari

### Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/gdg_hackathon.git
   cd gdg_hackathon
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure environment variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase credentials or use the default mock/local development parameters.

4. **Start the development server:**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Architecture & Tech Stack

```
gdg_hackathon/
├── app/                  # Next.js 15 App Router (pages, layouts, metadata)
│   ├── 2d/               # Accessible 2D fallback view
│   ├── admin/            # Admin dashboard & attendee management
│   ├── api/              # Route handlers (registration, stats, health)
│   └── code-of-conduct/  # Code of Conduct page
├── components/
│   ├── sections/         # Informational content sections (Schedule, Prizes, Tracks, etc.)
│   ├── ui/               # Pixel-art UI components (HUD, Compass, Modals, Loading)
│   └── world/            # 3D R3F components (Island, Player, Nether Portal, Stations)
├── content/              # Static content JSONs validated with Zod schemas
├── docs/                 # Architectural decision records (ADRs) and specs
├── lib/
│   ├── blocks.ts         # Block ID constants & texture layer mappings
│   ├── island.ts         # Procedural voxel island generator
│   ├── mesher.ts         # Chunk mesher with 3-neighbor AO & side face UVs
│   ├── quality.ts        # Dynamic GPU tier detection and performance scaling
│   ├── sound.ts          # ZzFX procedural audio synthesizer
│   ├── store.ts          # Zustand centralized state store
│   └── textures.ts       # 16x16 canvas texture painters
└── tests/
    └── unit/             # Vitest test suites (stations, controls, mesher, schemas)
```

- **Framework**: [Next.js 15](https://nextjs.org) with React 19 Compiler
- **3D Graphics**: [Three.js](https://threejs.org), [React Three Fiber](https://r3f.docs.pmnd.rs), [Drei](https://github.com/pmndrs/drei)
- **Physics**: [Rapier](https://rapier.rs) via `@react-three/rapier`
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) + custom pixel-art CSS bevels
- **State**: [Zustand](https://github.com/pmndrs/zustand)
- **Testing**: [Vitest](https://vitest.dev) + Testing Library

---

## Key Development Invariants

When working in the 3D voxel codebase, always keep these mathematical invariants in mind:

1. **Voxel Coordinate Grid:**
   - In `mesher.ts`, a voxel at integer coordinates `[x, y, z]` occupies `[x, x+1]`, `[y, y+1]`, `[z, z+1]`.
   - The top walking surface of a block at grid index `y = 5` is at world elevation `Y = 6.00`.
   - The player capsule collider (`halfHeight: 0.5`, `radius: 0.3`) extends `0.80` units below the rigid body center.
   - Therefore, a character resting on top of block index 5 must have its rigid body center at `Y = 6.80`.

2. **Side-Face Texture Orientation:**
   - Three.js `DataArrayTexture` maps row 0 to `V = 0` (bottom of texture) and row 15 to `V = 1` (top of texture).
   - Side quads in `mesher.ts` must map lower vertices ($y$) to $V=0$ and upper vertices ($y+1$) to $V=1$ to keep textures right-side-up.
   - Side grass fringes in `textures.ts` must be painted at `y >= 12` to hang down from the top edge.

3. **Performance Budget:**
   - Cap canvas DPR to `Math.min(window.devicePixelRatio, 1.25)` to prevent frame drops on 4K/Retina displays.
   - Always run half-resolution screen-space AO (`halfResAO: true`) and keep shadow maps at or below 2048px.
   - Avoid allocating Three.js objects (vectors, matrices, colors) inside `useFrame` render loops; reuse module-scoped scratch variables.

---

## Verification & Quality Standards

Before submitting any code, verify all four checks locally:

```bash
# 1. Run unit test suite
pnpm test

# 2. Run TypeScript compiler type checking
pnpm typecheck

# 3. Run ESLint (must have 0 errors)
pnpm lint

# 4. Verify production build succeeds
pnpm build
```

We follow a **double verification** principle: all changes must be verified statically (TypeScript + ESLint) and dynamically (automated tests + headless browser visual check).

---

## Contribution Workflow

1. **Find or Create an Issue:**
   - Browse open issues or open a new one using our issue templates.
   - For major features, discuss the proposal with maintainers first.

2. **Branching:**
   - Create a feature branch off `master`:
     ```bash
     git checkout -b feat/your-feature-name
     # or
     git checkout -b fix/your-bugfix-name
     ```

3. **Make Your Changes:**
   - Keep pull requests focused on a single responsibility.
   - Add unit tests for new logic in `tests/unit/`.

4. **Verify Locally:**
   - Run `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build`.

5. **Commit Your Work:**
   - Use Conventional Commits (see below).

6. **Submit a Pull Request:**
   - Open a PR against `master`.
   - Fill out the PR template completely with screenshots or screen recordings where applicable.

---

## Conventional Commits

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

| Prefix | Usage | Example |
|---|---|---|
| `feat` | New user-facing feature or gameplay mechanic | `feat(world): add campfire particle system to camp station` |
| `fix` | Bug fix | `fix(player): resolve sinking collider elevation on spawn` |
| `perf` | Performance improvement | `perf(postprocessing): cap DPR to 1.25 and enable half-res AO` |
| `docs` | Documentation update | `docs: add contributing and security guidelines` |
| `style` | Code formatting or styling that does not affect logic | `style(ui): align hud hotbar pixel borders` |
| `refactor`| Code restructuring without feature or bug changes | `refactor(mesher): extract side quad builder helper` |
| `test` | Adding or updating tests | `test(unit): add collision height verification for stations` |
| `chore` | Maintenance tasks, dependency updates, CI workflows | `chore(deps): update vitest to v5.1.0` |

---

## Pull Request Checklist

When opening a PR, ensure:

- [ ] Branch is up to date with `master`.
- [ ] No copyrighted or proprietary binary assets are included.
- [ ] `pnpm test` passes 100%.
- [ ] `pnpm typecheck` exits with 0 errors.
- [ ] `pnpm lint` exits with 0 errors.
- [ ] `pnpm build` generates the production bundle without errors.
- [ ] 2D accessible view parity is verified if any content or station was added.
- [ ] Visual changes include before/after screenshots or screen captures.

---

## Reporting Bugs & Requesting Features

- **Bug Reports**: Open an issue using the [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md). Please include your browser, operating system, and WebGL debug details if graphical.
- **Feature Requests**: Open an issue using the [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md). Please explain the user benefit and how it fits the Minecraft aesthetic and $0 budget.
- **Security Vulnerabilities**: Please review our [Security Policy](SECURITY.md) for responsible disclosure procedures.

Thank you for building Voxel Island with us! ⛏️💎

