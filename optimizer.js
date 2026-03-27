/* ==========================================================================
   PEGASUS DYNAMIC OPTIMIZER - v2.0 (RECOVERY AWARE & STRICT TIME)
   Protocol: Load Management (Fri/Sat/Sun) - 45m Cap - 5 Set Volume Boost
   ========================================================================== */

window.PegasusOptimizer = {
    getTargets: function() {
        try {
            const stored = localStorage.getItem("pegasus_muscle_targets");
            return stored ? JSON.parse(stored) : { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 };
        } catch (e) {
            return { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 };
        }
    },

    apply: function(day, sessionExercises) {
        const progress = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
        let sessionTracker = { ...progress };
        const currentTargets = this.getTargets(); 

        // 1. Αρχικό mapping βασικών ασκήσεων
        let mappedData = sessionExercises.map(ex => this.calculateExercise(ex, sessionTracker, currentTargets));

        // Υπολογισμός χρόνου: 1.9 λεπτά ανά άσκηση (5 σετ x 115" + μετάβαση)
        const getActiveMins = (data) => data.reduce((sum, ex) => sum + (ex.adjustedSets > 0 ? (ex.adjustedSets * 1.9) : 0), 0);
        let currentMinutes = getActiveMins(mappedData);

        // 2. SMART LOAD BALANCING (Π/Σ/Κ)
        if ((day === "Παρασκευή" || day === "Σάββατο" || day === "Κυριακή") && currentMinutes < 45) {
            console.log(`[OPTIMIZER v2.0] ${day} at ${currentMinutes.toFixed(1)}m. Balancing...`);
            
            // Πρωτόκολλο Απομόνωσης Μυϊκών Ομάδων (Load Split)
            const dailyPriority = {
                "Παρασκευή": ["Πλάτη", "Ώμοι"],
                "Σάββατο": ["Πόδια", "Κορμός"],
                "Κυριακή": ["Στήθος", "Χέρια", "Κορμός"]
            };

            const searchGroups = dailyPriority[day] || ["Κορμός"];
            
            for (let groupName of searchGroups) {
                if (currentMinutes >= 45) break;

                // Αναζήτηση στην Database για ασκήσεις της συγκεκριμένης ομάδας
                const potentialEx = window.exercisesDB.filter(ex => ex.muscleGroup === groupName);

                for (let sEx of potentialEx) {
                    if (currentMinutes >= 45) break;
                    
                    // GUARD: Απαγόρευση Ποδηλασίας την Παρασκευή
                    if (sEx.name.includes("Ποδηλασία")) continue;

                    const done = sessionTracker[groupName] || 0;
                    const target = currentTargets[groupName] || 24;

                    // Έλεγχος αν η άσκηση λείπει από το σημερινό πλάνο και αν υπάρχει υπόλοιπο στα stats
                    if (done < target && !mappedData.some(m => m.name.trim() === sEx.name.trim())) {
                        // Επιβολή 5 σετ για το τριήμερο (Volume Boost)
                        let spilloverEx = this.calculateExercise({...sEx, sets: 5}, sessionTracker, currentTargets);
                        
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
        
        // Capping σετ βάσει του τι απομένει στην εβδομάδα
        let finalSets = (remaining <= 0) ? 0 : (ex.sets > remaining ? remaining : ex.sets);
        
        // Ειδική λογική για ποδηλασία (18 σετ weight)
        if (ex.name.includes("Ποδηλασία")) finalSets = (remaining >= 18) ? 1 : 0;
        
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
        // Fallback mapping
        const n = cleanName.toLowerCase();
        if (n.includes("στήθος") || n.includes("chest") || n.includes("pushups")) return "Στήθος";
        if (n.includes("πλάτη") || n.includes("row") || n.includes("pulldown")) return "Πλάτη";
        if (n.includes("πόδια") || n.includes("leg") || n.includes("kickbacks") || n.includes("cycling")) return "Πόδια";
        if (n.includes("χέρια") || n.includes("bicep") || n.includes("tricep") || n.includes("curls")) return "Χέρια";
        if (n.includes("ώμοι") || n.includes("shoulder") || n.includes("upright")) return "Ώμοι";
        if (n.includes("κορμός") || n.includes("abs") || n.includes("crunch") || n.includes("plank")) return "Κορμός";
        return "Άλλο";
    }
};
