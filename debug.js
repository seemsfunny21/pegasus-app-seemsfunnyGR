/* ==========================================================================
   PEGASUS HEALTH & DEBUG SYSTEM - CLEAN SWEEP v17.0
   Protocol: Strict Monitor & Logic Audit | Logic: Persistent Error Logging
   ========================================================================== */

const MAX_LOG_ENTRIES = 50;
const LOG_KEY = "pegasus_error_log";

/**
 * 1. PERSISTENT LOGGER
 * Καταγραφή συμβάντων με διατήρηση στο LocalStorage
 */
window.PegasusLogger = {
    log: function(message, type = "ERROR") {
        try {
            let logs = JSON.parse(localStorage.getItem(LOG_KEY)) || [];
            const entry = {
                timestamp: new Date().toLocaleString('el-GR'),
                type: type,
                msg: message,
                version: "17.0"
            };
            
            logs.unshift(entry); 
            if (logs.length > MAX_LOG_ENTRIES) logs.pop(); 
            
            localStorage.setItem(LOG_KEY, JSON.stringify(logs));
            
            // Console Output με Strict Green Protocol για INFO
            const color = type === "ERROR" ? "#ff4444" : "#4CAF50";
            console.log(`%c[PEGASUS ${type}]: ${message}`, `color: ${color}; font-weight: bold;`);
        } catch (e) {
            console.error("Logger Internal Failure:", e);
        }
    },

    getLogs: function() {
        return JSON.parse(localStorage.getItem(LOG_KEY)) || [];
    },

    clearLogs: function() {
        localStorage.removeItem(LOG_KEY);
        console.log("✅ PEGASUS: Logs cleared.");
    }
};

/**
 * 2. CALORIE LOGIC AUDIT
 * Επαλήθευση Mifflin-St Jeor βάσει Master Profile (74kg / 1.87m / 38y)
 */
window.verifyCalorieLogic = () => {
    const profile = window.USER_PROFILE || { weight: 74, height: 187, age: 38, gender: 'male' };
    
    // Υπολογισμός BMR (Base Metabolic Rate)
    const bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) + 5;
    const tdee = Math.round(bmr * 1.55); // Moderate activity factor
    const target = profile.targetKcal || 2800; 

    console.log(`%c--- PEGASUS CALORIE AUDIT ---`, 'color: #4CAF50; font-weight: bold;');
    
    const currentWeight = parseFloat(localStorage.getItem("pegasus_weight")) || profile.weight;
    
    console.table({
        "BMR (Base)": { Value: `${bmr} kcal`, Status: "NOMINAL" },
        "TDEE (Maintenance)": { Value: `${tdee} kcal`, Status: "NOMINAL" },
        "Pegasus Target": { Value: `${target} kcal`, Status: target > tdee ? "SURPLUS (BULK)" : "DEFICIT" },
        "Profile Sync": { Value: `${currentWeight} kg`, Status: currentWeight === profile.weight ? "MATCH" : "MISMATCH" }
    });

    if (currentWeight !== profile.weight) {
        window.PegasusLogger.log(`Weight Mismatch: Local (${currentWeight}kg) vs Master (${profile.weight}kg)`, "WARNING");
        return false;
    }
    return true;
};

/**
 * 3. CORE HEALTH CHECK
 * Αυτόματος έλεγχος ζωτικών λειτουργιών UI και Δεδομένων
 */
window.pegasusHealthCheck = async function() {
    console.log("%c--- PEGASUS OS HEALTH CHECK ---", "color: #4CAF50; font-weight: bold;");
    let errors = [];

    // Έλεγχος Engine Components
    if (typeof window.calculateDailyProgram !== 'function') errors.push("Engine: data.js not responding.");
    if (typeof window.PegasusCloud === 'undefined') errors.push("Sync: cloudSync.js missing.");
    
    // Έλεγχος DOM (Essential Elements)
    const essential = ["btnStart", "exList", "totalProgress", "navbar"];
    essential.forEach(id => {
        if (!document.getElementById(id)) errors.push(`UI: Element '${id}' missing from DOM.`);
    });

    // Έλεγχος Υγείας Θερμίδων
    window.verifyCalorieLogic();

    // Τελική Αναφορά
    if (errors.length === 0) {
        console.log("%c✅ SYSTEM NOMINAL: All modules operational.", "color: #4CAF50; font-weight: bold;");
    } else {
        errors.forEach(err => {
            console.error("❌ " + err);
            window.PegasusLogger.log(err, "HEALTH_CRITICAL");
        });
    }
    console.log("%c-------------------------------", "color: #4CAF50; font-weight: bold;");
};

/**
 * 4. GLOBAL RUNTIME CATCHER
 */
window.onerror = function(message, source, lineno, colno, error) {
    const fileName = source ? source.split('/').pop() : "unknown";
    window.PegasusLogger.log(`Runtime: ${message} at ${fileName}:${lineno}`, "RUNTIME_ERROR");
    return false;
};

// Εκτέλεση Health Check μετά τη φόρτωση
setTimeout(() => window.pegasusHealthCheck(), 3000);