/* ===== PEGASUS REPORTING SYSTEM (STRICT & RECOVERY ENABLED) ===== */
const PegasusReporting = {
    storageKey: "pegasus_daily_summary",

    /**
     * 1. ΚΑΤΑΓΡΑΦΗ ΑΣΚΗΣΕΩΝ: Φιλτράρισμα βάσει δραστηριότητας
     */
    saveWorkout: function(kcal) {
        let dailyMax = {};
        
        // Προσπάθεια ανάκτησης από το DOM (dataset.done)
        const activeNodes = Array.from(document.querySelectorAll('.exercise-node'))
            .filter(node => parseInt(node.dataset.done || 0) > 0);

        if (activeNodes.length > 0) {
            activeNodes.forEach(node => {
                const name = node.querySelector('.exercise-name').textContent.trim().replace(" ☀️", "");
                const weight = parseFloat(node.querySelector('.weight-input').value) || 0;
                if (!dailyMax[name] || weight > dailyMax[name]) dailyMax[name] = weight;
            });
        } else {
            // Fallback: Αν το DOM είναι κενό, τράβα τα βάρη που έγιναν commit σήμερα στο localStorage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith("weight_ANGELOS_")) {
                    const name = key.replace("weight_ANGELOS_", "");
                    dailyMax[name] = parseFloat(localStorage.getItem(key));
                }
            }
        }

        let summary = [];
        for (let exercise in dailyMax) {
            let currentWeight = dailyMax[exercise];
            if (currentWeight === 0) continue; // Αγνοούμε τις κενές ασκήσεις

            let recordKey = `weight_${exercise}_records`;
            let stagnationKey = `weight_${exercise}_stagnation`;
            let pastRecord = parseFloat(localStorage.getItem(recordKey) || "0");
            let stagnationCount = parseInt(localStorage.getItem(stagnationKey) || "0");

            if (currentWeight > pastRecord) {
                summary.push(`⭐ ${exercise}: ${currentWeight}kg (ΝΕΟ ΡΕΚΟΡ! +${currentWeight - pastRecord}kg)`);
                localStorage.setItem(recordKey, currentWeight);
                localStorage.setItem(stagnationKey, "0");
            } else if (currentWeight === pastRecord) {
                stagnationCount++;
                let msg = `• ${exercise}: ${currentWeight}kg (Σταθερός για ${stagnationCount}η φορά)`;
                if (stagnationCount >= 4) msg += " 💡 (Πιεσέ για +2 reps)";
                summary.push(msg);
                localStorage.setItem(stagnationKey, stagnationCount);
            } else {
                summary.push(`• ${exercise}: ${currentWeight}kg (Ρεκόρ: ${pastRecord}kg)`);
            }
        }

        localStorage.setItem(this.storageKey, JSON.stringify({
            workout_kcal: kcal || "0.0",
            weights: summary.join("\n") || "Δεν ολοκληρώθηκαν ασκήσεις"
        }));
    },

    /**
     * 2. ΑΠΟΣΤΟΛΗ REPORT ΜΕ ΔΙΑΤΡΟΦΙΚΗ ΚΑΘΟΔΗΓΗΣΗ (74kg)
     */
    checkAndSendMorningReport: function(isManual = false) {
        try {
            const today = new Date();
            const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
            const displayDate = today.toLocaleDateString('el-GR').replace(/\//g, '-');

            const foodKey = "food_log_" + dateStr;
            const cardioKey = "cardio_log_" + dateStr;
            const targetFood = JSON.parse(localStorage.getItem(foodKey) || "[]");
            const workoutData = JSON.parse(localStorage.getItem(this.storageKey) || "{}");
            const cardioData = JSON.parse(localStorage.getItem(cardioKey) || "null");

            // Λήψη Recovery Status από logicmetabolic.js
            const recovery = window.PegasusLogic ? window.PegasusLogic.getRecoveryStatus() : { isRestDay: false, msg: "", nutrition: "" };

            const totalKcal = targetFood.reduce((sum, f) => sum + parseFloat(f.kcal || 0), 0);
            const totalProt = targetFood.reduce((sum, f) => sum + parseFloat(f.protein || 0), 0);

            const templateParams = {
                name: "Άγγελος",
                time: today.toLocaleTimeString('el-GR'),
                workout_date: displayDate,
                calories: workoutData.workout_kcal || localStorage.getItem("pegasus_today_kcal") || "0.0",
                weights_summary: workoutData.weights,
                food_summary: targetFood.map(f => `• ${f.name} (${f.kcal}kcal | ${f.protein}g P)`).join("\n") || "Δεν βρέθηκαν γεύματα",
                cardio_activity: cardioData ? `🚲 ${cardioData.route} | ${cardioData.km}km | ${cardioData.kcal}kcal` : "Όχι cardio σήμερα",
                total_food_kcal: Math.round(totalKcal),
                total_food_protein: Math.round(totalProt),
                recovery_status: recovery.msg,
                nutrition_advice: recovery.nutrition
            };

            emailjs.send('service_4znxhn4', 'template_e1cqkme', templateParams)
                .then(() => { if(isManual) alert("Η αναφορά εστάλη επιτυχώς!"); })
                .catch(err => console.error("EmailJS Error:", err));

        } catch (err) { console.error("Reporting Error:", err); }
    }
};

window.PegasusReporting = PegasusReporting;