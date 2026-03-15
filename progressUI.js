/* ==========================================================================
   PEGASUS MUSCLE PROGRESS VISUALIZER - v6.0 (HYBRID AUDITOR)
   ========================================================================== */

window.MuscleProgressUI = {
    init() {
        this.checkWeeklyReset();
        this.auditAndSync();
        this.render();
        
        // Refresh κάθε 3 δευτερόλεπτα για απόλυτο συγχρονισμό
        setInterval(() => {
            this.auditAndSync();
            this.render();
        }, 3000);
    },

    // Συγχρονισμός: Διαβάζει το Pegasus History + Υπολογίζει Cumulative Cardio
    auditAndSync() {
        let history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {
            "Στήθος": 0, "Πλάτη": 0, "Πόδια": 0, "Χέρια": 0, "Ώμοι": 0, "Κορμός": 0
        };
        
        // 1. Υπολογισμός Συνολικών Χιλιομέτρων Εβδομάδας
        let totalKm = 0;
        const now = new Date();
        for (let i = 0; i < 7; i++) {
            let d = new Date();
            d.setDate(now.getDate() - i);
            let dateKey = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
            let raw = localStorage.getItem(`cardio_log_${dateKey}`);
            if (raw) {
                totalKm += parseFloat(JSON.parse(raw).km) || 0;
            }
        }

        // 2. Υπολογισμός Σετ Ποδιών: 6 (Standard EMS) + (Συνολικά Km / 3.33)
        const cyclingSets = Math.round(totalKm / 3.33);
        const calculatedLegs = 6 + cyclingSets;

        // 3. Ενημέρωση LocalStorage μόνο αν υπάρχει αλλαγή
        if (history["Πόδια"] !== calculatedLegs) {
            history["Πόδια"] = calculatedLegs;
            localStorage.setItem('pegasus_weekly_history', JSON.stringify(history));
        }
    },

    calculateStats() {
        const history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
        const targets = { 
            "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 
        };

        return Object.keys(targets).map(group => {
            const done = parseInt(history[group]) || 0;
            const target = targets[group];
            const percent = Math.min(100, Math.round((done / target) * 100));
            return { name: group, done, target, percent };
        });
    },

    render() {
        // Εύρεση Container (Modal ή Main Page)
        const container = document.getElementById('previewContent') || 
                          document.querySelector('.daily-program-container');
        if (!container) return;

        const oldWrapper = document.getElementById('temp-progress-wrapper');
        if (oldWrapper) oldWrapper.remove();

        const stats = this.calculateStats();
        
        let htmlString = `
            <div id="muscle-progress-section" style="width: 100%; background: #000; padding: 15px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #333; box-sizing: border-box; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
                <h3 style="color:#4CAF50; text-align:center; font-size:13px; margin-bottom:15px; text-transform:uppercase; letter-spacing:1px; margin-top:0; font-family: sans-serif;">
                    Weekly Muscle Coverage
                </h3>
        `;
        
        stats.forEach(s => {
            const isDone = s.percent >= 100;
            const color = isDone ? "#4CAF50" : "#ff9800";
            const diff = s.target - s.done;
            const statusText = isDone ? "DONE" : `-${diff} SETS`;

            htmlString += `
                <div style="margin-bottom: 12px; width: 100%;">
                    <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px; color:#eee; font-family: sans-serif;">
                        <span>${s.name.toUpperCase()}</span>
                        <span>
                            ${s.done}/${s.target} <span style="color:${color}; font-weight:bold; margin-left:5px;">(${statusText})</span>
                        </span>
                    </div>
                    <div style="width:100%; height:6px; background:#1a1a1a; border-radius:3px; overflow:hidden; border: 1px solid #222;">
                        <div style="width:${s.percent}%; height:100%; background:${color}; transition: width 0.8s ease-in-out;"></div>
                    </div>
                </div>
            `;
        });

        htmlString += `</div><div style="width: 100%; text-align:center; color:#444; font-size:10px; margin-bottom:15px; letter-spacing:2px; font-family: sans-serif;">——— ΗΜΕΡΗΣΙΕΣ ΑΣΚΗΣΕΙΣ ———</div>`;

        const tempDiv = document.createElement('div');
        tempDiv.id = "temp-progress-wrapper";
        tempDiv.style.width = "100%";
        tempDiv.innerHTML = htmlString;
        container.prepend(tempDiv);
    },

    checkWeeklyReset() {
        const now = new Date();
        const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        const currentWeekKey = `${d.getUTCFullYear()}-W${weekNum}`;
        const lastReset = localStorage.getItem('pegasus_last_weekly_reset');

        if (lastReset !== currentWeekKey) {
            localStorage.setItem('pegasus_weekly_history', JSON.stringify({
                "Στήθος": 0, "Πλάτη": 0, "Πόδια": 0, "Χέρια": 0, "Ώμοι": 0, "Κορμός": 0
            }));
            localStorage.setItem('pegasus_last_weekly_reset', currentWeekKey);
        }
    }
};

// Εκτέλεση
MuscleProgressUI.init();