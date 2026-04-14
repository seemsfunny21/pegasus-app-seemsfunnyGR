/* ==========================================================================
   PEGASUS OS - EMS MODULE (MOBILE EDITION v14.2 MAXIMALIST)
   Protocol: Full Body Stimulation, Cardio Guard & Achievement Sync
   Status: FINAL STABLE | INTEGRATED DATA SHIELD
   ========================================================================== */

window.PegasusEMS = {
    timer: null,
    seconds: 1500, // 25 λεπτά Baseline

    start: function() {
        if (this.timer) return;
        this.timer = setInterval(() => this.tick(), 1000);
        const controls = document.getElementById('emsTimeControls');
        if (controls) controls.style.display = 'grid';
        console.log("⚡ EMS: Session Started. Tactical Timer Active.");
    },

    tick: function() {
        if (this.seconds <= 0) {
            clearInterval(this.timer);
            this.complete();
            return;
        }
        this.seconds--;
        this.updateUI();
    },

    adjust: function(secs) {
        this.seconds = Math.max(0, this.seconds + secs);
        this.updateUI();
    },

    updateUI: function() {
        const min = String(Math.floor(this.seconds/60)).padStart(2,'0');
        const sec = String(this.seconds%60).padStart(2,'0');
        
        const timerEl = document.getElementById('phaseTimer');
        const barEl = document.getElementById('mainProgressBar');
        const pctEl = document.getElementById('totalProgress');

        if (timerEl) timerEl.textContent = `${min}:${sec}`;
        
        const progress = ((1500 - this.seconds) / 1500) * 100;
        if (barEl) barEl.style.width = progress + '%';
        if (pctEl) pctEl.textContent = Math.round(progress) + '%';
    },

    complete: async function() {
        const kcal = prompt("ΣΥΝΟΛΙΚΑ KCAL ΣΥΝΕΔΡΙΑΣ:", "747");
        if (kcal) {
            console.log("⚡ EMS: Finalizing Session & Syncing Data...");
            
            let h = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
            const groups = ["Στήθος", "Πλάτη", "Πόδια", "Χέρια", "Ώμοι", "Κορμός"];
            
            // --- 0. DATE PREPARATION (UNIFIED PROTOCOL) ---
            const rawDate = new Date();
            const dateStr = `${rawDate.getDate()}/${rawDate.getMonth() + 1}/${rawDate.getFullYear()}`;
            
            // --- 1. CARDIO GUARD: Έλεγχος αν έγινε ποδήλατο σήμερα ---
            const hasCardio = localStorage.getItem("pegasus_cardio_kcal_" + dateStr);

            groups.forEach(g => {
                if (g === "Πόδια" && hasCardio) {
                    console.log("⚡ EMS: Skipping Legs (Already covered by Cardio).");
                } else {
                    h[g] = (h[g] || 0) + 6; // Πίστωση 6 σετ ανά ομάδα
                }
            });

            // --- 2. 🏆 ACHIEVEMENT SYNC (XP/LIFETIME STATS) ---
            // Το EMS θεωρείται Full Body Session (36 sets total)
            let stats = JSON.parse(localStorage.getItem('pegasus_stats')) || { totalSets: 0, exerciseHistory: {} };
            stats.totalSets = (stats.totalSets || 0) + 36;
            localStorage.setItem('pegasus_stats', JSON.stringify(stats));

            // --- 3. FINAL SAVE & SYNC ---
            localStorage.setItem('pegasus_weekly_history', JSON.stringify(h));
            
            console.log("✅ EMS: History & XP Synced Successfully.");
            
            if (window.PegasusCloud) {
                // Χρήση true για παράκαμψη του debounce freeze
                await window.PegasusCloud.push(true);
            }
            
            location.reload();
        }
    }
};
