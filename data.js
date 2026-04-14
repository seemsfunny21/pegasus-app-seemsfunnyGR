/* ==========================================================================
   📦 PEGASUS DATA ENGINE - v15.1 (THE IRON LOGIC PROTOCOL - REAL BASELINE)
   Protocol: 5-Day Focus | 50-Min Daily | Dynamic UI | Active Split: IRON_LOGIC
   Status: PRODUCTION READY | FULL CODE DELIVERY
   ========================================================================== */

// 1. DEFAULT PLAN: IRON_LOGIC (5 Days Active / Mon & Thu Rest)
window.program = {
    "Δευτέρα": [ 
        { name: "Stretching", sets: 1, muscleGroup: "None", weight: "0" }
    ],
    "Τρίτη": [ 
        { name: "Chest Press", sets: 6, muscleGroup: "Στήθος", weight: "54" },
        { name: "Chest Flys", sets: 5, muscleGroup: "Στήθος", weight: "42" },
        { name: "Wide Pulldowns", sets: 6, muscleGroup: "Πλάτη", weight: "36" },
        { name: "Seated Rows", sets: 5, muscleGroup: "Πλάτη", weight: "66" },
        { name: "Ab Crunches", sets: 5, muscleGroup: "Κορμός", weight: "30" }
    ], 
    "Τετάρτη": [ 
        { name: "Upright Rows", sets: 6, muscleGroup: "Ώμοι", weight: "30" },
        { name: "Bicep Curls", sets: 6, muscleGroup: "Χέρια", weight: "30" },
        { name: "Tricep Pulldowns", sets: 6, muscleGroup: "Χέρια", weight: "20" },
        { name: "Preacher Curls", sets: 5, muscleGroup: "Χέρια", weight: "30" },
        { name: "Plank", sets: 5, muscleGroup: "Κορμός", weight: "0" }
    ],
    "Πέμπτη": [ 
        { name: "Stretching", sets: 1, muscleGroup: "None", weight: "0" }
    ],
    "Παρασκευή": [ 
        { name: "Medium Pulldowns", sets: 6, muscleGroup: "Πλάτη", weight: "36" },
        { name: "Bent Over Rows", sets: 6, muscleGroup: "Πλάτη", weight: "30" },
        { name: "Pushups", sets: 5, muscleGroup: "Στήθος", weight: "0" },
        { name: "Reverse Crunch", sets: 5, muscleGroup: "Κορμός", weight: "0" },
        { name: "Lying Knee Raise", sets: 5, muscleGroup: "Κορμός", weight: "0" }
    ],
    "Σάββατο": [ 
        { name: "Leg Extensions", sets: 8, muscleGroup: "Πόδια", weight: "36" },
        { name: "Sit Ups", sets: 6, muscleGroup: "Κορμός", weight: "0" },
        { name: "Ab Crunches", sets: 6, muscleGroup: "Κορμός", weight: "30" }, // 🎯 Διορθώθηκε: Τώρα έχει 30kg και το Σάββατο
        { name: "Plank", sets: 5, muscleGroup: "Κορμός", weight: "0" }
    ],
    "Κυριακή": [ 
        { name: "Chest Press", sets: 5, muscleGroup: "Στήθος", weight: "54" },
        { name: "Seated Rows", sets: 5, muscleGroup: "Πλάτη", weight: "66" },
        { name: "Bicep Curls", sets: 5, muscleGroup: "Χέρια", weight: "30" },
        { name: "Tricep Pulldowns", sets: 5, muscleGroup: "Χέρια", weight: "20" },
        { name: "Leg Raise Hip Lift", sets: 5, muscleGroup: "Κορμός", weight: "0" }
    ]
};

// 2. MASTER EXERCISES DATABASE
window.exercisesDB = [
    { name: "Chest Press", muscleGroup: "Στήθος" },
    { name: "Chest Flys", muscleGroup: "Στήθος" },
    { name: "Pushups", muscleGroup: "Στήθος" },
    { name: "Wide Pulldowns", muscleGroup: "Πλάτη" },
    { name: "Medium Pulldowns", muscleGroup: "Πλάτη" },
    { name: "Seated Rows", muscleGroup: "Πλάτη" },
    { name: "Bent Over Rows", muscleGroup: "Πλάτη" },
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
    { name: "Leg Extensions", muscleGroup: "Πόδια" }
];

