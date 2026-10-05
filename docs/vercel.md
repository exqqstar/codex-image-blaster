# Vercel deployment

Connect this repository with **Root Directory `.`** (the repository root), so
both the `app` workspace and the sibling `worlds/corridor` directory are available.
The root `vercel.json` configures:

- Install: `bun install --frozen-lockfile`
- Build: `bun run build && node scripts/prepare-vercel-assets.mjs`
- Output: `app/dist`
- SPA rewrites for `/corridor` and its nested routes.

Commit and push `vercel.json`, `scripts/prepare-vercel-assets.mjs`, `.gitignore`,
`worlds/corridor/project.json`, and the visible files in
`worlds/corridor/output/world/` before connecting Vercel. These corridor files
are explicitly unignored; other generated worlds and hidden provider request
metadata remain ignored. No Git LFS is required for these files.

The Vite plugin embeds the project and local asset URLs at build time. The
deployment script validates and copies the existing corridor assets into
`app/dist/worlds/corridor/`. It never calls a generation provider.
No World Labs or FAL credentials are required to build or view this static world.
The deployed assets are publicly downloadable to visitors of the deployment.

After deployment, open `https://<deployment-domain>/corridor`. Verify the collider,
panorama, thumbnail, and four SPZ files under `/worlds/corridor/output/world/`
return successful responses. Static deployment supports viewing; development
server APIs such as saving scene edits are unavailable.
