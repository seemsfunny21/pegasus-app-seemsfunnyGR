/* ==========================================================================
   PEGASUS PWA SERVICE WORKER - v3.3 (ULTIMATE OPTIMIZATION)
   Protocol: Network-First for Code, Cache-First for Media, Zero-Zombie
   Status: FINAL STABLE | FIXED: INSTALL PROMISE RESOLUTION & OFFLINE ROUTING
   ========================================================================== */

const CACHE_NAME = 'pegasus-shield-v3.3-DYNAMIC'; 

const ASSETS_TO_CACHE = [
    './', 
    './index.html', 
    './mobile.html', 
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
    // Σημείωση: Αφαίρεσα τα mobile/* paths διότι στο δικό σου root φάκελο 
    // τα αρχεία είναι συνήθως χύμα ή στο ίδιο επίπεδο. Αν χρησιμοποιείς φάκελο 'mobile/', 
    // μπορείς να τα επαναφέρεις.
];

// ⚡ INSTALL: Caching Assets with Reliable Progress
self.addEventListener('install', (event) => {
    // 🛡️ FORCE UPDATE PATCH: Σκοτώνει τον παλιό SW ακαριαία
    self.skipWaiting();
    
    // 🎯 FIXED: Σωστή επιστροφή του Promise chain για να ολοκληρωθεί το Install
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log('🛡️ SW: Shielding Pegasus Assets...');
            let downloaded = 0;
            
            // Sequential fetching για να μην μπουκώσουμε το δίκτυο
            for (const url of ASSETS_TO_CACHE) {
                try {
                    const response = await fetch(url, { cache: 'no-cache' }); // Force fresh download
                    if (!response.ok) throw new TypeError(`Bad response status: ${response.status}`);
                    await cache.put(url, response);
                    
                    downloaded++;
                    // Tactical Messaging: Στέλνουμε την πρόοδο στο UI
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
        })
    );
});

// 🧹 ACTIVATE: Purge Old Versions & Claim Clients
self.addEventListener('activate', (event) => {
    // 🛡️ IMMEDIATE CONTROL PATCH
    event.waitUntil(self.clients.claim());

    event.waitUntil(
        caches.keys().then(keys => Promise.all(keys.map(key => {
            // Αν το όνομα της Cache ξεκινάει με 'pegasus-shield' αλλά ΔΕΝ είναι η τρέχουσα έκδοση, σβήστην
            if (key.startsWith('pegasus-shield') && key !== CACHE_NAME) {
                console.log(`🧹 SW: Purging old cache: ${key}`);
                return caches.delete(key);
            }
        })))
    );
});

// 🚀 FETCH ENGINE: DYNAMIC PROTOCOL
self.addEventListener('fetch', (event) => {
    // Bypass non-HTTP/S (e.g., chrome-extension://)
    if (!event.request.url.startsWith('http')) return;

    const url = new URL(event.request.url);
    const cleanUrl = url.origin + url.pathname;

    // 1. API BYPASS: Μην κάνεις ποτέ cache το Cloud, την Google ή EmailJS
    if (url.hostname.includes('jsonbin.io') || 
        url.hostname.includes('googleapis.com') || 
        url.hostname.includes('emailjs.com')) {
        return; // Αφήνουμε τον browser να το χειριστεί ελεύθερα
    }

    // 2. Ανίχνευση τύπου αρχείου
    const isMediaAsset = cleanUrl.match(/\.(mp4|mp3|png|jpg|jpeg|svg|woff2|gif)$/i);

    if (isMediaAsset) {
        // ⚡ STRATEGY A: CACHE-FIRST (Για βίντεο & εικόνες - Φορτώνουν ακαριαία, σώζουν MBs)
        event.respondWith(
            caches.match(event.request, { ignoreSearch: true }).then((cachedRes) => {
                return cachedRes || fetch(event.request).then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
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
                // Έχουμε ίντερνετ: Κατεβάζουμε τον φρέσκο κώδικα και ενημερώνουμε σιωπηλά την cache
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const clonedRes = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clonedRes));
                }
                return networkResponse;
            }).catch(async () => {
                // Είμαστε Offline: Το δίκτυο έπεσε, τραβάμε την τελευταία έκδοση από την Cache
                console.warn(`[PEGASUS SW]: Offline fallback active for ${cleanUrl}`);
                
                const cachedResponse = await caches.match(event.request, { ignoreSearch: true });
                if (cachedResponse) return cachedResponse;

                // 🎯 FIXED: Αν ζητήθηκε HTML (π.χ. '/') και δεν βρέθηκε, σέρβιρε το index.html
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }

                // Fallback 404 (για να μην σκάσει η σελίδα)
                return new Response('Network Error', { status: 408, headers: { 'Content-Type': 'text/plain' } });
            })
        );
    }
});
