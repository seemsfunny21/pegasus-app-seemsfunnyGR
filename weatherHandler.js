/* ==========================================================================
   PEGASUS WEATHER HANDLER - CLEAN SWEEP v17.0
   Protocol: Decision Logic (Ioannina) | Logic: Auto-Switch Training Mode
   ========================================================================== */

window.WeatherHandler = {
    /**
     * Κριτήρια Αποδοχής Εξωτερικής Προπόνησης
     */
    constraints: {
        minTemp: 12,        // Ελάχιστη θερμοκρασία για ποδήλατο
        badConditions: ["Rain", "Snow", "Thunderstorm", "Drizzle"]
    },

    /**
     * Λήψη Τελικού Προγράμματος βάσει Συνθηκών
     */
    async getAdaptedProgram(dayName) {
        if (window.PegasusLogger) window.PegasusLogger.log(`Analyzing conditions for ${dayName}...`, "INFO");

        // 1. Ανάκτηση καιρού από τη γέφυρα
        const weather = await window.PegasusWeather.fetchCurrent();
        const baseProgram = window.calculateDailyProgram(dayName);
        
        // 2. Έλεγχος αν το πρόγραμμα περιλαμβάνει Outdoor δραστηριότητα
        const hasOutdoor = baseProgram.some(ex => ex.name.includes("Ποδηλασία"));

        if (hasOutdoor) {
            const isTooCold = weather.temp < this.constraints.minTemp;
            const isRaining = this.constraints.badConditions.includes(weather.condition);

            if (isTooCold || isRaining) {
                if (window.PegasusLogger) {
                    window.PegasusLogger.log(`Outdoor Aborted: ${weather.temp}°C, ${weather.condition}. Switching to Indoor Protocol.`, "WARNING");
                }
                return this.switchToIndoor(baseProgram);
            }
        }

        return baseProgram;
    },

    /**
     * Indoor Protocol: Αντικατάσταση Ποδηλασίας με EMS ή Stretching
     */
    switchToIndoor(program) {
        return program.map(ex => {
            if (ex.name.includes("Ποδηλασία")) {
                // Αν ο καιρός στα Γιάννενα είναι απαγορευτικός, επιβάλλεται EMS Session
                return { 
                    name: "EMS Indoor Replacement", 
                    muscleGroup: "Πόδια", 
                    sets: 4, 
                    duration: 300,
                    note: "Weather Replacement" 
                };
            }
            return ex;
        });
    },

    /**
     * Ενημέρωση του UI με τις καιρικές συνθήκες
     */
    updateWeatherUI: async function() {
        const weather = await window.PegasusWeather.fetchCurrent();
        const display = document.getElementById('weatherDisplay');
        if (display) {
            display.innerHTML = `
                <span style="color:#4CAF50; font-weight:900;">${weather.temp}°C</span> 
                <span style="color:#666; font-size:10px; margin-left:5px;">${weather.condition.toUpperCase()} (IOANNINA)</span>
            `;
        }
    }
};

/**
 * Global Hook: Χρησιμοποιείται από το app.js κατά την επιλογή ημέρας
 */
window.getFinalProgram = async (day) => {
    return await window.WeatherHandler.getAdaptedProgram(day);
};

// Initial Sync
window.addEventListener('load', () => {
    setTimeout(() => window.WeatherHandler.updateWeatherUI(), 2000);
});