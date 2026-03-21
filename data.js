/* ==========================================================================
   PEGASUS DATA ENGINE - v4.8 (STRICT NAME EDITION)
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
    // Διατήρηση ονομασίας με κενό για την εικόνα Seated Chest Press στους Ώμους
    { name: "Seated Chest Press ", muscleGroup: "Ώμοι", defaultDuration: 45 }, 
    { name: "Plank", muscleGroup: "Κορμός", defaultDuration: 45 },
    { name: "Leg Raise Hip Lift", muscleGroup: "Κορμός", defaultDuration: 45 },
    { name: "Reverse Crunch", muscleGroup: "Κορμός", defaultDuration: 45 },
    { name: "Lying Knee Raise", muscleGroup: "Κορμός", defaultDuration: 45 }
];

const EMS_EXERCISES = [
    { name: "EMS Lateral Raises (3kg)", muscleGroup: "Ώμοι", sets: 4, duration: 300 },
    { name: "EMS Bicep Curls (3kg)", muscleGroup: "Χέρια", sets: 4, duration: 300 },
    { name: "EMS Static Plank", muscleGroup: "Κορμός", sets: 3, duration: 450 },
    { name: "EMS Static Crunches", muscleGroup: "Κορμός", sets: 3, duration: 450 }
];

window.calculateDailyProgram = function(dayName) {
    if (dayName === "Δευτέρα" || dayName === "Πέμπτη") {
        return [{ name: "Stretching", sets: 1, duration: 338 }];
    }
    if (dayName === "Τετάρτη") {
        return EMS_EXERCISES;
    }

    const history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
    let currentTotalMinutes = 0;
    const availableExercises = [];
    const MIN_TARGET_MINUTES = 50; 

    if (dayName === "Σάββατο" || dayName === "Κυριακή") {
        if ((history["Πόδια"] || 0) < window.TARGET_SETS["Πόδια"]) {
            return [{ name: "Ποδηλασία 30km", sets: 1, duration: 3600 }];
        }
    }

    const deficits = Object.keys(window.TARGET_SETS).map(group => {
        const current = history[group] || 0;
        const target = window.TARGET_SETS[group];
        return { group, deficit: Math.max(0, target - current), ratio: current / target };
    }).sort((a, b) => a.ratio - b.ratio);

    for (const item of deficits) {
        if (item.deficit <= 0 || item.group === "Πόδια") continue;
        
        const groupEx = STRENGTH_EXERCISES.filter(ex => ex.muscleGroup === item.group);
        
        for (const exercise of groupEx) {
            if (currentTotalMinutes >= MIN_TARGET_MINUTES) break;
            
            if (availableExercises.find(e => e.name === exercise.name)) continue;

            let setsToSuggest = 4; 
            let timeNeeded = (setsToSuggest * (exercise.defaultDuration + window.REST_TIME)) / 60;
            
            if (currentTotalMinutes + timeNeeded <= window.MAX_DAILY_MINUTES) {
                availableExercises.push({ 
                    name: exercise.name, 
                    sets: setsToSuggest, 
                    duration: exercise.defaultDuration, 
                    muscleGroup: item.group 
                });
                currentTotalMinutes += timeNeeded;
            }
        }
    }
    
    return availableExercises.length > 0 ? availableExercises : [{ name: "Stretching", sets: 1, duration: 338 }];
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
    // Strength Exercises - Updated to match physical filenames
    "Lat Pulldown": "pulldownimage", 
    "Close Grip Pulldown": "pulldownimage", 
    "Low Seated Row": "lowseatedrowimage",
    "Reverse Grip Cable Row": "reversegripcablerowimage", 
    "Reverse Chest Press": "reversechestpressimage",
    "Seated Chest Press": "SeatedChestPressImage", 
    "Seated Chest Press ": "SeatedChestPressImage", 
    "Pec Deck": "PecDeckImage", 
    "Pushups": "PushupsImage",
    "Preacher Curl": "preachercurlimage", 
    "Standing Bicep Curl": "standingbicepcurlimage", 
    "Triceps Overhead Extension": "tricepsoverheadimage",
    "Triceps Press": "tricepspressimage", 
    "Plank": "PlankImage",
    "Stretching": "StretchingImage", 
    "Lying Knee Raise": "lyingkneeraiseimage", 
    "Reverse Crunch": "reversecrunchimage",
    "Leg Raise Hip Lift": "legraisehipliftimage", 
    
    // EMS Exercises
    "EMS Lateral Raises (3kg)": "emslimage",
    "EMS Bicep Curls (3kg)": "standingbicepcurlimage", 
    "EMS Static Plank": "PlankImage",
    "EMS Static Crunches": "reversecrunchimage", 
    
    // Cardio
    "Ποδηλασία 30km": "bikelimage"
};

window.exercisesDB = [...STRENGTH_EXERCISES, ...EMS_EXERCISES];
