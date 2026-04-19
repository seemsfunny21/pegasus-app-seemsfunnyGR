/* ==========================================================================
   PEGASUS CORE ENGINE - v1.0
   Protocol: Global Store + Reducer + Event Buffer + Legacy State Bridge
   Status: FOUNDATION STABLE | ACTION CORE READY
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
                next.workout.exercises = clone(action.payload?.exercises || []);
                next.workout.remainingSets = clone(action.payload?.remainingSets || []);
                next.workout.currentIdx = action.payload?.currentIdx ?? next.workout.currentIdx;
                next.workout.phase = action.payload?.phase ?? next.workout.phase;
                next.workout.running = action.payload?.running ?? next.workout.running;
                next.workout.sessionKcal = action.payload?.sessionKcal ?? next.workout.sessionKcal;

                next.timers.totalSeconds = action.payload?.totalSeconds ?? next.timers.totalSeconds;
                next.timers.remainingSeconds = action.payload?.remainingSeconds ?? next.timers.remainingSeconds;
                next.timers.phaseRemainingSeconds = action.payload?.phaseRemainingSeconds ?? next.timers.phaseRemainingSeconds;
                next.timers.turboMode = action.payload?.turboMode ?? next.timers.turboMode;
                next.timers.speed = action.payload?.speed ?? next.timers.speed;

                next.user.weight = action.payload?.userWeight ?? next.user.weight;
                next.user.muted = action.payload?.muted ?? next.user.muted;
                break;

            case "SELECT_DAY":
                next.workout.selectedDay = action.payload?.day || null;
                next.workout.exercises = clone(action.payload?.exercises || []);
                next.workout.remainingSets = clone(action.payload?.remainingSets || []);
                next.workout.currentIdx = 0;
                next.workout.phase = 0;
                next.workout.running = false;
                next.workout.sessionKcal = 0;

                next.timers.totalSeconds = action.payload?.totalSeconds || 0;
                next.timers.remainingSeconds = action.payload?.remainingSeconds || 0;
                next.timers.phaseRemainingSeconds = null;
                break;

            case "START_WORKOUT":
                next.workout.running = true;
                break;

            case "PAUSE_WORKOUT":
                next.workout.running = false;
                break;

            case "RESUME_FROM_PREP":
                next.workout.running = true;
                next.workout.phase = 0;
                next.timers.phaseRemainingSeconds = null;
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

            case "PHASE_TICK":
                if (typeof action.payload?.remainingSeconds === "number") {
                    next.timers.remainingSeconds = action.payload.remainingSeconds;
                }
                if (typeof action.payload?.phaseRemainingSeconds === "number") {
                    next.timers.phaseRemainingSeconds = action.payload.phaseRemainingSeconds;
                }
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

            case "SYNC_MUTED":
                next.user.muted = !!action.payload?.muted;
                break;

            case "SYNC_TURBO":
                next.timers.turboMode = !!action.payload?.turboMode;
                next.timers.speed = action.payload?.speed ?? (next.timers.turboMode ? 10 : 1);
                break;

            case "WORKOUT_FINISHED":
                next.workout.running = false;
                next.workout.phase = 0;
                next.timers.phaseRemainingSeconds = null;
                next.timers.remainingSeconds = 0;
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

    window.PegasusEngine = {
        __isCoreEngine: true,
        dispatch,
        getState,
        subscribe,
        replaceState,
        getEventBuffer,
        clearEventBuffer,
        replay,
        getInitialState
    };

    window._pegasusEventBuffer = eventBuffer;

    console.log("🧠 PEGASUS CORE: Engine initialized.");
})();
