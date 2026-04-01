/* ==========================================================================
   PEGASUS OS - SUPPLEMENT INVENTORY GUARD (v1.0)
   Protocol: Strict Consumption Logic & Auto-Sync
   ========================================================================== */

window.PegasusInventory = {
    // Ρυθμίσεις αποθέματος
    defaults: { prot: 2500, crea: 1000 },

    // 1. Έλεγχος Διατροφής για αυτόματη αφαίρεση
    checkDietAndConsume: function() {
        const d = new Date();
        const dateStr = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
        const log = JSON.parse(localStorage.getItem("food_log_" + dateStr)) || [];
        
        // Φέρνουμε το τρέχον απόθεμα
        let stock = JSON.parse(localStorage.getItem('pegasus_supp_inventory')) || {...this.defaults};
        let changed = false;

        log.forEach(item => {
            // Αν το γεύμα περιέχει "πρωτεΐνη" και δεν έχει ήδη υπολογιστεί (flag)
            if (item.name.toLowerCase().includes("πρωτεΐνη") && !item.inventoryProcessed) {
                stock.prot = Math.max(0, stock.prot - 30);
                item.inventoryProcessed = true; // Σημαδεύουμε το γεύμα ως "επεξεργασμένο"
                changed = true;
                console.log("🥤 INVENTORY: Whey consumed (-30g).");
            }
            // Αν το γεύμα περιέχει "κρεατίνη"
            if (item.name.toLowerCase().includes("κρεατίνη") && !item.inventoryProcessed) {
                stock.crea = Math.max(0, stock.crea - 5);
                item.inventoryProcessed = true;
                changed = true;
                console.log("💊 INVENTORY: Creatine consumed (-5g).");
            }
        });

        if (changed) {
            localStorage.setItem('pegasus_supp_inventory', JSON.stringify(stock));
            localStorage.setItem("food_log_" + dateStr, JSON.stringify(log));
            this.updateUI();
            if (window.PegasusCloud) window.PegasusCloud.push();
        }
    },

    // 2. Ενημέρωση των Progress Bars στον υπολογιστή
    updateUI: function() {
        const stock = JSON.parse(localStorage.getItem('pegasus_supp_inventory')) || {...this.defaults};
        
        // Αν υπάρχουν στοιχεία UI στην οθόνη του PC, τα ενημερώνουμε
        const protBar = document.getElementById('protBarPC'); // Χρειάζεται προσθήκη στο HTML
        const creaBar = document.getElementById('creaBarPC');

        if (protBar) protBar.style.width = (stock.prot / 2500 * 100) + '%';
        if (creaBar) creaBar.style.width = (stock.crea / 1000 * 100) + '%';
        
        console.log(`📊 INVENTORY STATUS: Prot: ${stock.prot}g | Crea: ${stock.crea}g`);
    }
};

// Αυτόματη εκτέλεση κάθε φορά που φορτώνει η σελίδα ή αλλάζει η διατροφή
window.addEventListener('load', () => window.PegasusInventory.updateUI());
