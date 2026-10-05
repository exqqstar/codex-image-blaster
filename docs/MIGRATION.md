# Migration from the world-first adapter

## Existing projects

No destructive migration. Keep `project.json`, `image.json`, `scene.json`,
`source/`, `output/world/`, per-object folders and hidden provider requests.
Existing splats/GLBs/SFX and viewer routes remain valid. `scene.json` remains
viewer placement; never rename it to scene-bible.json.

Run `comic-scene.mjs init --world <existing-slug>` from the repository root.
It adds missing `continuity/` files and `output/references/`, preserving existing
bibles/manifests. It seeds description/style/lighting from analysis if present
and lists original indexed raster images. Review those references explicitly,
author the geometry and cameras, record uncertainty, and lock both bibles.
Initialization does not convert a splat to an exact floor plan.

## Changed defaults

- `image-blast-world` now prepares scene references; select World Labs explicitly
  to retain the old 3D behavior.
- `.env` is optional; remove unused placeholder keys. Existing valid keys can
  remain but do not enable calls automatically.
- Uncover does not trigger GLB/SFX generation. Furniture and fixed architecture
  remain continuity anchors. An object candidate is not authorization to model it.
- Native edits/clean plates are preferred; preserved FAL scripts still work when
  explicitly chosen and require FAL_KEY.
- Test/CI no longer require dummy keys. Node handles the new helper; npm can run
  the viewer with the committed app lockfile. Existing Bun commands remain.
- Legacy CLI entrypoint guards now use file URLs correctly on Windows as well
  as POSIX; generation algorithms and provider payloads remain unchanged.

## New files and revision policy

Continuity: scene bible, camera bible, ordered storyboard, asset manifest.
Reference output: indexed image/SVG, reference plan, hidden request snapshot.
Review via generated `reference-gallery.html`. Increment bible revisions when
canon/cameras change; replan after changes. Old outputs remain and cannot be
accepted under a different snapshot. Never treat a native prompt plan or a
local box guide as a generated final comic image.

No API/model download is needed for the local demo in `docs/examples/study/`.
Native tool end-to-end and paid provider behavior require their real runtime;
offline tests verify the handoff and disk protocol, not image quality or billing.
