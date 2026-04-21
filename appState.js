/* ==========================================================================
   PEGASUS APP STATE
   Shared manifest aliases, desktop masterUI registry, and mutable workout state.
   ========================================================================== */

var M = M || window.PegasusManifest;
var P_M = M;

window.masterUI = window.masterUI || {};

if (!M) {
    console.warn("⚠️ PEGASUS CRITICAL: Manifest not found during appState.js boot.");
}

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

window.PegasusAppState = window.PegasusAppState || {
    snapshot() {
        return {
            exercisesCount: Array.isArray(exercises) ? exercises.length : 0,
            remainingSets: Array.isArray(remainingSets) ? remainingSets.slice() : [],
            currentIdx,
            phase,
            running,
            totalSeconds,
            remainingSeconds,
            phaseRemainingSeconds,
            sessionActiveKcal,
            muted,
            TURBO_MODE,
            SPEED,
            userWeight
        };
    }
};

function isPegasusExerciseAvailable(idx) {
    const ex = exercises[idx];
    return !!(ex && ex.classList && !ex.classList.contains("exercise-skipped"));
}
