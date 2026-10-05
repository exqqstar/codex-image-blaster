# Verification — 2026-10-05

Local Windows verification used Node 24.19.0. CI targets Node 22 on Linux.

| Check | Result |
| --- | --- |
| `node --test tests/*.test.mjs` | 13 passed; no provider keys |
| `npm run test --prefix app` | 15 passed across 5 files |
| TypeScript (`tsc --noEmit` inside app build) | Passed |
| `npm run build --prefix app` | Passed |
| 9 Codex Skill frontmatter/format validators | Passed |
| Changed legacy/new CLI syntax checks | Passed |
| `git diff --check` | Passed |
| Clean install from synchronized app npm lockfile | Passed (`--ignore-scripts --no-audit --no-fund` locally) |
| Local three-camera guide/gallery smoke run | 3 SVGs rendered; all images loaded in browser; no horizontal overflow in observed viewport |

Continuity tests cover actual CLI execution without keys, non-overwriting init,
fresh artifact indices, draft rejection, native planning vs real-file registration,
reference hashes, acceptance/rejection, stale bible/canon/panel detection,
appending panels without losing accepted references, axis crossing, unknown
props, invalid/duplicate cameras/panels, path traversal and symlink escapes,
file tampering, perspective focal-length math and explicit missing World Labs key.

The native image test uses a real tiny PNG fixture to validate disk handoff. It
does **not** claim that a native model generated that fixture. No native image
generation quality evaluation or paid World Labs/FAL call was performed. Those
branches require the actual runtime, references, credentials and authorized spend.
The local composition guide is deliberately authored geometry, not reconstructed
artwork. SVG limitations are documented in the skill contract.

The existing 3D viewer build warns about stale Browserslist data and a large
main JavaScript chunk (about 8.77 MB before gzip). These warnings remain visible;
viewer performance optimization is outside the continuity change.

The original app lockfile was inconsistent with app/package.json and failed
`npm ci`. It was synchronized without adding new application dependencies;
subsequent clean installation succeeded.
