/* ==========================================================================
   PEGASUS SETTINGS ENGINE - v4.3 (STRICT AUDIT & AUTO-FILL)
   Protocol: Strict Data Analyst - Zero Logic Loss - Cross-File Sync
   Status: FINAL CONVERGENCE READY
   ========================================================================== */

const DEFAULT_SETTINGS = {
    weight: 74, height: 187, age: 38, gender: 'male',
    goalKcal: 2800, goalProtein: 160, exTime: 45, restTime: 60,
    muscleTargets: { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 }
};

/**
 * 1. GLOBAL ACCESSOR (Safe Load)
 * Διασφαλίζει ότι καμία τιμή δεν θα επιστρέψει null στο UI
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
        console.warn("PEGASUS: Settings corruption detected, using defaults.");
        return DEFAULT_SETTINGS; 
    }
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
 * 3. UI INITIALIZER (The "Bridge" Fix)
 * Γεμίζει τα πεδία όταν ανοίγει το Panel
 */
window.initSettingsUI = function() {
    console.log("⚙️ PEGASUS: Forcing Settings UI Auto-Fill...");
    const s = window.getPegasusSettings();
    
    const fields = {
        "userWeightInput": s.weight, 
        "userHeightInput": s.height,
        "userAgeInput": s.age, 
        "userGenderInput": s.gender,
        "goalKcalInput": s.goalKcal, 
        "goalProteinInput": s.goalProtein,
        "exerciseTimeInput": s.exTime, 
        "restTimeInput": s.restTime
    };

    // Γέμισμα βασικών πεδίων
    for (let id in fields) {
        const el = document.getElementById(id);
        if (el) {
            el.value = fields[id];
            console.log(`Setting ${id} -> ${fields[id]}`);
        }
    }

    // Γέμισμα Muscle Targets (Σημαντικό για τον Optimizer)
    ["Στήθος", "Πλάτη", "Πόδια", "Χέρια", "Ώμοι", "Κορμός"].forEach(m => {
        const el = document.getElementById(`target${m}Input`);
        if (el) el.value = s.muscleTargets[m] || DEFAULT_SETTINGS.muscleTargets[m];
    });

    // Σύνδεση BMR Events για αυτόματο υπολογισμό θερμίδων κατά την πληκτρολόγηση
    ["userWeightInput", "userHeightInput", "userAgeInput", "userGenderInput"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.oninput = window.calculateBMR;
    });
};

/**
 * 4. MASTER SAVE LOGIC
 * Καλείται από το app.js και κάνει Push στο Cloud
 */
window.savePegasusSettingsGlobal = function() {
    try {
        console.log("PEGASUS: Executing Tactical Settings Save...");

        localStorage.setItem("pegasus_weight", document.getElementById("userWeightInput").value);
        localStorage.setItem("pegasus_height", document.getElementById("userHeightInput").value);
        localStorage.setItem("pegasus_age", document.getElementById("userAgeInput").value);
        localStorage.setItem("pegasus_gender", document.getElementById("userGenderInput").value);
        localStorage.setItem("pegasus_goal_kcal", document.getElementById("goalKcalInput").value);
        localStorage.setItem("pegasus_goal_protein", document.getElementById("goalProteinInput").value);
        localStorage.setItem("pegasus_ex_time", document.getElementById("exerciseTimeInput").value);
        localStorage.setItem("pegasus_rest_time", document.getElementById("restTimeInput").value);

        const targets = {};
        ["Στήθος", "Πλάτη", "Πόδια", "Χέρια", "Ώμοι", "Κορμός"].forEach(m => {
            const el = document.getElementById(`target${m}Input`);
            const val = el ? parseInt(el.value) : NaN;
            targets[m] = isNaN(val) ? DEFAULT_SETTINGS.muscleTargets[m] : val;
        });
        localStorage.setItem("pegasus_muscle_targets", JSON.stringify(targets));

        if (window.PegasusCloud) window.PegasusCloud.push(true);

        alert("✅ Ρυθμίσεις Αποθηκεύτηκαν!");
        location.reload();
    } catch (err) {
        console.error("CRITICAL ERROR IN SAVE:", err);
    }
};
