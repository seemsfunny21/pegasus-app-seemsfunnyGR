/* ==========================================================================
   PEGASUS CLOUD VAULT - UNIVERSAL CORE (v17.0 ULTRA-STABLE)
   Protocol: Strict Data Analyst - Anti-Loop, Retry-Logic & Priority Pull
   Status: FINAL REPAIR | FIXED: PC OVERWRITE & INTERCEPTOR CONFLICTS
   ========================================================================== */

const PegasusCloud = {
    config: {
        binId: "69b6757ab7ec241ddc6d7230",
        encryptedPart: "$2a$10$oU/TyQjSeNEVr/k5dnFS8ulKZkbb9gUWd5xuXijAYFCBijuXrYAFC" 
    },
    
    isUnlocked: false,
    hasSuccessfullyPulled: false, 
    isPulling: false, 
    isPushing: false,
    userKey: "",
    syncInterval: null,

    getTodayKey: () => {
        const d = new Date();
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    },

    // 🛡️ 1. PULL ΜΕ RETRY LOGIC
    pull: async function(retryCount = 0) {
        if (this.isPulling) return;
        this.isPulling = true;
        if (typeof setSyncStatus === "function") setSyncStatus('ΣΥΓΧΡΟΝΙΣΜΟΣ...');
        
        try {
            const res = await fetch(`https://api.jsonbin.io/v3/b/${this.config.binId}/latest?nocache=${Date.now()}`, {
                headers: { 
                    'X-Master-Key': this.userKey || localStorage.getItem("pegasus_vault_pin"), 
                    'X-Bin-Meta': 'false'
                }
            });
            
            if (!res.ok) throw new Error("Cloud pull failed");
            
            const cloud = await res.json();
            const lastPush = localStorage.getItem("pegasus_last_push") || "0";

            if (cloud.last_update_ts && cloud.last_update_ts.toString() !== lastPush) {
                console.log("☁️ PEGASUS: New Cloud Data Found. Merging...");

                Object.keys(cloud).forEach(key => {
                    if (key.startsWith('pegasus_') || key.startsWith('food_log_') || key.startsWith('kouki_')) {
                        const val = typeof cloud[key] === 'string' ? cloud[key] : JSON.stringify(cloud[key]);
                        window.originalSetItem.call(localStorage, key, val);
                    }
                });

                window.originalSetItem.call(localStorage, "pegasus_last_push", cloud.last_update_ts.toString());
                this.hasSuccessfullyPulled = true;
                
                window.dispatchEvent(new CustomEvent('pegasus_sync_complete'));
                if (typeof refreshAllUI === "function") refreshAllUI();
                if (typeof window.updateFoodUI === "function") window.updateFoodUI();
            } else {
                this.hasSuccessfullyPulled = true; 
            }
            if (typeof setSyncStatus === "function") setSyncStatus('online');
        } catch (e) {
            console.error(`❌ PEGASUS Pull Attempt ${retryCount + 1} Failed:`, e);
            if (retryCount < 2) {
                setTimeout(() => this.pull(retryCount + 1), 2000);
            } else {
                if (typeof setSyncStatus === "function") setSyncStatus('offline');
            }
        } finally {
            this.isPulling = false;
        }
    },

    // 🚀 2. PUSH FORCE 
    push: async function(force = false) {
        if (!this.isUnlocked || !this.hasSuccessfullyPulled || this.isPushing) return;

        this.isPushing = true;
        if (typeof setSyncStatus === "function") setSyncStatus('ΣΥΓΧΡΟΝΙΣΜΟΣ...');
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
                    'X-Master-Key': this.userKey || localStorage.getItem("pegasus_vault_pin"),
                    'X-Bin-Meta': 'false' 
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                window.originalSetItem.call(localStorage, "pegasus_last_push", syncTimestamp);
                console.log(`🚀 PEGASUS: Cloud Sync Complete (${syncTimestamp})`);
                if (typeof setSyncStatus === "function") setSyncStatus('online');
            }
        } catch (e) {
            console.error("❌ PEGASUS Push Error:", e);
            if (typeof setSyncStatus === "function") setSyncStatus('offline');
        } finally {
            this.isPushing = false;
        }
    },

    unlock: function(pin) {
        if (!pin) return false;
        const cleanPin = pin.trim();
        if (cleanPin.length < 4) return false;

        this.userKey = cleanPin;
        this.isUnlocked = true;
        localStorage.setItem('pegasus_vault_unlocked', 'true');
        
        console.log("🔄 PEGASUS: Initializing Priority Sync...");
        
        // Priority Wait
        this.pull().then(() => {
            if (typeof window.checkDailyRoutinePC === "function") {
                window.checkDailyRoutinePC();
            }
        });

        if (this.syncInterval) clearInterval(this.syncInterval);
        this.syncInterval = setInterval(() => this.pull(), 30000);
        return true;
    }
};

window.PegasusCloud = PegasusCloud;

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
};

// 🛡️ 3. ΕΝΙΑΙΟΣ INTERCEPTOR (Χωρίς Loops & Conflict)
if (!window.originalSetItem) {
    window.originalSetItem = localStorage.setItem;
    
    localStorage.setItem = function(key, value) {
        let oldLog = [];
        if (key.startsWith("food_log_")) {
            try { oldLog = JSON.parse(localStorage.getItem(key) || "[]"); } catch(e) {}
        }

        window.originalSetItem.apply(this, arguments);

        // SYNC LOGIC - Ακαριαίο Push για αλλαγές
        const internalKeys = ["pegasus_last_push", "pegasus_vault_pin", "pegasus_vault_time", "pegasus_vault_unlocked"];
        if (!internalKeys.includes(key) && (key.startsWith("food_log_") || key.startsWith("pegasus_") || key.startsWith("kouki_"))) {
            if (window.PegasusCloud && window.PegasusCloud.isUnlocked && window.PegasusCloud.hasSuccessfullyPulled) {
                // Ακαριαία αποστολή για φαγητό, αλλιώς μικρό debounce
                const delay = (key.startsWith('food_log_') || key.startsWith('pegasus_routine_')) ? 500 : 1500;
                
                clearTimeout(window.pegasusPushTimer);
                window.pegasusPushTimer = setTimeout(() => {
                    console.log(`🚀 PEGASUS: Real-time Sync triggered by ${key}`);
                    window.PegasusCloud.push(true);
                }, delay);
            }
        }

        // SUPPLEMENT AUTO-LOGIC
        if (key.startsWith("food_log_")) {
            try {
                let newLog = JSON.parse(value || "[]");
                if (newLog.length > oldLog.length) {
                    let added = newLog[newLog.length - 1];
                    if (added && added.name) {
                        let fname = added.name.toLowerCase();
                        if (fname.includes("πρωτε") || fname.includes("whey")) {
                            if (window.consumeSupp) window.consumeSupp('prot', 30, false);
                            else if (window.PegasusInventoryPC) window.PegasusInventoryPC.processEntry("Whey");
                        }
                        if (fname.includes("κρεατ") || fname.includes("creatine")) {
                            if (window.consumeSupp) window.consumeSupp('crea', 5, false);
                            else if (window.PegasusInventoryPC) window.PegasusInventoryPC.processEntry("Κρεατίνη");
                        }
                    }
                }
            } catch(e) {}
        }
    };
}

// 🏛️ 4. AUTO-LOAD SESSION & 24H GUARD
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
