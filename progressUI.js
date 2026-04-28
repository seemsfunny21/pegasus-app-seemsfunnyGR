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
                text-transform: uppercase;
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
            "Στήθος": 24,
            "Πλάτη": 24,
            "Πόδια": 24,
            "Χέρια": 16,
            "Ώμοι": 16,
            "Κορμός": 12
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
        const activeExercises = this.getActiveExercises();

        const currentHash =
            JSON.stringify(history) +
            JSON.stringify(targets) +
            JSON.stringify(activeExercises);

        if (!force && this.lastDataHash === currentHash) return;
        this.lastDataHash = currentHash;

        const pegasusGreen = "#00ff41";

        const sourceLabel = "ΕΒΔΟΜΑΔΙΑΙΑ ΠΡΟΟΔΟΣ";

        let htmlString = `
        <div class="pegasus-weekly-progress-card">
            <div class="pegasus-weekly-progress-title-wrap">
                <div class="pegasus-weekly-progress-title">
                    ${sourceLabel}
                </div>
            </div>
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

        // ✅ Κρατάμε Monday reset για να είναι aligned με το corrected app flow
        if (now.getDay() === 1 && lastResetDate !== todayStr) {
            const emptyHistory = {
                "Στήθος": 0,
                "Πλάτη": 0,
                "Πόδια": 0,
                "Χέρια": 0,
                "Ώμοι": 0,
                "Κορμός": 0
            };

            localStorage.setItem(historyKey, JSON.stringify(emptyHistory));
            localStorage.setItem(lastResetKey, todayStr);
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


/* ==== MERGED FROM achievements.js ==== */

/* ==========================================================================
   Pegasus Achievements System - v18.7 MAXIMALIST (HARDENED)
   Protocol: Strict Data Analyst - Anti-Desync & Cloud Integration
   Status: FINAL STABLE | ZERO-BUG VERIFIED
   ========================================================================== */

// 🛡️ Global Safe Declaration
var M = M || window.PegasusManifest;

const allExercises = [
    "Seated Chest Press", "Pec Deck", "Pushups",
    "Lat Pulldown", "Low Seated Row", "Close Grip Pulldown", "Behind the Neck Pulldown", "Reverse Row",
    "Preacher Curl", "Standing Bicep Curl", "Triceps Overhead Extension", "Triceps Press",
    "Leg Extension", "Plank", "Lying Knee Raise", "Reverse Crunch", "Leg Raise Hip Lift",
    "Stretching", "EMS Κοιλιακών", "EMS Πλάτης", "EMS Ποδιών", "Προθέρμανση"
];

function getPegasusCoreEngine() {
    if (window.PegasusEngine && window.PegasusEngine.__isCoreEngine) {
        return window.PegasusEngine;
    }
    return null;
}

/**
 * 🛡️ INTERNAL DATA RECOVERY
 * Διασφαλίζει ότι διαβάζουμε ΠΑΝΤΑ την τελευταία τιμή από το δίσκο (αποφυγή Desync)
 */
function getFreshStats() {
    const statsKey = M?.system?.stats || 'pegasus_stats';
    let raw = localStorage.getItem(statsKey);
    let stats = { totalSets: 0, exerciseHistory: {} };

    try {
        if (raw) {
            let parsed = JSON.parse(raw);
            stats.totalSets = isNaN(parseInt(parsed.totalSets, 10)) ? 0 : parseInt(parsed.totalSets, 10);
            stats.exerciseHistory = (parsed.exerciseHistory && typeof parsed.exerciseHistory === 'object') ? parsed.exerciseHistory : {};
        }
    } catch (e) {
        console.error("PEGASUS ACHIEVEMENTS: Stats corruption prevented.");
    }

    return stats;
}

/**
 * Ενημέρωση προόδου (Global Bridge)
 */
window.updateAchievements = async function(exerciseName) {
    if (!exerciseName) return;

    const cleanName = exerciseName.trim();

    // Λήψη φρέσκων δεδομένων πριν την εγγραφή
    let userStats = getFreshStats();

    userStats.totalSets++;

    if (!userStats.exerciseHistory[cleanName]) {
        userStats.exerciseHistory[cleanName] = 0;
    }
    userStats.exerciseHistory[cleanName]++;

    const statsKey = M?.system?.stats || 'pegasus_stats';
    localStorage.setItem(statsKey, JSON.stringify(userStats));

    // Trigger Milestones
    checkMilestones(cleanName, userStats);

    const engine = getPegasusCoreEngine();
    if (engine?.dispatch) {
        engine.dispatch({
            type: "ACHIEVEMENT_SET_RECORDED",
            payload: {
                exerciseName: cleanName,
                totalSets: userStats.totalSets,
                exerciseSets: userStats.exerciseHistory[cleanName]
            }
        });
    }

    if (document.getElementById('achPanelContent')) {
        window.renderAchievements();
    }

    // 📡 CLOUD SYNC: Αυτόματη ενημέρωση του Cloud μετά από κάθε σετ
    if (window.PegasusCloud && typeof window.PegasusCloud.push === "function") {
        window.PegasusCloud.push();
    }
};

/**
 * Σχεδίαση του UI - PEGASUS GREEN
 */
window.renderAchievements = function() {
    const content = document.getElementById('achPanelContent');
    if (!content) return;

    // Λήψη φρέσκων δεδομένων για το Rendering
    const userStats = getFreshStats();
    const sets = parseInt(userStats.totalSets, 10) || 0;
    const currentLevel = Math.floor(sets / 20) + 1;
    const xpInLevel = sets % 20;
    const progressPercent = (xpInLevel / 20) * 100;

    let html = `
        <div style="background:#111; padding:15px; border-radius:8px; margin-bottom:15px; border: 1px solid #4CAF50; box-shadow: 0 0 10px rgba(76, 175, 80, 0.2); text-align:center;">
            <div style="color:#4CAF50; font-size:12px; font-weight:bold; letter-spacing:1px; margin-bottom:5px;">PEGASUS RANK</div>
            <div style="font-size:28px; color:#fff; font-weight:bold; margin-bottom:10px;">LEVEL ${currentLevel}</div>

            <div style="background:#000; height:8px; border-radius:4px; overflow:hidden; border: 1px solid #222; margin-bottom:5px;">
                <div style="background:#4CAF50; width:${progressPercent}%; height:100%; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 8px #4CAF50;"></div>
            </div>
            <div style="font-size:11px; color:#888;">${xpInLevel} / 20 σετ για το επόμενο Level</div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr; gap:10px; margin-bottom:15px;">
            <div style="background:#111; padding:10px; border-radius:5px; text-align:center; border: 1px solid #222;">
                <span style="font-size:12px; color:#aaa;">Συνολικά Σετ:</span>
                <span style="font-size:18px; color:#4CAF50; font-weight:bold; margin-left:10px;">${sets}</span>
            </div>
        </div>

        <div style="max-height:250px; overflow-y:auto; padding-right:5px; scrollbar-width: thin;">
            <table style="width:100%; border-collapse:collapse; font-size:13px;">
    `;

    const sortedExercises = Object.entries(userStats.exerciseHistory)
        .sort((a, b) => b[1] - a[1]);

    if (sortedExercises.length === 0) {
        html += `<tr><td style="text-align:center; padding:20px; color:#666;">Ολοκλήρωσε το πρώτο σου σετ!</td></tr>`;
    } else {
        sortedExercises.forEach(([name, count]) => {
            html += `
                <tr style="border-bottom:1px solid #222;">
                    <td style="padding:10px 0; color:#eee;">${name}</td>
                    <td style="padding:10px 0; text-align:right; color:#4CAF50; font-weight:bold;">${count} <small style="color:#666">σετ</small></td>
                </tr>
            `;
        });
    }

    html += `</table></div>`;
    content.innerHTML = html;
};

/**
 * Milestones & Popups
 */
function checkMilestones(name, stats) {
    const count = stats.exerciseHistory[name];
    if (count % 50 === 0) showAchievementPopup(`Master of ${name}: ${count} Sets!`);
    if (stats.totalSets % 100 === 0) showAchievementPopup(`Centurion: ${stats.totalSets} Total Sets!`);
}

function showAchievementPopup(text) {
    const container = document.getElementById('achievement-container') || createAchievementContainer();
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.style.cssText = `
        background: #111; border: 1px solid #4CAF50; color: #fff;
        padding: 12px 20px; border-radius: 8px; font-weight: bold;
        box-shadow: 0 4px 15px rgba(0,0,0,0.5), 0 0 10px rgba(76,175,80,0.3);
        animation: slideIn 0.5s ease forwards;
    `;
    toast.innerText = `🏆 ${text}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.5s ease forwards';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

