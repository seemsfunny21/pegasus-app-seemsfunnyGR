/* ================= WEATHER COMPONENT FOR PEGASUS ================= */

/**
 * Μετατροπή κωδικού καιρού σε Emoji (Ακριβής χαρτογράφηση WMO)
 */
function weatherCodeToEmoji(code) {
    if (code === 0) return "☀️"; // Καθαρός
    if (code <= 3) return "🌤️";  // Λίγα σύννεφα
    if (code === 45 || code === 48) return "🌥️"; // Συννεφιά/Ομίχλη
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "🌧️"; // Βροχή / Μπόρες
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "🌨️"; // Χιόνι
    if (code >= 95) return "⛈️"; // Καταιγίδα
    return "🌫️";
}

/**
 * Κύρια συνάρτηση - Ενημερώνει το UI με τον καιρό (Ιωάννινα)
 */
async function fetchWeather() {
    const weatherEl = document.querySelector(".weather-text");
    if (!weatherEl) return;

    weatherEl.innerHTML = "...°C";

    try {
        const url = "https://api.open-meteo.com/v1/forecast?latitude=39.667&longitude=20.850&current_weather=true&temperature_unit=celsius&timezone=Europe/Athens";
        
        const res = await fetch(url);
        if (!res.ok) throw new Error("Service Unavailable");
        
        const data = await res.json();

        if (data?.current_weather?.temperature !== undefined) {
            const temp = Math.round(data.current_weather.temperature);
            const code = data.current_weather.weathercode;
            const icon = weatherCodeToEmoji(code);
            
            weatherEl.innerHTML = `${icon} ${temp}°C`;

            // PEGASUS AUTO-SYNC: Αυτόματη ενημέρωση του διακόπτη βροχής
            const rainToggle = document.getElementById('rainToggle');
            if (rainToggle) {
                const isRaining = ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95);
                rainToggle.checked = isRaining;
            }

        } else {
            weatherEl.innerText = "Ν/Α";
        }
    } catch (err) {
        console.error("Weather Error:", err);
        weatherEl.innerText = "⚠️ Error";
    }
}
