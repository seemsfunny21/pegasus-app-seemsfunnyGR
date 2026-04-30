/* ==========================================================================
   PEGASUS SMART INVENTORY HANDLER - STRICT EDITION (v11.3 SYNC)
   INCLUDES MUSCLE TRACKING & SUPPLEMENT LOGISTICS
   Protocol: Dynamic Targets Injection & Zero-Bug Key Alignment
   Status: FINAL STABLE | FIXED: SET EXPLOSION & INVENTORY KEYS
   ========================================================================== */

/* --- INTERNAL SAFE HELPERS --- */

function getPegasusWeeklyHistoryKey() {
    return window.PegasusManifest?.workout?.weekly_history || 'pegasus_weekly_history';
}

function getPegasusMuscleTargetsKey() {
    return window.PegasusManifest?.workout?.muscleTargets || 'pegasus_muscle_targets';
}

function getPegasusSuppInventoryKey() {
    return 'pegasus_supp_inventory';
}

function safeParseJSON(raw, fallback) {
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch (e) {
        return fallback;
    }
}

function pushInventoryRefresh() {
    if (typeof window.updateInventoryUI === "function") window.updateInventoryUI();
    if (typeof window.updateSuppUI === "function") window.updateSuppUI();
    if (window.PegasusCloud?.push) window.PegasusCloud.push();
}

function normalizeSuppKey(type) {
    if (type === 'protein' || type === 'prot') return 'prot';
    if (type === 'creatine' || type === 'crea') return 'crea';
    return type;
}

function getEntrySupplementImpact(entryName) {
    const name = String(entryName || "").trim().toLowerCase();

    const isWhey =
        name.includes("whey") ||
        name.includes("πρωτεΐνη") ||
        name.includes("πρωτεινη");

    const isCreatine =
        name.includes("κρεατίνη") ||
        name.includes("κρεατινη") ||
        name.includes("creatine");

    return {
        prot: isWhey ? SUPPLEMENT_CONFIG.doses.protein : 0,
        crea: isCreatine ? SUPPLEMENT_CONFIG.doses.creatine : 0
    };
}

/* --- 1. MUSCLE INVENTORY ENGINE --- */

function getSortedMuscleGroups() {
    // 1. Ανάκτηση ιστορικού (Done Sets)
    const historyKey = getPegasusWeeklyHistoryKey();
    const history = safeParseJSON(localStorage.getItem(historyKey), {});

    // 2. ΔΥΝΑΜΙΚΗ ΑΝΑΚΤΗΣΗ ΣΤΟΧΩΝ (Targets)
    const targets = safeParseJSON(localStorage.getItem(getPegasusMuscleTargetsKey()), null) ||
        { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 };

    let stats = Object.keys(targets).map(group => {
        let done = parseInt(history[group], 10) || 0;
        let target = parseInt(targets[group], 10) || 1;

        return {
            name: group,
            percent: Math.min(100, Math.round((done / target) * 100)),
            remaining: Math.max(0, target - done)
        };
    });

    return stats.sort((a, b) => a.percent - b.percent);
}

function getSmartDailyProgram(day) {
    if (day === "Τετάρτη") return [
        { name: "EMS Training", sets: 1 },
        { name: "Plank", sets: 3 }
    ];

    if (day === "Πέμπτη" || day === "Δευτέρα") return [];

    const sortedGroups = getSortedMuscleGroups();
    let program = [];

    const availableGroups = sortedGroups.filter(g => g.name !== "Πόδια" && g.remaining > 0);

    availableGroups.slice(0, 2).forEach(group => {
        if (typeof exercisesDB !== 'undefined') {
            const availableEx = exercisesDB.filter(ex => ex.muscleGroup === group.name);
            let remainingForGroup = group.remaining;

            // 🎯 FIXED: Αποτροπή Set Explosion
            for (let ex of availableEx) {
                if (remainingForGroup <= 0) break;

                let setsToDo = Math.min(4, remainingForGroup);

                program.push({
                    name: ex.name,
                    sets: setsToDo
                });

                remainingForGroup -= setsToDo;
            }
        }
    });

    return program;
}

function findMuscleGroup(exerciseName) {
    if (!exerciseName) return null;

    if (typeof window.getPegasusExerciseGroup === "function") {
        return window.getPegasusExerciseGroup(exerciseName);
    }

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
        "ems training": "Πλάτη",
        "ποδηλασία": "Πόδια"
    };

    for (let key in manualMap) {
        if (cleanName.includes(key)) return manualMap[key];
    }

    return null;
}

function saveProgress(muscleGroup, sets = 1, exerciseName = "") {
    if (!muscleGroup) return;

    const historyKey = getPegasusWeeklyHistoryKey();
    let history = safeParseJSON(localStorage.getItem(historyKey), {});

    let setValue = sets;
    if (exerciseName && exerciseName.toLowerCase().includes("ποδηλασία")) {
        setValue = 18;
    }

    history[muscleGroup] = (history[muscleGroup] || 0) + setValue;
    localStorage.setItem(historyKey, JSON.stringify(history));
}

