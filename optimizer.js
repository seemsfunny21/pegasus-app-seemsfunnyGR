/* ==========================================================================
   PEGASUS DYNAMIC OPTIMIZER - v2.1 (STRICT ISOLATION & LOCK)
   Protocol: Strict Load Management - No Group Overlap - Weather Aware
   ========================================================================== */

window.PegasusOptimizer = {
    getTargets: function() {
        try {
            const stored = localStorage.getItem("pegasus_muscle_targets");
            return stored ? JSON.parse(stored) : { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 };
        } catch (e) { return { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρia": 16, "Ώμοι": 16, "Κορμός": 12 }; }
    },

    apply: function(day, sessionExercises) {
        const progress = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
        let sessionTracker = { ...progress };
        const currentTargets = this.getTargets(); 
        const rain = (typeof window.isRaining === 'function') ? window.isRaining() : false;

        // 1. DATA GUARD: Ποδηλασία μόνο Σάββατο και μόνο αν ΔΕΝ βρέχει
        if (day !== "Σάββατο" || rain) {
            sessionExercises = sessionExercises.filter(ex => !ex.name.includes("Ποδηλασία"));
        }

        // 2. Αρχικό mapping βασικών ασκήσεων
        let mappedData = sessionExercises.map(ex => this.calculateExercise(ex, sessionTracker, currentTargets));

        // Υπολογισμός χρόνου: 1.9 λεπτά ανά άσκηση (5 σετ)
        const getActiveMins = (data) => data.reduce((sum, ex) => sum + (ex.adjustedSets > 0 ? (ex.adjustedSets * 1.9) : 0), 0);
        let currentMinutes = getActiveMins(mappedData);

        // 3. SMART LOAD BALANCING (Π/Σ/Κ) - Στόχος τα 45-50 λεπτά
        if ((day === "Παρασκευή" || day === "Σάββατο" || day === "Κυριακή") && currentMinutes < 45) {
            
            // Πρωτόκολλο Αυστηρής Απομόνωσης (Strict Isolation)
            const dailyPriority = {
                "Παρασκευή": ["Πλάτη", "Ώμοι"],
                "Σάββατο": ["Πόδια", "Κορμός"],
                "Κυριακή": ["Στήθος", "Χέρια", "Κορμός"]
            };

            const searchGroups = dailyPriority[day] || ["Κορμός"];
            
            for (let groupName of searchGroups) {
                if (currentMinutes >= 50) break; // Αυξήσαμε λίγο το όριο για σιγουριά

                // Αναζήτηση στην Database
                const potentialEx = window.exercisesDB.filter(ex => ex.muscleGroup === groupName);

                for (let sEx of potentialEx) {
                    if (currentMinutes >= 50) break;
                    
                    const done = sessionTracker[groupName] || 0;
                    const target = currentTargets[groupName] || 24;

                    // Αν λείπουν σετ και η άσκηση δεν είναι ήδη στο πλάνο
                    if (done < target && !mappedData.some(m => m.name.trim() === sEx.name.trim())) {
                        let spilloverEx = this.calculateExercise({...sEx, sets: 5}, sessionTracker, currentTargets);
                        
                        // DATA LOCK: Αν η άσκηση δεν έδωσε σετ, μην την προσθέσεις
                        if (spilloverEx.adjustedSets > 0) {
                            spilloverEx.isSpillover = true;
                            mappedData.push(spilloverEx);
                            currentMinutes = getActiveMins(mappedData);
                        }
                    }
                }
            }
        }
        return mappedData;
    },

    calculateExercise: function(ex, tracker, currentTargets) {
        const group = this.getGroup(ex.name);
        const target = currentTargets[group] || 24;
        const remaining = target - (tracker[group] || 0);
        
        let finalSets = (remaining <= 0) ? 0 : (ex.sets > remaining ? remaining : ex.sets);
        
        // Λογική Ποδηλασίας (18 σετ weight lock)
        if (ex.name.includes("Ποδηλασία")) {
            finalSets = (remaining >= 18) ? 1 : 0;
        }
        
        if (finalSets > 0) {
            tracker[group] += (ex.name.includes("Ποδηλασία") ? 18 : finalSets);
        }

        return { ...ex, adjustedSets: finalSets, isCompleted: remaining <= 0, muscleGroup: group };
    },

    getGroup: function(name) {
        const cleanName = name.trim().replace(" ☀️", "");
        if (window.exercisesDB) {
            const match = window.exercisesDB.find(ex => ex.name === cleanName);
            if (match) return match.muscleGroup;
        }
        return "Άλλο";
    }
};
