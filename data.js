/* ==========================================================================
   PEGASUS DATA ENGINE - v10.5 (VOLUME CORRECTION & STRICT HYBRID)
   Protocol: Strict Analyst - Zero duration for EMS/Cycling. Full Shoulder Volume.
   ========================================================================== */

window.USER_PROFILE = { weight: 74, height: 1.87, age: 38, gender: "male" };
window.TARGET_SETS = { "Στήθος": 24, "Πλάτη": 24, "Ώμοι": 16, "Χέρια": 16, "Κορμός": 12, "Πόδια": 24 };
window.REST_TIME = 60; 

const STRENGTH_EXERCISES = [
    { name: "Seated Chest Press", muscleGroup: "Στήθος", defaultDuration: 45 },
    { name: "Pec Deck", muscleGroup: "Στήθος", defaultDuration: 45 },
    { name: "Pushups", muscleGroup: "Στήθος", defaultDuration: 45 },
    { name: "Lat Pulldown", muscleGroup: "Πλάτη", defaultDuration: 45 },
    { name: "Low Seated Row", muscleGroup: "Πλάτη", defaultDuration: 45 },
    { name: "Close Grip Pulldown", muscleGroup: "Πλάτη", defaultDuration: 45 }, // Προσθήκη
    { name: "Reverse Grip Cable Row", muscleGroup: "Πλάτη", defaultDuration: 45 }, // Προσθήκη
    { name: "Shoulder Press", muscleGroup: "Ώμοι", defaultDuration: 45 }, // Προσθήκη
    { name: "Lateral Raises", muscleGroup: "Ώμοι", defaultDuration: 45 }, // Προσθήκη
    { name: "Preacher Curl", muscleGroup: "Χέρια", defaultDuration: 45 },
    { name: "Standing Bicep Curl", muscleGroup: "Χέρια", defaultDuration: 45 },
    { name: "Triceps Press", muscleGroup: "Χέρια", defaultDuration: 45 },
    { name: "Triceps Overhead Extension", muscleGroup: "Χέρια", defaultDuration: 45 },
    { name: "Plank", muscleGroup: "Κορμός", defaultDuration: 45 },
    { name: "Leg Raise Hip Lift", muscleGroup: "Κορμός", defaultDuration: 45 },
    { name: "Reverse Crunch", muscleGroup: "Κορμός", defaultDuration: 45 }
];

const EMS_EXERCISES = [
    { name: "EMS Lateral Raises (3kg)", muscleGroup: "Ώμοι", sets: 4, duration: 0 }, 
    { name: "EMS Bicep Curls (3kg)", muscleGroup: "Χέρια", sets: 4, duration: 0 }, 
    { name: "EMS Static Plank", muscleGroup: "Κορμός", sets: 3, duration: 0 }, 
    { name: "EMS Static Crunches", muscleGroup: "Κορμός", sets: 3, duration: 0 }  
];

window.calculateDailyProgram = function(dayName) {
    if (dayName === "Δευτέρα" || dayName === "Πέμπτη") return [{ name: "Stretching", sets: 1, duration: 338 }];
    if (dayName === "Τετάρτη") return EMS_EXERCISES;
    
    if (dayName === "Κυριακή" || dayName === "Σάββατο") {
        return [
            { name: "Leg Raise Hip Lift", sets: 3, duration: 45, muscleGroup: "Κορμός" },
            { name: "Reverse Crunch", sets: 3, duration: 45, muscleGroup: "Κορμός" },
            { name: "Standing Bicep Curl", sets: 2, duration: 45, muscleGroup: "Χέρια" },
            { name: "Ποδηλασία 30km", sets: 1, duration: 0, muscleGroup: "Πόδια" } 
        ];
    }

    const history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
    const dayLimits = { "Τρίτη": 60, "Παρασκευή": 55 };
    let currentMins = 0;
    const program = [];

    // Οι Ώμοι εντάσσονται ΚΑΙ τις δύο μέρες για να καλύψουν το στόχο των 16 σετ.
    const focusGroups = (dayName === "Τρίτη") ? ["Στήθος", "Ώμοι", "Κορμός"] : ["Πλάτη", "Ώμοι", "Χέρια"];
    
    // Έξυπνη Ταξινόμηση Βάσει Ελλείμματος (Deficit Routing)
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
    "Lat Pulldown": "Pulldown", 
    "Close Grip Pulldown": "Pulldown", 
    "Behind the Neck Pulldown": "Pulldown", 
    "Low Seated Row": "LowSeatedRow",
    "Reverse Grip Cable Row": "ReverseGripCableRow", 
    "Reverse Chest Press": "reverserow",
    "Seated Chest Press": "SeatedChestPress", 
    "Seated Chest Press ": "SeatedChestPress", // <-- Προσθήκη Κλειδιού με Κενό
    "Pec Deck": "Pecdeck", 
    "Pushups": "Pushups",
    "Preacher Curl": "biceps", 
    "Standing Bicep Curl": "Bicepscurl", 
    "Triceps Overhead Extension": "Tricepspress",
    "Triceps Press": "Tricepspress", 
    "Leg Extension": "LegExtensions", 
    "Plank": "Plank",
    "Stretching": "stretching", 
    "Lying Knee Raise": "LyingKneeRaise", 
    "Reverse Crunch": "ReverseCrunch",
    "Leg Raise Hip Lift": "LegRaiseHipLift", 
    "EMS Κοιλιακών": "EMS_K", 
    "EMS Πλάτης": "EMS_P", 
    "EMS Ποδιών": "EMS_L", 
    "EMS Lateral Raises (3kg)": "EMS_L",
    "EMS Bicep Curls (3kg)": "Bicepscurl", 
    "EMS Static Plank": "Plank",
    "EMS Static Crunches": "EMS_K", 
    "Ποδηλασία 30km": "cycling"
};

window.exercisesDB = [...STRENGTH_EXERCISES, ...EMS_EXERCISES];
