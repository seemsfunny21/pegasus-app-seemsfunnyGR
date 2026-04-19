/* ==========================================================================
   PEGASUS CORE ENGINE - v1.2
   Protocol: Global Store + Reducer + Event Buffer + Legacy State Bridge
   Status: FOUNDATION STABLE | RUNTIME PATCH ACTIONS READY
   ========================================================================== */

(function() {
    if (window.PegasusEngine && window.PegasusEngine.__isCoreEngine) {
        return;
    }

    function clone(value) {
        try {
            return structuredClone(value);
        } catch (e) {
            return JSON.parse(JSON.stringify(value));
        }
    }

    function getTodayDateStr() {
        if (typeof window.getPegasusTodayDateStr === "function") {
            return window.getPegasusTodayDateStr();
        }

        const d = new Date();
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }

    function getLocalDateKey() {
        if (typeof window.getPegasusLocalDateKey === "function") {
            return window.getPegasusLocalDateKey();
        }

        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    function getInitialState() {
        return {
            workout: {
                exercises: [],
                remainingSets: [],
                currentIdx: 0,
                phase: 0, // 0 prep, 1 work, 2 rest
                running: false,
                selectedDay: null,
                sessionKcal: 0,
                weights: {}
            },
            timers: {
                totalSeconds: 0,
                remainingSeconds: 0,
                phaseRemainingSeconds: null,
                turboMode: (localStorage.getItem("pegasus_turbo_state") === "true"),
                speed: (localStorage.getItem("pegasus_turbo_state") === "true") ? 10 : 1
            },
            user: {
                weight: parseFloat(localStorage.getItem("pegasus_weight")) || 74,
                muted: localStorage.getItem("pegasus_mute_state") === "true"
            },
            nutrition: {
                todayDateStr: getTodayDateStr(),
                todayKey: getLocalDateKey()
            },
            meta: {
                updatedAt: Date.now(),
                lastAction: null,
                version: 1
            }
        };
    }

    let state = getInitialState();
    let listeners = [];
    let eventBuffer = window._pegasusEventBuffer || [];

    function pushEventBuffer(action) {
        eventBuffer.push({
            ...clone(action),
            __ts: Date.now()
        });

        if (eventBuffer.length > 300) {
            eventBuffer = eventBuffer.slice(-300);
        }

        window._pegasusEventBuffer = eventBuffer;
    }


    function isSerializableExerciseArray(value) {
        return Array.isArray(value) && value.every(item => {
            if (!item || typeof item !== "object") return false;
            if (item.nodeType || typeof item.querySelector === "function" || typeof item.classList !== "undefined") return false;
            return true;
        });
    }

    function applyHydrationSnapshot(next, payload) {
        const snapshot = payload || {};

        if (isSerializableExerciseArray(snapshot.exercises)) {
            next.workout.exercises = clone(snapshot.exercises);
        }
        next.workout.remainingSets = clone(snapshot.remainingSets || next.workout.remainingSets || []);
        next.workout.currentIdx = snapshot.currentIdx ?? next.workout.currentIdx;
        next.workout.phase = snapshot.phase ?? next.workout.phase;
        next.workout.running = snapshot.running ?? next.workout.running;
        next.workout.sessionKcal = snapshot.sessionKcal ?? next.workout.sessionKcal;
        next.workout.selectedDay = snapshot.selectedDay ?? next.workout.selectedDay;
        next.workout.weights = clone(snapshot.weights || next.workout.weights || {});

        next.timers.totalSeconds = snapshot.totalSeconds ?? next.timers.totalSeconds;
        next.timers.remainingSeconds = snapshot.remainingSeconds ?? next.timers.remainingSeconds;
        next.timers.phaseRemainingSeconds = snapshot.phaseRemainingSeconds ?? next.timers.phaseRemainingSeconds;
        next.timers.turboMode = snapshot.turboMode ?? next.timers.turboMode;
        next.timers.speed = snapshot.speed ?? next.timers.speed;

        next.user.weight = snapshot.userWeight ?? snapshot.weight ?? next.user.weight;
        next.user.muted = snapshot.muted ?? next.user.muted;

        next.nutrition.todayDateStr = snapshot.todayDateStr ?? getTodayDateStr();
        next.nutrition.todayKey = snapshot.todayKey ?? getLocalDateKey();
    }

    function reducer(currentState, action) {
        const prev = currentState;
        const next = clone(prev);

        if (!action || !action.type) {
            next.meta.updatedAt = Date.now();
            next.meta.lastAction = "UNKNOWN";
            return next;
        }

        switch (action.type) {
            case "BOOT_FROM_LEGACY":
            case "SYNC_LEGACY":
            case "HYDRATE_LEGACY_RUNTIME":
            case "SELECT_DAY":
            case "START_WORKOUT":
            case "PAUSE_WORKOUT":
            case "RESUME_FROM_PREP":
            case "PHASE_START":
            case "PHASE_TICK":
            case "PHASE_COMPLETE_PREP":
            case "SET_COMPLETED":
            case "REST_COMPLETE_NEXT":
            case "SKIP_EXERCISE":
            case "TOGGLE_SKIP_EXERCISE":
            case "SAVE_WEIGHT":
            case "AUTO_INIT_TODAY":
            case "WORKOUT_FINISHED":
            case "WORKOUT_REPORT_SAVED":
            case "BOOT_COMPLETE":
            case "SYNC_MUTED":
            case "SYNC_TURBO":
            case "WARMUP_RETURN":
                applyHydrationSnapshot(next, action.payload);
                break;

            case "SET_CURRENT_INDEX":
                next.workout.currentIdx = action.payload?.currentIdx ?? next.workout.currentIdx;
                break;

            case "SET_PHASE":
                next.workout.phase = action.payload?.phase ?? next.workout.phase;
                break;

            case "SET_RUNNING":
                next.workout.running = !!action.payload?.running;
                break;

            case "SET_SESSION_KCAL":
                next.workout.sessionKcal = action.payload?.sessionKcal ?? next.workout.sessionKcal;
                break;

            case "ADD_SESSION_KCAL":
                next.workout.sessionKcal = (next.workout.sessionKcal || 0) + (action.payload?.amount || 0);
                break;

            case "SET_TOTAL_SECONDS":
                next.timers.totalSeconds = action.payload?.totalSeconds ?? next.timers.totalSeconds;
                break;

            case "SET_REMAINING_SECONDS":
                next.timers.remainingSeconds = action.payload?.remainingSeconds ?? next.timers.remainingSeconds;
                break;

            case "SET_PHASE_REMAINING":
                next.timers.phaseRemainingSeconds = action.payload?.phaseRemainingSeconds ?? next.timers.phaseRemainingSeconds;
                break;

            case "SET_TIMER_STATE":
                next.timers.totalSeconds = action.payload?.totalSeconds ?? next.timers.totalSeconds;
                next.timers.remainingSeconds = action.payload?.remainingSeconds ?? next.timers.remainingSeconds;
                next.timers.phaseRemainingSeconds = action.payload?.phaseRemainingSeconds ?? next.timers.phaseRemainingSeconds;
                break;

            case "SET_REMAINING_SETS":
                next.workout.remainingSets = clone(action.payload?.remainingSets || next.workout.remainingSets);
                break;

            case "SET_EXERCISES":
                next.workout.exercises = clone(action.payload?.exercises || next.workout.exercises);
                break;

            case "SYNC_WEIGHT":
                next.user.weight = action.payload?.weight ?? next.user.weight;
                break;

            case "SET_SELECTED_DAY":
                next.workout.selectedDay = action.payload?.selectedDay ?? next.workout.selectedDay;
                break;

            case "PATCH_WORKOUT_RUNTIME":
                if (action.payload && typeof action.payload === "object") {
                    Object.assign(next.workout, clone(action.payload));
                }
                break;

            case "PATCH_TIMER_RUNTIME":
                if (action.payload && typeof action.payload === "object") {
                    Object.assign(next.timers, clone(action.payload));
                }
                break;

            case "PATCH_USER_RUNTIME":
                if (action.payload && typeof action.payload === "object") {
                    Object.assign(next.user, clone(action.payload));
                }
                break;

            case "PATCH_SESSION_RUNTIME":
                if (action.payload && typeof action.payload === "object") {
                    if (action.payload.workout) Object.assign(next.workout, clone(action.payload.workout));
                    if (action.payload.timers) Object.assign(next.timers, clone(action.payload.timers));
                    if (action.payload.user) Object.assign(next.user, clone(action.payload.user));
                    if (action.payload.nutrition) Object.assign(next.nutrition, clone(action.payload.nutrition));
                }
                break;

            case "RESET_WORKOUT_RUNTIME":
                next.workout.currentIdx = 0;
                next.workout.phase = 0;
                next.workout.running = false;
                next.workout.sessionKcal = 0;
                next.timers.phaseRemainingSeconds = null;
                break;
        }

        next.meta.updatedAt = Date.now();
        next.meta.lastAction = action.type;

        return next;
    }

    function syncLegacyGlobals(nextState) {
        try {
            if (typeof window.exercises !== "undefined") window.exercises = nextState.workout.exercises;
            if (typeof window.remainingSets !== "undefined") window.remainingSets = nextState.workout.remainingSets;
            if (typeof window.currentIdx !== "undefined") window.currentIdx = nextState.workout.currentIdx;
            if (typeof window.phase !== "undefined") window.phase = nextState.workout.phase;
            if (typeof window.running !== "undefined") window.running = nextState.workout.running;
            if (typeof window.totalSeconds !== "undefined") window.totalSeconds = nextState.timers.totalSeconds;
            if (typeof window.remainingSeconds !== "undefined") window.remainingSeconds = nextState.timers.remainingSeconds;
            if (typeof window.phaseRemainingSeconds !== "undefined") window.phaseRemainingSeconds = nextState.timers.phaseRemainingSeconds;
            if (typeof window.sessionActiveKcal !== "undefined") window.sessionActiveKcal = nextState.workout.sessionKcal;
            if (typeof window.userWeight !== "undefined") window.userWeight = nextState.user.weight;
            if (typeof window.muted !== "undefined") window.muted = nextState.user.muted;
            if (typeof window.TURBO_MODE !== "undefined") window.TURBO_MODE = nextState.timers.turboMode;
            if (typeof window.SPEED !== "undefined") window.SPEED = nextState.timers.speed;
        } catch (e) {
            console.warn("⚠️ PEGASUS CORE: Legacy sync warning", e);
        }
    }

    function dispatch(action) {
        const normalizedAction = action && action.type
            ? action
            : { type: "UNKNOWN_ACTION", payload: { raw: action } };

        state = reducer(state, normalizedAction);
        pushEventBuffer(normalizedAction);
        syncLegacyGlobals(state);

        listeners.forEach(fn => {
            try {
                fn(state, normalizedAction);
            } catch (e) {
                console.warn("⚠️ PEGASUS CORE LISTENER ERROR:", e);
            }
        });

        return state;
    }

    function getState() {
        return state;
    }

    function subscribe(fn) {
        if (typeof fn !== "function") return function() {};
        listeners.push(fn);

        return function unsubscribe() {
            listeners = listeners.filter(listener => listener !== fn);
        };
    }

    function replaceState(nextState, metaActionType = "REPLACE_STATE") {
        state = clone(nextState || getInitialState());
        pushEventBuffer({ type: metaActionType });
        syncLegacyGlobals(state);

        listeners.forEach(fn => {
            try {
                fn(state, { type: metaActionType });
            } catch (e) {
                console.warn("⚠️ PEGASUS CORE LISTENER ERROR:", e);
            }
        });

        return state;
    }

    function getEventBuffer() {
        return eventBuffer || [];
    }

    function clearEventBuffer() {
        eventBuffer = [];
        window._pegasusEventBuffer = [];
    }

    function replay(limit) {
        const events = (eventBuffer || []).slice(-(limit || eventBuffer.length));
        let replayState = getInitialState();

        events.forEach(ev => {
            const cleanEvent = clone(ev);
            delete cleanEvent.__ts;
            replayState = reducer(replayState, cleanEvent);
        });

        return replayState;
    }

    function hydrateFromLegacy(snapshot, actionType) {
        return dispatch({
            type: actionType || "HYDRATE_LEGACY_RUNTIME",
            payload: clone(snapshot || {})
        });
    }

    function getWorkoutState() {
        return clone(state.workout || {});
    }

    function getTimerState() {
        return clone(state.timers || {});
    }

    function getUserState() {
        return clone(state.user || {});
    }

    function getSessionSnapshot() {
        return {
            workout: getWorkoutState(),
            timers: getTimerState(),
            user: getUserState(),
            nutrition: clone(state.nutrition || {}),
            meta: clone(state.meta || {})
        };
    }

    function patchWorkoutRuntime(payload) {
        return dispatch({ type: "PATCH_WORKOUT_RUNTIME", payload: clone(payload || {}) });
    }

    function patchTimerRuntime(payload) {
        return dispatch({ type: "PATCH_TIMER_RUNTIME", payload: clone(payload || {}) });
    }

    function patchUserRuntime(payload) {
        return dispatch({ type: "PATCH_USER_RUNTIME", payload: clone(payload || {}) });
    }

    function patchSessionRuntime(payload) {
        return dispatch({ type: "PATCH_SESSION_RUNTIME", payload: clone(payload || {}) });
    }

    function setSelectedDay(selectedDay) {
        return dispatch({ type: "SET_SELECTED_DAY", payload: { selectedDay } });
    }

    window.PegasusEngine = {
        __isCoreEngine: true,
        dispatch,
        getState,
        subscribe,
        replaceState,
        hydrateFromLegacy,
        patchWorkoutRuntime,
        patchTimerRuntime,
        patchUserRuntime,
        patchSessionRuntime,
        setSelectedDay,
        getWorkoutState,
        getTimerState,
        getUserState,
        getSessionSnapshot,
        getEventBuffer,
        clearEventBuffer,
        replay,
        getInitialState
    };

    window._pegasusEventBuffer = eventBuffer;

    console.log("🧠 PEGASUS CORE: Engine initialized.");
})();
