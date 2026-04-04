/* ==========================================================================
   PEGASUS OS - DIET MODULE (MOBILE EDITION v13.8)
   Protocol: Zero-Click Daily Routine Auto-Injection
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
    // --- 🤖 ZERO-CLICK DAILY ROUTINE ---
    checkDailyRoutine: function() {
        const dateStr = new Date().toLocaleDateString('el-GR');
        const flagKey = "pegasus_routine_injected_" + dateStr;

        // Αν δεν έχει γίνει inject σήμερα...
        if (!localStorage.getItem(flagKey)) {
            let log = this.getLog(dateStr);

            // Προσθήκη Baseline Γευμάτων (Με βάση τυπικά Macros)
            log.push({ name: "Γιαούρτι 2% + Whey (Ρουτίνα)", kcal: 250, protein: 35, ts: Date.now() - 1000 });
            log.push({ name: "3 Αυγά (Ρουτίνα)", kcal: 210, protein: 18, ts: Date.now() - 2000 });

            localStorage.setItem("food_log_" + dateStr, JSON.stringify(log));
            
            // Τοποθέτηση "Σημαίας" (Flag) για να μην ξαναμπούν αν κάνεις refresh
            localStorage.setItem(flagKey, "true");

            // Αφαίρεση 1 Scoop Whey από το Inventory του PEGASUS
            if (window.PegasusInventory && typeof window.PegasusInventory.consume === 'function') {
                window.PegasusInventory.consume('prot', 30, false);
            }
            console.log("🌅 DIET: Daily Routine auto-injected successfully.");
        }
    },

    // --- 1. Έξυπνη Προσθήκη Γεύματος ---
    add: async function(n, k, p) {
        const name = n || document.getElementById("fName")?.value;
        const kcal = k || 0;
        const prot = p || 0;

        if(!name || name.trim() === "") return;

        if(name.toLowerCase().includes("whey") && window.PegasusInventory) {
            window.PegasusInventory.consume('prot', 30);
        }
        
        if(name.includes("(Κούκι)")) {
            let agreementLog = JSON.parse(localStorage.getItem('kouki_agreement_log') || "[]");
            agreementLog.push({ date: new Date().toLocaleDateString('el-GR'), food: name });
            localStorage.setItem('kouki_agreement_log', JSON.stringify(agreementLog));
        }

        const dateStr = new Date().toLocaleDateString('el-GR');
        let log = this.getLog(dateStr);
        log.unshift({ name: name, kcal: kcal, protein: prot, ts: Date.now() });
        
        localStorage.setItem("food_log_" + dateStr, JSON.stringify(log));
        
        const fNameEl = document.getElementById("fName");
        if(fNameEl) fNameEl.value = "";
        this.closeSearch();

        this.updateUI();
        if(window.PegasusCloud) await window.PegasusCloud.push();
    },

    // --- 🧠 2. PEGASUS DIET ADVISOR ---
    askAdvisor: function() {
        const resultContainer = document.getElementById("advisorMobileResult");
        
        if (window.PegasusDietAdvisor && typeof window.PegasusDietAdvisor.analyzeAndRecommend === "function") {
            const advice = window.PegasusDietAdvisor.analyzeAndRecommend();
            
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

        if(!term || term.length < 2) { resBox.style.display = "none"; return; }

        const lib = JSON.parse(localStorage.getItem("pegasus_food_library")) || [];
        const matches = lib.filter(i => i.name.toLowerCase().includes(term.toLowerCase())).slice(0, 5);

        if(matches.length > 0) {
            resBox.innerHTML = matches.map(i => `
                <div class="search-item" onclick="window.PegasusDiet.selectSuggested('${i.name}', ${i.kcal}, ${i.protein})">
                    <span style="color:#fff; font-weight:bold; font-size:13px;">${i.name}</span>
                    <span style="color:var(--main); font-size:11px; font-weight:900;">${i.kcal} kcal | ${i.protein}g P</span>
                </div>
            `).join('');
            resBox.style.display = "block";
        } else {
            resBox.style.display = "none";
        }
    },

    selectSuggested: function(n, k, p) { this.add(n, k, p); },
    closeSearch: function() {
        const res = document.getElementById("searchSuggestions");
        if(res) res.style.display = "none";
    },

    // --- 🍽️ 4. DYNAMIC DAILY KOUKI MENU ---
    renderDailyKouki: function() {
        const container = document.getElementById('libraryContainer') || document.getElementById('koukiContainer');
        if(!container) return;

        const greekDays = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
        const todayName = greekDays[new Date().getDay()];

        let dailyMenu = [];
        if (typeof window.weeklyKoukiMenu !== 'undefined' && window.weeklyKoukiMenu[todayName]) {
            dailyMenu = window.weeklyKoukiMenu[todayName];
        } else {
            try {
                const storedWeeklyMenu = JSON.parse(localStorage.getItem('pegasus_weekly_kouki_menu') || "{}");
                dailyMenu = storedWeeklyMenu[todayName] ? storedWeeklyMenu[todayName] : KOUKI_MASTER.slice(0, 8);
            } catch(e) { dailyMenu = KOUKI_MASTER.slice(0, 8); }
        }

        container.innerHTML = `
            <div style="display:flex; justify-content:center; align-items:center; margin-bottom:20px;">
                <span style="color:#ff4444; font-size:14px; margin-right:5px;">📍</span>
                <span style="color:var(--main); font-weight:900; font-size:14px; text-transform:uppercase;">${todayName} (ΚΟΥΚΙ)</span>
            </div>
        ` + dailyMenu.map(i => {
            const k = i.kcal || i.calories || 0;
            const p = i.protein || 0;
            return `
            <div class="mini-card" onclick="window.PegasusDiet.quickAdd('${i.name} (Κούκι)', ${k}, ${p})" 
                 style="display:flex; justify-content:space-between; align-items:center; cursor:pointer; margin-bottom:12px; padding:18px; background:rgba(255,255,255,0.03); border:1px solid #222; border-radius:18px;">
                <div style="text-align:left;">
                    <span style="color:var(--main); font-size:9px; font-weight:900;">+ ΠΡΟΣΘΗΚΗ ΣΤΟ LOG</span>
                    <div style="font-weight:900; font-size:14px; color:#fff; margin-top:2px;">${i.name}</div>
                    <div style="color:#ff9800; font-size:10px; margin-top:5px; font-weight:bold;">🍗 ${p}G PROTEIN</div>
                </div>
                <div style="font-weight:900; color:#eee; font-size:16px;">
                    🔥 ${k} <span style="font-size:8px; color:#666; display:block; text-align:right;">KCAL</span>
                </div>
            </div>
        `}).join('');
    },

    // --- 📊 5. UI & LOGIC SYNC ---
    updateUI: function() {
        // Τρέχει την αυτοματοποίηση της ημέρας ΠΡΙΝ ζωγραφίσει το UI
        this.checkDailyRoutine();

        const dateStr = new Date().toLocaleDateString('el-GR');
        const log = this.getLog(dateStr);
        let tk = 0, tp = 0;
        
        log.forEach(item => { 
            tk += parseFloat(item.kcal || 0); 
            tp += parseFloat(item.protein || 0); 
        });

        localStorage.setItem("pegasus_today_kcal", tk.toFixed(1));
        localStorage.setItem("pegasus_today_protein", tp.toFixed(1));

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
        this.add(n, k, p);
        if (typeof openView === "function") openView('diet');
    }
};
