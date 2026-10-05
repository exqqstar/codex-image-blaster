import { cp, mkdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'worlds/corridor');
const destination = path.join(root, 'app/dist/worlds/corridor');
const project = JSON.parse(await readFile(path.join(source, 'project.json'), 'utf8'));
const world = JSON.parse(await readFile(path.join(source, 'output/world/0-world.json'), 'utf8'));
if (project.slug !== 'corridor' || !world.assets) throw new Error('Missing corridor metadata');
const required = [
  '0-world.glb', '0-world-pano.png', '0-world-thumbnail.webp',
  ...Object.keys(world.assets.splats.spz_urls).map(key => `0-world-${key}.spz`),
];
for (const name of required) {
  const info = await stat(path.join(source, 'output/world', name));
  if (!info.isFile() || !info.size) throw new Error(`Missing corridor asset: ${name}`);
}
await mkdir(destination, { recursive: true });
await cp(path.join(source, 'project.json'), path.join(destination, 'project.json'));
await cp(path.join(source, 'output/world'), path.join(destination, 'output/world'), {
  recursive: true,
  filter: file => !path.basename(file).startsWith('.'),
});
console.log(`Copied corridor metadata and ${required.length} generated assets to app/dist/worlds/corridor`);
