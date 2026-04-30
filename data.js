/* ==========================================================================
   📦 PEGASUS DATA ENGINE - v17.6 (PEGASUS 134 PUSH/PULL/CYCLING SPLIT)
   Protocol: 10" Prep | 45" Work | 60" Rest
   Status: PRODUCTION READY (Final Mapping)
   ========================================================================== */

var M = M || window.PegasusManifest;

// 1. DEFAULT PLAN (Rest & Stretching Days)
window.program = {
    "Δευτέρα": [{ name: "Stretching", sets: 1, muscleGroup: "None", weight: "0" }],
    "Τρίτη": [], "Τετάρτη": [],
    "Πέμπτη": [{ name: "Stretching", sets: 1, muscleGroup: "None", weight: "0" }],
    "Παρασκευή": [], "Σάββατο": [], "Κυριακή": []
};

// 2. MASTER EXERCISES DATABASE (RE-MAPPED)
window.exercisesDB = [
    { name: "Chest Press", muscleGroup: "Στήθος" },
    { name: "Chest Flys", muscleGroup: "Στήθος" },
    { name: "Pushups", muscleGroup: "Στήθος" },
    { name: "Lat Pulldowns", muscleGroup: "Πλάτη" },
    { name: "Lat Pulldowns Close", muscleGroup: "Πλάτη" },
    { name: "Seated Rows", muscleGroup: "Πλάτη" }, // Πρώην Low Rows Seated
    { name: "Low Rows Seated", muscleGroup: "Πλάτη" }, // Πρώην Reverse Grip Cable Row
    { name: "Bent Over Rows", muscleGroup: "Πλάτη" },
    { name: "Straight Arm Pulldowns", muscleGroup: "Πλάτη" },
    { name: "Upright Rows", muscleGroup: "Ώμοι" },
    { name: "Bicep Curls", muscleGroup: "Χέρια" },
    { name: "Standing Bicep Curls", muscleGroup: "Χέρια" },
    { name: "Preacher Bicep Curls", muscleGroup: "Χέρια" },
    { name: "Tricep Pulldowns", muscleGroup: "Χέρια" },
    { name: "Ab Crunches", muscleGroup: "Κορμός" },
    { name: "Situps", muscleGroup: "Κορμός" },
    { name: "Plank", muscleGroup: "Κορμός" },
    { name: "Reverse Crunch", muscleGroup: "Κορμός" },
    { name: "Lying Knee Raise", muscleGroup: "Κορμός" },
    { name: "Leg Raise Hip Lift", muscleGroup: "Κορμός" },
    { name: "Leg Extensions", muscleGroup: "Πόδια" },
    { name: "Cycling", muscleGroup: "Πόδια" },
    { name: "EMS Training", muscleGroup: "Πλάτη" },
    { name: "Stretching", muscleGroup: "None" }
];

// 3. ASSET MAPPING (VIDEO SYNC)
window.videoMap = {
    "Chest Press": "chestpress",
    "Chest Flys": "chestflys",
    "Pushups": "pushups",
    "Lat Pulldowns": "latpulldowns",
    "Lat Pulldowns Close": "latpulldownsclose",
    "Seated Rows": "reverseseatedrows", // Παίζει το βίντεο reverseseatedrows
    "Low Rows Seated": "lowrowsseated", // Παίζει το βίντεο lowrowsseated
    "Bent Over Rows": "bentoverrows",
    "Straight Arm Pulldowns": "straightarmpulldowns",
    "Upright Rows": "uprightrows",
    "Bicep Curls": "bicepcurls",
    "Standing Bicep Curls": "bicepcurls",
    "Preacher Bicep Curls": "preacherbicepcurls",
    "Tricep Pulldowns": "triceppulldowns",
    "Ab Crunches": "abcrunches",
    "Situps": "situps",
    "Plank": "plank",
    "Reverse Crunch": "reversecrunch",
    "Lying Knee Raise": "lyingkneeraise",
    "Leg Raise Hip Lift": "legraisehiplift",
    "Leg Extensions": "legextensions",
    "Cycling": "cycling",
    "EMS Training": "ems",
    "Stretching": "stretching"
};

