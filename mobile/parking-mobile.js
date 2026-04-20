/* ===== PEGASUS PARKING TRACKER MODULE v2.1 (Anti-Crash Version) ===== */
window.PegasusParking = {
    selectHistory: function(idx) {
        let history = [];
        try { history = JSON.parse(localStorage.getItem('pegasus_parking_history')) || []; } catch (e) { history = []; }
        const chosen = history[idx];
        const input = document.getElementById('parkingInput');
        if (!chosen || !input) return;
        input.value = chosen;
        this.save();
    },

    save: async function() {
        const inputEl = document.getElementById('parkingInput');
        const location = inputEl ? inputEl.value.trim() : "";
        if (!location) return;

        // 1. Αποθήκευση ως JSON Object (ΑΥΣΤΗΡΑ για συμβατότητα με cloudSync.js)
        const parkingData = {
            loc: location,
            ts: new Date().toLocaleString('el-GR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
        };
        localStorage.setItem('pegasus_parking_loc', JSON.stringify(parkingData));

        // 2. Ενημέρωση Ιστορικού (10 Θέσεις)
        let history = [];
        try {
            history = JSON.parse(localStorage.getItem('pegasus_parking_history')) || [];
        } catch(e) { history = []; }
        
        history = history.filter(item => item !== location);
        history.unshift(location);
        if (history.length > 10) history.pop();
        localStorage.setItem('pegasus_parking_history', JSON.stringify(history));

        this.updateUI();

        // 3. Force Cloud Push
        if (window.PegasusCloud && window.PegasusCloud.push) {
            if (typeof setSyncStatus === "function") setSyncStatus('ΑΠΟΣΤΟΛΗ...');
            await window.PegasusCloud.push();
            if (typeof setSyncStatus === "function") setSyncStatus('online');
        }

        if (inputEl) inputEl.value = "";
        if (typeof openView === "function") openView('home');
    },

    updateUI: function() {
        let locToDisplay = "--";
        const rawData = localStorage.getItem('pegasus_parking_loc');

        // -------------------------------------------------------------
        // ROBUST PARSING LOGIC (Εξαλείφει το [object Object] και τα σφάλματα)
        // -------------------------------------------------------------
        if (rawData) {
            if (rawData === "[object Object]") {
                // Περίπτωση 1: Η μνήμη έχει κολλήσει στο [object Object].
                // Κάνουμε reset για να μην δείχνει χαλασμένο UI.
                console.warn("Parking UI: Detected corrupted [object Object]. Resetting.");
                localStorage.removeItem('pegasus_parking_loc');
            } else {
                try {
                    // Περίπτωση 2: Είναι σωστό JSON (όπως το περιμένει το Cloud)
                    const parsed = JSON.parse(rawData);
                    if (parsed && typeof parsed === 'object' && parsed.loc) {
                        locToDisplay = parsed.loc;
                    } else if (typeof parsed === 'string') {
                        // Αν το JSON.parse επιστρέψει string (π.χ. γιατί ήταν αποθηκευμένο σαν "Γιάννενα")
                        locToDisplay = parsed;
                    }
                } catch(e) {
                    // Περίπτωση 3: Είναι απλό κείμενο (π.χ. "Γιάννενα") χωρίς εισαγωγικά JSON
                    locToDisplay = rawData;
                }
            }
        }

        // Ενημέρωση του UI (Αρχική Οθόνη)
        const statusEl = document.getElementById('parkingStatus');
        if (statusEl) {
            statusEl.textContent = `ΠΑΡΚΙΝΓΚ: ${locToDisplay}`;
        }

        // Ενημέρωση Ιστορικού
        this.renderHistory();
    },

    renderHistory: function() {
        let history = [];
        try {
            history = JSON.parse(localStorage.getItem('pegasus_parking_history')) || [];
        } catch(e) { history = []; }
        
        const container = document.getElementById('parkingHistoryList');
        if (!container) return;

        const esc = window.PegasusMobileSafe?.escapeHtml || (v => String(v ?? ''));
        container.innerHTML = history.map((loc, idx) => `
            <div class="log-item parking-history-item" data-index="${idx}" style="cursor:pointer; border-color:rgba(255, 152, 0, 0.4); margin-bottom:8px;">
                <div style="font-size:13px; font-weight:800; color:#fff;">📍 ${esc(loc)}</div>
            </div>
        `).join('');
        container.querySelectorAll('.parking-history-item').forEach(el => {
            el.addEventListener('click', () => window.PegasusParking.selectHistory(Number(el.dataset.index)));
        });
    }
};

// Αυτόματη φόρτωση
/* === PEGASUS SYNC ALIGNMENT === */

// 1. Listen για το σήμα από το Cloud (cloudSync.js)
window.addEventListener('pegasus_sync_complete', () => {
    console.log("📍 Parking: Cloud Sync Complete. Refreshing UI...");
    window.PegasusParking.updateUI();
});

// 2. Fallback για το άνοιγμα της εφαρμογής
document.addEventListener('DOMContentLoaded', () => {
    // Πρώτο update με ό,τι υπάρχει ήδη τοπικά
    window.PegasusParking.updateUI();
    
    // Δεύτερο update στα 2 δευτερόλεπτα (δικλείδα ασφαλείας αν το cloud αργήσει)
    setTimeout(() => window.PegasusParking.updateUI(), 2000);
});
