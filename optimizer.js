/* ==========================================================================
   PEGASUS DYNAMIC OPTIMIZER - v1.6 (GLOBAL SCOPE & DYNAMIC TARGETS)
   Protocol: Friday Load Balancing with 40-Minute Limit & DYNAMIC TARGETS
   ========================================================================== */

window.PegasusOptimizer = {
    // Δυναμική ανάκτηση από το localStorage (Settings)
    getTargets: function() {
        try {
            const stored = localStorage.getItem("pegasus_muscle_targets");
            return stored ? JSON.parse(stored) : { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 };
        } catch (e) {
            console.warn("PEGASUS: Error parsing targets, using defaults.");
            return { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 };
        }
    },

    apply: function(day, sessionExercises) {
        const progress = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
        let sessionTracker = { ...progress };
        const currentTargets = this.getTargets(); 

        // 1. Capping των ασκήσεων της ημέρας
        let mappedData = sessionExercises.map(ex => this.calculateExercise(ex, sessionTracker, currentTargets));

        // 2. SMART LOAD BALANCING (Παρασκευή Μόνο)
        let currentSets = mappedData.reduce((sum, ex) => sum + ex.adjustedSets, 0);
        let currentMinutes = currentSets * 2; 

        if (day === "Παρασκευή" && currentMinutes < 40) {
            console.log(`[BALANCER] Friday at ${currentMinutes}m. Pulling from Saturday...`);
            const saturdayEx = window.program ? (window.program["Σάββατο"] || []) : [];
            
            for (let sEx of saturdayEx) {
                if (currentMinutes >= 40) break; 

                const group = this.getGroup(sEx.name);
                const done = sessionTracker[group] || 0;
                const target = currentTargets[group] || 24; 

                if (done < target && !mappedData.some(m => m.name.includes(sEx.name.trim()))) {
                    const spilloverEx = this.calculateExercise(sEx, sessionTracker, currentTargets);
                    if (spilloverEx.adjustedSets > 0) {
                        spilloverEx.isSpillover = true;
                        spilloverEx.name = `${spilloverEx.name} ☀️`;
                        mappedData.push(spilloverEx);
                        currentMinutes += (spilloverEx.adjustedSets * 2);
                    }
                }
            }
        }
        return mappedData;
    },

    calculateExercise: function(ex, tracker, currentTargets) {
        const group = this.getGroup(ex.name);
        const target = currentTargets ? (currentTargets[group] || 24) : 24;
        const remaining = target - (tracker[group] || 0);
        
        let finalSets = (remaining <= 0) ? 0 : (ex.sets > remaining ? remaining : ex.sets);
        
        if (ex.name.includes("Ποδηλασία")) finalSets = (remaining >= 18) ? 1 : 0;
        if (finalSets > 0) tracker[group] += (ex.name.includes("Ποδηλασία") ? 18 : finalSets);

        return { ...ex, adjustedSets: finalSets, isCompleted: remaining <= 0, muscleGroup: group };
    },

    getGroup: function(name) {
        const cleanName = name.trim().replace(" ☀️", "");
        if (window.exercisesDB) {
            const exactMatch = window.exercisesDB.find(ex => ex.name === cleanName);
            if (exactMatch && exactMatch.muscleGroup) return exactMatch.muscleGroup;
        }
        
        const n = cleanName.toLowerCase();
        if (n.includes("chest") || n.includes("pushups") || n.includes("flys") || n.includes("στήθος")) return "Στήθος";
        if (n.includes("row") || n.includes("pulldown") || n.includes("back") || n.includes("πλάτη")) return "Πλάτη";
        if (n.includes("leg") || n.includes("cycling") || n.includes("πόδια") || n.includes("extensions") || n.includes("kickbacks")) return "Πόδια";
        if (n.includes("bicep") || n.includes("tricep") || n.includes("χέρια") || n.includes("curls") || n.includes("pulldowns")) return "Χέρια";
        if (n.includes("shoulder") || n.includes("upright") || n.includes("ώμοι")) return "Ώμοι";
        if (n.includes("abs") || n.includes("crunch") || n.includes("situp") || n.includes("plank") || n.includes("raise") || n.includes("ems full body")) return "Κορμός";
        return "Άλλο";
    }
};
