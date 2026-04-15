/* ==========================================================================
   📦 PEGASUS DATA ENGINE - v16.4 (THE 4-PILLAR PROTOCOL)
   Protocol: Strict 4-Split Architecture | EMS & Bike Integration
   Status: PRODUCTION READY | ZERO-BUG BRIDGES ACTIVE
   ========================================================================== */

var M = M || window.PegasusManifest;

// 1. DEFAULT PLAN: BASE TEMPLATE (Θα υπερκαλυφθεί από την επιλογή σου)
window.program = {
    "Δευτέρα": [ { name: "Stretching", sets: 1, muscleGroup: "None", weight: "0" } ],
    "Τρίτη": [], "Τετάρτη": [], "Πέμπτη": [ { name: "Stretching", sets: 1, muscleGroup: "None", weight: "0" } ],
    "Παρασκευή": [], "Σάββατο": [], "Κυριακή": []
};

// 2. MASTER EXERCISES DATABASE
window.exercisesDB = [
    { name: "Chest Press", muscleGroup: "Στήθος" }, { name: "Chest Flys", muscleGroup: "Στήθος" }, { name: "Pushups", muscleGroup: "Στήθος" },
    { name: "Wide Pulldowns", muscleGroup: "Πλάτη" }, { name: "Medium Pulldowns", muscleGroup: "Πλάτη" }, { name: "Seated Rows", muscleGroup: "Πλάτη" }, { name: "Bent Over Rows", muscleGroup: "Πλάτη" },
    { name: "Upright Rows", muscleGroup: "Ώμοι" },
    { name: "Bicep Curls", muscleGroup: "Χέρια" }, { name: "Preacher Curls", muscleGroup: "Χέρια" }, { name: "Tricep Pulldowns", muscleGroup: "Χέρια" },
    { name: "Ab Crunches", muscleGroup: "Κορμός" }, { name: "Sit Ups", muscleGroup: "Κορμός" }, { name: "Plank", muscleGroup: "Κορμός" }, { name: "Reverse Crunch", muscleGroup: "Κορμός" }, { name: "Lying Knee Raise", muscleGroup: "Κορμός" }, { name: "Leg Raise Hip Lift", muscleGroup: "Κορμός" },
    { name: "Leg Extensions", muscleGroup: "Πόδια" },
    // 🎯 Legacy & System Matches
    { name: "Pec Deck", muscleGroup: "Στήθος" }, { name: "Lat Pulldown", muscleGroup: "Πλάτη" }, { name: "Low Seated Row", muscleGroup: "Πλάτη" },
    { name: "Standing Bicep Curl", muscleGroup: "Χέρια" }, { name: "Leg Extension", muscleGroup: "Πόδια" },
    { name: "EMS Training", muscleGroup: "Πλάτη" }, { name: "Ποδηλασία", muscleGroup: "Πόδια" }, { name: "Cycling", muscleGroup: "Πόδια" },
    { name: "Stretching", muscleGroup: "None" }
];

// 3. ASSET MAPPING
window.videoMap = {
    "Chest Press": "chestpress", "Chest Flys": "chestflys", "Pushups": "pushups", "Pec Deck": "chestflys",
    "Wide Pulldowns": "latpulldowns", "Medium Pulldowns": "latpulldowns", "Lat Pulldown": "latpulldowns",
    "Seated Rows": "lowrowsseated", "Bent Over Rows": "bentoverrows", "Low Seated Row": "lowrowsseated",
    "Upright Rows": "uprightrows", "Bicep Curls": "bicepcurls", "Standing Bicep Curl": "bicepcurls",
    "Preacher Curls": "preacherbicepcurls", "Tricep Pulldowns": "triceppulldowns",
    "Ab Crunches": "abcrunches", "Sit Ups": "situps", "Plank": "plank",
    "Reverse Crunch": "reversecrunch", "Lying Knee Raise": "lyingkneeraise",
    "Leg Raise Hip Lift": "legraisehiplift", "Leg Extensions": "legextensions", "Leg Extension": "legextensions",
    "EMS Training": "ems_general", "Ποδηλασία": "cycling", "Cycling": "cycling", "Stretching": "stretching_base"
};

// 4. PEGASUS 4-PILLAR SPLIT ENGINE
window.setPegasusPlan = function(planKey) {
    localStorage.setItem('pegasus_active_plan', planKey);
    console.log(`🎯 PEGASUS: Plan switched to ${planKey}`);

    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.9); backdrop-filter: blur(10px);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        z-index: 999999; opacity: 0; transition: opacity 0.4s ease;
    `;
    overlay.innerHTML = `
        <div style="font-size: 70px; margin-bottom: 25px;">🟢</div>
        <div style="color: #4CAF50; font-weight: 900; font-size: 26px; letter-spacing: 2px; text-transform: uppercase; text-align:center; padding: 0 20px;">Το Προγραμμα Ενεργοποιηθηκε</div>
        <div style="color: #eee; font-size: 16px; margin-top: 15px; font-weight: bold;">Split: ${planKey}</div>
        <div style="color: #666; font-size: 11px; margin-top: 35px; letter-spacing: 2px; font-weight:800;">PEGASUS OS REBOOT IN 1"</div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.style.opacity = '1', 50);

    if (window.PegasusCloud) window.PegasusCloud.push(true);
    setTimeout(() => { overlay.style.opacity = '0'; setTimeout(() => window.location.reload(), 500); }, 1000);
};

