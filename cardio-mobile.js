window.PegasusCardio = {
    save: async function() {
        const km = parseFloat(document.getElementById('cdKm').value) || 0; 
        const route = (document.getElementById('cdRoute').value || "").toUpperCase();
        
        if(km > 0) { 
            let history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
            // Πίστωση: Ποδηλασία = 18 σετ, Τρέξιμο κλπ = 1 σετ ανά 2km
            const credit = (route.includes("ΠΟΔΗΛΑΣΙΑ") || route.includes("CYCLING")) ? 18 : Math.max(1, Math.floor(km/2));
            
            history["Πόδια"] = (history["Πόδια"] || 0) + credit;
            localStorage.setItem('pegasus_weekly_history', JSON.stringify(history)); 
            console.log(`🚴 CARDIO: Credited ${credit} sets to Legs.`);
        }
        
        openView('home');
        if(window.PegasusCloud) await PegasusCloud.push();
    }
};