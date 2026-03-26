/* ==========================================================================
   PEGASUS SETTINGS ENGINE - v4.0 (MODULAR / FULLY DECOUPLED)
   Protocol: Strict Data Analyst - NaN Corruption Guard & Encapsulated Profile
   ========================================================================== */

const PegasusSettings = (function() {
    // 1. ΙΔΙΩΤΙΚΕΣ ΣΤΑΘΕΡΕΣ & ΠΡΟΕΠΙΛΟΓΕΣ (Private Configuration)
    // Σταθερό προφίλ χρήστη ως Fallback
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

    // 2. ΕΣΩΤΕΡΙΚΕΣ ΛΕΙΤΟΥΡΓΙΕΣ (Private Methods)
    const getSettings = () => {
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
            console.error("[PEGASUS SETTINGS]: Parse error. Returning defaults.", e);
            return DEFAULT_SETTINGS;
        }
    };

    const openPanel = () => {
        const panel = document.getElementById("settingsPanel");
        if (!panel) return;
        
        const current = getSettings();
        
        // Φόρτωση τιμών στα πεδία
        const fields = {
            "weightInput": current.weight,
            "heightInput": current.height,
            "ageInput": current.age,
            "goalKcalInput": current.goalKcal,
            "goalProteinInput": current.goalProtein,
            "exerciseTimeInput": current.exTime,
            "restTimeInput": current.restTime
        };

        for (const [id, value] of Object.entries(fields)) {
            const el = document.getElementById(id);
            if (el) el.value = value;
        }

        // Φόρτωση Muscle Targets
        ["Στήθος", "Πλάτη", "Πόδια", "Χέρια", "Ώμοι", "Κορμός"].forEach(m => {
            const el = document.getElementById(`target${m}Input`);
            if (el) el.value = current.muscleTargets[m] || DEFAULT_SETTINGS.muscleTargets[m];
        });

        panel.style.display = "block";
    };

    const closePanel = () => {
        const panel = document.getElementById("settingsPanel");
        if (panel) panel.style.display = "none";
    };

    const saveSettings = () => {
        try {
            // NaN CORRUPTION GUARD: Έλεγχος και Fallback πριν την εγγραφή
            const safeParseFloat = (id, fallback) => {
                const el = document.getElementById(id);
                const val = el ? parseFloat(el.value) : NaN;
                return isNaN(val) ? fallback : val;
            };
            const safeParseInt = (id, fallback) => {
                const el = document.getElementById(id);
                const val = el ? parseInt(el.value) : NaN;
                return isNaN(val) ? fallback : val;
            };

            localStorage.setItem("pegasus_weight", safeParseFloat("weightInput", DEFAULT_SETTINGS.weight));
            localStorage.setItem("pegasus_height", safeParseFloat("heightInput", DEFAULT_SETTINGS.height));
            localStorage.setItem("pegasus_age", safeParseInt("ageInput", DEFAULT_SETTINGS.age));
            localStorage.setItem("pegasus_goal_kcal", safeParseInt("goalKcalInput", DEFAULT_SETTINGS.goalKcal));
            localStorage.setItem("pegasus_goal_protein", safeParseInt("goalProteinInput", DEFAULT_SETTINGS.goalProtein));
            localStorage.setItem("pegasus_ex_time", safeParseInt("exerciseTimeInput", DEFAULT_SETTINGS.exTime));
            localStorage.setItem("pegasus_rest_time", safeParseInt("restTimeInput", DEFAULT_SETTINGS.restTime));

            // Δυναμική Αποθήκευση Στόχων Μυϊκών Ομάδων
            const targets = {};
            ["Στήθος", "Πλάτη", "Πόδια", "Χέρια", "Ώμοι", "Κορμός"].forEach(m => {
                const el = document.getElementById(`target${m}Input`);
                let parsedVal = el ? parseInt(el.value) : NaN;
                targets[m] = isNaN(parsedVal) ? (DEFAULT_SETTINGS.muscleTargets[m] || 14) : parsedVal;
            });
            localStorage.setItem("pegasus_muscle_targets", JSON.stringify(targets));

            closePanel();

            // Συγχρονισμός με το Cloud (Αν είναι διαθέσιμο)
            if (window.PegasusCloud && window.PegasusCloud.hasSuccessfullyPulled) {
                window.PegasusCloud.push(true);
            }

            console.log("[PEGASUS SETTINGS]: Settings saved safely. Reloading required.");
            window.location.reload(); 
        } catch (err) {
            console.error("[PEGASUS SETTINGS]: Save Error:", err);
            alert("Σφάλμα κατά την αποθήκευση. Δες την κονσόλα.");
        }
    };

    const initListeners = () => {
        // Αντικατάσταση inline onclicks από τα κουμπιά του DOM
        const btnSave = document.getElementById("btnSaveSettings");
        if (btnSave) {
            btnSave.removeAttribute('onclick');
            btnSave.addEventListener('click', saveSettings);
        }

        const btnOpen = document.getElementById("btnOpenSettings");
        if (btnOpen) {
            btnOpen.removeAttribute('onclick');
            btnOpen.addEventListener('click', openPanel);
        }
        
        // Διασύνδεση με το κουμπί κλεισίματος
        const btnCloseList = document.querySelectorAll('#settingsPanel .close-btn');
        btnCloseList.forEach(btn => {
            btn.addEventListener('click', closePanel);
        });
    };

    // 3. PUBLIC API
    return {
        init: initListeners,
        get: getSettings,
        open: openPanel,
        close: closePanel,
        save: saveSettings,
        defaults: DEFAULT_SETTINGS
    };
})();

// Εξαγωγή στο Window Scope
window.addEventListener('DOMContentLoaded', PegasusSettings.init);
window.getPegasusSettings = PegasusSettings.get;
window.openSettings = PegasusSettings.open;