(function applyPegasusSplit() {
    const activePlan = localStorage.getItem('pegasus_active_plan') || 'IRON';
    window.pegasusTimerConfig = { prep: 10, work: 45, rest: 60 };

    // 🧱 ΤΑ BUILDING BLOCKS ΤΩΝ ΗΜΕΡΩΝ ΣΟΥ
    const days = {
        iron_tuesday: [
            { name: "Chest Press", sets: 6, muscleGroup: "Στήθος", weight: "54" },
            { name: "Chest Flys", sets: 5, muscleGroup: "Στήθος", weight: "42" },
            { name: "Wide Pulldowns", sets: 6, muscleGroup: "Πλάτη", weight: "36" },
            { name: "Seated Rows", sets: 5, muscleGroup: "Πλάτη", weight: "66" },
            { name: "Ab Crunches", sets: 5, muscleGroup: "Κορμός", weight: "30" }
        ],
        iron_wednesday: [
            { name: "Upright Rows", sets: 6, muscleGroup: "Ώμοι", weight: "30" },
            { name: "Bicep Curls", sets: 6, muscleGroup: "Χέρια", weight: "30" },
            { name: "Tricep Pulldowns", sets: 6, muscleGroup: "Χέρια", weight: "20" },
            { name: "Preacher Curls", sets: 5, muscleGroup: "Χέρια", weight: "30" },
            { name: "Plank", sets: 5, muscleGroup: "Κορμός", weight: "0" }
        ],
        ems_wednesday: [
            { name: "EMS Training", sets: 1, muscleGroup: "Πλάτη", weight: "0" },
            { name: "Upright Rows", sets: 4, muscleGroup: "Ώμοι", weight: "30" },
            { name: "Bicep Curls", sets: 4, muscleGroup: "Χέρια", weight: "30" },
            { name: "Plank", sets: 5, muscleGroup: "Κορμός", weight: "0" }
        ],
        iron_friday: [
            { name: "Medium Pulldowns", sets: 6, muscleGroup: "Πλάτη", weight: "36" },
            { name: "Bent Over Rows", sets: 6, muscleGroup: "Πλάτη", weight: "30" },
            { name: "Pushups", sets: 5, muscleGroup: "Στήθος", weight: "0" },
            { name: "Reverse Crunch", sets: 5, muscleGroup: "Κορμός", weight: "0" },
            { name: "Lying Knee Raise", sets: 5, muscleGroup: "Κορμός", weight: "0" }
        ],
        iron_saturday: [
            { name: "Leg Extensions", sets: 8, muscleGroup: "Πόδια", weight: "36" },
            { name: "Sit Ups", sets: 6, muscleGroup: "Κορμός", weight: "0" },
            { name: "Ab Crunches", sets: 6, muscleGroup: "Κορμός", weight: "30" },
            { name: "Plank", sets: 5, muscleGroup: "Κορμός", weight: "0" }
        ],
        iron_sunday: [
            { name: "Chest Press", sets: 5, muscleGroup: "Στήθος", weight: "54" },
            { name: "Seated Rows", sets: 5, muscleGroup: "Πλάτη", weight: "66" },
            { name: "Bicep Curls", sets: 5, muscleGroup: "Χέρια", weight: "30" },
            { name: "Tricep Pulldowns", sets: 5, muscleGroup: "Χέρια", weight: "20" },
            { name: "Leg Raise Hip Lift", sets: 5, muscleGroup: "Κορμός", weight: "0" }
        ],
        bike_weekend: [
            { name: "Ποδηλασία", sets: 1, muscleGroup: "Πόδια", weight: "0" },
            { name: "Ab Crunches", sets: 4, muscleGroup: "Κορμός", weight: "0" }
        ]
    };

    // 🏆 ΤΑ 4 ΠΡΩΤΟΚΟΛΛΑ ΣΟΥ
    if (activePlan === 'IRON') {
        window.program["Τρίτη"] = days.iron_tuesday;
        window.program["Τετάρτη"] = days.iron_wednesday;
        window.program["Παρασκευή"] = days.iron_friday;
        window.program["Σάββατο"] = days.iron_saturday;
        window.program["Κυριακή"] = days.iron_sunday;
    } 
    else if (activePlan === 'EMS_ONLY') {
        window.program["Τρίτη"] = days.iron_tuesday;
        window.program["Τετάρτη"] = days.ems_wednesday;
        window.program["Παρασκευή"] = days.iron_friday;
        window.program["Σάββατο"] = days.iron_saturday;
        window.program["Κυριακή"] = days.iron_sunday;
    } 
    else if (activePlan === 'BIKE_ONLY') {
        window.program["Τρίτη"] = days.iron_tuesday;
        window.program["Τετάρτη"] = days.iron_wednesday;
        window.program["Παρασκευή"] = days.iron_friday;
        window.program["Σάββατο"] = days.bike_weekend;
        window.program["Κυριακή"] = days.bike_weekend;
    } 
    else if (activePlan === 'HYBRID') { // EMS + Bike
        window.program["Τρίτη"] = days.iron_tuesday;
        window.program["Τετάρτη"] = days.ems_wednesday;
        window.program["Παρασκευή"] = days.iron_friday;
        window.program["Σάββατο"] = days.bike_weekend;
        window.program["Κυριακή"] = days.bike_weekend;
    }
    
    console.log(`🚀 PEGASUS DATA ENGINE: v16.4 Active. Plan: ${activePlan}`);

    window.getDynamicTargets = function() {
        const targets = { "Στήθος": 0, "Πλάτη": 0, "Πόδια": 0, "Χέρια": 0, "Ώμοι": 0, "Κορμός": 0 };
        for (const day in window.program) {
            window.program[day].forEach(ex => {
                if (targets[ex.muscleGroup] !== undefined) targets[ex.muscleGroup] += ex.sets;
            });
        }
        return targets;
    };
})();

