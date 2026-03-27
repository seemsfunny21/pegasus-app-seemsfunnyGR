/* ==========================================================================
   PEGASUS REPORTING SYSTEM - CLEAN SWEEP v17.0
   Protocol: Memory-First Commit | Logic: Unified Nutrition & Cardio Aggregator
   ========================================================================== */

const PegasusReporting = {
    storageKey: "pegasus_daily_summary",
    pendingReportKey: "pegasus_pending_report",
    historyKey: "pegasus_weekly_history",

    /**
     * 1. WORKOUT COMMIT
     * Καταγραφή ολοκληρωμένης προπόνησης και προετοιμασία αναφοράς
     */
    saveWorkout: function(kcalVal) {
        if (window.PegasusLogger) window.PegasusLogger.log("Reporting: Workout commit initiated", "INFO");
        this.prepareAndSaveReport(kcalVal);
    },

    /**
     * 2. DATA AGGREGATION
     * Συγκέντρωση όλων των παραμέτρων της ημέρας (Kcal, Πρωτεΐνη, Cardio, Sets)
     */
    prepareAndSaveReport: function(kcalBurned) {
        const today = new Date();
        const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

        // Ανάκτηση εβδομαδιαίας προόδου
        let weeklyHistory = JSON.parse(localStorage.getItem(this.historyKey)) || {
            "Πλάτη": 0, "Στήθος": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0, "Ώμοι": 0
        };

        // Ανάκτηση Διατροφής
        const dietKcal = localStorage.getItem("pegasus_diet_kcal") || "0";
        const dietProt = localStorage.getItem("pegasus_today_protein") || "0";

        // Ανάκτηση Cardio
        const cardioData = JSON.parse(localStorage.getItem(`cardio_log_${dateStr}`) || "null");
        const cardioSummary = cardioData ? `${cardioData.route} (${cardioData.km}km)` : "None";

        // Δόμηση Παραμέτρων για EmailJS
        const templateParams = {
            report_date: dateStr,
            weight_current: localStorage.getItem("pegasus_weight") || "74",
            diet_calories: dietKcal,
            diet_protein: dietProt,
            workout_burned: kcalBurned || "0",
            cardio_activity: cardioSummary,
            muscle_stats: JSON.stringify(weeklyHistory),
            system_version: "v17.0 - Clean Sweep"
        };

        // Αποθήκευση στην "ουρά" προς αποστολή
        const reportObj = {
            dateSent: dateStr,
            timestamp: Date.now(),
            templateParams: templateParams
        };

        localStorage.setItem(this.pendingReportKey, JSON.stringify(reportObj));
        
        console.log("✅ PEGASUS: Daily Report Prepared & Queued.");
    },

    /**
     * 3. DISPATCH PROTOCOL
     * Αποστολή μέσω EmailJS (Service: service_4znxhn4 | Template: template_e1cqkme)
     */
    checkAndSendMorningReport: function(isManual = false) {
        const rawData = localStorage.getItem(this.pendingReportKey);
        if (!rawData) {
            if (isManual) alert("PEGASUS: Δεν υπάρχει αναφορά στην ουρά.");
            return;
        }

        const pending = JSON.parse(rawData);
        const today = new Date();
        const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

        // Έλεγχος αν είναι πρωί (08:00) ή αν ζητήθηκε χειροκίνητα
        const currentHour = today.getHours();
        
        if (isManual || (currentHour >= 8 && pending.dateSent !== dateStr)) {
            if (typeof emailjs !== 'undefined') {
                emailjs.send('service_4znxhn4', 'template_e1cqkme', pending.templateParams)
                    .then(() => {
                        if (window.PegasusLogger) window.PegasusLogger.log("Report Dispatch Successful", "INFO");
                        localStorage.removeItem(this.pendingReportKey);
                        if (isManual) alert("Η αναφορά στάλθηκε επιτυχώς!");
                    })
                    .catch(err => {
                        console.error("❌ PEGASUS REPORTING ERROR:", err);
                        if (window.PegasusLogger) window.PegasusLogger.log("EmailJS Dispatch Failure", "ERROR");
                    });
            } else {
                console.warn("PEGASUS: EmailJS Library not detected.");
            }
        }
    }
};

window.PegasusReporting = PegasusReporting;

// Αυτόματος έλεγχος κατά τη φόρτωση (Morning Sync)
window.addEventListener('load', () => {
    setTimeout(() => window.PegasusReporting.checkAndSendMorningReport(), 5000);
});