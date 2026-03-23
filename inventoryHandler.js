/* ==========================================================================
   PEGASUS SMART INVENTORY HANDLER - v10.0 (STRICT NO-LEGS & CYCLING SYNC)
   Protocol: No Weight Training for Legs. Cycling = 18 Sets Credit.
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
    if (day === "Τετάρτη") return []; // Διαχείριση μέσω ems.js 
    
    // Δευτέρα και Πέμπτη: Ημέρες Αποθεραπείας [cite: 2026-03-02]
    if (day === "Πέμπτη" || day === "Δευτέρα") return []; 

    const sortedGroups = getSortedMuscleGroups();
    let program = [];

    // STRICT: Φιλτράρισμα ώστε να ΜΗΝ προτείνονται ποτέ βάρη για πόδια
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

    // Ειδική περίπτωση για Ποδηλασία [cite: 2026-03-23]
    if (cleanName.includes("ποδηλασία")) return "Πόδια";

    if (typeof exercisesDB !== 'undefined') {
        const found = exercisesDB.find(ex => ex.name.toLowerCase() === cleanName);
        if (found) return found.muscleGroup;
    }
    
    const manualMap = {
        "seated chest press": "Στήθος", "pec deck": "Στήθος", "pushups": "Στήθος",
        "lat pulldown": "Πλάτη", "low seated row": "Πλάτη",
        "preacher curl": "Χέρια", "bicep curls": "Χέρια",
        "plank": "Κορμός", "ems": "Κορμός"
    };

    for (let key in manualMap) {
        if (cleanName.includes(key)) return manualMap[key];
    }
    return null;
}

/**
 * Αποθηκεύει την πρόοδο στο εβδομαδιαίο ιστορικό
 * STRICT: Η Ποδηλασία 30km πιστώνει αυτόματα 18 σετ [cite: 2026-03-23]
 */
function saveProgress(muscleGroup, sets = 1, exerciseName = "") {
    if (!muscleGroup) return;

    let history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
    
    // Υπολογισμός αξίας σετ
    let setValue = sets;
    if (exerciseName.toLowerCase().includes("ποδηλασία")) {
        setValue = 18; // Πίστωση λόγω διάρκειας 110 λεπτών [cite: 2026-03-23]
    }

    history[muscleGroup] = (history[muscleGroup] || 0) + setValue;
    
    localStorage.setItem('pegasus_weekly_history', JSON.stringify(history));
    console.log(`PEGASUS DATA: +${setValue} sets -> ${muscleGroup}. Total: ${history[muscleGroup]}`);
}

window.getSmartDailyProgram = getSmartDailyProgram;
window.saveProgress = saveProgress;
window.findMuscleGroup = findMuscleGroup;
window.getSortedMuscleGroups = getSortedMuscleGroups;
