/* ==========================================================================
   PEGASUS EXTENSIONS - ULTIMATE PLANNER & ROLLING AGREEMENT (v13.2)
   Protocol: Maximalist Retention - Logic Mirroring & Variable Persistence
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
    { name: "Παστίτσιο", kcal: 750, protein: 35, type: "cheat" },
    { name: "Μουσακάς", kcal: 800, protein: 30, type: "cheat" }
];

// --- 2. UI: WEEKLY PLANNER MODAL ---
function showWeeklyPlanner() {
    let history = [];
    for (let i = 0; i < 7; i++) {
        let d = new Date(); d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('el-GR');
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
    document.getElementById('pegasusModal').style.display = 'none';
};

// --- 3. LOGIC: ADD MEAL & UPDATE AGREEMENT ---
window.addFromPlanner = function(n, k, p) {
    if (window.addFoodItem) {
        // 1. Καταγραφή στο Pegasus (Macros/Inventory)
        window.addFoodItem(n, k, p);
        
        // 2. Καταγραφή στη Συμφωνία (Agreement Log)
        const today = new Date().toLocaleDateString('el-GR');
        let agreementLog = JSON.parse(localStorage.getItem('kouki_agreement_log') || "[]");
        agreementLog.push({ date: today, food: n });
        localStorage.setItem('kouki_agreement_log', JSON.stringify(agreementLog));
        
        // 3. Ενημέρωση UI & User Feedback
        window.updateKoukiBalance();
        const totalStock = parseInt(localStorage.getItem('kouki_total_stock') || "30");
        const remaining = totalStock - agreementLog.length;
        
        console.log(`✅ PEGASUS: Meal Added. Remaining Agreement: ${remaining}`);
        window.closePlannerOnly();
    }
};

/* ==========================================================================
   PEGASUS KOUKI AGREEMENT MONITOR (v13.2 - ROLLING STOCK)
   ========================================================================== */

// Ενημέρωση του UI στο Sidebar
window.updateKoukiBalance = function() {
    // Διαβάζουμε το συνολικό Stock (Αγορασμένα γεύματα)
    let totalStock = parseInt(localStorage.getItem('kouki_total_stock') || "30");
    
    // Διαβάζουμε το Ιστορικό Κατανάλωσης
    const log = JSON.parse(localStorage.getItem('kouki_agreement_log') || "[]");
    const consumed = log.length;

    // ΥΠΟΛΟΙΠΟ = Συνολικό Stock - Κατανάλωση
    const remaining = totalStock - consumed;

    const display = document.getElementById("agreementStatus");
    if (display) {
        display.textContent = remaining;
        
        // Χρωματική κωδικοποίηση βάσει υπολοίπου
        if (remaining <= 0) {
            display.style.color = "#ff4444"; // Κόκκινο (Χρέος / 0)
        } else if (remaining <= 5) {
            display.style.color = "#f39c12"; // Πορτοκαλί (Κοντά στη λήξη)
        } else {
            display.style.color = "#eee";    // Λευκό (Nominal)
        }
        console.log(`📊 KOUKI TRACKER: ${remaining} meals remaining of ${totalStock}`);
    }
};

// Συνάρτηση του κουμπιού (+) για ανανέωση 30 γευμάτων
window.addThirtyMeals = function() {
    let currentStock = parseInt(localStorage.getItem('kouki_total_stock') || "30");
    let newStock = currentStock + 30;
    
    localStorage.setItem('kouki_total_stock', newStock.toString());
    window.updateKoukiBalance();
    
    console.log(`📡 PEGASUS: Agreement Renewed. New Stock Limit: ${newStock}`);
};

// Βοηθητική συνάρτηση για χειροκίνητη διόρθωση αποθέματος (π.χ. για τα +7 που χρωστούσαν)
window.setKoukiStock = function(amount) {
    localStorage.setItem('kouki_total_stock', amount.toString());
    window.updateKoukiBalance();
    return `Stock updated to: ${amount}`;
};

// 🔥 FORCE INITIALIZATION: Διασφάλιση εμφάνισης στο UI
[100, 500, 2000].forEach(delay => {
    setTimeout(() => {
        if (window.updateKoukiBalance) window.updateKoukiBalance();
    }, delay);
});

// Ιστορικό στην κονσόλα
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
    const dateStr = new Date().toLocaleDateString('el-GR');
    const flagKey = "pegasus_routine_injected_" + dateStr;

    // Αν δεν έχει μπει η ρουτίνα ούτε από το κινητό ούτε από το PC σήμερα...
    if (!localStorage.getItem(flagKey)) {
        
        // 1. Εισαγωγή των γευμάτων χρησιμοποιώντας τη βασική συνάρτηση του υπολογιστή
        if (typeof window.addFoodItem === "function") {
            // Χρησιμοποιούμε setTimeout για να διασφαλίσουμε σωστή σειρά εγγραφής
            setTimeout(() => window.addFoodItem("Γιαούρτι 2% + Whey (Ρουτίνα)", 250, 35), 100);
            setTimeout(() => window.addFoodItem("3 Αυγά (Ρουτίνα)", 210, 18), 300);
        }

        // 2. Αφαίρεση 30g πρωτεΐνης από το Inventory
        let s = JSON.parse(localStorage.getItem('pegasus_supp_inventory')) || { prot: 2500, crea: 1000 };
        s.prot = Math.max(0, s.prot - 30);
        localStorage.setItem('pegasus_supp_inventory', JSON.stringify(s));

        // 3. Ενεργοποίηση της σημαίας (ώστε να μην ξαναμπούν αν ανοίξεις το κινητό)
        localStorage.setItem(flagKey, "true");

        console.log("🌅 PEGASUS PC: Daily Routine auto-injected successfully.");

        // 4. Ανανέωση των Bars στον υπολογιστή (αν υπάρχουν οι συναρτήσεις)
        setTimeout(() => {
            if (typeof updateInventoryUI === "function") updateInventoryUI();
            if (typeof updateKoukiBalance === "function") window.updateKoukiBalance();
        }, 800);
    }
};

// Εκτέλεση του ελέγχου 2 δευτερόλεπτα μετά το άνοιγμα του Pegasus στον υπολογιστή
setTimeout(() => {
    if (window.checkDailyRoutinePC) window.checkDailyRoutinePC();
}, 2000);
