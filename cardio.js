/* ==========================================================================
   PEGASUS OS - CARDIO & CYCLING AUTOMATION ENGINE (v2.1)
   Protocol: Data Minimization & Auto-Trigger Muscle Groups
   Status: FIXED - CROSS-PLATFORM LOGIC ALIGNMENT
   ========================================================================== */

window.PegasusCardio = {
    open: function() {
        document.getElementById('cardioPanel').style.display = 'block';
        
        // Κρυφή Αυτοματοποίηση Δεδομένων (Αόρατη στον χρήστη)
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('cDate');
        if (dateInput) dateInput.value = today;

        const routeInput = document.getElementById('cRoute');
        if (routeInput) routeInput.value = "Ποδηλασία";

        const timeInput = document.getElementById('cTime');
        if (timeInput) timeInput.value = "Auto"; 
    },
    close: function() {
        document.getElementById('cardioPanel').style.display = 'none';
    }
};

window.saveCardioData = async function() {
    const km = parseFloat(document.getElementById('cKm').value);
    const kcal = parseFloat(document.getElementById('cKcal').value);

    if (!km || !kcal) {
        alert("Παρακαλώ συμπληρώστε Χιλιόμετρα και Θερμίδες.");
        return;
    }

    console.log("🚴 CARDIO ENGINE: Processing Automated Cycling Entry...");

    // 🎯 FIXED: Unified Date Padding Protocol (DD/MM/YYYY)
    const rawDate = new Date();
    const dStr = String(rawDate.getDate()).padStart(2, '0');
    const mStr = String(rawDate.getMonth() + 1).padStart(2, '0');
    const dateStr = `${dStr}/${mStr}/${rawDate.getFullYear()}`;

    // 1. 🛡️ ΑΥΤΟΜΑΤΗ ΚΑΤΑΓΡΑΦΗ ΜΥΪΚΗΣ ΟΜΑΔΑΣ (+18 Σετ Πόδια)
    if (window.logPegasusSet) {
        window.logPegasusSet("Cycling");
        console.log("✅ CARDIO: Muscle group 'Πόδια' updated (+18 sets).");
    }

    // 2. 🔥 ΠΡΟΣΘΗΚΗ ΘΕΡΜΙΔΩΝ ΣΤΟ ΕΝΕΡΓΕΙΑΚΟ ΙΣΟΖΥΓΙΟ
    let currentWeekly = parseFloat(localStorage.getItem("pegasus_weekly_kcal")) || 0;
    localStorage.setItem("pegasus_weekly_kcal", (currentWeekly + kcal).toFixed(1));

    // 🎯 FIXED: Συγχρονισμός με το Mobile Cardio Guard
    // Αποθηκεύουμε τις θερμίδες και στο ημερήσιο κλειδί για να το βλέπει το EMS στο κινητό
    let dailyCardio = parseFloat(localStorage.getItem("pegasus_cardio_kcal_" + dateStr)) || 0;
    localStorage.setItem("pegasus_cardio_kcal_" + dateStr, (dailyCardio + kcal).toFixed(1));

    // 3. 💾 ΑΠΟΘΗΚΕΥΣΗ ΣΤΟ ΙΣΤΟΡΙΚΟ 
    let history = JSON.parse(localStorage.getItem("pegasus_cardio_history") || "[]");
    history.unshift({ 
        date: dateStr, 
        type: "Ποδηλασία",
        km: km,
        kcal: kcal
    });
    localStorage.setItem("pegasus_cardio_history", JSON.stringify(history.slice(0, 20)));

    alert(`✅ Η καταγραφή ολοκληρώθηκε!\nΚάψατε: ${kcal} kcal\nΠιστώθηκαν: +18 σετ στα Πόδια.`);
    window.PegasusCardio.close();
    
    if (window.PegasusCloud) await window.PegasusCloud.push(true);
};
