/* ==========================================================================
   PEGASUS HEALTH & DEBUG SYSTEM - v2.4 (STRICT MONITOR + CALORIE AUDIT)
   Protocol: Mifflin-St Jeor Validation for 74kg / 1.87m / 38y Male
   ========================================================================== */

// 1. CALORIE LOGIC VALIDATION
window.verifyCalorieLogic = () => {
    const stats = { age: 38, height: 187, weight: 74, gender: 'male' };
    
    // Mifflin-St Jeor Formula
    const bmr = (10 * stats.weight) + (6.25 * stats.height) - (5 * stats.age) + 5;
    const tdee = Math.round(bmr * 1.55); // Moderate activity factor
    const target = 2800; // Pegasus Target for Bulk/Volume

    console.log(`%c--- CALORIE AUDIT (STRICT) ---`, 'color: #ff9800; font-weight: bold;');
    
    const currentWeight = parseFloat(localStorage.getItem("pegasus_weight")) || 0;
    
    console.table({
        "Parameter": ["BMR (Base)", "TDEE (Maintenance)", "Pegasus Target", "User Weight"],
        "Value": [`${bmr} kcal`, `${tdee} kcal`, `${target} kcal`, `${currentWeight} kg`],
        "Status": [
            "NOMINAL", 
            "NOMINAL", 
            target > tdee ? "SURPLUS (BULK)" : "DEFICIT",
            currentWeight === stats.weight ? "MATCH" : "MISMATCH"
        ]
    });

    if (currentWeight !== stats.weight) {
        console.warn(`⚠️ Calorie Logic: Local weight (${currentWeight}kg) differs from master profile (${stats.weight}kg).`);
        return false;
    }
    return true;
};

// 2. ASYNC CACHE AUDIT ENGINE
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

    try {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        const cachedUrls = keys.map(request => {
            const url = new URL(request.url);
            return '.' + url.pathname.replace('/seemsfunny', ''); 
        });
        let missing = expectedAssets.filter(asset => !cachedUrls.some(url => url.includes(asset.replace('./', ''))));
        return missing.length === 0;
    } catch (err) { return false; }
};

// 3. CORE HEALTH CHECK
window.pegasusHealthCheck = async function() {
    console.log("%c--- PEGASUS HEALTH CHECK START ---", "color: #4CAF50; font-weight: bold;");
    let errors = [];
    let warnings = [];

    // Check Variables
    if (typeof exercises === 'undefined') errors.push("Critical: Variable 'exercises' is missing.");
    if (typeof program === 'undefined') errors.push("Critical: 'program' object missing.");

    // Check DOM
    const essentialElements = ["btnStart", "exList", "totalProgress", "phaseTimer"];
    essentialElements.forEach(id => {
        if (!document.getElementById(id)) errors.push(`UI: Element ID '${id}' missing.`);
    });

    // Check Cache
    const cacheStatus = await window.verifyPegasusCache();
    if (!cacheStatus) warnings.push("Cache: Offline Vault incomplete.");

    // Check Calories
    const calStatus = window.verifyCalorieLogic();
    if (!calStatus) warnings.push("Logic: Calorie profiles mismatch.");

    // Final Report
    if (errors.length === 0 && warnings.length === 0) {
        console.log("%c✅ Pegasus System Healthy: All systems nominal.", "color: #4CAF50;");
    } else {
        errors.forEach(err => console.error("❌ " + err));
        warnings.forEach(wrn => console.warn("⚠️ " + wrn));
    }
    console.log("%c--- CHECK COMPLETE ---", "color: #4CAF50; font-weight: bold;");
};

setTimeout(window.pegasusHealthCheck, 3000);
