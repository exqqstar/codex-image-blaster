# Comic continuity contract (schema version 1)

JSON paths are relative to `worlds/<slug>/`, use `/`, and name local files.
Traversal, URLs and symlink escape are rejected. CLI `--image` names an actual
saved file (inside or outside the project) to copy, never a URL to fetch.

## Scene bible

`continuity/scene-bible.json`:

- `schema_version: 1`, `scene_id` matching the slug, positive integer `revision`,
  `status: draft|locked`.
- Nonempty `title`, `description`, `style`, `lighting` strings.
- `coordinate_system: right-handed-y-up-meters`: +X right, +Y up, +Z toward the
  establishing camera. Dimensions are authored interpretations, not measurements.
- `reference_images`: canonical PNG/JPEG/WebP paths. Select explicitly when
  source/ contains multiple scenes; keep originals.
- Nonempty `invariants` string array and `assumptions` string array (may be empty).
- `geometry`: boxes `{id, description, position:[x,y,z], size:[w,h,d], color}`.
  Stable IDs are lowercase hyphenated; dimensions positive; optional color is
  six-digit hex. May be empty for native references; local guides need boxes.
  Include architecture and props, even surfaces excluded by legacy object extraction.

## Camera bible

`continuity/camera-bible.json` shares version, slug, revision and status.
`action_axis` has two `[x,y,z]` endpoints distinct in the XZ plane.
`cameras` has unique records:

```json
{
  "id": "establishing", "position": [0, 1.6, 5], "target": [0, 1, 0],
  "focal_length_mm": 35, "sensor_width_mm": 36,
  "width": 960, "height": 540, "framing": "Show door, window and desk."
}
```

Rectilinear perspective uses horizontal sensor width and Y up; zero direction
and vertical look-at singularities are rejected. Resolution integers: 64..8192.
No roll, lens distortion or orthographic mode. Native images only approximate
these cameras; metadata does not prove pixel-exact rendering.

## Storyboard

`continuity/storyboard.json` shares version/slug and contains ordered `panels`.
Each has unique `id`, existing `camera_id`, nonempty `beat`, and
`continuity: {time, lighting, props:[], characters:[]}`. Props use existing
geometry IDs with optional `position`/`visible` overrides. Characters have
stable `id`, `position`, `pose`, `wardrobe`. Unlisted props retain bible positions.
Each panel describes its full state; changes are **not cumulative**. Repeat a
moved prop's position in subsequent panels if it stays moved. Characters are
prompt metadata; local guides only render boxes.

Opposite-side cuts require `axis_exception: "<intentional reason>"` on the
receiving panel. An on-axis camera is neutral and does not erase the previous
side. This catches simple 180-degree crossings, not every eye-line/story error.

## Requests, manifest and review

`plan` writes `output/references/N-reference-plan.json` and
`.N-<panel>-request.json`: full snapshots, prompt, canonical/accepted reference
paths and hashes, `planned` (native) or `completed` (local). It allocates a fresh
batch index and never invokes a native image tool or paid API.

`continuity/asset-manifest.json` contains version/slug and `assets` with ID,
role, provider, panel/camera, path, SHA-256, canon snapshot, panel state hash, request path, creation time,
and `pending-review|accepted|rejected`. Native registration records the actual
model or `unknown`; review records notes/time. Magic signatures reject common
renamed non-images but do not replace full decoding or visual inspection.
Plans alone never appear as finished assets.

Changes to bibles or canonical image bytes invalidate plans. Changes to a panel
invalidate its requests/views; appending panels preserves unchanged accepted
references. Replan affected views; old assets stay on disk. Accepted generated
views become secondary references only when canon and panel state still match.
Include approved character sheets among
canonical references when needed; metadata alone does not solve character identity.

Local guides use axis-aligned boxes, painter ordering, and omit near-plane
straddling faces. They do not model complex occlusion, illumination or hidden
surfaces. Keep cameras outside boxes; use an existing Blender/3D set for precise
reference. See [the authored example](../../../../docs/examples/study/).
