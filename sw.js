/* ==========================================================================
   PEGASUS PWA SERVICE WORKER - v3.6 (FINAL SAFE STABLE)
   Protocol: Network-First for Code, Cache-First for Media, Zero-Zombie
   Status: FINAL STABLE | HARDENED: SAME-ORIGIN ONLY + GET ONLY + SAFE CACHE PUT
   ========================================================================== */

const CACHE_NAME = 'pegasus-shield-v3.109-FINAL-177';
const VIDEO_CACHE_NAME = 'pegasus-videos-permanent-v1';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './mobile/mobile.html',
    './style.css',
    './mobile/style.css',
    './manifest.js',
    './dialogs.js',
    './i18n.js',
    './data.js',
    './settings.js',
    './optimizer.js',
    './dynamic.js',
    './progressUI.js',
    './weather.js',
    './backup.js',
    './inventoryHandler.js',
    './pegasusCore.js',
    './cloudSync.js',
    './protcrea.js',
    './food.js',
    './foodRegistry.js',
    './slotRegistry.js',
    './dietAdvisor.js',
    './dietVariation.js',
    './extensions.js',
    './ems.js',
    './cardio.js',
    './calendar.js',
    './gallery.js',
    './partner.js',
    './achievements.js',
    './dragDrop.js',
    './reporting.js',
    './metabolicEngine.js',
    './weightTracker.js',
    './app.js',
    './debug.js',
    './auditUI.js',
    './aiHandler.js',
    './voice.js',
    './adaptiveTypography.js',
    './mobile/diet-mobile.js',
    './mobile/cardio-mobile.js',
    './mobile/profile-mobile.js',
    './mobile/car-mobile.js',
    './mobile/parking-mobile.js',
    './mobile/inventory-mobile.js',
    './mobile/ems-mobile.js',
    './mobile/supplies-mobile.js',
    './mobile/finance-mobile.js',
    './mobile/social-mobile.js',
    './mobile/movies-mobile.js',
    './mobile/missions-mobile.js',
    './mobile/biometrics-mobile.js',
    './mobile/maintenance-mobile.js',
    './mobile/oracle-mobile.js',
    './mobile/lifting-mobile.js',
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

function isPermanentVideoAsset(pathname) {
    return pathname.includes('/videos/') && /\.(mp4|webm|mov|mp3)$/i.test(pathname);
}

function getPermanentVideoCacheKey(url) {
    return new Request(`${url.origin}${url.pathname}`, { credentials: 'same-origin' });
}

function isRangeRequest(request) {
    return !!request.headers.get('range');
}

async function createRangeResponse(request, cachedResponse) {
    const rangeHeader = request.headers.get('range');
    const match = rangeHeader && rangeHeader.match(/bytes=(\d*)-(\d*)/);

    if (!match) return cachedResponse.clone();

    const blob = await cachedResponse.blob();
    const size = blob.size;
    let start;
    let end;

    if (match[1] === '' && match[2] !== '') {
        const suffixLength = parseInt(match[2], 10);
        start = Math.max(size - suffixLength, 0);
        end = size - 1;
    } else {
        start = match[1] ? parseInt(match[1], 10) : 0;
        end = match[2] ? parseInt(match[2], 10) : size - 1;
    }

    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || start >= size) {
        return new Response('', {
            status: 416,
            statusText: 'Range Not Satisfiable',
            headers: {
                'Content-Range': `bytes */${size}`
            }
        });
    }

    end = Math.min(end, size - 1);
    const sliced = blob.slice(start, end + 1);
    const headers = new Headers(cachedResponse.headers);
    headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Content-Length', String(sliced.size));
    headers.set('Content-Type', cachedResponse.headers.get('Content-Type') || 'video/mp4');

    return new Response(sliced, {
        status: 206,
        statusText: 'Partial Content',
        headers
    });
}

const videoCacheInFlight = new Map();

async function cachePermanentVideo(url) {
    const cache = await caches.open(VIDEO_CACHE_NAME);
    const cacheKey = getPermanentVideoCacheKey(url);
    const cacheId = cacheKey.url;

    const existing = await cache.match(cacheKey, { ignoreSearch: true });
    if (existing) return true;

    if (videoCacheInFlight.has(cacheId)) {
        return videoCacheInFlight.get(cacheId);
    }

    const task = (async () => {
        try {
            const response = await fetch(cacheKey, { cache: 'reload' });

            if (isCacheableResponse(response)) {
                await cache.put(cacheKey, response.clone());
                console.log(`🎬 SW: Permanent video cached: ${url.pathname.split('/').pop()}`);
                return true;
            }

            console.warn(`SW: Permanent video cache skipped (${response.status}): ${url.pathname}`);
            return false;
        } catch (err) {
            console.warn(`SW: Permanent video cache failed: ${url.pathname}`, err);
            return false;
        } finally {
            videoCacheInFlight.delete(cacheId);
        }
    })();

    videoCacheInFlight.set(cacheId, task);
    return task;
}

async function getCachedPermanentVideoResponse(request, url) {
    const cache = await caches.open(VIDEO_CACHE_NAME);
    const cacheKey = getPermanentVideoCacheKey(url);
    const cachedResponse = await cache.match(cacheKey, { ignoreSearch: true });

    if (!cachedResponse) return null;

    if (isRangeRequest(request)) {
        return createRangeResponse(request, cachedResponse);
    }

    return cachedResponse.clone();
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
       Lazy permanent cache for videos
    ------------------------- */
    if (isMediaAsset(pathname)) {
        event.respondWith(
            (async () => {
                if (isPermanentVideoAsset(pathname)) {
                    const cachedVideo = await getCachedPermanentVideoResponse(request, url);
                    if (cachedVideo) return cachedVideo;

                    // Keep playback fast: stream the current network request normally,
                    // while downloading the full file in the background for future offline use.
                    event.waitUntil(cachePermanentVideo(url));

                    try {
                        return await fetch(request);
                    } catch (err) {
                        const lateCachedVideo = await getCachedPermanentVideoResponse(request, url);
                        if (lateCachedVideo) return lateCachedVideo;

                        console.warn(`SW: Video fetch failed and not cached: ${url.pathname}`, err);
                        return new Response('', { status: 404 });
                    }
                }

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
