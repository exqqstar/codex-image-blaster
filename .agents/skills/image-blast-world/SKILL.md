---
name: image-blast-world
description: Create reusable scene references and camera views with Codex image tools or local composition guides; optionally generate or resume a World Labs 3D environment when explicitly selected.
---

# image-blast-world

## Instructions

1. Inspect `worlds/<slug>/` and its source, analysis and continuity files.
   Default to `image-blast-comic-scene`, even if an API key is present. Existing
   splats need no regeneration.
2. Build/reuse scene bible, camera bible, storyboard and asset manifest. Preserve
   architecture, furniture and hero props as continuity anchors. Clean plates
   are optional; remove only requested content. Do not automatically empty a
   furnished comic set.
3. For illustrated references use native Codex image tools. Prepare requests or
   render local box guides with the no-key helper:

   ```bash
   node .agents/skills/image-blast-comic-scene/scripts/comic-scene.mjs plan --world "<slug>" --provider codex
   node .agents/skills/image-blast-comic-scene/scripts/comic-scene.mjs plan --world "<slug>" --provider local
   ```

   Choose one requested mode, not both by default. Native plans are not images;
   register and visually review real outputs using the comic-scene skill. If
   tools are unavailable, retain the plan and report pending generation. Local
   guides are authored proxies, not reconstructed worlds.
4. Only if the user explicitly selects World Labs/Marble, read
   [the optional World Labs workflow](references/world-labs.md) and run:

   ```bash
   node .claude/scripts/world/generate-world.mjs --world "<slug>" --prompt "<environment caption>"
   ```

   This requires `WORLD_LABS_API_KEY` and separately billed provider credits.
   It preserves `output/world/`, resumable requests and local downloads. Do not
   silently switch failed native/local work to World Labs. GLBs/SFX are optional.
5. Report chosen provider, saved bibles, request metadata, actual images/guides
   and review status. For optional 3D also report local world JSON, SPZ,
   collider, panorama and viewer route. Do not promise exact reconstruction or
   guaranteed novel-view consistency from a single image.
