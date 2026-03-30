/* ==========================================================================
    PEGASUS DATA ENGINE - v10.4 (FULL 60MIN CIRCUIT)
    Protocol: Strict Hardware Mapping - Zero Mismatch Policy
   ========================================================================== */

window.program = {
    "Σάββατο": [{ name: "Cycling", sets: 1, muscleGroup: "Πόδια", weight: "0" }],
    "Κυριακή": [{ name: "Cycling", sets: 1, muscleGroup: "Πόδια", weight: "0" }],
    "Δευτέρα": [{ name: "Stretching", sets: 1, muscleGroup: "None", weight: "0" }],
    "Τρίτη": [
        { name: "Seated Chest Press", sets: 5, muscleGroup: "Στήθος", weight: "70" },
        { name: "Pec Deck Flys", sets: 4, muscleGroup: "Στήθος", weight: "45" },
        { name: "Seated Row", sets: 5, muscleGroup: "Πλάτη", weight: "55" },
        { name: "Lat Pulldown", sets: 4, muscleGroup: "Πλάτη", weight: "60" },
        { name: "Upright Row", sets: 5, muscleGroup: "Ώμοι", weight: "35" },
        { name: "Standing Bicep Curl", sets: 3, muscleGroup: "Χέρια", weight: "15" },
        { name: "Triceps Pushdown", sets: 3, muscleGroup: "Χέρια", weight: "20" },
        { name: "Ab Crunch Cable", sets: 3, muscleGroup: "Κορμός", weight: "45" }
    ], 
    "Τετάρτη": [
        { name: "EMS Training", sets: 1, muscleGroup: "Πλάτη", weight: "0" },
        { name: "Ab Crunch Cable", sets: 3, muscleGroup: "Κορμός", weight: "45" },
        { name: "Leg Raise Hip Lift", sets: 3, muscleGroup: "Κορμός", weight: "0" }
    ],
    "Πέμπτη": [{ name: "Stretching", sets: 1, muscleGroup: "None", weight: "0" }],
    "Παρασκευή": [
        { name: "Pushups", sets: 3, muscleGroup: "Στήθος", weight: "0" },
        { name: "Lat Pulldown", sets: 4, muscleGroup: "Πλάτη", weight: "60" },
        { name: "Bent Over Row", sets: 4, muscleGroup: "Πλάτη", weight: "40" },
        { name: "Lateral Raises", sets: 4, muscleGroup: "Ώμοι", weight: "10" },
        { name: "Leg Extension", sets: 4, muscleGroup: "Πόδια", weight: "50" }
    ]
};

// MASTER EXERCISES DATABASE
window.exercisesDB = [
    { name: "Seated Chest Press", muscleGroup: "Στήθος" },
    { name: "Pec Deck Flys", muscleGroup: "Στήθος" },
    { name: "Pushups", muscleGroup: "Στήθος" },
    { name: "Lat Pulldown", muscleGroup: "Πλάτη" },
    { name: "Seated Row", muscleGroup: "Πλάτη" },
    { name: "Bent Over Row", muscleGroup: "Πλάτη" },
    { name: "One Arm Pulldown", muscleGroup: "Πλάτη" },
    { name: "EMS Training", muscleGroup: "Πλάτη" },
    { name: "Upright Row", muscleGroup: "Ώμοι" },
    { name: "Lateral Raises", muscleGroup: "Ώμοι" },
    { name: "Shoulder Shrugs", muscleGroup: "Ώμοι" },
    { name: "Standing Bicep Curl", muscleGroup: "Χέρια" },
    { name: "Triceps Pushdown", muscleGroup: "Χέρια" },
    { name: "Preacher Curl", muscleGroup: "Χέρια" },
    { name: "Ab Crunch Cable", muscleGroup: "Κορμός" },
    { name: "Plank", muscleGroup: "Κορμός" },
    { name: "Reverse Crunch", muscleGroup: "Κορμός" },
    { name: "Leg Raise Hip Lift", muscleGroup: "Κορμός" },
    { name: "Leg Extension", muscleGroup: "Πόδια" },
    { name: "Standing Leg Curl", muscleGroup: "Πόδια" },
    { name: "Glute Kickbacks", muscleGroup: "Πόδια" },
    { name: "Cycling", muscleGroup: "Πόδια" },
    { name: "Stretching", muscleGroup: "None" },
    { name: "Warmup", muscleGroup: "None" }
];

// ASSET MAPPING
window.videoMap = {
    "Seated Chest Press": "chestpress",
    "Pec Deck Flys": "chestflys",
    "Pushups": "pushups",
    "Lat Pulldown": "latpulldowns",
    "Seated Row": "lowrowsseated",
    "Bent Over Row": "bentoverrows",
    "One Arm Pulldown": "onearmpulldowns",
    "Upright Row": "uprightrows",
    "Lateral Raises": "uprightrows",
    "Shoulder Shrugs": "uprightrows",
    "Standing Bicep Curl": "bicepcurls",
    "Triceps Pushdown": "triceppulldowns",
    "Preacher Curl": "preacherbicepcurls",
    "Ab Crunch Cable": "abcrunches",
    "Plank": "plank",
    "Reverse Crunch": "reversecrunch",
    "Leg Raise Hip Lift": "legraisehiplift",
    "Leg Extension": "legextensions",
    "Standing Leg Curl": "glutekickbacks",
    "Glute Kickbacks": "glutekickbacks",
    "Cycling": "cycling",
    "EMS Training": "ems",
    "Stretching": "stretching",
    "Warmup": "warmup"
};

console.log("🚀 PEGASUS DATA ENGINE: v10.4 Aligned & Full Schedule Active.");
