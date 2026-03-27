/* ==========================================================================
   PEGASUS PWA SERVICE WORKER - v2.0 (SMART ROUTING & API BYPASS)
   ========================================================================== */

const CACHE_NAME = 'pegasus-media-vault-v2';
const ASSETS_TO_CACHE = [
    './', './index.html', './mobile.html', './app.js', './data.js', './cloudSync.js', './videos/beep.mp3',
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
    self.skipWaiting(); // Αναγκαστική άμεση εγκατάσταση
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            let downloaded = 0;
            for (const url of ASSETS_TO_CACHE) {
                try {
                    await cache.add(url);
                    downloaded++;
                    const clients = await self.clients.matchAll();
                    clients.forEach(client => client.postMessage({ type: 'CACHE_PROGRESS', percent: Math.round((downloaded / ASSETS_TO_CACHE.length) * 100), file: url }));
                } catch (err) { console.error(`SW: Failed ${url}`); }
            }
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(keys.map(key => {
            if (key !== CACHE_NAME) return caches.delete(key);
        }))).then(() => self.clients.claim()) // Ανάληψη ελέγχου αμέσως
    );
});

// SMART ROUTING ENGINE
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. API BYPASS: Επικοινωνία Cloud & AI πάει ΠΑΝΤΑ απευθείας στο ίντερνετ
    if (url.hostname.includes('jsonbin.io') || url.hostname.includes('googleapis.com')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // 2. NETWORK-FIRST: Αρχεία κώδικα (HTML/JS/CSS) 
    if (event.request.headers.get('accept').includes('text/html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }

    // 3. CACHE-FIRST: Βαριά Media (Βίντεο, Ήχοι)
    event.respondWith(
        caches.match(event.request).then((cachedRes) => cachedRes || fetch(event.request))
    );
});
