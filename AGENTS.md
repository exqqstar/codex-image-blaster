# Codex Image Blaster

Codex-first comic scene continuity workflow with optional image-to-3D providers.
Preserve `.agents/skills/`, the existing Three.js viewer and disk-first legacy
asset protocol. Do not relocate `.claude/scripts/` in ordinary workflow changes.

## Setup and defaults

Node 22+ runs the continuity helper without dependencies, `.env` or API keys.
Codex's native image tool is preferred when actually available in the session;
its availability cannot be inferred from this repository or a ChatGPT plan.
Prefer Images 2.5 if explicitly selectable; never claim an unreported version.
If unavailable, retain prompts and use local composition guides when useful.
Do not silently switch to paid generation.

For the optional viewer use `bun install` / `bun run dev`, or
`npm ci --prefix app` / `npm run dev --prefix app`.
`WORLD_LABS_API_KEY` is only for explicitly chosen World Labs worlds.
`FAL_KEY` is only for explicitly chosen legacy edits, object GLBs and SFX.
Presence of keys is not authorization to spend.

## Directory protocol

```text
worlds/<slug>/
  project.json                 # legacy envelope
  image.json                   # source analysis
  scene.json                   # legacy viewer placement, not a scene bible
  source/                      # canonical images and analyses
  continuity/
    scene-bible.json
    camera-bible.json
    storyboard.json
    asset-manifest.json
  output/
    references/                # versioned comic images/guides/requests
    world/                     # optional legacy World Labs JSON/SPZ/GLB
    <object-slug>/              # optional object.json/models
    sfx/                       # optional audio
  reference-gallery.html
```

## Codex workflow

1. Inspect state/input, stage the user's image with:
   `node .claude/scripts/project/project-state.mjs --world "<slug>" --stage-input`.
2. Use `image-blast-uncover` for source analysis. Object candidates are not
   automatic 3D jobs. Architecture and furniture are comic continuity anchors.
3. Use `image-blast-comic-scene` to author scene/camera bibles and ordered panels.
   Separate observed facts from assumptions; preserve canonical images and
   author intent. Do not invent hidden architecture as established fact.
4. `image-blast-world` defaults to scene references, not World Labs. Native
   requests must be executed by an available image tool, registered from real
   saved files and reviewed visually. Local SVGs are composition proxies.
5. Check landmark/prop/material/light/screen-direction/wardrobe continuity;
   record acceptance or rejection with concrete notes. Replan after a layout
   change; never overwrite old images. Plan alone does not mean generation done.
6. Report actual output paths and pending limitations. Open the local reference
   gallery; the 3D viewer is only necessary when 3D assets are requested.

The new helper entrypoint:
`node .agents/skills/image-blast-comic-scene/scripts/comic-scene.mjs`.
Read its skill and data contract for commands/schemas. Execute project mutations
sequentially; no concurrent generation-index allocation within one project.

## Optional enhancements

Keep these existing entrypoints and their output protocols:

```bash
node .claude/scripts/world/generate-world.mjs
node .claude/scripts/asset-pipeline/generate-single-asset.mjs
node .claude/scripts/image-edit/generate-edit.mjs
node .claude/scripts/sfx/fal-elevenlabs-sfx.mjs
node .claude/scripts/project/ensure-local-assets.mjs
```

Call only requested providers/assets. Clean plates are optional and preserve
all continuity props except explicit removals. Prefer native tools for images;
legacy FAL scripts require FAL_KEY. Recommend a few useful object GLBs rather
than converting every detection. SFX is optional and never needed for comics.
World Labs generation must be explicitly selected; read the optional reference
in `image-blast-world`. Preserve resume metadata and local asset downloads.

Before a provider-heavy run, report its scope and expected call count. Continue
within existing authorization; ask only if a new provider/cost is not authorized.
Stop on authorization, quota, billing or repeated provider errors rather than
blindly retrying or changing providers.

## Verification and safety

`node --test tests/*.test.mjs` verifies the no-key workflow.
Viewer checks: `npm run typecheck --prefix app`, `npm run test --prefix app`,
`npm run build --prefix app` (or root Bun scripts). No dummy API keys required.
Offline checks do not prove paid generation or image quality.

- Preserve user worlds, images and unrelated edits; do not delete generated data.
- Never commit `.env`, input payloads, generated `worlds/`, dependencies or builds.
- Generated artifacts use `N-slug.ext` and hidden `.N-slug-request.json`.
- Inspect hidden metadata too; provider URLs are provenance/resume data, not
  frontend delivery URLs. The frontend must use local `/worlds/...` assets.
- `object.json` stores durable intent, not transient request status.
- Bible and reference hashes prevent stale reuse; visual review remains required.
