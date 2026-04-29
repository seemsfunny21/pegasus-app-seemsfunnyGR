/* ==========================================================================
   PEGASUS DYNAMIC OPTIMIZER - v1.2 (TIME-BOXED HARDENED)
   Protocol: Strict 60-Minute Window Enforcement & DOM Shielding
   Strategy: Deficit Prioritization with Volume Capping
   Status: FINAL STABLE | FIXED: REFLOW THRASHING & NULL TARGETING
   ========================================================================== */

window.PegasusDynamic = {
    maxMinutes: 60,
    setDuration: 1.5, // 90 δευτερόλεπτα ανά σετ (άσκηση + rest)

optimize: function() {
        console.log("⏱️ DYNAMIC ENGINE: Calculating Time Budget...");
        
        const history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
        
        // 🔄 Σύνδεση με τον Optimizer για κοινούς στόχους
        const targets = (window.PegasusOptimizer && typeof window.PegasusOptimizer.getTargets === "function")
            ? window.PegasusOptimizer.getTargets()
            : { "Στήθος": 16, "Πλάτη": 16, "Ώμοι": 12, "Χέρια": 14, "Πόδια": 24, "Κορμός": 18 };
        
        // 1. Υπολογισμός Ελλείψεων
        let deficits = {};
        Object.keys(targets).forEach(m => {
            let done = history[m] || 0;
            deficits[m] = Math.max(0, targets[m] - done);
        });

        if (window.exercises && window.exercises.length > 0) {
            // 2. Ταξινόμηση βάσει ελλείψεων (Προτεραιότητα στα 0)
            // 🎯 FIXED: Ασφαλής εξαγωγή δεδομένων χωρίς εξάρτηση από το .weight-input
            window.exercises.sort((a, b) => {
                let mA = a.getAttribute("data-muscle") || a.querySelector("[data-muscle]")?.getAttribute("data-muscle") || "None";
                let mB = b.getAttribute("data-muscle") || b.querySelector("[data-muscle]")?.getAttribute("data-muscle") || "None";
                return (deficits[mB] || 0) - (deficits[mA] || 0);
            });

            // 3. TIME AUDIT: Υπολογισμός και Περικοπή
            let totalSets = 0;
            const fragment = document.createDocumentFragment(); // 🎯 FIXED: Αποτροπή DOM Reflow Thrashing
            
            window.exercises.forEach(ex => {
                // Υποστήριξη πολλαπλών attributes σε περίπτωση αλλαγής δομής στο app.js
                let sets = parseInt(ex.dataset.total || ex.dataset.sets || ex.getAttribute('data-sets')) || 4;
                
                // Εξαίρεση: Το Stretching δεν κοστίζει τον ίδιο χρόνο
                const isStretching = ex.innerHTML.includes("Stretching");
                const cost = isStretching ? 2 : (sets * this.setDuration);

                // Αν το τρέχον σύνολο + ο νέος χρόνος <= 60 λεπτά
                if ((totalSets * this.setDuration) + cost <= this.maxMinutes) {
                    if (!isStretching) totalSets += sets;
                    ex.style.display = "flex"; 
                    ex.setAttribute("data-active", "true"); // Safety flag
                    ex.style.opacity = "1";
                    fragment.appendChild(ex);
                } else {
                    // Περικοπή
                    ex.style.display = "none"; 
                    ex.setAttribute("data-active", "false"); 
                    console.log(`✂️ Time Cap: Removed exercise to enforce 60-min window.`);
                    fragment.appendChild(ex); // Το κρατάμε στο DOM αλλά κρυφό
                }
            });

            // 4. Re-render στο UI με μία κίνηση (Batch Update)
            const container = document.getElementById("exList");
            if (container) {
                container.innerHTML = ""; // Καθαρισμός παλιών
                container.appendChild(fragment); // Εισαγωγή νέων ταξινομημένων
            }
            
            const totalMins = Math.round(totalSets * this.setDuration);
            console.log(`✅ DYNAMIC UI: Final Plan - ${totalSets} sets (~${totalMins} mins)`);
            
            // Οπτική ειδοποίηση στο UI αν ξεπεράσαμε το όριο
            if (window.PegasusLogger && totalMins > 55) {
                window.PegasusLogger.log(`Time Budget Critical: ${totalMins}/60 mins allocated.`, "INFO");
            }
        }
    }
};

// Listener για αλλαγή ημέρας (Αυστηρός περιορισμός πολλαπλών κλήσεων - Debounce)
let optimizeTimeout;
document.addEventListener('click', (e) => {
    if (e.target.closest('.navbar button') || e.target.closest('.day-selector')) {
        clearTimeout(optimizeTimeout);
        optimizeTimeout = setTimeout(() => {
            if (typeof window.PegasusDynamic !== "undefined") window.PegasusDynamic.optimize();
        }, 300);
    }
});
