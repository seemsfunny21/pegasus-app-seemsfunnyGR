/* ==========================================================================
   PEGASUS PWA SERVICE WORKER - v2.3 (EXTENSION-PROOF SHIELD)
   Protocol: Strict Asset Caching & Error Mitigation
   Status: FINAL STABLE
   ========================================================================== */

const CACHE_NAME = 'pegasus-shield-v2.3'; // 🔄 Forced Cache Invalidation

const ASSETS_TO_CACHE = [
    './', 
    './index.html', 
    './mobile.html', 
    './style.css', 
    './style-mobile.css',
    './app.js', 
    './data.js', 
    './manifest.js',
    './cloudSync.js',
    './car-mobile.js',
    './diet-mobile.js',
    './cardio-mobile.js',
    './ems-mobile.js',
    './profile-mobile.js',
    './inventory-mobile.js',
    './protcrea.js',         // 🟢 ΠΡΟΣΘΗΚΗ (PC Inventory Guard)
    './videos/beep.mp3',
    './videos/abcrunches.mp4', './videos/bentoverrows.mp4', './videos/bicepcurls.mp4',
    './videos/chestflys.mp4', './videos/chestpress.mp4', './videos/cycling.mp4',
    './videos/ems.mp4', './videos/glutekickbacks.mp4', './videos/latpulldowns.mp4',
    './videos/latpulldownsclose.mp4', './videos/legextensions.mp4', './videos/legraisehiplift.mp4',
    './videos/lowrowsseated.mp4', './videos/lyingkneeraise.mp4', './videos/onearmpulldowns.mp4',
    './videos/onearmrows.mp4', './videos/plank.mp4', './videos/preacherbicepcurls.mp4',
    './videos/pushups.mp4', './videos/reversecrunch.mp4', './videos/reverseseatedrows.mp4',
    './videos/situps.mp4', './videos/straightarmpulldowns.mp4', './videos/stretching.mp4',
    './videos/triceppulldowns.mp4', './videos/uprightrows.mp4', './videos/warmup.mp4'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            let downloaded = 0;
            for (const url of ASSETS_TO_CACHE) {
                try {
                    await cache.add(url);
                    downloaded++;
                    const allClients = await self.clients.matchAll({ includeUncontrolled: true });
                    allClients.forEach(client => {
                        client.postMessage({ 
                            type: 'CACHE_PROGRESS', 
                            percent: Math.round((downloaded / ASSETS_TO_CACHE.length) * 100) 
                        });
                    });
                } catch (err) { console.warn(`SW: Skip optional asset ${url}`); }
            }
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(keys.map(key => {
            if (key !== CACHE_NAME) return caches.delete(key);
        }))).then(() => self.clients.claim())
    );
});

// SMART ROUTING ENGINE (v2.3 - Optimized for Data Integrity)
self.addEventListener('fetch', (event) => {
    // 🛡️ GUARD: Ignore non-http requests (Fixes Chrome Extension Errors)
    if (!event.request.url.startsWith('http')) return;

    const url = new URL(event.request.url);

    // 1. API BYPASS: Cloud & AI data (Always LIVE)
    if (url.hostname.includes('jsonbin.io') || url.hostname.includes('googleapis.com')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // 2. NETWORK-FIRST: Code & Logic files
    if (event.request.headers.get('accept')?.includes('text/html') || 
        url.pathname.endsWith('.js') || 
        url.pathname.endsWith('.css')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clonedRes = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedRes));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // 3. CACHE-FIRST: Heavy Media (Videos)
    event.respondWith(
        caches.match(event.request).then((cachedRes) => cachedRes || fetch(event.request))
    );
});