function createAchievementContainer() {
    const div = document.createElement('div');
    div.id = 'achievement-container';
    div.style.cssText = `position: fixed; bottom: 20px; right: 20px; z-index: 10002; display: flex; flex-direction: column; gap: 10px;`;
    document.body.appendChild(div);
    return div;
}

function attachAchievementEngineHooks() {
    const engine = getPegasusCoreEngine();
    if (!engine?.subscribe) return;
    if (window.__pegasusAchievementHookAttached) return;

    window.__pegasusAchievementHookAttached = true;

    engine.subscribe((state, action) => {
        const actionType = action?.type || "";

        if (
            actionType === "ACHIEVEMENT_SET_RECORDED" ||
            actionType === "WORKOUT_FINISHED" ||
            actionType === "BOOT_COMPLETE" ||
            actionType === "AUTO_INIT_TODAY"
        ) {
            if (document.getElementById('achPanelContent')) {
                window.renderAchievements();
            }
        }
    });
}

// Προσθήκη CSS animations για τα Achievements
if (!document.getElementById('pegasus-achievements-style')) {
    const style = document.createElement('style');
    style.id = 'pegasus-achievements-style';
    style.textContent = `
        @keyframes slideIn { from { transform: translateX(120%); } to { transform: translateX(0); } }
        @keyframes slideOut { from { transform: translateX(0); } to { transform: translateX(120%); } }
    `;
    document.head.appendChild(style);
}

document.addEventListener("DOMContentLoaded", () => {
    attachAchievementEngineHooks();
});
