/* ==========================================================================
   PEGASUS FOOD ENGINE - v9.0 (MODULAR / FULLY DECOUPLED)
   Protocol: Strict Data Analyst - Isolated Rollover & Storage
   ========================================================================== */

const PegasusFood = (function() {
    // 1. ΙΔΙΩΤΙΚΟ STATE (Private State & Constants)
    const USER_BMR = 1724; // Βάσει: 74kg, 187cm, 38y
    let internalDate = new Date();
    let lastKnownSystemDate = new Date().toDateString();

    // 2. ΕΣΩΤΕΡΙΚΕΣ ΛΕΙΤΟΥΡΓΙΕΣ (Private Methods)
    const checkMidnightRollover = () => {
        const todayStr = new Date().toDateString();
        if (lastKnownSystemDate !== todayStr) {
            lastKnownSystemDate = todayStr;
            internalDate = new Date();
            console.log("[PEGASUS FOOD]: Midnight Rollover Detected. System date reset.");
            updateUI();
        }
    };

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

    const updateTotals = (logArray) => {
        let totalKcal = 0;
        let totalProt = 0;
        logArray.forEach(item => {
            totalKcal += parseFloat(item.kcal || 0);
            totalProt += parseFloat(item.protein || 0);
        });

        // Αποθήκευση μόνο αν η ημερομηνία προβολής είναι η σημερινή
        const todayStr = getFormattedDateKey(new Date());
        const viewStr = getFormattedDateKey(internalDate);
        
        if (todayStr === viewStr) {
            if (window.PegasusStore) {
                window.PegasusStore.updateDailyTotals(totalKcal, totalProt);
            } else {
                localStorage.setItem("pegasus_diet_kcal", totalKcal.toFixed(1));
                localStorage.setItem("pegasus_today_protein", totalProt.toFixed(1));
            }
        }
        return { totalKcal, totalProt };
    };

    const addToLibrary = (name, kcal, protein) => {
        const libKey = (window.PegasusStore) ? window.PegasusStore.keys.library : 'pegasus_food_library';
        let library = JSON.parse(localStorage.getItem(libKey) || "[]");
        
        if (!library.some(item => item.name.toLowerCase() === name.toLowerCase())) {
            library.push({ name, kcal: parseFloat(kcal), protein: parseFloat(protein || 0) });
            localStorage.setItem(libKey, JSON.stringify(library));
            renderLibrary();
        }
    };

    const removeFromLibrary = (name) => {
        const libKey = (window.PegasusStore) ? window.PegasusStore.keys.library : 'pegasus_food_library';
        let library = JSON.parse(localStorage.getItem(libKey) || "[]");
        library = library.filter(item => item.name !== name);
        localStorage.setItem(libKey, JSON.stringify(library));
        renderLibrary();
    };

    const renderLibrary = () => {
        const libContainer = document.getElementById('foodLibraryList');
        if (!libContainer) return;
        
        libContainer.innerHTML = '';
        const libKey = (window.PegasusStore) ? window.PegasusStore.keys.library : 'pegasus_food_library';
        const library = JSON.parse(localStorage.getItem(libKey) || "[]");

        library.forEach(item => {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#111; padding:10px; border-radius:5px; border:1px solid #222; margin-bottom:5px;";
            
            const infoDiv = document.createElement('div');
            infoDiv.style.cssText = "flex:1; cursor:pointer;";
            infoDiv.innerHTML = `<div style="color:#fff; font-size:14px; font-weight:bold;">${item.name}</div><div style="color:#aaa; font-size:12px;">🔥 ${item.kcal} kcal | 🥩 ${item.protein}g</div>`;
            infoDiv.addEventListener('click', () => addFoodEntry({ name: item.name, kcal: item.kcal, protein: item.protein }));

            const btnDel = document.createElement('div');
            btnDel.innerHTML = "✖";
            btnDel.style.cssText = "border:1px solid #4CAF50; color:#4CAF50; cursor:pointer; font-size:14px; width:25px; height:25px; display:flex; align-items:center; justify-content:center; border-radius:3px; margin-left:10px;";
            btnDel.addEventListener('mouseover', () => { btnDel.style.color = "#ff4444"; btnDel.style.borderColor = "#ff4444"; });
            btnDel.addEventListener('mouseout', () => { btnDel.style.color = "#4CAF50"; btnDel.style.borderColor = "#4CAF50"; });
            btnDel.addEventListener('click', (e) => { e.stopPropagation(); removeFromLibrary(item.name); });

            wrapper.appendChild(infoDiv);
            wrapper.appendChild(btnDel);
            libContainer.appendChild(wrapper);
        });
    };

    const addFoodEntry = (itemData) => {
        checkMidnightRollover();
        const dateStr = getFormattedDateKey(internalDate);
        const storageKey = getStorageKey(dateStr);
        
        let logArray = JSON.parse(localStorage.getItem(storageKey) || "[]");
        
        const entry = {
            id: Date.now().toString(),
            name: itemData.name || itemData.food || "Άγνωστο Γεύμα",
            kcal: parseFloat(itemData.kcal || 0),
            protein: parseFloat(itemData.protein || 0),
            note: itemData.note || "",
            timestamp: Date.now()
        };
        
        logArray.push(entry);
        localStorage.setItem(storageKey, JSON.stringify(logArray));
        
        // Αυτόματη αφαίρεση αποθέματος αν περιέχει πρωτεΐνη σκόνη
        if (entry.name.toLowerCase().includes("whey") && window.consumeDailySupplements) {
            window.consumeDailySupplements(entry.protein);
        }

        addToLibrary(entry.name, entry.kcal, entry.protein);
        updateUI();

        if (window.PegasusCloud && window.PegasusCloud.hasSuccessfullyPulled) {
            window.PegasusCloud.push(true);
        }
    };

    const removeFoodEntry = (entryId) => {
        const dateStr = getFormattedDateKey(internalDate);
        const storageKey = getStorageKey(dateStr);
        let logArray = JSON.parse(localStorage.getItem(storageKey) || "[]");
        
        logArray = logArray.filter(item => item.id !== entryId);
        localStorage.setItem(storageKey, JSON.stringify(logArray));
        
        updateUI();
        if (window.PegasusCloud && window.PegasusCloud.hasSuccessfullyPulled) {
            window.PegasusCloud.push(true);
        }
    };

    const updateUI = () => {
        checkMidnightRollover();
        
        // Συγχρονισμός με global date αν έχει τροποποιηθεί από το ημερολόγιο
        if (window.currentFoodDate instanceof Date && !isNaN(window.currentFoodDate)) {
            internalDate = window.currentFoodDate;
        }

        const dateStr = getFormattedDateKey(internalDate);
        const storageKey = getStorageKey(dateStr);
        const logArray = JSON.parse(localStorage.getItem(storageKey) || "[]");
        
        const { totalKcal, totalProt } = updateTotals(logArray);
        
        // Ενημέρωση DOM στοιχείων
        const dateDisplay = document.getElementById('foodDateDisplay');
        if (dateDisplay) dateDisplay.textContent = dateStr;

        const kcalDisplay = document.getElementById('foodTotalKcal');
        if (kcalDisplay) kcalDisplay.textContent = totalKcal.toFixed(1);

        const protDisplay = document.getElementById('foodTotalProt');
        if (protDisplay) protDisplay.textContent = totalProt.toFixed(1);

        const listContainer = document.getElementById('foodLogList');
        if (listContainer) {
            listContainer.innerHTML = '';
            if (logArray.length === 0) {
                listContainer.innerHTML = '<div style="text-align:center; color:#666; padding:20px;">Δεν υπάρχουν γεύματα.</div>';
            } else {
                logArray.forEach(item => {
                    const row = document.createElement('div');
                    row.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#1a1a1a; padding:12px; border-radius:5px; border-left:3px solid #4CAF50; margin-bottom:8px;";
                    row.innerHTML = `
                        <div>
                            <div style="color:#fff; font-weight:bold;">${item.name}</div>
                            <div style="color:#aaa; font-size:12px;">🔥 ${item.kcal} kcal | 🥩 ${item.protein}g</div>
                        </div>
                    `;
                    
                    const delBtn = document.createElement('button');
                    delBtn.textContent = "🗑️";
                    delBtn.style.cssText = "background:transparent; border:none; cursor:pointer; font-size:16px;";
                    delBtn.addEventListener('click', () => removeFoodEntry(item.id));
                    
                    row.appendChild(delBtn);
                    listContainer.appendChild(row);
                });
            }
        }
        renderLibrary();
    };

    const initListeners = () => {
        const btnAdd = document.getElementById('btnAddFood');
        if (btnAdd) {
            // Αφαίρεση τυχόν inline onclick
            btnAdd.removeAttribute('onclick'); 
            btnAdd.addEventListener('click', () => {
                const nameEl = document.getElementById('foodName');
                const kcalEl = document.getElementById('foodKcal');
                const protEl = document.getElementById('foodNote');
                
                if (nameEl?.value && kcalEl?.value) {
                    addFoodEntry({ name: nameEl.value, kcal: kcalEl.value, protein: protEl?.value || 0 });
                    nameEl.value = ""; kcalEl.value = ""; if(protEl) protEl.value = "";
                } else {
                    alert("PEGASUS STRICT: Συμπλήρωσε Φαγητό και Θερμίδες!");
                }
            });
        }
    };

    // 3. PUBLIC API
    return {
        init: () => {
            initListeners();
            updateUI();
        },
        addEntry: addFoodEntry,
        removeEntry: removeFoodEntry,
        updateUI: updateUI,
        renderLibrary: renderLibrary
    };
})();

// Εξαγωγή στο Window Scope για διασύνδεση με το Planner και το Ημερολόγιο
window.addEventListener('DOMContentLoaded', PegasusFood.init);
window.addFoodItem = (name, kcal, protein) => PegasusFood.addEntry({ name, kcal, protein });
window.addFoodEntry = PegasusFood.addEntry;
window.updateFoodUI = PegasusFood.updateUI;
window.renderFood = PegasusFood.updateUI;

// Proxy για την παρακολούθηση της μεταβλητής currentFoodDate από το calendar.js
Object.defineProperty(window, 'currentFoodDate', {
    get: function() { return new Date(); },
    set: function(dateObj) { 
        if (dateObj instanceof Date && !isNaN(dateObj)) {
            PegasusFood.updateUI(); // Εξαναγκασμός επανασχεδιασμού με τη νέα ημερομηνία
        }
    }
});