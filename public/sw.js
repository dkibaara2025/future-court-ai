const CACHE = 'future-court-v1';
const SHELL = [
  '/',
  '/index.html',
  '/src/app.js',
  '/src/styles.css',
  '/src/domain/case.js',
  '/src/domain/scoring.js',
  '/src/lib/challenge.js',
  '/src/lib/storage.js',
  '/public/manifest.webmanifest',
  '/public/icons/icon-192.png',
  '/public/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match('/index.html'))),
  );
});
