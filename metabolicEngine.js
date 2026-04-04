/* =============================================================
   PEGASUS UNIFIED METABOLIC ENGINE - v1.0
   Merged: calories.js + metabolic.js
   Protocol: Strict Persistence & Zero-Bug Simulation
   ============================================================= */

const PegasusMetabolic = {
    // Δυναμική ανάκτηση βάρους χρήστη
    get userWeight() {
        return parseFloat(localStorage.getItem("pegasus_weight")) || 74;
    },

    pendingKcal: 0,
    tickCount: 0,

    /**
     * Υπολογισμός MET βάσει άσκησης και φορτίου
     */
    getMET: function(exerciseName, liftedWeight) {
        if (exerciseName.includes("Ποδηλασία")) return 10.0;
        if (exerciseName.includes("Προθέρμανση")) return 3.0;
        
        let baseMET = 7.0; 
        if (liftedWeight > 0) {
            const loadRatio = liftedWeight / this.userWeight;
            baseMET += (loadRatio * 5); 
        }
        return baseMET;
    },

    /**
     * Κύρια συνάρτηση καταγραφής - ΚΑΛΕΙΤΑΙ ΑΠΟ ΤΟ app.js
     */
    updateTracking: function(durationSeconds, exerciseName) {
        // 1. ΑΚΑΡΙΑΙΑ ΑΠΟΘΗΚΕΥΣΗ ΚΙΛΩΝ (Fix για το "χάσιμο" των κιλών)
        const weightInput = document.querySelector(".weight-input");
        let liftedWeight = weightInput ? parseFloat(weightInput.value) : 0;
        
        if (liftedWeight > 0) {
            // Χρήση του Master Key ΑΓΓΕΛΟΣ για μόνιμη εγγραφή
            localStorage.setItem(`weight_ΑΓΓΕΛΟΣ_${exerciseName.trim()}_records`, liftedWeight);
            console.log(`⚖️ PEGASUS: Weight Locked -> ${liftedWeight}kg`);
        } else {
            liftedWeight = parseFloat(localStorage.getItem(`weight_ΑΓΓΕΛΟΣ_${exerciseName.trim()}_records`)) || 0;
        }

        // 2. ΥΠΟΛΟΓΙΣΜΟΣ ΘΕΡΜΙΔΩΝ
        const activeMET = this.getMET(exerciseName, liftedWeight);
        const durationMins = durationSeconds / 60;
        const kcalPerMin = (activeMET * 3.5 * this.userWeight) / 200;
        const addedKcal = parseFloat((kcalPerMin * durationMins).toFixed(4));

        this.pendingKcal += addedKcal;
        
        // 3. ΣΥΓΧΡΟΝΙΣΜΟΣ ΜΕ ΤΟ LOCALSTORAGE (Κάθε 1 tick για απόλυτη ασφάλεια)
        let currentTotal = parseFloat(localStorage.getItem("pegasus_today_kcal")) || 0;
        localStorage.setItem("pegasus_today_kcal", (currentTotal + addedKcal).toFixed(2));
        
        this.renderUI(currentTotal + addedKcal);
        
        // 4. ΕΠΙΚΥΡΩΣΗ ΗΜΕΡΟΛΟΓΙΟΥ (Πρασίνισμα)
        this.validateDay();
    },

    renderUI: function(total) {
        const kcalDisplay = document.querySelector(".kcal-value");
        if (kcalDisplay) kcalDisplay.textContent = parseFloat(total).toFixed(1);
    },

    validateDay: function() {
        const today = new Date().toISOString().split('T')[0];
        let history = JSON.parse(localStorage.getItem('pegasus_calendar_history') || "{}");
        let workouts = JSON.parse(localStorage.getItem('pegasus_workouts_done') || "{}");
        
        // Αν έχουμε θερμίδες, η μέρα θεωρείται ενεργή
        const currentKcal = parseFloat(localStorage.getItem("pegasus_today_kcal")) || 0;
        if (currentKcal > 100) {
            const entry = { status: "completed", verified: true, kcal: currentKcal };
            history[today] = entry;
            workouts[today] = entry;
            localStorage.setItem('pegasus_calendar_history', JSON.stringify(history));
            localStorage.setItem('pegasus_workouts_done', JSON.stringify(workouts));
        }
    }
};

// Global Bridge
window.trackSetCalories = PegasusMetabolic.updateTracking.bind(PegasusMetabolic);
