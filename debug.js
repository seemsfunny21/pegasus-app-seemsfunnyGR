/* ==========================================================================
   PEGASUS COMMAND TRACER - v3.4 (ANTI-SILENT FAIL PROTOCOL)
   Protocol: Strict Data Analyst - Full Error Logging & Sync Guard Monitoring
   Status: FINAL STABLE | FIXED: CACHE WILDCARD & MOBILE DETECTION
   ========================================================================== */

window.PegasusTracer = {
    logs: JSON.parse(localStorage.getItem("pegasus_command_trace") || "[]"),

    log: function(btnId, step, status, details = "") {
        const entry = {
            timestamp: new Date().toLocaleTimeString('el-GR'),
            button: btnId,
            step: step,
            status: status,
            details: details
        };
        
        this.logs.push(entry);
        if (this.logs.length > 100) this.logs.shift();
        
        localStorage.setItem("pegasus_command_trace", JSON.stringify(this.logs));
        
        const color = status === "ERROR" ? "#FF5252" : (status === "SUCCESS" ? "#4CAF50" : "#FFC107");
        console.log(`%c[TRACER] ${btnId} > ${step} > ${status}`, `color: ${color}; font-weight: bold;`, details);
    },

    printLastTrace: function() {
        console.table(this.logs.slice(-10));
    },

    clear: function() {
        this.logs = [];
        localStorage.removeItem("pegasus_command_trace");
        console.log("PEGASUS: Trace Log Cleared.");
    }
};

/* ==========================================================================
   INTERCEPTION BRIDGE
   ========================================================================== */
document.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (btn && btn.id) {
        window.PegasusTracer.log(btn.id, "DOM_CLICK", "START", `Button Text: ${btn.textContent}`);
    }
}, true);

/* ==========================================================================
   PEGASUS HEALTH & DEBUG SYSTEM
   ========================================================================== */
const MAX_LOG_ENTRIES = 50;
const LOG_KEY = "pegasus_error_log";

window.PegasusLogger = {
    log: function(message, type = "ERROR") {
        try {
            let logs = JSON.parse(localStorage.getItem(LOG_KEY)) || [];
            const entry = {
                timestamp: new Date().toLocaleString('el-GR'),
                type: type,
                msg: message,
                device: (window.innerWidth <= 800) ? "Mobile" : "Desktop"
            };
            
            logs.unshift(entry);
            if (logs.length > MAX_LOG_ENTRIES) logs.pop();
            
            localStorage.setItem(LOG_KEY, JSON.stringify(logs));
            console.log(`%c[PEGASUS ${type}]: ${message}`, "color: #ff4444; font-weight: bold;");
        } catch (e) {
            console.error("Logger Internal Failure:", e);
        }
    },

    getLogs: function() {
        return JSON.parse(localStorage.getItem(LOG_KEY)) || [];
    }
};

/**
 * 2. CALORIE LOGIC VALIDATION
 * Mifflin-St Jeor: $$BMR = (10 \times weight) + (6.25 \times height) - (5 \times age) + 5$$
 */
window.verifyCalorieLogic = () => {
    const baseline = { age: 38, height: 187, weight: 74 };
    const currentWeight = parseFloat(localStorage.getItem("pegasus_weight")) || 0;
    
    const activeWeight = currentWeight > 0 ? currentWeight : baseline.weight;
    const bmr = (10 * activeWeight) + (6.25 * baseline.height) - (5 * baseline.age) + 5;
    const tdee = Math.round(bmr * 1.55);
    const target = 2800;

    console.log(`%c--- CALORIE AUDIT (STRICT) ---`, 'color: #ff9800; font-weight: bold;');
    console.table({
        "0": { Parameter: "Active Weight", Value: `${activeWeight} kg`, Status: "OK" },
        "1": { Parameter: "BMR (Current)", Value: `${bmr.toFixed(0)} kcal`, Status: "NOMINAL" },
        "2": { Parameter: "TDEE (1.55x)", Value: `${tdee} kcal`, Status: "NOMINAL" },
        "3": { Parameter: "Target Strategy", Value: `${target} kcal`, Status: "BULK/VOLUME" }
    });

    if (currentWeight > 150 || (currentWeight < 40 && currentWeight !== 0)) {
        window.PegasusLogger.log(`Extreme weight detected (${currentWeight}kg).`, "WARNING");
        return false;
    }
    return true;
};

