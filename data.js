/* ==========================================================================
   PEGASUS DATA ENGINE - v8.8 (FINAL CLEAN BUILD)
   Protocol: Strict Data Analyst - Indoor Weekend Pivot & Emoji-Free
   ========================================================================== */

window.USER_PROFILE = { weight: 74, height: 187, age: 38, gender: "male" };
window.TARGET_SETS = { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 };
window.REST_TIME = 60; 
window.MAX_DAILY_MINUTES = 60;

/**
 * 1. PEGASUS STORE PROTOCOL
 */
window.PegasusStore = {
    keys: {
        foodPrefix: "food_log_",
        kcalTotal: "pegasus_diet_kcal", 
        protTotal: "pegasus_today_protein",
        library: "pegasus_food_library"
    },

    getFoodLog: function(dateStr) {
        const key = this.keys.foodPrefix + dateStr;
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (e) { return []; }
    },

    saveFoodLog: function(dateStr, logArray) {
        if (!Array.isArray(logArray)) return false;
        localStorage.setItem(this.keys.foodPrefix + dateStr, JSON.stringify(logArray));
        return true;
    },

    updateDailyTotals: function(kcal, prot) {
        localStorage.setItem(this.keys.kcalTotal, parseFloat(kcal).toFixed(1));
        localStorage.setItem(this.keys.protTotal, parseFloat(prot).toFixed(1));
    }
};

/**
 * 2. MASTER EXERCISE DATABASE (v8.8 Filtered)
 */
const STRENGTH_EXERCISES = [
    { name: "Seated Chest Press", muscleGroup: "Στήθος", defaultDuration: 45 },
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
    { name: "Leg Raise Hip Lift", muscleGroup: "Κορμός", defaultDuration: 45 },
    { name: "Reverse Crunch", muscleGroup: "Κορμός", defaultDuration: 45 },
    { name: "Lying Knee Raise", muscleGroup: "Κορμός", defaultDuration: 45 },
    { name: "Situps", muscleGroup: "Κορμός", defaultDuration: 45 },
    { name: "Glute Kickbacks", muscleGroup: "Πόδια", defaultDuration: 45 },
    { name: "Leg Extensions", muscleGroup: "Πόδια", defaultDuration: 45 }
];

window.exercisesDB = STRENGTH_EXERCISES;

/**
 * 3. DYNAMIC PROGRAM GENERATOR (v8.8 - WEEKEND PIVOT)
 */
window.calculateDailyProgram = function(dayName, isRainy = false) {
    if (dayName === "Δευτέρα" || dayName === "Πέμπτη") {
        return [{ name: "Stretching", sets: 1, duration: 338, muscleGroup: "Κορμός" }];
    }
    
    if (dayName === "Τετάρτη") {
        return [
            { name: "EMS Lateral Raises (3kg)", muscleGroup: "Ώμοι", sets: 4, duration: 300 },
            { name: "EMS Bicep Curls (3kg)", muscleGroup: "Χέρια", sets: 4, duration: 300 },
            { name: "EMS Static Plank", muscleGroup: "Κορμός", sets: 3, duration: 450 },
            { name: "EMS Static Crunches", muscleGroup: "Κορμός", sets: 3, duration: 450 }
        ];
    }

    let currentMins = 0;
    const program = [];
    const MAX_MINS = (dayName === "Κυριακή") ? 40 : 60;

    // DYNAMIC FOCUS SELECTION
    let focusGroups = [];
    if (dayName === "Τρίτη") focusGroups = ["Στήθος", "Ώμοι", "Πλάτη"];
    else if (dayName === "Παρασκευή") focusGroups = ["Πλάτη", "Χέρια", "Ώμοι", "Στήθος"];
    else if (dayName === "Σάββατο") focusGroups = isRainy ? ["Πόδια", "Κορμός"] : ["Κορμός"];
    else if (dayName === "Κυριακή") focusGroups = ["Στήθος", "Ώμοι", "Πλάτη"];
    else focusGroups = ["Κορμός"];
    
    focusGroups.forEach(group => {
        const groupEx = STRENGTH_EXERCISES.filter(ex => ex.muscleGroup === group);
        groupEx.forEach(ex => {
            if (currentMins + 7 <= MAX_MINS) {
                program.push({ ...ex, sets: 4, duration: 45 });
                currentMins += 7;
            }
        });
    });

    // Ποδηλασία μόνο αν έχει ήλιο και δεν είναι Κυριακή
    if ((dayName === "Σάββατο" || dayName === "Κυριακή") && !isRainy && dayName !== "Κυριακή") {
        program.push({ name: "Ποδηλασία 30km", sets: 1, duration: 0, muscleGroup: "Πόδια" });
    }

    return program;
};

// Global Program Export
window.program = {
    "Δευτέρα": window.calculateDailyProgram("Δευτέρα"),
    "Τρίτη": window.calculateDailyProgram("Τρίτη"),
    "Τετάρτη": window.calculateDailyProgram("Τετάρτη"),
    "Πέμπτη": window.calculateDailyProgram("Πέμπτη"),
    "Παρασκευή": window.calculateDailyProgram("Παρασκευή"),
    "Σάββατο": window.calculateDailyProgram("Σάββατο"),
    "Κυριακή": window.calculateDailyProgram("Κυριακή")
};

/**
 * 4. VIDEO MAPPING SYSTEM
 */
window.videoMap = {
    "Seated Chest Press": "chestpress",
    "Pushups": "pushups",
    "Lat Pulldowns": "latpulldowns",
    "Close Grip Pulldown": "latpulldownsclose",
    "Low Seated Row Wide": "lowrowsseated",
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
