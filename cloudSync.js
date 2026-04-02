/* ==========================================================================
   PEGASUS CLOUD VAULT - CORE SYNC (v14.8 - MAXIMALIST EDITION)
   Protocol: Strict Data Analyst - Dual Mode Architecture
   Features: Vehicle Data, Supplement Interceptor, Offline Guard Patch
   ========================================================================== */

const PegasusCloud = {
    config: {
        binId: "69b6757ab7ec241ddc6d7230",
        encryptedPart: "$2a$10$oU/TyQjSeNEVr/k5dnFS8ulKZkbb9gUWd5xuXijAYFCBijuXrYAFC" 
    },
    
    isUnlocked: false,
    hasSuccessfullyPulled: true, // PEGASUS PATCH: Disarmed Guard for Desktop Stability
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
            
            if (!this.syncInterval) {
                this.syncInterval = setInterval(() => {
                    if (this.isUnlocked) this.pull(true);
                }, 30000); 
            }
            return true;
        }
        return false;
    },

    pull: async function(silent = false) {
        if (!this.isUnlocked) return;
        try {
            const res = await fetch("https://api.jsonbin.io/v3/b/" + this.config.binId + "/latest?nocache=" + Date.now(), {
                headers: { 
                    'X-Master-Key': this.userKey, 
                    'X-Bin-Meta': 'false',
                    'Content-Type': 'application/json'
                }
            });
            const cloudData = await res.json();
            const cloud = cloudData.record || cloudData;
            
            const dateStr = this.getTodayKey();
            const lastPush = localStorage.getItem("pegasus_last_push") || "0";

            if (cloud.last_update_ts && cloud.last_update_ts.toString() !== lastPush) {
                console.log("☁️ PEGASUS: New Cloud Data Found. Syncing Full Registry...");
                let requiresUIReload = false;

                // 1. Core Profile & Stats
                if (cloud.muscle_targets) localStorage.setItem('pegasus_muscle_targets', JSON.stringify(cloud.muscle_targets));
                if (cloud.peg_stats) localStorage.setItem('pegasus_stats', JSON.stringify(cloud.peg_stats));
                if (cloud.weekly_history) {
                    localStorage.setItem('pegasus_weekly_history', JSON.stringify(cloud.weekly_history));
                    requiresUIReload = true;
                }
                
                // 2. Inventory & Logistics
                if (cloud.supp_inventory) localStorage.setItem('pegasus_supp_inventory', JSON.stringify(cloud.supp_inventory));
                if (cloud.peg_contacts) localStorage.setItem('pegasus_contacts', JSON.stringify(cloud.peg_contacts));
                
                // 3. Vehicle & Documents (v1.2 Manifest Alignment)
                if (cloud.car_dates) localStorage.setItem('pegasus_car_dates', JSON.stringify(cloud.car_dates));
                if (cloud.car_service) localStorage.setItem('pegasus_car_service', JSON.stringify(cloud.car_service));
                if (cloud.car_specs) localStorage.setItem('pegasus_car_specs', JSON.stringify(cloud.car_specs));
                
                // 4. Nutrition Engine
                if (cloud.food_library) localStorage.setItem('pegasus_food_library', JSON.stringify(cloud.food_library));
                if (cloud.all_food_logs) {
                    Object.keys(cloud.all_food_logs).forEach(k => {
                        localStorage.setItem(k, JSON.stringify(cloud.all_food_logs[k]));
                    });
                }

                if (cloud.last_update_date === dateStr) {
                    localStorage.setItem("pegasus_today_kcal", cloud.kcal || "0"); 
                    localStorage.setItem("pegasus_today_protein", cloud.protein || "0"); 
                    requiresUIReload = true;
                }

                // 5. Activity Logs (Cardio & History)
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
                
                // Trigger UI Updates
                if (requiresUIReload && typeof window.updateFoodUI === "function") window.updateFoodUI();
                if (typeof window.updateSuppUI === "function") window.updateSuppUI();
                if (window.MuscleProgressUI) window.MuscleProgressUI.render();
            }
            
            this.hasSuccessfullyPulled = true; 
            
        } catch (e) {
            console.error("❌ PEGASUS Cloud Pull Error:", e);
        }
    },

    push: async function(silent = true) {
        if (!this.isUnlocked || !this.hasSuccessfullyPulled) return;

        const dateStr = this.getTodayKey();
        const syncTimestamp = Date.now();
        
        const cardioLogs = {};
        const historyLogs = {};
        const allFoodLogs = {};
        
        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            try {
                if (key.startsWith('cardio_log_')) cardioLogs[key] = JSON.parse(localStorage.getItem(key));
                if (key.startsWith('pegasus_history_')) historyLogs[key] = JSON.parse(localStorage.getItem(key));
                if (key.startsWith('pegasus_day_status_')) historyLogs[key] = localStorage.getItem(key);
                if (key.startsWith('food_log_')) allFoodLogs[key] = JSON.parse(localStorage.getItem(key));
            } catch(e) {}
        }

        const payload = {
            last_update_date: dateStr, 
            last_update_ts: syncTimestamp, 
            kcal: localStorage.getItem("pegasus_today_kcal") || "0", 
            protein: localStorage.getItem("pegasus_today_protein") || "0", 
            weekly_history: this.safeParse("pegasus_weekly_history", {}), 
            food_library: this.safeParse("pegasus_food_library", []), 
            muscle_targets: this.safeParse("pegasus_muscle_targets", {}),
            peg_stats: this.safeParse("pegasus_stats", {}),
            supp_inventory: this.safeParse("pegasus_supp_inventory", {prot:2500, crea:1000}),
            peg_contacts: this.safeParse("pegasus_contacts", []),
            car_dates: this.safeParse("pegasus_car_dates", {}),
            car_service: this.safeParse("pegasus_car_service", []),
            car_specs: this.safeParse("pegasus_car_specs", {}),
            today_food_log: this.safeParse(`food_log_${dateStr}`, []),
            all_food_logs: allFoodLogs,
            cardio_logs: cardioLogs,
            history_logs: historyLogs
        };

        try {
            const res = await fetch("https://api.jsonbin.io/v3/b/" + this.config.binId, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json', 
                    'X-Master-Key': this.userKey,
                    'X-Bin-Meta': 'false' 
                },
                body: JSON.stringify(payload)
            });
            
            if (res.ok) {
                localStorage.setItem("pegasus_last_push", syncTimestamp.toString());
                if (!silent) console.log("✅ PEGASUS Cloud Sync: Push Success");
            }
        } catch (e) {
            console.error("❌ PEGASUS Cloud Sync: Push Failed", e);
        }
    }
};

