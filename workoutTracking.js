/* ==========================================================================
   PEGASUS WORKOUT TRACKING
   Weekly muscle tracking and completed workout counters.
   ========================================================================== */

window.logPegasusSet = function(exName) {
    let historyKey = P_M?.workout?.weekly_history || 'pegasus_weekly_history';
    let history = JSON.parse(localStorage.getItem(historyKey) || "{}");
    if (!history || typeof history !== "object") {
        history = { "Στήθος": 0, "Πλάτη": 0, "Ώμοι": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 };
    }

    let muscle = (window.exercisesDB?.find(ex => ex.name.trim() === exName.trim()))?.muscleGroup || "Άλλο";
    let value = 1;

    const cleanName = exName.trim().toUpperCase();
    if (cleanName.includes("ΠΟΔΗΛΑΣΙΑ") || cleanName.includes("CYCLING")) {
        muscle = "Πόδια";
        value = 18;
    } else if (cleanName.includes("EMS ΠΟΔΙΩΝ")) {
        muscle = "Πόδια";
        value = 6;
    }

    if (history.hasOwnProperty(muscle)) {
        history[muscle] += value;
        localStorage.setItem(historyKey, JSON.stringify(history));
        if (window.MuscleProgressUI?.render) setTimeout(() => window.MuscleProgressUI.render(), 50);
    }
};

window.updateTotalWorkoutCount = function() {
    const data = JSON.parse(localStorage.getItem(P_M?.workout?.done || "pegasus_workouts_done") || "{}");
    const count = Object.keys(data).length;
    localStorage.setItem(P_M?.workout?.total || "pegasus_total_workouts", count);
    const display = document.getElementById("totalWorkoutsDisplay");
    if (display) {
        const lang = (typeof window.PegasusI18n?.getLanguage === "function") ? window.PegasusI18n.getLanguage() : (localStorage.getItem('pegasus_language') || 'gr');
        display.textContent = `${lang === 'en' ? 'Workouts' : 'Προπονήσεις'}: ${count}`;
    }
};
