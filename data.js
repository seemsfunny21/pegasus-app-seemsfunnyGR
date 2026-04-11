/* ==========================================================================
   PEGASUS DATA ENGINE - v10.15 (STRICT ASSET ALIGNMENT & DYNAMIC SPLITS)
   Protocol: Absolute Visual Mapping + Pegasus Split Engine
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
    { name: "Close Grip Pulldowns", muscleGroup: "Πλάτη" }, 
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

// ASSET MAPPING (VERIFIED & PERFECTLY MATCHED)
window.videoMap = {
    "Chest Press": "chestpress",
    "Chest Flys": "chestflys",
    "Pushups": "pushups",
    
    // 🎯 THE PULLDOWN TRIFECTA
    "Wide Pulldowns": "latpulldowns",
    "Medium Pulldowns": "latpulldowns",
    "Neck Pulldowns": "latpulldowns",
    
    "Close Grip Pulldowns": "latpulldownsclose", 
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

console.log("🚀 PEGASUS DATA ENGINE: v10.15 Perfect Dictionary Sync. Total Data Consistency Achieved.");

/* ==========================================================================
   PEGASUS SPLIT ENGINE (DYNAMIC PROGRAM ROUTING)
   ========================================================================== */
window.setPegasusPlan = function(planCode) {
    localStorage.setItem('pegasus_active_plan', planCode);
    alert("ΑΛΛΑΓΗ ΣΥΣΤΗΜΑΤΟΣ: " + planCode + "\nΤο PEGASUS OS θα κάνει επανεκκίνηση για να φορτώσει τις νέες ασκήσεις.");
    window.location.reload();
};

// UI Binding για το Modal του Επιλογέα
document.addEventListener("DOMContentLoaded", function() {
    const btnPlan = document.getElementById('btnPlanSelector');
    if (btnPlan) {
        btnPlan.onclick = function() {
            document.getElementById('planModal').style.display = 'flex';
            const activePlan = localStorage.getItem('pegasus_active_plan') || 'CLASSIC';
            document.querySelectorAll('.plan-btn').forEach(b => {
                b.style.borderColor = '#4CAF50'; b.style.background = 'none';
            });
            const activeBtn = document.getElementById('plan-' + activePlan);
            if(activeBtn) {
                activeBtn.style.borderColor = '#FFC107';
                activeBtn.style.background = 'rgba(255, 193, 7, 0.1)';
            }
        };
    }
});

