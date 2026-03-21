

/* ==========================================================================
   PEGASUS CLOUD VAULT - ACTIVE SYNC (v13.5 - STRICT DESKTOP)
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
        } catch (e) {
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

                if (cloud.weekly_history) {
                    const localWeekly = localStorage.getItem('pegasus_weekly_history');
                    const cloudWeekly = JSON.stringify(cloud.weekly_history);
                    if (localWeekly !== cloudWeekly) {
                        localStorage.setItem('pegasus_weekly_history', cloudWeekly);
                        requiresUIReload = true;
                    }
                }
                
                if (cloud.food_library) localStorage.setItem('pegasus_food_library', JSON.stringify(cloud.food_library));

                if (cloud.last_update_date === dateStr) { 
                    localStorage.setItem(`food_log_${dateStr}`, JSON.stringify(cloud.today_food_log || [])); 
                    localStorage.setItem("pegasus_today_kcal", cloud.kcal || "0"); 
                    localStorage.setItem("pegasus_today_protein", cloud.protein || "0"); 
                }

                if (cloud.cardio_logs) {
                    Object.keys(cloud.cardio_logs).forEach(k => {
                        const localVal = localStorage.getItem(k);
                        const cloudVal = JSON.stringify(cloud.cardio_logs[k]);
                        if (localVal !== cloudVal) {
                            localStorage.setItem(k, cloudVal);
                            requiresUIReload = true;
                        }
                    });
                }
                
                if (cloud.history_logs) {
                    Object.keys(cloud.history_logs).forEach(k => {
                        let val = cloud.history_logs[k];
                        const cloudVal = typeof val === 'string' ? val : JSON.stringify(val);
                        const localVal = localStorage.getItem(k);
                        if (localVal !== cloudVal && k.includes('pegasus_history')) {
                            localStorage.setItem(k, cloudVal);
                            requiresUIReload = true;
                        }
                    });
                }

                localStorage.setItem("pegasus_last_push", cloud.last_update_ts.toString());

                if (requiresUIReload) {
                    window.location.reload();
                } else if (typeof window.updateFoodUI === "function") {
                    window.updateFoodUI();
                }
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
                headers: { 'Content-Type': 'application/json', 'X-Master-Key':
