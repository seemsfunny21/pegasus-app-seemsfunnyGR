/* ==========================================================================
   PEGASUS MUSCLE PROGRESS VISUALIZER - v6.4 (STRICT RESET EDITION)
   Protocol: Background Automation Reset Enabled
   ========================================================================== */

window.MuscleProgressUI = {
    init() {
        this.checkWeeklyReset();
        this.render();
        
        // Auto-refresh UI & Reset Check κάθε 3 δευτερόλεπτα
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

render() {
        const container = document.getElementById('previewContent') || document.querySelector('.daily-program-container');
        if (!container) return;

        const oldWrapper = document.getElementById('temp-progress-wrapper');
        if (oldWrapper) oldWrapper.remove();

        const stats = this.calculateStats();
        
        // ΟΡΘΟΔΟΞΟ ΠΡΑΣΙΝΟ PEGASUS ΓΙΑ ΟΛΕΣ ΤΙΣ ΜΠΑΡΕΣ
        const pegasusGreen = "#4CAF50";
        
        let htmlString = `<div id="muscle-progress-section" style="width: 100%; background: #070707; padding: 15px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #4CAF50; box-sizing: border-box; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
            <h3 style="color:#4CAF50; text-align:center; font-size:12px; margin-bottom:15px; text-transform:uppercase; margin-top:0; letter-spacing:1px;">Weekly Muscle Coverage</h3>`;
        
        stats.forEach(s => {
            const isDone = s.percent >= 100;
            // ΕΔΩ ΗΤΑΝ ΤΟ ΠΟΡΤΟΚΑΛΙ - ΤΩΡΑ ΕΙΝΑΙ ΠΑΝΤΑ ΠΡΑΣΙΝΟ
            const color = pegasusGreen; 
            const diff = s.target - s.done;

            htmlString += `<div style="margin-bottom: 12px; width: 100%;">
                <div style="display:flex; justify-content:space-between; font-size:10px; margin-bottom:4px; color:#aaa; font-weight:bold;">
                    <span>${s.name.toUpperCase()}</span>
                    <span>${s.done}/${s.target} <span style="color:${color};">${isDone ? "COMPLETE" : `NEED ${diff}`}</span></span>
                </div>
                <div style="width:100%; height:6px; background:#111; border-radius:3px; overflow:hidden; border:1px solid #222;">
                    <div style="width:${s.percent}%; height:100%; background:${color}; box-shadow: 0 0 8px ${color}66; transition: width 0.8s ease-in-out;"></div>
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
        const lastResetDate = localStorage.getItem('pegasus_last_reset_timestamp');
        const now = new Date();
        const todayStr = now.toDateString(); // π.χ. "Mon Mar 23 2026"

        // Έλεγχος: Αν είναι Δευτέρα (getDay === 1) και δεν έχει γίνει reset σήμερα
        if (now.getDay() === 1 && lastResetDate !== todayStr) {
            const emptyHistory = {
                "Στήθος": 0, "Πλάτη": 0, "Πόδια": 0, "Χέρια": 0, "Ώμοι": 0, "Κορμός": 0
            };
            localStorage.setItem('pegasus_weekly_history', JSON.stringify(emptyHistory));
            localStorage.setItem('pegasus_last_reset_timestamp', todayStr);
            
            console.log("PEGASUS SYSTEM: Weekly Reset Executed for " + todayStr);
            
            // Επιβολή άμεσης επανασχεδίασης
            this.render();
        }
    }
};

window.addEventListener('load', () => {
    MuscleProgressUI.init();
});
