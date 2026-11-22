// Офлайн-режим Kulak Kombat: игра открывается без интернета,
// а при наличии сети тихо подтягивает свежую версию к следующему запуску.
const CACHE = 'kk-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === 'navigate';
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const key = isPage ? './index.html' : req;
      const cached = await cache.match(key, { ignoreSearch: true });
      const fresh = fetch(req).then(res => {
        if (res && res.ok) cache.put(key, res.clone());
        return res;
      }).catch(() => null);
      // Страница: сначала сеть (свежая версия), без сети — из кэша.
      if (isPage) return (await fresh) || cached || Response.error();
      // Остальное: сразу из кэша, обновление в фоне.
      return cached || (await fresh) || Response.error();
    })
  );
});
