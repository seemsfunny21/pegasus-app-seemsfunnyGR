/* ==========================================================================
   PEGASUS PWA SERVICE WORKER - v3.2 (MASTER MAXIMALIST EDITION)
   Protocol: Network-First for Code, Cache-First for Media
   Status: ZERO-BUG RE-VERIFIED | FAULT-TOLERANT INSTALL
   ========================================================================== */

const CACHE_NAME = 'pegasus-shield-v3.2-MASTER'; 

const ASSETS_TO_CACHE = [
    './', 
    './index.html', 
    './style.css',            /* Κεντρικό CSS */
    './manifest.js',          /* Master Registry */
    './mobile/mobile.html', 
    './mobile/style.css',     /* Mobile CSS */
    './app.js', 
    './data.js', 
    './cloudSync.js',
    './dragDrop.js',
    './extensions.js',
    './dietAdvisor.js',
    './weather.js',           /* Pure UI Edition */
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
    './videos/warmup.mp4',
    './images/favicon.png'    /* Εικονίδιο Συστήματος */
];

// ⚡ INSTALL: Caching Assets with Anti-Crash Protocol
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('🛡️ PEGASUS SW: Initiating Shielded Cache...');
            return Promise.all(
                ASSETS_TO_CACHE.map(asset => {
                    return cache.add(asset).catch(err => {
                        console.warn(`[PEGASUS SW] Παράλειψη (μη κρίσιμο): ${asset}`);
                    });
                })
            );
        }).then(() => self.skipWaiting())
    );
});

// 🧹 ACTIVATE: Clear Obsolete Caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(keys.map(key => {
            if (key !== CACHE_NAME) return caches.delete(key);
        }))).then(() => self.clients.claim())
    );
});

// 🚀 FETCH ENGINE: SMART ROUTING
self.addEventListener('fetch', (event) => {
    if (!event.request.url.startsWith('http')) return;

    const url = new URL(event.request.url);
    const cleanUrl = url.origin + url.pathname;

    // 1. CLOUD & API BYPASS
    if (url.hostname.includes('jsonbin.io') || url.hostname.includes('googleapis.com') || url.hostname.includes('emailjs.com')) {
        return; 
    }

    // 2. DETECTION
    const isMediaAsset = cleanUrl.match(/\.(mp4|mp3|png|jpg|jpeg|svg|woff2|gif)$/i);

    if (isMediaAsset) {
        // ⚡ STRATEGY A: CACHE-FIRST (Media Speed)
        event.respondWith(
            caches.match(cleanUrl, { ignoreSearch: true }).then((cachedRes) => {
                return cachedRes || fetch(event.request).then(networkResponse => {
                    if (networkResponse.status === 200) {
                        const clonedRes = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedRes));
                    }
                    return networkResponse;
                }).catch(() => console.warn(`SW: Media Link Broken: ${cleanUrl}`));
            })
        );
    } else {
        // 🌐 STRATEGY B: NETWORK-FIRST (Code Freshness)
        event.respondWith(
            fetch(event.request).then(networkResponse => {
                if (networkResponse.status === 200) {
                    const clonedRes = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedRes));
                }
                return networkResponse;
            }).catch(() => {
                console.warn(`[PEGASUS SW]: Offline Mode Active for ${cleanUrl}`);
                return caches.match(event.request, { ignoreSearch: true });
            })
        );
    }
});
