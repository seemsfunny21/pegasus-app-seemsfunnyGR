/* ==========================================================================
    PEGASUS DYNAMIC ENGINE - DATA RECOVERY (V10.1)
    Protocol: Full Week Mapping & Asset Alignment
    Strict Sync with GitHub /images/ and /videos/
   ========================================================================== */

window.program = {
    "Δευτέρα": [
        { name: "Low Seated Row", sets: 3, muscleGroup: "Πλάτη" },
        { name: "Close Grip Pulldown", sets: 3, muscleGroup: "Πλάτη" },
        { name: "Chest Press", sets: 3, muscleGroup: "Στήθος" },
        { name: "Incline Chest Press", sets: 3, muscleGroup: "Στήθος" },
        { name: "Shoulder Press", sets: 3, muscleGroup: "Ώμοι" },
        { name: "Lateral Raises", sets: 3, muscleGroup: "Ώμοι" },
        { name: "Bicep Curls", sets: 3, muscleGroup: "Χέρια" },
        { name: "Tricep Extensions", sets: 3, muscleGroup: "Χέρια" }
    ],
    "Τρίτη": [
        { name: "EMS Training", sets: 1, muscleGroup: "Πλάτη" }
    ],
    "Τετάρτη": [
        { name: "Low Seated Row", sets: 3, muscleGroup: "Πλάτη" },
        { name: "Close Grip Pulldown", sets: 3, muscleGroup: "Πλάτη" },
        { name: "Chest Press", sets: 3, muscleGroup: "Στήθος" },
        { name: "Incline Chest Press", sets: 3, muscleGroup: "Στήθος" },
        { name: "Shoulder Press", sets: 3, muscleGroup: "Ώμοι" },
        { name: "Lateral Raises", sets: 3, muscleGroup: "Ώμοι" },
        { name: "Bicep Curls", sets: 3, muscleGroup: "Χέρια" },
        { name: "Tricep Extensions", sets: 3, muscleGroup: "Χέρια" }
    ],
    "Πέμπτη": [
        { name: "Αποθεραπεία", sets: 0, muscleGroup: "None" }
    ],
    "Παρασκευή": [
        { name: "EMS Training", sets: 1, muscleGroup: "Πλάτη" }
    ],
    "Σάββατο": [
        { name: "Low Seated Row", sets: 3, muscleGroup: "Πλάτη" },
        { name: "Close Grip Pulldown", sets: 3, muscleGroup: "Πλάτη" },
        { name: "Chest Press", sets: 3, muscleGroup: "Στήθος" },
        { name: "Incline Chest Press", sets: 3, muscleGroup: "Στήθος" },
        { name: "Shoulder Press", sets: 3, muscleGroup: "Ώμοι" },
        { name: "Lateral Raises", sets: 3, muscleGroup: "Ώμοι" },
        { name: "Bicep Curls", sets: 3, muscleGroup: "Χέρια" },
        { name: "Tricep Extensions", sets: 3, muscleGroup: "Χέρια" }
    ],
    "Κυριακή": [
        { name: "Ποδηλασία (Cycling)", sets: 1, muscleGroup: "Πόδια" }
    ]
};

/* ===== SURGICAL VIDEO MAPPING (Direct GitHub Match) ===== */
window.videoMap = {
    "Low Seated Row": "lowrowsseated",
    "Close Grip Pulldown": "latpulldownsclose",
    "Chest Press": "chestpress",
    "Incline Chest Press": "chestpress",
    "Shoulder Press": "uprightrows",
    "Lateral Raises": "uprightrows", // Συγχρονισμός με το υπάρχον asset
    "Bicep Curls": "bicepcurls",
    "Tricep Extensions": "triceppulldowns",
    "EMS Training": "emsimage",
    "Ποδηλασία (Cycling)": "cycling",
    "Προθέρμανση": "warmup"
};

window.exercisesDB = [
    { name: "Low Seated Row", muscleGroup: "Πλάτη" },
    { name: "Close Grip Pulldown", muscleGroup: "Πλάτη" },
    { name: "Chest Press", muscleGroup: "Στήθος" },
    { name: "Incline Chest Press", muscleGroup: "Στήθος" },
    { name: "Shoulder Press", muscleGroup: "Ώμοι" },
    { name: "Lateral Raises", muscleGroup: "Ώμοι" },
    { name: "Bicep Curls", muscleGroup: "Χέρια" },
    { name: "Tricep Extensions", muscleGroup: "Χέρια" },
    { name: "Ποδηλασία (Cycling)", muscleGroup: "Πόδια" },
    { name: "EMS Training", muscleGroup: "Πλάτη" }
];

console.log("✅ PEGASUS DATA ENGINE: Operational & Asset Aligned.");
