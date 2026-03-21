/* ==========================================================================
   PEGASUS CLOUD VAULT - ULTRA SAFE SYNC (v13.2)
   FEAT: CRASH PREVENTION & AUTO-RELOAD
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

    safeParse: function(key, fallback) {
        try {
            const val = localStorage.getItem(key);
            return val ? JSON.parse(val) : fallback;
        } catch (e) {
            console.warn("Αγνόηση κατεστραμμένου κλειδιού:", key);
            return fallback;
        }
    },

    unlock: function(pin) {
        if (!pin) return false;
        const cleanPin = pin.trim();
        if (btoa(cleanPin) === "MjM3NQ==") { 
            this.userKey = this.config.encryptedPart;
            this.isUnlocked = true;
            localStorage.setItem("pegasus_vault_pin", cleanPin);
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
            
            let requiresUIReload = false;

            const dayKey = "food_log_" + this.getTodayKey();
            localStorage.setItem(dayKey, JSON.stringify(actualData.today_food_log || []));
            
            if (actualData.weekly_history) {
                const localWeekly = localStorage.getItem('pegasus_weekly_history');
                const cloudWeekly = JSON.stringify(actualData.weekly_history);
                if (localWeekly && localWeekly !== cloudWeekly) requiresUIReload = true;
                localStorage.setItem('pegasus_weekly_history', cloudWeekly);
            }
            
            if (actualData.food_library) localStorage.setItem('pegasus_food_library', JSON.stringify(actualData.food_library));

            if (actualData.cardio_logs) {
                Object.keys(actualData.cardio_logs).forEach(k => {
                    const localVal = localStorage.getItem(k);
                    const cloudVal = JSON.stringify(actualData.cardio_logs[k]);
                    if (localVal && localVal !== cloudVal) requiresUIReload = true; 
                    localStorage.setItem(k, cloudVal);
                });
            }
            
            if (actualData.history_logs) {
                Object.keys(actualData.history_logs).forEach(k => {
                    let val = actualData.history_logs[k];
                    const cloudVal = typeof val === 'string' ? val : JSON.stringify(val);
                    const localVal = localStorage.getItem(k);
                    if (localVal && localVal !== cloudVal && k.includes('pegasus_history')) requiresUIReload = true;
                    localStorage.setItem(k, cloudVal);
                });
            }

            console.log("✅ PC Pull Complete");
            
            if (requiresUIReload) {
                window.location.reload();
            } else if (typeof window.updateFoodUI === "function") {
                window.updateFoodUI();
            }
        } catch (e) { console.error("❌ PC Pull Error", e); }
    },

    push: async function(silent = true) {
        if (!this.isUnlocked) return;
        const todayStr = this.getTodayKey();
        
        const cardioLogs = {};
        const historyLogs = {};
        
        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            try {
                if (key.startsWith('cardio_log_')) cardioLogs[key] = JSON.parse(localStorage.getItem(key));
                if (key.startsWith('pegasus_history_')) historyLogs[key] = JSON.parse(localStorage.getItem(key));
                if (key.startsWith('pegasus_day_status_')) historyLogs[key] = localStorage.getItem(key);
            } catch(e) {} // Αθόρυβη προσπέραση σφαλμάτων
        }

        const payload = {
            last_update_date: todayStr,
            today_food_log: this.safeParse("food_log_" + todayStr, []),
            weekly_history: this.safeParse('pegasus_weekly_history', {}),
            food_library: this.safeParse('pegasus_food_library', []),
            cardio_logs: cardioLogs,
            history_logs: historyLogs
        };

        try {
            await fetch("https://api.jsonbin.io/v3/b/" + this.config.binId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': this.userKey },
                body: JSON.stringify(payload)
            });
            console.log("✅ PC Push Success");
        } catch (e) { console.error("❌ PC Push Error", e); }
    }
};

window.PegasusCloud = PegasusCloud;

window.addEventListener('load', () => {
    const savedPin = localStorage.getItem("pegasus_vault_pin");
    if (savedPin && window.PegasusCloud.unlock(savedPin)) return; 
    
    localStorage.removeItem("pegasus_vault_pin");
    setTimeout(() => {
        const pin = prompt("PEGASUS VAULT: Εισάγετε PIN:");
        if (pin && !window.PegasusCloud.unlock(pin)) alert("ΛΑΘΟΣ PIN. Πατήστε F5 για νέα προσπάθεια.");
    }, 1000);
});
