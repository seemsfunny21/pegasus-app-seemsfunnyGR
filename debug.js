/* ==========================================================================
   PEGASUS HEALTH & DEBUG SYSTEM - v2.3 (STRICT MONITOR + CACHE AUDIT)
   ========================================================================== */

// 1. ASYNC CACHE AUDIT ENGINE
window.verifyPegasusCache = async () => {
    const CACHE_NAME = 'pegasus-media-vault-v1';
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

    console.log(`%c--- PEGASUS CACHE AUDIT ---`, 'color: #00bcd4; font-weight: bold;');
    
    try {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        const cachedUrls = keys.map(request => {
            const url = new URL(request.url);
            return '.' + url.pathname.replace('/seemsfunny', ''); 
        });

        let missing = expectedAssets.filter(asset => !cachedUrls.some(url => url.includes(asset.replace('./', ''))));

        console.table({
            "Total Assets": expectedAssets.length,
            "Cached": expectedAssets.length - missing.length,
            "Missing": missing.length
        });

        if (missing.length > 0) {
            console.warn("⚠️ Missing Assets List:", missing);
            return false;
        } else {
            console.log("%c✅ Offline Vault: 100% Integrity Confirmed.", "color: #4CAF50; font-weight: bold;");
            return true;
        }
    } catch (err) {
        console.error("❌ Cache Audit Failed:", err);
        return false;
    }
};

// 2. CORE HEALTH CHECK (STRICT MONITOR)
window.pegasusHealthCheck = async function() {
    console.log("%c--- PEGASUS HEALTH CHECK START ---", "color: #4CAF50; font-weight: bold;");
    let errors = [];
    let warnings = [];

    // 1. Core Variables Check
    if (typeof exercises === 'undefined') errors.push("Critical: Variable 'exercises' is missing.");
    if (typeof program === 'undefined') errors.push("Critical: 'program' object (data.js) not found.");

    // 2. LocalStorage Check
    const weight = localStorage.getItem("pegasus_weight");
    if (!weight || weight == 0) warnings.push("Profile: User weight is not set. Calories inaccurate.");

    // 3. Program Integrity
    if (typeof program !== 'undefined' && typeof videoMap !== 'undefined') {
        Object.keys(program).forEach(day => {
            program[day].forEach(ex => {
                if (!videoMap[ex.name] && !ex.name.toLowerCase().includes("ems")) {
                    warnings.push(`Data: Exercise '${ex.name}' in '${day}' has no video mapping.`);
                }
            });
        });
    }

    // 4. DOM Elements Check
    const essentialElements = ["btnStart", "exList", "totalProgress", "phaseTimer"];
    essentialElements.forEach(id => {
        if (!document.getElementById(id)) errors.push(`UI: Element ID '${id}' missing.`);
    });

    // 5. Offline Vault Audit
    const cacheStatus = await window.verifyPegasusCache();
    if (!cacheStatus) warnings.push("Cache: Offline Vault is incomplete. Expect buffering.");

    // RESULTS OUTPUT
    if (errors.length === 0 && warnings.length === 0) {
        console.log("%c✅ Pegasus System Healthy: All systems nominal.", "color: #4CAF50;");
    } else {
        errors.forEach(err => console.error("❌ " + err));
        warnings.forEach(wrn => console.warn("⚠️ " + wrn));
    }
    
    console.log("%c--- CHECK COMPLETE ---", "color: #4CAF50; font-weight: bold;");
    return { errors: errors.length, warnings: warnings.length };
};

// AUTO-EXECUTION
setTimeout(window.pegasusHealthCheck, 3000);
