/* ==========================================================================
   PEGASUS DYNAMIC OPTIMIZER - v1.1 (TIME-BOXED)
   Protocol: Strict 60-Minute Window Enforcement
   Strategy: Deficit Prioritization with Volume Capping
   ========================================================================== */

window.PegasusDynamic = {
    maxMinutes: 60,
    setDuration: 1.5, // 90 δευτερόλεπτα ανά σετ (άσκηση + rest)

    optimize: function() {
        console.log("⏱️ DYNAMIC ENGINE: Calculating Time Budget...");
        
        const history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
        const targets = { "Στήθος": 24, "Πλάτη": 24, "Ώμοι": 16, "Χέρια": 16, "Πόδια": 24, "Κορμός": 12 };
        
        // 1. Υπολογισμός Ελλείψεων
        let deficits = {};
        Object.keys(targets).forEach(m => {
            let done = history[m] || 0;
            deficits[m] = Math.max(0, targets[m] - done);
        });

        if (window.exercises && window.exercises.length > 0) {
            // 2. Ταξινόμηση βάσει ελλείψεων (Προτεραιότητα στα 0)
            window.exercises.sort((a, b) => {
                let mA = a.querySelector(".weight-input")?.getAttribute("data-muscle");
                let mB = b.querySelector(".weight-input")?.getAttribute("data-muscle");
                return (deficits[mB] || 0) - (deficits[mA] || 0);
            });

            // 3. TIME AUDIT: Υπολογισμός και Περικοπή
            let totalSets = 0;
            let allowedExercises = [];
            
            window.exercises.forEach(ex => {
                let sets = parseInt(ex.dataset.total) || 4;
                // Αν το τρέχον σύνολο + τα νέα σετ < 60 λεπτά (περίπου 40 σετ max)
                if ((totalSets + sets) * this.setDuration <= this.maxMinutes) {
                    totalSets += sets;
                    ex.style.display = "flex"; // Εμφάνιση
                } else {
                    // Αν ξεπερνάμε το χρόνο, η άσκηση κρύβεται ή μειώνονται τα σετ της
                    ex.style.display = "none"; 
                    console.log(`✂️ Time Cap: Removed ${ex.querySelector(".weight-input")?.getAttribute("data-name")}`);
                }
            });

            // 4. Re-render στο UI
            const container = document.getElementById("exList");
            if (container) {
                window.exercises.forEach(ex => container.appendChild(ex));
            }
            console.log(`✅ DYNAMIC UI: Final Plan - ${totalSets} sets (~${Math.round(totalSets * this.setDuration)} mins)`);
        }
    }
};

// Listener για αλλαγή ημέρας
document.addEventListener('click', (e) => {
    if (e.target.closest('.navbar button')) {
        setTimeout(() => window.PegasusDynamic.optimize(), 300);
    }
});
