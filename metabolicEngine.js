/* =============================================================
   PEGASUS UNIFIED METABOLIC ENGINE - v16.9 (EXERCISE BURN TARGET CORE)
   Merged: calories.js + metabolic.js
   Protocol: Strict Session Isolation, Midnight Guard & Shared Target Logic
   Status: FINAL STABLE | FIXED: DIET TARGET FOLLOWS WORKOUT + CYCLING BURN
   ============================================================= */

const PegasusMetabolic = {
    sessionKcal: 0,
    unsubscribeEngine: null,

    getEngineState: function() {
        try {
            return window.PegasusEngine?.getState?.() || null;
        } catch (e) {
            return null;
        }
    },

    isWorkoutRunning: function() {
        const engineState = this.getEngineState();
        if (!engineState) return false;

        if (typeof engineState.workout?.running === "boolean") {
            return engineState.workout.running;
        }

        return !!engineState.running;
    },

    getEngineSessionKcal: function() {
        const engineState = this.getEngineState();
        if (!engineState) return null;

        if (typeof engineState.workout?.sessionKcal === "number") {
            return engineState.workout.sessionKcal;
        }

        if (typeof engineState.sessionActiveKcal === "number") {
            return engineState.sessionActiveKcal;
        }

        return null;
    },

    get userWeight() {
        const engineState = this.getEngineState();

        if (typeof engineState?.user?.weight === "number" && !isNaN(engineState.user.weight)) {
            return engineState.user.weight;
        }

        if (typeof engineState?.userWeight === "number" && !isNaN(engineState.userWeight)) {
            return engineState.userWeight;
        }

        return parseFloat(localStorage.getItem(window.PegasusManifest?.user?.weight || "pegasus_weight")) || 74;
    },

    /* =========================================================
       SAFE KEY HELPERS
       ========================================================= */
    getKeys: function() {
        return {
            todayKcal: window.PegasusManifest?.diet?.todayKcal || "pegasus_today_kcal",
            todayProtein: window.PegasusManifest?.diet?.todayProtein || "pegasus_today_protein",
            sessionKcal: window.PegasusManifest?.diet?.session_kcal || "pegasus_session_kcal",
            weeklyKcal: window.PegasusManifest?.diet?.weeklyKcal || window.PegasusManifest?.diet?.weekly_kcal || "pegasus_weekly_kcal",
            workoutDone: window.PegasusManifest?.workout?.done || "pegasus_workouts_done",
            cardioOffsetLegacy: window.PegasusManifest?.workout?.cardio_offset || "pegasus_cardio_offset_sets",
            calendarHistory: window.PegasusManifest?.workout?.calendarHistory || "pegasus_calendar_history",
            cardioDailyPrefix: window.PegasusManifest?.workout?.cardio_daily_prefix || "pegasus_cardio_kcal_",
            workoutDailyPrefix: "pegasus_workout_kcal_",
            workoutBurnHistory: "pegasus_workout_kcal_history"
        };
    },

    /* =========================================================
       SHARED HELPERS (CANONICAL SOURCE)
       ========================================================= */
    getTodayDateStr: function() {
        const d = new Date();
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    },

    getTodayWorkoutKey: function() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },

    getDateAliases: function(dateStr) {
        if (typeof window.getPegasusDateAliases === "function") {
            return window.getPegasusDateAliases(dateStr);
        }

        const aliases = new Set();
        const raw = String(dateStr || '').trim();
        if (raw) aliases.add(raw);

        let iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (iso) {
            aliases.add(`${iso[3]}/${iso[2]}/${iso[1]}`);
            aliases.add(`${parseInt(iso[3], 10)}/${parseInt(iso[2], 10)}/${iso[1]}`);
            aliases.add(`${iso[1]}${iso[2]}${iso[3]}`);
        }

        let greek = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (greek) {
            const d = String(parseInt(greek[1], 10)).padStart(2, '0');
            const m = String(parseInt(greek[2], 10)).padStart(2, '0');
            aliases.add(`${d}/${m}/${greek[3]}`);
            aliases.add(`${parseInt(greek[1], 10)}/${parseInt(greek[2], 10)}/${greek[3]}`);
            aliases.add(`${greek[3]}-${m}-${d}`);
            aliases.add(`${greek[3]}${m}${d}`);
        }

        return Array.from(aliases);
    },

    getCardioOffsetForDate: function(dateStr) {
        const keys = this.getKeys();
        const aliases = this.getDateAliases(dateStr || this.getTodayDateStr());
        let directValue = 0;

        aliases.forEach(alias => {
            const canonical = parseFloat(localStorage.getItem(keys.cardioDailyPrefix + alias));
            if (!isNaN(canonical)) directValue = Math.max(directValue, canonical);

            const legacy = parseFloat(localStorage.getItem(keys.cardioOffsetLegacy + "_" + alias));
            if (!isNaN(legacy)) directValue = Math.max(directValue, legacy);
        });

        // Fallback: if the per-day offset key was not synced yet but cardio_history was,
        // derive the same value from today's cardio entries.
        let historyValue = 0;
        try {
            const cardioHistory = JSON.parse(localStorage.getItem("pegasus_cardio_history") || "[]");
            if (Array.isArray(cardioHistory)) {
                const aliasSet = new Set(aliases);
                cardioHistory.forEach(entry => {
                    if (aliasSet.has(String(entry?.date || '').trim()) || aliasSet.has(String(entry?.isoDate || entry?.dateKey || entry?.workoutKey || '').trim()) || aliasSet.has(String(entry?.compactDate || '').trim())) {
                        historyValue += parseFloat(entry?.kcal || entry?.calories || entry?.cardioKcal || 0) || 0;
                    }
                });
            }
        } catch (e) {}

        return Math.round(Math.max(directValue, historyValue));
    },

    getTodayCardioOffset: function() {
        return this.getCardioOffsetForDate(this.getTodayDateStr());
    },

    getWorkoutBurnForDate: function(dateStr) {
        const keys = this.getKeys();
        const aliases = this.getDateAliases(dateStr || this.getTodayDateStr());
        const prefixes = [keys.workoutDailyPrefix || "pegasus_workout_kcal_", "pegasus_strength_kcal_", "pegasus_gym_kcal_"];
        let directValue = 0;

        aliases.forEach(alias => {
            prefixes.forEach(prefix => {
                const value = parseFloat(localStorage.getItem(prefix + alias));
                if (!isNaN(value)) directValue = Math.max(directValue, value);
            });
        });

        let historyValue = 0;
        try {
            const history = JSON.parse(localStorage.getItem(keys.workoutBurnHistory || "pegasus_workout_kcal_history") || "[]");
            if (Array.isArray(history)) {
                const aliasSet = new Set(aliases.map(String));
                history.forEach(entry => {
                    const matches = [entry?.date, entry?.isoDate, entry?.dateKey, entry?.workoutKey, entry?.compactDate]
                        .map(v => String(v || '').trim())
                        .some(v => aliasSet.has(v));
                    if (matches) historyValue += parseFloat(entry?.kcal || entry?.calories || entry?.workoutKcal || 0) || 0;
                });
            }
        } catch (e) {}

        return Math.round(Math.max(directValue, historyValue));
    },

    getTodayWorkoutBurn: function() {
        return this.getWorkoutBurnForDate(this.getTodayDateStr());
    },

    getExerciseBurnForDate: function(dateStr) {
        return Math.round(this.getCardioOffsetForDate(dateStr) + this.getWorkoutBurnForDate(dateStr));
    },

    getTodayExerciseBurn: function() {
        return this.getExerciseBurnForDate(this.getTodayDateStr());
    },


    getBodyGoalMode: function(settingsObj) {
        const raw = settingsObj?.bodyGoalMode || localStorage.getItem('pegasus_body_goal_mode') || 'cut';
        const v = String(raw || '').toLowerCase();
        return (v === 'bulk' || v === 'ogkos' || v === 'όγκος') ? 'bulk' : 'cut';
    },

    getBodyGoalLabel: function(mode) {
        const isEn = (window.PegasusI18n?.getLanguage?.() || localStorage.getItem('pegasus_language') || localStorage.getItem('pegasus_lang')) === 'en';
        return this.getBodyGoalMode({ bodyGoalMode: mode }) === 'bulk' ? (isEn ? 'Bulk' : 'Όγκος') : (isEn ? 'Cutting' : 'Γράμμωση');
    },

    getExerciseRefeedForTarget: function(exerciseBurn, settingsObj) {
        const burn = Math.max(0, Math.round(parseFloat(exerciseBurn) || 0));
        const mode = this.getBodyGoalMode(settingsObj);
        if (mode === 'bulk') return burn;
        // Γράμμωση / recomposition: keep most cardio/workout burn as deficit.
        // Refeed only a small, rounded safety buffer so heavy cycling does not push overeating.
        return Math.min(250, Math.round((burn * 0.15) / 50) * 50);
    },

    calculateFinalDailyTarget: function(baseTarget, exerciseBurn, settingsObj) {
        return Math.round((parseFloat(baseTarget) || 0) + this.getExerciseRefeedForTarget(exerciseBurn, settingsObj));
    },

    getBaseDailyTarget: function(settingsObj) {
        const dayName = (typeof window.getPegasusActiveDayName === "function")
            ? window.getPegasusActiveDayName(settingsObj)
            : ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"][new Date().getDay()];

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
            case "UPPER_LOWER":
            case "IRON":
            default:
                return KCAL_WEIGHTS;
        }
    },

    getEffectiveDailyTarget: function(settingsObj) {
        const baseTarget = this.getBaseDailyTarget(settingsObj);
        const exerciseBurn = this.getTodayExerciseBurn();
        return this.calculateFinalDailyTarget(baseTarget, exerciseBurn, settingsObj);
    },

    syncStoredTargets: function(settingsObj) {
        const baseTarget = this.getBaseDailyTarget(settingsObj);
        const keys = this.getKeys();
        const exerciseBurn = this.getTodayExerciseBurn();
        const effectiveTarget = this.calculateFinalDailyTarget(baseTarget, exerciseBurn, settingsObj);
        localStorage.setItem(keys.todayKcal, String(baseTarget));
        localStorage.setItem('pegasus_effective_today_kcal', String(effectiveTarget));
        localStorage.setItem('pegasus_effective_today_date', this.getTodayDateStr());
        return baseTarget;
    },

    /* =========================================================
       INTERNAL HELPERS
       ========================================================= */
    getActiveWeightInput: function() {
        return (
            document.querySelector(".exercise[style*='76, 175, 80'] .weight-input") ||
            document.querySelector(".exercise .weight-input") ||
            document.querySelector(".weight-input")
        );
    },

    /* =========================================================
       SESSION TRACKING
       ========================================================= */
    resetSession: function() {
        const keys = this.getKeys();
        this.sessionKcal = 0;
        localStorage.setItem(keys.sessionKcal, "0.0");
        this.renderUI(0);
        console.log("🔄 PEGASUS METABOLIC: Session Counter Reset to 0.");
    },

    getMET: function(exerciseName, liftedWeight) {
        const name = String(exerciseName || "").toLowerCase();

        if (name.includes("ποδηλασία") || name.includes("cycling")) return 10.0;
        if (name.includes("προθέρμανση") || name.includes("warmup")) return 3.0;
        if (name.includes("stretching") || name.includes("διατάσεις") || name.includes("αποθεραπεία")) return 2.0;

        let baseMET = 7.0;
        if (liftedWeight > 0) {
            const loadRatio = liftedWeight / this.userWeight;
            baseMET += (loadRatio * 5);
        }
        return baseMET;
    },

    updateTracking: function(durationSeconds, exerciseName) {
        const safeExerciseName = String(exerciseName || "").trim();
        const keys = this.getKeys();

        const weightInput = this.getActiveWeightInput();
        let liftedWeight = weightInput ? parseFloat(weightInput.value) : 0;

        if (liftedWeight > 0 && safeExerciseName) {
            localStorage.setItem(`weight_ΑΓΓΕΛΟΣ_${safeExerciseName}_records`, String(liftedWeight));
        } else if (safeExerciseName) {
            liftedWeight = parseFloat(localStorage.getItem(`weight_ΑΓΓΕΛΟΣ_${safeExerciseName}_records`)) || 0;
        }

        const activeMET = this.getMET(safeExerciseName, liftedWeight);
        const durationMins = (parseFloat(durationSeconds) || 0) / 60;
        const kcalPerMin = (activeMET * 3.5 * this.userWeight) / 200;
        const addedKcal = parseFloat((kcalPerMin * durationMins).toFixed(4));

        if (isNaN(addedKcal) || addedKcal <= 0) return;

        this.sessionKcal += addedKcal;

        const currentSession = parseFloat(localStorage.getItem(keys.sessionKcal)) || 0;
        localStorage.setItem(keys.sessionKcal, (currentSession + addedKcal).toFixed(4));

        const currentWeekly = parseFloat(localStorage.getItem(keys.weeklyKcal)) || 0;
        localStorage.setItem(keys.weeklyKcal, (currentWeekly + addedKcal).toFixed(4));

        this.renderUI(this.sessionKcal);
        this.validateDay();
    },

    /* =========================================================
       UNIVERSAL UI RENDERER
       ========================================================= */
    renderUI: function(sessionValue) {
        const keys = this.getKeys();

        const engineSessionKcal = this.getEngineSessionKcal();
        const sVal = (sessionValue !== undefined)
            ? parseFloat(sessionValue)
            : (engineSessionKcal !== null
                ? parseFloat(engineSessionKcal || 0)
                : (parseFloat(localStorage.getItem(keys.sessionKcal)) || this.sessionKcal || 0));

        const effectiveTarget = this.getEffectiveDailyTarget();

        const kcalDesktop = document.querySelector(".kcal-value");
        const engineRunning = this.isWorkoutRunning();

        if (kcalDesktop && engineRunning) {
            kcalDesktop.textContent = sVal.toFixed(1);
        }

        const kcalMobile = document.getElementById("txtKcal");
        if (kcalMobile && window.PegasusDiet?.getLog) {
            const dateStr = (typeof window.PegasusDiet.getStrictDateStr === "function")
                ? window.PegasusDiet.getStrictDateStr()
                : this.getTodayDateStr();

            const log = window.PegasusDiet.getLog(dateStr) || [];
            let consumed = 0;

            log.forEach(item => {
                consumed += parseFloat(item.kcal || 0);
            });

            kcalMobile.textContent = `${Math.round(consumed)} / ${Math.round(effectiveTarget)}`;
        }
    },

    attachEngineHooks: function() {
        if (!window.PegasusEngine?.subscribe) return;
        if (this.unsubscribeEngine) return;

        this.unsubscribeEngine = window.PegasusEngine.subscribe((state, action) => {
            const actionType = action?.type || "";

            if (
                actionType.startsWith("PHASE_") ||
                actionType.startsWith("SET_") ||
                actionType.startsWith("WORKOUT_") ||
                actionType === "START_WORKOUT" ||
                actionType === "PAUSE_WORKOUT" ||
                actionType === "RESUME_FROM_PREP" ||
                actionType === "SELECT_DAY" ||
                actionType === "SYNC_WEIGHT" ||
                actionType === "SYNC_TURBO" ||
                actionType === "SYNC_MUTED" ||
                actionType === "BOOT_COMPLETE" ||
                actionType === "AUTO_INIT_TODAY"
            ) {
                this.renderUI();
            }
        });
    },

    /* =========================================================
       CALENDAR VALIDATION
       ========================================================= */
    validateDay: function() {
        const now = new Date();
        const keys = this.getKeys();

        if (now.getHours() >= 0 && now.getHours() < 4) {
            return;
        }

        const todayDate = this.getTodayWorkoutKey();
        const currentBurn = parseFloat(localStorage.getItem(keys.sessionKcal)) || 0;

        if (currentBurn <= 100) return;

        let history = JSON.parse(localStorage.getItem(keys.calendarHistory) || "{}");
        let workouts = JSON.parse(localStorage.getItem(keys.workoutDone) || "{}");

        history[todayDate] = {
            status: "completed",
            verified: true,
            kcal: currentBurn
        };

        workouts[todayDate] = true;

        localStorage.setItem(keys.calendarHistory, JSON.stringify(history));
        localStorage.setItem(keys.workoutDone, JSON.stringify(workouts));
    }
};

