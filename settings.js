/* ==========================================================================
   PEGASUS SETTINGS ENGINE - v4.1 MODULAR (STRICT AUDIT)
   Protocol: Strict Data Analyst - Zero Logic Loss - Cross-File Sync
   ========================================================================== */

const DEFAULT_SETTINGS = {
    weight: 74, height: 187, age: 38, gender: 'male',
    goalKcal: 2800, goalProtein: 160, exTime: 45, restTime: 60,
    muscleTargets: { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 }
};

/**
 * 1. GLOBAL ACCESSOR (Safe Load)
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
    } catch (e) { return DEFAULT_SETTINGS; }
};

/**
 * 2. LIVE BMR CALCULATOR (Mifflin-St Jeor)
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
    goalEl.value = Math.round(bmr * 1.55);
};

/**
 * 3. MASTER SAVE LOGIC (Called by app.js listener)
 */
window.savePegasusSettingsGlobal = function() {
    try {
        console.log("PEGASUS: Executing Tactical Settings Save...");

        const w = document.getElementById("userWeightInput")?.value;
        const h = document.getElementById("userHeightInput")?.value;
        const a = document.getElementById("userAgeInput")?.value;
        const g = document.getElementById("userGenderInput")?.value;
        const goalK = document.getElementById("goalKcalInput")?.value;
        const goalP = document.getElementById("goalProteinInput")?.value;
        const ex = document.getElementById("exerciseTimeInput")?.value;
        const rs = document.getElementById("restTimeInput")?.value;

        localStorage.setItem("pegasus_weight", w || DEFAULT_SETTINGS.weight);
        localStorage.setItem("pegasus_height", h || DEFAULT_SETTINGS.height);
        localStorage.setItem("pegasus_age", a || DEFAULT_SETTINGS.age);
        localStorage.setItem("pegasus_gender", g || DEFAULT_SETTINGS.gender);
        localStorage.setItem("pegasus_goal_kcal", goalK || DEFAULT_SETTINGS.goalKcal);
        localStorage.setItem("pegasus_goal_protein", goalP || DEFAULT_SETTINGS.goalProtein);
        localStorage.setItem("pegasus_ex_time", ex || DEFAULT_SETTINGS.exTime);
        localStorage.setItem("pegasus_rest_time", rs || DEFAULT_SETTINGS.restTime);

        // Muscle Targets Audit
        const targets = {};
        ["Στήθος", "Πλάτη", "Πόδια", "Χέρια", "Ώμοι", "Κορμός"].forEach(m => {
            const el = document.getElementById(`target${m}Input`);
            let val = el ? parseInt(el.value) : NaN;
            targets[m] = isNaN(val) ? (DEFAULT_SETTINGS.muscleTargets[m] || 14) : val;
        });
        localStorage.setItem("pegasus_muscle_targets", JSON.stringify(targets));

        if (window.PegasusCloud) window.PegasusCloud.push(true);

        alert("PEGASUS SYNC: Οι ρυθμίσεις αποθηκεύτηκαν.");
        window.location.reload();
    } catch (err) {
        console.error("CRITICAL ERROR IN SAVE:", err);
    }
};

/**
 * 4. UI INITIALIZER
 */
window.initSettingsUI = function() {
    const s = window.getPegasusSettings();
    const fields = {
        "userWeightInput": s.weight, "userHeightInput": s.height,
        "userAgeInput": s.age, "userGenderInput": s.gender,
        "goalKcalInput": s.goalKcal, "goalProteinInput": s.goalProtein,
        "exerciseTimeInput": s.exTime, "restTimeInput": s.restTime
    };

    for (let id in fields) {
        const el = document.getElementById(id);
        if (el) el.value = fields[id];
    }

    Object.keys(s.muscleTargets).forEach(m => {
        const el = document.getElementById(`target${m}Input`);
        if (el) el.value = s.muscleTargets[m];
    });

    // Re-bind BMR Live Events
    ["userWeightInput", "userHeightInput", "userAgeInput", "userGenderInput"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.oninput = window.calculateBMR;
    });
};
