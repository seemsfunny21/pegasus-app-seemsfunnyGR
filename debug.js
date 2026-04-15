/* ==========================================================================
   PEGASUS COMMAND TRACER - v1.0 (ANTI-SILENT FAIL PROTOCOL)
   ========================================================================== */

window.PegasusTracer = {
    logs: JSON.parse(localStorage.getItem("pegasus_command_trace") || "[]"),

    log: function(btnId, step, status, details = "") {
        const entry = {
            timestamp: new Date().toLocaleTimeString(),
            button: btnId,
            step: step,        // π.χ. "Trigger", "Auth Check", "DB Open", "Finalize"
            status: status,    // "START", "PENDING", "SUCCESS", "ERROR"
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
   INTERCEPTION BRIDGE: Σύνδεση με το app.js
   ========================================================================== */
document.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (btn && btn.id) {
        window.PegasusTracer.log(btn.id, "DOM_CLICK", "START", `Button Text: ${btn.textContent}`);
    }
}, true);

/* ==========================================================================
   PEGASUS HEALTH & DEBUG SYSTEM - v3.3 (STRICT MONITOR + PERSISTENT LOG)
   Protocol: Strict Data Analyst - Full Error Logging & Sync Guard Monitoring
   Status: FINAL STABLE | FIXED: WEIGHT LOGIC & EXPANDED GC
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
                device: (window.innerWidth <= 800 || /Android|webOS|iPhone|iPad/i.test(navigator.userAgent)) ? "Mobile" : "Desktop"
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
    },

    clearLogs: function() {
        localStorage.removeItem(LOG_KEY);
        console.log("PEGASUS: Error logs cleared.");
    }
};

/**
 * 2. CALORIE LOGIC VALIDATION (v3.3 - DYNAMIC RANGE)
 * Protocol: Mifflin-St Jeor Validation
 */
window.verifyCalorieLogic = () => {
    const baseline = { age: 38, height: 187, weight: 74 };
    const currentWeight = parseFloat(localStorage.getItem("pegasus_weight")) || 0;
    
    // 🎯 FIXED: Δυναμικός υπολογισμός BMR βάσει του ΤΩΡΙΝΟΥ βάρους (αν υπάρχει)
    const activeWeight = currentWeight > 0 ? currentWeight : baseline.weight;
    const bmr = (10 * activeWeight) + (6.25 * baseline.height) - (5 * baseline.age) + 5;
    const tdee = Math.round(bmr * 1.55);
    const target = 2800;

    console.log(`%c--- CALORIE AUDIT (DYNAMIC) ---`, 'color: #ff9800; font-weight: bold;');
    
    console.table({
        "0": { Parameter: "Active Weight", Value: `${activeWeight} kg`, Status: currentWeight > 0 ? "OK" : "USING_BASELINE" },
        "1": { Parameter: "BMR (Current)", Value: `${bmr.toFixed(0)} kcal`, Status: "NOMINAL" },
        "2": { Parameter: "TDEE (Activity 1.55)", Value: `${tdee} kcal`, Status: "NOMINAL" },
        "3": { Parameter: "Pegasus Target", Value: `${target} kcal`, Status: target > tdee ? "SURPLUS (BULK)" : "DEFICIT" }
    });

    // 🛡️ Έλεγχος μόνο για ακραίες τιμές (Safety Guard)
    if (currentWeight > 150 || (currentWeight < 40 && currentWeight !== 0)) {
        window.PegasusLogger.log(`Calorie Logic: Extreme weight detected (${currentWeight}kg). Check sensors.`, "WARNING");
        return false;
    }
    return true;
};

/**
 * 3. ASYNC CACHE AUDIT ENGINE
 */
window.verifyPegasusCache = async () => {
    const CACHE_NAME = 'pegasus-shield-v3.2-DYNAMIC'; 
    try {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        return keys.length > 0;
    } catch (err) { return false; }
};

/**
 * 4. CORE HEALTH CHECK
 */
window.pegasusHealthCheck = async function() {
    console.log("%c--- PEGASUS HEALTH CHECK START ---", "color: #4CAF50; font-weight: bold;");
    let errors = [];
    let warnings = [];

    const isMobile = window.location.pathname.includes("mobile.html");
    
    if (typeof window.program === 'undefined') {
        errors.push("Critical: Dynamic Engine (data.js) not found or window.program undefined.");
    }
    
    const lastPush = localStorage.getItem("pegasus_last_push");
    if (!lastPush) warnings.push("Sync: No successful push recorded in this browser.");

    const essential = isMobile ? ["sync-indicator"] : ["btnStart", "exList", "totalProgress"];
    essential.forEach(id => {
        if (!document.getElementById(id)) errors.push(`UI: Element ID '${id}' missing.`);
    });

    const cacheStatus = await window.verifyPegasusCache();
    if (!cacheStatus) warnings.push("Cache: Offline Vault not fully initialized.");

    window.verifyCalorieLogic();

    if (errors.length === 0 && warnings.length === 0) {
        console.log("%c✅ Pegasus System Healthy: All systems nominal.", "color: #4CAF50; font-weight: bold; font-size: 12px;");
    } else {
        errors.forEach(err => {
            console.error("❌ " + err);
            window.PegasusLogger.log(err, "HEALTH_CRITICAL");
        });
        warnings.forEach(wrn => console.warn("⚠️ " + wrn));
    }
    console.log("%c--- CHECK COMPLETE ---", "color: #4CAF50; font-weight: bold;");
};

/* ==========================================================================
   PEGASUS GARBAGE COLLECTOR (v13.1 - EXPANDED PRUNING)
   Status: FINAL STABLE | PROTECTS STORAGE QUOTA
   ========================================================================== */
window.PegasusGarbageCollector = {
    retentionDays: 60,

    run: function() {
        console.log("🧹 PEGASUS GC: Initiating Full Storage Scan...");
        const now = new Date();
        let deletedCount = 0;
        let keysToDelete = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;

            // 🎯 FIXED: Καθαρισμός ΟΛΩΝ των ημερήσιων κλειδιών που συσσωρεύονται
            const isDailyKey = key.startsWith("food_log_") || 
                               key.startsWith("pegasus_cardio_kcal_") || 
                               key.startsWith("pegasus_routine_injected_");

            if (isDailyKey) {
                const datePart = key.split('_').pop(); 
                const parts = datePart.split('/');
                
                if (parts.length === 3) {
                    const logDate = new Date(parts[2], parts[1] - 1, parts[0]);
                    const diffDays = Math.ceil(Math.abs(now - logDate) / (1000 * 60 * 60 * 24)); 

                    if (diffDays > this.retentionDays) {
                        keysToDelete.push(key);
                    }
                }
            }
        }

        keysToDelete.forEach(key => {
            localStorage.removeItem(key);
            deletedCount++;
        });

        if (deletedCount > 0) {
            console.log(`✅ GC: Cleared ${deletedCount} obsolete daily records.`);
            if (window.PegasusCloud) window.PegasusCloud.push();
        } else {
            console.log("🧹 GC: Storage is optimal.");
        }
    }
};

// 5. GLOBAL RUNTIME ERROR CATCHER
window.addEventListener('error', function(event) {
    const fileName = event.filename ? event.filename.split('/').pop() : "unknown";
    const cleanMsg = `Runtime: ${event.message} at ${fileName}:${event.lineno}`;
    window.PegasusLogger.log(cleanMsg, "RUNTIME_ERROR");
});

// Boot Sequence
setTimeout(() => {
    if (window.PegasusGarbageCollector) window.PegasusGarbageCollector.run();
    window.pegasusHealthCheck();
}, 5000);
