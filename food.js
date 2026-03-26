/* ==========================================================================
   PEGASUS FOOD ENGINE - v9.1 (MODULAR / CUMULATIVE)
   Protocol: Strict Data Analyst - Full Calendar Integration & Sync
   ========================================================================== */

const PegasusFood = (function() {
    // 1. ΙΔΙΩΤΙΚΟ STATE (Private State)
    const USER_BMR = 1724; 
    let internalDate = new Date();
    let lastKnownSystemDate = new Date().toDateString();

    // 2. UTILITIES & STORAGE BRIDGE
    const getFormattedDateKey = (dateObj) => {
        const d = String(dateObj.getDate()).padStart(2, '0');
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const y = dateObj.getFullYear();
        return `${d}/${m}/${y}`;
    };

    const getStorageKey = (dateStr) => {
        return (window.PegasusStore && window.PegasusStore.keys.foodPrefix) 
            ? window.PegasusStore.keys.foodPrefix + dateStr 
            : 'food_log_' + dateStr;
    };

    // 3. CORE RENDERING ENGINE
    const renderFoodUI = () => {
        const dateStr = getFormattedDateKey(internalDate);
        const storageKey = getStorageKey(dateStr);
        const logArray = JSON.parse(localStorage.getItem(storageKey) || "[]");

        let totalKcal = 0;
        let totalProt = 0;
        logArray.forEach(item => {
            totalKcal += parseFloat(item.kcal || 0);
            totalProt += parseFloat(item.protein || 0);
        });

        // Ενημέρωση Labels (Κεφαλίδα Πάνελ)
        const dateDisplay = document.getElementById('currentFoodDateDisplay');
        if (dateDisplay) dateDisplay.textContent = `ΔΙΑΤΡΟΦΗ: ${dateStr}`;

        // Ενημέρωση Progress Bars & Status
        const kcalStatus = document.getElementById('kcalStatus');
        const kcalBar = document.getElementById('kcalBar');
        const proteinStatus = document.getElementById('proteinStatus');
        const proteinBar = document.getElementById('proteinBar');

        const goalKcal = parseInt(localStorage.getItem("pegasus_goal_kcal")) || 2800;
        const goalProt = parseInt(localStorage.getItem("pegasus_goal_protein")) || 160;

        if (kcalStatus) kcalStatus.textContent = `${totalKcal.toFixed(0)} / ${goalKcal} kcal`;
        if (kcalBar) kcalBar.style.width = `${Math.min(100, (totalKcal / goalKcal) * 100)}%`;
        if (proteinStatus) proteinStatus.textContent = `${totalProt.toFixed(0)} / ${goalProt}g`;
        if (proteinBar) proteinBar.style.width = `${Math.min(100, (totalProt / goalProt) * 100)}%`;

        // Λίστα Γευμάτων (Σήμερα)
        const listContainer = document.getElementById('todayFoodList');
        if (listContainer) {
            listContainer.innerHTML = '';
            logArray.forEach(item => {
                const row = document.createElement('div');
                row.className = "food-item";
                row.innerHTML = `
                    <div style="flex:1;">
                        <div style="font-weight:bold; color:#fff;">${item.name}</div>
                        <div style="font-size:11px; color:#4CAF50;">🔥 ${item.kcal} kcal | 🥩 ${item.protein}g</div>
                    </div>
                    <button class="delete-btn" onclick="window.removeFoodEntry('${item.id}')">×</button>
                `;
                listContainer.appendChild(row);
            });
        }

        // Ενημέρωση Main Dashboard Kcal Value (Μόνο αν είναι σήμερα)
        const todayStr = getFormattedDateKey(new Date());
        if (dateStr === todayStr) {
            const kcalUI = document.querySelector(".kcal-value");
            if (kcalUI) kcalUI.textContent = totalKcal.toFixed(1);
            if (window.PegasusStore) window.PegasusStore.updateDailyTotals(totalKcal, totalProt);
        }

        renderLibrary();
    };

    const renderLibrary = () => {
        const libContainer = document.getElementById('libraryFoodList');
        if (!libContainer) return;
        const libKey = (window.PegasusStore) ? window.PegasusStore.keys.library : 'pegasus_food_library';
        const library = JSON.parse(localStorage.getItem(libKey) || "[]");

        libContainer.innerHTML = '';
        library.forEach(item => {
            const div = document.createElement('div');
            div.className = "food-item";
            div.style.cursor = "pointer";
            div.innerHTML = `
                <div style="flex:1;" onclick="window.addFoodEntry({name:'${item.name}', kcal:${item.kcal}, protein:${item.protein}})">
                    <div style="font-weight:bold;">${item.name}</div>
                    <div style="font-size:11px; opacity:0.7;">🔥 ${item.kcal} | 🥩 ${item.protein}g</div>
                </div>
            `;
            libContainer.appendChild(div);
        });
    };

    // 4. ACTION METHODS
    const addEntry = (itemData) => {
        const dateStr = getFormattedDateKey(internalDate);
        const storageKey = getStorageKey(dateStr);
        let logArray = JSON.parse(localStorage.getItem(storageKey) || "[]");

        const entry = {
            id: Date.now().toString(),
            name: itemData.name,
            kcal: parseFloat(itemData.kcal || 0),
            protein: parseFloat(itemData.protein || 0),
            timestamp: Date.now()
        };

        logArray.push(entry);
        localStorage.setItem(storageKey, JSON.stringify(logArray));
        
        // Auto-Library logic
        const libKey = (window.PegasusStore) ? window.PegasusStore.keys.library : 'pegasus_food_library';
        let lib = JSON.parse(localStorage.getItem(libKey) || "[]");
        if (!lib.some(i => i.name.toLowerCase() === entry.name.toLowerCase())) {
            lib.push({ name: entry.name, kcal: entry.kcal, protein: entry.protein });
            localStorage.setItem(libKey, JSON.stringify(lib));
        }

        renderFoodUI();
        if (window.PegasusCloud) window.PegasusCloud.push(true);
    };

    const removeEntry = (id) => {
        const dateStr = getFormattedDateKey(internalDate);
        const storageKey = getStorageKey(dateStr);
        let logArray = JSON.parse(localStorage.getItem(storageKey) || "[]");
        logArray = logArray.filter(i => i.id !== id);
        localStorage.setItem(storageKey, JSON.stringify(logArray));
        renderFoodUI();
    };

    // 5. PUBLIC API & CALENDAR BRIDGE
    return {
        init: () => {
            const btnAdd = document.getElementById('btnAddFood');
            if (btnAdd) {
                btnAdd.onclick = () => {
                    const n = document.getElementById('foodName');
                    const k = document.getElementById('foodKcal');
                    const p = document.getElementById('foodNote');
                    if (n.value && k.value) {
                        addEntry({ name: n.value, kcal: k.value, protein: p.value || 0 });
                        n.value = ""; k.value = ""; p.value = "";
                    }
                };
            }
            renderFoodUI();
        },
        render: renderFoodUI,
        add: addEntry,
        remove: removeEntry,
        setDate: (dateObj) => { internalDate = dateObj; renderFoodUI(); }
    };
})();

// GLOBAL BRIDGES (Crucial for HTML & Calendar)
window.renderFood = PegasusFood.render;
window.addFoodEntry = PegasusFood.add;
window.removeFoodEntry = PegasusFood.remove;

// Διόρθωση του Getter/Setter για το Ημερολόγιο
let _currentFoodDate = new Date();
Object.defineProperty(window, 'currentFoodDate', {
    get: function() { return _currentFoodDate; },
    set: function(val) { 
        if (val instanceof Date) {
            _currentFoodDate = val;
            PegasusFood.setDate(val); 
        }
    }
});

// Εκκίνηση
document.addEventListener('DOMContentLoaded', PegasusFood.init);
