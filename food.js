/* ==========================================================================
   PEGASUS FOOD ENGINE - FIXED IDs & SYNC VERSION
   ========================================================================== */

// Διασφάλιση ημερομηνίας
if (!(window.currentFoodDate instanceof Date) || isNaN(window.currentFoodDate.getTime())) {
    window.currentFoodDate = new Date();
}

document.addEventListener('DOMContentLoaded', () => {
    updateFoodUI();
    
    // Προσθήκη Φαγητού
    const btnAdd = document.getElementById('btnAddFood');
    if (btnAdd) {
        btnAdd.onclick = () => {
            const name = document.getElementById('foodName')?.value;
            const kcal = document.getElementById('foodKcal')?.value;
            const protein = document.getElementById('foodNote')?.value;
            if (name && kcal) {
                addFoodItem(name, kcal, protein);
                // Καθαρισμός πεδίων
                document.getElementById('foodName').value = "";
                document.getElementById('foodKcal').value = "";
                document.getElementById('foodNote').value = "";
            } else {
                alert("PEGASUS STRICT: Συμπλήρωσε Φαγητό και Θερμίδες!");
            }
        };
    }

    // Navigation
    const prevBtn = document.getElementById('btnPrevDay');
    const nextBtn = document.getElementById('btnNextDay');
    if (prevBtn) prevBtn.onclick = () => changeFoodDate(-1);
    if (nextBtn) nextBtn.onclick = () => changeFoodDate(1);
});

function changeFoodDate(days) {
    window.currentFoodDate.setDate(window.currentFoodDate.getDate() + days);
    updateFoodUI();
}

window.updateFoodUI = function() {
    const d = window.currentFoodDate;
    const dateStr = d.toLocaleDateString('el-GR');
    
    // Ενημέρωση τίτλου ημερομηνίας (αν υπάρχει το ID)
    const display = document.getElementById('currentFoodDateDisplay');
    if (display) display.textContent = dateStr;

    // ΠΡΟΣΟΧΗ: Χρησιμοποιούμε το κλειδί που περιμένει το υπόλοιπο σύστημα
    const storageKey = `food_log_${dateStr}`;
    const foodLog = JSON.parse(localStorage.getItem(storageKey) || "[]");

    const listContainer = document.getElementById('todayFoodList');
    if (!listContainer) return;
    
    listContainer.innerHTML = "";
    let totalKcal = 0;
    let totalProtein = 0;

    foodLog.forEach((item, index) => {
        totalKcal += parseFloat(item.kcal || 0);
        totalProtein += parseFloat(item.protein || 0);

        const div = document.createElement('div');
        div.className = 'food-item';
        div.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#111; padding:10px; margin-bottom:5px; border-left:3px solid #4CAF50; border-radius:4px;";
        div.innerHTML = `
            <div style="display: flex; flex-direction: column; flex: 1;">
                <span style="font-weight: bold; color: #eee; font-size: 14px;">${item.name}</span>
                <span style="font-size: 11px; color: #4CAF50;">${item.kcal} kcal | ${item.protein || 0}g P</span>
            </div>
            <button style="background:none; border:none; color:#ff4444; cursor:pointer; font-size:18px;" onclick="deleteFoodItem(${index})">✕</button>
        `;
        listContainer.appendChild(div);
    });

    // ΣΥΝΔΕΣΗ ΜΕ ΤΑ ΔΙΚΑ ΣΟΥ IDs (todayTotalKcal κλπ)
    const kcalNum = document.getElementById('todayTotalKcal');
    if (kcalNum) kcalNum.textContent = Math.round(totalKcal);
    
    const proteinNum = document.getElementById('todayTotalProtein'); // Αν υπάρχει αυτό το ID
    if (proteinNum) proteinNum.textContent = Math.round(totalProtein);
    
    updateProgressBars(totalKcal, totalProtein);
    window.filterLibrary(); 
};

function addFoodItem(name, kcal, protein) {
    const dateStr = window.currentFoodDate.toLocaleDateString('el-GR');
    const storageKey = `food_log_${dateStr}`;
    const foodLog = JSON.parse(localStorage.getItem(storageKey) || "[]");

    foodLog.push({ 
        name, 
        kcal: parseFloat(kcal), 
        protein: parseFloat(protein || 0) 
    });
    localStorage.setItem(storageKey, JSON.stringify(foodLog));

    addToLibrary(name, kcal, protein);
    updateFoodUI();
}

window.deleteFoodItem = function(index) {
    const dateStr = window.currentFoodDate.toLocaleDateString('el-GR');
    const storageKey = `food_log_${dateStr}`;
    let foodLog = JSON.parse(localStorage.getItem(storageKey) || "[]");
    foodLog.splice(index, 1);
    localStorage.setItem(storageKey, JSON.stringify(foodLog));
    updateFoodUI();
};

function updateProgressBars(kcal, protein) {
    const goalKcal = 2647; // Ο δικός σου αυστηρός στόχος
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

/* --- LIBRARY LOGIC --- */
window.filterLibrary = function() {
    const searchTerm = document.getElementById('librarySearch')?.value.toLowerCase() || "";
    const library = JSON.parse(localStorage.getItem('food_library') || "[]");
    const libContainer = document.getElementById('libraryFoodList');
    if (!libContainer) return;
    
    libContainer.innerHTML = "";

    library.filter(item => item.name.toLowerCase().includes(searchTerm)).forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'p-btn';
        btn.style.cssText = "width:100%; margin-bottom:5px; text-align:left; font-size:12px; display: block; padding: 10px; background:#050505; color:#4CAF50; border:1px solid #222; cursor:pointer;";
        btn.textContent = `+ ${item.name} (${item.kcal} kcal)`;
        btn.onclick = () => addFoodItem(item.name, item.kcal, item.protein);
        libContainer.appendChild(btn);
    });
};

function addToLibrary(name, kcal, protein) {
    let library = JSON.parse(localStorage.getItem('food_library') || "[]");
    if (!library.some(item => item.name.toLowerCase() === name.toLowerCase())) {
        library.push({ name, kcal, protein: parseFloat(protein || 0) });
        localStorage.setItem('food_library', JSON.stringify(library));
    }
}

// Alias για συμβατότητα με το calendar.js
window.renderFood = window.updateFoodUI;