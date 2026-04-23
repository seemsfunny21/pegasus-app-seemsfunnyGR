/* ==========================================================================
   PEGASUS AUDIO RUNTIME
   Shared beep/audio unlock runtime extracted from app.js.
   ========================================================================== */

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

/* ==========================================================================
   PEGASUS RUNTIME BRIDGE
   Core engine bridge, runtime snapshots, sync patches, and runtime UI state.
   ========================================================================== */

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

window.renderPegasusControlState = renderPegasusControlState;

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

window.syncPegasusProgressRuntime = syncPegasusProgressRuntime;
window.syncPegasusSelectedDay = syncPegasusSelectedDay;
window.dispatchPegasusWorkoutAction = dispatchPegasusWorkoutAction;

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

window.bindPegasusEngineUiBridge = bindPegasusEngineUiBridge;

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


window.syncEngineFromLegacy = syncEngineFromLegacy;

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

window.patchPegasusWorkoutRuntime = patchPegasusWorkoutRuntime;
window.patchPegasusTimerRuntime = patchPegasusTimerRuntime;
window.patchPegasusUserRuntime = patchPegasusUserRuntime;
window.patchPegasusSessionRuntime = patchPegasusSessionRuntime;
window.syncPegasusWorkoutRuntime = syncPegasusWorkoutRuntime;
window.syncPegasusTimerRuntime = syncPegasusTimerRuntime;
window.syncPegasusUserRuntime = syncPegasusUserRuntime;

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
