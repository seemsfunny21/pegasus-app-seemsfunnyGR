/* ==========================================================================
   PEGASUS PWA SERVICE WORKER - v3.6 (FINAL SAFE STABLE)
   Protocol: Network-First for Code, Cache-First for Media, Zero-Zombie
   Status: FINAL STABLE | HARDENED: SAME-ORIGIN ONLY + GET ONLY + SAFE CACHE PUT
   ========================================================================== */

const CACHE_NAME = 'pegasus-shield-v3.13-DYNAMIC';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
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
    './debug.js',
    './settings.js',
    './aiHandler.js',
    './voice.js',
];

/* =========================
   HELPERS
========================= */
function isSameOrigin(url) {
    return url.origin === self.location.origin;
}

function isBypassHost(url) {
    return (
        url.hostname.includes('jsonbin.io') ||
        url.hostname.includes('googleapis.com') ||
        url.hostname.includes('emailjs.com')
    );
}

function isMediaAsset(pathname) {
    return /\.(mp4|mp3|png|jpg|jpeg|svg|woff2|gif|webp)$/i.test(pathname);
}

function isCacheableResponse(response) {
    return !!response && response.status === 200 && response.type === 'basic';
}

async function putInCache(request, response) {
    if (!isCacheableResponse(response)) return;

    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
}

async function getOfflineNavigationFallback(pathname) {
    const isMobileRoute =
        pathname.includes('/mobile') ||
        pathname.endsWith('/mobile.html');

    if (isMobileRoute) {
        return (
            await caches.match('./mobile/mobile.html') ||
            await caches.match('./mobile.html') ||
            await caches.match('./index.html') ||
            new Response('Offline', {
                status: 503,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            })
        );
    }

    return (
        await caches.match('./index.html') ||
        await caches.match('./mobile/mobile.html') ||
        await caches.match('./mobile.html') ||
        new Response('Offline', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        })
    );
}

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

            for (const assetUrl of ASSETS_TO_CACHE) {
                try {
                    const response = await fetch(assetUrl, { cache: 'no-cache' });
                    if (!response.ok) throw new Error(`Bad response status: ${response.status}`);

                    await cache.put(assetUrl, response.clone());
                    downloaded++;

                    const allClients = await self.clients.matchAll({ includeUncontrolled: true });
                    allClients.forEach(client => {
                        client.postMessage({
                            type: 'CACHE_PROGRESS',
                            percent: Math.round((downloaded / ASSETS_TO_CACHE.length) * 100)
                        });
                    });
                } catch (err) {
                    console.warn(`SW: Failed to cache asset: ${assetUrl}`, err);
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
    const request = event.request;

    if (request.method !== 'GET') return;
    if (!request.url.startsWith('http')) return;

    const url = new URL(request.url);

    if (!isSameOrigin(url) || isBypassHost(url)) return;

    const pathname = url.pathname.toLowerCase();

    /* -------------------------
       CACHE-FIRST for media
    ------------------------- */
    if (isMediaAsset(pathname)) {
        event.respondWith(
            (async () => {
                const cachedRes = await caches.match(request, { ignoreSearch: true });
                if (cachedRes) return cachedRes;

                try {
                    const networkResponse = await fetch(request);
                    await putInCache(request, networkResponse);
                    return networkResponse;
                } catch (err) {
                    console.warn(`SW: Media fetch failed for ${url.pathname}`, err);
                    return new Response('', { status: 404 });
                }
            })()
        );
        return;
    }

    /* -------------------------
       NETWORK-FIRST for code/html/css
    ------------------------- */
    event.respondWith(
        (async () => {
            try {
                const networkResponse = await fetch(request);
                await putInCache(request, networkResponse);
                return networkResponse;
            } catch (err) {
                console.warn(`[PEGASUS SW]: Offline fallback active for ${url.pathname}`, err);

                const cachedResponse = await caches.match(request, { ignoreSearch: true });
                if (cachedResponse) return cachedResponse;

                if (request.mode === 'navigate') {
                    return getOfflineNavigationFallback(pathname);
                }

                return new Response('Network Error', {
                    status: 408,
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                });
            }
        })()
    );
});
