/* ==========================================================================
   PEGASUS OS - DIET MODULE (MOBILE EDITION v1.0)
   Protocol: Strict Kcal/Protein Tracking & Inventory Link
   ========================================================================== */

window.PegasusDiet = {
    // 1. Προσθήκη Γεύματος
    add: async function() {
        const nameInput = document.getElementById("fName");
        const kcalInput = document.getElementById("fKcal");
        const protInput = document.getElementById("fProt");

        const n = nameInput.value || "Γεύμα";
        const k = parseFloat(kcalInput.value) || 0;
        const p = parseFloat(protInput.value) || 0;

        // Αυτόματη κατανάλωση πρωτεΐνης αν το όνομα περιέχει τη λέξη
        if(n.toLowerCase().includes("πρωτεΐνη") && window.PegasusInventory) {
            window.PegasusInventory.consume('prot', 30);
        }

        const d = new Date();
        const dateStr = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
        
        let log = this.getLog(dateStr);
        log.unshift({ name: n, kcal: k, protein: p, ts: Date.now() });
        
        localStorage.setItem("food_log_" + dateStr, JSON.stringify(log));
        
        // Reset Inputs
        nameInput.value = "";
        kcalInput.value = "";
        protInput.value = "";

        this.updateUI();
        if(window.PegasusCloud) await PegasusCloud.push();
    },

    // 2. Διαγραφή Γεύματος
    delete: async function(idx) {
        const d = new Date();
        const dateStr = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
        let log = this.getLog(dateStr);
        log.splice(idx, 1);
        localStorage.setItem("food_log_" + dateStr, JSON.stringify(log));
        
        this.updateUI();
        if(window.PegasusCloud) await PegasusCloud.push();
    },

    // 3. Λήψη Log
    getLog: function(dateStr) {
        try {
            const data = localStorage.getItem("food_log_" + dateStr);
            return data ? JSON.parse(data) : [];
        } catch (e) { return []; }
    },

    // 4. Ενημέρωση UI
    updateUI: function() {
        const d = new Date();
        const dateStr = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
        const log = this.getLog(dateStr);
        
        let tk = 0, tp = 0;
        log.forEach(item => { 
            tk += parseFloat(item.kcal || 0); 
            tp += parseFloat(item.protein || 0); 
        });

        // Ενημέρωση LocalStorage για τα totals
        localStorage.setItem("pegasus_today_kcal", tk.toFixed(1));
        localStorage.setItem("pegasus_today_protein", tp.toFixed(1));

        // Mapping στο HTML
        const kcalDisplay = document.getElementById("txtKcal");
        const protDisplay = document.getElementById("txtProt");
        const listDisplay = document.getElementById("foodHistoryList");

        if(kcalDisplay) kcalDisplay.textContent = `${Math.round(tk)}/2800`;
        if(protDisplay) protDisplay.textContent = `${Math.round(tp)}/160g`;
        
        if(listDisplay) {
            listDisplay.innerHTML = log.map((i, idx) => `
                <div class="log-item">
                    <button class="btn-del" onclick="PegasusDiet.delete(${idx})">✕</button>
                    <strong>${i.name}</strong><br>
                    <small>${i.kcal} kcal | ${i.protein}g P</small>
                </div>
            `).join('');
        }
    },

    // 5. Βιβλιοθήκη
    renderLibrary: function() {
        const lib = JSON.parse(localStorage.getItem("pegasus_food_library")) || [];
        const term = document.getElementById('libSearch')?.value.toLowerCase() || "";
        const container = document.getElementById('libraryContainer');
        
        if(!container) return;

        container.innerHTML = lib.filter(i => i.name.toLowerCase().includes(term)).map(i => `
            <div class="mini-card" onclick="PegasusDiet.quickAdd('${i.name}', ${i.kcal}, ${i.protein})">
                <span class="mini-label">+ ΠΡΟΣΘΗΚΗ</span>
                <div class="mini-val">${i.name}</div>
            </div>
        `).join('');
    },

    quickAdd: function(n, k, p) {
        document.getElementById("fName").value = n;
        document.getElementById("fKcal").value = k;
        document.getElementById("fProt").value = p;
        this.add();
        openView('diet');
    }
};
