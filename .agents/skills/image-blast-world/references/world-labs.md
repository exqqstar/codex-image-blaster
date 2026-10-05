# Optional World Labs provider

Use only when explicitly selected. This is the preserved legacy 3D branch,
not the default comic reference workflow. Requires WORLD_LABS_API_KEY.



Use this skill to create the static environment asset set for one world.

## Instructions

1. Require a world slug.
2. Inspect `worlds/<slug>/output/world/` with `ls -a`.
3. Read `worlds/<slug>/image.json` and confirmed
   `worlds/<slug>/output/<object>/object.json` files when present.
4. Synthesize an empty-environment prompt by subtracting confirmed objects and
   explicitly removed items from the original scene description. Treat the
   prompt as a *text clean plate*:
   - Preserve original setting, materials, lighting, atmosphere, camera feel,
     and spatial layout.
   - Describe the scene as empty. Do not name, imply, or reintroduce removed
     objects.
   - Do not reuse `image.json` `short_caption` directly — it may still mention
     removed objects.
   - If the user supplies caption wording, apply the same subtraction rule
     before sending it. The World Labs prompt describes the static empty
     environment ("the plate"), not the objects that were removed.
5. Generate or resume with:

   ```bash
   node .claude/scripts/world/generate-world.mjs --world "<slug>" --prompt "<empty-environment world caption>"
   ```

   Add `--image "<path>"` only when using a specific source image other than the
   helper default. Add `--regenerate` only when the user requested a new version.
6. The script writes `N-world.json`, downloads World Labs assets, and records
   `.N-world-request.json`. The helper resumes unfinished
   `.N-world-request.json`, strips base64 before writing JSON, polls World Labs,
   writes `N-world.json`, and downloads every referenced world asset to matching
   `N-world*` files in `worlds/<slug>/output/world/`.
7. **Disk-first contract**: the frontend must only load local files from disk.
   World Labs URLs in `N-world.json` are provenance/resume data only; never
   leave `.spz`, collider `.glb`, panorama, or thumbnail assets to be loaded
   from provider URLs.
8. Before reporting success, verify every referenced `.spz`, collider, or
   panorama URL in `N-world.json` has a matching local file. If any is missing,
   repair with:

   ```bash
   node .claude/scripts/project/ensure-local-assets.mjs --from "worlds/<slug>/output/world/<N>-world.json"
   ```

9. Report the generation index, `world_json`, `.glb`, `.spz`, panorama,
   thumbnail, and request metadata paths.
