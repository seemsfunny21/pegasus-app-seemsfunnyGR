/* ==========================================================================
   PEGASUS CLOUD VAULT - STABLE EDITION (v12.0)
   FIX: F5 REFRESH BUG & DATA STRUCTURE FAILSAFE
   ========================================================================== */

const PegasusCloud = {
    config: {
        binId: "69b6757ab7ec241ddc6d7230",
        encryptedPart: "$2a$10$oU/TyQjSeNEVr/k5dnFS8ulKZkbb9gUWd5xuXijAYFCBijuXrYAFC" 
    },
    
    isUnlocked: false,
    userKey: "",

    getTodayKey: function() {
        const d = new Date();
        return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
    },

    unlock: function(pin) {
        if (!pin) return false;
        const cleanPin = pin.trim(); // Αφαίρεση τυχόν κενών χαρακτήρων
        
        if (btoa(cleanPin) === "MjM3NQ==") { 
            this.userKey = this.config.encryptedPart;
            this.isUnlocked = true;
            localStorage.setItem("pegasus_vault_pin", cleanPin); // Αποθήκευση για να μην το ζητάει στο F5
            console.log("PEGASUS: Vault Unlocked. Pulling data...");
            this.pull(true);
            return true;
        }
        return false;
    },

    pull: async function(silent = false) {
        if (!this.isUnlocked) return;
        try {
            const res = await fetch("https://api.jsonbin.io/v3/b/" + this.config.binId + "/latest?nocache=" + Date.now(), {
                headers: { 'X-Master-Key': this.userKey, 'X-Bin-Meta': 'false' }
            });
            const cloudData = await res.json();
            
            // Failsafe: Αν το JSONBin τυλίξει τα δεδομένα στο "record", τα εξάγουμε σωστά.
            const actualData = cloudData.record || cloudData;
            
            const dayKey = "food_log_" + this.getTodayKey();
            const cloudLog = actualData.today_food_log || [];
            
            localStorage.setItem(dayKey, JSON.stringify(cloudLog));
            
            if (actualData.weekly_history) localStorage.setItem('pegasus_weekly_history', JSON.stringify(actualData.weekly_history));
            if (actualData.food_library) localStorage.setItem('pegasus_food_library', JSON.stringify(actualData.food_library));

            console.log("✅ Auto-Pull Complete. Items: " + cloudLog.length);
            
            if (typeof window.updateFoodUI === "function") window.updateFoodUI();
        } catch (e) { console.error("❌ Pull Error", e); }
    },

    push: async function(silent = true) {
        if (!this.isUnlocked) return;
        const todayStr = this.getTodayKey();
        const payload = {
            last_update_date: todayStr,
            today_food_log: JSON.parse(localStorage.getItem("food_log_" + todayStr) || "[]"),
            weekly_history: JSON.parse(localStorage.getItem('pegasus_weekly_history') || "{}"),
            food_library: JSON.parse(localStorage.getItem('pegasus_food_library') || "[]")
        };

        try {
            await fetch("https://api.jsonbin.io/v3/b/" + this.config.binId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': this.userKey },
                body: JSON.stringify(payload)
            });
            console.log("✅ PEGASUS Auto-Push Success");
        } catch (e) { console.error("❌ Push Error", e); }
    }
};

// ΕΞΑΓΩΓΗ ΣΤΟ GLOBAL WINDOW (Απαραίτητο για το food.js)
window.PegasusCloud = PegasusCloud;

// ΕΚΚΙΝΗΣΗ & ΕΛΕΓΧΟΣ ΜΝΗΜΗΣ
window.addEventListener('load', () => {
    const savedPin = localStorage.getItem("pegasus_vault_pin");
    
    // Αν υπάρχει PIN στη μνήμη (π.χ. μετά από F5), ξεκλειδώνει αθόρυβα
    if (savedPin && window.PegasusCloud.unlock(savedPin)) {
        return; 
    }
    
    // Αν δεν υπάρχει μνήμη (πρώτη φορά στο Incognito), ζητάει PIN
    localStorage.removeItem("pegasus_vault_pin");
    setTimeout(() => {
        const pin = prompt("PEGASUS VAULT: Εισάγετε PIN:");
        if (pin && !window.PegasusCloud.unlock(pin)) {
            alert("ΛΑΘΟΣ PIN. Πατήστε F5 για νέα προσπάθεια.");
        }
    }, 1000);
});
