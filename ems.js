/* ==========================================================================
   PEGASUS EMS MODULE - v4.1 FULL RESTORATION
   Protocol: Strict Data Analyst - Zero Logic Loss
   ========================================================================== */

/**
 * 1. ΗΜΕΡΟΛΟΓΙΑΚΟΣ ΥΠΟΛΟΓΙΣΜΟΣ (Πλήρης Λογική v3.2)
 */
function getTargetWednesday() {
    const now = new Date();
    
    // ΔΙΟΡΘΩΣΗ: Προσαρμογή στην Ελληνική εβδομάδα (Κυριακή = 7 αντί για 0)
    let currentDay = now.getDay(); 
    if (currentDay === 0) currentDay = 7; 
    
    // Υπολογισμός διαφοράς για την Τετάρτη (Ημέρα 3) της τρέχουσας εβδομάδας
    const diff = 3 - currentDay;
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + diff);
    
    // Αποφυγή σφάλματος Timezone (UTC)
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * 2. ΕΚΚΙΝΗΣΗ UI (Πλήρης Λογική v3.2)
 */
window.logEMSData = function() {
    console.log("PEGASUS: EMS Entry Triggered.");
    
    const toolsPanel = document.getElementById('toolsPanel');
    if (toolsPanel) toolsPanel.style.display = 'none';

    // Αν δεν υπάρχει το Modal στο HTML, το δημιουργεί δυναμικά (Safe Guard)
    const emsModal = document.getElementById('emsModal') || createEMSModal();
    
    const dateInput = document.getElementById('emsDate');
    const avgInput = document.getElementById('emsAvg');
    const kcalInput = document.getElementById('emsKcal');

    if (dateInput) dateInput.value = getTargetWednesday();
    if (avgInput) avgInput.value = ""; 
    if (kcalInput) kcalInput.value = ""; 

    emsModal.style.display = 'block';
    setTimeout(() => { if(avgInput) avgInput.focus(); }, 100);
};

/**
 * 3. ΑΠΟΘΗΚΕΥΣΗ ΚΑΙ ΣΥΓΧΡΟΝΙΣΜΟΣ (Πλήρης Λογική v3.2)
 */
window.saveEMSFinal = async function() {
    const date = document.getElementById('emsDate')?.value;
    const avg = document.getElementById('emsAvg')?.value;
    const kcal = document.getElementById('emsKcal')?.value;

    if (!date || isNaN(parseFloat(avg)) || isNaN(parseFloat(kcal))) {
        alert("ΑΠΟΤΥΧΙΑ: Εισάγετε έγκυρα αριθμητικά δεδομένα.");
        return;
    }

    const timestamp = Date.now();
    const historyKey = `pegasus_history_${date}`;
    const weeklyKey = 'pegasus_weekly_history';
    
    // Πίστωση Σετ στις Μυϊκές Ομάδες
    let weeklyStats = JSON.parse(localStorage.getItem(weeklyKey)) || {
        "Στήθος": 0, "Πλάτη": 0, "Πόδια": 0, "Χέρια": 0, "Ώμοι": 0, "Κορμός": 0
    };
    const groups = ["Στήθος", "Πλάτη", "Πόδια", "Χέρια", "Ώμοι", "Κορμός"];
    groups.forEach(group => {
        weeklyStats[group] = (weeklyStats[group] || 0) + 6;
    });
    localStorage.setItem(weeklyKey, JSON.stringify(weeklyStats));

    // Ενημέρωση Θερμίδων Διατροφής (pegasus_diet_kcal για συγχρονισμό με data.js)
    let dietKcalKey = "pegasus_diet_kcal";
    let currentDietKcal = parseFloat(localStorage.getItem(dietKcalKey)) || 0;
    localStorage.setItem(dietKcalKey, (currentDietKcal + parseFloat(kcal)).toFixed(1));

    // Καταγραφή στο Ιστορικό Ημέρας
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

        // Υποχρεωτική αναμονή για Cloud Sync
        if (window.PegasusCloud) {
            console.log("PEGASUS: Triggering Cloud Push...");
            await window.PegasusCloud.push(true);
        }
        
        alert(`PEGASUS SYNC: Πιστώθηκαν 36 σετ. Η Τετάρτη ολοκληρώθηκε.`);
        window.location.reload();
    } catch (e) {
        console.error("Storage Error:", e);
        alert("Σφάλμα κατά την αποθήκευση.");
    }
};

/**
 * 4. UI HELPER: CLOSE MODAL
 */
window.closeEMSModal = function() {
    const modal = document.getElementById('emsModal');
    if (modal) modal.style.display = 'none';
};

/**
 * 5. DYNAMIC MODAL CREATOR (Πλήρης Λογική v3.2)
 * Διασφαλίζει ότι το UI θα υπάρχει ακόμα και αν λείπει από το HTML
 */
function createEMSModal() {
    if (document.getElementById('emsModal')) return document.getElementById('emsModal');
    
    const div = document.createElement('div');
    div.id = 'emsModal';
    div.className = 'pegasus-panel';
    div.style.cssText = "position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:#0a0a0a; border:2px solid #4CAF50; padding:25px; border-radius:15px; z-index:99999; width:320px; text-align:center; box-shadow: 0 0 30px rgba(0,0,0,1); color:white;";
    
    div.innerHTML = `
        <h3 style="color:#4CAF50; margin-top:0;">⚡ ΚΑΤΑΓΡΑΦΗ EMS</h3>
        <div style="margin-top:15px;">
            <label style="color:#888; font-size:11px; display:block; margin-bottom:5px;">ΗΜΕΡΟΜΗΝΙΑ:</label>
            <input type="date" id="emsDate" style="width:100%; background:#000; color:#4CAF50; border:1px solid #4CAF50; padding:10px; border-radius:5px; box-sizing:border-box; text-align:center;">
        </div>
        <div style="margin-top:15px;">
            <label style="color:#888; font-size:11px; display:block; margin-bottom:5px;">ΜΕΣΗ ΕΝΤΑΣΗ (%):</label>
            <input type="number" id="emsAvg" step="0.1" style="width:100%; background:#000; color:#4CAF50; border:1px solid #4CAF50; padding:10px; border-radius:5px; box-sizing:border-box; text-align:center;">
        </div>
        <div style="margin-top:15px;">
            <label style="color:#888; font-size:11px; display:block; margin-bottom:5px;">ΘΕΡΜΙΔΕΣ (KCAL):</label>
            <input type="number" id="emsKcal" style="width:100%; background:#000; color:#4CAF50; border:1px solid #4CAF50; padding:10px; border-radius:5px; box-sizing:border-box; text-align:center; margin-bottom:20px;">
        </div>
        <div style="display:flex; gap:10px;">
            <button onclick="saveEMSFinal()" style="flex:1; background:#4CAF50; color:black; border:none; padding:12px; border-radius:5px; cursor:pointer; font-weight:bold;">ΣΩΣΕ</button>
            <button onclick="closeEMSModal()" style="flex:1; background:#333; color:white; border:none; padding:12px; border-radius:5px; cursor:pointer;">ΑΚΥΡΟ</button>
        </div>
    `;
    document.body.appendChild(div);
    return div;
}
