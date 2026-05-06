/* ==========================================================================
   PEGASUS PWA SERVICE WORKER - v3.7 (INSTANT OPEN / BACKGROUND MEDIA CACHE)
   Protocol: Network-First for Code, Cache-First for Media, Zero-Zombie
   Status: FINAL STABLE | HARDENED: SAME-ORIGIN ONLY + GET ONLY + SAFE CACHE PUT
   ========================================================================== */

const CACHE_NAME = 'pegasus-shield-v3.141-FINAL-220';
const VIDEO_CACHE_NAME = 'pegasus-videos-permanent-v220';

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
    './pegasusBrain.js',
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
    './mobile/youtube-mobile.js',
    './mobile/weather-mobile.js',
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

function isVideoAsset(pathname) {
    return /\.(mp4|webm|mov)$/i.test(pathname);
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
            // PEGASUS 219: fetch a full clean copy for the permanent video cache.
            // Do not cache 404 pages, partial/range responses, or tiny corrupt MP4 files.
            const response = await fetch(cacheKey, { cache: 'reload' });
            const contentType = (response.headers.get('content-type') || '').toLowerCase();

            if (!isCacheableResponse(response) || !contentType.includes('video')) {
                console.warn(`SW: Permanent video cache skipped (${response.status} ${contentType}): ${url.pathname}`);
                return false;
            }

            const blob = await response.clone().blob();
            if (!blob || blob.size < 1024) {
                console.warn(`SW: Permanent video cache skipped corrupt/tiny file (${blob ? blob.size : 0} bytes): ${url.pathname}`);
                return false;
            }

            const headers = new Headers(response.headers);
            headers.set('Content-Length', String(blob.size));
            headers.set('Accept-Ranges', 'bytes');
            if (!headers.get('Content-Type')) headers.set('Content-Type', 'video/mp4');

            await cache.put(cacheKey, new Response(blob, {
                status: 200,
                statusText: 'OK',
                headers
            }));
            console.log(`🎬 SW: Permanent video cached: ${url.pathname.split('/').pop()} (${blob.size} bytes)`);
            return true;
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

async function cacheGenericMedia(urlString) {
    try {
        const url = new URL(urlString, self.location.href);
        if (!isSameOrigin(url)) return false;
        if (isPermanentVideoAsset(url.pathname.toLowerCase())) return cachePermanentVideo(url);

        const request = new Request(url.href, { credentials: 'same-origin' });
        const cached = await caches.match(request, { ignoreSearch: true });
        if (cached) return true;

        const response = await fetch(request, { cache: 'default' });
        if (!isCacheableResponse(response)) return false;
        const contentType = (response.headers.get('content-type') || '').toLowerCase();
        if (!contentType.startsWith('image/') && !contentType.includes('font') && !contentType.includes('audio')) return false;

        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
        return true;
    } catch (e) {
        return false;
    }
}

async function backgroundCacheStaticAssets() {
    const cache = await caches.open(CACHE_NAME);
    let downloaded = 0;

    for (const assetUrl of ASSETS_TO_CACHE) {
        try {
            const request = new Request(assetUrl, { credentials: 'same-origin' });
            const existing = await cache.match(request, { ignoreSearch: true });
            if (!existing) {
                const response = await fetch(request, { cache: 'default' });
                if (isCacheableResponse(response)) await cache.put(request, response.clone());
            }
            downloaded++;
            const allClients = await self.clients.matchAll({ includeUncontrolled: true });
            allClients.forEach(client => {
                client.postMessage({
                    type: 'CACHE_PROGRESS',
                    percent: Math.round((downloaded / ASSETS_TO_CACHE.length) * 100)
                });
            });
        } catch (err) {
            console.warn(`SW: Background static cache skipped: ${assetUrl}`, err);
        }
    }
}

async function backgroundCacheMediaUrls(urls = []) {
    const unique = Array.from(new Set((Array.isArray(urls) ? urls : []).filter(Boolean)));
    let ok = 0;

    for (const urlString of unique) {
        try {
            const cached = await cacheGenericMedia(urlString);
            if (cached) ok++;
        } catch (e) {}
    }

    if (unique.length) console.log(`🎬 SW: Background media cache complete ${ok}/${unique.length}`);
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

    // PEGASUS 220: install fast. Do not block page opening by downloading the
    // full project/media set during install. Full caching is triggered in the
    // background by the page after it is usable.
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            const coreShell = ['./', './index.html', './style.css', './manifest.js', './app.js', './data.js', './pegasusBrain.js', './sw.js'];
            for (const assetUrl of coreShell) {
                try {
                    const response = await fetch(assetUrl, { cache: 'default' });
                    if (isCacheableResponse(response)) await cache.put(assetUrl, response.clone());
                } catch (err) {
                    console.warn(`SW: Core shell cache skipped: ${assetUrl}`, err);
                }
            }
            console.log('✅ SW: Core shell ready; full assets will cache in background.');
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

                    // PEGASUS 219: keep the current permanent video cache, purge only old video caches.
                    // This preserves fast video loads after the first successful fetch, while avoiding
                    // stale/corrupt caches from older builds.
                    if (key.startsWith('pegasus-videos-') && key !== VIDEO_CACHE_NAME) {
                        console.log(`🧹 SW: Purging old video cache: ${key}`);
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
   BACKGROUND CACHE MESSAGES
========================= */
self.addEventListener('message', (event) => {
    const data = event.data || {};

    if (data.type === 'PEGASUS_BACKGROUND_CACHE_ALL') {
        event.waitUntil((async () => {
            await backgroundCacheStaticAssets();
            await backgroundCacheMediaUrls(data.mediaUrls || []);
        })());
        return;
    }

    if (data.type === 'PEGASUS_BACKGROUND_CACHE_MEDIA') {
        event.waitUntil(backgroundCacheMediaUrls(data.urls || data.mediaUrls || []));
    }
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
                if (isVideoAsset(pathname)) {
                    // PEGASUS 219: cache-first for valid workout MP4 files.
                    // First load may stream from network; then a full validated copy is kept in
                    // pegasus-videos-permanent-v219. Tiny/corrupt files are never cached.
                    const cachedVideo = await getCachedPermanentVideoResponse(request, url);
                    if (cachedVideo) return cachedVideo;

                    try {
                        const networkResponse = await fetch(request, { cache: 'default' });
                        event.waitUntil(cachePermanentVideo(url));
                        return networkResponse;
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
