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
    let data = null;
    const rawData = localStorage.getItem('pegasus_parking_loc');
    
    try {
        // Προσπάθεια ανάγνωσης ως JSON (για συμβατότητα με παλιά δεδομένα)
        data = JSON.parse(rawData);
    } catch (e) {
        // Αν αποτύχει (π.χ. "ααα"), το αντιμετωπίζουμε ως απλό κείμενο
        if (rawData) data = { loc: rawData, ts: "---" };
    }

    const statusEl = document.getElementById('parkingStatus');
    const inputEl = document.getElementById('parkingInput');

    if (data && data.loc) {
        if (statusEl) statusEl.textContent = `ΠΑΡΚΙΝΓΚ: ${data.loc}`;
        if (inputEl) inputEl.placeholder = `Τρέχουσα: ${data.loc}`;
    } else {
        if (statusEl) statusEl.textContent = "ΠΑΡΚΙΝΓΚ: --";
    }
    
    // Κλήση του ιστορικού που βρίσκεται στο mobile.html
    if (typeof renderParkingHistory === "function") renderParkingHistory();
}

// Αρχική φόρτωση
document.addEventListener('DOMContentLoaded', () => window.PegasusParking.updateUI());
