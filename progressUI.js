/* ==========================================================================
   PEGASUS MUSCLE PROGRESS VISUALIZER - v7.0 (MODULAR / FULLY DECOUPLED)
   Protocol: Strict Data Analyst - Isolated Background Automation Reset
   ========================================================================== */

const PegasusProgressUI = (function() {
    // 1. ΙΔΙΩΤΙΚΕΣ ΛΕΙΤΟΥΡΓΙΕΣ (Private Methods)
    const checkWeeklyReset = () => {
        const lastResetDate = localStorage.getItem('pegasus_last_reset_timestamp');
        const now = new Date();
        const todayStr = now.toDateString(); 

        // Έλεγχος: Αν είναι Δευτέρα (getDay === 1) και δεν έχει γίνει reset σήμερα
        if (now.getDay() === 1 && lastResetDate !== todayStr) {
            const emptyHistory = {
                "Στήθος": 0, "Πλάτη": 0, "Πόδια": 0, "Χέρια": 0, "Ώμοι": 0, "Κορμός": 0
            };
            localStorage.setItem('pegasus_weekly_history', JSON.stringify(emptyHistory));
            localStorage.setItem('pegasus_last_reset_timestamp', todayStr);
            console.log("[PEGASUS PROGRESS]: Weekly history automated reset executed.");
        }
    };

    const calculateStats = () => {
        const history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
        const targets = JSON.parse(localStorage.getItem("pegasus_muscle_targets")) || 
                        { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 };

        return Object.keys(targets).map(group => {
            const done = parseInt(history[group]) || 0;
            const target = targets[group];
            const percent = Math.min(100, Math.round((done / target) * 100));
            return { name: group, done, target, percent };
        });
    };

    const render = () => {
        const container = document.getElementById('previewContent') || document.querySelector('.daily-program-container');
        if (!container) return;

        // Αφαίρεση προηγούμενου wrapper για αποφυγή διπλότυπων DOM nodes
        const existing = document.getElementById("temp-progress-wrapper");
        if (existing) existing.remove();

        const stats = calculateStats();
        let htmlString = `<div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:10px; margin-bottom:15px;">`;

        stats.forEach(s => {
            let color = s.percent >= 100 ? "#4CAF50" : (s.percent > 50 ? "#FFC107" : "#F44336");
            htmlString += `
            <div style="background:#111; padding:10px; border-radius:5px; border:1px solid #222;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:12px;">
                    <span style="color:#fff;">${s.name}</span>
                    <span style="color:${color}; font-weight:bold;">${s.done}/${s.target}</span>
                </div>
                <div style="height:6px; background:#1a1a1a; border-radius:3px; overflow:hidden; border:1px solid #222;">
                    <div style="width:${s.percent}%; height:100%; background:${color}; transition: width 0.8s ease-in-out;"></div>
                </div>
            </div>`;
        });
        htmlString += `</div>`;

        const tempDiv = document.createElement('div');
        tempDiv.id = "temp-progress-wrapper";
        tempDiv.style.width = "100%";
        tempDiv.innerHTML = htmlString;
        container.prepend(tempDiv);
    };

    // 2. PUBLIC API
    return {
        init: function() {
            checkWeeklyReset();
            render();
            
            // Auto-refresh UI & Reset Check κάθε 3 δευτερόλεπτα
            setInterval(() => {
                checkWeeklyReset();
                render();
            }, 3000);
        },
        render: render // Εξάγεται για χειροκίνητη κλήση κατά το logging σετ (app.js)
    };
})();

// Εξαγωγή στο Window Scope για διασύνδεση με το Event System του app.js
window.addEventListener('DOMContentLoaded', PegasusProgressUI.init);
window.MuscleProgressUI = PegasusProgressUI;