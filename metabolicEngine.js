/* =============================================================
   PEGASUS UNIFIED METABOLIC ENGINE - v16.4 (SHIELDED EDITION)
   Merged: calories.js + metabolic.js
   Protocol: Strict Session Isolation, Midnight Guard & Calendar Sync
   Status: FINAL STABLE | FIXED: KCAL OVERLAP & GHOST DATA
   ============================================================= */

const PegasusMetabolic = {
    sessionKcal: 0, 

    get userWeight() {
        return parseFloat(localStorage.getItem("pegasus_weight")) || 74;
    },

    resetSession: function() {
        this.sessionKcal = 0;
        this.renderUI(0); 
        console.log("🔄 PEGASUS METABOLIC: Session Counter Reset to 0.");
    },

    getMET: function(exerciseName, liftedWeight) {
        const name = exerciseName.toLowerCase();
        if (name.includes("ποδηλασία") || name.includes("cycling")) return 10.0;
        if (name.includes("προθέρμανση") || name.includes("warmup")) return 3.0;
        
        // 🎯 Μηδενισμός πλασματικών θερμίδων στις ημέρες αποθεραπείας (Stretching Calorie Leak)
        if (name.includes("stretching") || name.includes("διατάσεις") || name.includes("αποθεραπεία")) return 2.0;

        let baseMET = 7.0; 
        if (liftedWeight > 0) {
            const loadRatio = liftedWeight / this.userWeight;
            baseMET += (loadRatio * 5); 
        }
        return baseMET;
    },

    /**
     * Κύρια συνάρτηση καταγραφής - ΚΑΛΕΙΤΑΙ ΑΠΟ ΤΟ app.js ΚΑΘΕ ΔΕΥΤΕΡΟΛΕΠΤΟ
     */
    updateTracking: function(durationSeconds, exerciseName) {
        // 1. ΑΚΑΡΙΑΙΑ ΑΠΟΘΗΚΕΥΣΗ ΚΙΛΩΝ
        const weightInput = document.querySelector(".weight-input");
        let liftedWeight = weightInput ? parseFloat(weightInput.value) : 0;
        
        if (liftedWeight > 0) {
            localStorage.setItem(`weight_ΑΓΓΕΛΟΣ_${exerciseName.trim()}_records`, liftedWeight);
        } else {
            liftedWeight = parseFloat(localStorage.getItem(`weight_ΑΓΓΕΛΟΣ_${exerciseName.trim()}_records`)) || 0;
        }

        // 2. ΥΠΟΛΟΓΙΣΜΟΣ ΘΕΡΜΙΔΩΝ (Active Burn)
        const activeMET = this.getMET(exerciseName, liftedWeight);
        const durationMins = durationSeconds / 60;
        const kcalPerMin = (activeMET * 3.5 * this.userWeight) / 200;
        const addedKcal = parseFloat((kcalPerMin * durationMins).toFixed(4));

        // 3. ΕΝΗΜΕΡΩΣΗ COUNTERS (🎯 FIXED: Session/Weekly Isolation - Not Today Kcal)
        this.sessionKcal += addedKcal; 

        let currentSession = parseFloat(localStorage.getItem("pegasus_session_kcal")) || 0;
        localStorage.setItem("pegasus_session_kcal", (currentSession + addedKcal).toFixed(4));
        
        // Ενημέρωση και του Εβδομαδιαίου (για το UI Dashboard)
        let currentWeekly = parseFloat(localStorage.getItem("pegasus_weekly_kcal")) || 0;
        localStorage.setItem("pegasus_weekly_kcal", (currentWeekly + addedKcal).toFixed(4));

        // 4. ΕΝΗΜΕΡΩΣΗ ΟΛΩΝ ΤΩΝ UI
        this.renderUI(this.sessionKcal);
        
        // 5. ΕΠΙΚΥΡΩΣΗ ΗΜΕΡΟΛΟΓΙΟΥ
        this.validateDay();
    },

    /**
     * UNIVERSAL UI RENDERER: Διαφορετική προβολή για Desktop και Mobile
     */
    renderUI: function(sessionValue) {
        const sVal = (sessionValue !== undefined) ? parseFloat(sessionValue) : this.sessionKcal;
        const weeklyBurn = parseFloat(localStorage.getItem("pegasus_weekly_kcal")) || 0;
        
        // Α. Desktop UI (.kcal-value): Δείχνει τις θερμίδες της ΤΡΕΧΟΥΣΑΣ προπόνησης
        const kcalDesktop = document.querySelector(".kcal-value");
        if (kcalDesktop) {
            kcalDesktop.textContent = sVal.toFixed(1);
        }

        // Β. Mobile UI (txtKcal): Δείχνει το ΣΥΝΟΛΟ των θερμίδων που έκαψες την εβδομάδα 
        // 🎯 FIXED: Το Mobile πλέον δείχνει το Activity Burn, όχι το πόσο έφαγες
        const kcalMobile = (window.innerWidth <= 800) ? document.getElementById("txtKcal") : null;
        if (kcalMobile) {
            const targetBurn = 2800; // Στόχος Εβδομαδιαίας Καύσης (π.χ. 4 προπονήσεις x 700)
            kcalMobile.textContent = `${weeklyBurn.toFixed(0)} / ${targetBurn}`;
        }
    },

    validateDay: function() {
        const now = new Date();
        
        // 🎯 FIXED: MIDNIGHT GUARD (Αποτροπή Phantom Kcal Rollover)
        if (now.getHours() >= 0 && now.getHours() < 4) {
            return; // Μην επικυρώνεις προπονήσεις τα ξημερώματα σαν σημερινές
        }

        const todayDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        let history = JSON.parse(localStorage.getItem('pegasus_calendar_history') || "{}");
        let workouts = JSON.parse(localStorage.getItem('pegasus_workouts_done') || "{}");
        
        // Χρησιμοποιούμε τις θερμίδες της συνεδρίας (session), όχι της διατροφής
        const currentBurn = parseFloat(localStorage.getItem("pegasus_session_kcal")) || 0;
        
        if (currentBurn > 100) {
            // Για το αναλυτικό ιστορικό
            history[todayDate] = { status: "completed", verified: true, kcal: currentBurn };
            
            // 🎯 FIXED: Για το Ημερολόγιο/Ημέρες απαιτείται Boolean True!
            workouts[todayDate] = true;
            
            localStorage.setItem('pegasus_calendar_history', JSON.stringify(history));
            localStorage.setItem('pegasus_workouts_done', JSON.stringify(workouts));
        }
    }
};

// Global Bridge
window.PegasusMetabolic = PegasusMetabolic;
window.trackSetCalories = PegasusMetabolic.updateTracking.bind(PegasusMetabolic);

// Initial Render στο φόρτωμα
document.addEventListener('DOMContentLoaded', () => {
    PegasusMetabolic.renderUI();
});
