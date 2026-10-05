# Codex Image Blaster — comic scene references

[![CI](https://github.com/exqqstar/codex-image-blaster/actions/workflows/ci.yml/badge.svg)](https://github.com/exqqstar/codex-image-blaster/actions/workflows/ci.yml)

Turn a scene image into reusable comic scene references: a scene bible, camera
bible, ordered storyboard and versioned asset manifest. Default to Codex's
available native image tools, with a deterministic local composition-guide
provider. **World Labs and 3D generation are optional, not setup requirements.**

Based on [neilsonnn/image-blaster](https://github.com/neilsonnn/image-blaster).
Codex replaces the orchestrator; the existing `.agents/skills/` architecture,
disk-first protocol, legacy generation scripts and Three.js viewer are retained.

## Default workflow

1. Stage and inspect the source image; create/reuse `image.json`.
2. Author the scene bible: fixed landmarks, prop IDs, materials, light direction,
   style, prohibited changes and explicit assumptions about unseen geometry.
3. Author named cameras and panel states (action, characters, props, lighting).
4. Generate requested views using native Codex image tools, or render local
   perspective box guides to check compositions without API keys.
5. Review continuity against canon; register real images with hashes and version
   provenance. Reuse accepted views as secondary references for later panels.
6. Optionally add World Labs splats, selected GLBs or SFX if explicitly requested.

These references support consistency; one source image cannot prove hidden
geometry. Generative novel views still need visual review. Local guides are
authored box proxies, not finished art or an automatic 3D reconstruction.

## Installation — no provider keys required

- Node.js 22+ for the continuity helper (built-ins only).
- Codex CLI or desktop for the skill workflow. Native image capability depends
  on the current session; the helper does not add that capability to a CLI.
- Bun is optional, used by the existing viewer's documented commands.

```bash
git clone https://github.com/exqqstar/codex-image-blaster.git
cd codex-image-blaster
codex
```

Place a source image in `input/`. Ask Codex:

```text
Use image-blast-project, image-blast-uncover and image-blast-comic-scene.
Build a reusable comic scene bible from the image in input/, preserve the
furniture and architecture, and make establishing, reverse and close-up
references for three consecutive panels. Use the native image tool if available;
otherwise prepare local composition guides. Do not call paid third-party APIs.
```

No `.env`, `bun install`, World Labs key or FAL key is needed for local
continuity work. Native image tools use their session's entitlement/limits,
not World Labs credits. This is not a promise of free/unlimited generation.

## Manual commands

```bash
node .claude/scripts/project/project-state.mjs --world study --stage-input
node .agents/skills/image-blast-comic-scene/scripts/comic-scene.mjs init --world study
```

Edit the generated draft bibles and storyboard in `worlds/study/continuity/`.
Use the [data contract](.agents/skills/image-blast-comic-scene/references/contract.md).
Fill the observed layout and assumptions, then set both bibles to `locked`.
Initialization preserves existing files; it does not invent source geometry.

```bash
node .agents/skills/image-blast-comic-scene/scripts/comic-scene.mjs validate --world study
node .agents/skills/image-blast-comic-scene/scripts/comic-scene.mjs plan --world study --provider codex
```

`codex` produces requests/prompts only. Codex invokes its actual image tool,
then copies/registers the real saved PNG/JPEG/WebP. A planned request is never
reported as a generated image. Prefer Images 2.5 when explicitly selectable;
otherwise record the tool's actual model or `unknown`.

```bash
node .agents/skills/image-blast-comic-scene/scripts/comic-scene.mjs register --world study --request "output/references/.0-p01-request.json" --image "/path/to/real-output.png" --model unknown
node .agents/skills/image-blast-comic-scene/scripts/comic-scene.mjs review --world study --asset v0-p01-reference --status accepted --notes "Checked door/window sides, desk position and light direction against canon."
node .agents/skills/image-blast-comic-scene/scripts/comic-scene.mjs gallery --world study
```

Open `worlds/study/reference-gallery.html` directly or serve the project locally.
For a fully local demo, copy the authored JSON files in
[docs/examples/study](docs/examples/study/) into a new project's `continuity/`,
then use `plan --provider local` and `gallery`. It renders three real perspective
SVG guides without keys. Do not copy demo geometry over a user's actual scene.

## Optional 3D and paid providers

Copy `.env.example` to `.env` only when choosing an external provider
(`cp` on POSIX, `Copy-Item .env.example .env` in PowerShell).

| Capability | Requirement | Activation |
| --- | --- | --- |
| Local bibles, plans, SVG guides, gallery | Node only | Default/no keys |
| Illustrated comic references | Native Codex image tool | Available session capability |
| World Labs splat world | `WORLD_LABS_API_KEY` | Explicit World Labs selection |
| FAL edits, Hunyuan/Meshy GLBs, SFX | `FAL_KEY` | Explicit selected enhancement |

Keys present in `.env` do not opt the user into calls. Native tools are preferred
for image edits and clean plates too; FAL remains an explicit legacy option.
Clean plates should remove only requested content, not every continuity prop.

```bash
# Optional World Labs branch; may incur charges
node .claude/scripts/world/generate-world.mjs --world study --prompt "<approved environment caption>"
```

The preserved viewer is for existing/generated 3D assets, not required for comic
references. With Bun: `bun install`, then `bun run dev`. With Node/npm:
`npm ci --prefix app`, then `npm run dev --prefix app`.
Open Vite's printed URL, usually `http://localhost:5173/<slug>`.

## Development and migration

```bash
node --test tests/*.test.mjs
npm ci --prefix app
npm run typecheck --prefix app
npm run test --prefix app
npm run build --prefix app
```

Or install Bun and use root `bun run typecheck`, `bun run test`, `bun run build`.
Tests no longer need dummy API keys. CI uses the existing committed app npm
lockfile. Paid generation is not part of offline tests.

- [Pipeline](docs/PIPELINE.md) and [costs](docs/COSTS.md)
- [Migration](docs/MIGRATION.md), [troubleshooting](docs/TROUBLESHOOTING.md)
- [Research and implementation decisions](docs/RESEARCH.md)
- [Codex contract](AGENTS.md)

Existing `worlds/`, `project.json`, `image.json`, viewer `scene.json`, object
intents, splats and hidden provider metadata remain compatible. New continuity
data is additive under `continuity/` and `output/references/`.
