/* ==========================================================================
   PEGASUS REPORTING SYSTEM - V3.2 (STRICT ANALYST EDITION - NETWORK SHIELD)
   Protocol: Async Override, Memory-First Commit & Guaranteed Delivery
   ========================================================================== */

const PegasusReporting = {
    storageKey: "pegasus_daily_summary",
    pendingReportKey: "pegasus_pending_report",
    historyKey: "pegasus_weekly_history",

    /**
     * 1. SAVE WORKOUT (Manual or Auto)
     */
    saveWorkout: function(kcalVal, memoryData = null) {
        console.log("PEGASUS: Workout save/sync triggered...");
        this.prepareAndSaveReport(kcalVal, memoryData);
    },

    /**
     * 2. DATA COMMIT & PREPARATION
     */
    prepareAndSaveReport: function(kcal, sessionData = null) {
        let dailyMax = {};
        let weeklyHistory = JSON.parse(localStorage.getItem(this.historyKey)) || {
            "Πλάτη": 0, "Στήθος": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0, "Ώμοι": 0, "Άλλο": 0
        };

        // Χρήση δεδομένων μνήμης (SessionData) για αποφυγή DOM Race Condition
        const sourceData = sessionData || Array.from(document.querySelectorAll('.exercise'))
            .map(node => ({
                name: node.querySelector('.exercise-name').textContent.trim().replace(" ☀️", ""),
                weight: parseFloat(node.querySelector('.weight-input').value) || 0,
                done: parseInt(node.dataset.done || 0),
                group: node.dataset.group
            })).filter(ex => ex.done > 0);

        if (sourceData && sourceData.length > 0) {
            sourceData.forEach(ex => {
                if (!dailyMax[ex.name] || ex.weight > dailyMax[ex.name]) dailyMax[ex.name] = ex.weight;

                let group = ex.group;
                if (!group && window.exercisesDB) {
                    const exDb = window.exercisesDB.find(db => db.name === ex.name);
                    if (exDb) group = exDb.muscleGroup;
                }
                if (!group && typeof getMuscleGroup === "function") group = getMuscleGroup(ex.name);
                if (!group) group = "Άλλο";

                if (weeklyHistory[group] !== undefined) {
                    weeklyHistory[group] += ex.done;
                } else {
                    weeklyHistory["Άλλο"] += (weeklyHistory["Άλλο"] || 0) + ex.done;
                }
            });

            localStorage.setItem(this.historyKey, JSON.stringify(weeklyHistory));
        }

        // Σύνθεση Αναφοράς
        let summary = Object.entries(dailyMax).map(([name, weight]) => `• ${name}: ${weight}kg`);
        const today = new Date();
        const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
        
        // Ανάκτηση δεδομένων από άλλα modules (Cardio & Food)
        const targetFood = JSON.parse(localStorage.getItem("food_log_" + dateStr) || "[]");
        const cardioData = JSON.parse(localStorage.getItem("cardio_log_" + dateStr) || "null");
        
        // Nutrition & Recovery Logic
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
                weights_summary: summary.join("\n") || "Workout data committed.",
                food_summary: targetFood.map(f => `• ${f.name} (${f.kcal}kcal)`).join("\n") || "No food logged",
                cardio_activity: cardioData ? `🚲 ${cardioData.km}km (${cardioData.route})` : "No cardio",
                total_food_kcal: targetFood.reduce((sum, f) => sum + parseFloat(f.kcal || 0), 0),
                recovery_status: recovery.msg || "Updated",
                nutrition_advice: recovery.nutrition || "Maintain macro balance"
            }
        };

        localStorage.setItem(this.pendingReportKey, JSON.stringify(pendingData));
        console.log("✅ PEGASUS: Data Committed & Manual Save Complete.");
        
        // Σύγχρονη κλήση του CloudSync
        if (window.PegasusCloud && typeof window.PegasusCloud.push === "function") {
            window.PegasusCloud.push(true);
        }

        // 🎯 STRICT FIX: Εκκίνηση αποστολής email (με Network Shield)
        this.checkAndSendMorningReport(true); 
    },

    /**
     * 3. ΕΛΕΓΧΟΣ & ΑΠΟΣΤΟΛΗ (EMAILJS με Network Shield)
     */
    checkAndSendMorningReport: function(forceSend = false) {
        const rawData = localStorage.getItem(this.pendingReportKey);
        if (!rawData) {
            if(forceSend) console.warn("PEGASUS: Δεν υπάρχουν δεδομένα προς αποστολή.");
            return;
        }

        const pending = JSON.parse(rawData);

        // 🛡️ THE NETWORK SHIELD: Παγίδευση του location.reload() του app.js
        const originalReload = window.location.reload;
        let isReloading = false;
        
        window.location.reload = function() {
            if (!isReloading) console.log("⏳ PEGASUS GUARD: Reload intercepted. Waiting for EmailJS to transmit...");
            isReloading = true;
        };

        // Failsafe Timer (Αν το EmailJS κολλήσει για πάνω από 4 δευτερόλεπτα, κάνουμε force reload)
        const fallbackTimer = setTimeout(() => {
            if (isReloading) {
                console.warn("⚠️ PEGASUS GUARD: Network timeout. Force reloading...");
                originalReload.call(window.location);
            }
        }, 4000);

        if (typeof emailjs !== 'undefined') {
            emailjs.send('service_4znxhn4', 'template_e1cqkme', pending.templateParams)
                .then(() => {
                    console.log("✅ PEGASUS: Email Report Sent Successfully.");
                    localStorage.removeItem(this.pendingReportKey);
                    
                    // Απελευθέρωση του Reload
                    clearTimeout(fallbackTimer);
                    if (isReloading) originalReload.call(window.location);
                })
                .catch(err => {
                    console.error("❌ PEGASUS: Email Error", err);
                    
                    // Απελευθέρωση του Reload (Ακόμα κι αν απέτυχε)
                    clearTimeout(fallbackTimer);
                    if (isReloading) originalReload.call(window.location);
                });
        } else {
            console.warn("PEGASUS: EmailJS not loaded. Sending failed.");
            clearTimeout(fallbackTimer);
            if (isReloading) originalReload.call(window.location);
        }
    }
};

window.PegasusReporting = PegasusReporting;
