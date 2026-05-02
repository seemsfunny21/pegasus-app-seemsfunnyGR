/* ==========================================================================
   PEGASUS OS - CARDIO & CYCLING AUTOMATION ENGINE (v2.3)
   Protocol: Unified Cardio Offset, Desktop/Mobile Diet Sync & Muscle Sync
   Status: FINAL STABLE | FIXED: CROSS-DEVICE KCAL SYNC
   ========================================================================== */

// 🛡️ Global Safe Declaration
var M = M || window.PegasusManifest;

function getPegasusLocalInputDate() {
    if (typeof window.getPegasusLocalDateKey === "function") {
        return window.getPegasusLocalDateKey();
    }

    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

window.PegasusCardio = {
    open: function() {
        const panel = document.getElementById('cardioPanel');
        if (panel) panel.style.display = 'block';

        const kmInput = document.getElementById('cKm');
        const kcalInput = document.getElementById('cKcal');
        if (kmInput) kmInput.value = "";
        if (kcalInput) kcalInput.value = "";

        const today = getPegasusLocalInputDate();
        const dateInput = document.getElementById('cDate');
        if (dateInput) dateInput.value = today;

        const routeInput = document.getElementById('cRoute');
        if (routeInput) routeInput.value = "Ποδηλασία";

        const timeInput = document.getElementById('cTime');
        if (timeInput) timeInput.value = "Auto";
    },

    close: function() {
        const panel = document.getElementById('cardioPanel');
        if (panel) panel.style.display = 'none';
    }
};

window.saveCardioData = async function() {
    const kmEl = document.getElementById('cKm');
    const kcalEl = document.getElementById('cKcal');
    const dateEl = document.getElementById('cDate');

    const rawKm = (kmEl?.value || "").replace(',', '.');
    const rawKcal = (kcalEl?.value || "").replace(',', '.');

    const km = parseFloat(rawKm);
    const kcal = parseFloat(rawKcal);

    if (isNaN(km) || isNaN(kcal) || km <= 0 || kcal <= 0) {
        alert("PEGASUS STRICT: Συμπλήρωσε έγκυρα Χιλιόμετρα και Θερμίδες.");
        return;
    }

    console.log("🚴 CARDIO ENGINE: Executing Global Sync Protocol...");

    /* --- 0. DATE PREPARATION (UNIFIED PADDING PROTOCOL) --- */
    let rawDate = new Date();

    if (dateEl && dateEl.value) {
        const parsed = new Date(dateEl.value + "T12:00:00");
        if (!isNaN(parsed.getTime())) rawDate = parsed;
    }

    const d = String(rawDate.getDate()).padStart(2, '0');
    const m = String(rawDate.getMonth() + 1).padStart(2, '0');
    const y = rawDate.getFullYear();

    const dateStr = `${d}/${m}/${y}`;
    const workoutKey = `${y}-${m}-${d}`;

    /* --- 1. ΜΥΪΚΗ ΟΜΑΔΑ & XP (LIFETIME STATS) --- */
    const maxCyclingCredit = 18;
    const historyKey = M?.workout?.weekly_history || 'pegasus_weekly_history';
    const targetsKey = M?.workout?.muscleTargets || 'pegasus_muscle_targets';
    const statsKey = M?.system?.stats || 'pegasus_stats';

    let historySets = JSON.parse(localStorage.getItem(historyKey) || "{}");
    const targets = JSON.parse(localStorage.getItem(targetsKey) || "null") || { "Πόδια": 24 };
    const legTarget = Math.max(1, parseInt(targets["Πόδια"] || 24, 10));
    const currentLegSets = Math.max(0, parseInt(historySets["Πόδια"] || 0, 10));
    const credit = Math.max(0, Math.min(maxCyclingCredit, legTarget - currentLegSets));

    historySets["Πόδια"] = Math.min(legTarget, currentLegSets + credit);
    localStorage.setItem(historyKey, JSON.stringify(historySets));

    let stats = JSON.parse(localStorage.getItem(statsKey) || "{}");
    if (!stats || typeof stats !== "object") stats = {};
    if (typeof stats.totalSets !== "number") stats.totalSets = 0;
    if (!stats.exerciseHistory || typeof stats.exerciseHistory !== "object") stats.exerciseHistory = {};

    stats.totalSets += credit;
    stats.exerciseHistory["Ποδηλασία"] = (stats.exerciseHistory["Ποδηλασία"] || 0) + credit;
    localStorage.setItem(statsKey, JSON.stringify(stats));

    /* --- 2. ΕΝΕΡΓΕΙΑΚΟ ΙΣΟΖΥΓΙΟ (UNIFIED METABOLIC SYNC) --- */
    const weeklyKcalKey = M?.diet?.weeklyKcal || "pegasus_weekly_kcal";

    let currentWeekly = parseFloat(localStorage.getItem(weeklyKcalKey)) || 0;
    localStorage.setItem(weeklyKcalKey, (currentWeekly + kcal).toFixed(1));

    // Γράφουμε και το legacy και το unified key ώστε mobile + desktop να συμφωνούν
    const legacyOffsetKey = (M?.workout?.cardio_offset || "pegasus_cardio_offset_sets") + "_" + dateStr;
    const unifiedOffsetKey = "pegasus_cardio_kcal_" + dateStr;

    localStorage.setItem(legacyOffsetKey, Number(kcal).toFixed(1));
    localStorage.setItem(unifiedOffsetKey, Number(kcal).toFixed(1));

    console.log(`🔥 CARDIO SYNC: ${unifiedOffsetKey} = ${Number(kcal).toFixed(1)}`);
    console.log(`🔥 CARDIO SYNC: ${legacyOffsetKey} = ${Number(kcal).toFixed(1)}`);

    /* --- 3. CALENDAR SYNC (MARK AS COMPLETED) --- */
    if (km >= 15 || kcal >= 400) {
        const doneKey = M?.workout?.done || "pegasus_workouts_done";
        const calendarData = JSON.parse(localStorage.getItem(doneKey) || "{}");

        calendarData[workoutKey] = true;
        localStorage.setItem(doneKey, JSON.stringify(calendarData));

        console.log(`✅ CALENDAR: Workout marked as done (${workoutKey}).`);
    }

    /* --- 4. ΙΣΤΟΡΙΚΟ ΚΑΤΑΓΡΑΦΗΣ (50 entries max) --- */
    let historyLog = JSON.parse(localStorage.getItem("pegasus_cardio_history") || "[]");
    if (!Array.isArray(historyLog)) historyLog = [];

    historyLog.unshift({
        date: dateStr,
        type: "Ποδηλασία",
        km: km,
        kcal: kcal
    });

    localStorage.setItem("pegasus_cardio_history", JSON.stringify(historyLog.slice(0, 50)));

    /* --- 5. UI REFRESH --- */
    alert(`✅ ΚΑΤΑΧΩΡΗΘΗΚΕ!
Θερμίδες: ${kcal} kcal
Πόδια: +${credit} σετ από ποδηλασία.`);

    window.PegasusCardio.close();

    if (typeof window.refreshAllUI === "function") window.refreshAllUI();
    if (window.MuscleProgressUI?.render) window.MuscleProgressUI.render();
    if (typeof window.updateFoodUI === "function") window.updateFoodUI();
    if (typeof window.renderFood === "function") window.renderFood();
    if (typeof window.updateKcalUI === "function") window.updateKcalUI();

    /* --- 6. CLOUD PUSH --- */
    if (window.PegasusCloud?.push) {
        await window.PegasusCloud.push(true);
    }
};
