/* ==========================================================================
   PEGASUS EMS MODULE - CLEAN SWEEP v17.0
   Protocol: Wednesday Session Sync | Logic: 36-Set Bulk Credit
   ========================================================================== */

/**
 * Υπολογισμός της Τετάρτης της τρέχουσας εβδομάδας
 * Διασφάλιση ορθότητας ημερομηνίας για την Ελλάδα
 */
function getTargetWednesday() {
    const now = new Date();
    let currentDay = now.getDay(); 
    if (currentDay === 0) currentDay = 7; // Κυριακή = 7
    
    const diff = 3 - currentDay; // Διαφορά από Τετάρτη (3)
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + diff);
    
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * Κύρια συνάρτηση καταγραφής EMS
 */
window.logEMSData = async function() {
    const dateInput = document.getElementById('emsDate');
    const intensityInput = document.getElementById('emsAvg');
    
    if (!intensityInput || !intensityInput.value) {
        alert("PEGASUS STRICT: Εισάγετε μέση ένταση %");
        return;
    }

    const dateVal = dateInput.value || getTargetWednesday();
    const intensity = intensityInput.value;

    try {
        // 1. Καταγραφή ιστορικού EMS
        const emsEntry = {
            date: dateVal,
            intensity: intensity + "%",
            setsCredited: 36,
            timestamp: Date.now()
        };
        localStorage.setItem(`pegasus_history_ems_${dateVal}`, JSON.stringify(emsEntry));

        // 2. Πίστωση σετ στο Weekly History
        let history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {
            "Στήθος": 0, "Πλάτη": 0, "Πόδια": 0, "Χέρια": 0, "Ώμοι": 0, "Κορμός": 0
        };

        // Το EMS Τετάρτης πιστώνει 6 σετ σε κάθε κύρια μυϊκή ομάδα
        const groups = ["Στήθος", "Πλάτη", "Πόδια", "Χέρια", "Ώμοι", "Κορμός"];
        groups.forEach(g => {
            history[g] = (history[g] || 0) + 6;
        });

        localStorage.setItem('pegasus_weekly_history', JSON.stringify(history));

        // 3. Σήμανση ολοκλήρωσης προπόνησης στο ημερολόγιο
        let workouts = JSON.parse(localStorage.getItem("pegasus_workouts_done") || "{}");
        workouts[dateVal] = true;
        localStorage.setItem("pegasus_workouts_done", JSON.stringify(workouts));

        // 4. Cloud Sync & UI Update
        if (window.PegasusCloud && window.PegasusCloud.isUnlocked) {
            await window.PegasusCloud.push(true);
        }

        if (window.PegasusLogger) {
            window.PegasusLogger.log(`EMS Session Logged: ${intensity}% intensity`, "INFO");
        }

        alert(`PEGASUS SYNC: Πιστώθηκαν 36 σετ. Η Τετάρτη ολοκληρώθηκε.`);
        window.location.reload();

    } catch (e) {
        console.error("EMS Logging Error:", e);
        if (window.PegasusLogger) window.PegasusLogger.log("EMS Storage Failure", "ERROR");
    }
};

/**
 * Δημιουργία και εμφάνιση του EMS Modal
 * Ενσωματωμένο στο PegasusUI draggable protocol
 */
window.openEMSModal = function() {
    let modal = document.getElementById('emsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'emsModal';
        modal.className = 'pegasus-panel';
        modal.style.cssText = "display:none; position:fixed; top:50%; left:50%; width:300px; background:#0a0a0a; border:1px solid #4CAF50; padding:25px; border-radius:12px; z-index:10005; text-align:center; box-shadow: 0 0 20px rgba(74,175,80,0.2);";
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <h2 style="color:#4CAF50; margin-bottom:15px; font-size:18px; letter-spacing:1px;">⚡ EMS SESSION</h2>
        <div style="text-align:left; margin-bottom:15px;">
            <label style="font-size:10px; color:#666; display:block; margin-bottom:5px;">ΗΜΕΡΟΜΗΝΙΑ</label>
            <input type="date" id="emsDate" value="${getTargetWednesday()}" style="width:100%; background:#111; color:#fff; border:1px solid #333; padding:10px; border-radius:5px; box-sizing:border-box;">
        </div>
        <div style="text-align:left; margin-bottom:20px;">
            <label style="font-size:10px; color:#666; display:block; margin-bottom:5px;">ΜΕΣΗ ΕΝΤΑΣΗ %</label>
            <input type="number" id="emsAvg" placeholder="π.χ. 85" style="width:100%; background:#111; color:#fff; border:1px solid #333; padding:10px; border-radius:5px; box-sizing:border-box;">
        </div>
        <button onclick="window.logEMSData()" style="width:100%; background:#4CAF50; color:#000; border:none; padding:12px; font-weight:900; border-radius:5px; cursor:pointer; text-transform:uppercase;">ΚΑΤΑΓΡΑΦΗ & SYNC</button>
        <button onclick="document.getElementById('emsModal').style.display='none'" style="background:none; border:none; color:#666; margin-top:15px; cursor:pointer; font-size:11px;">ΑΚΥΡΩΣΗ</button>
    `;
    
    modal.style.display = 'block';
    
    // Επανεκκίνηση draggable για το νέο στοιχείο
    if (window.PegasusUI) window.PegasusUI.initDraggablePanels();
};