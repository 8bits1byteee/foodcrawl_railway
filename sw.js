/*
 * Service Worker for Estancia Food Crawl PWA.
 *
 * Important on localhost/dev:
 * - Do NOT cache dynamic PHP/API responses, otherwise stale HTML/JSON can
 *   reappear after idle periods or after deployments.
 * - Cache only static assets for fast loads.
 */

const STATIC_CACHE = 'foodcrawl-static-v3';

// Static assets to pre-cache.
// Intentionally excludes './' and './index.php' to avoid serving stale pages.
const APP_SHELL = [
  './css/style.css',
  './js/script.js',
  './android-chrome-192x192.png',
  './android-chrome-512x512.png',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isPhp = url.pathname.endsWith('.php');
  const isApi = url.pathname.startsWith('/api/') || url.pathname.includes('/api/');
  const isDocument = request.mode === 'navigate' || request.destination === 'document';

  // Dynamic content must always come from network to prevent stale admin/user data.
  if (isPhp || isApi || isDocument) {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(() => {
        // No cached fallback for dynamic requests.
        if (isApi) {
          return new Response(
            JSON.stringify({ success: false, message: 'You are offline. Please reconnect and try again.' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response('Offline. Please reconnect and refresh.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      })
    );
    return;
  }

  // Static assets: cache-first, then update cache in background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });

      return cached || networkFetch;
    })
  );
});
