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
window.getPegasusTodayDateStr = function() {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

window.getPegasusLocalDateKey = function() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function getPegasusTimerConfig() {
    const raw = window.pegasusTimerConfig || {};
    const normalizePhase = (value, fallback) => {
        const parsed = parseInt(value, 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    };

    const normalized = {
        prep: normalizePhase(raw.prep, 10),
        work: normalizePhase(raw.work, 45),
        rest: normalizePhase(raw.rest, 60)
    };

    window.pegasusTimerConfig = normalized;
    return normalized;
}

function getPhaseDefaultTime(targetPhase) {
    const config = getPegasusTimerConfig();
    return (targetPhase === 0) ? config.prep : (targetPhase === 1 ? config.work : config.rest);
}

window.getPegasusTodayCardioOffset = function() {
    const dateStr = window.getPegasusTodayDateStr();

    const unified = parseFloat(localStorage.getItem("pegasus_cardio_kcal_" + dateStr));
    if (!isNaN(unified)) return unified;

    const legacy = parseFloat(localStorage.getItem((M?.workout?.cardio_offset || "pegasus_cardio_offset_sets") + "_" + dateStr));
    if (!isNaN(legacy)) return legacy;

    return 0;
};

window.getPegasusBaseDailyTarget = function(settingsObj) {
    const greekDays = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
    const dayName = greekDays[new Date().getDay()];

    const settings = settingsObj || (
        typeof window.getPegasusSettings === "function"
            ? window.getPegasusSettings()
            : { activeSplit: "IRON" }
    );

    const activePlan = settings?.activeSplit || "IRON";

    const KCAL_REST = 2100;
    const KCAL_WEIGHTS = 2800;
    const KCAL_EMS = 2700;
    const KCAL_BIKE = 3100;

    if (dayName === "Δευτέρα" || dayName === "Πέμπτη") return KCAL_REST;

    switch (activePlan) {
        case "EMS_ONLY":
            return dayName === "Τετάρτη" ? KCAL_EMS : KCAL_WEIGHTS;
        case "BIKE_ONLY":
            return (dayName === "Σάββατο" || dayName === "Κυριακή") ? KCAL_BIKE : KCAL_WEIGHTS;
        case "HYBRID":
            if (dayName === "Τετάρτη") return KCAL_EMS;
            if (dayName === "Σάββατο" || dayName === "Κυριακή") return KCAL_BIKE;
            return KCAL_WEIGHTS;
        case "IRON":
        case "UPPER_LOWER":
        default:
            return KCAL_WEIGHTS;
    }
};

window.getPegasusEffectiveDailyTarget = function(settingsObj) {
    const baseTarget = window.getPegasusBaseDailyTarget(settingsObj);
    const cardioOffset = window.getPegasusTodayCardioOffset();
    return Math.round(baseTarget + cardioOffset);
};

/* ===== 2.5 DYNAMIC UI KCAL CONTROLLER ===== */
window.updateKcalUI = function() {
    const kcalDisplay = document.querySelector(".kcal-value");
    const kcalLabel = document.querySelector(".kcal-label");
    if (!kcalDisplay) return;

    const uiState = (typeof window.getPegasusUiState === "function")
        ? window.getPegasusUiState()
        : null;
    const summary = uiState?.summary || ((typeof window.getPegasusRuntimeSummary === "function")
        ? window.getPegasusRuntimeSummary()
        : { running, sessionKcal: sessionActiveKcal });

    const isWorkoutActive = !!summary.running;
    const liveSessionKcal = typeof summary.sessionKcal === "number" ? summary.sessionKcal : sessionActiveKcal;

    if (isWorkoutActive) {
        kcalDisplay.textContent = parseFloat(liveSessionKcal || 0).toFixed(1);
        kcalDisplay.style.color = "#FFC107";
        if (kcalLabel) kcalLabel.textContent = "KCAL ΠΡΟΠΟΝΗΣΗΣ";
    } else {
        const dailyTarget = (typeof window.getPegasusEffectiveDailyTarget === "function")
            ? window.getPegasusEffectiveDailyTarget()
            : (localStorage.getItem('pegasus_today_kcal') || "2100");

        kcalDisplay.textContent = dailyTarget;
        kcalDisplay.style.color = "#4CAF50";
        if (kcalLabel) kcalLabel.textContent = "ΣΤΟΧΟΣ ΗΜΕΡΑΣ (KCAL)";
    }
};

/* ===== 3. AUDIO SYSTEM ===== */
let sysAudio = new Audio('videos/beep.mp3');
let audioUnlocked = false;

document.addEventListener('click', function() {
    if (!audioUnlocked) {
        sysAudio.play().then(() => {
            sysAudio.pause();
            sysAudio.currentTime = 0;
            audioUnlocked = true;
            console.log("🔊 PEGASUS OS: Audio Unlocked & Ready.");
        }).catch(err => console.warn("PEGASUS OS: Audio unlock pending user action", err));
    }
}, { once: true });

const playBeep = (volume = 1) => {
    if (!muted) {
        sysAudio.volume = volume;
        sysAudio.currentTime = 0;
        sysAudio.play().catch(e => console.log("Audio execution blocked by browser policy", e));
    }
};

/* ===== PEGASUS CORE ENGINE BRIDGE ===== */
function clonePegasusValue(value) {
    try {
        return structuredClone(value);
    } catch (e) {
        return JSON.parse(JSON.stringify(value));
    }
}

function getPegasusCoreEngine() {
    if (window.PegasusEngine && window.PegasusEngine.__isCoreEngine) {
        return window.PegasusEngine;
    }
    return null;
}

function restoreLegacyExerciseRefs(realExercises) {
    exercises = realExercises || [];
    window.exercises = exercises;
}

function buildPegasusLegacySnapshot(extra) {
    const payload = {
        exercises: isPegasusSerializableExerciseArray(exercises) ? exercises : [],
        remainingSets: Array.isArray(remainingSets) ? remainingSets.slice() : [],
        currentIdx: currentIdx,
        phase: phase,
        running: running,
        sessionKcal: sessionActiveKcal,
        totalSeconds: totalSeconds,
        remainingSeconds: remainingSeconds,
        phaseRemainingSeconds: phaseRemainingSeconds,
        turboMode: TURBO_MODE,
        speed: SPEED,
        userWeight: userWeight,
        muted: muted,
        todayDateStr: window.getPegasusTodayDateStr(),
        todayKey: window.getPegasusLocalDateKey()
    };

    if (extra && typeof extra === "object") {
        Object.keys(extra).forEach(key => {
            payload[key] = extra[key];
        });
    }

    return payload;
}

function getPegasusSessionState() {
    const engine = getPegasusCoreEngine();
    if (engine?.getSessionSnapshot) {
        return engine.getSessionSnapshot();
    }

    return {
        workout: {
            exercises,
            remainingSets,
            currentIdx,
            phase,
            running,
            sessionKcal: sessionActiveKcal
        },
        timers: {
            totalSeconds,
            remainingSeconds,
            phaseRemainingSeconds,
            turboMode: TURBO_MODE,
            speed: SPEED
        },
        user: {
            weight: userWeight,
            muted: muted
        },
        nutrition: {
            todayDateStr: window.getPegasusTodayDateStr(),
            todayKey: window.getPegasusLocalDateKey()
        }
    };
}

window.getPegasusSessionState = getPegasusSessionState;

function getPegasusProgressState() {
    const engine = getPegasusCoreEngine();
    if (engine?.getProgressSnapshot) {
        return engine.getProgressSnapshot();
    }

    const session = getPegasusSessionState();
    return {
        selectedDay: session?.workout?.selectedDay || null,
        currentIdx: session?.workout?.currentIdx ?? currentIdx,
        phase: session?.workout?.phase ?? phase,
        running: !!(session?.workout?.running ?? running),
        remainingSets: Array.isArray(session?.workout?.remainingSets) ? session.workout.remainingSets.slice() : [],
        totalSeconds: session?.timers?.totalSeconds ?? totalSeconds,
        remainingSeconds: session?.timers?.remainingSeconds ?? remainingSeconds,
        phaseRemainingSeconds: session?.timers?.phaseRemainingSeconds ?? phaseRemainingSeconds,
        sessionKcal: session?.workout?.sessionKcal ?? sessionActiveKcal
    };
}


window.getPegasusProgressState = getPegasusProgressState;

function getPegasusTimerDisplayState() {
    const engine = getPegasusCoreEngine();
    if (engine?.getTimerDisplayState) {
        return engine.getTimerDisplayState();
    }

    const progress = getPegasusProgressState();
    const total = progress?.totalSeconds ?? totalSeconds;
    const remaining = progress?.remainingSeconds ?? remainingSeconds;
    const safeTotal = total > 0 ? total : 0;
    const safeRemaining = typeof remaining === "number" ? remaining : 0;
    const minutes = Math.floor(safeRemaining / 60);
    const seconds = Math.floor(safeRemaining % 60);

    return {
        totalSeconds: safeTotal,
        remainingSeconds: safeRemaining,
        phaseRemainingSeconds: progress?.phaseRemainingSeconds ?? phaseRemainingSeconds,
        progressPercent: safeTotal > 0 ? Math.max(0, Math.min(100, ((safeTotal - safeRemaining) / safeTotal) * 100)) : 0,
        remainingText: `${minutes}:${String(seconds).padStart(2, "0")}`
    };
}

window.getPegasusTimerDisplayState = getPegasusTimerDisplayState;

function getPegasusRuntimeSummary() {
    const engine = getPegasusCoreEngine();
    if (engine?.getRuntimeSummary) {
        return engine.getRuntimeSummary();
    }

    const progress = getPegasusProgressState();
    const remainingSets = Array.isArray(progress?.remainingSets) ? progress.remainingSets : [];
    const hasRemainingWork = remainingSets.some(value => Number(value || 0) > 0);
    const hasExercises = remainingSets.length > 0;
    const isFinished = hasExercises && !hasRemainingWork;

    return {
        selectedDay: progress?.selectedDay || getPegasusActiveSelectedDay() || null,
        currentIdx: progress?.currentIdx ?? currentIdx,
        phase: progress?.phase ?? phase,
        running: !!(progress?.running ?? running),
        hasExercises,
        hasRemainingWork,
        isFinished,
        canStart: hasRemainingWork && !(progress?.running ?? running),
        canPause: !!(progress?.running ?? running),
        sessionKcal: progress?.sessionKcal ?? sessionActiveKcal,
        totalSeconds: progress?.totalSeconds ?? totalSeconds,
        remainingSeconds: progress?.remainingSeconds ?? remainingSeconds,
        progressPercent: getPegasusTimerDisplayState().progressPercent
    };
}

window.getPegasusRuntimeSummary = getPegasusRuntimeSummary;


function getPegasusControlState() {
    const engine = getPegasusCoreEngine();
    if (engine?.getControlState) {
        return engine.getControlState();
    }

    const summary = getPegasusRuntimeSummary();
    const total = Number(summary?.totalSeconds || 0);
    const remaining = Number(summary?.remainingSeconds || 0);
    const wasStarted = !!summary?.hasExercises && total > 0 && remaining < total;

    return {
        selectedDay: summary?.selectedDay ?? null,
        running: !!summary?.running,
        hasExercises: !!summary?.hasExercises,
        hasRemainingWork: !!summary?.hasRemainingWork,
        isFinished: !!summary?.isFinished,
        wasStarted,
        startLabel: summary?.running ? "Παύση" : (wasStarted ? "Συνέχεια" : "Έναρξη"),
        nextLabel: "Επόμενο",
        canStart: !!summary?.canStart,
        canPause: !!summary?.canPause,
        canNext: !!summary?.hasExercises && !!summary?.hasRemainingWork
    };
}

window.getPegasusControlState = getPegasusControlState;

function getPegasusUiState() {
    const engine = getPegasusCoreEngine();
    if (engine?.getUiState) {
        return engine.getUiState();
    }

    const progress = getPegasusProgressState();
    const phaseValue = progress?.phase ?? phase;

    return {
        selectedDay: getPegasusRuntimeSummary().selectedDay || null,
        phase: phaseValue,
        phaseName: phaseValue === 0 ? "prep" : (phaseValue === 1 ? "work" : "rest"),
        progress,
        timerDisplay: getPegasusTimerDisplayState(),
        summary: getPegasusRuntimeSummary(),
        controls: getPegasusControlState(),
        persisted: (typeof window.getPegasusPersistedProgress === "function") ? window.getPegasusPersistedProgress() : null
    };
}

window.getPegasusUiState = getPegasusUiState;

function renderPegasusControlState() {
    const uiState = getPegasusUiState();
    const controls = uiState?.controls || getPegasusControlState();
    const startBtn = document.getElementById("btnStart");
    const nextBtn = document.getElementById("btnNext");

    if (startBtn) {
        startBtn.innerHTML = controls?.startLabel || "Έναρξη";
        startBtn.dataset.running = controls?.running ? "true" : "false";
        startBtn.dataset.started = controls?.wasStarted ? "true" : "false";
    }

    if (nextBtn) {
        nextBtn.innerHTML = controls?.nextLabel || "Επόμενο";
        nextBtn.style.opacity = controls?.canNext ? "1" : "0.65";
    }

    return controls;
}

function getPegasusActiveSelectedDay() {
    const activeBtn = document.querySelector(".navbar button.active");
    return activeBtn ? activeBtn.id.replace("nav-", "") : null;
}

function buildPegasusProgressPayload(extra) {
    const safeExtra = (extra && typeof extra === "object") ? extra : {};
    const extraWorkout = (safeExtra.workout && typeof safeExtra.workout === "object") ? safeExtra.workout : {};
    const extraTimers = (safeExtra.timers && typeof safeExtra.timers === "object") ? safeExtra.timers : {};

    const selectedDay = Object.prototype.hasOwnProperty.call(extraWorkout, "selectedDay")
        ? extraWorkout.selectedDay
        : getPegasusActiveSelectedDay();

    return {
        workout: {
            selectedDay: selectedDay ?? null,
            currentIdx,
            phase,
            running,
            remainingSets: Array.isArray(remainingSets) ? remainingSets.slice() : [],
            sessionKcal: sessionActiveKcal,
            ...extraWorkout
        },
        timers: {
            totalSeconds,
            remainingSeconds,
            phaseRemainingSeconds,
            turboMode: TURBO_MODE,
            speed: SPEED,
            ...extraTimers
        }
    };
}

function syncPegasusProgressRuntime(extra) {
    return patchPegasusEngineRuntime("PATCH_PROGRESS_RUNTIME", buildPegasusProgressPayload(extra));
}

function syncPegasusSelectedDay(selectedDay) {
    syncPegasusProgressRuntime({
        workout: {
            selectedDay: selectedDay ?? null
        }
    });
}

function dispatchPegasusWorkoutAction(actionType, extra) {
    const engine = getPegasusCoreEngine();
    if (!engine) return null;

    const payload = buildPegasusProgressPayload(extra);

    if (actionType === "WORKOUT_SELECT_DAY_RUNTIME" && engine.selectDayRuntime) return engine.selectDayRuntime(payload);
    if (actionType === "WORKOUT_START_RUNTIME" && engine.startWorkoutRuntime) return engine.startWorkoutRuntime(payload);
    if (actionType === "WORKOUT_PAUSE_RUNTIME" && engine.pauseWorkoutRuntime) return engine.pauseWorkoutRuntime(payload);
    if (actionType === "WORKOUT_NEXT_RUNTIME" && engine.nextExerciseRuntime) return engine.nextExerciseRuntime(payload);
    if (actionType === "WORKOUT_SET_COMPLETED_RUNTIME" && engine.completeSetRuntime) return engine.completeSetRuntime(payload);
    if (actionType === "WORKOUT_FINISH_RUNTIME" && engine.finishWorkoutRuntime) return engine.finishWorkoutRuntime(payload);

    return null;
}

function isPegasusDomExerciseArray(value) {
    return Array.isArray(value) && value.length > 0 && value.every(item => item && typeof item.querySelector === "function" && item.classList);
}

function isPegasusSerializableExerciseArray(value) {
    return Array.isArray(value) && value.every(item => {
        if (!item || typeof item !== "object") return false;
        if (item.nodeType || typeof item.querySelector === "function" || typeof item.classList !== "undefined") return false;
        return true;
    });
}

function applyPegasusSessionSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return snapshot;

    const workout = snapshot.workout || {};
    const timers = snapshot.timers || {};
    const user = snapshot.user || {};

    if (isPegasusDomExerciseArray(workout.exercises)) {
        exercises = workout.exercises;
        window.exercises = exercises;
    }

    if (Array.isArray(workout.remainingSets) && (workout.remainingSets.length > 0 || !Array.isArray(remainingSets) || remainingSets.length === 0)) {
        remainingSets = workout.remainingSets.slice();
        window.remainingSets = remainingSets;
    }

    currentIdx = workout.currentIdx ?? currentIdx;
    phase = workout.phase ?? phase;
    running = workout.running ?? running;
    sessionActiveKcal = workout.sessionKcal ?? sessionActiveKcal;

    totalSeconds = timers.totalSeconds ?? totalSeconds;
    remainingSeconds = timers.remainingSeconds ?? remainingSeconds;
    phaseRemainingSeconds = timers.phaseRemainingSeconds ?? phaseRemainingSeconds;
    TURBO_MODE = timers.turboMode ?? TURBO_MODE;
    SPEED = timers.speed ?? SPEED;

    userWeight = user.weight ?? userWeight;
    muted = user.muted ?? muted;

    window.currentIdx = currentIdx;
    window.phase = phase;
    window.running = running;
    window.sessionActiveKcal = sessionActiveKcal;
    window.totalSeconds = totalSeconds;
    window.remainingSeconds = remainingSeconds;
    window.phaseRemainingSeconds = phaseRemainingSeconds;
    window.TURBO_MODE = TURBO_MODE;
    window.SPEED = SPEED;
    window.userWeight = userWeight;
    window.muted = muted;

    return snapshot;
}

function applyPegasusProgressSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return snapshot;

    const workout = snapshot.workout || {};
    const timers = snapshot.timers || {};
    const user = snapshot.user || {};

    currentIdx = workout.currentIdx ?? currentIdx;
    phase = workout.phase ?? phase;
    running = workout.running ?? running;
    sessionActiveKcal = workout.sessionKcal ?? sessionActiveKcal;

    totalSeconds = timers.totalSeconds ?? totalSeconds;
    remainingSeconds = timers.remainingSeconds ?? remainingSeconds;
    phaseRemainingSeconds = timers.phaseRemainingSeconds ?? phaseRemainingSeconds;
    TURBO_MODE = timers.turboMode ?? TURBO_MODE;
    SPEED = timers.speed ?? SPEED;

    userWeight = user.weight ?? userWeight;
    muted = user.muted ?? muted;

    window.currentIdx = currentIdx;
    window.phase = phase;
    window.running = running;
    window.sessionActiveKcal = sessionActiveKcal;
    window.totalSeconds = totalSeconds;
    window.remainingSeconds = remainingSeconds;
    window.phaseRemainingSeconds = phaseRemainingSeconds;
    window.TURBO_MODE = TURBO_MODE;
    window.SPEED = SPEED;
    window.userWeight = userWeight;
    window.muted = muted;

    return snapshot;
}

