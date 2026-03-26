/* ==========================================================================
   PEGASUS SMART INVENTORY HANDLER - V11.3 (STABLE SYNC)
   Protocol: Strict Recovery Alignment & Muscle Tracking
   ========================================================================== */

function getSortedMuscleGroups() {
    const history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
    const targets = JSON.parse(localStorage.getItem("pegasus_muscle_targets")) || 
                { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 };
    
    let stats = Object.keys(targets).map(group => {
        let done = history[group] || 0;
        let target = targets[group];
        return {
            name: group,
            percent: target > 0 ? (done / target) * 100 : 100,
            remaining: Math.max(0, target - done)
        };
    });
    return stats.sort((a, b) => a.percent - b.percent);
}

// FIX: Ενοποιημένη πηγή αλήθειας για τις ημέρες αποθεραπείας (Δευτέρα/Πέμπτη)
function getSmartDailyProgram(day) {
    if (day === "Δευτέρα" || day === "Πέμπτη") {
        return [{ name: "Stretching", sets: 1, duration: 338, muscleGroup: "Κορμός" }];
    }
    
    if (day === "Τετάρτη") {
        return [
            { name: "EMS Full Body", sets: 1, muscleGroup: "Κορμός" },
            { name: "Core Stabilization", sets: 3, muscleGroup: "Κορμός" }
        ];
    }

    const sortedGroups = getSortedMuscleGroups();
    let program = [];
    const availableGroups = sortedGroups.filter(g => g.remaining > 0);

    availableGroups.slice(0, 2).forEach(group => {
        if (window.exercisesDB) {
            const availableEx = window.exercisesDB.filter(ex => ex.muscleGroup === group.name);
            availableEx.slice(0, 2).forEach(ex => {
                program.push({ name: ex.name, sets: 4, muscleGroup: ex.muscleGroup });
            });
        }
    });
    return program;
}

function saveProgress(muscleGroup, sets = 1, exerciseName = "") {
    if (!muscleGroup) return;
    let history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
    let setValue = (exerciseName.toLowerCase().includes("ποδηλασία")) ? 18 : sets;
    history[muscleGroup] = (history[muscleGroup] || 0) + setValue;
    localStorage.setItem('pegasus_weekly_history', JSON.stringify(history));
    if (window.PegasusCloud) window.PegasusCloud.push(true);
}

// Supplement Logic (Stable)
function initSupplementInventory() {
    return JSON.parse(localStorage.getItem('pegasus_supp_inventory')) || { prot: 2500, crea: 1000 };
}

function consumeDailySupplements() {
    let inv = initSupplementInventory();
    inv.prot = Math.max(0, inv.prot - 60);
    inv.crea = Math.max(0, inv.crea - 5);
    localStorage.setItem('pegasus_supp_inventory', JSON.stringify(inv));
}

window.getSmartDailyProgram = getSmartDailyProgram;
window.saveProgress = saveProgress;
window.getSortedMuscleGroups = getSortedMuscleGroups;
