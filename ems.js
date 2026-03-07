/* ==========================================================================
   PEGASUS EMS MODULE - FINAL STABLE (V2.6)
   Description: Modal Interface, UI Exclusivity & Pop-up Alert System.
   ========================================================================== */

/**
 * Υπολογίζει την ημερομηνία της Τετάρτης για την τρέχουσα εβδομάδα.
 */
function getTargetWednesday() {
    const now = new Date();
    const currentDay = now.getDay(); // 0: Κυριακή, 1: Δευτέρα... 3: Τετάρτη
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

    // 1. Κλείσιμο του Tools Panel για αποφυγή επικάλυψης
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

    // 2. Προεπιλεγμένες τιμές
    dateInput.value = getTargetWednesday();
    avgInput.value = "45.1"; 
    kcalInput.value = "2350"; 

    // 3. Εμφάνιση και Focus
    emsModal.style.display = 'block';
    setTimeout(() => avgInput.focus(), 100);
};

/**
 * Κλείνει το Modal.
 */
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
        
        // Αφαίρεση τυχόν παλιάς εγγραφής EMS για την ίδια μέρα
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
 * Σύστημα Προειδοποίησης (Pop-up Alert)
 * Εμφανίζεται αν λείπουν τα δεδομένα EMS μετά την Τετάρτη.
 */
window.checkEMSReminder = function() {
    const lastWednesday = getTargetWednesday(); 
    const historyKey = `pegasus_history_${lastWednesday}`;
    const data = JSON.parse(localStorage.getItem(historyKey) || '[]');
    
    const hasEMS = data.some(item => item.type === "EMS Training");
    const today = new Date().getDay();

    // Εμφάνιση μόνο Πέμπτη(4), Παρασκευή(5), Σάββατο(6), Κυριακή(0)
    if (!hasEMS && (today > 3 || today === 0)) {
        const overlay = document.createElement('div');
        overlay.id = "emsAlertOverlay";
        overlay.style = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 100000; display: flex; align-items: center; justify-content: center;";
        
        overlay.innerHTML = `
            <div style="background: #1a1a1a; border: 2px solid #ff9800; padding: 30px; border-radius: 15px; text-align: center; width: 280px; box-shadow: 0 0 30px rgba(255,152,0,0.5); font-family: sans-serif;">
                <div style="font-size: 40px; margin-bottom: 15px;">⚠️</div>
                <h3 style="color: #ff9800; margin: 0 0 10px 0; letter-spacing: 1px;">ΕΛΛΕΙΨΗ ΔΕΔΟΜΕΝΩΝ</h3>
                <p style="color: #ccc; font-size: 13px; line-height: 1.5; margin-bottom: 25px;">
                    Δεν εντοπίστηκε καταγραφή <strong>EMS</strong> για την Τετάρτη.<br>
                    Το θερμιδικό πλάνο χρήζει ενημέρωσης.
                </p>
                <button id="btnAlertLog" style="width: 100%; background: #ff9800; color: black; border: none; padding: 12px; border-radius: 5px; font-weight: bold; cursor: pointer; margin-bottom: 12px; font-size: 14px;">ΚΑΤΑΓΡΑΦΗ ΤΩΡΑ</button>
                <button id="btnAlertClose" style="width: 100%; background: transparent; color: #777; border: 1px solid #444; padding: 8px; border-radius: 5px; cursor: pointer; font-size: 11px;">ΑΓΝΟΗΣΗ</button>
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

// Εκτέλεση ελέγχου 2.5 δευτερόλεπτα μετά το πλήρες φόρτωμα της σελίδας
window.addEventListener('load', () => {
    setTimeout(window.checkEMSReminder, 2500);
});
