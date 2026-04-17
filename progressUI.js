/* ==========================================================================
   PEGASUS MUSCLE PROGRESS VISUALIZER - v7.5 (FINAL SHIELD)
   Protocol: Dynamic Target Priority & Weekly Reset Safety
   Status: FINAL STABLE | FIXED: REFERENCE ERRORS & SCOPE LEAK
   ========================================================================== */

// 🛡️ Global Safe Declaration
var M = M || window.PegasusManifest;

window.MuscleProgressUI = {
    lastDataHash: null,

    init() {
        // Αρχικοποίηση με ασφάλεια
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
        const historyKey = M?.workout?.weekly_history || 'pegasus_weekly_history';
        const history = JSON.parse(localStorage.getItem(historyKey)) || {};
        
        // 🛡️ ΠΡΟΤΕΡΑΙΟΤΗΤΑ ΣΤΟ ΔΥΝΑΜΙΚΟ ΠΛΑΝΟ ΤΟΥ DATA.JS
        let targets;
        if (typeof window.getDynamicTargets === "function") {
            targets = window.getDynamicTargets();
        } else {
            // Fallback αν δεν βρει τη συνάρτηση
            const stored = localStorage.getItem(M?.workout?.muscleTargets || "pegasus_muscle_targets");
            targets = stored ? JSON.parse(stored) : { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 };
        }
        
        return { history, targets };
    },

render(force = false) {
        const container = document.getElementById("muscleProgressContainer");
        if (!container) return;

        // 1. Λήψη δεδομένων & Τρέχουσας Ημέρας
        const { history, targets } = this.calculateStats();
        const days = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
        const todayName = days[new Date().getDay()];
        const todayExercises = window.program[todayName] || [];

        const currentHash = JSON.stringify(history) + JSON.stringify(targets) + todayName;
        if (!force && this.lastDataHash === currentHash) return;
        this.lastDataHash = currentHash;

        const pegasusGreen = "#00ff41";
        
        // 2. ΕΝΑΡΞΗ COMPACT LAYOUT
        let htmlString = `<div style="background: rgba(0,0,0,0.8); border: 1px solid ${pegasusGreen}44; border-radius: 10px; padding: 12px; width: 100%; box-sizing: border-box; font-family: sans-serif;">`;

        // 3. WEEKLY BARS (Πάνω μέρος - Compact)
        htmlString += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">`;
        const groups = ["Στήθος", "Πλάτη", "Πόδια", "Χέρια", "Ώμοι", "Κορμός"];
        
        groups.forEach(name => {
            const target = targets[name] || 0;
            if (target === 0) return;
            const done = parseInt(history[name]) || 0;
            const percent = Math.min(100, Math.round((done / target) * 100));

            htmlString += `
            <div style="background: rgba(255,255,255,0.03); padding: 6px; border-radius: 6px; border: 1px solid #222;">
                <div style="display: flex; justify-content: space-between; font-size: 9px; color: #aaa; margin-bottom: 3px; font-weight: bold;">
                    <span>${name.toUpperCase()}</span>
                    <span style="color: ${pegasusGreen};">${done}/${target}</span>
                </div>
                <div style="width: 100%; height: 4px; background: #111; border-radius: 2px; overflow: hidden;">
                    <div style="width: ${percent}%; height: 100%; background: ${pegasusGreen}; box-shadow: 0 0 5px ${pegasusGreen};"></div>
                </div>
            </div>`;
        });
        htmlString += `</div>`;

        // 4. TODAY'S ACTIONS (Κάτω μέρος - Μόνο ασκήσεις ημέρας)
        htmlString += `<div style="border-top: 1px dashed ${pegasusGreen}44; padding-top: 10px;">
                        <div style="color: ${pegasusGreen}; font-size: 10px; font-weight: bold; text-align: center; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">
                            Target: ${todayName}
                        </div>`;

        if (todayExercises.length > 0 && todayExercises[0].name !== "Stretching") {
            todayExercises.forEach(ex => {
                htmlString += `
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,255,65,0.05); margin-bottom: 4px; padding: 5px 8px; border-radius: 4px; border-left: 2px solid ${pegasusGreen};">
                    <span style="color: #fff; font-size: 10px;">${ex.name}</span>
                    <span style="color: ${pegasusGreen}; font-size: 9px; font-weight: bold;">${ex.sets} SETS</span>
                </div>`;
            });
        } else {
            const msg = todayExercises[0]?.name === "Stretching" ? "STRETCHING / RECOVERY" : "REST DAY";
            htmlString += `<div style="color: #666; font-size: 10px; text-align: center; font-style: italic;">${msg}</div>`;
        }

        htmlString += `</div></div>`;

        container.innerHTML = htmlString;
        container.style.display = "block";
    },

    checkWeeklyReset() {
        const lastResetKey = M?.system?.lastResetTimestamp || 'pegasus_last_reset_timestamp';
        const historyKey = M?.workout?.weekly_history || 'pegasus_weekly_history'; // 🎯 FIXED: Προσθήκη ορισμού εδώ
        
        const lastResetDate = localStorage.getItem(lastResetKey);
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        // 🎯 FIXED: Reset κάθε Δευτέρα (1)
        if (now.getDay() === 1 && lastResetDate !== todayStr) {
            const emptyHistory = { "Στήθος": 0, "Πλάτη": 0, "Πόδια": 0, "Χέρια": 0, "Ώμοι": 0, "Κορμός": 0 };
            localStorage.setItem(historyKey, JSON.stringify(emptyHistory));
            localStorage.setItem(lastResetKey, todayStr);
            this.lastDataHash = null; 
            
            if (window.PegasusCloud && typeof window.PegasusCloud.push === "function") {
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
