import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('PWA manifest and root-scoped service worker are wired', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  const manifest = JSON.parse(await readFile(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'));
  const sw = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
  assert.match(html, /href="\/manifest\.webmanifest"/);
  assert.match(html, /href="\/icons\/icon-192\.png"/);
  assert.match(app, /serviceWorker\.register\('\/sw\.js'\)/);
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.icons.length, 2);
  assert.match(sw, /future-court-v2/);
  assert.match(sw, /'\/manifest\.webmanifest'/);
});

test('Cloudflare security headers are defined', async () => {
  const headers = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');
  assert.match(headers, /X-Frame-Options: DENY/);
  assert.match(headers, /X-Content-Type-Options: nosniff/);
  assert.match(headers, /Content-Security-Policy:/);
  assert.match(headers, /\/sw\.js[\s\S]*Cache-Control: no-cache/);
});

test('share flow never includes private argument in challenge module', async () => {
  const challengeSource = await readFile(new URL('../src/lib/challenge.js', import.meta.url), 'utf8');
  assert.ok(!challengeSource.includes('argumentText'));
});
