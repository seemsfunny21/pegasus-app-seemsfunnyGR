/* ==========================================================================
   PEGASUS OS - BIOMETRIC WEIGHT TRACKER (v1.1 - MOBILE ALIGNED)
   Protocol: Daily Weight Logging & Moving Average Calculation
   ========================================================================== */

window.PegasusWeight = {
    // 1. Καταγραφή βάρους (Συμβατό με το onclick="window.PegasusWeight?.save")
    save: function(val) {
        const weight = parseFloat(val);
        if (isNaN(weight) || weight <= 0) return;

        const now = new Date();
        const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        let history = JSON.parse(localStorage.getItem('pegasus_weight_history') || "{}");
        history[dateKey] = weight;
        
        localStorage.setItem('pegasus_weight_history', JSON.stringify(history));
        localStorage.setItem('pegasus_weight', weight);
        
        console.log(`⚖️ PEGASUS DATA: Weight logged: ${weight}kg`);
        
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

    // 3. Ενημέρωση UI (Συμβατό με το refreshAllUI -> window.PegasusWeight?.updateUI)
    updateUI: function() {
        const avg = this.getWeeklyAverage();
        const display = document.getElementById('mobileWeightAvg');
        const inputEl = document.getElementById('mobileWeightInput');
        const history = JSON.parse(localStorage.getItem('pegasus_weight_history') || "{}");
        const weights = Object.values(history);

        if (display && avg) {
            display.textContent = `M.O. Εβδομάδας: ${avg} kg`;
        }
        
        // Ενημέρωση του input με το τελευταίο βάρος αν είναι άδειο
        if (inputEl && weights.length > 0 && !inputEl.value) {
            inputEl.value = weights[weights.length - 1];
        }
    }
};

// Αρχική ενημέρωση
console.log("⚖️ PEGASUS WEIGHT: Module Operational & Aligned.");
