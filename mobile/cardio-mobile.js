/* ==========================================================================
   PEGASUS OS - CARDIO MODULE (MOBILE EDITION v14.4 SYNC PATCH)
   Protocol: Unified Cardio Offset, XP Alignment, History Logging & Cloud Sync
   Status: FINAL STABLE | FIXED: MOBILE ↔ DESKTOP KCAL CONSISTENCY
   ========================================================================== */

window.PegasusCardio = {
    save: async function() {
        const kmEl = document.getElementById('cdKm');
        const kcalEl = document.getElementById('cdKcalBurned');

        const km = parseFloat((kmEl?.value || "").replace(',', '.')) || 0;
        const burnedKcal = parseFloat((kcalEl?.value || "").replace(',', '.')) || 0;

        if (km === 0 && burnedKcal === 0) return;

        /* --- 0. DATE PREPARATION (UNIFIED PADDING PROTOCOL) --- */
        const rawDate = new Date();
        const d = String(rawDate.getDate()).padStart(2, '0');
        const m = String(rawDate.getMonth() + 1).padStart(2, '0');
        const y = rawDate.getFullYear();

        const dateStr = `${d}/${m}/${y}`;
        const workoutKey = `${y}-${m}-${d}`;

        /* --- 1. ΕΚΤΙΜΗΣΗ ΚΟΠΩΣΗΣ & LIFETIME STATS (XP) --- */
        if (km > 0) {
            const credit = 18;

            // Weekly Progress Update
            let history = JSON.parse(localStorage.getItem('pegasus_weekly_history') || "{}");
            history["Πόδια"] = (history["Πόδια"] || 0) + credit;
            localStorage.setItem('pegasus_weekly_history', JSON.stringify(history));

            // Lifetime Stats / XP
            let stats = JSON.parse(localStorage.getItem('pegasus_stats') || "{}");
            if (!stats || typeof stats !== "object") stats = {};
            if (typeof stats.totalSets !== "number") stats.totalSets = 0;
            if (!stats.exerciseHistory || typeof stats.exerciseHistory !== "object") stats.exerciseHistory = {};

            stats.totalSets += credit;
            stats.exerciseHistory["Ποδηλασία"] = (stats.exerciseHistory["Ποδηλασία"] || 0) + credit;
            localStorage.setItem('pegasus_stats', JSON.stringify(stats));

            // Detailed History Logging
            let cardioLog = JSON.parse(localStorage.getItem("pegasus_cardio_history") || "[]");
            if (!Array.isArray(cardioLog)) cardioLog = [];

            cardioLog.unshift({
                date: dateStr,
                type: "Ποδηλασία",
                km: km,
                kcal: burnedKcal
            });

            localStorage.setItem("pegasus_cardio_history", JSON.stringify(cardioLog.slice(0, 50)));

            console.log(`🚴 CARDIO: ${km}km logged. ${credit} sets credited to Legs & XP.`);
        }

        /* --- 2. ΜΕΤΑΒΟΛΙΚΗ ΣΥΝΔΕΣΗ (UNIFIED MOBILE + DESKTOP SYNC) --- */
        if (burnedKcal > 0) {
            // Γράφουμε και unified και legacy key ώστε να διαβάζουν το ίδιο mobile + desktop
            const unifiedOffsetKey = "pegasus_cardio_kcal_" + dateStr;
            const legacyOffsetKey = (window.PegasusManifest?.workout?.cardio_offset || "pegasus_cardio_offset_sets") + "_" + dateStr;

            let todayUnified = parseFloat(localStorage.getItem(unifiedOffsetKey)) || 0;
            const nextCardio = (todayUnified + burnedKcal).toFixed(1);

            localStorage.setItem(unifiedOffsetKey, nextCardio);
            localStorage.setItem(legacyOffsetKey, nextCardio);

            // Weekly Dashboard Sync
            let weeklyKcal = parseFloat(localStorage.getItem("pegasus_weekly_kcal")) || 0;
            localStorage.setItem("pegasus_weekly_kcal", (weeklyKcal + burnedKcal).toFixed(1));

            // Live UI Refresh
            if (window.PegasusDiet && typeof window.PegasusDiet.updateUI === "function") {
                window.PegasusDiet.updateUI();
            }
            if (typeof window.updateFoodUI === "function") {
                window.updateFoodUI();
            }
            if (typeof window.renderFood === "function") {
                window.renderFood();
            }

            console.log(`🔥 METABOLIC: Unified cardio sync +${burnedKcal} kcal (${unifiedOffsetKey}).`);
            console.log(`🔥 METABOLIC: Legacy cardio sync +${burnedKcal} kcal (${legacyOffsetKey}).`);
        }

        /* --- 3. 🎯 CALENDAR SYNC: Πρασίνισμα Ημέρας --- */
        if (km >= 15 || burnedKcal >= 400) {
            const doneKey = "pegasus_workouts_done";
            let calendarData = JSON.parse(localStorage.getItem(doneKey) || "{}");

            calendarData[workoutKey] = true;
            localStorage.setItem(doneKey, JSON.stringify(calendarData));

            console.log(`✅ CALENDAR: Day marked as completed (${workoutKey}).`);
        }

        /* --- 4. UI REFRESH --- */
        if (window.MuscleProgressUI?.render) {
            window.MuscleProgressUI.render();
        }

        /* --- 5. CLEANUP & SYNC --- */
        if (kmEl) kmEl.value = "";
        if (kcalEl) kcalEl.value = "";

        if (typeof openView === "function") openView('home');

        if (window.PegasusCloud?.push) {
            await window.PegasusCloud.push(true);
        }
    }
};