function patchPegasusEngineRuntime(actionType, payload) {
    const engine = getPegasusCoreEngine();
    if (!engine) return null;

    let nextState = null;

    if (actionType === "PATCH_WORKOUT_RUNTIME" && engine.patchWorkoutRuntime) {
        nextState = engine.patchWorkoutRuntime(payload);
    } else if (actionType === "PATCH_TIMER_RUNTIME" && engine.patchTimerRuntime) {
        nextState = engine.patchTimerRuntime(payload);
    } else if (actionType === "PATCH_PROGRESS_RUNTIME" && engine.patchProgressRuntime) {
        nextState = engine.patchProgressRuntime(payload);
    } else if (actionType === "PATCH_USER_RUNTIME" && engine.patchUserRuntime) {
        nextState = engine.patchUserRuntime(payload);
    } else if (actionType === "PATCH_SESSION_RUNTIME" && engine.patchSessionRuntime) {
        nextState = engine.patchSessionRuntime(payload);
    } else if (actionType === "SET_SELECTED_DAY" && engine.setSelectedDay) {
        nextState = engine.setSelectedDay(payload?.selectedDay ?? null);
    }

    if (nextState?.workout && nextState?.timers) {
        if (actionType === "PATCH_TIMER_RUNTIME" || actionType === "PATCH_PROGRESS_RUNTIME") {
            applyPegasusProgressSnapshot(nextState);
        } else {
            applyPegasusSessionSnapshot(nextState);
        }
    }

    return nextState;
}

