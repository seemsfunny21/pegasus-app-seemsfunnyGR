/* ==========================================================================
   PEGASUS CLOUD VAULT - CLEAN SWEEP v17.0
   Protocol: Dual-Mode Sync & DB Interceptor | Logic: JSONbin.io Integration
   ========================================================================== */

const PegasusCloud = {
    config: {
        binId: "69b6757ab7ec241ddc6d7230",
        encryptedPart: "$2a$10$oU/TyQjSeNEVr/k5dnFS8ulKZkbb9gUWd5xuXijAYFCBijuXrYAFC" 
    },
    
    isUnlocked: false,
    hasSuccessfullyPulled: false, 
    userKey: "",
    syncInterval: null,

    getTodayKey: function() {
        const d = new Date();
        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    },

    safeParse: function(key, fallback) {
        try {
            const val = localStorage.getItem(key);
            return val ? JSON.parse(val) : fallback;
        } catch (e) { return fallback; }
    },

    /**
     * Ξεκλείδωμα Vault (PIN: 2375)
     */
    unlock: function(pin) {
        if (!pin) return false;
        const cleanPin = pin.trim();
        if (btoa(cleanPin) === "MjM3NQ==") { 
            this.userKey = this.config.encryptedPart;
            this.isUnlocked = true;
            localStorage.setItem("pegasus_vault_pin", cleanPin);
            
            this.pull(true);
            
            // Αυτόματος συγχρονισμός ανά 30 δευτερόλεπτα
            if (!this.syncInterval) {
                this.syncInterval = setInterval(() => {
                    if (this.isUnlocked) this.pull(true);
                }, 30000); 
            }
            return true;
        }
        return false;
    },

    /**
     * Λήψη δεδομένων από το Cloud (Pull)
     */
    pull: async function(silent = false) {
        if (!this.isUnlocked) return;
        try {
            const res = await fetch(`https://api.jsonbin.io/v3/b/${this.config.binId}/latest?nocache=${Date.now()}`, {
                headers: { 'X-Master-Key': this.userKey, 'X-Bin-Meta': 'false' }
            });
            const cloud = await res.json();
            
            const lastPush = localStorage.getItem("pegasus_last_push") || "0";

            if (cloud.last_update_ts && cloud.last_update_ts.toString() !== lastPush) {
                // Μαζική ενημέρωση LocalStorage βάσει Cloud Snapshot
                if (cloud.peg_stats) localStorage.setItem('pegasus_stats', JSON.stringify(cloud.peg_stats));
                if (cloud.weekly_history) localStorage.setItem('pegasus_weekly_history', JSON.stringify(cloud.weekly_history));
                if (cloud.supp_inventory) localStorage.setItem('pegasus_supp_inventory', JSON.stringify(cloud.supp_inventory));
                if (cloud.food_library) localStorage.setItem('pegasus_food_library', JSON.stringify(cloud.food_library));
                
                // Συγχρονισμός Food Logs
                if (cloud.all_food_logs) {
                    Object.keys(cloud.all_food_logs).forEach(k => {
                        localStorage.setItem(k, JSON.stringify(cloud.all_food_logs[k]));
                    });
                }

                // Συγχρονισμός Cardio & History
                if (cloud.cardio_logs) {
                    Object.keys(cloud.cardio_logs).forEach(k => localStorage.setItem(k, JSON.stringify(cloud.cardio_logs[k])));
                }

                localStorage.setItem("pegasus_last_push", cloud.last_update_ts.toString());
                
                // Trigger UI Updates
                if (typeof window.updateFoodUI === "function") window.updateFoodUI();
                if (window.MuscleProgressUI) window.MuscleProgressUI.render();
                if (window.renderAchievements) window.renderAchievements();
            }
            
            this.hasSuccessfullyPulled = true; 
            
        } catch (e) {
            this.hasSuccessfullyPulled = false; 
            if (window.PegasusLogger) window.PegasusLogger.log("Cloud Pull Error: " + e.message, "SYNC_ERROR");
        }
    },

    /**
     * Αποστολή δεδομένων στο Cloud (Push)
     */
    push: async function(silent = true) {
        if (!this.isUnlocked) return;
        
        // Guard: Αποτροπή υπερεγγραφής αν δεν έχει προηγηθεί επιτυχές Pull
        if (!this.hasSuccessfullyPulled) {
            console.error("PEGASUS GUARD: Push aborted to prevent data overwrite.");
            return;
        }

        const dateStr = this.getTodayKey();
        const syncTimestamp = Date.now();
        
        const cardioLogs = {};
        const allFoodLogs = {};
        
        // Συλλογή όλων των δυναμικών εγγραφών
        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            try {
                if (key.startsWith('cardio_log_')) cardioLogs[key] = JSON.parse(localStorage.getItem(key));
                if (key.startsWith('food_log_')) allFoodLogs[key] = JSON.parse(localStorage.getItem(key));
            } catch(e) {}
        }

        const payload = {
            last_update_date: dateStr, 
            last_update_ts: syncTimestamp, 
            kcal: localStorage.getItem("pegasus_diet_kcal") || "0", 
            protein: localStorage.getItem("pegasus_today_protein") || "0", 
            weekly_history: this.safeParse("pegasus_weekly_history", {}), 
            food_library: this.safeParse("pegasus_food_library", []), 
            peg_stats: this.safeParse("pegasus_stats", {}),
            supp_inventory: this.safeParse("pegasus_supp_inventory", {prot:2500, crea:1000}),
            all_food_logs: allFoodLogs,
            cardio_logs: cardioLogs
        };

        try {
            const res = await fetch(`https://api.jsonbin.io/v3/b/${this.config.binId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': this.userKey },
                body: JSON.stringify(payload)
            });
            
            if (res.ok) {
                localStorage.setItem("pegasus_last_push", syncTimestamp.toString());
                if (!silent) console.log("✅ PEGASUS Cloud Sync: Success");
            }
        } catch (e) {
            console.error("❌ PEGASUS Cloud Sync: Failed", e);
        }
    }
};

window.PegasusCloud = PegasusCloud;

/**
 * DB LEVEL INTERCEPTOR: Αυτόματη παρακολούθηση συμπληρωμάτων
 */
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
                        let inv = PegasusCloud.safeParse('pegasus_supp_inventory', { prot: 2500, crea: 1000 });
                        
                        if (fname.includes("πρωτε") || fname.includes("whey")) {
                            inv.prot = Math.max(0, inv.prot - 30);
                            console.log("⚡ INTERCEPTOR: -30g Protein");
                        }
                        if (fname.includes("κρεατ") || fname.includes("creatine")) {
                            inv.crea = Math.max(0, inv.crea - 5);
                            console.log("⚡ INTERCEPTOR: -5g Creatine");
                        }
                        
                        localStorage.setItem('pegasus_supp_inventory', JSON.stringify(inv));
                        setTimeout(() => window.PegasusCloud.push(true), 1000);
                    }
                }
            } catch(e) {}
        }
    };
}

// Auto-Login
window.addEventListener('load', () => {
    const savedPin = localStorage.getItem("pegasus_vault_pin");
    if (savedPin) window.PegasusCloud.unlock(savedPin);
});