/* ==========================================================================
   PEGASUS REPORTING SYSTEM - V4.3 (STRICT SINGLE MORNING DISPATCH)
   Protocol: Daily Send Lock, Syntax Validation & Date Padding Alignment
   Status: FINAL STABLE | FIXED: SYNTAX STRUCTURE & LOG KEY MATCHING
   ========================================================================== */

// 🛡️ Global Safe Declaration
var M = M || window.PegasusManifest;

const PegasusReporting = {
    storageKey: M?.system?.dailySummary || "pegasus_daily_summary",
    pendingReportKey: M?.system?.pendingReport || "pegasus_pending_report",
    historyKey: M?.workout?.weekly_history || "pegasus_weekly_history",
    lastSentKey: M?.system?.lastEmailSentDate || "pegasus_last_email_sent_date",
    emailPublicKey: "qsfyDrneUHP7zEFui",
    emailServiceId: "service_4znxhn4",
    emailTemplateId: "template_e1cqkme",
    emailJsInitialized: false,
    emailSendInProgress: false,
    emailRetryTimer: null,
    emailRetryCount: 0,
    emailMaxRetries: 18,
    emailRetryDelayMs: 10000,

    ensureEmailJsReady: function() {
        if (typeof emailjs === 'undefined' || typeof emailjs.send !== 'function') {
            return false;
        }

        if (!this.emailJsInitialized && typeof emailjs.init === 'function') {
            try {
                emailjs.init(this.emailPublicKey);
                this.emailJsInitialized = true;
                console.log("✅ PEGASUS: EmailJS initialized by Reporting Engine.");
            } catch (e) {
                console.warn("PEGASUS: EmailJS init failed; will retry.", e);
                return false;
            }
        }

        return true;
    },

    resetReportRetry: function() {
        this.emailRetryCount = 0;
        if (this.emailRetryTimer) {
            clearTimeout(this.emailRetryTimer);
            this.emailRetryTimer = null;
        }
    },

    scheduleMorningReportRetry: function(forceSend = false, reason = 'not-ready') {
        if (this.emailRetryTimer) return;

        if (this.emailRetryCount >= this.emailMaxRetries) {
            console.warn(`PEGASUS: Morning report retry limit reached (${reason}). Pending report kept for next open/manual send.`);
            return;
        }

        this.emailRetryCount += 1;
        console.warn(`PEGASUS: Morning report send delayed (${reason}). Retry ${this.emailRetryCount}/${this.emailMaxRetries}.`);

        this.emailRetryTimer = setTimeout(() => {
            this.emailRetryTimer = null;
            this.checkAndSendMorningReport(forceSend);
        }, this.emailRetryDelayMs);
    },

    getTodayDateParts: function(dateObj = new Date()) {
        const d = String(dateObj.getDate()).padStart(2, '0');
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const y = dateObj.getFullYear();

        return {
            d,
            m,
            y,
            display: `${d}/${m}/${y}`,
            displayDots: `${d}.${m}.${y}`,
            subjectSafe: `${d}-${m}-${y}`,
            workoutKey: `${y}-${m}-${d}`
        };
    },

    getFoodLogForDate: function(displayDateStr) {
        const logPrefix = M?.nutrition?.log_prefix || "food_log_";
        try {
            const raw = localStorage.getItem(logPrefix + displayDateStr);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    },

    getCardioSummaryForDate: function(displayDateStr) {
        try {
            const directRaw = localStorage.getItem("cardio_log_" + displayDateStr);
            if (directRaw) {
                const parsed = JSON.parse(directRaw);
                if (parsed) return parsed;
            }
        } catch (e) {}

        try {
            const history = JSON.parse(localStorage.getItem("pegasus_cardio_history") || "[]");
            if (Array.isArray(history)) {
                const match = history.find(item => item && item.date === displayDateStr);
                if (match) return match;
            }
        } catch (e) {}

        return null;
    },

    getProteinTargets: function() {
        const goalKey = M?.diet?.goalProtein || 'pegasus_goal_protein';
        const todayKey = M?.diet?.todayProtein || 'pegasus_today_protein';
        const goalProtein = parseFloat(localStorage.getItem(goalKey) || localStorage.getItem(todayKey) || '160') || 160;
        const consumedProtein = parseFloat(localStorage.getItem(M?.diet?.consumedProtein || 'pegasus_today_protein_consumed') || '0') || 0;
        return {
            goalProtein: Math.round(goalProtein),
            consumedProtein: Math.round(consumedProtein)
        };
    },

    saveWorkout: function(kcalVal, memoryData = null) {
        console.log("PEGASUS: Workout save triggered. Queuing for morning...");
        this.prepareAndSaveReport(kcalVal, memoryData);
    },

    prepareAndSaveReport: function(kcal, sessionData = null) {
        let dailyMax = {};
        let weeklyHistory = JSON.parse(localStorage.getItem(this.historyKey)) || {
            "Πλάτη": 0, "Στήθος": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0, "Ώμοι": 0, "Άλλο": 0
        };

        const sourceData = sessionData || Array.from(document.querySelectorAll('.exercise'))
            .map(node => ({
                name: node.querySelector('.exercise-name')?.textContent?.trim()?.replace(" ☀️", "") || "",
                weight: parseFloat(node.querySelector('.weight-input')?.value) || 0,
                done: parseInt(node.dataset.done || 0, 10),
                group: node.dataset.group
            }))
            .filter(ex => ex.name && ex.done > 0);

        if (sourceData && sourceData.length > 0) {
            sourceData.forEach(ex => {
                if (!dailyMax[ex.name] || ex.weight > dailyMax[ex.name]) dailyMax[ex.name] = ex.weight;

                let group = ex.group;
                if (!group && window.exercisesDB) {
                    const exDb = window.exercisesDB.find(db => db.name === ex.name);
                    if (exDb) group = exDb.muscleGroup;
                }
                if (!group && typeof window.getMuscleGroup === "function") group = window.getMuscleGroup(ex.name);
                if (!group) group = "Άλλο";

                if (weeklyHistory[group] !== undefined) {
                    weeklyHistory[group] += ex.done;
                } else {
                    weeklyHistory["Άλλο"] = (weeklyHistory["Άλλο"] || 0) + ex.done;
                }
            });

            localStorage.setItem(this.historyKey, JSON.stringify(weeklyHistory));
        }

        let summary = Object.entries(dailyMax).map(([name, weight]) => `• ${name}: ${weight}kg`);
        const today = new Date();
        const dateParts = this.getTodayDateParts(today);

        const targetFood = this.getFoodLogForDate(dateParts.display);
        const cardioData = this.getCardioSummaryForDate(dateParts.display);

        const isRecovery = (today.getDay() === 1 || today.getDay() === 4);

        const recovery = isRecovery
            ? { msg: "Recovery Day Active", nutrition: "Focus on hydration & stretching" }
            : { msg: "Training Day", nutrition: "High protein intake required" };

        let effectiveTodayKcal = null;
        try {
            effectiveTodayKcal = (typeof window.getPegasusEffectiveDailyTarget === 'function')
                ? window.getPegasusEffectiveDailyTarget()
                : localStorage.getItem(M?.diet?.effectiveTodayKcal || "pegasus_effective_today_kcal");
        } catch (e) {}

        const resolvedKcal =
            kcal ||
            effectiveTodayKcal ||
            localStorage.getItem(M?.diet?.effectiveTodayKcal || "pegasus_effective_today_kcal") ||
            localStorage.getItem(M?.diet?.todayKcal || "pegasus_today_kcal") ||
            localStorage.getItem(M?.diet?.session_kcal || "pegasus_session_kcal") ||
            "0.0";

        const totalFoodKcal = targetFood.reduce((sum, f) => sum + parseFloat(f.kcal || 0), 0);
        const totalFoodProtein = targetFood.reduce((sum, f) => sum + parseFloat(f.protein || 0), 0);
        const proteinTargets = this.getProteinTargets();

        const cardioSummary = cardioData
            ? `🚲 ${cardioData.km || 0}km${cardioData.route ? ` (${cardioData.route})` : ""}${cardioData.kcal ? ` | ${cardioData.kcal} kcal` : ""}`
            : "No cardio";

        const pendingData = {
            dateSent: dateParts.display,
            reportDateDisplay: dateParts.display,
            templateParams: {
                name: "Άγγελος",

                // Use subject-safe numeric date anywhere a subject template may reuse the date field.
                workout_date: dateParts.subjectSafe,
                workout_date_display: dateParts.display,
                report_date_display: dateParts.display,
                report_date_subject: dateParts.subjectSafe,

                // ASCII-safe date/subject params for EmailJS subject
                workout_date_subject: dateParts.subjectSafe,
                subject_date: dateParts.subjectSafe,
                email_subject: `PEGASUS REPORT - ${dateParts.subjectSafe}`,
                subject: `PEGASUS REPORT - ${dateParts.subjectSafe}`,
                subject_line: `PEGASUS REPORT - ${dateParts.subjectSafe}`,
                report_subject: `PEGASUS REPORT - ${dateParts.subjectSafe}`,

                calories: resolvedKcal,
                weights_summary: summary.length > 0 ? summary.join("\n") : "Workout data committed.",
                food_summary: targetFood.length > 0 ? targetFood.map(f => `• ${f.name} (${f.kcal}kcal)`).join("\n") : "No food logged",
                cardio_activity: cardioSummary,
                total_food_kcal: Math.round(totalFoodKcal),
                food_protein_total: Math.round(totalFoodProtein),
                total_food_protein: Math.round(totalFoodProtein),
                protein_total: Math.round(totalFoodProtein),
                total_protein: Math.round(totalFoodProtein),
                consumed_protein: proteinTargets.consumedProtein,
                goal_protein: proteinTargets.goalProtein,
                protein_goal: proteinTargets.goalProtein,
                protein_summary_text: `${Math.round(totalFoodProtein)}g / ${proteinTargets.goalProtein}g`,
                recovery_status: recovery.msg || "Updated",
                nutrition_advice: recovery.nutrition || "Maintain macro balance"
            }
        };

        localStorage.setItem(this.pendingReportKey, JSON.stringify(pendingData));
        console.log("✅ PEGASUS: Data Queued. Will be sent tomorrow morning.");

        if (window.PegasusCloud && typeof window.PegasusCloud.push === "function") {
            window.PegasusCloud.push(true);
        }
    },

    checkAndSendMorningReport: function(forceSend = false) {
        const rawData = localStorage.getItem(this.pendingReportKey);

        if (!rawData) {
            if (forceSend) console.warn("PEGASUS: Δεν υπάρχουν δεδομένα προς αποστολή.");
            return;
        }

        let pending = null;
        try {
            pending = JSON.parse(rawData);
        } catch (e) {
            console.error("PEGASUS: Pending report corrupted.", e);
            return;
        }

        const today = new Date();
        const dateParts = this.getTodayDateParts(today);
        const currentHour = today.getHours();

        // 🔒 Έλεγχος Κλειδαριάς Ημέρας
        const lastSentDate = localStorage.getItem(this.lastSentKey);

        if (!forceSend) {
            // Αν έχουμε ήδη στείλει email σήμερα, ΣΤΑΜΑΤΑ!
            if (lastSentDate === dateParts.subjectSafe) {
                console.log("🛡️ PEGASUS: Morning report already sent today. Dispatch locked.");
                return;
            }

            const isMorningWindow = currentHour >= 5 && currentHour <= 11;
            const pendingDisplayDate = pending.reportDateDisplay || pending.dateSent || pending?.templateParams?.report_date_display || pending?.templateParams?.workout_date_display;
            const isOldReport = pendingDisplayDate !== dateParts.display;
            const isRetryingPendingReport = this.emailRetryCount > 0;

            if (!isMorningWindow && !isOldReport && !isRetryingPendingReport) {
                console.log("⏳ PEGASUS: Report pending. Waiting for the morning window...");
                return;
            }
        }

        if (!this.ensureEmailJsReady()) {
            this.scheduleMorningReportRetry(forceSend, 'emailjs-not-ready');
            return;
        }

        if (this.emailSendInProgress) {
            console.log("⏳ PEGASUS: Morning report send already in progress.");
            return;
        }

        this.emailSendInProgress = true;
        console.log("⏳ PEGASUS: Transmitting Morning Report to Cloud Server...");

        emailjs.send(this.emailServiceId, this.emailTemplateId, pending.templateParams)
            .then(() => {
                this.emailSendInProgress = false;
                this.resetReportRetry();
                console.log("✅ PEGASUS: Morning Report Sent Successfully.");

                // 🔒 Κλειδώνουμε το σύστημα για τη σημερινή μέρα
                localStorage.setItem(this.lastSentKey, dateParts.subjectSafe);
                localStorage.removeItem(this.pendingReportKey);

                const btn = document.getElementById('btnManualEmail');
                if (btn) {
                    btn.style.background = '#4CAF50';
                    btn.style.color = '#000';
                    btn.textContent = 'ΕΠΙΤΥΧΙΑ';
                    setTimeout(() => {
                        btn.style.background = '';
                        btn.style.color = '';
                        btn.textContent = 'EMAIL';
                    }, 3000);
                }
            })
            .catch(err => {
                this.emailSendInProgress = false;
                console.error("❌ PEGASUS: Email Error", err);
                this.scheduleMorningReportRetry(forceSend, 'send-error');
            });
    }
};

window.PegasusReporting = PegasusReporting;

// ==========================================================================
// 🚀 PEGASUS BOOT SEQUENCE: Αυτόματος Έλεγχος Πρωινής Αναφοράς στο άνοιγμα
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        if (window.PegasusReporting) {
            window.PegasusReporting.checkAndSendMorningReport(false);
        }
    }, 3000);
});


