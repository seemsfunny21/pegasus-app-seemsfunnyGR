/* ==========================================================================
    PEGASUS DATA ENGINE - v10.1.5 (FINAL ASSET ALIGNMENT)
    Protocol: Fix 404 Video Errors & Clean Mapping
   ========================================================================== */

window.exercisesDB = [
    { name: "Seated Chest Press", muscleGroup: "Στήθος" },
    { name: "Chest Flys", muscleGroup: "Στήθος" },
    { name: "Pushups", muscleGroup: "Στήθος" },
    { name: "Lat Pulldowns", muscleGroup: "Πλάτη" },
    { name: "Close Grip Pulldown", muscleGroup: "Πλάτη" },
    { name: "Low Seated Row Wide", muscleGroup: "Πλάτη" },
    { name: "Straight Arm Pulldowns", muscleGroup: "Πλάτη" },
    { name: "One Arm Pulldowns", muscleGroup: "Πλάτη" },
    { name: "One Arm Rows", muscleGroup: "Πλάτη" },
    { name: "Bent Over Rows", muscleGroup: "Πλάτη" },
    { name: "Reverse Seated Rows", muscleGroup: "Πλάτη" },
    { name: "Upright Rows", muscleGroup: "Ώμοι" },
    { name: "Bicep Curls", muscleGroup: "Χέρια" },
    { name: "Preacher Bicep Curls", muscleGroup: "Χέρια" },
    { name: "Tricep Pulldowns", muscleGroup: "Χέρια" },
    { name: "Ab Crunches Cable", muscleGroup: "Κορμός" },
    { name: "Plank", muscleGroup: "Κορμός" },
    { name: "Leg Raise Hip Lift", muscleGroup: "Κορμός" },
    { name: "Reverse Crunch", muscleGroup: "Κορμός" },
    { name: "Lying Knee Raise", muscleGroup: "Κορμός" },
    { name: "Situps", muscleGroup: "Κορμός" },
    { name: "Glute Kickbacks", muscleGroup: "Πόδια" },
    { name: "Leg Extensions", muscleGroup: "Πόδια" },
    { name: "Ποδηλασία 30km", muscleGroup: "Πόδια" },
    { name: "EMS Training", muscleGroup: "Πλάτη" },
    { name: "Stretching", muscleGroup: "Κορμός" }
];

window.program = {
    "Δευτέρα": [{ name: "Stretching", sets: 1, muscleGroup: "Κορμός" }],
    "Τρίτη": [
        { name: "Seated Chest Press", sets: 4, muscleGroup: "Στήθος" },
        { name: "Chest Flys", sets: 4, muscleGroup: "Στήθος" },
        { name: "Upright Rows", sets: 4, muscleGroup: "Ώμοι" },
        { name: "Lat Pulldowns", sets: 4, muscleGroup: "Πλάτη" },
        { name: "Low Seated Row Wide", sets: 4, muscleGroup: "Πλάτη" }
    ],
    "Τετάρτη": [
        { name: "EMS Training", sets: 1, muscleGroup: "Πλάτη" },
        { name: "Bicep Curls", sets: 4, muscleGroup: "Χέρια" },
        { name: "Tricep Pulldowns", sets: 4, muscleGroup: "Χέρια" }
    ],
    "Πέμπτη": [{ name: "Stretching", sets: 1, muscleGroup: "Κορμός" }],
    "Παρασκευή": [
        { name: "Lat Pulldowns", sets: 4, muscleGroup: "Πλάτη" },
        { name: "Bent Over Rows", sets: 4, muscleGroup: "Πλάτη" },
        { name: "Bicep Curls", sets: 4, muscleGroup: "Χέρια" },
        { name: "Upright Rows", sets: 4, muscleGroup: "Ώμοι" },
        { name: "Seated Chest Press", sets: 4, muscleGroup: "Στήθος" }
    ],
    "Σάββατο": [{ name: "Ποδηλασία 30km", sets: 1, muscleGroup: "Πόδια" }],
    "Κυριακή": [{ name: "Ποδηλασία 30km", sets: 1, muscleGroup: "Πόδια" }]
};

window.videoMap = {
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
    "EMS Training": "ems"
};

console.log("✅ PEGASUS DATA ENGINE: Asset Mapping Corrected (v10.1.5).");
