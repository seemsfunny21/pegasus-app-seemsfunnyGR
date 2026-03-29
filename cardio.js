/* ==========================================================================
   PEGASUS METABOLIC ENGINE - v6.0 (ZEOPA BRIDGE MODE)
   Protocol: Manual Cardio Sync to Food Budget & Leg Sets Credit
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
            document.getElementById("cDate").value = new Date().toISOString().split('T')[0];
        }
    },

    close: function() { document.getElementById("cardioPanel").style.display = "none"; },

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
        // Προσθέτουμε τις θερμίδες στο pegasus_today_kcal για να αυξηθεί το όριο φαγητού
        let currentDailyKcal = parseFloat(localStorage.getItem("pegasus_today_kcal")) || 0;
        let newDailyKcal = parseFloat((currentDailyKcal + burnedKcal).toFixed(1));
        localStorage.setItem("pegasus_today_kcal", newDailyKcal);

        // 2. ΥΠΟΛΟΓΙΣΜΟΣ CREDIT ΣΕΤ (18 σετ standard για ολοκληρωμένη συνεδρία >20km)
        // Αν τα χιλιόμετρα είναι λίγα, υπολογίζουμε αναλογικά (0.6 σετ/km) με max τα 18.
        const setCredit = Math.min(18, parseFloat((km * 0.6).toFixed(1)));
        
        // 3. ΕΝΗΜΕΡΩΣΗ ΕΒΔΟΜΑΔΙΑΙΑΣ ΠΡΟΟΔΟΥ ΠΟΔΙΩΝ
        let history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || { 
            "Στήθος": 0, "Πλάτη": 0, "Ώμοι": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 
        };
        history["Πόδια"] = parseFloat(((parseFloat(history["Πόδια"]) || 0) + setCredit).toFixed(1));
        localStorage.setItem('pegasus_weekly_history', JSON.stringify(history));

        // 4. ΕΝΗΜΕΡΩΣΗ CARDIO OFFSET (Για την Παρασκευή)
        let currentOffset = parseFloat(localStorage.getItem("pegasus_cardio_offset_sets")) || 0;
        localStorage.setItem("pegasus_cardio_offset_sets", (currentOffset + setCredit).toFixed(1));

        // 5. CLOUD SYNC & UI REFRESH
        if (window.MuscleProgressUI) window.MuscleProgressUI.render();
        if (window.updateFoodUI) window.updateFoodUI(); // Ενημέρωση Food Panel budget

        const activeBtn = document.querySelector(".navbar button.active");
        if (activeBtn && typeof window.selectDay === "function") {
            window.selectDay(activeBtn, activeBtn.textContent.trim());
        }

        if (window.PegasusCloud) window.PegasusCloud.push(true);

        alert(`✅ ZEOPA SYNC: +${burnedKcal} kcal στο Food Budget | +${setCredit} σετ στα Πόδια.`);
        this.close();
        this.resetForm();
    }
};

window.saveCardioData = () => window.PegasusCardio.save();

window.addEventListener("load", () => { 
    if (window.PegasusCardio) window.PegasusCardio.init(); 
});
