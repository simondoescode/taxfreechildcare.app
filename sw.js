// sw.js - Service Worker for Tax-Free Childcare Calculator

const CACHE_NAME = 'tax-free-childcare-v1';

// Add the core files of your app here. 
// Note: Tailwind and Google Fonts are fetched from CDNs, so we rely on the browser's 
// native caching for those, but they will still work if the user loses connection after loading once.
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/logo.png',
    '/favicon/site.webmanifest',
    '/favicon/apple-touch-icon.png',
    '/favicon/favicon-96x96.png',
    '/favicon/favicon.ico'
];

// 1. Install Event: Triggered when the service worker is registered
self.addEventListener('install', (event) => {
    // Wait until all core assets are successfully cached
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching core assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch((err) => {
                console.error('[Service Worker] Cache addAll error:', err);
            })
    );
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

// 2. Activate Event: Clean up any old caches if you update the CACHE_NAME version
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Ensure the service worker takes control of the page immediately
    self.clients.claim();
});

// 3. Fetch Event: Intercept network requests
// Strategy: "Cache First, falling back to Network"
self.addEventListener('fetch', (event) => {
    // Only intercept GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // If the file is in the cache, return it immediately (super fast)
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // If not in cache, fetch it from the network
                return fetch(event.request).then((networkResponse) => {
                    // Optional: You could dynamically cache new assets here, 
                    // but for a static calculator, falling back to network is fine.
                    return networkResponse;
                }).catch(() => {
                    // If the network fails (user is completely offline) and it's not in cache,
                    // we can't do much, but the calculator shell will already be cached.
                    console.log('[Service Worker] Fetch failed; returning offline page instead.');
                });
            })
    );
});
