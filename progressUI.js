/* ==========================================================================
   PEGASUS MUSCLE PROGRESS VISUALIZER - ROBUST EDITION (STABLE)
   ========================================================================== */

const MuscleProgressUI = {
    targets: { 
        "Πλάτη": 18, 
        "Στήθος": 14, 
        "Χέρια": 18, 
        "Κορμός": 15, 
        "Πόδια": 6 
    },

    init() {
        this.checkWeeklyReset();
    },

    calculateStats() {
        const history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
        return Object.keys(this.targets).map(group => {
            const done = history[group] || 0;
            const target = this.targets[group];
            const percent = Math.min(100, Math.round((done / target) * 100));
            return { name: group, done, target, percent };
        });
    },

    render() {
        const container = document.getElementById('previewContent'); 
        if (!container) {
            console.error("Pegasus Alert: previewContent not found in DOM");
            return;
        }

        // Αφαίρεση παλιού wrapper αν υπάρχει για αποφυγή διπλότυπων
        const oldWrapper = document.getElementById('temp-progress-wrapper');
        if (oldWrapper) oldWrapper.remove();

        const stats = this.calculateStats();
        
        let htmlString = `
            <div id="muscle-progress-section" style="width: 100%; background: #0a0a0a; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #222; box-sizing: border-box;">
                <h3 style="color:#4CAF50; text-align:center; font-size:13px; margin-bottom:15px; text-transform:uppercase; letter-spacing:1px; margin-top:0;">
                    Weekly Muscle Coverage
                </h3>
        `;
        
        stats.forEach(s => {
            const color = s.percent >= 100 ? "#4CAF50" : "#ff9800";
            const isLow = s.percent < 30 ? '<span style="color:#ff4444; font-size:9px; margin-left:5px;">[LOW]</span>' : '';

            htmlString += `
                <div style="margin-bottom: 12px; width: 100%;">
                    <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px; color:#eee;">
                        <span>${s.name.toUpperCase()} ${isLow}</span>
                        <span style="font-family: monospace;">${s.done}/${s.target} Sets (${s.percent}%)</span>
                    </div>
                    <div style="width:100%; height:6px; background:#1a1a1a; border-radius:3px; overflow:hidden; border: 1px solid #333;">
                        <div style="width:${s.percent}%; height:100%; background:${color}; transition: width 1s ease-in-out;"></div>
                    </div>
                </div>
            `;
        });

        htmlString += `</div><div style="width: 100%; text-align:center; color:#444; font-size:10px; margin-bottom:15px; letter-spacing:2px;">——— ΗΜΕΡΗΣΙΕΣ ΑΣΚΗΣΕΙΣ ———</div>`;

        const tempDiv = document.createElement('div');
        tempDiv.id = "temp-progress-wrapper";
        tempDiv.style.width = "100%";
        tempDiv.innerHTML = htmlString;

        container.prepend(tempDiv);
    },

    checkWeeklyReset() {
        const now = new Date();
        const currentYear = now.getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        // Υπολογισμός αριθμού εβδομάδας ISO
        const weekNum = Math.ceil((((now - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7);
        const currentWeekKey = `${currentYear}-W${weekNum}`;
        const lastReset = localStorage.getItem('pegasus_last_weekly_reset');

        if (lastReset !== currentWeekKey) {
            localStorage.setItem('pegasus_weekly_history', JSON.stringify({
                "Πλάτη": 0, "Στήθος": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0
            }));
            localStorage.setItem('pegasus_last_weekly_reset', currentWeekKey);
            console.log("PEGASUS: Weekly Progress Reset to 0.");
        }
    }
};

// Εκκίνηση κατά το φόρτωμα
document.addEventListener('DOMContentLoaded', () => MuscleProgressUI.init());