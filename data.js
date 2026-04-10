/* ==========================================================================
   PEGASUS DATA ENGINE - v10.10 (STRICT ASSET ALIGNMENT & CLEAN NAMING)
   Protocol: Absolute Visual Mapping - Clean Strings
   ========================================================================== */

window.program = {
    "Σάββατο": [{ name: "Cycling", sets: 1, muscleGroup: "Πόδια", weight: "0" }],
    "Κυριακή": [{ name: "Cycling", sets: 1, muscleGroup: "Πόδια", weight: "0" }],
    "Δευτέρα": [{ name: "Stretching", sets: 1, muscleGroup: "None", weight: "0" }],
    "Τρίτη": [
        { name: "Chest Press", sets: 5, muscleGroup: "Στήθος", weight: "70" },
        { name: "Chest Flys", sets: 4, muscleGroup: "Στήθος", weight: "45" },
        { name: "Seated Rows", sets: 5, muscleGroup: "Πλάτη", weight: "55" },
        { name: "Wide Pulldowns", sets: 4, muscleGroup: "Πλάτη", weight: "60" },
        { name: "Upright Rows", sets: 5, muscleGroup: "Ώμοι", weight: "35" },
        { name: "Bicep Curls", sets: 3, muscleGroup: "Χέρια", weight: "15" },
        { name: "Tricep Pulldowns", sets: 3, muscleGroup: "Χέρια", weight: "20" },
        { name: "Ab Crunches", sets: 3, muscleGroup: "Κορμός", weight: "45" }
    ], 
    "Τετάρτη": [
        { name: "EMS Training", sets: 1, muscleGroup: "Πλάτη", weight: "0" },
        { name: "Ab Crunches", sets: 3, muscleGroup: "Κορμός", weight: "45" },
        { name: "Leg Raise Hip Lift", sets: 3, muscleGroup: "Κορμός", weight: "0" }
    ],
    "Πέμπτη": [{ name: "Stretching", sets: 1, muscleGroup: "None", weight: "0" }],
    "Παρασκευή": [
        { name: "Pushups", sets: 3, muscleGroup: "Στήθος", weight: "0" },
        { name: "Medium Pulldowns", sets: 4, muscleGroup: "Πλάτη", weight: "60" },
        { name: "Bent Over Rows", sets: 4, muscleGroup: "Πλάτη", weight: "40" },
        { name: "Straight Arm Pulldowns", sets: 4, muscleGroup: "Πλάτη", weight: "20" },
        { name: "Leg Extensions", sets: 4, muscleGroup: "Πόδια", weight: "50" }
    ]
};

// MASTER EXERCISES DATABASE
window.exercisesDB = [
    { name: "Chest Press", muscleGroup: "Στήθος" },
    { name: "Chest Flys", muscleGroup: "Στήθος" },
    { name: "Pushups", muscleGroup: "Στήθος" },
    { name: "Wide Pulldowns", muscleGroup: "Πλάτη" },
    { name: "Medium Pulldowns", muscleGroup: "Πλάτη" },
    { name: "Neck Pulldowns", muscleGroup: "Πλάτη" },
    { name: "Close Grip Lat Pulldowns", muscleGroup: "Πλάτη" },
    { name: "Seated Rows", muscleGroup: "Πλάτη" },
    { name: "Reverse Seated Rows", muscleGroup: "Πλάτη" },
    { name: "Bent Over Rows", muscleGroup: "Πλάτη" },
    { name: "Straight Arm Pulldowns", muscleGroup: "Πλάτη" },
    { name: "EMS Training", muscleGroup: "Πλάτη" },
    { name: "Upright Rows", muscleGroup: "Ώμοι" },
    { name: "Bicep Curls", muscleGroup: "Χέρια" },
    { name: "Preacher Curls", muscleGroup: "Χέρια" },
    { name: "Tricep Pulldowns", muscleGroup: "Χέρια" },
    { name: "Ab Crunches", muscleGroup: "Κορμός" },
    { name: "Sit Ups", muscleGroup: "Κορμός" },
    { name: "Plank", muscleGroup: "Κορμός" },
    { name: "Reverse Crunch", muscleGroup: "Κορμός" },
    { name: "Lying Knee Raise", muscleGroup: "Κορμός" },
    { name: "Leg Raise Hip Lift", muscleGroup: "Κορμός" },
    { name: "Leg Extensions", muscleGroup: "Πόδια" },
    { name: "Cycling", muscleGroup: "Πόδια" },
    { name: "Stretching", muscleGroup: "None" },
    { name: "Warmup", muscleGroup: "None" }
];

// ASSET MAPPING (VERIFIED AGAINST GITHUB REPO & CLEANED)
window.videoMap = {
    "Chest Press": "chestpress",
    "Chest Flys": "chestflys",
    "Pushups": "pushups",
    
    // 🎯 THE PULLDOWN TRIFECTA (Clean Names, Same Video)
    "Wide Pulldowns": "latpulldowns",
    "Medium Pulldowns": "latpulldowns",
    "Neck Pulldowns": "latpulldowns",
    
    "Close Grip Lat Pulldowns": "latpulldownsclose",
    "Seated Rows": "lowrowsseated",
    "Reverse Seated Rows": "reverseseatedrows",
    "Bent Over Rows": "bentoverrows",
    "Straight Arm Pulldowns": "straightarmpulldowns",
    "EMS Training": "ems",
    "Upright Rows": "uprightrows",
    "Bicep Curls": "bicepcurls",
    "Preacher Curls": "preacherbicepcurls",
    "Tricep Pulldowns": "triceppulldowns",
    "Ab Crunches": "abcrunches",
    "Sit Ups": "situps",
    "Plank": "plank",
    "Reverse Crunch": "reversecrunch",
    "Lying Knee Raise": "lyingkneeraise",
    "Leg Raise Hip Lift": "legraisehiplift",
    "Leg Extensions": "legextensions",
    "Cycling": "cycling",
    "Stretching": "stretching",
    "Warmup": "warmup"
};

console.log("🚀 PEGASUS DATA ENGINE: v10.10 Verified Server Assets. Clean Pulldown Trifecta Active.");
