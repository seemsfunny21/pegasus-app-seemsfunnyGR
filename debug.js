/* ==========================================================================
   PEGASUS COMMAND TRACER - v1.0 (ANTI-SILENT FAIL PROTOCOL)
   ========================================================================== */

window.PegasusTracer = {
    logs: JSON.parse(localStorage.getItem("pegasus_command_trace") || "[]"),

    // Καταγραφή ενέργειας
    log: function(btnId, step, status, details = "") {
        const entry = {
            timestamp: new Date().toLocaleTimeString(),
            button: btnId,
            step: step,        // π.χ. "Trigger", "Auth Check", "DB Open", "Finalize"
            status: status,    // "START", "PENDING", "SUCCESS", "ERROR"
            details: details
        };
        
        this.logs.push(entry);
        // Κρατάμε μόνο τα τελευταία 100 βήματα για οικονομία χώρου
        if (this.logs.length > 100) this.logs.shift();
        
        localStorage.setItem("pegasus_command_trace", JSON.stringify(this.logs));
        
        // Output στην κονσόλα με χρώμα για άμεση διάγνωση
        const color = status === "ERROR" ? "#FF5252" : (status === "SUCCESS" ? "#4CAF50" : "#FFC107");
        console.log(`%c[TRACER] ${btnId} > ${step} > ${status}`, `color: ${color}; font-weight: bold;`, details);
    },

    // Εμφάνιση της διαδρομής του τελευταίου κουμπιού που πατήθηκε
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
// Αυτό το κομμάτι "τυλίγει" τα υπάρχοντα κουμπιά για να ξέρουμε πότε πατήθηκαν
document.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (btn && btn.id) {
        window.PegasusTracer.log(btn.id, "DOM_CLICK", "START", `Button Text: ${btn.textContent}`);
    }
}, true);

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
        "0": { Parameter: "BMR (Base)", Value: `${bmr} kcal`, Status: "NOMINAL" },
        "1": { Parameter: "TDEE (Maintenance)", Value: `${tdee} kcal`, Status: "NOMINAL" },
        "2": { Parameter: "Pegasus Target", Value: `${target} kcal`, Status: target > tdee ? "SURPLUS (BULK)" : "DEFICIT" },
        "3": { Parameter: "User Weight", Value: `${currentWeight} kg`, Status: currentWeight === stats.weight ? "MATCH" : "MISMATCH" }
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

    const isMobile = window.location.pathname.includes("mobile.html");
    
    // ΕΛΕΓΧΟΣ ΔΕΔΟΜΕΝΩΝ (DATA ENGINE)
    // Ελέγχουμε αν υπάρχει το window.program (το νέο format του data.js)
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
   PEGASUS GARBAGE COLLECTOR (v13.0 AUTO-PRUNING)
   ========================================================================== */
window.PegasusGarbageCollector = {
    retentionDays: 60, // Όριο: 2 Μήνες

    run: function() {
        console.log("🧹 PEGASUS GC: Initiating Storage Scan...");
        const now = new Date();
        let deletedCount = 0;
        let keysToDelete = [];

        // 1. Σάρωση όλου του LocalStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);

            // Εντοπισμός των Food Logs (Μορφή: food_log_DD/MM/YYYY)
            if (key && key.startsWith("food_log_")) {
                const dateStr = key.replace("food_log_", ""); 
                const parts = dateStr.split('/');
                
                // Αν η ημερομηνία είναι έγκυρη (DD/MM/YYYY)
                if (parts.length === 3) {
                    const logDate = new Date(parts[2], parts[1] - 1, parts[0]);
                    const diffTime = Math.abs(now - logDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

                    // Αν πέρασαν 60+ μέρες, βάλτο στη λίστα διαγραφής
                    if (diffDays > this.retentionDays) {
                        keysToDelete.push(key);
                    }
                }
            }
        }

        // 2. Μαζική Διαγραφή & Απελευθέρωση Μνήμης
        keysToDelete.forEach(key => {
            localStorage.removeItem(key);
            deletedCount++;
        });

        // 3. System Feedback
        if (deletedCount > 0) {
            console.log(`🧹 PEGASUS GC: Cleared ${deletedCount} obsolete logs. Memory freed.`);
            // Προαιρετικό: Ενημέρωση του Cloud για τον καθαρισμό
            if (window.PegasusCloud) window.PegasusCloud.push(true);
        } else {
            console.log("🧹 PEGASUS GC: Storage is optimal. No action required.");
        }
    }
};


// 5. GLOBAL RUNTIME ERROR CATCHER
window.onerror = function(message, source, lineno, colno, error) {
    const fileName = source ? source.split('/').pop() : "unknown";
    const cleanMsg = `Runtime: ${message} at ${fileName}:${lineno}`;
    window.PegasusLogger.log(cleanMsg, "RUNTIME_ERROR");
    return false;
};

// ΑΥΞΗΣΗ ΚΑΘΥΣΤΕΡΗΣΗΣ ΣΕ 5 ΔΕΥΤΕΡΟΛΕΠΤΑ (Για απόλυτο συγχρονισμό)
setTimeout(() => {
    // 🧹 Εκτέλεση Καθαρισμού Μνήμης στο Παρασκήνιο
    if (window.PegasusGarbageCollector) {
        window.PegasusGarbageCollector.run();
    }
    
    window.pegasusHealthCheck();
}, 5000);
