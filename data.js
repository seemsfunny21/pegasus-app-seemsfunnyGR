/* ==========================================================================
   PEGASUS DATA ENGINE - CLEAN SWEEP v17.0
   Protocol: Global Knowledge Base | Logic: Exercise DB & Weekly Schedule
   ========================================================================== */

// 1. USER BIOMETRICS
const USER_PROFILE = {
    height: 187,
    weight: 74,
    age: 38,
    gender: 'male',
    location: 'Ioannina, GR',
    goal: 'Hypertrophy & Definition'
};

// 2. EXERCISE MASTER DATABASE
// Περιέχει όλες τις ασκήσεις με τα metadata τους για το app.js και τον optimizer.js
const EXERCISE_DB = {
    "Lat Pulldowns": { muscle: "Πλάτη", sets: 4, reps: "10-12", duration: 45, intensity: 0.7 },
    "Ab Crunches Cable": { muscle: "Κορμός", sets: 4, reps: "15-20", duration: 30, intensity: 0.5 },
    "Plank": { muscle: "Κορμός", sets: 3, reps: "60s", duration: 60, intensity: 0.4 },
    "Ποδηλασία 30km": { muscle: "Πόδια", sets: 1, reps: "1", duration: 3600, intensity: 0.8, outdoor: true },
    "Deadlifts": { muscle: "Πλάτη", sets: 4, reps: "8-10", duration: 90, intensity: 0.9 },
    "Bench Press": { muscle: "Στήθος", sets: 4, reps: "10", duration: 60, intensity: 0.8 },
    "Bicep Curls": { muscle: "Χέρια", sets: 3, reps: "12", duration: 45, intensity: 0.5 },
    "Shoulder Press": { muscle: "Ώμοι", sets: 4, reps: "10", duration: 60, intensity: 0.7 },
    "EMS Session": { muscle: "Full Body", sets: 1, reps: "20min", duration: 1200, intensity: 0.85 },
    "Stretching": { muscle: "Αποθεραπεία", sets: 1, reps: "15min", duration: 900, intensity: 0.2 }
};

// 3. WEEKLY MASTER SCHEDULE
// Καθορίζει ποιες ασκήσεις εκτελούνται κάθε μέρα
const WEEKLY_SCHEDULE = {
    "ΔΕΥΤΕΡΑ": ["Stretching", "Ab Crunches Cable"], // Ημέρα Αποθεραπείας
    "ΤΡΙΤΗ": ["Bench Press", "Shoulder Press", "Bicep Curls"],
    "ΤΕΤΑΡΤΗ": ["Lat Pulldowns", "Deadlifts", "Plank"],
    "ΠΕΜΠΤΗ": ["Stretching", "EMS Session"], // Ημέρα Αποθεραπείας
    "ΠΑΡΑΣΚΕΥΗ": ["Lat Pulldowns", "Ab Crunches Cable", "Plank", "Ποδηλασία 30km"],
    "ΣΑΒΒΑΤΟ": ["Bench Press", "Shoulder Press", "Deadlifts"],
    "ΚΥΡΙΑΚΗ": ["Ποδηλασία 30km", "Plank"]
};

/**
 * 4. PROGRAM CALCULATOR
 * Ο κύριος αλγόριθμος που "σερβίρει" το πρόγραμμα στο app.js
 */
window.calculateDailyProgram = function(day) {
    const exerciseNames = WEEKLY_SCHEDULE[day] || [];
    
    return exerciseNames.map(name => {
        const details = EXERCISE_DB[name];
        if (!details) return null;
        
        return {
            name: name,
            muscleGroup: details.muscle,
            sets: details.sets,
            reps: details.reps,
            duration: details.duration,
            intensity: details.intensity,
            note: details.outdoor ? "Outdoor Activity" : "Gym/Indoor"
        };
    }).filter(ex => ex !== null);
};

// 5. GLOBAL CONFIGURATION FOR ENGINES
window.PEGASUS_DATA = {
    profile: USER_PROFILE,
    db: EXERCISE_DB,
    schedule: WEEKLY_SCHEDULE,
    version: "17.0",
    lastUpdate: "2026-03-27"
};

console.log("✅ PEGASUS: Data Engine Loaded (v17.0). Profile: " + USER_PROFILE.weight + "kg");
