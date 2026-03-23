/* ==========================================================================
   PEGASUS DATA ENGINE - v5.6 (STRICT ATTACHMENT & PEC DECK SYNC)
   ========================================================================== */

window.USER_PROFILE = { weight: 74, height: 1.87, age: 38, gender: "male" };
window.TARGET_SETS = { "Στήθος": 24, "Πλάτη": 24, "Ώμοι": 16, "Χέρια": 16, "Κορμός": 12, "Πόδια": 24 };
window.REST_TIME = 60; 
window.MAX_DAILY_MINUTES = 60;

const STRENGTH_EXERCISES = [
    // ΣΤΗΘΟΣ
    { name: "Seated Chest Press", muscleGroup: "Στήθος", defaultDuration: 45 },
    { name: "Pec Deck", muscleGroup: "Στήθος", defaultDuration: 45 },
    { name: "Pushups", muscleGroup: "Στήθος", defaultDuration: 45 },
    { name: "Rope Chest Press", muscleGroup: "Στήθος", defaultDuration: 45 },

    // ΠΛΑΤΗ
    { name: "Lat Pulldown Wide", muscleGroup: "Πλάτη", defaultDuration: 45 },
    { name: "Low Seated Row Wide", muscleGroup: "Πλάτη", defaultDuration: 45 },
    { name: "Straight Arm Pulldown", muscleGroup: "Πλάτη", defaultDuration: 45 },
    { name: "Face Pulls Rope", muscleGroup: "Πλάτη", defaultDuration: 45 },

    // ΩΜΟΙ
    { name: "Shoulder Press Wide", muscleGroup: "Ώμοι", defaultDuration: 45 },
    { name: "Upright Row Cable", muscleGroup: "Ώμοι", defaultDuration: 45 },
    { name: "Front Raises Rope", muscleGroup: "Ώμοι", defaultDuration: 45 },

    // ΧΕΡΙΑ
    { name: "Standing Bicep Curl Bar", muscleGroup: "Χέρια", defaultDuration: 45 },
    { name: "Hammer Curls Rope", muscleGroup: "Χέρια", defaultDuration: 45 },
    { name: "Triceps Press Down Rope", muscleGroup: "Χέρια", defaultDuration: 45 },
    { name: "Triceps Press Down Bar", muscleGroup: "Χέρια", defaultDuration: 45 },

    // ΚΟΡΜΟΣ
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
    if (dayName === "Σάββατο" || dayName === "Κυριακή") {
        return [
            { name: "Plank", sets: 3, duration: 45, muscleGroup: "Κορμός" },
            { name: "Reverse Crunch", sets: 3, duration: 45, muscleGroup: "Κορμός" },
            { name: "Ποδηλασία 30km", sets: 1, duration: 0, muscleGroup: "Πόδια" }
        ];
    }

    const history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
    let currentMins = 0;
    const program = [];
    const focusGroups = (dayName === "Τρίτη") ? ["Στήθος", "Ώμοι"] : ["Πλάτη", "Χέρια"];

    const deficits = focusGroups.map(group => {
        const current = history[group] || 0;
        const target = window.TARGET_SETS[group];
        return { group, ratio: current / target };
    }).sort((a, b) => a.ratio - b.ratio);

    for (const item of deficits) {
        const groupEx = STRENGTH_EXERCISES.filter(ex => ex.muscleGroup === item.group);
        for (const ex of groupEx) {
            let sets = 4;
            let timeNeeded = (sets * (ex.defaultDuration + window.REST_TIME)) / 60;
            if (currentMins + timeNeeded <= window.MAX_DAILY_MINUTES) {
                program.push({ name: ex.name, sets: sets, duration: ex.defaultDuration, muscleGroup: ex.muscleGroup });
                currentMins += timeNeeded;
            }
        }
    }
    return program.length > 0 ? program : [{ name: "Stretching", sets: 1, duration: 338 }];
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

window.getFinalProgram = (day) => window.program[day] || window.calculateDailyProgram(day);

window.videoMap = {
    "Seated Chest Press": "seatedchestpress",
    "Pec Deck": "pecdeck",
    "Pushups": "pushups",
    "Rope Chest Press": "seatedchestpress",
    "Lat Pulldown Wide": "pulldown",
    "Low Seated Row Wide": "lowseatedrow",
    "Straight Arm Pulldown": "pulldown",
    "Face Pulls Rope": "reverserow",
    "Shoulder Press Wide": "seatedchestpress",
    "Upright Row Cable": "lowseatedrow",
    "Front Raises Rope": "bicepscurl",
    "Standing Bicep Curl Bar": "bicepscurl",
    "Hammer Curls Rope": "bicepscurl",
    "Triceps Press Down Rope": "tricepspress",
    "Triceps Press Down Bar": "tricepspress",
    "Plank": "plank",
    "Leg Raise Hip Lift": "legraisehiplift",
    "Reverse Crunch": "reversecrunch",
    "Stretching": "stretching",
    "Ποδηλασία 30km": "cycling",
    "EMS Lateral Raises (3kg)": "ems",
    "EMS Bicep Curls (3kg)": "bicepscurl",
    "EMS Static Plank": "plank",
    "EMS Static Crunches": "ems"
};

window.exercisesDB = STRENGTH_EXERCISES;