function resetWeeklyInventory() {
    localStorage.removeItem(getPegasusWeeklyHistoryKey());
}

/* --- 2. SUPPLEMENTS & ORDERS ENGINE --- */

const SUPPLEMENT_CONFIG = {
    doses: {
        protein: 30, // Ανά scoop
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
    const raw = safeParseJSON(localStorage.getItem(getPegasusSuppInventoryKey()), null);

    const inventory = {
        prot: Math.max(0, parseFloat(raw?.prot) || 0),
        crea: Math.max(0, parseFloat(raw?.crea) || 0)
    };

    localStorage.setItem(getPegasusSuppInventoryKey(), JSON.stringify(inventory));
    return inventory;
}

function setSupplementInventory(inv) {
    const safeInv = {
        prot: Math.max(0, parseFloat(inv?.prot) || 0),
        crea: Math.max(0, parseFloat(inv?.crea) || 0)
    };

    localStorage.setItem(getPegasusSuppInventoryKey(), JSON.stringify(safeInv));
    return safeInv;
}

function consumeSupp(type, grams, shouldPush = true) {
    const actualKey = normalizeSuppKey(type);
    let inv = initSupplementInventory();

    if (inv[actualKey] === undefined) return inv;

    const amount = Math.max(0, parseFloat(grams) || 0);
    inv[actualKey] = Math.max(0, inv[actualKey] - amount);

    setSupplementInventory(inv);

    if (window.PegasusEngine?.dispatch) {
        window.PegasusEngine.dispatch({
            type: "SUPPLEMENT_CONSUMED",
            payload: { type: actualKey, grams: amount, remaining: inv[actualKey] }
        });
    }

    if (shouldPush) pushInventoryRefresh();
    return inv;
}

function consumeDailySupplements() {
    let inv = initSupplementInventory();

    inv.prot = Math.max(0, inv.prot - SUPPLEMENT_CONFIG.doses.protein);
    inv.crea = Math.max(0, inv.crea - SUPPLEMENT_CONFIG.doses.creatine);

    setSupplementInventory(inv);
    pushInventoryRefresh();

    return checkSupplementAlerts(inv);
}

function checkSupplementAlerts(inv) {
    const proteinThreshold = SUPPLEMENT_CONFIG.doses.protein * SUPPLEMENT_CONFIG.thresholdDays;
    const creatineThreshold = SUPPLEMENT_CONFIG.doses.creatine * SUPPLEMENT_CONFIG.thresholdDays;

    let alerts = [];

    if (inv.prot <= proteinThreshold && inv.prot > 0) {
        alerts.push(`⚠️ Πρωτεΐνη: Χαμηλό απόθεμα (${inv.prot}g).`);
    }

    if (inv.crea <= creatineThreshold && inv.crea > 0) {
        alerts.push(`⚠️ Κρεατίνη: Χαμηλό απόθεμα (${inv.crea}g).`);
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
    const actualKey = normalizeSuppKey(type);

    if (inv[actualKey] !== undefined) {
        inv[actualKey] += Math.max(0, parseFloat(grams) || 0);
        setSupplementInventory(inv);

        if (window.PegasusEngine?.dispatch) {
            window.PegasusEngine.dispatch({
                type: "SUPPLEMENT_RESTOCKED",
                payload: { type: actualKey, grams: Math.max(0, parseFloat(grams) || 0), total: inv[actualKey] }
            });
        }

        pushInventoryRefresh();
    }

    return inv;
}

function processFoodEntry(entryName) {
    const impact = getEntrySupplementImpact(entryName);
    let touched = false;

    if (impact.prot > 0) {
        consumeSupp('prot', impact.prot, false);
        touched = true;
    }

    if (impact.crea > 0) {
        consumeSupp('crea', impact.crea, false);
        touched = true;
    }

    if (touched) {
        pushInventoryRefresh();
    }

    return impact;
}

/* --- 3. GLOBAL BRIDGES --- */

window.PegasusInventoryPC = window.PegasusInventoryPC || {
    processEntry: function(name) {
        return processFoodEntry(name);
    },
    getInventory: function() {
        return initSupplementInventory();
    },
    consume: function(type, grams, shouldPush = true) {
        return consumeSupp(type, grams, shouldPush);
    },
    restock: function(type, grams) {
        return restockSupplement(type, grams);
    }
};

window.PegasusInventory = window.PegasusInventory || {
    consume: function(type, grams, shouldPush = true) {
        return consumeSupp(type, grams, shouldPush);
    },
    getInventory: function() {
        return initSupplementInventory();
    }
};

// Legacy compatibility
window.consumeSupp = consumeSupp;

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
