/* ==========================================================================
   PEGASUS REPORTING SYSTEM - V3.1 (STRICT ANALYST - STABLE)
   Protocol: Memory-First Commit, Full Nutrition & Cardio Integration
   ========================================================================== */

const PegasusReporting = {
    storageKey: "pegasus_daily_summary",
    pendingReportKey: "pegasus_pending_report",
    historyKey: "pegasus_weekly_history",

    saveWorkout: function(kcalVal, memoryData = null) {
        this.prepareAndSaveReport(kcalVal, memoryData);
    },

    prepareAndSaveReport: function(kcal, sessionData = null) {
        let dailyMax = {};
        let weeklyHistory = JSON.parse(localStorage.getItem(this.historyKey)) || {
            "Πλάτη": 0, "Στήθος": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0, "Ώμοι": 0, "Άλλο": 0
        };

        // Χρήση δεδομένων μνήμης (SessionData) ή DOM ως fallback
        const sourceData = sessionData || Array.from(document.querySelectorAll('.exercise'))
            .map(node => ({
                name: node.querySelector('.exercise-name').textContent.trim().replace(" ☀️", ""),
                weight: parseFloat(node.querySelector('.weight-input').value) || 0,
                done: parseInt(node.dataset.done || 0),
                group: node.dataset.group
            })).filter(ex => ex.done > 0);

        if (sourceData.length > 0) {
            sourceData.forEach(ex => {
                if (!dailyMax[ex.name] || ex.weight > dailyMax[ex.name]) dailyMax[ex.name] = ex.weight;

                let group = ex.group;
                if (!group && window.exercisesDB) {
                    const exDb = window.exercisesDB.find(db => db.name === ex.name);
                    if (exDb) group = exDb.muscleGroup;
                }
                if (!group) group = "Άλλο";

                if (weeklyHistory[group] !== undefined) {
                    weeklyHistory[group] += ex.done;
                } else {
                    weeklyHistory["Άλλο"] += ex.done;
                }
            });
            localStorage.setItem(this.historyKey, JSON.stringify(weeklyHistory));
        }

        const today = new Date();
        const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
        
        // FIX: Χρήση του PegasusStore αντί για απευθείας localStorage για ασφάλεια
        const targetFood = (window.PegasusStore) ? window.PegasusStore.getFoodLog(dateStr) : [];
        const cardioData = JSON.parse(localStorage.getItem("cardio_log_" + dateStr) || "null");
        
        const isRecovery = (today.getDay() === 1 || today.getDay() === 4);
        const recovery = isRecovery ? 
            { msg: "Recovery Day Active", nutrition: "Focus on hydration & stretching" } : 
            { msg: "Training Day", nutrition: "High protein intake required" };

        const pendingData = {
            dateSent: dateStr,
            templateParams: {
                name: "Άγγελος",
                workout_date: today.toLocaleDateString('el-GR'),
                calories: kcal || localStorage.getItem("pegasus_today_kcal") || "0.0",
                weights_summary: Object.entries(dailyMax).map(([n, w]) => `• ${n}: ${w}kg`).join("\n") || "No weights logged.",
                food_summary: targetFood.map(f => `• ${f.name} (${f.kcal}kcal)`).join("\n") || "No food logged",
                cardio_activity: cardioData ? `🚲 ${cardioData.km}km (${cardioData.route})` : "No cardio",
                total_food_kcal: targetFood.reduce((sum, f) => sum + parseFloat(f.kcal || 0), 0),
                recovery_status: recovery.msg,
                nutrition_advice: recovery.nutrition
            }
        };

        localStorage.setItem(this.pendingReportKey, JSON.stringify(pendingData));
        
        if (window.PegasusCloud) window.PegasusCloud.push(true);
    },

    checkAndSendMorningReport: function(isManual = false) {
        const rawData = localStorage.getItem(this.pendingReportKey);
        if (!rawData) return;

        const pending = JSON.parse(rawData);
        const today = new Date();
        const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

        if (isManual || pending.dateSent !== dateStr) {
            if (typeof emailjs !== 'undefined') {
                emailjs.send('service_4znxhn4', 'template_e1cqkme', pending.templateParams)
                    .then(() => {
                        localStorage.removeItem(this.pendingReportKey);
                        if(isManual) alert("Η αναφορά εστάλη!");
                    });
            }
        }
    }
};
window.PegasusReporting = PegasusReporting;
