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
                        if (window.logPegasusSet) window.logPegasusSet(exName);
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
            if (window.logPegasusSet) window.logPegasusSet(exName);
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
