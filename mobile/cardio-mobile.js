/* ==========================================================================
   PEGASUS OS - CARDIO MODULE (MOBILE EDITION v14.0)
   Protocol: Auto-Cycling Protocol, Metabolic Sync & Calendar Integration
   ========================================================================== */

window.PegasusCardio = {
    save: async function() {
        const km = parseFloat(document.getElementById('cdKm').value) || 0; 
        const burnedKcal = parseFloat(document.getElementById('cdKcalBurned').value) || 0;
        
        // 🛡️ ΑΥΤΟΜΑΤΟΠΟΙΗΣΗ: Ορίζεται μόνιμα ως Ποδηλασία
        const route = "ΠΟΔΗΛΑΣΙΑ";
        
        if (km === 0 && burnedKcal === 0) return; // Ακύρωση αν πατηθεί άδειο

        // --- 1. ΕΚΤΙΜΗΣΗ ΚΟΠΩΣΗΣ (ΠΙΣΤΩΣΗ 18 ΣΕΤ ΣΤΑ ΠΟΔΙΑ) ---
        if(km > 0) { 
            let history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
            const credit = 18; // Σταθερά 18 σετ
            history["Πόδια"] = (history["Πόδια"] || 0) + credit;
            localStorage.setItem('pegasus_weekly_history', JSON.stringify(history)); 
            console.log(`🚴 CARDIO: Credited ${credit} sets to Legs.`);
        }

        // --- 2. ΜΕΤΑΒΟΛΙΚΗ ΣΥΝΔΕΣΗ (ΑΥΞΗΣΗ ΗΜΕΡΗΣΙΟΥ ΣΤΟΧΟΥ ΘΕΡΜΙΔΩΝ) ---
        if(burnedKcal > 0) {
            const dateStr = new Date().toLocaleDateString('el-GR');
            let todayCardioKcal = parseFloat(localStorage.getItem("pegasus_cardio_kcal_" + dateStr)) || 0;
            
            // Προσθέτει τις νέες θερμίδες
            localStorage.setItem("pegasus_cardio_kcal_" + dateStr, todayCardioKcal + burnedKcal);
            
            // Update UI Διατροφής
            if(window.PegasusDiet && typeof window.PegasusDiet.updateUI === "function") {
                window.PegasusDiet.updateUI();
            }
            console.log(`🔥 CARDIO: Target increased by ${burnedKcal} kcal.`);
        }

        // --- 3. 🎯 CALENDAR SYNC: Πρασίνισμα στο Ημερολόγιο ---
        if (km >= 15 || burnedKcal >= 400) {
            const now = new Date();
            const workoutKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            let doneKey = "pegasus_workouts_done";
            let data = JSON.parse(localStorage.getItem(doneKey) || "{}");
            
            data[workoutKey] = true;
            localStorage.setItem(doneKey, JSON.stringify(data));
            console.log(`✅ CALENDAR: Day marked as completed (${workoutKey}).`);
        }
        
        // Καθαρισμός ΜΟΝΟ των ορατών πεδίων (το κρυφό route δεν πειράζεται)
        document.getElementById('cdKm').value = "";
        document.getElementById('cdKcalBurned').value = "";
        
        // Επιστροφή στην αρχική οθόνη και Συγχρονισμός
        if (typeof openView === "function") openView('home');
        if (window.PegasusCloud) await window.PegasusCloud.push(true);
    }
};
