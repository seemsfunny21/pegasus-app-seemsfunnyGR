/* ==========================================================================
   PEGASUS SERVICE WORKER - CLEAN SWEEP v17.0
   Protocol: PWA Offline Persistence | Logic: Cache-First
   ========================================================================== */

const CACHE_NAME = 'pegasus-os-v17';
const ASSETS = [
    './',
    './index.html',
    './mobile.html',
    './style.css',
    './app.js',
    './data.js',
    './videos/beep.mp3'
];

// Install Event
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// Activate Event
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            );
        })
    );
});

// Fetch Event (Offline Support)
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((res) => {
            return res || fetch(e.request);
        })
    );
});