// 4. PEGASUS ENGINE (PROGRAMS REBALANCED FOR ABS PRIORITY & CYCLING)
window.getPegasusActivePlan = function() {
    return localStorage.getItem('pegasus_active_plan') || 'IRON';
};

window.openPegasusPlanModal = window.openPegasusPlanModal || function() {
    const modal = document.getElementById('planModal');
    if (!modal) {
        console.warn('⚠️ PEGASUS PLAN: planModal not found.');
        return false;
    }
    document.querySelectorAll?.('.pegasus-panel, #emsModal')?.forEach(panel => {
        if (panel !== modal) panel.style.display = 'none';
    });
    modal.style.display = 'block';
    modal.style.zIndex = '10050';
    return true;
};

window.closePegasusPlanModal = window.closePegasusPlanModal || function() {
    const modal = document.getElementById('planModal');
    if (modal) modal.style.display = 'none';
};

window.setPegasusPlan = function(planKey) {
    const allowedPlans = ['IRON', 'EMS_ONLY', 'BIKE_ONLY', 'HYBRID'];
    const nextPlan = allowedPlans.includes(planKey) ? planKey : 'IRON';

    localStorage.setItem('pegasus_active_plan', nextPlan);

    try {
        const settingsKey = window.PegasusManifest?.settings?.main || 'pegasus_settings';
        const settings = JSON.parse(localStorage.getItem(settingsKey) || '{}');
        settings.activeSplit = nextPlan;
        localStorage.setItem(settingsKey, JSON.stringify(settings));
    } catch (e) {
        console.warn('⚠️ PEGASUS PLAN: settings activeSplit sync skipped.', e);
    }

    if (window.PegasusEngine?.dispatch) {
        try {
            window.PegasusEngine.dispatch({
                type: 'PLAN_CHANGED',
                payload: { planKey: nextPlan }
            });
        } catch (e) {
            console.warn('⚠️ PEGASUS PLAN: engine dispatch skipped.', e);
        }
    }

    try { window.closePegasusPlanModal?.(); } catch (e) {}

    if (window.PegasusCloud?.push) {
        try { window.PegasusCloud.push(true); } catch (e) { console.warn('⚠️ PEGASUS PLAN: cloud push skipped.', e); }
    }

    setTimeout(() => window.location.reload(), 350);
};

(function installPegasusPlanButtonFallback() {
    function bind() {
        const btn = document.getElementById('btnPlanSelector');
        if (!btn || btn.__pegasusPlanBound) return;
        btn.__pegasusPlanBound = true;
        btn.addEventListener('click', function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            window.openPegasusPlanModal?.();
        }, true);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind, { once: true });
    } else {
        bind();
    }
    window.addEventListener('load', bind, { once: true });
})();

