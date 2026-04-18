/* ==========================================================================
   PEGASUS PWA SERVICE WORKER - v3.4 (CACHE SANITY PATCH)
   Protocol: Network-First for Code, Cache-First for Media, Zero-Zombie
   Status: FINAL STABLE | FIXED: MOBILE ROUTING + CLEAN ACTIVATE + VERSION BUMP
   ========================================================================== */

const CACHE_NAME = 'pegasus-shield-v3.4-DYNAMIC';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './mobile.html',
    './mobile/mobile.html',
    './style.css',
    './app.js',
    './data.js',
    './manifest.js',
    './cloudSync.js',
    './dragDrop.js',
    './extensions.js',
    './dietAdvisor.js',
    './metabolicEngine.js',
    './weather.js',
    './weightTracker.js',
    './gallery.js',
    './protcrea.js',
    './cardio.js',
    './partner.js',
    './muscleProgress.js',
    './debug.js',
    './settings.js',
    './inventory.js',
    './aiHandler.js',
    './voice.js',
    './videos/beep.mp3'
];

/* =========================
   INSTALL
========================= */
self.addEventListener('install', (event) => {
    self.skipWaiting();

    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            console.log('🛡️ SW: Shielding Pegasus Assets...');
            let downloaded = 0;

            for (const url of ASSETS_TO_CACHE) {
                try {
                    const response = await fetch(url, { cache: 'no-cache' });
                    if (!response.ok) throw new Error(`Bad response status: ${response.status}`);
                    await cache.put(url, response.clone());

                    downloaded++;

                    const allClients = await self.clients.matchAll({ includeUncontrolled: true });
                    allClients.forEach(client => {
                        client.postMessage({
                            type: 'CACHE_PROGRESS',
                            percent: Math.round((downloaded / ASSETS_TO_CACHE.length) * 100)
                        });
                    });
                } catch (err) {
                    console.warn(`SW: Failed to cache asset: ${url}`, err);
                }
            }

            console.log('✅ SW: Asset shielding complete.');
        })()
    );
});

/* =========================
   ACTIVATE
========================= */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();

            await Promise.all(
                keys.map(key => {
                    if (key.startsWith('pegasus-shield') && key !== CACHE_NAME) {
                        console.log(`🧹 SW: Purging old cache: ${key}`);
                        return caches.delete(key);
                    }
                    return Promise.resolve();
                })
            );

            await self.clients.claim();
            console.log('✅ SW: Clients claimed.');
        })()
    );
});

/* =========================
   FETCH ENGINE
========================= */
self.addEventListener('fetch', (event) => {
    if (!event.request.url.startsWith('http')) return;

    const url = new URL(event.request.url);
    const cleanUrl = url.origin + url.pathname;

    // API / cloud bypass
    if (
        url.hostname.includes('jsonbin.io') ||
        url.hostname.includes('googleapis.com') ||
        url.hostname.includes('emailjs.com')
    ) {
        return;
    }

    const isMediaAsset = cleanUrl.match(/\.(mp4|mp3|png|jpg|jpeg|svg|woff2|gif|webp)$/i);

    if (isMediaAsset) {
        // CACHE-FIRST for media
        event.respondWith(
            caches.match(event.request, { ignoreSearch: true }).then((cachedRes) => {
                if (cachedRes) return cachedRes;

                return fetch(event.request).then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        const clonedRes = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedRes));
                    }
                    return networkResponse;
                }).catch(() => {
                    console.warn(`SW: Media fetch failed for ${cleanUrl}`);
                    return new Response('', { status: 404 });
                });
            })
        );
        return;
    }

    // NETWORK-FIRST for code/html/css
    event.respondWith(
        fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                const clonedRes = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedRes));
            }
            return networkResponse;
        }).catch(async () => {
            console.warn(`[PEGASUS SW]: Offline fallback active for ${cleanUrl}`);

            const cachedResponse = await caches.match(event.request, { ignoreSearch: true });
            if (cachedResponse) return cachedResponse;

            if (event.request.mode === 'navigate') {
                const path = url.pathname.toLowerCase();

                if (path.includes('/mobile') || path.endsWith('/mobile.html')) {
                    return (
                        await caches.match('./mobile/mobile.html') ||
                        await caches.match('./mobile.html') ||
                        await caches.match('./index.html')
                    );
                }

                return (
                    await caches.match('./index.html') ||
                    await caches.match('./mobile/mobile.html') ||
                    await caches.match('./mobile.html')
                );
            }

            return new Response('Network Error', {
                status: 408,
                headers: { 'Content-Type': 'text/plain' }
            });
        })
    );
});
