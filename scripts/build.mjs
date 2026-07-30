import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const publicDir = resolve(root, 'public');

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(resolve(root, 'index.html'), resolve(dist, 'index.html'));
await cp(resolve(root, 'src'), resolve(dist, 'src'), { recursive: true });
for (const item of await readdir(publicDir)) {
  await cp(resolve(publicDir, item), resolve(dist, item), { recursive: true });
}
await writeFile(
  resolve(dist, 'BUILD_INFO.json'),
  JSON.stringify(
    {
      version: '0.1.1',
      builtAt: new Date().toISOString(),
      mode: 'zero-dependency-vertical-slice',
      deploymentTarget: 'cloudflare-pages',
    },
    null,
    2,
  ),
);
console.log(`Built ${dist}`);
