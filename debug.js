/* ==========================================================================
   PEGASUS HEALTH & DEBUG SYSTEM (STRICT MONITOR)
   ========================================================================== */

window.pegasusHealthCheck = function() {
    console.log("%c--- PEGASUS HEALTH CHECK START ---", "color: #4CAF50; font-weight: bold;");
    let errors = [];
    let warnings = [];

    // 1. Έλεγχος Βασικών Μεταβλητών
    if (typeof exercises === 'undefined') errors.push("Critical: Variable 'exercises' is missing.");
    if (typeof program === 'undefined') errors.push("Critical: 'program' object (data.js) not found.");

    // 2. Έλεγχος LocalStorage (Strict Profile)
    const weight = localStorage.getItem("pegasus_weight");
    if (!weight || weight == 0) warnings.push("Profile: User weight is not set or zero. Calories will be inaccurate.");

    // 3. Έλεγχος Ακεραιότητας Προγράμματος (data.js vs videoMap)
    if (typeof program !== 'undefined' && typeof videoMap !== 'undefined') {
        Object.keys(program).forEach(day => {
            program[day].forEach(ex => {
                if (!videoMap[ex.name] && !ex.name.toLowerCase().includes("ems")) {
                    warnings.push(`Data: Exercise '${ex.name}' in '${day}' has no mapped video.`);
                }
                if (!ex.sets || ex.sets <= 0) {
                    errors.push(`Data: Exercise '${ex.name}' in '${day}' has invalid sets count.`);
                }
            });
        });
    }

    // 4. Έλεγχος DOM Elements
    const essentialElements = ["btnStart", "exList", "totalProgress", "phaseTimer"];
    essentialElements.forEach(id => {
        if (!document.getElementById(id)) errors.push(`UI: Element with ID '${id}' is missing from HTML.`);
    });

    // 5. Έλεγχος Σειράς Ασκήσεων (Custom Orders)
    const customOrders = localStorage.getItem("pegasus_custom_orders");
    if (customOrders) {
        try {
            JSON.parse(customOrders);
        } catch (e) {
            errors.push("Storage: 'pegasus_custom_orders' is corrupted (Invalid JSON).");
        }
    }

    // --- ΕΜΦΑΝΙΣΗ ΑΠΟΤΕΛΕΣΜΑΤΩΝ ---
    if (errors.length === 0 && warnings.length === 0) {
        console.log("%c✅ Pegasus System Healthy: All systems nominal.", "color: #4CAF50;");
    } else {
        errors.forEach(err => console.error("❌ " + err));
        warnings.forEach(wrn => console.warn("⚠️ " + wrn));
    }
    
    console.log("%c--- CHECK COMPLETE ---", "color: #4CAF50; font-weight: bold;");
    return { errors: errors.length, warnings: warnings.length };
};

// Αυτόματη εκτέλεση 2 δευτερόλεπτα μετά τη φόρτωση
setTimeout(window.pegasusHealthCheck, 2000);