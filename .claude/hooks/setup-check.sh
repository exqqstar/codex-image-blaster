#!/bin/bash
# Legacy Claude compatibility hook; no credentials required at session start.
cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || cd "$(dirname "$0")/../.."
echo "Comic scene references/local guides require no provider keys. See AGENTS.md."
echo "World Labs and FAL are optional; configure credentials only when selected."
if [ -d worlds ]; then
  echo "Project directories: $(find worlds -mindepth 1 -maxdepth 1 -type d -printf '%f ')"
fi
exit 0
