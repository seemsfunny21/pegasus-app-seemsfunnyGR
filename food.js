/* ==========================================================================
   PEGASUS FOOD ENGINE - v9.9 (DESKTOP/MOBILE SYNC PATCH)
   Protocol: Unified Cardio Offset + Strict Date Mapping + Safe Diet Targets
   Status: FINAL STABLE | CROSS-DEVICE DIET SYNC FIXED
   ========================================================================== */

var M = M || window.PegasusManifest;
if (!M) console.error("❌ CRITICAL: PegasusManifest missing in food.js");

if (!(window.currentFoodDate instanceof Date) || isNaN(window.currentFoodDate.getTime())) {
    window.currentFoodDate = new Date();
}
window.lastKnownSystemDate = new Date().toDateString();

document.addEventListener('DOMContentLoaded', () => {
    updateFoodUI();

    const btnAdd = document.getElementById('btnAddFood');
    if (btnAdd) {
        btnAdd.onclick = () => {
            const nameEl = document.getElementById('foodName');
            const kcalEl = document.getElementById('foodKcal');
            const protEl = document.getElementById('foodNote');

            const name = nameEl?.value;
            const kcal = kcalEl?.value;
            const protein = protEl?.value || 0;

            if (name && kcal) {
                addFoodItem(name, kcal, protein);
                if (nameEl) nameEl.value = "";
                if (kcalEl) kcalEl.value = "";
                if (protEl) protEl.value = "";
            } else {
                alert("PEGASUS STRICT: Συμπλήρωσε Φαγητό και Θερμίδες!");
            }
        };
    }

    const prevBtn = document.getElementById('btnPrevDay');
    const nextBtn = document.getElementById('btnNextDay');
    if (prevBtn) prevBtn.onclick = () => changeFoodDate(-1);
    if (nextBtn) nextBtn.onclick = () => changeFoodDate(1);

    const btnFoodUI = document.getElementById('btnFoodUI');
    if (btnFoodUI) {
        btnFoodUI.addEventListener('click', () => {
            setTimeout(window.renderKoukiMenu, 300);
        });
    }

    const searchInput = document.getElementById('librarySearch');
    if (searchInput) {
        searchInput.oninput = () => window.filterLibrary();
    }
});

function changeFoodDate(days) {
    window.currentFoodDate.setDate(window.currentFoodDate.getDate() + days);
    updateFoodUI();
}

/* ===== DATE HELPERS ===== */
function getPegasusDateParts(dateObj) {
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    return { d, m, y };
}

function getPegasusDateStr(dateObj) {
    const parts = getPegasusDateParts(dateObj);
    return `${parts.d}/${parts.m}/${parts.y}`;
}

function getWorkoutDateKey(dateObj) {
    const parts = getPegasusDateParts(dateObj);
    return `${parts.y}-${parts.m}-${parts.d}`;
}

// 🎯 FIXED: Unified Date Padding Protocol & Midnight Rollover
window.getStrictDateStr = function() {
    const currentSystemDate = new Date().toDateString();

    if (window.lastKnownSystemDate !== currentSystemDate) {
        window.currentFoodDate = new Date();

        if (M && M.workout && M.workout.cardio_offset) {
            const raw = window.currentFoodDate || new Date();
            const dateStr = getPegasusDateStr(raw);

            localStorage.removeItem("pegasus_cardio_kcal_" + dateStr);
            localStorage.removeItem((M.workout.cardio_offset || "pegasus_cardio_offset_sets") + "_" + dateStr);
        }

        window.lastKnownSystemDate = currentSystemDate;
        console.log("🛡️ PEGASUS GUARD: Midnight Rollover & Metabolic Reset Executed.");
    }

    const d = window.currentFoodDate || new Date();
    return getPegasusDateStr(d);
};

function getDynamicBMR() {
    const wKey = M?.user?.weight || "pegasus_weight";
    const hKey = M?.user?.height || "pegasus_height";
    const aKey = M?.user?.age || "pegasus_age";
    const gKey = M?.user?.gender || "pegasus_gender";

    const w = parseFloat(localStorage.getItem(wKey)) || 74;
    const h = parseFloat(localStorage.getItem(hKey)) || 187;
    const a = parseInt(localStorage.getItem(aKey)) || 38;
    const g = localStorage.getItem(gKey) || "male";

    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    return (g === "male") ? bmr + 5 : bmr - 161;
}

/* ===== UNIFIED DIET TARGET HELPERS ===== */
function getCardioOffsetForDate(dateObj) {
    const dateStr = getPegasusDateStr(dateObj);

    const unifiedKey = "pegasus_cardio_kcal_" + dateStr;
    const legacyKey = (M?.workout?.cardio_offset || "pegasus_cardio_offset_sets") + "_" + dateStr;

    const unifiedVal = parseFloat(localStorage.getItem(unifiedKey));
    if (!isNaN(unifiedVal)) return unifiedVal;

    const legacyVal = parseFloat(localStorage.getItem(legacyKey));
    if (!isNaN(legacyVal)) return legacyVal;

    return 0;
}

