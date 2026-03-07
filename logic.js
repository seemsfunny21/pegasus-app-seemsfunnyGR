/* =============================================================
   PEGASUS DYNAMIC VOLUME SCALING (DVS) ENGINE - FINAL UNIFIED
   ============================================================= */

const DVS = {
    // 1. Στόχοι Σετ ανά Μυϊκή Ομάδα (Target Weekly Volume)
    targets: { 
        "Στήθος": 14, 
        "Πλάτη": 18, 
        "Χέρια": 18, 
        "Κορμός": 15, 
        "Πόδια": 6 
    },

    // 2. Λήψη στατιστικών από το LocalStorage
    getWeeklyStats: function() {
        // Χρήση του κλειδιού που είναι συγχρονισμένο με το UI του app.js
        const history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
        
        const stats = { "Στήθος": 0, "Πλάτη": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 };
        
        // Μεταφορά δεδομένων στο stats object (Case-safe)
        Object.keys(this.targets).forEach(group => {
            stats[group] = history[group] || 0;
        });

        return stats;
    },

    // 3. Αλγόριθμος Βελτιστοποίησης (Optimization Logic)
    optimize: function(dayExercises) {
        const currentStats = this.getWeeklyStats();
        
        return dayExercises.map(ex => {
            // Εύρεση της άσκησης στη βάση δεδομένων (data.js)
            const dbEntry = window.exercisesDB.find(db => db.name === ex.name);
            const group = dbEntry ? dbEntry.muscleGroup : null;

            if (!group) return ex;

            const done = currentStats[group];
            const target = this.targets[group];
            const coverage = (done / target) * 100;

            let optimized = { ...ex };

            // ΚΑΝΟΝΑΣ 1: Πλήρης Κάλυψη (>= 100%) -> Αφαίρεση άσκησης
            if (coverage >= 100) {
                optimized.sets = 0;
                console.log(`DVS: Skipping ${ex.name} (Group ${group} at ${Math.round(coverage)}%)`);
            } 
            // ΚΑΝΟΝΑΣ 2: Υψηλή Κάλυψη (> 60%) -> Μείωση σετ στο μισό (min 1)
            else if (coverage > 60) {
                optimized.sets = Math.max(1, Math.ceil(ex.sets / 2));
                console.log(`DVS: Reducing sets for ${ex.name} to ${optimized.sets} (Coverage: ${Math.round(coverage)}%)`);
            }

            return optimized;
        }).filter(ex => ex.sets > 0); // Αφαιρεί τις ασκήσεις με 0 σετ
    }
};

// Καθολική πρόσβαση για το app.js
window.DVS = DVS;