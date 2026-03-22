/* ================= WEATHER COMPONENT FOR PEGASUS ================= */

/**
 * Μετατροπή κωδικού καιρού σε Emoji
 */
function weatherCodeToEmoji(code) {
    if (code === 0) return "☀️"; // Καθαρός
    if (code <= 3) return "🌤️";  // Λίγα σύννεφα
    if (code <= 48) return "🌥️"; // Συννεφιά/Ομίχλη
    if (code <= 67) return "🌧️"; // Βροχή
    if (code <= 77) return "🌨️"; // Χιόνι
    if (code <= 99) return "⛈️"; // Καταιγίδα
    return "🌫️";
}

/**
 * Κύρια συνάρτηση - Ενημερώνει το UI με τον καιρό (Ιωάννινα)
 */
async function fetchWeather() {
    // 1. Στοχεύουμε την κλάση που υπάρχει στο HTML
    const weatherEl = document.querySelector(".weather-text");
    if (!weatherEl) return;

    // 2. Εμφάνιση κατάστασης φόρτωσης
    weatherEl.innerHTML = "...°C";

    try {
        // Συντεταγμένες για Ιωάννινα
        const url = "https://api.open-meteo.com/v1/forecast?latitude=39.667&longitude=20.850&current_weather=true&temperature_unit=celsius&timezone=Europe/Athens";
        
        const res = await fetch(url);
        if (!res.ok) throw new Error("Service Unavailable");
        
        const data = await res.json();

        if (data?.current_weather?.temperature !== undefined) {
            const temp = Math.round(data.current_weather.temperature);
            const code = data.current_weather.weathercode;
            const icon = weatherCodeToEmoji(code);
            
            // 3. Ενημέρωση UI με Emoji και Θερμοκρασία
            weatherEl.innerHTML = `${icon} ${temp}°C`;
        } else {
            weatherEl.innerText = "Ν/Α";
        }
    } catch (err) {
        console.error("Weather Error:", err);
        weatherEl.innerText = "⚠️ Error";
    }
}
