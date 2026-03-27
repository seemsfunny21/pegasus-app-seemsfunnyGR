/* ==========================================================================
   PEGASUS SMART INVENTORY HANDLER - CLEAN SWEEP v17.0
   Protocol: Muscle Analytics & Supplement Logistics | Logic: Dynamic Targets
   ========================================================================== */

/**
 * 1. MUSCLE PROGRESS ANALYTICS
 * Υπολογισμός ποσοστών ολοκλήρωσης ανά μυϊκή ομάδα
 */
window.getSortedMuscleGroups = function() {
    const history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {
        "Στήθος": 0, "Πλάτη": 0, "Πόδια": 0, "Χέρια": 0, "Ώμοι": 0, "Κορμός": 0
    };
    
    // Δυναμική ανάκτηση στόχων από τις ρυθμίσεις ή το Master Profile
    const targets = JSON.parse(localStorage.getItem("pegasus_muscle_targets")) || 
                    (window.TARGET_SETS || { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 });
    
    let stats = Object.keys(targets).map(group => {
        let done = history[group] || 0;
        let target = targets[group];
        return {
            name: group,
            // Guard για αποφυγή διαίρεσης με το μηδέν
            percent: target > 0 ? Math.min(100, (done / target) * 100) : 100,
            remaining: Math.max(0, target - done),
            done: done,
            target: target
        };
    });

    // Ταξινόμηση βάσει χαμηλότερης προόδου (Προτεραιότητα)
    return stats.sort((a, b) => a.percent - b.percent);
};

/**
 * 2. SUPPLEMENT INVENTORY ENGINE
 * Διαχείριση αποθεμάτων (Whey/Creatine)
 */
window.consumeSupp = function(type, grams) {
    let inv = JSON.parse(localStorage.getItem('pegasus_supp_inventory')) || { prot: 2500, crea: 1000 };
    
    if (inv[type] !== undefined) {
        inv[type] = Math.max(0, inv[type] - grams);
        localStorage.setItem('pegasus_supp_inventory', JSON.stringify(inv));
        
        if (window.PegasusLogger) {
            window.PegasusLogger.log(`Inventory Update: -${grams}g ${type === 'prot' ? 'Protein' : 'Creatine'}`, "INFO");
        }
        
        // Trigger Cloud Sync αν είναι εφικτό
        if (window.PegasusCloud && window.PegasusCloud.isUnlocked) {
            window.PegasusCloud.push(true);
        }
    }
    return inv;
};

window.restockSupp = function(type, grams) {
    let inv = JSON.parse(localStorage.getItem('pegasus_supp_inventory')) || { prot: 2500, crea: 1000 };
    inv[type] += grams;
    localStorage.setItem('pegasus_supp_inventory', JSON.stringify(inv));
    if (window.location.reload) window.location.reload();
};

/**
 * 3. LOGISTICS CALCULATOR
 * Υπολογισμός κόστους παραγγελιών συμπληρωμάτων
 */
const SUPPLEMENT_CONFIG = {
    shipping: { cost: 5, freeThreshold: 50, standardDays: 3, holidayDays: 5 }
};

window.calculateOrderTotals = function(cartItems, isHoliday = false) {
    let subtotal = 0;
    cartItems.forEach(item => {
        subtotal += (item.price * item.quantity);
    });

    const shipping = (subtotal >= SUPPLEMENT_CONFIG.shipping.freeThreshold || subtotal === 0) ? 0 : SUPPLEMENT_CONFIG.shipping.cost;
    const delivery = isHoliday ? SUPPLEMENT_CONFIG.shipping.holidayDays : SUPPLEMENT_CONFIG.shipping.standardDays;

    return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        shipping: shipping,
        total: parseFloat((subtotal + shipping).toFixed(2)),
        days: delivery
    };
};

/**
 * 4. MUSCLE GROUP FINDER
 * Αντιστοίχιση άσκησης με μυϊκή ομάδα
 */
window.findMuscleGroup = function(exName) {
    if (!exName) return "Άλλο";
    const clean = exName.toLowerCase();
    
    // Πρώτα έλεγχος στην Master Database
    if (window.exercisesDB) {
        const match = window.exercisesDB.find(ex => ex.name.toLowerCase() === clean);
        if (match) return match.muscleGroup;
    }
    
    // Fallback Keywords
    if (clean.includes("chest") || clean.includes("στήθος") || clean.includes("pushups")) return "Στήθος";
    if (clean.includes("row") || clean.includes("pulldown") || clean.includes("πλάτη")) return "Πλάτη";
    if (clean.includes("leg") || clean.includes("πόδια") || clean.includes("extensions")) return "Πόδια";
    if (clean.includes("bicep") || clean.includes("tricep") || clean.includes("χέρια") || clean.includes("curl")) return "Χέρια";
    if (clean.includes("shoulder") || clean.includes("raises") || clean.includes("ώμοι")) return "Ώμοι";
    
    return "Κορμός";
};

console.log("✅ PEGASUS: Inventory Handler Operational.");