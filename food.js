/* ==========================================================================
   PEGASUS FOOD ENGINE - CLEAN SWEEP v17.0
   Protocol: Midnight Rollover Guard | Logic: Unified Store Integration
   ========================================================================== */

const USER_BMR_BASE = 1724;

if (!(window.currentFoodDate instanceof Date) || isNaN(window.currentFoodDate.getTime())) {
    window.currentFoodDate = new Date();
}

window.lastKnownSystemDate = new Date().toDateString();

document.addEventListener('DOMContentLoaded', () => {
    window.updateFoodUI();
    
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
                window.addFoodItem(name, kcal, protein);
                if (nameEl) nameEl.value = "";
                if (kcalEl) kcalEl.value = "";
                if (protEl) protEl.value = "";
            } else {
                alert("PEGASUS STRICT: Συμπλήρωσε Φαγητό και Θερμίδες!");
            }
        };
    }

    // Navigation Listeners
    const prevBtn = document.getElementById('btnPrevDay');
    const nextBtn = document.getElementById('btnNextDay');
    if (prevBtn) prevBtn.onclick = () => window.changeFoodDate(-1);
    if (nextBtn) nextBtn.onclick = () => window.changeFoodDate(1);
    
    // Quick Menu & Search
    const btnFoodUI = document.getElementById('btnFoodUI');
    if (btnFoodUI) {
        btnFoodUI.addEventListener('click', () => {
            setTimeout(() => { if(window.renderKoukiMenu) window.renderKoukiMenu(); }, 300);
        });
    }

    const searchInput = document.getElementById('librarySearch');
    if (searchInput) {
        searchInput.oninput = () => window.filterLibrary();
    }
});

window.changeFoodDate = function(days) {
    window.currentFoodDate.setDate(window.currentFoodDate.getDate() + days);
    window.updateFoodUI();
};

