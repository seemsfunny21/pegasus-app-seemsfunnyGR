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

        // 1. Λήψη δεδομένων (Ιστορικό & Στόχοι)
        const { history, targets } = this.calculateStats();
        
        // 2. Λήψη ΕΝΕΡΓΩΝ ασκήσεων από την οθόνη (Αριστερή λίστα)
        const activeExerciseElements = document.querySelectorAll('.exercise-item');
        const activeExercises = Array.from(activeExerciseElements).map(el => {
            return { 
                name: el.querySelector('.ex-name')?.innerText || "" 
            };
        });

        // Hash Check για αποφυγή περιττών renders (περιλαμβάνει και τις ασκήσεις)
        const currentHash = JSON.stringify(history) + JSON.stringify(targets) + JSON.stringify(activeExercises);
        if (!force && this.lastDataHash === currentHash) return;
        this.lastDataHash = currentHash;

        const pegasusGreen = "#00ff41";
        
        // 3. ΕΒΔΟΜΑΔΙΑΙΑ ΚΑΛΥΨΗ (Grid 2 στηλών)
        let htmlString = `
        <div style="background: rgba(0,0,0,0.85); border: 1px solid ${pegasusGreen}44; border-radius: 12px; padding: 12px; width: 100%; box-sizing: border-box; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 15px;">`;

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

        htmlString += `</div>`; // Κλείσιμο Grid

        // 4. ΡΟΗ ΠΡΟΠΟΝΗΣΗΣ (Οι ασκήσεις που βλέπεις αριστερά)
        htmlString += `
        <div style="border-top: 1px dashed ${pegasusGreen}33; padding-top: 12px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(85px, 1fr)); gap: 8px; justify-items: center;">`;

        activeExercises.forEach(ex => {
            const cleanName = ex.name.split('(')[0].trim().toLowerCase().replace(/ /g, '_');
            const imgPath = `images/exercises/${cleanName}.jpg`;
            
            htmlString += `
            <div style="text-align: center; width: 100%; background: rgba(255,255,255,0.02); padding: 5px; border-radius: 6px; border: 1px solid #222;">
                <div style="width: 100%; aspect-ratio: 1/1; background: #000; border-radius: 4px; overflow: hidden; margin-bottom: 4px; border: 1px solid ${pegasusGreen}11;">
                    <img src="${imgPath}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='images/placeholder.jpg';">
                </div>
                <div style="color: #fff; font-size: 7.5px; font-weight: 800; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: 0.3px;">
                    ${ex.name}
                </div>
            </div>`;
        });

        htmlString += `</div></div></div>`; 

        container.innerHTML = htmlString;
        container.style.display = "block";
    },

    checkWeeklyReset() {
        const lastResetKey = M?.system?.lastResetTimestamp || 'pegasus_last_reset_timestamp';
        const historyKey = M?.workout?.weekly_history || 'pegasus_weekly_history';
        
        const lastResetDate = localStorage.getItem(lastResetKey);
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        // Reset κάθε Δευτέρα (1)
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
