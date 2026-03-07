/* ==========================================================================
   PEGASUS DATA ENGINE - HYBRID CYCLING EDITION v2.1 (OPTIMIZED VOLUME)
   ========================================================================== */

// 1. Βάση Δεδομένων για το Inventory Handler
window.exercisesDB = [
    { name: "Seated Chest Press", muscleGroup: "Στήθος" },
    { name: "Pec Deck", muscleGroup: "Στήθος" },
    { name: "Pushups", muscleGroup: "Στήθος" },
    { name: "Reverse Chest Press", muscleGroup: "Πλάτη" },
    { name: "Lat Pulldown", muscleGroup: "Πλάτη" },
    { name: "Low Seated Row", muscleGroup: "Πλάτη" },
    { name: "Close Grip Pulldown", muscleGroup: "Πλάτη" },
    { name: "Reverse Grip Cable Row", muscleGroup: "Πλάτη" },
    { name: "Preacher Curl", muscleGroup: "Χέρια" },
    { name: "Standing Bicep Curl", muscleGroup: "Χέρια" },
    { name: "Triceps Press", muscleGroup: "Χέρια" },
    { name: "Triceps Overhead Extension", muscleGroup: "Χέρια" },
    { name: "Plank", muscleGroup: "Κορμός" },
    { name: "Leg Raise Hip Lift", muscleGroup: "Κορμός" },
    { name: "Reverse Crunch", muscleGroup: "Κορμός" },
    { name: "Lying Knee Raise", muscleGroup: "Κορμός" },
    { name: "EMS Κοιλιακών", muscleGroup: "Κορμός" },
    { name: "EMS Πλάτης", muscleGroup: "Πλάτη" },
    { name: "EMS Ποδιών", muscleGroup: "Πόδια" },
    { name: "Ποδηλασία 30km", muscleGroup: "Πόδια" },
    { name: "Stretching", muscleGroup: "Recovery" }
];

// 2. Εβδομαδιαίο Στατικό Πρόγραμμα (Βελτιστοποιημένα Σετ)
const program = {
    "Δευτέρα": [
        { name: "Stretching", sets: 1, duration: 338 }
    ],
    "Τρίτη": [
        { name: "Seated Chest Press", sets: 4, duration: 45 },
        { name: "Pec Deck", sets: 4, duration: 45 },
        { name: "Lat Pulldown", sets: 3, duration: 45 },
        { name: "Low Seated Row", sets: 3, duration: 45 },
        { name: "Preacher Curl", sets: 3, duration: 45 },
        { name: "Pushups", sets: 3, duration: 45 },
        { name: "Plank", sets: 3, duration: 45 }
    ],
    "Τετάρτη": [
        { name: "EMS Κοιλιακών", sets: 1, duration: 45 },
        { name: "EMS Πλάτης", sets: 1, duration: 45 },
        { name: "EMS Ποδιών", sets: 1, duration: 45 }
    ],
    "Πέμπτη": [
        { name: "Stretching", sets: 1, duration: 338 }
    ],
    "Παρασκευή": [
        { name: "Reverse Chest Press", sets: 3, duration: 45 },
        { name: "Close Grip Pulldown", sets: 3, duration: 45 },
        { name: "Reverse Grip Cable Row", sets: 3, duration: 45 },
        { name: "Standing Bicep Curl", sets: 3, duration: 45 },
        { name: "Triceps Press", sets: 3, duration: 45 },
        { name: "Triceps Overhead Extension", sets: 3, duration: 45 }
    ],
    "Σάββατο": [
        { name: "Ποδηλασία 30km", sets: 1, duration: 3600 }
    ],
    "Κυριακή": [
        { name: "Ποδηλασία 30km", sets: 1, duration: 3600 },
        { name: "Low Seated Row", sets: 2, duration: 45 },
        { name: "Preacher Curl", sets: 2, duration: 45 },
        { name: "Leg Raise Hip Lift", sets: 3, duration: 45 },
        { name: "Reverse Crunch", sets: 3, duration: 45 },
        { name: "Lying Knee Raise", sets: 3, duration: 45 }
    ]
};

// 3. Αντιστοίχιση Αρχείων Video
const videoMap = {
    "Lat Pulldown": "Pulldown",
    "Close Grip Pulldown": "Pulldown",
    "Behind the Neck Pulldown": "Pulldown",
    "Low Seated Row": "LowSeatedRow",
    "Reverse Grip Cable Row": "ReverseGripCableRow",
    "Reverse Chest Press": "reverserow",
    "Seated Chest Press": "SeatedChestPress",
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
    "Ποδηλασία 30km": "cycling"
};

// 4. Global Exports
window.program = program;
window.videoMap = videoMap;