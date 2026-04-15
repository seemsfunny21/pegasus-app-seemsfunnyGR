/* ==========================================================================
   PEGASUS OS - BIOMETRIC WEIGHT TRACKER (v1.3 - CLOUD ALIGNED)
   Protocol: Daily Weight Logging, Moving Average & Master Variable Sync
   Status: FINAL STABLE | FIXED: CHRONO-SORTING & RANGE GUARD
   ========================================================================== */

window.PegasusWeight = {
    // 1. Καταγραφή βάρους (Συμβατό με Mobile & Desktop)
    save: function(val) {
        // 🛡️ RANGE & NaN GUARD: Μετατροπή και αυστηρός έλεγχος
        const safeVal = String(val).replace(',', '.');
        const weight = parseFloat(safeVal);
        
        // Αποκλεισμός εξωπραγματικών τιμών (π.χ. λάθος πληκτρολόγηση <30 ή >250)
        if (isNaN(weight) || weight < 30 || weight > 250) {
            console.error("⚖️ PEGASUS: Invalid weight range rejected.");
            return;
        }

        const now = new Date();
        const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        let history = JSON.parse(localStorage.getItem('pegasus_weight_history') || "{}");
        history[dateKey] = weight;
        
        // Αποθήκευση τοπικά
        localStorage.setItem('pegasus_weight_history', JSON.stringify(history));
        localStorage.setItem('pegasus_weight', weight);
        
        // 🟢 FORCE UPDATE: Ενημέρωση της κεντρικής μεταβλητής του app.js και της μηχανής μεταβολισμού
        if (typeof window !== 'undefined') {
            window.userWeight = weight;
            if (window.PegasusMetabolic) window.PegasusMetabolic.renderUI();
        }
        
        console.log(`⚖️ PEGASUS DATA: Weight logged: ${weight}kg`);
        
        // Αποστολή στο Cloud
        if (window.PegasusCloud) window.PegasusCloud.push(true);
        this.updateUI();
    },

    // 2. Υπολογισμός μέσου όρου με Χρονολογική Ταξινόμηση
    getWeeklyAverage: function() {
        const history = JSON.parse(localStorage.getItem('pegasus_weight_history') || "{}");
        
        // 🎯 FIXED: Ταξινόμηση κλειδιών για διασφάλιση χρονολογικής σειράς
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
        
        const history = JSON.parse(localStorage.getItem('pegasus_weight_history') || "{}");
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

        const localWeight = parseFloat(localStorage.getItem('pegasus_weight')) || 0;
        
        if (Math.abs(localWeight - weight) > 0.01) {
            console.log(`%c ⚖️ PEGASUS ALIGNMENT: Cloud (${weight}kg) overrides Local (${localWeight}kg)`, "color: #ff9800; font-weight: bold;");
            
            localStorage.setItem('pegasus_weight', weight);
            if (typeof window !== 'undefined') window.userWeight = weight; 
            
            this.updateUI();
            // Ενημέρωση UI θερμίδων αν υπάρχει η συνάρτηση
            if (typeof window.updateKcalUI === "function") window.updateKcalUI();
            if (window.PegasusMetabolic) window.PegasusMetabolic.renderUI();
        }
    }
};

console.log("⚖️ PEGASUS WEIGHT: Module Operational & Hardened (v1.3).");
