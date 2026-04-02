/* ==========================================================================
   PEGASUS OS - SUPPLEMENT INVENTORY GUARD (PC MODULE v1.2)
   Protocol: Hybrid Data Mapping & Real-Time Label Rendering
   Status: FINAL STABLE | FIX: LABEL SYNC & KEY REDUNDANCY
   ========================================================================== */

window.PegasusInventoryPC = {
    defaults: { prot: 2500, crea: 1000 },

    // 🔄 Ανάκτηση Αποθέματος με Hybrid Check (Object ή Individual Keys)
    getStock: function() {
        let stock = JSON.parse(localStorage.getItem('pegasus_supp_inventory'));
        
        // Αν δεν υπάρχει το Object, τσέκαρε τα μεμονωμένα κλειδιά που μπήκαν χειροκίνητα
        if (!stock) {
            const p = parseFloat(localStorage.getItem('pegasus_prot_stock')) || this.defaults.prot;
            const c = parseFloat(localStorage.getItem('pegasus_crea_stock')) || this.defaults.crea;
            stock = { prot: p, crea: c };
            // Σώστο πίσω ως Object για το μέλλον
            localStorage.setItem('pegasus_supp_inventory', JSON.stringify(stock));
        }
        return stock;
    },

    processEntry: function(name) {
        const d = new Date();
        const dateStr = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
        const logKey = "food_log_" + dateStr;
        let log = JSON.parse(localStorage.getItem(logKey)) || [];
        
        let stock = this.getStock();
        let changed = false;

        const item = log[0]; 
        if (!item) return;

        const cleanName = item.name.toLowerCase();

        if (cleanName.includes("πρωτεΐνη") && !item.inventoryProcessed) {
            stock.prot = Math.max(0, stock.prot - 30);
            item.inventoryProcessed = true; 
            changed = true;
            console.log("🥤 INVENTORY GUARD: Whey consumed (-30g).");
        }
        
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
            if (window.PegasusCloud) window.PegasusCloud.push(true);
        }
    },

    updateUI: function() {
        const stock = this.getStock();
        
        const protBar = document.getElementById('protBarPC'); 
        const creaBar = document.getElementById('creaBarPC');
        const protVal = document.getElementById('pcProtValue');
        const creaVal = document.getElementById('pcCreaValue');

        // Ενημέρωση Bars
        if (protBar) protBar.style.width = (stock.prot / 2500 * 100) + '%';
        if (creaBar) creaBar.style.width = (stock.crea / 1000 * 100) + '%';

        // 🟢 Ενημέρωση Αριθμητικών Ενδείξεων (Αντικατάσταση των --)
        if (protVal) protVal.textContent = `${Math.round(stock.prot)} / 2500g`;
        if (creaVal) creaVal.textContent = `${Math.round(stock.crea)} / 1000g`;
        
        console.log(`📊 INVENTORY STATUS: Prot: ${stock.prot}g | Crea: ${stock.crea}g`);
    }
};

window.addEventListener('load', () => {
    if (window.PegasusInventoryPC) window.PegasusInventoryPC.updateUI();
});
