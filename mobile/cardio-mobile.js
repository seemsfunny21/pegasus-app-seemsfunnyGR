/* ===== PEGASUS OS - CARDIO MODULE (MOBILE v13.4) ===== */
window.PegasusCardio = {
    save: async function() {
        const km = parseFloat(document.getElementById('cdKm').value) || 0; 
        const burnedKcal = parseFloat(document.getElementById('cdKcalBurned').value) || 0;
        const route = (document.getElementById('cdRoute').value || "ΑΕΡΟΒΙΑ").toUpperCase();
        
        // 1. Πίστωση στα Πόδια (1 σετ ανά 2km)
        if(km > 0) { 
            let history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
            const credit = Math.max(1, Math.floor(km/2));
            history["Πόδια"] = (history["Πόδια"] || 0) + credit;
            localStorage.setItem('pegasus_weekly_history', JSON.stringify(history)); 
            console.log(`🚴 CARDIO: Credited ${credit} sets to Legs.`);
        }

        // 2. Προσθήκη θερμίδων στον σημερινό στόχο Διατροφής
        if(burnedKcal > 0) {
            const dateStr = new Date().toLocaleDateString('el-GR');
            let todayCardioKcal = parseFloat(localStorage.getItem("pegasus_cardio_kcal_" + dateStr)) || 0;
            localStorage.setItem("pegasus_cardio_kcal_" + dateStr, todayCardioKcal + burnedKcal);
        }
        
        document.getElementById('cdKm').value = "";
        document.getElementById('cdKcalBurned').value = "";
        
        openView('home');
        if(window.PegasusCloud) await PegasusCloud.push();
    }
};
