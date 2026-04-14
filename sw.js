/* ==========================================================================
   PEGASUS PWA SERVICE WORKER - v3.1 (ULTIMATE OPTIMIZATION)
   Protocol: Network-First for Code, Cache-First for Media
   Status: ZERO-TOUCH DEPLOYMENT ACTIVE (No manual version bumps needed)
   ========================================================================== */

const CACHE_NAME = 'pegasus-shield-v3.1-DYNAMIC'; 

const ASSETS_TO_CACHE = [
    './', 
    './index.html', 
    './mobile/mobile.html', 
    './mobile/style.css',
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
    './mobile/finance-mobile.js',
    './mobile/movies-mobile.js',
    './mobile/oracle-mobile.js',
    './mobile/social-mobile.js',
    './mobile/supplies-mobile.js',
    './mobile/maintenance-mobile.js',
    './mobile/missions-mobile.js',
    './mobile/biometrics-mobile.js',
    './mobile/lifting-mobile.js',
    './videos/beep.mp3'
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

// 🚀 FETCH ENGINE: DYNAMIC PROTOCOL (The "Zero-Touch" Fix)
self.addEventListener('fetch', (event) => {
    if (!event.request.url.startsWith('http')) return;

    const url = new URL(event.request.url);
    const cleanUrl = url.origin + url.pathname;

    // 1. API BYPASS: Μην κάνεις ποτέ cache το Cloud, την Google ή EmailJS
    if (url.hostname.includes('jsonbin.io') || url.hostname.includes('googleapis.com') || url.hostname.includes('emailjs.com')) {
        return; // Αφήνουμε τον browser να το χειριστεί ελεύθερα
    }

    // 2. Ανίχνευση τύπου αρχείου
    const isMediaAsset = cleanUrl.match(/\.(mp4|mp3|png|jpg|jpeg|svg|woff2|gif)$/i);

    if (isMediaAsset) {
        // ⚡ STRATEGY A: CACHE-FIRST (Για βίντεο & εικόνες - Φορτώνουν ακαριαία, σώζουν MBs)
        event.respondWith(
            caches.match(cleanUrl, { ignoreSearch: true }).then((cachedRes) => {
                return cachedRes || fetch(event.request).then(networkResponse => {
                    if (networkResponse.status === 200) {
                        const clonedRes = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedRes));
                    }
                    return networkResponse;
                }).catch(() => console.warn(`SW: Media fetch failed for ${cleanUrl}`));
            })
        );
    } else {
        // 🌐 STRATEGY B: NETWORK-FIRST (Για .js, .html, .css - Πάντα ο πιο πρόσφατος κώδικας)
        event.respondWith(
            fetch(event.request).then(networkResponse => {
                // Έχουμε ίντερνετ: Κατεβάζουμε τον φρέσκο κώδικα (π.χ. νέο app.js) και ενημερώνουμε σιωπηλά την cache
                if (networkResponse.status === 200) {
                    const clonedRes = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedRes));
                }
                return networkResponse;
            }).catch(() => {
                // Είμαστε Offline: Το δίκτυο έπεσε, οπότε τραβάμε την τελευταία έκδοση από την Cache
                console.warn(`[PEGASUS SW]: Offline fallback active for ${cleanUrl}`);
                return caches.match(event.request, { ignoreSearch: true }); // Το ignoreSearch διαγράφει την ανάγκη για ακριβές ?v=
            })
        );
    }
});
