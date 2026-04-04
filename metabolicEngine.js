/* =============================================================
   PEGASUS UNIFIED METABOLIC ENGINE - v16.2
   Merged: calories.js + metabolic.js
   Protocol: Universal UI Sync & Zero-Bug Simulation
   ============================================================= */

const PegasusMetabolic = {
    // Δυναμική ανάκτηση βάρους χρήστη
    get userWeight() {
        return parseFloat(localStorage.getItem("pegasus_weight")) || 74;
    },

    pendingKcal: 0,

    /**
     * Υπολογισμός MET βάσει άσκησης και φορτίου
     */
    getMET: function(exerciseName, liftedWeight) {
        if (exerciseName.includes("Ποδηλασία") || exerciseName.includes("Cycling")) return 10.0;
        if (exerciseName.includes("Προθέρμανση") || exerciseName.includes("Warmup")) return 3.0;
        
        let baseMET = 7.0; 
        if (liftedWeight > 0) {
            const loadRatio = liftedWeight / this.userWeight;
            baseMET += (loadRatio * 5); 
        }
        return baseMET;
    },

    /**
     * Κύρια συνάρτηση καταγραφής - ΚΑΛΕΙΤΑΙ ΑΠΟ ΤΟ app.js ΚΑΘΕ ΔΕΥΤΕΡΟΛΕΠΤΟ
     */
    updateTracking: function(durationSeconds, exerciseName) {
        // 1. ΑΚΑΡΙΑΙΑ ΑΠΟΘΗΚΕΥΣΗ ΚΙΛΩΝ (Fix για το "χάσιμο" των κιλών)
        const weightInput = document.querySelector(".weight-input");
        let liftedWeight = weightInput ? parseFloat(weightInput.value) : 0;
        
        if (liftedWeight > 0) {
            localStorage.setItem(`weight_ΑΓΓΕΛΟΣ_${exerciseName.trim()}_records`, liftedWeight);
        } else {
            liftedWeight = parseFloat(localStorage.getItem(`weight_ΑΓΓΕΛΟΣ_${exerciseName.trim()}_records`)) || 0;
        }

        // 2. ΥΠΟΛΟΓΙΣΜΟΣ ΘΕΡΜΙΔΩΝ (Formula: kcal = (MET * 3.5 * weight) / 200 * mins)
        const activeMET = this.getMET(exerciseName, liftedWeight);
        const durationMins = durationSeconds / 60;
        const kcalPerMin = (activeMET * 3.5 * this.userWeight) / 200;
        const addedKcal = parseFloat((kcalPerMin * durationMins).toFixed(4));

        // 3. ΣΥΓΧΡΟΝΙΣΜΟΣ ΜΕ ΤΟ LOCALSTORAGE
        let currentTotal = parseFloat(localStorage.getItem("pegasus_today_kcal")) || 0;
        let newTotal = currentTotal + addedKcal;
        localStorage.setItem("pegasus_today_kcal", newTotal.toFixed(4));
        
        // 4. ΕΝΗΜΕΡΩΣΗ ΟΛΩΝ ΤΩΝ UI
        this.renderUI(newTotal);
        
        // 5. ΕΠΙΚΥΡΩΣΗ ΗΜΕΡΟΛΟΓΙΟΥ
        this.validateDay();
    },

    /**
     * UNIVERSAL UI RENDERER: Ενημερώνει Desktop και Mobile ταυτόχρονα
     */
    renderUI: function(total) {
        const val = parseFloat(total) || 0;
        
        // Α. Desktop UI (.kcal-value)
        const kcalDesktop = document.querySelector(".kcal-value");
        if (kcalDesktop) {
            kcalDesktop.textContent = val.toFixed(1);
        }

        // Β. Mobile UI (txtKcal)
        const kcalMobile = document.getElementById("txtKcal");
        if (kcalMobile) {
            kcalMobile.textContent = `${val.toFixed(0)} / 2800`;
        }
    },

    validateDay: function() {
        const today = new Date().toISOString().split('T')[0];
        let history = JSON.parse(localStorage.getItem('pegasus_calendar_history') || "{}");
        let workouts = JSON.parse(localStorage.getItem('pegasus_workouts_done') || "{}");
        
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
window.PegasusMetabolic = PegasusMetabolic;
window.trackSetCalories = PegasusMetabolic.updateTracking.bind(PegasusMetabolic);

// Initial Render στο φόρτωμα
document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem("pegasus_today_kcal") || "0";
    PegasusMetabolic.renderUI(saved);
});
