/* ==========================================================================
   PEGASUS PWA SERVICE WORKER - v3.34 (CONSOLIDATION PASS)
   Protocol: Network-First for Code, Cache-First for Media, Zero-Zombie
   Status: FINAL STABLE | HARDENED: SAME-ORIGIN ONLY + GET ONLY + SAFE CACHE PUT
   ========================================================================== */

const CACHE_NAME = 'pegasus-shield-v3.34-CONSOLIDATED-PATCHES';

const ASSETS_TO_CACHE = [
    '.',
    './index.html',
    './mobile/mobile.html',
    './style.css',
    './mobile/style.css',
    './achievements.js',
    './app.js',
    './appState.js',
    './audioRuntime.js',
    './adaptiveTypography.js',
    './adaptiveTypographyLoader.js',
    './auditUI.js',
    './backup.js',
    './calendar.js',
    './calorieRuntime.js',
    './cardio.js',
    './cloudSync.js',
    './data.js',
    './debug.js',
    './desktopActions.js',
    './desktopBoot.js',
    './desktopBootEnhancements.js',
    './desktopPanels.js',
    './desktopRender.js',
    './desktopRoute.js',
    './desktopSyncController.js',
    './desktopSyncUI.js',
    './diagnosticsRuntime.js',
    './dialogs.js',
    './dietAdvisor.js',
    './dragDrop.js',
    './dynamic.js',
    './ems.js',
    './extensions.js',
    './food.js',
    './gallery.js',
    './i18n.js',
    './inventoryHandler.js',
    './manifest.js',
    './metabolicEngine.js',
    './moduleIntegrity.js',
    './optimizer.js',
    './partner.js',
    './pegasusBridgeHub.js',
    './pegasusCore.js',
    './pegasusRuntimeMonitor.js',
    './programGuide.js',
    './progressUI.js',
    './protcrea.js',
    './reporting.js',
    './runtimeBridge.js',
    './selfCheckRunner.js',
    './settings.js',
    './storageHardening.js',
    './syncDiagnostics.js',
    './syncEdgeHardening.js',
    './syncHardening.js',
    './weather.js',
    './weightState.js',
    './weightTracker.js',
    './workoutTracking.js',
    './mobile/biometrics-mobile.js',
    './mobile/car-mobile.js',
    './mobile/cardio-mobile.js',
    './mobile/diet-mobile.js',
    './mobile/youtube-mobile.js',
    './mobile/ems-mobile.js',
    './mobile/finance-mobile.js',
    './mobile/inventory-mobile.js',
    './mobile/lifting-mobile.js',
    './mobile/mobileBridgeViews.js',
    './mobile/maintenance-mobile.js',
    './mobile/missions-mobile.js',
    './mobile/mobileApp.js',
    './mobile/mobileErrorMonitor.js',
    './mobile/mobileSafe.js',
    './mobile/mobileDataRegistry.js',
    './mobile/mobileDataMigration.js',
    './mobile/mobileSettingsDataTools.js',
    './mobile/mobileServiceWorker.js',
    './mobile/mobileUI.js',
    './mobile/movies-mobile.js',
    './mobile/oracle-mobile.js',
    './mobile/parking-mobile.js',
    './mobile/profile-mobile.js',
    './mobile/social-mobile.js',
    './mobile/supplies-mobile.js',
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
