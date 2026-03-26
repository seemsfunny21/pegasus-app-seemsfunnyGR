/* ==========================================================================
   PEGASUS CALORIE MODULE - v4.0 (MODULAR / FULLY DECOUPLED)
   Protocol: Strict State Management - Isolated Scope
   ========================================================================== */

const PegasusCalories = (function() {
    // 1. ΙΔΙΩΤΙΚΟ STATE (Private State)
    let currentKcal = 0;

    // 2. ΕΣΩΤΕΡΙΚΕΣ ΛΕΙΤΟΥΡΓΙΕΣ
    const render = () => {
        const valSpan = document.querySelector("#kcalBtn .kcal-value");
        const kcalBtn = document.getElementById("kcalBtn");
        
        if (valSpan) {
            valSpan.textContent = currentKcal.toFixed(1);
        }
        
        if (kcalBtn) {
            kcalBtn.classList.remove("pulse-active");
            // Trigger reflow για επανεκκίνηση του animation
            void kcalBtn.offsetWidth; 
            kcalBtn.classList.add("pulse-active");
        }
    };

    const reset = () => {
        currentKcal = 0;
        const valSpan = document.querySelector("#kcalBtn .kcal-value");
        if (valSpan) valSpan.textContent = "0.0";
    };

    // 3. PUBLIC API
    return {
        track: function(weight, durationSeconds) {
            let w = parseFloat(weight);
            // Ανάκτηση δυναμικού βάρους ή fallback στα 74kg του προφίλ
            if (!w || w <= 0) w = parseFloat(localStorage.getItem("pegasus_weight")) || 74; 
            
            let d = parseFloat(durationSeconds);
            if (!d || d <= 0) d = 45;

            const MET = 5.0; 
            const durationMins = d / 60;
            
            const kcalEarned = (MET * 3.5 * w / 200) * durationMins;
            
            currentKcal += kcalEarned;
            render();
        },

        finalize: function() {
            if (currentKcal > 0) {
                // Ασφαλής σύνδεση με το Food Module (αν είναι διαθέσιμο)
                if (typeof window.addFoodEntry === 'function') {
                    window.addFoodEntry({
                        name: "🔥 Προπόνηση Pegasus",
                        kcal: -Math.round(currentKcal), // Αρνητικό πρόσημο (καύση)
                        note: "Αυτοματοποιημένη εγγραφή",
                        date: new Date().toLocaleDateString('el-GR')
                    });
                }
                
                // Ασφαλής σύνδεση με το Reporting System
                if (window.PegasusReporting && typeof window.PegasusReporting.saveWorkout === 'function') {
                    window.PegasusReporting.saveWorkout(currentKcal.toFixed(1), "Δες το Log για λεπτομέρειες");
                }
                
                reset();
            }
        },

        getKcal: function() {
            return currentKcal;
        },
        
        reset: reset,
        render: render
    };
})();

// 4. ΕΞΑΓΩΓΗ ΣΤΟ WINDOW SCOPE (Για συμβατότητα με Event Listeners στο DOM)
window.trackSetCalories = PegasusCalories.track;
window.renderKcal = PegasusCalories.render;
window.finalizeWorkoutCalories = PegasusCalories.finalize;
window.resetKcal = PegasusCalories.reset;