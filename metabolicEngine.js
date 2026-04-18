/* =============================================================
   PEGASUS UNIFIED METABOLIC ENGINE - v16.6 (SAFE SHARED TARGET CORE)
   Merged: calories.js + metabolic.js
   Protocol: Strict Session Isolation, Midnight Guard & Shared Target Logic
   Status: FINAL STABLE | FIXED: MANIFEST KEY SAFETY + UI ALIGNMENT + STORAGE GUARDS
   ============================================================= */

const PegasusMetabolic = {
    sessionKcal: 0,

    get userWeight() {
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
            weeklyKcal: window.PegasusManifest?.diet?.weekly_kcal || "pegasus_weekly_kcal",
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

    getBaseDailyTarget: function(settingsObj) {
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
            case "UPPER_LOWER":
            case "IRON":
            default:
                return KCAL_WEIGHTS;
        }
    },

    getEffectiveDailyTarget: function(settingsObj) {
        return Math.round(this.getBaseDailyTarget(settingsObj) + this.getTodayCardioOffset());
    },

    syncStoredTargets: function(settingsObj) {
        const baseTarget = this.getBaseDailyTarget(settingsObj);
        const keys = this.getKeys();
        localStorage.setItem(keys.todayKcal, String(baseTarget));
        return baseTarget;
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

        const weightInput = document.querySelector(".weight-input");
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

        let currentSession = parseFloat(localStorage.getItem(keys.sessionKcal)) || 0;
        localStorage.setItem(keys.sessionKcal, (currentSession + addedKcal).toFixed(4));

        let currentWeekly = parseFloat(localStorage.getItem(keys.weeklyKcal)) || 0;
        localStorage.setItem(keys.weeklyKcal, (currentWeekly + addedKcal).toFixed(4));

        this.renderUI(this.sessionKcal);
        this.validateDay();
    },

    /* =========================================================
       UNIVERSAL UI RENDERER
       ========================================================= */
    renderUI: function(sessionValue) {
        const keys = this.getKeys();

        const sVal = (sessionValue !== undefined)
            ? parseFloat(sessionValue)
            : (parseFloat(localStorage.getItem(keys.sessionKcal)) || this.sessionKcal || 0);

        const effectiveTarget = this.getEffectiveDailyTarget();

        // Desktop top widget:
        // δείχνει session kcal μόνο όταν τρέχει workout, αλλιώς το app.js/updateKcalUI αναλαμβάνει το ημερήσιο target
        const kcalDesktop = document.querySelector(".kcal-value");
        const engineRunning = !!window.PegasusEngine?.getState?.().running;

        if (kcalDesktop && engineRunning) {
            kcalDesktop.textContent = sVal.toFixed(1);
        }

        // Mobile diet card:
        // consumed / effective target
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

    /* =========================================================
       CALENDAR VALIDATION
       ========================================================= */
    validateDay: function() {
        const now = new Date();
        const keys = this.getKeys();

        // Midnight guard
        if (now.getHours() >= 0 && now.getHours() < 4) {
            return;
        }

        const todayDate = this.getTodayWorkoutKey();
        let history = JSON.parse(localStorage.getItem(keys.calendarHistory) || "{}");
        let workouts = JSON.parse(localStorage.getItem(keys.workoutDone) || "{}");

        const currentBurn = parseFloat(localStorage.getItem(keys.sessionKcal)) || 0;

        if (currentBurn > 100) {
            history[todayDate] = {
                status: "completed",
                verified: true,
                kcal: currentBurn
            };

            workouts[todayDate] = true;

            localStorage.setItem(keys.calendarHistory, JSON.stringify(history));
            localStorage.setItem(keys.workoutDone, JSON.stringify(workouts));
        }
    }
};

/* =========================================================
   GLOBAL BRIDGES
   ========================================================= */
window.PegasusMetabolic = PegasusMetabolic;
window.trackSetCalories = PegasusMetabolic.updateTracking.bind(PegasusMetabolic);

// Canonical shared helpers for all modules
window.getPegasusTodayDateStr = PegasusMetabolic.getTodayDateStr.bind(PegasusMetabolic);
window.getPegasusTodayCardioOffset = PegasusMetabolic.getTodayCardioOffset.bind(PegasusMetabolic);
window.getPegasusBaseDailyTarget = PegasusMetabolic.getBaseDailyTarget.bind(PegasusMetabolic);
window.getPegasusEffectiveDailyTarget = PegasusMetabolic.getEffectiveDailyTarget.bind(PegasusMetabolic);

/* =========================================================
   INITIAL BOOT
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
    PegasusMetabolic.syncStoredTargets();
    PegasusMetabolic.renderUI();
});
