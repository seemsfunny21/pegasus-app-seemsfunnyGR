/* ==========================================================================
   📦 PEGASUS SETTINGS ENGINE - v4.6 (4-PILLAR ALIGNMENT)
   Protocol: Strict Data Analyst | Zero Logic Loss | Split Integration
   Status: FINAL STABLE | FIXED: SPLIT SELECTION SYNC
   ========================================================================== */

// 🛡️ Global Safe Declaration
var M = M || window.PegasusManifest;

const DEFAULT_SETTINGS = {
    weight: 74,
    height: 187,
    age: 38,
    gender: 'male',
    goalKcal: 2800,
    goalProtein: 160,
    exTime: 45,
    restTime: 60,
    activeSplit: 'IRON',
    muscleTargets: {
        "Στήθος": 24,
        "Πλάτη": 24,
        "Πόδια": 24,
        "Χέρια": 16,
        "Ώμοι": 16,
        "Κορμός": 12
    }
};

function clonePegasusSettings(value) {
    try {
        return structuredClone(value);
    } catch (e) {
        return JSON.parse(JSON.stringify(value));
    }
}

/**
 * 1. GLOBAL ACCESSOR
 */
window.getPegasusSettings = function() {
    try {
        const u = M?.user || {};
        const d = M?.diet || {};
        const w = M?.workout || {};

        const storedTargetsStr = localStorage.getItem(w.muscleTargets || "pegasus_muscle_targets");
        let storedTargets = null;

        if (storedTargetsStr) {
            try {
                storedTargets = JSON.parse(storedTargetsStr);
            } catch (e) {}
        }

        return {
            weight: parseFloat(localStorage.getItem(u.weight || "pegasus_weight")) || DEFAULT_SETTINGS.weight,
            height: parseFloat(localStorage.getItem(u.height || "pegasus_height")) || DEFAULT_SETTINGS.height,
            age: parseInt(localStorage.getItem(u.age || "pegasus_age"), 10) || DEFAULT_SETTINGS.age,
            gender: localStorage.getItem(u.gender || "pegasus_gender") || DEFAULT_SETTINGS.gender,
            goalKcal: parseInt(localStorage.getItem(d.todayKcal || "pegasus_today_kcal"), 10) || DEFAULT_SETTINGS.goalKcal,
            goalProtein: parseInt(localStorage.getItem(d.goalProtein || 'pegasus_goal_protein'), 10) || parseInt(localStorage.getItem(d.todayProtein || "pegasus_today_protein"), 10) || DEFAULT_SETTINGS.goalProtein,
            exTime: parseInt(localStorage.getItem(w.ex_time || "pegasus_ex_time"), 10) || DEFAULT_SETTINGS.exTime,
            restTime: parseInt(localStorage.getItem(w.rest_time || "pegasus_rest_time"), 10) || DEFAULT_SETTINGS.restTime,
            activeSplit: localStorage.getItem('pegasus_active_plan') || DEFAULT_SETTINGS.activeSplit,
            muscleTargets: storedTargets || clonePegasusSettings(DEFAULT_SETTINGS.muscleTargets)
        };
    } catch (e) {
        console.warn("PEGASUS: Settings corruption detected.", e);
        return clonePegasusSettings(DEFAULT_SETTINGS);
    }
};

/**
 * 2. LIVE BMR CALCULATOR
 */
window.calculateBMR = function() {
    const w = parseFloat(document.getElementById("userWeightInput")?.value);
    const h = parseFloat(document.getElementById("userHeightInput")?.value);
    const a = parseInt(document.getElementById("userAgeInput")?.value, 10);
    const g = document.getElementById("userGenderInput")?.value;
    const bmrDisplay = document.getElementById("maintenanceKcalDisplay");

    if (!w || !h || !a) return;

    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    bmr = (g === "male") ? bmr + 5 : bmr - 161;
    const tdee = Math.round(bmr * 1.55);

    if (bmrDisplay) bmrDisplay.textContent = `Συντήρηση (TDEE): ${tdee} kcal`;
};

/**
 * 2.5 RUNTIME BRIDGE
 */
window.applyPegasusRuntimeSettings = function(settingsObj) {
    const s = settingsObj || window.getPegasusSettings();

    window.pegasusTimerConfig = {
        prep: 10,
        work: parseInt(s.exTime, 10) || DEFAULT_SETTINGS.exTime,
        rest: parseInt(s.restTime, 10) || DEFAULT_SETTINGS.restTime
    };

    if (typeof window.userWeight !== "undefined") {
        window.userWeight = parseFloat(s.weight) || DEFAULT_SETTINGS.weight;
    }

    if (window.PegasusEngine?.dispatch) {
        window.PegasusEngine.dispatch({
            type: "SYNC_WEIGHT",
            payload: { weight: parseFloat(s.weight) || DEFAULT_SETTINGS.weight }
        });

        window.PegasusEngine.dispatch({
            type: "SET_TIMER_STATE",
            payload: {
                totalSeconds: window.totalSeconds || 0,
                remainingSeconds: window.remainingSeconds || 0,
                phaseRemainingSeconds: window.phaseRemainingSeconds ?? null
            }
        });
    }
};

/**
 * 3. UI INITIALIZER (With Split Mapping)
 */
