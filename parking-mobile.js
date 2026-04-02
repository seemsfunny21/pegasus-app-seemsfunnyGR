/* ===== PEGASUS PARKING TRACKER MODULE ===== */
window.PegasusParking = {
    save: function() {
        const location = document.getElementById('parkingInput').value;
        if (!location) return;

        const parkingData = {
            loc: location,
            ts: new Date().toLocaleString('el-GR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
        };

        localStorage.setItem('pegasus_parking_loc', JSON.stringify(parkingData));
        this.updateUI();
        
        // Αυτόματο Cloud Push
        if (window.PegasusCloud) window.PegasusCloud.push();
    },

    clear: function() {
        localStorage.removeItem('pegasus_parking_loc');
        document.getElementById('parkingInput').value = "";
        this.updateUI();
        if (window.PegasusCloud) window.PegasusCloud.push();
    },

    updateUI: function() {
        const data = JSON.parse(localStorage.getItem('pegasus_parking_loc')) || null;
        const statusEl = document.getElementById('parkingStatus');
        const timeEl = document.getElementById('parkingTime');
        const inputEl = document.getElementById('parkingInput');

        if (data) {
            if (statusEl) statusEl.textContent = `PARKING: ${data.loc}`;
            if (timeEl) timeEl.textContent = `Παρκαρίστηκε: ${data.ts}`;
            if (inputEl) inputEl.value = data.loc;
        } else {
            if (statusEl) statusEl.textContent = "PARKING: --";
            if (timeEl) timeEl.textContent = "Παρκαρίστηκε: --";
        }
    }
};

// Αρχική φόρτωση
document.addEventListener('DOMContentLoaded', () => window.PegasusParking.updateUI());
