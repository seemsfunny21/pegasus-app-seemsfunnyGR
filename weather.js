/* ================= WEATHER COMPONENT FOR PEGASUS ================= */

/**
 * Κύρια συνάρτηση που καλείται από τη selectDay.
 * Δημιουργεί το κουμπί και φέρνει τα δεδομένα.
 */
async function fetchWeather() {
    // 1. Στόχευση του container που δημιουργήθηκε στη selectDay
    const container = document.getElementById("weather-container");
    if (!container) return;

    // 2. Καθαρισμός του container (σε περίπτωση που υπήρχε κάτι παλιό)
    container.innerHTML = "";

    // 3. Δημιουργία του κουμπιού με το στυλ των controls
    const weatherBtn = document.createElement("button");
    weatherBtn.id = "weatherBtn";
    weatherBtn.innerHTML = "⛅ ...";
    
    // Το προσθέτουμε στο container (άρα εμφανίζεται τελευταίο)
    container.appendChild(weatherBtn);

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
            
            // Ενημέρωση του κουμπιού με τα πραγματικά δεδομένα
            weatherBtn.innerHTML = `${icon} ${temp}°C`;
        } else {
            weatherBtn.innerText = "Ν/Α";
        }
    } catch (err) {
        console.error("Weather Error:", err);
        weatherBtn.innerText = "⚠️";
    }
}

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

/* ================= WEATHER COMPONENT FOR PEGASUS ================= */

async function fetchWeather() {
    // 1. Στοχεύουμε την κλάση που υπάρχει στο HTML σου
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
            
            // 3. Ενημέρωση μόνο με το κείμενο της θερμοκρασίας (Minimal στυλ)
            weatherEl.innerHTML = `${temp}°C`;
        } else {
            weatherEl.innerText = "Ν/Α";
        }
    } catch (err) {
        console.error("Weather Error:", err);
        weatherEl.innerText = "⚠️";
    }
}