/* ==========================================================================
   PEGASUS DYNAMIC OPTIMIZER - v1.0
   Protocol: Real-time Weekly Volume Correction
   ========================================================================== */

const PegasusOptimizer = {
    // Κεντρικοί Στόχοι Σετ ανά Ομάδα
    targets: { 
        "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, 
        "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 
    },

    // Κύρια Λειτουργία Βελτιστοποίησης
    apply(workoutName, sessionExercises) {
        console.log(`%c PEGASUS OPTIMIZER: Analyzing ${workoutName}... `, 'background: #00ff41; color: #000;');
        
        // Ανάκτηση τρέχουσας εβδομαδιαίας προόδου
        const progress = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
        
        return sessionExercises.map(ex => {
            const muscleGroup = this.getGroup(ex.name);
            if (!muscleGroup) return ex;

            const currentSets = progress[muscleGroup] || 0;
            const targetSets = this.targets[muscleGroup];
            const remaining = targetSets - currentSets;

            let optimizedSets = ex.sets;

            if (remaining <= 0) {
                optimizedSets = 0; // Ο στόχος έχει καλυφθεί
                console.warn(`OPTIMIZER: Skipping ${ex.name} (Limit reached for ${muscleGroup})`);
            } else if (ex.sets > remaining) {
                optimizedSets = remaining; // Μείωση σετ στο υπολειπόμενο όριο
                console.log(`OPTIMIZER: Capping ${ex.name} to ${remaining} sets.`);
            }

            return { ...ex, sets: optimizedSets };
        }).filter(ex => ex.sets > 0); // Αφαίρεση ασκήσεων με 0 σετ
    },

    // Mapping Ασκήσεων σε Μυϊκές Ομάδες
    getGroup(name) {
        const n = name.toLowerCase();
        if (n.includes("chest") || n.includes("pushups") || n.includes("flys")) return "Στήθος";
        if (n.includes("row") || n.includes("pulldown") || n.includes("back")) return "Πλάτη";
        if (n.includes("leg") || n.includes("cycling")) return "Πόδια";
        if (n.includes("bicep") || n.includes("tricep")) return "Χέρια";
        if (n.includes("shoulder") || n.includes("upright")) return "Ώμοι";
        if (n.includes("abs") || n.includes("crunch") || n.includes("situp") || n.includes("plank")) return "Κορμός";
        return null;
    }
};
