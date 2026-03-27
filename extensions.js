/* ==========================================================================
   PEGASUS EXTENSIONS - CLEAN SWEEP v17.0
   Protocol: Ultimate Planner & Agreement Log | Logic: 30-Meal Sync
   ========================================================================== */

/**
 * MASTER MENU: Κουκί & Ρεβύθι (Ιωάννινα)
 * Δεδομένα βασισμένα στο μενού ημέρας για γράμμωση και όγκο
 */
const KOUKI_MENU = [
    { name: "Κοτόπουλο με κάρυ & λαχανικά", kcal: 580, protein: 52, type: "meat" },
    { name: "Κοτόπουλο με χυλοπίτες", kcal: 680, protein: 48, type: "meat" },
    { name: "Κοτόπουλο λεμονάτο", kcal: 550, protein: 52, type: "meat" },
    { name: "Χοιρινό με δαμάσκηνα & βερίκοκα", kcal: 650, protein: 42, type: "meat" },
    { name: "Χοιρινό πρασοσέλινο", kcal: 610, protein: 40, type: "meat" },
    { name: "Μοσχαράκι κοκκινιστό", kcal: 640, protein: 45, type: "meat" },
    { name: "Μοσχαράκι λεμονάτο", kcal: 620, protein: 45, type: "meat" },
    { name: "Μοσχάρι γιουβέτσι", kcal: 720, protein: 45, type: "meat" },
    { name: "Ρεβύθια παραδοσιακά", kcal: 420, protein: 18, type: "legume" },
    { name: "Φακές σούπα", kcal: 380, protein: 22, type: "legume" },
    { name: "Μπιφτέκια κοτόπουλο", kcal: 520, protein: 55, type: "meat" }
];

/**
 * Άνοιγμα του Planner Modal
 */
window.openPegasusPlanner = function() {
    const modal = document.getElementById('pegasusModal');
    if (!modal) return;

    modal.style.display = 'flex';
    modal.style.background = 'rgba(0,0,0,0.9)';
    
    let html = `
        <div style="background:#0a0a0a; border:1px solid #4CAF50; width:90%; max-width:500px; padding:20px; border-radius:12px; max-height:80vh; overflow-y:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2 style="color:#4CAF50; margin:0; font-size:18px; letter-spacing:1px;">🍱 KOUKI PLANNER</h2>
                <button onclick="window.closePlannerOnly()" style="background:none; border:none; color:#666; font-size:20px; cursor:pointer;">✕</button>
            </div>
            
            <div style="display:grid; gap:10px;">
    `;

    KOUKI_MENU.forEach(item => {
        html += `
            <div style="background:#111; border:1px solid #222; padding:12px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="color:#eee; font-size:13px; font-weight:bold;">${item.name.toUpperCase()}</div>
                    <div style="color:#4CAF50; font-size:11px; font-weight:bold; margin-top:4px;">${item.kcal} KCAL | ${item.protein}g PRO</div>
                </div>
                <button onclick="window.addFromPlanner('${item.name}', ${item.kcal}, ${item.protein})" 
                        style="background:#4CAF50; color:#000; border:none; width:35px; height:35px; border-radius:6px; font-weight:900; cursor:pointer; font-size:18px;">+</button>
            </div>
        `;
    });

    html += `</div></div>`;
    modal.innerHTML = html;
};

/**
 * Εκτέλεση Καταγραφής & Ενημέρωση Συμφωνίας
 */
window.addFromPlanner = function(name, kcal, protein) {
    if (window.addFoodItem) {
        // 1. Καταγραφή στον κεντρικό κινητήρα διατροφής
        window.addFoodItem(name, kcal, protein);
        
        // 2. Ενημέρωση του Agreement Log (Συμφωνία 30 γευμάτων)
        const today = new Date().toLocaleDateString('el-GR');
        let agreementLog = JSON.parse(localStorage.getItem('kouki_agreement_log') || "[]");
        
        agreementLog.push({ date: today, food: name });
        localStorage.setItem('kouki_agreement_log', JSON.stringify(agreementLog));
        
        // 3. Feedback Χρήστη
        const count = agreementLog.length;
        const remaining = Math.max(0, 30 - count);
        
        if (window.PegasusLogger) {
            window.PegasusLogger.log(`Planner Add: ${name} (${count}/30)`, "INFO");
        }

        alert(`ΚΑΤΑΓΡΑΦΗΚΕ!\nΓεύμα: ${count} από 30\nΑπομένουν: ${remaining}`);
        
        window.closePlannerOnly();
        
        // Push στο Cloud αν είναι ενεργό
        if (window.PegasusCloud && window.PegasusCloud.isUnlocked) {
            window.PegasusCloud.push(true);
        }
    }
};

window.closePlannerOnly = function() {
    const modal = document.getElementById('pegasusModal');
    if (modal) modal.style.display = 'none';
};