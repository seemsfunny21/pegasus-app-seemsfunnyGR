/* ==========================================================================
   PEGASUS OS - DIET MODULE (MOBILE EDITION v13.3)
   Protocol: Live Search, Kouki Menu Sync & Automated Logic
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
        
        // --- 🟢 ΠΡΟΣΘΗΚΗ: LOGIC ΓΙΑ ΤΟ ΚΟΥΚΙ ---
        // Αν το φαγητό περιέχει "(Κούκι)", ενημερώνουμε το Agreement Balance
        if(n.includes("(Κούκι)")) {
            let agreementLog = JSON.parse(localStorage.getItem('kouki_agreement_log') || "[]");
            agreementLog.push({ date: new Date().toLocaleDateString('el-GR'), food: n });
            localStorage.setItem('kouki_agreement_log', JSON.stringify(agreementLog));
            console.log("📊 KOUKI: Agreement Balance Updated.");
        }

        const d = new Date();
        const dateStr = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
        
        let log = this.getLog(dateStr);
        log.unshift({ name: n, kcal: k, protein: p, ts: Date.now() });
        
        localStorage.setItem("food_log_" + dateStr, JSON.stringify(log));
        
        // Reset & Close Search
        nameInput.value = "";
        kcalInput.value = "";
        protInput.value = "";
        this.closeSearch();

        this.updateUI();
        if(window.PegasusCloud) await PegasusCloud.push();
    },

    // 2. Live Search & Autocomplete (Photo 2)
    // Καθώς γράφεις "αυγ", ψάχνει στη βιβλιοθήκη και εμφανίζει τα αποτελέσματα
    handleSearch: function(term) {
        const resultsContainer = document.getElementById("searchSuggestions");
        if(!resultsContainer) return;
        
        if(!term || term.length < 2) {
            resultsContainer.style.display = "none";
            return;
        }

        // Συνδυασμός Βιβλιοθήκης και Μενού Κούκι για την αναζήτηση
        const lib = JSON.parse(localStorage.getItem("pegasus_food_library")) || [];
        const kouki = (typeof KOUKI_MENU !== 'undefined') ? KOUKI_MENU : [];
        const allFoods = [...lib, ...kouki.map(i => ({...i, name: i.name + " (Κούκι)"}))];

        const matches = allFoods.filter(i => i.name.toLowerCase().includes(term.toLowerCase())).slice(0, 5);

        if(matches.length > 0) {
            resultsContainer.innerHTML = matches.map(i => `
                <div class="search-item" onclick="PegasusDiet.selectSuggested('${i.name}', ${i.kcal}, ${i.protein})">
                    <span style="color:var(--main); font-weight:900;">${i.name}</span>
                    <span style="color:#666; font-size:10px;"> (${i.kcal} kcal | ${i.protein}g P)</span>
                </div>
            `).join('');
            resultsContainer.style.display = "block";
        } else {
            resultsContainer.style.display = "none";
        }
    },

    selectSuggested: function(n, k, p) {
        document.getElementById("fName").value = n;
        document.getElementById("fKcal").value = k;
        document.getElementById("fProt").value = p;
        this.closeSearch();
    },

    closeSearch: function() {
        const res = document.getElementById("searchSuggestions");
        if(res) res.style.display = "none";
    },

    // 3. Kouki Daily Menu Sync (Photo 3)
    // Αντικαθιστά τη βιβλιοθήκη με τα φαγητά της ημέρας
    renderLibrary: function() {
        const container = document.getElementById('libraryContainer');
        if(!container) return;

        // Αν υπάρχει το KOUKI_MENU (από το extensions.js στον υπολογιστή, πρέπει να το έχεις και εδώ)
        const menu = (typeof KOUKI_MENU !== 'undefined') ? KOUKI_MENU : [];
        
        container.innerHTML = menu.map(i => `
            <div class="tile" style="margin-bottom:10px; flex-direction:row; justify-content:space-between; padding:15px; border-radius:18px;" 
                 onclick="PegasusDiet.quickAdd('${i.name} (Κούκι)', ${i.kcal}, ${i.protein})">
                <div style="text-align:left;">
                    <span style="color:var(--main); font-size:9px; font-weight:900;">+ ΠΡΟΣΘΗΚΗ</span>
                    <div style="font-weight:900; font-size:13px;">${i.name}</div>
                </div>
                <div style="font-weight:900; color:#555; font-size:11px;">${i.kcal} kcal</div>
            </div>
        `).join('');
    },

    // 4. Ενημέρωση UI (Διατηρείται η δομή για Photo 2 - Ιστορικό)
    updateUI: function() {
        const d = new Date();
        const dateStr = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
        const log = this.getLog(dateStr);
        
        let tk = 0, tp = 0;
        log.forEach(item => { 
            tk += parseFloat(item.kcal || 0); 
            tp += parseFloat(item.protein || 0); 
        });

        localStorage.setItem("pegasus_today_kcal", tk.toFixed(1));
        localStorage.setItem("pegasus_today_protein", tp.toFixed(1));

        const kcalDisplay = document.getElementById("txtKcal");
        const protDisplay = document.getElementById("txtProt");
        const listDisplay = document.getElementById("foodHistoryList");

        if(kcalDisplay) kcalDisplay.textContent = `${Math.round(tk)}/2800`;
        if(protDisplay) protDisplay.textContent = `${Math.round(tp)}/160g`;
        
        if(listDisplay) {
            listDisplay.innerHTML = log.map((i, idx) => `
                <div class="log-item">
                    <button class="btn-del" onclick="PegasusDiet.delete(${idx})">✕</button>
                    <div style="font-weight:900; font-size:14px; color:#fff;">${i.name}</div>
                    <div style="color:var(--main); font-size:11px; font-weight:800; margin-top:4px;">${i.kcal} kcal | ${i.protein}g P</div>
                </div>
            `).join('');
        }
    },

    delete: async function(idx) {
        const d = new Date();
        const dateStr = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
        let log = this.getLog(dateStr);
        log.splice(idx, 1);
        localStorage.setItem("food_log_" + dateStr, JSON.stringify(log));
        this.updateUI();
        if(window.PegasusCloud) await PegasusCloud.push();
    },

    getLog: function(dateStr) {
        try {
            const data = localStorage.getItem("food_log_" + dateStr);
            return data ? JSON.parse(data) : [];
        } catch (e) { return []; }
    },

    quickAdd: function(n, k, p) {
        document.getElementById("fName").value = n;
        document.getElementById("fKcal").value = k;
        document.getElementById("fProt").value = p;
        this.add();
        openView('diet');
    }
};
