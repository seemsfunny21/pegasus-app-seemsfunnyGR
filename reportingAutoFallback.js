/* ==========================================================================
   PEGASUS REPORTING AUTO FALLBACK - v1.0
   Protocol: Build morning/manual email report from saved daily logs when no
             pegasus_pending_report exists.
   Status: STABLE | FIXED: Manual EMAIL no longer stops at "no data" if food,
           cardio, or workout completion data exists in LocalStorage.
   ========================================================================== */

(function () {
    const VERSION = 'v1.0';
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

    function getCandidateSnapshots(forceSend) {
        const now = new Date();
        const hour = now.getHours();
        const candidates = [];

        // Morning reports should prefer the fully completed previous day.
        candidates.push(addDays(now, -1));

        // Manual EMAIL can also send today's report when there is already saved data.
        if (forceSend) {
            if (hour >= 12) {
                candidates.unshift(addDays(now, 0));
            } else {
                candidates.push(addDays(now, 0));
            }
        }

        // Rescue missed reports from the last few days if yesterday has no data.
        candidates.push(addDays(now, -2));
        candidates.push(addDays(now, -3));

        const seen = new Set();
        return candidates
            .map(createDailySnapshot)
            .filter(snapshot => {
                if (seen.has(snapshot.parts.display)) return false;
                seen.add(snapshot.parts.display);
                return true;
            })
            .map(snapshot => {
                snapshot.hasData = hasMeaningfulData(snapshot);
                return snapshot;
            });
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

    function installPatch() {
        const reporting = window.PegasusReporting;
        if (!reporting || reporting[INSTALL_FLAG]) return false;

        const originalCheck = typeof reporting.checkAndSendMorningReport === 'function'
            ? reporting.checkAndSendMorningReport.bind(reporting)
            : null;

        if (!originalCheck) return false;

        reporting.buildPendingReportFromSavedLogs = function (forceSend = false) {
            const snapshots = getCandidateSnapshots(forceSend);
            const selected = snapshots.find(snapshot => snapshot.hasData);

            if (!selected) {
                console.warn('PEGASUS REPORT FALLBACK: No saved daily logs found for fallback email.', formatDiagnostics(snapshots));
                return null;
            }

            const pendingData = {
                dateSent: selected.parts.display,
                reportDateDisplay: selected.parts.display,
                templateParams: buildTemplateParams(selected),
                autoGeneratedPending: true,
                generatedFrom: 'reportingAutoFallback.js',
                generatedAt: new Date().toISOString()
            };

            localStorage.setItem(this.pendingReportKey, JSON.stringify(pendingData));
            console.log(`🛠️ PEGASUS REPORT FALLBACK: Pending report built from saved logs for ${selected.parts.display}.`);
            return pendingData;
        };

        reporting.checkAndSendMorningReport = function (forceSend = false) {
            const hasPending = !!localStorage.getItem(this.pendingReportKey);

            if (!hasPending) {
                const built = this.buildPendingReportFromSavedLogs(forceSend);
                if (!built) {
                    if (forceSend) {
                        setButtonStatus('ΑΔΕΙΟ', '#ff9800');
                        console.warn('PEGASUS: Δεν βρέθηκαν food/cardio/workout logs για δημιουργία report. Άνοιξε Διατροφή ή ολοκλήρωσε προπόνηση και ξαναπάτα EMAIL.');
                    }
                    return;
                }
            }

            return originalCheck(forceSend);
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
