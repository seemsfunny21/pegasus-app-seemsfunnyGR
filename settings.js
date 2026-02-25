/* ==========================================================================
   PEGASUS SETTINGS ENGINE - PRO STRICT EDITION (FINAL SYNC)
   ========================================================================== */

const DEFAULT_SETTINGS = {
    weight: 74,
    height: 187,
    age: 38,
    gender: 'male',
    goalKcal: 2800,
    goalProtein: 160,
    exTime: 45,
    restTime: 60
};

// 1. Επιστροφή ρυθμίσεων από LocalStorage
window.getPegasusSettings = function() {
    return {
        weight: parseFloat(localStorage.getItem("pegasus_weight")) || DEFAULT_SETTINGS.weight,
        height: parseFloat(localStorage.getItem("pegasus_height")) || DEFAULT_SETTINGS.height,
        age: parseInt(localStorage.getItem("pegasus_age")) || DEFAULT_SETTINGS.age,
        gender: localStorage.getItem("pegasus_gender") || DEFAULT_SETTINGS.gender,
        goalKcal: parseInt(localStorage.getItem("pegasus_goal_kcal")) || DEFAULT_SETTINGS.goalKcal,
        goalProtein: parseInt(localStorage.getItem("pegasus_goal_protein")) || DEFAULT_SETTINGS.goalProtein,
        exTime: parseInt(localStorage.getItem("pegasus_ex_time")) || DEFAULT_SETTINGS.exTime,
        restTime: parseInt(localStorage.getItem("pegasus_rest_time")) || DEFAULT_SETTINGS.restTime
    };
};

// 2. Υπολογισμός BMR & Προτεινόμενων Θερμίδων
window.calculateBMR = function() {
    const wEl = document.getElementById("userWeightInput");
    const hEl = document.getElementById("userHeightInput");
    const aEl = document.getElementById("userAgeInput");
    const gEl = document.getElementById("userGenderInput");
    const goalEl = document.getElementById("goalKcalInput");

    if (!wEl || !hEl || !aEl || !gEl || !goalEl) return;

    const w = parseFloat(wEl.value);
    const h = parseFloat(hEl.value);
    const a = parseInt(aEl.value);
    const g = gEl.value;

    if (!w || !h || !a) return;

    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    bmr = (g === "male") ? bmr + 5 : bmr - 161;

    const suggestedKcal = Math.round(bmr * 1.55);
    goalEl.value = suggestedKcal;
};

// 3. Αρχικοποίηση και Events
document.addEventListener("DOMContentLoaded", () => {
    const settings = getPegasusSettings();
    
    // Φόρτωση τιμών στα Inputs (Με βάση τα IDs του index.html σου)
    const fields = {
        "userWeightInput": settings.weight,
        "userHeightInput": settings.height,
        "userAgeInput": settings.age,
        "userGenderInput": settings.gender,
        "goalKcalInput": settings.goalKcal,
        "goalProteinInput": settings.goalProtein,
        "exerciseTimeInput": settings.exTime, // ID από index.html
        "restTimeInput": settings.restTime    // ID από index.html
    };

    for (let id in fields) {
        const el = document.getElementById(id);
        if (el) el.value = fields[id];
    }

    ["userWeightInput", "userHeightInput", "userAgeInput", "userGenderInput"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("input", window.calculateBMR);
    });

    // 4. LOGIC ΑΠΟΘΗΚΕΥΣΗΣ
    const btnSave = document.getElementById("btnSaveSettings");
    if (btnSave) {
        btnSave.onclick = () => {
            // Λήψη τιμών από το UI
            const wVal = document.getElementById("userWeightInput")?.value;
            const hVal = document.getElementById("userHeightInput")?.value;
            const aVal = document.getElementById("userAgeInput")?.value;
            const gVal = document.getElementById("userGenderInput")?.value;
            const kVal = document.getElementById("goalKcalInput")?.value;
            const pVal = document.getElementById("goalProteinInput")?.value;
            const exTVal = document.getElementById("exerciseTimeInput")?.value;
            const rsTVal = document.getElementById("restTimeInput")?.value;

            // Αποθήκευση στο LocalStorage
            if (wVal) localStorage.setItem("pegasus_weight", wVal);
            if (hVal) localStorage.setItem("pegasus_height", hVal);
            if (aVal) localStorage.setItem("pegasus_age", aVal);
            if (gVal) localStorage.setItem("pegasus_gender", gVal);
            if (kVal) localStorage.setItem("pegasus_goal_kcal", kVal);
            if (pVal) localStorage.setItem("pegasus_goal_protein", pVal);
            if (exTVal) localStorage.setItem("pegasus_ex_time", exTVal);
            if (rsTVal) localStorage.setItem("pegasus_rest_time", rsTVal);

            // --- ΑΜΕΣΟΣ ΣΥΓΧΡΟΝΙΣΜΟΣ ΜΕ ΤΟ APP.JS ---
            
            // 1. Ενημέρωση Βάρους (για θερμίδες)
            if (wVal) window.userWeight = parseFloat(wVal);

            // 2. Ενημέρωση Φάσεων (για τη μηχανή του χρόνου)
            if (typeof workoutPhases !== 'undefined') {
                if (exTVal) workoutPhases[1].d = parseInt(exTVal);
                if (rsTVal) workoutPhases[2].d = parseInt(rsTVal);
            }

            // 3. ΕΠΑΝΥΠΟΛΟΓΙΣΜΟΣ & ΕΝΗΜΕΡΩΣΗ UI ΣΤΗΝ ΟΘΟΝΗ
            if (typeof window.calculateTotalTime === "function") {
                window.calculateTotalTime();
            }

            // 4. Ενημέρωση Food Panel
            if (window.renderFood) window.renderFood();
            
            const panel = document.getElementById("settingsPanel");
            if (panel) panel.style.display = "none";
            
            console.log("Pegasus: Settings saved & Engine updated.");
            alert("Οι ρυθμίσεις αποθηκεύτηκαν!");
        };
    }
});