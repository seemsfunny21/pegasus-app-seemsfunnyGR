/* ==========================================================================
   PEGASUS SETTINGS ENGINE - v4.4 (STRICT AUDIT & MANIFEST SYNC)
   Protocol: Strict Data Analyst - Zero Logic Loss - Cross-File Sync
   Status: FINAL STABLE | FIXED: MANIFEST INTEGRATION & BMR OVERWRITE
   ========================================================================== */

const M = window.PegasusManifest;
if (!M) console.error("❌ CRITICAL: PegasusManifest missing in settings.js");

const DEFAULT_SETTINGS = {
    weight: 74, height: 187, age: 38, gender: 'male',
    goalKcal: 2800, goalProtein: 160, exTime: 45, restTime: 60,
    muscleTargets: { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 }
};

/**
 * 1. GLOBAL ACCESSOR (Safe Load via Manifest)
 * Διασφαλίζει ότι καμία τιμή δεν θα επιστρέψει null στο UI
 */
window.getPegasusSettings = function() {
    try {
        const u = M?.user || {};
        const p = M?.performance || {};
        const storedTargetsStr = localStorage.getItem(M?.workout?.muscle_targets || "pegasus_muscle_targets");
        
        // 🎯 FIXED: Ασφαλής Parse του JSON
        let storedTargets = null;
        if (storedTargetsStr) {
            try { storedTargets = JSON.parse(storedTargetsStr); } catch (e) { }
        }

        return {
            weight: parseFloat(localStorage.getItem(u.weight || "pegasus_weight")) || DEFAULT_SETTINGS.weight,
            height: parseFloat(localStorage.getItem(u.height || "pegasus_height")) || DEFAULT_SETTINGS.height,
            age: parseInt(localStorage.getItem(u.age || "pegasus_age")) || DEFAULT_SETTINGS.age,
            gender: localStorage.getItem(u.gender || "pegasus_gender") || DEFAULT_SETTINGS.gender,
            goalKcal: parseInt(localStorage.getItem(p.target_kcal || "pegasus_goal_kcal")) || DEFAULT_SETTINGS.goalKcal,
            goalProtein: parseInt(localStorage.getItem(p.target_protein || "pegasus_goal_protein")) || DEFAULT_SETTINGS.goalProtein,
            exTime: parseInt(localStorage.getItem(M?.workout?.ex_time || "pegasus_ex_time")) || DEFAULT_SETTINGS.exTime,
            restTime: parseInt(localStorage.getItem(M?.workout?.rest_time || "pegasus_rest_time")) || DEFAULT_SETTINGS.restTime,
            muscleTargets: storedTargets || DEFAULT_SETTINGS.muscleTargets
        };
    } catch (e) { 
        console.warn("PEGASUS: Settings corruption detected, using defaults.", e);
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
    const bmrDisplay = document.getElementById("maintenanceKcalDisplay"); // Υποθετικό UI στοιχείο αν προστεθεί

    if (!w || !h || !a) return;

    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    bmr = (g === "male") ? bmr + 5 : bmr - 161;
    const tdee = Math.round(bmr * 1.55);
    
    // 🎯 FIXED: Δεν κάνουμε overwrite τον στόχο θερμίδων (γιατί κάνεις όγκο 2800)
    // Εμφανίζουμε απλά την TDEE αν υπάρχει αντίστοιχο στοιχείο στο UI
    if (bmrDisplay) {
        bmrDisplay.textContent = `Maintenance (TDEE): ${tdee} kcal`;
    }
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

    for (let id in fields) {
        const el = document.getElementById(id);
        if (el) {
            el.value = fields[id];
        }
    }

    ["Στήθος", "Πλάτη", "Πόδια", "Χέρια", "Ώμοι", "Κορμός"].forEach(m => {
        const el = document.getElementById(`target${m}Input`);
        if (el) el.value = s.muscleTargets[m] || DEFAULT_SETTINGS.muscleTargets[m];
    });

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
        console.log("🛡️ PEGASUS: Executing Tactical Settings Save...");

        const u = M?.user || {};
        const p = M?.performance || {};
        const w = M?.workout || {};

        // 🎯 FIXED: Ασφαλής ανάγνωση τιμών από το DOM
        const getValue = (id, fallback) => {
            const el = document.getElementById(id);
            return el && el.value ? el.value : fallback;
        };

        localStorage.setItem(u.weight || "pegasus_weight", getValue("userWeightInput", DEFAULT_SETTINGS.weight));
        localStorage.setItem(u.height || "pegasus_height", getValue("userHeightInput", DEFAULT_SETTINGS.height));
        localStorage.setItem(u.age || "pegasus_age", getValue("userAgeInput", DEFAULT_SETTINGS.age));
        localStorage.setItem(u.gender || "pegasus_gender", getValue("userGenderInput", DEFAULT_SETTINGS.gender));
        
        localStorage.setItem(p.target_kcal || "pegasus_goal_kcal", getValue("goalKcalInput", DEFAULT_SETTINGS.goalKcal));
        localStorage.setItem(p.target_protein || "pegasus_goal_protein", getValue("goalProteinInput", DEFAULT_SETTINGS.goalProtein));
        
        localStorage.setItem(w.ex_time || "pegasus_ex_time", getValue("exerciseTimeInput", DEFAULT_SETTINGS.exTime));
        localStorage.setItem(w.rest_time || "pegasus_rest_time", getValue("restTimeInput", DEFAULT_SETTINGS.restTime));

        const targets = {};
        ["Στήθος", "Πλάτη", "Πόδια", "Χέρια", "Ώμοι", "Κορμός"].forEach(m => {
            const el = document.getElementById(`target${m}Input`);
            const val = el ? parseInt(el.value) : NaN;
            targets[m] = isNaN(val) ? DEFAULT_SETTINGS.muscleTargets[m] : val;
        });
        localStorage.setItem(w.muscle_targets || "pegasus_muscle_targets", JSON.stringify(targets));

        if (window.PegasusCloud && typeof window.PegasusCloud.push === "function") {
            window.PegasusCloud.push(true);
        }

        alert("✅ Ρυθμίσεις Αποθηκεύτηκαν Επιτυχώς!");
        location.reload();
    } catch (err) {
        console.error("❌ CRITICAL ERROR IN SAVE:", err);
        alert("Σφάλμα κατά την αποθήκευση των ρυθμίσεων.");
    }
};
