/* ==========================================================================
   📦 PEGASUS DATA ENGINE - v17.0 (ULTIMATE IRON - 45' PRECISION)
   Protocol: 10" Prep | 45" Work (TUT) | 60" Rest | Total: 1'55" / Set
   Status: PRODUCTION READY - FULL RECONCILIATION
   ========================================================================== */

var M = M || window.PegasusManifest;

// 1. DEFAULT PLAN (Rest & Stretching Days)
window.program = {
    "Δευτέρα": [ { name: "Stretching", sets: 1, muscleGroup: "None", weight: "0" } ],
    "Τρίτη": [], "Τετάρτη": [], 
    "Πέμπτη": [ { name: "Stretching", sets: 1, muscleGroup: "None", weight: "0" } ],
    "Παρασκευή": [], "Σάββατο": [], "Κυριακή": []
};

// 2. MASTER EXERCISES DATABASE (26 UNIQUE ENTRIES)
window.exercisesDB = [
    { name: "Chest Press", muscleGroup: "Στήθος" }, 
    { name: "Chest Flys", muscleGroup: "Στήθος" }, 
    { name: "Pushups", muscleGroup: "Στήθος" },
    { name: "Lat Pulldowns", muscleGroup: "Πλάτη" }, 
    { name: "Lat Pulldowns Close", muscleGroup: "Πλάτη" }, 
    { name: "Low Rows Seated", muscleGroup: "Πλάτη" }, 
    { name: "Bent Over Rows", muscleGroup: "Πλάτη" },
    { name: "Reverse Grip Cable Row", muscleGroup: "Πλάτη" },
    { name: "Straight Arm Pulldowns", muscleGroup: "Πλάτη" },
    { name: "Upright Rows", muscleGroup: "Ώμοι" },
    { name: "Reverse Flys", muscleGroup: "Ώμοι" },
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

// 3. ASSET MAPPING (Video & Icon Linking)
window.videoMap = {
    "Chest Press": "chestpress", "Chest Flys": "chestflys", "Pushups": "pushups",
    "Lat Pulldowns": "latpulldowns", "Lat Pulldowns Close": "latpulldownsclose",
    "Low Rows Seated": "lowrowsseated", "Bent Over Rows": "bentoverrows", 
    "Reverse Grip Cable Row": "reversegripcablerow", "Straight Arm Pulldowns": "straightarmpulldowns",
    "Upright Rows": "uprightrows", "Reverse Flys": "chestflys", 
    "Bicep Curls": "bicepcurls", "Standing Bicep Curls": "bicepcurls", 
    "Preacher Bicep Curls": "preacherbicepcurls", "Tricep Pulldowns": "triceppulldowns",
    "Ab Crunches": "abcrunches", "Situps": "situps", "Plank": "plank",
    "Reverse Crunch": "reversecrunch", "Lying Knee Raise": "lyingkneeraise",
    "Leg Raise Hip Lift": "legraisehiplift", "Leg Extensions": "legextensions",
    "Cycling": "cycling", "EMS Training": "ems", "Stretching": "stretching"
};

// 4. PEGASUS 4-PILLAR SPLIT ENGINE
window.setPegasusPlan = function(planKey) {
    localStorage.setItem('pegasus_active_plan', planKey);
    setTimeout(() => window.location.reload(), 1000);
};

(function applyPegasusSplit() {
    const activePlan = localStorage.getItem('pegasus_active_plan') || 'IRON';
    const days = {
        iron_tuesday: [
            { name: "Chest Press", sets: 6, muscleGroup: "Στήθος", weight: "54" },
            { name: "Chest Flys", sets: 5, muscleGroup: "Στήθος", weight: "42" },
            { name: "Lat Pulldowns", sets: 6, muscleGroup: "Πλάτη", weight: "36" },
            { name: "Low Rows Seated", sets: 5, muscleGroup: "Πλάτη", weight: "66" },
            { name: "Ab Crunches", sets: 5, muscleGroup: "Κορμός", weight: "30" }
        ],
        iron_wednesday: [
            { name: "Upright Rows", sets: 5, muscleGroup: "Ώμοι", weight: "30" },
            { name: "Reverse Flys", sets: 4, muscleGroup: "Ώμοι", weight: "24" },
            { name: "Bicep Curls", sets: 6, muscleGroup: "Χέρια", weight: "30" },
            { name: "Tricep Pulldowns", sets: 6, muscleGroup: "Χέρια", weight: "20" },
            { name: "Preacher Bicep Curls", sets: 5, muscleGroup: "Χέρια", weight: "30" },
            { name: "Lying Knee Raise", sets: 4, muscleGroup: "Κορμός", weight: "0" }
        ],
        iron_friday: [
            { name: "Lat Pulldowns Close", sets: 5, muscleGroup: "Πλάτη", weight: "36" },
            { name: "Straight Arm Pulldowns", sets: 5, muscleGroup: "Πλάτη", weight: "30" },
            { name: "Reverse Grip Cable Row", sets: 5, muscleGroup: "Πλάτη", weight: "36" },
            { name: "Bent Over Rows", sets: 5, muscleGroup: "Πλάτη", weight: "30" },
            { name: "Pushups", sets: 5, muscleGroup: "Στήθος", weight: "0" },
            { name: "Reverse Crunch", sets: 4, muscleGroup: "Κορμός", weight: "0" }
        ],
        iron_saturday: [
            { name: "Leg Extensions", sets: 8, muscleGroup: "Πόδια", weight: "36" },
            { name: "Situps", sets: 6, muscleGroup: "Κορμός", weight: "0" },
            { name: "Ab Crunches", sets: 6, muscleGroup: "Κορμός", weight: "30" },
            { name: "Plank", sets: 5, muscleGroup: "Κορμός", weight: "0" }
        ],
        iron_sunday: [
            { name: "Chest Press", sets: 5, muscleGroup: "Στήθος", weight: "54" },
            { name: "Low Rows Seated", sets: 5, muscleGroup: "Πλάτη", weight: "66" },
            { name: "Standing Bicep Curls", sets: 5, muscleGroup: "Χέρια", weight: "30" },
            { name: "Tricep Pulldowns", sets: 5, muscleGroup: "Χέρια", weight: "20" },
            { name: "Leg Raise Hip Lift", sets: 5, muscleGroup: "Κορμός", weight: "0" }
        ],
        ems_wednesday: [
            { name: "EMS Training", sets: 1, muscleGroup: "Πλάτη", weight: "0" },
            { name: "Upright Rows", sets: 4, muscleGroup: "Ώμοι", weight: "30" },
            { name: "Bicep Curls", sets: 4, muscleGroup: "Χέρια", weight: "30" },
            { name: "Plank", sets: 5, muscleGroup: "Κορμός", weight: "0" }
        ],
        bike_weekend: [
            { name: "Cycling", sets: 1, muscleGroup: "Πόδια", weight: "0" },
            { name: "Ab Crunches", sets: 4, muscleGroup: "Κορμός", weight: "0" }
        ]
    };

    if (activePlan === 'IRON') {
        window.program["Τρίτη"] = days.iron_tuesday; window.program["Τετάρτη"] = days.iron_wednesday;
        window.program["Παρασκευή"] = days.iron_friday; window.program["Σάββατο"] = days.iron_saturday; window.program["Κυριακή"] = days.iron_sunday;
    } else if (activePlan === 'EMS_ONLY') {
        window.program["Τρίτη"] = days.iron_tuesday; window.program["Τετάρτη"] = days.ems_wednesday;
        window.program["Παρασκευή"] = days.iron_friday; window.program["Σάββατο"] = days.iron_saturday; window.program["Κυριακή"] = days.iron_sunday;
    } else if (activePlan === 'BIKE_ONLY') {
        window.program["Τρίτη"] = days.iron_tuesday; window.program["Τετάρτη"] = days.iron_wednesday;
        window.program["Παρασκευή"] = days.iron_friday; window.program["Σάββατο"] = days.bike_weekend; window.program["Κυριακή"] = days.bike_weekend;
    } else if (activePlan === 'HYBRID') {
        window.program["Τρίτη"] = days.iron_tuesday; window.program["Τετάρτη"] = days.ems_wednesday;
        window.program["Παρασκευή"] = days.iron_friday; window.program["Σάββατο"] = days.bike_weekend; window.program["Κυριακή"] = days.bike_weekend;
    }
})();

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

// 6. DYNAMIC WEEKLY BRIDGE
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
    window.KOUKI_MENU = window.PegasusKoukiDB.map(f => ({ name: f.name, kcal: f.kcal, protein: f.protein, type: f.type }));
})();

window.getPegasusMacros = function(foodName, fallbackType) {
    const item = window.PegasusKoukiDB.find(f => f.name === foodName || f.name.includes(foodName));
    const type = item ? item.type : fallbackType;
    const needsRice = !["carb", "soup"].includes(type);
    const riceKcal = needsRice ? 280 : 0;
    const riceProt = needsRice ? 6 : 0;

    if (item) return { kcal: item.kcal + riceKcal, protein: item.protein + riceProt };
    let p = (type === 'kreas' || type === 'poulika') ? 45 : (type === 'ospro' ? 18 : 25);
    return { kcal: 550 + riceKcal, protein: p + riceProt };
};

window.getDynamicTargets = function() {
    const targets = { "Στήθος": 0, "Πλάτη": 0, "Ώμοι": 0, "Χέρια": 0, "Πόδια": 0, "Κορμός": 0 };
    Object.values(window.program).forEach(dayExercises => {
        dayExercises.forEach(ex => {
            if (targets.hasOwnProperty(ex.muscleGroup)) {
                targets[ex.muscleGroup] += parseInt(ex.sets);
            }
        });
    });
    return targets;
};
