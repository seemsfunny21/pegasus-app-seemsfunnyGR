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

        // 1. Λήψη δεδομένων και τρέχουσας ημέρας
        const { history, targets } = this.calculateStats();
        const days = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
        const todayName = days[new Date().getDay()];
        
        // Φιλτράρισμα: Μόνο οι ασκήσεις που ανήκουν στη σημερινή ημέρα
        const todayExercises = window.program[todayName] || [];

        const currentHash = JSON.stringify(history) + JSON.stringify(targets) + todayName;
        if (!force && this.lastDataHash === currentHash) return;
        this.lastDataHash = currentHash;

        const pegasusGreen = "#00ff41";
        
        // Κεντρικό Container (Dark & Compact)
        let htmlString = `<div style="background: rgba(0,0,0,0.9); border: 1px solid ${pegasusGreen}44; border-radius: 12px; padding: 15px; width: 100%; box-sizing: border-box; font-family: sans-serif;">`;

        // 2. ΕΒΔΟΜΑΔΙΑΙΕΣ ΜΠΑΡΕΣ (Μόνο οι 6 που ζήτησες)
        htmlString += `<h4 style="color:${pegasusGreen}; font-size:11px; text-align:center; margin:0 0 12px 0; text-transform:uppercase; letter-spacing:1px;">Weekly Coverage</h4>
                       <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px;">`;
        
        const strictGroups = ["Στήθος", "Πλάτη", "Πόδια", "Χέρια", "Ώμοι", "Κορμός"];
        
        strictGroups.forEach(name => {
            const target = targets[name] || 0;
            const done = parseInt(history[name]) || 0;
            const percent = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;

            htmlString += `
            <div style="background: rgba(255,255,255,0.02); padding: 6px; border-radius: 6px; border: 1px solid #222;">
                <div style="display: flex; justify-content: space-between; font-size: 9px; color: #eee; margin-bottom: 3px; font-weight: bold;">
                    <span>${name.toUpperCase()}</span>
                    <span style="color: ${pegasusGreen};">${done}/${target}</span>
                </div>
                <div style="width: 100%; height: 5px; background: #111; border-radius: 3px; overflow: hidden; border: 1px solid #222;">
                    <div style="width: ${percent}%; height: 100%; background: ${pegasusGreen}; box-shadow: 0 0 8px ${pegasusGreen}; transition: width 1s ease-in-out;"></div>
                </div>
            </div>`;
        });
        htmlString += `</div>`;

        // 3. ΦΩΤΟΓΡΑΦΙΕΣ ΑΣΚΗΣΕΩΝ ΗΜΕΡΑΣ (Μόνο σήμερα)
        htmlString += `<div style="border-top: 1px dashed ${pegasusGreen}33; padding-top: 15px;">
                        <h4 style="color:${pegasusGreen}; font-size:10px; text-align:center; margin:0 0 10px 0; text-transform:uppercase;">Today's Exercises: ${todayName}</h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 10px; justify-items: center;">`;

        if (todayExercises.length > 0 && todayExercises[0].name !== "Stretching") {
            todayExercises.forEach(ex => {
                // Δημιουργία path για τη φωτογραφία (υποθέτοντας τη δομή του Pegasus)
                const imgPath = `images/exercises/${ex.name.toLowerCase().replace(/ /g, '_')}.jpg`;
                
                htmlString += `
                <div style="text-align: center; width: 100%;">
                    <div style="width: 100%; aspect-ratio: 1/1; background: #111; border: 1px solid ${pegasusGreen}22; border-radius: 6px; overflow: hidden; margin-bottom: 4px;">
                        <img src="${imgPath}" alt="${ex.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='images/placeholder.jpg';">
                    </div>
                    <div style="color: #fff; font-size: 8px; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${ex.name}</div>
                </div>`;
            });
        } else {
            const msg = todayExercises[0]?.name === "Stretching" ? "STRETCHING" : "REST DAY";
            htmlString += `<div style="grid-column: 1/-1; color: #555; font-size: 10px; font-style: italic; padding: 10px;">${msg}</div>`;
        }

        htmlString += `</div></div></div>`;

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
