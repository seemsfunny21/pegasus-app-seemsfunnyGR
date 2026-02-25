/* ===== PEGASUS REPORTING SYSTEM (STRICT EDITION) ===== */
const PegasusReporting = {
    storageKey: "pegasus_daily_summary",

    // Καταγραφή μέγιστων επιδόσεων και ελέγχου προόδου
    saveWorkout: function(kcal) {
        let data = { workout_kcal: kcal || "0", weights: "" };
        let dailyMax = {};

        // 1. Βρες το μέγιστο βάρος για κάθε άσκηση σήμερα (φιλτράροντας τα ZZ και βοηθητικά)
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("weight_") && !key.includes("_records") && !key.includes("_stagnation") && !key.includes("_ZZ_")) {
                let val = parseFloat(localStorage.getItem(key));
                let name = key.replace("weight_ANGELOS_", "").replace("weight_", "").trim();
                
                if (!dailyMax[name] || val > dailyMax[name]) {
                    dailyMax[name] = val;
                }
            }
        }

        let summary = [];
        for (let exercise in dailyMax) {
            let currentWeight = dailyMax[exercise];
            let recordKey = `weight_${exercise}_records`;
            let stagnationKey = `weight_${exercise}_stagnation`;
            
            let pastRecord = parseFloat(localStorage.getItem(recordKey) || "0");
            let stagnationCount = parseInt(localStorage.getItem(stagnationKey) || "0");

            if (currentWeight > pastRecord) {
                // ΝΕΟ ΡΕΚΟΡ: Μηδενισμός στασιμότητας
                let diff = currentWeight - pastRecord;
                summary.push(`⭐ ${exercise}: ${currentWeight}kg (ΝΕΟ ΡΕΚΟΡ! +${diff}kg)`);
                localStorage.setItem(recordKey, currentWeight);
                localStorage.setItem(stagnationKey, "0");
            } 
            else if (currentWeight === pastRecord && currentWeight > 0) {
                // ΙΔΙΑ ΚΙΛΑ: Έλεγχος αν "κόλλησες" λόγω των 6κιλων πλακών
                stagnationCount++;
                let msg = `• ${exercise}: ${currentWeight}kg (Σταθερός για ${stagnationCount}η φορά)`;
                
                // Αν περάσουν 4 προπονήσεις στα ίδια κιλά, βγάζει προειδοποίηση
                if (stagnationCount >= 4) {
                    msg += ` 💡 (Πιεσέ για +2 reps πριν ανέβεις πλάκα)`;
                }
                
                summary.push(msg);
                localStorage.setItem(stagnationKey, stagnationCount);
            } 
            else {
                // Χαμηλότερα κιλά από το ρεκόρ (π.χ. μέρα αποκατάστασης)
                summary.push(`• ${exercise}: ${currentWeight}kg (Ρεκόρ: ${pastRecord}kg)`);
            }
        }

        data.weights = summary.join("\n") || "Δεν καταγράφηκαν βάρη σήμερα";
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    },

    checkAndSendMorningReport: function(isManual = false) {
        try {
            const today = new Date();
            // Αν είναι manual (κουμπί) στέλνει το σήμερα, αν είναι αυτόματο το χθες
            const reportDate = isManual ? today : new Date(new Date().setDate(today.getDate() - 1));
            
            const d = reportDate.getDate();
            const m = reportDate.getMonth() + 1;
            const y = reportDate.getFullYear();
            
            const displayDate = (d < 10 ? '0' + d : d) + "-" + (m < 10 ? '0' + m : m) + "-" + y;
            const dateStr = `${d}/${m}/${y}`;

            // Ανάκτηση δεδομένων από Food και Cardio
            const foodKey = "food_log_" + dateStr;
            const cardioKey = "cardio_log_" + dateStr;
            
            const targetFood = JSON.parse(localStorage.getItem(foodKey) || "[]");
            const workoutData = JSON.parse(localStorage.getItem(this.storageKey) || "{}");
            const cardioData = JSON.parse(localStorage.getItem(cardioKey) || "null");

            // Διαμόρφωση Cardio Summary
            let cardioSummary = "Δεν καταγράφηκε cardio δραστηριότητα.";
            if (cardioData) {
                cardioSummary = `🚲 ${cardioData.route}\n📍 Απόσταση: ${cardioData.km}km\n⏱️ Χρόνος: ${cardioData.time}\n🔥 Καύση: ${cardioData.kcal}kcal`;
            }

            // Διαμόρφωση Food Summary
            let foodSummary = targetFood.length > 0 
                ? targetFood.map(f => "• " + f.name + " (" + Math.round(f.kcal) + "kcal | " + f.protein + "g P)").join("\n") 
                : "Δεν βρέθηκαν γεύματα.";

            const totalKcal = targetFood.reduce((sum, f) => sum + parseFloat(f.kcal || 0), 0);
            const totalProt = targetFood.reduce((sum, f) => sum + parseFloat(f.protein || 0), 0);

            const templateParams = {
                name: "Άγγελος", // Για το template σου
                time: today.toLocaleTimeString('el-GR'),
                workout_date: displayDate,
                calories: workoutData.workout_kcal || "0.0",
                weights_summary: workoutData.weights || "Δεν καταγράφηκαν βάρη",
                food_summary: foodSummary,
                cardio_activity: cardioSummary,
                total_food_kcal: Math.round(totalKcal),
                total_food_protein: Math.round(totalProt)
            };

            console.log("Strict Report Data:", templateParams);

            emailjs.send('service_4znxhn4', 'template_e1cqkme', templateParams)
                .then(function() {
                    localStorage.setItem("pegasus_last_report_date", today.toLocaleDateString('el-GR'));
                    if(isManual) alert("Η αναφορά εστάλη! Έλεγξε την πρόοδο και φάε κάτι!");
                }, function(error) {
                    console.error("EmailJS Error:", error);
                    if(isManual) alert("Σφάλμα EmailJS: " + JSON.stringify(error));
                });

        } catch (err) {
            console.error("Reporting Error:", err);
            if(isManual) alert("Σφάλμα: " + err.message);
        }
    }
};

window.PegasusReporting = PegasusReporting;