(function applyPegasusSplit() {
    const activePlan = window.getPegasusActivePlan();
    const days = {
        // PEGASUS 134: 3 βασικές προπονήσεις + προαιρετικό Σ/Κ catch-up.
        // Πόδια: μόνο cycling credit Σάββατο/Κυριακή, χωρίς leg filler ασκήσεις.
        iron_tuesday: [
            { name: "Chest Press", sets: 5, muscleGroup: "Στήθος", weight: "54" },
            { name: "Chest Flys", sets: 3, muscleGroup: "Στήθος", weight: "42" },
            { name: "Pushups", sets: 3, muscleGroup: "Στήθος", weight: "0" },
            { name: "Upright Rows", sets: 4, muscleGroup: "Ώμοι", weight: "30" },
            { name: "Tricep Pulldowns", sets: 4, muscleGroup: "Χέρια", weight: "20" },
            { name: "Ab Crunches", sets: 3, muscleGroup: "Κορμός", weight: "30" },
            { name: "Leg Raise Hip Lift", sets: 3, muscleGroup: "Κορμός", weight: "0" }
        ],
        iron_wednesday: [
            { name: "Lat Pulldowns", sets: 4, muscleGroup: "Πλάτη", weight: "36" },
            { name: "Seated Rows", sets: 4, muscleGroup: "Πλάτη", weight: "66" },
            { name: "Bicep Curls", sets: 4, muscleGroup: "Χέρια", weight: "30" },
            { name: "Lying Knee Raise", sets: 3, muscleGroup: "Κορμός", weight: "0" },
            { name: "Reverse Crunch", sets: 3, muscleGroup: "Κορμός", weight: "0" }
        ],
        iron_friday: [
            { name: "Chest Press", sets: 5, muscleGroup: "Στήθος", weight: "54" },
            { name: "Lat Pulldowns Close", sets: 4, muscleGroup: "Πλάτη", weight: "36" },
            { name: "Low Rows Seated", sets: 4, muscleGroup: "Πλάτη", weight: "36" },
            { name: "Upright Rows", sets: 4, muscleGroup: "Ώμοι", weight: "30" },
            { name: "Bicep Curls", sets: 3, muscleGroup: "Χέρια", weight: "30" },
            { name: "Tricep Pulldowns", sets: 3, muscleGroup: "Χέρια", weight: "20" },
            { name: "Plank", sets: 3, muscleGroup: "Κορμός", weight: "0" },
            { name: "Ab Crunches", sets: 3, muscleGroup: "Κορμός", weight: "30" }
        ],
        iron_saturday: [
            { name: "Cycling", sets: 1, muscleGroup: "Πόδια", weight: "0" }
        ],
        iron_sunday: [
            { name: "Cycling", sets: 1, muscleGroup: "Πόδια", weight: "0" },
            { name: "Upright Rows", sets: 4, muscleGroup: "Ώμοι", weight: "30" }
        ],
        ems_wednesday: [
            { name: "EMS Training", sets: 1, muscleGroup: "Πλάτη", weight: "0" },
            { name: "Upright Rows", sets: 3, muscleGroup: "Ώμοι", weight: "30" },
            { name: "Bicep Curls", sets: 3, muscleGroup: "Χέρια", weight: "30" },
            { name: "Tricep Pulldowns", sets: 3, muscleGroup: "Χέρια", weight: "20" },
            { name: "Lying Knee Raise", sets: 3, muscleGroup: "Κορμός", weight: "0" },
            { name: "Plank", sets: 3, muscleGroup: "Κορμός", weight: "0" }
        ],
        ems_only_sunday: [
            { name: "Chest Press", sets: 3, muscleGroup: "Στήθος", weight: "54" },
            { name: "Lat Pulldowns Close", sets: 3, muscleGroup: "Πλάτη", weight: "36" },
            { name: "Standing Bicep Curls", sets: 3, muscleGroup: "Χέρια", weight: "30" },
            { name: "Tricep Pulldowns", sets: 3, muscleGroup: "Χέρια", weight: "20" },
            { name: "Leg Raise Hip Lift", sets: 4, muscleGroup: "Κορμός", weight: "0" },
            { name: "Reverse Crunch", sets: 3, muscleGroup: "Κορμός", weight: "0" }
        ],
        bike_only_tuesday: [
            { name: "Chest Press", sets: 5, muscleGroup: "Στήθος", weight: "54" },
            { name: "Chest Flys", sets: 3, muscleGroup: "Στήθος", weight: "42" },
            { name: "Pushups", sets: 3, muscleGroup: "Στήθος", weight: "0" },
            { name: "Upright Rows", sets: 4, muscleGroup: "Ώμοι", weight: "30" },
            { name: "Ab Crunches", sets: 3, muscleGroup: "Κορμός", weight: "30" },
            { name: "Plank", sets: 3, muscleGroup: "Κορμός", weight: "0" }
        ],
        bike_only_wednesday: [
            { name: "Lat Pulldowns", sets: 4, muscleGroup: "Πλάτη", weight: "36" },
            { name: "Seated Rows", sets: 4, muscleGroup: "Πλάτη", weight: "66" },
            { name: "Bicep Curls", sets: 4, muscleGroup: "Χέρια", weight: "30" },
            { name: "Tricep Pulldowns", sets: 3, muscleGroup: "Χέρια", weight: "20" },
            { name: "Lying Knee Raise", sets: 3, muscleGroup: "Κορμός", weight: "0" },
            { name: "Reverse Crunch", sets: 3, muscleGroup: "Κορμός", weight: "0" }
        ],
        bike_only_friday: [
            { name: "Chest Press", sets: 5, muscleGroup: "Στήθος", weight: "54" },
            { name: "Lat Pulldowns Close", sets: 4, muscleGroup: "Πλάτη", weight: "36" },
            { name: "Low Rows Seated", sets: 4, muscleGroup: "Πλάτη", weight: "36" },
            { name: "Upright Rows", sets: 4, muscleGroup: "Ώμοι", weight: "30" },
            { name: "Bicep Curls", sets: 3, muscleGroup: "Χέρια", weight: "30" },
            { name: "Leg Raise Hip Lift", sets: 3, muscleGroup: "Κορμός", weight: "0" }
        ],
        hybrid_tuesday: [
            { name: "Chest Press", sets: 5, muscleGroup: "Στήθος", weight: "54" },
            { name: "Chest Flys", sets: 3, muscleGroup: "Στήθος", weight: "42" },
            { name: "Lat Pulldowns", sets: 4, muscleGroup: "Πλάτη", weight: "36" },
            { name: "Seated Rows", sets: 3, muscleGroup: "Πλάτη", weight: "66" },
            { name: "Ab Crunches", sets: 4, muscleGroup: "Κορμός", weight: "30" },
            { name: "Plank", sets: 3, muscleGroup: "Κορμός", weight: "0" }
        ],
        hybrid_friday: [
            { name: "Pushups", sets: 4, muscleGroup: "Στήθος", weight: "0" },
            { name: "Upright Rows", sets: 4, muscleGroup: "Ώμοι", weight: "30" },
            { name: "Bicep Curls", sets: 3, muscleGroup: "Χέρια", weight: "30" },
            { name: "Tricep Pulldowns", sets: 3, muscleGroup: "Χέρια", weight: "20" },
            { name: "Low Rows Seated", sets: 3, muscleGroup: "Πλάτη", weight: "36" },
            { name: "Leg Raise Hip Lift", sets: 4, muscleGroup: "Κορμός", weight: "0" }
        ],
        bike_saturday: [
            { name: "Cycling", sets: 1, muscleGroup: "Πόδια", weight: "0" }
        ],
        bike_sunday: [
            { name: "Cycling", sets: 1, muscleGroup: "Πόδια", weight: "0" },
            { name: "Upright Rows", sets: 4, muscleGroup: "Ώμοι", weight: "30" }
        ]
    };

    if (activePlan === 'IRON') {
        window.program["Τρίτη"] = days.iron_tuesday;
        window.program["Τετάρτη"] = days.iron_wednesday;
        window.program["Παρασκευή"] = days.iron_friday;
        window.program["Σάββατο"] = days.iron_saturday;
        window.program["Κυριακή"] = days.iron_sunday;
    } else if (activePlan === 'EMS_ONLY') {
        window.program["Τρίτη"] = days.iron_tuesday;
        window.program["Τετάρτη"] = days.ems_wednesday;
        window.program["Παρασκευή"] = days.iron_friday;
        window.program["Σάββατο"] = days.iron_saturday;
        window.program["Κυριακή"] = days.ems_only_sunday;
    } else if (activePlan === 'BIKE_ONLY') {
        window.program["Τρίτη"] = days.bike_only_tuesday;
        window.program["Τετάρτη"] = days.bike_only_wednesday;
        window.program["Παρασκευή"] = days.bike_only_friday;
        window.program["Σάββατο"] = days.bike_saturday;
        window.program["Κυριακή"] = days.bike_sunday;
    } else if (activePlan === 'HYBRID') {
        window.program["Τρίτη"] = days.hybrid_tuesday;
        window.program["Τετάρτη"] = days.ems_wednesday;
        window.program["Παρασκευή"] = days.hybrid_friday;
        window.program["Σάββατο"] = days.bike_saturday;
        window.program["Κυριακή"] = days.bike_sunday;
    }
})();;

