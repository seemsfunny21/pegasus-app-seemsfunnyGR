/* ==========================================================================
   PEGASUS WEATHER BRIDGE - CLEAN SWEEP v17.0
   Protocol: Geo-Targeted Sync (Ioannina) | Logic: Real-time API Fetch
   ========================================================================== */

const PegasusWeather = {
    apiKey: "7662c64077651c6c6411516e6d1e1f1c", // Standard OpenWeather API Format
    city: "Ioannina,GR",
    units: "metric",
    cacheKey: "pegasus_weather_cache",
    cacheTTL: 3600000, // 1 Hour Cache Persistence

    /**
     * Κύρια συνάρτηση λήψης δεδομένων
     */
    async fetchCurrent() {
        // 1. Έλεγχος Cache για εξοικονόμηση API calls
        const cached = JSON.parse(localStorage.getItem(this.cacheKey));
        if (cached && (Date.now() - cached.timestamp < this.cacheTTL)) {
            console.log("✅ PEGASUS: Weather loaded from Cache.");
            return cached.data;
        }

        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${this.city}&units=${this.units}&appid=${this.apiKey}`
            );
            
            if (!response.ok) throw new Error("Weather API Unreachable");

            const data = await response.json();
            
            const weatherResult = {
                temp: Math.round(data.main.temp),
                condition: data.weather[0].main, // π.χ. Rain, Clear, Clouds
                description: data.weather[0].description,
                humidity: data.main.humidity,
                timestamp: Date.now()
            };

            // Αποθήκευση στην Cache
            localStorage.setItem(this.cacheKey, JSON.stringify({
                timestamp: Date.now(),
                data: weatherResult
            }));

            if (window.PegasusLogger) {
                window.PegasusLogger.log(`Weather Sync: ${weatherResult.temp}°C in Ioannina`, "INFO");
            }

            return weatherResult;
        } catch (error) {
            console.error("❌ PEGASUS WEATHER ERROR:", error);
            // Fallback σε ασφαλή δεδομένα (Indoor Protocol) αν αποτύχει το API
            return { temp: 20, condition: "Offline", description: "API Error" };
        }
    }
};

window.PegasusWeather = PegasusWeather;