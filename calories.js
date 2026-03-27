/* ==========================================================================
   PEGASUS CALORIE MODULE - CLEAN SWEEP v17.0
   Protocol: Metabolic Integration | Role: UI Display & Diet Commit
   ========================================================================== */

/**
 * Ενημέρωση της εμφάνισης των θερμίδων στο UI
 * Καλούμενο από το MetabolicEngine για συγχρονισμό
 */
window.renderKcal = function() {
    const valSpan = document.querySelector("#kcalBtn .kcal-value");
    const kcalBtn = document.getElementById("kcalBtn");
    
    // Ανάκτηση της τρέχουσας τιμής από το δίσκο (Source of Truth)
    const currentKcal = parseFloat(localStorage.getItem("pegasus_today_kcal")) || 0;
    
    if (valSpan) {
        valSpan.textContent = currentKcal.toFixed(1);
    }
    
    // Εφέ παλμού κατά την ενημέρωση
    if (kcalBtn) {
        kcalBtn.classList.remove("pulse-active");
        void kcalBtn.offsetWidth; // Trigger reflow
        kcalBtn.classList.add("pulse-active");
    }
};

/**
 * Οριστικοποίηση θερμίδων προπόνησης στο Food Log
 * Μετατρέπει τις καμμένες θερμίδες σε αρνητική εγγραφή διατροφής
 */
window.finalizeWorkoutCalories = function() {
    const totalBurned = parseFloat(localStorage.getItem("pegasus_today_kcal")) || 0;
    
    if (totalBurned > 0 && window.addFoodItem) {
        const today = new Date().toLocaleDateString('el-GR');
        
        // Καταγραφή στο Food Engine ως αρνητικό πρόσημο
        window.addFoodItem(
            "🔥 ΠΡΟΠΟΝΗΣΗ PEGASUS", 
            -Math.round(totalBurned), 
            0 // Protein credit
        );

        // Ενημέρωση του Reporting System
        if (window.PegasusReporting) {
            window.PegasusReporting.saveWorkout(totalBurned.toFixed(1));
        }

        // Μηδενισμός μετά την καταγραφή
        window.resetKcal();
        
        if (window.PegasusLogger) {
            window.PegasusLogger.log(`Workout Calories Committed: ${totalBurned} kcal`, "INFO");
        }
    }
};

/**
 * Καθαρισμός μετρητή θερμίδων
 */
window.resetKcal = function() {
    localStorage.setItem("pegasus_today_kcal", "0");
    const valSpan = document.querySelector("#kcalBtn .kcal-value");
    if (valSpan) valSpan.textContent = "0.0";
};

// Εξασφάλιση ότι το UI ενημερώνεται κατά τη φόρτωση
window.addEventListener('load', () => {
    window.renderKcal();
});