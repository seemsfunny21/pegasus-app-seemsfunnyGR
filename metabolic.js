/* =============================================================
   PEGASUS METABOLIC ENGINE - v7.1 (FINAL CORRECTED)
   Protocol: Fail-Safe Precision + Unified Calendar/Cloud Bridge
   ============================================================= */

const MetabolicEngine = {
    // Δυναμική ανάκτηση βάρους (Default 74kg βάσει προφίλ)
    get weight() {
        return parseFloat(localStorage.getItem("pegasus_weight")) || 74;
    },

    pendingKcal: 0,
    tickCount: 0,

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
     * Ενημέρωση Ημερολογίου (Workout Done Protocol)
     */
    flagWorkoutAsDone: function() {
        const now = new Date();
        const workoutKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        let doneWorkouts = JSON.parse(localStorage.getItem("pegasus_workouts_done") || "{}");
        
        if (!doneWorkouts[workoutKey]) {
            doneWorkouts[workoutKey] = true;
            localStorage.setItem("pegasus_workouts_done", JSON.stringify(doneWorkouts));
            
            // Trigger visual refresh για το πρασίνισμα
            if (window.renderCalendar) window.renderCalendar();
            if (window.PegasusCalendar && window.PegasusCalendar.render) window.PegasusCalendar.render();
            
            console.log("🎯 PEGASUS: Calendar marked as DONE for " + workoutKey);
        }
    },

    updateTracking: function(durationSeconds, exerciseName) {
        let liftedWeight = 0;

        // UI INTERCEPTOR: Λήψη κιλών από το ενεργό DOM
        try {
            if (typeof window.exercises !== 'undefined' && typeof window.currentIdx !== 'undefined') {
                const currentExNode = window.exercises[window.currentIdx];
                if (currentExNode) {
                    const weightInput = currentExNode.querySelector(".weight-input");
                    liftedWeight = weightInput ? parseFloat(weightInput.value) || 0 : 0;
                }
            }
        } catch (e) {
            console.warn("METABOLIC: UI Node not active.");
        }

        // FAIL-SAFE: Backup από LocalStorage
        if (liftedWeight === 0) {
            liftedWeight = parseFloat(localStorage.getItem(`weight_ANGELOS_${exerciseName}`)) || 0;
        }

        const activeMET = this.getDynamicMET(exerciseName, liftedWeight);
        const durationMins = durationSeconds / 60;
        
        // Φόρμουλα: (MET * 3.5 * Weight) / 200
        const kcalPerMin = (activeMET * 3.5 * this.weight) / 200;
        const addedKcal = parseFloat((kcalPerMin * durationMins).toFixed(4)); 

        this.pendingKcal += addedKcal;
        this.tickCount++;

        let currentDiskKcal = parseFloat(localStorage.getItem("pegasus_today_kcal")) || 0;
        const displayTotal = currentDiskKcal + this.pendingKcal;

        // Real-time UI Update
        const kcalDisplay = document.querySelector(".kcal-value");
        if (kcalDisplay) kcalDisplay.textContent = displayTotal.toFixed(1);

        // Batch Writing (κάθε 5 ticks / ~5 δευτερόλεπτα)
        if (this.tickCount >= 5) {
            localStorage.setItem("pegasus_today_kcal", displayTotal.toFixed(2));
            
            // Αυτόματο πρασίνισμα ημερολογίου
            this.flagWorkoutAsDone();
            
            this.pendingKcal = 0;
            this.tickCount = 0;

            // Cloud Synchronization Bridge
            // Έλεγχος αν το σύστημα είναι ξεκλείδωτο (Vault PIN)
            const isSystemUnlocked = window.isUnlocked || (window.PegasusCloud && window.PegasusCloud.isUnlocked);
            if (window.PegasusCloud && isSystemUnlocked) {
                window.PegasusCloud.push(true);
            }
        }
        
        return addedKcal;
    }
};

window.MetabolicEngine = MetabolicEngine;
