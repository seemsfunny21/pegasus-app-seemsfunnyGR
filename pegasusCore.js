/* ==========================================================================
   PEGASUS CORE ENGINE - v2.0
   Protocol: Central Store + Reducer + Immutable Access + Plugins + Persistence
   Status: ENGINE UPGRADE | ACTION CORE READY
   ========================================================================== */

(function() {
    if (window.PegasusEngine && window.PegasusEngine.__isCoreEngine) {
        return;
    }

    const STORE_KEY = 'pegasus_core_state_v2';
    const EVENT_LIMIT = 300;

    function clone(value) {
        try {
            return structuredClone(value);
        } catch (e) {
            return JSON.parse(JSON.stringify(value));
        }
    }

    function getTodayDateStr() {
        if (typeof window.getPegasusTodayDateStr === 'function') {
            return window.getPegasusTodayDateStr();
        }
        const d = new Date();
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }

    function getLocalDateKey() {
        if (typeof window.getPegasusLocalDateKey === 'function') {
            return window.getPegasusLocalDateKey();
        }
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    function getInitialState() {
        const turboMode = (localStorage.getItem('pegasus_turbo_state') === 'true');
        return {
            workout: {
                exercises: [],
                remainingSets: [],
                currentIdx: 0,
                phase: 0,
                running: false,
                selectedDay: null,
                sessionKcal: 0,
                weights: {}
            },
            timers: {
                totalSeconds: 0,
                remainingSeconds: 0,
                phaseRemainingSeconds: null,
                turboMode,
                speed: turboMode ? 10 : 1
            },
            user: {
                weight: parseFloat(localStorage.getItem('pegasus_weight')) || 74,
                muted: localStorage.getItem('pegasus_mute_state') === 'true',
                language: localStorage.getItem('pegasus_language') || localStorage.getItem('pegasus_lang') || 'gr'
            },
            nutrition: {
                todayDateStr: getTodayDateStr(),
                todayKey: getLocalDateKey()
            },
            ui: {
                activePanel: null,
                lastDialogType: null
            },
            meta: {
                updatedAt: Date.now(),
                lastAction: 'INIT',
                version: 2
            }
        };
    }

    function mergeState(target, source) {
        const base = clone(target || {});
        const incoming = source || {};
        Object.keys(incoming).forEach(key => {
            const nextVal = incoming[key];
            if (
                nextVal &&
                typeof nextVal === 'object' &&
                !Array.isArray(nextVal) &&
                base[key] &&
                typeof base[key] === 'object' &&
                !Array.isArray(base[key])
            ) {
                base[key] = mergeState(base[key], nextVal);
            } else {
                base[key] = clone(nextVal);
            }
        });
        return base;
    }

    function sanitizePersistedState(raw) {
        const fresh = getInitialState();
        if (!raw || typeof raw !== 'object') return fresh;
        const merged = mergeState(fresh, raw);
        merged.nutrition.todayDateStr = getTodayDateStr();
        merged.nutrition.todayKey = getLocalDateKey();
        merged.meta.updatedAt = Date.now();
        merged.meta.lastAction = 'HYDRATE_STORE';
        merged.meta.version = 2;
        return merged;
    }

    function readPersistedState() {
        try {
            const raw = localStorage.getItem(STORE_KEY);
            if (!raw) return null;
            return sanitizePersistedState(JSON.parse(raw));
        } catch (e) {
            console.warn('⚠️ PEGASUS CORE: Persisted store ignored', e);
            return null;
        }
    }

    function writePersistedState(nextState) {
        try {
            localStorage.setItem(STORE_KEY, JSON.stringify(nextState));
        } catch (e) {
            console.warn('⚠️ PEGASUS CORE: Persist failed', e);
        }
    }

    let state = readPersistedState() || getInitialState();
    let listeners = [];
    let plugins = [];
    let eventBuffer = Array.isArray(window._pegasusEventBuffer) ? window._pegasusEventBuffer.slice(-EVENT_LIMIT) : [];

    function pushEventBuffer(action) {
        eventBuffer.push({ ...clone(action), __ts: Date.now() });
        if (eventBuffer.length > EVENT_LIMIT) eventBuffer = eventBuffer.slice(-EVENT_LIMIT);
        window._pegasusEventBuffer = eventBuffer;
    }

    function reducer(currentState, action) {
        const next = clone(currentState);
        const payload = action?.payload || {};

        switch (action?.type) {
            case 'BOOT_FROM_LEGACY':
            case 'SYNC_RUNTIME_SNAPSHOT':
                return mergeState(next, payload);

            case 'SELECT_DAY':
                next.workout.selectedDay = payload.day || null;
                next.workout.exercises = clone(payload.exercises || []);
                next.workout.remainingSets = clone(payload.remainingSets || []);
                next.workout.currentIdx = payload.currentIdx ?? 0;
                next.workout.phase = 0;
                next.workout.running = false;
                next.workout.sessionKcal = 0;
                next.timers.totalSeconds = payload.totalSeconds || 0;
                next.timers.remainingSeconds = payload.remainingSeconds || 0;
                next.timers.phaseRemainingSeconds = null;
                break;

            case 'START_WORKOUT':
                next.workout.running = true;
                break;

            case 'PAUSE_WORKOUT':
                next.workout.running = false;
                break;

            case 'RESUME_FROM_PREP':
                next.workout.running = true;
                next.workout.phase = 0;
                next.timers.phaseRemainingSeconds = null;
                break;

            case 'SET_CURRENT_INDEX':
                next.workout.currentIdx = payload.currentIdx ?? next.workout.currentIdx;
                break;

            case 'SET_PHASE':
                next.workout.phase = payload.phase ?? next.workout.phase;
                break;

            case 'SET_RUNNING':
                next.workout.running = !!payload.running;
                break;

            case 'SET_SESSION_KCAL':
                next.workout.sessionKcal = payload.sessionKcal ?? next.workout.sessionKcal;
                break;

            case 'ADD_SESSION_KCAL':
                next.workout.sessionKcal = (next.workout.sessionKcal || 0) + (payload.amount || 0);
                break;

            case 'SET_TOTAL_SECONDS':
                next.timers.totalSeconds = payload.totalSeconds ?? next.timers.totalSeconds;
                break;

            case 'SET_REMAINING_SECONDS':
                next.timers.remainingSeconds = payload.remainingSeconds ?? next.timers.remainingSeconds;
                break;

            case 'SET_PHASE_REMAINING':
                next.timers.phaseRemainingSeconds = payload.phaseRemainingSeconds ?? next.timers.phaseRemainingSeconds;
                break;

            case 'PHASE_TICK':
                if (typeof payload.remainingSeconds === 'number') next.timers.remainingSeconds = payload.remainingSeconds;
                if (typeof payload.phaseRemainingSeconds === 'number') next.timers.phaseRemainingSeconds = payload.phaseRemainingSeconds;
                break;

            case 'SET_TIMER_STATE':
                next.timers.totalSeconds = payload.totalSeconds ?? next.timers.totalSeconds;
                next.timers.remainingSeconds = payload.remainingSeconds ?? next.timers.remainingSeconds;
                next.timers.phaseRemainingSeconds = payload.phaseRemainingSeconds ?? next.timers.phaseRemainingSeconds;
                break;

            case 'SET_REMAINING_SETS':
                next.workout.remainingSets = clone(payload.remainingSets || next.workout.remainingSets);
                break;

            case 'SET_EXERCISES':
                next.workout.exercises = clone(payload.exercises || next.workout.exercises);
                break;

            case 'WORKOUT_SET_COMPLETED': {
                const idx = payload.currentIdx ?? next.workout.currentIdx;
                const updated = clone(next.workout.remainingSets || []);
                if (typeof idx === 'number' && typeof updated[idx] === 'number') {
                    updated[idx] = Math.max(0, updated[idx] - 1);
                    next.workout.remainingSets = updated;
                }
                break;
            }

            case 'NEXT_EXERCISE':
                next.workout.currentIdx = payload.currentIdx ?? next.workout.currentIdx;
                next.workout.phase = payload.phase ?? 0;
                next.timers.phaseRemainingSeconds = null;
                break;

            case 'SKIP_EXERCISE': {
                const idx = payload.idx;
                const updated = clone(next.workout.remainingSets || []);
                if (typeof idx === 'number' && typeof updated[idx] === 'number') {
                    updated[idx] = 0;
                    next.workout.remainingSets = updated;
                }
                break;
            }

            case 'SYNC_WEIGHT':
                next.user.weight = payload.weight ?? next.user.weight;
                break;

            case 'SYNC_MUTED':
                next.user.muted = !!payload.muted;
                break;

            case 'SYNC_TURBO':
                next.timers.turboMode = !!payload.turboMode;
                next.timers.speed = payload.speed ?? (next.timers.turboMode ? 10 : 1);
                break;

            case 'SET_LANGUAGE':
                next.user.language = payload.language === 'en' ? 'en' : 'gr';
                break;

            case 'PLAN_CHANGED':
                next.meta.planKey = payload.planKey || next.meta.planKey;
                break;

            case 'SET_ACTIVE_PANEL':
                next.ui.activePanel = payload.panel || null;
                break;

            case 'SET_DIALOG_TYPE':
                next.ui.lastDialogType = payload.dialogType || null;
                break;

            case 'WORKOUT_FINISHED':
                next.workout.running = false;
                next.workout.phase = 0;
                next.timers.phaseRemainingSeconds = null;
                next.timers.remainingSeconds = 0;
                break;

            case 'RESET_WORKOUT_RUNTIME':
                next.workout.currentIdx = 0;
                next.workout.phase = 0;
                next.workout.running = false;
                next.workout.sessionKcal = 0;
                next.timers.phaseRemainingSeconds = null;
                break;
        }

        next.meta.updatedAt = Date.now();
        next.meta.lastAction = action?.type || 'UNKNOWN';
        next.meta.version = 2;
        return next;
    }

    function syncLegacyGlobals(nextState) {
        try {
            if (typeof window.exercises !== 'undefined') window.exercises = clone(nextState.workout.exercises);
            if (typeof window.remainingSets !== 'undefined') window.remainingSets = clone(nextState.workout.remainingSets);
            if (typeof window.currentIdx !== 'undefined') window.currentIdx = nextState.workout.currentIdx;
            if (typeof window.phase !== 'undefined') window.phase = nextState.workout.phase;
            if (typeof window.running !== 'undefined') window.running = nextState.workout.running;
            if (typeof window.totalSeconds !== 'undefined') window.totalSeconds = nextState.timers.totalSeconds;
            if (typeof window.remainingSeconds !== 'undefined') window.remainingSeconds = nextState.timers.remainingSeconds;
            if (typeof window.phaseRemainingSeconds !== 'undefined') window.phaseRemainingSeconds = nextState.timers.phaseRemainingSeconds;
            if (typeof window.sessionActiveKcal !== 'undefined') window.sessionActiveKcal = nextState.workout.sessionKcal;
            if (typeof window.userWeight !== 'undefined') window.userWeight = nextState.user.weight;
            if (typeof window.muted !== 'undefined') window.muted = nextState.user.muted;
            if (typeof window.TURBO_MODE !== 'undefined') window.TURBO_MODE = nextState.timers.turboMode;
            if (typeof window.SPEED !== 'undefined') window.SPEED = nextState.timers.speed;
        } catch (e) {
            console.warn('⚠️ PEGASUS CORE: Legacy sync warning', e);
        }
    }

    function notify(nextState, action) {
        const safeState = clone(nextState);
        listeners.forEach(fn => {
            try {
                fn(safeState, clone(action));
            } catch (e) {
                console.warn('⚠️ PEGASUS CORE LISTENER ERROR:', e);
            }
        });

        plugins.forEach(plugin => {
            try {
                if (typeof plugin.onAction === 'function') {
                    plugin.onAction(clone(safeState), clone(action), api);
                }
            } catch (e) {
                console.warn('⚠️ PEGASUS CORE PLUGIN ERROR:', e);
            }
        });

        try {
            window.dispatchEvent(new CustomEvent('pegasus_engine_action', { detail: { action: clone(action), state: safeState } }));
        } catch (e) {}
    }

    function dispatch(action) {
        const normalizedAction = action && action.type ? clone(action) : { type: 'UNKNOWN_ACTION', payload: { raw: action } };
        state = reducer(state, normalizedAction);
        pushEventBuffer(normalizedAction);
        syncLegacyGlobals(state);
        writePersistedState(state);
        notify(state, normalizedAction);
        return clone(state);
    }

    function replaceState(nextState, metaActionType = 'REPLACE_STATE') {
        state = sanitizePersistedState(nextState || getInitialState());
        const action = { type: metaActionType, payload: { hydrated: true } };
        pushEventBuffer(action);
        syncLegacyGlobals(state);
        writePersistedState(state);
        notify(state, action);
        return clone(state);
    }

    function getState() {
        return clone(state);
    }

    function subscribe(fn) {
        if (typeof fn !== 'function') return function() {};
        listeners.push(fn);
        return function unsubscribe() {
            listeners = listeners.filter(listener => listener !== fn);
        };
    }

    function use(plugin) {
        if (!plugin) return function() {};
        const normalized = typeof plugin === 'function' ? { onAction: plugin } : plugin;
        plugins.push(normalized);
        try {
            if (typeof normalized.onRegister === 'function') normalized.onRegister(api);
        } catch (e) {
            console.warn('⚠️ PEGASUS CORE PLUGIN REGISTER ERROR:', e);
        }
        return function unregister() {
            plugins = plugins.filter(item => item !== normalized);
        };
    }

    function getEventBuffer() {
        return clone(eventBuffer || []);
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
        return clone(replayState);
    }

    function resetStore() {
        state = getInitialState();
        writePersistedState(state);
        return clone(state);
    }

    const api = {
        __isCoreEngine: true,
        dispatch,
        replaceState,
        getState,
        subscribe,
        use,
        getEventBuffer,
        clearEventBuffer,
        replay,
        resetStore,
        getInitialState,
        getStoreKey: () => STORE_KEY
    };

    use({
        onRegister() {
            writePersistedState(state);
        }
    });

    window.PegasusEngine = api;
    window._pegasusEventBuffer = eventBuffer;
    syncLegacyGlobals(state);

    console.log('🧠 PEGASUS CORE: Engine initialized.');
})();
