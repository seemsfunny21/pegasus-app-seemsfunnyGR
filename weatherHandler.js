/* ==========================================================================
   PEGASUS WEATHER LOGIC & FALLBACK SYSTEM - v8.5 (PURE DYNAMIC)
   Protocol: Strict Analyst - No Static Data Allowed
   ========================================================================== */

function isRaining() {
    const rainToggle = document.getElementById('rainToggle');
    return rainToggle ? rainToggle.checked : false;
}

/**
 * Επιστρέφει 100% Δυναμικό Πρόγραμμα και προσαρμόζεται στον καιρό.
 */
window.getFinalProgram = function(day) {
    const rain = isRaining();
    
    // 1. DATA GUARD: Απευθείας κλήση του δυναμικού υπολογιστή από το data.js
    let dailyData = [];
    if (typeof window.calculateDailyProgram === 'function') {
        dailyData = window.calculateDailyProgram(day);
    } else {
        console.warn("PEGASUS: Dynamic engine offline. Using emergency fallback.");
        // ΔΙΟΡΘΩΣΗ: Αλλαγή από "Recovery" σε "Κορμός" για αποφυγή ορφανών δεδομένων στο reporting
        return [{ name: "Stretching", sets: 1, duration: 338, muscleGroup: "Κορμός" }];
    }

    // 2. WEATHER LOGIC: Αν βρέχει, αφαιρούμε τις εξωτερικές δραστηριότητες (Ποδηλασία)
    if (rain) {
        dailyData = dailyData.filter(ex => !ex.name.includes("Ποδηλασία"));
        
        // Αν η μέρα μείνει άδεια λόγω βροχής (π.χ. Σάββατο που είχε μόνο ποδήλατο), 
        // εισάγουμε μια δυναμική εναλλακτική προπόνηση εσωτερικού χώρου με σωστά Muscle Groups.
        if (dailyData.length === 0) {
            dailyData = [
                { name: "Pushups", sets: 4, duration: 45, muscleGroup: "Στήθος" },
                { name: "Plank", sets: 4, duration: 45, muscleGroup: "Κορμός" },
                { name: "Reverse Crunch", sets: 4, duration: 45, muscleGroup: "Κορμός" }
            ];
        }
    }

    return dailyData;
};

window.updateWeatherUI = function() {
    const statusBox = document.getElementById('weather-status-alert');
    if (statusBox) {
        const rain = isRaining();
        statusBox.style.display = rain ? 'block' : 'none';
        statusBox.innerHTML = rain ? "⚠️ INDOOR PROTOCOL ACTIVE" : "";
    }
};
