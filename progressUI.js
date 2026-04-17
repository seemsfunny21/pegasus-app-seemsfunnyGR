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

        // 1. Λήψη δεδομένων (Ιστορικό και Δυναμικοί Στόχοι από το data.js)
        const { history, targets } = this.calculateStats();
        
        // Hash Check για αποφυγή περιττών renders
        const currentHash = JSON.stringify(history) + JSON.stringify(targets);
        if (!force && this.lastDataHash === currentHash) return;
        this.lastDataHash = currentHash;

        const pegasusGreen = "#00ff41";
        
        // 2. ΚΕΝΤΡΙΚΟ ΠΛΑΙΣΙΟ (Dark & Neon)
        let htmlString = `<div style="background: rgba(0,0,0,0.9); border: 1px solid ${pegasusGreen}44; border-radius: 12px; padding: 15px; width: 100%; box-sizing: border-box; font-family: sans-serif;">
                            <h4 style="color:${pegasusGreen}; font-size:11px; text-align:center; margin:0 0 15px 0; text-transform:uppercase; letter-spacing:1px; opacity:0.8;">Weekly Muscle Coverage</h4>
                            <div style="display: flex; flex-direction: column; gap: 10px;">`;

        // 3. ΟΙ 6 ΣΥΓΚΕΚΡΙΜΕΝΕΣ ΜΠΑΡΕΣ (Δυναμική άντληση τιμών)
        const strictGroups = ["Στήθος", "Πλάτη", "Πόδια", "Χέρια", "Ώμοι", "Κορμός"];

        strictGroups.forEach(name => {
            // Παίρνουμε το στόχο από το targets (data.js) ή βάζουμε 0 αν δεν υπάρχει
            const target = targets[name] || 0;
            const done = parseInt(history[name]) || 0;
            const percent = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
            const isDone = target > 0 && done >= target;

            htmlString += `
            <div style="background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 8px; border: 1px solid #222;">
                <div style="display: flex; justify-content: space-between; font-size: 10px; color: #eee; margin-bottom: 4px; font-weight: bold;">
                    <span>${name.toUpperCase()}</span>
                    <span style="color: ${pegasusGreen};">${done}/${target} ${isDone ? "🎯" : ""}</span>
                </div>
                <div style="width: 100%; height: 6px; background: #111; border-radius: 3px; overflow: hidden; border: 1px solid #222;">
                    <div style="width: ${percent}%; height: 100%; background: ${pegasusGreen}; box-shadow: 0 0 10px ${pegasusGreen}88; transition: width 1s ease-in-out;"></div>
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