// ==========================================================================
// 5. THE KOUKI MENU CONSOLIDATION 
// ==========================================================================
window.PegasusKoukiDB = [
    { name: "Κοτόπουλο με κάρυ & λαχανικά", type: "poulika", price: 6.50, kcal: 580, protein: 52 },
    { name: "Κοτόπουλο με χυλοπίτες", type: "poulika", price: 6.00, kcal: 680, protein: 48 },
    { name: "Κοτόπουλο λεμονάτο", type: "poulika", price: 6.00, kcal: 550, protein: 52 },
    { name: "Κοτόπουλο με πατάτες", type: "poulika", price: 6.00, kcal: 600, protein: 50 },
    { name: "Μπάμιες με κοτόπουλο", type: "poulika", price: 6.00, kcal: 520, protein: 45 },
    { name: "Κοτόσουπα", type: "soup", price: 4.50, kcal: 400, protein: 30 },
    { name: "Χοιρινό με δαμάσκηνα", type: "kreas", price: 6.50, kcal: 650, protein: 42 },
    { name: "Χοιρινό πρασοσέλινο", type: "kreas", price: 6.00, kcal: 610, protein: 40 },
    { name: "Μοσχαράκι κοκκινιστό", type: "kreas", price: 6.50, kcal: 640, protein: 45 },
    { name: "Μοσχάρι γιουβέτσι", type: "kreas", price: 6.50, kcal: 620, protein: 45 },
    { name: "Μπιφτέκι μοσχαρίσιο", type: "kreas", price: 6.00, kcal: 600, protein: 45 },
    { name: "Μπιφτέκια μοσχαρίσια σχάρας", type: "kreas", price: 6.00, kcal: 600, protein: 45 },
    { name: "Γιουβαρλάκια αυγολέμονο", type: "kreas", price: 6.00, kcal: 550, protein: 38 },
    { name: "Ρεβύθια με κάρυ", type: "ospro", price: 4.50, kcal: 450, protein: 18 },
    { name: "Ρεβύθια λεμονάτα", type: "ospro", price: 4.50, kcal: 420, protein: 18 },
    { name: "Γίγαντες πλακί", type: "ospro", price: 6.00, kcal: 500, protein: 20 },
    { name: "Φασολάδα", type: "ospro", price: 4.50, kcal: 400, protein: 18 },
    { name: "Φασολάκια", type: "ladero", price: 4.50, kcal: 350, protein: 8 },
    { name: "Μουσακάς", type: "carb", price: 6.00, kcal: 830, protein: 26 },
    { name: "Παστίτσιο", type: "carb", price: 6.00, kcal: 750, protein: 35 },
    { name: "Μακαρόνια με κιμά", type: "carb", price: 5.50, kcal: 600, protein: 30 },
    { name: "Βακαλάος σκορδαλιά", type: "psari", price: 6.50, kcal: 550, protein: 35 }
];

// ==========================================================================
// 6. LEGACY BRIDGES (ZERO-BUG TOLERANCE)
// ==========================================================================
window.KOUKI_MASTER = window.PegasusKoukiDB.map(f => ({ name: f.name, type: f.type }));
window.KOUKI_MENU = window.PegasusKoukiDB.map(f => ({ name: f.name, kcal: f.kcal, protein: f.protein, type: f.type }));

const dailyFormat = window.PegasusKoukiDB.map(f => ({ n: f.name, p: f.price, t: f.type }));
window.KOUKI_MASTER_MENU = {
    "Monday": dailyFormat, "Tuesday": dailyFormat, "Wednesday": dailyFormat,
    "Thursday": dailyFormat, "Friday": dailyFormat, "Saturday": dailyFormat, "Sunday": dailyFormat
};

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
