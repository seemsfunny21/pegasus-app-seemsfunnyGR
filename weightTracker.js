/* ==========================================================================
   PEGASUS OS - BIOMETRIC WEIGHT TRACKER (v1.2 - CLOUD ALIGNED)
   Protocol: Daily Weight Logging, Moving Average & Master Variable Sync
   ========================================================================== */

window.PegasusWeight = {
    // 1. Καταγραφή βάρους (Συμβατό με Mobile & Desktop)
    save: function(val) {
        const weight = parseFloat(val);
        if (isNaN(weight) || weight <= 0) return;

        const now = new Date();
        const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        let history = JSON.parse(localStorage.getItem('pegasus_weight_history') || "{}");
        history[dateKey] = weight;
        
        // Αποθήκευση στοπικά
        localStorage.setItem('pegasus_weight_history', JSON.stringify(history));
        localStorage.setItem('pegasus_weight', weight);
        
        // 🟢 FORCE UPDATE: Ενημέρωση της κεντρικής μεταβλητής του app.js
        if (typeof window !== 'undefined') window.userWeight = weight;
        
        console.log(`⚖️ PEGASUS DATA: Weight logged: ${weight}kg`);
        
        // Αποστολή στο Cloud
        if (window.PegasusCloud) window.PegasusCloud.push(true);
        this.updateUI();
    },

    // 2. Υπολογισμός μέσου όρου
    getWeeklyAverage: function() {
        const history = JSON.parse(localStorage.getItem('pegasus_weight_history') || "{}");
        const weights = Object.values(history);
        
        if (weights.length === 0) return null;

        const last7 = weights.slice(-7);
        const sum = last7.reduce((acc, val) => acc + val, 0);
        return (sum / last7.length).toFixed(1);
    },

    // 3. Ενημέρωση UI 
    updateUI: function() {
        const avg = this.getWeeklyAverage();
        // Υποστήριξη και για Mobile ID και για Desktop ID
        const display = document.getElementById('mobileWeightAvg') || document.getElementById('weeklyWeightAvg');
        const inputEl = document.getElementById('mobileWeightInput') || document.getElementById('userWeightInput');
        
        const history = JSON.parse(localStorage.getItem('pegasus_weight_history') || "{}");
        const weights = Object.values(history);

        if (display && avg) {
            display.textContent = `M.O. Εβδομάδας: ${avg} kg`;
        }
        
        if (inputEl && weights.length > 0 && !inputEl.value) {
            inputEl.value = weights[weights.length - 1];
        }
    },

    // 4. 🛡️ MASTER CLOUD ALIGNMENT
    alignWithCloud: function(cloudWeight) {
        if (!cloudWeight) return;
        const localWeight = parseFloat(localStorage.getItem('pegasus_weight')) || 0;
        
        if (Math.abs(localWeight - cloudWeight) > 0.01) {
            console.log(`%c ⚖️ PEGASUS ALIGNMENT: Cloud (${cloudWeight}kg) overrides Local (${localWeight}kg)`, "color: #ff9800; font-weight: bold;");
            
            // Επιβολή του βάρους του κινητού (Cloud) στο Desktop
            localStorage.setItem('pegasus_weight', cloudWeight);
            if (typeof window !== 'undefined') window.userWeight = cloudWeight; 
            
            this.updateUI();
            if (typeof window.updateKcalUI === "function") window.updateKcalUI();
        }
    }
};

// Αρχική ενημέρωση
console.log("⚖️ PEGASUS WEIGHT: Module Operational & Aligned (v1.2).");
