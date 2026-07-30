import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const item of ['index.html', 'src', 'public']) await cp(resolve(root, item), resolve(dist, item), { recursive: true });
await writeFile(resolve(dist, 'BUILD_INFO.json'), JSON.stringify({ version: '0.1.0', builtAt: new Date().toISOString(), mode: 'zero-dependency-vertical-slice' }, null, 2));
console.log(`Built ${dist}`);
