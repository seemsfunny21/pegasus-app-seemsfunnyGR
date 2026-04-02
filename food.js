/* ==========================================================================
   PEGASUS FOOD ENGINE - v9.6 (FULL INTEGRATION EDITION)
   Protocol: Strict Data Mapping & Unified Intelligence
   Features: 30-Meal Agreement Counter | Auto-Advisor | Kouki Menu
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
            if (nameEl?.value && kcalEl?.value) {
                addFoodItem(nameEl.value, kcalEl.value, protEl?.value || 0);
                nameEl.value = ""; kcalEl.value = ""; protEl.value = "";
            } else {
                alert("PEGASUS STRICT: Συμπλήρωσε Φαγητό και Θερμίδες!");
            }
        };
    }

    const prevBtn = document.getElementById('btnPrevDay');
    const nextBtn = document.getElementById('btnNextDay');
    if (prevBtn) prevBtn.onclick = () => changeFoodDate(-1);
    if (nextBtn) nextBtn.onclick = () => changeFoodDate(1);
    
    const searchInput = document.getElementById('librarySearch');
    if (searchInput) searchInput.oninput = () => window.filterLibrary();
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
        }
        window.lastKnownSystemDate = currentSystemDate;
    }
    const d = window.currentFoodDate || new Date();
    return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
};

// 🤝 1. KOUKI AGREEMENT COUNTER ENGINE
window.updateAgreementUI = function() {
    const agreementLog = JSON.parse(localStorage.getItem('kouki_agreement_log') || "[]");
    const count = agreementLog.length;
    const display = document.getElementById('agreementStatus');
    if (display) {
        display.textContent = `${count} / 30`;
        display.style.color = (count >= 25) ? "#ff4444" : "#eee";
    }
};

window.updateFoodUI = function() {
    const dateStr = window.getStrictDateStr();
    const display = document.getElementById('currentFoodDateDisplay');
    if (display) display.textContent = dateStr;

    const logKey = M.nutrition.log_prefix + dateStr;
    const foodLog = JSON.parse(localStorage.getItem(logKey) || "[]");
    const listContainer = document.getElementById('todayFoodList');
    if (!listContainer) return;
    
    listContainer.innerHTML = "";
    let totalKcal = 0, totalProtein = 0;

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
    
    updateProgressBars(totalKcal, totalProtein);
    if (typeof window.filterLibrary === "function") window.filterLibrary(); 
    
    // 🟢 2. AUTO-RENDER MENU & INTELLIGENCE
    if (typeof window.renderKoukiMenu === "function") {
        window.renderKoukiMenu();
        
        // 🧠 ADVISOR GAP ANALYSIS INTEGRATION
        if (window.PegasusDietAdvisor) {
            const recommendation = window.PegasusDietAdvisor.analyzeAndRecommend();
            const menuContainer = document.getElementById('koukiQuickMenu');
            if (menuContainer && recommendation) {
                const adviceHTML = `
                    <div id="aiAdvice" style="background: rgba(243, 156, 18, 0.1); border: 1px solid #f39c12; padding: 12px; border-radius: 8px; margin: 15px 0; font-size: 11px; color: #eee; line-height: 1.4;">
                        <span style="color: #f39c12; font-weight: bold;">🧠 PEGASUS ADVISOR:</span> ${recommendation.msg}
                    </div>`;
                menuContainer.insertAdjacentHTML('afterbegin', adviceHTML);
            }
        }
    }
    // 🤝 3. UPDATE AGREEMENT STATUS
    window.updateAgreementUI();
};

window.addFoodItem = function(name, kcal, protein) {
    const dateStr = window.getStrictDateStr();
    const logKey = M.nutrition.log_prefix + dateStr;
    let foodLog = JSON.parse(localStorage.getItem(logKey) || "[]");
    foodLog.unshift({ name, kcal: parseFloat(kcal), protein: parseFloat(protein || 0) });
    localStorage.setItem(logKey, JSON.stringify(foodLog));

    // 🤝 4. AGREEMENT LOGGING TRIGGER
    if (name.includes("(Κούκι)")) {
        let agreementLog = JSON.parse(localStorage.getItem('kouki_agreement_log') || "[]");
        agreementLog.push({ date: dateStr, food: name });
        localStorage.setItem('kouki_agreement_log', JSON.stringify(agreementLog));
    }

    if (window.PegasusInventoryPC) window.PegasusInventoryPC.processEntry(name);
    if (typeof addToLibrary === "function") addToLibrary(name, kcal, protein);
    window.updateFoodUI();
    if (window.PegasusCloud) window.PegasusCloud.push(true);
};

window.deleteFoodItem = function(index) {
    const dateStr = window.getStrictDateStr();
    const logKey = M.nutrition.log_prefix + dateStr;
    let foodLog = JSON.parse(localStorage.getItem(logKey) || "[]");
    
    // Safety check για τη συμφωνία αν διαγράφουμε Κούκι
    const itemToDelete = foodLog[index];
    if (itemToDelete && itemToDelete.name.includes("(Κούκι)")) {
        let agreementLog = JSON.parse(localStorage.getItem('kouki_agreement_log') || "[]");
        agreementLog.pop(); // Αφαιρούμε την τελευταία καταχώρηση συμφωνίας
        localStorage.setItem('kouki_agreement_log', JSON.stringify(agreementLog));
    }

    foodLog.splice(index, 1);
    localStorage.setItem(logKey, JSON.stringify(foodLog));
    window.updateFoodUI();
    if (window.PegasusCloud) window.PegasusCloud.push(true);
};

function updateProgressBars(kcal, protein) {
    const goalKcal = 2800; // Aligned with TDEE logic
    const kBar = document.getElementById('kcalBar');
    const pBar = document.getElementById('proteinBar');
    if (kBar) kBar.style.width = Math.min((kcal / goalKcal) * 100, 100) + "%";
    if (pBar) pBar.style.width = Math.min((protein / 160) * 100, 100) + "%";
    
    const kStat = document.getElementById('kcalStatus');
    const pStat = document.getElementById('proteinStatus');
    if (kStat) kStat.textContent = `${Math.round(kcal)} / ${goalKcal} kcal`;
    if (pStat) pStat.textContent = `${Math.round(protein)} / 160g`;
}

window.renderKoukiMenu = function() {
    const container = document.getElementById('koukiQuickMenu');
    if (!container) return;
    const daysMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const targetDayKey = daysMap[window.currentFoodDate.getDay()];
    const greekDays = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
    const todayMenu = (typeof KOUKI_MASTER_MENU !== 'undefined') ? KOUKI_MASTER_MENU[targetDayKey] : [];

    container.innerHTML = `
        <h4 style="color: #4CAF50; border-bottom: 1px solid #333; padding-bottom: 5px; margin-top: 15px; font-size: 13px; font-weight: bold;">📍 ${greekDays[window.currentFoodDate.getDay()].toUpperCase()} (ΚΟΥΚΙ)</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; width: 100%;">
            ${todayMenu.map(item => {
                let p = (item.t === 'kreas' || item.t === 'poulika') ? 45 : (item.t === 'ospro' ? 18 : 25);
                let k = (item.p >= 6.5) ? 680 : 520;
                return `<button onclick="window.addFoodItem('${item.n} (Κούκι)', ${k}, ${p})" 
                        style="background: #0a0a0a; border: 1px solid #333; color: #eee; padding: 12px 10px; border-radius: 8px; font-size: 11px; cursor: pointer; text-align: left;">
                    <div style="font-weight: bold; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 12px;">${item.n}</div>
                    <div style="color: #4CAF50; font-weight: bold; font-size: 10px;">🔥 ${k} KCAL | 🍗 ${p}G P</div>
                </button>`;
            }).join('')}
        </div>`;
};

window.filterLibrary = function() {
    const searchTerm = document.getElementById('librarySearch')?.value.toLowerCase() || "";
    const library = JSON.parse(localStorage.getItem(M.nutrition.library) || "[]");
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
            <button class="delete-btn" onclick="removeFromLibrary('${item.name}')">✕</button>`;
        libContainer.appendChild(wrapper);
    });
};

function addToLibrary(name, kcal, protein) {
    let library = JSON.parse(localStorage.getItem(M.nutrition.library) || "[]");
    if (!library.some(item => item.name.toLowerCase() === name.toLowerCase())) {
        library.push({ name, kcal, protein: parseFloat(protein || 0) });
        localStorage.setItem(M.nutrition.library, JSON.stringify(library));
    }
}

function removeFromLibrary(name) {
    let library = JSON.parse(localStorage.getItem(M.nutrition.library) || "[]");
    library = library.filter(item => item.name !== name);
    localStorage.setItem(M.nutrition.library, JSON.stringify(library));
    window.filterLibrary();
}
