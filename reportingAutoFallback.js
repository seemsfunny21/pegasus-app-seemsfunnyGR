/* ==========================================================================
   PEGASUS REPORTING AUTO FALLBACK - v1.1
   Protocol: Auto morning email sends yesterday's report. Manual EMAIL sends
             today's current report from saved daily logs without consuming any
             pending previous-day report.
   Status: STABLE | FIXED: manual and automatic report flows are separated.
   ========================================================================== */

(function () {
    const VERSION = 'v1.1';
    const INSTALL_FLAG = '__autoFallbackPatchInstalled';

    function getManifest() {
        return window.PegasusManifest || window.M || {};
    }

    function pad2(value) {
        return String(value).padStart(2, '0');
    }

    function getDateParts(dateObj) {
        const safeDate = (dateObj instanceof Date && !Number.isNaN(dateObj.getTime())) ? dateObj : new Date();
        const d = pad2(safeDate.getDate());
        const m = pad2(safeDate.getMonth() + 1);
        const y = safeDate.getFullYear();
        return {
            d,
            m,
            y,
            display: `${d}/${m}/${y}`,
            subjectSafe: `${d}-${m}-${y}`,
            workoutKey: `${y}-${m}-${d}`
        };
    }

    function addDays(dateObj, offset) {
        const d = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 12, 0, 0, 0);
        d.setDate(d.getDate() + offset);
        return d;
    }

    function parseJson(raw, fallback) {
        try {
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function getFoodItems(displayDate) {
        const M = getManifest();
        const prefix = M?.nutrition?.log_prefix || 'food_log_';
        const items = parseJson(localStorage.getItem(prefix + displayDate), []);
        return Array.isArray(items) ? items : [];
    }

    function getFoodTotals(items) {
        return items.reduce((totals, item) => {
            totals.kcal += parseFloat(item?.kcal) || 0;
            totals.protein += parseFloat(item?.protein) || 0;
            return totals;
        }, { kcal: 0, protein: 0 });
    }

    function getFoodSummary(items) {
        if (!items.length) return 'No food logged';
        return items.map(item => {
            const name = item?.name || 'Food';
            const kcal = Math.round(parseFloat(item?.kcal) || 0);
            const protein = Math.round(parseFloat(item?.protein) || 0);
            return `• ${name} (${kcal}kcal | ${protein}g P)`;
        }).join('\n');
    }

    function getCardioData(displayDate) {
        const direct = parseJson(localStorage.getItem('cardio_log_' + displayDate), null);
        if (direct && (parseFloat(direct.km) || parseFloat(direct.kcal))) return direct;

        const history = parseJson(localStorage.getItem('pegasus_cardio_history'), []);
        if (Array.isArray(history)) {
            const found = history.find(item => item && item.date === displayDate && ((parseFloat(item.km) || 0) > 0 || (parseFloat(item.kcal) || 0) > 0));
            if (found) return found;
        }

        const dailyKcal = parseFloat(localStorage.getItem('pegasus_cardio_kcal_' + displayDate));
        if (!Number.isNaN(dailyKcal) && dailyKcal > 0) {
            return { km: 0, kcal: dailyKcal, route: 'Daily cardio offset' };
        }

        return null;
    }

    function getCardioSummary(cardioData) {
        if (!cardioData) return 'No cardio';
        const km = parseFloat(cardioData.km) || 0;
        const kcal = parseFloat(cardioData.kcal) || 0;
        const route = cardioData.route ? ` (${cardioData.route})` : '';
        return `🚲 ${km}km${route}${kcal ? ` | ${Math.round(kcal)} kcal` : ''}`;
    }

    function getWorkoutDone(displayDate, workoutKey) {
        const M = getManifest();
        const doneKey = M?.workout?.done || 'pegasus_workouts_done';
        const doneMap = parseJson(localStorage.getItem(doneKey), {});
        return !!(doneMap && (doneMap[workoutKey] || doneMap[displayDate]));
    }

    function getRecoveryForDate(dateObj) {
        const day = dateObj.getDay();
        const isRecovery = day === 1 || day === 4;
        return isRecovery
            ? { msg: 'Recovery Day Active', nutrition: 'Focus on hydration & stretching' }
            : { msg: 'Training Day', nutrition: 'High protein intake required' };
    }

    function getDailyTarget(dateObj) {
        try {
            if (typeof window.calculateDailyCalorieTarget === 'function') {
                const val = parseFloat(window.calculateDailyCalorieTarget(dateObj));
                if (!Number.isNaN(val) && val > 0) return Math.round(val);
            }
        } catch (e) {}

        const todayParts = getDateParts(new Date());
        const dateParts = getDateParts(dateObj);
        if (todayParts.display === dateParts.display) {
            const M = getManifest();
            const todayKcal = parseFloat(localStorage.getItem(M?.diet?.todayKcal || 'pegasus_today_kcal'));
            if (!Number.isNaN(todayKcal) && todayKcal > 0) return Math.round(todayKcal);
        }

        const day = dateObj.getDay();
        if (day === 1 || day === 4) return 2100;
        if (day === 6 || day === 0) return 3100;
        return 2800;
    }

    function getProteinGoal() {
        const M = getManifest();
        const val = parseFloat(
            localStorage.getItem(M?.diet?.goalProtein || 'pegasus_goal_protein') ||
            localStorage.getItem(M?.diet?.todayProtein || 'pegasus_today_protein') ||
            '160'
        );
        return Math.round((!Number.isNaN(val) && val > 0) ? val : 160);
    }

    function hasMeaningfulData(snapshot) {
        return !!(
            snapshot.foodItems.length > 0 ||
            snapshot.cardioData ||
            snapshot.workoutDone
        );
    }

    function createDailySnapshot(dateObj) {
        const parts = getDateParts(dateObj);
        const foodItems = getFoodItems(parts.display);
        const foodTotals = getFoodTotals(foodItems);
        const cardioData = getCardioData(parts.display);
        const workoutDone = getWorkoutDone(parts.display, parts.workoutKey);

        return {
            dateObj,
            parts,
            foodItems,
            foodTotals,
            cardioData,
            workoutDone,
            hasData: false
        };
    }

    function markSnapshot(snapshot) {
        snapshot.hasData = hasMeaningfulData(snapshot);
        return snapshot;
    }

    function getAutomaticSnapshots() {
        // Automatic morning reports are intentionally strict: yesterday only.
        return [markSnapshot(createDailySnapshot(addDays(new Date(), -1)))];
    }

    function getManualTodaySnapshot() {
        // Manual EMAIL is a live same-day report: whatever exists today, now.
        return markSnapshot(createDailySnapshot(addDays(new Date(), 0)));
    }

    function buildTemplateParams(snapshot) {
        const recovery = getRecoveryForDate(snapshot.dateObj);
        const targetKcal = getDailyTarget(snapshot.dateObj);
        const proteinGoal = getProteinGoal();
        const foodKcal = Math.round(snapshot.foodTotals.kcal);
        const foodProtein = Math.round(snapshot.foodTotals.protein);
        const subject = `PEGASUS REPORT - ${snapshot.parts.subjectSafe}`;

        const workoutText = snapshot.workoutDone
            ? 'Workout completion recorded in PEGASUS.'
            : 'No workout completion recorded.';

        return {
            name: 'Άγγελος',
            workout_date: snapshot.parts.subjectSafe,
            workout_date_display: snapshot.parts.display,
            report_date_display: snapshot.parts.display,
            report_date_subject: snapshot.parts.subjectSafe,
            workout_date_subject: snapshot.parts.subjectSafe,
            subject_date: snapshot.parts.subjectSafe,
            email_subject: subject,
            subject,
            subject_line: subject,
            report_subject: subject,
            calories: targetKcal,
            weights_summary: workoutText,
            food_summary: getFoodSummary(snapshot.foodItems),
            cardio_activity: getCardioSummary(snapshot.cardioData),
            total_food_kcal: foodKcal,
            food_protein_total: foodProtein,
            total_food_protein: foodProtein,
            protein_total: foodProtein,
            total_protein: foodProtein,
            consumed_protein: foodProtein,
            goal_protein: proteinGoal,
            protein_goal: proteinGoal,
            protein_summary_text: `${foodProtein}g / ${proteinGoal}g`,
            recovery_status: recovery.msg || 'Updated',
            nutrition_advice: recovery.nutrition || 'Maintain macro balance',
            report_source: 'auto-fallback-localstorage'
        };
    }

    function formatDiagnostics(snapshots) {
        return snapshots.map(snapshot => {
            const food = snapshot.foodItems.length;
            const cardio = snapshot.cardioData ? 'yes' : 'no';
            const workout = snapshot.workoutDone ? 'yes' : 'no';
            return `${snapshot.parts.display}: food=${food}, cardio=${cardio}, workout=${workout}`;
        }).join(' | ');
    }

    function setButtonStatus(text, color) {
        const btn = document.getElementById('btnManualEmail');
        if (!btn) return;
        const originalText = btn.textContent || 'EMAIL';
        btn.textContent = text;
        btn.style.background = color;
        btn.style.color = '#000';
        setTimeout(() => {
            btn.style.background = '';
            btn.style.color = '';
            btn.textContent = originalText === text ? 'EMAIL' : originalText;
        }, 3500);
    }

    function getPendingReportDisplayDate(reporting) {
        try {
            const raw = localStorage.getItem(reporting.pendingReportKey);
            if (!raw) return '';
            const pending = JSON.parse(raw);
            return pending.reportDateDisplay || pending.dateSent || pending?.templateParams?.report_date_display || pending?.templateParams?.workout_date_display || '';
        } catch (e) {
            return '';
        }
    }

    function sendManualTodayReport(reporting, snapshot) {
        if (!snapshot || !snapshot.hasData) {
            setButtonStatus('ΑΔΕΙΟ', '#ff9800');
            console.warn(`PEGASUS MANUAL REPORT: No saved logs for today (${snapshot?.parts?.display || 'unknown date'}).`);
            return;
        }

        if (typeof reporting.ensureEmailJsReady === 'function' && !reporting.ensureEmailJsReady()) {
            setButtonStatus('ΑΝΑΜΟΝΗ', '#ff9800');
            console.warn('PEGASUS MANUAL REPORT: EmailJS not ready. Try EMAIL again after the page finishes loading.');
            return;
        }

        if (reporting.emailSendInProgress) {
            console.log('⏳ PEGASUS MANUAL REPORT: Email send already in progress.');
            return;
        }

        const params = buildTemplateParams(snapshot);
        params.report_source = 'manual-today-localstorage';
        params.report_mode = 'manual-today';
        params.email_subject = `PEGASUS TODAY REPORT - ${snapshot.parts.subjectSafe}`;
        params.subject = params.email_subject;
        params.subject_line = params.email_subject;
        params.report_subject = params.email_subject;

        reporting.emailSendInProgress = true;
        setButtonStatus('ΣΤΕΛΝΕΙ', '#2196F3');
        console.log(`📨 PEGASUS MANUAL REPORT: Sending today's report for ${snapshot.parts.display}.`);

        emailjs.send(reporting.emailServiceId, reporting.emailTemplateId, params)
            .then(() => {
                reporting.emailSendInProgress = false;
                if (typeof reporting.resetReportRetry === 'function') reporting.resetReportRetry();
                setButtonStatus('ΕΠΙΤΥΧΙΑ', '#4CAF50');
                console.log(`✅ PEGASUS MANUAL REPORT: Today's report sent for ${snapshot.parts.display}. Pending previous-day report was preserved.`);
            })
            .catch(err => {
                reporting.emailSendInProgress = false;
                setButtonStatus('ΣΦΑΛΜΑ', '#f44336');
                console.error('❌ PEGASUS MANUAL REPORT: Email Error', err);
            });
    }

    function installPatch() {
        const reporting = window.PegasusReporting;
        if (!reporting || reporting[INSTALL_FLAG]) return false;

        const originalCheck = typeof reporting.checkAndSendMorningReport === 'function'
            ? reporting.checkAndSendMorningReport.bind(reporting)
            : null;

        if (!originalCheck) return false;

        reporting.buildPendingReportFromSavedLogs = function () {
            const snapshots = getAutomaticSnapshots();
            const selected = snapshots.find(snapshot => snapshot.hasData);

            if (!selected) {
                console.warn('PEGASUS REPORT FALLBACK: No saved daily logs found for automatic yesterday report.', formatDiagnostics(snapshots));
                return null;
            }

            const pendingData = {
                dateSent: selected.parts.display,
                reportDateDisplay: selected.parts.display,
                templateParams: buildTemplateParams(selected),
                autoGeneratedPending: true,
                reportMode: 'automatic-yesterday',
                generatedFrom: 'reportingAutoFallback.js',
                generatedAt: new Date().toISOString()
            };

            localStorage.setItem(this.pendingReportKey, JSON.stringify(pendingData));
            console.log(`🛠️ PEGASUS REPORT FALLBACK: Automatic yesterday report built from saved logs for ${selected.parts.display}.`);
            return pendingData;
        };

        reporting.checkAndSendMorningReport = function (forceSend = false) {
            if (forceSend) {
                // Manual button must always send today's current data and must not
                // overwrite/remove a pending previous-day automatic report.
                return sendManualTodayReport(this, getManualTodaySnapshot());
            }

            const hasPending = !!localStorage.getItem(this.pendingReportKey);
            if (hasPending) {
                const pendingDisplayDate = getPendingReportDisplayDate(this);
                const todayDisplayDate = getDateParts(new Date()).display;
                if (pendingDisplayDate === todayDisplayDate) {
                    console.log('🛡️ PEGASUS REPORT FALLBACK: Automatic send skipped because pending report is for today, not yesterday.');
                    return;
                }
            }

            if (!hasPending) {
                const built = this.buildPendingReportFromSavedLogs();
                if (!built) return;
            }

            return originalCheck(false);
        };

        reporting[INSTALL_FLAG] = true;
        console.log(`📨 PEGASUS REPORT FALLBACK: Active (${VERSION}).`);
        return true;
    }

    function boot() {
        if (installPatch()) return;
        let attempts = 0;
        const timer = setInterval(() => {
            attempts += 1;
            if (installPatch() || attempts >= 20) clearInterval(timer);
        }, 250);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})();
