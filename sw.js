/* The Library — service worker
 * Strategy:
 *   - App shell (HTML, manifest, icons): cache-first, refreshed on update.
 *   - Google Fonts CSS + woff2: stale-while-revalidate.
 *   - Cover images (OpenLibrary/AniList/VNDB CDNs): stale-while-revalidate
 *     so they remain visible offline once you've seen them.
 *   - Search APIs (OpenLibrary search, AniList GraphQL, VNDB POST,
 *     corsproxy): bypassed entirely — always go to network.
 *
 * Bump VERSION to invalidate every old cache and re-fetch the shell.
 */

const VERSION = 'v1.0.0';
const SHELL_CACHE = `library-shell-${VERSION}`;
const RUNTIME_CACHE = `library-runtime-${VERSION}`;

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './favicon.ico',
];

// Hosts that are search APIs and should NEVER be intercepted —
// they need fresh network responses each time.
const PASSTHROUGH_HOSTS = new Set([
  'openlibrary.org',
  'graphql.anilist.co',
  'api.vndb.org',
  'corsproxy.io',
]);

// Hosts that serve cover/poster images — safe to cache opportunistically.
const COVER_HOSTS = [
  'covers.openlibrary.org',
  's4.anilist.co',
  's2.vndb.org',
  't.vndb.org',
];

const FONT_HOSTS = new Set([
  'fonts.googleapis.com',
  'fonts.gstatic.com',
]);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Never touch API calls
  if (PASSTHROUGH_HOSTS.has(url.hostname)) return;

  // Cover images: stale-while-revalidate
  if (COVER_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(req, RUNTIME_CACHE));
    return;
  }

  // Google Fonts: stale-while-revalidate
  if (FONT_HOSTS.has(url.hostname)) {
    event.respondWith(staleWhileRevalidate(req, RUNTIME_CACHE));
    return;
  }

  // Same-origin requests: cache-first with network fallback
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(req, SHELL_CACHE));
    return;
  }

  // Anything else: try network, fall back to cache
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});

async function cacheFirst(req, cacheName) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && res.ok) {
      const cache = await caches.open(cacheName);
      cache.put(req, res.clone());
    }
    return res;
  } catch (e) {
    // If we have an offline fallback for navigations, hand it back
    if (req.mode === 'navigate') {
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
    }
    throw e;
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const networkPromise = fetch(req)
    .then((res) => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || networkPromise;
}
