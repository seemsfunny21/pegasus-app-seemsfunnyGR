/* ==========================================================================
   PEGASUS PROGRESS VISUALIZER - CLEAN SWEEP v17.0
   Protocol: Monday Reset Automation | Logic: High-Glow Progress Bars
   ========================================================================== */

window.MuscleProgressUI = {
    /**
     * Αρχικοποίηση & Αυτόματη Ανανέωση
     */
    init() {
        this.checkWeeklyReset();
        this.render();
        
        // Refresh UI & Check για αλλαγή ημέρας ανά 5 δευτερόλεπτα
        setInterval(() => {
            this.checkWeeklyReset();
            this.render();
        }, 5000);
        
        console.log("✅ PEGASUS: Progress UI Engine Active.");
    },

    /**
     * Υπολογισμός Στατιστικών
     */
    calculateStats() {
        // Χρήση του κεντρικού αναλυτή για ομοιομορφία δεδομένων
        if (typeof window.getSortedMuscleGroups === 'function') {
            return window.getSortedMuscleGroups();
        }
        
        // Fallback Logic
        const history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
        const targets = JSON.parse(localStorage.getItem("pegasus_muscle_targets")) || 
                        (window.TARGET_SETS || { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 });

        return Object.keys(targets).map(group => {
            const done = parseInt(history[group]) || 0;
            const target = targets[group];
            const percent = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 100;
            return { name: group, done, target, percent };
        });
    },

    /**
     * Σχεδίαση UI - Tactical Grid 4-Column (Desktop) / List (Mobile)
     */
    render() {
        const container = document.getElementById('previewContent');
        if (!container) return;

        const stats = this.calculateStats();
        
        // Αφαίρεση παλιού wrapper αν υπάρχει
        const oldWrapper = document.getElementById("temp-progress-wrapper");
        if (oldWrapper) oldWrapper.remove();

        let htmlString = `<div id="temp-progress-wrapper" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:10px; padding:10px; background:#050505; border-radius:10px; border:1px solid #111; margin-bottom:15px;">`;

        stats.forEach(s => {
            // Δυναμικό χρώμα: Pegasus Green (#4CAF50)
            const color = "#4CAF50";
            const glow = s.percent >= 90 ? `box-shadow: 0 0 15px ${color};` : "";

            htmlString += `
            <div style="background:#0a0a0a; padding:10px; border-radius:8px; border:1px solid #1a1a1a; text-align:center;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                    <span style="font-size:9px; color:#666; font-weight:900; letter-spacing:1px; text-transform:uppercase;">${s.name}</span>
                    <span style="font-size:10px; color:#4CAF50; font-weight:900;">${s.percent}%</span>
                </div>
                <div style="background:#000; height:6px; border-radius:3px; overflow:hidden; border:1px solid #222; position:relative;">
                    <div style="width:${s.percent}%; height:100%; background:${color}; ${glow} transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);"></div>
                </div>
                <div style="font-size:8px; color:#444; margin-top:4px; font-weight:bold;">${s.done} / ${s.target} SETS</div>
            </div>`;
        });

        htmlString += `</div>`;
        container.insertAdjacentHTML('afterbegin', htmlString);
    },

    /**
     * Πρωτόκολλο Αυτόματου Reset (Κάθε Δευτέρα)
     */
    checkWeeklyReset() {
        const lastResetDate = localStorage.getItem('pegasus_last_reset_timestamp');
        const now = new Date();
        const todayStr = now.toDateString(); 

        // Έλεγχος: Αν είναι Δευτέρα (getDay === 1) και δεν έχει γίνει reset σήμερα
        if (now.getDay() === 1 && lastResetDate !== todayStr) {
            if (window.PegasusLogger) window.PegasusLogger.log("Weekly Reset Protocol Initiated: Monday 00:00", "INFO");
            
            const emptyHistory = {
                "Στήθος": 0, "Πλάτη": 0, "Πόδια": 0, "Χέρια": 0, "Ώμοι": 0, "Κορμός": 0
            };
            
            localStorage.setItem('pegasus_weekly_history', JSON.stringify(emptyHistory));
            localStorage.setItem('pegasus_last_reset_timestamp', todayStr);
            
            // Push κενά δεδομένα στο Cloud για συγχρονισμό όλων των συσκευών
            if (window.PegasusCloud && window.PegasusCloud.isUnlocked) {
                window.PegasusCloud.push(true);
            }

            console.log("⚠️ PEGASUS: Weekly Progress Reset Completed.");
            this.render();
        }
    }
};

// Boot Progress Engine
window.addEventListener('load', () => window.MuscleProgressUI.init());