function patchPegasusWorkoutRuntime(payload) {
    return patchPegasusEngineRuntime("PATCH_WORKOUT_RUNTIME", payload);
}

function patchPegasusTimerRuntime(payload) {
    return patchPegasusEngineRuntime("PATCH_TIMER_RUNTIME", payload);
}

function patchPegasusUserRuntime(payload) {
    return patchPegasusEngineRuntime("PATCH_USER_RUNTIME", payload);
}

function patchPegasusSessionRuntime(payload) {
    return patchPegasusEngineRuntime("PATCH_SESSION_RUNTIME", payload);
}

function bindPegasusEngineUiBridge() {
    if (window.__pegasusEngineUiBridgeBound) return;
    const engine = getPegasusCoreEngine();
    if (!engine?.subscribe) return;

    window.__pegasusEngineUiBridgeBound = true;

    engine.subscribe((nextState, action) => {
        try {
            if (!nextState || !action) return;

            const actionType = action.type || "";
            const runtimeAction = actionType.includes("PATCH_") || actionType.includes("PHASE") || actionType.includes("WORKOUT") || actionType.includes("SYNC_") || actionType.includes("SELECT_DAY") || actionType.includes("SET_SELECTED_DAY") || actionType.includes("AUTO_INIT") || actionType.includes("BOOT");

            if (runtimeAction) {
                if (actionType === "PATCH_TIMER_RUNTIME" || actionType === "PATCH_PROGRESS_RUNTIME") {
                    applyPegasusProgressSnapshot(nextState);
                } else {
                    applyPegasusSessionSnapshot(nextState);
                }
                updateTotalBar();
                if (typeof window.updateKcalUI === "function") window.updateKcalUI();

                renderPegasusControlState();
            }
        } catch (e) {
            console.warn("⚠️ PEGASUS ENGINE UI BRIDGE WARNING:", e);
        }
    });
}

function syncEngineFromLegacy(actionType, extra) {
    const engine = getPegasusCoreEngine();
    if (!engine) return;

    const realExercises = exercises;
    const snapshot = buildPegasusLegacySnapshot(extra);

    const nextState = engine.hydrateFromLegacy
        ? engine.hydrateFromLegacy(snapshot, actionType || "HYDRATE_LEGACY_RUNTIME")
        : engine.replaceState?.({
            ...engine.getInitialState(),
            workout: {
                ...(engine.getInitialState().workout || {}),
                exercises: snapshot.exercises,
                remainingSets: snapshot.remainingSets,
                currentIdx: snapshot.currentIdx,
                phase: snapshot.phase,
                running: snapshot.running,
                selectedDay: snapshot.selectedDay ?? null,
                sessionKcal: snapshot.sessionKcal
            },
            timers: {
                ...(engine.getInitialState().timers || {}),
                totalSeconds: snapshot.totalSeconds,
                remainingSeconds: snapshot.remainingSeconds,
                phaseRemainingSeconds: snapshot.phaseRemainingSeconds,
                turboMode: snapshot.turboMode,
                speed: snapshot.speed
            },
            user: {
                ...(engine.getInitialState().user || {}),
                weight: snapshot.userWeight,
                muted: snapshot.muted
            },
            nutrition: {
                ...(engine.getInitialState().nutrition || {}),
                todayDateStr: snapshot.todayDateStr,
                todayKey: snapshot.todayKey
            }
        }, actionType || "HYDRATE_LEGACY_RUNTIME");

    if (nextState?.workout && nextState?.timers) {
        applyPegasusSessionSnapshot(nextState);
    }

    restoreLegacyExerciseRefs(realExercises);
}


function syncPegasusWorkoutRuntime(extraWorkout) {
    patchPegasusEngineRuntime("PATCH_WORKOUT_RUNTIME", {
        currentIdx,
        phase,
        running,
        remainingSets: Array.isArray(remainingSets) ? remainingSets.slice() : [],
        sessionKcal: sessionActiveKcal,
        ...(extraWorkout || {})
    });
}

