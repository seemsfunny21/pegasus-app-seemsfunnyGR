/* ==========================================================================
   PEGASUS CALORIE MODULE - FINAL GREEN VERSION
   ========================================================================== */
var currentKcal = 0;

function trackSetCalories(weight, durationSeconds) {
    let w = parseFloat(weight);
    // ΔΙΟΡΘΩΣΗ: Ανάκτηση δυναμικού βάρους ή fallback στα 74kg του προφίλ.
    if (!w || w <= 0) w = parseFloat(localStorage.getItem("pegasus_weight")) || 74; 
    
    let d = parseFloat(durationSeconds);
    if (!d || d <= 0) d = 45;

    const MET = 5.0; 
    const durationMins = d / 60;
    
    const kcalEarned = (MET * 3.5 * w / 200) * durationMins;
    
    currentKcal += kcalEarned;
    renderKcal();
}

function renderKcal() {
    const valSpan = document.querySelector("#kcalBtn .kcal-value");
    const kcalBtn = document.getElementById("kcalBtn");
    
    if (valSpan) {
        valSpan.textContent = currentKcal.toFixed(1);
    }
    
    if (kcalBtn) {
        kcalBtn.classList.remove("pulse-active");
        void kcalBtn.offsetWidth; 
        kcalBtn.classList.add("pulse-active");
    }
}

// ΝΕΑ ΛΕΙΤΟΥΡΓΙΑ: Αποθήκευση της προπόνησης στο Food Log
function finalizeWorkoutCalories() {
    if (currentKcal > 0 && window.addFoodEntry) {
        window.addFoodEntry({
            name: "🔥 Προπόνηση Pegasus",
            kcal: -Math.round(currentKcal), // Αρνητικό πρόσημο γιατί είναι κάψιμο
            note: "Αυτοματοποιημένη εγγραφή",
            date: new Date().toLocaleDateString('el-GR')
        });
        // STRICT SYNC: Ενημέρωση του Reporting System για την προπόνηση
        if (window.PegasusReporting) {
            PegasusReporting.saveWorkout(currentKcal.toFixed(1), "Δες το Log για λεπτομέρειες");
        }
        resetKcal();
    }
}

function resetKcal() {
    currentKcal = 0;
    const valSpan = document.querySelector("#kcalBtn .kcal-value");
    if (valSpan) valSpan.textContent = "0.0";
}
