/* ==========================================================================
   PEGASUS PWA SERVICE WORKER - v1.2 (AUTO-RETRY & PROGRESS BROADCAST)
   Protocol: Strict Media Caching with Error Recovery
   ========================================================================== */

const CACHE_NAME = 'pegasus-media-vault-v1';
const ASSETS_TO_CACHE = [
    './', './index.html', './app.js', './data.js', './cloudSync.js', './videos/beep.mp3',
    './videos/abcrunches.mp4', './videos/bentoverrows.mp4', './videos/bicepcurls.mp4',
    './videos/chestflys.mp4', './videos/chestpress.mp4', './videos/cycling.mp4',
    './videos/ems.mp4', './videos/glutekickbacks.mp4', './videos/latpulldowns.mp4',
    './videos/latpulldownsclose.mp4', './videos/legextensions.mp4', './videos/legraisehiplift.mp4',
    './videos/lowrowsseated.mp4', './videos/lyingkneeraise.mp4', './videos/onearmpulldowns.mp4',
    './videos/onearmrows.mp4', './videos/plank.mp4', './videos/preacherbicepcurls.mp4',
    './videos/pushups.mp4', './videos/reversecrunch.mp4', './videos/reverseseatedrows.mp4',
    './videos/situps.mp4', './videos/straightarmpulldowns.mp4', './videos/stretching.mp4',
    './videos/triceppulldowns.mp4', './videos/uprightrows.mp4', './videos/warmup.mp4',
    './images/abcrunches.png', './images/bentoverrows.png', './images/bicepcurls.png',
    './images/chestflys.png', './images/chestpress.png', './images/cycling.jpg',
    './images/emsimage.png', './images/favicon.png', './images/glutekickbacks.png',
    './images/latpulldowns.png', './images/latpulldownsclose.png', './images/legextensions.png',
    './images/legraisehiplift.png', './images/lowrowsseated.png', './images/lyingkneeraise.png',
    './images/onearmpulldowns.png', './images/onearmrows.png', './images/plank.png',
    './images/preacherbicepcurls.png', './images/pushups.png', './images/reversecrunch.png',
    './images/reversegripcablerow.png', './images/reverseseatedrows.png', './images/situps.png',
    './images/straightarmpulldowns.png', './images/stretching.png', './images/triceppulldowns.png',
    './images/uprightrows.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            let downloaded = 0;
            const total = ASSETS_TO_CACHE.length;

            for (const url of ASSETS_TO_CACHE) {
                let success = false;
                let retries = 3;

                while (!success && retries > 0) {
                    try {
                        await cache.add(url);
                        success = true;
                        downloaded++;
                        
                        // Broadcast progress to UI
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
                        console.warn(`PEGASUS SW: Retry (${3 - retries}/3) for ${url}`);
                        if (retries === 0) console.error(`PEGASUS SW: Failed to cache ${url} after 3 attempts.`);
                    }
                }
            }
            console.log('PEGASUS OS: Caching Operations Finished.');
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(keys.map((key) => {
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
