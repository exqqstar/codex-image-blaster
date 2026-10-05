---
name: image-blast-plate
description: Create a clean plate for explicitly requested removals using native Codex editing, with optional FAL fallback.
---

# image-blast-plate

## Instructions

1. Inspect the source image and output directory, including hidden metadata.
   Require an actual input image and a specific edit/removal instruction.
   Comic scenes preserve furniture/landmarks except explicit requested removals.
2. Prefer the session's native Codex image editing tool. Use Images 2.5 if
   explicitly selectable; otherwise use the latest available native capability.
   Follow the tool's actual interface, inspect local targets before editing,
   state invariants and requested changes, and save real output non-destructively.
   Do not claim a model version that the tool did not report.
3. Use `node .claude/scripts/project/indexed-path.mjs` to allocate an indexed
   output/request path (see its usage). Native outputs must be copied to local
   project files. Store provider/model (or unknown), prompt, input paths and
   output path beside the file in hidden request JSON; never store credentials.
   For panel references use comic-scene's register/review instead.
4. If native tools are unavailable, report pending editing. Do not silently
   choose a paid fallback. For explicitly selected FAL, read
   [legacy provider instructions](references/fal.md); the preserved
   `node .claude/scripts/image-edit/generate-edit.mjs` requires FAL_KEY.
5. Inspect the actual output, check requested changes/invariants and report
   real image and metadata paths. A prompt or successful API submission is
   not a finished clean plate.
