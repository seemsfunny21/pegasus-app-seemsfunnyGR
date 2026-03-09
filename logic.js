/* =============================================================
   PEGASUS DYNAMIC VOLUME SCALING (DVS) ENGINE - FINAL UNIFIED
   ============================================================= */

const DVS = {
    targets: { 
        "Στήθος": 14, 
        "Πλάτη": 18, 
        "Χέρια": 18, 
        "Κορμός": 15, 
        "Πόδια": 6 
    },

    getWeeklyStats: function() {
        const history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
        const stats = { "Στήθος": 0, "Πλάτη": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 };
        
        Object.keys(this.targets).forEach(group => {
            stats[group] = history[group] || 0;
        });
        return stats;
    },

    optimize: function(dayExercises, currentDay) { // Προσθήκη παραμέτρου currentDay
        const currentStats = this.getWeeklyStats();
        
        return dayExercises.map(ex => {
            const dbEntry = window.exercisesDB.find(db => db.name === ex.name);
            const group = dbEntry ? dbEntry.muscleGroup : null;

            if (!group) return ex;

            // --- ΝΕΟΣ ΚΑΝΟΝΑΣ: ΕΞΑΙΡΕΣΗ ΚΟΡΜΟΥ ΠΑΡΑΣΚΕΥΗΣ ---
            // Αν είναι Παρασκευή και η άσκηση ανήκει στον Κορμό, την αφαιρούμε αυτόματα
            if (currentDay === "Παρασκευή" && group === "Κορμός") {
                console.log(`DVS: Auto-skipping ${ex.name} (Friday Core Bypass)`);
                return { ...ex, sets: 0 };
            }
            // -----------------------------------------------

            const done = currentStats[group];
            const target = this.targets[group];
            const coverage = (done / target) * 100;

            let optimized = { ...ex };

            if (coverage >= 100) {
                optimized.sets = 0;
                console.log(`DVS: Skipping ${ex.name} (Group ${group} at ${Math.round(coverage)}%)`);
            } 
            else if (coverage > 60) {
                optimized.sets = Math.max(1, Math.ceil(ex.sets / 2));
                console.log(`DVS: Reducing sets for ${ex.name} to ${optimized.sets} (Coverage: ${Math.round(coverage)}%)`);
            }

            return optimized;
        }).filter(ex => ex.sets > 0); 
    }
};

window.DVS = DVS;