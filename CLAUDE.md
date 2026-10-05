# Compatibility note

This file describes the legacy Claude 3D workflow. For the Codex comic-scene
workflow, follow AGENTS.md and .agents/skills/. No provider key is required
for local references. Legacy provider instructions apply only when selected.

See [AGENTS.md](AGENTS.md) for the project contract. Codex Image Blaster uses
`AGENTS.md` and `.agents/skills/` as the orchestration layer. The original
`.claude/scripts/` provider scripts remain the generation backend and can still
be driven from Claude Code if desired.