// Shared helpers for engine / reporting / optimizer
window.getPegasusExerciseGroup = function(exerciseName) {
    const cleanName = String(exerciseName || "").trim().replace(" ☀️", "");
    const exact = window.exercisesDB.find(ex => ex.name === cleanName);
    if (exact) return exact.muscleGroup;

    const n = cleanName.toLowerCase();

    if (n.includes("chest") || n.includes("pushups")) return "Στήθος";
    if (n.includes("lat") || n.includes("row") || n.includes("pulldown") || n.includes("back")) return "Πλάτη";
    if (n.includes("upright") || n.includes("shoulder")) return "Ώμοι";
    if (n.includes("bicep") || n.includes("tricep") || n.includes("curl")) return "Χέρια";
    if (n.includes("ab") || n.includes("situp") || n.includes("plank") || n.includes("crunch") || n.includes("raise")) return "Κορμός";
    if (n.includes("leg") || n.includes("cycling")) return "Πόδια";
    if (n.includes("stretch")) return "None";
    if (n.includes("ems")) return "Πλάτη";

    return "Άλλο";
};

window.getPegasusProgramSnapshot = function(dayName) {
    if (dayName && Array.isArray(window.program?.[dayName])) {
        return window.program[dayName].map(ex => ({ ...ex }));
    }

    const snapshot = {};
    Object.keys(window.program || {}).forEach(day => {
        snapshot[day] = (window.program[day] || []).map(ex => ({ ...ex }));
    });
    return snapshot;
};


