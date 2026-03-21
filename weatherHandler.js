/* ==========================================================================
   PEGASUS WEATHER LOGIC & FALLBACK SYSTEM - v6.9 (STRICT ANALYST)
   Protocol: Data Guarding & Error Prevention
   ========================================================================== */

const legacySaturday = [
    { name: "Reverse Chest Press", sets: 4, duration: 45 },
    { name: "Close Grip Pulldown", sets: 4, duration: 45 },
    { name: "Reverse Grip Cable Row", sets: 4, duration: 45 }, 
    { name: "Standing Bicep Curl", sets: 3, duration: 45 },
    { name: "Triceps Press", sets: 3, duration: 45 }
];

const legacySunday = [
    { name: "Behind the Neck Pulldown", sets: 3, duration: 45 },
    { name: "Low Seated Row", sets: 3, duration: 45 },
    { name: "Triceps Overhead Extension", sets: 3, duration: 45 },
    { name: "Preacher Curl", sets: 3, duration: 45 },
    { name: "Lying Knee Raise", sets: 3, duration: 45 },
    { name: "Reverse Crunch", sets: 3, duration: 45 },
    { name: "Leg Raise Hip Lift", sets: 3, duration: 45 }
];

function isRaining() {
    const rainToggle = document.getElementById('rainToggle');
    return rainToggle ? rainToggle.checked : false;
}

/**
 * Επιστρέφει το κατάλληλο πρόγραμμα με Strict Data Check.
 */
function getFinalProgram(day, defaultProgram) {
    const rain = isRaining();
    
    // 1. DATA GUARD: Αν το defaultProgram δεν έχει προλάβει να φορτώσει (Fix for TypeError)
    if (!defaultProgram || typeof defaultProgram !== 'object') {
        console.warn("PEGASUS: Program data not available. Using emergency fallback.");
        return [{ name: "Stretching", sets: 1, duration: 338 }];
    }

    // 2. WEATHER LOGIC: Σαββατοκύριακο με βροχή (Legacy fallback)
    if (day === "Σάββατο" && rain) return legacySaturday;
    if (day === "Κυριακή" && rain) return legacySunday;

    // 3. NOMINAL LOGIC: Επιστροφή από το data.js (V4.9)
    // Αν η μέρα δεν υπάρχει στο αντικείμενο (π.χ. λόγω καθυστέρησης φόρτωσης), 
    // επιστρέφει Stretching αντί για σφάλμα.
    return defaultProgram[day] || [{ name: "Stretching", sets: 1, duration: 338 }];
}

function updateWeatherUI() {
    const statusBox = document.getElementById('weather-status-alert');
    if (statusBox) statusBox.style.display = 'none';
}