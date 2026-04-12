/* ==========================================================================
   PEGASUS OS - CARDIO & CYCLING AUTOMATION ENGINE (v2.0)
   Protocol: Data Minimization & Auto-Trigger Muscle Groups
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

    // 1. 🛡️ ΑΥΤΟΜΑΤΗ ΚΑΤΑΓΡΑΦΗ ΜΥΪΚΗΣ ΟΜΑΔΑΣ (+18 Σετ Πόδια)
    if (window.logPegasusSet) {
        window.logPegasusSet("Cycling");
        console.log("✅ CARDIO: Muscle group 'Πόδια' updated (+18 sets).");
    }

    // 2. 🔥 ΠΡΟΣΘΗΚΗ ΘΕΡΜΙΔΩΝ ΣΤΟ ΕΝΕΡΓΕΙΑΚΟ ΙΣΟΖΥΓΙΟ
    let currentWeekly = parseFloat(localStorage.getItem("pegasus_weekly_kcal")) || 0;
    localStorage.setItem("pegasus_weekly_kcal", (currentWeekly + kcal).toFixed(1));

    // 3. 💾 ΑΠΟΘΗΚΕΥΣΗ ΣΤΟ ΙΣΤΟΡΙΚΟ 
    let history = JSON.parse(localStorage.getItem("pegasus_cardio_history") || "[]");
    history.unshift({ 
        date: new Date().toLocaleDateString('el-GR'), 
        type: "Ποδηλασία", 
        km: km, 
        kcal: kcal 
    });
    localStorage.setItem("pegasus_cardio_history", JSON.stringify(history));

    // 4. ΕΝΗΜΕΡΩΣΗ ΣΥΣΤΗΜΑΤΟΣ & CLOUD
    if (typeof window.updateKcalUI === "function") window.updateKcalUI();
    if (window.PegasusCloud) await window.PegasusCloud.push(true);

    // Reset & Close
    document.getElementById('cKm').value = "";
    document.getElementById('cKcal').value = "";
    window.PegasusCardio.close();
};
