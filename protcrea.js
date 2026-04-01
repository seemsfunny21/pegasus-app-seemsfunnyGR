/* ==========================================================================
   PEGASUS OS - SUPPLEMENT INVENTORY GUARD (PC MODULE v1.1)
   Protocol: Strict Consumption Logic & Auto-Sync Alignment
   ========================================================================== */

window.PegasusInventoryPC = {
    // Ρυθμίσεις αποθέματος
    defaults: { prot: 2500, crea: 1000 },

    // 1. Έλεγχος Διατροφής για αυτόματη αφαίρεση (Βελτιωμένο processEntry)
    processEntry: function(name) {
        const d = new Date();
        const dateStr = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
        const logKey = "food_log_" + dateStr;
        let log = JSON.parse(localStorage.getItem(logKey)) || [];
        
        // Φέρνουμε το τρέχον απόθεμα
        let stock = JSON.parse(localStorage.getItem('pegasus_supp_inventory')) || {...this.defaults};
        let changed = false;

        // Σημαντικό: Ελέγχουμε ΜΟΝΟ την τελευταία εγγραφή που μόλις προστέθηκε
        // (Το addFoodItem κάνει unshift, άρα η νέα εγγραφή είναι η log[0])
        const item = log[0]; 
        if (!item) return;

        const cleanName = item.name.toLowerCase();

        // Έλεγχος για Πρωτεΐνη
        if (cleanName.includes("πρωτεΐνη") && !item.inventoryProcessed) {
            stock.prot = Math.max(0, stock.prot - 30);
            item.inventoryProcessed = true; 
            changed = true;
            console.log("🥤 INVENTORY GUARD: Whey consumed (-30g).");
        }
        
        // Έλεγχος για Κρεατίνη
        if (cleanName.includes("κρεατίνη") && !item.inventoryProcessed) {
            stock.crea = Math.max(0, stock.crea - 5);
            item.inventoryProcessed = true;
            changed = true;
            console.log("💊 INVENTORY GUARD: Creatine consumed (-5g).");
        }

        if (changed) {
            localStorage.setItem('pegasus_supp_inventory', JSON.stringify(stock));
            localStorage.setItem(logKey, JSON.stringify(log));
            this.updateUI();
            if (window.PegasusCloud) window.PegasusCloud.push();
        }
    },

    // 2. Ενημέρωση των Progress Bars στον υπολογιστή
    updateUI: function() {
        const stock = JSON.parse(localStorage.getItem('pegasus_supp_inventory')) || {...this.defaults};
        
        const protBar = document.getElementById('protBarPC'); 
        const creaBar = document.getElementById('creaBarPC');

        if (protBar) protBar.style.width = (stock.prot / 2500 * 100) + '%';
        if (creaBar) creaBar.style.width = (stock.crea / 1000 * 100) + '%';
        
        console.log(`📊 INVENTORY STATUS: Prot: ${stock.prot}g | Crea: ${stock.crea}g`);
    }
};

// Αυτόματη ενημέρωση κατά τη φόρτωση
window.addEventListener('load', () => window.PegasusInventoryPC.updateUI());
