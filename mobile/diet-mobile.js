/* ==========================================================================
   PEGASUS OS - DIET MODULE (MOBILE EDITION v13.5)
   Protocol: Live Search, Dynamic Daily Kouki Menu & AI Advisor Integration
   ========================================================================== */

const KOUKI_MASTER = [
    { name: "Κοτόπουλο με κάρυ & λαχανικά", kcal: 580, protein: 52 },
    { name: "Κοτόπουλο με χυλοπίτες", kcal: 680, protein: 48 },
    { name: "Κοτόπουλο λεμονάτο", kcal: 550, protein: 52 },
    { name: "Χοιρινό με δαμάσκηνα", kcal: 650, protein: 42 },
    { name: "Χοιρινό πρασοσέλινο", kcal: 610, protein: 40 },
    { name: "Μοσχαράκι κοκκινιστό", kcal: 640, protein: 45 },
    { name: "Μοσχάρι γιουβέτσι", kcal: 720, protein: 46 },
    { name: "Μπιφτέκια μοσχαρίσια σχάρας", kcal: 540, protein: 44 },
    { name: "Γιουβαρλάκια αυγολέμονο", kcal: 490, protein: 30 },
    { name: "Ρεβύθια με κάρυ", kcal: 480, protein: 18 },
    { name: "Ρεβύθια λεμονάτα", kcal: 450, protein: 17 },
    { name: "Γίγαντες φούρνου", kcal: 480, protein: 19 },
    { name: "Φασολάκια πράσινα", kcal: 350, protein: 8 },
    { name: "Σουπιές με σπανάκι", kcal: 420, protein: 38 },
    { name: "Τσιπούρα ψητή", kcal: 420, protein: 45 },
    { name: "Παστίτσιο", kcal: 750, protein: 35 },
    { name: "Μουσακάς", kcal: 800, protein: 30 }
];

