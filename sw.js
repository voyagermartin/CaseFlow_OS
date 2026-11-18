// CaseFlow OS - Service Worker (PWA)
const CACHE_NAME = 'caseflow-v3.5.0';

// Essential assets to precache on install
const PRECACHE_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './logo.jpg',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/icon-maskable-192.png',
    './icons/icon-maskable-512.png',
    './icons/apple-touch-icon.png',
    './icons/favicon-32.png',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.11/index.global.min.js',
    'https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.11/locales-all.global.min.js',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Domains that must ALWAYS bypass cache to ensure real-time accuracy and prevent API stalling
const BYPASS_DOMAINS = [
    'supabase.co',
    'script.google.com',
    'script.googleusercontent.com'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                // Use Promise.allSettled so CDN transient errors don't fail SW installation
                return Promise.allSettled(
                    PRECACHE_ASSETS.map((url) =>
                        cache.add(url).catch((err) => {
                            console.warn('[SW] Precache failed for:', url, err);
                        })
                    )
                );
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // 1. Only handle GET requests
    if (request.method !== 'GET') {
        return;
    }

    // 2. Bypass Supabase APIs, WebSockets, and GAS Web Apps completely
    const isBypassDomain = BYPASS_DOMAINS.some((domain) => url.hostname.includes(domain));
    if (isBypassDomain || url.protocol === 'ws:' || url.protocol === 'wss:') {
        return;
    }

    // 3. Navigation requests (HTML document): Network-First, fallback to Cache
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return networkResponse;
                })
                .catch(async () => {
                    const cachedResponse = await caches.match(request);
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return caches.match('./index.html') || caches.match('/');
                })
        );
        return;
    }

    // 4. Static assets (Images, CSS, JS, Fonts): Stale-While-Revalidate
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            const fetchPromise = fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return networkResponse;
                })
                .catch((err) => {
                    // Network failed, if no cache either, let it fail gracefully
                    return null;
                });

            return cachedResponse || fetchPromise;
        })
    );
});

// Support manual skip waiting trigger from UI
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