function getBaseDietTargetForDate(dateObj) {
    const greekDays = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
    const dayName = greekDays[dateObj.getDay()];

    const settings = (typeof window.getPegasusSettings === "function")
        ? window.getPegasusSettings()
        : { activeSplit: "IRON" };

    const activePlan = settings.activeSplit || "IRON";

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
}

function calculateDailyCalorieTarget(dateObj) {
    const baseTarget = getBaseDietTargetForDate(dateObj);
    const cardioBurn = getCardioOffsetForDate(dateObj);
    return Math.round(baseTarget + cardioBurn);
}

window.updateFoodUI = function() {
    const dateStr = window.getStrictDateStr();
    const display = document.getElementById('currentFoodDateDisplay');
    if (display) display.textContent = dateStr;

    const logPrefix = M?.nutrition?.log_prefix || "food_log_";
    const logKey = logPrefix + dateStr;
    const foodLog = JSON.parse(localStorage.getItem(logKey) || "[]");

    const listContainer = document.getElementById('todayFoodList');
    if (!listContainer) return;

    listContainer.innerHTML = "";
    let totalKcal = 0;
    let totalProtein = 0;

    foodLog.forEach((item, index) => {
        totalKcal += parseFloat(item.kcal) || 0;
        totalProtein += parseFloat(item.protein) || 0;

        const div = document.createElement('div');
        div.className = 'food-item';
        div.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#111; padding:10px; margin-bottom:5px; border-left:3px solid #4CAF50; border-radius:4px;";
        div.innerHTML = `
            <div style="display: flex; flex-direction: column; flex: 1;">
                <span style="font-weight: bold; color: #eee; font-size: 14px;">${item.name}</span>
                <span style="font-size: 11px; color: #4CAF50;">${item.kcal} kcal | ${item.protein}g P</span>
            </div>
            <button class="delete-btn" onclick="deleteFoodItem(${index})">✕</button>
        `;
        listContainer.appendChild(div);
    });

    const todayProtKey = M?.diet?.todayProtein || "pegasus_today_protein";
    localStorage.setItem(todayProtKey, totalProtein.toFixed(0));

    const kcalNum = document.getElementById('todayTotalKcal');
    if (kcalNum) kcalNum.textContent = totalKcal.toFixed(0);

    updateProgressBars(totalKcal, totalProtein);

    if (typeof window.filterLibrary === "function") window.filterLibrary();
    if (typeof window.renderKoukiMenu === "function") window.renderKoukiMenu();
};

window.addFoodItem = function(name, kcal, protein) {
    const dateStr = window.getStrictDateStr();
    const logPrefix = M?.nutrition?.log_prefix || "food_log_";
    const logKey = logPrefix + dateStr;
    let foodLog = JSON.parse(localStorage.getItem(logKey) || "[]");

    foodLog.unshift({
        name: name,
        kcal: parseFloat(kcal),
        protein: parseFloat(protein || 0)
    });

    localStorage.setItem(logKey, JSON.stringify(foodLog));

    if (window.PegasusInventoryPC) {
        window.PegasusInventoryPC.processEntry(name);
    } else {
        if (name.toLowerCase().includes("πρωτεΐνη") && window.consumeSupp) {
            window.consumeSupp('prot', 30, false);
        }
    }

    if (typeof window.addToLibrary === "function") window.addToLibrary(name, kcal, protein);

    const searchInput = document.getElementById('librarySearch');
    if (searchInput) searchInput.value = "";

    window.updateFoodUI();
    if (window.PegasusCloud) window.PegasusCloud.push(true);
};

window.deleteFoodItem = function(index) {
    const dateStr = window.getStrictDateStr();
    const logPrefix = M?.nutrition?.log_prefix || "food_log_";
    const logKey = logPrefix + dateStr;

    let foodLog = JSON.parse(localStorage.getItem(logKey) || "[]");
    foodLog.splice(index, 1);
    localStorage.setItem(logKey, JSON.stringify(foodLog));

    window.updateFoodUI();
    if (window.PegasusCloud) window.PegasusCloud.push(true);
};

function updateProgressBars(kcal, protein) {
    const goalKcal = calculateDailyCalorieTarget(window.currentFoodDate);
    const goalProtein = 160;

    const kBar = document.getElementById('kcalBar');
    const pBar = document.getElementById('proteinBar');

    if (kBar) {
        const kcalRatio = goalKcal > 0 ? Math.min((kcal / goalKcal) * 100, 100) : 0;
        kBar.style.width = kcalRatio + "%";
    }

    if (pBar) {
        const protRatio = goalProtein > 0 ? Math.min((protein / goalProtein) * 100, 100) : 0;
        pBar.style.width = protRatio + "%";
    }

    const kStat = document.getElementById('kcalStatus');
    const pStat = document.getElementById('proteinStatus');

    if (kStat) kStat.textContent = `${Math.round(kcal)} / ${goalKcal} kcal`;
    if (pStat) pStat.textContent = `${Math.round(protein)} / ${goalProtein}g`;
}

