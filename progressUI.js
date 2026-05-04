/* ==========================================================================
   PEGASUS MUSCLE PROGRESS VISUALIZER - v7.8 (STRICT WEEKLY PREVIEW FIX)
   Protocol: Weekly Accumulated Progress, Dynamic Targets & No Daily-Live Badges
   Status: FINAL STABLE | FIXED: PREVIEW READS WEEKLY HISTORY ONLY
   ========================================================================== */

// 🛡️ Global Safe Declaration
var M = M || window.PegasusManifest;

window.MuscleProgressUI = {
    lastDataHash: null,

    ensureStyles() {
        if (document.getElementById("pegasus-weekly-progress-style")) return;

        const style = document.createElement("style");
        style.id = "pegasus-weekly-progress-style";
        style.textContent = `
            .pegasus-weekly-progress-card {
                background: rgba(0,0,0,0.85);
                border: 1px solid rgba(0,255,65,0.27);
                border-radius: 12px;
                padding: 15px;
                width: 100%;
                box-sizing: border-box;
                box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                display: flex;
                flex-direction: column;
                gap: 14px;
            }

            .pegasus-weekly-progress-title-wrap {
                display: flex;
                justify-content: center;
                margin-bottom: 2px;
            }

            .pegasus-weekly-progress-title {
                font-size: var(--pg-font-status, 11px);
                font-weight: 900;
                letter-spacing: 0.08em;
                color: var(--main, #00ff41);
                background: rgba(0,255,65,0.08);
                border: 1px solid rgba(0,255,65,0.2);
                border-radius: 999px;
                padding: 4px 10px;
            }

            .pegasus-weekly-progress-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }

            .pegasus-weekly-progress-item {
                background: rgba(255,255,255,0.03);
                padding: 6px 8px;
                border-radius: 6px;
                border: 1px solid #222;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }

            .pegasus-weekly-progress-label {
                display: flex;
                justify-content: space-between;
                color: #aaa;
                margin-bottom: 3px;
                font-weight: 800;
                text-transform: none;
                font-size: var(--pg-font-status, 11px);
            }

            .pegasus-weekly-progress-value {
                color: var(--main, #00ff41);
            }

            .pegasus-weekly-progress-track {
                width: 100%;
                height: 4px;
                background: #111;
                border-radius: 2px;
                overflow: hidden;
                border: 0.5px solid #333;
            }

            .pegasus-weekly-progress-fill {
                height: 100%;
                background: var(--main, #00ff41);
                box-shadow: 0 0 6px rgba(0,255,65,0.67);
                transition: width 1.2s cubic-bezier(0.17, 0.67, 0.83, 0.67);
            }
        `;
        document.head.appendChild(style);
    },

    init() {
        try {
            this.checkWeeklyReset();
            setTimeout(() => this.render(true), 500);

            setInterval(() => {
                this.checkWeeklyReset();
                this.render();
            }, 3000);
        } catch (e) {
            console.error("❌ PEGASUS UI: Initialization failed", e);
        }
    },

    calculateStats() {
        if (window.PegasusWeeklyProgress?.reconcile) {
            try { window.PegasusWeeklyProgress.reconcile({ source: "progress-ui-render", push: false }); } catch (e) {}
        } else if (typeof window.reconcilePegasusWeeklyHistoryFromDailyProgress === "function") {
            try { window.reconcilePegasusWeeklyHistoryFromDailyProgress({ source: "progress-ui-render", push: false }); } catch (e) {}
        }

        const strictGroups = ["Στήθος", "Πλάτη", "Πόδια", "Χέρια", "Ώμοι", "Κορμός"];
        const emptyMap = () => ({ "Στήθος": 0, "Πλάτη": 0, "Πόδια": 0, "Χέρια": 0, "Ώμοι": 0, "Κορμός": 0 });

        const safeJson = (raw, fallback) => {
            try {
                const parsed = JSON.parse(raw || "{}");
                return parsed && typeof parsed === "object" ? parsed : fallback;
            } catch (e) {
                return fallback;
            }
        };

        const normalizeMap = (source, fallback) => {
            const base = emptyMap();
            strictGroups.forEach(group => {
                const value = parseFloat(source?.[group]);
                const fallbackValue = parseFloat(fallback?.[group]);
                base[group] = Math.max(0, Number.isFinite(value) ? value : (Number.isFinite(fallbackValue) ? fallbackValue : 0));
            });
            return base;
        };

        const historyKey = M?.workout?.weekly_history || "pegasus_weekly_history";
        const targetsKey = M?.workout?.muscleTargets || "pegasus_muscle_targets";

        const storedHistory = safeJson(localStorage.getItem(historyKey), emptyMap());
        const history = normalizeMap(storedHistory, emptyMap());

        let rawTargets = null;
        if (window.PegasusOptimizer && typeof window.PegasusOptimizer.getTargets === "function") {
            rawTargets = window.PegasusOptimizer.getTargets();
        } else if (typeof window.getDynamicTargets === "function") {
            rawTargets = window.getDynamicTargets();
        } else {
            rawTargets = safeJson(localStorage.getItem(targetsKey), null);
        }

        const fallbackTargets = {
            "Στήθος": 16,
            "Πλάτη": 16,
            "Πόδια": 24,
            "Χέρια": 14,
            "Ώμοι": 12,
            "Κορμός": 18
        };
        const targets = normalizeMap(rawTargets, fallbackTargets);

        return { history, targets, source: "weekly_accumulated" };
    },

    getActiveExercises() {
        const activeExerciseElements = document.querySelectorAll(".exercise");

        return Array.from(activeExerciseElements)
            .map(el => {
                const total = Math.max(0, parseFloat(el.dataset.total) || 0);
                const done = Math.max(0, parseFloat(el.dataset.done) || 0);
                return {
                    name: el.querySelector(".exercise-name")?.innerText?.trim() || "",
                    isSkipped: el.classList.contains("exercise-skipped"),
                    total,
                    done,
                    isCompleted: total > 0 && done >= total
                };
            })
            .filter(ex => ex.name !== "");
    },

    getImagePath(exerciseName) {
        const cleanName = exerciseName
            .split("(")[0]
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "")
            .replace(/[^\w\u0370-\u03FF]+/g, "");

        const mappedVal = window.videoMap ? window.videoMap[exerciseName.trim()] : null;
        const imgBase = mappedVal || cleanName;

        return `images/${imgBase}.png`;
    },

    render(force = false) {
        this.ensureStyles();
        const container = document.getElementById("muscleProgressContainer");
        if (!container) return;

        const { history, targets, source } = this.calculateStats();
        const historyTotal = Object.values(history || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
        const cloudBootPending = !!(window.PegasusCloud?.canRestoreApprovedDevice?.() && !window.PegasusCloud?.hasSuccessfullyPulled && navigator.onLine);
        if (historyTotal === 0 && cloudBootPending) {
            container.innerHTML = `
                <div class="pegasus-weekly-progress-card">
                    <div style="color: var(--main, #00ff41); font-weight: 900; text-align: center; letter-spacing: 0.08em;">
                        ΣΥΓΧΡΟΝΙΣΜΟΣ ΠΡΟΟΔΟΥ...
                    </div>
                </div>`;
            container.style.display = "block";
            try { window.PegasusCloud.tryApprovedDeviceUnlock?.(); } catch (e) {}
            return;
        }

        const activeExercises = this.getActiveExercises();

        const currentHash =
            JSON.stringify(history) +
            JSON.stringify(targets) +
            JSON.stringify(activeExercises);

        if (!force && this.lastDataHash === currentHash) return;
        this.lastDataHash = currentHash;

        const pegasusGreen = "#00ff41";

        let htmlString = `
        <div class="pegasus-weekly-progress-card">
            <div class="pegasus-weekly-progress-grid">`;

        const strictGroups = ["Στήθος", "Πλάτη", "Πόδια", "Χέρια", "Ώμοι", "Κορμός"];

        strictGroups.forEach(name => {
            const target = parseInt(targets[name]) || 0;
            const done = parseInt(history[name]) || 0;
            const percent = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
            const isDone = target > 0 && done >= target;

            htmlString += `
            <div class="pegasus-weekly-progress-item">
                <div class="pegasus-weekly-progress-label">
                    <span>${name}</span>
                    <span class="pegasus-weekly-progress-value">${done}/${target}${isDone ? " 🎯" : ""}</span>
                </div>
                <div class="pegasus-weekly-progress-track">
                    <div class="pegasus-weekly-progress-fill" style="width: ${percent}%;"></div>
                </div>
            </div>`;
        });

        htmlString += `</div>`;

        // Strict weekly preview: no daily-live exercise/set badges here.
        // The exercise thumbnails remain in #previewContent; this box stays weekly-only.

        htmlString += `</div>`;

        htmlString = htmlString.replace(/font-size:\s*[^;"]+;?/g, "");
        container.innerHTML = htmlString;
        container.style.display = "block";
    },

    checkWeeklyReset() {
        const lastResetKey = M?.system?.lastResetTimestamp || "pegasus_last_reset_timestamp";
        const historyKey = M?.workout?.weekly_history || "pegasus_weekly_history";

        const lastResetDate = localStorage.getItem(lastResetKey);
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        const day = now.getDay() || 7;
        const monday = new Date(now);
        monday.setHours(0, 0, 0, 0);
        monday.setDate(now.getDate() - day + 1);
        const currentWeekKey = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;

        const safeJson = (key, fallback) => {
            try {
                const parsed = JSON.parse(localStorage.getItem(key) || "null");
                return parsed && typeof parsed === "object" ? parsed : fallback;
            } catch (e) {
                return fallback;
            }
        };

        const ledger = safeJson("pegasus_weekly_history_counted_v2", null);
        const ledgerUpdatedAt = Math.max(0, Number(ledger?.updatedAt) || 0, Number(ledger?.createdAt) || 0);
        const hasLedgerValues = ledger?.weekKey === currentWeekKey
            && ledger.exercises
            && typeof ledger.exercises === "object"
            && Object.values(ledger.exercises).some(value => Math.max(0, Number(value) || 0) > 0);
        const dateVariants = new Set([
            todayStr,
            `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`,
            `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`,
            `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`
        ]);
        const hasCurrentLedgerToday = ledger?.weekKey === currentWeekKey
            && ledger.exercises
            && typeof ledger.exercises === "object"
            && Object.entries(ledger.exercises).some(([entryKey, value]) => {
                const count = Math.max(0, Number(value) || 0);
                if (count <= 0) return false;
                const entryDate = String(entryKey || "").split("|")[0];
                return dateVariants.has(entryDate);
            });

        const daily = safeJson("pegasus_daily_progress", null);
        const hasTodayDaily = daily?.date === todayStr
            && daily.exercises
            && typeof daily.exercises === "object"
            && Object.values(daily.exercises).some(value => Math.max(0, Number(value) || 0) > 0);

        const history = safeJson(historyKey, {});
        const visibleTotal = ["Στήθος", "Πλάτη", "Πόδια", "Χέρια", "Ώμοι", "Κορμός"]
            .reduce((sum, group) => sum + Math.max(0, Number(history?.[group]) || 0), 0);
        const resetAppliedWeek = String(localStorage.getItem("pegasus_monday_reset_applied_week_key") || "").trim();
        const storedWeekKey = String(localStorage.getItem("pegasus_weekly_history_week_key") || "").trim();
        const needsMondayReset = resetAppliedWeek !== currentWeekKey
            || lastResetDate !== todayStr
            || (!!storedWeekKey && storedWeekKey !== currentWeekKey)
            || (visibleTotal > 0 && !hasCurrentLedgerToday && !hasTodayDaily);

        const cloudBootPending = !!(window.PegasusCloud?.canRestoreApprovedDevice?.() && !window.PegasusCloud?.hasSuccessfullyPulled && navigator.onLine);

        // PEGASUS 203: reset Monday carry-over even if an old ledger was relabeled as this week.
        // Only real Monday sets, written after Monday started, can block the zero reset.
        if (now.getDay() === 1 && needsMondayReset) {
            if (cloudBootPending) {
                try { window.PegasusCloud.tryApprovedDeviceUnlock?.(); } catch (e) {}
                console.log("🛡️ PEGASUS UI: Monday reset deferred until initial cloud pull completes.");
                return;
            }
            if (hasCurrentLedgerToday || hasTodayDaily) {
                localStorage.setItem(lastResetKey, todayStr);
                localStorage.setItem("pegasus_last_reset", todayStr);
                localStorage.setItem("pegasus_weekly_history_week_key", currentWeekKey);
                localStorage.setItem("pegasus_monday_reset_applied_week_key", currentWeekKey);
                localStorage.setItem("pegasus_monday_reset_applied_at", String(Date.now()));
                this.lastDataHash = null;
                if (window.PegasusWeeklyProgress?.repairFromLedger) {
                    setTimeout(() => window.PegasusWeeklyProgress.repairFromLedger({ source: "monday-reset-guard" }), 50);
                }
                console.log("🛡️ PEGASUS UI: Monday reset skipped because real Monday sets already exist.");
                return;
            }

            const emptyHistory = {
                "Στήθος": 0,
                "Πλάτη": 0,
                "Πόδια": 0,
                "Χέρια": 0,
                "Ώμοι": 0,
                "Κορμός": 0
            };

            localStorage.setItem(historyKey, JSON.stringify(emptyHistory));
            localStorage.setItem("pegasus_weekly_history_week_key", currentWeekKey);
            localStorage.removeItem("pegasus_weekly_history_counted_v2");
            localStorage.setItem(lastResetKey, todayStr);
            localStorage.setItem("pegasus_last_reset", todayStr);
            localStorage.setItem("pegasus_monday_reset_applied_week_key", currentWeekKey);
            localStorage.setItem("pegasus_monday_reset_applied_at", String(Date.now()));
            this.lastDataHash = null;

            if (window.PegasusCloud?.push) {
                window.PegasusCloud.push(true);
            }

            console.log("🛡️ PEGASUS UI: Auto-Reset Triggered for Monday.");
        }
    }
};

// 🚀 Εκκίνηση
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => window.MuscleProgressUI.init());
} else {
    window.MuscleProgressUI.init();
}


