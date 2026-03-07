/* ==========================================================================
   PEGASUS EMS MODULE - FINAL STABLE (V2.7)
   Description: Pegasus Green Theme, UI Exclusivity & Pop-up Alert System.
   ========================================================================== */

/**
 * Υπολογίζει την ημερομηνία της Τετάρτης για την τρέχουσα εβδομάδα.
 */
function getTargetWednesday() {
    const now = new Date();
    const currentDay = now.getDay(); 
    const diff = 3 - currentDay;
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + diff);
    return targetDate.toISOString().split('T')[0];
}

/**
 * Ανοίγει το Modal και κλείνει τα υπόλοιπα πάνελ.
 */
window.logEMSData = function() {
    console.log("EMS UI Triggered");

    const toolsPanel = document.getElementById('toolsPanel');
    if (toolsPanel) toolsPanel.style.display = 'none';

    const emsModal = document.getElementById('emsModal');
    const dateInput = document.getElementById('emsDate');
    const avgInput = document.getElementById('emsAvg');
    const kcalInput = document.getElementById('emsKcal');

    if (!emsModal) {
        console.error("ΣΦΑΛΜΑ: Το emsModal δεν βρέθηκε.");
        return;
    }

    dateInput.value = getTargetWednesday();
    avgInput.value = "45.1"; 
    kcalInput.value = "2350"; 

    emsModal.style.display = 'block';
    setTimeout(() => avgInput.focus(), 100);
};

window.closeEMSModal = function() {
    const emsModal = document.getElementById('emsModal');
    if (emsModal) emsModal.style.display = 'none';
};

/**
 * Αποθήκευση δεδομένων στο LocalStorage.
 */
window.saveEMSFinal = function() {
    const date = document.getElementById('emsDate').value;
    const avg = document.getElementById('emsAvg').value;
    const kcal = document.getElementById('emsKcal').value;

    if (!date || isNaN(parseFloat(avg)) || isNaN(parseFloat(kcal))) {
        alert("ΑΠΟΤΥΧΙΑ: Εισάγετε έγκυρα αριθμητικά δεδομένα.");
        return;
    }

    const emsEntry = {
        id: "ems_" + Date.now(),
        date: date,
        type: "EMS Training",
        stats: {
            intensity: parseFloat(avg).toFixed(1) + "%",
            energy: parseInt(kcal) + " e-Kcal"
        },
        recordedAt: new Date().toISOString()
    };

    const historyKey = `pegasus_history_${date}`;
    try {
        let dayHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
        dayHistory = dayHistory.filter(item => item.type !== "EMS Training");
        dayHistory.push(emsEntry);
        localStorage.setItem(historyKey, JSON.stringify(dayHistory));

        alert(`ΕΠΙΤΥΧΙΑ: Καταχωρήθηκαν ${kcal} e-Kcal για τις ${date}.`);
        window.closeEMSModal();
        window.location.reload();
    } catch (e) {
        console.error("Storage Error:", e);
    }
};

/**
 * Σύστημα Προειδοποίησης (Pop-up Alert) - PEGASUS GREEN THEME
 */
window.checkEMSReminder = function() {
    const lastWednesday = getTargetWednesday(); 
    const historyKey = `pegasus_history_${lastWednesday}`;
    const data = JSON.parse(localStorage.getItem(historyKey) || '[]');
    
    const hasEMS = data.some(item => item.type === "EMS Training");
    const today = new Date().getDay();

    if (!hasEMS && (today > 3 || today === 0)) {
        const overlay = document.createElement('div');
        overlay.id = "emsAlertOverlay";
        overlay.style = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 100000; display: flex; align-items: center; justify-content: center;";
        
        overlay.innerHTML = `
            <div style="background: #111; border: 2px solid #4CAF50; padding: 30px; border-radius: 15px; text-align: center; width: 290px; box-shadow: 0 0 40px rgba(76,175,80,0.3); font-family: sans-serif;">
                <div style="font-size: 40px; margin-bottom: 15px; color: #4CAF50;">⚡</div>
                <h3 style="color: #4CAF50; margin: 0 0 10px 0; letter-spacing: 1px; font-weight: bold;">EMS STATUS: MISSING</h3>
                <p style="color: #eee; font-size: 13px; line-height: 1.6; margin-bottom: 25px;">
                    Απαιτείται καταγραφή <strong>EMS</strong> για την Τετάρτη.<br>
                    Το σύστημα χρειάζεται τα δεδομένα για τον υπολογισμό των γευμάτων.
                </p>
                <button id="btnAlertLog" style="width: 100%; background: #4CAF50; color: black; border: none; padding: 14px; border-radius: 5px; font-weight: bold; cursor: pointer; margin-bottom: 12px; font-size: 14px; text-transform: uppercase;">ΚΑΤΑΓΡΑΦΗ ΤΩΡΑ</button>
                <button id="btnAlertClose" style="width: 100%; background: transparent; color: #555; border: 1px solid #333; padding: 8px; border-radius: 5px; cursor: pointer; font-size: 11px;">ΠΑΡΑΚΑΜΨΗ</button>
            </div>
        `;
        
        document.body.appendChild(overlay);

        document.getElementById('btnAlertLog').onclick = () => {
            overlay.remove();
            window.logEMSData();
        };
        
        document.getElementById('btnAlertClose').onclick = () => {
            overlay.remove();
        };
    }
};

window.addEventListener('load', () => {
    setTimeout(window.checkEMSReminder, 2500);
});