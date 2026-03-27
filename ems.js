/* ==========================================================================
   PEGASUS EMS MODULE - STRICT ANALYST EDITION (V3.2)
   Unified Keys & Secure Async Sync
   ========================================================================== */

function getTargetWednesday() {
    const now = new Date();
    
    // ΔΙΟΡΘΩΣΗ 1: Προσαρμογή στην Ελληνική εβδομάδα (Κυριακή = 7 αντί για 0)
    let currentDay = now.getDay(); 
    if (currentDay === 0) currentDay = 7; 
    
    // Υπολογισμός διαφοράς για την Τετάρτη (Ημέρα 3) της τρέχουσας εβδομάδας
    const diff = 3 - currentDay;
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + diff);
    
    // ΔΙΟΡΘΩΣΗ 2: Αποφυγή σφάλματος Timezone (UTC) του toISOString() 
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

window.logEMSData = function() {
    const toolsPanel = document.getElementById('toolsPanel');
    if (toolsPanel) toolsPanel.style.display = 'none';

    const emsModal = document.getElementById('emsModal') || createEMSModal();
    const dateInput = document.getElementById('emsDate');
    const avgInput = document.getElementById('emsAvg');
    const kcalInput = document.getElementById('emsKcal');

    dateInput.value = getTargetWednesday();
    avgInput.value = ""; 
    kcalInput.value = ""; 

    emsModal.style.display = 'block';
    setTimeout(() => avgInput.focus(), 100);
};

window.saveEMSFinal = async function() {
    const date = document.getElementById('emsDate').value;
    const avg = document.getElementById('emsAvg').value;
    const kcal = document.getElementById('emsKcal').value;

    if (!date || isNaN(parseFloat(avg)) || isNaN(parseFloat(kcal))) {
        alert("ΑΠΟΤΥΧΙΑ: Εισάγετε έγκυρα αριθμητικά δεδομένα.");
        return;
    }

    const timestamp = Date.now();
    const historyKey = `pegasus_history_${date}`;
    const weeklyKey = 'pegasus_weekly_history';
    
    let weeklyStats = JSON.parse(localStorage.getItem(weeklyKey)) || {
        "Στήθος": 0, "Πλάτη": 0, "Πόδια": 0, "Χέρια": 0, "Ώμοι": 0, "Κορμός": 0
    };
    const groups = ["Στήθος", "Πλάτη", "Πόδια", "Χέρια", "Ώμοι", "Κορμός"];
    groups.forEach(group => {
        weeklyStats[group] = (weeklyStats[group] || 0) + 6;
    });
    localStorage.setItem(weeklyKey, JSON.stringify(weeklyStats));

    let todayKcal = parseFloat(localStorage.getItem("pegasus_today_kcal")) || 0;
    todayKcal += parseFloat(kcal);
    localStorage.setItem("pegasus_today_kcal", todayKcal.toFixed(1));

    const emsEntry = {
        id: "ems_" + timestamp,
        date: date,
        type: "EMS Training",
        stats: { intensity: parseFloat(avg).toFixed(1) + "%", energy: parseInt(kcal) + " kcal" },
        completed: true
    };

    try {
        let dayHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
        dayHistory = dayHistory.filter(item => item.type !== "EMS Training");
        dayHistory.push(emsEntry);
        localStorage.setItem(historyKey, JSON.stringify(dayHistory));
        localStorage.setItem(`pegasus_day_status_${date}`, 'COMPLETED');

        // ΚΡΙΣΙΜΟ: Υποχρεωτική αναμονή (await) για να μην κοπεί η σύνδεση
        if (window.PegasusCloud) {
            await window.PegasusCloud.push(true);
        }
        
        alert(`PEGASUS SYNC: Πιστώθηκαν 36 σετ. Η Τετάρτη ολοκληρώθηκε.`);
        window.location.reload();
    } catch (e) {
        console.error("Storage Error:", e);
    }
};

function createEMSModal() {
    const div = document.createElement('div');
    div.id = 'emsModal';
    div.className = 'pegasus-panel';
    div.style.cssText = "position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:#0a0a0a; border:1px solid #4CAF50; padding:25px; border-radius:15px; z-index:10005; width:300px; text-align:center;";
    div.innerHTML = `
        <h2 style="color:#4CAF50; margin-bottom:15px;">⚡ EMS LOG</h2>
        <input type="date" id="emsDate" style="width:100%; margin-bottom:10px; background:#111; color:#fff; border:1px solid #333; padding:8px;">
        <input type="number" id="emsAvg" placeholder="Ένταση %" style="width:100%; margin-bottom:10px; background:#111; color:#fff; border:1px solid #333; padding:8px;">
        <input type="number" id="emsKcal" placeholder="Θερμίδες" style="width:100%; margin-bottom:15px; background:#111; color:#fff; border:1px solid #333; padding:8px;">
        <button onclick="saveEMSFinal()" style="width:100%; background:#4CAF50; color:#000; border:none; padding:12px; font-weight:bold; border-radius:5px; cursor:pointer;">ΚΑΤΑΓΡΑΦΗ</button>
    `;
    document.body.appendChild(div);
    return div;
}
