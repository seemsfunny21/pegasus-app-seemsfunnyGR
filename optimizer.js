/* ==========================================================================
   PEGASUS DYNAMIC OPTIMIZER - v2.4 (FINAL TACTICAL)
   Protocol: Saturday Anchor Reset & Stretching Guard
   ========================================================================== */

window.PegasusOptimizer = {
    getTargets: function() {
        try {
            const stored = localStorage.getItem("pegasus_muscle_targets");
            return stored ? JSON.parse(stored) : { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 };
        } catch (e) { return { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 }; }
    },

    apply: function(day, sessionExercises) {
        let progress = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
        const lastReset = localStorage.getItem('pegasus_last_reset');
       const now = new Date();
       const todayDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        // 🔥 SATURDAY ANCHOR: Reset αν είναι Σάββατο και δεν έχει γίνει ήδη
        const lastResetTime = new Date(lastReset || 0).getTime();
        const daysSinceReset = (new Date().getTime() - lastResetTime) / (1000 * 3600 * 24);
        
        // 🛡️ TACTICAL RESET: Αν είναι Σάββατο, Ή αν χάσαμε το Σάββατο και πέρασε μια εβδομάδα
        if ((day === "Σάββατο" && lastReset !== todayDate) || daysSinceReset >= 6.5) {
            console.log("🚀 PEGASUS: Weekly Cycle Start. Resetting History...");
            console.log("🚀 PEGASUS: Saturday Cycle Start. Resetting History...");
            progress = { "Στήθος": 0, "Πλάτη": 0, "Ώμοι": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 };
        }
        
        let sessionTracker = { ...progress };
        const currentTargets = this.getTargets(); 
        let mappedData = sessionExercises.map(ex => this.calculateExercise(ex, sessionTracker, currentTargets));

        const getActiveMins = (data) => data.reduce((sum, ex) => sum + (ex.adjustedSets > 0 ? (ex.adjustedSets * 1.9) : 0), 0);
        let currentMinutes = getActiveMins(mappedData);

        if ((day === "Παρασκευή" || day === "Σάββατο" || day === "Κυριακή") && currentMinutes < 40) {
            const priorities = {
                "Παρασκευή": ["Πλάτη", "Ώμοι", "Χέρια", "Κορμός"],
                "Σάββατο": ["Πόδια", "Κορμός", "Στήθος"],
                "Κυριακή": ["Στήθος", "Χέρια", "Κορμός", "Πλάτη"]
            };
            const searchGroups = priorities[day] || ["Κορμός"];
            
            for (let groupName of searchGroups) {
                if (currentMinutes >= 45) break;
                if (!window.exercisesDB) break;
                const potentialEx = window.exercisesDB.filter(ex => ex.muscleGroup === groupName);

                for (let sEx of potentialEx) {
                    if (currentMinutes >= 45) break;
                    // 🛡️ STRETCHING GUARD: Αποκλεισμός Stretching/Warmup από τα αυτόματα fillers
                    if (sEx.name.includes("Ποδηλασία") || sEx.name.includes("Stretching") || sEx.name.includes("Warmup")) continue;
                    if (day === "Παρασκευή" && sEx.muscleGroup === "Πόδια") continue;

                    const done = sessionTracker[groupName] || 0;
                    const target = currentTargets[groupName] || 24;

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

    calculateExercise: function(ex, tracker, currentTargets) {
        const group = this.getGroup(ex.name);
        const target = currentTargets[group] || 24;
        const remaining = target - (tracker[group] || 0);
        let finalSets = (remaining <= 0) ? 0 : (ex.sets > remaining ? remaining : ex.sets);
        if (ex.name.includes("Ποδηλασία")) { finalSets = (remaining >= 18) ? 1 : 0; }
        if (finalSets > 0) { tracker[group] += (ex.name.includes("Ποδηλασία") ? 18 : finalSets); }
        return { ...ex, adjustedSets: finalSets, isCompleted: remaining <= 0, muscleGroup: group };
    },

    getGroup: function(name) {
        const cleanName = name.trim().replace(" ☀️", "");
        if (window.exercisesDB) {
            const match = window.exercisesDB.find(ex => ex.name === cleanName);
            if (match) return match.muscleGroup;
        }
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
