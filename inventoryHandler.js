/* ==========================================================================
   PEGASUS SMART INVENTORY HANDLER - STRICTOR EDITION (v10.5 SYNC)
   ========================================================================== */

/**
 * Υπολογίζει το ποσοστό ολοκλήρωσης κάθε μυϊκής ομάδας
 */
function getSortedMuscleGroups() {
    const history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
    const targets = { "Στήθος": 24, "Πλάτη": 24, "Ώμοι": 16, "Χέρια": 16, "Κορμός": 12, "Πόδια": 24 };
    
    let stats = Object.keys(targets).map(group => {
        let done = history[group] || 0;
        let target = targets[group];
        return {
            name: group,
            percent: (done / target) * 100,
            remaining: Math.max(0, target - done)
        };
    });

    return stats.sort((a, b) => a.percent - b.percent);
}

/**
 * Επιστρέφει το δυναμικό πρόγραμμα ημέρας βάσει ελλείψεων
 */
function getSmartDailyProgram(day) {
    if (day === "Τετάρτη") return [
        { name: "EMS Full Body", sets: 1 },
        { name: "Core Stabilization", sets: 3 }
    ];
    // Δευτέρα και Πέμπτη: Ημέρες Αποθεραπείας (Strict Rule)
    if (day === "Πέμπτη" || day === "Δευτέρα") return []; 

    const sortedGroups = getSortedMuscleGroups();
    let program = [];

    // PEGASUS PATCH: Φιλτράρουμε τα "Πόδια" ώστε να μην προτείνονται ασκήσεις με βάρη
    const availableGroups = sortedGroups.filter(g => g.name !== "Πόδια" && g.remaining > 0);

    availableGroups.slice(0, 2).forEach(group => {
        if (typeof exercisesDB !== 'undefined') {
            const availableEx = exercisesDB.filter(ex => ex.muscleGroup === group.name);
            availableEx.forEach(ex => {
                program.push({
                    name: ex.name,
                    sets: Math.min(4, group.remaining)
                });
            });
        }
    });

    return program;
}

/**
 * Βρίσκει τη μυϊκή ομάδα με βελτιωμένο ταίριασμα ονομάτων
 */
function findMuscleGroup(exerciseName) {
    if (!exerciseName) return null;
    
    const cleanName = exerciseName.trim().toLowerCase();

    // 1. Έλεγχος στη βάση δεδομένων (αν υπάρχει)
    if (typeof exercisesDB !== 'undefined') {
        const found = exercisesDB.find(ex => ex.name.toLowerCase() === cleanName);
        if (found) return found.muscleGroup;
    }
    
    // 2. Διευρυμένο Manual Mapping για ακρίβεια
    const manualMap = {
        "seated chest press": "Στήθος",
        "chest press": "Στήθος",
        "pec deck": "Στήθος",
        "pushups": "Στήθος",
        "lat pulldown": "Πλάτη",
        "low seated row": "Πλάτη",
        "preacher curl": "Χέρια",
        "bicep curls": "Χέρια",
        "plank": "Κορμός",
        "leg press": "Πόδια",
        "ems full body": "Κορμός",
        "ποδηλασία": "Πόδια" // Προσθήκη για σωστή χαρτογράφηση
    };

    // Αναζήτηση με partial match αν δεν υπάρχει ακριβές
    for (let key in manualMap) {
        if (cleanName.includes(key)) return manualMap[key];
    }
    
    return null;
}

/**
 * Αποθηκεύει την πρόοδο στο εβδομαδιαίο ιστορικό
 */
function saveProgress(muscleGroup, sets = 1, exerciseName = "") {
    if (!muscleGroup) return;

    let history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
    
    // PEGASUS PATCH: Αυτόματη πίστωση 18 σετ αν η άσκηση είναι ποδηλασία
    let setValue = sets;
    if (exerciseName && exerciseName.toLowerCase().includes("ποδηλασία")) {
        setValue = 18;
    }

    // Ενημέρωση συνόλου
    history[muscleGroup] = (history[muscleGroup] || 0) + setValue;
    
    localStorage.setItem('pegasus_weekly_history', JSON.stringify(history));
    console.log(`PEGASUS DATA: +${setValue} sets -> ${muscleGroup}. Current: ${history[muscleGroup]}`);
}

/**
 * Μηδενισμός ιστορικού
 */
function resetWeeklyInventory() {
    localStorage.removeItem('pegasus_weekly_history');
    console.log("PEGASUS DATA: Weekly history cleared.");
}

// Global Exports
window.getSmartDailyProgram = getSmartDailyProgram;
window.saveProgress = saveProgress;
window.findMuscleGroup = findMuscleGroup;
window.getSortedMuscleGroups = getSortedMuscleGroups;
