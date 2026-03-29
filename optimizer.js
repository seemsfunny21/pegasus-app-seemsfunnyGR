/* ==========================================================================
   PEGASUS DYNAMIC OPTIMIZER - v2.3 (SATURDAY CYCLE READY)
   Protocol: Strict Load Management - 45m Session Filler - Saturday Anchor
   Update: Saturday now acts as the start of the week for volume distribution.
   ========================================================================== */

window.PegasusOptimizer = {
    // 1. Ανάκτηση Στόχων
    getTargets: function() {
        try {
            const stored = localStorage.getItem("pegasus_muscle_targets");
            return stored ? JSON.parse(stored) : { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 };
        } catch (e) {
            return { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 };
        }
    },

    // 2. Κύρια Λειτουργία Εφαρμογής Optimizer
    apply: function(day, sessionExercises) {
        // --- PEGASUS SATURDAY ANCHOR LOGIC ---
        // Αν είναι Σάββατο, ξεκινάμε με καθαρή μνήμη για τον υπολογισμό του νέου κύκλου.
        let progress = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
        
        const lastReset = localStorage.getItem('pegasus_last_reset');
        const todayDate = new Date().toISOString().split('T')[0];
        
        if (day === "Σάββατο" && lastReset !== todayDate) {
            console.log("🚀 PEGASUS OPTIMIZER: New Cycle detected (Saturday). Resetting local memory stats...");
            progress = { "Στήθος": 0, "Πλάτη": 0, "Ώμοι": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 };
        }
        
        let sessionTracker = { ...progress };
        const currentTargets = this.getTargets(); 

        // Initial Mapping βασικών ασκήσεων ημέρας
        let mappedData = sessionExercises.map(ex => this.calculateExercise(ex, sessionTracker, currentTargets));

        // Υπολογισμός πραγματικού χρόνου (1.9 λεπτά ανά άσκηση των 5 σετ)
        const getActiveMins = (data) => data.reduce((sum, ex) => sum + (ex.adjustedSets > 0 ? (ex.adjustedSets * 1.9) : 0), 0);
        let currentMinutes = getActiveMins(mappedData);

        // 3. LOAD BALANCING PROTOCOL (Στόχος: 45 λεπτά)
        if ((day === "Παρασκευή" || day === "Σάββατο" || day === "Κυριακή") && currentMinutes < 40) {
            console.log(`[OPTIMIZER v2.3] Session too short (${currentMinutes.toFixed(1)}m). Filling up based on priorities...`);
            
            // Ιεραρχία Ομάδων ανά ημέρα (Πρωτεύουσες -> Δευτερεύουσες -> Fallbacks)
            const priorities = {
                "Παρασκευή": ["Πλάτη", "Ώμοι", "Χέρια", "Κορμός"],
                "Σάββατο": ["Πόδια", "Κορμός", "Στήθος"],
                "Κυριακή": ["Στήθος", "Χέρια", "Κορμός", "Πλάτη"]
            };

            const searchGroups = priorities[day] || ["Κορμός"];
            
            for (let groupName of searchGroups) {
                if (currentMinutes >= 45) break;

                // Φιλτράρισμα ασκήσεων από την DB που ανήκουν στην ομάδα και δεν είναι ήδη στο πλάνο
                if (!window.exercisesDB) break;
                const potentialEx = window.exercisesDB.filter(ex => ex.muscleGroup === groupName);

                for (let sEx of potentialEx) {
                    if (currentMinutes >= 45) break;
                    
                    // GUARD: Απαγόρευση Ποδηλασίας εκτός Σαββάτου & Αποφυγή Ποδιών την Παρασκευή
                    if (sEx.name.includes("Ποδηλασία")) continue;
                    if (day === "Παρασκευή" && sEx.muscleGroup === "Πόδια") continue;

                    const done = sessionTracker[groupName] || 0;
                    const target = currentTargets[groupName] || 24;

                    // Αν υπάρχουν ελλείμματα στην ομάδα και η άσκηση είναι νέα για σήμερα
                    if (done < target && !mappedData.some(m => m.name.trim() === sEx.name.trim())) {
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

    // 3. Υπολογισμός Σετ ανά Άσκηση
    calculateExercise: function(ex, tracker, currentTargets) {
        const group = this.getGroup(ex.name);
        const target = currentTargets[group] || 24;
        const remaining = target - (tracker[group] || 0);
        
        let finalSets = (remaining <= 0) ? 0 : (ex.sets > remaining ? remaining : ex.sets);
        
        // Ειδική λογική Ποδηλασίας (Weight Equivalent: 18 sets)
        if (ex.name.includes("Ποδηλασία")) {
            finalSets = (remaining >= 18) ? 1 : 0;
        }
        
        if (finalSets > 0) {
            tracker[group] += (ex.name.includes("Ποδηλασία") ? 18 : finalSets);
        }

        return { ...ex, adjustedSets: finalSets, isCompleted: remaining <= 0, muscleGroup: group };
    },

    // 4. Muscle Group Mapping (Data Integrity Bridge)
    getGroup: function(name) {
        const cleanName = name.trim().replace(" ☀️", "");
        if (window.exercisesDB) {
            const match = window.exercisesDB.find(ex => ex.name === cleanName);
            if (match) return match.muscleGroup;
        }
        
        // Fallback mapping αν η DB δεν είναι διαθέσιμη
        const n = cleanName.toLowerCase();
        if (n.includes("στήθος") || n.includes("chest") || n.includes("pushups")) return "Στήθος";
        if (n.includes("πλάτη") || n.includes("row") || n.includes("pulldown") || n.includes("back")) return "Πλάτη";
        if (n.includes("πόδια") || n.includes("leg") || n.includes("kickbacks") || n.includes("cycling")) return "Πόδια";
        if (n.includes("χέρια") || n.includes("bicep") || n.includes("tricep") || n.includes("curls")) return "Χέρια";
        if (n.includes("ώμοι") || n.includes("shoulder") || n.includes("upright")) return "Ώμοι";
        if (n.includes("κορμός") || n.includes("abs") || n.includes("crunch") || n.includes("plank") || n.includes("raise")) return "Κορμός";
        return "Άλλο";
    }
};
