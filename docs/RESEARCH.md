# Research and implementation decisions

Checked 2026-10-05 against the cloned adapter and current primary sources.

- [Upstream image-blaster](https://github.com/neilsonnn/image-blaster): preserve
  provider scripts, disk-first assets and optional 3D viewer rather than replace
  their generation protocol. The adapter's existing env test/CI treated provider
  keys as mandatory even for local behavior; those tests now verify optionality.
- [OpenAI imagegen skill](https://github.com/openai/skills/blob/main/skills/.system/imagegen/SKILL.md):
  prefer the native image tool when exposed, inspect edit targets, preserve
  invariants, and save actual outputs non-destructively. A Node helper prepares
  requests and records files; it cannot invoke an absent session tool. No paid
  OpenAI API fallback or fabricated Images 2.5 selector was added.
- [Skills concept](https://developers.openai.com/plugins/concepts/skills): retain
  SKILL.md folders with focused descriptions and supporting scripts/references.
  New detailed data rules live beside the comic-scene skill, not in every skill.
- [World Labs quickstart](https://docs.worldlabs.ai/api) and
  [official examples](https://github.com/worldlabsai/worldlabs-api-examples):
  generation is a distinct API operation with credentials and asynchronous
  polling. Keep the existing branch explicit/resumable; do not call it during
  native/local reference planning. Provider models/prices are not changed here.
- [ComfyUI](https://github.com/Comfy-Org/ComfyUI): a local image backend is possible
  but has separate model/runtime/GPU setup. This change integrates no universal
  ComfyUI graph or automatic heavyweight download. Authors can use an existing
  local backend with exported prompts, then native registration remains reserved
  for native tool outputs. Local deterministic perspective guides run immediately.

Design inference: scene/camera canon plus per-panel state and reviewed reference
provenance is better suited to sequential comic production than requiring a new
splat world first. This is a support workflow, not a guarantee that a generative
model preserves every landmark across viewpoints. Explicit uncertainty and visual
review remain part of the contract.