// 4.5 MUSCLE BADGE HELPERS (PEGASUS 134)
window.PegasusMuscleEmojiMap = {
    "Στήθος": "🟩",
    "Πλάτη": "🪽",
    "Πόδια": "🦵",
    "Χέρια": "💪",
    "Ώμοι": "🔺",
    "Κορμός": "🧱",
    "None": "🌿",
    "Άλλο": "▫️"
};

window.getPegasusMuscleEmoji = function(group) {
    return window.PegasusMuscleEmojiMap[group] || window.PegasusMuscleEmojiMap["Άλλο"];
};

window.getPegasusMuscleBadge = function(exerciseOrGroup) {
    const group = (typeof exerciseOrGroup === "string" && window.PegasusMuscleEmojiMap[exerciseOrGroup])
        ? exerciseOrGroup
        : window.getPegasusExerciseGroup(exerciseOrGroup?.name || exerciseOrGroup || "");
    if (!group || group === "None") return "";
    return `${window.getPegasusMuscleEmoji(group)} ${group}`;
};

// 5. KOUKI MENU CONSOLIDATION
window.PegasusKoukiDB = [
    { name: "Κοτόπουλο αλά κρεμ", type: "poulika", price: 6.00, kcal: 620, protein: 50 },
    { name: "Κοτόπουλο γλυκόξινο", type: "poulika", price: 6.00, kcal: 580, protein: 48 },
    { name: "Κοτόπουλο φούρνου", type: "poulika", price: 6.00, kcal: 600, protein: 52 },
    { name: "Μοσχάρι κοκκινιστό", type: "kreas", price: 6.50, kcal: 640, protein: 45 },
    { name: "Μοσχάρι γιουβέτσι", type: "kreas", price: 6.50, kcal: 620, protein: 45 },
    { name: "Μακαρόνια με κιμά", type: "carb", price: 5.50, kcal: 600, protein: 30 },
    { name: "Μουσακάς", type: "carb", price: 6.00, kcal: 830, protein: 26 },
    { name: "Παστίτσιο", type: "carb", price: 6.00, kcal: 750, protein: 35 },
    { name: "Κοτόσουπα", type: "soup", price: 4.50, kcal: 400, protein: 30 },
    { name: "Φασολάδα", type: "ospro", price: 4.50, kcal: 400, protein: 18 },
    { name: "Γίγαντες πλακί", type: "ospro", price: 6.00, kcal: 500, protein: 20 },
    { name: "Μπάμιες με κοτόπουλο", type: "poulika", price: 6.00, kcal: 520, protein: 45 },
    { name: "Φασολάκια", type: "ladero", price: 4.50, kcal: 350, protein: 8 },
    { name: "Μπακαλιάρος σκορδαλιά", type: "psari", price: 6.50, kcal: 550, protein: 35 },
    { name: "Μπιφτέκι μοσχαρίσιο", type: "kreas", price: 6.00, kcal: 500, protein: 45 },
    { name: "Μπριζόλα χοιρινή", type: "kreas", price: 6.00, kcal: 550, protein: 42 },
    { name: "Μπριζόλα μοσχαρίσια", type: "kreas", price: 8.50, kcal: 600, protein: 50 },
    { name: "Γεμιστά με ρύζι", type: "ladero", price: 5.00, kcal: 450, protein: 10 },
    { name: "Κανελόνια", type: "carb", price: 6.00, kcal: 700, protein: 28 },
    { name: "Αρακάς", type: "ladero", price: 4.50, kcal: 380, protein: 12 },
    { name: "Ρεβύθια πλακί", type: "ospro", price: 5.00, kcal: 480, protein: 19 },
    { name: "Γεμιστά με κιμά", type: "kreas", price: 6.00, kcal: 550, protein: 30 },
    { name: "Κεφτεδάκια τηγανητά", type: "kreas", price: 6.50, kcal: 600, protein: 35 },
    { name: "Γιουβαρλάκια", type: "kreas", price: 5.50, kcal: 520, protein: 32 },
    { name: "Σνίτσελ κοτόπουλο", type: "poulika", price: 6.00, kcal: 650, protein: 45 },
    { name: "Λαζάνια με κιμά", type: "carb", price: 6.00, kcal: 720, protein: 32 },
    { name: "Μπιφτέκι κοτόπουλο", type: "poulika", price: 6.00, kcal: 480, protein: 45 },
    { name: "Σολομός φούρνου", type: "psari", price: 8.00, kcal: 550, protein: 40 },
    { name: "Σουπιές με σπανάκι", type: "psari", price: 7.00, kcal: 450, protein: 35 },
    { name: "Γαριδομακαρονάδα", type: "psari", price: 6.50, kcal: 650, protein: 30 },
    { name: "Παπουτσάκια", type: "ladero", price: 6.00, kcal: 580, protein: 20 },
    { name: "Σουτζουκάκια", type: "kreas", price: 6.50, kcal: 620, protein: 35 },
    { name: "Αρνί με πατάτες", type: "kreas", price: 7.50, kcal: 750, protein: 45 },
    { name: "Πέρκα φούρνου", type: "psari", price: 7.00, kcal: 500, protein: 40 }
];

