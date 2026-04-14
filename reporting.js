/* ==========================================================================
   PEGASUS REPORTING SYSTEM - V4.0 (MORNING QUEUE EDITION)
   Protocol: Data Accumulation & Scheduled Morning Dispatch
   ========================================================================== */

const PegasusReporting = {
    storageKey: "pegasus_daily_summary",
    pendingReportKey: "pegasus_pending_report",
    historyKey: "pegasus_weekly_history",

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
        const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
        
        const targetFood = JSON.parse(localStorage.getItem("food_log_" + dateStr) || "[]");
        const cardioData = JSON.parse(localStorage.getItem("cardio_log_" + dateStr) || "null");
        
        const isRecovery = (today.getDay() === 1 || today.getDay() === 4);
        const recovery = isRecovery ? 
            { msg: "Recovery Day Active", nutrition: "Focus on hydration & stretching" } : 
            { msg: "Training Day", nutrition: "High protein intake required" };

        const pendingData = {
            dateSent: dateStr, // Η ημερομηνία που δημιουργήθηκε η αναφορά
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
        console.log("✅ PEGASUS: Data Queued. Will be sent tomorrow morning.");
        
        if (window.PegasusCloud && typeof window.PegasusCloud.push === "function") {
            window.PegasusCloud.push(true);
        }

        // 🛑 ΑΦΑΙΡΕΘΗΚΕ Η ΑΜΕΣΗ ΑΠΟΣΤΟΛΗ ΕΔΩ ΓΙΑ ΝΑ ΠΕΡΙΜΕΝΕΙ ΤΟ ΠΡΩΙ
    },

    checkAndSendMorningReport: function(forceSend = false) {
        const rawData = localStorage.getItem(this.pendingReportKey);
        
        if (!rawData) {
            if(forceSend) console.warn("PEGASUS: Δεν υπάρχουν δεδομένα προς αποστολή.");
            return; // Αθόρυβη έξοδος αν δεν υπάρχει τίποτα
        }

        const pending = JSON.parse(rawData);
        const today = new Date();
        const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
        const currentHour = today.getHours();

        // 🚀 LOGIC GATE: Στέλνει μόνο αν το ζητήσεις (force) Ή αν είναι πρωί (05:00 - 11:00) Ή αν είναι παλιά αναφορά
        const isMorningWindow = currentHour >= 5 && currentHour <= 11;
        const isOldReport = pending.dateSent !== dateStr;

        if (!forceSend && !isMorningWindow && !isOldReport) {
            console.log("⏳ PEGASUS: Report pending. Waiting for the morning window (05:00 - 11:00)...");
            return;
        }

        if (typeof emailjs !== 'undefined') {
            console.log("⏳ PEGASUS: Transmitting Morning Report to Cloud Server...");
            
            emailjs.send('service_4znxhn4', 'template_e1cqkme', pending.templateParams)
                .then(() => {
                    console.log("✅ PEGASUS: Morning Report Sent Successfully.");
                    localStorage.removeItem(this.pendingReportKey);
                    
                    // Μικρή οπτική επιβεβαίωση χωρίς reload (αφού τρέχει στο παρασκήνιο)
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
    // Καθυστέρηση 3 δευτερολέπτων για να προλάβει να φορτώσει η βιβλιοθήκη EmailJS
    setTimeout(() => {
        if (window.PegasusReporting) {
            window.PegasusReporting.checkAndSendMorningReport(false);
        }
    }, 3000);
});