window.PegasusCloud = PegasusCloud;

// Boot Load Alignment
window.addEventListener('load', () => {
    const savedPin = localStorage.getItem("pegasus_vault_pin");
    if (savedPin) {
        window.PegasusCloud.unlock(savedPin);
        const vaultBtn = document.getElementById("btnMasterVault");
        if (vaultBtn) {
            vaultBtn.textContent = "☁️ CLOUD: ΣΥΝΔΕΔΕΜΕΝΟ";
            vaultBtn.style.color = "#00ff41";
            vaultBtn.style.borderColor = "#00ff41";
        }
    }
});

/* ==========================================================================
   DATA INTERCEPTOR (SUPPLEMENT LOGISTICS)
   ========================================================================== */
window.consumeSupp = function(type, amount) {
    let s = PegasusCloud.safeParse('pegasus_supp_inventory', { prot: 2500, crea: 1000 });
    s[type] = Math.max(0, s[type] - amount);
    
    if (window.originalSetItem) {
        window.originalSetItem.call(localStorage, 'pegasus_supp_inventory', JSON.stringify(s));
    } else {
        localStorage.setItem('pegasus_supp_inventory', JSON.stringify(s));
    }
    
    if (typeof updateSuppUI === "function") updateSuppUI();
    
    setTimeout(() => {
        if (window.PegasusCloud && window.PegasusCloud.hasSuccessfullyPulled) window.PegasusCloud.push();
    }, 1000);
};

if (!window.originalSetItem) {
    window.originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        let oldArr = [];
        if (key.startsWith("food_log_")) {
            try { oldArr = JSON.parse(localStorage.getItem(key) || "[]"); } catch(e) {}
        }
        
        window.originalSetItem.apply(this, arguments);

        if (key.startsWith("food_log_")) {
            try {
                let newArr = JSON.parse(value || "[]");
                if (newArr.length > oldArr.length) {
                    let addedItem = newArr[0]; 
                    if (addedItem && addedItem.name) {
                        let fname = addedItem.name.toLowerCase();
                        if (fname.includes("πρωτε") || fname.includes("whey")) window.consumeSupp('prot', 30);
                        if (fname.includes("κρεατ") || fname.includes("creatine")) window.consumeSupp('crea', 5);
                    }
                }
            } catch(e) { console.error("Interceptor Error", e); }
        }
    };
}
