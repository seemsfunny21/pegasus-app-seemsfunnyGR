/* ==========================================================================
   PEGASUS SMART INVENTORY HANDLER - STRICT EDITION (v11.1 SYNC)
   INCLUDES MUSCLE TRACKING & SUPPLEMENT LOGISTICS
   ========================================================================== */

/* --- 1. MUSCLE INVENTORY ENGINE --- */

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

function getSmartDailyProgram(day) {
    if (day === "Τετάρτη") return [
        { name: "EMS Full Body", sets: 1 },
        { name: "Core Stabilization", sets: 3 }
    ];
    if (day === "Πέμπτη" || day === "Δευτέρα") return []; 

    const sortedGroups = getSortedMuscleGroups();
    let program = [];

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

function findMuscleGroup(exerciseName) {
    if (!exerciseName) return null;
    
    const cleanName = exerciseName.trim().toLowerCase();

    if (typeof exercisesDB !== 'undefined') {
        const found = exercisesDB.find(ex => ex.name.toLowerCase() === cleanName);
        if (found) return found.muscleGroup;
    }
    
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
        "ποδηλασία": "Πόδια" 
    };

    for (let key in manualMap) {
        if (cleanName.includes(key)) return manualMap[key];
    }
    
    return null;
}

function saveProgress(muscleGroup, sets = 1, exerciseName = "") {
    if (!muscleGroup) return;

    let history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
    
    let setValue = sets;
    if (exerciseName && exerciseName.toLowerCase().includes("ποδηλασία")) {
        setValue = 18;
    }

    history[muscleGroup] = (history[muscleGroup] || 0) + setValue;
    localStorage.setItem('pegasus_weekly_history', JSON.stringify(history));
}

function resetWeeklyInventory() {
    localStorage.removeItem('pegasus_weekly_history');
}

/* --- 2. SUPPLEMENTS & ORDERS ENGINE --- */

const SUPPLEMENT_CONFIG = {
    doses: {
        protein: 60,
        creatine: 5  
    },
    thresholdDays: 12,
    shipping: {
        cost: 5.99,
        freeThreshold: 60.00,
        standardDays: "7-9 εργάσιμες ημέρες",
        holidayDays: "Έως 12 εργάσιμες ημέρες (Αργία)"
    }
};

function initSupplementInventory() {
    return JSON.parse(localStorage.getItem('pegasus_supplements')) || {
        protein: 0,
        creatine: 0
    };
}

function consumeDailySupplements() {
    let inv = initSupplementInventory();

    inv.protein = Math.max(0, inv.protein - SUPPLEMENT_CONFIG.doses.protein);
    inv.creatine = Math.max(0, inv.creatine - SUPPLEMENT_CONFIG.doses.creatine);

    localStorage.setItem('pegasus_supplements', JSON.stringify(inv));
    return checkSupplementAlerts(inv);
}

function checkSupplementAlerts(inv) {
    const proteinThreshold = SUPPLEMENT_CONFIG.doses.protein * SUPPLEMENT_CONFIG.thresholdDays; 
    const creatineThreshold = SUPPLEMENT_CONFIG.doses.creatine * SUPPLEMENT_CONFIG.thresholdDays; 

    let alerts = [];
    if (inv.protein <= proteinThreshold && inv.protein > 0) {
        alerts.push(`⚠️ Πρωτεΐνη: Χαμηλό απόθεμα (${inv.protein}g).`);
    }
    if (inv.creatine <= creatineThreshold && inv.creatine > 0) {
        alerts.push(`⚠️ Κρεατίνη: Χαμηλό απόθεμα (${inv.creatine}g).`);
    }

    return alerts;
}

function calculateOrderTotals(cartItems, isHoliday = false) {
    let subtotal = 0;
    cartItems.forEach(item => {
        subtotal += (item.price * item.quantity);
    });

    const appliedShipping = (subtotal >= SUPPLEMENT_CONFIG.shipping.freeThreshold || subtotal === 0) 
                            ? 0 
                            : SUPPLEMENT_CONFIG.shipping.cost;

    const deliveryEstimate = isHoliday ? SUPPLEMENT_CONFIG.shipping.holidayDays : SUPPLEMENT_CONFIG.shipping.standardDays;
    const finalTotal = subtotal + appliedShipping;

    return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        shippingCost: appliedShipping,
        finalTotal: parseFloat(finalTotal.toFixed(2)),
        deliveryEstimate: deliveryEstimate
    };
}

function restockSupplement(type, grams) {
    let inv = initSupplementInventory();
    if (inv[type] !== undefined) {
        inv[type] += grams;
        localStorage.setItem('pegasus_supplements', JSON.stringify(inv));
    }
    return inv;
}

// Global Exports
window.getSmartDailyProgram = getSmartDailyProgram;
window.saveProgress = saveProgress;
window.findMuscleGroup = findMuscleGroup;
window.getSortedMuscleGroups = getSortedMuscleGroups;
window.resetWeeklyInventory = resetWeeklyInventory;

window.consumeDailySupplements = consumeDailySupplements;
window.calculateOrderTotals = calculateOrderTotals;
window.restockSupplement = restockSupplement;
window.initSupplementInventory = initSupplementInventory;
