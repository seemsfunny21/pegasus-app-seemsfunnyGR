/* ==========================================================================
   PEGASUS CARDIO ENGINE - v5.1 (GLOBAL SCOPE EXPORT)
   Protocol: Strict Data Analyst - Tracking & Storage
   ========================================================================== */

window.PegasusCardio = {
    init: function() {
        const btn = document.getElementById("totalWorkoutsDisplay");
        if (btn) {
            btn.onclick = () => this.open();
            console.log("PEGASUS: Cardio Engine Listener Active.");
        }
    },

    open: function() {
        const panel = document.getElementById("cardioPanel");
        if (panel) {
            panel.style.display = "block";
            // Αυτόματη συμπλήρωση σημερινής ημερομηνίας
            const today = new Date().toISOString().split('T')[0];
            const dateInput = document.getElementById("cDate");
            if (dateInput) dateInput.value = today;
        }
    },

    close: function() {
        const panel = document.getElementById("cardioPanel");
        if (panel) panel.style.display = "none";
    },

    save: function() {
        const route = document.getElementById("cRoute").value;
        const km = document.getElementById("cKm").value;
        const time = document.getElementById("cTime").value;
        const kcal = document.getElementById("cKcal").value;
        const rawDate = document.getElementById("cDate").value;

        if (!route || !km) {
            alert("Συμπλήρωσε Διαδρομή και Χιλιόμετρα!");
            return;
        }

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

        // Αποθήκευση στο LocalStorage με το πρότυπο κλειδί του Reporting
        localStorage.setItem(`cardio_log_${dateKey}`, JSON.stringify(entry));

        // Ενημέρωση Cloud αν είναι ξεκλείδωτο
        if (window.PegasusCloud && window.PegasusCloud.hasSuccessfullyPulled) {
            window.PegasusCloud.push(true);
        }

        alert(`Η διαδρομή "${route}" αποθηκεύτηκε επιτυχώς!`);
        this.close();
        
        // Καθαρισμός φόρμας για την επόμενη χρήση
        this.resetForm();
    },

    resetForm: function() {
        const fields = ["cRoute", "cKm", "cTime", "cKcal"];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });
    }
};

// Global Handlers για σύνδεση με το UI (index.html)
window.saveCardioData = () => window.PegasusCardio.save();

// Εκκίνηση κατά το φόρτωμα της σελίδας
window.addEventListener("load", () => {
    if (window.PegasusCardio) {
        window.PegasusCardio.init();
    }
});

/* =============================================================
   PEGASUS CARDIO ENGINE - SELF-INITIALIZING MODULE
   Protocol: Strict Data Analyst - Modular Interface
   ============================================================= */

window.PegasusCardio = {
    init: function() {
        console.log("🚀 PEGASUS: Cardio Module Initializing...");

        // 1. Σύνδεση με το Display των Προπονήσεων (Navbar ή Dashboard)
        const workoutDisplay = document.getElementById("totalWorkoutsDisplay");
        if (workoutDisplay) {
            workoutDisplay.style.cursor = "pointer";
            workoutDisplay.title = "Κλικ για καταγραφή Cardio/Προπόνησης";
            workoutDisplay.onclick = () => this.togglePanel();
        }

        // 2. Σύνδεση με το κουμπί Αποθήκευσης μέσα στο Cardio Panel
        const saveBtn = document.querySelector("#cardioPanel button.save-btn") || 
                        document.querySelector("#cardioPanel button");
        if (saveBtn) {
            saveBtn.onclick = () => this.handleSave();
        }
    },

    togglePanel: function() {
        const panel = document.getElementById("cardioPanel");
        if (panel) {
            const isVisible = panel.style.display === "block";
            // Κλείσιμο άλλων panels
            document.querySelectorAll('.pegasus-panel').forEach(p => p.style.display = 'none');
            panel.style.display = isVisible ? "none" : "block";
            
            if (!isVisible && typeof window.updateCardioUI === "function") {
                window.updateCardioUI();
            }
        }
    },

    handleSave: function() {
        // Καλούμε την υπάρχουσα συνάρτηση αποθήκευσης του αρχείου σου
        if (typeof window.saveCardioData === "function") {
            window.saveCardioData();
            // Κλείσιμο μετά την αποθήκευση
            document.getElementById("cardioPanel").style.display = "none";
            
            // Force Sync αν υπάρχει Cloud
            if (window.PegasusCloud && window.PegasusCloud.isUnlocked) {
                window.PegasusCloud.push(true);
            }
        } else {
            console.error("PEGASUS: saveCardioData() function not found!");
        }
    }
};

// Αυτόματη εκκίνηση μόλις φορτώσει η σελίδα
window.addEventListener("load", () => window.PegasusCardio.init());
