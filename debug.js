/* ==========================================================================
   PEGASUS HEALTH & DEBUG SYSTEM - v4.0 (MODULAR / FULLY DECOUPLED)
   Protocol: Strict Data Analyst - Full Error Logging & Sync Guard Monitoring
   ========================================================================== */

const PegasusDebug = (function() {
    // 1. ΙΔΙΩΤΙΚΟ STATE & ΣΤΑΘΕΡΕΣ (Private Configuration)
    const MAX_LOG_ENTRIES = 50;
    const LOG_KEY = "pegasus_error_log";

    // 2. ΥΠΟΣΥΣΤΗΜΑ ΚΑΤΑΓΡΑΦΗΣ (Persistent Logger)
    const logger = {
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
            console.log("[PEGASUS DEBUG]: Error logs cleared.");
        }
    };

    // 3. ΕΛΕΓΧΟΣ ΛΟΓΙΚΗΣ ΘΕΡΜΙΔΩΝ (Calorie Logic Validation)
    // Protocol: Mifflin-St Jeor Validation for 74kg / 1.87m / 38y Male
    const verifyCalorieLogic = () => {
        const stats = { age: 38, height: 187, weight: 74, gender: 'male' };
        
        const bmr = (10 * stats.weight) + (6.25 * stats.height) - (5 * stats.age) + 5;
        const tdee = Math.round(bmr * 1.55); 
        const target = 2800; 

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
            logger.log(`Calorie Logic: Local weight (${currentWeight}kg) mismatch with Master Profile.`, "WARNING");
            return false;
        }
        return true;
    };

    // 4. ΕΛΕΓΧΟΣ CACHE (Async Cache Audit Engine)
    const verifyCache = async () => {
        const CACHE_NAME = 'pegasus-media-vault-v1';
        try {
            if (!('caches' in window)) return false;
            const cache = await caches.open(CACHE_NAME);
            const keys = await cache.keys();
            return keys.length > 0;
        } catch (err) { return false; }
    };

    // 5. ΚΕΝΤΡΙΚΟΣ ΕΛΕΓΧΟΣ ΥΓΕΙΑΣ (Core Health Check)
    const runHealthCheck = async () => {
        console.log("%c--- PEGASUS HEALTH CHECK START ---", "color: #4CAF50; font-weight: bold;");
        let errors = [];
        let warnings = [];

        const isMobile = window.location.pathname.includes("mobile.html");
        
        const lastPush = localStorage.getItem("pegasus_last_push");
        if (!lastPush) warnings.push("Sync: No successful push recorded in this browser.");

        const essential = isMobile ? ["sync-indicator", "btnStart"] : ["btnStart", "exList", "totalProgress"];
        essential.forEach(id => {
            if (!document.getElementById(id)) errors.push(`UI: Element ID '${id}' missing.`);
        });

        const cacheStatus = await verifyCache();
        if (!cacheStatus) warnings.push("Cache: Offline Vault not fully initialized.");

        verifyCalorieLogic();

        if (errors.length === 0 && warnings.length === 0) {
            console.log("%c✅ Pegasus System Healthy: All systems nominal.", "color: #4CAF50;");
        } else {
            errors.forEach(err => {
                console.error("❌ " + err);
                logger.log(err, "HEALTH_CRITICAL");
            });
            warnings.forEach(wrn => console.warn("⚠️ " + wrn));
        }
        console.log("%c--- CHECK COMPLETE ---", "color: #4CAF50; font-weight: bold;");
    };

    // 6. PUBLIC API & INITIALIZATION
    return {
        init: function() {
            // Global Runtime Error Catcher
            window.onerror = function(message, source, lineno, colno, error) {
                const cleanMsg = `Runtime: ${message} at ${source ? source.split('/').pop() : 'unknown'}:${lineno}`;
                logger.log(cleanMsg, "RUNTIME_ERROR");
                return false;
            };

            // Αυτόματη εκτέλεση μετά από 3 δευτερόλεπτα
            setTimeout(runHealthCheck, 3000);
        },
        logger: logger,
        healthCheck: runHealthCheck,
        verifyCalories: verifyCalorieLogic
    };
})();

// Εκκίνηση και εξαγωγή Fallback
window.addEventListener('DOMContentLoaded', PegasusDebug.init);
window.PegasusLogger = PegasusDebug.logger;
window.pegasusHealthCheck = PegasusDebug.healthCheck;
window.verifyCalorieLogic = PegasusDebug.verifyCalories;