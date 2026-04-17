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
        const container = document.getElementById('muscleProgressContainer');
        if (!container) return;

        const { history, targets } = this.calculateStats();
        
        // 1. Λήψη τρέχουσας ημέρας και ασκήσεων
        const days = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
        const todayName = days[new Date().getDay()];
        const todayExercises = window.program[todayName] || [];

        // Hash Check για αποφυγή περιττών renders
        const currentHash = JSON.stringify(history) + JSON.stringify(targets) + todayName;
        if (!force && this.lastDataHash === currentHash) return;
        this.lastDataHash = currentHash;

        // 2. ΤΟ ΜΠΛΕ/NEON ΠΛΑΙΣΙΟ (Clean Layout)
        let htmlString = `<div style="padding:15px; background:rgba(0,255,65,0.03); border:1px solid #4CAF50; border-radius:12px;">
                            <h4 style="color:#4CAF50; font-size:11px; text-align:center; margin:0 0 12px 0; font-weight:bold; text-transform:uppercase;">Weekly Muscle Coverage</h4>`;

        // 3. WEEKLY BARS (Δυναμικές Τιμές)
        const groups = ["Στήθος", "Πλάτη", "Πόδια", "Χέρια", "Ώμοι", "Κορμός"];
        groups.forEach(m => {
            const target = targets[m] || 0;
            if (target === 0) return;

            const done = parseInt(history[m]) || 0;
            const percent = Math.min(100, Math.round((done / target) * 100));

            htmlString += `
                <div style="margin-bottom:8px;">
                    <div style="display:flex; justify-content:space-between; color:#eee; font-size:10px; margin-bottom:2px; font-weight:bold;">
                        <span>${m.toUpperCase()}</span><span>${done}/${target}</span>
                    </div>
                    <div style="width:100%; height:6px; background:#111; border-radius:3px; overflow:hidden; border:1px solid #222;">
                        <div style="width:${percent}%; height:100%; background:#4CAF50; box-shadow:0 0 8px #4CAF50; transition:width 0.5s ease-out;"></div>
                    </div>
                </div>`;
        });

        // 4. DAILY ACTION (Μόνο οι ασκήσεις της ημέρας - Clean List)
        htmlString += `<div style="margin-top:15px; padding-top:10px; border-top:1px dashed rgba(76, 175, 80, 0.4);">
                        <h4 style="color:#4CAF50; font-size:10px; margin:0 0 8px 0; font-weight:bold; text-transform:uppercase; text-align:center;">Today's Session: ${todayName}</h4>`;

        if (todayExercises.length > 0 && todayExercises[0].name !== "Stretching") {
            todayExercises.forEach(ex => {
                htmlString += `
                    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); margin-bottom:4px; padding:6px 10px; border-radius:4px; border-left:2px solid #4CAF50;">
                        <span style="color:#fff; font-size:11px;">${ex.name}</span>
                        <span style="color:#4CAF50; font-size:10px; font-weight:bold;">${ex.sets} SETS</span>
                    </div>`;
            });
        } else {
            const statusMsg = todayExercises[0]?.name === "Stretching" ? "Active Recovery: Stretching" : "Rest Day";
            htmlString += `<div style="color:#888; font-size:10px; font-style:italic; text-align:center; padding:5px;">${statusMsg}</div>`;
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
