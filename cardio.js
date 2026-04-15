/* ==========================================================================
   PEGASUS OS - CARDIO & CYCLING AUTOMATION ENGINE (v2.2)
   Protocol: Data Minimization, Auto-Trigger Muscle Groups & Calendar Sync
   Status: FINAL STABLE | FIXED: CALENDAR MARKING & XP ALIGNMENT
   ========================================================================== */

window.PegasusCardio = {
    open: function() {
        document.getElementById('cardioPanel').style.display = 'block';
        
        // 🎯 Καθαρισμός και Αρχικοποίηση Πεδίων
        const kmInput = document.getElementById('cKm');
        const kcalInput = document.getElementById('cKcal');
        if (kmInput) kmInput.value = "";
        if (kcalInput) kcalInput.value = "";

        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('cDate');
        if (dateInput) dateInput.value = today;

        const routeInput = document.getElementById('cRoute');
        if (routeInput) routeInput.value = "Ποδηλασία";

        const timeInput = document.getElementById('cTime');
        if (timeInput) timeInput.value = "Auto"; 
    },
    close: function() {
        document.getElementById('cardioPanel').style.display = 'none';
    }
};

window.saveCardioData = async function() {
    // 🛡️ Υποστήριξη για κόμμα και NaN Guard
    const rawKm = document.getElementById('cKm').value.replace(',', '.');
    const rawKcal = document.getElementById('cKcal').value.replace(',', '.');
    
    const km = parseFloat(rawKm);
    const kcal = parseFloat(rawKcal);

    if (isNaN(km) || isNaN(kcal) || km <= 0 || kcal <= 0) {
        alert("PEGASUS STRICT: Συμπλήρωσε έγκυρα Χιλιόμετρα και Θερμίδες.");
        return;
    }

    console.log("🚴 CARDIO ENGINE: Executing Global Sync Protocol...");

    // --- 0. DATE PREPARATION (UNIFIED PADDING PROTOCOL) ---
    const rawDate = new Date();
    const d = String(rawDate.getDate()).padStart(2, '0');
    const m = String(rawDate.getMonth() + 1).padStart(2, '0');
    const y = rawDate.getFullYear();
    
    const dateStr = `${d}/${m}/${y}`;
    const workoutKey = `${y}-${m}-${d}`;

    // --- 1. ΜΥΪΚΗ ΟΜΑΔΑ & XP (LIFETIME STATS) ---
    const credit = 18; // 18 σετ Πόδια βάσει πρωτοκόλλου Pegasus

    // A. Weekly History Update
    let historySets = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
    historySets["Πόδια"] = (historySets["Πόδια"] || 0) + credit;
    localStorage.setItem('pegasus_weekly_history', JSON.stringify(historySets));

    // B. Lifetime Stats / XP Update (Achievement Sync)
    let stats = JSON.parse(localStorage.getItem('pegasus_stats')) || { totalSets: 0, exerciseHistory: {} };
    stats.totalSets = (stats.totalSets || 0) + credit;
    if (!stats.exerciseHistory["Ποδηλασία"]) stats.exerciseHistory["Ποδηλασία"] = 0;
    stats.exerciseHistory["Ποδηλασία"] += credit;
    localStorage.setItem('pegasus_stats', JSON.stringify(stats));

    // --- 2. ΕΝΕΡΓΕΙΑΚΟ ΙΣΟΖΥΓΙΟ (METABOLIC SYNC) ---
    // A. Weekly Dashboard Kcal
    let currentWeekly = parseFloat(localStorage.getItem("pegasus_weekly_kcal")) || 0;
    localStorage.setItem("pegasus_weekly_kcal", (currentWeekly + kcal).toFixed(1));

    // B. Daily Mobile Buffer (For EMS Cardio Guard)
    let dailyCardio = parseFloat(localStorage.getItem("pegasus_cardio_kcal_" + dateStr)) || 0;
    localStorage.setItem("pegasus_cardio_kcal_" + dateStr, (dailyCardio + kcal).toFixed(1));

    // --- 3. CALENDAR SYNC (MARK AS COMPLETED) ---
    // Αν τα χιλιόμετρα είναι >= 15 ή οι θερμίδες >= 400, η μέρα πρασινίζει
    if (km >= 15 || kcal >= 400) {
        let doneKey = "pegasus_workouts_done";
        let calendarData = JSON.parse(localStorage.getItem(doneKey) || "{}");
        calendarData[workoutKey] = true;
        localStorage.setItem(doneKey, JSON.stringify(calendarData));
        console.log(`✅ CALENDAR: Workout marked as done (${workoutKey}).`);
    }

    // --- 4. ΙΣΤΟΡΙΚΟ ΚΑΤΑΓΡΑΦΗΣ (50 entries max) ---
    let historyLog = JSON.parse(localStorage.getItem("pegasus_cardio_history") || "[]");
    historyLog.unshift({ 
        date: dateStr, 
        type: "Ποδηλασία",
        km: km,
        kcal: kcal
    });
    localStorage.setItem("pegasus_cardio_history", JSON.stringify(historyLog.slice(0, 50)));

    // --- 5. CLEANUP & CLOUD PUSH ---
    alert(`✅ ΚΑΤΑΧΩΡΗΘΗΚΕ!\nΘερμίδες: ${kcal} kcal\nLeveling: +18 σετ στα Πόδια.`);
    
    window.PegasusCardio.close();
    
    // Ενημέρωση UI αν υπάρχουν οι συναρτήσεις
    if (typeof refreshAllUI === "function") refreshAllUI();
    if (window.MuscleProgressUI) window.MuscleProgressUI.render();
    
    if (window.PegasusCloud) await window.PegasusCloud.push(true);
};
