/* ==========================================================================
   PEGASUS PWA SERVICE WORKER - v1.0
   Protocol: Offline-First Asset Caching
   ========================================================================== */

const CACHE_NAME = 'pegasus-media-vault-v1';

// Λίστα αρχείων προς αποθήκευση (Βάσει της λίστας GitHub που έστειλες)
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './app.js',
    './data.js',
    './cloudSync.js',
    './videos/beep.mp3',
    // VIDEOS
    './videos/abcrunches.mp4', './videos/bentoverrows.mp4', './videos/bicepcurls.mp4',
    './videos/chestflys.mp4', './videos/chestpress.mp4', './videos/cycling.mp4',
    './videos/ems.mp4', './videos/glutekickbacks.mp4', './videos/latpulldowns.mp4',
    './videos/latpulldownsclose.mp4', './videos/legextensions.mp4', './videos/legraisehiplift.mp4',
    './videos/lowrowsseated.mp4', './videos/lyingkneeraise.mp4', './videos/onearmpulldowns.mp4',
    './videos/onearmrows.mp4', './videos/plank.mp4', './videos/preacherbicepcurls.mp4',
    './videos/pushups.mp4', './videos/reversecrunch.mp4', './videos/reverseseatedrows.mp4',
    './videos/situps.mp4', './videos/straightarmpulldowns.mp4', './videos/stretching.mp4',
    './videos/triceppulldowns.mp4', './videos/uprightrows.mp4', './videos/warmup.mp4',
    // IMAGES
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

// Εγκατάσταση και αποθήκευση στη μνήμη (Install & Cache)
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('PEGASUS OS: Opening Cache Vault...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Ενεργοποίηση και καθαρισμός παλαιών caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('PEGASUS OS: Clearing Old Cache...');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Στρατηγική: Φόρτωση από Cache, αν δεν υπάρχει τότε από Δίκτυο
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
