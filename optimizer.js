/* ==========================================================================
   PEGASUS DYNAMIC OPTIMIZER & LOAD BALANCER - v1.3
   Protocol: Weekly Volume Capping & Friday-Only Load Balancing
   Logistics: Wednesday EMS (Off-site / No Spillover)
   ========================================================================== */

const PegasusOptimizer = {
    targets: { 
        "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, 
        "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 
    },

    apply(day, sessionExercises) {
        console.log(`%c[OPTIMIZER] Balancing Load for: ${day}`, "color: #00bcd4; font-weight: bold;");
        
        const progress = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
        let sessionTracker = { ...progress };

        // 1. Επεξεργασία ασκήσεων τρέχουσας ημέρας (Capping)
        let mappedData = sessionExercises.map(ex => {
            return this.calculateExercise(ex, sessionTracker);
        });

        // 2. LOAD BALANCING LOGIC (Περιορισμός: Παρασκευή Μόνο)
        const totalSetsToday = mappedData.reduce((sum, ex) => sum + ex.adjustedSets, 0);
        
        if (day === "Παρασκευή" && totalSetsToday < 15) {
            console.log("%c[BALANCER] Low volume on Friday. Pulling from Saturday...", "color: #4CAF50;");
            
            const saturdayEx = window.program["Σάββατο"] || [];
            saturdayEx.forEach(sEx => {
                const group = this.getGroup(sEx.name);
                const done = sessionTracker[group] || 0;
                const target = this.targets[group] || 24;

                if (done < target && !mappedData.some(m => m.name.includes(sEx.name.trim()))) {
                    const spilloverEx = this.calculateExercise(sEx, sessionTracker);
                    
                    if (spilloverEx.adjustedSets > 0) {
                        spilloverEx.isSpillover = true;
                        spilloverEx.name = `${spilloverEx.name} ☀️`; 
                        mappedData.push(spilloverEx);
                    }
                }
            });
        }

        return mappedData;
    },

    calculateExercise(ex, tracker) {
        const muscleGroup = this.getGroup(ex.name);
        const target = this.targets[muscleGroup] || 24;
        const alreadyDone = tracker[muscleGroup] || 0;
        const remaining = target - alreadyDone;

        let finalSets = ex.sets;
        let isCompleted = alreadyDone >= target;

        if (ex.name.includes("Ποδηλασία")) {
            finalSets = (remaining >= 18) ? 1 : 0;
            isCompleted = (remaining < 18);
        } else {
            if (isCompleted) finalSets = 0;
            else if (ex.sets > remaining) finalSets = remaining;
        }

        if (finalSets > 0) {
            tracker[muscleGroup] += (ex.name.includes("Ποδηλασία") ? 18 : finalSets);
        }

        return { 
            ...ex, 
            adjustedSets: finalSets, 
            isCompleted: isCompleted, 
            muscleGroup: muscleGroup 
        };
    },

    getGroup(name) {
        const n = name.toLowerCase();
        if (n.includes("chest") || n.includes("pushups") || n.includes("flys") || n.includes("στήθος")) return "Στήθος";
        if (n.includes("row") || n.includes("pulldown") || n.includes("back") || n.includes("πλάτη")) return "Πλάτη";
        if (n.includes("leg") || n.includes("cycling") || n.includes("πόδια") || n.includes("ποδηλασία") || n.includes("extensions") || n.includes("kickbacks")) return "Πόδια";
        if (n.includes("bicep") || n.includes("tricep") || n.includes("χέρια") || n.includes("κάμψεις") || n.includes("curls") || n.includes("pulldowns")) return "Χέρια";
        if (n.includes("shoulder") || n.includes("upright") || n.includes("ώμοι")) return "Ώμοι";
        if (n.includes("abs") || n.includes("crunch") || n.includes("situp") || n.includes("plank") || n.includes("κορμός") || n.includes("raise")) return "Κορμός";
        return "Άλλο";
    }
};
