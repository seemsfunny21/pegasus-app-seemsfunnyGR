/* ==========================================================================
   PEGASUS DATA ENGINE - v10.0 (STRICT HYBRID & NO-LEGS PROTOCOL)
   ========================================================================== */

window.USER_PROFILE = { weight: 74, height: 1.87, age: 38, gender: "male" }; // [cite: 2026-02-18]
window.TARGET_SETS = { "Στήθος": 24, "Πλάτη": 24, "Ώμοι": 16, "Χέρια": 16, "Κορμός": 12, "Πόδια": 24 }; //
window.REST_TIME = 60; 

const STRENGTH_EXERCISES = [
    { name: "Seated Chest Press", muscleGroup: "Στήθος", defaultDuration: 45 },
    { name: "Pec Deck", muscleGroup: "Στήθος", defaultDuration: 45 },
    { name: "Pushups", muscleGroup: "Στήθος", defaultDuration: 45 },
    { name: "Lat Pulldown", muscleGroup: "Πλάτη", defaultDuration: 45 },
    { name: "Low Seated Row", muscleGroup: "Πλάτη", defaultDuration: 45 },
    { name: "Preacher Curl", muscleGroup: "Χέρια", defaultDuration: 45 },
    { name: "Standing Bicep Curl", muscleGroup: "Χέρια", defaultDuration: 45 },
    { name: "Triceps Press", muscleGroup: "Χέρια", defaultDuration: 45 },
    { name: "Triceps Overhead Extension", muscleGroup: "Χέρια", defaultDuration: 45 },
    { name: "Plank", muscleGroup: "Κορμός", defaultDuration: 45 },
    { name: "Leg Raise Hip Lift", muscleGroup: "Κορμός", defaultDuration: 45 },
    { name: "Reverse Crunch", muscleGroup: "Κορμός", defaultDuration: 45 }
];

const EMS_EXERCISES = [
    { name: "EMS Lateral Raises (3kg)", muscleGroup: "Ώμοι", sets: 4, duration: 180 }, //
    { name: "EMS Bicep Curls (3kg)", muscleGroup: "Χέρια", sets: 4, duration: 180 }, //
    { name: "EMS Static Plank", muscleGroup: "Κορμός", sets: 3, duration: 180 }, //
    { name: "EMS Static Crunches", muscleGroup: "Κορμός", sets: 3, duration: 180 }  //
];

window.calculateDailyProgram = function(dayName) {
    // 1. RECOVERY DAYS [cite: 2026-03-02]
    if (dayName === "Δευτέρα" || dayName === "Πέμπτη") {
        return [{ name: "Stretching", sets: 1, duration: 338 }];
    }
    
    // 2. EMS DAY - 25 MINUTE CALIBRATION
    if (dayName === "Τετάρτη") {
        return EMS_EXERCISES;
    }

    // 3. HYBRID SUNDAY - CORE/ARMS + 110 MIN CYCLING [cite: 2026-03-23]
    if (dayName === "Κυριακή" || dayName === "Σάββατο") {
        return [
            { name: "Leg Raise Hip Lift", sets: 3, duration: 45 },
            { name: "Reverse Crunch", sets: 3, duration: 45 },
            { name: "Standing Bicep Curl", sets: 2, duration: 45 },
            { name: "Ποδηλασία 30km", sets: 1, duration: 6600 } // 110 λεπτά
        ];
    }

    const history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
    const dayLimits = { "Τρίτη": 60, "Παρασκευή": 55 };
    let currentMins = 0;
    const program = [];

    // Focus Groups ανά ημέρα για αποφυγή Spillover
    const focusGroups = (dayName === "Τρίτη") ? ["Στήθος", "Ώμοι", "Κορμός"] : ["Πλάτη", "Ώμοι", "Χέρια"];
    
    STRENGTH_EXERCISES.filter(ex => focusGroups.includes(ex.muscleGroup)).forEach(ex => {
        if (currentMins < (dayLimits[dayName] || 60)) {
            // Δυναμική απόδοση σετ για κάλυψη ελλειμμάτων
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
    });

    return program.length > 0 ? program : [{ name: "Stretching", sets: 1, duration: 338 }];
};

// Προ-υπολογισμός για συμβατότητα
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
    "Lat Pulldown": "Pulldown", 
    "Low Seated Row": "LowSeatedRow",
    "Seated Chest Press": "SeatedChestPress", 
    "Pec Deck": "Pecdeck", 
    "Pushups": "Pushups",
    "Preacher Curl": "biceps", 
    "Standing Bicep Curl": "Bicepscurl", 
    "Triceps Overhead Extension": "Tricepspress",
    "Triceps Press": "Tricepspress", 
    "Plank": "Plank",
    "Stretching": "stretching", 
    "Leg Raise Hip Lift": "LegRaiseHipLift", 
    "Reverse Crunch": "ReverseCrunch",
    "EMS Lateral Raises (3kg)": "EMS_L",
    "EMS Bicep Curls (3kg)": "Bicepscurl", 
    "EMS Static Plank": "Plank",
    "EMS Static Crunches": "EMS_K", 
    "Ποδηλασία 30km": "cycling"
};

window.exercisesDB = [...STRENGTH_EXERCISES, ...EMS_EXERCISES];
