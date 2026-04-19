/* ==========================================================================
   PEGASUS MUSCLE PROGRESS VISUALIZER - v7.6 (SYNC & SELECTOR FIX)
   Protocol: Dynamic Target Priority, Weekly Reset Safety & Active DOM Alignment
   Status: FINAL STABLE | FIXED: MOBILE/DESKTOP MUSCLE BAR CONSISTENCY
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
                const nameNode = el.querySelector(".exercise-name");
                const internalName = nameNode?.dataset?.internalName || nameNode?.innerText?.trim() || "";
                return {
                    name: internalName,
                    displayName: (typeof window.getPegasusExerciseDisplayName === "function") ? window.getPegasusExerciseDisplayName(internalName) : internalName,
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

        if (activeExercises.length > 0) {
            htmlString += `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(85px, 1fr)); gap: 8px; justify-items: center;">`;

            activeExercises.forEach(ex => {
                const imgPath = this.getImagePath(ex.name);

                htmlString += `
                <div style="text-align: center; width: 100%; background: rgba(255,255,255,0.02); padding: 5px; border-radius: 6px; border: 1px solid #222;">
                    <div style="width: 100%; aspect-ratio: 1/1; background: #000; border-radius: 4px; overflow: hidden; margin-bottom: 4px; border: 1px solid ${pegasusGreen}11;">
                        <img src="${imgPath}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src='images/placeholder.jpg';">
                    </div>
                    <div style="color: #fff; font-size: 7.5px; font-weight: 800; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: 0.3px;">
                        ${ex.displayName || ex.name}
                    </div>
                </div>`;
            });

            htmlString += `</div>`;
        }

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
