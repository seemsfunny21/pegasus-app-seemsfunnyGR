/* ==========================================================================
   PEGASUS MUSCLE PROGRESS VISUALIZER - v7.3 (DATE SYNC FIX)
   ========================================================================== */

window.MuscleProgressUI = {
    lastDataHash: null,

    init() {
        this.checkWeeklyReset();
        setTimeout(() => this.render(true), 500);
        
        setInterval(() => {
            this.checkWeeklyReset();
            this.render();
        }, 3000);
    },

calculateStats() {
        const history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
        
        // 🛡️ ΠΡΟΤΕΡΑΙΟΤΗΤΑ ΣΤΟ ΔΥΝΑΜΙΚΟ ΠΛΑΝΟ ΤΟΥ DATA.JS
        const targets = (typeof window.getDynamicTargets === "function") 
            ? window.getDynamicTargets() 
            : (JSON.parse(localStorage.getItem("pegasus_muscle_targets")) || 
              { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 });

        return Object.keys(targets).map(group => {
            const target = targets[group];
            if (target === 0) return null; // Φιλτράρισμα κενών στόχων

            const done = parseInt(history[group]) || 0;
            return {
                name: group,
                done: done,
                target: target,
                percent: Math.min((done / target) * 100, 100)
            };
        }).filter(item => item !== null);
    },

    render(force = false) {
        const container = document.getElementById("muscleProgressContainer");
        if (!container) return;

        const stats = this.calculateStats();
        const currentHash = JSON.stringify(stats);

        if (!force && this.lastDataHash === currentHash) return;
        this.lastDataHash = currentHash;

        let htmlString = `<div style="display:flex; flex-direction:column; gap:15px; width:100%;">`;
        
        const pegasusGreen = "var(--main, #00ff41)";

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
        const lastResetDate = localStorage.getItem('pegasus_last_reset_timestamp');
        const now = new Date();
        
        // 🛡️ PHANTOM SATURDAY FIX: Χρήση του ίδιου Date Format με τον Optimizer (YYYY-MM-DD)
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        if (now.getDay() === 6 && lastResetDate !== todayStr) {
            const emptyHistory = { "Στήθος": 0, "Πλάτη": 0, "Πόδια": 0, "Χέρια": 0, "Ώμοι": 0, "Κορμός": 0 };
            localStorage.setItem('pegasus_weekly_history', JSON.stringify(emptyHistory));
            localStorage.setItem('pegasus_last_reset_timestamp', todayStr);
            this.lastDataHash = null;
            if (window.PegasusCloud) window.PegasusCloud.push(true);
            console.log("🛡️ PEGASUS UI: Auto-Reset Triggered for Saturday.");
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    window.MuscleProgressUI.init();
});
