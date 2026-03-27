/* ==========================================================================
   PEGASUS CARDIO ENGINE - CLEAN SWEEP v17.0
   Protocol: Strict Activity Logging | Logic: Global Scope Integration
   ========================================================================== */

window.PegasusCardio = {
    /**
     * Αρχικοποίηση Listeners
     */
    init: function() {
        const btn = document.getElementById("totalWorkoutsDisplay");
        if (btn) {
            btn.onclick = () => this.open();
        }
        console.log("✅ PEGASUS: Cardio Engine Active.");
    },

    /**
     * Άνοιγμα του Cardio Panel
     */
    open: function() {
        const panel = document.getElementById("cardioPanel");
        if (panel) {
            // Πρωτόκολλο Clean Sweep: Κλείσιμο άλλων panels
            if (window.PegasusUI && window.PegasusUI.panels) {
                window.PegasusUI.panels.forEach(p => {
                    const el = document.getElementById(p);
                    if (el) el.style.display = "none";
                });
            }
            
            panel.style.display = "block";
            
            // Αυτόματη συμπλήρωση σημερινής ημερομηνίας (ISO format για το input)
            const today = new Date().toISOString().split('T')[0];
            const dateInput = document.getElementById("cDate");
            if (dateInput) dateInput.value = today;
        }
    },

    close: function() {
        const panel = document.getElementById("cardioPanel");
        if (panel) panel.style.display = "none";
    },

    /**
     * Αποθήκευση Δεδομένων Δραστηριότητας
     */
    save: function() {
        const route = document.getElementById("cRoute")?.value;
        const km = document.getElementById("cKm")?.value;
        const time = document.getElementById("cTime")?.value;
        const kcal = document.getElementById("cKcal")?.value;
        const rawDate = document.getElementById("cDate")?.value;

        if (!route || !km) {
            alert("PEGASUS STRICT: Συμπλήρωσε Διαδρομή και Χιλιόμετρα!");
            return;
        }

        // Μετατροπή ημερομηνίας σε Key μορφή (DD/MM/YYYY)
        const d = new Date(rawDate);
        const dateKey = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;

        const entry = {
            route: route,
            km: km,
            time: time,
            kcal: kcal,
            date: dateKey,
            timestamp: Date.now()
        };

        // Αποθήκευση στο LocalStorage
        localStorage.setItem(`cardio_log_${dateKey}`, JSON.stringify(entry));

        // Ενημέρωση Cloud Sync (αν είναι ξεκλείδωτο)
        if (window.PegasusCloud && window.PegasusCloud.isUnlocked) {
            window.PegasusCloud.push(true);
        }

        if (window.PegasusLogger) {
            window.PegasusLogger.log(`Cardio Log Saved: ${route} (${km}km)`, "INFO");
        }

        alert(`Η διαδρομή "${route}" καταγράφηκε επιτυχώς!`);
        this.resetForm();
        this.close();
    },

    resetForm: function() {
        ["cRoute", "cKm", "cTime", "cKcal"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });
    }
};

/**
 * Global Handlers για το UI
 */
window.saveCardioData = () => window.PegasusCardio.save();

// Boot Sequence
window.addEventListener("load", () => {
    window.PegasusCardio.init();
});