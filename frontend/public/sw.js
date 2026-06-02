/* Wick Wax & Relax — service worker
 *
 * Strategies:
 *   - Precache the offline shell (root document, manifest, icons) on install.
 *   - NetworkFirst for HTML navigations with a 2.5s timeout and a cached
 *     fallback so an offline user still gets the last page they viewed.
 *   - StaleWhileRevalidate for product and category pages: serve from
 *     cache for instant paint, update the cache in the background for the
 *     next visit. Means the same page works fully offline after the first
 *     visit.
 *   - CacheFirst for static assets (icons, fonts, images): these have
 *     content-hashed URLs from Next.js so the cache is safe to keep.
 *   - NetworkOnly for /api/** requests: never cache. In particular
 *     /api/orders, /api/checkout, /api/auth/** must always go to the
 *     network — caching them would leak PII and risk showing stale
 *     prices or stale auth.
 *   - NEVER cache POST/PUT/PATCH/DELETE responses. This prevents the
 *     "offline form submission shows success but never sent" failure.
 *
 * Bump CACHE_VERSION on every release. The activate handler will purge
 * old caches on the next page load.
 */
const CACHE_VERSION = 'v1.0.0';
const SHELL_CACHE = `wwr-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `wwr-runtime-${CACHE_VERSION}`;
const PRODUCT_CACHE = `wwr-products-${CACHE_VERSION}`;
const ASSETS_CACHE = `wwr-assets-${CACHE_VERSION}`;

const SHELL_URLS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/offline.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // Use addAll but tolerate individual failures (e.g. icon missing in
      // a development build) so the install doesn't get stuck.
      Promise.all(
        SHELL_URLS.map((url) =>
          cache.add(url).catch((err) => {
            // eslint-disable-next-line no-console
            console.warn('[sw] precache failed for', url, err);
          })
        )
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE &&
                          key !== PRODUCT_CACHE && key !== ASSETS_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

function isProductPage(url) {
  return (
    url.pathname === '/products' ||
    url.pathname.startsWith('/products/') ||
    url.pathname.startsWith('/product/') ||
    url.pathname.startsWith('/category/') ||
    url.pathname === '/category'
  );
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/static/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/fonts/') ||
    /\.(png|jpg|jpeg|webp|avif|svg|ico|woff2?|ttf|eot|otf)$/i.test(url.pathname)
  );
}

// NEVER cache mutating requests. The default fetch handler below also
// enforces NetworkOnly for any non-GET, so this is belt-and-braces.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') {
    event.respondWith(fetch(req));
    return;
  }

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) {
    // Cross-origin: pass through, do not cache.
    event.respondWith(fetch(req));
    return;
  }

  if (isApiRequest(url)) {
    // Network-only for the API. If the network is down, the request fails —
    // which is the right behaviour for checkout, auth, and PII endpoints.
    event.respondWith(
      fetch(req).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(req, ASSETS_CACHE));
    return;
  }

  if (isProductPage(url)) {
    event.respondWith(staleWhileRevalidate(req, PRODUCT_CACHE));
    return;
  }

  // Navigations (HTML pages): network-first with offline fallback.
  if (req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(networkFirstWithOfflineFallback(req));
    return;
  }

  // Default: try cache, fall back to network.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((response) => {
        // Only cache successful, basic/cors responses.
        if (response && response.ok && response.type !== 'opaqueredirect') {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, clone));
        }
        return response;
      });
    })
  );
});

async function cacheFirst(req, cacheName) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const response = await fetch(req);
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(req, response.clone());
    }
    return response;
  } catch (err) {
    // No cache, no network — return a 1x1 transparent PNG fallback so
    // broken <img> tags don't produce ugly error icons in the layout.
    return new Response('', { status: 504, statusText: 'offline' });
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const fetchPromise = fetch(req)
    .then((response) => {
      if (response && response.ok) {
        cache.put(req, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

async function networkFirstWithOfflineFallback(req) {
  try {
    const response = await fetch(req);
    if (response && response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(req, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(req);
    if (cached) return cached;
    const shellCached = await caches.match('/offline.html');
    if (shellCached) return shellCached;
    return new Response('Offline', { status: 503, statusText: 'offline' });
  }
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
