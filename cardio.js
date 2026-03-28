/* ==========================================================================
   PEGASUS METABOLIC ENGINE - v5.3 (STRICT DATA ANALYST)
   Protocol: Dynamic Set Credit & Calorie Offset Sync
   ========================================================================== */

window.PegasusCardio = {
    init: function() {
        const btn = document.getElementById("totalWorkoutsDisplay");
        if (btn) { btn.onclick = () => this.open(); }
    },

    open: function() {
        const panel = document.getElementById("cardioPanel");
        if (panel) {
            panel.style.display = "block";
            document.getElementById("cDate").value = new Date().toISOString().split('T')[0];
        }
    },

    close: function() { document.getElementById("cardioPanel").style.display = "none"; },

    resetForm: function() {
        ["cRoute", "cKm", "cTime", "cKcal"].forEach(id => {
            if(document.getElementById(id)) document.getElementById(id).value = "";
        });
    },

    save: function() {
        const route = document.getElementById("cRoute").value;
        const km = parseFloat(document.getElementById("cKm").value) || 0;
        const burnedKcal = parseFloat(document.getElementById("cKcal").value) || 0;
        const rawDate = document.getElementById("cDate").value;

        if (!route || km <= 0) {
            alert("PEGASUS: Απαιτούνται Διαδρομή και Χιλιόμετρα.");
            return;
        }

        const d = new Date(rawDate);
        const dateKey = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;

        // 1. === SYSTEM A: ΑΝΑΛΟΓΙΚΗ ΠΙΣΤΩΣΗ ΣΕΤ (PROGRESS) ===
        let history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || { 
            "Στήθος": 0, "Πλάτη": 0, "Ώμοι": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 
        };
        
        // Υπολογισμός: 18 μονάδες (full προπόνηση) / 30km = 0.6 μονάδες ανά km
        // Άρα τα 4km θα δώσουν 2.4 μονάδες στα Πόδια.
        const setCredit = parseFloat((km * 0.6).toFixed(1));
        history["Πόδια"] = (parseFloat(history["Πόδια"]) || 0) + setCredit;
        localStorage.setItem('pegasus_weekly_history', JSON.stringify(history));

        // 2. === SYSTEM B: CALORIE OFFSET (DIET) ===
        // Αυξάνουμε τον ημερήσιο στόχο θερμίδων (goalKcal) βάσει των καμένων
        let baseGoal = parseFloat(localStorage.getItem("pegasus_goal_kcal")) || 2800;
        let newGoal = baseGoal + burnedKcal;
        
        // Ενημέρωση του UI της Διατροφής (αν είναι ανοιχτό)
        const goalDisplay = document.getElementById("kcalStatus");
        if (goalDisplay) {
            let currentKcal = localStorage.getItem("pegasus_today_kcal") || 0;
            goalDisplay.textContent = `${Math.round(currentKcal)} / ${Math.round(newGoal)} kcal`;
        }
        
        // Προαιρετικά: Αποθηκεύουμε το offset για να το βλέπει το food.js
        localStorage.setItem("pegasus_cardio_offset", burnedKcal);

        // 3. LOGGING & SYNC
        const entry = { route, km, kcal: burnedKcal, date: dateKey, timestamp: Date.now() };
        localStorage.setItem(`cardio_log_${dateKey}`, JSON.stringify(entry));

        if (window.MuscleProgressUI) {
            window.MuscleProgressUI.lastDataHash = null;
            window.MuscleProgressUI.render();
        }

        if (window.PegasusCloud && window.PegasusCloud.hasSuccessfullyPulled) {
            window.PegasusCloud.push(true);
        }

        alert(`ΣΥΝΤΕΛΕΣΤΗΣ: +${setCredit} σετ Πόδια | +${burnedKcal} kcal στο στόχο Διατροφής.`);
        this.close();
        this.resetForm();
    }
};

window.saveCardioData = () => window.PegasusCardio.save();
window.addEventListener("load", () => { if (window.PegasusCardio) window.PegasusCardio.init(); });
