/* =============================================================
   PEGASUS UNIFIED METABOLIC ENGINE - v16.8 (SAFE SHARED TARGET CORE)
   Merged: calories.js + metabolic.js
   Protocol: Strict Session Isolation, Midnight Guard & Shared Target Logic
   Status: FINAL STABLE | FIXED: ACTIVE INPUT TARGETING + STORAGE SAFETY
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
            goalKcal: window.PegasusManifest?.diet?.goalKcal || "pegasus_goal_kcal",
            todayKcal: window.PegasusManifest?.diet?.todayKcal || "pegasus_today_kcal",
            effectiveTodayKcal: window.PegasusManifest?.diet?.effectiveTodayKcal || "pegasus_effective_today_kcal",
            effectiveTodayDate: window.PegasusManifest?.diet?.effectiveTodayDate || "pegasus_effective_today_date",
            todayProtein: window.PegasusManifest?.diet?.todayProtein || "pegasus_today_protein",
            sessionKcal: window.PegasusManifest?.diet?.session_kcal || "pegasus_session_kcal",
            weeklyKcal: window.PegasusManifest?.diet?.weeklyKcal || window.PegasusManifest?.diet?.weekly_kcal || "pegasus_weekly_kcal",
            workoutDone: window.PegasusManifest?.workout?.done || "pegasus_workouts_done",
            cardioOffsetLegacy: window.PegasusManifest?.workout?.cardio_offset || "pegasus_cardio_offset_sets",
            calendarHistory: window.PegasusManifest?.workout?.calendarHistory || "pegasus_calendar_history",
            cardioDailyPrefix: window.PegasusManifest?.workout?.cardio_daily_prefix || "pegasus_cardio_kcal_"
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

    getTodayCardioOffset: function() {
        const dateStr = this.getTodayDateStr();
        const keys = this.getKeys();

        const canonical = parseFloat(localStorage.getItem(keys.cardioDailyPrefix + dateStr));
        if (!isNaN(canonical)) return canonical;

        const legacy = parseFloat(localStorage.getItem(keys.cardioOffsetLegacy + "_" + dateStr));
        if (!isNaN(legacy)) return legacy;

        return 0;
    },

    getRestDailyTarget: function() {
        return 2100;
    },

    getTodayDayName: function() {
        return ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"][new Date().getDay()];
    },

    getTodayProgramEntries: function(dayName) {
        const targetDay = dayName || this.getTodayDayName();
        let entries = Array.isArray(window.program?.[targetDay]) ? window.program[targetDay].map(ex => ({ ...ex })) : [];
        try {
            if (window.PegasusOptimizer?.apply && entries.length) {
                entries = window.PegasusOptimizer.apply(targetDay, entries).map(ex => ({ ...ex }));
            }
        } catch (e) {}
        return entries;
    },

    getStrengthWorkoutLoadInfo: function(settingsObj) {
        const dayName = this.getTodayDayName();
        const settings = settingsObj || (typeof window.getPegasusSettings === "function" ? window.getPegasusSettings() : { activeSplit: "IRON" });
        const activePlan = settings?.activeSplit || "IRON";
        const entries = this.getTodayProgramEntries(dayName);
        const strengthEntries = entries.filter(ex => {
            const name = String(ex?.name || '').toLowerCase();
            if (!name) return false;
            if (name.includes('stretch')) return false;
            if (name.includes('cycling') || name.includes('ποδηλα')) return false;
            if (name.includes('ems')) return false;
            return (parseFloat(ex?.adjustedSets || ex?.sets || 0) || 0) > 0;
        });

        if (!strengthEntries.length) {
            localStorage.setItem('pegasus_strength_bonus_today', '0');
            localStorage.setItem('pegasus_strength_load_today', '0');
            return {
                dayName,
                activePlan,
                exerciseCount: 0,
                totalSets: 0,
                weightedLoad: 0,
                bonus: 0,
                source: 'none',
                exercises: []
            };
        }

        const domWeights = {};
        document.querySelectorAll('.exercise .weight-input').forEach(input => {
            const name = String(input?.getAttribute('data-name') || '').trim();
            const val = parseFloat(input?.value);
            if (name && Number.isFinite(val) && val >= 0) domWeights[name] = val;
        });

        const exerciseSummaries = strengthEntries.map(ex => {
            const cleanName = String(ex?.name || '').trim();
            const sets = Math.max(1, Math.round(parseFloat(ex?.adjustedSets || ex?.sets || 1) || 1));
            let weight = 0;
            if (Object.prototype.hasOwnProperty.call(domWeights, cleanName)) {
                weight = Number(domWeights[cleanName]) || 0;
            } else if (typeof window.getSavedWeight === 'function') {
                weight = parseFloat(window.getSavedWeight(cleanName)) || 0;
            }
            if (!weight) weight = parseFloat(ex?.weight || 0) || 0;

            const nameLower = cleanName.toLowerCase();
            let factor = 1.0;
            if (/(leg|squat|extension|lunge|calf|hip|deadlift|rower)/i.test(nameLower)) factor = 1.2;
            else if (/(press|row|pulldown|pushup|fly|chest|lat)/i.test(nameLower)) factor = 1.1;
            else if (/(bicep|tricep|curl|crunch|plank|raise|abs|upright)/i.test(nameLower)) factor = 0.9;

            const load = Math.max(0, weight) * sets * factor;
            return { name: cleanName, sets, weight, factor, load };
        });

        const exerciseCount = exerciseSummaries.length;
        const totalSets = exerciseSummaries.reduce((acc, ex) => acc + ex.sets, 0);
        const weightedLoad = Math.round(exerciseSummaries.reduce((acc, ex) => acc + ex.load, 0));
        let bonus = Math.round(180 + (exerciseCount * 20) + (totalSets * 12) + (weightedLoad / 5));
        bonus = Math.max(300, Math.min(950, bonus));

        localStorage.setItem('pegasus_strength_bonus_today', String(bonus));
        localStorage.setItem('pegasus_strength_load_today', String(weightedLoad));

        return {
            dayName,
            activePlan,
            exerciseCount,
            totalSets,
            weightedLoad,
            bonus,
            source: Object.keys(domWeights).length ? 'dom+saved' : 'saved+program',
            exercises: exerciseSummaries
        };
    },

    getStoredTodayKcalTarget: function() {
        const keys = this.getKeys();

        if (typeof window.getPegasusManualKcalTarget === "function") {
            const manual = parseFloat(window.getPegasusManualKcalTarget());
            return !isNaN(manual) ? manual : 0;
        }

        const manual = parseFloat(localStorage.getItem(keys.goalKcal));
        if (!isNaN(manual) && manual >= 1000 && manual <= 6000) return manual;

        const legacy = parseFloat(localStorage.getItem(keys.todayKcal));
        // Legacy todayKcal may have been polluted by runtime-computed targets.
        return (!isNaN(legacy) && legacy >= 1000 && legacy <= 3200) ? legacy : 0;
    },

    getCalculatedBaseDailyTarget: function(settingsObj) {
        const settings = settingsObj || (
            typeof window.getPegasusSettings === "function"
                ? window.getPegasusSettings()
                : { activeSplit: "IRON" }
        );

        const activePlan = settings?.activeSplit || "IRON";
        const dayName = this.getTodayDayName();
        const restBase = this.getRestDailyTarget();

        if (activePlan === 'EMS_ONLY' && dayName === 'Τετάρτη') return 2700;

        const strengthInfo = this.getStrengthWorkoutLoadInfo(settings);
        if (strengthInfo.exerciseCount > 0) {
            return Math.round(restBase + strengthInfo.bonus);
        }

        return restBase;
    },

    getBaseDailyTarget: function(settingsObj) {
        const calculatedBase = this.getCalculatedBaseDailyTarget(settingsObj);
        const cardio = this.getTodayCardioOffset();
        const storedToday = this.getStoredTodayKcalTarget();
        const normalizedStoredBase = storedToday > 0 ? Math.max(0, storedToday - cardio) : 0;
        return Math.round(Math.max(calculatedBase, normalizedStoredBase));
    },

    getEffectiveDailyTarget: function(settingsObj) {
        const calculatedEffective = Math.round(this.getCalculatedBaseDailyTarget(settingsObj) + this.getTodayCardioOffset());
        const storedToday = this.getStoredTodayKcalTarget();
        return Math.round(Math.max(calculatedEffective, storedToday || 0));
    },

    syncStoredTargets: function(settingsObj) {
        const keys = this.getKeys();
        const stickyTarget = this.getEffectiveDailyTarget(settingsObj);
        localStorage.setItem(keys.effectiveTodayKcal, String(stickyTarget));
        localStorage.setItem(keys.effectiveTodayDate, this.getTodayWorkoutKey());
        return stickyTarget;
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
window.getPegasusRestDailyTarget = PegasusMetabolic.getRestDailyTarget.bind(PegasusMetabolic);
window.getPegasusBaseDailyTarget = PegasusMetabolic.getBaseDailyTarget.bind(PegasusMetabolic);
window.getPegasusStrengthWorkoutLoadInfo = PegasusMetabolic.getStrengthWorkoutLoadInfo.bind(PegasusMetabolic);
window.getPegasusEffectiveDailyTarget = PegasusMetabolic.getEffectiveDailyTarget.bind(PegasusMetabolic);

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