/* === PEGASUS FOOD ENGINE: DYNAMIC KOUKI INTEGRATION (v9.9) === */
window.renderKoukiMenu = function() {
    const container = document.getElementById('koukiQuickMenu');
    if (!container) return;

    const daysMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const targetDate = window.currentFoodDate || new Date();
    const targetDayKey = daysMap[targetDate.getDay()];

    const greekDays = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
    const targetDayName = greekDays[targetDate.getDay()];

    const todayMenu = (typeof KOUKI_MASTER_MENU !== 'undefined') ? KOUKI_MASTER_MENU[targetDayKey] : [];

    container.innerHTML = `
        <h4 style="color: #4CAF50; border-bottom: 1px solid #333; padding-bottom: 5px; margin-top: 15px; font-size: 13px; font-weight: bold;">📍 ${targetDayName.toUpperCase()} (ΚΟΥΚΙ)</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; width: 100%;">
            ${todayMenu.map(item => {
                let protein, kcal;

                if (typeof window.getPegasusMacros === "function") {
                    const macros = window.getPegasusMacros(item.n, item.t);
                    protein = macros.protein;
                    kcal = macros.kcal;
                } else {
                    protein = (item.t === 'kreas' || item.t === 'poulika') ? 45 : (item.t === 'ospro' ? 18 : 25);
                    kcal = (item.p >= 6.5) ? 680 : 520;
                    if (item.n === "Μουσακάς") { kcal = 830; protein = 26; }
                    if (item.n === "Παστίτσιο") { kcal = 750; protein = 35; }
                }

                const safeName = String(item.n).replace(/'/g, "\\'");

                return `
                <button onclick="window.addFoodItem('${safeName} (Κούκι)', ${kcal}, ${protein})"
                        style="background: #0a0a0a; border: 1px solid #333; color: #eee; padding: 12px 10px; border-radius: 8px; font-size: 11px; cursor: pointer; text-align: left; transition: 0.2s;">
                    <div style="color: #eee; font-weight: bold; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 12px;">
                        ${item.n}
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 3px;">
                        <span style="color: #4CAF50; font-weight: bold; font-size: 10px; letter-spacing: 0.5px;">🔥 ${kcal} KCAL</span>
                        <span style="color: #81C784; font-weight: bold; font-size: 10px; letter-spacing: 0.5px;">🍗 ${protein}G PROTEIN</span>
                    </div>
                </button>
                `;
            }).join('')}
        </div>
    `;
};

window.addQuickFood = function(name, kcal, protein) {
    const nameInp = document.getElementById('foodName');
    const kcalInp = document.getElementById('foodKcal');
    const protInp = document.getElementById('foodNote');
    const addBtn = document.getElementById('btnAddFood');

    if (nameInp && kcalInp && protInp && addBtn) {
        nameInp.value = name;
        kcalInp.value = kcal;
        protInp.value = protein;
        addBtn.click();
    }
};

// 🎯 FIXED: Attached to window to avoid scope leaks in inline HTML event handlers
window.filterLibrary = function() {
    const searchTerm = document.getElementById('librarySearch')?.value.toLowerCase() || "";
    const libKey = M?.diet?.foodLibrary || "pegasus_food_library";
    const library = JSON.parse(localStorage.getItem(libKey) || "[]");

    const libContainer = document.getElementById('libraryFoodList');
    if (!libContainer) return;

    libContainer.innerHTML = "";

    library
        .filter(item => item.name.toLowerCase().includes(searchTerm))
        .forEach(item => {
            const safeName = String(item.name).replace(/'/g, "\\'");

            const wrapper = document.createElement('div');
            wrapper.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#111; padding:10px; margin-bottom:5px; border:1px solid #4CAF50; border-radius:4px;";
            wrapper.innerHTML = `
                <div style="display: flex; flex-direction: column; flex: 1; cursor: pointer;" onclick="window.addFoodItem('${safeName}', ${item.kcal}, ${item.protein})">
                    <span style="font-weight: bold; color: #eee; font-size: 14px;">+ ${item.name}</span>
                    <span style="font-size: 11px; color: #4CAF50;">${item.kcal} kcal | ${item.protein || 0}g P</span>
                </div>
                <button class="delete-btn" onclick="window.removeFromLibrary('${safeName}')">✕</button>
            `;
            libContainer.appendChild(wrapper);
        });
};

// 🎯 FIXED: Window Scope Attachment
window.addToLibrary = function(name, kcal, protein) {
    const libKey = M?.diet?.foodLibrary || "pegasus_food_library";
    let library = JSON.parse(localStorage.getItem(libKey) || "[]");

    if (!library.some(item => item.name.toLowerCase() === name.toLowerCase())) {
        library.push({
            name: name,
            kcal: kcal,
            protein: parseFloat(protein || 0)
        });
        localStorage.setItem(libKey, JSON.stringify(library));
    }
};

// 🎯 FIXED: Window Scope Attachment
window.removeFromLibrary = function(name) {
    const libKey = M?.diet?.foodLibrary || "pegasus_food_library";
    let library = JSON.parse(localStorage.getItem(libKey) || "[]");

    library = library.filter(item => item.name !== name);
    localStorage.setItem(libKey, JSON.stringify(library));
    window.filterLibrary();
};

window.renderFood = window.updateFoodUI;
