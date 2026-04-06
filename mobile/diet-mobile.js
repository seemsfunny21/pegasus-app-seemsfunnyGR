/* ==========================================================================
   PEGASUS OS - DIET MODULE (MOBILE EDITION v13.9 SAFE)
   Protocol: Anti-Loop Routine Injection & Multi-Choice Advisor Sync
   Status: STABLE | ZERO-BUG RE-VERIFIED
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
    // --- 🤖 SAFE AUTO-INJECTION (v13.9) ---
    checkDailyRoutine: function() {
        const dateStr = new Date().toLocaleDateString('el-GR');
        const flagKey = "pegasus_routine_injected_" + dateStr;

        // ΦΡΟΥΡΟΣ 1: Αν έχει γίνει ήδη, σταμάτα αμέσως.
        if (localStorage.getItem(flagKey) === "true") return false;

        console.log("🚀 DIET: Injecting daily baseline...");
        
        // ΦΡΟΥΡΟΣ 2: Θέτουμε τη σημαία ΠΡΙΝ την επεξεργασία για να μπλοκάρουμε ταυτόχρονα calls
        localStorage.setItem(flagKey, "true");

        let log = this.getLog(dateStr);
        
        // Έλεγχος αν υπάρχουν ήδη (διπλή ασφάλεια)
        const hasRoutine = log.some(i => i.name.includes("(Ρουτίνα)"));
        
        if (!hasRoutine) {
            // Προσθήκη Macros χωρίς αφαίρεση από Inventory (Protocol Check)
            log.push({ name: "Γιαούρτι 2% + Whey (Ρουτίνα)", kcal: 250, protein: 35, ts: Date.now() - 1000 });
            log.push({ name: "3 Αυγά (Ρουτίνα)", kcal: 210, protein: 18, ts: Date.now() - 2000 });

            localStorage.setItem("food_log_" + dateStr, JSON.stringify(log));
            return true; // Επιστρέφει true αν έγινε όντως αλλαγή
        }
        return false;
    },

    add: async function(n, k, p) {
        const name = n || document.getElementById("fName")?.value;
        const kcal = k || 0;
        const prot = p || 0;

        if(!name || name.trim() === "") return;

        // Χειροκίνητη κατανάλωση Whey (εδώ παραμένει ενεργό το Inventory)
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
        
        if(document.getElementById("fName")) document.getElementById("fName").value = "";
        this.closeSearch();

        this.updateUI();
        if(window.PegasusCloud) await window.PegasusCloud.push();
    },

    askAdvisor: function() {
        if (!window.PegasusDietAdvisor) return alert("Advisor Offline");
        
        const advice = window.PegasusDietAdvisor.analyzeAndRecommend();
        const container = document.getElementById("advisorMobileResult"); 
        
        if (!container) return;

        let html = `
            <div style="background:#111; border:1px solid #f39c12; padding:15px; border-radius:12px; margin:10px 0;">
                <div style="color:#f39c12; font-weight:900; font-size:13px; margin-bottom:10px;">🧠 PEGASUS LOGIC</div>
                <div style="color:#eee; font-size:14px; margin-bottom:15px; line-height:1.4;">${advice.msg}</div>
                <div style="display:flex; flex-direction:column; gap:10px;">
        `;

        advice.options.forEach(opt => {
            html += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:#1a1a1a; padding:10px; border-radius:8px; border:1px solid #333;">
                    <div style="text-align:left;">
                        <div style="color:#fff; font-weight:bold; font-size:14px;">${opt.n}</div>
                        <div style="color:#4CAF50; font-size:12px; font-weight:900;">${opt.p.toFixed(2)}€</div>
                    </div>
                    <button onclick="window.PegasusDiet.quickAdd('${opt.n} (Κούκι)', 500, 20); document.getElementById('advisorMobileResult').innerHTML='';" 
                            style="background:#f39c12; color:#000; border:none; padding:8px 12px; border-radius:6px; font-weight:900; font-size:11px;">
                        ΠΡΟΣΘΗΚΗ
                    </button>
                </div>
            `;
        });

        html += `</div></div>`;
        container.innerHTML = html;
    },

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
    closeSearch: function() { if(document.getElementById("searchSuggestions")) document.getElementById("searchSuggestions").style.display = "none"; },

    renderDailyKouki: function() {
        const container = document.getElementById('libraryContainer');
        if(!container) return;
        
        const targetDate = new Date();
        const greekDays = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
        const targetDayName = greekDays[targetDate.getDay()];
        
        // 🎯 LOGIC ALIGNMENT: Αντιγραφή της λογικής του υπολογιστή (food.js)
        const daysMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const targetDayKey = daysMap[targetDate.getDay()];
        
        let dailyMenu = [];
        
        // Διαβάζουμε απευθείας το data.js (KOUKI_MASTER_MENU) όπως το PC
        if (typeof KOUKI_MASTER_MENU !== 'undefined' && KOUKI_MASTER_MENU[targetDayKey]) {
            dailyMenu = KOUKI_MASTER_MENU[targetDayKey];
        } else {
            // Absolute Fallback αν δεν φορτώσει το data.js
            const offset = targetDate.getDay() * 2; 
            dailyMenu = KOUKI_MASTER.slice(offset, offset + 8);
        }

        container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; margin-bottom:20px;">
                <span style="color:var(--main); font-weight:900; font-size:14px; text-transform:uppercase;">${targetDayName} (ΚΟΥΚΙ)</span>
            </div>` + dailyMenu.map(item => {
                
                // Υπολογισμός Μακροθρεπτικών ΑΚΡΙΒΩΣ όπως στο PC (food.js)
                let protein = (item.t === 'kreas' || item.t === 'poulika') ? 45 : (item.t === 'ospro' ? 18 : 25);
                let kcal = (item.p >= 6.5) ? 680 : 520;
                
                // Αν το data.js έχει ήδη έτοιμα τα macros (fallback)
                protein = item.protein || protein;
                kcal = item.kcal || item.calories || kcal;
                const itemName = item.n || item.name;

                return `
            <div class="mini-card" onclick="window.PegasusDiet.quickAdd('${itemName} (Κούκι)', ${kcal}, ${protein})" 
                 style="display:flex; justify-content:space-between; align-items:center; cursor:pointer; margin-bottom:12px; padding:18px; background:rgba(255,255,255,0.03); border:1px solid #222; border-radius:18px;">
                <div style="text-align:left;">
                    <span style="color:var(--main); font-size:9px; font-weight:900;">+ ΠΡΟΣΘΗΚΗ ΣΤΟ LOG</span>
                    <div style="font-weight:900; font-size:14px; color:#fff; margin-top:2px;">${itemName}</div>
                    <div style="color:#ff9800; font-size:10px; margin-top:5px; font-weight:bold;">🍗 ${protein}G PROTEIN</div>
                </div>
                <div style="font-weight:900; color:#eee; font-size:16px;">🔥 ${kcal} KCAL</div>
            </div>`
            }).join('');
    },

    updateUI: function() {
        // Εκτέλεση ρουτίνας
        this.checkDailyRoutine();

        const dateStr = new Date().toLocaleDateString('el-GR');
        const log = this.getLog(dateStr);
        let tk = 0, tp = 0;
        
        log.forEach(item => { 
            tk += parseFloat(item.kcal || 0); 
            tp += parseFloat(item.protein || 0); 
        });

        const cardioKcal = parseFloat(localStorage.getItem("pegasus_cardio_kcal_" + dateStr)) || 0;
        const targetKcal = 2800 + cardioKcal;

        if(document.getElementById("txtKcal")) document.getElementById("txtKcal").textContent = `${Math.round(tk)} / ${Math.round(targetKcal)}`;
        if(document.getElementById("txtProt")) document.getElementById("txtProt").textContent = `${Math.round(tp)} / 160g`;
        
        const listDisplay = document.getElementById("foodHistoryList");
        if(listDisplay) {
            listDisplay.innerHTML = log.map((i, idx) => `
                <div class="log-item">
                    <button class="btn-del" onclick="window.PegasusDiet.delete(${idx})">✕</button>
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
