/* ==========================================================================
   PEGASUS DESKTOP ACTIONS MODULE - v44 REFACTOR
   Extracted from app.js to preserve exact workout action behavior.
   ========================================================================== */

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
    if (typeof window.renderPegasusControlState === "function") window.renderPegasusControlState();

    syncPegasusProgressRuntime();
    if (typeof window.dispatchPegasusWorkoutAction === "function") window.dispatchPegasusWorkoutAction(running ? "WORKOUT_START_RUNTIME" : "WORKOUT_PAUSE_RUNTIME");
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
            if (typeof window.updateTotalBar === "function") window.updateTotalBar();

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
        if (typeof window.dispatchPegasusWorkoutAction === "function") window.dispatchPegasusWorkoutAction("WORKOUT_NEXT_RUNTIME");
        runPhase();
        return;
    }

    const phaseDefaultTime = getPhaseDefaultTime(phase);
    let t = getPhaseStartingSeconds(phase, phaseRemainingSeconds);
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

    if (phase !== 2 && typeof window.showVideo === "function") window.showVideo(currentIdx);

    timer = setInterval(() => {
        t -= 1;
        phaseRemainingSeconds = Math.max(0, t);

        if (remainingSeconds > 0) {
            remainingSeconds -= 1;
            if (typeof window.updateTotalBar === "function") window.updateTotalBar();
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
            if (typeof window.playBeep === 'function') window.playBeep();

            if (phase === 0) {
                phase = 1;
                phaseRemainingSeconds = getPhaseDefaultTime(1);
                syncPegasusProgressRuntime();
                if (typeof window.dispatchPegasusWorkoutAction === "function") window.dispatchPegasusWorkoutAction("WORKOUT_START_RUNTIME");
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
                if (window.logPegasusSet) window.logPegasusSet(exName, done);
                if (window.PegasusCloud && typeof window.PegasusCloud.push === "function") window.PegasusCloud.push();

                phase = 2;
                phaseRemainingSeconds = getPhaseDefaultTime(2);
                syncPegasusProgressRuntime();
                if (typeof window.dispatchPegasusWorkoutAction === "function") window.dispatchPegasusWorkoutAction("WORKOUT_SET_COMPLETED_RUNTIME", {
                    workout: { phase: 2 },
                    timers: { phaseRemainingSeconds: phaseRemainingSeconds }
                });
                runPhase();
            } else {
                let next = getNextIndexCircuit();
                if (next !== -1) {
                    currentIdx = next;
                    phase = 0;
                    phaseRemainingSeconds = getPhaseDefaultTime(0);
                    syncPegasusProgressRuntime();
                    if (typeof window.dispatchPegasusWorkoutAction === "function") window.dispatchPegasusWorkoutAction("WORKOUT_NEXT_RUNTIME", {
                        workout: { phase: 0, currentIdx: currentIdx },
                        timers: { phaseRemainingSeconds: phaseRemainingSeconds }
                    });
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

        if (window.logPegasusSet) window.logPegasusSet(exName, done);
    }

    if (window.PegasusCloud && typeof window.PegasusCloud.push === "function") window.PegasusCloud.push();

    let nextIdx = getNextIndexCircuit();
    if (nextIdx !== -1) {
        currentIdx = nextIdx;
        phase = 0;
        syncPegasusProgressRuntime();
        if (typeof window.dispatchPegasusWorkoutAction === "function") window.dispatchPegasusWorkoutAction("WORKOUT_NEXT_RUNTIME");
        if (running) runPhase();
        else if (typeof window.showVideo === "function") window.showVideo(currentIdx);
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

    if (typeof window.calculateTotalTime === "function") window.calculateTotalTime(true);
    syncPegasusProgressRuntime();
    if (window.PegasusCloud && typeof window.PegasusCloud.push === "function") window.PegasusCloud.push();
};

function finishWorkout() {
    if (!running && !timer && phase === 0) return;

    clearInterval(timer);
    timer = null;
    running = false;
    phaseRemainingSeconds = null;
    remainingSeconds = 0;
    if (typeof window.updateTotalBar === "function") window.updateTotalBar();
    syncPegasusProgressRuntime();
    if (typeof window.dispatchPegasusWorkoutAction === "function") window.dispatchPegasusWorkoutAction("WORKOUT_FINISH_RUNTIME", { workout: { running: false }, timers: { remainingSeconds: 0, phaseRemainingSeconds: null } });

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
    if (typeof window.openExercisePreview === 'function') window.openExercisePreview();

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

        if (typeof window.renderPegasusControlState === "function") window.renderPegasusControlState();
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

window.startPause = startPause;
window.skipToNextExercise = skipToNextExercise;
window.finishWorkout = finishWorkout;


/* ===== CONSOLIDATED FROM desktopWorkoutResumePatch.js ===== */
/* ==========================================================================
   PEGASUS DESKTOP WORKOUT RESUME PATCH - v19.2
   Targeted fix: stalled 0-set transitions + remaining-time resume after refresh.
   ========================================================================== */

(function() {
    function getConfig() {
        return (typeof window.getPegasusTimerConfig === "function")
            ? window.getPegasusTimerConfig()
            : { prep: 10, work: 45, rest: 60 };
    }

    function getPhaseTime(targetPhase) {
        return (typeof window.getPhaseDefaultTime === "function")
            ? window.getPhaseDefaultTime(targetPhase)
            : ((targetPhase === 0) ? getConfig().prep : (targetPhase === 1 ? getConfig().work : getConfig().rest));
    }

    function isAvailableIdx(idx) {
        return Number.isInteger(idx) && idx >= 0 && idx < exercises.length && isPegasusExerciseAvailable(idx);
    }

    function getFirstRemainingIdx(startIdx = 0) {
        if (!Array.isArray(remainingSets) || remainingSets.length === 0) return -1;
        const len = remainingSets.length;
        for (let i = 0; i < len; i++) {
            const idx = (startIdx + i) % len;
            if ((Number(remainingSets[idx]) || 0) > 0 && isAvailableIdx(idx)) return idx;
        }
        return -1;
    }

    function getSafeCurrentIdx() {
        if ((Number(remainingSets[currentIdx]) || 0) > 0 && isAvailableIdx(currentIdx)) return currentIdx;
        const next = getFirstRemainingIdx(0);
        return next !== -1 ? next : 0;
    }

    function getRemainingSetCount() {
        return (Array.isArray(remainingSets) ? remainingSets : []).reduce((sum, value, idx) => {
            if (!isAvailableIdx(idx)) return sum;
            return sum + Math.max(0, Number(value) || 0);
        }, 0);
    }

    function computeRemainingWorkoutSeconds(opts = {}) {
        const config = getConfig();
        const cycle = config.prep + config.work + config.rest;
        const setCount = getRemainingSetCount();
        if (setCount <= 0) return 0;

        const safeIdx = (typeof opts.currentIdx === 'number') ? opts.currentIdx : getSafeCurrentIdx();
        const safePhase = Number.isInteger(opts.phase) ? opts.phase : (Number.isInteger(phase) ? phase : 0);
        const phaseRemaining = Number.isFinite(opts.phaseRemainingSeconds)
            ? Math.max(0, Math.ceil(Number(opts.phaseRemainingSeconds)))
            : null;

        if (safePhase === 1) {
            return Math.max(0, (phaseRemaining ?? config.work) + config.rest + Math.max(0, setCount - 1) * cycle);
        }

        if (safePhase === 2) {
            return Math.max(0, (phaseRemaining ?? config.rest) + (setCount * cycle));
        }

        return Math.max(0, (phaseRemaining ?? config.prep) + config.work + config.rest + Math.max(0, setCount - 1) * cycle);
    }

    function computeFullWorkoutSeconds() {
        const config = getConfig();
        const cycle = config.prep + config.work + config.rest;
        return (Array.isArray(exercises) ? exercises : []).reduce((acc, ex) => {
            if (!ex || ex.classList?.contains('exercise-skipped')) return acc;
            return acc + ((parseFloat(ex.dataset.total) || 0) * cycle);
        }, 0);
    }

    function syncAndRenderTimer() {
        totalSeconds = computeFullWorkoutSeconds();
        remainingSeconds = Math.min(totalSeconds, computeRemainingWorkoutSeconds({
            currentIdx: getSafeCurrentIdx(),
            phase,
            phaseRemainingSeconds
        }));

        const timeDisplay = document.getElementById('totalProgressTime');
        if (timeDisplay) {
            const m = Math.floor(remainingSeconds / 60);
            const s = remainingSeconds % 60;
            timeDisplay.textContent = `${m}:${String(s).padStart(2, '0')}`;
        }

        if (typeof window.syncPegasusProgressRuntime === 'function') window.syncPegasusProgressRuntime();
        if (typeof window.updateTotalBar === 'function') window.updateTotalBar();
        if (typeof window.renderPegasusControlState === 'function') window.renderPegasusControlState();
    }

    function normalizeRuntimeStateForResume() {
        const nextIdx = getSafeCurrentIdx();
        currentIdx = nextIdx;
        if ((Number(remainingSets[currentIdx]) || 0) <= 0) {
            const alt = getFirstRemainingIdx(0);
            if (alt !== -1) currentIdx = alt;
        }

        if (!Number.isInteger(phase) || phase < 0 || phase > 2) phase = 0;
        if (phase === 2 && (Number(remainingSets[currentIdx]) || 0) <= 0) {
            phase = 0;
            phaseRemainingSeconds = getPhaseTime(0);
        }
        if (phase !== 2 && (Number(remainingSets[currentIdx]) || 0) <= 0) {
            currentIdx = getSafeCurrentIdx();
            phase = 0;
            phaseRemainingSeconds = getPhaseTime(0);
        }
        if (!Number.isFinite(phaseRemainingSeconds)) {
            phaseRemainingSeconds = getPhaseTime(phase);
        }
        running = false;
        window.currentIdx = currentIdx;
        window.phase = phase;
        window.phaseRemainingSeconds = phaseRemainingSeconds;
        window.running = running;
    }

    function restorePersistedDesktopProgress() {
        try {
            const persisted = window.PegasusEngine?.getPersistedRuntime?.();
            const todayKey = (typeof window.getPegasusLocalDateKey === 'function') ? window.getPegasusLocalDateKey() : null;
            if (!persisted || !persisted.selectedDay || !persisted.todayKey || persisted.todayKey !== todayKey) return false;
            if (!Array.isArray(persisted.remainingSets) || !persisted.remainingSets.some(v => Number(v || 0) > 0)) return false;

            const btn = document.getElementById(`nav-${persisted.selectedDay}`);
            if (!btn || typeof window.selectDay !== 'function') return false;

            window.selectDay(btn, persisted.selectedDay);

            if (Array.isArray(persisted.remainingSets) && persisted.remainingSets.length === remainingSets.length) {
                remainingSets = persisted.remainingSets.slice();
                window.remainingSets = remainingSets;
            }

            currentIdx = Number.isInteger(persisted.currentIdx) ? persisted.currentIdx : getSafeCurrentIdx();
            if ((Number(remainingSets[currentIdx]) || 0) <= 0) currentIdx = getSafeCurrentIdx();
            phase = 0;
            phaseRemainingSeconds = getPhaseTime(0);
            running = false;
            sessionActiveKcal = Number(persisted.sessionKcal || 0);
            window.currentIdx = currentIdx;
            window.phase = phase;
            window.phaseRemainingSeconds = phaseRemainingSeconds;
            window.running = running;
            window.sessionActiveKcal = sessionActiveKcal;

            syncAndRenderTimer();
            if (typeof window.showVideo === 'function') window.showVideo(currentIdx);
            return true;
        } catch (e) {
            console.warn('⚠️ PEGASUS DESKTOP RESUME PATCH: restore failed', e);
            return false;
        }
    }

    const originalCalculateTotalTime = window.calculateTotalTime;
    window.calculateTotalTime = function patchedCalculateTotalTime(isUpdate = false) {
        if (!Array.isArray(exercises) || exercises.length === 0) {
            if (typeof originalCalculateTotalTime === 'function') return originalCalculateTotalTime(isUpdate);
            return;
        }
        syncAndRenderTimer();
    };

    function getNextIndexPatched() {
        if (!Array.isArray(remainingSets) || remainingSets.length === 0) return -1;
        const len = remainingSets.length;
        for (let i = 1; i <= len; i++) {
            const idx = (currentIdx + i) % len;
            if ((Number(remainingSets[idx]) || 0) > 0 && isAvailableIdx(idx)) return idx;
        }
        return -1;
    }

    function runPhasePatched() {
        if (!running) return;

        if (timer) {
            clearInterval(timer);
            timer = null;
        }

        if (getRemainingSetCount() <= 0) {
            finishWorkout();
            return;
        }

        if (phase !== 2 && ((Number(remainingSets[currentIdx]) || 0) <= 0 || !isAvailableIdx(currentIdx))) {
            const nextIdx = getFirstRemainingIdx(currentIdx + 1);
            if (nextIdx !== -1) {
                currentIdx = nextIdx;
                phase = 0;
                phaseRemainingSeconds = getPhaseTime(0);
                window.currentIdx = currentIdx;
                window.phase = phase;
                window.phaseRemainingSeconds = phaseRemainingSeconds;
                if (typeof window.syncPegasusProgressRuntime === 'function') window.syncPegasusProgressRuntime();
                if (typeof window.showVideo === 'function') window.showVideo(currentIdx);
            } else {
                finishWorkout();
                return;
            }
        }

        const e = exercises[currentIdx];
        if (!e) return;
        const weightInput = e.querySelector('.weight-input');
        if (!weightInput) return;

        const exName = weightInput.getAttribute('data-name') || '';
        let liftedWeight = parseFloat(weightInput.value) || 0;

        let baseMET = 3.5;
        let intensityMultiplier = 1.0;
        if (exName.toLowerCase().includes('cycling') || exName.toLowerCase().includes('ποδηλασία')) {
            baseMET = 8.0;
        } else if (liftedWeight > 0) {
            intensityMultiplier = 1 + (liftedWeight / 100);
        }

        const kcalPerSecond = ((baseMET * intensityMultiplier * userWeight * 3.5) / 200) / 60;

        exercises.forEach(ex => {
            ex.style.borderColor = '#222';
            ex.style.background = 'transparent';
        });
        e.style.borderColor = '#4CAF50';
        e.style.background = 'rgba(76, 175, 80, 0.1)';

        const config = getConfig();
        if (phase === 2 && (!Number.isFinite(config.rest) || config.rest <= 0)) {
            phase = 0;
            if (typeof window.syncPegasusProgressRuntime === 'function') window.syncPegasusProgressRuntime();
            if (typeof window.dispatchPegasusWorkoutAction === 'function') window.dispatchPegasusWorkoutAction('WORKOUT_NEXT_RUNTIME');
            runPhasePatched();
            return;
        }

        const phaseDefaultTime = getPhaseTime(phase);
        let t = (typeof window.getPhaseStartingSeconds === 'function')
            ? window.getPhaseStartingSeconds(phase, phaseRemainingSeconds)
            : (Number.isFinite(phaseRemainingSeconds) ? phaseRemainingSeconds : phaseDefaultTime);
        phaseRemainingSeconds = t;

        const pName = (phase === 0) ? 'ΠΡΟΕΤΟΙΜΑΣΙΑ' : (phase === 1 ? 'ΑΣΚΗΣΗ' : 'ΔΙΑΛΕΙΜΜΑ');
        const cssClass = (phase === 0) ? 'timer-prep' : (phase === 1 ? 'timer-work' : 'timer-rest');
        const label = document.getElementById('phaseTimer');
        const barFill = document.getElementById('phaseTimerFill');

        if (label) {
            label.textContent = `${pName} (${Math.max(0, Math.ceil(t))})`;
            label.className = 'phase-label ' + cssClass;
        }

        if (typeof window.syncPegasusProgressRuntime === 'function') window.syncPegasusProgressRuntime();
        if (phase !== 2 && typeof window.showVideo === 'function') window.showVideo(currentIdx);

        timer = setInterval(() => {
            t -= 1;
            phaseRemainingSeconds = Math.max(0, t);

            if (remainingSeconds > 0) {
                remainingSeconds = Math.max(0, remainingSeconds - 1);
                if (typeof window.updateTotalBar === 'function') window.updateTotalBar();
            }

            if (phase === 1) {
                sessionActiveKcal += kcalPerSecond * SPEED;
            } else if (phase === 2) {
                const restKcalPerSec = ((2.0 * userWeight * 3.5) / 200) / 60;
                sessionActiveKcal += restKcalPerSec * SPEED;
            }

            if (label) label.textContent = `${pName} (${Math.max(0, Math.ceil(t))})`;
            if (barFill) {
                const totalPhaseTime = phaseDefaultTime || 1;
                barFill.style.width = (((totalPhaseTime - Math.max(0, t)) / totalPhaseTime) * 100) + '%';
            }

            if (typeof window.syncPegasusProgressRuntime === 'function') window.syncPegasusProgressRuntime();
            if (typeof window.updateKcalUI === 'function') window.updateKcalUI();

            if (t <= 0) {
                clearInterval(timer);
                timer = null;
                phaseRemainingSeconds = null;
                if (typeof window.playBeep === 'function') window.playBeep();

                if (phase === 0) {
                    phase = 1;
                    phaseRemainingSeconds = getPhaseTime(1);
                    if (typeof window.syncPegasusProgressRuntime === 'function') window.syncPegasusProgressRuntime();
                    if (typeof window.dispatchPegasusWorkoutAction === 'function') window.dispatchPegasusWorkoutAction('WORKOUT_START_RUNTIME');
                    runPhasePatched();
                    return;
                }

                if (phase === 1) {
                    try {
                        let done = parseInt(e.dataset.done) || 0;
                        done += 1;
                        e.dataset.done = done;
                        remainingSets[currentIdx] = Math.max(0, parseFloat(e.dataset.total) - done);
                        e.querySelector('.set-counter').textContent = `${done}/${e.dataset.total}`;

                        const todayStr = window.getPegasusLocalDateKey();
                        let dailyProg = JSON.parse(localStorage.getItem('pegasus_daily_progress') || '{}');
                        if (dailyProg.date !== todayStr) dailyProg = { date: todayStr, exercises: {} };
                        dailyProg.exercises[exName] = done;
                        localStorage.setItem('pegasus_daily_progress', JSON.stringify(dailyProg));

                        if (window.updateAchievements) window.updateAchievements(exName);
                        if (window.logPegasusSet) window.logPegasusSet(exName, done);
                    } catch (err) {
                        console.warn('⚠️ PEGASUS DESKTOP RESUME PATCH: completion guard', err);
                    }

                    phase = 2;
                    phaseRemainingSeconds = getPhaseTime(2);
                    syncAndRenderTimer();
                    if (window.PegasusCloud && typeof window.PegasusCloud.push === 'function') window.PegasusCloud.push();
                    if (typeof window.dispatchPegasusWorkoutAction === 'function') {
                        window.dispatchPegasusWorkoutAction('WORKOUT_SET_COMPLETED_RUNTIME', {
                            workout: { phase: 2 },
                            timers: { phaseRemainingSeconds: phaseRemainingSeconds }
                        });
                    }
                    runPhasePatched();
                    return;
                }

                const next = getNextIndexPatched();
                if (next !== -1) {
                    currentIdx = next;
                    phase = 0;
                    phaseRemainingSeconds = getPhaseTime(0);
                    syncAndRenderTimer();
                    if (typeof window.dispatchPegasusWorkoutAction === 'function') {
                        window.dispatchPegasusWorkoutAction('WORKOUT_NEXT_RUNTIME', {
                            workout: { phase: 0, currentIdx },
                            timers: { phaseRemainingSeconds }
                        });
                    }
                    runPhasePatched();
                } else {
                    finishWorkout();
                }
            }
        }, 1000 / SPEED);
    }

    function startPausePatched() {
        if (!Array.isArray(exercises) || exercises.length === 0) return;

        const vid = document.getElementById('video');
        const config = getConfig();
        const isFreshStart = (currentIdx === 0 && phase === 0 && totalSeconds === remainingSeconds);

        if (!running) {
            const firstAvailable = getFirstRemainingIdx(0);
            if (isFreshStart) {
                if (firstAvailable !== -1) currentIdx = firstAvailable;
            } else if (exercises[currentIdx] && exercises[currentIdx].classList.contains('exercise-skipped')) {
                if (firstAvailable !== -1) currentIdx = firstAvailable;
            } else if ((Number(remainingSets[currentIdx]) || 0) <= 0) {
                if (firstAvailable !== -1) currentIdx = firstAvailable;
            }
        }

        if (!running && isFreshStart) {
            sessionActiveKcal = 0;
            localStorage.setItem('pegasus_session_kcal', '0.0');
        }

        if (vid && vid.src.includes('warmup')) {
            vid.loop = false;
            vid.pause();
        }

        running = !running;
        if (typeof window.renderPegasusControlState === 'function') window.renderPegasusControlState();
        if (typeof window.syncPegasusProgressRuntime === 'function') window.syncPegasusProgressRuntime();
        if (typeof window.dispatchPegasusWorkoutAction === 'function') {
            window.dispatchPegasusWorkoutAction(running ? 'WORKOUT_START_RUNTIME' : 'WORKOUT_PAUSE_RUNTIME');
        }
        if (typeof window.updateKcalUI === 'function') window.updateKcalUI();

        if (running) {
            if (!isFreshStart) {
                const pausedPhase = phase;
                const pausedRemaining = (phaseRemainingSeconds !== null) ? phaseRemainingSeconds : getPhaseTime(pausedPhase);

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

                    const nextIdx = getNextIndexPatched();
                    if (nextIdx !== -1) currentIdx = nextIdx;
                    phase = 0;
                }

                phaseRemainingSeconds = null;
                if (typeof window.updateTotalBar === 'function') window.updateTotalBar();
                const barFill = document.getElementById('phaseTimerFill');
                if (barFill) barFill.style.width = '0%';
                if (typeof window.syncPegasusProgressRuntime === 'function') window.syncPegasusProgressRuntime();
            } else if (typeof window.syncPegasusProgressRuntime === 'function') {
                window.syncPegasusProgressRuntime();
            }

            if (phase !== 2 && typeof window.showVideo === 'function') window.showVideo(currentIdx);
            runPhasePatched();
        } else {
            clearInterval(timer);
            timer = null;
            if (vid) vid.pause();
            if (typeof window.syncPegasusProgressRuntime === 'function') window.syncPegasusProgressRuntime();
            if (window.PegasusCloud && typeof window.PegasusCloud.push === 'function') window.PegasusCloud.push();
        }
    }

    function skipToNextExercisePatched() {
        if (!Array.isArray(exercises) || exercises.length === 0) return;

        clearInterval(timer);
        timer = null;
        phaseRemainingSeconds = null;

        if (phase === 1 && running) {
            const currentExNode = exercises[currentIdx];
            const weightInput = currentExNode ? currentExNode.querySelector('.weight-input') : null;
            const exName = weightInput ? (weightInput.getAttribute('data-name') || '') : '';

            let done = parseInt(currentExNode?.dataset?.done || 0) || 0;
            done += 1;
            if (currentExNode) {
                currentExNode.dataset.done = done;
                remainingSets[currentIdx] = Math.max(0, parseFloat(currentExNode.dataset.total) - done);
                const counter = currentExNode.querySelector('.set-counter');
                if (counter) counter.textContent = `${done}/${currentExNode.dataset.total}`;
            }

            const todayStr = window.getPegasusLocalDateKey();
            let dailyProg = JSON.parse(localStorage.getItem('pegasus_daily_progress') || '{}');
            if (dailyProg.date !== todayStr) dailyProg = { date: todayStr, exercises: {} };
            dailyProg.exercises[exName] = done;
            localStorage.setItem('pegasus_daily_progress', JSON.stringify(dailyProg));
            if (window.logPegasusSet) window.logPegasusSet(exName, done);
        }

        if (window.PegasusCloud && typeof window.PegasusCloud.push === 'function') window.PegasusCloud.push();

        const nextIdx = getNextIndexPatched();
        if (nextIdx !== -1) {
            currentIdx = nextIdx;
            phase = 0;
            syncAndRenderTimer();
            if (typeof window.dispatchPegasusWorkoutAction === 'function') window.dispatchPegasusWorkoutAction('WORKOUT_NEXT_RUNTIME');
            if (running) runPhasePatched();
            else if (typeof window.showVideo === 'function') window.showVideo(currentIdx);
        } else {
            finishWorkout();
        }
    }

    window.getNextIndexCircuit = getNextIndexPatched;
    window.startPause = startPausePatched;
    window.skipToNextExercise = skipToNextExercisePatched;

    const originalToggleSkip = window.toggleSkipExercise;
    window.toggleSkipExercise = function(idx, auto = false) {
        if (typeof originalToggleSkip === 'function') {
            const result = originalToggleSkip(idx, auto);
            syncAndRenderTimer();
            return result;
        }
    };

    if (window.PegasusDesktopBoot && typeof window.PegasusDesktopBoot.boot === 'function') {
        const originalBoot = window.PegasusDesktopBoot.boot.bind(window.PegasusDesktopBoot);
        window.PegasusDesktopBoot.boot = function patchedDesktopBoot() {
            originalBoot();
            setTimeout(() => {
                const restored = restorePersistedDesktopProgress();
                if (restored) {
                    normalizeRuntimeStateForResume();
                    syncAndRenderTimer();
                    console.log('🧭 PEGASUS DESKTOP RESUME PATCH: Runtime restored from persisted progress.');
                }
            }, 900);
        };
    }

    window.PegasusDesktopResumePatch = {
        installed: true,
        computeRemainingWorkoutSeconds,
        restorePersistedDesktopProgress,
        syncAndRenderTimer
    };

    console.log('🧭 PEGASUS DESKTOP RESUME PATCH: Active.');
})();


/* ===== MERGED FROM workoutTracking.js ===== */
/* ==========================================================================
   PEGASUS WORKOUT TRACKING
   Weekly muscle tracking and completed workout counters.
   ========================================================================== */

window.logPegasusSet = function(exName) {
    const manifest =
        window.PegasusManifest ||
        window.M ||
        (typeof M !== "undefined" ? M : null) ||
        (typeof P_M !== "undefined" ? P_M : null) ||
        {};

    const strictGroups = ["Στήθος", "Πλάτη", "Πόδια", "Χέρια", "Ώμοι", "Κορμός"];
    const emptyHistory = () => ({
        "Στήθος": 0,
        "Πλάτη": 0,
        "Πόδια": 0,
        "Χέρια": 0,
        "Ώμοι": 0,
        "Κορμός": 0
    });

    const safeParse = (raw, fallback) => {
        try {
            const parsed = JSON.parse(raw || "{}");
            return parsed && typeof parsed === "object" ? parsed : fallback;
        } catch (e) {
            return fallback;
        }
    };

    const normalizeName = (value) => String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\u0370-\u03ff]+/g, "");

    const collectExerciseRecords = () => {
        const records = [];
        if (Array.isArray(window.exercisesDB)) records.push(...window.exercisesDB);
        if (window.program && typeof window.program === "object") {
            Object.values(window.program).forEach(dayItems => {
                if (Array.isArray(dayItems)) records.push(...dayItems);
            });
        }
        return records.filter(item => item && item.name);
    };

    const resolveMuscleGroup = (name) => {
        const cleanName = String(name || "").trim();
        const compactName = normalizeName(cleanName);
        if (!compactName) return "";

        const directRecord = collectExerciseRecords().find(record =>
            normalizeName(record.name) === compactName ||
            compactName.includes(normalizeName(record.name)) ||
            normalizeName(record.name).includes(compactName)
        );

        if (strictGroups.includes(directRecord?.muscleGroup)) {
            return directRecord.muscleGroup;
        }

        const aliases = [
            { group: "Στήθος", keys: ["chest", "press", "fly", "pushup", "στηθος"] },
            { group: "Πλάτη", keys: ["lat", "row", "pulldown", "back", "ems", "πλατη"] },
            { group: "Πόδια", keys: ["leg", "cycling", "bike", "ποδηλα", "ποδια"] },
            { group: "Χέρια", keys: ["bicep", "tricep", "curl", "χερια"] },
            { group: "Ώμοι", keys: ["upright", "shoulder", "ωμοι"] },
            { group: "Κορμός", keys: ["ab", "crunch", "plank", "situp", "knee", "core", "κορμος", "κοιλιακ"] }
        ];

        const match = aliases.find(alias => alias.keys.some(key => compactName.includes(normalizeName(key))));
        return match?.group || "";
    };

    const historyKey = manifest?.workout?.weekly_history || "pegasus_weekly_history";
    const rawHistory = safeParse(localStorage.getItem(historyKey), emptyHistory());
    const history = emptyHistory();
    strictGroups.forEach(group => {
        const value = Number(rawHistory?.[group]);
        history[group] = Number.isFinite(value) ? Math.max(0, value) : 0;
    });

    const cleanName = String(exName || "").trim();
    const upperName = cleanName.toUpperCase();
    let muscle = resolveMuscleGroup(cleanName);
    let value = 1;

    if (upperName.includes("ΠΟΔΗΛΑΣΙΑ") || upperName.includes("CYCLING")) {
        muscle = "Πόδια";
        value = 18;
    } else if (upperName.includes("EMS ΠΟΔΙΩΝ") || upperName.includes("EMS LEGS")) {
        muscle = "Πόδια";
        value = 6;
    }

    if (!strictGroups.includes(muscle)) {
        console.warn("⚠️ PEGASUS WEEKLY HISTORY: Unknown muscle group, set not counted:", cleanName);
        return false;
    }

    history[muscle] = Math.max(0, Number(history[muscle] || 0)) + value;
    localStorage.setItem(historyKey, JSON.stringify(history));

    window.dispatchEvent(new CustomEvent("pegasus_weekly_history_updated", {
        detail: { exercise: cleanName, muscle, value, history: { ...history } }
    }));

    if (window.MuscleProgressUI?.render) {
        setTimeout(() => window.MuscleProgressUI.render(true), 50);
    }

    return true;
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


/* ==== MERGED FROM desktopRender.js ==== */

/* ==========================================================================
   PEGASUS DESKTOP RENDER MODULE - v44 REFACTOR
   Extracted from app.js to preserve exact preview/render behavior.
   ========================================================================== */

function showVideo(i) {
    const vid = document.getElementById("video");
    const label = document.getElementById("phaseTimer");
    if (!vid) return;

    const safePlay = () => {
        try {
            if (vid.paused || vid.ended) {
                const playPromise = vid.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(() => {});
                }
            }
        } catch (e) {}
    };

    const activeBtn = document.querySelector(".navbar button.active");
    const currentDay = activeBtn ? activeBtn.id.replace('nav-', '') : "";
    const isRecoveryDay = (currentDay === "Δευτέρα" || currentDay === "Πέμπτη");

    if (isRecoveryDay || typeof exercises === 'undefined' || !exercises[i]) {
        const recoverySrc = "videos/stretching.mp4";
        if (vid.getAttribute('src') !== recoverySrc) {
            vid.pause();
            vid.src = recoverySrc;
            vid.load();
            const playPromise = vid.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(() => console.log("Waiting for user..."));
            }
        } else {
            safePlay();
        }
        if (label && isRecoveryDay) {
            label.textContent = "ΑΠΟΘΕΡΑΠΕΙΑ: STRETCHING";
            label.style.color = "#00bcd4";
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
        const playPromise = vid.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {
                vid.src = "videos/warmup.mp4";
                vid.load();
                const fallbackPlay = vid.play();
                if (fallbackPlay && typeof fallbackPlay.catch === 'function') fallbackPlay.catch(() => {});
            });
        }
    } else {
        safePlay();
    }
}

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
    if (typeof window.updateTotalBar === "function") window.updateTotalBar();
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

    if (window.MuscleProgressUI?.render) {
        setTimeout(() => window.MuscleProgressUI.render(true), 20);
    }

    if (typeof window.forcePegasusRender === "function") {
        setTimeout(() => window.forcePegasusRender(), 50);
    }
}

window.showVideo = showVideo;
window.openExercisePreview = openExercisePreview;
window.calculateTotalTime = calculateTotalTime;
window.updateTotalBar = updateTotalBar;
