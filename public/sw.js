const CACHE_NAME = 'art-album-v3';
const BASE_PATH = '/ART-APP/';
const STATIC_ASSETS = [
    BASE_PATH,
    BASE_PATH + 'index.html',
    BASE_PATH + 'manifest.json',
    BASE_PATH + 'icons/icon-192.svg',
    BASE_PATH + 'icons/icon-512.svg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            await cache.addAll(STATIC_ASSETS);

            // Vite gives production assets hashed filenames. Read the built
            // index so those exact JS and CSS files are available offline.
            const indexResponse = await fetch(BASE_PATH + 'index.html', { cache: 'reload' });
            if (!indexResponse.ok) return;

            const html = await indexResponse.text();
            const assetUrls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
                .map((match) => new URL(match[1], self.location.origin))
                .filter((url) => (
                    url.origin === self.location.origin &&
                    url.pathname.startsWith(BASE_PATH + 'assets/')
                ))
                .map((url) => url.href);

            await cache.addAll(assetUrls);
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch event - refresh pages from the network and cache static assets
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip external requests (fonts, CDN)
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    }
                    return response;
                })
                .catch(async () => (
                    await caches.match(event.request) ||
                    await caches.match(BASE_PATH + 'index.html')
                ))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then(async (cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            const response = await fetch(event.request);
            if (response && response.status === 200) {
                const copy = response.clone();
                const cache = await caches.open(CACHE_NAME);
                await cache.put(event.request, copy);
            }
            return response;
        })
    );
});