// Κινητήρας Αντικατάστασης (Εκτελείται ακαριαία κατά τη φόρτωση του data.js)
(function applyPegasusSplit() {
    const activePlan = localStorage.getItem('pegasus_active_plan') || 'CLASSIC';

    // Αν είναι το CLASSIC, αφήνει το αρχικό window.program ανέπαφο
    if (activePlan === 'CLASSIC') return;

    // Η Βάση Δεδομένων των Νέων Προγραμμάτων (100% Συμβατή με το videoMap σου)
    const splits = {
        'PPL': {
            "Τρίτη": [ 
                { name: "Chest Press", sets: 4, muscleGroup: "Στήθος", weight: "70" },
                { name: "Chest Flys", sets: 4, muscleGroup: "Στήθος", weight: "45" },
                { name: "Pushups", sets: 3, muscleGroup: "Στήθος", weight: "0" },
                { name: "Upright Rows", sets: 4, muscleGroup: "Ώμοι", weight: "35" },
                { name: "Tricep Pulldowns", sets: 4, muscleGroup: "Χέρια", weight: "20" }
            ],
            "Τετάρτη": [ 
                { name: "Wide Pulldowns", sets: 4, muscleGroup: "Πλάτη", weight: "60" },
                { name: "Seated Rows", sets: 4, muscleGroup: "Πλάτη", weight: "55" },
                { name: "Bent Over Rows", sets: 4, muscleGroup: "Πλάτη", weight: "40" },
                { name: "Straight Arm Pulldowns", sets: 3, muscleGroup: "Πλάτη", weight: "20" },
                { name: "Bicep Curls", sets: 4, muscleGroup: "Χέρια", weight: "15" }
            ],
            "Παρασκευή": [ 
                { name: "Leg Extensions", sets: 5, muscleGroup: "Πόδια", weight: "50" },
                { name: "Ab Crunches", sets: 4, muscleGroup: "Κορμός", weight: "45" },
                { name: "Plank", sets: 3, muscleGroup: "Κορμός", weight: "0" },
                { name: "Lying Knee Raise", sets: 3, muscleGroup: "Κορμός", weight: "0" }
            ]
        },
        'UPPER_LOWER': {
            "Τρίτη": [ 
                { name: "Chest Press", sets: 4, muscleGroup: "Στήθος", weight: "70" },
                { name: "Wide Pulldowns", sets: 4, muscleGroup: "Πλάτη", weight: "60" },
                { name: "Upright Rows", sets: 3, muscleGroup: "Ώμοι", weight: "35" },
                { name: "Seated Rows", sets: 3, muscleGroup: "Πλάτη", weight: "55" },
                { name: "Bicep Curls", sets: 3, muscleGroup: "Χέρια", weight: "15" },
                { name: "Tricep Pulldowns", sets: 3, muscleGroup: "Χέρια", weight: "20" }
            ],
            "Τετάρτη": [ 
                { name: "Leg Extensions", sets: 5, muscleGroup: "Πόδια", weight: "50" },
                { name: "Ab Crunches", sets: 4, muscleGroup: "Κορμός", weight: "45" },
                { name: "Reverse Crunch", sets: 4, muscleGroup: "Κορμός", weight: "0" },
                { name: "Leg Raise Hip Lift", sets: 3, muscleGroup: "Κορμός", weight: "0" }
            ],
            "Παρασκευή": [ 
                { name: "Pushups", sets: 4, muscleGroup: "Στήθος", weight: "0" },
                { name: "Medium Pulldowns", sets: 4, muscleGroup: "Πλάτη", weight: "60" },
                { name: "Upright Rows", sets: 3, muscleGroup: "Ώμοι", weight: "35" },
                { name: "Leg Extensions", sets: 4, muscleGroup: "Πόδια", weight: "50" },
                { name: "Plank", sets: 3, muscleGroup: "Κορμός", weight: "0" }
            ]
        },
        'ARNOLD': {
            "Τρίτη": [ 
                { name: "Chest Press", sets: 4, muscleGroup: "Στήθος", weight: "70" },
                { name: "Chest Flys", sets: 3, muscleGroup: "Στήθος", weight: "45" },
                { name: "Wide Pulldowns", sets: 4, muscleGroup: "Πλάτη", weight: "60" },
                { name: "Seated Rows", sets: 4, muscleGroup: "Πλάτη", weight: "55" },
                { name: "Straight Arm Pulldowns", sets: 3, muscleGroup: "Πλάτη", weight: "20" }
            ],
            "Τετάρτη": [ 
                { name: "Leg Extensions", sets: 5, muscleGroup: "Πόδια", weight: "50" },
                { name: "Ab Crunches", sets: 4, muscleGroup: "Κορμός", weight: "45" },
                { name: "Sit Ups", sets: 3, muscleGroup: "Κορμός", weight: "0" },
                { name: "Lying Knee Raise", sets: 3, muscleGroup: "Κορμός", weight: "0" }
            ],
            "Παρασκευή": [ 
                { name: "Upright Rows", sets: 5, muscleGroup: "Ώμοι", weight: "35" },
                { name: "Bicep Curls", sets: 4, muscleGroup: "Χέρια", weight: "15" },
                { name: "Preacher Curls", sets: 3, muscleGroup: "Χέρια", weight: "15" },
                { name: "Tricep Pulldowns", sets: 4, muscleGroup: "Χέρια", weight: "20" }
            ]
        }
    };

    // Αντικαθιστούμε δυναμικά το πρόγραμμα ΜΟΝΟ για Τρίτη, Τετάρτη, Παρασκευή
    if (window.program && splits[activePlan]) {
        window.program["Τρίτη"] = splits[activePlan]["Τρίτη"];
        window.program["Τετάρτη"] = splits[activePlan]["Τετάρτη"];
        window.program["Παρασκευή"] = splits[activePlan]["Παρασκευή"];
        console.log("🚀 PEGASUS SPLIT ENGINE: Loaded Dynamic Module -> " + activePlan);
    }
})();
