/* ==========================================================================
   PEGASUS MUSCLE PROGRESS VISUALIZER - v6.2 (PASSIVE RENDER EDITION)
   ========================================================================== */

window.MuscleProgressUI = {
    init() {
        this.checkWeeklyReset();
        // Αφαιρέθηκε η κλήση this.auditAndSync() για αποτροπή επικάλυψης δεδομένων
        this.render();
        
        setInterval(() => {
            this.render();
        }, 3000);
    },

    calculateStats() {
        // Διαβάζει παθητικά το 'pegasus_weekly_history' που ενημερώνουν τα άλλα scripts
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

    render() {
        const container = document.getElementById('previewContent') || document.querySelector('.daily-program-container');
        if (!container) return;

        const oldWrapper = document.getElementById('temp-progress-wrapper');
        if (oldWrapper) oldWrapper.remove();

        const stats = this.calculateStats();
        
        let htmlString = `<div id="muscle-progress-section" style="width: 100%; background: #000; padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #333; box-sizing: border-box;">
            <h3 style="color:#4CAF50; text-align:center; font-size:13px; margin-bottom:15px; text-transform:uppercase;">Weekly Muscle Coverage</h3>`;
        
        stats.forEach(s => {
            const isDone = s.percent >= 100;
            const color = isDone ? "#4CAF50" : "#ff9800";
            const diff = s.target - s.done;
            htmlString += `<div style="margin-bottom: 12px; width: 100%;">
                <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px; color:#eee;">
                    <span>${s.name.toUpperCase()}</span>
                    <span>${s.done}/${s.target} <span style="color:${color}; font-weight:bold;">(${isDone ? "DONE" : `-${diff} SETS`})</span></span>
                </div>
                <div style="width:100%; height:6px; background:#1a1a1a; border-radius:3px; overflow:hidden;">
                    <div style="width:${s.percent}%; height:100%; background:${color}; transition: width 0.8s;"></div>
                </div>
            </div>`;
        });
        htmlString += `</div>`;

        const tempDiv = document.createElement('div');
        tempDiv.id = "temp-progress-wrapper";
        tempDiv.style.width = "100%";
        tempDiv.innerHTML = htmlString;
        container.prepend(tempDiv);
    },

    checkWeeklyReset() {
        const lastReset = localStorage.getItem('pegasus_last_weekly_reset');
        const now = new Date();
        const weekKey = `${now.getFullYear()}-W${Math.ceil(now.getDate() / 7)}`;

        if (lastReset !== weekKey && now.getDay() === 1) {
            localStorage.setItem('pegasus_weekly_history', JSON.stringify({
                "Στήθος": 0, "Πλάτη": 0, "Πόδια": 0, "Χέρια": 0, "Ώμοι": 0, "Κορμός": 0
            }));
            localStorage.setItem('pegasus_last_weekly_reset', weekKey);
        }
    }
};

window.addEventListener('load', () => {
    MuscleProgressUI.init();
});
