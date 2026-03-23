/* ==========================================================================
   PEGASUS DATA ENGINE - v5.8 (RESTORED CORE & CLOSE GRIP SYNC)
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

    // ΠΛΑΤΗ (Προσθήκη Close Grip)
    { name: "Lat Pulldown Wide", muscleGroup: "Πλάτη", defaultDuration: 45 },
    { name: "Close Grip Pulldown", muscleGroup: "Πλάτη", defaultDuration: 45 }, // Μικρή μπάρα πάνω
    { name: "Low Seated Row Wide", muscleGroup: "Πλάτη", defaultDuration: 45 },
    { name: "Straight Arm Pulldown", muscleGroup: "Πλάτη", defaultDuration: 45 },
    { name: "Reverse Chest Press", muscleGroup: "Πλάτη", defaultDuration: 45 },

    // ΩΜΟΙ
    { name: "Shoulder Press Wide", muscleGroup: "Ώμοι", defaultDuration: 45 },
    { name: "Upright Row Cable", muscleGroup: "Ώμοι", defaultDuration: 45 },

    // ΧΕΡΙΑ
    { name: "Standing Bicep Curl Bar", muscleGroup: "Χέρια", defaultDuration: 45 },
    { name: "Preacher Curl", muscleGroup: "Χέρια", defaultDuration: 45 },
    { name: "Triceps Press Down Bar", muscleGroup: "Χέρια", defaultDuration: 45 },
    { name: "Triceps Overhead Extension", muscleGroup: "Χέρια", defaultDuration: 45 },

    // ΚΟΡΜΟΣ (Restored Floor Exercises)
    { name: "Leg Raise Hip Lift", muscleGroup: "Κορμός", defaultDuration: 45 },
    { name: "Reverse Crunch", muscleGroup: "Κορμός", defaultDuration: 45 },
    { name: "Lying Knee Raise", muscleGroup: "Κορμός", defaultDuration: 45 },
    { name: "Plank", muscleGroup: "Κορμός", defaultDuration: 45 }
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
"Seated Chest Press": "chestpress", // Μετονομάστε το σωστό βίντεο πιέσεων σε chestpress.mp4
    "Pec Deck": "pecdeck",             // Χρησιμοποιήστε το βίντεο πεταλούδας ως pecdeck.mp4
    "Pushups": "pushups",
    "Lat Pulldown Wide": "pulldown",
    "Close Grip Pulldown": "pulldown",
    "Low Seated Row Wide": "lowseatedrow",
    "Straight Arm Pulldown": "pulldown",
    "Reverse Chest Press": "reverserow",
    "Shoulder Press Wide": "seatedchestpress",
    "Upright Row Cable": "lowseatedrow",
    "Standing Bicep Curl Bar": "bicepscurl",
    "Preacher Curl": "biceps",
    "Triceps Press Down Bar": "tricepspress",
    "Triceps Overhead Extension": "tricepspress",
    "Plank": "plank",
    "Leg Raise Hip Lift": "legraisehiplift",
    "Reverse Crunch": "reversecrunch",
    "Lying Knee Raise": "lyingkneeraise",
    "Stretching": "stretching",
    "Ποδηλασία 30km": "cycling",
    "EMS Lateral Raises (3kg)": "ems",
    "EMS Bicep Curls (3kg)": "bicepscurl",
    "EMS Static Plank": "plank",
    "EMS Static Crunches": "ems"
};

window.exercisesDB = STRENGTH_EXERCISES;