function syncPegasusTimerRuntime(extraTimers) {
    patchPegasusEngineRuntime("PATCH_TIMER_RUNTIME", {
        totalSeconds,
        remainingSeconds,
        phaseRemainingSeconds,
        turboMode: TURBO_MODE,
        speed: SPEED,
        ...(extraTimers || {})
    });
}

function syncPegasusUserRuntime(extraUser) {
    patchPegasusEngineRuntime("PATCH_USER_RUNTIME", {
        weight: userWeight,
        muted: muted,
        ...(extraUser || {})
    });
}

/* ===== 3.5 SMART SYNC (AUTO-SKIP COMPLETED TARGETS) ===== */
window.syncSessionWithHistory = function() {
    console.log("🔄 PEGASUS SMART SYNC: Executing...");
    const historyKey = P_M?.workout?.weekly_history || 'pegasus_weekly_history';
    const history = JSON.parse(localStorage.getItem(historyKey) || "{}");
    const targets = (typeof window.getDynamicTargets === "function") ? window.getDynamicTargets() : {};

    exercises.forEach((exDiv, i) => {
        const exName = exDiv.querySelector(".exercise-name")?.textContent?.trim();
        const muscle = (window.exercisesDB?.find(e => e.name.trim() === exName))?.muscleGroup;

        if (muscle) {
            const doneWeekly = parseInt(history[muscle]) || 0;
            const targetWeekly = parseInt(targets[muscle]) || 0;
            if (targetWeekly > 0 && doneWeekly >= targetWeekly) {
                if (!exDiv.classList.contains("exercise-skipped") && remainingSets[i] > 0) {
                    window.toggleSkipExercise(i, true);
                }
            }
        }
    });
};

/* ===== 4. NAVIGATION BINDING ===== */
function createNavbar() {
    const days = ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο", "Κυριακή"];
    days.forEach((d) => {
        const btn = document.getElementById(`nav-${d}`);
        if (btn) {
            btn.onclick = (e) => {
                if (e && e.isTrusted && window.PegasusCloud && typeof window.PegasusCloud.push === "function") {
                    window.PegasusCloud.push();
                }
                selectDay(btn, d);
            };
        }
    });
}

function selectDay(btn, day) {
    if (typeof window.program === 'undefined' || !window.program) return;

    document.querySelectorAll(".navbar button").forEach(b => {
        b.classList.remove("active");
        b.style.setProperty('background-color', 'transparent', 'important');
        b.style.color = "#333";
    });

    if (btn) {
        btn.classList.add("active");
        btn.style.setProperty('background-color', 'rgba(76, 175, 80, 0.1)', 'important');
        btn.style.color = "#4CAF50";
    }

    clearInterval(timer);
    timer = null;
    running = false;
    phase = 0;
    phaseRemainingSeconds = null;
    currentIdx = 0;
    sessionActiveKcal = 0;
    localStorage.setItem("pegasus_session_kcal", "0.0");

    renderPegasusControlState();

    if (typeof window.calculatePegasusDailyTarget === "function") {
        if (!window.isCalculatingTarget) {
            window.isCalculatingTarget = true;
            window.calculatePegasusDailyTarget();
            setTimeout(() => { window.isCalculatingTarget = false; }, 100);
        }
    } else if (typeof window.updateKcalUI === "function") {
        window.updateKcalUI();
    }

    const isRainy = (typeof window.isRaining === 'function') ? window.isRaining() : false;
    let rawBaseData = [];

    if ((day === "Σάββατο" || day === "Κυριακή") && isRainy) {
        rawBaseData = [
            { name: "Chest Press", sets: 5, muscleGroup: "Στήθος" },
            { name: "Low Seated Row", sets: 5, muscleGroup: "Πλάτη" },
            { name: "Ab Crunches", sets: 3, muscleGroup: "Κορμός" }
        ];
    } else {
        rawBaseData = (window.program[day]) ? [...window.program[day]] : [];
    }

    let mappedData = window.PegasusOptimizer
        ? window.PegasusOptimizer.apply(day, rawBaseData)
        : rawBaseData.map(e => ({ ...e, adjustedSets: e.sets, isCompleted: false }));

    mappedData.sort((a, b) => parseFloat(b.adjustedSets || b.sets) - parseFloat(a.adjustedSets || a.sets));

    const list = document.getElementById("exList");
    if (!list) return;
    list.innerHTML = "";
    exercises = [];
    remainingSets = [];

    const todayStr = window.getPegasusLocalDateKey();
    let dailyProg = JSON.parse(localStorage.getItem('pegasus_daily_progress') || "{}");
    if (dailyProg.date !== todayStr) dailyProg = { date: todayStr, exercises: {} };

    mappedData.forEach((e) => {
        if (!e.name || e.name === "αα" || e.adjustedSets < 0.1) return;

        const cleanName = e.name.trim();
        let finalSets = parseFloat(e.adjustedSets);
        let doneSoFar = dailyProg.exercises[cleanName] || 0;
        let remSets = Math.max(0, finalSets - doneSoFar);
        const renderIdx = exercises.length;

        const d = document.createElement("div");
        d.className = "exercise";
        d.dataset.total = finalSets;
        d.dataset.done = doneSoFar;
        d.dataset.index = renderIdx;

        const savedWeight = window.getSavedWeight(cleanName);
        const displayWeight = (savedWeight && savedWeight !== "") ? savedWeight : (e.weight || "");

        d.innerHTML = `
            <div class="exercise-info">
                <div class="set-counter">${doneSoFar}/${finalSets}</div>
                <div class="exercise-name"></div>
                <input type="number" id="weight-${renderIdx}" class="weight-input" placeholder="kg">
            </div>
            <div class="progress-box"><div class="progress-bar"></div></div>
        `;

        const nameNode = d.querySelector(".exercise-name");
        if (nameNode) nameNode.textContent = cleanName;

        const weightInputEl = d.querySelector(".weight-input");
        if (weightInputEl) {
            weightInputEl.setAttribute("data-name", cleanName);
            if (displayWeight !== "") weightInputEl.value = displayWeight;

            weightInputEl.addEventListener("click", function(ev) {
                ev.stopPropagation();
            });

            weightInputEl.addEventListener("change", function() {
                window.saveWeight(cleanName, this.value);
            });
        }

        const infoNode = d.querySelector(".exercise-info");
        if (infoNode) {
            infoNode.addEventListener("click", function() {
                window.toggleSkipExercise(renderIdx);
            });
        }

        list.appendChild(d);
        exercises.push(d);
        remainingSets.push(remSets);

        if (remSets === 0) {
            d.classList.add("exercise-skipped");
            d.style.setProperty('opacity', '0.2', 'important');
            d.style.setProperty('filter', 'grayscale(100%)', 'important');
        }
    });

    if (typeof calculateTotalTime === "function") calculateTotalTime(false);
    syncPegasusSelectedDay(day);
    dispatchPegasusWorkoutAction("WORKOUT_SELECT_DAY_RUNTIME", { workout: { selectedDay: day } });

    setTimeout(() => { window.syncSessionWithHistory(); }, 50);

    setTimeout(() => {
        if (typeof showVideo === "function") showVideo(0);
        if (exercises.length === 0) {
            list.innerHTML = `<div style="padding:20px; color:#666; text-align:center;">🌿 Ημέρα Αποθεραπείας (History: ${day})</div>`;
        }
    }, 150);
}


function isPegasusExerciseAvailable(idx) {
    const ex = exercises[idx];
    return !!(ex && ex.classList && !ex.classList.contains("exercise-skipped"));
}

