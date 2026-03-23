/* ==========================================================================
   PEGASUS DATA ENGINE - v7.3 (STRICT VIDEO FILENAME SYNC)
   ========================================================================== */

window.USER_PROFILE = { weight: 74, height: 1.87, age: 38, gender: "male" };
window.TARGET_SETS = { "Στήθος": 24, "Πλάτη": 24, "Ώμοι": 16, "Χέρια": 16, "Κορμός": 12, "Πόδια": 24 };
window.REST_TIME = 60; 
window.MAX_DAILY_MINUTES = 60;

const STRENGTH_EXERCISES = [
    // ΣΤΗΘΟΣ
    { name: "Seated Chest Press", muscleGroup: "Στήθος", defaultDuration: 45 },
    { name: "Chest Flys", muscleGroup: "Στήθος", defaultDuration: 45 }, // Μετονομασία Pec Deck
    { name: "Pushups", muscleGroup: "Στήθος", defaultDuration: 45 }, // Διατήρηση

    // ΠΛΑΤΗ
    { name: "Lat Pulldowns", muscleGroup: "Πλάτη", defaultDuration: 45 }, // Μετονομασία Lat Pulldown Wide
    { name: "Close Grip Pulldown", muscleGroup: "Πλάτη", defaultDuration: 45 },
    { name: "Straight Arm Pulldowns", muscleGroup: "Πλάτη", defaultDuration: 45 }, // Μετονομασία Straight Arm Pulldown
    { name: "One Arm Pulldowns", muscleGroup: "Πλάτη", defaultDuration: 45 }, // Μετονομασία One Arm Pulldown
    { name: "Bent Over Rows", muscleGroup: "Πλάτη", defaultDuration: 45 }, // Μετονομασία Bent Over Row Cable

    // ΩΜΟΙ
    { name: "Upright Rows", muscleGroup: "Ώμοι", defaultDuration: 45 }, // Μενομασία Upright Row Cable

    // ΧΕΡΙΑ
    { name: "Bicep Curls", muscleGroup: "Χέρια", defaultDuration: 45 }, // Μετονομασία Standing Bicep Curl Bar
    { name: "Preacher Bicep Curls", muscleGroup: "Χέρια", defaultDuration: 45 }, // Μετονομασία Preacher Curl
    { name: "Tricep Pulldowns", muscleGroup: "Χέρια", defaultDuration: 45 }, // Μετονομασία Triceps Press Down Bar

    // ΚΟΡΜΟΣ
    { name: "Plank", muscleGroup: "Κορμός", defaultDuration: 45 }, // Διατήρηση
    { name: "Leg Raise Hip Lift", muscleGroup: "Κορμός", defaultDuration: 45 }, // Διατήρηση
    { name: "Reverse Crunch", muscleGroup: "Κορμός", defaultDuration: 45 }, // Διατήρηση
    { name: "Lying Knee Raise", muscleGroup: "Κορμός", defaultDuration: 45 }, // Διατήρηση

    // ΠΟΔΙΑ (Νέο βίντεο)
    { name: "Glute Kickbacks", muscleGroup: "Πόδια", defaultDuration: 45 } 
];

