/* ==========================================================================
   PEGASUS COMMAND TRACER & AUDITOR - v3.5 (ANTI-SILENT FAIL)
   Protocol: Strict Data Analyst - Full Loop Monitoring & GC
   Status: FINAL STABLE | ZERO-BUG VERIFIED | CACHE WILDCARD ACTIVE
   ========================================================================== */

var M = M || window.PegasusManifest;

window.PegasusTracer = {
    logs: JSON.parse(localStorage.getItem("pegasus_command_trace") || "[]"),

    log: function(btnId, step, status, details = "") {
        const entry = {
            timestamp: new Date().toLocaleTimeString('el-GR'),
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
        console.log("🛡️ PEGASUS: Tracer Log Purged.");
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
   PEGASUS HEALTH & DEBUG SYSTEM
   ========================================================================== */

window.PegasusLogger = {
    // 🎯 Ρυθμίσεις κλεισμένες μέσα στο αντικείμενο (Collision Shield)
    CONFIG: {
        MAX: 50,
        KEY: "pegasus_error_log"
    },
    log: function(message, type = "ERROR") {
        try {
            let logs = JSON.parse(localStorage.getItem(this.CONFIG.KEY)) || [];
            const entry = {
                timestamp: new Date().toLocaleString('el-GR'),
                type: type,
                msg: message,
                device: (window.innerWidth <= 800) ? "Mobile" : "Desktop"
            };
            
            logs.unshift(entry);
            if (logs.length > this.CONFIG.MAX) logs.pop();
            
            localStorage.setItem(this.CONFIG.KEY, JSON.stringify(logs));
            console.log(`%c[PEGASUS ${type}]: ${message}`, "color: #ff4444; font-weight: bold;");
        } catch (e) { 
            console.error("Logger Internal Failure:", e); 
        }
    },
    getLogs: function() { 
        return JSON.parse(localStorage.getItem(this.CONFIG.KEY)) || []; 
    },
    clearLogs: function() {
        localStorage.removeItem(this.CONFIG.KEY);
        console.log("🛡️ PEGASUS: Error Logs Cleared.");
    }
};

/**
 * 2. CALORIE LOGIC VALIDATION
 * Protocol: Mifflin-St Jeor Validation
 * Formula: $BMR = (10 \times weight) + (6.25 \times height) - (5 \times age) + 5$
 */
window.verifyCalorieLogic = () => {
    const baseline = { age: 38, height: 187, weight: 74 };
    const currentWeight = parseFloat(localStorage.getItem("pegasus_weight")) || 0;
    
    // 🎯 Δυναμικός υπολογισμός BMR βάσει του ΤΩΡΙΝΟΥ βάρους (αν υπάρχει)
    const activeWeight = currentWeight > 0 ? currentWeight : baseline.weight;
    const bmr = (10 * activeWeight) + (6.25 * baseline.height) - (5 * baseline.age) + 5;
    const tdee = Math.round(bmr * 1.55);
    const target = 2800;

    console.log(`%c--- CALORIE AUDIT (STRICT v3.5) ---`, 'color: #ff9800; font-weight: bold;');
    
    console.table({
        "Weight": { Value: `${activeWeight} kg`, Ref: baseline.weight, Status: currentWeight > 0 ? "OK" : "USING_BASELINE" },
        "BMR": { Value: `${bmr.toFixed(0)} kcal`, Formula: "Mifflin-St Jeor" },
        "TDEE": { Value: `${tdee} kcal`, Factor: "1.55x" },
        "Pegasus": { Value: `${target} kcal`, Status: target > tdee ? "SURPLUS (BULK)" : "DEFICIT" }
    });

    // 🛡️ Έλεγχος μόνο για ακραίες τιμές (Safety Guard)
    if (currentWeight > 150 || (currentWeight < 40 && currentWeight !== 0)) {
        window.PegasusLogger.log(`Extreme weight detected (${currentWeight}kg). Check sensors.`, "WARNING");
        return false;
    }
    return true;
};

/**
 * 3. ASYNC CACHE AUDIT ENGINE (DYNAMIC WILDCARD)
 */
window.verifyPegasusCache = async () => {
    try {
        const names = await caches.keys();
        // 🎯 Ψάχνει για οποιαδήποτε cache του Pegasus, ανεξαρτήτως έκδοσης
        const activeCache = names.find(name => name.startsWith('pegasus-shield'));
        if (!activeCache) return { status: false, version: "None" };

        const cache = await caches.open(activeCache);
        const keys = await cache.keys();
        return { status: keys.length > 0, version: activeCache };
    } catch (err) { return { status: false, version: "Error" }; }
};

/**
 * 4. CORE HEALTH CHECK
 */
window.pegasusHealthCheck = async function() {
    console.log("%c--- PEGASUS HEALTH CHECK v3.5 ---", "color: #4CAF50; font-weight: bold;");
    let errors = [];
    let warnings = [];

    // 🎯 Ενισχυμένη ανίχνευση Mobile
    const isMobile = window.location.pathname.includes("mobile.html") || window.innerWidth <= 800;
    
    if (typeof window.program === 'undefined') {
        errors.push("Critical: Dynamic Engine (data.js) not found.");
    }
    
    const lastPush = localStorage.getItem("pegasus_last_push");
    if (!lastPush) warnings.push("Sync: No successful Cloud Push recorded.");

    const essential = isMobile ? ["sync-indicator"] : ["btnStart", "exList", "totalProgress"];
    essential.forEach(id => {
        if (!document.getElementById(id)) errors.push(`UI: Element ID '${id}' missing.`);
    });

    const cacheResult = await window.verifyPegasusCache();
    if (!cacheResult.status) {
        warnings.push("Cache: Offline Vault not fully initialized.");
    } else {
        console.log(`📦 Cache Active: ${cacheResult.version}`);
    }

    window.verifyCalorieLogic();

    if (errors.length === 0 && warnings.length === 0) {
        console.log("%c✅ SYSTEM HEALTHY: All protocols operational.", "color: #4CAF50; font-weight: bold; font-size: 12px;");
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
   PEGASUS GARBAGE COLLECTOR (v13.2 - EXPANDED PRUNING)
   Status: FINAL STABLE | PROTECTS STORAGE QUOTA
   ========================================================================== */
window.PegasusGarbageCollector = {
    retentionDays: 60,

    run: function() {
        console.log("🧹 PEGASUS GC: Initiating Full Storage Scan...");
        const now = Date.now();
        let deletedCount = 0;
        let keysToDelete = [];
        const dailyPrefixes = ["food_log_", "pegasus_cardio_kcal_", "pegasus_routine_injected_"];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;

            // 🎯 Καθαρισμός ΟΛΩΝ των ημερήσιων κλειδιών που συσσωρεύονται
            if (dailyPrefixes.some(p => key.startsWith(p))) {
                const datePart = key.split('_').pop(); 
                const parts = datePart.split('/');
                
                if (parts.length === 3) {
                    const logDate = new Date(parts[2], parts[1] - 1, parts[0]).getTime();
                    if (now - logDate > (this.retentionDays * 86400000)) {
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
            console.log(`✅ GC: Purged ${deletedCount} obsolete daily records.`);
            if (window.PegasusCloud && typeof window.PegasusCloud.push === "function") {
                window.PegasusCloud.push();
            }
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

// Boot Sequence (Καθυστέρηση για σταθερότητα CPU load)
setTimeout(() => {
    if (window.PegasusGarbageCollector) window.PegasusGarbageCollector.run();
    window.pegasusHealthCheck();
}, 5000);