/* ===== 5. WORKOUT ENGINE CORE (DYNAMIC TIMER PATCH) ===== */
function startPause() {
    if (exercises.length === 0) return;

    const vid = document.getElementById("video");
    const config = getPegasusTimerConfig();
    const isFreshStart = (currentIdx === 0 && phase === 0 && totalSeconds === remainingSeconds);

    if (!running) {
        let firstAvailable = remainingSets.findIndex((sets, idx) => sets > 0 && isPegasusExerciseAvailable(idx));
        if (isFreshStart) {
            if (firstAvailable !== -1) currentIdx = firstAvailable;
        } else if (exercises[currentIdx] && exercises[currentIdx].classList.contains("exercise-skipped")) {
            if (firstAvailable !== -1) currentIdx = firstAvailable;
        }
    }

    if (!running && isFreshStart) {
        sessionActiveKcal = 0;
        localStorage.setItem("pegasus_session_kcal", "0.0");
    }

    if (vid && vid.src.includes("warmup")) {
        vid.loop = false;
        vid.pause();
    }

    running = !running;
    renderPegasusControlState();

    syncPegasusProgressRuntime();
    dispatchPegasusWorkoutAction(running ? "WORKOUT_START_RUNTIME" : "WORKOUT_PAUSE_RUNTIME");
    if (typeof window.updateKcalUI === "function") window.updateKcalUI();

    if (running) {
        if (!isFreshStart) {
            const pausedPhase = phase;
            const pausedRemaining = (phaseRemainingSeconds !== null) ? phaseRemainingSeconds : getPhaseDefaultTime(pausedPhase);

            if (pausedPhase === 0) {
                const restorePrep = Math.max(0, config.prep - pausedRemaining);
                totalSeconds += restorePrep;
                remainingSeconds += restorePrep;
                phase = 0;
            } else if (pausedPhase === 1) {
                const restoreWorkToPrep = Math.max(0, config.prep + (config.work - pausedRemaining));
                totalSeconds += restoreWorkToPrep;
                remainingSeconds += restoreWorkToPrep;
                phase = 0;
            } else if (pausedPhase === 2) {
                const skippedRest = Math.max(0, pausedRemaining);
                totalSeconds = Math.max(0, totalSeconds - skippedRest);
                remainingSeconds = Math.max(0, remainingSeconds - skippedRest);

                let nextIdx = getNextIndexCircuit();
                if (nextIdx !== -1) currentIdx = nextIdx;
                phase = 0;
            }

            phaseRemainingSeconds = null;
            updateTotalBar();

            const barFill = document.getElementById("phaseTimerFill");
            if (barFill) barFill.style.width = "0%";

            syncPegasusProgressRuntime();
        } else {
            syncPegasusProgressRuntime();
        }

        runPhase();
    } else {
        clearInterval(timer);
        timer = null;
        if (vid) vid.pause();
        syncPegasusProgressRuntime();
        if (window.PegasusCloud && typeof window.PegasusCloud.push === "function") window.PegasusCloud.push();
    }
}

function runPhase() {
    if (!running) return;

    if (timer) {
        clearInterval(timer);
        timer = null;
    }

    if (remainingSets.every(s => s <= 0)) {
        finishWorkout();
        return;
    }

    const e = exercises[currentIdx];
    if (!e) return;

    const weightInput = e.querySelector(".weight-input");
    if (!weightInput) return;

    const exName = weightInput.getAttribute("data-name") || "";
    let liftedWeight = parseFloat(weightInput.value) || 0;

    let baseMET = 3.5;
    let intensityMultiplier = 1.0;
    if (exName.toLowerCase().includes("cycling") || exName.toLowerCase().includes("ποδηλασία")) {
        baseMET = 8.0;
    } else if (liftedWeight > 0) {
        intensityMultiplier = 1 + (liftedWeight / 100);
    }

    let kcalPerMin = (baseMET * intensityMultiplier * userWeight * 3.5) / 200;
    let kcalPerSecond = kcalPerMin / 60;

    exercises.forEach(ex => {
        ex.style.borderColor = "#222";
        ex.style.background = "transparent";
    });
    e.style.borderColor = "#4CAF50";
    e.style.background = "rgba(76, 175, 80, 0.1)";

    const config = getPegasusTimerConfig();
    if (phase === 2 && (!Number.isFinite(config.rest) || config.rest <= 0)) {
        phase = 0;
        syncPegasusProgressRuntime();
        dispatchPegasusWorkoutAction("WORKOUT_NEXT_RUNTIME");
        runPhase();
        return;
    }

    const phaseDefaultTime = getPhaseDefaultTime(phase);
    let t = (phaseRemainingSeconds !== null) ? phaseRemainingSeconds : phaseDefaultTime;
    phaseRemainingSeconds = t;

    let pName = (phase === 0) ? "ΠΡΟΕΤΟΙΜΑΣΙΑ" : (phase === 1 ? "ΑΣΚΗΣΗ" : "ΔΙΑΛΕΙΜΜΑ");
    let cssClass = (phase === 0) ? "timer-prep" : (phase === 1 ? "timer-work" : "timer-rest");

    const label = document.getElementById("phaseTimer");
    const barFill = document.getElementById("phaseTimerFill");

    if (label) {
        label.textContent = `${pName} (${Math.max(0, Math.ceil(t))})`;
        label.className = "phase-label " + cssClass;
    }

    syncPegasusProgressRuntime();

    if (phase !== 2) showVideo(currentIdx);

    timer = setInterval(() => {
        t -= 1;
        phaseRemainingSeconds = Math.max(0, t);

        if (remainingSeconds > 0) {
            remainingSeconds -= 1;
            updateTotalBar();
        }

        if (phase === 1) {
            sessionActiveKcal += (kcalPerSecond * SPEED);
        } else if (phase === 2) {
            let restKcalPerSec = ((2.0 * userWeight * 3.5) / 200) / 60;
            sessionActiveKcal += (restKcalPerSec * SPEED);
        }

        if (label) label.textContent = `${pName} (${Math.max(0, Math.ceil(t))})`;

        if (barFill) {
            const totalPhaseTime = phaseDefaultTime || 1;
            barFill.style.width = (((totalPhaseTime - Math.max(0, t)) / totalPhaseTime) * 100) + "%";
        }

        syncPegasusProgressRuntime();
        if (typeof window.updateKcalUI === "function") window.updateKcalUI();

        if (t <= 0) {
            clearInterval(timer);
            timer = null;
            phaseRemainingSeconds = null;
            playBeep();

            if (phase === 0) {
                phase = 1;
                syncPegasusProgressRuntime();
                dispatchPegasusWorkoutAction("WORKOUT_START_RUNTIME");
                runPhase();
            } else if (phase === 1) {
                let done = parseInt(e.dataset.done) || 0;
                done++;
                e.dataset.done = done;
                remainingSets[currentIdx] = Math.max(0, parseFloat(e.dataset.total) - done);
                e.querySelector(".set-counter").textContent = `${done}/${e.dataset.total}`;

                const todayStr = window.getPegasusLocalDateKey();
                let dailyProg = JSON.parse(localStorage.getItem('pegasus_daily_progress') || "{}");
                if (dailyProg.date !== todayStr) dailyProg = { date: todayStr, exercises: {} };
                dailyProg.exercises[exName] = done;
                localStorage.setItem('pegasus_daily_progress', JSON.stringify(dailyProg));

                if (window.updateAchievements) window.updateAchievements(exName);
                if (window.logPegasusSet) window.logPegasusSet(exName);
                if (window.PegasusCloud && typeof window.PegasusCloud.push === "function") window.PegasusCloud.push();

                phase = 2;
                syncPegasusProgressRuntime();
                dispatchPegasusWorkoutAction("WORKOUT_SET_COMPLETED_RUNTIME");
                runPhase();
            } else {
                let next = getNextIndexCircuit();
                if (next !== -1) {
                    currentIdx = next;
                    phase = 0;
                    syncPegasusProgressRuntime();
                    dispatchPegasusWorkoutAction("WORKOUT_NEXT_RUNTIME");
                    runPhase();
                } else {
                    finishWorkout();
                }
            }
        }
    }, 1000 / SPEED);
}