window.calculateDailyProgram = function(dayName) {
    if (dayName === "Δευτέρα" || dayName === "Πέμπτη") {
        return [{ name: "Stretching", sets: 1, duration: 338 }];
    }
    if (dayName === "Τετάρτη") {
        return [
            { name: "EMS Lateral Raises (3kg)", muscleGroup: "Ώμοι", sets: 4, duration: 300 },
            { name: "EMS Bicep Curls (3kg)", muscleGroup: "Χέρια", sets: 4, duration: 300 },
            { name: "EMS Static Plank", muscleGroup: "Κορμός", sets: 3, duration: 450 },
            { name: "EMS Static Crunches", muscleGroup: "Κορμός", sets: 3, duration: 450 }
        ];
    }
    const history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
    let currentMins = 0;
    const program = [];
    if (dayName === "Σάββατο" || dayName === "Κυριακή") {
        program.push({ name: "Plank", sets: 3, duration: 45, muscleGroup: "Κορμός" });
        program.push({ name: "Leg Raise Hip Lift", sets: 3, duration: 45, muscleGroup: "Κορμός" });
        program.push({ name: "Reverse Crunch", sets: 3, duration: 45, muscleGroup: "Κορμός" });
        currentMins = (9 * 105) / 60;
        const groups = ["Στήθος", "Πλάτη", "Ώμοι", "Χέρια"];
        const deficits = groups.map(group => ({ group, ratio: (history[group] || 0) / window.TARGET_SETS[group] })).sort((a, b) => a.ratio - b.ratio);
        for (const item of deficits) {
            if (item.ratio >= 1) continue;
            const groupEx = STRENGTH_EXERCISES.filter(ex => ex.muscleGroup === item.group);
            for (const ex of groupEx) {
                if (program.find(p => p.name === ex.name)) continue;
                let sets = 4;
                let timeNeeded = (sets * 105) / 60;
                if (currentMins + timeNeeded <= 60) {
                    program.push({ name: ex.name, sets: sets, duration: 45, muscleGroup: ex.muscleGroup });
                    currentMins += timeNeeded;
                }
            }
        }
        program.push({ name: "Ποδηλασία 30km", sets: 1, duration: 0, muscleGroup: "Πόδια" });
        return program;
    }
    const focusGroups = (dayName === "Τρίτη") ? ["Στήθος", "Ώμοι", "Πλάτη"] : ["Πλάτη", "Χέρια", "Ώμοι", "Στήθος"];
    const deficits = focusGroups.map(group => ({ group, ratio: (history[group] || 0) / window.TARGET_SETS[group] })).sort((a, b) => a.ratio - b.ratio);
    for (const item of deficits) {
        const groupEx = STRENGTH_EXERCISES.filter(ex => ex.muscleGroup === item.group);
        for (const ex of groupEx) {
            if (program.find(p => p.name === ex.name)) continue;
            let timeNeeded = (4 * 105) / 60;
            if (currentMins + timeNeeded <= 60) {
                program.push({ name: ex.name, sets: 4, duration: 45, muscleGroup: ex.muscleGroup });
                currentMins += timeNeeded;
            }
        }
    }
    return program;
};

window.videoMap = {
    // Σωστή αντιστοίχιση βάσει της φωτογραφίας
    "Seated Chest Press": "seatedchestpress",
    "Chest Flys": "chestflys", // Μετονομασία Pec Deck
    "Pushups": "pushups", // Διατήρηση
    "Lat Pulldowns": "latpulldowns", // Μετονομασία Lat Pulldown Wide
    "Close Grip Pulldown": "latpulldowns",
    "Straight Arm Pulldowns": "straightarmpulldowns", // Μετονομασία Straight Arm Pulldown
    "One Arm Pulldowns": "onearmpulldowns", // Μετονομασία One Arm Pulldown
    "Bent Over Rows": "bentoverrows", // Μετονομασία Bent Over Row Cable
    "Upright Rows": "uprightrows", // Μετονομασία Upright Row Cable
    "Bicep Curls": "bicepscurl", // Μετονομασία Standing Bicep Curl Bar (από προηγούμενο sync)
    "Preacher Bicep Curls": "preacherbicepcurls", // Μετονομασία Preacher Curl
    "Tricep Pulldowns": "triceppulldowns", // Μετονομασία Triceps Press Down Bar
    "Glute Kickbacks": "glutekickbacks", // Νέο βίντεο

    // Ασκήσεις Εδάφους (Διατήρηση)
    "Plank": "plank",
    "Leg Raise Hip Lift": "legraisehiplift",
    "Reverse Crunch": "reversecrunch",
    "Lying Knee Raise": "lyingkneeraise",

    // Καρδιοαναπνευστικό
    "Ποδηλασία 30km": "cycling",
    "Stretching": "stretching",

    // EMS
    "EMS Lateral Raises (3kg)": "ems",
    "EMS Bicep Curls (3kg)": "bicepscurl",
    "EMS Static Plank": "plank",
    "EMS Static Crunches": "ems"
};
