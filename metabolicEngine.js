/* =============================================================
   PEGASUS UNIFIED METABOLIC ENGINE - v16.3 (SESSION ALIGNED)
   Merged: calories.js + metabolic.js
   Protocol: Session vs Daily Tracking & Universal UI Sync
   ============================================================= */

const PegasusMetabolic = {
    sessionKcal: 0, // Μηδενίζει σε κάθε πάτημα του "Έναρξη"

    // Δυναμική ανάκτηση βάρους χρήστη
    get userWeight() {
        return parseFloat(localStorage.getItem("pegasus_weight")) || 74;
    },

    /**
     * Μηδενισμός θερμίδων συνεδρίας (Καλείται στο Start Workout)
     */
    resetSession: function() {
        this.sessionKcal = 0;
        this.renderUI(0); // Ενημέρωση UI για το μηδενισμό
        console.log("🔄 PEGASUS: Session Counter Reset to 0.");
    },

    /**
     * Υπολογισμός MET βάσει άσκησης και φορτίου
     */
    getMET: function(exerciseName, liftedWeight) {
        const name = exerciseName.toLowerCase();
        if (name.includes("ποδηλασία") || name.includes("cycling")) return 10.0;
        if (name.includes("προθέρμανση") || name.includes("warmup")) return 3.0;
        
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

        // 2. ΥΠΟΛΟΓΙΣΜΟΣ ΘΕΡΜΙΔΩΝ
        const activeMET = this.getMET(exerciseName, liftedWeight);
        const durationMins = durationSeconds / 60;
        const kcalPerMin = (activeMET * 3.5 * this.userWeight) / 200;
        const addedKcal = parseFloat((kcalPerMin * durationMins).toFixed(4));

        // 3. ΕΝΗΜΕΡΩΣΗ COUNTERS
        this.sessionKcal += addedKcal; // Live session counter

        let currentDaily = parseFloat(localStorage.getItem("pegasus_today_kcal")) || 0;
        let newDaily = currentDaily + addedKcal;
        localStorage.setItem("pegasus_today_kcal", newDaily.toFixed(4));
        
        // 4. ΕΝΗΜΕΡΩΣΗ ΟΛΩΝ ΤΩΝ UI
        // Περνάμε και τις δύο τιμές για να αποφασίσει το renderUI τι θα δείξει πού
        this.renderUI(this.sessionKcal, newDaily);
        
        // 5. ΕΠΙΚΥΡΩΣΗ ΗΜΕΡΟΛΟΓΙΟΥ
        this.validateDay();
    },

    /**
     * UNIVERSAL UI RENDERER: Διαφορετική προβολή για Desktop και Mobile
     */
    renderUI: function(session, daily) {
        // Αν δεν περαστούν ορίσματα (π.χ. στο Load), τραβάμε τα Daily
        const sVal = parseFloat(session) || this.sessionKcal;
        const dVal = parseFloat(daily) || parseFloat(localStorage.getItem("pegasus_today_kcal")) || 0;
        
        // Α. Desktop UI (.kcal-value): Δείχνει τις θερμίδες της ΤΡΕΧΟΥΣΑΣ προπόνησης
        const kcalDesktop = document.querySelector(".kcal-value");
        if (kcalDesktop) {
            kcalDesktop.textContent = sVal.toFixed(1);
        }

        // Β. Mobile UI (txtKcal): Δείχνει το ΣΥΝΟΛΟ της ημέρας (π.χ. Πρωινή + Τρέχουσα)
        const kcalMobile = document.getElementById("txtKcal");
        if (kcalMobile) {
            kcalMobile.textContent = `${dVal.toFixed(0)} / 2800`;
        }
    },

    validateDay: function() {
        const today = new Date().toISOString().split('T')[0];
        let history = JSON.parse(localStorage.getItem('pegasus_calendar_history') || "{}");
        let workouts = JSON.parse(localStorage.getItem('pegasus_workouts_done') || "{}");
        
        const currentKcal = parseFloat(localStorage.getItem("pegasus_today_kcal")) || 0;
        if (currentKcal > 100) {
            const entry = { status: "completed", verified: true, kcal: currentKcal };
            history[today] = entry;
            workouts[today] = entry;
            localStorage.setItem('pegasus_calendar_history', JSON.stringify(history));
            localStorage.setItem('pegasus_workouts_done', JSON.stringify(workouts));
        }
    }
};

// Global Bridge
window.PegasusMetabolic = PegasusMetabolic;
window.trackSetCalories = PegasusMetabolic.updateTracking.bind(PegasusMetabolic);

// Initial Render στο φόρτωμα (Δείχνουμε το daily μέχρι να πατηθεί το Start)
document.addEventListener('DOMContentLoaded', () => {
    const savedDaily = localStorage.getItem("pegasus_today_kcal") || "0";
    PegasusMetabolic.renderUI(0, savedDaily);
});