function skipToNextExercise() {
    if (exercises.length === 0) return;

    clearInterval(timer);
    timer = null;
    phaseRemainingSeconds = null;

    if (phase === 1 && running) {
        const currentExNode = exercises[currentIdx];
        const weightInput = currentExNode ? currentExNode.querySelector(".weight-input") : null;
        const exName = weightInput ? (weightInput.getAttribute("data-name") || "") : "";

        let done = parseInt(currentExNode.dataset.done) || 0;
        done++;
        currentExNode.dataset.done = done;
        remainingSets[currentIdx] = Math.max(0, parseFloat(currentExNode.dataset.total) - done);
        currentExNode.querySelector(".set-counter").textContent = `${done}/${currentExNode.dataset.total}`;

        const todayStr = window.getPegasusLocalDateKey();
        let dailyProg = JSON.parse(localStorage.getItem('pegasus_daily_progress') || "{}");
        if (dailyProg.date !== todayStr) dailyProg = { date: todayStr, exercises: {} };
        dailyProg.exercises[exName] = done;
        localStorage.setItem('pegasus_daily_progress', JSON.stringify(dailyProg));

        if (window.logPegasusSet) window.logPegasusSet(exName);
    }

    if (window.PegasusCloud && typeof window.PegasusCloud.push === "function") window.PegasusCloud.push();

    let nextIdx = getNextIndexCircuit();
    if (nextIdx !== -1) {
        currentIdx = nextIdx;
        phase = 0;
        syncPegasusProgressRuntime();
        dispatchPegasusWorkoutAction("WORKOUT_NEXT_RUNTIME");
        if (running) runPhase();
        else showVideo(currentIdx);
    } else {
        finishWorkout();
    }
}

function getNextIndexCircuit() {
    for (let i = 1; i <= remainingSets.length; i++) {
        let idx = (currentIdx + i) % remainingSets.length;
        if (remainingSets[idx] > 0 && isPegasusExerciseAvailable(idx)) return idx;
    }
    return -1;
}

window.toggleSkipExercise = function(idx, auto = false) {
    const exDiv = exercises[idx];
    if (!exDiv) return;

    const originalSets = parseFloat(exDiv.dataset.total);
    const isSkipped = exDiv.classList.toggle("exercise-skipped");
    let done = parseInt(exDiv.dataset.done) || 0;

    if (isSkipped) {
        exDiv.style.setProperty('opacity', '0.2', 'important');
        exDiv.style.setProperty('filter', 'grayscale(100%)', 'important');
        remainingSets[idx] = 0;

        if (currentIdx === idx) {
            phaseRemainingSeconds = null;
        }

        if (!auto && currentIdx === idx && running) {
            clearInterval(timer);
            timer = null;

            let nextIdx = getNextIndexCircuit();
            if (nextIdx !== -1) {
                currentIdx = nextIdx;
                phase = 0;
                syncPegasusProgressRuntime();
                runPhase();
            } else {
                finishWorkout();
            }
        }
    } else {
        exDiv.style.setProperty('opacity', '1', 'important');
        exDiv.style.setProperty('filter', 'none', 'important');
        remainingSets[idx] = Math.max(0, originalSets - done);
    }

    calculateTotalTime(true);
    syncPegasusProgressRuntime();
    if (window.PegasusCloud && typeof window.PegasusCloud.push === "function") window.PegasusCloud.push();
};

window.getActiveLifter = function() {
    if (window.partnerData && window.partnerData.isActive && window.partnerData.currentPartner !== "") {
        return window.partnerData.currentPartner;
    }
    return "ΑΓΓΕΛΟΣ";
};

window.getSavedWeight = function(exerciseName) {
    const cleanName = exerciseName.trim();
    const lifter = window.getActiveLifter();
    let allWeights = JSON.parse(localStorage.getItem(M?.workout?.exerciseWeights || "pegasus_exercise_weights") || "{}");

    if (allWeights[lifter] && allWeights[lifter][cleanName] !== undefined) return allWeights[lifter][cleanName];

    if (lifter === "ΑΓΓΕΛΟΣ") {
        let old1 = localStorage.getItem(`weight_ΑΓΓΕΛΟΣ_${cleanName}`);
        let old2 = localStorage.getItem(`weight_${cleanName}`);
        if (old1) return old1;
        if (old2) return old2;
    }
    return "";
};

window.saveWeight = function(name, val) {
    const cleanName = name.trim();
    const lifter = window.getActiveLifter();
    let allWeights = JSON.parse(localStorage.getItem(M?.workout?.exerciseWeights || "pegasus_exercise_weights") || "{}");

    if (!allWeights[lifter]) allWeights[lifter] = {};
    allWeights[lifter][cleanName] = val;
    localStorage.setItem(M?.workout?.exerciseWeights || "pegasus_exercise_weights", JSON.stringify(allWeights));

    if (lifter === "ΑΓΓΕΛΟΣ") {
        localStorage.setItem(`weight_ΑΓΓΕΛΟΣ_${cleanName}`, val);
    }

    syncPegasusUserRuntime();

    if (window.MuscleProgressUI?.render) window.MuscleProgressUI.render();
    if (window.PegasusCloud?.push) window.PegasusCloud.push();
};

function showVideo(i) {
    const vid = document.getElementById("video");
    const label = document.getElementById("phaseTimer");
    if (!vid) return;

    const activeBtn = document.querySelector(".navbar button.active");
    const currentDay = activeBtn ? activeBtn.id.replace('nav-', '') : "";
    const isRecoveryDay = (currentDay === "Δευτέρα" || currentDay === "Πέμπτη");

    if (isRecoveryDay || typeof exercises === 'undefined' || !exercises[i]) {
        const recoverySrc = "videos/stretching.mp4";
        if (vid.getAttribute('src') !== recoverySrc) {
            vid.pause();
            vid.src = recoverySrc;
            vid.load();
            vid.play().catch(e => console.log("Waiting for user..."));
            if (label && isRecoveryDay) {
                label.textContent = "ΑΠΟΘΕΡΑΠΕΙΑ: STRETCHING";
                label.style.color = "#00bcd4";
            }
        }
        return;
    }

    const weightInput = exercises[i].querySelector(".weight-input");
    if (!weightInput) return;

    let name = weightInput.getAttribute("data-name") || "";
    let mappedVal = window.videoMap ? window.videoMap[name.trim()] : null;
    if (!mappedVal) mappedVal = name.replace(/\s+/g, '').toLowerCase();

    const newSrc = `videos/${mappedVal}.mp4`;
    if (vid.getAttribute('src') !== newSrc) {
        vid.pause();
        vid.src = newSrc;
        vid.load();
        vid.play().catch(() => {
            vid.src = "videos/warmup.mp4";
            vid.load();
            vid.play().catch(() => {});
        });
    }
}

window.showVideo = showVideo;

function calculateTotalTime(isUpdate = false) {
    const config = getPegasusTimerConfig();
    let newTotal = exercises.reduce((acc, ex) => {
        if (ex.classList.contains("exercise-skipped")) return acc;
        let sets = parseFloat(ex.dataset.total) || 0;
        return acc + (sets * (config.prep + config.work + config.rest));
    }, 0);

    if (isUpdate) {
        let diff = totalSeconds - newTotal;
        totalSeconds = newTotal;
        remainingSeconds = Math.max(0, remainingSeconds - diff);
    } else {
        totalSeconds = newTotal;
        remainingSeconds = newTotal;
    }

    const timeDisplay = document.getElementById("totalProgressTime");
    if (timeDisplay) {
        const m = Math.floor(remainingSeconds / 60);
        const s = remainingSeconds % 60;
        timeDisplay.textContent = `${m}:${String(s).padStart(2, '0')}`;
    }

    syncPegasusProgressRuntime();
    updateTotalBar();
}

function updateTotalBar() {
    const bar = document.getElementById("totalProgress");
    const timeText = document.getElementById("totalProgressTime");
    const uiState = (typeof window.getPegasusUiState === "function")
        ? window.getPegasusUiState()
        : null;
    const timerDisplay = uiState?.timerDisplay || ((typeof window.getPegasusTimerDisplayState === "function")
        ? window.getPegasusTimerDisplayState()
        : { totalSeconds, remainingSeconds, progressPercent: 0, remainingText: "0:00" });

    const safeTotalSeconds = (typeof timerDisplay?.totalSeconds === "number" && timerDisplay.totalSeconds > 0) ? timerDisplay.totalSeconds : totalSeconds;
    const safeRemainingSeconds = (typeof timerDisplay?.remainingSeconds === "number") ? timerDisplay.remainingSeconds : remainingSeconds;
    if (!bar || safeTotalSeconds <= 0) return;

    const progress = typeof timerDisplay?.progressPercent === "number"
        ? timerDisplay.progressPercent
        : (((safeTotalSeconds - safeRemainingSeconds) / safeTotalSeconds) * 100);

    bar.style.width = Math.max(0, Math.min(100, progress)) + "%";

    if (timeText) {
        timeText.textContent = timerDisplay?.remainingText || `${Math.floor(safeRemainingSeconds / 60)}:${String(Math.floor(safeRemainingSeconds % 60)).padStart(2, "0")}`;
    }
}

