/* ==========================================================================
   PEGASUS OS - DIET MODULE (MOBILE EDITION v15.0 SHARED CORE PATCH)
   Protocol: Shared Metabolic Helpers, Safe Daily Targets & Cross-Device Consistency
   Status: FINAL STABLE | FIXED: DUPLICATE TARGET LOGIC REMOVED
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

    getRoutineTemplates: function() {
        return [
            { name: "Γιαούρτι 2% + Whey (Ρουτίνα)", kcal: 250, protein: 35, tsOffset: 1000 },
            { name: "3 Αυγά (Ρουτίνα)", kcal: 210, protein: 18, tsOffset: 2000 },
            { name: "Κρεατίνη 5g (Ρουτίνα)", kcal: 0, protein: 0, tsOffset: 3000 }
        ];
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

    getBaseTarget: function() {
        if (typeof window.getPegasusBaseDailyTarget === "function") {
            return window.getPegasusBaseDailyTarget();
        }

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

        return Math.round(this.getBaseTarget() + this.getCardioOffset(this.getStrictDateStr()));
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

        this.applyInventoryImpact(name);

        if (name.includes("(Κούκι)")) {
            let agreementLog = JSON.parse(localStorage.getItem('kouki_agreement_log') || "[]");
            agreementLog.push({
                date: this.getStrictDateStr(),
                food: name
            });
            localStorage.setItem('kouki_agreement_log', JSON.stringify(agreementLog));
        }

        const dateStr = this.getStrictDateStr();
        let log = this.getLog(dateStr);

        log.unshift({
            name: name,
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

        const isVisible = container.dataset.expanded === "true" && container.innerHTML.trim() !== "";
        if (isVisible) {
            container.innerHTML = "";
            container.dataset.expanded = "false";
            if (triggerBtn) triggerBtn.innerHTML = "🧠 ΡΩΤΑ ΤΟΝ PEGASUS ADVISOR";
            return;
        }

        const advice = window.PegasusDietAdvisor.analyzeAndRecommend();
        const esc = window.PegasusMobileSafe?.escapeHtml || (v => String(v ?? ''));

        let html = `
            <div class="advisor-panel">
                <div class="advisor-title">🧠 PEGASUS LOGIC</div>
                <div class="advisor-subtitle">Η λογική του Pegasus</div>
                ${advice.proteinLine ? `<div class="advisor-chip">${esc(advice.proteinLine)}</div>` : ''}
                ${advice.deficitLine ? `<div class="advisor-chip warn">${esc(advice.deficitLine)}</div>` : ''}
                <div class="advisor-message">${esc(advice.msg)}</div>
                ${(advice.suggestions || []).length ? `<div class="advisor-suggestions">${advice.suggestions.map(s => `<div class="advisor-suggestion">• ${esc(s)}</div>`).join('')}</div>` : ''}
                <div class="advisor-options">
        `;

        advice.options.forEach((opt, idx) => {
            const macros = (typeof window.getPegasusMacros === "function")
                ? window.getPegasusMacros(opt.n, opt.t)
                : { kcal: 550, protein: 45 };
            const tone = ['green', 'orange', 'red'].includes(opt?.tone) ? opt.tone : 'orange';

            html += `
                <div class="advisor-option-card ${tone}">
                    <div style="text-align:left; flex:1;">
                        ${opt.toneLabel ? `<div class="advisor-option-badge ${tone}">${esc(opt.toneLabel)}</div>` : ''}
                        <div class="advisor-option-name">${esc(opt.n)}</div>
                        <div class="advisor-option-macros">🔥 ${Number(macros.kcal) || 0} kcal | 🍗 ${Number(macros.protein) || 0}g</div>
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
                const macros = (typeof window.getPegasusMacros === 'function')
                    ? window.getPegasusMacros(opt.n, opt.t)
                    : { kcal: 550, protein: 45 };
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
        log.splice(idx, 1);

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


/* ===== CONSOLIDATED FROM diet-delete-routine-fix.js ===== */
/* ==========================================================================
   PEGASUS OS - MOBILE DIET DELETE ROUTINE FIX v1.0
   Purpose: Allow same-day deletion of auto-injected routine meals on mobile
   Scope: Mobile diet only | Non-invasive patch layer
   ========================================================================== */

(function installMobileDietDeleteRoutineFix() {
    if (!window.PegasusDiet || window.PegasusDiet.__routineDeleteFixInstalled) return;

    const diet = window.PegasusDiet;
    const originalGetRoutineTemplates = typeof diet.getRoutineTemplates === "function"
        ? diet.getRoutineTemplates.bind(diet)
        : () => [];
    const originalAdd = typeof diet.add === "function"
        ? diet.add.bind(diet)
        : null;
    const originalDelete = typeof diet.delete === "function"
        ? diet.delete.bind(diet)
        : null;

    const suppressionKey = (dateStr) => `pegasus_mobile_deleted_routine_${dateStr}`;

    function getDateStr() {
        return typeof diet.getStrictDateStr === "function"
            ? diet.getStrictDateStr()
            : `${String(new Date().getDate()).padStart(2, '0')}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;
    }

    function safeParse(raw) {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    function getSuppressed(dateStr) {
        return safeParse(localStorage.getItem(suppressionKey(dateStr)));
    }

    function setSuppressed(dateStr, names) {
        const uniqueNames = Array.from(new Set((names || []).filter(Boolean)));
        localStorage.setItem(suppressionKey(dateStr), JSON.stringify(uniqueNames));
    }

    function addSuppressed(dateStr, name) {
        const next = getSuppressed(dateStr);
        next.push(name);
        setSuppressed(dateStr, next);
    }

    function removeSuppressed(dateStr, name) {
        const next = getSuppressed(dateStr).filter(entry => entry !== name);
        setSuppressed(dateStr, next);
    }

    function isRoutineName(name) {
        const allRoutineNames = originalGetRoutineTemplates().map(item => item?.name).filter(Boolean);
        return allRoutineNames.includes(String(name || ""));
    }

    diet.getRoutineTemplates = function() {
        const dateStr = getDateStr();
        const blocked = new Set(getSuppressed(dateStr));
        return originalGetRoutineTemplates().filter(item => !blocked.has(item?.name));
    };

    if (originalAdd) {
        diet.add = async function(n, k, p) {
            const dateStr = getDateStr();
            const name = String(n || document.getElementById("fName")?.value || "").trim();

            if (name && isRoutineName(name)) {
                const blocked = new Set(getSuppressed(dateStr));
                if (blocked.has(name)) {
                    console.log("🛡️ DIET MOBILE PATCH: Suppressed routine re-add blocked:", name);
                    return false;
                }

                removeSuppressed(dateStr, name);
            }

            return originalAdd(n, k, p);
        };
    }

    if (originalDelete) {
        diet.delete = async function(idx) {
            const dateStr = getDateStr();
            const log = typeof diet.getLog === "function" ? (diet.getLog(dateStr) || []) : [];
            const target = log[idx];

            if (target?.name && isRoutineName(target.name)) {
                addSuppressed(dateStr, target.name);
            }

            return originalDelete(idx);
        };
    }

    diet.__routineDeleteFixInstalled = true;
    console.log("✅ DIET MOBILE PATCH: Routine delete suppression active.");
})();
