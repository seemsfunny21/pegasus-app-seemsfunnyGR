/* ==========================================================================
   PEGASUS WEATHER HANDLER - v5.0 (DECOUPLED BRIDGE)
   Protocol: Strict Data Analyst - Integration with PegasusData v9.0
   ========================================================================== */

const PegasusWeatherHandler = (function() {
    
    // 1. ΕΣΩΤΕΡΙΚΗ ΛΟΓΙΚΗ ΦΙΛΤΡΑΡΙΣΜΑΤΟΣ (Strict Logic)
    const filterForWeather = (program, isRaining) => {
        if (!Array.isArray(program)) return [];

        // Αν βρέχει, αφαιρούμε τις εξωτερικές δραστηριότητες (Ποδηλασία)
        if (isRaining) {
            return program.filter(ex => !ex.name.includes("Ποδηλασία"));
        }
        return program;
    };

    // 2. ΕΝΗΜΕΡΩΣΗ UI ΚΑΙΡΟΥ
    const updateWeatherUI = (temp, description, isRaining) => {
        const tempEl = document.querySelector(".weather-text");
        const statusEl = document.getElementById("weatherStatus");
        const iconEl = document.getElementById("weatherIcon");

        if (tempEl) tempEl.textContent = `${temp}°C`;
        if (statusEl) statusEl.textContent = isRaining ? "Βροχή/Χιόνι" : "Καλός Καιρός";
        if (iconEl) iconEl.textContent = isRaining ? "🌧️" : "☀️";

        // Συγχρονισμός του Toggle Switch
        const rainToggle = document.getElementById("rainToggle");
        if (rainToggle) rainToggle.checked = isRaining;
    };

    // 3. ΠΑΡΑΓΩΓΗ ΤΕΛΙΚΟΥ ΠΡΟΓΡΑΜΜΑΤΟΣ (The Final Bridge)
    const getFinalProgram = (dayName) => {
        const rainToggle = document.getElementById("rainToggle");
        const isRaining = rainToggle ? rainToggle.checked : false;

        // Κλήση της μηχανής παραγωγής από το data.js (PegasusData)
        let dailyProgram = [];
        if (window.calculateDailyProgram) {
            dailyProgram = window.calculateDailyProgram(dayName);
        } else if (window.program && window.program[dayName]) {
            dailyProgram = window.program[dayName];
        }

        return filterForWeather(dailyProgram, isRaining);
    };

    // 4. PUBLIC API
    return {
        getFinalProgram: getFinalProgram,
        updateUI: updateWeatherUI
    };
})();

// Εξαγωγή στο Window Scope για το app.js
window.getFinalProgram = PegasusWeatherHandler.getFinalProgram;
window.updateWeatherUI = PegasusWeatherHandler.updateUI;

/* ==========================================================================
   EVENT LISTENERS (STRICT BINDING)
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    const rainToggle = document.getElementById("rainToggle");
    if (rainToggle) {
        rainToggle.addEventListener("change", () => {
            console.log("[PEGASUS]: Weather state changed. Re-calculating program...");
            // Trigger UI reload μέσω του app.js/selectDay αν είναι ενεργό
            const activeBtn = document.querySelector(".navbar button.active");
            if (activeBtn && window.selectDay) {
                window.selectDay(activeBtn, activeBtn.textContent.trim());
            }
        });
    }
});
