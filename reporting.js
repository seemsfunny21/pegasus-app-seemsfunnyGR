/* ==========================================================================
   PEGASUS REPORTING SYSTEM - ANALYST FIXED (v2.7)
   ========================================================================== */

const PegasusReporting = {
    storageKey: "pegasus_daily_summary",
    pendingReportKey: "pegasus_pending_report",
    historyKey: "pegasus_weekly_history",

    /**
     * 1. ΚΑΤΑΓΡΑΦΗ & DATA COMMIT
     */
    prepareAndSaveReport: function(kcal) {
        let dailyMax = {};
        let weeklyHistory = JSON.parse(localStorage.getItem(this.historyKey)) || {
            "Πλάτη": 0, "Στήθος": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0, "Άλλο": 0
        };

        const activeNodes = Array.from(document.querySelectorAll('.exercise'))
            .filter(node => parseInt(node.dataset.done || 0) > 0);

        if (activeNodes.length > 0) {
            activeNodes.forEach(node => {
                const name = node.querySelector('.exercise-name').textContent.trim().replace(" ☀️", "");
                const weight = parseFloat(node.querySelector('.weight-input').value) || 0;
                if (!dailyMax[name] || weight > dailyMax[name]) dailyMax[name] = weight;

                const done = parseInt(node.dataset.done || 0);
                // Χρήση της getMuscleGroup αν δεν υπάρχει data-group
                const group = node.dataset.group || (typeof getMuscleGroup === "function" ? getMuscleGroup(name) : "Άλλο");
                
                if (weeklyHistory[group] !== undefined) {
                    weeklyHistory[group] += done;
                } else {
                    weeklyHistory["Άλλο"] += done;
                }
            });
        }
        
        localStorage.setItem(this.historyKey, JSON.stringify(weeklyHistory));

        let summary = [];
        for (let exercise in dailyMax) {
            let currentWeight = dailyMax[exercise];
            if (currentWeight === 0) continue;

            let recordKey = `weight_${exercise}_records`;
            let pastRecord = parseFloat(localStorage.getItem(recordKey) || "0");

            if (currentWeight > pastRecord) {
                summary.push(`⭐ ${exercise}: ${currentWeight}kg (ΝΕΟ ΡΕΚΟΡ!)`);
                localStorage.setItem(recordKey, currentWeight);
            } else {
                summary.push(`• ${exercise}: ${currentWeight}kg`);
            }
        }

        const today = new Date();
        const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
        const targetFood = JSON.parse(localStorage.getItem("food_log_" + dateStr) || "[]");
        const cardioData = JSON.parse(localStorage.getItem("cardio_log_" + dateStr) || "null");
        const recovery = window.PegasusLogic ? window.PegasusLogic.getRecoveryStatus() : { msg: "", nutrition: "" };

        const pendingData = {
            dateSent: dateStr,
            templateParams: {
                name: "Άγγελος",
                workout_date: today.toLocaleDateString('el-GR'),
                calories: kcal || localStorage.getItem("pegasus_today_kcal") || "0.0",
                weights_summary: summary.join("\n") || "Ολοκληρώθηκε προπόνηση συντήρησης",
                food_summary: targetFood.map(f => `• ${f.name} (${f.kcal}kcal)`).join("\n"),
                cardio_activity: cardioData ? `🚲 ${cardioData.km}km` : "Όχι cardio",
                total_food_kcal: targetFood.reduce((sum, f) => sum + parseFloat(f.kcal || 0), 0),
                recovery_status: recovery.msg,
                nutrition_advice: recovery.nutrition
            }
        };

        localStorage.setItem(this.pendingReportKey, JSON.stringify(pendingData));
        console.log("PEGASUS: Data Committed & Report locked for tomorrow.");
    },

    /**
     * 2. ΕΛΕΓΧΟΣ & ΑΠΟΣΤΟΛΗ (FIXED NAME)
     */
    checkAndSendMorningReport: function() {
        const rawData = localStorage.getItem(this.pendingReportKey);
        if (!rawData) return;

        const pending = JSON.parse(rawData);
        const today = new Date();
        const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

        // Στέλνουμε μόνο αν η ημερομηνία καταγραφής είναι διαφορετική από τη σημερινή (επόμενο πρωί)
        if (pending.dateSent !== dateStr) {
            if (typeof emailjs !== 'undefined') {
                emailjs.send('service_4znxhn4', 'template_e1cqkme', pending.templateParams)
                    .then(() => {
                        console.log("✅ PEGASUS: Morning Report Sent Successfully.");
                        localStorage.removeItem(this.pendingReportKey);
                    })
                    .catch(err => console.error("❌ PEGASUS: Morning Report Failed", err));
            } else {
                console.warn("PEGASUS: EmailJS not loaded. Report pending.");
            }
        } else {
            console.log("PEGASUS: Report is prepared but scheduled for tomorrow morning.");
        }
    }
};

window.PegasusReporting = PegasusReporting;