window.getStrictDateStr = function() {
    const currentSystemDate = new Date().toDateString();
    if (window.lastKnownSystemDate !== currentSystemDate) {
        if (window.currentFoodDate && window.currentFoodDate.toDateString() === window.lastKnownSystemDate) {
            window.currentFoodDate = new Date();
        }
        window.lastKnownSystemDate = currentSystemDate;
    }
    const d = window.currentFoodDate || new Date();
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

function getDynamicBMR() {
    const w = parseFloat(localStorage.getItem("pegasus_weight")) || 74;
    const h = parseFloat(localStorage.getItem("pegasus_height")) || 187;
    const a = parseInt(localStorage.getItem("pegasus_age")) || 38;
    const g = localStorage.getItem("pegasus_gender") || "male";
    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    return (g === "male") ? bmr + 5 : bmr - 161;
}

function calculateDailyCalorieTarget(dateObj) {
    const dateStr = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
    const dayOfWeek = dateObj.getDay(); 
    const workoutKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    const workoutsDone = JSON.parse(localStorage.getItem("pegasus_workouts_done") || "{}");
    const hasWorkedOut = workoutsDone[workoutKey] === true;
    
    // Recovery Logic: Δευτέρα (1) & Πέμπτη (4)
    const isRecoveryDay = (dayOfWeek === 1 || dayOfWeek === 4) && !hasWorkedOut;
    const activityMultiplier = isRecoveryDay ? 1.2 : 1.55;
    
    const cardioData = JSON.parse(localStorage.getItem(`cardio_log_${dateStr}`) || "null");
    const cardioBurn = cardioData ? parseInt(cardioData.kcal, 10) || 0 : 0;

    return Math.round((getDynamicBMR() * activityMultiplier) + cardioBurn);
}

window.updateFoodUI = function() {
    const dateStr = window.getStrictDateStr();
    const display = document.getElementById('currentFoodDateDisplay');
    if (display) display.textContent = dateStr;

    const foodLog = window.PegasusStore ? window.PegasusStore.getFoodLog(dateStr) : JSON.parse(localStorage.getItem(`food_log_${dateStr}`) || "[]");
    const listContainer = document.getElementById('todayFoodList');
    if (!listContainer) return;
    
    listContainer.innerHTML = "";
    let totalKcal = 0, totalProtein = 0;

    foodLog.forEach((item, index) => {
        totalKcal += parseFloat(item.kcal || 0);
        totalProtein += parseFloat(item.protein || 0);
        const div = document.createElement('div');
        div.className = 'food-item';
        div.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#0a0a0a; padding:12px; margin-bottom:6px; border-left:3px solid #4CAF50; border-radius:6px; border:1px solid #1a1a1a;";
        div.innerHTML = `
            <div style="display: flex; flex-direction: column; flex: 1;">
                <span style="font-weight: 900; color: #eee; font-size: 13px; text-transform: uppercase;">${item.name}</span>
                <span style="font-size: 11px; color: #4CAF50; font-weight: bold;">${item.kcal} KCAL | ${item.protein || 0}G P</span>
            </div>
            <button style="background:none; border:none; color:#444; font-size:16px; cursor:pointer; padding:5px 10px;" onclick="window.deleteFoodItem(${index})">✕</button>
        `;
        listContainer.appendChild(div);
    });

    if (window.PegasusStore && window.PegasusStore.updateDailyTotals) {
        window.PegasusStore.updateDailyTotals(totalKcal, totalProtein);
    } else {
        localStorage.setItem("pegasus_today_kcal", Math.round(totalKcal).toString());
        localStorage.setItem("pegasus_today_protein", Math.round(totalProtein).toString());
    }

    document.getElementById('todayTotalKcal') && (document.getElementById('todayTotalKcal').textContent = Math.round(totalKcal));
    document.getElementById('todayTotalProtein') && (document.getElementById('todayTotalProtein').textContent = Math.round(totalProtein));
    
    window.updateProgressBars(totalKcal, totalProtein);
    if (window.filterLibrary) window.filterLibrary(); 
    if (window.renderKoukiMenu) window.renderKoukiMenu();
};

window.addFoodItem = function(name, kcal, protein) {
    const dateStr = window.getStrictDateStr();
    let foodLog = window.PegasusStore ? window.PegasusStore.getFoodLog(dateStr) : JSON.parse(localStorage.getItem(`food_log_${dateStr}`) || "[]");
    
    foodLog.unshift({ name, kcal: parseFloat(kcal), protein: parseFloat(protein || 0) });
    
    if (window.PegasusStore) window.PegasusStore.saveFoodLog(dateStr, foodLog);
    else localStorage.setItem(`food_log_${dateStr}`, JSON.stringify(foodLog));

    if (window.addToLibrary) window.addToLibrary(name, kcal, protein);
    window.updateFoodUI();
    
    if (window.PegasusCloud && window.PegasusCloud.isUnlocked) window.PegasusCloud.push(true);
};

window.deleteFoodItem = function(index) {
    const dateStr = window.getStrictDateStr();
    let foodLog = window.PegasusStore ? window.PegasusStore.getFoodLog(dateStr) : JSON.parse(localStorage.getItem(`food_log_${dateStr}`) || "[]");
    foodLog.splice(index, 1);
    
    if (window.PegasusStore) window.PegasusStore.saveFoodLog(dateStr, foodLog);
    else localStorage.setItem(`food_log_${dateStr}`, JSON.stringify(foodLog));
    
    window.updateFoodUI();
    if (window.PegasusCloud && window.PegasusCloud.isUnlocked) window.PegasusCloud.push(true);
};

window.updateProgressBars = function(kcal, protein) {
    const goalKcal = calculateDailyCalorieTarget(window.currentFoodDate); 
    const goalProtein = 160; 
    
    const kBar = document.getElementById('kcalBar');
    const pBar = document.getElementById('proteinBar');
    
    if (kBar) kBar.style.width = `${Math.min((kcal / goalKcal) * 100, 100)}%`;
    if (pBar) pBar.style.width = `${Math.min((protein / goalProtein) * 100, 100)}%`;
    
    const kStat = document.getElementById('kcalStatus');
    const pStat = document.getElementById('proteinStatus');
    
    if (kStat) kStat.textContent = `${Math.round(kcal)} / ${goalKcal} kcal`;
    if (pStat) pStat.textContent = `${Math.round(protein)} / ${goalProtein}g`;
};

window.renderFood = window.updateFoodUI;