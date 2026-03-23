/* ==========================================================================
   PEGASUS HEALTH & DEBUG SYSTEM - v2.1 (INTEGRATED CACHE MONITOR)
   Protocol: Strict Asynchronous System Audit
   ========================================================================== */

window.pegasusHealthCheck = async function() {
    console.log("%c--- PEGASUS OS: INITIALIZING SYSTEM AUDIT ---", "color: #00ff41; font-weight: bold;");
    
    let errors = 0;
    let warnings = 0;
    const CACHE_NAME = 'pegasus-media-vault-v1';

    // --- 1. CORE ENGINE CHECK ---
    if (typeof exercises === 'undefined') { console.error("❌ Critical: Engine 'exercises' array is missing."); errors++; }
    if (typeof program === 'undefined') { console.error("❌ Critical: 'program' object (data.js) not found."); errors++; }

    // --- 2. LOCALSTORAGE INTEGRITY ---
    const weight = localStorage.getItem("pegasus_weight");
    if (!weight || weight == 0) { console.warn("⚠️ Profile: User weight not set. Kcal calculation compromised."); warnings++; }

    // --- 3. DOM ARCHITECTURE ---
    const essentialElements = ["btnStart", "exList", "totalProgress", "phaseTimer"];
    essentialElements.forEach(id => {
        if (!document.getElementById(id)) { console.error(`❌ UI: Element ID '${id}' missing.`); errors++; }
    });

    // --- 4. OFFLINE VAULT AUDIT (CACHE CHECK) ---
    const expectedAssets = [
        './videos/beep.mp3', './videos/abcrunches.mp4', './videos/bentoverrows.mp4', 
        './videos/bicepcurls.mp4', './videos/chestflys.mp4', './videos/chestpress.mp4', 
        './videos/cycling.mp4', './videos/ems.mp4', './videos/glutekickbacks.mp4', 
        './videos/latpulldowns.mp4', './videos/latpulldownsclose.mp4', './videos/legextensions.mp4', 
        './videos/legraisehiplift.mp4', './videos/lowrowsseated.mp4', './videos/lyingkneeraise.mp4', 
        './videos/onearmpulldowns.mp4', './videos/onearmrows.mp4', './videos/plank.mp4', 
        './videos/preacherbicepcurls.mp4', './videos/pushups.mp4', './videos/reversecrunch.mp4', 
        './videos/reverseseatedrows.mp4', './videos/situps.mp4', './videos/straightarmpulldowns.mp4', 
        './videos/stretching.mp4', './videos/triceppulldowns.mp4', './videos/uprightrows.mp4', './videos/warmup.mp4',
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

    try {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        const cachedUrls = keys.map(request => {
            const url = new URL(request.url);
            return '.' + url.pathname.replace('/seemsfunny', '');
        });

        let missing = expectedAssets.filter(asset => !cachedUrls.some(url => url.includes(asset.replace('./', ''))));

        if (missing.length > 0) {
            console.warn(`⚠️ Cache: ${missing.length} assets missing from Offline Vault.`);
            console.log("Missing assets list:", missing);
            warnings++;
        } else {
            console.log("%c✅ Cache: Offline Vault verified (100% complete).", "color: #00ff41;");
        }
    } catch (e) {
        console.error("❌ Cache: Failed to access Service Worker Cache.");
        errors++;
    }

    // --- FINAL REPORT ---
    console.log("--- AUDIT COMPLETE ---");
    console.table({
        "Engine Status": errors === 0 ? "NOMINAL" : "CRITICAL",
        "Total Errors": errors,
        "Total Warnings": warnings,
        "Offline Ready": (warnings === 0 && errors === 0) ? "YES" : "NO"
    });

    return { errors, warnings };
};

// Αυτόματη εκτέλεση μετά τη φόρτωση
setTimeout(window.pegasusHealthCheck, 3000);
