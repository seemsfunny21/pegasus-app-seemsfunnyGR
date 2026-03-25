/* ==========================================================================
   PEGASUS HEALTH & DEBUG SYSTEM - v3.1 (STRICT MONITOR + PERSISTENT LOG)
   Protocol: Strict Data Analyst - Full Error Logging & Sync Guard Monitoring
   ========================================================================== */

const MAX_LOG_ENTRIES = 50;
const LOG_KEY = "pegasus_error_log";

/**
 * 1. PERSISTENT LOGGER
 * Καταγράφει σφάλματα που παραμένουν στο LocalStorage και μετά το refresh.
 */
window.PegasusLogger = {
    log: function(message, type = "ERROR") {
        try {
            let logs = JSON.parse(localStorage.getItem(LOG_KEY)) || [];
            const entry = {
                timestamp: new Date().toLocaleString('el-GR'),
                type: type,
                msg: message,
                device: (window.innerWidth <= 800 || /Android|webOS|iPhone|iPad/i.test(navigator.userAgent)) ? "Mobile" : "Desktop"
            };
            
            logs.unshift(entry); // Προσθήκη στην αρχή (νεότερο πρώτο)
            if (logs.length > MAX_LOG_ENTRIES) logs.pop(); // Διατήρηση τελευταίων 50
            
            localStorage.setItem(LOG_KEY, JSON.stringify(logs));
            console.log(`%c[PEGASUS ${type}]: ${message}`, "color: #ff4444; font-weight: bold;");
        } catch (e) {
            console.error("Logger Internal Failure:", e);
        }
    },

    getLogs: function() {
        return JSON.parse(localStorage.getItem(LOG_KEY)) || [];
    },

    clearLogs: function() {
        localStorage.removeItem(LOG_KEY);
        console.log("PEGASUS: Error logs cleared.");
    }
};

/**
 * 2. CALORIE LOGIC VALIDATION
 * Protocol: Mifflin-St Jeor Validation for 74kg / 1.87m / 38y Male
 */
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

    if (currentWeight !== stats.weight && currentWeight !== 0) {
        window.PegasusLogger.log(`Calorie Logic: Local weight (${currentWeight}kg) mismatch with Master Profile.`, "WARNING");
        return false;
    }
    return true;
};

/**
 * 3. ASYNC CACHE AUDIT ENGINE
 */
window.verifyPegasusCache = async () => {
    const CACHE_NAME = 'pegasus-media-vault-v1';
    const expectedAssets = ['./videos/beep.mp3', './videos/abcrunches.mp4', './videos/chestpress.mp4', './videos/cycling.mp4', './videos/ems.mp4', './videos/plank.mp4', './videos/pushups.mp4'];

    try {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        if (keys.length === 0) return false;
        return true;
    } catch (err) { return false; }
};

/**
 * 4. CORE HEALTH CHECK
 * Εκτελείται αυτόματα στην εκκίνηση και χειροκίνητα στην κονσόλα: pegasusHealthCheck()
 */
window.pegasusHealthCheck = async function() {
    console.log("%c--- PEGASUS HEALTH CHECK START ---", "color: #4CAF50; font-weight: bold;");
    let errors = [];
    let warnings = [];

    // Check Variables (Path sensitive)
    const isMobile = window.location.pathname.includes("mobile.html");
    if (!isMobile && typeof exercises === 'undefined') errors.push("Critical: Variable 'exercises' is missing.");
    
    // Check Sync Status
    const lastPush = localStorage.getItem("pegasus_last_push");
    if (!lastPush) warnings.push("Sync: No successful push recorded in this browser.");

    // Check DOM Elements
    const essential = isMobile ? ["sync-indicator", "btnStart"] : ["btnStart", "exList", "totalProgress"];
    essential.forEach(id => {
        if (!document.getElementById(id)) errors.push(`UI: Element ID '${id}' missing.`);
    });

    // Check Cache
    const cacheStatus = await window.verifyPegasusCache();
    if (!cacheStatus) warnings.push("Cache: Offline Vault not fully initialized.");

    // Check Calories
    verifyCalorieLogic();

    // Final Report & Logging
    if (errors.length === 0 && warnings.length === 0) {
        console.log("%c✅ Pegasus System Healthy: All systems nominal.", "color: #4CAF50;");
    } else {
        errors.forEach(err => {
            console.error("❌ " + err);
            window.PegasusLogger.log(err, "HEALTH_CRITICAL");
        });
        warnings.forEach(wrn => console.warn("⚠️ " + wrn));
    }
    console.log("%c--- CHECK COMPLETE ---", "color: #4CAF50; font-weight: bold;");
};

// 5. GLOBAL RUNTIME ERROR CATCHER
window.onerror = function(message, source, lineno, colno, error) {
    const cleanMsg = `Runtime: ${message} at ${source.split('/').pop()}:${lineno}`;
    window.PegasusLogger.log(cleanMsg, "RUNTIME_ERROR");
    return false;
};

// Αυτόματη εκτέλεση μετά από 3 δευτερόλεπτα
setTimeout(window.pegasusHealthCheck, 3000);
