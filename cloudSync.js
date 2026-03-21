/* ==========================================================================
   PEGASUS CLOUD VAULT - UNIFIED SYNC (v13.5)
   FIX: FULL DATA PAYLOAD & BACKGROUND POLLING
   ========================================================================== */

const PegasusCloud = {
    config: {
        binId: "69b6757ab7ec241ddc6d7230",
        encryptedPart: "$2a$10$oU/TyQjSeNEVr/k5dnFS8ulKZkbb9gUWd5xuXijAYFCBijuXrYAFC" 
    },
    
    isUnlocked: false,
    userKey: "",
    syncInterval: null,

    getTodayKey: function() {
        const d = new Date();
        return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
    },

    safeParse: function(key, fallback) {
        try {
            const val = localStorage.getItem(key);
            return val ? JSON.parse(val) : fallback;
        } catch (e) { return fallback; }
    },

    unlock: function(pin) {
        if (!pin) return false;
        const cleanPin = pin.trim();
        if (btoa(cleanPin) === "MjM3NQ==") { 
            this.userKey = this.config.encryptedPart;
            this.isUnlocked = true;
            localStorage.setItem("pegasus_vault_pin", cleanPin);
            
            this.pull(true);
            
            // ΕΝΕΡΓΟΠΟΙΗΣΗ ΑΥΤΟΜΑΤΟΥ ΣΥΓΧΡΟΝΙΣΜΟΥ (Κάθε 10 δευτερόλεπτα)
            if (!this.syncInterval) {
                this.syncInterval = setInterval(() => {
                    if (this.isUnlocked) this.pull(true);
                }, 10000);
            }
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
            const cloud = cloudData.record || cloudData;
            
            const dateStr = this.getTodayKey();
            const lastPush = localStorage.getItem("pegasus_last_push") || "0";

            if (cloud.last_update_ts && cloud.last_update_ts.toString() !== lastPush) {
                let requiresUIReload = false;

                // 1. Weekly History Sync
                if (cloud.weekly_history) {
                    localStorage.setItem('pegasus_weekly_history', JSON.stringify(cloud.weekly_history));
                    requiresUIReload = true;
                }
                
                // 2. Food Library Sync
                if (cloud.food_library) localStorage.setItem('pegasus_food_library', JSON.stringify(cloud.food_library));
                
                // 3. Today Food Sync
                if (cloud.last_update_date === dateStr) { 
                    localStorage.setItem(`food_log_${dateStr}`, JSON.stringify(cloud.today_food_log || [])); 
                    localStorage.setItem("pegasus_today_kcal", cloud.kcal || "0"); 
                    localStorage.setItem("pegasus_today_protein", cloud.protein || "0"); 
                    requiresUIReload = true;
                }

                // 4. Cardio & EMS Logs Sync
                if (cloud.cardio_logs) {
                    Object.keys(cloud.cardio_logs).forEach(k => localStorage.setItem(k, JSON.stringify(cloud.cardio_logs[k])));
                }
                if (cloud.history_logs) {
                    Object.keys(cloud.history_logs).forEach(k => {
                        let val = cloud.history_logs[k];
                        localStorage.setItem(k, typeof val === 'string' ? val : JSON.stringify(val));
                    });
                }

                localStorage.setItem("pegasus_last_push", cloud.last_update_ts.toString());
                if (requiresUIReload && typeof window.updateFoodUI === "function") window.updateFoodUI();
            }
        } catch (e) {}
    },

    push: async function(silent = true) {
        if (!this.isUnlocked) return;
        const dateStr = this.getTodayKey();
        const syncTimestamp = Date.now();
        
        const cardioLogs = {};
        const historyLogs = {};
        
        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            try {
                if (key.startsWith('cardio_log_')) cardioLogs[key] = JSON.parse(localStorage.getItem(key));
                if (key.startsWith('pegasus_history_')) historyLogs[key] = JSON.parse(localStorage.getItem(key));
                if (key.startsWith('pegasus_day_status_')) historyLogs[key] = localStorage.getItem(key);
            } catch(e) {}
        }

        const payload = {
            last_update_date: dateStr, 
            last_update_ts: syncTimestamp, 
            kcal: localStorage.getItem("pegasus_today_kcal") || "0", 
            protein: localStorage.getItem("pegasus_today_protein") || "0", 
            weekly_history: this.safeParse("pegasus_weekly_history", {}), 
            food_library: this.safeParse("pegasus_food_library", []), 
            today_food_log: this.safeParse(`food_log_${dateStr}`, []),
            cardio_logs: cardioLogs,
            history_logs: historyLogs
        };

        try {
            await fetch("https://api.jsonbin.io/v3/b/" + this.config.binId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': this.userKey },
                body: JSON.stringify(payload)
            });
            localStorage.setItem("pegasus_last_push", syncTimestamp.toString());
            console.log("✅ PEGASUS Cloud Sync: Push Success");
        } catch (e) {}
    }
};

window.PegasusCloud = PegasusCloud;

window.addEventListener('load', () => {
    const savedPin = localStorage.getItem("pegasus_vault_pin");
    if (savedPin && window.PegasusCloud.unlock(savedPin)) return; 
    
    localStorage.removeItem("pegasus_vault_pin");
    setTimeout(() => {
        const pin = prompt("PEGASUS VAULT: Εισάγετε PIN:");
        if (pin && !window.PegasusCloud.unlock(pin)) alert("ΛΑΘΟΣ PIN.");
    }, 1000);
});