// 6. DYNAMIC WEEKLY BRIDGE & HELPERS
(function buildWeeklyMenu() {
    const rawMenu = {
        "Monday": ["Μουσακάς", "Παστίτσιο", "Μπακαλιάρος σκορδαλιά", "Κοτόσουπα", "Μοσχάρι κοκκινιστό", "Μοσχάρι γιουβέτσι", "Γεμιστά με ρύζι", "Φασολάδα", "Γίγαντες πλακί", "Μπάμιες με κοτόπουλο", "Μακαρόνια με κιμά", "Φασολάκια", "Κοτόπουλο αλά κρεμ", "Κοτόπουλο γλυκόξινο", "Κοτόπουλο φούρνου", "Μπριζόλα χοιρινή", "Μπριζόλα μοσχαρίσια", "Μπιφτέκι μοσχαρίσιο"],
        "Tuesday": ["Μουσακάς", "Παστίτσιο", "Κανελόνια", "Αρακάς", "Ρεβύθια πλακί", "Γεμιστά με κιμά", "Μοσχάρι κοκκινιστό", "Κεφτεδάκια τηγανητά", "Γιουβαρλάκια", "Μακαρόνια με κιμά", "Σνίτσελ κοτόπουλο", "Κοτόπουλο αλά κρεμ", "Κοτόπουλο γλυκόξινο", "Κοτόπουλο φούρνου", "Μπριζόλα χοιρινή", "Μπριζόλα μοσχαρίσια"],
        "Wednesday": ["Μουσακάς", "Παστίτσιο", "Λαζάνια με κιμά", "Μπιφτέκι κοτόπουλο", "Μακαρόνια με κιμά", "Γεμιστά με ρύζι", "Μοσχάρι κοκκινιστό", "Μοσχάρι γιουβέτσι", "Σολομός φούρνου", "Κοτόπουλο φούρνου", "Κοτόπουλο αλά κρεμ", "Κοτόπουλο γλυκόξινο"],
        "Thursday": ["Μουσακάς", "Παστίτσιο", "Κανελόνια", "Κεφτεδάκια τηγανητά", "Γεμιστά με κιμά", "Σουπιές με σπανάκι", "Φασολάκια", "Κοτόσουπα", "Γαριδομακαρονάδα", "Μοσχάρι κοκκινιστό", "Μακαρόνια με κιμά", "Κοτόπουλο φούρνου", "Μπριζόλα χοιρινή", "Μπριζόλα μοσχαρίσια"],
        "Friday": ["Μουσακάς", "Παστίτσιο", "Μπακαλιάρος σκορδαλιά", "Παπουτσάκια", "Φασολάδα", "Γεμιστά με ρύζι", "Γίγαντες πλακί", "Μοσχάρι γιουβέτσι", "Μοσχάρι κοκκινιστό", "Κοτόπουλο φούρνου", "Μακαρόνια με κιμά", "Σουτζουκάκια", "Κοτόσουπα", "Κοτόπουλο αλά κρεμ", "Κοτόπουλο γλυκόξινο"],
        "Saturday": ["Μουσακάς", "Παστίτσιο", "Γεμιστά με ρύζι", "Μπιφτέκι κοτόπουλο", "Γιουβαρλάκια", "Αρνί με πατάτες", "Μοσχάρι γιουβέτσι", "Κοτόπουλο φούρνου", "Μοσχάρι κοκκινιστό", "Μακαρόνια με κιμά"],
        "Sunday": ["Μουσακάς", "Παστίτσιο", "Κανελόνια", "Μοσχάρι γιουβέτσι", "Μοσχάρι κοκκινιστό", "Κοτόσουπα", "Πέρκα φούρνου", "Κεφτεδάκια τηγανητά", "Γαριδομακαρονάδα", "Μακαρόνια με κιμά", "Κοτόπουλο φούρνου", "Μπριζόλα χοιρινή", "Μπριζόλα μοσχαρίσια"]
    };

    window.KOUKI_MASTER_MENU = {};
    for (const day in rawMenu) {
        window.KOUKI_MASTER_MENU[day] = rawMenu[day].map(foodName => {
            const data = window.PegasusKoukiDB.find(f => f.name === foodName) || { price: 6.00, type: "kreas" };
            return { n: foodName, p: data.price, t: data.type };
        });
    }
})();

window.getPegasusMacros = function(foodName, fallbackType) {
    const item = window.PegasusKoukiDB.find(f => f.name === foodName || f.name.includes(foodName));
    const type = item ? item.type : fallbackType;
    const needsRice = !["carb", "soup"].includes(type);
    const riceKcal = needsRice ? 280 : 0;
    const riceProt = needsRice ? 6 : 0;

    if (item) {
        return {
            kcal: item.kcal + riceKcal,
            protein: item.protein + riceProt
        };
    }

    let p = (type === 'kreas' || type === 'poulika') ? 45 : (type === 'ospro' ? 18 : 25);
    return { kcal: 550 + riceKcal, protein: p + riceProt };
};

window.getDynamicTargets = function() {
    const fallbackTargets = { "Στήθος": 16, "Πλάτη": 16, "Ώμοι": 12, "Χέρια": 14, "Πόδια": 24, "Κορμός": 18 };
    try {
        const key = window.PegasusManifest?.workout?.muscleTargets || "pegasus_muscle_targets";
        const stored = JSON.parse(localStorage.getItem(key) || "null");
        return stored && typeof stored === "object" ? { ...fallbackTargets, ...stored } : fallbackTargets;
    } catch (e) {
        return fallbackTargets;
    }
};
