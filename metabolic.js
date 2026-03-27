/* ==========================================================================
   PEGASUS METABOLIC ENGINE - CLEAN SWEEP v17.0
   Protocol: Fail-Safe Precision | Logic: I/O Bottleneck Protection
   ========================================================================== */

const MetabolicEngine = {
    /**
     * Δυναμική ανάκτηση βάρους από το Master Profile ή το LocalStorage
     */
    get weight() {
        return parseFloat(localStorage.getItem("pegasus_weight")) || (window.USER_PROFILE ? window.USER_PROFILE.weight : 74);
    },

    // Προσωρινή μνήμη (Buffer) για αποφυγή συνεχών εγγραφών στο δίσκο
    pendingKcal: 0,
    tickCount: 0,

    /**
     * Υπολογισμός MET βάσει φορτίου (Lifted Weight Ratio)
     * Η ένταση προσαρμόζεται δυναμικά αν η άσκηση εκτελείται με βάρη.
     */
    getDynamicMET: function(exerciseName, liftedWeight) {
        if (exerciseName.includes("Ποδηλασία")) return 10.0;
        if (exerciseName.includes("Προθέρμανση")) return 3.0;
        if (exerciseName.includes("Stretching")) return 2.3;

        let baseMET = 6.0; // Standard Resistance Training
        
        if (liftedWeight > 0) {
            // Load Ratio: Συσχέτιση βάρους άσκησης με το σωματικό βάρος
            const loadRatio = liftedWeight / this.weight;
            baseMET += (loadRatio * 4.5); 
        }
        return baseMET;
    },

    /**
     * Κύρια συνάρτηση υπολογισμού (Καλείται από το app.js ανά δευτερόλεπτο)
     */
    updateTracking: function(durationSeconds, exerciseName) {
        let liftedWeight = 0;

        // Ανάκτηση τρέχοντος βάρους άσκησης από το UI ή το LocalStorage
        const activeEx = document.querySelector('.exercise[style*="rgba(76, 175, 80"]');
        if (activeEx) {
            const input = activeEx.querySelector('.weight-input');
            liftedWeight = input ? parseFloat(input.value) || 0 : 0;
        }

        // Fail-safe: Ανάκτηση από το δίσκο αν το UI είναι απρόσιτο
        if (liftedWeight === 0 && exerciseName) {
            liftedWeight = parseFloat(localStorage.getItem(`weight_ANGELOS_${exerciseName.trim()}`)) || 0;
        }

        const activeMET = this.getDynamicMET(exerciseName, liftedWeight);
        const durationMins = durationSeconds / 60;
        
        // Φόρμουλα: (MET * 3.5 * Weight) / 200 = Kcal/min
        const kcalPerMin = (activeMET * 3.5 * this.weight) / 200;
        const addedKcal = parseFloat((kcalPerMin * durationMins).toFixed(4)); 

        // Ενημέρωση Buffer
        this.pendingKcal += addedKcal;
        this.tickCount++;

        // Υπολογισμός συνολικών θερμίδων (Disk + Buffer)
        let currentDiskKcal = parseFloat(localStorage.getItem("pegasus_today_kcal")) || 0;
        const displayTotal = currentDiskKcal + this.pendingKcal;

        // Άμεση ενημέρωση UI (Real-time Feedback)
        const kcalDisplay = document.querySelector(".kcal-value");
        if (kcalDisplay) {
            kcalDisplay.textContent = displayTotal.toFixed(1);
        }

        /**
         * I/O BUFFER LOGIC
         * Εγγραφή στο LocalStorage μόνο κάθε 5 ticks (δευτερόλεπτα) 
         * για δραματική μείωση της κατανάλωσης μπαταρίας και φθοράς μνήμης.
         */
        if (this.tickCount >= 5) {
            const newTotal = currentDiskKcal + this.pendingKcal;
            localStorage.setItem("pegasus_today_kcal", newTotal.toFixed(4));
            
            // Μηδενισμός Buffer
            this.pendingKcal = 0;
            this.tickCount = 0;
            
            if (window.PegasusLogger) {
                window.PegasusLogger.log(`Metabolic Flush: ${newTotal.toFixed(1)} Kcal total`, "DEBUG");
            }
        }
    },

    /**
     * Force Sync: Χρησιμοποιείται κατά την παύση ή τερματισμό της προπόνησης
     */
    flush: function() {
        if (this.pendingKcal > 0) {
            let currentDiskKcal = parseFloat(localStorage.getItem("pegasus_today_kcal")) || 0;
            localStorage.setItem("pegasus_today_kcal", (currentDiskKcal + this.pendingKcal).toFixed(4));
            this.pendingKcal = 0;
            this.tickCount = 0;
        }
    }
};

window.MetabolicEngine = MetabolicEngine;