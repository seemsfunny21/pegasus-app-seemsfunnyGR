/* =============================================================
   PEGASUS UNIFIED LOGIC & METABOLIC ENGINE (74kg / 1.87m)
   Version: 3.5 Persistent Storage & Recovery Integrated
   ============================================================= */

const PegasusLogic = {
    userWeight: 74,
    storageKey: "pegasus_daily_summary",

    /**
     * 1. INITIALIZATION & AUTO-COMMIT
     * Ρυθμίζει τους listeners για άμεση αποθήκευση των κιλών.
     */
    init: function() {
        console.log("PEGASUS: Initializing Real-time Weight Listeners...");
        
        // Ανάκτηση θερμίδων από προηγούμενη συνεδρία (Refresh Persistence)
        const savedKcal = localStorage.getItem("pegasus_today_kcal") || "0.0";
        const kcalDisplay = document.querySelector(".kcal-value");
        if (kcalDisplay) kcalDisplay.textContent = savedKcal;

        document.querySelectorAll('.weight-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const node = e.target.closest('.exercise-node');
                if (node) {
                    const exName = node.querySelector('.exercise-name').textContent.trim().replace(" ☀️", "");
                    const weightVal = parseFloat(e.target.value) || 0;
                    // Ακαριαίο commit στο localStorage
                    localStorage.setItem(`weight_ANGELOS_${exName}`, weightVal);
                }
            });
        });
    },

    /**
     * 2. METABOLIC ENGINE (74kg Calibration)
     */
    getMET: function(exerciseName, weight) {
        if (exerciseName.includes("Ποδηλασία")) return 10.0; // Saturday Goal
        if (exerciseName.includes("Προθέρμανση")) return 3.0;

        let baseMET = 7.0; 
        if (weight > 0) {
            const loadRatio = weight / this.userWeight;
            baseMET += (loadRatio * 5); // Δυναμική ένταση βάσει φορτίου (π.χ. 66kg)
        }
        return baseMET;
    },

    trackMetabolism: function(durationSeconds, exerciseName) {
        const lockedWeight = parseFloat(localStorage.getItem(`weight_ANGELOS_${exerciseName}`)) || 0;
        const activeMET = this.getMET(exerciseName, lockedWeight);
        const durationMins = durationSeconds / 60;
        
        // Φόρμουλα: (MET * 3.5 * 74kg / 200) * Duration
        const kcalPerMin = (activeMET * 3.5 * this.userWeight) / 200;
        const addedKcal = (kcalPerMin * durationMins);

        let dailyTotal = parseFloat(localStorage.getItem("pegasus_today_kcal") || "0");
        dailyTotal += addedKcal;
        
        // ΑΠΟΘΗΚΕΥΣΗ ΣΤΟ STORAGE (Fix for Refresh)
        localStorage.setItem("pegasus_today_kcal", dailyTotal.toFixed(2));
        return dailyTotal.toFixed(1);
    },

    /**
     * 3. PERSISTENT TIMER UPDATE
     * Πρέπει να καλείται κάθε δευτερόλεπτο από το setInterval του app.js
     */
    updateMetabolicData: function() {
        const activeNode = document.querySelector('.exercise-node.active');
        if (activeNode && window.running) {
            const exName = activeNode.querySelector('.exercise-name').textContent.trim().replace(" ☀️", "");
            
            // Υπολογισμός και αποθήκευση
            const newTotal = this.trackMetabolism(1, exName); 

            // Ενημέρωση UI
            const kcalDisplay = document.querySelector(".kcal-value");
            if (kcalDisplay) kcalDisplay.textContent = newTotal;
        }
    },

    /**
     * 4. RECOVERY & NUTRITION LOGIC (Κουκί & Ρεβύθι)
     */
    getRecoveryStatus: function() {
        const daysGR = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
        const todayIdx = new Date().getDay();
        const todayName = daysGR[todayIdx];
        
        const isRestDay = (todayIdx === 1 || todayIdx === 4); // Δευτέρα & Πέμπτη
        const isCyclingDay = (todayIdx === 6); // Σάββατο

        let instruction = "";
        let nutrition = "";

        if (isRestDay) {
            instruction = `⚠️ RECOVERY DAY (${todayName})`;
            nutrition = "ΚΟΥΚΙ & ΡΕΒΥΘΙ: Σαλάτα οσπρίων & έξτρα πρωτεΐνη. Αποφυγή αμύλου.";
        } else if (isCyclingDay) {
            instruction = "🚲 ENDURANCE DAY (30km)";
            nutrition = "STRATEGY: Ρεβύθια με ρύζι. Χρειάζεσαι γλυκογόνο για την ποδηλασία.";
        } else {
            instruction = "⚡ TRAINING MODE ACTIVE";
            nutrition = "FUEL: Υψηλή ένταση (66kg+). Χρειάζεσαι σύνθετο υδατάνθρακα.";
        }

        return { isRestDay, msg: instruction, nutrition: nutrition };
    }
};

// Initial Call
window.addEventListener('load', () => PegasusLogic.init());
window.PegasusLogic = PegasusLogic;