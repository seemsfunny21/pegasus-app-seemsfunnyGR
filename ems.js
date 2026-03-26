/* ==========================================================================
   PEGASUS EMS MODULE - v4.0 (MODULAR / FULLY DECOUPLED)
   Protocol: Strict Analyst - Isolated Scope & Unified Keys
   ========================================================================== */

const PegasusEMS = (function() {
    // 1. ΙΔΙΩΤΙΚΕΣ ΛΕΙΤΟΥΡΓΙΕΣ (Private Methods)
    const getTargetWednesday = () => {
        const now = new Date();
        
        // Προσαρμογή στην Ελληνική εβδομάδα (Κυριακή = 7 αντί για 0)
        let currentDay = now.getDay(); 
        if (currentDay === 0) currentDay = 7; 
        
        // Υπολογισμός διαφοράς για την Τετάρτη (Ημέρα 3)
        const diff = 3 - currentDay;
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() + diff);
        
        // Αποφυγή σφάλματος Timezone (UTC) του toISOString()
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const day = String(targetDate.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    };

    const closeModal = () => {
        const div = document.getElementById('emsModal');
        if (div) div.style.display = 'none';
    };

    const saveEMSData = async () => {
        try {
            // Αυτόματη κατανομή 36 σετ (6 ανά ομάδα)
            let history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {
                "Στήθος": 0, "Πλάτη": 0, "Πόδια": 0, "Χέρια": 0, "Ώμοι": 0, "Κορμός": 0
            };
            
            ["Στήθος", "Πλάτη", "Πόδια", "Χέρια", "Ώμοι", "Κορμός"].forEach(g => {
                history[g] = (history[g] || 0) + 6;
            });
            
            localStorage.setItem('pegasus_weekly_history', JSON.stringify(history));

            // Ολοκλήρωση ημέρας (Τετάρτη) στο γενικό ημερολόγιο
            let workoutsDone = JSON.parse(localStorage.getItem("pegasus_workouts_done") || "{}");
            workoutsDone[getTargetWednesday()] = true;
            localStorage.setItem("pegasus_workouts_done", JSON.stringify(workoutsDone));

            // Ασφαλής σύνδεση με το Cloud
            if (typeof window.PegasusCloud !== 'undefined' && typeof window.PegasusCloud.push === 'function') {
                await window.PegasusCloud.push(true);
            }
            
            alert(`PEGASUS SYNC: Πιστώθηκαν 36 σετ. Η Τετάρτη ολοκληρώθηκε.`);
            window.location.reload();
        } catch (e) {
            console.error("[PEGASUS EMS]: Storage Error:", e);
        }
    };

    const createModal = () => {
        let div = document.getElementById('emsModal');
        if (div) return div;

        div = document.createElement('div');
        div.id = 'emsModal';
        div.className = 'pegasus-panel';
        div.style.cssText = "position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:#0a0a0a; border:1px solid #4CAF50; padding:25px; border-radius:15px; z-index:10005; width:300px; text-align:center;";
        
        div.innerHTML = `
            <h2 style="color:#4CAF50; margin-bottom:15px;">⚡ EMS LOG</h2>
            <input type="date" id="emsDate" style="width:100%; margin-bottom:10px; background:#111; color:#fff; border:1px solid #333; padding:8px;">
            <input type="number" id="emsAvg" placeholder="Ένταση %" style="width:100%; margin-bottom:10px; background:#111; color:#fff; border:1px solid #333; padding:8px;">
            <button id="btnSaveEMS" style="background:#4CAF50; color:#000; font-weight:bold; padding:10px; width:100%; border:none; border-radius:5px; margin-top:10px; cursor:pointer;">ΟΛΟΚΛΗΡΩΣΗ</button>
            <button id="btnCloseEMS" style="background:transparent; color:#888; border:none; margin-top:15px; cursor:pointer; font-size:12px;">ΑΚΥΡΩΣΗ</button>
        `;
        document.body.appendChild(div);

        // Δυναμική σύνδεση Listeners αντί για inline onclick
        document.getElementById('btnCloseEMS').addEventListener('click', closeModal);
        document.getElementById('btnSaveEMS').addEventListener('click', saveEMSData);

        return div;
    };

    // 2. PUBLIC API
    return {
        open: function() {
            const toolsPanel = document.getElementById('toolsPanel');
            if (toolsPanel) toolsPanel.style.display = 'none';

            const modal = createModal();
            modal.style.display = 'block';
            
            const dateInput = document.getElementById('emsDate');
            if (dateInput) dateInput.value = getTargetWednesday();
        }
    };
})();

// Εξαγωγή στο Window Scope για διασύνδεση με το UI
window.logEMSData = PegasusEMS.open;