/* ===== 7.5 STRICT METABOLIC AUTO-ADJUSTER (MULTI-PLAN) ===== */
window._isCalculatingTarget = false;

window.calculatePegasusDailyTarget = function() {
    const storedEffective = window.getPegasusEffectiveDailyTarget
        ? window.getPegasusEffectiveDailyTarget()
        : parseFloat(localStorage.getItem(M?.diet?.todayKcal || 'pegasus_today_kcal')) || 2100;

    if (window._isCalculatingTarget) {
        return storedEffective;
    }

    window._isCalculatingTarget = true;

    const settings = typeof window.getPegasusSettings === "function"
        ? window.getPegasusSettings()
        : { activeSplit: 'IRON' };

    const dynamicProtein = window.calculatePegasusBioMetrics(settings);
    const baseTarget = window.getPegasusBaseDailyTarget(settings);
    const cardioOffset = window.getPegasusTodayCardioOffset();
    const effectiveTarget = Math.round(baseTarget + cardioOffset);

    localStorage.setItem(M?.diet?.todayKcal || 'pegasus_today_kcal', baseTarget);

    console.log(`🏛️ PEGASUS OS [${settings.activeSplit || 'IRON'}]: Στόχος Βάσης: ${baseTarget} kcal | Cardio: +${cardioOffset} | Τελικός Στόχος: ${effectiveTarget} kcal | Πρωτεΐνη: ${dynamicProtein}g`);

    window._isCalculatingTarget = false;
    return effectiveTarget;
};

/* ===== 7.6 AUTOMATED BIO-METRIC CALCULATOR ===== */
window.calculatePegasusBioMetrics = function(settingsObj) {
    const currentSettings = settingsObj || (typeof window.getPegasusSettings === "function" ? window.getPegasusSettings() : null);

    const weight = currentSettings ? currentSettings.weight : 74;
    const multiplier = 2.17;
    const autoProtein = Math.round(weight * multiplier);

    localStorage.setItem(M?.diet?.todayProtein || 'pegasus_today_protein', autoProtein);

    return autoProtein;
};

/* ===== 8. FINISH & REPORTING ===== */
function finishWorkout() {
    if (!running && !timer && phase === 0) return;

    clearInterval(timer);
    timer = null;
    running = false;
    phaseRemainingSeconds = null;
    remainingSeconds = 0;
    updateTotalBar();
    syncPegasusProgressRuntime();
    dispatchPegasusWorkoutAction("WORKOUT_FINISH_RUNTIME", { workout: { running: false }, timers: { remainingSeconds: 0, phaseRemainingSeconds: null } });

    const label = document.getElementById("phaseTimer");
    if (label) {
        label.textContent = "ΟΛΟΚΛΗΡΩΣΗ & ΤΟΠΙΚΗ ΑΠΟΘΗΚΕΥΣΗ...";
        label.style.color = "#4CAF50";
    }

    const workoutKey = window.getPegasusLocalDateKey();

    let doneKey = P_M?.workout?.done || "pegasus_workouts_done";
    let data = JSON.parse(localStorage.getItem(doneKey) || "{}");
    data[workoutKey] = true;
    localStorage.setItem(doneKey, JSON.stringify(data));

    if (window.updateTotalWorkoutCount) window.updateTotalWorkoutCount();
    if (window.PegasusCloud?.push) window.PegasusCloud.push();
    if (typeof openExercisePreview === 'function') openExercisePreview();

    setTimeout(() => {
        if (window.PegasusReporting?.prepareAndSaveReport) {
            let sessionKcal = sessionActiveKcal;
            let currentWeekly = parseFloat(localStorage.getItem("pegasus_weekly_kcal")) || 0;
            localStorage.setItem("pegasus_weekly_kcal", (currentWeekly + sessionKcal).toFixed(1));

            window.PegasusReporting.prepareAndSaveReport(sessionKcal.toFixed(1));
            sessionActiveKcal = 0;
            localStorage.setItem("pegasus_session_kcal", "0.0");
            syncPegasusProgressRuntime();
        }

        const list = document.getElementById("exList");
        if (list) {
            list.innerHTML = `<div style="padding:20px; color:#4CAF50; text-align:center; font-weight:bold; font-size:16px;">✅ Η ΠΡΟΠΟΝΗΣΗ ΟΛΟΚΛΗΡΩΘΗΚΕ ΕΠΙΤΥΧΩΣ</div>`;
        }

        const vid = document.getElementById("video");
        if (vid) {
            vid.pause();
            vid.src = "videos/stretching.mp4";
            vid.load();
            vid.play().catch(() => console.log("Auto-play prevented"));
        }

        renderPegasusControlState();
        if (label) {
            label.textContent = "ΑΠΟΘΕΡΑΠΕΙΑ: STRETCHING";
            label.style.color = "#00bcd4";
        }

        if (window.MuscleProgressUI?.render) window.MuscleProgressUI.render(true);
        if (typeof window.updateFoodUI === "function") window.updateFoodUI();
        if (typeof window.updateKcalUI === "function") window.updateKcalUI();

        console.log("🎯 PEGASUS OS: Session Successfully Terminated.");
    }, 3000);
}

function openExercisePreview() {
    const activeBtn = document.querySelector(".navbar button.active");
    if (!activeBtn) { if (window.pegasusAlert) window.pegasusAlert("Παρακαλώ επίλεξε πρώτα μια ημέρα!"); else alert("Παρακαλώ επίλεξε πρώτα μια ημέρα!"); return; }

    const currentDay = activeBtn.id.replace('nav-', '');
    const isRainy = (typeof window.isRaining === 'function') ? window.isRaining() : false;

    let rawData = (typeof window.calculateDailyProgram !== 'undefined')
        ? window.calculateDailyProgram(currentDay, isRainy)
        : ((window.program && window.program[currentDay]) ? [...window.program[currentDay]] : []);

    if (currentDay === "Παρασκευή" && !isRainy && window.program && window.program["Κυριακή"]) {
        const bonus = window.program["Κυριακή"]
            .filter(ex => !ex.name.includes("Ποδηλασία") && !ex.name.includes("Cycling"))
            .map(ex => ({ ...ex, isSpillover: false }));
        rawData = [...rawData, ...bonus];
    }

    const dayExercises = window.PegasusOptimizer
        ? window.PegasusOptimizer.apply(currentDay, rawData)
        : rawData.map(e => ({ ...e, adjustedSets: e.sets }));

    const panel = document.getElementById('previewPanel');
    const content = document.getElementById('previewContent');
    const muscleContainer = document.getElementById('muscleProgressContainer');

    if (!panel || !content) return;

    panel.style.display = 'block';
    content.innerHTML = '';
    if (muscleContainer) muscleContainer.innerHTML = '';

    dayExercises.filter(ex => (ex.adjustedSets || ex.sets) > 0).forEach((ex) => {
        const cleanName = ex.name.trim();
        let imgBase = window.videoMap ? window.videoMap[cleanName] : null;
        if (!imgBase) imgBase = cleanName.replace(/\s+/g, '').toLowerCase();

        const imgPath = (imgBase === "cycling") ? `images/${imgBase}.jpg` : `images/${imgBase}.png`;
        content.innerHTML += `
            <div class="preview-item">
                <img src="${imgPath}" onerror="this.onerror=null; this.src='images/placeholder.jpg';" alt="${cleanName}">
                <p>${cleanName} (${ex.adjustedSets || ex.sets} set)</p>
            </div>
        `;
    });

    if (typeof window.forcePegasusRender === "function") {
        setTimeout(() => window.forcePegasusRender(), 50);
    }
}

