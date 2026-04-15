/* ==========================================================================
   PEGASUS OS - CARDIO MODULE (MOBILE EDITION v14.3 MAXIMALIST)
   Protocol: Auto-Cycling, Metabolic Sync, XP Alignment & History Logging
   Status: FINAL STABLE | FIXED: UNIFIED DATE PADDING & HISTORY RETENTION
   ========================================================================== */

window.PegasusCardio = {
    save: async function() {
        const kmEl = document.getElementById('cdKm');
        const kcalEl = document.getElementById('cdKcalBurned');
        
        const km = parseFloat(kmEl.value) || 0; 
        const burnedKcal = parseFloat(kcalEl.value) || 0;
        
        if (km === 0 && burnedKcal === 0) return;

        // --- 0. DATE PREPARATION (UNIFIED PADDING PROTOCOL) ---
        const rawDate = new Date();
        const d = String(rawDate.getDate()).padStart(2, '0');
        const m = String(rawDate.getMonth() + 1).padStart(2, '0');
        const y = rawDate.getFullYear();
        
        // 🎯 FIXED: Padding applied to match Calendar, PC & EMS Guard
        const dateStr = `${d}/${m}/${y}`;
        const workoutKey = `${y}-${m}-${d}`;

        // --- 1. ΕΚΤΙΜΗΣΗ ΚΟΠΩΣΗΣ & LIFETIME STATS (XP) ---
        if(km > 0) { 
            // Weekly Progress Update
            let history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
            const credit = 18; // Σταθερά 18 σετ (Cycling Protocol)
            history["Πόδια"] = (history["Πόδια"] || 0) + credit;
            localStorage.setItem('pegasus_weekly_history', JSON.stringify(history)); 

            // 🏆 ACHIEVEMENT SYNC: Πίστωση σετ στο Lifetime Stats για XP
            let stats = JSON.parse(localStorage.getItem('pegasus_stats')) || { totalSets: 0, exerciseHistory: {} };
            stats.totalSets = (stats.totalSets || 0) + credit;
            localStorage.setItem('pegasus_stats', JSON.stringify(stats));
            
            // 💾 DETAILED HISTORY LOGGING: Για την καρτέλα Cardio History
            let cardioLog = JSON.parse(localStorage.getItem("pegasus_cardio_history") || "[]");
            cardioLog.unshift({ 
                date: dateStr, 
                type: "Ποδηλασία", 
                km: km, 
                kcal: burnedKcal 
            });
            localStorage.setItem("pegasus_cardio_history", JSON.stringify(cardioLog.slice(0, 50)));
            
            console.log(`🚴 CARDIO: ${km}km logged. ${credit} sets credited to Legs & XP.`);
        }

        // --- 2. ΜΕΤΑΒΟΛΙΚΗ ΣΥΝΔΕΣΗ (TARGET & DASHBOARD SYNC) ---
        if(burnedKcal > 0) {
            // A. Daily Target Offset (Για το Diet Module)
            let todayCardioKcal = parseFloat(localStorage.getItem("pegasus_cardio_kcal_" + dateStr)) || 0;
            localStorage.setItem("pegasus_cardio_kcal_" + dateStr, (todayCardioKcal + burnedKcal).toFixed(1));

            // B. Weekly Dashboard Sync (Για την κεντρική οθόνη PC/Mobile)
            let weeklyKcal = parseFloat(localStorage.getItem("pegasus_weekly_kcal")) || 0;
            localStorage.setItem("pegasus_weekly_kcal", (weeklyKcal + burnedKcal).toFixed(1));
            
            // C. Live UI Refresh
            if(window.PegasusDiet && typeof window.PegasusDiet.updateUI === "function") {
                window.PegasusDiet.updateUI();
            }
            console.log(`🔥 METABOLIC: Dashboard & Daily target increased by ${burnedKcal} kcal.`);
        }

        // --- 3. 🎯 CALENDAR SYNC: Πρασίνισμα Ημέρας ---
        if (km >= 15 || burnedKcal >= 400) {
            let doneKey = "pegasus_workouts_done";
            let calendarData = JSON.parse(localStorage.getItem(doneKey) || "{}");
            calendarData[workoutKey] = true;
            localStorage.setItem(doneKey, JSON.stringify(calendarData));
            console.log(`✅ CALENDAR: Day marked as completed (${workoutKey}).`);
        }
        
        // --- 4. CLEANUP & SYNC ---
        if(kmEl) kmEl.value = "";
        if(kcalEl) kcalEl.value = "";
        
        if (typeof openView === "function") openView('home');
        
        // Execution of Strict Cloud Push
        if (window.PegasusCloud) await window.PegasusCloud.push(true);
    }
};
