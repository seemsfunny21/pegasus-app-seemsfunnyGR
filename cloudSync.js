/* ==========================================================================
   PEGASUS CLOUD VAULT - UNIVERSAL CORE (v16.2 SIMPLE PIN ROLLBACK)
   Protocol: Strict Data Analyst - Single Base64 PIN & Interceptors
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

    getTodayKey: () => {
        const d = new Date();
        return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
    },

    unlock: function(pin) {
        if (!pin) return false;
        const cleanPin = pin.trim();

        // 🛡️ ΜΟΝΑΔΙΚΟΣ ΕΛΕΓΧΟΣ: Απλό PIN (2375)
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

// 🎯 SECURITY: Απλός Έλεγχος 24 Ωρών κατά τη φόρτωση
window.addEventListener('load', () => {
    const savedPin = localStorage.getItem("pegasus_vault_pin");
    const authTime = localStorage.getItem("pegasus_vault_time");
    
    if (savedPin) {
        const now = Date.now();
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
        
        if (!authTime || (now - parseInt(authTime) > TWENTY_FOUR_HOURS)) {
            console.log("🔒 PEGASUS: Session expired. Requiring PIN.");
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
    } else {
        const pinModal = document.getElementById("pinModal");
        if (pinModal) pinModal.style.display = "flex";
    }
});

/* ==========================================================================
   DATA INTERCEPTOR (SUPPLEMENT LOGISTICS)
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

/* ==========================================================================
   PEGASUS CLOUD SYNC - FAST DEBOUNCE PATCH (PROMISE COMPATIBLE)
   ========================================================================== */
if (window.PegasusCloud && typeof window.PegasusCloud.push === "function") {
    const originalPush = window.PegasusCloud.push.bind(window.PegasusCloud);
    let pushTimeout = null;

    window.PegasusCloud.push = function(force = false) {
        return new Promise((resolve, reject) => {
            if (force === "STRICT") {
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
