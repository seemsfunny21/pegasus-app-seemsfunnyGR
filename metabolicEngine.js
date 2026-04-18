/* =============================================================
   PEGASUS UNIFIED METABOLIC ENGINE - v16.5 (SHARED TARGET CORE)
   Merged: calories.js + metabolic.js
   Protocol: Strict Session Isolation, Midnight Guard & Shared Target Logic
   Status: FINAL STABLE | FIXED: DUPLICATE TARGET LOGIC & MOBILE/DESKTOP ALIGNMENT
   ============================================================= */

const PegasusMetabolic = {
    sessionKcal: 0,

    get userWeight() {
        return parseFloat(localStorage.getItem(window.PegasusManifest?.user?.weight || "pegasus_weight")) || 74;
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

        const canonicalPrefix = window.PegasusManifest?.workout?.cardio_daily_prefix || "pegasus_cardio_kcal_";
        const canonical = parseFloat(localStorage.getItem(canonicalPrefix + dateStr));
        if (!isNaN(canonical)) return canonical;

        const legacyBase = window.PegasusManifest?.workout?.cardio_offset || "pegasus_cardio_offset_sets";
        const legacy = parseFloat(localStorage.getItem(legacyBase + "_" + dateStr));
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
        const todayKcalKey = window.PegasusManifest?.diet?.todayKcal || "pegasus_today_kcal";
        localStorage.setItem(todayKcalKey, baseTarget);
        return baseTarget;
    },

    /* =========================================================
       SESSION TRACKING
       ========================================================= */
    resetSession: function() {
        this.sessionKcal = 0;
        localStorage.setItem(window.PegasusManifest?.diet?.sessionKcal || "pegasus_session_kcal", "0.0");
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
        const weightInput = document.querySelector(".weight-input");
        let liftedWeight = weightInput ? parseFloat(weightInput.value) : 0;

        if (liftedWeight > 0) {
            localStorage.setItem(`weight_ΑΓΓΕΛΟΣ_${String(exerciseName).trim()}_records`, liftedWeight);
        } else {
            liftedWeight = parseFloat(localStorage.getItem(`weight_ΑΓΓΕΛΟΣ_${String(exerciseName).trim()}_records`)) || 0;
        }

        const activeMET = this.getMET(exerciseName, liftedWeight);
        const durationMins = durationSeconds / 60;
        const kcalPerMin = (activeMET * 3.5 * this.userWeight) / 200;
        const addedKcal = parseFloat((kcalPerMin * durationMins).toFixed(4));

        this.sessionKcal += addedKcal;

        const sessionKey = window.PegasusManifest?.diet?.sessionKcal || "pegasus_session_kcal";
        const weeklyKey = window.PegasusManifest?.diet?.weeklyKcal || "pegasus_weekly_kcal";

        let currentSession = parseFloat(localStorage.getItem(sessionKey)) || 0;
        localStorage.setItem(sessionKey, (currentSession + addedKcal).toFixed(4));

        let currentWeekly = parseFloat(localStorage.getItem(weeklyKey)) || 0;
        localStorage.setItem(weeklyKey, (currentWeekly + addedKcal).toFixed(4));

        this.renderUI(this.sessionKcal);
        this.validateDay();
    },

    /* =========================================================
       UNIVERSAL UI RENDERER
       ========================================================= */
    renderUI: function(sessionValue) {
        const sVal = (sessionValue !== undefined) ? parseFloat(sessionValue) : (parseFloat(localStorage.getItem(window.PegasusManifest?.diet?.sessionKcal || "pegasus_session_kcal")) || this.sessionKcal);
        const effectiveTarget = this.getEffectiveDailyTarget();

        // Desktop widget: session kcal only when workout is active,
        // otherwise app.js/updateKcalUI will own final top-widget rendering.
        const kcalDesktop = document.querySelector(".kcal-value");
        if (kcalDesktop && window.PegasusEngine?.getState?.().running) {
            kcalDesktop.textContent = sVal.toFixed(1);
        }

        // Mobile diet card: consumed / effective target
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

        if (now.getHours() >= 0 && now.getHours() < 4) {
            return;
        }

        const todayDate = this.getTodayWorkoutKey();
        let history = JSON.parse(localStorage.getItem(window.PegasusManifest?.workout?.calendarHistory || 'pegasus_calendar_history') || "{}");
        let workouts = JSON.parse(localStorage.getItem(window.PegasusManifest?.workout?.done || 'pegasus_workouts_done') || "{}");

        const currentBurn = parseFloat(localStorage.getItem(window.PegasusManifest?.diet?.sessionKcal || "pegasus_session_kcal")) || 0;

        if (currentBurn > 100) {
            history[todayDate] = { status: "completed", verified: true, kcal: currentBurn };
            workouts[todayDate] = true;

            localStorage.setItem(window.PegasusManifest?.workout?.calendarHistory || 'pegasus_calendar_history', JSON.stringify(history));
            localStorage.setItem(window.PegasusManifest?.workout?.done || 'pegasus_workouts_done', JSON.stringify(workouts));
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

// Initial render
document.addEventListener('DOMContentLoaded', () => {
    PegasusMetabolic.syncStoredTargets();
    PegasusMetabolic.renderUI();
});
