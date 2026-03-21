/* ==========================================================================
   PEGASUS CLOUD VAULT - DEEP SYNC EDITION (v13.0)
   FEAT: FULL CARDIO & EMS HISTORY SYNCHRONIZATION
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
        const cleanPin = pin.trim();
        
        if (btoa(cleanPin) === "MjM3NQ==") { 
            this.userKey = this.config.encryptedPart;
            this.isUnlocked = true;
            localStorage.setItem("pegasus_vault_pin", cleanPin);
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
            const actualData = cloudData.record || cloudData;
            
            const dayKey = "food_log_" + this.getTodayKey();
            const cloudLog = actualData.today_food_log || [];
            localStorage.setItem(dayKey, JSON.stringify(cloudLog));
            
            if (actualData.weekly_history) localStorage.setItem('pegasus_weekly_history', JSON.stringify(actualData.weekly_history));
            if (actualData.food_library) localStorage.setItem('pegasus_food_library', JSON.stringify(actualData.food_library));

            // DEEP SYNC: Ανάκτηση όλου του Ιστορικού Cardio & EMS
            if (actualData.cardio_logs) {
                Object.keys(actualData.cardio_logs).forEach(k => localStorage.setItem(k, JSON.stringify(actualData.cardio_logs[k])));
            }
            if (actualData.history_logs) {
                Object.keys(actualData.history_logs).forEach(k => {
                    let val = actualData.history_logs[k];
                    localStorage.setItem(k, typeof val === 'string' ? val : JSON.stringify(val));
                });
            }

            console.log("✅ Deep-Pull Complete");
            if (typeof window.updateFoodUI === "function") window.updateFoodUI();
        } catch (e) { console.error("❌ Pull Error", e); }
    },

    push: async function(silent = true) {
        if (!this.isUnlocked) return;
        const todayStr = this.getTodayKey();
        
        // DEEP SYNC: Σάρωση όλης της μνήμης για δεδομένα
        const cardioLogs = {};
        const historyLogs = {};
        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            if (key.startsWith('cardio_log_')) cardioLogs[key] = JSON.parse(localStorage.getItem(key));
            if (key.startsWith('pegasus_history_')) historyLogs[key] = JSON.parse(localStorage.getItem(key));
            if (key.startsWith('pegasus_day_status_')) historyLogs[key] = localStorage.getItem(key);
        }

        const payload = {
            last_update_date: todayStr,
            today_food_log: JSON.parse(localStorage.getItem("food_log_" + todayStr) || "[]"),
            weekly_history: JSON.parse(localStorage.getItem('pegasus_weekly_history') || "{}"),
            food_library: JSON.parse(localStorage.getItem('pegasus_food_library') || "[]"),
            cardio_logs: cardioLogs,
            history_logs: historyLogs
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

window.PegasusCloud = PegasusCloud;

window.addEventListener('load', () => {
    const savedPin = localStorage.getItem("pegasus_vault_pin");
    if (savedPin && window.PegasusCloud.unlock(savedPin)) return; 
    
    localStorage.removeItem("pegasus_vault_pin");
    setTimeout(() => {
        const pin = prompt("PEGASUS VAULT: Εισάγετε PIN:");
        if (pin && !window.PegasusCloud.unlock(pin)) {
            alert("ΛΑΘΟΣ PIN. Πατήστε F5 για νέα προσπάθεια.");
        }
    }, 1000);
});
