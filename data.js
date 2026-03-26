/* ==========================================================================
   PEGASUS DATA ENGINE - v9.0 (MODULAR / FULLY DECOUPLED)
   Protocol: Strict Data Analyst - Encapsulated Configuration & Mapping
   ========================================================================== */

const PegasusData = (function() {
    // 1. ΙΔΙΩΤΙΚΟ STATE & ΡΥΘΜΙΣΕΙΣ (Private Configuration)
    const USER_PROFILE = { weight: 74, height: 187, age: 38, gender: "male" };
    const TARGET_SETS = { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 };
    const REST_TIME = 60; 
    const MAX_DAILY_MINUTES = 60;

    // 2. ΥΠΟΣΥΣΤΗΜΑ ΑΠΟΘΗΚΕΥΣΗΣ (Storage Protocol)
    const storeProtocol = {
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

    // 3. ΒΑΣΗ ΔΕΔΟΜΕΝΩΝ ΑΣΚΗΣΕΩΝ (Exercises Database)
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
        { name: "Leg Raise Hip Lift", muscleGroup: "Κορμός", defaultDuration: 45 },
        { name: "Reverse Crunch", muscleGroup: "Κορμός", defaultDuration: 45 },
        { name: "Lying Knee Raise", muscleGroup: "Κορμός", defaultDuration: 45 },
        { name: "Situps", muscleGroup: "Κορμός", defaultDuration: 45 },
        { name: "Glute Kickbacks", muscleGroup: "Πόδια", defaultDuration: 45 },
        { name: "Leg Extensions", muscleGroup: "Πόδια", defaultDuration: 45 }
    ];

    // 4. ΜΗΧΑΝΙΣΜΟΣ ΔΥΝΑΜΙΚΟΥ ΠΡΟΓΡΑΜΜΑΤΟΣ (Dynamic Program Generator)
    const generateProgram = function(dayName) {
        if (dayName === "Δευτέρα" || dayName === "Πέμπτη") return [{ name: "Stretching", sets: 1, duration: 338, muscleGroup: "Κορμός" }];
        if (dayName === "Τετάρτη") return [
            { name: "EMS Lateral Raises (3kg)", muscleGroup: "Ώμοι", sets: 4, duration: 300 },
            { name: "EMS Bicep Curls (3kg)", muscleGroup: "Χέρια", sets: 4, duration: 300 },
            { name: "EMS Static Plank", muscleGroup: "Κορμός", sets: 3, duration: 450 },
            { name: "EMS Static Crunches", muscleGroup: "Κορμός", sets: 3, duration: 450 }
        ];

        const history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
        let currentMins = 0;
        const programArr = [];

        const focusGroups = (dayName === "Τρίτη") ? ["Στήθος", "Ώμοι", "Πλάτη"] : 
                            (dayName === "Παρασκευή") ? ["Πλάτη", "Χέρια", "Ώμοι", "Στήθος"] : ["Κορμός"];
        
        focusGroups.forEach(group => {
            const groupEx = STRENGTH_EXERCISES.filter(ex => ex.muscleGroup === group);
            groupEx.forEach(ex => {
                if (currentMins + 7 <= MAX_DAILY_MINUTES) {
                    programArr.push({ ...ex, sets: 4, duration: 45 });
                    currentMins += 7;
                }
            });
        });

        if (dayName === "Σάββατο" || dayName === "Κυριακή") {
            programArr.push({ name: "Ποδηλασία 30km", sets: 1, duration: 0, muscleGroup: "Πόδια" });
        }

        return programArr;
    };

    const weeklyProgram = {
        "Δευτέρα": generateProgram("Δευτέρα"),
        "Τρίτη": generateProgram("Τρίτη"),
        "Τετάρτη": generateProgram("Τετάρτη"),
        "Πέμπτη": generateProgram("Πέμπτη"),
        "Παρασκευή": generateProgram("Παρασκευή"),
        "Σάββατο": generateProgram("Σάββατο"),
        "Κυριακή": generateProgram("Κυριακή")
    };

    // 5. ΧΑΡΤΟΓΡΑΦΗΣΗ ΒΙΝΤΕΟ (Video Mapping)
    const vMap = {
        "Seated Chest Press": "chestpress",
        "Chest Flys": "chestflys",
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

    // 6. PUBLIC API
    return {
        profile: USER_PROFILE,
        targets: TARGET_SETS,
        restTime: REST_TIME,
        maxDailyMinutes: MAX_DAILY_MINUTES,
        store: storeProtocol,
        exercisesDB: STRENGTH_EXERCISES,
        calculateDailyProgram: generateProgram,
        program: weeklyProgram,
        videoMap: vMap
    };
})();

// Εξαγωγή στο Window Scope για διασφάλιση συμβατότητας (Cross-Module Sync)
window.PegasusStore = PegasusData.store;
window.exercisesDB = PegasusData.exercisesDB;
window.calculateDailyProgram = PegasusData.calculateDailyProgram;
window.program = PegasusData.program;
window.videoMap = PegasusData.videoMap;
