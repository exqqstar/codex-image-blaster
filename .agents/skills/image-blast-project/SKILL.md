---
name: image-blast-project
description: Create, inspect, and manage an image-blaster project envelope in the worlds directory. Use before other image-blast skills or whenever the user asks about project state.
---

# image-blast-project

Use this skill to create or inspect a scene project without starting paid
generation.

## Instructions

1. Resolve the project slug. If the user provides an existing `worlds/<slug>`
   directory or slug-like name, use it. Otherwise derive a lowercase hyphenated
   slug from the request.
2. Inspect generated directories with `ls -a` before reading JSON.
3. Create or refresh project state with:

   ```bash
   node .claude/scripts/project/project-state.mjs --world "<slug>" --stage-input
   ```

   The helper creates and validates this envelope:

   ```text
   worlds/<slug>/
     project.json
     scene.json
     image.json
     source/
       <image-name>.json
     output/
       world/
       sfx/
       <object-slug>/
   ```

   Only minimal `project.json` and directories are created automatically. The
   `image-blast-uncover` skill writes per-image `source/<image-name>.json`
   and root `image.json`, then waits for user confirmation before writing
   per-object `output/<object-slug>/object.json` files.

4. Report the printed state:
   - project slug and display name
   - moved files from `input/`
   - source image count
   - source analysis count
   - whether `image.json` exists
   - object counts
   - whether world output exists
   - whether SFX exists
   - whether `scene.json` exists
5. If source images exist and `image.json` is missing, continue with the
   `image-blast-uncover` skill. If there are no source images, report the
   absolute `input/` path and ask the user to add images.

6. Recommend downstream skills only after no-cost setup/analysis is
   complete, in this order:
   - `image-blast-plate` for clean plate/source cleanup after object
     confirmation, when requested or one-shotting.
   - `image-blast-comic-scene` for scene/camera bibles and consecutive panel references.
   - `image-blast-world` for native/local scene references; World Labs only if explicitly selected.
   - `image-blast-3d` for explicitly requested optional object models.
   - `image-blast-sfx` for explicitly requested optional audio.
   - `image-blast-image-edit` for generic standalone prompt-based image edits.

Do not call provider generation scripts from this skill.


For comic scenes, clean plates and object confirmation are not prerequisites.
Preserve furniture/props as canon; continue through the comic-scene skill.
