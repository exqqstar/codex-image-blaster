---
name: image-blast-uncover
description: Analyze source images, write image.json, present object candidates, and create object.json files after user confirmation.
---

# image-blast-uncover

Use this skill for source understanding. For comic references, keep furniture
and architecture as continuity anchors; object candidates are not 3D jobs.
Confirm objects only when the user wants optional extraction/model generation.

## Instructions

1. Require a world slug. If missing, ask which `worlds/<slug>/` to use.
2. Ensure stable project state:

   ```bash
   node .claude/scripts/project/project-state.mjs --world "<slug>" --stage-input
   ```

3. Follow the legacy JSON contract in
   `.claude/skills/image-blast-uncover/IMAGE-BLAST.md`.
4. Analyze the latest visible source image in each indexed source family under
   `worlds/<slug>/source/`. Source images use indexed families
   (`0-<slug>.<ext>`, `1-<slug>.png`, etc.); by default, analyze the latest
   image in each family and do not treat every historical plate/edit as
   separate evidence unless the user requests it.
5. Treat existing `worlds/<slug>/source/<image-name>.json` files as reusable
   analysis. If the source image or user instruction changed, update the
   sibling JSON. If the user deleted a source image or its JSON, do not
   recreate it unless the image still exists and should be analyzed.
6. Write one sibling JSON file per analyzed source image:

   ```text
   worlds/<slug>/source/<image-name>.json
   ```

   Each per-image JSON must use the same flat schema as root `image.json` and
   must not contain `images[]`.
7. Use literal, technical language. Extract only cleanly segmentable physical
   objects:
   - Separability test: a human could lift the item or move it by pushing it.
   - Do not extract walls, floors, sky, terrain, fog, rugs, or fixed
     architectural surfaces as standalone objects.
   - Never group different items or create compound assets (no
     "table-with-chairs", no "table including the objects on top").
8. Merge valid source analyses into `worlds/<slug>/image.json` by:
   - combining `source_images`
   - synthesizing one shared `scene_name`, `short_caption`, and
     `literal_description`
   - merging `environment`, `visual_style`, `lighting`, `atmosphere`, and
     `ambient_sound`
   - deduplicating `objects` while preserving per-source evidence
   - using the same flat schema as each per-image JSON; do not write `images[]`
9. Present the scene summary and object candidates. Require object approval
   only for optional extraction/model generation, not for comic bible authoring
   (scene name, short caption, environment/style/lighting/atmosphere/ambient
   sound, and object candidates with material and source-image evidence).
10. After approval, create or update one durable intent file per object:

    ```text
    worlds/<slug>/output/<object-slug>/object.json
    ```

    Use this shape:

    ```json
    {
      "schema_version": 1,
      "world": "<slug>",
      "object": {
        "id": "<object-slug>",
        "name": "<object name>",
        "description": "<literal object description>",
        "materials": [],
        "source_images": [],
        "evidence": [],
        "generate_as_3d_object": true,
        "working_dir": "worlds/<slug>/output/<object-slug>"
      },
      "updated_at": "..."
    }
    ```

11. `object.json` stores stable identity, intent, and provenance only. Do not
    write generated status, jobs, request lifecycle, or output file lists
    there. Generated outputs and request state live beside `object.json` as
    indexed visible artifacts and hidden request JSON.
12. For comic continuity, continue to `image-blast-comic-scene`. Do not
    automatically remove candidates or generate GLBs/SFX, including one-shot
    comic runs. Only use `image-blast-plate` for explicitly requested removals.
    For explicitly selected legacy 3D runs, confirm separate object extraction
    and clean-plate scope before provider calls.
13. Refresh state with:

    ```bash
    node .claude/scripts/project/project-state.mjs --world "<slug>"
    ```

14. Report saved paths, source image count, per-image JSON count,
    created/updated object directory count, and the clean plate decision.

