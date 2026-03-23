/* ==========================================================================
   PEGASUS DYNAMIC OPTIMIZER - v1.1 (FINAL AUDITED)
   Protocol: Weekly Volume Capping & Cycling Credit Logic
   Target Profile: 74kg / 1.87m / 38y Male
   ========================================================================== */

const PegasusOptimizer = {
    // Κεντρικοί Στόχοι (Weekly Volume Targets)
    targets: { 
        "Στήθος": 24, 
        "Πλάτη": 24, 
        "Πόδια": 24, 
        "Χέρια": 16, 
        "Ώμοι": 16, 
        "Κορμός": 12 
    },

    /**
     * Εφαρμογή βελτιστοποίησης στο πρόγραμμα της ημέρας
     * @param {string} day - Η ημέρα της εβδομάδας
     * @param {Array} sessionExercises - Οι ασκήσεις από το data.js
     */
    apply(day, sessionExercises) {
        console.log(`%c[OPTIMIZER] Analyzing Volume for: ${day}`, "color: #ff9800; font-weight: bold;");
        
        // Ανάκτηση εβδομαδιαίας προόδου (Weekly History)
        const progress = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {
            "Στήθος": 0, "Πλάτη": 0, "Ώμοι": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0
        };

        // Προσωρινό αντίγραφο προόδου για τον υπολογισμό εντός της ίδιας συνεδρίας
        let sessionTracker = { ...progress };

        return sessionExercises.map(ex => {
            const muscleGroup = this.getGroup(ex.name);
            const target = this.targets[muscleGroup] || 24;
            const alreadyDone = sessionTracker[muscleGroup] || 0;
            const remaining = target - alreadyDone;

            let finalSets = ex.sets;
            let isCompleted = alreadyDone >= target;

            // Ειδική Λογική για Ποδηλασία (18-set Credit)
            if (ex.name.includes("Ποδηλασία")) {
                if (remaining < 18) {
                    finalSets = 0; // Αν δεν χωράει το credit των 18, ακυρώνεται
                    isCompleted = true;
                } else {
                    finalSets = 1; // 1 session = 18 sets credit
                }
            } 
            // Κανονική Λογική για βάρη/EMS
            else {
                if (isCompleted) {
                    finalSets = 0;
                } else if (ex.sets > remaining) {
                    finalSets = remaining; // Capping στο εναπομείναν όριο
                }
            }

            // Ενημέρωση του tracker για την επόμενη άσκηση της ίδιας ομάδας στην ίδια μέρα
            if (finalSets > 0) {
                const creditValue = ex.name.includes("Ποδηλασία") ? 18 : finalSets;
                sessionTracker[muscleGroup] += creditValue;
            }

            return { 
                ...ex, 
                adjustedSets: finalSets, 
                isCompleted: isCompleted,
                muscleGroup: muscleGroup 
            };
        });
    },

    /**
     * Ταξινόμηση ασκήσεων βάσει ονόματος σε Μυϊκές Ομάδες
     */
    getGroup(name) {
        const n = name.toLowerCase();
        if (n.includes("chest") || n.includes("pushups") || n.includes("flys") || n.includes("στήθος") || n.includes("πιέσεις πάγκου")) return "Στήθος";
        if (n.includes("row") || n.includes("pulldown") || n.includes("back") || n.includes("πλάτη") || n.includes("έλξεις")) return "Πλάτη";
        if (n.includes("leg") || n.includes("cycling") || n.includes("πόδια") || n.includes("ποδηλασία") || n.includes("squat")) return "Πόδια";
        if (n.includes("bicep") || n.includes("tricep") || n.includes("χέρια") || n.includes("κάμψεις") || n.includes("εκτάσεις τρικεφάλων")) return "Χέρια";
        if (n.includes("shoulder") || n.includes("upright") || n.includes("ώμοι") || n.includes("πιέσεις ώμων")) return "Ώμοι";
        if (n.includes("abs") || n.includes("crunch") || n.includes("situp") || n.includes("plank") || n.includes("κορμός") || n.includes("κοιλιακοί")) return "Κορμός";
        return "Άλλο";
    }
};