// 3. ASSET MAPPING
window.videoMap = {
    "Chest Press": "chestpress", "Chest Flys": "chestflys", "Pushups": "pushups",
    "Wide Pulldowns": "latpulldowns", "Medium Pulldowns": "latpulldowns",
    "Seated Rows": "lowrowsseated", "Bent Over Rows": "bentoverrows",
    "Upright Rows": "uprightrows", "Bicep Curls": "bicepcurls",
    "Preacher Curls": "preacherbicepcurls", "Tricep Pulldowns": "triceppulldowns",
    "Ab Crunches": "abcrunches", "Sit Ups": "situps", "Plank": "plank",
    "Reverse Crunch": "reversecrunch", "Lying Knee Raise": "lyingkneeraise",
    "Leg Raise Hip Lift": "legraisehiplift", "Leg Extensions": "legextensions"
};

// 4. PEGASUS SPLIT & TIMER ENGINE (AUTO-CONFIRMATION)
window.setPegasusPlan = function(planKey) {
    localStorage.setItem('pegasus_active_plan', planKey);
    console.log(`🎯 PEGASUS: Plan switched to ${planKey}`);

    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.9); backdrop-filter: blur(10px);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        z-index: 999999; opacity: 0; transition: opacity 0.4s ease;
    `;
    
    overlay.innerHTML = `
        <div style="font-size: 70px; margin-bottom: 25px;">🟢</div>
        <div style="color: #4CAF50; font-weight: 900; font-size: 26px; letter-spacing: 2px; text-transform: uppercase; text-align:center; padding: 0 20px;">Το Προγραμμα Ενεργοποιηθηκε</div>
        <div style="color: #eee; font-size: 16px; margin-top: 15px; font-weight: bold;">Split: ${planKey}</div>
        <div style="color: #666; font-size: 11px; margin-top: 35px; letter-spacing: 2px; font-weight:800;">PEGASUS OS REBOOT IN 1"</div>
    `;

    document.body.appendChild(overlay);
    setTimeout(() => overlay.style.opacity = '1', 50);

    if (window.PegasusCloud) window.PegasusCloud.push(true);

    setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => window.location.reload(), 500);
    }, 1000);
};

(function applyPegasusSplit() {
    const activePlan = localStorage.getItem('pegasus_active_plan') || 'IRON_LOGIC';
    window.pegasusTimerConfig = { prep: 10, work: 45, rest: 60 };

    const splits = {
        'IRON_LOGIC': { 
            timers: { prep: 10, work: 45, rest: 60 } 
        },
        'PPL': { 
            timers: { prep: 10, work: 45, rest: 75 },
            "Τρίτη": [ 
                { name: "Chest Press", sets: 6, muscleGroup: "Στήθος", weight: "54" },
                { name: "Chest Flys", sets: 6, muscleGroup: "Στήθος", weight: "42" },
                { name: "Upright Rows", sets: 6, muscleGroup: "Ώμοι", weight: "30" },
                { name: "Tricep Pulldowns", sets: 6, muscleGroup: "Χέρια", weight: "20" }
            ],
            "Τετάρτη": [ 
                { name: "Wide Pulldowns", sets: 6, muscleGroup: "Πλάτη", weight: "36" },
                { name: "Seated Rows", sets: 6, muscleGroup: "Πλάτη", weight: "66" },
                { name: "Bent Over Rows", sets: 6, muscleGroup: "Πλάτη", weight: "30" },
                { name: "Bicep Curls", sets: 6, muscleGroup: "Χέρια", weight: "30" }
            ],
            "Παρασκευή": [ 
                { name: "Leg Extensions", sets: 8, muscleGroup: "Πόδια", weight: "36" },
                { name: "Ab Crunches", sets: 6, muscleGroup: "Κορμός", weight: "30" },
                { name: "Plank", sets: 5, muscleGroup: "Κορμός", weight: "0" },
                { name: "Sit Ups", sets: 5, muscleGroup: "Κορμός", weight: "0" }
            ],
            "Σάββατο": [
                { name: "Pushups", sets: 6, muscleGroup: "Στήθος", weight: "0" },
                { name: "Upright Rows", sets: 6, muscleGroup: "Ώμοι", weight: "30" },
                { name: "Tricep Pulldowns", sets: 6, muscleGroup: "Χέρια", weight: "20" },
                { name: "Plank", sets: 6, muscleGroup: "Κορμός", weight: "0" }
            ]
        },
        'UPPER_LOWER': { 
            timers: { prep: 10, work: 45, rest: 60 },
            "Τρίτη": [ 
                { name: "Chest Press", sets: 5, muscleGroup: "Στήθος", weight: "54" },
                { name: "Wide Pulldowns", sets: 5, muscleGroup: "Πλάτη", weight: "36" },
                { name: "Upright Rows", sets: 4, muscleGroup: "Ώμοι", weight: "30" },
                { name: "Seated Rows", sets: 4, muscleGroup: "Πλάτη", weight: "66" },
                { name: "Bicep Curls", sets: 4, muscleGroup: "Χέρια", weight: "30" },
                { name: "Tricep Pulldowns", sets: 4, muscleGroup: "Χέρια", weight: "20" }
            ],
            "Τετάρτη": [ 
                { name: "Leg Extensions", sets: 6, muscleGroup: "Πόδια", weight: "36" },
                { name: "Ab Crunches", sets: 5, muscleGroup: "Κορμός", weight: "30" },
                { name: "Reverse Crunch", sets: 5, muscleGroup: "Κορμός", weight: "0" },
                { name: "Leg Raise Hip Lift", sets: 5, muscleGroup: "Κορμός", weight: "0" },
                { name: "Plank", sets: 4, muscleGroup: "Κορμός", weight: "0" }
            ],
            "Παρασκευή": [ 
                { name: "Pushups", sets: 5, muscleGroup: "Στήθος", weight: "0" },
                { name: "Medium Pulldowns", sets: 5, muscleGroup: "Πλάτη", weight: "36" },
                { name: "Upright Rows", sets: 5, muscleGroup: "Ώμοι", weight: "30" },
                { name: "Bicep Curls", sets: 5, muscleGroup: "Χέρια", weight: "30" },
                { name: "Tricep Pulldowns", sets: 5, muscleGroup: "Χέρια", weight: "20" }
            ],
            "Σάββατο": [
                { name: "Leg Extensions", sets: 5, muscleGroup: "Πόδια", weight: "36" },
                { name: "Sit Ups", sets: 4, muscleGroup: "Κορμός", weight: "0" },
                { name: "Plank", sets: 4, muscleGroup: "Κορμός", weight: "0" }
            ]
        },
        'EMS_HYBRID': { 
            timers: { prep: 10, work: 50, rest: 45 },
            "Τετάρτη": [ 
                { name: "EMS Training", sets: 1, muscleGroup: "Πλάτη", weight: "0" },
                { name: "Ab Crunches", sets: 6, muscleGroup: "Κορμός", weight: "30" },
                { name: "Leg Raise Hip Lift", sets: 6, muscleGroup: "Κορμός", weight: "0" },
                { name: "Plank", sets: 5, muscleGroup: "Κορμός", weight: "0" }
            ]
        }
    };

    if (splits[activePlan] && activePlan !== 'IRON_LOGIC') {
        window.pegasusTimerConfig = splits[activePlan].timers;
        ["Τρίτη", "Τετάρτη", "Παρασκευή", "Σάββατο", "Κυριακή"].forEach(day => {
            if (splits[activePlan][day]) window.program[day] = splits[activePlan][day];
        });
    }
    
    console.log(`🚀 PEGASUS DATA ENGINE: v15.1 Active. Plan: ${activePlan}`);

    // ==========================================================================
    // 🚀 ΔΥΝΑΜΙΚΟΣ ΥΠΟΛΟΓΙΣΜΟΣ ΕΒΔΟΜΑΔΙΑΙΟΥ ΟΓΚΟΥ ΓΙΑ ΤΙΣ ΜΠΑΡΕΣ (MOBILE UI)
    // ==========================================================================
    window.getDynamicTargets = function() {
        const targets = { "Στήθος": 0, "Πλάτη": 0, "Πόδια": 0, "Χέρια": 0, "Ώμοι": 0, "Κορμός": 0 };
        
        for (const day in window.program) {
            window.program[day].forEach(ex => {
                if (targets[ex.muscleGroup] !== undefined) {
                    targets[ex.muscleGroup] += ex.sets;
                }
            });
        }
        return targets;
    };
})();
