/* ==========================================================================
   PEGASUS FOOD ENGINE - DAILY MAINS ONLY (V3.4)
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
    
    // Hook για το Quick Menu
    const btnFoodUI = document.getElementById('btnFoodUI');
    if (btnFoodUI) {
        btnFoodUI.addEventListener('click', () => {
            setTimeout(window.renderKoukiMenu, 300);
        });
    }
});

function changeFoodDate(days) {
    window.currentFoodDate.setDate(window.currentFoodDate.getDate() + days);
    updateFoodUI();
}

window.updateFoodUI = function() {
    const d = window.currentFoodDate;
    const dateStr = d.toLocaleDateString('el-GR');
    
    const display = document.getElementById('currentFoodDateDisplay');
    if (display) display.textContent = dateStr;

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

    const kcalNum = document.getElementById('todayTotalKcal');
    if (kcalNum) kcalNum.textContent = Math.round(totalKcal);
    
    const proteinNum = document.getElementById('todayTotalProtein'); 
    if (proteinNum) proteinNum.textContent = Math.round(totalProtein);
    
    updateProgressBars(totalKcal, totalProtein);
    window.filterLibrary(); 
    if (typeof window.renderKoukiMenu === "function") window.renderKoukiMenu();
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
    const goalKcal = 2647; 
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

/* --- KOUKI & REVITHI QUICK MENU LOGIC --- */
const weeklyKoukiMenu = {
    "Δευτέρα": [
        { name: "Μουσακάς", kcal: 600, protein: 25 },
        { name: "Παστίτσιο", kcal: 600, protein: 28 },
        { name: "Βακαλάος σκορδαλιά", kcal: 580, protein: 35 },
        { name: "Μοσχάρι γιουβέτσι", kcal: 680, protein: 42 },
        { name: "Κοτόπουλο γλυκόξινο", kcal: 550, protein: 38 },
        { name: "Μπριζόλα μοσχαρίσια", kcal: 620, protein: 55 }
    ],
    "Τρίτη": [
        { name: "Ρεβύθια πλακί", kcal: 450, protein: 18 },
        { name: "Κοντοσούβλι κοτόπουλο", kcal: 580, protein: 52 },
        { name: "Μοσχάρι κοκκινιστό", kcal: 650, protein: 45 },
        { name: "Κεφτεδάκια τηγανητά", kcal: 620, protein: 32 },
        { name: "Γιουβαρλάκια", kcal: 510, protein: 28 }
    ],
    "Τετάρτη": [
        { name: "Λαζάνια με κιμά", kcal: 720, protein: 34 },
        { name: "Μπιφτέκι κοτόπουλο", kcal: 480, protein: 45 },
        { name: "Φακές", kcal: 410, protein: 21 },
        { name: "Χταπόδι με κοφτό", kcal: 540, protein: 38 },
        { name: "Σολομός φούρνου", kcal: 520, protein: 42 }
    ],
    "Πέμπτη": [
        { name: "Σουπιές με σπανάκι", kcal: 380, protein: 28 },
        { name: "Μοσχάρι με μελιτζάνες", kcal: 640, protein: 40 },
        { name: "Γαριδομακαρονάδα", kcal: 610, protein: 30 },
        { name: "Φιλέτο κοτόπουλο καρότο", kcal: 490, protein: 48 },
        { name: "Μελιτζάνες ιμάμ", kcal: 410, protein: 5 }
    ],
    "Παρασκευή": [
        { name: "Μπακαλιάρος σκορδαλιά", kcal: 580, protein: 35 },
        { name: "Παπουτσάκια", kcal: 590, protein: 28 },
        { name: "Μπιφτέκι γεμιστό", kcal: 610, protein: 44 },
        { name: "Σουτζουκάκια", kcal: 650, protein: 32 },
        { name: "Σπανακόρυζο", kcal: 340, protein: 6 }
    ],
    "Σάββατο": [
        { name: "Ογκρατέν ζυμαρικών", kcal: 750, protein: 28 },
        { name: "Αρνί με πατάτες", kcal: 820, protein: 55 },
        { name: "Τσιπούρα φούρνου", kcal: 420, protein: 40 },
        { name: "Κοντοσούβλι χοιρινό", kcal: 710, protein: 48 },
        { name: "Γεμιστά κολοκυθάκια", kcal: 480, protein: 22 }
    ],
    "Κυριακή": [
        { name: "Κανελόνια", kcal: 680, protein: 32 },
        { name: "Μπριζόλα μοσχαρίσια", kcal: 620, protein: 55 },
        { name: "Πέρκα φούρνου", kcal: 390, protein: 38 },
        { name: "Κεφτεδάκια τηγανητά", kcal: 620, protein: 32 }
    ]
};

window.renderKoukiMenu = function() {
    const container = document.getElementById('koukiQuickMenu');
    if (!container) return;

    const days = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
    const todayName = days[new Date().getDay()];
    const todayMenu = weeklyKoukiMenu[todayName] || [];

    container.innerHTML = `
        <h4 style="color: #4CAF50; border-bottom: 1px solid #333; padding-bottom: 5px; margin-top: 15px; font-size: 13px;">📍 ${todayName.toUpperCase()} (ΠΙΑΤΑ ΗΜΕΡΑΣ)</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px;">
            ${todayMenu.map(item => `
                <button onclick="addQuickFood('${item.name}', ${item.kcal}, ${item.protein})" 
                        style="background: #050505; border: 1px solid #4CAF50; color: #eee; padding: 10px; border-radius: 8px; font-size: 11px; cursor: pointer; text-align: left;">
                    <strong style="color: #4CAF50;">${item.name}</strong><br>
                    <span>${item.kcal} kcal | ${item.protein}g P</span>
                </button>
            `).join('')}
        </div>
    `;
};

window.addQuickFood = function(name, kcal, protein) {
    document.getElementById('foodName').value = name;
    document.getElementById('foodKcal').value = kcal;
    document.getElementById('foodNote').value = protein;
    document.getElementById('btnAddFood').click();
};

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

window.renderFood = window.updateFoodUI;