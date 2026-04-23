/* ==========================================================================
   PEGASUS EXTENSIONS - ULTIMATE PLANNER & ROLLING AGREEMENT (v13.4 STRICT)
   Protocol: Maximalist Retention - Logic Mirroring & Variable Persistence
   Status: FINAL STABLE | FIXED: DOUBLE DEPLETION & DATE PADDING
   ========================================================================== */

function getPegasusDisplayDateStr(dateObj = new Date()) {
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    return `${d}/${m}/${y}`;
}

function getPegasusFoodLogKey(dateStr) {
    const prefix = window.PegasusManifest?.nutrition?.log_prefix || "food_log_";
    return prefix + dateStr;
}

function getSafeInlineText(value) {
    return String(value).replace(/'/g, "\\'");
}

/* ==========================================================================
   1. DATA CONSTANTS: KOUKI MENU
   ========================================================================== */
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

/* ==========================================================================
   2. UI: WEEKLY PLANNER MODAL
   ========================================================================== */
function showWeeklyPlanner() {
    let history = [];

    for (let i = 0; i < 7; i++) {
        let d = new Date();
        d.setDate(d.getDate() - i);

        const dateStr = getPegasusDisplayDateStr(d);
        const data = JSON.parse(localStorage.getItem(getPegasusFoodLogKey(dateStr)) || "[]");
        data.forEach(item => history.push(String(item.name || "").toLowerCase()));
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
        modal.onclick = (e) => {
            if (e.target.id === 'pegasusModal') window.closePlannerOnly();
        };
        document.body.appendChild(modal);
    }

    modal.style.display = 'flex';

    let html = `
        <div class="planner-content">
            <div style="color:#4CAF50; font-weight:bold; font-size:18px; margin-bottom:15px; text-align:center; border-bottom:1px solid #222; padding-bottom:15px; letter-spacing:1px;">WEEKLY PLANNER</div>
            <div style="padding-top:5px;">
    `;

    picked.forEach(item => {
        const safeName = getSafeInlineText(item.name);

        html += `
            <div class="planner-item" style="display:flex; justify-content:space-between; align-items:center; background:#111; margin-bottom:8px; padding:10px; border-radius:5px; border-left:3px solid #4CAF50;">
                <div style="flex:1;">
                    <div style="color:#fff; font-size:11px; font-weight:bold;">${item.name}</div>
                    <div style="color:#4CAF50; font-size:10px; margin-top:3px;">${item.protein}g P | ${item.kcal} kcal</div>
                </div>
                <button class="planner-add-btn" onclick="addFromPlanner('${safeName}', ${item.kcal}, ${item.protein})" style="background:#4CAF50; color:#fff; border:none; border-radius:4px; width:30px; height:30px; cursor:pointer; font-weight:bold;">+</button>
            </div>
        `;
    });

    html += `</div></div>`;
    modal.innerHTML = html;
}

window.showWeeklyPlanner = showWeeklyPlanner;

window.closePlannerOnly = function() {
    const modal = document.getElementById('pegasusModal');
    if (modal) modal.style.display = 'none';
};

/* ==========================================================================
   3. LOGIC: ADD MEAL & UPDATE AGREEMENT
   ========================================================================== */
window.addFromPlanner = function(n, k, p) {
    if (!window.addFoodItem) return;

    // 1. Καταγραφή στο Pegasus (Macros/Inventory)
    window.addFoodItem(n, k, p);

    // 2. Καταγραφή στη Συμφωνία (Agreement Log)
    const today = getPegasusDisplayDateStr(new Date());
    let agreementLog = JSON.parse(localStorage.getItem('kouki_agreement_log') || "[]");
    agreementLog.push({ date: today, food: n });
    localStorage.setItem('kouki_agreement_log', JSON.stringify(agreementLog));

    // 3. Ενημέρωση UI & User Feedback
    window.updateKoukiBalance();
    const totalStock = parseInt(localStorage.getItem('kouki_total_stock') || "30", 10);
    const remaining = totalStock - agreementLog.length;

    if (window.PegasusCloud?.push) window.PegasusCloud.push(true);

    console.log(`✅ PEGASUS: Meal Added. Remaining Agreement: ${remaining}`);
    window.closePlannerOnly();
};

/* ==========================================================================
   PEGASUS KOUKI AGREEMENT MONITOR (v13.4 - ROLLING STOCK)
   ========================================================================== */
window.updateKoukiBalance = function() {
    let totalStock = parseInt(localStorage.getItem('kouki_total_stock') || "30", 10);
    const log = JSON.parse(localStorage.getItem('kouki_agreement_log') || "[]");
    const consumed = log.length;
    const remaining = totalStock - consumed;

    const display = document.getElementById("agreementStatus");
    if (display) {
        display.textContent = remaining;

        if (remaining <= 0) {
            display.style.color = "#ff4444";
        } else if (remaining <= 5) {
            display.style.color = "#f39c12";
        } else {
            display.style.color = "#eee";
        }

        console.log(`📊 KOUKI TRACKER: ${remaining} meals remaining of ${totalStock}`);
    }
};

window.addThirtyMeals = function() {
    let currentStock = parseInt(localStorage.getItem('kouki_total_stock') || "30", 10);
    let newStock = currentStock + 30;

    localStorage.setItem('kouki_total_stock', newStock.toString());
    window.updateKoukiBalance();

    if (window.PegasusCloud?.push) window.PegasusCloud.push(true);

    console.log(`📡 PEGASUS: Agreement Renewed. New Stock Limit: ${newStock}`);
};

window.setKoukiStock = function(amount) {
    localStorage.setItem('kouki_total_stock', amount.toString());
    window.updateKoukiBalance();

    if (window.PegasusCloud?.push) window.PegasusCloud.push(true);

    return `Stock updated to: ${amount}`;
};

// 🔥 FORCE INITIALIZATION
[100, 500, 2000].forEach(delay => {
    setTimeout(() => {
        if (window.updateKoukiBalance) window.updateKoukiBalance();
    }, delay);
});

window.showHistory = function() {
    const log = JSON.parse(localStorage.getItem('kouki_agreement_log') || "[]");
    const stock = localStorage.getItem('kouki_total_stock') || "30";
    console.log("--- PEGASUS AGREEMENT AUDIT ---");
    console.table(log);
    console.log(`Συνολικό Stock: ${stock} | Κατανάλωση: ${log.length} | Υπόλοιπο: ${stock - log.length}`);
};

/* ==========================================================================
   PEGASUS OS - PC ZERO-CLICK DAILY ROUTINE (Cross-Device Sync)
   ========================================================================== */
window.checkDailyRoutinePC = function() {
    const dateStr = getPegasusDisplayDateStr(new Date());
    const flagKey = "pegasus_routine_injected_" + dateStr;
    const todayFoodLogKey = getPegasusFoodLogKey(dateStr);
    const todayLog = JSON.parse(localStorage.getItem(todayFoodLogKey) || "[]");

    const hasYogurtRoutine = todayLog.some(item => item?.name === "Γιαούρτι 2% + Whey (Ρουτίνα)");
    const hasEggRoutine = todayLog.some(item => item?.name === "3 Αυγά (Ρουτίνα)");
    const hasCreatineRoutine = todayLog.some(item => item?.name === "Κρεατίνη 5g (Ρουτίνα)");

    if (!localStorage.getItem(flagKey)) {
        if (typeof window.addFoodItem === "function") {
            if (!hasYogurtRoutine) {
                setTimeout(() => window.addFoodItem("Γιαούρτι 2% + Whey (Ρουτίνα)", 250, 35), 100);
            }

            if (!hasEggRoutine) {
                setTimeout(() => window.addFoodItem("3 Αυγά (Ρουτίνα)", 210, 18), 300);
            }

            if (!hasCreatineRoutine) {
                setTimeout(() => window.addFoodItem("Κρεατίνη 5g (Ρουτίνα)", 0, 0), 500);
            }
        }

        // 3. Ενεργοποίηση σημαίας
        localStorage.setItem(flagKey, "true");
        console.log("🌅 PEGASUS PC: Daily Routine auto-injected. Routine includes creatine.");

        // 4. Ενανέωση UI
        setTimeout(() => {
            if (typeof updateInventoryUI === "function") updateInventoryUI();
            if (typeof window.updateKoukiBalance === "function") window.updateKoukiBalance();
        }, 800);

        if (window.PegasusCloud?.push) {
            setTimeout(() => window.PegasusCloud.push(true), 1000);
        }
    }
};

setTimeout(() => {
    if (window.checkDailyRoutinePC) window.checkDailyRoutinePC();
}, 2000);
