/* ===== PEGASUS PARKING TRACKER MODULE v2.0 ===== */
window.PegasusParking = {
    save: async function() {
        const inputEl = document.getElementById('parkingInput');
        const location = inputEl ? inputEl.value.trim() : "";
        if (!location) return;

        // 1. Αποθήκευση ως JSON Object ΑΥΣΤΗΡΑ (για να το διαβάζει το cloudSync.js)
        const parkingData = {
            loc: location,
            ts: new Date().toLocaleString('el-GR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
        };
        localStorage.setItem('pegasus_parking_loc', JSON.stringify(parkingData));

        // 2. Ενημέρωση Ιστορικού 10 Θέσεων
        let history = [];
        try {
            history = JSON.parse(localStorage.getItem('pegasus_parking_history')) || [];
        } catch(e) { history = []; }
        
        history = history.filter(item => item !== location);
        history.unshift(location);
        if (history.length > 10) history.pop();
        localStorage.setItem('pegasus_parking_history', JSON.stringify(history));

        this.updateUI();

        // 3. Force Cloud Push (Αποστολή στο Server)
        if (window.PegasusCloud && window.PegasusCloud.push) {
            if (typeof setSyncStatus === "function") setSyncStatus('ΑΠΟΣΤΟΛΗ...');
            await window.PegasusCloud.push();
            if (typeof setSyncStatus === "function") setSyncStatus('online');
        }

        if (inputEl) inputEl.value = "";
        if (typeof openView === "function") openView('home');
    },

    updateUI: function() {
        let data = null;
        try {
            data = JSON.parse(localStorage.getItem('pegasus_parking_loc'));
        } catch(e) {
            console.warn("Parking Data Reset due to invalid JSON format.");
        }

        // Ενημέρωση αρχικής οθόνης (Quick Dashboard)
        const statusEl = document.getElementById('parkingStatus');
        if (data && data.loc) {
            if (statusEl) statusEl.textContent = `ΠΑΡΚΙΝΓΚ: ${data.loc}`;
        } else {
            if (statusEl) statusEl.textContent = "ΠΑΡΚΙΝΓΚ: --";
        }

        this.renderHistory();
    },

    renderHistory: function() {
        let history = [];
        try {
            history = JSON.parse(localStorage.getItem('pegasus_parking_history')) || [];
        } catch(e) { history = []; }
        
        const container = document.getElementById('parkingHistoryList');
        if (!container) return;

        container.innerHTML = history.map(loc => `
            <div class="log-item" onclick="document.getElementById('parkingInput').value='${loc}'; window.PegasusParking.save();" style="cursor:pointer; border-color:rgba(255, 152, 0, 0.4); margin-bottom:8px;">
                <div style="font-size:13px; font-weight:800; color:#fff;">📍 ${loc}</div>
            </div>
        `).join('');
    }
};

// Αυτόματη φόρτωση
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => window.PegasusParking.updateUI(), 500);
});
