---
name: image-blast-3d
description: Generate one atomic 3D object from an approved object.json or direct source image.
---

# image-blast-3d

Use this skill to generate exactly one object model.

## Instructions

This is an optional enhancement. Do not invoke it as a prerequisite for comic
scene references or merely because an API key is configured.

1. Require a world slug and one clear object id/name. If ambiguous, ask for one
   atomic physical object.
2. Inspect `worlds/<slug>/output/<object>/` with `ls -a`.
3. Resolve the object from `object.json`, `image.json`, or source analysis JSON.
4. If no `object.json` exists and the object is clear, create the minimal
   durable object intent before generation:

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

   Preserve available `description`, `materials`, `source_images`, and
   `evidence`. Do not write generated status, jobs, file lists, or request
   lifecycle into `object.json`.
5. Build an object-specific extraction prompt that isolates one physical object:

   ```text
   Isolate the <target object> from this image. Reproduce it exactly as shown -- same colors, materials, and proportions. White background, centered, tight crop, studio lighting. No other objects, no scene, no people, no text, no shadows on the ground. Isolate the object and remove all clustered, adjacent, overlapping, or items resting on the target object. Create a clean render of that one single object that is true to the source image.
   ```

   **The prompt must ask for one atomic physical instance only** — not a pair,
   set, cluster, category example, or adjacent duplicate. If the source
   contains similar objects, identify the target by location and exclude the
   others.
6. Generate with:

   ```bash
   node .claude/scripts/asset-pipeline/generate-single-asset.mjs --world "<slug>" --object-id "<object-id>" --image-edit-prompt "<object-specific extraction prompt>"
   ```

7. Hunyuan is the default provider with defaults `--face-count 50000`
   (range `40000-1500000`), `--enable-pbr true`, `--generate-type Normal`.
   Use `--provider meshy` only when the user asks for Meshy. Pass any of
   `--face-count`, `--generate-type Normal|LowPoly|Geometry`,
   `--polygon-type triangle|quadrilateral` (LowPoly only),
   `--enable-pbr true|false`, or Meshy-specific flags only when the user
   asks for that detail/topology.
8. Use `--reference-only` for iterative reference refinement (stops after
   the image-edit step). Later runs reuse the latest reference PNG by
   default, including `--regenerate`. Use `--regenerate-reference` only when
   the user asks for a fresh extraction from the source image.
9. Repair missing local files from request metadata when needed:

   ```bash
   node .claude/scripts/project/ensure-local-assets.mjs --from "<request-json-path>"
   ```

10. Report object id, output directory, reference image, generated model files,
    and request metadata.

