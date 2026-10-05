# Pipeline

Default: source → analysis → scene/camera bibles → ordered storyboard → native
image requests or local composition guides → real files → continuity review.
This uses the existing `worlds/<slug>/` envelope; the additive continuity layer
does not change viewer `scene.json`, object intent or World Labs formats.

1. `image-blast-project` stages input and reports existing state.
2. `image-blast-uncover` analyzes source images without converting all objects.
3. `image-blast-comic-scene` authors canon, cameras and panel state. Lock bibles
   only after establishing layout; note unseen geometry as assumptions.
4. `image-blast-world` routes to this reference workflow by default. `plan`
   snapshots bibles and reference hashes. `codex` writes prompts only; `local`
   renders SVG box guides with the specified perspective cameras.
5. Codex invokes its actual native tool, views real output, and uses `register`
   to copy images into `output/references/` with model/provenance/hashes.
6. `review` records accepted/rejected status and notes. `gallery` creates local
   `reference-gallery.html`. Accepted native views can support a subsequent plan
   while original canonical images stay in the reference chain.

See the [schema/command contract](../.agents/skills/image-blast-comic-scene/references/contract.md)
and [authored local example](examples/study/). Each panel's prop state is explicit
and noncumulative. Axis checks catch simple 180-degree crossings; image/tool
success is not proof of visual continuity. Bible/canonical changes require a new
plan; panel state edits invalidate affected views. Appending panels preserves
unchanged references. Old assets remain and the gallery labels stale layouts.

## Optional branches

- Clean plate: remove only requested content with native editing, or explicit FAL.
- World Labs: explicit selection, WORLD_LABS_API_KEY, preserved
  `.claude/scripts/world/generate-world.mjs`, disk-first `output/world/`.
  Use its existing resume metadata and ensure-local-assets repair helper.
- GLB/OBJ: `image-blast-3d` for selected objects only; FAL-backed providers.
- Audio: `image-blast-sfx` only if requested.

Existing 3D worlds still open in the Three.js viewer. Comic references use the
local gallery; neither splats nor a browser/WebGL stack is needed to author
bibles or run the local guide provider.
