/* ===== PEGASUS PARKING TRACKER MODULE - ΑΠΟΚΛΕΙΣΤΙΚΑ ΓΙΑ ΤΗΝ ΑΡΧΙΚΗ ΟΘΟΝΗ ===== */
window.PegasusParking = {
    // 1. Αποθήκευση μόνο της τελευταίας θέσης ως απλό κείμενο
    save: async function() {
        const inputEl = document.getElementById('parkingInput');
        const location = inputEl.value.trim();
        if (!location) return;

        // Αποθήκευση ως string (όχι JSON.stringify) για αποφυγή του σφάλματος SyntaxError
        localStorage.setItem('pegasus_parking_loc', location);
        
        // Καλούμε τη συνάρτηση στο mobile.html για να ενημερώσει το ιστορικό 10 θέσεων
        if (typeof window.saveParkingAction === "function") {
            await window.saveParkingAction();
        } else {
            this.updateUI();
            if (window.PegasusCloud) await window.PegasusCloud.push();
        }
    },

    clear: function() {
        localStorage.removeItem('pegasus_parking_loc');
        localStorage.removeItem('pegasus_parking_history');
        if (document.getElementById('parkingInput')) document.getElementById('parkingInput').value = "";
        this.updateUI();
        if (window.PegasusCloud) window.PegasusCloud.push();
    },

    updateUI: function() {
        // Safe Read: Αν το περιεχόμενο είναι "ααα", το JSON.parse θα αποτύχει.
        // Χρησιμοποιούμε try-catch για να μη σταματάει η λειτουργία του Pegasus.
        let loc = "--";
        const rawData = localStorage.getItem('pegasus_parking_loc');
        
        try {
            // Δοκιμάζουμε αν είναι παλιό αντικείμενο JSON
            const parsed = JSON.parse(rawData);
            loc = (parsed && parsed.loc) ? parsed.loc : rawData;
        } catch (e) {
            // Αν είναι απλό κείμενο (π.χ. "Μπενέκος"), το παίρνουμε ως έχει
            loc = rawData || "--";
        }

        // Καθαρισμός από τυχόν εισαγωγικά
        loc = loc.replace(/^"|"$/g, '');

        const statusEl = document.getElementById('parkingStatus');
        if (statusEl) statusEl.textContent = `ΠΑΡΚΙΝΓΚ: ${loc}`;
        
        // Ενημέρωση του ιστορικού Top 10 αν υπάρχει η συνάρτηση στο mobile.html
        if (typeof window.renderParkingHistory === "function") {
            window.renderParkingHistory();
        }
    }
};

// Αρχική φόρτωση
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => window.PegasusParking.updateUI(), 500);
});
