/* ==========================================================================
   📦 PEGASUS INVENTORY SYSTEM (MOBILE v2.1)
   Protocol: Strict Null-Safe DOM Binding & Manifest Alignment
   Status: STABLE | RACE-CONDITION PROOF
   ========================================================================== */

window.PegasusInventory = {
    updateUI: function() {
        const s = JSON.parse(localStorage.getItem('pegasus_supp_inventory')) || { prot: 2500, crea: 1000 };
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

        console.log("📦 PEGASUS INVENTORY: UI Sync Complete.");
    },

    consume: function(type, amount, push = true) {
        let s = JSON.parse(localStorage.getItem('pegasus_supp_inventory')) || { prot: 2500, crea: 1000 };
        s[type] = Math.max(0, s[type] - amount);
        localStorage.setItem('pegasus_supp_inventory', JSON.stringify(s));
        
        this.updateUI();
        
        if (push && window.PegasusCloud) {
            window.PegasusCloud.push(true);
        }
    },

    refill: function(type, amount) {
        let s = JSON.parse(localStorage.getItem('pegasus_supp_inventory')) || { prot: 2500, crea: 1000 };
        s[type] = amount;
        localStorage.setItem('pegasus_supp_inventory', JSON.stringify(s));
        
        this.updateUI();
        
        if (window.PegasusCloud) {
            window.PegasusCloud.push(true);
        }
    }
};
