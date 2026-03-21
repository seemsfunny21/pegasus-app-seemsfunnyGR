/* ==========================================================================
   PEGASUS MUSCLE PROGRESS VISUALIZER - v6.1 (STRICT ANALYST FIX)
   ========================================================================== */

window.MuscleProgressUI = {
    init() {
        this.checkWeeklyReset();
        this.auditAndSync();
        this.render();
        
        setInterval(() => {
            this.auditAndSync();
            this.render();
        }, 3000);
    },

    auditAndSync() {
        let history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {
            "Στήθος": 0, "Πλάτη": 0, "Πόδια": 0, "Χέρια": 0, "Ώμοι": 0, "Κορμός": 0
        };
        
        let totalKm = 0;
        const now = new Date();
        
        // Βρίσκουμε την τελευταία Δευτέρα για να μετράμε ΜΟΝΟ την τρέχουσα εβδομάδα
        const lastMonday = new Date();
        const day = lastMonday.getDay();
        const diff = lastMonday.getDate() - day + (day === 0 ? -6 : 1);
        lastMonday.setDate(diff);
        lastMonday.setHours(0,0,0,0);

        for (let i = 0; i < 7; i++) {
            let d = new Date();
            d.setDate(now.getDate() - i);
            
            // Αν η ημέρα που ελέγχουμε είναι πριν την τρέχουσα Δευτέρα, την αγνοούμε
            if (d < lastMonday) continue;

            let dateKey = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
            let raw = localStorage.getItem(`cardio_log_${dateKey}`);
            if (raw) {
                totalKm += parseFloat(JSON.parse(raw).km) || 0;
            }
        }

        // Υπολογισμός: Αν δεν υπάρχει cardio/ems αυτή την εβδομάδα, τα σετ είναι 0
        const cyclingSets = totalKm > 0 ? Math.round(totalKm / 3.33) : 0;
        
        // Έλεγχος αν σήμερα είναι Τετάρτη και αν έχει γίνει το EMS (για το base 6)
        const isWednesdayDone = localStorage.getItem(`ems_log_${now.toISOString().split('T')[0]}`);
        const baseEMS = isWednesdayDone ? 6 : 0;

        const calculatedLegs = baseEMS + cyclingSets;

        if (history["Πόδια"] !== calculatedLegs) {
            history["Πόδια"] = calculatedLegs;
            localStorage.setItem('pegasus_weekly_history', JSON.stringify(history));
            // Push στο cloud αμέσως για να ενημερωθεί η "πηγή"
            if (window.PegasusCloud) window.PegasusCloud.push(true);
        }
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
MuscleProgressUI.init();