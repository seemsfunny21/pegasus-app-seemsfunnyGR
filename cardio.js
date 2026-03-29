/* ==========================================================================
   PEGASUS METABOLIC ENGINE - v6.2 (ZEOPA BRIDGE & CALENDAR FIX)
   Protocol: Manual Cardio Sync to Food Budget & Leg Sets Credit
   Feature: Automatic Calendar Green-Light (workouts_done Integration)
   ========================================================================== */

window.PegasusCardio = {
    init: function() {
        const btn = document.getElementById("totalWorkoutsDisplay");
        if (btn) { btn.onclick = () => this.open(); }
        console.log("🚀 PEGASUS: Cardio Zeopa Bridge Online.");
    },

    open: function() {
        const panel = document.getElementById("cardioPanel");
        if (panel) {
            panel.style.display = "block";
            // Αυτόματη συμπλήρωση σημερινής ημερομηνίας
            document.getElementById("cDate").value = new Date().toISOString().split('T')[0];
        }
    },

    close: function() { 
        const panel = document.getElementById("cardioPanel");
        if (panel) panel.style.display = "none"; 
    },

    resetForm: function() {
        ["cRoute", "cKm", "cTime", "cKcal"].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.value = "";
        });
    },

    save: function() {
        const route = document.getElementById("cRoute").value || "Cycling Session";
        const km = parseFloat(document.getElementById("cKm").value) || 0;
        const burnedKcal = parseFloat(document.getElementById("cKcal").value) || 0;
        
        if (km <= 0 || burnedKcal <= 0) {
            alert("PEGASUS: Απαιτούνται Χιλιόμετρα και Θερμίδες από το Zeopa.");
            return;
        }

        // 1. ΕΝΗΜΕΡΩΣΗ FOOD BUDGET (Direct Additive Logic)
        let currentDailyKcal = parseFloat(localStorage.getItem("pegasus_today_kcal")) || 0;
        let newDailyKcal = parseFloat((currentDailyKcal + burnedKcal).toFixed(1));
        localStorage.setItem("pegasus_today_kcal", newDailyKcal);

        // 2. ΥΠΟΛΟΓΙΣΜΟΣ CREDIT ΣΕΤ (18 σετ standard για ολοκληρωμένη συνεδρία >20km)
        const setCredit = Math.min(18, parseFloat((km * 0.6).toFixed(1)));
        
        // 3. ΕΝΗΜΕΡΩΣΗ ΕΒΔΟΜΑΔΙΑΙΑΣ ΠΡΟΟΔΟΥ ΠΟΔΙΩΝ
        let history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || { 
            "Στήθος": 0, "Πλάτη": 0, "Ώμοι": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 
        };
        history["Πόδια"] = parseFloat(((parseFloat(history["Πόδια"]) || 0) + setCredit).toFixed(1));
        localStorage.setItem('pegasus_weekly_history', JSON.stringify(history));

        // 4. 🔥 WORKOUT COMPLETION PROTOCOL (Calendar Green Activation)
        // Διασφαλίζει ότι PC και Mobile χρησιμοποιούν το ίδιο κλειδί ημερομηνίας
        const now = new Date();
        const workoutKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        let doneWorkouts = JSON.parse(localStorage.getItem("pegasus_workouts_done") || "{}");
        doneWorkouts[workoutKey] = true;
        localStorage.setItem("pegasus_workouts_done", JSON.stringify(doneWorkouts));

        // 5. ΕΝΗΜΕΡΩΣΗ CARDIO OFFSET
        let currentOffset = parseFloat(localStorage.getItem("pegasus_cardio_offset_sets")) || 0;
        localStorage.setItem("pegasus_cardio_offset_sets", (currentOffset + setCredit).toFixed(1));

        // 6. CLOUD SYNC & UI REFRESH
        if (window.MuscleProgressUI) window.MuscleProgressUI.render();
        if (window.updateFoodUI) window.updateFoodUI(); 
        
        // Επιβολή επανασχεδίασης ημερολογίου για άμεσο πρασίνισμα
        if (window.PegasusCalendar && window.PegasusCalendar.render) {
            window.PegasusCalendar.render();
        } else if (window.renderCalendar) {
            window.renderCalendar();
        }

        const activeBtn = document.querySelector(".navbar button.active");
        if (activeBtn && typeof window.selectDay === "function") {
            window.selectDay(activeBtn, activeBtn.textContent.trim());
        }

        // Push στο Cloud αν υπάρχει σύνδεση
        if (window.PegasusCloud) window.PegasusCloud.push(true);

        alert(`✅ ZEOPA SYNC: +${burnedKcal} kcal | +${setCredit} σετ στα Πόδια | Η μέρα 29 έγινε ΠΡΑΣΙΝΗ.`);
        
        this.close();
        this.resetForm();
    }
};

window.saveCardioData = () => window.PegasusCardio.save();

// Initialization on load
window.addEventListener("load", () => { 
    if (window.PegasusCardio) window.PegasusCardio.init(); 
});
