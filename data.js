/* ==========================================================================
   PEGASUS DATA ENGINE - v7.11 (STRICT UNIFIED SYNC)
   ========================================================================== */

window.USER_PROFILE = { weight: 74, height: 1.87, age: 38, gender: "male" };
window.TARGET_SETS = { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 };
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
    { name: "One Arm Pulldowns", muscleGroup: "Πλάτη", defaultDuration: 45 },
    { name: "One Arm Rows", muscleGroup: "Πλάτη", defaultDuration: 45 },
    { name: "Bent Over Rows", muscleGroup: "Πλάτη", defaultDuration: 45 },
    { name: "Reverse Seated Rows", muscleGroup: "Πλάτη", defaultDuration: 45 },
    { name: "Upright Rows", muscleGroup: "Ώμοι", defaultDuration: 45 },
    { name: "Bicep Curls", muscleGroup: "Χέρια", defaultDuration: 45 },
    { name: "Preacher Bicep Curls", muscleGroup: "Χέρια", defaultDuration: 45 },
    { name: "Tricep Pulldowns", muscleGroup: "Χέρια", defaultDuration: 45 },
    { name: "Ab Crunches Cable", muscleGroup: "Κορμός", defaultDuration: 45 },
    { name: "Plank", muscleGroup: "Κορμός", defaultDuration: 45 },
    { name: "Leg Raise Hip Lift", muscleGroup: "Κormos", defaultDuration: 45 },
    { name: "Reverse Crunch", muscleGroup: "Κορμός", defaultDuration: 45 },
    { name: "Lying Knee Raise", muscleGroup: "Κορμός", defaultDuration: 45 },
    { name: "Situps", muscleGroup: "Κορμός", defaultDuration: 45 },
    { name: "Glute Kickbacks", muscleGroup: "Πόδια", defaultDuration: 45 },
    { name: "Leg Extensions", muscleGroup: "Πόδια", defaultDuration: 45 }
];

window.calculateDailyProgram = function(dayName) {
    if (dayName === "Δευτέρα" || dayName === "Πέμπτη") return [{ name: "Stretching", sets: 1, duration: 338 }];
    if (dayName === "Τετάρτη") return [
        { name: "EMS Lateral Raises (3kg)", muscleGroup: "Ώμοι", sets: 4, duration: 300 },
        { name: "EMS Bicep Curls (3kg)", muscleGroup: "Χέρια", sets: 4, duration: 300 },
        { name: "EMS Static Plank", muscleGroup: "Κορμός", sets: 3, duration: 450 },
        { name: "EMS Static Crunches", muscleGroup: "Κορμός", sets: 3, duration: 450 }
    ];

    const history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
    let currentMins = 0;
    const program = [];

    if (dayName === "Σάββατο" || dayName === "Κυριακή") {
        program.push({ name: "Plank", sets: 3, duration: 45, muscleGroup: "Κορμός" });
        program.push({ name: "Leg Raise Hip Lift", sets: 3, duration: 45, muscleGroup: "Κορμός" });
        program.push({ name: "Reverse Crunch", sets: 3, duration: 45, muscleGroup: "Κορμός" });
        currentMins = (9 * 105) / 60;
        const groups = ["Στήθος", "Πλάτη", "Ώμοι", "Χέρια", "Πόδια"];
        const deficits = groups.map(group => ({ group, ratio: (history[group] || 0) / window.TARGET_SETS[group] })).sort((a, b) => a.ratio - b.ratio);
        for (const item of deficits) {
            if (item.ratio >= 1) continue;
            const groupEx = STRENGTH_EXERCISES.filter(ex => ex.muscleGroup === item.group);
            for (const ex of groupEx) {
                if (program.find(p => p.name === ex.name)) continue;
                if (currentMins + (4 * 105 / 60) <= 60) {
                    program.push({ name: ex.name, sets: 4, duration: 45, muscleGroup: ex.muscleGroup });
                    currentMins += (4 * 105 / 60);
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
            if (currentMins + (4 * 105 / 60) <= 60) {
                program.push({ name: ex.name, sets: 4, duration: 45, muscleGroup: ex.muscleGroup });
                currentMins += (4 * 105 / 60);
            }
        }
    }
    return program;
};

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
    "Seated Chest Press": "chestpress",
    "Chest Flys": "chestflys",
    "Pushups": "pushups",
    "Lat Pulldowns": "latpulldowns",
    "Close Grip Pulldown": "latpulldownsclose",
    "Low Seated Row Wide": "lowrowseated",
    "Straight Arm Pulldowns": "straightarmpulldowns",
    "One Arm Pulldowns": "onearmpulldowns",
    "One Arm Rows": "onearmrows",
    "Bent Over Rows": "bentoverrows",
    "Reverse Seated Rows": "reverseseatedrows",
    "Upright Rows": "uprightrows",
    "Bicep Curls": "bicepcurls",
    "Preacher Bicep Curls": "preacherbicepcurls",
    "Tricep Pulldowns": "triceppulldowns",
    "Ab Crunches Cable": "abcrunches",
    "Plank": "plank",
    "Leg Raise Hip Lift": "legraisehiplift",
    "Reverse Crunch": "reversecrunch",
    "Lying Knee Raise": "lyingkneeraise",
    "Situps": "situps",
    "Glute Kickbacks": "glutekickbacks",
    "Leg Extensions": "legextensions",
    "Ποδηλασία 30km": "cycling",
    "Stretching": "stretching",
    "Προθέρμανση": "warmup",
    "EMS Lateral Raises (3kg)": "ems",
    "EMS Bicep Curls (3kg)": "bicepcurls",
    "EMS Static Plank": "plank",
    "EMS Static Crunches": "abcrunches"
};
window.exercisesDB = STRENGTH_EXERCISES;
