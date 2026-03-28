/* ==========================================================================
   PEGASUS WEATHER ENGINE - v3.1 (UNIFIED & CLEAN UI)
   Protocol: Strict Analyst - Ioannina GR (39.667, 20.850)
   Functions: API Fetch, UI Toggle Sync, Program Bridge (No Visual Alerts)
   ========================================================================== */

/**
 * 1. CORE LOGIC: Έλεγχος για Υετό (Βροχή/Χιόνι) βάσει WMO Codes
 */
function isPrecipitation(code) {
    return (
        (code >= 51 && code <= 67) || // Βροχή / Ψιχάλα
        (code >= 71 && code <= 77) || // Χιόνι
        (code >= 80 && code <= 82) || // Μπόρες βροχής
        (code >= 85 && code <= 86) || // Μπόρες χιονιού
        code >= 95                     // Καταιγίδα
    );
}

function weatherCodeToEmoji(code) {
    if (code === 0) return "☀️";
    if (code <= 3) return "🌤️";
    if (code === 45 || code === 48) return "🌥️";
    if (isPrecipitation(code)) return "🌧️";
    return "🌫️";
}

/**
 * 2. API FETCH & UI SYNC
 */
async function fetchWeather() {
    const weatherEl = document.querySelector(".weather-text");
    const rainToggle = document.getElementById('rainToggle');
    const statusBox = document.getElementById('weather-status-alert');

    if (weatherEl) weatherEl.innerHTML = "...°C";

    try {
        const url = "https://api.open-meteo.com/v1/forecast?latitude=39.667&longitude=20.850&current_weather=true&temperature_unit=celsius&timezone=Europe/Athens";
        const res = await fetch(url);
        if (!res.ok) throw new Error("Weather Service Offline");
        
        const data = await res.json();
        const weather = data.current_weather;

        if (weather) {
            const temp = Math.round(weather.temperature);
            const code = weather.weathercode;
            const icon = weatherCodeToEmoji(code);
            const rainy = isPrecipitation(code);

            // Ενημέρωση κειμένου θερμοκρασίας στην οθόνη
            if (weatherEl) weatherEl.innerHTML = `${icon} ${temp}°C`;

            // Αυτόματος συγχρονισμός του κρυφού Rain Toggle για την προσαρμογή του Optimizer
            if (rainToggle) {
                rainToggle.checked = rainy;
                rainToggle.dispatchEvent(new Event('change'));
            }

            // --- PROTOCOL PATCH: Μόνιμη απόκρυψη του Indoor Alert Box ---
            if (statusBox) {
                statusBox.style.display = 'none';
                statusBox.innerHTML = "";
            }

            console.log(`[WEATHER] Sync Complete. Temp: ${temp}°C, Rainy: ${rainy}. Visual Alert: Disabled.`);
        }
    } catch (err) {
        console.error("PEGASUS WEATHER ERROR:", err);
        if (weatherEl) weatherEl.innerText = "Error";
    }
}

/**
 * 3. PROGRAM BRIDGE: Η συνάρτηση που καλεί το app.js
 */
window.isRaining = function() {
    const rainToggle = document.getElementById('rainToggle');
    // Επιστρέφει την κατάσταση του διακόπτη (που ενημερώθηκε από το API)
    return rainToggle ? rainToggle.checked : false;
};

/**
 * 4. DYNAMIC WRAPPER
 */
window.getFinalProgram = function(day) {
    const rain = window.isRaining();
    if (typeof window.calculateDailyProgram === 'function') {
        return window.calculateDailyProgram(day, rain);
    }
    return [];
};

/**
 /**
 * 5. PEGASUS GLOBAL BRIDGE
 * Επιτρέπει στο app.js να καλέσει τον καιρό κατά το window.onload
 */
window.updateWeatherUI = function() {
    fetchWeather();
};

// Αυτόματη εκτέλεση αν το αρχείο φορτωθεί μόνο του (Fallback)
if (document.readyState === 'complete') {
    window.updateWeatherUI();
} else {
    window.addEventListener('load', window.updateWeatherUI);
}

console.log("✅ PEGASUS WEATHER ENGINE: v3.2 Unified Protocol Active.");
