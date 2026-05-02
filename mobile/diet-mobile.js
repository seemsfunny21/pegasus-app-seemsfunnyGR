/* ==========================================================================
   PEGASUS OS - DIET MODULE (MOBILE EDITION v15.2 ROUTINE CLEANUP)
   Protocol: Shared Metabolic Helpers, Diet-Only Inventory & Delete Restore
   Status: FINAL STABLE | MAINTENANCE: ROUTINE DELETE PATCH CONSOLIDATED
   ========================================================================== */

window.PegasusDiet = {
    getStrictDateStr: function() {
        if (typeof window.getPegasusTodayDateStr === "function") {
            return window.getPegasusTodayDateStr();
        }

        const rawDate = new Date();
        const d = String(rawDate.getDate()).padStart(2, '0');
        const m = String(rawDate.getMonth() + 1).padStart(2, '0');
        const y = rawDate.getFullYear();
        return `${d}/${m}/${y}`;
    },

    getFoodLogKey: function(dateStr) {
        const prefix = window.PegasusManifest?.nutrition?.log_prefix || "food_log_";
        return prefix + (dateStr || this.getStrictDateStr());
    },

    safeParseLog: function(raw) {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    },

    getBaseRoutineTemplates: function() {
        return [
            { name: "Γιαούρτι 2% + Whey (Ρουτίνα)", kcal: 250, protein: 35, tsOffset: 1000 },
            { name: "3 Αυγά (Ρουτίνα)", kcal: 210, protein: 18, tsOffset: 2000 },
            { name: "Πρωτεΐνη 1 Scoop (Ρουτίνα)", kcal: 120, protein: 24, tsOffset: 2500 },
            { name: "Κρεατίνη 5g (Ρουτίνα)", kcal: 0, protein: 0, tsOffset: 3000 }
        ];
    },

    getRoutineSuppressionKey: function(dateStr) {
        return `pegasus_mobile_deleted_routine_${dateStr || this.getStrictDateStr()}`;
    },

    getSuppressedRoutineNames: function(dateStr) {
        return this.safeParseLog(localStorage.getItem(this.getRoutineSuppressionKey(dateStr)));
    },

    setSuppressedRoutineNames: function(dateStr, names) {
        const uniqueNames = Array.from(new Set((names || []).filter(Boolean)));
        localStorage.setItem(this.getRoutineSuppressionKey(dateStr), JSON.stringify(uniqueNames));
    },

    isRoutineName: function(name) {
        const cleanName = String(name || "");
        return this.getBaseRoutineTemplates().some(item => item?.name === cleanName);
    },

    suppressRoutineName: function(dateStr, name) {
        if (!this.isRoutineName(name)) return;
        const next = this.getSuppressedRoutineNames(dateStr);
        next.push(name);
        this.setSuppressedRoutineNames(dateStr, next);
    },

    unsuppressRoutineName: function(dateStr, name) {
        const next = this.getSuppressedRoutineNames(dateStr).filter(entry => entry !== name);
        this.setSuppressedRoutineNames(dateStr, next);
    },

    getRoutineTemplates: function() {
        const dateStr = this.getStrictDateStr();
        const blocked = new Set(this.getSuppressedRoutineNames(dateStr));
        return this.getBaseRoutineTemplates().filter(item => !blocked.has(item?.name));
    },

    getInventoryImpact: function(name) {
        const cleanName = String(name || "").trim().toLowerCase();

        const isWhey =
            cleanName.includes("whey") ||
            cleanName.includes("πρωτεΐνη") ||
            cleanName.includes("πρωτεινη");

        const isCreatine =
            cleanName.includes("κρεατίνη") ||
            cleanName.includes("κρεατινη") ||
            cleanName.includes("creatine");

        return {
            prot: isWhey ? 30 : 0,
            crea: isCreatine ? 5 : 0
        };
    },

    applyInventoryImpact: function(name) {
        const impact = this.getInventoryImpact(name);

        if (impact.prot > 0 && window.PegasusInventory?.consume) {
            window.PegasusInventory.consume('prot', impact.prot);
        }

        if (impact.crea > 0 && window.PegasusInventory?.consume) {
            window.PegasusInventory.consume('crea', impact.crea);
        }
    },

    restoreInventoryImpact: function(name) {
        const impact = this.getInventoryImpact(name);

        if (impact.prot > 0 && window.PegasusInventory?.restore) {
            window.PegasusInventory.restore('prot', impact.prot);
        }

        if (impact.crea > 0 && window.PegasusInventory?.restore) {
            window.PegasusInventory.restore('crea', impact.crea);
        }
    },

    getCalculatedBaseTarget: function() {
        const greekDays = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
        const dayName = greekDays[new Date().getDay()];

        const settings = (typeof window.getPegasusSettings === "function")
            ? window.getPegasusSettings()
            : { activeSplit: "IRON" };

        const activePlan = settings?.activeSplit || "IRON";

        const KCAL_REST = 2100;
        const KCAL_WEIGHTS = 2800;
        const KCAL_EMS = 2700;
        const KCAL_BIKE = 3100;

        if (dayName === "Δευτέρα" || dayName === "Πέμπτη") return KCAL_REST;

        switch (activePlan) {
            case "EMS_ONLY":
                return dayName === "Τετάρτη" ? KCAL_EMS : KCAL_WEIGHTS;

            case "BIKE_ONLY":
                return (dayName === "Σάββατο" || dayName === "Κυριακή") ? KCAL_BIKE : KCAL_WEIGHTS;

            case "HYBRID":
                if (dayName === "Τετάρτη") return KCAL_EMS;
                if (dayName === "Σάββατο" || dayName === "Κυριακή") return KCAL_BIKE;
                return KCAL_WEIGHTS;

            case "UPPER_LOWER":
            case "IRON":
            default:
                return KCAL_WEIGHTS;
        }
    },

    getBaseTarget: function() {
        if (typeof window.getPegasusBaseDailyTarget === "function") {
            return window.getPegasusBaseDailyTarget();
        }

        const todayKey = window.PegasusManifest?.diet?.todayKcal || "pegasus_today_kcal";
        const storedToday = parseFloat(localStorage.getItem(todayKey));
        const cardio = this.getCardioOffset(this.getStrictDateStr());
        const calculated = this.getCalculatedBaseTarget();

        if (!isNaN(storedToday) && storedToday > 0) {
            return Math.max(calculated, Math.max(0, storedToday - cardio));
        }

        return calculated;
    },

    getCardioOffset: function(dateStr) {
        if (typeof window.getPegasusTodayCardioOffset === "function") {
            return window.getPegasusTodayCardioOffset();
        }

        const targetDate = dateStr || this.getStrictDateStr();

        const unifiedOffset = parseFloat(localStorage.getItem("pegasus_cardio_kcal_" + targetDate));
        const legacyOffset = parseFloat(
            localStorage.getItem(
                (window.PegasusManifest?.workout?.cardio_offset || "pegasus_cardio_offset_sets") + "_" + targetDate
            )
        );

        if (!isNaN(unifiedOffset)) return unifiedOffset;
        if (!isNaN(legacyOffset)) return legacyOffset;
        return 0;
    },

    getEffectiveTarget: function() {
        if (typeof window.getPegasusEffectiveDailyTarget === "function") {
            return window.getPegasusEffectiveDailyTarget();
        }

        const todayKey = window.PegasusManifest?.diet?.todayKcal || "pegasus_today_kcal";
        const storedToday = parseFloat(localStorage.getItem(todayKey));
        const calculated = Math.round(this.getBaseTarget() + this.getCardioOffset(this.getStrictDateStr()));

        if (!isNaN(storedToday) && storedToday > 0) {
            return Math.max(calculated, storedToday);
        }

        return calculated;
    },

    checkDailyRoutine: function() {
        const dateStr = this.getStrictDateStr();
        const flagKey = "pegasus_routine_injected_" + dateStr;

        let log = this.getLog(dateStr);
        let changed = false;

        const templates = this.getRoutineTemplates();

        templates.forEach((item) => {
            const exists = log.some(entry => entry?.name === item.name);

            if (!exists) {
                log.push({
                    name: item.name,
                    kcal: item.kcal,
                    protein: item.protein,
                    ts: Date.now() - item.tsOffset
                });

                this.applyInventoryImpact(item.name);
                changed = true;
            }
        });

        const hasAllRoutineEntries = templates.every(item =>
            log.some(entry => entry?.name === item.name)
        );

        if (hasAllRoutineEntries) {
            localStorage.setItem(flagKey, "true");
        }

        if (changed) {
            console.log("🚀 DIET: Injecting / reconciling daily baseline...");
            localStorage.setItem(this.getFoodLogKey(dateStr), JSON.stringify(log));

            if (window.PegasusInventory?.updateUI) {
                window.PegasusInventory.updateUI();
            }

            return true;
        }

        return false;
    },

    add: async function(n, k, p) {
        const name = n || document.getElementById("fName")?.value;
        const kcal = parseFloat(k || 0) || 0;
        const prot = parseFloat(p || 0) || 0;

        if (!name || name.trim() === "") return;

        const cleanName = String(name).trim();
        const dateStr = this.getStrictDateStr();
        const suppressedRoutineNames = new Set(this.getSuppressedRoutineNames(dateStr));

        if (this.isRoutineName(cleanName)) {
            if (suppressedRoutineNames.has(cleanName)) return false;
            this.unsuppressRoutineName(dateStr, cleanName);
        }

        this.applyInventoryImpact(cleanName);

        if (cleanName.includes("(Κούκι)")) {
            let agreementLog = JSON.parse(localStorage.getItem('kouki_agreement_log') || "[]");
            agreementLog.push({
                date: this.getStrictDateStr(),
                food: cleanName
            });
            localStorage.setItem('kouki_agreement_log', JSON.stringify(agreementLog));
        }

        let log = this.getLog(dateStr);

        log.unshift({
            name: cleanName,
            kcal: kcal,
            protein: prot,
            ts: Date.now()
        });

        localStorage.setItem(this.getFoodLogKey(dateStr), JSON.stringify(log));

        if (document.getElementById("fName")) document.getElementById("fName").value = "";
        this.closeSearch();

        this.updateUI();
        if (window.PegasusCloud) await window.PegasusCloud.push(true);
    },
    askAdvisor: function() {
        const container = document.getElementById("advisorMobileResult");
        const triggerBtn = document.getElementById("dietAdvisorToggleBtn");
        if (!window.PegasusDietAdvisor) return alert("Advisor Offline");
        if (!container) return;

        const isVisible = container.innerHTML.trim() !== "";
        if (isVisible) {
            container.innerHTML = "";
            container.dataset.expanded = "false";
            if (triggerBtn) triggerBtn.innerHTML = "🧠 ΡΩΤΑ ΤΟΝ PEGASUS ADVISOR";
            return;
        }

        container.dataset.expanded = "false";
        const advice = window.PegasusDietAdvisor.analyzeAndRecommend();
        const esc = window.PegasusMobileSafe?.escapeHtml || (v => String(v ?? ''));
        const insights = advice.historyInsights || {};
        const historyDays = Number(advice?.history?.days || 14);
        const getOptionMacros = (opt) => {
            if (Number.isFinite(Number(opt?.kcal)) || Number.isFinite(Number(opt?.protein))) {
                return { kcal: Number(opt.kcal) || 0, protein: Number(opt.protein) || 0 };
            }
            if (typeof window.getPegasusMacros === 'function') return window.getPegasusMacros(opt.n, opt.t);
            return { kcal: 550, protein: 45 };
        };
        const historyCards = (insights.categories || []).slice(0, 7).map(item => `
            <div class="advisor-history-card ${esc(item.tone || 'ok')}">
                <div class="advisor-history-icon">${esc(item.icon || '•')}</div>
                <div class="advisor-history-main">
                    <div class="advisor-history-label">${esc(item.label)}</div>
                    <div class="advisor-history-count">${esc(item.daysSeen)}/${historyDays} ημέρες</div>
                </div>
            </div>
        `).join('');
        const repeatedStrip = (insights.repeatedCategories || []).length
            ? `<div class="advisor-repeat-strip">${(insights.repeatedCategories || []).map(item => `<span>${esc(item.icon || '•')} ${esc(item.label)}: ${esc(item.count)}x</span>`).join('')}</div>`
            : '';

        let html = `
            <div class="advisor-panel pegasus-advisor-rich">
                <div class="advisor-title">🧠 PEGASUS ADVISOR</div>
                <div class="advisor-subtitle">Προτάσεις διατροφής</div>
                ${historyCards ? `<div class="advisor-history-grid">${historyCards}</div>` : ''}
                ${repeatedStrip}
                <div class="advisor-options">
        `;

        advice.options.forEach((opt, idx) => {
            const macros = getOptionMacros(opt);
            const tone = ['green', 'orange', 'red'].includes(opt?.tone) ? opt.tone : 'orange';

            html += `
                <div class="advisor-option-card ${tone}">
                    <div class="advisor-option-rank">${idx + 1}</div>
                    <div class="advisor-option-body">
                        ${opt.toneLabel ? `<div class="advisor-option-badge ${tone}">${esc(opt.toneLabel)}</div>` : ''}
                        <div class="advisor-option-name">${esc(opt.n)}</div>
                        <div class="advisor-option-macros">🔥 ${Number(macros.kcal) || 0} kcal | 🍗 ${Number(macros.protein) || 0}g${opt.price !== null && opt.price !== undefined && Number.isFinite(Number(opt.price)) ? ` | 💶 ${Number(opt.price).toFixed(2)}€` : ''}</div>
                        ${opt.sourceLabel ? `<div class="advisor-option-source">📍 ${esc(opt.sourceLabel)}</div>` : ''}
                        ${opt.reason ? `<div class="advisor-option-reason">${esc(opt.reason)}</div>` : ''}
                    </div>
                    <button data-pegasus-advisor-add="${idx}" class="advisor-add-btn">ΠΡΟΣΘΗΚΗ</button>
                </div>
            `;
        });

        html += `</div></div>`;
        container.innerHTML = html;
        container.dataset.expanded = "true";
        if (triggerBtn) triggerBtn.innerHTML = "🧠 ΑΠΟΚΡΥΨΗ PEGASUS ADVISOR";
        container.querySelectorAll('button[data-pegasus-advisor-add]').forEach(btn => {
            btn.addEventListener('click', () => {
                const opt = advice.options[Number(btn.dataset.pegasusAdvisorAdd)];
                if (!opt) return;
                const macros = getOptionMacros(opt);
                window.PegasusDiet.quickAdd(`${opt.n} (Κούκι)`, Number(macros.kcal) || 0, Number(macros.protein) || 0);
                document.getElementById('advisorMobileResult').innerHTML = '';
                document.getElementById('advisorMobileResult').dataset.expanded = "false";
                const btnEl = document.getElementById('dietAdvisorToggleBtn');
                if (btnEl) btnEl.innerHTML = "🧠 ΡΩΤΑ ΤΟΝ PEGASUS ADVISOR";
            });
        });
    },
    handleSearch: function(term) {
        const resBox = document.getElementById("searchSuggestions");
        const fNameInput = document.getElementById("fName");
        const esc = window.PegasusMobileSafe?.escapeHtml || (v => String(v ?? ''));

        if (!resBox) return;
        if (!term || term.length < 2) {
            resBox.style.display = "none";
            if (fNameInput) fNameInput.style.borderRadius = "16px";
            return;
        }

        const lib = window.PegasusMobileSafe?.safeReadStorage(window.PegasusManifest?.diet?.foodLibrary || "pegasus_food_library", [], { repairOnFailure: false }) || [];
        const matches = lib.filter(i => String(i?.name || '').toLowerCase().includes(term.toLowerCase())).slice(0, 5);

        if (matches.length > 0) {
            resBox.innerHTML = matches.map((i, idx) => `
                    <div class="search-item" data-search-idx="${idx}">
                        <span class="search-item-name">${esc(i.name)}</span>
                        <span class="search-item-macros">${Number(i.kcal) || 0} kcal | ${Number(i.protein) || 0}g</span>
                    </div>
                `).join('');
            resBox.querySelectorAll('[data-search-idx]').forEach(el => {
                el.addEventListener('click', () => {
                    const item = matches[Number(el.dataset.searchIdx)];
                    if (item) window.PegasusDiet.selectSuggested(String(item.name || ''), Number(item.kcal) || 0, Number(item.protein) || 0);
                });
            });
            resBox.style.display = "block";
            if (fNameInput) fNameInput.style.borderRadius = "16px";
        } else {
            resBox.style.display = "none";
            if (fNameInput) fNameInput.style.borderRadius = "16px";
        }
    },

    selectSuggested: function(n, k, p) {
        this.add(n, k, p);
    },

    closeSearch: function() {
        if (document.getElementById("searchSuggestions")) {
            document.getElementById("searchSuggestions").style.display = "none";
            if (document.getElementById("fName")) document.getElementById("fName").style.borderRadius = "16px";
        }
    },
    renderDailyKouki: function() {
        const container = document.getElementById('libraryContainer');
        if (!container) return;

        const targetDate = new Date();
        const greekDays = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
        const targetDayName = greekDays[targetDate.getDay()];
        const esc = window.PegasusMobileSafe?.escapeHtml || (v => String(v ?? ''));

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
                <span style="color:var(--main); font-weight:900; font-size:14px; text-transform:uppercase;">${esc(targetDayName)} (ΚΟΥΚΙ)</span>
            </div>` + dailyMenu.map((item, idx) => {
                const itemName = item.n || item.name;
                const itemTag = item.t || item.type || "kreas";
                const macros = (typeof window.getPegasusMacros === "function")
                    ? window.getPegasusMacros(itemName, itemTag)
                    : { kcal: 550, protein: 45 };

                return `
            <div class="mini-card pegasus-kouki-item" data-kouki-idx="${idx}"
                 style="display:flex; justify-content:space-between; align-items:center; cursor:pointer; margin-bottom:12px; padding:18px; background:rgba(255,255,255,0.03); border:1px solid #222; border-radius:18px;">
                <div style="text-align:left;">
                    <span style="color:var(--main); font-size:9px; font-weight:900;">+ ΠΡΟΣΘΗΚΗ ΣΤΟ LOG</span>
                    <div style="font-weight:900; font-size:14px; color:#fff; margin-top:2px;">${esc(itemName)}</div>
                    <div style="color:#ff9800; font-size:10px; margin-top:5px; font-weight:bold;">🍗 ${Number(macros.protein) || 0}G PROTEIN</div>
                </div>
                <div style="font-weight:900; color:#eee; font-size:16px;">🔥 ${Number(macros.kcal) || 0} KCAL</div>
            </div>`;
            }).join('');
        container.querySelectorAll('.pegasus-kouki-item').forEach(el => {
            el.addEventListener('click', () => {
                const item = dailyMenu[Number(el.dataset.koukiIdx)];
                if (!item) return;
                const itemName = item.n || item.name;
                const itemTag = item.t || item.type || 'kreas';
                const macros = (typeof window.getPegasusMacros === 'function')
                    ? window.getPegasusMacros(itemName, itemTag)
                    : { kcal: 550, protein: 45 };
                window.PegasusDiet.quickAdd(`${itemName} (Κούκι)`, Number(macros.kcal) || 0, Number(macros.protein) || 0);
            });
        });
    },

    updateUI: function() {
        this.checkDailyRoutine();

        const dateStr = this.getStrictDateStr();
        const log = this.getLog(dateStr);
        let tk = 0;
        let tp = 0;

        log.forEach(item => {
            tk += parseFloat(item.kcal || 0);
            tp += parseFloat(item.protein || 0);
        });

        localStorage.setItem(window.PegasusManifest?.diet?.consumedProtein || 'pegasus_today_protein_consumed', Math.round(tp));

        const targetKcal = this.getEffectiveTarget();

        const txtKcal = document.getElementById("txtKcal");
        if (txtKcal) {
            txtKcal.textContent = `${Math.round(tk)} / ${targetKcal}`;
        }

        const targetProt = localStorage.getItem(window.PegasusManifest?.diet?.goalProtein || 'pegasus_goal_protein') || localStorage.getItem(window.PegasusManifest?.diet?.todayProtein || 'pegasus_today_protein') || 160;
        const txtProt = document.getElementById("txtProt");
        if (txtProt) {
            txtProt.textContent = `${Math.round(tp)} / ${targetProt}g`;
        }

        const listDisplay = document.getElementById("foodHistoryList");
        if (listDisplay) {
            const esc = window.PegasusMobileSafe?.escapeHtml || (v => String(v ?? ''));
            listDisplay.innerHTML = log.map((i, idx) => `
                <div class="log-item">
                    <button class="btn-del" onclick="window.PegasusDiet.delete(${idx})">✕</button>
                    <div style="font-weight:900; font-size:14px; color:#fff;">${esc(i.name)}</div>
                    <div style="color:var(--main); font-size:11px; font-weight:800; margin-top:4px;">${Number(i.kcal) || 0} kcal | ${Number(i.protein) || 0}g P</div>
                </div>
            `).join('');
        }

        if (window.PegasusInventory?.updateUI) {
            window.PegasusInventory.updateUI();
        }
    },

    delete: async function(idx) {
        const dateStr = this.getStrictDateStr();
        let log = this.getLog(dateStr);
        const removedItem = log.splice(idx, 1)[0];

        if (removedItem?.name) {
            if (this.isRoutineName(removedItem.name)) {
                this.suppressRoutineName(dateStr, removedItem.name);
            }
            this.restoreInventoryImpact(removedItem.name);
        }

        localStorage.setItem(this.getFoodLogKey(dateStr), JSON.stringify(log));

        this.updateUI();
        if (window.PegasusCloud) await window.PegasusCloud.push();
    },

    getLog: function(dateStr) {
        return this.safeParseLog(localStorage.getItem(this.getFoodLogKey(dateStr)));
    },

    quickAdd: function(n, k, p) {
        this.add(n, k, p);
        if (typeof openView === "function") openView('diet');
    }
};
