/* ==========================================================================
   PEGASUS WEATHER LOGIC & FALLBACK SYSTEM - v9.0 (MODULAR / FULLY DECOUPLED)
   Protocol: Strict Data Analyst - Isolated Execution & Fallback Injection
   ========================================================================== */

const PegasusWeatherHandler = (function() {
    // 1. ΙΔΙΩΤΙΚΕΣ ΛΕΙΤΟΥΡΓΙΕΣ (Private Methods)
    const isRaining = () => {
        const rainToggle = document.getElementById('rainToggle');
        return rainToggle ? rainToggle.checked : false;
    };

    const generateFallbackProgram = () => {
        console.warn("[PEGASUS WEATHER HANDLER]: Dynamic engine offline. Using emergency fallback.");
        // Αποφυγή ορφανών δεδομένων στο reporting (Αντικατάσταση 'Recovery' με 'Κορμός')
        return [{ name: "Stretching", sets: 1, duration: 338, muscleGroup: "Κορμός" }];
    };

    const generateIndoorAlternative = () => {
        return [
            { name: "Pushups", sets: 4, duration: 45, muscleGroup: "Στήθος" },
            { name: "Plank", sets: 4, duration: 45, muscleGroup: "Κορμός" },
            { name: "Reverse Crunch", sets: 4, duration: 45, muscleGroup: "Κορμός" },
            { name: "Lying Knee Raise", sets: 4, duration: 45, muscleGroup: "Κορμός" }
        ];
    };

    const buildFinalProgram = (day) => {
        const rain = isRaining();
        let dailyData = [];

        // 1. DATA GUARD: Ασφαλής κλήση του δυναμικού υπολογιστή
        if (typeof window.calculateDailyProgram === 'function') {
            dailyData = window.calculateDailyProgram(day);
        } else {
            return generateFallbackProgram();
        }

        // 2. WEATHER LOGIC: Αφαίρεση εξωτερικών δραστηριοτήτων (Ποδηλασία) σε περίπτωση βροχής
        if (rain) {
            dailyData = dailyData.filter(ex => !ex.name.includes("Ποδηλασία"));
            
            // Δυναμική εναλλακτική εσωτερικού χώρου αν η μέρα μείνει άδεια
            if (dailyData.length === 0) {
                dailyData = generateIndoorAlternative();
            }
        }

        return dailyData;
    };

    // 2. PUBLIC API
    return {
        getFinalProgram: buildFinalProgram,
        isPrecipitationActive: isRaining
    };
})();

// Εξαγωγή στο Window Scope για διασύνδεση με τον Core Controller (app.js)
window.getFinalProgram = PegasusWeatherHandler.getFinalProgram;