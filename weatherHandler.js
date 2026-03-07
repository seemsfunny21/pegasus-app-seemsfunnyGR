/* ==========================================================================
   PEGASUS WEATHER LOGIC & FALLBACK SYSTEM - UPDATED
   ========================================================================== */

// 1. LEGACY PROGRAMS (Χωρίς Ποδηλασία - Ενεργοποιούνται μόνο στη βροχή)
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

/**
 * Ελέγχει την κατάσταση του Toggle στη σελίδα.
 * @returns {boolean} True αν το Toggle είναι ενεργό (Βροχή).
 */
function isRaining() {
    const rainToggle = document.getElementById('rainToggle');
    return rainToggle ? rainToggle.checked : false;
}

/**
 * Επιστρέφει το κατάλληλο πρόγραμμα βάσει καιρού.
 * @param {string} day - Η ημέρα της εβδομάδας.
 * @param {object} defaultProgram - Το αντικείμενο από το data.js.
 */
function getFinalProgram(day, defaultProgram) {
    const rain = isRaining();
    
    // Αν βρέχει, επέστρεψε τα legacy προγράμματα (που δεν έχουν ποδηλασία)
    if (day === "Σάββατο" && rain) {
        return legacySaturday;
    }
    
    if (day === "Κυριακή" && rain) {
        return legacySunday;
    }

    // Αν δεν βρέχει ή είναι άλλη μέρα, επέστρεψε το κανονικό πρόγραμμα από το data.js
    return defaultProgram[day];
}

/**
 * Απενεργοποιημένη λειτουργία μηνυμάτων κατόπιν οδηγίας χρήστη.
 */
function updateWeatherUI(message) {
    const statusBox = document.getElementById('weather-status-alert');
    if (statusBox) {
        statusBox.style.display = 'none';
    }
}