/* ===== CONSOLIDATED FROM reportingDietFinalizePatch.js ===== */
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

        const reportDateDisplay = pending.reportDateDisplay || pending.dateSent || pending.templateParams.workout_date_display || pending.templateParams.report_date_display || pending.templateParams.workout_date;
        if (!reportDateDisplay) return pending;

        const reportDateObj = parseDisplayDate(reportDateDisplay);
        const reportDateParts = reporting.getTodayDateParts(reportDateObj || new Date());
        const nutrition = getFoodSummaryForDate(reportDateDisplay);
        const recovery = getRecoveryForDate(reportDateDisplay);
        const cardioSummary = getCardioSummaryForDate(reporting, reportDateDisplay);
        const proteinTargets = reporting.getProteinTargets();

        const enriched = JSON.parse(JSON.stringify(pending));
        enriched.reportDateDisplay = reportDateDisplay;
        enriched.templateParams.workout_date = reportDateParts.subjectSafe;
        enriched.templateParams.workout_date_display = reportDateDisplay;
        enriched.templateParams.report_date_display = reportDateDisplay;
        enriched.templateParams.report_date_subject = reportDateParts.subjectSafe;
        enriched.templateParams.workout_date_subject = reportDateParts.subjectSafe;
        enriched.templateParams.subject_date = reportDateParts.subjectSafe;
        enriched.templateParams.email_subject = `PEGASUS REPORT - ${reportDateParts.subjectSafe}`;
        enriched.templateParams.subject = `PEGASUS REPORT - ${reportDateParts.subjectSafe}`;
        enriched.templateParams.subject_line = `PEGASUS REPORT - ${reportDateParts.subjectSafe}`;
        enriched.templateParams.report_subject = `PEGASUS REPORT - ${reportDateParts.subjectSafe}`;
        enriched.templateParams.food_summary = nutrition.foodSummary;
        enriched.templateParams.total_food_kcal = Math.round(nutrition.totalFoodKcal);
        enriched.templateParams.food_protein_total = Math.round(nutrition.totalFoodProtein);
        enriched.templateParams.total_food_protein = Math.round(nutrition.totalFoodProtein);
        enriched.templateParams.protein_total = Math.round(nutrition.totalFoodProtein);
        enriched.templateParams.total_protein = Math.round(nutrition.totalFoodProtein);
        enriched.templateParams.consumed_protein = Math.round(nutrition.totalFoodProtein);
        enriched.templateParams.goal_protein = proteinTargets.goalProtein;
        enriched.templateParams.protein_goal = proteinTargets.goalProtein;
        enriched.templateParams.protein_summary_text = `${Math.round(nutrition.totalFoodProtein)}g / ${proteinTargets.goalProtein}g`;
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


