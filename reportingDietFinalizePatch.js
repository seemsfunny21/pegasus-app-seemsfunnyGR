/* ==========================================================================
   PEGASUS REPORTING DIET FINALIZE PATCH - v1.0
   Protocol: Previous-Day Nutrition Refresh For Morning Email
   Status: STABLE | FIXED: Morning report now refreshes yesterday food log/cardio before send
   ========================================================================== */

(function () {
    const M = window.PegasusManifest || window.M || {};

    function parseDisplayDate(displayDateStr) {
        if (!displayDateStr || typeof displayDateStr !== 'string') return null;
        const parts = displayDateStr.split('/');
        if (parts.length !== 3) return null;
        const [dd, mm, yyyy] = parts.map(v => parseInt(v, 10));
        if (!dd || !mm || !yyyy) return null;
        const dt = new Date(yyyy, mm - 1, dd, 12, 0, 0, 0);
        return Number.isNaN(dt.getTime()) ? null : dt;
    }

    function getRecoveryForDate(displayDateStr) {
        const dt = parseDisplayDate(displayDateStr);
        const day = dt ? dt.getDay() : null;
        const isRecovery = day === 1 || day === 4;
        return isRecovery
            ? { msg: 'Recovery Day Active', nutrition: 'Focus on hydration & stretching' }
            : { msg: 'Training Day', nutrition: 'High protein intake required' };
    }

    function getFoodSummaryForDate(displayDateStr) {
        const logPrefix = M?.nutrition?.log_prefix || 'food_log_';
        let items = [];

        try {
            const raw = localStorage.getItem(logPrefix + displayDateStr);
            items = raw ? JSON.parse(raw) : [];
        } catch (e) {
            items = [];
        }

        if (!Array.isArray(items)) items = [];

        const totalFoodKcal = items.reduce((sum, item) => sum + (parseFloat(item?.kcal) || 0), 0);
        const totalFoodProtein = items.reduce((sum, item) => sum + (parseFloat(item?.protein) || 0), 0);

        return {
            items,
            totalFoodKcal,
            totalFoodProtein,
            foodSummary: items.length > 0
                ? items.map(item => `• ${item?.name || 'Food'} (${parseFloat(item?.kcal || 0) || 0}kcal)`).join('\n')
                : 'No food logged'
        };
    }

    function getCardioSummaryForDate(reporting, displayDateStr) {
        const cardioData = typeof reporting.getCardioSummaryForDate === 'function'
            ? reporting.getCardioSummaryForDate(displayDateStr)
            : null;

        return cardioData
            ? `🚲 ${cardioData.km || 0}km${cardioData.route ? ` (${cardioData.route})` : ''}${cardioData.kcal ? ` | ${cardioData.kcal} kcal` : ''}`
            : 'No cardio';
    }

    function enrichPendingReportForReportDate(reporting, pending) {
        if (!pending || !pending.templateParams) return pending;

        const reportDateDisplay = pending.reportDateDisplay || pending.dateSent || pending.templateParams.workout_date;
        if (!reportDateDisplay) return pending;

        const nutrition = getFoodSummaryForDate(reportDateDisplay);
        const recovery = getRecoveryForDate(reportDateDisplay);
        const cardioSummary = getCardioSummaryForDate(reporting, reportDateDisplay);

        const enriched = JSON.parse(JSON.stringify(pending));
        enriched.reportDateDisplay = reportDateDisplay;
        enriched.templateParams.workout_date = reportDateDisplay;
        enriched.templateParams.food_summary = nutrition.foodSummary;
        enriched.templateParams.total_food_kcal = nutrition.totalFoodKcal;
        enriched.templateParams.food_protein_total = nutrition.totalFoodProtein;
        enriched.templateParams.cardio_activity = cardioSummary;
        enriched.templateParams.recovery_status = recovery.msg || 'Updated';
        enriched.templateParams.nutrition_advice = recovery.nutrition || 'Maintain macro balance';
        enriched.templateParams.report_refresh_mode = 'previous-day-finalized';
        enriched.nutritionRefreshedAt = new Date().toISOString();

        return enriched;
    }

    function installPatch() {
        if (!window.PegasusReporting || window.PegasusReporting.__dietFinalizePatchInstalled) return;

        const reporting = window.PegasusReporting;
        const originalPrepare = typeof reporting.prepareAndSaveReport === 'function'
            ? reporting.prepareAndSaveReport.bind(reporting)
            : null;
        const originalCheck = typeof reporting.checkAndSendMorningReport === 'function'
            ? reporting.checkAndSendMorningReport.bind(reporting)
            : null;

        reporting.enrichPendingReportForReportDate = function (pending) {
            return enrichPendingReportForReportDate(this, pending);
        };

        reporting.refreshPendingNutritionNow = function () {
            try {
                const raw = localStorage.getItem(this.pendingReportKey);
                if (!raw) return null;
                const pending = JSON.parse(raw);
                const refreshed = this.enrichPendingReportForReportDate(pending);
                localStorage.setItem(this.pendingReportKey, JSON.stringify(refreshed));
                return refreshed;
            } catch (e) {
                console.warn('PEGASUS REPORT DIET PATCH: Refresh pending nutrition failed.', e);
                return null;
            }
        };

        if (originalPrepare) {
            reporting.prepareAndSaveReport = function (kcal, sessionData = null) {
                const result = originalPrepare(kcal, sessionData);
                try {
                    const raw = localStorage.getItem(this.pendingReportKey);
                    if (raw) {
                        const pending = JSON.parse(raw);
                        pending.reportDateDisplay = pending.reportDateDisplay || pending.dateSent || pending?.templateParams?.workout_date;
                        pending.pendingNutritionMode = 'refresh-on-send';
                        localStorage.setItem(this.pendingReportKey, JSON.stringify(pending));
                    }
                } catch (e) {
                    console.warn('PEGASUS REPORT DIET PATCH: Could not mark pending report for nutrition refresh.', e);
                }
                return result;
            };
        }

        if (originalCheck) {
            reporting.checkAndSendMorningReport = function (forceSend = false) {
                try {
                    this.refreshPendingNutritionNow();
                } catch (e) {
                    console.warn('PEGASUS REPORT DIET PATCH: Pre-send nutrition refresh skipped.', e);
                }
                return originalCheck(forceSend);
            };
        }

        reporting.__dietFinalizePatchInstalled = true;
        console.log('🍽️ PEGASUS REPORT DIET PATCH: Previous-day nutrition finalizer active.');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', installPatch, { once: true });
    } else {
        installPatch();
    }
})();
