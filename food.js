/* ==========================================================================
   PEGASUS FOOD ENGINE - v9.3 (DYNAMIC KOUKI INTEGRATED)
   Protocol: Strict Data Mapping via window.PegasusManifest
   Status: FINAL STABLE | SYNTAX FIXED | DYNAMIC MENU ACTIVE
   ========================================================================== */

const M = window.PegasusManifest;
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

window.getStrictDateStr = function() {
    const currentSystemDate = new Date().toDateString();
    if (window.lastKnownSystemDate !== currentSystemDate) {
        if (window.currentFoodDate && window.currentFoodDate.toDateString() === window.lastKnownSystemDate) {
            window.currentFoodDate = new Date();
            localStorage.setItem(M.workout.cardio_offset, "0");
            console.log("PEGASUS GUARD: Midnight Rollover & Metabolic Reset.");
        }
        window.lastKnownSystemDate = currentSystemDate;
    }
    const d = window.currentFoodDate || new Date();
    return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
};

function getDynamicBMR() {
    const w = parseFloat(localStorage.getItem(M.user.weight)) || 74;
    const h = parseFloat(localStorage.getItem(M.user.height)) || 187;
    const a = parseInt(localStorage.getItem(M.user.age)) || 38;
    const g = localStorage.getItem(M.user.gender) || "male";
    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    return (g === "male") ? bmr + 5 : bmr - 161;
}

function calculateDailyCalorieTarget(dateObj) {
    const dayOfWeek = dateObj.getDay(); 
    const workoutKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    const workoutsDone = JSON.parse(localStorage.getItem(M.workout.done) || "{}");
    const hasWorkedOut = workoutsDone[workoutKey] === true;
    const isRecoveryDay = (dayOfWeek === 1 || dayOfWeek === 4) && !hasWorkedOut;
    const activityMultiplier = isRecoveryDay ? 1.2 : 1.55;
    const cardioBurn = parseFloat(localStorage.getItem(M.workout.cardio_offset)) || 0;
    const baseKcal = getDynamicBMR() * activityMultiplier;
    return Math.round(baseKcal + cardioBurn);
}

window.updateFoodUI = function() {
    const dateStr = window.getStrictDateStr();
    const display = document.getElementById('currentFoodDateDisplay');
    if (display) display.textContent = dateStr;

    const logKey = M.nutrition.log_prefix + dateStr;
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

    localStorage.setItem(M.nutrition.today_kcal, totalKcal.toFixed(0));
    localStorage.setItem(M.nutrition.today_protein, totalProtein.toFixed(0));
    const kcalNum = document.getElementById('todayTotalKcal');
    if (kcalNum) kcalNum.textContent = totalKcal.toFixed(0);
    
    updateProgressBars(totalKcal, totalProtein);
    if (typeof window.filterLibrary === "function") window.filterLibrary(); 
    if (typeof window.renderKoukiMenu === "function") window.renderKoukiMenu();
};

window.addFoodItem = function(name, kcal, protein) {
    const dateStr = window.getStrictDateStr();
    const logKey = M.nutrition.log_prefix + dateStr;
    let foodLog = JSON.parse(localStorage.getItem(logKey) || "[]");
    
    foodLog.unshift({ name, kcal: parseFloat(kcal), protein: parseFloat(protein || 0) });
    localStorage.setItem(logKey, JSON.stringify(foodLog));

    // 🛡️ CALL INVENTORY GUARD (Modular Link)
    if (window.PegasusInventoryPC) {
        window.PegasusInventoryPC.processEntry(name);
    } else {
        // Fallback αν δεν έχει φορτώσει το αρχείο ακόμα
        if (name.toLowerCase().includes("πρωτεΐνη") && window.consumeSupp) {
            window.consumeSupp('prot', 30, false); 
        }
    }

    if (typeof addToLibrary === "function") addToLibrary(name, kcal, protein);
    
    const searchInput = document.getElementById('librarySearch');
    if (searchInput) searchInput.value = "";

    window.updateFoodUI();
    
    // Trigger Cloud Push
    if (window.PegasusCloud) window.PegasusCloud.push(true);
};

window.deleteFoodItem = function(index) {
    const dateStr = window.getStrictDateStr();
    const logKey = M.nutrition.log_prefix + dateStr;
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
    if (kBar) kBar.style.width = Math.min((kcal / goalKcal) * 100, 100) + "%";
    if (pBar) pBar.style.width = Math.min((protein / goalProtein) * 100, 100) + "%";
    const kStat = document.getElementById('kcalStatus');
    const pStat = document.getElementById('proteinStatus');
    if (kStat) kStat.textContent = `${Math.round(kcal)} / ${goalKcal} kcal`;
    if (pStat) pStat.textContent = `${Math.round(protein)} / ${goalProtein}g`;
}

/* === PEGASUS FOOD ENGINE: DYNAMIC KOUKI INTEGRATION (v9.3) === */
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
                let protein = (item.t === 'kreas' || item.t === 'poulika') ? 45 : (item.t === 'ospro' ? 18 : 25);
                let kcal = (item.p >= 6.5) ? 680 : 520;

                return `
                <button onclick="window.addKoukiToLog('${item.n}', ${item.p})" 
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

window.filterLibrary = function() {
    const searchTerm = document.getElementById('librarySearch')?.value.toLowerCase() || "";
    const libKey = M.nutrition.library;
    const library = JSON.parse(localStorage.getItem(libKey) || "[]");
    const libContainer = document.getElementById('libraryFoodList');
    if (!libContainer) return;
    libContainer.innerHTML = "";
    library.filter(item => item.name.toLowerCase().includes(searchTerm)).forEach(item => {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#111; padding:10px; margin-bottom:5px; border:1px solid #4CAF50; border-radius:4px;";
        wrapper.innerHTML = `
            <div style="display: flex; flex-direction: column; flex: 1; cursor: pointer;" onclick="addFoodItem('${item.name}', ${item.kcal}, ${item.protein})">
                <span style="font-weight: bold; color: #eee; font-size: 14px;">+ ${item.name}</span>
                <span style="font-size: 11px; color: #4CAF50;">${item.kcal} kcal | ${item.protein || 0}g P</span>
            </div>
            <button class="delete-btn" onclick="removeFromLibrary('${item.name}')">✕</button>
        `;
        libContainer.appendChild(wrapper);
    });
};

function addToLibrary(name, kcal, protein) {
    const libKey = M.nutrition.library;
    let library = JSON.parse(localStorage.getItem(libKey) || "[]");
    if (!library.some(item => item.name.toLowerCase() === name.toLowerCase())) {
        library.push({ name, kcal, protein: parseFloat(protein || 0) });
        localStorage.setItem(libKey, JSON.stringify(library));
    }
}

function removeFromLibrary(name) {
    const libKey = M.nutrition.library;
    let library = JSON.parse(localStorage.getItem(libKey) || "[]");
    library = library.filter(item => item.name !== name);
    localStorage.setItem(libKey, JSON.stringify(library));
    window.filterLibrary();
}

window.renderFood = window.updateFoodUI;
