/* ==========================================================================
   PEGASUS REPORTING SYSTEM - ANALYST FIXED (v2.9 - MANUAL PUSH ENABLED)
   Protocol: Strict Data Commit & Cross-Device Sync Support
   ========================================================================== */

const PegasusReporting = {
    storageKey: "pegasus_daily_summary",
    pendingReportKey: "pegasus_pending_report",
    historyKey: "pegasus_weekly_history",

    /**
     * 1. ΜΕΘΟΔΟΣ ΓΙΑ ΧΕΙΡΟΚΙΝΗΤΟ SAVE (Fix για app.js:583)
     * Καλείται από το κουμπί EMAIL στο app.js
     */
    saveWorkout: function(kcalVal) {
        console.log("PEGASUS: Manual workout save/sync triggered...");
        this.prepareAndSaveReport(kcalVal);
    },

    /**
     * 2. ΚΑΤΑΓΡΑΦΗ & DATA COMMIT
     */
    prepareAndSaveReport: function(kcal) {
        let dailyMax = {};
        let weeklyHistory = JSON.parse(localStorage.getItem(this.historyKey)) || {
            "Πλάτη": 0, "Στήθος": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0, "Ώμοι": 0, "Άλλο": 0
        };

        // Εντοπισμός ενεργών ασκήσεων από το DOM
        const activeNodes = Array.from(document.querySelectorAll('.exercise'))
            .filter(node => parseInt(node.dataset.done || 0) > 0);

        if (activeNodes.length > 0) {
            activeNodes.forEach(node => {
                const name = node.querySelector('.exercise-name').textContent.trim().replace(" ☀️", "");
                const weight = parseFloat(node.querySelector('.weight-input').value) || 0;
                if (!dailyMax[name] || weight > dailyMax[name]) dailyMax[name] = weight;

                const done = parseInt(node.dataset.done || 0);
                
                // Προσδιορισμός Μυϊκής Ομάδας (Data Attribute ή DB Lookup)
                let group = node.dataset.group;
                if (!group && window.exercisesDB) {
                    const exData = window.exercisesDB.find(ex => ex.name === name);
                    if (exData) group = exData.muscleGroup;
                }
                if (!group && typeof getMuscleGroup === "function") group = getMuscleGroup(name);
                if (!group) group = "Άλλο";

                if (weeklyHistory[group] !== undefined) {
                    weeklyHistory[group] += done;
                } else {
                    weeklyHistory["Άλλο"] += (weeklyHistory["Άλλο"] || 0) + done;
                }
            });

            localStorage.setItem(this.historyKey, JSON.stringify(weeklyHistory));
        }

        // Δημιουργία Summary για το Email
        let summary = [];
        for (let ex in dailyMax) {
            if (dailyMax[ex] > 0) summary.push(`• ${ex}: ${dailyMax[ex]}kg`);
        }

        const today = new Date();
        const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
        const targetFood = JSON.parse(localStorage.getItem("food_log_" + dateStr) || "[]");
        const cardioData = JSON.parse(localStorage.getItem("cardio_log_" + dateStr) || "null");
        const recovery = (window.PegasusLogic && window.PegasusLogic.getRecoveryStatus) ? 
                          window.PegasusLogic.getRecoveryStatus() : { msg: "Active", nutrition: "Standard" };

        const pendingData = {
            dateSent: dateStr,
            templateParams: {
                name: "Άγγελος",
                workout_date: today.toLocaleDateString('el-GR'),
                calories: kcal || localStorage.getItem("pegasus_today_kcal") || "0.0",
                weights_summary: summary.join("\n") || "Workout data committed.",
                food_summary: targetFood.map(f => `• ${f.name} (${f.kcal}kcal)`).join("\n") || "No food logged",
                cardio_activity: cardioData ? `🚲 ${cardioData.km}km` : "No cardio",
                total_food_kcal: targetFood.reduce((sum, f) => sum + parseFloat(f.kcal || 0), 0),
                recovery_status: recovery.msg || "Updated",
                nutrition_advice: recovery.nutrition || "Maintain macro balance"
            }
        };

        localStorage.setItem(this.pendingReportKey, JSON.stringify(pendingData));
        console.log("✅ PEGASUS: Data Committed & Manual Save Complete.");
        
        // Αν το CloudSync είναι διαθέσιμο, κάνουμε και ένα Push
        if (window.PegasusCloud && typeof window.PegasusCloud.push === "function") {
            window.PegasusCloud.push(true);
        }
    },

    /**
     * 3. ΕΛΕΓΧΟΣ & ΑΠΟΣΤΟΛΗ
     */
    checkAndSendMorningReport: function(isManual = false) {
        const rawData = localStorage.getItem(this.pendingReportKey);
        if (!rawData) {
            if(isManual) alert("PEGASUS: Δεν υπάρχουν δεδομένα προς αποστολή.");
            return;
        }

        const pending = JSON.parse(rawData);
        const today = new Date();
        const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

        // Αποστολή αν είναι manual ή αν άλλαξε η μέρα
        if (isManual || pending.dateSent !== dateStr) {
            if (typeof emailjs !== 'undefined') {
                emailjs.send('service_4znxhn4', 'template_e1cqkme', pending.templateParams)
                    .then(() => {
                        console.log("✅ PEGASUS: Report Sent Successfully.");
                        localStorage.removeItem(this.pendingReportKey);
                        if(isManual) alert("Επιτυχία: Η αναφορά και ο συγχρονισμός ολοκληρώθηκαν!");
                    })
                    .catch(err => {
                        console.error("❌ PEGASUS: Email Error", err);
                        if(isManual) alert("Σφάλμα κατά την αποστολή.");
                    });
            } else {
                console.warn("PEGASUS: EmailJS not loaded.");
            }
        } else {
            console.log("PEGASUS: Report locked. Scheduled for tomorrow morning.");
        }
    }
};

window.PegasusReporting = PegasusReporting;