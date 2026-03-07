/* =============================================================
   PEGASUS METABOLIC ENGINE - FAIL-SAFE PRECISION (74kg)
   ============================================================= */

const MetabolicEngine = {
    userWeight: 74,

    /**
     * Υπολογισμός MET βάσει φορτίου (Lifted Weight)
     */
    getDynamicMET: function(exerciseName, weight) {
        if (exerciseName.includes("Ποδηλασία")) return 10.0;
        if (exerciseName.includes("Προθέρμανση")) return 3.0;

        let baseMET = 7.0; 
        if (weight > 0) {
            const loadRatio = weight / this.userWeight;
            baseMET += (loadRatio * 5); 
        }
        return baseMET;
    },

    /**
     * Κύρια συνάρτηση υπολογισμού
     */
    updateTracking: function(durationSeconds, exerciseName) {
        let liftedWeight = 0;

        // Α) Προσπάθεια ανάκτησης από το UI (Active Node)
        try {
            const currentExNode = exercises[currentIdx];
            if (currentExNode) {
                const weightInput = currentExNode.querySelector(".weight-input");
                liftedWeight = weightInput ? parseFloat(weightInput.value) || 0 : 0;
            }
        } catch (e) {
            console.warn("METABOLIC: UI Node not active, switching to storage backup.");
        }

        // Β) FAIL-SAFE: Αν το UI είναι 0, τράβα από το LocalStorage (λόγω του EventListener στο app.js)
        if (liftedWeight === 0) {
            liftedWeight = parseFloat(localStorage.getItem(`weight_ANGELOS_${exerciseName}`)) || 0;
        }

        const activeMET = this.getDynamicMET(exerciseName, liftedWeight);
        const durationMins = durationSeconds / 60;
        
        const kcalPerMin = (activeMET * 3.5 * this.userWeight) / 200;
        const addedKcal = parseFloat((kcalPerMin * durationMins).toFixed(2));

        let dailyTotal = parseFloat(localStorage.getItem("pegasus_today_kcal")) || 0;
        dailyTotal += addedKcal;
        localStorage.setItem("pegasus_today_kcal", dailyTotal.toFixed(1));

        const kcalDisplay = document.querySelector(".kcal-value");
        if (kcalDisplay) kcalDisplay.textContent = dailyTotal.toFixed(1);

        console.log(`PEGASUS METABOLIC: ${exerciseName} | Load: ${liftedWeight}kg | MET: ${activeMET.toFixed(1)} | +${addedKcal} kcal`);
        
        return addedKcal;
    }
};

window.MetabolicEngine = MetabolicEngine;