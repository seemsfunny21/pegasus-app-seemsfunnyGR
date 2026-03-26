/* ==========================================================================
   PEGASUS WEATHER COMPONENT - v3.0 (MODULAR / FULLY DECOUPLED)
   Protocol: Strict Data Analyst - Isolated Scope & Auto-Sync
   ========================================================================== */

const PegasusWeather = (function() {
    // 1. ΙΔΙΩΤΙΚΕΣ ΛΕΙΤΟΥΡΓΙΕΣ (Private Methods)
    const weatherCodeToEmoji = (code) => {
        if (code === 0) return "☀️"; 
        if (code <= 3) return "🌤️";  
        if (code === 45 || code === 48) return "🌥️"; 
        if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "🌧️"; 
        if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "🌨️"; 
        if (code >= 95) return "⛈️"; 
        return "🌫️";
    };

    const fetchWeatherData = async () => {
        // Εύρεση του στοιχείου ανεξάρτητα από τη δομή (desktop/mobile)
        const weatherEl = document.querySelector(".weather-text") || document.querySelector(".weather-control span");
        if (!weatherEl) return;

        try {
            // Σταθερές συντεταγμένες: Ιωάννινα
            const url = "https://api.open-meteo.com/v1/forecast?latitude=39.667&longitude=20.850&current_weather=true&temperature_unit=celsius&timezone=Europe/Athens";
            
            const res = await fetch(url);
            if (!res.ok) throw new Error("Service Unavailable");
            
            const data = await res.json();

            if (data?.current_weather?.temperature !== undefined) {
                const temp = Math.round(data.current_weather.temperature);
                const code = data.current_weather.weathercode;
                const icon = weatherCodeToEmoji(code);
                
                weatherEl.innerHTML = `${icon} ${temp}°C`;

                // PEGASUS AUTO-SYNC: Αυτόματη ενημέρωση του διακόπτη (Βροχή & Χιόνι)
                const rainToggle = document.getElementById('rainToggle');
                if (rainToggle) {
                    const isPrecipitation = (
                        (code >= 51 && code <= 67) || // Βροχή
                        (code >= 71 && code <= 77) || // Χιόνι
                        (code >= 80 && code <= 82) || // Μπόρες βροχής
                        (code >= 85 && code <= 86) || // Μπόρες χιονιού
                        code >= 95                    // Καταιγίδα
                    );
                    
                    // Trigger του event αν υπάρξει αλλαγή, για ανανέωση του προγράμματος
                    if (rainToggle.checked !== isPrecipitation) {
                        rainToggle.checked = isPrecipitation;
                        rainToggle.dispatchEvent(new Event('change'));
                    }
                }
            }
        } catch (error) {
            console.error("[PEGASUS WEATHER]: API Error", error);
            if (weatherEl.innerHTML === "...°C") weatherEl.innerHTML = "⚠️ N/A";
        }
    };

    // 2. PUBLIC API & INITIALIZATION
    return {
        init: function() {
            fetchWeatherData();
            // Αυτόματη ανανέωση κάθε 30 λεπτά
            setInterval(fetchWeatherData, 30 * 60 * 1000);
        },
        fetch: fetchWeatherData,
        getEmoji: weatherCodeToEmoji
    };
})();

// Εξαγωγή στο Window Scope για διασφάλιση συμβατότητας
window.addEventListener('DOMContentLoaded', PegasusWeather.init);
window.fetchWeather = PegasusWeather.fetch;