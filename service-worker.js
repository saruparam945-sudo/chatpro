/* ChatPro service worker — v2026.11.27.2
   Network-first for HTML navigation; offline fallback uses the last successful shell.
   Other requests pass through to the network and are not cached here.
*/
const CACHE_PREFIX = 'chatpro-shell-';
const CACHE_NAME = CACHE_PREFIX + 'v2026.11.27.2';
const APP_SHELL = '/chatpro/index.html';

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(APP_SHELL, { cache: 'reload' });
      if (response && response.ok) await cache.put(APP_SHELL, response);
    } catch (_) {}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Always try the network first for the app document; use cached HTML only offline.
  if (request.mode === 'navigate' || url.pathname === APP_SHELL || url.pathname === '/chatpro/') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const fresh = await fetch(request, { cache: 'no-store' });
        if (fresh && fresh.ok) await cache.put(APP_SHELL, fresh.clone());
        return fresh;
      } catch (error) {
        const fallback = await cache.match(APP_SHELL);
        if (fallback) return fallback;
        throw error;
      }
    })());
  }
});
