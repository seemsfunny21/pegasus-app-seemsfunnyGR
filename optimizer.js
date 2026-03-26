/* ==========================================================================
   PEGASUS DYNAMIC OPTIMIZER - v2.0 (MODULAR / FULLY DECOUPLED)
   Protocol: Strict Data Analyst - Isolated Scope & Dynamic Targets
   ========================================================================== */

const PegasusOptimizer = (function() {
    // 1. ΙΔΙΩΤΙΚΕΣ ΣΤΑΘΕΡΕΣ (Private Configuration)
    const DEFAULT_TARGETS = { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 };

    // 2. ΕΣΩΤΕΡΙΚΕΣ ΛΕΙΤΟΥΡΓΙΕΣ (Private Methods)
    const getTargets = () => {
        try {
            const stored = localStorage.getItem("pegasus_muscle_targets");
            return stored ? JSON.parse(stored) : DEFAULT_TARGETS;
        } catch (e) {
            console.warn("[PEGASUS OPTIMIZER]: Error parsing targets, using defaults.");
            return DEFAULT_TARGETS;
        }
    };

    const getGroup = (name) => {
        const cleanName = name.trim().replace(" ☀️", "");
        
        // Ασφαλής ανάκτηση από τη βάση δεδομένων (αν υπάρχει)
        if (typeof window.exercisesDB !== 'undefined' && Array.isArray(window.exercisesDB)) {
            const exactMatch = window.exercisesDB.find(ex => ex.name === cleanName);
            if (exactMatch && exactMatch.muscleGroup) return exactMatch.muscleGroup;
        }
        
        // Fallback Μηχανισμός Λέξεων-Κλειδιών
        const n = cleanName.toLowerCase();
        if (n.includes("chest") || n.includes("pushups") || n.includes("flys") || n.includes("στήθος")) return "Στήθος";
        if (n.includes("row") || n.includes("pulldown") || n.includes("back") || n.includes("πλάτη")) return "Πλάτη";
        if (n.includes("leg") || n.includes("cycling") || n.includes("πόδια") || n.includes("extensions") || n.includes("kickbacks")) return "Πόδια";
        if (n.includes("bicep") || n.includes("tricep") || n.includes("χέρια") || n.includes("curls") || n.includes("pulldowns")) return "Χέρια";
        if (n.includes("shoulder") || n.includes("ώμοι") || n.includes("raises")) return "Ώμοι";
        if (n.includes("plank") || n.includes("crunch") || n.includes("situp") || n.includes("κορμός")) return "Κορμός";
        
        return "Άλλο";
    };

    const calculateExercise = (ex, tracker, currentTargets) => {
        const group = ex.muscleGroup || getGroup(ex.name);
        const target = currentTargets[group] || 0;
        const done = tracker[group] || 0;
        const remaining = Math.max(0, target - done);
        
        // Capping των σετ βάσει του υπολειπόμενου στόχου
        let finalSets = (remaining <= 0) ? 0 : Math.min(remaining, ex.sets ? parseInt(ex.sets) : 4);
        
        // Ειδικός κανόνας Ποδηλασίας (18 Set Credit)
        if (ex.name.includes("Ποδηλασία")) {
            finalSets = (remaining >= 18) ? 1 : 0;
        }
        
        if (finalSets > 0) {
            tracker[group] += (ex.name.includes("Ποδηλασία") ? 18 : finalSets);
        }

        return { ...ex, adjustedSets: finalSets, isCompleted: remaining <= 0, muscleGroup: group };
    };

    // 3. PUBLIC API
    return {
        apply: function(day, sessionExercises) {
            if (!Array.isArray(sessionExercises)) return [];

            const progress = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
            let sessionTracker = { ...progress };
            const currentTargets = getTargets(); 

            // Προσαρμογή Ασκήσεων και Capping
            let mappedData = sessionExercises.map(ex => calculateExercise(ex, sessionTracker, currentTargets));

            return mappedData;
        },
        getGroup: getGroup
    };
})();

// Εξαγωγή στο Window Scope για διασύνδεση με τον Core Controller (app.js)
window.PegasusOptimizer = PegasusOptimizer;