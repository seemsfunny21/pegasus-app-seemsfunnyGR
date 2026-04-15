/* ==========================================================================
   PEGASUS COMMAND TRACER & HEALTH - v5.2 (COLLISION SHIELDED)
   Protocol: Scope Isolation & Global Var Protection
   Status: FINAL STABLE | FIXED: IDENTIFIER ALREADY DECLARED ERRORS
   ========================================================================== */

// 🛡️ Χρήση var για να μην "σκάει" αν δηλωθεί σε πολλά αρχεία
var M = M || window.PegasusManifest;

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
        console.log("🛡️ PEGASUS: Trace Log Cleared.");
    }
};

/* ==========================================================================
   PEGASUS HEALTH & LOGGER SYSTEM
   ========================================================================== */
window.PegasusLogger = {
    // 🎯 Ρυθμίσεις κλεισμένες μέσα στο αντικείμενο για αποφυγή collisions
    CONFIG: {
        MAX_ENTRIES: 50,
        getKey: function() { return window.PegasusManifest?.system?.errorLog || "pegasus_error_log"; }
    },

    log: function(message, type = "ERROR") {
        const key = this.CONFIG.getKey();
        try {
            let logs = JSON.parse(localStorage.getItem(key)) || [];
            const entry = {
                timestamp: new Date().toLocaleString('el-GR'),
                type: type,
                msg: message,
                device: (window.innerWidth <= 800) ? "Mobile" : "Desktop"
            };
            
            logs.unshift(entry);
            if (logs.length > this.CONFIG.MAX_ENTRIES) logs.pop();
            
            localStorage.setItem(key, JSON.stringify(logs));
            console.log(`%c[PEGASUS ${type}]: ${message}`, "color: #ff4444; font-weight: bold;");
        } catch (e) {
            console.error("Logger Internal Failure:", e);
        }
    },

    getLogs: function() {
        return JSON.parse(localStorage.getItem(this.CONFIG.getKey())) || [];
    }
};

/**
 * 2. CALORIE LOGIC VALIDATION
 * Mifflin-St Jeor Formula:
 * $$BMR = (10 \times weight) + (6.25 \times height) - (5 \times age) + 5$$
 */
window.verifyCalorieLogic = () => {
    const baseline = { age: 38, height: 187, weight: 74 };
    const weightKey = window.PegasusManifest?.user?.weight || "pegasus_weight";
    const currentWeight = parseFloat(localStorage.getItem(weightKey)) || 0;
    
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
 * 3. CORE HEALTH CHECK
 */
window.pegasusHealthCheck = async function() {
    console.log("%c--- PEGASUS HEALTH CHECK v5.2 ---", "color: #4CAF50; font-weight: bold;");
    let errors = [];
    let warnings = [];

    const isMobile = window.location.pathname.includes("mobile.html") || window.innerWidth <= 800;
    
    if (typeof window.program === 'undefined') errors.push("Critical: data.js not loaded.");
    if (!window.PegasusManifest) errors.push("Critical: manifest.js missing.");
    
    const lastPush = localStorage.getItem("pegasus_last_push");
    if (!lastPush) warnings.push("Sync: No Cloud Push history.");

    const essential = isMobile ? ["sync-indicator"] : ["btnStart", "exList", "totalProgress", "muscleProgressContainer"];
    essential.forEach(id => {
        if (!document.getElementById(id)) errors.push(`UI Missing: ${id}`);
    });

    window.verifyCalorieLogic();

    if (errors.length === 0 && warnings.length === 0) {
        console.log("%c✅ System Healthy & Aligned", "color: #4CAF50; font-weight: bold;");
    } else {
        errors.forEach(err => window.PegasusLogger.log(err, "HEALTH_CRITICAL"));
        warnings.forEach(wrn => console.warn("⚠️ " + wrn));
    }
};

/* ==========================================================================
   PEGASUS GARBAGE COLLECTOR (UNIVERSAL)
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
                           key.startsWith("pegasus_history_") ||
                           key.startsWith("pegasus_routine_injected_");

            if (isDaily) {
                const datePart = key.split('_').pop();
                let logDate;

                if (datePart.includes('/')) {
                    const p = datePart.split('/');
                    logDate = new Date(p[2], p[1] - 1, p[0]).getTime();
                } else if (datePart.includes('-')) {
                    logDate = new Date(datePart).getTime();
                }

                if (logDate && (now - logDate > (this.retentionDays * 86400000))) {
                    keysToDelete.push(key);
                }
            }
        }

        keysToDelete.forEach(k => { localStorage.removeItem(k); deletedCount++; });
        if (deletedCount > 0) console.log(`🧹 GC: Removed ${deletedCount} legacy records.`);
    }
};

/* ==========================================================================
   EVENT BRIDGES
   ========================================================================== */
document.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (btn && btn.id) {
        window.PegasusTracer.log(btn.id, "DOM_CLICK", "START", `Button Text: ${btn.textContent.trim()}`);
    }
}, true);

window.addEventListener('error', (e) => {
    window.PegasusLogger.log(`Runtime: ${e.message} @ ${e.filename?.split('/').pop()}:${e.lineno}`, "RUNTIME_ERROR");
});

setTimeout(() => {
    if (window.PegasusGarbageCollector) window.PegasusGarbageCollector.run();
    window.pegasusHealthCheck();
}, 5000);
