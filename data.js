/* ==========================================================================
    PEGASUS DATA ENGINE - v10.1.9 (FINAL SURGICAL ALIGNMENT)
    Protocol: Matching GitHub Video Assets & Removing "One Arm" Exercises
   ========================================================================== */

window.program = {
    "Δευτέρα": [
        { name: "Low Seated Row", sets: 3, muscleGroup: "Πλάτη" },
        { name: "Lat Pulldowns", sets: 3, muscleGroup: "Πλάτη" },
        { name: "Chest Press", sets: 3, muscleGroup: "Στήθος" },
        { name: "Chest Flys", sets: 3, muscleGroup: "Στήθος" },
        { name: "Pushups", sets: 3, muscleGroup: "Στήθος" },
        { name: "Upright Rows", sets: 3, muscleGroup: "Ώμοι" },
        { name: "Bicep Curls", sets: 3, muscleGroup: "Χέρια" },
        { name: "Tricep Pulldowns", sets: 3, muscleGroup: "Χέρια" }
    ],
    "Τρίτη": [{ name: "EMS Training", sets: 1, muscleGroup: "Πλάτη" }],
    "Τετάρτη": [
        { name: "Bent Over Rows", sets: 3, muscleGroup: "Πλάτη" },
        { name: "Lat Pulldowns Close", sets: 3, muscleGroup: "Πλάτη" },
        { name: "Chest Press", sets: 3, muscleGroup: "Στήθος" },
        { name: "Leg Extensions", sets: 3, muscleGroup: "Πόδια" },
        { name: "Ab Crunches", sets: 3, muscleGroup: "Κορμός" },
        { name: "Plank", sets: 3, muscleGroup: "Κορμός" },
        { name: "Bicep Curls", sets: 3, muscleGroup: "Χέρια" },
        { name: "Preacher Bicep Curls", sets: 3, muscleGroup: "Χέρια" }
    ],
    "Πέμπτη": [{ name: "Stretching", sets: 1, muscleGroup: "Κορμός" }],
    "Παρασκευή": [{ name: "EMS Training", sets: 1, muscleGroup: "Πλάτη" }],
    "Σάββατο": [
        { name: "Low Seated Row", sets: 3, muscleGroup: "Πλάτη" },
        { name: "Lat Pulldowns", sets: 3, muscleGroup: "Πλάτη" },
        { name: "Chest Press", sets: 3, muscleGroup: "Στήθος" },
        { name: "Upright Rows", sets: 3, muscleGroup: "Ώμοι" },
        { name: "Reverse Seated Rows", sets: 3, muscleGroup: "Πλάτη" },
        { name: "Tricep Pulldowns", sets: 3, muscleGroup: "Χέρια" },
        { name: "Leg Raise Hip Lift", sets: 3, muscleGroup: "Κορμός" }
    ],
    "Κυριακή": [{ name: "Cycling", sets: 1, muscleGroup: "Πόδια" }]
};

// --- ΑΥΣΤΗΡΗ ΑΝΤΙΣΤΟΙΧΙΣΗ ΜΕ ΤΑ FILENAMES ΤΩΝ ΦΩΤΟΓΡΑΦΙΩΝ ΣΟΥ ---
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

window.exercisesDB = [
    { name: "Ab Crunches", muscleGroup: "Κορμός" },
    { name: "Bent Over Rows", muscleGroup: "Πλάτη" },
    { name: "Bicep Curls", muscleGroup: "Χέρια" },
    { name: "Chest Flys", muscleGroup: "Στήθος" },
    { name: "Chest Press", muscleGroup: "Στήθος" },
    { name: "Cycling", muscleGroup: "Πόδια" },
    { name: "EMS Training", muscleGroup: "Πλάτη" },
    { name: "Glute Kickbacks", muscleGroup: "Πόδια" },
    { name: "Lat Pulldowns", muscleGroup: "Πλάτη" },
    { name: "Lat Pulldowns Close", muscleGroup: "Πλάτη" },
    { name: "Leg Extensions", muscleGroup: "Πόδια" },
    { name: "Leg Raise Hip Lift", muscleGroup: "Κορμός" },
    { name: "Low Seated Row", muscleGroup: "Πλάτη" },
    { name: "Lying Knee Raise", muscleGroup: "Κορμός" },
    { name: "Plank", muscleGroup: "Κορμός" },
    { name: "Preacher Bicep Curls", muscleGroup: "Χέρια" },
    { name: "Pushups", muscleGroup: "Στήθος" },
    { name: "Reverse Crunch", muscleGroup: "Κορμός" },
    { name: "Reverse Seated Rows", muscleGroup: "Πλάτη" },
    { name: "Situps", muscleGroup: "Κορμός" },
    { name: "Straight Arm Pulldowns", muscleGroup: "Πλάτη" },
    { name: "Stretching", muscleGroup: "Κορμός" },
    { name: "Tricep Pulldowns", muscleGroup: "Χέρια" },
    { name: "Upright Rows", muscleGroup: "Ώμοι" }
];

console.log("✅ PEGASUS DATA ENGINE: Final v10.1.9 Surgical Alignment Active.");
