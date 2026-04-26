/* ==========================================================================
   PEGASUS MUSCLE PROGRESS VISUALIZER - v7.7 (SYNC & SELECTOR FIX)
   Protocol: Dynamic Target Priority, Weekly Reset Safety & Active DOM Alignment
   Status: FINAL STABLE | FIXED: PREVIEW DUPLICATE THUMBNAILS
   ========================================================================== */

// 🛡️ Global Safe Declaration
var M = M || window.PegasusManifest;

window.MuscleProgressUI = {
    lastDataHash: null,

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
        const historyKey = M?.workout?.weekly_history || "pegasus_weekly_history";
        const history = JSON.parse(localStorage.getItem(historyKey) || "{}");

        let targets;
        if (typeof window.getDynamicTargets === "function") {
            targets = window.getDynamicTargets();
        } else {
            const stored = localStorage.getItem(M?.workout?.muscleTargets || "pegasus_muscle_targets");
            targets = stored
                ? JSON.parse(stored)
                : {
                    "Στήθος": 24,
                    "Πλάτη": 24,
                    "Πόδια": 24,
                    "Χέρια": 16,
                    "Ώμοι": 16,
                    "Κορμός": 12
                };
        }

        return { history, targets };
    },

    getActiveExercises() {
        // ✅ FIX: Το app.js χτίζει .exercise και .exercise-name, όχι .exercise-item / .ex-name
        const activeExerciseElements = document.querySelectorAll(".exercise");

        return Array.from(activeExerciseElements)
            .map(el => {
                return {
                    name: el.querySelector(".exercise-name")?.innerText?.trim() || "",
                    isSkipped: el.classList.contains("exercise-skipped")
                };
            })
            .filter(ex => ex.name !== "" && !ex.isSkipped);
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
        const container = document.getElementById("muscleProgressContainer");
        if (!container) return;

        const { history, targets } = this.calculateStats();
        const activeExercises = this.getActiveExercises();

        const currentHash =
            JSON.stringify(history) +
            JSON.stringify(targets) +
            JSON.stringify(activeExercises);

        if (!force && this.lastDataHash === currentHash) return;
        this.lastDataHash = currentHash;

        const pegasusGreen = "#00ff41";

        let htmlString = `
        <div style="background: rgba(0,0,0,0.85); border: 1px solid ${pegasusGreen}44; border-radius: 12px; padding: 15px; width: 100%; box-sizing: border-box; box-shadow: 0 4px 20px rgba(0,0,0,0.5); display: flex; flex-direction: column; gap: 14px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">`;

        const strictGroups = ["Στήθος", "Πλάτη", "Πόδια", "Χέρια", "Ώμοι", "Κορμός"];

        strictGroups.forEach(name => {
            const target = parseInt(targets[name]) || 0;
            const done = parseInt(history[name]) || 0;
            const percent = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
            const isDone = target > 0 && done >= target;

            htmlString += `
            <div style="background: rgba(255,255,255,0.03); padding: 6px 8px; border-radius: 6px; border: 1px solid #222; display: flex; flex-direction: column; justify-content: center;">
                <div style="display: flex; justify-content: space-between; font-size: 8px; color: #aaa; margin-bottom: 3px; font-weight: 800; text-transform: uppercase;">
                    <span>${name}</span>
                    <span style="color: ${pegasusGreen};">${done}/${target}${isDone ? " 🎯" : ""}</span>
                </div>
                <div style="width: 100%; height: 4px; background: #111; border-radius: 2px; overflow: hidden; border: 0.5px solid #333;">
                    <div style="width: ${percent}%; height: 100%; background: ${pegasusGreen}; box-shadow: 0 0 6px ${pegasusGreen}aa; transition: width 1.2s cubic-bezier(0.17, 0.67, 0.83, 0.67);"></div>
                </div>
            </div>`;
        });

        htmlString += `</div>`;

        // ✅ v7.7: Το exercise thumbnail preview ανήκει στο #previewContent.
        // Το MuscleProgressUI κρατά μόνο τις μπάρες προόδου για να μην εμφανίζονται
        // διπλές κάρτες ασκήσεων μέσα στο panel "ΕΠΙΣΚΟΠΗΣΗ & ΠΡΟΟΔΟΣ".
        htmlString += `</div>`;

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
