/* ==========================================================================
   PEGASUS EMS MODULE - STABLE VERSION (V2.4)
   Description: Optimized UI with auto-close for Tools Panel and focus.
   ========================================================================== */

/**
 * Υπολογίζει την ημερομηνία της Τετάρτης για την τρέχουσα εβδομάδα.
 * @returns {string} Date in YYYY-MM-DD format.
 */
function getTargetWednesday() {
    const now = new Date();
    const currentDay = now.getDay(); // 0: Sun, 1: Mon, 2: Tue, 3: Wed
    const diff = 3 - currentDay;
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + diff);
    return targetDate.toISOString().split('T')[0];
}

/**
 * Ανοίγει το Modal, κλείνει τα υπόλοιπα πάνελ και προετοιμάζει τα πεδία.
 */
window.logEMSData = function() {
    console.log("EMS UI Triggered");

    // 1. Αποκλειστικότητα UI: Κλείσιμο του Tools Panel αν είναι ανοιχτό
    const toolsPanel = document.getElementById('toolsPanel');
    if (toolsPanel) {
        toolsPanel.style.display = 'none';
    }

    // 2. Εντοπισμός στοιχείων Modal
    const emsModal = document.getElementById('emsModal');
    const dateInput = document.getElementById('emsDate');
    const avgInput = document.getElementById('emsAvg');
    const kcalInput = document.getElementById('emsKcal');

    if (!emsModal) {
        console.error("ΣΦΑΛΜΑ: Το emsModal δεν βρέθηκε στο index.html");
        return;
    }

    // 3. Αυτόματη συμπλήρωση τιμών
    dateInput.value = getTargetWednesday();
    avgInput.value = "45.1"; 
    kcalInput.value = "2350"; 

    // 4. Εμφάνιση Panel και Focus στην ένταση
    emsModal.style.display = 'block';
    setTimeout(() => avgInput.focus(), 100);
};

/**
 * Κλείνει το Modal χωρίς αποθήκευση.
 */
window.closeEMSModal = function() {
    const emsModal = document.getElementById('emsModal');
    if (emsModal) {
        emsModal.style.display = 'none';
    }
};

/**
 * Επικυρώνει και αποθηκεύει τα δεδομένα στο LocalStorage.
 */
window.saveEMSFinal = function() {
    const date = document.getElementById('emsDate').value;
    const avg = document.getElementById('emsAvg').value;
    const kcal = document.getElementById('emsKcal').value;

    // Data Validation
    if (!date || isNaN(parseFloat(avg)) || isNaN(parseFloat(kcal))) {
        alert("ΑΠΟΤΥΧΙΑ: Παρακαλώ εισάγετε έγκυρα αριθμητικά δεδομένα.");
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
        
        // Καθαρισμός προηγούμενων εγγραφών EMS για την ίδια μέρα
        dayHistory = dayHistory.filter(item => item.type !== "EMS Training");

        dayHistory.push(emsEntry);
        localStorage.setItem(historyKey, JSON.stringify(dayHistory));

        alert(`ΕΠΙΤΥΧΙΑ: Καταχωρήθηκαν ${kcal} e-Kcal στο ιστορικό της ${date}.`);
        
        window.closeEMSModal();
        
        // Refresh για ενημέρωση του συστήματος
        window.location.reload();
        
    } catch (e) {
        console.error("Storage Error:", e);
        alert("ΣΦΑΛΜΑ: Η αποθήκευση απέτυχε.");
    }
};

window.checkEMSReminder = function() {
    const lastWednesday = window.getTargetWednesday(); // Η Τετάρτη αυτής της εβδομάδας
    const historyKey = `pegasus_history_${lastWednesday}`;
    const data = JSON.parse(localStorage.getItem(historyKey) || '[]');
    
    const hasEMS = data.some(item => item.type === "EMS Training");
    const today = new Date().getDay();

    // Αν είναι μετά την Τετάρτη (4=Πέμπτη, 5=Παρασκευή, 6=Σάββατο, 0=Κυριακή) και λείπει το EMS
    if (!hasEMS && (today > 3 || today === 0)) {
        const warning = document.createElement('div');
        warning.innerHTML = `
            <div id="emsAlertBanner" style="background: #ff9800; color: black; text-align: center; padding: 10px; font-weight: bold; cursor: pointer; z-index: 10001; position: relative;">
                ⚠️ ΠΡΟΣΟΧΗ: Λείπουν τα δεδομένα EMS της Τετάρτης. Το θερμιδικό πλάνο είναι ανακριβές. 
                <span style="text-decoration: underline;">ΚΑΤΑΓΡΑΦΗ ΤΩΡΑ</span>
            </div>`;
        document.body.prepend(warning);
        warning.onclick = () => {
            window.logEMSData();
            warning.remove();
        };
    }
};

// Εκτέλεση ελέγχου 2 δευτερόλεπτα μετά το φόρτωμα
setTimeout(window.checkEMSReminder, 2000);