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
        const km = parseFloat(document.getElementById("cKm").value) || 0;
        const time = document.getElementById("cTime").value;
        const kcal = document.getElementById("cKcal").value;
        const rawDate = document.getElementById("cDate").value;

        if (!route || km <= 0) {
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

        // 1. Αποθήκευση Ιστορικού
        localStorage.setItem(`cardio_log_${dateKey}`, JSON.stringify(entry));

        // 2. === PEGASUS FORCE CREDIT: ΕΝΗΜΕΡΩΣΗ ΜΠΑΡΑΣ ΠΟΔΙΩΝ ===
        let history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || { 
            "Στήθος": 0, "Πλάτη": 0, "Ώμοι": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 
        };

        // Αν η διαδρομή περιέχει "Ποδηλασία", δώσε 18 μονάδες (75% κάλυψη)
        const upperRoute = route.toUpperCase();
        const credit = (upperRoute.includes("ΠΟΔΗΛΑΣΙΑ") || upperRoute.includes("CYCLING")) ? 18 : Math.max(1, Math.floor(km / 2));
        
        history["Πόδια"] = (history["Πόδια"] || 0) + credit;
        localStorage.setItem('pegasus_weekly_history', JSON.stringify(history));

        // 3. Άμεσο Refresh του UI αν είναι ανοιχτό το Preview
        if (window.MuscleProgressUI) {
            window.MuscleProgressUI.lastDataHash = null; // Force Render
            window.MuscleProgressUI.render();
        }

        // 4. Ενημέρωση Cloud
        if (window.PegasusCloud && window.PegasusCloud.hasSuccessfullyPulled) {
            window.PegasusCloud.push(true);
        }

        alert(`Η διαδρομή "${route}" αποθηκεύτηκε! Πιστώθηκαν ${credit} μονάδες στα Πόδια.`);
        this.close();
        this.resetForm();
    },

// Global Handlers για σύνδεση με το UI (index.html)
window.saveCardioData = () => window.PegasusCardio.save();

// Εκκίνηση κατά το φόρτωμα της σελίδας
window.addEventListener("load", () => {
    if (window.PegasusCardio) {
        window.PegasusCardio.init();
    }
});
