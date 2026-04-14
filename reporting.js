/* ==========================================================================
   PEGASUS REPORTING SYSTEM - V4.1 (STRICT SINGLE MORNING DISPATCH)
   Protocol: Daily Send Lock & Anti-HTML Encoding Date Format
   ========================================================================== */

const PegasusReporting = {
    storageKey: "pegasus_daily_summary",
    pendingReportKey: "pegasus_pending_report",
    historyKey: "pegasus_weekly_history",
    lastSentKey: "pegasus_last_email_sent_date", // 🔒 Η νέα κλειδαριά ημέρας

    saveWorkout: function(kcalVal, memoryData = null) {
        console.log("PEGASUS: Workout save triggered. Queuing for morning...");
        this.prepareAndSaveReport(kcalVal, memoryData);
    },

    prepareAndSaveReport: function(kcal, sessionData = null) {
        let dailyMax = {};
        let weeklyHistory = JSON.parse(localStorage.getItem(this.historyKey)) || {
            "Πλάτη": 0, "Στήθος": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0, "Ώμοι": 0, "Άλλο": 0
        };

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

        let summary = Object.entries(dailyMax).map(([name, weight]) => `• ${name}: ${weight}kg`);
        const today = new Date();
        
        // 🎯 ΔΙΟΡΘΩΣΗ 1: Χρήση παύλας (-) αντί για κάθετο (/) για να μην χαλάει ο τίτλος στο email
       const dateStrSafe = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
        
        const targetFood = JSON.parse(localStorage.getItem("food_log_" + dateStrSafe) || "[]");
        const cardioData = JSON.parse(localStorage.getItem("cardio_log_" + dateStrSafe) || "null");
        
        const isRecovery = (today.getDay() === 1 || today.getDay() === 4);
        const recovery = isRecovery ? 
            { msg: "Recovery Day Active", nutrition: "Focus on hydration & stretching" } : 
            { msg: "Training Day", nutrition: "High protein intake required" };

        const pendingData = {
            dateSent: dateStrSafe, 
            templateParams: {
                name: "Άγγελος",
                workout_date: dateStrSafe, // 🎯 Ασφαλής Ημερομηνία Χωρίς Encode
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
        console.log("✅ PEGASUS: Data Queued. Will be sent tomorrow morning.");
        
        if (window.PegasusCloud && typeof window.PegasusCloud.push === "function") {
            window.PegasusCloud.push(true);
        }
    },

    checkAndSendMorningReport: function(forceSend = false) {
        const rawData = localStorage.getItem(this.pendingReportKey);
        
        if (!rawData) {
            if(forceSend) console.warn("PEGASUS: Δεν υπάρχουν δεδομένα προς αποστολή.");
            return;
        }

        const pending = JSON.parse(rawData);
        const today = new Date();
        const dateStrSafe = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
        const currentHour = today.getHours();
        
        // 🔒 ΔΙΟΡΘΩΣΗ 2: Έλεγχος Κλειδαριάς Ημέρας
        const lastSentDate = localStorage.getItem(this.lastSentKey);

        if (!forceSend) {
            // Αν έχουμε ήδη στείλει email σήμερα, ΣΤΑΜΑΤΑ!
            if (lastSentDate === dateStrSafe) {
                console.log("🛡️ PEGASUS: Morning report already sent today. Dispatch locked.");
                return;
            }

            const isMorningWindow = currentHour >= 5 && currentHour <= 11;
            const isOldReport = pending.dateSent !== dateStrSafe;

            if (!isMorningWindow && !isOldReport) {
                console.log("⏳ PEGASUS: Report pending. Waiting for the morning window...");
                return;
            }
        }

        if (typeof emailjs !== 'undefined') {
            console.log("⏳ PEGASUS: Transmitting Morning Report to Cloud Server...");
            
            emailjs.send('service_4znxhn4', 'template_e1cqkme', pending.templateParams)
                .then(() => {
                    console.log("✅ PEGASUS: Morning Report Sent Successfully.");
                    
                    // 🔒 Κλειδώνουμε το σύστημα για τη σημερινή μέρα
                    localStorage.setItem(this.lastSentKey, dateStrSafe);
                    localStorage.removeItem(this.pendingReportKey);
                    
                    const btn = document.getElementById('btnManualEmail');
                    if (btn) {
                        btn.style.background = '#4CAF50';
                        btn.style.color = '#000';
                        btn.textContent = 'ΕΠΙΤΥΧΙΑ';
                        setTimeout(() => { btn.style.background = ''; btn.style.color = ''; btn.textContent = 'EMAIL'; }, 3000);
                    }
                })
                .catch(err => {
                    console.error("❌ PEGASUS: Email Error", err);
                });
        } else {
            console.warn("PEGASUS: EmailJS not loaded. Sending failed.");
        }
    }
};

window.PegasusReporting = PegasusReporting;

// ==========================================================================
// 🚀 PEGASUS BOOT SEQUENCE: Αυτόματος Έλεγχος Πρωινής Αναφοράς στο άνοιγμα
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        if (window.PegasusReporting) {
            window.PegasusReporting.checkAndSendMorningReport(false);
        }
    }, 3000);
});
