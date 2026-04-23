/* ==========================================================================
   PEGASUS OS - BIOMETRIC WEIGHT TRACKER (v1.4 - MANIFEST ALIGNED)
   Protocol: Daily Weight Logging, Moving Average & Master Variable Sync
   Status: FINAL STABLE | FIXED: MANIFEST DESYNC & EVENT FALLBACKS
   ========================================================================== */

var M = M || window.PegasusManifest;
const WEIGHT_KEY = M?.user?.weight || 'pegasus_weight';
const HISTORY_KEY = M?.user?.weight_history || 'pegasus_weight_history';

window.PegasusWeight = {
    // 1. Καταγραφή βάρους (Συμβατό με Mobile & Desktop)
    save: function(val) {
        // 🎯 FIXED: Αν κληθεί χωρίς τιμή (ή με Event object από το UI), ψάχνει αυτόματα τα inputs
        let rawVal = val;
        if (rawVal === undefined || typeof rawVal === 'object') {
            const inputEl = document.getElementById('mobileWeightInput') || document.getElementById('userWeightInput');
            rawVal = inputEl ? inputEl.value : null;
        }

        if (!rawVal) return;

        // 🛡️ RANGE & NaN GUARD: Μετατροπή και αυστηρός έλεγχος
        const safeVal = String(rawVal).replace(',', '.');
        const weight = parseFloat(safeVal);
        
        // Αποκλεισμός εξωπραγματικών τιμών
        if (isNaN(weight) || weight < 30 || weight > 250) {
            if (window.PegasusLogger) window.PegasusLogger.log(`Invalid weight input: ${rawVal}`, "WARNING");
            alert("PEGASUS STRICT: Παρακαλώ εισάγετε ένα έγκυρο βάρος (30-250 kg).");
            return;
        }

        const now = new Date();
        const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}");
        history[dateKey] = weight;
        
        // Αποθήκευση τοπικά μέσω Manifest Keys
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        localStorage.setItem(WEIGHT_KEY, weight);
        
        // 🟢 FORCE UPDATE: Ενημέρωση της κεντρικής μεταβλητής του app.js και της μηχανής μεταβολισμού
        if (typeof window !== 'undefined') {
            window.userWeight = weight;
            if (window.PegasusMetabolic) window.PegasusMetabolic.renderUI();
            if (typeof window.verifyCalorieLogic === "function") window.verifyCalorieLogic(); // 🎯 Health Check Sync
        }
        
        console.log(`⚖️ PEGASUS DATA: Weight logged: ${weight}kg`);
        
        // Αποστολή στο Cloud
        if (window.PegasusCloud && typeof window.PegasusCloud.push === "function") {
            window.PegasusCloud.push(true);
        }
        
        this.updateUI();
        alert(`✅ Βάρος καταγράφηκε: ${weight} kg`);
    },

    // 2. Υπολογισμός μέσου όρου με Χρονολογική Ταξινόμηση
    getWeeklyAverage: function() {
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}");
        
        const sortedKeys = Object.keys(history).sort();
        if (sortedKeys.length === 0) return null;

        const last7Keys = sortedKeys.slice(-7);
        const last7Values = last7Keys.map(k => history[k]);
        
        const sum = last7Values.reduce((acc, val) => acc + val, 0);
        return (sum / last7Values.length).toFixed(1);
    },

    // 3. Ενημέρωση UI 
    updateUI: function() {
        const avg = this.getWeeklyAverage();
        const display = document.getElementById('mobileWeightAvg') || document.getElementById('weeklyWeightAvg');
        const inputEl = document.getElementById('mobileWeightInput') || document.getElementById('userWeightInput');
        
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}");
        const sortedKeys = Object.keys(history).sort();

        // Ενημέρωση ένδειξης Μέσου Όρου
        if (display) {
            display.textContent = avg ? `M.O. Εβδομάδας: ${avg} kg` : "Αναμονή δεδομένων...";
        }
        
        // Αυτόματο γέμισμα του input με το τελευταίο βάρος (αν είναι άδειο)
        if (inputEl && sortedKeys.length > 0 && !inputEl.value) {
            const lastKey = sortedKeys[sortedKeys.length - 1];
            inputEl.value = history[lastKey];
        }
    },

    // 4. 🛡️ MASTER CLOUD ALIGNMENT
    alignWithCloud: function(cloudWeight) {
        if (!cloudWeight) return;
        const weight = parseFloat(cloudWeight);
        if (isNaN(weight)) return;

        const localWeight = parseFloat(localStorage.getItem(WEIGHT_KEY)) || 0;
        
        if (Math.abs(localWeight - weight) > 0.01) {
            console.log(`%c ⚖️ PEGASUS ALIGNMENT: Cloud (${weight}kg) overrides Local (${localWeight}kg)`, "color: #ff9800; font-weight: bold;");
            
            localStorage.setItem(WEIGHT_KEY, weight);
            if (typeof window !== 'undefined') window.userWeight = weight; 
            
            this.updateUI();
            
            // Ενημέρωση UI θερμίδων & Health Check
            if (typeof window.updateKcalUI === "function") window.updateKcalUI();
            if (window.PegasusMetabolic) window.PegasusMetabolic.renderUI();
            if (typeof window.verifyCalorieLogic === "function") window.verifyCalorieLogic();
        }
    }
};

// 5. AUTO-BOOT BRIDGE
document.addEventListener('DOMContentLoaded', () => {
    window.PegasusWeight.updateUI();
});

console.log("⚖️ PEGASUS WEIGHT: Module Operational & Hardened (v1.7).");


window.addEventListener('pageshow', () => { try { window.PegasusWeight.updateUI(); } catch(_) {} });