window.openExercisePreview = openExercisePreview;

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
window.onload = () => {
    const greekDays = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
    const todayObj = new Date();
    const todayName = greekDays[todayObj.getDay()];

    if (todayName === "Δευτέρα") {
        try {
            const lastReset = localStorage.getItem('pegasus_last_reset');
            const todayDateStr = window.getPegasusLocalDateKey();
            if (lastReset !== todayDateStr) {
                const freshHistory = { "Στήθος": 0, "Πλάτη": 0, "Ώμοι": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 };
                localStorage.setItem('pegasus_weekly_history', JSON.stringify(freshHistory));
                localStorage.setItem('pegasus_weekly_kcal', "0.0");
                localStorage.setItem('pegasus_last_reset', todayDateStr);
                if (window.PegasusCloud?.push) window.PegasusCloud.push();
            }
        } catch (e) {
            console.error("🛡️ PEGASUS RESET ERROR:", e);
        }
    }

    setTimeout(() => {
        if (window.PegasusCloud?.getMasterWeight && window.PegasusWeight) {
            window.PegasusWeight.alignWithCloud(window.PegasusCloud.getMasterWeight());
        }
    }, 2000);

    if (typeof emailjs !== 'undefined') emailjs.init('qsfyDrneUHP7zEFui');

    const importInput = document.getElementById('importFileTools');
    if (importInput) importInput.onchange = (e) => window.importPegasusData(e);

    bindPegasusEngineUiBridge();
    syncEngineFromLegacy("BOOT_FROM_LEGACY", { selectedDay: todayName });

    createNavbar();
    if (window.updateTotalWorkoutCount) window.updateTotalWorkoutCount();
    if (window.updateKoukiBalance) window.updateKoukiBalance();

    if (typeof window.calculatePegasusDailyTarget === "function") {
        window.calculatePegasusDailyTarget();
    } else if (typeof window.updateKcalUI === "function") {
        window.updateKcalUI();
    }

    window.masterUI = {
        "btnStart": startPause,
        "btnNext": skipToNextExercise,
        "btnWarmup": () => {
            const vid = document.getElementById("video");
            if (!vid) return;
            if (!vid.src.includes("warmup.mp4")) {
                vid.pause();
                vid.src = "videos/warmup.mp4";
                vid.load();
                vid.play().catch(e => console.log(e));
            } else {
                vid.pause();
                if (typeof window.showVideo === "function" && window.exercises && window.exercises.length > 0) {
                    window.currentIdx = 0;
                    window.phase = 0;
                    patchPegasusWorkoutRuntime({ currentIdx: 0, phase: 0, running: running, sessionKcal: sessionActiveKcal });
                    window.showVideo(0);
                }
            }
        },
        "btnTurboTools": () => {
            window.TURBO_MODE = !window.TURBO_MODE;
            window.SPEED = window.TURBO_MODE ? 10 : 1;
            TURBO_MODE = window.TURBO_MODE;
            SPEED = window.SPEED;
            patchPegasusTimerRuntime({ turboMode: TURBO_MODE, speed: SPEED });

            const btn = document.getElementById('btnTurboTools');
            if (btn) {
                btn.textContent = window.TURBO_MODE ? "🚀 TURBO: ΕΝΕΡΓΟ" : "🚀 TURBO: ΑΝΕΝΕΡΓΟ";
                btn.style.color = window.TURBO_MODE ? "#ff4444" : "#4CAF50";
            }
        },
        "btnMuteTools": () => {
            window.muted = !window.muted;
            muted = window.muted;
            patchPegasusUserRuntime({ muted: muted, weight: userWeight });

            const btn = document.getElementById('btnMuteTools');
            if (btn) {
                btn.textContent = window.muted ? "🔇 ΗΧΟΣ: ΣΙΓΑΣΗ" : "🔊 ΗΧΟΣ: ΕΝΕΡΓΟΣ";
                btn.style.color = window.muted ? "#888" : "#4CAF50";
            }
        },
        "btnPartnerMode": () => {
            if (typeof window.togglePartnerMode === 'function') window.togglePartnerMode();
        },
        "btnImportData": () => {
            const f = document.getElementById('importFileTools');
            if (f) f.click();
        },
        "btnExportData": () => {
            if (window.exportPegasusData) window.exportPegasusData();
        },
        "btnMasterVault": () => {
            if (typeof window.handleDesktopSyncOpen === 'function') {
                window.handleDesktopSyncOpen();
                return;
            }
            const m = document.getElementById('pinModal');
            if (m) m.style.display = 'flex';
        },
        "btnPlanSelector": { panel: "planModal", init: null },
        "btnCalendarUI": { panel: "calendarPanel", init: window.renderCalendar },
        "btnAchUI": { panel: "achievementsPanel", init: window.renderAchievements },
        "btnSettingsUI": { panel: "settingsPanel", init: window.initSettingsUI },
        "btnFoodUI": { panel: "foodPanel", init: window.updateFoodUI },
        "btnProposalsUI": () => {
            if (window.PegasusDietAdvisor?.renderAdvisorUI) window.renderAdvisorUI();
            else { if (window.pegasusAlert) window.pegasusAlert("Σφάλμα: Το dietAdvisor.js δεν έχει φορτωθεί σωστά."); else alert("Σφάλμα: Το dietAdvisor.js δεν έχει φορτωθεί σωστά."); }
        },
        "btnToolsUI": { panel: "toolsPanel", init: null },
        "btnPreviewUI": { panel: "previewPanel", init: window.renderPreview || openExercisePreview },
        "btnOpenGallery": { panel: "galleryPanel", init: () => { if (window.GalleryEngine) window.GalleryEngine.render(); } },
        "btnCardio": { panel: "cardioPanel", init: () => { if (window.PegasusCardio) window.PegasusCardio.open(); } },
        "btnEMS": { panel: "emsModal", init: window.logEMSData },
        "btnManualEmail": () => {
            if (window.PegasusReporting?.checkAndSendMorningReport) window.PegasusReporting.checkAndSendMorningReport(true);
            else { if (window.pegasusAlert) window.pegasusAlert("Reporting Engine Offline"); else alert("Reporting Engine Offline"); }
        },
        "btnSaveSettings": () => {
            if (typeof window.savePegasusSettingsGlobal === "function") {
                window.savePegasusSettingsGlobal();
            } else {
                const weightVal = document.getElementById("userWeightInput")?.value || 74;
                if (window.PegasusWeight?.save) window.PegasusWeight.save(weightVal);
                else localStorage.setItem(P_M?.user?.weight || "pegasus_weight", weightVal);
                if (window.PegasusCloud?.push) window.PegasusCloud.push(true);
                setTimeout(() => { location.reload(); }, 300);
            }
        }
    };

    Object.keys(window.masterUI).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.onclick = (e) => {
                e.stopPropagation();
                const target = window.masterUI[btnId];

                if (!btnId.includes("Save") && !btnId.includes("Start") && btnId !== "btnProposalsUI") {
                    document.querySelectorAll('.pegasus-panel, #emsModal').forEach(p => p.style.display = "none");
                }

                if (typeof target === 'function') {
                    target();
                } else if (target && target.panel) {
                    const el = document.getElementById(target.panel);
                    if (el) {
                        el.style.display = "block";
                        if (target.init) target.init();
                    }
                }
            };
        }
    });

    setTimeout(() => {
        document.querySelectorAll(".navbar button").forEach(b => {
            if (b.id.replace('nav-', '') === todayName) {
                if (typeof selectDay === "function") {
                    selectDay(b, todayName);
                    setTimeout(() => {
                        if (typeof exercises !== 'undefined') {
                            currentIdx = remainingSets.findIndex((sets, idx) => sets > 0 && !exercises[idx]?.classList.contains("exercise-skipped"));
                            if (currentIdx === -1) currentIdx = 0;
                            syncPegasusSelectedDay(todayName);
                            console.log("🚀 PEGASUS: Circuit Auto-Initialized for Today.");
                        }
                    }, 150);
                }
            }
        });
    }, 400);

    if (window.PegasusUI?.init) window.PegasusUI.init();

    setTimeout(() => {
        const loader = document.getElementById('pegasus-loader');
        if (loader) {
            loader.style.opacity = '0';
            loader.style.visibility = 'hidden';
        }

        syncPegasusSelectedDay(todayName);

        if (typeof window.updateKcalUI === "function") {
            window.updateKcalUI();
        }

        syncPegasusProgressRuntime();
        syncPegasusUserRuntime();
        renderPegasusControlState();

        console.log("🛡️ PEGASUS OS: Initializing Complete. Welcome back, Angelos.");
    }, 1000);
};


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
