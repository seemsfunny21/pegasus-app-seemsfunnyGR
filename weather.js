/* ==========================================================================
   PEGASUS WEATHER WIDGET - v4.0 (PURE UI EDITION)
   Protocol: Strict Analyst - Ioannina GR - Display Only
   ========================================================================== */

function weatherCodeToEmoji(code) {
    if (code === 0) return "☀️";
    if (code <= 3) return "🌤️";
    if (code === 45 || code === 48) return "🌥️";
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return "🌧️";
    if (code >= 71 && code <= 77) return "❄️";
    return "🌫️";
}

window.updateWeatherUI = async function() {
    try {
        // Ioannina Coordinates (Σταθερά στα Γιάννενα)
        const url = "https://api.open-meteo.com/v1/forecast?latitude=39.667&longitude=20.850&current_weather=true";
        const res = await fetch(url);
        const data = await res.json();

        if (data && data.current_weather) {
            const temp = Math.round(data.current_weather.temperature);
            const code = data.current_weather.weathercode;
            const emoji = weatherCodeToEmoji(code);

            // Τυπώνει το αποτέλεσμα στο UI
            const weatherEl = document.querySelector('.weather-text');
            if (weatherEl) {
                weatherEl.innerHTML = `${emoji} ${temp}°C`;
            }
            console.log(`[WEATHER UI] Updated: ${temp}°C ${emoji}`);
        }
    } catch (err) {
        console.error("PEGASUS WEATHER ERROR:", err);
        const weatherEl = document.querySelector('.weather-text');
        if (weatherEl) weatherEl.innerText = "--°C";
    }
};

// Εκκίνηση με το φόρτωμα της σελίδας
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(window.updateWeatherUI, 1000); 
    setInterval(window.updateWeatherUI, 30 * 60 * 1000); // Ανανέωση κάθε 30 λεπτά
});
