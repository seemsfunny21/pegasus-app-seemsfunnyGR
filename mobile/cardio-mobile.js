/* ==========================================================================
   PEGASUS OS - CARDIO MODULE (MOBILE EDITION v13.9 FINAL)
   Protocol: Metabolic Engine Sync, Muscle Fatigue & Calendar Integration
   ========================================================================== */

window.PegasusCardio = {
    save: async function() {
        const km = parseFloat(document.getElementById('cdKm').value) || 0; 
        const burnedKcal = parseFloat(document.getElementById('cdKcalBurned').value) || 0;
        const route = (document.getElementById('cdRoute').value || "ΑΕΡΟΒΙΑ").toUpperCase();
        
        if (km === 0 && burnedKcal === 0) return; // Ακύρωση αν πατηθεί κατά λάθος άδειο

        // --- 1. ΕΚΤΙΜΗΣΗ ΚΟΠΩΣΗΣ (ΠΙΣΤΩΣΗ ΣΤΑ ΠΟΔΙΑ) ---
        if(km > 0) { 
            let history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
            
            // Αν είναι ποδήλατο δίνει 18 σετ, αλλιώς 1 σετ ανά 2km τρεξίματος
            const credit = (route.includes("ΠΟΔΗΛΑ") || route.includes("CYCL")) ? 18 : Math.max(1, Math.floor(km/2));
            
            history["Πόδια"] = (history["Πόδια"] || 0) + credit;
            localStorage.setItem('pegasus_weekly_history', JSON.stringify(history)); 
            console.log(`🚴 CARDIO: Credited ${credit} sets to Legs.`);
        }

        // --- 2. ΜΕΤΑΒΟΛΙΚΗ ΣΥΝΔΕΣΗ (ΑΥΞΗΣΗ ΗΜΕΡΗΣΙΟΥ ΣΤΟΧΟΥ ΘΕΡΜΙΔΩΝ) ---
        if(burnedKcal > 0) {
            const dateStr = new Date().toLocaleDateString('el-GR');
            let todayCardioKcal = parseFloat(localStorage.getItem("pegasus_cardio_kcal_" + dateStr)) || 0;
            
            // Προσθέτει τις νέες θερμίδες στις ήδη υπάρχουσες της ημέρας
            localStorage.setItem("pegasus_cardio_kcal_" + dateStr, todayCardioKcal + burnedKcal);
            
            // Κάνει Update το UI της Διατροφής ώστε το 2800 να γίνει π.χ. 3100 ακαριαία
            if(window.PegasusDiet && typeof window.PegasusDiet.updateUI === "function") {
                window.PegasusDiet.updateUI();
            }
            console.log(`🔥 CARDIO: Target increased by ${burnedKcal} kcal.`);
        }

        // --- 3. 🎯 CALENDAR SYNC (ΝΕΟ): Πρασίνισμα στο Ημερολόγιο (app.js) ---
        // Αν έκανες πάνω από 15km ποδήλατο ή έκαψες πάνω από 400 θερμίδες, θεωρείται "Πλήρης Προπόνηση"
        if ((route.includes("ΠΟΔΗΛΑ") || route.includes("CYCL")) && (km >= 15 || burnedKcal >= 400)) {
            const now = new Date();
            const workoutKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            let doneKey = "pegasus_workouts_done";
            let data = JSON.parse(localStorage.getItem(doneKey) || "{}");
            
            data[workoutKey] = true;
            localStorage.setItem(doneKey, JSON.stringify(data));
            console.log(`✅ CALENDAR: Day marked as completed (${workoutKey}).`);
        }
        
        // Καθαρισμός πεδίων
        document.getElementById('cdKm').value = "";
        document.getElementById('cdKcalBurned').value = "";
        document.getElementById('cdRoute').value = "";
        
        if (typeof openView === "function") openView('home');
        if (window.PegasusCloud) await window.PegasusCloud.push();
    }
};
