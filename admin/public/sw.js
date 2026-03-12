const CACHE_NAME = 'seu-manel-v1';
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/flags/brasil.png',
    '/flags/escocia.png',
    '/flags/reino_unido.png',
    '/flags/mexico.png',
    '/flags/eua.png',
    '/flags/Italia 100x60.png',
    '/flags/Portugal 100x60.png',
    '/flags/franca.png',
    '/flags/holanda.png',
    '/flags/Suecia 100x60.png',
    '/flags/Bandeira Alemanha 100x60.png',
    '/flags/Espanha 100x60.png',
    '/flags/Japão 100x60.png',
    '/flags/Polonia 100x60.png',
    '/flags/Porto Rico 100x60.png',
    '/flags/Russia 100x60.png',
    '/flags/Cuba 100x60.png',
    '/flags/Austria 100x60.png',
    '/flags/África do Sul 100x60.png',
    '/flags/belgica.png',
    '/flags/Suica 100x60.png',
];

// Install: cache static assets (flags, manifest)
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch: Cache-First for images, Network-First for API
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Cloudinary images: Stale-While-Revalidate
    if (url.hostname === 'res.cloudinary.com') {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(request).then((cached) => {
                    const fetchPromise = fetch(request).then((response) => {
                        if (response.ok) {
                            cache.put(request, response.clone());
                        }
                        return response;
                    }).catch(() => cached); // fallback to cache on network error

                    return cached || fetchPromise;
                });
            })
        );
        return;
    }

    // Local static assets (flags, fonts): Cache-First
    if (url.pathname.startsWith('/flags/') || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
        event.respondWith(
            caches.match(request).then((cached) => {
                return cached || fetch(request).then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    }
                    return response;
                });
            })
        );
        return;
    }

    // Supabase API: Network-First
    if (url.hostname.includes('supabase')) {
        event.respondWith(
            fetch(request).then((response) => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                }
                return response;
            }).catch(() => caches.match(request))
        );
        return;
    }
});
