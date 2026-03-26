/* ==========================================================================
   PEGASUS PWA SERVICE WORKER - v2.0 (MODULAR SYSTEM SYNC)
   Protocol: Strict Media Caching with Error Recovery & Full Modular Array
   ========================================================================== */

const CACHE_NAME = 'pegasus-media-vault-v2';

// Πλήρης λίστα πόρων (Περιλαμβάνει πλέον όλα τα Decoupled Modules)
const ASSETS_TO_CACHE = [
    './', './index.html', './mobile.html', './style.css',
    
    // Core Modules
    './achievements.js', './app.js', './backup.js', './calendar.js',
    './calories.js', './cardio.js', './cloudSync.js', './data.js',
    './debug.js', './dragDrop.js', './ems.js', './extensions.js',
    './food.js', './gallery.js', './inventoryHandler.js', './metabolic.js',
    './optimizer.js', './partner.js', './progressUI.js', './reporting.js',
    './settings.js', './weather.js', './weatherHandler.js',
    
    // Media & Videos
    './videos/beep.mp3', './videos/warmup.mp4', './videos/stretching.mp4',
    './videos/abcrunches.mp4', './videos/bentoverrows.mp4', './videos/bicepcurls.mp4',
    './videos/chestflys.mp4', './videos/chestpress.mp4', './videos/cycling.mp4',
    './videos/ems.mp4', './videos/glutekickbacks.mp4', './videos/latpulldowns.mp4',
    './videos/latpulldownsclose.mp4', './videos/legextensions.mp4', './videos/legraisehiplift.mp4',
    './videos/lowrowsseated.mp4', './videos/lyingkneeraise.mp4', './videos/onearmpulldowns.mp4',
    './videos/onearmrows.mp4', './videos/plank.mp4', './videos/preacherbicepcurls.mp4',
    './videos/pushups.mp4', './videos/reversecrunch.mp4', './videos/reverseseatedrows.mp4',
    './videos/situps.mp4', './videos/straightarmpulldowns.mp4', './videos/triceppulldowns.mp4',
    './videos/uprightrows.mp4'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            let downloaded = 0;
            const total = ASSETS_TO_CACHE.length;

            for (let url of ASSETS_TO_CACHE) {
                let success = false;
                let retries = 3;

                while (!success && retries > 0) {
                    try {
                        await cache.add(url);
                        success = true;
                        downloaded++;
                        
                        // Αναμετάδοση προόδου στο UI
                        const clients = await self.clients.matchAll();
                        clients.forEach(client => {
                            client.postMessage({
                                type: 'CACHE_PROGRESS',
                                percent: Math.round((downloaded / total) * 100),
                                file: url
                            });
                        });
                    } catch (err) {
                        retries--;
                        console.warn(`[PEGASUS SW]: Retry (${3 - retries}/3) for ${url}`);
                        if (retries === 0) console.error(`[PEGASUS SW]: Failed to cache ${url} after 3 attempts.`);
                    }
                }
            }
            console.log('[PEGASUS SW]: Modular Caching Operations Finished.');
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(keys.map((key) => {
                // Διαγραφή παλιών Caches κατά την ενεργοποίηση της νέας έκδοσης
                if (key !== CACHE_NAME) return caches.delete(key);
            }));
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((res) => res || fetch(event.request))
    );
});