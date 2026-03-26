/* ==========================================================================
   PEGASUS REPORTING SYSTEM - v4.0 (MODULAR / FULLY DECOUPLED)
   Protocol: Strict Data Analyst - Isolated Memory-First Commit & EmailJS Sync
   ========================================================================== */

const PegasusReporting = (function() {
    // 1. ΙΔΙΩΤΙΚΕΣ ΣΤΑΘΕΡΕΣ & STATE (Private Configuration)
    const STORAGE_KEY = "pegasus_daily_summary";
    const PENDING_REPORT_KEY = "pegasus_pending_report";
    const HISTORY_KEY = "pegasus_weekly_history";

    // 2. ΕΣΩΤΕΡΙΚΕΣ ΛΕΙΤΟΥΡΓΙΕΣ (Private Methods)
    const prepareAndSaveReport = (kcal, sessionData = null) => {
        let weeklyHistory = JSON.parse(localStorage.getItem(HISTORY_KEY)) || {
            "Πλάτη": 0, "Στήθος": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0, "Ώμοι": 0, "Άλλο": 0
        };

        // Memory-First Protocol: Χρήση δεδομένων μνήμης (SessionData) για αποφυγή DOM Race Condition
        let completedText = "";
        const sourceData = sessionData || Array.from(document.querySelectorAll('.exercise'));

        if (sessionData) {
            sourceData.forEach(ex => {
                if (ex.isCompleted || (ex.adjustedSets && ex.adjustedSets > 0)) {
                    completedText += `${ex.name}, `;
                }
            });
        } else {
            // Fallback στο DOM αν δεν δοθούν δεδομένα μνήμης
            sourceData.forEach(ex => {
                const nameEl = ex.querySelector('.exercise-name');
                const weightEl = ex.querySelector('.weight-input');
                if (nameEl && ex.classList.contains('exercise-skipped') === false) {
                    const name = nameEl.textContent.replace("🎯", "").trim();
                    const weight = weightEl && weightEl.value ? weightEl.value : "BW";
                    completedText += `${name} (${weight}kg), `;
                }
            });
        }

        const today = new Date();
        const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
        
        // Κατασκευή του EmailJS Payload
        const templateParams = {
            date: dateStr,
            kcal_burned: kcal || 0,
            weight: localStorage.getItem("pegasus_weight") || 74,
            completed_exercises: completedText || "Καμία νέα άσκηση",
            history_stats: JSON.stringify(weeklyHistory)
        };

        // Αποθήκευση στο Vault για επόμενη αποστολή
        localStorage.setItem(PENDING_REPORT_KEY, JSON.stringify({
            dateSent: "",
            templateParams: templateParams
        }));
        console.log("[PEGASUS REPORTING]: Report prepared and pending for dispatch.");
    };

    const saveWorkout = (kcalVal, memoryData = null) => {
        console.log("[PEGASUS REPORTING]: Workout save/sync triggered...");
        prepareAndSaveReport(kcalVal, memoryData);
    };

    const checkAndSendMorningReport = (isManual = false) => {
        const rawData = localStorage.getItem(PENDING_REPORT_KEY);
        if (!rawData) {
            if (isManual) alert("PEGASUS: Δεν υπάρχουν δεδομένα προς αποστολή.");
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
                        console.log("✅ [PEGASUS REPORTING]: Report Sent Successfully.");
                        localStorage.removeItem(PENDING_REPORT_KEY);
                        if (isManual) alert("Επιτυχία: Η αναφορά και ο συγχρονισμός ολοκληρώθηκαν!");
                    })
                    .catch(err => {
                        console.error("❌ [PEGASUS REPORTING]: Email Error", err);
                        if (isManual) alert("Σφάλμα κατά την αποστολή.");
                    });
            } else {
                console.warn("[PEGASUS REPORTING]: EmailJS API not loaded or blocked.");
            }
        } else {
            console.log("[PEGASUS REPORTING]: Report locked. Scheduled for tomorrow morning.");
        }
    };

    // 3. PUBLIC API & INITIALIZATION
    return {
        init: function() {
            // Αυτόματος έλεγχος 5 δευτερόλεπτα μετά την εκκίνηση του συστήματος
            setTimeout(() => { checkAndSendMorningReport(false); }, 5000);
            
            // Σύνδεση με το UI (Αν υπάρχει κουμπί χειροκίνητης αποστολής)
            const manualBtn = document.getElementById("btnSendReport");
            if (manualBtn) {
                manualBtn.addEventListener("click", () => checkAndSendMorningReport(true));
            }
        },
        saveWorkout: saveWorkout,
        prepareAndSaveReport: prepareAndSaveReport,
        checkAndSendMorningReport: checkAndSendMorningReport
    };
})();

// Εξαγωγή στο Window Scope για διασύνδεση με το κεντρικό app.js (finishWorkout)
window.PegasusReporting = PegasusReporting;
window.addEventListener('DOMContentLoaded', PegasusReporting.init);