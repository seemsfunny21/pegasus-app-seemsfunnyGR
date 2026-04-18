/* ==========================================================================
   PEGASUS EXTENSIONS - ULTIMATE PLANNER & ROLLING AGREEMENT (v13.5 STRICT)
   Protocol: Maximalist Retention - Logic Mirroring & Variable Persistence
   Status: FIXED: OVERWRITE RACE CONDITION VIA CLOUD SYNC CHECK
   ========================================================================== */

// --- 1. DATA CONSTANTS: KOUKI MENU ---
const KOUKI_MENU = [
    { name: "Κοτόπουλο με κάρυ & λαχανικά", kcal: 580, protein: 52, type: "meat" },
    { name: "Κοτόπουλο με χυλοπίτες", kcal: 680, protein: 48, type: "meat" },
    { name: "Κοτόπουλο λεμονάτο", kcal: 550, protein: 52, type: "meat" },
    { name: "Χοιρινό με δαμάσκηνα & βερίκοκα", kcal: 650, protein: 42, type: "meat" },
    { name: "Χοιρινό πρασοσέλινο", kcal: 610, protein: 40, type: "meat" },
    { name: "Χοιρινό με σέλινο", kcal: 590, protein: 40, type: "meat" },
    { name: "Μοσχαράκι κοκκινιστό", kcal: 640, protein: 45, type: "meat" },
    { name: "Μοσχαράκι λεμονάτο", kcal: 620, protein: 45, type: "meat" },
    { name: "Μοσχάρι γιουβέτσι", kcal: 720, protein: 46, type: "meat" },
    { name: "Μπιφτέκια μοσχαρίσια σχάρας", kcal: 540, protein: 44, type: "meat" },
    { name: "Σουτζουκάκια σμυρνέικα", kcal: 590, protein: 36, type: "meat" },
    { name: "Γιουβαρλάκια αυγολέμονο", kcal: 490, protein: 30, type: "meat" },
    { name: "Κεφτεδάκια με σάλτσα", kcal: 550, protein: 32, type: "meat" },
    { name: "Ρεβύθια με κάρυ & γάλα καρύδας", kcal: 480, protein: 18, type: "legumes" },
    { name: "Ρεβύθια λεμονάτα με δεντρολίβανο", kcal: 450, protein: 17, type: "legumes" },
    { name: "Ρεβύθια με σπανάκι", kcal: 460, protein: 20, type: "legumes" },
    { name: "Γίγαντες φούρνου", kcal: 480, protein: 19, type: "legumes" },
    { name: "Παστίτσιο λαχανικών", kcal: 550, protein: 18, type: "veggies" },
    { name: "Μελιτζάνες ιμάμ", kcal: 460, protein: 7, type: "veggies" },
    { name: "Φασολάκια πράσινα", kcal: 350, protein: 8, type: "veggies" },
    { name: "Γεμιστά με ρύζι & μυρωδικά", kcal: 470, protein: 8, type: "veggies" },
    { name: "Μπριάμ", kcal: 380, protein: 7, type: "veggies" },
    { name: "Σουπιές με σπανάκι", kcal: 420, protein: 38, type: "fish" },
    { name: "Ψάρι φιλέτο (Γλώσσα) με λαχανικά", kcal: 400, protein: 42, type: "fish" },
    { name: "Τσιπούρα ψητή", kcal: 420, protein: 45, type: "fish" },
    { name: "Παστίτσιο", kcal: 720, protein: 22, type: "cheat" }, 
    { name: "Μουσακάς", kcal: 830, protein: 26, type: "cheat" } 
];

// --- 2. UI: WEEKLY PLANNER MODAL ---
function showWeeklyPlanner() {
    let history = [];
    for (let i = 0; i < 7; i++) {
        let d = new Date(); 
        d.setDate(d.getDate() - i);
        const pd = String(d.getDate()).padStart(2, '0');
        const pm = String(d.getMonth() + 1).padStart(2, '0');
        const py = d.getFullYear();
        const dateStr = `${pd}/${pm}/${py}`;
        
        const data = JSON.parse(localStorage.getItem(`food_log_${dateStr}`) || "[]");
        data.forEach(item => history.push(item.name.toLowerCase()));
    }

    let available = KOUKI_MENU.filter(item => {
        let menuItemName = item.name.toLowerCase();
        return !history.some(h => h.includes(menuItemName) || menuItemName.includes(h));
    });

    if (available.length < 6) available = [...KOUKI_MENU];
    available.sort(() => 0.5 - Math.random());
    let picked = available.slice(0, 6);

    let modal = document.getElementById('pegasusModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'pegasusModal';
        modal.className = "planner-modal";
        modal.onclick = (e) => { if (e.target.id === 'pegasusModal') window.closePlannerOnly(); };
        document.body.appendChild(modal);
    }
    modal.style.display = 'flex';

    let html = `
        <div class="planner-content">
            <div style="color:#4CAF50; font-weight:bold; font-size:18px; margin-bottom:15px; text-align:center; border-bottom:1px solid #222; padding-bottom:15px; letter-spacing:1px;">WEEKLY PLANNER</div>
            <div style="padding-top:5px;">
    `;

    picked.forEach(item => {
        html += `
            <div class="planner-item" style="display:flex; justify-content:space-between; align-items:center; background:#111; margin-bottom:8px; padding:10px; border-radius:5px; border-left:3px solid #4CAF50;">
                <div style="flex:1;">
                    <div style="color:#fff; font-size:11px; font-weight:bold;">${item.name}</div>
                    <div style="color:#4CAF50; font-size:10px; margin-top:3px;">${item.protein}g P | ${item.kcal} kcal</div>
                </div>
                <button class="planner-add-btn" onclick="addFromPlanner('${item.name}', ${item.kcal}, ${item.protein})" style="background:#4CAF50; color:#fff; border:none; border-radius:4px; width:30px; height:30px; cursor:pointer; font-weight:bold;">+</button>
            </div>
        `;
    });

    html += `</div></div>`;
    modal.innerHTML = html;
}

