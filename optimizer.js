/* ==========================================================================
   PEGASUS DYNAMIC OPTIMIZER - CLEAN SWEEP v17.0
   Protocol: Friday Load Balancing | Logic: Dynamic Target Capping
   ========================================================================== */

window.PegasusOptimizer = {
    /**
     * Ανάκτηση εβδομαδιαίων στόχων
     */
    getTargets: function() {
        try {
            const stored = localStorage.getItem("pegasus_muscle_targets");
            // Fallback στις σταθερές του Master Profile αν δεν υπάρχουν ρυθμίσεις
            return stored ? JSON.parse(stored) : (window.TARGET_SETS || { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 });
        } catch (e) {
            return window.TARGET_SETS;
        }
    },

    /**
     * Κύρια συνάρτηση εφαρμογής βελτιστοποίησης
     */
    apply: function(day, sessionExercises) {
        const progress = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
        let sessionTracker = { ...progress };
        const currentTargets = this.getTargets(); 

        // 1. Αρχική χαρτογράφηση και υπολογισμός σετ
        let mappedData = sessionExercises.map(ex => this.calculateExercise(ex, sessionTracker, currentTargets));

        // 2. SMART LOAD BALANCING (Μόνο για Παρασκευή)
        if (day === "Παρασκευή") {
            mappedData = this.balanceFridayLoad(mappedData);
        }

        return mappedData;
    },

    /**
     * Υπολογισμός σετ βάσει υπολοίπου
     */
    calculateExercise: function(ex, tracker, targets) {
        const group = this.getGroup(ex.name);
        const done = tracker[group] || 0;
        const target = targets[group] || 15;
        const remaining = Math.max(0, target - done);

        // Capping: Δεν επιτρέπουμε περισσότερα σετ από το εβδομαδιαίο υπόλοιπο
        let finalSets = Math.min(remaining, ex.sets || 4);
        
        // Ειδική λογική για Ποδηλασία (18-set credit)
        if (ex.name.includes("Ποδηλασία")) {
            finalSets = (remaining >= 18) ? 1 : 0;
        }

        if (finalSets > 0) {
            tracker[group] += (ex.name.includes("Ποδηλασία") ? 18 : finalSets);
        }

        return { 
            ...ex, 
            adjustedSets: finalSets, 
            isCompleted: remaining <= 0, 
            muscleGroup: group 
        };
    },

    /**
     * Περιορισμός φόρτου Παρασκευής (40-Minute Limit)
     */
    balanceFridayLoad: function(exercises) {
        let totalTime = 0;
        return exercises.map(ex => {
            // Εκτίμηση χρόνου: 1.5 λεπτό ανά σετ + 1 λεπτό διάλειμμα
            const estimatedTime = ex.adjustedSets * 2.5; 
            if (totalTime + estimatedTime > 40) {
                const safeSets = Math.floor((40 - totalTime) / 2.5);
                ex.adjustedSets = Math.max(0, safeSets);
            }
            totalTime += ex.adjustedSets * 2.5;
            return ex;
        });
    },

    /**
     * Muscle Group Mapping
     */
    getGroup: function(name) {
        const cleanName = name.trim().toLowerCase();
        if (window.exercisesDB) {
            const match = window.exercisesDB.find(ex => ex.name.toLowerCase() === cleanName);
            if (match) return match.muscleGroup;
        }
        
        // Fallback Keyword Mapping
        if (cleanName.includes("chest") || cleanName.includes("pushups") || cleanName.includes("στήθος")) return "Στήθος";
        if (cleanName.includes("row") || cleanName.includes("pulldown") || cleanName.includes("πλάτη")) return "Πλάτη";
        if (cleanName.includes("leg") || cleanName.includes("cycling") || cleanName.includes("πόδια")) return "Πόδια";
        if (cleanName.includes("bicep") || cleanName.includes("tricep") || cleanName.includes("χέρια")) return "Χέρια";
        if (cleanName.includes("shoulder") || cleanName.includes("raises") || cleanName.includes("ώμοι")) return "Ώμοι";
        return "Κορμός";
    }
};