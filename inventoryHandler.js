/* ==========================================================================
   PEGASUS SMART INVENTORY HANDLER - v12.0 (MODULAR / FULLY DECOUPLED)
   Protocol: Strict Data Analyst - Encapsulated Muscle & Supplement Tracking
   ========================================================================== */

const PegasusInventory = (function() {
    // 1. ΙΔΙΩΤΙΚΕΣ ΣΤΑΘΕΡΕΣ (Private Configuration)
    const SUPPLEMENT_CONFIG = {
        shipping: {
            freeThreshold: 50,
            cost: 5,
            standardDays: 3,
            holidayDays: 5
        }
    };

    const DEFAULT_TARGETS = { 
        "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 
    };

    // 2. ΕΣΩΤΕΡΙΚΕΣ ΛΕΙΤΟΥΡΓΙΕΣ ΥΠΟΛΟΓΙΣΜΩΝ (Private Methods)
    const getTargets = () => {
        try {
            return JSON.parse(localStorage.getItem("pegasus_muscle_targets")) || DEFAULT_TARGETS;
        } catch (e) {
            return DEFAULT_TARGETS;
        }
    };

    const getHistory = () => {
        try {
            return JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
        } catch (e) {
            return {};
        }
    };

    const initSupplementInventory = () => {
        try {
            let inv = JSON.parse(localStorage.getItem('pegasus_supp_inventory'));
            if (!inv) {
                inv = { prot: 2500, crea: 1000 };
                localStorage.setItem('pegasus_supp_inventory', JSON.stringify(inv));
            }
            return inv;
        } catch (e) {
            return { prot: 2500, crea: 1000 };
        }
    };

    // 3. ΛΕΙΤΟΥΡΓΙΕΣ ΜΥΪΚΗΣ ΙΧΝΗΛΑΤΗΣΗΣ (Muscle Tracking)
    const getSortedMuscleGroups = () => {
        const history = getHistory();
        const targets = getTargets();
        
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
    };

    const findMuscleGroup = (exerciseName) => {
        if (window.exercisesDB) {
            const ex = window.exercisesDB.find(e => e.name.toLowerCase() === exerciseName.toLowerCase().trim());
            if (ex) return ex.muscleGroup;
        }
        return "Άλλο";
    };

    const resetWeeklyInventory = () => {
        localStorage.setItem('pegasus_weekly_history', JSON.stringify({
            "Στήθος": 0, "Πλάτη": 0, "Πόδια": 0, "Χέρια": 0, "Ώμοι": 0, "Κορμός": 0
        }));
        console.log("[PEGASUS INVENTORY]: Weekly muscle history reset.");
    };

    // 4. ΛΕΙΤΟΥΡΓΙΕΣ ΣΥΜΠΛΗΡΩΜΑΤΩΝ (Supplement Logistics)
    const consumeDailySupplements = (proteinGramsConsumed) => {
        let inv = initSupplementInventory();
        let updated = false;

        // Υπολογισμός ανάλωσης σκόνης πρωτεΐνης βάσει του γεύματος
        if (proteinGramsConsumed > 0) {
            inv.prot = Math.max(0, inv.prot - proteinGramsConsumed);
            updated = true;
        }
        
        if (updated) {
            localStorage.setItem('pegasus_supp_inventory', JSON.stringify(inv));
            if (window.updateSuppUI) window.updateSuppUI();
        }
        return inv;
    };

    const restockSupplement = (type, grams) => {
        let inv = initSupplementInventory();
        if (inv[type] !== undefined) {
            inv[type] += grams;
            localStorage.setItem('pegasus_supp_inventory', JSON.stringify(inv));
            if (window.updateSuppUI) window.updateSuppUI();
        }
        return inv;
    };

    const calculateOrderTotals = (cartItems, isHoliday = false) => {
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
    };

    // 5. PUBLIC API
    return {
        getSortedMuscleGroups: getSortedMuscleGroups,
        findMuscleGroup: findMuscleGroup,
        resetWeeklyInventory: resetWeeklyInventory,
        consumeDailySupplements: consumeDailySupplements,
        restockSupplement: restockSupplement,
        calculateOrderTotals: calculateOrderTotals,
        initInventory: initSupplementInventory
    };
})();

// Εξαγωγή στο Window Scope για διασύνδεση με το υπόλοιπο σύστημα
window.getSortedMuscleGroups = PegasusInventory.getSortedMuscleGroups;
window.findMuscleGroup = PegasusInventory.findMuscleGroup;
window.resetWeeklyInventory = PegasusInventory.resetWeeklyInventory;
window.consumeDailySupplements = PegasusInventory.consumeDailySupplements;
window.restockSupplement = PegasusInventory.restockSupplement;
window.calculateOrderTotals = PegasusInventory.calculateOrderTotals;