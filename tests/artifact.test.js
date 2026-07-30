import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('PWA manifest and service worker are wired', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const manifest = JSON.parse(await readFile(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'));
  const sw = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
  assert.match(html, /manifest\.webmanifest/);
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.icons.length, 2);
  assert.match(sw, /future-court-v1/);
});

test('share flow never includes private argument in challenge module', async () => {
  const challengeSource = await readFile(new URL('../src/lib/challenge.js', import.meta.url), 'utf8');
  assert.ok(!challengeSource.includes('argumentText'));
});