window.closePlannerOnly = function() {
    const modal = document.getElementById('pegasusModal');
    if (modal) modal.style.display = 'none';
};

// --- 3. LOGIC: ADD MEAL & UPDATE AGREEMENT ---
window.addFromPlanner = function(n, k, p) {
    if (window.addFoodItem) {
        window.addFoodItem(n, k, p);
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const today = `${d}/${m}/${now.getFullYear()}`; 
        
        let agreementLog = JSON.parse(localStorage.getItem('kouki_agreement_log') || "[]");
        agreementLog.push({ date: today, food: n });
        localStorage.setItem('kouki_agreement_log', JSON.stringify(agreementLog));
        
        window.updateKoukiBalance();
        const totalStock = parseInt(localStorage.getItem('kouki_total_stock') || "30");
        const remaining = totalStock - agreementLog.length;
        
        console.log(`✅ PEGASUS: Meal Added. Remaining Agreement: ${remaining}`);
        window.closePlannerOnly();
    }
};

/* ==========================================================================
   PEGASUS KOUKI AGREEMENT MONITOR (v13.4 - ROLLING STOCK)
   ========================================================================== */

window.updateKoukiBalance = function() {
    let totalStock = parseInt(localStorage.getItem('kouki_total_stock') || "30");
    const log = JSON.parse(localStorage.getItem('kouki_agreement_log') || "[]");
    const consumed = log.length;
    const remaining = totalStock - consumed;

    const display = document.getElementById("agreementStatus");
    if (display) {
        display.textContent = remaining;
        if (remaining <= 0) display.style.color = "#ff4444"; 
        else if (remaining <= 5) display.style.color = "#f39c12"; 
        else display.style.color = "#eee";    
        console.log(`📊 KOUKI TRACKER: ${remaining} meals remaining of ${totalStock}`);
    }
};

window.addThirtyMeals = function() {
    let currentStock = parseInt(localStorage.getItem('kouki_total_stock') || "30");
    let newStock = currentStock + 30;
    localStorage.setItem('kouki_total_stock', newStock.toString());
    window.updateKoukiBalance();
};

window.setKoukiStock = function(amount) {
    localStorage.setItem('kouki_total_stock', amount.toString());
    window.updateKoukiBalance();
    return `Stock updated to: ${amount}`;
};

[100, 500, 2000].forEach(delay => {
    setTimeout(() => {
        if (window.updateKoukiBalance) window.updateKoukiBalance();
    }, delay);
});

/* ==========================================================================
   PEGASUS OS - PC ZERO-CLICK DAILY ROUTINE (v13.5 HARDENED)
   ========================================================================== */
window.checkDailyRoutinePC = function() {
    // 🛡️ RACE CONDITION GUARD: 
    // Περιμένουμε μέχρι το Cloud να κάνει το πρώτο επιτυχές Pull 
    // πριν ελέγξουμε αν πρέπει να μπει η ρουτίνα.
    if (!window.PegasusCloud || !window.PegasusCloud.hasSuccessfullyPulled) {
        console.log("⏳ PEGASUS PC: Waiting for Cloud Sync before routine check...");
        setTimeout(window.checkDailyRoutinePC, 1000);
        return;
    }

    const now = new Date();
    const dStr = String(now.getDate()).padStart(2, '0');
    const mStr = String(now.getMonth() + 1).padStart(2, '0');
    const dateStr = `${dStr}/${mStr}/${now.getFullYear()}`; 
    const flagKey = "pegasus_routine_injected_" + dateStr;

    // Τώρα που έγινε το Pull, το localStorage έχει τα δεδομένα από το κινητό.
    if (!localStorage.getItem(flagKey)) {
        if (typeof window.addFoodItem === "function") {
            setTimeout(() => window.addFoodItem("Γιαούρτι 2% + Whey (Ρουτίνα)", 250, 35), 100);
            setTimeout(() => window.addFoodItem("3 Αυγά (Ρουτίνα)", 210, 18), 300);
        }

        localStorage.setItem(flagKey, "true");
        console.log("🌅 PEGASUS PC: Daily Routine auto-injected AFTER Cloud Sync.");

        setTimeout(() => {
            if (typeof updateInventoryUI === "function") updateInventoryUI();
            if (typeof updateKoukiBalance === "function") window.updateKoukiBalance();
        }, 800);
    } else {
        console.log("✅ PEGASUS PC: Routine already exists in Cloud data. Skipping.");
    }
};

setTimeout(() => {
    if (window.checkDailyRoutinePC) window.checkDailyRoutinePC();
}, 2000);