window.PegasusDiet = {
    // 1. Προσθήκη Γεύματος
    add: async function() {
        const nameInput = document.getElementById("fName");
        const kcalInput = document.getElementById("fKcal");
        const protInput = document.getElementById("fProt");

        const n = nameInput.value || "Γεύμα";
        const k = parseFloat(kcalInput.value) || 0;
        const p = parseFloat(protInput.value) || 0;

        // Αυτόματη κατανάλωση πρωτεΐνης από το Inventory
        if(n.toLowerCase().includes("πρωτεΐνη") && window.PegasusInventory) {
            window.PegasusInventory.consume('prot', 30);
        }
        
        // Καταγραφή στο Κουκί Agreement
        if(n.includes("(Κούκι)")) {
            let agreementLog = JSON.parse(localStorage.getItem('kouki_agreement_log') || "[]");
            agreementLog.push({ date: new Date().toLocaleDateString('el-GR'), food: n });
            localStorage.setItem('kouki_agreement_log', JSON.stringify(agreementLog));
            console.log("📊 KOUKI: Agreement Balance Updated.");
        }

        const dateStr = new Date().toLocaleDateString('el-GR');
        let log = this.getLog(dateStr);
        log.unshift({ name: n, kcal: k, protein: p, ts: Date.now() });
        
        localStorage.setItem("food_log_" + dateStr, JSON.stringify(log));
        
        // Reset Inputs
        nameInput.value = "";
        kcalInput.value = "";
        protInput.value = "";
        this.closeSearch();

        this.updateUI();
        if(window.PegasusCloud) await window.PegasusCloud.push();
    },

    // --- 🧠 2. PEGASUS DIET ADVISOR (MOBILE LINK) ---
    askAdvisor: function() {
        const resultContainer = document.getElementById("advisorMobileResult");
        
        if (window.PegasusDietAdvisor && typeof window.PegasusDietAdvisor.analyzeAndRecommend === "function") {
            const advice = window.PegasusDietAdvisor.analyzeAndRecommend();
            
            // Ανάκτηση Macros από το KOUKI_MASTER
            const suggestedFood = KOUKI_MASTER.find(f => f.name.includes(advice.n) || advice.n.includes(f.name));
            const kcal = suggestedFood ? suggestedFood.kcal : 0;
            const prot = suggestedFood ? suggestedFood.protein : 0;

            resultContainer.innerHTML = `
                <div style="background: rgba(243, 156, 18, 0.1); border-left: 4px solid #f39c12; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <div style="color: #f39c12; font-weight: 900; font-size: 14px; margin-bottom: 5px;">ΑΝΑΛΥΣΗ PEGASUS:</div>
                    <p style="color: #eee; font-size: 12px; margin: 0 0 10px 0; line-height: 1.4;">${advice.msg}</p>
                    <button onclick="window.PegasusDiet.quickAdd('${advice.n} (Κούκι)', ${kcal}, ${prot}); document.getElementById('advisorMobileResult').innerHTML='';" 
                            style="background: #f39c12; color: #000; border: none; padding: 10px; border-radius: 4px; width: 100%; font-weight: bold; font-size: 13px;">
                        + ΠΡΟΣΘΗΚΗ ΠΡΟΤΑΣΗΣ ΣΤΟ LOG
                    </button>
                </div>
            `;
        } else {
            resultContainer.innerHTML = `<div style="color: var(--danger); font-size: 12px; font-weight: bold; margin-bottom: 15px;">⚠️ Ο Advisor δεν είναι online.</div>`;
        }
    },

    // --- 🔍 3. SMART LIVE SEARCH ---
    handleSearch: function(term) {
        const resBox = document.getElementById("searchSuggestions");
        if(!resBox) return;

        if(!term || term.length < 2) { 
            resBox.style.display = "none"; 
            return; 
        }

        const lib = JSON.parse(localStorage.getItem("pegasus_food_library")) || [];
        const matches = lib.filter(i => i.name.toLowerCase().includes(term.toLowerCase())).slice(0, 5);

        if(matches.length > 0) {
            resBox.innerHTML = matches.map(i => `
                <div class="search-item" onclick="PegasusDiet.selectSuggested('${i.name}', ${i.kcal}, ${i.protein})">
                    <span style="color:#fff; font-weight:bold; font-size:13px;">${i.name}</span>
                    <span style="color:var(--main); font-size:11px; font-weight:900;">${i.kcal} kcal | ${i.protein}g P</span>
                </div>
            `).join('');
            resBox.style.display = "block";
        } else {
            resBox.style.display = "none";
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

    // --- 🍽️ 4. DYNAMIC DAILY KOUKI MENU ---
    renderDailyKouki: function() {
        const container = document.getElementById('koukiContainer');
        if(!container) return;

        // Ημερήσιος αλγόριθμος Seed (ίδιο μενού όλη μέρα, αλλάζει στις 00:00)
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        let random = (s) => { let x = Math.sin(s) * 10000; return x - Math.floor(x); };
        
        let dailyMenu = [...KOUKI_MASTER].sort((a, b) => 0.5 - random(seed + a.name.charCodeAt(0))).slice(0, 8);

        container.innerHTML = dailyMenu.map(i => `
            <div class="mini-card" onclick="window.PegasusDiet.quickAdd('${i.name} (Κούκι)', ${i.kcal}, ${i.protein})" 
                 style="display:flex; justify-content:space-between; align-items:center; cursor:pointer; margin-bottom:10px; padding:15px; background:rgba(255,255,255,0.03); border:1px solid #222; border-radius:18px;">
                <div style="text-align:left;">
                    <span style="color:var(--main); font-size:9px; font-weight:900;">+ ΚΟΥΚΙ</span>
                    <div style="font-weight:900; font-size:14px; color:#fff;">${i.name}</div>
                    <div style="color:#888; font-size:10px; margin-top:3px;">${i.protein}g Πρωτεΐνη</div>
                </div>
                <div style="font-weight:900; color:var(--main); font-size:14px;">${i.kcal} <span style="font-size:8px; color:#666;">KCAL</span></div>
            </div>
        `).join('');
    },

    // --- 📊 5. UI & LOGIC SYNC ---
    updateUI: function() {
        const dateStr = new Date().toLocaleDateString('el-GR');
        const log = this.getLog(dateStr);
        let tk = 0, tp = 0;
        
        log.forEach(item => { 
            tk += parseFloat(item.kcal || 0); 
            tp += parseFloat(item.protein || 0); 
        });

        localStorage.setItem("pegasus_today_kcal", tk.toFixed(1));
        localStorage.setItem("pegasus_today_protein", tp.toFixed(1));

        // Υπολογισμός Target (Βασικός στόχος + Αερόβια)
        const cardioKcal = parseFloat(localStorage.getItem("pegasus_cardio_kcal_" + dateStr)) || 0;
        const targetKcal = 2800 + cardioKcal;

        const kcalDisplay = document.getElementById("txtKcal");
        const protDisplay = document.getElementById("txtProt");
        const listDisplay = document.getElementById("foodHistoryList");

        if(kcalDisplay) kcalDisplay.textContent = `${Math.round(tk)} / ${Math.round(targetKcal)}`;
        if(protDisplay) protDisplay.textContent = `${Math.round(tp)} / 160g`;
        
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
        const dateStr = new Date().toLocaleDateString('el-GR');
        let log = this.getLog(dateStr);
        log.splice(idx, 1);
        localStorage.setItem("food_log_" + dateStr, JSON.stringify(log));
        this.updateUI();
        if(window.PegasusCloud) await window.PegasusCloud.push();
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
        if (typeof openView === "function") openView('diet');
    }
};
