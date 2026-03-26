/* ==========================================================================
   PEGASUS METABOLIC ENGINE - v4.0 (MODULAR / FULLY DECOUPLED)
   Protocol: Strict Data Analyst - I/O Bottleneck Fix & Precision Tracking
   ========================================================================== */

const PegasusMetabolic = (function() {
    // 1. ΙΔΙΩΤΙΚΟ STATE (Private Cache & Counters)
    let pendingKcal = 0;
    let tickCount = 0;

    // 2. ΕΣΩΤΕΡΙΚΕΣ ΛΕΙΤΟΥΡΓΙΕΣ (Private Methods)
    const getWeight = () => {
        // Ανάκτηση δυναμικού βάρους ή fallback στα 74kg (Profile Default)
        return parseFloat(localStorage.getItem("pegasus_weight")) || 74;
    };

    const getDynamicMET = (exerciseName, liftedWeight) => {
        if (exerciseName.includes("Ποδηλασία")) return 10.0;
        if (exerciseName.includes("Προθέρμανση")) return 3.0;

        let baseMET = 7.0; 
        if (liftedWeight > 0) {
            const loadRatio = liftedWeight / getWeight();
            baseMET += (loadRatio * 5); 
        }
        return baseMET;
    };

    // 3. PUBLIC API
    return {
        updateTracking: function(durationSeconds, exerciseName) {
            let liftedWeight = 0;

            // Safe DOM Retrieval
            const cleanName = exerciseName.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const wInput = document.querySelector(`.weight-input[data-name="${cleanName}"]`);
            if (wInput && wInput.value) {
                liftedWeight = parseFloat(wInput.value);
            }

            // Fallback στο LocalStorage αν το UI είναι 0
            if (liftedWeight === 0) {
                liftedWeight = parseFloat(localStorage.getItem(`weight_ANGELOS_${exerciseName}`)) || 
                               parseFloat(localStorage.getItem(`weight_${exerciseName}`)) || 0;
            }

            const activeMET = getDynamicMET(exerciseName, liftedWeight);
            const durationMins = durationSeconds / 60;
            
            const kcalPerMin = (activeMET * 3.5 * getWeight()) / 200;
            const addedKcal = parseFloat((kcalPerMin * durationMins).toFixed(4)); 

            // Προσωρινή αποθήκευση στη μνήμη (Cache)
            pendingKcal += addedKcal;
            tickCount++;

            let currentDiskKcal = parseFloat(localStorage.getItem("pegasus_today_kcal")) || 0;
            const displayTotal = currentDiskKcal + pendingKcal;

            // Άμεση ενημέρωση UI
            const kcalDisplay = document.querySelector(".kcal-value");
            if (kcalDisplay) kcalDisplay.textContent = displayTotal.toFixed(1);

            // Εγγραφή στο δίσκο κάθε 5 ticks για εξοικονόμηση πόρων (I/O Optimization)
            if (tickCount >= 5) {
                localStorage.setItem("pegasus_today_kcal", displayTotal.toFixed(2));
                pendingKcal = 0;
                tickCount = 0;
            }
        },

        getMET: getDynamicMET
    };
})();

// Εξαγωγή στο Window Scope για διασύνδεση με το Workout Engine (app.js)
window.MetabolicEngine = PegasusMetabolic;