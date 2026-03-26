/* ==========================================================================
   PEGASUS EXTENSIONS - v4.0 (MODULAR / FULLY DECOUPLED)
   Protocol: Strict Data Analyst - Isolated Planner & Agreement Log
   ========================================================================== */

const PegasusExtensions = (function() {
    // 1. ΙΔΙΩΤΙΚΟ STATE & ΔΕΔΟΜΕΝΑ (Private Configuration)
    const KOUKI_MENU = [
        { name: "Κοτόπουλο με κάρυ & λαχανικά", kcal: 580, protein: 52, type: "meat" },
        { name: "Κοτόπουλο με χυλοπίτες", kcal: 680, protein: 48, type: "meat" },
        { name: "Κοτόπουλο λεμονάτο", kcal: 550, protein: 52, type: "meat" },
        { name: "Χοιρινό με δαμάσκηνα & βερίκοκα", kcal: 650, protein: 42, type: "meat" },
        { name: "Χοιρινό πρασοσέλινο", kcal: 610, protein: 40, type: "meat" },
        { name: "Χοιρινό με σέλινο", kcal: 590, protein: 40, type: "meat" },
        { name: "Μοσχαράκι κοκκινιστό", kcal: 640, protein: 45, type: "meat" },
        { name: "Μοσχαράκι λεμονάτο", kcal: 620, protein: 45, type: "meat" },
        { name: "Μοσχάρι γιουβέτσι", kcal: 720, protein: 45, type: "meat" }
    ];

    // 2. ΕΣΩΤΕΡΙΚΕΣ ΛΕΙΤΟΥΡΓΙΕΣ (Private Methods)
    const closePlanner = () => {
        const modal = document.getElementById('pegasusModal');
        if (modal) modal.style.display = 'none';
    };

    const addMealToAgreement = (n, k, p) => {
        // Ασφαλής επικοινωνία με το Food Engine
        if (typeof window.addFoodItem === 'function') {
            // Καταγραφή στο Pegasus
            window.addFoodItem(n, k, p);
            
            // Καταγραφή στη Συμφωνία (30 Γεύματα)
            const today = new Date().toLocaleDateString('el-GR');
            let agreementLog = JSON.parse(localStorage.getItem('kouki_agreement_log') || "[]");
            
            agreementLog.push({ date: today, food: n });
            localStorage.setItem('kouki_agreement_log', JSON.stringify(agreementLog));
            
            // Ενημέρωση UI
            const count = agreementLog.length;
            alert(`PEGASUS SYNC: ΚΑΤΑΓΡΑΦΗΚΕ!\nΓεύμα: ${count} από 30\nΑπομένουν: ${30 - count}`);
            
            closePlanner();
        } else {
            alert("PEGASUS ERROR: Το σύστημα διατροφής (Food Engine) δεν είναι διαθέσιμο.");
        }
    };

    const render = () => {
        let modal = document.getElementById('pegasusModal');
        
        // Δημιουργία Modal αν δεν υπάρχει
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'pegasusModal';
            modal.className = 'pegasus-panel';
            modal.style.cssText = "position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:#0a0a0a; border:1px solid #4CAF50; padding:20px; border-radius:10px; z-index:10005; width:90%; max-width:400px; max-height:80vh; overflow-y:auto;";
            document.body.appendChild(modal);
        }
        
        modal.style.display = 'block';

        let html = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #333; padding-bottom:10px;">
                <h2 style="color:#4CAF50; margin:0; font-size:18px;">📋 KOUKI PLANNER (30 MEALS)</h2>
                <button id="btnClosePlanner" style="background:transparent; color:#ff4444; border:none; font-size:20px; cursor:pointer;">✖</button>
            </div>
            <div style="display:flex; flex-direction:column; gap:10px;">
        `;

        KOUKI_MENU.forEach((item, index) => {
            html += `
                <div class="planner-item" style="display:flex; justify-content:space-between; align-items:center; background:#111; padding:12px; border-radius:8px; border:1px solid #222;">
                    <div style="flex:1;">
                        <div style="color:#fff; font-weight:bold; font-size:14px; margin-bottom:4px;">${item.name}</div>
                        <div style="color:#aaa; font-size:12px;">🥩 ${item.protein}g Πρωτεΐνη | 🔥 ${item.kcal} kcal</div>
                    </div>
                    <button class="planner-add-btn" data-index="${index}" style="background:#4CAF50; color:#000; border:none; width:35px; height:35px; border-radius:10px; cursor:pointer; font-weight:bold; font-size:20px; display:flex; align-items:center; justify-content:center;">+</button>
                </div>
            `;
        });

        html += `</div>`;
        modal.innerHTML = html;

        // Δυναμική Σύνδεση των Event Listeners
        document.getElementById('btnClosePlanner').addEventListener('click', closePlanner);
        
        document.querySelectorAll('.planner-add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.getAttribute('data-index');
                const selectedItem = KOUKI_MENU[idx];
                addMealToAgreement(selectedItem.name, selectedItem.kcal, selectedItem.protein);
            });
        });
    };

    // 3. PUBLIC API
    return {
        open: render,
        close: closePlanner
    };
})();

// Εξαγωγή στο Window Scope για διασύνδεση με το κεντρικό UI
window.renderPlanner = PegasusExtensions.open;
window.closePlannerOnly = PegasusExtensions.close;