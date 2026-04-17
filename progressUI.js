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

        const stats = this.calculateStats();
        const currentHash = JSON.stringify(stats);

        if (!force && this.lastDataHash === currentHash) return;
        this.lastDataHash = currentHash;

        let htmlString = `<div style="display:flex; flex-direction:column; gap:15px; width:100%;">`;
        const pegasusGreen = "#00ff41";

        stats.forEach(s => {
            const isDone = s.done >= s.target;
            htmlString += `
            <div style="background: rgba(0,0,0,0.5); border:1px solid #222; border-radius:8px; padding:10px; width:100%; box-sizing:border-box;">
                <div style="display:flex; justify-content:space-between; font-size:10px; margin-bottom:3px; color:#eee; font-weight:bold;">
                    <span>${s.name.toUpperCase()}</span>
                    <span>${s.done}/${s.target} ${isDone ? "🎯" : ""}</span>
                </div>
                <div style="width:100%; height:6px; background:#111; border-radius:3px; overflow:hidden; border:1px solid #222;">
                    <div style="width:${s.percent}%; height:100%; background:${pegasusGreen}; box-shadow: 0 0 8px ${pegasusGreen}88; transition: width 0.8s ease-in-out;"></div>
                </div>
            </div>`;
        });
        htmlString += `</div>`;

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
