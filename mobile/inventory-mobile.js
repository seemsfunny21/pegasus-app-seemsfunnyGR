/* ==========================================================================
   📦 PEGASUS INVENTORY SYSTEM (MOBILE v2.3 QUIET STABLE)
   Protocol: Strict Null-Safe DOM Binding & Legacy Bridge Integration
   Status: FINAL STABLE | REDUCED CONSOLE SPAM | CROSS-PLATFORM COMPATIBLE
   ========================================================================== */

window.PegasusInventory = {
    _lastSnapshot: "",

    getState: function() {
        try {
            const raw = JSON.parse(localStorage.getItem('pegasus_supp_inventory'));
            return raw && typeof raw === "object"
                ? { prot: Number(raw.prot) || 0, crea: Number(raw.crea) || 0 }
                : { prot: 2500, crea: 1000 };
        } catch (e) {
            return { prot: 2500, crea: 1000 };
        }
    },

    updateUI: function(forceLog = false) {
        const s = this.getState();
        const pP = Math.min((s.prot / 2500) * 100, 100);
        const cP = Math.min((s.crea / 1000) * 100, 100);

        // --- 1. Εσωτερικό View (Σελίδα Συμπληρωμάτων) ---
        const protTxt = document.getElementById('protLevelText');
        const protBar = document.getElementById('protBar');
        const creaTxt = document.getElementById('creaLevelText');
        const creaBar = document.getElementById('creaBar');

        if (protTxt) protTxt.textContent = `${Math.round(s.prot)} / 2500g`;
        if (protBar) protBar.style.width = pP + '%';
        if (creaTxt) creaTxt.textContent = `${Math.round(s.crea)} / 1000g`;
        if (creaBar) creaBar.style.width = cP + '%';

        // --- 2. Κεντρική Οθόνη (Home Grid Tiles) ---
        const homeProtTxt = document.getElementById('homeProtTxt');
        const homeProtBar = document.getElementById('homeProtBar');
        const homeCreaTxt = document.getElementById('homeCreaTxt');
        const homeCreaBar = document.getElementById('homeCreaBar');

        if (homeProtTxt) homeProtTxt.textContent = Math.round(pP) + '%';
        if (homeProtBar) homeProtBar.style.width = pP + '%';
        if (homeCreaTxt) homeCreaTxt.textContent = Math.round(cP) + '%';
        if (homeCreaBar) homeCreaBar.style.width = cP + '%';

        // Quiet logging only when inventory actually changed
        const snapshot = `${Math.round(s.prot)}|${Math.round(s.crea)}`;
        if (forceLog || this._lastSnapshot !== snapshot) {
            console.log("📦 PEGASUS INVENTORY: UI Sync Complete.", {
                prot: Math.round(s.prot),
                crea: Math.round(s.crea)
            });
            this._lastSnapshot = snapshot;
        }
    },

    consume: function(type, amount, push = true) {
        let s = this.getState();

        if (!Object.prototype.hasOwnProperty.call(s, type)) return;
        if (isNaN(amount) || amount <= 0) return;

        s[type] = Math.max(0, s[type] - amount);
        localStorage.setItem('pegasus_supp_inventory', JSON.stringify(s));

        this.updateUI(true);

        if (push && window.PegasusCloud) {
            window.PegasusCloud.push(true);
        }
    },

    refill: function(type, amount) {
        let s = this.getState();

        if (!Object.prototype.hasOwnProperty.call(s, type)) return;
        if (isNaN(amount) || amount <= 0) return;

        s[type] = amount;
        localStorage.setItem('pegasus_supp_inventory', JSON.stringify(s));

        this.updateUI(true);

        if (window.PegasusCloud) {
            window.PegasusCloud.push(true);
        }
    }
};

/**
 * 🛠️ LEGACY BRIDGE (PC COMPATIBILITY PATCH)
 * Επιτρέπει στο food.js και cloudSync.js να καλούν τη συνάρτηση
 * στην παλιά της μορφή χωρίς να καταρρέει το σύστημα.
 */
window.consumeSupp = function(type, amount, push = true) {
    if (window.PegasusInventory) {
        window.PegasusInventory.consume(type, amount, push);
    }
};
