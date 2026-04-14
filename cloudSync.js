/* ==========================================================================
   PEGASUS CLOUD VAULT - UNIVERSAL CORE (v16.1 TTL SECURITY PATCH)
   Protocol: Strict Data Analyst - Flat Payload & 24h Auto-Lock
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

        // 🛡️ ΒΗΜΑ 1: ΕΛΕΓΧΟΣ MASTER KEY (Για πιστοποίηση νέας συσκευής)
        // Κωδικός: Angel21Angel22
        if (btoa(cleanPin) === "QW5nZWwyMUFuZ2VsMjI=") {
            // Ζητάμε από τον χρήστη να ορίσει το ΠΡΟΣΩΠΙΚΟ του PIN για αυτή τη συσκευή
            const newLocalPin = prompt("🔑 MASTER KEY ΑΠΟΔΕΚΤΟ!\nΟρίστε ένα προσωπικό PIN (τουλάχιστον 4 ψηφία) για γρήγορη πρόσβαση σε ΑΥΤΗ τη συσκευή:");

            if (newLocalPin && newLocalPin.length >= 4) {
                // Αποθηκεύουμε το προσωπικό PIN τοπικά και κρυπτογραφημένα (Base64)
                localStorage.setItem("pegasus_device_trusted", btoa(newLocalPin));
                alert(`✅ Συσκευή Πιστοποιήθηκε!\nΤο PIN σας (${newLocalPin}) αποθηκεύτηκε. Χρησιμοποιήστε το για μελλοντική πρόσβαση.`);

                this.userKey = this.config.encryptedPart;
                this.isUnlocked = true;
                localStorage.setItem("pegasus_vault_pin", newLocalPin); 
                localStorage.setItem("pegasus_vault_time", Date.now());
                return true;
            } else {
                alert("⛔ Η διαδικασία ακυρώθηκε. Απαιτείται έγκυρο PIN.");
                return false;
            }
        }

        // ⚡ ΒΗΜΑ 2: ΚΑΘΗΜΕΡΙΝΗ ΠΡΟΣΒΑΣΗ ΜΕ ΤΟ ΠΡΟΣΩΠΙΚΟ PIN
        const trustedPinBase64 = localStorage.getItem("pegasus_device_trusted");

        if (trustedPinBase64) {
            // Αν η συσκευή είναι "έμπιστη", ελέγχουμε αν το PIN ταιριάζει με αυτό που είχε ορίσει
            if (btoa(cleanPin) === trustedPinBase64) {
                this.userKey = this.config.encryptedPart;
                this.isUnlocked = true;
                localStorage.setItem("pegasus_vault_pin", cleanPin);
                localStorage.setItem("pegasus_vault_time", Date.now());
                return true;
            } else {
                alert("⛔ Λάθος PIN για αυτή τη συσκευή.");
                return false;
            }
        } else {
            // Αν δεν υπάρχει trusted PIN, η συσκευή είναι άγνωστη.
            alert("⛔ Μη αναγνωρισμένη συσκευή.\nΕισάγετε πρώτα το Master Key για να πιστοποιήσετε τη συσκευή και να ορίσετε το δικό σας PIN.");
            return false;
        }
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

                // 1. FLAT SYNC
                Object.keys(cloud).forEach(key => {
                    if (key.startsWith('pegasus_') || key.startsWith('food_log_') || key.startsWith('kouki_')) {
                        const val = typeof cloud[key] === 'string' ? cloud[key] : JSON.stringify(cloud[key]);
                        localStorage.setItem(key, val);
                    }
                });

                // 2. LEGACY SUPPORT
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
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; // 24 ώρες σε milliseconds
        
        // Έλεγχος αν πέρασαν 24 ώρες ή αν λείπει το timestamp
        if (!authTime || (now - parseInt(authTime) > TWENTY_FOUR_HOURS)) {
            console.log("🔒 PEGASUS: Session expired (24h limit). Requiring PIN.");
            localStorage.removeItem("pegasus_vault_pin");
            localStorage.removeItem("pegasus_vault_time");
            
            // Εμφάνιση του Modal PIN αν υπάρχει στο DOM (Desktop & Mobile)
            const pinModal = document.getElementById("pinModal");
            if (pinModal) pinModal.style.display = "flex";
        } else {
            // Το PIN είναι ακόμα έγκυρο, ξεκλειδώνουμε
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

            if (pushTimeout) {
                clearTimeout(pushTimeout);
            }

            pushTimeout = setTimeout(async () => {
                console.log("📡 CLOUD: Executing Batch Sync...");
                try {
                    await originalPush();
                    pushTimeout = null;
                    resolve();
                } catch(e) {
                    reject(e);
                }
            }, 2000); 
        });
    };
    console.log("🛡️ PEGASUS CLOUD: Fast Promise-Debounce Active.");
}
