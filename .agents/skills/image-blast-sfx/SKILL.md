---
name: image-blast-sfx
description: Generate world ambience, object impact sounds, or custom sound effects through the FAL ElevenLabs SFX endpoint.
---

# image-blast-sfx

Use this skill for one sound request.

## Instructions

This is an optional enhancement. Do not invoke it as a prerequisite for comic
scene references or merely because an API key is configured.

1. Require a world slug and one clear SFX target.
2. Inspect relevant output directories with `ls -a`.
3. Choose one mode:
   - World ambience: output to `worlds/<slug>/output/sfx/`, use
     `--loop --count 2 --kind world-ambience --prefix ambient-loop --duration-seconds 10`.
   - Object impact: output to `worlds/<slug>/output/<object-id>/sfx/`, use
     `--count 4 --kind object-impact --prefix impact-<object-id> --duration-seconds 1`.
   - Custom SFX: output to the world SFX directory unless an object is clearly
     specified, use `--kind arbitrary`.
4. Build literal prompts:
   - World ambience: `ambient environment, loop of <ambient qualities from image.json>`.
   - Object impact: `impact one-shot, short-decay, <object material description> hitting a hard surface`.
   - Custom: keep it short, literal, and isolated.
5. Run:

   ```bash
   node .claude/scripts/sfx/fal-elevenlabs-sfx.mjs \
     --prompt "<sound prompt>" \
     --output-dir "<target output dir>" \
     --prefix "<safe prefix>" \
     --count "<1-4>" \
     --kind "<world-ambience|object-impact|arbitrary>" \
     --duration-seconds "<optional 0.5-22>" \
     --postprocess true
   ```

   - Add `--loop` only for ambience or explicit loop requests.
   - Avoid music or voices unless explicitly requested.
   - For non-loop output the script runs `ffprobe`/`ffmpeg` to trim
     leading/trailing silence, normalize loudness, and store `audio_analysis`
     in the hidden request JSON. Loop output is left as raw provider audio so
     the seamless boundary is preserved — that is why ambience uses `--loop`.
6. Repair missing local audio files from request metadata when needed:

   ```bash
   node .claude/scripts/project/ensure-local-assets.mjs --from "<request-json-path>"
   ```

7. Report generated audio files, loop status, request metadata, prompt, and
   trimming/quality notes from `audio_analysis`.

