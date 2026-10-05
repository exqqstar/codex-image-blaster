# Explicit FAL image editing

Requires FAL_KEY; may incur provider charges.

## Legacy FAL instructions

1. Require a world slug.
2. Inspect `worlds/<slug>/source/` and `worlds/<slug>/output/` with `ls -a`.
3. Select the source image from the user request or the newest visible source
   image in `worlds/<slug>/source/`.
4. Build one removal-only prompt from confirmed object names
   (`worlds/<slug>/output/<object>/object.json`; use `object.name`, adding
   short details from `object.description` when needed) plus any extra user
   removal instructions.
   - **Keep the prompt removal-only**: name what to remove. Do not list
     objects or scene features to keep, and do not add fill-in/background
     repair instructions unless the user explicitly asked for that wording.
   - **One pass only**: remove all requested content in a single image edit.
     Do not split removals across multiple calls or one edit per object.
5. Generate the plate in the source directory:

   ```bash
   node .claude/scripts/image-edit/generate-edit.mjs \
     --image "<selected source image path>" \
     --prompt "remove the following from the image: <confirmed object names and user removals>" \
     --output-dir "worlds/<slug>/source" \
     --role plate \
     --output-slug "<source-slug>-plate"
   ```

6. The output must use the next visible source index, such as
   `1-room-plate.png`, not `0-room-plate.png`.
7. Optional provider override: `--provider nano-banana|gpt-image-2`.
8. Repair missing local image files from request metadata when needed:

   ```bash
   node .claude/scripts/project/ensure-local-assets.mjs --from "<request-json-path>"
   ```

9. Refresh project state:

   ```bash
   node .claude/scripts/project/project-state.mjs --world "<slug>"
   ```

10. Report input image, output plate image, request metadata, and prompt used.
