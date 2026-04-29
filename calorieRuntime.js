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

window.getPegasusRestDailyTarget = function() {
    if (window.PegasusMetabolic?.getRestDailyTarget) return window.PegasusMetabolic.getRestDailyTarget();
    return 2100;
};

window.getPegasusBaseDailyTarget = function(settingsObj) {
    if (window.PegasusMetabolic?.getBaseDailyTarget) return window.PegasusMetabolic.getBaseDailyTarget(settingsObj);
    return window.getPegasusRestDailyTarget();
};

window.getPegasusStrengthWorkoutLoadInfo = function(settingsObj) {
    if (window.PegasusMetabolic?.getStrengthWorkoutLoadInfo) return window.PegasusMetabolic.getStrengthWorkoutLoadInfo(settingsObj);
    return { exerciseCount: 0, totalSets: 0, weightedLoad: 0, bonus: 0, source: 'fallback', exercises: [] };
};

window.getPegasusEffectiveDailyTarget = function(settingsObj) {
    if (window.PegasusMetabolic?.getEffectiveDailyTarget) return window.PegasusMetabolic.getEffectiveDailyTarget(settingsObj);
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
            : (localStorage.getItem(M?.diet?.effectiveTodayKcal || 'pegasus_effective_today_kcal') || localStorage.getItem('pegasus_today_kcal') || "2100");

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
        : parseFloat(localStorage.getItem(M?.diet?.effectiveTodayKcal || 'pegasus_effective_today_kcal')) || parseFloat(localStorage.getItem(M?.diet?.todayKcal || 'pegasus_today_kcal')) || 2100;

    if (window._isCalculatingTarget) {
        return storedEffective;
    }

    window._isCalculatingTarget = true;

    const settings = typeof window.getPegasusSettings === "function"
        ? window.getPegasusSettings()
        : { activeSplit: 'IRON' };

    const dynamicProtein = window.calculatePegasusBioMetrics(settings);
    const strengthInfo = window.getPegasusStrengthWorkoutLoadInfo ? window.getPegasusStrengthWorkoutLoadInfo(settings) : { bonus: 0, weightedLoad: 0, exerciseCount: 0, totalSets: 0 };
    const baseTarget = window.getPegasusBaseDailyTarget(settings);
    const cardioOffset = window.getPegasusTodayCardioOffset();
    const effectiveTarget = Math.round(baseTarget + cardioOffset);

    const effectiveKcalKey = M?.diet?.effectiveTodayKcal || 'pegasus_effective_today_kcal';
    localStorage.setItem(effectiveKcalKey, String(effectiveTarget));
    localStorage.setItem(M?.diet?.effectiveTodayDate || 'pegasus_effective_today_date', window.getPegasusLocalDateKey ? window.getPegasusLocalDateKey() : new Date().toISOString().slice(0, 10));
    localStorage.setItem('pegasus_strength_bonus_today', String(strengthInfo?.bonus || 0));
    localStorage.setItem('pegasus_strength_load_today', String(strengthInfo?.weightedLoad || 0));

    console.log(`🏛️ PEGASUS OS [${settings.activeSplit || 'IRON'}]: Βάση Ξεκούρασης: ${window.getPegasusRestDailyTarget ? window.getPegasusRestDailyTarget() : 2100} kcal | Strength Bonus: +${strengthInfo?.bonus || 0} | Cardio: +${cardioOffset} | Τελικός Στόχος: ${effectiveTarget} kcal | Πρωτεΐνη: ${dynamicProtein}g`);
    console.log(`💾 PEGASUS TARGET STORE: Saved effective target ${effectiveTarget} kcal to ${effectiveKcalKey}`);

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
