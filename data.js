/* ==========================================================================
    PEGASUS DATA ENGINE - v10.2 (DYNAMIC & SATURDAY-CYCLE READY)
    Protocol: Autopilot Mode - Manual Overrides Disabled
    Single Source of Truth: exercisesDB
   ========================================================================== */

// 1. DYNAMIC PROGRAM PLACEHOLDERS
// Ο Optimizer θα αντικαταστήσει αυτά τα placeholders με πραγματικές ασκήσεις από το DB
window.program = {
    "Σάββατο": [{ name: "Cycling", sets: 1, muscleGroup: "Πόδια" }],
    "Κυριακή": [{ name: "Cycling", sets: 1, muscleGroup: "Πόδια" }],
    "Δευτέρα": [{ name: "Αποθεραπεία", sets: 0, muscleGroup: "None" }],
    "Τρίτη": [
        { name: "Chest Press", sets: 5, muscleGroup: "Στήθος" },
        { name: "Low Seated Row", sets: 5, muscleGroup: "Πλάτη" },
        { name: "Upright Rows", sets: 5, muscleGroup: "Ώμοι" }
    ], 
    "Τετάρτη": [
        { name: "EMS Training", sets: 1, muscleGroup: "Πλάτη" },
        { name: "Ab Crunches", sets: 3, muscleGroup: "Κορμός" }
    ],
    "Πέμπτη": [{ name: "Αποθεραπεία", sets: 0, muscleGroup: "None" }],
    "Παρασκευή": [
        { name: "Pushups", sets: 3, muscleGroup: "Στήθος" },
        { name: "Lat Pulldowns", sets: 3, muscleGroup: "Πλάτη" }
    ]
};

// 2. MASTER EXERCISES DATABASE (The Brain)
// Όλες οι ασκήσεις που έχεις ανεβάσει στο GitHub
window.exercisesDB = [
    // ΣΤΗΘΟΣ (Target: 24)
    { name: "Chest Press", muscleGroup: "Στήθος" },
    { name: "Chest Flys", muscleGroup: "Στήθος" },
    { name: "Pushups", muscleGroup: "Στήθος" },
    
    // ΠΛΑΤΗ (Target: 24)
    { name: "Low Seated Row", muscleGroup: "Πλάτη" },
    { name: "Lat Pulldowns", muscleGroup: "Πλάτη" },
    { name: "Lat Pulldowns Close", muscleGroup: "Πλάτη" },
    { name: "Bent Over Rows", muscleGroup: "Πλάτη" },
    { name: "Reverse Seated Rows", muscleGroup: "Πλάτη" },
    { name: "Straight Arm Pulldowns", muscleGroup: "Πλάτη" },
    { name: "EMS Training", muscleGroup: "Πλάτη" },

    // ΩΜΟΙ (Target: 16)
    { name: "Upright Rows", muscleGroup: "Ώμοι" },
    
    // ΧΕΡΙΑ (Target: 16)
    { name: "Bicep Curls", muscleGroup: "Χέρια" },
    { name: "Preacher Bicep Curls", muscleGroup: "Χέρια" },
    { name: "Tricep Pulldowns", muscleGroup: "Χέρια" },

    // ΚΟΡΜΟΣ (Target: 12)
    { name: "Ab Crunches", muscleGroup: "Κορμός" },
    { name: "Plank", muscleGroup: "Κορμός" },
    { name: "Leg Raise Hip Lift", muscleGroup: "Κορμός" },
    { name: "Situps", muscleGroup: "Κορμός" },
    { name: "Reverse Crunch", muscleGroup: "Κορμός" },
    { name: "Lying Knee Raise", muscleGroup: "Κορμός" },

    // ΠΟΔΙΑ (Target: 24 - Cardio Adjusted)
    { name: "Leg Extensions", muscleGroup: "Πόδια" },
    { name: "Glute Kickbacks", muscleGroup: "Πόδια" },
    { name: "Cycling", muscleGroup: "Πόδια" },

    // OTHER
    { name: "Stretching", muscleGroup: "None" },
    { name: "Warmup", muscleGroup: "None" }
];

// 3. ASSET MAPPING (v10.2)
window.videoMap = {
    "Ab Crunches": "abcrunches",
    "Bent Over Rows": "bentoverrows",
    "Bicep Curls": "bicepcurls",
    "Chest Flys": "chestflys",
    "Chest Press": "chestpress",
    "Cycling": "cycling",
    "EMS Training": "ems",
    "Glute Kickbacks": "glutekickbacks",
    "Lat Pulldowns": "latpulldowns",
    "Lat Pulldowns Close": "latpulldownsclose",
    "Leg Extensions": "legextensions",
    "Leg Raise Hip Lift": "legraisehiplift",
    "Low Seated Row": "lowrowsseated",
    "Lying Knee Raise": "lyingkneeraise",
    "Plank": "plank",
    "Preacher Bicep Curls": "preacherbicepcurls",
    "Pushups": "pushups",
    "Reverse Crunch": "reversecrunch",
    "Reverse Seated Rows": "reverseseatedrows",
    "Situps": "situps",
    "Straight Arm Pulldowns": "straightarmpulldowns",
    "Stretching": "stretching",
    "Tricep Pulldowns": "triceppulldowns",
    "Upright Rows": "uprightrows",
    "Warmup": "warmup"
};

console.log("🚀 PEGASUS DATA ENGINE: v10.2 Dynamic Mapping Loaded.");
