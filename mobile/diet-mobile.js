/* ==========================================================================
   PEGASUS OS - DIET MODULE (MOBILE EDITION v14.8 MAXIMALIST STRICT)
   Protocol: Master Macro Engine Integration & Global Metabolic Sync
   ========================================================================== */

window.PegasusDiet = {
    // 🎯 FIX: ΑΥΣΤΗΡΟ PADDING ΗΜΕΡΟΜΗΝΙΑΣ ΓΙΑ ΝΑ ΣΥΜΦΩΝΕΙ ΜΕ ΤΟ ΗΜΕΡΟΛΟΓΙΟ
    getStrictDateStr: function() {
        const rawDate = new Date();
        const d = String(rawDate.getDate()).padStart(2, '0');
        const m = String(rawDate.getMonth() + 1).padStart(2, '0');
        const y = rawDate.getFullYear();
        return `${d}/${m}/${y}`;
    },

    checkDailyRoutine: function() {
        const dateStr = this.getStrictDateStr();
        const flagKey = "pegasus_routine_injected_" + dateStr;

        if (localStorage.getItem(flagKey) === "true") return false;

        console.log("🚀 DIET: Injecting daily baseline...");
        localStorage.setItem(flagKey, "true");

        let log = this.getLog(dateStr);
        const hasRoutine = log.some(i => i.name.includes("(Ρουτίνα)"));
        
        if (!hasRoutine) {
            log.push({ name: "Γιαούρτι 2% + Whey (Ρουτίνα)", kcal: 250, protein: 35, ts: Date.now() - 1000 });
            log.push({ name: "3 Αυγά (Ρουτίνα)", kcal: 210, protein: 18, ts: Date.now() - 2000 });

            if (window.PegasusInventory) {
                window.PegasusInventory.consume('prot', 30);
            }

            const prefix = window.PegasusManifest?.nutrition?.log_prefix || "food_log_";
            localStorage.setItem(prefix + dateStr, JSON.stringify(log));
            return true;
        }
        
        return false;
    },

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

        const dateStr = this.getStrictDateStr();
        let log = this.getLog(dateStr);
        log.unshift({ name: name, kcal: kcal, protein: prot, ts: Date.now() });
        
        const prefix = window.PegasusManifest?.nutrition?.log_prefix || "food_log_";
        localStorage.setItem(prefix + dateStr, JSON.stringify(log));
        
        if(document.getElementById("fName")) document.getElementById("fName").value = "";
        this.closeSearch();

        this.updateUI();
        if(window.PegasusCloud) await window.PegasusCloud.push(true);
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
            const macros = (typeof window.getPegasusMacros === "function") 
                           ? window.getPegasusMacros(opt.n, opt.t) 
                           : { kcal: 550, protein: 45 };
            
            html += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:#1a1a1a; padding:10px; border-radius:8px; border:1px solid #333;">
                    <div style="text-align:left;">
                        <div style="color:#fff; font-weight:bold; font-size:14px;">${opt.n}</div>
                        <div style="color:#4CAF50; font-size:12px; font-weight:900;">🔥 ${macros.kcal} kcal | 🍗 ${macros.protein}g</div>
                    </div>
                    <button onclick="window.PegasusDiet.quickAdd('${opt.n} (Κούκι)', ${macros.kcal}, ${macros.protein}); document.getElementById('advisorMobileResult').innerHTML='';" 
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
        const fNameInput = document.getElementById("fName");
        
        if(!resBox) return;
        if(!term || term.length < 2) { 
            resBox.style.display = "none"; 
            if(fNameInput) fNameInput.style.borderRadius = "16px";
            return; 
        }

        const lib = JSON.parse(localStorage.getItem(window.PegasusManifest?.diet?.foodLibrary || "pegasus_food_library")) || [];
        const matches = lib.filter(i => i.name.toLowerCase().includes(term.toLowerCase())).slice(0, 5);

        if(matches.length > 0) {
            resBox.innerHTML = matches.map(i => `
                <div class="search-item" onclick="window.PegasusDiet.selectSuggested('${i.name}', ${i.kcal}, ${i.protein})">
                    <span class="search-item-name">${i.name}</span>
                    <span class="search-item-macros">${i.kcal} kcal | ${i.protein}g</span>
                </div>
            `).join('');
            resBox.style.display = "block";
            if(fNameInput) fNameInput.style.borderRadius = "16px";
        } else {
            resBox.style.display = "none";
            if(fNameInput) fNameInput.style.borderRadius = "16px";
        }
    },

    selectSuggested: function(n, k, p) { this.add(n, k, p); },
    
    closeSearch: function() { 
        if(document.getElementById("searchSuggestions")) {
            document.getElementById("searchSuggestions").style.display = "none"; 
            if(document.getElementById("fName")) document.getElementById("fName").style.borderRadius = "16px";
        }
    },

    renderDailyKouki: function() {
        const container = document.getElementById('libraryContainer');
        if(!container) return;
        
        const targetDate = new Date();
        const greekDays = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
        const targetDayName = greekDays[targetDate.getDay()];
        
        const daysMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const targetDayKey = daysMap[targetDate.getDay()];
        
        let dailyMenu = [];
        
        if (typeof window.KOUKI_MASTER_MENU !== 'undefined' && window.KOUKI_MASTER_MENU[targetDayKey]) {
            dailyMenu = window.KOUKI_MASTER_MENU[targetDayKey];
        } else if (typeof window.KOUKI_MASTER !== 'undefined') {
            const offset = targetDate.getDay() * 2; 
            dailyMenu = window.KOUKI_MASTER.slice(offset, offset + 8);
        }

        container.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; margin-bottom:20px;">
                <span style="color:var(--main); font-weight:900; font-size:14px; text-transform:uppercase;">${targetDayName} (ΚΟΥΚΙ)</span>
            </div>` + dailyMenu.map(item => {
                const itemName = item.n || item.name;
                const itemTag = item.t || item.type || "kreas";
                const macros = (typeof window.getPegasusMacros === "function") 
                               ? window.getPegasusMacros(itemName, itemTag) 
                               : { kcal: 550, protein: 45 };

                return `
            <div class="mini-card" onclick="window.PegasusDiet.quickAdd('${itemName} (Κούκι)', ${macros.kcal}, ${macros.protein})" 
                 style="display:flex; justify-content:space-between; align-items:center; cursor:pointer; margin-bottom:12px; padding:18px; background:rgba(255,255,255,0.03); border:1px solid #222; border-radius:18px;">
                <div style="text-align:left;">
                    <span style="color:var(--main); font-size:9px; font-weight:900;">+ ΠΡΟΣΘΗΚΗ ΣΤΟ LOG</span>
                    <div style="font-weight:900; font-size:14px; color:#fff; margin-top:2px;">${itemName}</div>
                    <div style="color:#ff9800; font-size:10px; margin-top:5px; font-weight:bold;">🍗 ${macros.protein}G PROTEIN</div>
                </div>
                <div style="font-weight:900; color:#eee; font-size:16px;">🔥 ${macros.kcal} KCAL</div>
            </div>`
            }).join('');
    },

    updateUI: function() {
        this.checkDailyRoutine();

        const dateStr = this.getStrictDateStr();
        const log = this.getLog(dateStr);
        let tk = 0, tp = 0;
        
        log.forEach(item => { 
            tk += parseFloat(item.kcal || 0); 
            tp += parseFloat(item.protein || 0); 
        });

        localStorage.setItem(window.PegasusManifest?.diet?.todayKcal || "pegasus_today_kcal", Math.round(tk));
        localStorage.setItem(window.PegasusManifest?.diet?.todayProtein || "pegasus_today_protein", Math.round(tp));

        const cardioKcal = parseFloat(localStorage.getItem("pegasus_cardio_kcal_" + dateStr)) || 0;
        const targetKcal = 2800 + cardioKcal;

        if(document.getElementById("txtKcal")) document.getElementById("txtKcal").textContent = `${Math.round(tk)} / ${Math.round(targetKcal)}`;
        
        const targetProt = localStorage.getItem("pegasus_goal_protein") || 160;
        if(document.getElementById("txtProt")) document.getElementById("txtProt").textContent = `${Math.round(tp)} / ${targetProt}g`;
        
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
        const dateStr = this.getStrictDateStr();
        let log = this.getLog(dateStr);
        log.splice(idx, 1);
        
        const prefix = window.PegasusManifest?.nutrition?.log_prefix || "food_log_";
        localStorage.setItem(prefix + dateStr, JSON.stringify(log));
        
        this.updateUI();
        // 🎯 FIX: ΑΦΑΙΡΕΣΗ ΤΟΥ `true` ΓΙΑ ΝΑ ΕΝΕΡΓΟΠΟΙΗΘΕΙ ΤΟ DEBOUNCE
        if(window.PegasusCloud) await window.PegasusCloud.push();
    },

    // 🛡️ FIX: Αφαίρεση του setItem που προκαλούσε το Crash.
    getLog: function(dateStr) {
        try {
            const prefix = window.PegasusManifest?.nutrition?.log_prefix || "food_log_";
            const data = localStorage.getItem(prefix + dateStr);
            return data ? JSON.parse(data) : [];
        } catch (e) { return []; }
    },

    quickAdd: function(n, k, p) {
        this.add(n, k, p);
        if (typeof openView === "function") openView('diet');
    }
};
