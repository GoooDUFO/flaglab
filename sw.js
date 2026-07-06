/* Offline-first service worker: precaches the app shell and every flag. */
const CACHE = 'flaglab-v2';

const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './css/style.css',
  './js/common.js',
  './js/registry.js',
  './data/flags.json',
  './games/odd-one-out/index.html',
  './games/odd-one-out/questions.js',
  './games/odd-one-out/game.js',
  './games/faked-flags/index.html',
  './games/faked-flags/game.js',
  './games/zoomed-in/index.html',
  './games/zoomed-in/game.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(CORE);
      const flags = await (await cache.match('./data/flags.json')).json();
      await cache.addAll(Object.keys(flags).map((c) => `./assets/flags/${c}.svg`));
      self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key !== CACHE) await caches.delete(key);
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    (async () => {
      const cached = await caches.match(e.request, { ignoreSearch: true });
      if (cached) return cached;
      const resp = await fetch(e.request);
      if (resp.ok && new URL(e.request.url).origin === location.origin) {
        const cache = await caches.open(CACHE);
        cache.put(e.request, resp.clone());
      }
      return resp;
    })()
  );
});
