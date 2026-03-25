/* ==========================================================================
   PEGASUS EMS MODULE - STRICT ANALYST EDITION (V3.2)
   Unified Keys & Secure Async Sync
   ========================================================================== */

function getTargetWednesday() {
    const now = new Date();
    const currentDay = now.getDay(); 
    const diff = 3 - currentDay;
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + diff);
    return targetDate.toISOString().split('T')[0];
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
        alert("ΑΠΟΤΥΧΙΑ: Εισάγετε έγκυρα δεδομένα.");
        return;
    }

    // UNIFIED KEYS: Συμβατότητα με mobile.html και Cloud Sync
    const weeklyKey = 'peg_weekly_history'; 
    const kcalKey = 'peg_today_kcal';
    const historyKey = `peg_history_${date}`;

    // 1. Ενημέρωση Σετ
    let weeklyStats = JSON.parse(localStorage.getItem(weeklyKey)) || {
        "Στήθος": 0, "Πλάτη": 0, "Πόδια": 0, "Χέρια": 0, "Ώμοι": 0, "Κορμός": 0
    };
    const groups = ["Στήθος", "Πλάτη", "Πόδια", "Χέρια", "Ώμοι", "Κορμός"];
    groups.forEach(group => { weeklyStats[group] = (weeklyStats[group] || 0) + 6; });
    localStorage.setItem(weeklyKey, JSON.stringify(weeklyStats));

    // 2. Ενημέρωση Θερμίδων
    let todayKcal = parseFloat(localStorage.getItem(kcalKey)) || 0;
    todayKcal += parseFloat(kcal);
    localStorage.setItem(kcalKey, todayKcal.toFixed(1));

    // 3. Καταγραφή Ιστορικού
    const emsEntry = {
        id: "ems_" + Date.now(),
        date: date,
        type: "EMS Training",
        stats: { intensity: parseFloat(avg).toFixed(1) + "%", energy: parseInt(kcal) + " kcal" },
        completed: true
    };

    try {
        let dayHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
        dayHistory.push(emsEntry);
        localStorage.setItem(historyKey, JSON.stringify(dayHistory));
        localStorage.setItem(`peg_day_status_${date}`, 'COMPLETED');

        // ΚΡΙΣΙΜΟ: Αναμονή επιβεβαίωσης από τον server
        if (window.PegasusCloud) {
            await window.PegasusCloud.push(true);
        }
        
        alert(`PEGASUS SYNC: Η προπόνηση αποθηκεύτηκε.`);
        window.location.reload();
    } catch (e) {
        console.error("Critical Sync Error:", e);
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
