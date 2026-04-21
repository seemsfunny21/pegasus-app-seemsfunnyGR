/* ==========================================================================
   PEGASUS WORKOUT ENGINE - v10.47 (PHASE-2 RUNTIME PATCH BRIDGE)
   Protocol: Partial Session Memory + Auto-Sort + Smart Sync Logic
   Status: FINAL STABLE | PHASE-2 ENGINE RUNTIME PATCH READY
   ========================================================================== */

var M = M || window.PegasusManifest;
var P_M = M;

window.masterUI = window.masterUI || {};

if (!M) {
    console.warn("⚠️ PEGASUS CRITICAL: Manifest not found during app.js boot.");
}

/* ===== 1. ISSUE LOGGER (DIAGNOSTIC MODE) ===== */
/* Extracted to diagnosticsRuntime.js */

/* ===== 2. CORE VARIABLES ===== */
var exercises = [];
var remainingSets = [];
var currentIdx = 0;
var phase = 0; // 0: Prep, 1: Work, 2: Rest
var running = false;
var timer = null;
var totalSeconds = 0;
var remainingSeconds = 0;
var phaseRemainingSeconds = null;
var sessionActiveKcal = 0;
var muted = localStorage.getItem(P_M?.system?.mute || "pegasus_mute_state") === "true";
var TURBO_MODE = localStorage.getItem(P_M?.system?.turbo || "pegasus_turbo_state") === "true";
var SPEED = TURBO_MODE ? 10 : 1;
var userWeight = parseFloat(localStorage.getItem(P_M?.user?.weight || "pegasus_weight")) || 74;

/* ===== 2.4 KCAL HELPERS ===== */
/* Extracted to calorieRuntime.js */

/* ===== 3. AUDIO SYSTEM ===== */
/* Extracted to audioRuntime.js */

/* ===== PEGASUS CORE ENGINE BRIDGE ===== */
/* Extracted to runtimeBridge.js */

/* ===== 4. NAVIGATION BINDING ===== */
/* Extracted to desktop module: createNavbar */


/* Extracted to desktop module: selectDay */


function isPegasusExerciseAvailable(idx) {
    const ex = exercises[idx];
    return !!(ex && ex.classList && !ex.classList.contains("exercise-skipped"));
}

/* ===== 5. WORKOUT ENGINE CORE (DYNAMIC TIMER PATCH) ===== */
/* Extracted to desktop module: startPause */


/* Extracted to desktop module: runPhase */


/* Extracted to desktop module: skipToNextExercise */


/* Extracted to desktop module: getNextIndexCircuit */


/* Extracted to desktop module: window.toggleSkipExercise */


/* ===== WEIGHT STATE ===== */
/* Extracted to weightState.js */

/* Extracted to desktop module: showVideo */


/* Extracted to desktop module: calculateTotalTime */


/* Extracted to desktop module: updateTotalBar */


/* ===== 7.5 STRICT METABOLIC AUTO-ADJUSTER (MULTI-PLAN) ===== */
/* Extracted to calorieRuntime.js */

/* ===== 8. FINISH & REPORTING ===== */
/* Extracted to desktop module: finishWorkout */


/* Extracted to desktop module: openExercisePreview */


/* ===== 10. TRACKING ===== */
window.logPegasusSet = function(exName) {
    let historyKey = P_M?.workout?.weekly_history || 'pegasus_weekly_history';
    let history = JSON.parse(localStorage.getItem(historyKey) || "{}");
    if (!history || typeof history !== "object") {
        history = { "Στήθος": 0, "Πλάτη": 0, "Ώμοι": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 };
    }

    let muscle = (window.exercisesDB?.find(ex => ex.name.trim() === exName.trim()))?.muscleGroup || "Άλλο";
    let value = 1;

    const cleanName = exName.trim().toUpperCase();
    if (cleanName.includes("ΠΟΔΗΛΑΣΙΑ") || cleanName.includes("CYCLING")) {
        muscle = "Πόδια";
        value = 18;
    } else if (cleanName.includes("EMS ΠΟΔΙΩΝ")) {
        muscle = "Πόδια";
        value = 6;
    }

    if (history.hasOwnProperty(muscle)) {
        history[muscle] += value;
        localStorage.setItem(historyKey, JSON.stringify(history));
        if (window.MuscleProgressUI?.render) setTimeout(() => window.MuscleProgressUI.render(), 50);
    }
};

window.updateTotalWorkoutCount = function() {
    const data = JSON.parse(localStorage.getItem(P_M?.workout?.done || "pegasus_workouts_done") || "{}");
    const count = Object.keys(data).length;
    localStorage.setItem(P_M?.workout?.total || "pegasus_total_workouts", count);
    const display = document.getElementById("totalWorkoutsDisplay");
    if (display) {
        const lang = (typeof window.PegasusI18n?.getLanguage === "function") ? window.PegasusI18n.getLanguage() : (localStorage.getItem('pegasus_language') || 'gr');
        display.textContent = `${lang === 'en' ? 'Workouts' : 'Προπονήσεις'}: ${count}`;
    }
};

/* ===== 11. BOOT SEQUENCE ===== */
/* Extracted to desktop module: window.onload */


window.getPegasusSessionState = window.getPegasusSessionState || function() {
    return window.PegasusEngine?.getSessionSnapshot ? window.PegasusEngine.getSessionSnapshot() : null;
};

window.getPegasusReplayProgress = window.getPegasusReplayProgress || function(limit) {
    return window.PegasusEngine?.replayProgress ? window.PegasusEngine.replayProgress(limit) : null;
};

window.getPegasusPersistedProgress = window.getPegasusPersistedProgress || function() {
    return window.PegasusEngine?.getPersistedRuntime ? window.PegasusEngine.getPersistedRuntime() : null;
};

window.restorePegasusPersistedProgress = window.restorePegasusPersistedProgress || function() {
    return window.PegasusEngine?.restorePersistedRuntime ? window.PegasusEngine.restorePersistedRuntime() : null;
};

window.clearPegasusPersistedProgress = window.clearPegasusPersistedProgress || function() {
    return window.PegasusEngine?.clearPersistedRuntime ? window.PegasusEngine.clearPersistedRuntime() : null;
};

/* ===== PEGASUS DEBUG RUNTIME ===== */
/* Extracted to diagnosticsRuntime.js */
