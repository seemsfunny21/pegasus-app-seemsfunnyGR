/* ==========================================================================
   PEGASUS DATA ENGINE - v7.4 (FINAL VIDEO & OBJECT SYNC)
   ========================================================================== */

window.USER_PROFILE = { weight: 74, height: 1.87, age: 38, gender: "male" };
window.TARGET_SETS = { "Στήθος": 24, "Πλάτη": 24, "Ώμοι": 16, "Χέρια": 16, "Κορμός": 12, "Πόδια": 24 };
window.REST_TIME = 60; 
window.MAX_DAILY_MINUTES = 60;

const STRENGTH_EXERCISES = [
    { name: "Seated Chest Press", muscleGroup: "Στήθος", defaultDuration: 45 },
    { name: "Chest Flys", muscleGroup: "Στήθος", defaultDuration: 45 },
    { name: "Pushups", muscleGroup: "Στήθος", defaultDuration: 45 },
    { name: "Lat Pulldowns", muscleGroup: "Πλάτη", defaultDuration: 45 },
    { name: "Close Grip Pulldown", muscleGroup: "Πλάτη", defaultDuration: 45 },
    { name: "Low Seated Row Wide", muscleGroup: "Πλάτη", defaultDuration: 45 },
    { name: "Straight Arm Pulldowns", muscleGroup: "Πλάτη", defaultDuration: 45 },
    { name: "Bent Over Rows", muscleGroup: "Πλάτη", defaultDuration: 45 },
    { name: "Upright Rows", muscleGroup: "Ώμοι", defaultDuration: 45 },
    { name: "Bicep Curls", muscleGroup: "Χέρια", defaultDuration: 45 },
    { name: "Preacher Bicep Curls", muscleGroup: "Χέρια", defaultDuration: 45 },
    { name: "Tricep Pulldowns", muscleGroup: "Χέρια", defaultDuration: 45 },
    { name: "Triceps Overhead Extension", muscleGroup: "Χέρια", defaultDuration: 45 },
    { name: "Ab Crunches Cable", muscleGroup: "Κορμός", defaultDuration: 45 },
    { name: "Plank", muscleGroup: "Κορμός", defaultDuration: 45 },
    { name: "Leg Raise Hip Lift", muscleGroup: "Κορμός", defaultDuration: 45 },
    { name: "Reverse Crunch", muscleGroup: "Κορμός", defaultDuration: 45 }
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
                let timeNeeded = (4 * 105) / 60;
                if (currentMins + timeNeeded <= 60) {
                    program.push({ name: ex.name, sets: 4, duration: 45, muscleGroup: ex.muscleGroup });
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

// INITIALIZE GLOBAL OBJECTS
window.program = {
    "Δευτέρα": window.calculateDailyProgram("Δευτέρα"),
    "Τρίτη": window.calculateDailyProgram("Τρίτη"),
    "Τετάρτη": window.calculateDailyProgram("Τετάρτη"),
    "Πέμπτη": window.calculateDailyProgram("Πέμπτη"),
    "Παρασκευή": window.calculateDailyProgram("Παρασκευή"),
    "Σάββατο": window.calculateDailyProgram("Σάββατο"),
    "Κυριακή": window.calculateDailyProgram("Κυριακή")
};
window.getFinalProgram = (day) => window.program[day];

window.videoMap = {
    // ΣΥΓΧΡΟΝΙΣΜΟΣ ΜΕ ΦΩΤΟΓΡΑΦΙΑ (Image 7)
    "Seated Chest Press": "chestpress",
    "Chest Flys": "chestflys",
    "Pushups": "pushups",
    "Lat Pulldowns": "latpulldowns",
    "Close Grip Pulldown": "latpulldownclose",
    "Low Seated Row Wide": "lowrowseated",
    "Straight Arm Pulldowns": "straightarmpulldowns",
    "Bent Over Rows": "bentoverrows",
    "Upright Rows": "uprightrows",
    "Bicep Curls": "bicepcurls",
    "Preacher Bicep Curls": "preacherbicepcurls",
    "Tricep Pulldowns": "triceppulldowns",
    "Triceps Overhead Extension": "triceppulldowns",
    "Ab Crunches Cable": "abcrunches",
    
    // ΚΟΡΜΟΣ & ΛΟΙΠΑ
    "Plank": "plank",
    "Leg Raise Hip Lift": "legraisehiplift",
    "Reverse Crunch": "reversecrunch",
    "Ποδηλασία 30km": "cycling",
    "Stretching": "stretching",
    "EMS Lateral Raises (3kg)": "ems",
    "EMS Bicep Curls (3kg)": "bicepcurls",
    "EMS Static Plank": "plank",
    "EMS Static Crunches": "ems"
};
window.exercisesDB = STRENGTH_EXERCISES;
