/* ==========================================================================
   PEGASUS DATA ENGINE - v5.0 (TUESDAY ISOLATION + CORE PREP EDITION)
   ========================================================================== */

window.USER_PROFILE = { weight: 74, height: 1.87, age: 38, gender: "male" };
window.TARGET_SETS = { "Στήθος": 24, "Πλάτη": 24, "Ώμοι": 16, "Χέρια": 16, "Κορμός": 12, "Πόδια": 24 };
window.REST_TIME = 60; 
window.MAX_DAILY_MINUTES = 60;

const STRENGTH_EXERCISES = [
    { name: "Seated Chest Press", muscleGroup: "Στήθος", defaultDuration: 45 },
    { name: "Pec Deck", muscleGroup: "Στήθος", defaultDuration: 45 },
    { name: "Pushups", muscleGroup: "Στήθος", defaultDuration: 45 },
    { name: "Reverse Chest Press", muscleGroup: "Πλάτη", defaultDuration: 45 },
    { name: "Lat Pulldown", muscleGroup: "Πλάτη", defaultDuration: 45 },
    { name: "Low Seated Row", muscleGroup: "Πλάτη", defaultDuration: 45 },
    { name: "Close Grip Pulldown", muscleGroup: "Πλάτη", defaultDuration: 45 },
    { name: "Reverse Grip Cable Row", muscleGroup: "Πλάτη", defaultDuration: 45 },
    { name: "Preacher Curl", muscleGroup: "Χέρια", defaultDuration: 45 },
    { name: "Standing Bicep Curl", muscleGroup: "Χέρια", defaultDuration: 45 },
    { name: "Triceps Press", muscleGroup: "Χέρια", defaultDuration: 45 },
    { name: "Triceps Overhead Extension", muscleGroup: "Χέρια", defaultDuration: 45 },
    { name: "Seated Chest Press ", muscleGroup: "Ώμοι", defaultDuration: 45 }, 
    { name: "Plank", muscleGroup: "Κορμός", defaultDuration: 45 },
    { name: "Leg Raise Hip Lift", muscleGroup: "Κορμός", defaultDuration: 45 },
    { name: "Reverse Crunch", muscleGroup: "Κορμός", defaultDuration: 45 },
    { name: "Lying Knee Raise", muscleGroup: "Κορμός", defaultDuration: 45 }
];

const EMS_EXERCISES = [
    { name: "EMS Lateral Raises (3kg)", muscleGroup: "Ώμοι", sets: 4, duration: 0 },
    { name: "EMS Bicep Curls (3kg)", muscleGroup: "Χέρια", sets: 4, duration: 0 },
    { name: "EMS Static Plank", muscleGroup: "Κορμός", sets: 3, duration: 0 },
    { name: "EMS Static Crunches", muscleGroup: "Κορμός", sets: 3, duration: 0 }
];

window.calculateDailyProgram = function(dayName) {
    // RECOVERY DAYS
    if (dayName === "Δευτέρα" || dayName === "Πέμπτη") {
        return [{ name: "Stretching", sets: 1, duration: 338 }];
    }
    
    // EMS DAY
    if (dayName === "Τετάρτη") {
        return EMS_EXERCISES;
    }

    // HYBRID WEEKEND: Core Prep + Cycling (Bicep Curls Removed)
    if (dayName === "Σάββατο" || dayName === "Κυριακή") {
        return [
            { name: "Plank", sets: 3, duration: 45, muscleGroup: "Κορμός" },
            { name: "Leg Raise Hip Lift", sets: 3, duration: 45, muscleGroup: "Κορμός" },
            { name: "Reverse Crunch", sets: 3, duration: 45, muscleGroup: "Κορμός" },
            { name: "Ποδηλασία 30km", sets: 1, duration: 0, muscleGroup: "Πόδια" } 
        ];
    }

    const history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
    const dayLimits = { "Τρίτη": 60, "Παρασκευή": 55 };
    let currentMins = 0;
    const program = [];

    // STRICT ISOLATION: Τρίτη μόνο βάρη, Παρασκευή Πλάτη/Ώμοι/Χέρια
    const focusGroups = (dayName === "Τρίτη") ? ["Στήθος", "Ώμοι"] : ["Πλάτη", "Ώμοι", "Χέρια"];
    
    const deficits = focusGroups.map(group => {
        const current = history[group] || 0;
        const target = window.TARGET_SETS[group];
        return { group, ratio: current / target };
    }).sort((a, b) => a.ratio - b.ratio);

    for (const item of deficits) {
        const groupEx = STRENGTH_EXERCISES.filter(ex => ex.muscleGroup === item.group);
        for (const ex of groupEx) {
            if (program.find(p => p.name === ex.name)) continue; 
            
            let sets = 4;
            let timeNeeded = (sets * (ex.defaultDuration + window.REST_TIME)) / 60;
            
            if (currentMins + timeNeeded <= (dayLimits[dayName] || 60)) {
                program.push({ 
                    name: ex.name, 
                    sets: sets, 
                    duration: ex.defaultDuration, 
                    muscleGroup: ex.muscleGroup 
                });
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
    "Lat Pulldown": "pulldown", 
    "Close Grip Pulldown": "pulldown", 
    "Low Seated Row": "lowseatedrow",
    "Reverse Grip Cable Row": "reversegripcablerow", 
    "Reverse Chest Press": "reverserow",
    "Seated Chest Press": "seatedchestpress", 
    "Seated Chest Press ": "seatedchestpress", 
    "Pec Deck": "pecdeck", 
    "Pushups": "pushups",
    "Preacher Curl": "biceps", 
    "Standing Bicep Curl": "bicepscurl", 
    "Triceps Overhead Extension": "tricepspress",
    "Triceps Press": "tricepspress", 
    "Shoulder Press": "seatedchestpress", 
    "Plank": "plank",
    "Stretching": "stretching", 
    "Lying Knee Raise": "lyingkneeraise", 
    "Reverse Crunch": "reversecrunch",
    "Leg Raise Hip Lift": "legraisehiplift", 
    "EMS Lateral Raises (3kg)": "ems_l",
    "EMS Bicep Curls (3kg)": "bicepscurl", 
    "EMS Static Plank": "plank",
    "EMS Static Crunches": "ems_k", 
    "Ποδηλασία 30km": "cycling"
};

window.exercisesDB = [...STRENGTH_EXERCISES, ...EMS_EXERCISES];