/* ===== CONSOLIDATED FROM reportingAutoFallback.js ===== */
/* ==========================================================================
   PEGASUS REPORTING AUTO FALLBACK - v1.2
   Protocol: Auto morning email sends yesterday's report. Manual EMAIL sends
             today's current report from saved daily logs without consuming any
             pending previous-day report.
   Status: STABLE | FIXED: automatic send uses report-date lock, not send-day lock.
   ========================================================================== */

(function () {
    const VERSION = 'v1.2';
    const INSTALL_FLAG = '__autoFallbackPatchInstalled';
    const AUTO_SENT_REPORT_DATE_KEY = 'pegasus_auto_report_sent_display_date';

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

    function parseDisplayDate(displayDate) {
        if (!displayDate || typeof displayDate !== 'string') return null;
        const parts = displayDate.split('/').map(v => parseInt(v, 10));
        if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;
        const dt = new Date(parts[2], parts[1] - 1, parts[0], 12, 0, 0, 0);
        return Number.isNaN(dt.getTime()) ? null : dt;
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
            const todayKcal = parseFloat(
                localStorage.getItem(M?.diet?.effectiveTodayKcal || 'pegasus_effective_today_kcal') ||
                localStorage.getItem(M?.diet?.todayKcal || 'pegasus_today_kcal')
            );
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

    function getPendingReport(reporting) {
        try {
            const raw = localStorage.getItem(reporting.pendingReportKey);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.warn('PEGASUS REPORT FALLBACK: Pending report corrupted. Clearing broken payload.', e);
            try { localStorage.removeItem(reporting.pendingReportKey); } catch (_) {}
            return null;
        }
    }

    function getPendingReportDisplayDateFromData(pending) {
        return pending?.reportDateDisplay || pending?.dateSent || pending?.templateParams?.report_date_display || pending?.templateParams?.workout_date_display || '';
    }

    function getPendingReportDisplayDate(reporting) {
        return getPendingReportDisplayDateFromData(getPendingReport(reporting));
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

    function buildAutomaticPending(reporting) {
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
            generatedFrom: 'reporting.js',
            generatedAt: new Date().toISOString()
        };

        localStorage.setItem(reporting.pendingReportKey, JSON.stringify(pendingData));
        console.log(`🛠️ PEGASUS REPORT FALLBACK: Automatic yesterday report built from saved logs for ${selected.parts.display}.`);
        return pendingData;
    }

    function refreshPendingIfPossible(reporting) {
        try {
            if (typeof reporting.refreshPendingNutritionNow === 'function') {
                const refreshed = reporting.refreshPendingNutritionNow();
                if (refreshed) return refreshed;
            }
        } catch (e) {
            console.warn('PEGASUS REPORT FALLBACK: Pending nutrition refresh skipped.', e);
        }
        return getPendingReport(reporting);
    }

    function sendAutomaticYesterdayReport(reporting) {
        let pending = getPendingReport(reporting);
        if (!pending) pending = buildAutomaticPending(reporting);
        if (!pending) return;

        pending = refreshPendingIfPossible(reporting) || pending;

        const reportDisplayDate = getPendingReportDisplayDateFromData(pending);
        const todayParts = getDateParts(new Date());

        if (!reportDisplayDate) {
            console.warn('PEGASUS REPORT FALLBACK: Pending report has no report date. Automatic send skipped for safety.');
            return;
        }

        if (reportDisplayDate === todayParts.display) {
            console.log('🛡️ PEGASUS REPORT FALLBACK: Automatic send skipped because pending report is for today, not yesterday.');
            return;
        }

        const reportDateObj = parseDisplayDate(reportDisplayDate);
        const yesterdayDisplay = getDateParts(addDays(new Date(), -1)).display;
        if (reportDateObj && reportDisplayDate !== yesterdayDisplay && pending.reportMode === 'automatic-yesterday') {
            console.warn(`PEGASUS REPORT FALLBACK: Automatic report date mismatch (${reportDisplayDate}). Expected yesterday ${yesterdayDisplay}.`);
            return;
        }

        const alreadySentReportDate = localStorage.getItem(AUTO_SENT_REPORT_DATE_KEY);
        if (alreadySentReportDate === reportDisplayDate) {
            console.log(`🛡️ PEGASUS REPORT FALLBACK: Yesterday report for ${reportDisplayDate} was already sent. Clearing stale pending payload.`);
            localStorage.removeItem(reporting.pendingReportKey);
            return;
        }

        if (typeof reporting.ensureEmailJsReady === 'function' && !reporting.ensureEmailJsReady()) {
            if (typeof reporting.scheduleMorningReportRetry === 'function') {
                reporting.scheduleMorningReportRetry(false, 'emailjs-not-ready-auto-fallback');
            }
            return;
        }

        if (reporting.emailSendInProgress) {
            console.log('⏳ PEGASUS REPORT FALLBACK: Automatic email send already in progress.');
            return;
        }

        reporting.emailSendInProgress = true;
        console.log(`📨 PEGASUS REPORT FALLBACK: Sending automatic yesterday report for ${reportDisplayDate}.`);

        emailjs.send(reporting.emailServiceId, reporting.emailTemplateId, pending.templateParams)
            .then(() => {
                reporting.emailSendInProgress = false;
                if (typeof reporting.resetReportRetry === 'function') reporting.resetReportRetry();
                localStorage.setItem(AUTO_SENT_REPORT_DATE_KEY, reportDisplayDate);
                localStorage.setItem(reporting.lastSentKey, todayParts.subjectSafe);
                localStorage.removeItem(reporting.pendingReportKey);
                setButtonStatus('ΑΥΤΟ EMAIL OK', '#4CAF50');
                console.log(`✅ PEGASUS REPORT FALLBACK: Automatic yesterday report sent for ${reportDisplayDate}.`);
            })
            .catch(err => {
                reporting.emailSendInProgress = false;
                console.error('❌ PEGASUS REPORT FALLBACK: Automatic Email Error', err);
                if (typeof reporting.scheduleMorningReportRetry === 'function') {
                    reporting.scheduleMorningReportRetry(false, 'auto-fallback-send-error');
                }
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
            return buildAutomaticPending(this);
        };

        reporting.checkAndSendMorningReport = function (forceSend = false) {
            if (forceSend) {
                // Manual button must always send today's current data and must not
                // overwrite/remove a pending previous-day automatic report.
                return sendManualTodayReport(this, getManualTodaySnapshot());
            }

            // Automatic morning report uses report-date locking. The legacy
            // send-day lock is intentionally bypassed here, because it can be set
            // even when yesterday's generated report still has not been delivered.
            return sendAutomaticYesterdayReport(this);
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

