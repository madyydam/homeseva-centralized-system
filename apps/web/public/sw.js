// HomeSeva Enterprise ERP Service Worker v1.6
const CACHE_NAME = 'homeseva-erp-v1.6';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Chrome PWA requires a fetch event handler to qualify for installability
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Let browser handle API calls and navigations naturally with network first
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((cached) => {
        return cached || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});
