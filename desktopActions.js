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
            playBeep();

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
                if (window.logPegasusSet) window.logPegasusSet(exName);
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

        if (window.logPegasusSet) window.logPegasusSet(exName);
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