window.initSettingsUI = function() {
    const s = window.getPegasusSettings();

    const fields = {
        "userWeightInput": s.weight,
        "userHeightInput": s.height,
        "userAgeInput": s.age,
        "userGenderInput": s.gender,
        "goalKcalInput": s.goalKcal,
        "goalProteinInput": s.goalProtein,
        "exerciseTimeInput": s.exTime,
        "restTimeInput": s.restTime,
        "activeSplitSelector": s.activeSplit
    };

    for (let id in fields) {
        const el = document.getElementById(id);
        if (el) el.value = fields[id];
    }

    ["Στήθος", "Πλάτη", "Πόδια", "Χέρια", "Ώμοι", "Κορμός"].forEach(m => {
        const el = document.getElementById(`target${m}Input`);
        if (el) el.value = s.muscleTargets[m] || DEFAULT_SETTINGS.muscleTargets[m];
    });

    ["userWeightInput", "userHeightInput", "userAgeInput", "userGenderInput"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.oninput = window.calculateBMR;
    });

    window.applyPegasusRuntimeSettings(s);
    window.calculateBMR();
};

/**
 * 4. MASTER SAVE LOGIC (Cross-File Impact Audit Compliant)
 */
window.savePegasusSettingsGlobal = function() {
    try {
        const u = M?.user || {};
        const d = M?.diet || {};
        const w = M?.workout || {};
        const currentSettings = window.getPegasusSettings();

        const getValue = (id, fallback) => {
            const el = document.getElementById(id);
            return (el && el.value !== "") ? el.value : fallback;
        };

        const newSettings = {
            weight: parseFloat(getValue("userWeightInput", currentSettings.weight)) || currentSettings.weight || DEFAULT_SETTINGS.weight,
            height: parseFloat(getValue("userHeightInput", currentSettings.height)) || currentSettings.height || DEFAULT_SETTINGS.height,
            age: parseInt(getValue("userAgeInput", currentSettings.age), 10) || currentSettings.age || DEFAULT_SETTINGS.age,
            gender: getValue("userGenderInput", currentSettings.gender || DEFAULT_SETTINGS.gender),
            goalKcal: parseInt(getValue("goalKcalInput", currentSettings.goalKcal), 10) || currentSettings.goalKcal || DEFAULT_SETTINGS.goalKcal,
            goalProtein: parseInt(getValue("goalProteinInput", currentSettings.goalProtein), 10) || currentSettings.goalProtein || DEFAULT_SETTINGS.goalProtein,
            exTime: parseInt(getValue("exerciseTimeInput", currentSettings.exTime), 10) || currentSettings.exTime || DEFAULT_SETTINGS.exTime,
            restTime: parseInt(getValue("restTimeInput", currentSettings.restTime), 10) || currentSettings.restTime || DEFAULT_SETTINGS.restTime,
            activeSplit: getValue("activeSplitSelector", currentSettings.activeSplit || DEFAULT_SETTINGS.activeSplit),
            muscleTargets: {}
        };

        ["Στήθος", "Πλάτη", "Πόδια", "Χέρια", "Ώμοι", "Κορμός"].forEach(m => {
            const el = document.getElementById(`target${m}Input`);
            const val = el ? parseInt(el.value, 10) : NaN;
            newSettings.muscleTargets[m] = isNaN(val) ? DEFAULT_SETTINGS.muscleTargets[m] : val;
        });

        // Core Identity
        localStorage.setItem(u.weight || "pegasus_weight", String(newSettings.weight));
        localStorage.setItem(u.height || "pegasus_height", String(newSettings.height));
        localStorage.setItem(u.age || "pegasus_age", String(newSettings.age));
        localStorage.setItem(u.gender || "pegasus_gender", newSettings.gender);

        // Nutrition & Time
        localStorage.setItem(d.todayKcal || "pegasus_today_kcal", String(newSettings.goalKcal));
        localStorage.setItem(d.goalProtein || 'pegasus_goal_protein', String(newSettings.goalProtein));
        localStorage.setItem(d.todayProtein || "pegasus_today_protein", String(newSettings.goalProtein));
        localStorage.setItem(w.ex_time || "pegasus_ex_time", String(newSettings.exTime));
        localStorage.setItem(w.rest_time || "pegasus_rest_time", String(newSettings.restTime));

        // Active Split
        localStorage.setItem('pegasus_active_plan', newSettings.activeSplit);

        // Muscle Targets
        localStorage.setItem(
            w.muscleTargets || "pegasus_muscle_targets",
            JSON.stringify(newSettings.muscleTargets)
        );

        window.applyPegasusRuntimeSettings(newSettings);

        if (window.PegasusEngine?.dispatch) {
            window.PegasusEngine.dispatch({
                type: "PLAN_CHANGED",
                payload: { planKey: newSettings.activeSplit }
            });
        }

        if (window.PegasusCloud?.push) window.PegasusCloud.push(true);

        alert("✅ Pegasus Settings: Συγχρονισμός ολοκληρώθηκε!");
        location.reload();
    } catch (err) {
        console.error("❌ PEGASUS SAVE FAILURE:", err);
        alert("Κρίσιμο σφάλμα κατά την αποθήκευση.");
    }
};

document.addEventListener("DOMContentLoaded", () => {
    window.applyPegasusRuntimeSettings(window.getPegasusSettings());
});
