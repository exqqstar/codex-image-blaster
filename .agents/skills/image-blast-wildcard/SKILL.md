---
name: image-blast-wildcard
description: Discover and run arbitrary FAL operations that do not fit the narrower image-blast skills.
---

# image-blast-wildcard

Use this skill as an escape hatch for FAL models outside the standard world,
image-edit, 3D, and SFX flows.

## Instructions

This is an optional enhancement. Do not invoke it as a prerequisite for comic
scene references or merely because an API key is configured.

This skill runs in two modes:

- **Discovery mode**: normal user requests. Do not run a paid FAL request,
  call `run-fal.mjs`, or trigger any background execution until the user
  confirms the exact endpoint.
- **Execution mode**: prompts that start with
  `CONFIRMED_FAL_ENDPOINT: <endpoint>`. Do not ask for model confirmation
  again; validate inputs and run exactly one request.

1. In discovery mode, do not run paid FAL requests until the user confirms one
   exact endpoint by name (e.g. `confirm fal-ai/flux/dev`).
2. Discover candidates through the FAL Platform Model Search API (not the
   Explore page):

   ```text
   https://api.fal.ai/v1/models?q=<query>&status=active&limit=5
   https://api.fal.ai/v1/models?category=<category>&status=active&limit=5
   https://api.fal.ai/v1/models?endpoint_id=<endpoint>&expand=openapi-3.0
   ```

   Use `https://fal.ai/docs/llms.txt` and individual model API docs only as
   fallback context when the model search response is insufficient.
3. Present the best candidate endpoint(s) with category, description, and any
   relevant schema notes, then ask the user to confirm one exact endpoint.
4. After confirmation, fetch the confirmed endpoint with `expand=openapi-3.0`,
   then build schema-shaped JSON from the user's literal inputs. Use schema
   defaults for optional fields. Ask only if a required field cannot be
   inferred, a referenced local file is missing, or `FAL_KEY` is unavailable.
5. Resolve the output directory contextually: from the user's request, the
   active image-blast project/world, an input file's surrounding generated
   output directory, or another clear local workflow context. Do not use a
   dedicated wildcard directory by default. If no output location can be
   inferred, ask before execution. Use `ls -a` before reading generated state.
6. For local files, pass them with `--file <schema_key>=<path>` so the helper
   converts them to model input URLs. Use dot paths for nested keys
   (e.g. `image_urls.0`).
7. Run:

   ```bash
   node .claude/scripts/fal/run-fal.mjs \
     --endpoint "<fal endpoint>" \
     --input-json '<schema-shaped JSON input>' \
     --output-dir "<output directory>" \
     --output-slug "<short output slug>" \
     --user-prompt "<literal user request>"
   ```

   The default queue mode persists request metadata before polling and
   downloads any returned file URLs. Use `--mode run` only when the FAL API
   page requires a direct `fal.run` call instead of the queue API.
8. Repair missing local files from request metadata when needed:

   ```bash
   node .claude/scripts/project/ensure-local-assets.mjs --from "<request-json-path>"
   ```

9. Report endpoint, input summary, output directory, downloaded files, request
   metadata, and any raw result fields that were not downloadable.

