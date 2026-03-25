/* =============================================================
   PEGASUS METABOLIC ENGINE - FAIL-SAFE PRECISION
   ============================================================= */

const MetabolicEngine = {
    // ΒΕΛΤΙΣΤΟΠΟΙΗΣΗ 1: Δυναμική ανάκτηση βάρους αντί για hardcoded 74kg
    get weight() {
        return parseFloat(localStorage.getItem("pegasus_weight")) || 74;
    },

    // Προσωρινή μνήμη για αποφυγή I/O Overload στον δίσκο (LocalStorage)
    pendingKcal: 0,
    tickCount: 0,

    /**
     * Υπολογισμός MET βάσει φορτίου (Lifted Weight)
     */
    getDynamicMET: function(exerciseName, weight) {
        if (exerciseName.includes("Ποδηλασία")) return 10.0;
        if (exerciseName.includes("Προθέρμανση")) return 3.0;

        let baseMET = 7.0; 
        if (weight > 0) {
            const loadRatio = weight / this.weight;
            baseMET += (loadRatio * 5); 
        }
        return baseMET;
    },

    /**
     * Κύρια συνάρτηση υπολογισμού
     */
    updateTracking: function(durationSeconds, exerciseName) {
        let liftedWeight = 0;

        // ΒΕΛΤΙΣΤΟΠΟΙΗΣΗ 2: Ασφαλής κλήση στο window scope για αποφυγή ReferenceError
        try {
            if (typeof window.exercises !== 'undefined' && typeof window.currentIdx !== 'undefined') {
                const currentExNode = window.exercises[window.currentIdx];
                if (currentExNode) {
                    const weightInput = currentExNode.querySelector(".weight-input");
                    liftedWeight = weightInput ? parseFloat(weightInput.value) || 0 : 0;
                }
            }
        } catch (e) {
            console.warn("METABOLIC: UI Node not active, switching to storage backup.");
        }

        // FAIL-SAFE: Αν το UI είναι 0, τράβα από το LocalStorage
        if (liftedWeight === 0) {
            liftedWeight = parseFloat(localStorage.getItem(`weight_ANGELOS_${exerciseName}`)) || 0;
        }

        const activeMET = this.getDynamicMET(exerciseName, liftedWeight);
        const durationMins = durationSeconds / 60;
        
        const kcalPerMin = (activeMET * 3.5 * this.weight) / 200;
        // Υψηλότερη ακρίβεια στη μνήμη για αποφυγή σφαλμάτων στρογγυλοποίησης
        const addedKcal = parseFloat((kcalPerMin * durationMins).toFixed(4)); 

        // ΒΕΛΤΙΣΤΟΠΟΙΗΣΗ 3: I/O Bottleneck Fix (Εγγραφή στο δίσκο κάθε 5 ticks)
        this.pendingKcal += addedKcal;
        this.tickCount++;

        let currentDiskKcal = parseFloat(localStorage.getItem("pegasus_today_kcal")) || 0;
        const displayTotal = currentDiskKcal + this.pendingKcal;

        // Άμεση ενημέρωση UI σε πραγματικό χρόνο
        const kcalDisplay = document.querySelector(".kcal-value");
        if (kcalDisplay) kcalDisplay.textContent = displayTotal.toFixed(1);

        // Εγγραφή στο LocalStorage μόνο κάθε 5 δευτερόλεπτα (ή ticks) για δραματική μείωση του I/O Load
        if (this.tickCount >= 5) {
            localStorage.setItem("pegasus_today_kcal", displayTotal.toFixed(2));
            this.pendingKcal = 0;
            this.tickCount = 0;
        }
        
        return addedKcal;
    }
};

window.MetabolicEngine = MetabolicEngine;
