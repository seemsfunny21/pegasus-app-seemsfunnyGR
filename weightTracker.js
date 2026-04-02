/* ==========================================================================
   PEGASUS OS - BIOMETRIC WEIGHT TRACKER (v1.0)
   Protocol: Daily Weight Logging & Moving Average Calculation
   Status: OPERATIONAL | INTEGRATED WITH USER SETTINGS
   ========================================================================== */

window.PegasusWeight = {
    // 1. Καταγραφή βάρους για τη σημερινή ημερομηνία
    logWeight: function(val) {
        const weight = parseFloat(val);
        if (isNaN(weight) || weight <= 0) return;

        const now = new Date();
        const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        let history = JSON.parse(localStorage.getItem('pegasus_weight_history') || "{}");
        history[dateKey] = weight;
        
        // Αποθήκευση ιστορικού
        localStorage.setItem('pegasus_weight_history', JSON.stringify(history));
        
        // Ενημέρωση του τρέχοντος βάρους στο κεντρικό Manifest Key
        localStorage.setItem(window.PegasusManifest?.user.weight || 'pegasus_weight', weight);
        
        console.log(`⚖️ PEGASUS DATA: Weight logged for ${dateKey}: ${weight}kg`);
        
        if (window.PegasusCloud) window.PegasusCloud.push(true);
        this.updateWeightUI();
    },

    // 2. Υπολογισμός μέσου όρου τελευταίων 7 ημερών
    getWeeklyAverage: function() {
        const history = JSON.parse(localStorage.getItem('pegasus_weight_history') || "{}");
        const dates = Object.keys(history).sort().reverse(); // Από το πιο πρόσφατο
        
        if (dates.length === 0) return null;

        const last7 = dates.slice(0, 7);
        const sum = last7.reduce((acc, date) => acc + history[date], 0);
        return (sum / last7.length).toFixed(2);
    },

    // 3. Ενημέρωση του UI (Αν υπάρχει πεδίο στην οθόνη)
    updateWeightUI: function() {
        const avg = this.getWeeklyAverage();
        const display = document.getElementById('weeklyWeightAvg');
        if (display && avg) {
            display.textContent = `Μ.Ο. Εβδομάδας: ${avg} kg`;
        }
    }
};

// Αυτόματη ενημέρωση κατά τη φόρτωση
window.addEventListener('load', () => {
    if (window.PegasusWeight) window.PegasusWeight.updateWeightUI();
});
