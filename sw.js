/* ==========================================================================
   PEGASUS PWA SERVICE WORKER - v2.4 (ULTIMATE OPTIMIZATION)
   Protocol: Strict Asset Caching & Query-String Neutralization
   Status: RE-ENGINEERED FOR GTMETRIX GRADE A+
   ========================================================================== */

const CACHE_NAME = 'pegasus-shield-v2.13'; 

const ASSETS_TO_CACHE = [
    './', 
    './index.html', 
    './mobile/mobile.html', 
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
    './mobile/diet-mobile.js',
    './mobile/cardio-mobile.js',
    './mobile/profile-mobile.js',
    './mobile/car-mobile.js',
    './mobile/parking-mobile.js',
    './mobile/inventory-mobile.js',
    './mobile/ems-mobile.js',
    './videos/beep.mp3',
    './videos/warmup.mp4'
];

// ⚡ INSTALL: Caching Assets with Reliable Progress
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log('🛡️ SW: Shielding Pegasus Assets...');
            let downloaded = 0;
            for (const url of ASSETS_TO_CACHE) {
                try {
                    await cache.add(url);
                    downloaded++;
                    // Tactical Messaging: Στέλνουμε την πρόοδο σε κάθε αρχείο
                    const allClients = await self.clients.matchAll({ includeUncontrolled: true });
                    allClients.forEach(client => {
                        client.postMessage({
                            type: 'CACHE_PROGRESS',
                            percent: Math.round((downloaded / ASSETS_TO_CACHE.length) * 100)
                        });
                    });
                } catch (err) {
                    console.warn(`SW: Skip asset ${url}`, err);
                }
            }
        })
    );
});

// 🧹 ACTIVATE: Purge Old Versions
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(keys.map(key => {
            if (key !== CACHE_NAME) return caches.delete(key);
        }))).then(() => self.clients.claim())
    );
});

// 🚀 FETCH ENGINE: Query-String Aware
self.addEventListener('fetch', (event) => {
    if (!event.request.url.startsWith('http')) return;

    // Tactical Fix: Αφαίρεση του ?v=... από το URL για να βρίσκει το αρχείο στην cache
    const url = new URL(event.request.url);
    const cleanUrl = url.origin + url.pathname;

    // 1. API BYPASS: Μην κάνεις ποτέ cache το Cloud ή την Google
    if (url.hostname.includes('jsonbin.io') || url.hostname.includes('googleapis.com')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // 2. STRATEGY: Cache First, Network Fallback (Για ταχύτητα)
    event.respondWith(
        caches.match(cleanUrl).then((cachedRes) => {
            return cachedRes || fetch(event.request).then(response => {
                // Αν είναι JS/CSS/HTML, το βάζουμε στην cache για την επόμενη φορά
                if (response.status === 200 && (cleanUrl.endsWith('.js') || cleanUrl.endsWith('.css'))) {
                    const clonedRes = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedRes));
                }
                return response;
            });
        })
    );
});
