/* ==========================================================================
   PEGASUS DYNAMIC OPTIMIZER - v2.3 (SATURDAY-CYCLE ENABLED)
   Protocol: Strict Load Management - Saturday Cycle Alignment
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
        // --- 1. DATA INITIALIZATION ---
        const historyKey = 'pegasus_weekly_history';
        const progress = JSON.parse(localStorage.getItem(historyKey)) || { "Στήθος": 0, "Πλάτη": 0, "Ώμοι": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 };
        let sessionTracker = { ...progress };
        const currentTargets = this.getTargets(); 

        // Initial Mapping
        let mappedData = sessionExercises.map(ex => this.calculateExercise(ex, sessionTracker, currentTargets));

        // Υπολογισμός χρόνου (v2.3: 2.1 λεπτά ανά άσκηση των 5 σετ λόγω μεγαλύτερων διαλειμμάτων)
        const getActiveMins = (data) => data.reduce((sum, ex) => sum + (ex.adjustedSets > 0 ? (ex.adjustedSets * 2.1) : 0), 0);
        let currentMinutes = getActiveMins(mappedData);

        // --- 2. DYNAMIC FILLER PROTOCOL (Tuesday 60m / Fri-Sun 45m) ---
        const targetMins = (day === "Τρίτη") ? 60 : 45;
        
        // Ημέρες που ο Optimizer επιτρέπεται να προσθέσει ασκήσεις αυτόματα
        const activeDays = ["Τρίτη", "Παρασκευή", "Σάββατο", "Κυριακή"];

        if (activeDays.includes(day) && currentMinutes < (targetMins - 5)) {
            console.log(`[OPTIMIZER v2.3] Day: ${day}. Session short (${currentMinutes.toFixed(1)}m). Target: ${targetMins}m. Filling...`);
            
            const priorities = {
                "Τρίτη": ["Στήθος", "Πλάτη", "Ώμοι", "Χέρια"], // Heavy Load Day
                "Παρασκευή": ["Πλάτη", "Ώμοι", "Χέρια", "Κορμός"], // Closer Day
                "Σάββατο": ["Πόδια", "Κορμός", "Στήθος"], 
                "Κυριακή": ["Στήθος", "Χέρια", "Κορμός", "Πλάτη"]
            };

            const searchGroups = priorities[day] || ["Κορμός"];
            
            for (let groupName of searchGroups) {
                if (currentMinutes >= targetMins) break;

                const potentialEx = window.exercisesDB.filter(ex => ex.muscleGroup === groupName);

                for (let sEx of potentialEx) {
                    if (currentMinutes >= targetMins) break;
                    
                    if (sEx.name.includes("Ποδηλασία")) continue;
                    // Αποφυγή ποδιών την Τρίτη αν έχει γίνει ποδήλατο το Σ/Κ
                    if (day === "Τρίτη" && sEx.muscleGroup === "Πόδια") continue;

                    const done = sessionTracker[groupName] || 0;
                    const target = currentTargets[groupName] || 24;

                    if (done < target && !mappedData.some(m => m.name.trim() === sEx.name.trim())) {
                        // Δυναμικός υπολογισμός σετ για να πιάσουμε το χρόνο
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
        
        // Weight Equivalent για Ποδηλασία
        if (ex.name.includes("Ποδηλασία") || ex.name.includes("Cycling")) {
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
            const match = window.exercisesDB.find(ex => ex.name.trim() === cleanName);
            if (match) return match.muscleGroup;
        }
        
        const n = cleanName.toLowerCase();
        if (n.includes("στήθος") || n.includes("chest") || n.includes("pushups")) return "Στήθος";
        if (n.includes("πλάτη") || n.includes("row") || n.includes("pulldown") || n.includes("back")) return "Πλάτη";
        if (n.includes("πόδια") || n.includes("leg") || n.includes("kickbacks") || n.includes("cycling") || n.includes("ποδηλασία")) return "Πόδια";
        if (n.includes("χέρια") || n.includes("bicep") || n.includes("tricep") || n.includes("curls") || n.includes("preacher")) return "Χέρια";
        if (n.includes("ώμοι") || n.includes("shoulder") || n.includes("upright")) return "Ώμοι";
        if (n.includes("κορμός") || n.includes("abs") || n.includes("crunch") || n.includes("plank") || n.includes("raise") || n.includes("situps")) return "Κορμός";
        return "Άλλο";
    }
};
