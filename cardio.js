/* ==========================================================================
   PEGASUS CARDIO ENGINE - v6.0 (MODULAR / FULLY DECOUPLED)
   Protocol: Strict Data Analyst - Isolated Scope & Safe Sync
   ========================================================================== */

const PegasusCardio = (function() {
    // 1. ΙΔΙΩΤΙΚΕΣ ΛΕΙΤΟΥΡΓΙΕΣ (Private Methods)
    const openPanel = () => {
        const panel = document.getElementById("cardioPanel");
        if (panel) {
            panel.style.display = "block";
            const today = new Date().toISOString().split('T')[0];
            const dateInput = document.getElementById("cDate");
            if (dateInput) dateInput.value = today;
        }
    };

    const closePanel = () => {
        const panel = document.getElementById("cardioPanel");
        if (panel) panel.style.display = "none";
    };

    const resetFormFields = () => {
        const fields = ["cRoute", "cKm", "cTime", "cKcal"];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });
    };

    const saveEntry = () => {
        const route = document.getElementById("cRoute")?.value;
        const km = document.getElementById("cKm")?.value;
        const time = document.getElementById("cTime")?.value;
        const kcal = document.getElementById("cKcal")?.value;
        const rawDate = document.getElementById("cDate")?.value;

        if (!route || !km) {
            alert("PEGASUS STRICT: Συμπλήρωσε Διαδρομή και Χιλιόμετρα!");
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

        localStorage.setItem(`cardio_log_${dateKey}`, JSON.stringify(entry));

        // Ασφαλής επικοινωνία με το Cloud Sync
        if (typeof window.PegasusCloud !== 'undefined' && window.PegasusCloud.hasSuccessfullyPulled) {
            window.PegasusCloud.push(true);
        }

        alert(`Η διαδρομή "${route}" αποθηκεύτηκε επιτυχώς!`);
        closePanel();
        resetFormFields();
    };

    const initListeners = () => {
        const btn = document.getElementById("totalWorkoutsDisplay");
        if (btn) {
            btn.addEventListener("click", openPanel);
        }
        
        // Δυναμική σύνδεση του κουμπιού αποθήκευσης
        const saveBtns = document.querySelectorAll('button[onclick*="saveCardioData"]');
        saveBtns.forEach(b => {
            b.removeAttribute('onclick');
            b.addEventListener('click', saveEntry);
        });
        
        console.log("[PEGASUS CARDIO]: Engine initialized and decoupled.");
    };

    // 2. PUBLIC API
    return {
        init: initListeners,
        open: openPanel,
        close: closePanel,
        save: saveEntry
    };
})();

// Εκκίνηση κατά το φόρτωμα της σελίδας
window.addEventListener("DOMContentLoaded", () => {
    PegasusCardio.init();
});

// Προσωρινό Fallback για υπάρχοντα inline onclick στο HTML
window.saveCardioData = PegasusCardio.save;