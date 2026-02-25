/* ==========================================================================
   PEGASUS EXTENSIONS - ULTIMATE PLANNER & AGREEMENT LOG
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
    { name: "Παστίτσιο", kcal: 750, protein: 35, type: "cheat" },
    { name: "Μουσακάς", kcal: 800, protein: 30, type: "cheat" }
];

document.addEventListener('DOMContentLoaded', () => {
    const foodPanel = document.getElementById('foodPanel');
    if (foodPanel) {
        const planBtn = document.createElement('button');
        planBtn.innerHTML = "ΠΡΟΤΑΣΕΙΣ";
        planBtn.className = "planner-btn";
        planBtn.onclick = showWeeklyPlanner;
        foodPanel.appendChild(planBtn);
    }
});

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
            <div class="planner-item">
                <div style="flex:1;">
                    <div style="color:#fff; font-size:11px; font-weight:bold;">${item.name}</div>
                    <div style="color:#4CAF50; font-size:10px; margin-top:3px;">${item.protein}g P | ${item.kcal} kcal</div>
                </div>
                <button class="planner-add-btn" onclick="addFromPlanner('${item.name}', ${item.kcal}, ${item.protein})">+</button>
            </div>
        `;
    });

    html += `</div></div>`;
    modal.innerHTML = html;
}

window.closePlannerOnly = function() {
    document.getElementById('pegasusModal').style.display = 'none';
};

// --- LOGIC ΓΙΑ ΤΗ ΣΥΜΦΩΝΙΑ ΤΩΝ 30 ΓΕΥΜΑΤΩΝ ---
window.addFromPlanner = function(n, k, p) {
    if (window.addFoodItem) {
        // 1. Καταγραφή στο Pegasus
        window.addFoodItem(n, k, p);
        
        // 2. Καταγραφή στη Συμφωνία
        const today = new Date().toLocaleDateString('el-GR');
        let agreementLog = JSON.parse(localStorage.getItem('kouki_agreement_log') || "[]");
        
        agreementLog.push({ date: today, food: n });
        localStorage.setItem('kouki_agreement_log', JSON.stringify(agreementLog));
        
        // 3. Ενημέρωση χρήστη
        const count = agreementLog.length;
        alert(`ΚΑΤΑΓΡΑΦΗΚΕ!\nΓεύμα: ${count} από 30\nΑπομένουν: ${30 - count}`);
        
        window.closePlannerOnly();
    }
};

// Αν θες να δεις όλη τη λίστα στην κονσόλα (F12) γράψε: showHistory()
window.showHistory = function() {
    const log = JSON.parse(localStorage.getItem('kouki_agreement_log') || "[]");
    console.log("--- ΙΣΤΟΡΙΚΟ ΣΥΜΦΩΝΙΑΣ (ΚΟΥΚΙ & ΡΕΒΥΘΙ) ---");
    console.table(log);
    return `Σύνολο: ${log.length}/30`;
};