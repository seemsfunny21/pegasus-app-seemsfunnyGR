/* ==========================================================================
   PEGASUS MUSCLE PROGRESS VISUALIZER - v7.0 (STABLE DOM ALIGNMENT)
   Protocol: Strict Data Analyst - Independent Container Logic
   ========================================================================== */

window.MuscleProgressUI = {
    lastDataHash: null,

    init() {
        this.checkWeeklyReset();
        // Εκτέλεση με μικρή καθυστέρηση για να προλάβει το DOM
        setTimeout(() => this.render(true), 500);
        
        setInterval(() => {
            this.checkWeeklyReset();
            this.render();
        }, 3000);
    },

    calculateStats() {
        const history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
        const targets = JSON.parse(localStorage.getItem("pegasus_muscle_targets")) || 
                        { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 };

        return Object.keys(targets).map(group => {
            const done = parseInt(history[group]) || 0;
            const target = targets[group];
            const percent = Math.min(100, Math.round((done / target) * 100));
            return { name: group, done, target, percent };
        });
    },

    render(force = false) {
        // 🎯 ΣΤΟΧΕΥΣΗ ΣΤΟ ΑΥΣΤΗΡΟ CONTAINER (Όχι στο previewContent)
        const container = document.getElementById('muscleProgressContainer');
        if (!container) return;

        const stats = this.calculateStats();
        const currentDataHash = JSON.stringify(stats);

        if (!force && this.lastDataHash === currentDataHash) return; 
        this.lastDataHash = currentDataHash;

        const pegasusGreen = "#4CAF50";
        let htmlString = `<div style="width: 100%; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; box-sizing: border-box;">
            <h3 style="color:${pegasusGreen}; text-align:center; font-size:11px; margin-bottom:12px; text-transform:uppercase; margin-top:0; letter-spacing:1px; font-weight:900;">Weekly Muscle Coverage</h3>`;
        
        stats.forEach(s => {
            const isDone = s.percent >= 100;
            const diff = s.target - s.done;
            htmlString += `<div style="margin-bottom: 10px; width: 100%;">
                <div style="display:flex; justify-content:space-between; font-size:10px; margin-bottom:3px; color:#eee; font-weight:bold;">
                    <span>${s.name.toUpperCase()}</span>
                    <span>${s.done}/${s.target} <span style="color:${pegasusGreen};">${isDone ? "🎯 OPTIMIZED" : ""}</span></span>
                </div>
                <div style="width:100%; height:6px; background:#111; border-radius:3px; overflow:hidden; border:1px solid #222;">
                    <div style="width:${s.percent}%; height:100%; background:${pegasusGreen}; box-shadow: 0 0 8px ${pegasusGreen}88; transition: width 0.8s ease-in-out;"></div>
                </div>
            </div>`;
        });
        htmlString += `</div>`;

        // ⚡ INSTANT INJECTION
        container.innerHTML = htmlString;
        container.style.display = "block";
    },

    checkWeeklyReset() {
        const lastResetDate = localStorage.getItem('pegasus_last_reset_timestamp');
        const now = new Date();
        const todayStr = now.toDateString();

        // Reset κάθε Δευτέρα
        if (now.getDay() === 1 && lastResetDate !== todayStr) {
            const emptyHistory = { "Στήθος": 0, "Πλάτη": 0, "Πόδια": 0, "Χέρια": 0, "Ώμοι": 0, "Κορμός": 0 };
            localStorage.setItem('pegasus_weekly_history', JSON.stringify(emptyHistory));
            localStorage.setItem('pegasus_last_reset_timestamp', todayStr);
            console.log("PEGASUS SYSTEM: Weekly Reset Executed.");
            this.render(true);
        }
    }
};

// Initialization
if (document.readyState === 'complete') {
    window.MuscleProgressUI.init();
} else {
    window.addEventListener('load', () => window.MuscleProgressUI.init());
}
