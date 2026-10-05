---
name: image-blast-comic-scene
description: Build reusable comic scene and camera bibles, plan multiple viewpoints and sequential panels, render local composition guides, and track reviewed image references without requiring World Labs or 3D assets.
---

# image-blast-comic-scene

## Instructions

Use `worlds/<slug>/` as the existing project envelope. Run the Node-only helper
from the repo root. Read [the data contract](references/contract.md) when
authoring bibles; use [the authored example](../../../docs/examples/study/)
only for a demo, never as invented geometry for a user's scene.

1. Inspect source images, `image.json` and existing continuity files. If needed,
   stage input with `node .claude/scripts/project/project-state.mjs --world "<slug>" --stage-input`.
   View the actual source image with the available image-viewing tool.
2. Initialize without overwriting existing continuity files:
   `node .agents/skills/image-blast-comic-scene/scripts/comic-scene.mjs init --world "<slug>"`.
3. Author `continuity/scene-bible.json`, `camera-bible.json` and `storyboard.json`.
   Keep the original as canonical. Record stable landmark/prop IDs, door/window
   positions, materials, light direction, style and prohibited changes. Put
   inferred dimensions and unseen surfaces in `assumptions`. Box geometry is
   an authored composition proxy, not reconstruction from one image.
4. Resolve major layout ambiguity with the author; proceed with documented
   assumptions when already authorized. Set both bibles to `locked` once the
   intended set is established and increment revisions for later changes.
   Each panel needs camera, action, character positions/wardrobe, prop state,
   time and lighting. Intentional axis crossings need `axis_exception` reasons.
5. Validate and plan only the requested views:

   ```bash
   node .agents/skills/image-blast-comic-scene/scripts/comic-scene.mjs validate --world "<slug>"
   node .agents/skills/image-blast-comic-scene/scripts/comic-scene.mjs plan --world "<slug>" --provider codex
   ```

   This writes versioned prompts and hidden requests, **not images**. The helper
   never calls an API or silently switches providers.
6. Use the session's actual available native image tool for each planned view.
   Prefer Images 2.5 if selectable; otherwise use the newest available native
   capability and record the reported model, or `unknown`. Never invent model
   names, tools or parameters. Inspect local references before editing. Include
   the canonical image, a relevant accepted view, and a composition guide if
   supported; respect tool image format/reference-count limits. Follow its
   saving instructions and register the real saved image:

   ```bash
   node .agents/skills/image-blast-comic-scene/scripts/comic-scene.mjs register --world "<slug>" --request "output/references/.<N>-<panel>-request.json" --image "<actual-generated-file>" --model "<reported-model-or-unknown>"
   ```

7. Inspect against canon and bibles: landmark count/side, prop identity/position,
   materials, light direction, lens feel, screen direction, wardrobe/action.
   Review with concrete notes; never accept just because generation succeeded:

   ```bash
   node .agents/skills/image-blast-comic-scene/scripts/comic-scene.mjs review --world "<slug>" --asset "v<N>-<panel>-reference" --status accepted --notes "<checks performed and uncertainty>"
   ```

   Use `rejected` for drifting views. Do not automatically promote invented
   hidden architecture to canon. Plan again after accepting a view to include
   it as secondary evidence for subsequent panels; keep the canonical image.
8. Create `reference-gallery.html` with
   `node .agents/skills/image-blast-comic-scene/scripts/comic-scene.mjs gallery --world "<slug>"`.
   Open directly or serve locally. Report real outputs and pending work.

## Providers and limits

- `plan --provider local` renders perspective SVG box guides from geometry and
  camera records with no keys, packages or network. Label them composition
  proxies, not final comic art, reconstructed meshes or splats. Characters
  remain prompt metadata, not rendered figures. Use an existing local tool to
  rasterize only if a provider requires raster input.
- Without native tools, preserve the plan and report image generation pending.
  Offer local guides or the user's existing open-source image workflow. Do not
  silently invoke paid APIs, download models or install a GPU stack. For an
  existing Blender set, render these cameras with Y-up/Z-up conversion.
- Explicit World Labs selection goes through `image-blast-world`'s optional
  branch. `image-blast-3d` and SFX are requested enhancements, not prerequisites.
- Run mutations sequentially per project. Bibles/storyboard/canonical hashes
  are snapshotted. Changed references or layouts require a new plan; old images
  stay on disk and appear as obsolete. Visual review remains necessary; image
  generation cannot guarantee exact spatial or character consistency.