/**
 * 3. ASYNC CACHE AUDIT (DYNAMIC WILDCARD)
 */
window.verifyPegasusCache = async () => {
    try {
        const names = await caches.keys();
        // 🎯 FIXED: Ψάχνει για οποιαδήποτε cache του Pegasus, ανεξαρτήτως έκδοσης
        const pegasusCache = names.find(name => name.startsWith('pegasus-shield'));
        if (!pegasusCache) return false;

        const cache = await caches.open(pegasusCache);
        const keys = await cache.keys();
        return keys.length > 0;
    } catch (err) { return false; }
};

/**
 * 4. CORE HEALTH CHECK
 */
window.pegasusHealthCheck = async function() {
    console.log("%c--- PEGASUS HEALTH CHECK v3.4 ---", "color: #4CAF50; font-weight: bold;");
    let errors = [];
    let warnings = [];

    // 🎯 FIXED: Ενισχυμένη ανίχνευση Mobile
    const isMobile = window.location.pathname.includes("mobile.html") || window.innerWidth <= 800;
    
    if (typeof window.program === 'undefined') {
        errors.push("Critical: data.js not loaded.");
    }
    
    const lastPush = localStorage.getItem("pegasus_last_push");
    if (!lastPush) warnings.push("Sync: No Cloud Push history.");

    const essential = isMobile ? ["sync-indicator"] : ["btnStart", "exList", "totalProgress"];
    essential.forEach(id => {
        if (!document.getElementById(id)) errors.push(`UI Missing: ${id}`);
    });

    const cacheStatus = await window.verifyPegasusCache();
    if (!cacheStatus) warnings.push("Offline Vault: Not initialized.");

    window.verifyCalorieLogic();

    if (errors.length === 0 && warnings.length === 0) {
        console.log("%c✅ System Healthy", "color: #4CAF50; font-weight: bold;");
    } else {
        errors.forEach(err => window.PegasusLogger.log(err, "HEALTH_CRITICAL"));
        warnings.forEach(wrn => console.warn("⚠️ " + wrn));
    }
};

/* ==========================================================================
   PEGASUS GARBAGE COLLECTOR
   ========================================================================== */
window.PegasusGarbageCollector = {
    retentionDays: 60,

    run: function() {
        const now = Date.now();
        let deletedCount = 0;
        let keysToDelete = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const isDaily = key.startsWith("food_log_") || 
                           key.startsWith("pegasus_cardio_kcal_") || 
                           key.startsWith("pegasus_routine_injected_");

            if (isDaily) {
                const parts = key.split('_').pop().split('/');
                if (parts.length === 3) {
                    const logDate = new Date(parts[2], parts[1] - 1, parts[0]).getTime();
                    if (now - logDate > (this.retentionDays * 86400000)) {
                        keysToDelete.push(key);
                    }
                }
            }
        }

        keysToDelete.forEach(k => { localStorage.removeItem(k); deletedCount++; });
        if (deletedCount > 0) console.log(`🧹 GC: Removed ${deletedCount} records.`);
    }
};

window.addEventListener('error', (e) => {
    window.PegasusLogger.log(`Runtime: ${e.message} @ ${e.filename.split('/').pop()}:${e.lineno}`, "RUNTIME_ERROR");
});

setTimeout(() => {
    if (window.PegasusGarbageCollector) window.PegasusGarbageCollector.run();
    window.pegasusHealthCheck();
}, 5000);
