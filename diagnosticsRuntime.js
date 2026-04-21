/* ==========================================================================
   PEGASUS DIAGNOSTICS RUNTIME
   Extracted from app.js to preserve behavior while shrinking the main runtime.
   ========================================================================== */

/* ===== 1. ISSUE LOGGER (DIAGNOSTIC MODE) ===== */
window.pegasusLogs = (() => { try { return JSON.parse(localStorage.getItem(P_M?.system?.logs || "pegasus_system_logs") || "[]"); } catch (e) { console.warn("⚠️ PEGASUS LOGS RESET:", e); return []; } })();
const originalError = console.error;
const originalWarn = console.warn;

console.error = function(...args) {
    window.pegasusLogs.push({ type: "ERROR", time: new Date().toLocaleTimeString('el-GR'), msg: args.join(" ") });
    localStorage.setItem(P_M?.system?.logs || "pegasus_system_logs", JSON.stringify(window.pegasusLogs.slice(-50)));
    originalError.apply(console, args);
};

console.warn = function(...args) {
    window.pegasusLogs.push({ type: "WARNING", time: new Date().toLocaleTimeString('el-GR'), msg: args.join(" ") });
    localStorage.setItem(P_M?.system?.logs || "pegasus_system_logs", JSON.stringify(window.pegasusLogs.slice(-50)));
    originalWarn.apply(console, args);
};

window.addEventListener('error', function(event) {
    console.error(`Runtime Error: ${event.message} at ${event.filename}:${event.lineno}`);
});

window.PegasusDebug = {
    state: () => ({ exercises, remainingSets, currentIdx, running, phase, phaseRemainingSeconds }),
    session: () => (typeof window.getPegasusSessionState === "function" ? window.getPegasusSessionState() : null),
    progress: () => (typeof window.getPegasusProgressState === "function" ? window.getPegasusProgressState() : null),
    summary: () => (typeof window.getPegasusRuntimeSummary === "function" ? window.getPegasusRuntimeSummary() : null),
    timerDisplay: () => (typeof window.getPegasusTimerDisplayState === "function" ? window.getPegasusTimerDisplayState() : null),
    controls: () => (typeof window.getPegasusControlState === "function" ? window.getPegasusControlState() : null),
    uiState: () => (typeof window.getPegasusUiState === "function" ? window.getPegasusUiState() : null),
    replayProgress: (limit) => (typeof window.getPegasusReplayProgress === "function" ? window.getPegasusReplayProgress(limit) : null),
    persistedProgress: () => (typeof window.getPegasusPersistedProgress === "function" ? window.getPegasusPersistedProgress() : null),
    restorePersistedProgress: () => (typeof window.restorePegasusPersistedProgress === "function" ? window.restorePegasusPersistedProgress() : null),
    clearPersistedProgress: () => (typeof window.clearPegasusPersistedProgress === "function" ? window.clearPegasusPersistedProgress() : null),
    actions: (limit) => (window.PegasusEngine?.getActionTypes ? window.PegasusEngine.getActionTypes(limit || 25) : ((window.PegasusEngine?.getEventBuffer ? window.PegasusEngine.getEventBuffer() : []).slice(-(limit || 25)).map(ev => ev.type))),
    actionEntries: (limit) => (window.PegasusEngine?.getActionEntries ? window.PegasusEngine.getActionEntries(limit || 25) : []),
    checkpoints: (limit) => (window.PegasusEngine?.getCheckpoints ? window.PegasusEngine.getCheckpoints(limit || 10) : []),
    workoutActions: (limit) => (window.PegasusEngine?.getWorkoutActionTypes ? window.PegasusEngine.getWorkoutActionTypes(limit || 25) : []),
    workout: () => (window.PegasusEngine?.getWorkoutState ? window.PegasusEngine.getWorkoutState() : null),
    timers: () => (window.PegasusEngine?.getTimerState ? window.PegasusEngine.getTimerState() : null),
    user: () => (window.PegasusEngine?.getUserState ? window.PegasusEngine.getUserState() : null),
    engineState: () => (window.PegasusEngine?.getState ? window.PegasusEngine.getState() : null),
    replay: (limit) => (window.PegasusEngine?.replay ? window.PegasusEngine.replay(limit) : null),
    manifest: () => P_M,
    testImage: (name) => {
        const testImg = new Image();
        testImg.onload = () => console.log(`%c ✅ ASSET FOUND: ${name}.png`, "color: #4CAF50; font-weight: bold;");
        testImg.onerror = () => console.error(`%c ❌ ASSET 404: ${name}.png is missing from GitHub!`, "color: #ff4444;");
        testImg.src = `images/${name}.png`;
    },
    logs: () => window.pegasusLogs
};
