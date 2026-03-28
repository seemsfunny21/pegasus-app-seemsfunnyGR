/* ==========================================================================
   PEGASUS METABOLIC ENGINE - v5.4 (STRICT SYNTAX & SHADOW TRACKING)
   Protocol: Dynamic Set Credit & Calorie Offset Sync (Zero-Ghost UI)
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

        // 1. === SYSTEM A: SILENT PROGRESS UPDATE (SHADOW) ===
        let history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || { 
            "Στήθος": 0, "Πλάτη": 0, "Ώμοι": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 
        };
        
        const setCredit = parseFloat((km * 0.6).toFixed(1));
        history["Πόδια"] = parseFloat(((parseFloat(history["Πόδια"]) || 0) + setCredit).toFixed(1));
        localStorage.setItem('pegasus_weekly_history', JSON.stringify(history));

        // 2. === SYSTEM B: CALORIE OFFSET (DIET SYNC) ===
        localStorage.setItem("pegasus_cardio_offset", burnedKcal);
        
        // 3. LOGGING
        const entry = { route, km, kcal: burnedKcal, date: dateKey, timestamp: Date.now() };
        localStorage.setItem(`cardio_log_${dateKey}`, JSON.stringify(entry));

        // 4. UI REFRESH (ONLY PROGRESS BARS)
        if (window.MuscleProgressUI) {
            window.MuscleProgressUI.lastDataHash = null;
            window.MuscleProgressUI.render();
        }

        if (window.PegasusCloud && window.PegasusCloud.hasSuccessfullyPulled) {
            window.PegasusCloud.push(true);
        }

        alert(`METABOLIC SYNC: +${setCredit} units Πόδια | +${burnedKcal} kcal Offset.`);
        this.close();
        this.resetForm();

        // 5. GHOST REMOVAL: Επιβολή καθαρισμού λίστας ασκήσεων
        const activeBtn = document.querySelector(".navbar button.active");
        if (activeBtn && typeof window.selectDay === "function") {
            window.selectDay(activeBtn, activeBtn.textContent.trim());
        }
    }
}; // <-- ΑΥΤΗ Η ΑΓΚΥΛΗ ΕΛΕΙΠΕ ΚΑΙ ΕΒΓΑΖΕ ΤΟ ERROR ΣΤΗ ΓΡΑΜΜΗ 89

// Global Handlers
window.saveCardioData = () => window.PegasusCardio.save();

// Initialization
window.addEventListener("load", () => { 
    if (window.PegasusCardio) window.PegasusCardio.init(); 
});
