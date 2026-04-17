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

        // 1. Λήψη δεδομένων (Δυναμικά από data.js)
        const { history, targets } = this.calculateStats();
        
        const currentHash = JSON.stringify(history) + JSON.stringify(targets);
        if (!force && this.lastDataHash === currentHash) return;
        this.lastDataHash = currentHash;

        const pegasusGreen = "#00ff41";
        
        // 2. COMPACT CONTAINER (Neon Border & Glassmorphism)
        let htmlString = `
        <div style="background: rgba(0,0,0,0.85); border: 1px solid ${pegasusGreen}44; border-radius: 12px; padding: 12px; width: 100%; box-sizing: border-box; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">`;

        // 3. ΟΙ 6 ΜΠΑΡΕΣ ΣΕ 2 ΣΤΗΛΕΣ
        const strictGroups = ["Στήθος", "Πλάτη", "Πόδια", "Χέρια", "Ώμοι", "Κορμός"];

        strictGroups.forEach(name => {
            const target = targets[name] || 0;
            const done = parseInt(history[name]) || 0;
            const percent = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
            const isDone = target > 0 && done >= target;

            htmlString += `
            <div style="background: rgba(255,255,255,0.03); padding: 6px 8px; border-radius: 6px; border: 1px solid #222; display: flex; flex-direction: column; justify-content: center;">
                <div style="display: flex; justify-content: space-between; font-size: 8px; color: #aaa; margin-bottom: 3px; font-weight: 800; text-transform: uppercase;">
                    <span>${name}</span>
                    <span style="color: ${pegasusGreen};">${done}/${target}${isDone ? "🎯" : ""}</span>
                </div>
                <div style="width: 100%; height: 4px; background: #111; border-radius: 2px; overflow: hidden; border: 0.5px solid #333;">
                    <div style="width: ${percent}%; height: 100%; background: ${pegasusGreen}; box-shadow: 0 0 6px ${pegasusGreen}aa; transition: width 1.2s cubic-bezier(0.17, 0.67, 0.83, 0.67);"></div>
                </div>
            </div>`;
        });

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
