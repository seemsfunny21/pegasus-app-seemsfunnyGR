/* ==========================================================================
   PEGASUS METABOLIC ENGINE - v5.8 (ADDITIVE SYNC MODE)
   Protocol: Cumulative Set Deduction & Calorie Offset Sync
   ========================================================================== */

window.PegasusCardio = {
    init: function() {
        const btn = document.getElementById("totalWorkoutsDisplay");
        if (btn) { btn.onclick = () => this.open(); }
        console.log("PEGASUS: Cardio Engine Listener Active.");
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

        // 1. ΥΠΟΛΟΓΙΣΜΟΣ CREDIT (0.6 σετ ανά χιλιόμετρο)
        const setCredit = parseFloat((km * 0.6).toFixed(1));

        // 2. [ADDITIVE LOGIC] Ανάκτηση παλιών τιμών για σωρευτική αποθήκευση
        const currentSets = parseFloat(localStorage.getItem("pegasus_cardio_offset_sets")) || 0;
        const currentKcal = parseFloat(localStorage.getItem("pegasus_cardio_offset")) || 0;

        const totalSets = parseFloat((currentSets + setCredit).toFixed(1));
        const totalKcal = parseFloat((currentKcal + burnedKcal).toFixed(1));

        localStorage.setItem("pegasus_cardio_offset_sets", totalSets);
        localStorage.setItem("pegasus_cardio_offset", totalKcal);

        // 3. ΕΝΗΜΕΡΩΣΗ ΕΒΔΟΜΑΔΙΑΙΑΣ ΠΡΟΟΔΟΥ (Σωρευτικά για τις μπάρες)
        let history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || { 
            "Στήθος": 0, "Πλάτη": 0, "Ώμοι": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 
        };
        history["Πόδια"] = parseFloat(((parseFloat(history["Πόδια"]) || 0) + setCredit).toFixed(1));
        localStorage.setItem('pegasus_weekly_history', JSON.stringify(history));

        // 4. LOGGING (Διατήρηση ιστορικού ανά διαδρομή)
        const entry = { route, km, kcal: burnedKcal, date: dateKey, timestamp: Date.now() };
        localStorage.setItem(`cardio_log_${dateKey}`, JSON.stringify(entry));

        // 5. UI REFRESH
        if (window.MuscleProgressUI) {
            window.MuscleProgressUI.lastDataHash = null;
            window.MuscleProgressUI.render();
        }

        const activeBtn = document.querySelector(".navbar button.active");
        if (activeBtn && typeof window.selectDay === "function") {
            window.selectDay(activeBtn, activeBtn.textContent.trim());
        }

        if (window.PegasusCloud && window.PegasusCloud.hasSuccessfullyPulled) {
            window.PegasusCloud.push(true);
        }

        alert(`METABOLIC ADD: +${setCredit} σετ (Σύνολο: ${totalSets}) | +${burnedKcal} kcal.`);
        this.close();
        this.resetForm();
    }
};

// Global Handlers
window.saveCardioData = () => window.PegasusCardio.save();

// Initialization
window.addEventListener("load", () => { 
    if (window.PegasusCardio) window.PegasusCardio.init(); 
});
