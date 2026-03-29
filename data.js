/* ==========================================================================
    PEGASUS DATA ENGINE - v10.3 (HARDWARE & ASSET ALIGNED)
    Protocol: Strict Hardware Mapping - Zero Mismatch Policy
    Single Source of Truth: exercisesDB synced with physical machine decals
   ========================================================================== */

// 1. DYNAMIC PROGRAM PLACEHOLDERS
window.program = {
    "Σάββατο": [{ name: "Cycling", sets: 1, muscleGroup: "Πόδια" }],
    "Κυριακή": [{ name: "Cycling", sets: 1, muscleGroup: "Πόδια" }],
    "Δευτέρα": [{ name: "Αποθεραπεία", sets: 0, muscleGroup: "None" }],
    "Τρίτη": [
        { name: "Seated Chest Press", sets: 5, muscleGroup: "Στήθος" },
        { name: "Seated Row", sets: 5, muscleGroup: "Πλάτη" },
        { name: "Upright Row", sets: 5, muscleGroup: "Ώμοι" }
    ], 
    "Τετάρτη": [
        { name: "EMS Training", sets: 1, muscleGroup: "Πλάτη" },
        { name: "Ab Crunch Cable", sets: 3, muscleGroup: "Κορμός" }
    ],
    "Πέμπτη": [{ name: "Αποθεραπεία", sets: 0, muscleGroup: "None" }],
    "Παρασκευή": [
        { name: "Pushups", sets: 3, muscleGroup: "Στήθος" },
        { name: "Lat Pulldown", sets: 3, muscleGroup: "Πλάτη" }
    ]
};

// 2. MASTER EXERCISES DATABASE (The Brain)
// Πλήρης ευθυγράμμιση με τις φωτογραφίες του οργάνου
window.exercisesDB = [
    // ΣΤΗΘΟΣ
    { name: "Seated Chest Press", muscleGroup: "Στήθος" },
    { name: "Pec Deck Flys", muscleGroup: "Στήθος" },
    { name: "Pushups", muscleGroup: "Στήθος" },

    // ΠΛΑΤΗ
    { name: "Lat Pulldown", muscleGroup: "Πλάτη" },
    { name: "Seated Row", muscleGroup: "Πλάτη" },
    { name: "Bent Over Row", muscleGroup: "Πλάτη" },
    { name: "One Arm Pulldown", muscleGroup: "Πλάτη" },
    { name: "EMS Training", muscleGroup: "Πλάτη" },

    // ΩΜΟΙ
    { name: "Upright Row", muscleGroup: "Ώμοι" },
    { name: "Lateral Raises", muscleGroup: "Ώμοι" },
    { name: "Shoulder Shrugs", muscleGroup: "Ώμοι" },

    // ΧΕΡΙΑ
    { name: "Standing Bicep Curl", muscleGroup: "Χέρια" },
    { name: "Triceps Pushdown", muscleGroup: "Χέρια" },
    { name: "Preacher Curl", muscleGroup: "Χέρια" },

    // ΚΟΡΜΟΣ
    { name: "Ab Crunch Cable", muscleGroup: "Κορμός" },
    { name: "Plank", muscleGroup: "Κορμός" },
    { name: "Reverse Crunch", muscleGroup: "Κορμός" },
    { name: "Leg Raise Hip Lift", muscleGroup: "Κορμός" },

    // ΠΟΔΙΑ
    { name: "Leg Extension", muscleGroup: "Πόδια" },
    { name: "Standing Leg Curl", muscleGroup: "Πόδια" },
    { name: "Glute Kickbacks", muscleGroup: "Πόδια" },
    { name: "Cycling", muscleGroup: "Πόδια" },

    // OTHER
    { name: "Stretching", muscleGroup: "Κορμός" },
    { name: "Warmup", muscleGroup: "None" }
];

// 3. ASSET MAPPING (v10.3 - FIXED MISMATCHES)
// Κάθε όνομα από το DB αντιστοιχίζεται σε ένα υπαρκτό .mp4 αρχείο
window.videoMap = {
    "Seated Chest Press": "chestpress",
    "Pec Deck Flys": "chestflys",
    "Pushups": "pushups",
    "Lat Pulldown": "latpulldowns",
    "Seated Row": "lowrowsseated",
    "Bent Over Row": "bentoverrows",
    "One Arm Pulldown": "onearmpulldowns",
    "Upright Row": "uprightrows",
    "Lateral Raises": "uprightrows", // Use uprightrows as visual proxy
    "Shoulder Shrugs": "uprightrows",
    "Standing Bicep Curl": "bicepcurls",
    "Triceps Pushdown": "tricepcurls",
    "Preacher Curl": "preacherbicepcurls",
    "Ab Crunch Cable": "abcrunches",
    "Plank": "plank",
    "Reverse Crunch": "reversecrunch",
    "Leg Raise Hip Lift": "legraisehiplift",
    "Leg Extension": "legextensions",
    "Standing Leg Curl": "glutekickbacks", // Use kickbacks as visual proxy
    "Glute Kickbacks": "glutekickbacks",
    "Cycling": "cycling",
    "EMS Training": "ems",
    "Stretching": "stretching",
    "Warmup": "warmup"
};

console.log("🚀 PEGASUS DATA ENGINE: v10.3 Aligned with Hardware Decals.");
