/* ==========================================================================
   PEGASUS SETTINGS ENGINE - PRO STRICT EDITION (v3.1 DYNAMIC SYNC)
   STRICT DATA ANALYST PROTOCOL - NaN CORRUPTION GUARD & MANDATORY RELOAD
   ========================================================================== */

const DEFAULT_SETTINGS = {
    weight: 74,
    height: 187,
    age: 38,
    gender: 'male',
    goalKcal: 2800,
    goalProtein: 160,
    exTime: 45,
    restTime: 60,
    muscleTargets: {
        "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12
    }
};

/**
 * 1. Επιστροφή ρυθμίσεων από LocalStorage
 */
window.getPegasusSettings = function() {
    try {
        const storedTargets = localStorage.getItem("pegasus_muscle_targets");
        return {
            weight: parseFloat(localStorage.getItem("pegasus_weight")) || DEFAULT_SETTINGS.weight,
            height: parseFloat(localStorage.getItem("pegasus_height")) || DEFAULT_SETTINGS.height,
            age: parseInt(localStorage.getItem("pegasus_age")) || DEFAULT_SETTINGS.age,
            gender: localStorage.getItem("pegasus_gender") || DEFAULT_SETTINGS.gender,
            goalKcal: parseInt(localStorage.getItem("pegasus_goal_kcal")) || DEFAULT_SETTINGS.goalKcal,
            goalProtein: parseInt(localStorage.getItem("pegasus_goal_protein")) || DEFAULT_SETTINGS.goalProtein,
            exTime: parseInt(localStorage.getItem("pegasus_ex_time")) || DEFAULT_SETTINGS.exTime,
            restTime: parseInt(localStorage.getItem("pegasus_rest_time")) || DEFAULT_SETTINGS.restTime,
            muscleTargets: storedTargets ? JSON.parse(storedTargets) : DEFAULT_SETTINGS.muscleTargets
        };
    } catch (e) {
        console.error("Pegasus Settings Load Error:", e);
        return DEFAULT_SETTINGS;
    }
};

/**
 * 2. Υπολογισμός BMR (Mifflin-St Jeor)
 */
window.calculateBMR = function() {
    const w = parseFloat(document.getElementById("userWeightInput")?.value);
    const h = parseFloat(document.getElementById("userHeightInput")?.value);
    const a = parseInt(document.getElementById("userAgeInput")?.value);
    const g = document.getElementById("userGenderInput")?.value;
    const goalEl = document.getElementById("goalKcalInput");

    if (!w || !h || !a || !goalEl) return;

    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    bmr = (g === "male") ? bmr + 5 : bmr - 161;
    
    // Πολλαπλασιαστής δραστηριότητας (1.55 για moderate exercise)
    goalEl.value = Math.round(bmr * 1.55);
};

/**
 * 3. Αρχικοποίηση και Events
 */
document.addEventListener("DOMContentLoaded", () => {
    const settings = getPegasusSettings();
    
    // Φόρτωση βασικών τιμών στα Inputs
    const fields = {
        "userWeightInput": settings.weight,
        "userHeightInput": settings.height,
        "userAgeInput": settings.age,
        "userGenderInput": settings.gender,
        "goalKcalInput": settings.goalKcal,
        "goalProteinInput": settings.goalProtein,
        "exerciseTimeInput": settings.exTime,
        "restTimeInput": settings.restTime
    };

    for (let id in fields) {
        const el = document.getElementById(id);
        if (el) el.value = fields[id];
    }

    // Φόρτωση Muscle Targets στα Inputs
    for (let muscle in settings.muscleTargets) {
        const el = document.getElementById(`target${muscle}Input`);
        if (el) el.value = settings.muscleTargets[muscle];
    }

    // Live BMR update κατά την πληκτρολόγηση
    ["userWeightInput", "userHeightInput", "userAgeInput", "userGenderInput"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("input", window.calculateBMR);
    });

    /**
     * 4. LOGIC ΑΠΟΘΗΚΕΥΣΗΣ (Save & Force Sync)
     */
    const btnSave = document.getElementById("btnSaveSettings");
    if (btnSave) {
        btnSave.onclick = () => {
            try {
                // Αποθήκευση Βασικών Παραμέτρων
                localStorage.setItem("pegasus_weight", document.getElementById("userWeightInput")?.value || DEFAULT_SETTINGS.weight);
                localStorage.setItem("pegasus_height", document.getElementById("userHeightInput")?.value || DEFAULT_SETTINGS.height);
                localStorage.setItem("pegasus_age", document.getElementById("userAgeInput")?.value || DEFAULT_SETTINGS.age);
                localStorage.setItem("pegasus_gender", document.getElementById("userGenderInput")?.value || DEFAULT_SETTINGS.gender);
                localStorage.setItem("pegasus_goal_kcal", document.getElementById("goalKcalInput")?.value || DEFAULT_SETTINGS.goalKcal);
                localStorage.setItem("pegasus_goal_protein", document.getElementById("goalProteinInput")?.value || DEFAULT_SETTINGS.goalProtein);
                localStorage.setItem("pegasus_ex_time", document.getElementById("exerciseTimeInput")?.value || DEFAULT_SETTINGS.exTime);
                localStorage.setItem("pegasus_rest_time", document.getElementById("restTimeInput")?.value || DEFAULT_SETTINGS.restTime);

                // Αποθήκευση Muscle Targets (Δυναμικά) με προστασία NaN
                const targets = {};
                ["Στήθος", "Πλάτη", "Πόδια", "Χέρια", "Ώμοι", "Κορμός"].forEach(m => {
                    const el = document.getElementById(`target${m}Input`);
                    let parsedVal = el ? parseInt(el.value) : NaN;
                    
                    // Fallback αν το parsedVal είναι NaN (π.χ. κενό πεδίο)
                    targets[m] = isNaN(parsedVal) ? (DEFAULT_SETTINGS.muscleTargets[m] || 14) : parsedVal;
                });
                localStorage.setItem("pegasus_muscle_targets", JSON.stringify(targets));

                // Κλείσιμο του Settings Panel
                const panel = document.getElementById("settingsPanel");
                if (panel) panel.style.display = "none";

                // Υποχρεωτικό Reload για ενημέρωση του Progress UI
                console.log("[PEGASUS] Settings saved. Force reloading page for sync...");
                window.location.reload();

            } catch (err) {
                console.error("[PEGASUS SAVE ERROR]:", err);
                alert("Σφάλμα κατά την αποθήκευση. Δες την κονσόλα (F12).");
            }
        };
    }
});