/* =========================================================
   GLOBAL BRIDGES
   ========================================================= */
window.PegasusMetabolic = PegasusMetabolic;
window.trackSetCalories = PegasusMetabolic.updateTracking.bind(PegasusMetabolic);

window.getPegasusTodayDateStr = PegasusMetabolic.getTodayDateStr.bind(PegasusMetabolic);
window.getPegasusTodayCardioOffset = PegasusMetabolic.getTodayCardioOffset.bind(PegasusMetabolic);
window.getPegasusWorkoutKcalForDate = PegasusMetabolic.getWorkoutBurnForDate.bind(PegasusMetabolic);
window.getPegasusTodayWorkoutKcal = PegasusMetabolic.getTodayWorkoutBurn.bind(PegasusMetabolic);
window.getPegasusExerciseBurnForDate = PegasusMetabolic.getExerciseBurnForDate.bind(PegasusMetabolic);
window.getPegasusTodayExerciseBurn = PegasusMetabolic.getTodayExerciseBurn.bind(PegasusMetabolic);
window.getPegasusBaseDailyTarget = PegasusMetabolic.getBaseDailyTarget.bind(PegasusMetabolic);
window.getPegasusEffectiveDailyTarget = PegasusMetabolic.getEffectiveDailyTarget.bind(PegasusMetabolic);
window.getPegasusBodyGoalMode = PegasusMetabolic.getBodyGoalMode.bind(PegasusMetabolic);
window.getPegasusBodyGoalLabel = PegasusMetabolic.getBodyGoalLabel.bind(PegasusMetabolic);
window.getPegasusExerciseRefeedForTarget = PegasusMetabolic.getExerciseRefeedForTarget.bind(PegasusMetabolic);
window.getPegasusFinalDailyTargetFromBurn = PegasusMetabolic.calculateFinalDailyTarget.bind(PegasusMetabolic);

/* =========================================================
   INITIAL BOOT
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
    PegasusMetabolic.syncStoredTargets();
    PegasusMetabolic.renderUI();

    setTimeout(() => {
        PegasusMetabolic.attachEngineHooks();
        PegasusMetabolic.renderUI();
    }, 200);
});
