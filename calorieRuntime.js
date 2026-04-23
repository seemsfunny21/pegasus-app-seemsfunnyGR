/* ==========================================================================
   PEGASUS CALORIE RUNTIME
   Date helpers, kcal UI control, and metabolic target helpers.
   ========================================================================== */

/* ===== 2.4 KCAL HELPERS ===== */
window.getPegasusTodayDateStr = function() {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

window.getPegasusLocalDateKey = function() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function getPegasusTimerConfig() {
    const raw = window.pegasusTimerConfig || {};
    const normalizePhase = (value, fallback) => {
        const parsed = parseInt(value, 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    };

    const normalized = {
        prep: normalizePhase(raw.prep, 10),
        work: normalizePhase(raw.work, 45),
        rest: normalizePhase(raw.rest, 60)
    };

    window.pegasusTimerConfig = normalized;
    return normalized;
}

function getPhaseDefaultTime(targetPhase) {
    const config = getPegasusTimerConfig();
    return (targetPhase === 0) ? config.prep : (targetPhase === 1 ? config.work : config.rest);
}

function getPhaseStartingSeconds(targetPhase, currentRemaining) {
    const fallback = getPhaseDefaultTime(targetPhase);
    const parsedRemaining = Number(currentRemaining);
    if (Number.isFinite(parsedRemaining) && parsedRemaining > 0) {
        return parsedRemaining;
    }
    return fallback;
}

window.getPegasusTodayCardioOffset = function() {
    const dateStr = window.getPegasusTodayDateStr();

    const unified = parseFloat(localStorage.getItem("pegasus_cardio_kcal_" + dateStr));
    if (!isNaN(unified)) return unified;

    const legacy = parseFloat(localStorage.getItem((M?.workout?.cardio_offset || "pegasus_cardio_offset_sets") + "_" + dateStr));
    if (!isNaN(legacy)) return legacy;

    return 0;
};

window.getPegasusBaseDailyTarget = function(settingsObj) {
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
        case "IRON":
        case "UPPER_LOWER":
        default:
            return KCAL_WEIGHTS;
    }
};

window.getPegasusEffectiveDailyTarget = function(settingsObj) {
    const baseTarget = window.getPegasusBaseDailyTarget(settingsObj);
    const cardioOffset = window.getPegasusTodayCardioOffset();
    return Math.round(baseTarget + cardioOffset);
};

/* ===== 2.5 DYNAMIC UI KCAL CONTROLLER ===== */
window.updateKcalUI = function() {
    const kcalDisplay = document.querySelector(".kcal-value");
    const kcalLabel = document.querySelector(".kcal-label");
    if (!kcalDisplay) return;

    const uiState = (typeof window.getPegasusUiState === "function")
        ? window.getPegasusUiState()
        : null;
    const summary = uiState?.summary || ((typeof window.getPegasusRuntimeSummary === "function")
        ? window.getPegasusRuntimeSummary()
        : { running, sessionKcal: sessionActiveKcal });

    const isWorkoutActive = !!summary.running;
    const liveSessionKcal = typeof summary.sessionKcal === "number" ? summary.sessionKcal : sessionActiveKcal;

    if (isWorkoutActive) {
        kcalDisplay.textContent = parseFloat(liveSessionKcal || 0).toFixed(1);
        kcalDisplay.style.color = "#FFC107";
        if (kcalLabel) kcalLabel.textContent = "KCAL ΠΡΟΠΟΝΗΣΗΣ";
    } else {
        const dailyTarget = (typeof window.getPegasusEffectiveDailyTarget === "function")
            ? window.getPegasusEffectiveDailyTarget()
            : (localStorage.getItem('pegasus_today_kcal') || "2100");

        kcalDisplay.textContent = dailyTarget;
        kcalDisplay.style.color = "#4CAF50";
        if (kcalLabel) kcalLabel.textContent = "ΣΤΟΧΟΣ ΗΜΕΡΑΣ (KCAL)";
    }
};

/* ===== 7.5 STRICT METABOLIC AUTO-ADJUSTER (MULTI-PLAN) ===== */
window._isCalculatingTarget = false;

window.calculatePegasusDailyTarget = function() {
    const storedEffective = window.getPegasusEffectiveDailyTarget
        ? window.getPegasusEffectiveDailyTarget()
        : parseFloat(localStorage.getItem(M?.diet?.todayKcal || 'pegasus_today_kcal')) || 2100;

    if (window._isCalculatingTarget) {
        return storedEffective;
    }

    window._isCalculatingTarget = true;

    const settings = typeof window.getPegasusSettings === "function"
        ? window.getPegasusSettings()
        : { activeSplit: 'IRON' };

    const dynamicProtein = window.calculatePegasusBioMetrics(settings);
    const baseTarget = window.getPegasusBaseDailyTarget(settings);
    const cardioOffset = window.getPegasusTodayCardioOffset();
    const effectiveTarget = Math.round(baseTarget + cardioOffset);

    localStorage.setItem(M?.diet?.todayKcal || 'pegasus_today_kcal', baseTarget);

    console.log(`🏛️ PEGASUS OS [${settings.activeSplit || 'IRON'}]: Στόχος Βάσης: ${baseTarget} kcal | Cardio: +${cardioOffset} | Τελικός Στόχος: ${effectiveTarget} kcal | Πρωτεΐνη: ${dynamicProtein}g`);

    window._isCalculatingTarget = false;
    return effectiveTarget;
};

/* ===== 7.6 AUTOMATED BIO-METRIC CALCULATOR ===== */
window.calculatePegasusBioMetrics = function(settingsObj) {
    const currentSettings = settingsObj || (typeof window.getPegasusSettings === "function" ? window.getPegasusSettings() : null);

    const weight = currentSettings ? currentSettings.weight : 74;
    const multiplier = 2.17;
    const autoProtein = Math.round(weight * multiplier);

    localStorage.setItem(M?.diet?.goalProtein || 'pegasus_goal_protein', autoProtein);
    localStorage.setItem(M?.diet?.todayProtein || 'pegasus_today_protein', autoProtein);

    return autoProtein;
};
