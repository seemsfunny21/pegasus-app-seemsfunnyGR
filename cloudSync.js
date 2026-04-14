/* ==========================================================================
   PEGASUS CLOUD VAULT - UNIVERSAL CORE (v16.1 FIXED SYNC)
   Protocol: Strict Data Analyst - Flat Payload & Auto-Sync
   ========================================================================== */

const PegasusCloud = {
    config: {
        binId: "69b6757ab7ec241ddc6d7230",
        encryptedPart: "$2a$10$oU/TyQjSeNEVr/k5dnFS8ulKZkbb9gUWd5xuXijAYFCBijuXrYAFC" 
    },
    
    isUnlocked: false,
    hasSuccessfullyPulled: false, 
    isPulling: false, // 🔒 ΠΡΟΣΤΑΣΙΑ: Για να μην μπαίνει σε λούπα ο συγχρονισμός
    userKey: "",
    syncInterval: null,

    getTodayKey: () => {
        const d = new Date();
        return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
    },

    unlock: function(pin) {
        if (!pin) return false;
        const cleanPin = pin.trim();
        
        // Έλεγχος PIN
        if (btoa(cleanPin) === "MjM3NQ==") { 
            this.userKey = this.config.encryptedPart;
            this.isUnlocked = true;
            
            localStorage.setItem("pegasus_vault_pin", cleanPin);
            localStorage.setItem("pegasus_vault_time", Date.now().toString());
            
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
        if (!silent && typeof setSyncStatus === "function") setSyncStatus('ΣΥΓΧΡΟΝΙΣΜΟΣ...');
        
        this.isPulling = true; // 🔒 Κλειδώνουμε το αυτόματο Push όσο κατεβάζουμε

        try {
            const res = await fetch(`https://api.jsonbin.io/v3/b/${this.config.binId}/latest?nocache=${Date.now()}`, {
                headers: { 
                    'X-Master-Key': this.userKey, 
                    'X-Bin-Meta': 'false',
                    'Content-Type': 'application/json'
                }
            });
            
            if (res.ok) this.hasSuccessfullyPulled = true;

            const cloudData = await res.json();
            const cloud = cloudData.record || cloudData;
            const lastPush = localStorage.getItem("pegasus_last_push") || "0";

            if (cloud.last_update_ts && cloud.last_update_ts.toString() !== lastPush) {
                console.log("☁️ PEGASUS: New Cloud Data Found. Syncing Full Registry...");

                Object.keys(cloud).forEach(key => {
                    if (key.startsWith('pegasus_') || key.startsWith('food_log_') || key.startsWith('kouki_')) {
                        const val = typeof cloud[key] === 'string' ? cloud[key] : JSON.stringify(cloud[key]);
                        localStorage.setItem(key, val);
                    }
                });

                const map = {
                    'weekly_history': 'pegasus_weekly_history',
                    'muscle_targets': 'pegasus_muscle_targets',
                    'supp_inventory': 'pegasus_supp_inventory',
                    'peg_contacts': 'pegasus_contacts',
                    'car_dates': 'pegasus_car_dates',
                    'car_service': 'pegasus_car_service',
                    'car_specs': 'pegasus_car_specs',
                    'parking_loc': 'pegasus_parking_loc',
                    'food_library': 'pegasus_food_library',
                    'peg_stats': 'pegasus_stats'
                };
                Object.entries(map).forEach(([ck, lk]) => {
                    if(cloud[ck] && !cloud[lk]) localStorage.setItem(lk, JSON.stringify(cloud[ck]));
                });

                if(cloud.all_food_logs) {
                    Object.keys(cloud.all_food_logs).forEach(k => {
                        if(!cloud[k]) localStorage.setItem(k, JSON.stringify(cloud.all_food_logs[k]));
                    });
                }

                localStorage.setItem("pegasus_last_push", cloud.last_update_ts.toString());
                
                if (typeof refreshAllUI === "function") refreshAllUI(); 
                if (typeof window.updateFoodUI === "function") window.updateFoodUI(); 
                if (typeof window.updateSuppUI === "function") window.updateSuppUI(); 
                if (window.MuscleProgressUI) window.MuscleProgressUI.render();
            }

            if (typeof setSyncStatus === "function") setSyncStatus('online');
            
        } catch (e) {
            console.error("❌ PEGASUS Pull Error:", e);
            if (typeof setSyncStatus === "function") setSyncStatus('offline');
        } finally {
            this.isPulling = false; // 🔓 Ξεκλειδώνουμε
        }
    },

    push: async function(silent = true) {
        if (!this.isUnlocked || !this.hasSuccessfullyPulled) return;
        if (!silent && typeof setSyncStatus === "function") setSyncStatus('ΣΥΓΧΡΟΝΙΣΜΟΣ...');

        const syncTimestamp = Date.now().toString();
        const payload = {
            last_update_date: this.getTodayKey(),
            last_update_ts: syncTimestamp
        };
        
        for (let i = 0; i < localStorage.length; i++) {
            let k = localStorage.key(i);
            if (k.startsWith("pegasus_") || k.startsWith("food_log_") || k.startsWith("kouki_")) {
                payload[k] = localStorage.getItem(k); 
            }
        }

        try {
            const res = await fetch(`https://api.jsonbin.io/v3/b/${this.config.binId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json', 
                    'X-Master-Key': this.userKey,
                    'X-Bin-Meta': 'false' 
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                localStorage.setItem("pegasus_last_push", syncTimestamp);
                if (typeof setSyncStatus === "function") setSyncStatus('online');
            }
        } catch (e) {
            console.error("❌ PEGASUS Push Error:", e);
            if (typeof setSyncStatus === "function") setSyncStatus('offline');
        }
    }
};

window.PegasusCloud = PegasusCloud;

// 🎯 SECURITY: Έλεγχος 24 Ωρών κατά τη φόρτωση
window.addEventListener('load', () => {
    const savedPin = localStorage.getItem("pegasus_vault_pin");
    const authTime = localStorage.getItem("pegasus_vault_time");
    
    if (savedPin) {
        const now = Date.now();
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; 
        
        if (!authTime || (now - parseInt(authTime) > TWENTY_FOUR_HOURS)) {
            console.log("🔒 PEGASUS: Session expired (24h limit). Requiring PIN.");
            localStorage.removeItem("pegasus_vault_pin");
            localStorage.removeItem("pegasus_vault_time");
            
            const pinModal = document.getElementById("pinModal");
            if (pinModal) pinModal.style.display = "flex";
        } else {
            window.PegasusCloud.unlock(savedPin);
            const vaultBtn = document.getElementById("btnMasterVault");
            if (vaultBtn) {
                vaultBtn.textContent = "☁️ CLOUD: ΣΥΝΔΕΔΕΜΕΝΟ";
                vaultBtn.style.color = "#00ff41";
                vaultBtn.style.borderColor = "#00ff41";
            }
        }
    }
});

/* ==========================================================================
   DATA INTERCEPTOR (SUPPLEMENT LOGISTICS & AUTO SYNC)
   ========================================================================== */
window.consumeSupp = function(type, amount) {
    let val = localStorage.getItem('pegasus_supp_inventory');
    let s = val ? JSON.parse(val) : { prot: 2500, crea: 1000 };
    s[type] = Math.max(0, s[type] - amount);
    
    if (window.originalSetItem) {
        window.originalSetItem.call(localStorage, 'pegasus_supp_inventory', JSON.stringify(s));
    } else {
        localStorage.setItem('pegasus_supp_inventory', JSON.stringify(s));
    }
    
    if (typeof updateSuppUI === "function") updateSuppUI();
    if (typeof refreshAllUI === "function") refreshAllUI();
    
    // Εδώ το Timeout δεν χρειάζεται πλέον Push, το κάνει ο interceptor κάτω.
};

if (!window.originalSetItem) {
    window.originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        let oldArr = [];
        if (key.startsWith("food_log_")) {
            try { oldArr = JSON.parse(localStorage.getItem(key) || "[]"); } catch(e) {}
        }
        
        window.originalSetItem.apply(this, arguments);

        // 🚀 ΑΜΕΣΟΣ ΣΥΓΧΡΟΝΙΣΜΟΣ: Κάθε αλλαγή φαγητού ανεβαίνει στο Cloud
        const ignored = ["pegasus_last_push", "pegasus_vault_pin", "pegasus_vault_time"];
        if (!ignored.includes(key) && (key.startsWith("food_log_") || key.startsWith("pegasus_") || key.startsWith("kouki_"))) {
            if (window.PegasusCloud && !window.PegasusCloud.isPulling && window.PegasusCloud.hasSuccessfullyPulled) {
                window.PegasusCloud.push();
            }
        }

        if (key.startsWith("food_log_")) {
            try {
                let newArr = JSON.parse(value || "[]");
                if (newArr.length > oldArr.length) {
                    // 🎯 ΔΙΟΡΘΩΣΗ: Ελέγχουμε το τελευταίο φαγητό (όχι το πρώτο)
                    let addedItem = newArr[newArr.length - 1]; 
                    if (addedItem && addedItem.name) {
                        let fname = addedItem.name.toLowerCase();
if (fname.includes("πρωτε") || fname.includes("whey")) {
    if (window.PegasusInventory) window.PegasusInventory.consume('prot', 30, false);
    else if (window.PegasusInventoryPC) window.PegasusInventoryPC.processEntry("Whey");
}
if (fname.includes("κρεατ") || fname.includes("creatine")) {
    if (window.PegasusInventory) window.PegasusInventory.consume('crea', 5, false);
    else if (window.PegasusInventoryPC) window.PegasusInventoryPC.processEntry("Κρεατίνη");
}
                    }
                }
            } catch(e) { console.error("Interceptor Error", e); }
        }
    };
}

/* ==========================================================================
   PEGASUS CLOUD SYNC - FAST DEBOUNCE PATCH (PROMISE COMPATIBLE)
   ========================================================================== */
if (window.PegasusCloud && typeof window.PegasusCloud.push === "function") {
    const originalPush = window.PegasusCloud.push.bind(window.PegasusCloud);
    let pushTimeout = null;

    window.PegasusCloud.push = function(force = false) {
        return new Promise((resolve, reject) => {
            if (force === true || force === "STRICT") {
                console.log("🚀 CLOUD: Strict Push Requested.");
                return originalPush().then(resolve).catch(reject);
            }

            if (pushTimeout) clearTimeout(pushTimeout);

            pushTimeout = setTimeout(async () => {
                console.log("📡 CLOUD: Executing Batch Sync...");
                try {
                    await originalPush();
                    pushTimeout = null;
                    resolve();
                } catch(e) { reject(e); }
            }, 2000); 
        });
    };
}

// ==========================================================================
// 🛡️ PEGASUS SPLIT-BRAIN GUARD (CROSS-TAB SYNC)
// ==========================================================================
window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('pegasus_')) {
        console.log("🔄 PEGASUS GUARD: Εντοπίστηκε αλλαγή δεδομένων από άλλη καρτέλα. Αυτόματος συγχρονισμός UI.");
        
        // Ανανέωση UI στο Desktop
        if (typeof window.updateFoodUI === "function") window.updateFoodUI();
        if (typeof window.renderLiftingContent === "function") window.renderLiftingContent();
        
        // Ανανέωση UI στο Mobile
        if (window.PegasusDiet && typeof window.PegasusDiet.updateUI === "function") window.PegasusDiet.updateUI();
        if (window.PegasusFinance && typeof window.PegasusFinance.render === "function") window.PegasusFinance.render();
    }
});
