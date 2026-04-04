/* ==========================================================================
   PEGASUS CLOUD VAULT - UNIVERSAL CORE (v15.5)
   Protocol: Strict Data Analyst - Maximalist Alignment
   Features: Unified Desktop/Mobile Sync, Vehicle Data, Parking, Interceptor
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

    safeParse: (key, fallback) => {
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
        if (!silent && typeof setSyncStatus === "function") setSyncStatus('ΣΥΓΧΡΟΝΙΣΜΟΣ...');
        
        try {
            const res = await fetch(`https://api.jsonbin.io/v3/b/${this.config.binId}/latest?nocache=${Date.now()}`, {
                headers: { 
                    'X-Master-Key': this.userKey, 
                    'X-Bin-Meta': 'false',
                    'Content-Type': 'application/json'
                }
            });
            
            // 🟢 OFFLINE BUG FIX: Απασφάλιση Guard αμέσως μετά την απόκριση
            if (res.ok) this.hasSuccessfullyPulled = true;

            const cloudData = await res.json();
            const cloud = cloudData.record || cloudData;
            
            const lastPush = localStorage.getItem("pegasus_last_push") || "0";

            if (cloud.last_update_ts && cloud.last_update_ts.toString() !== lastPush) {
                console.log("☁️ PEGASUS: New Cloud Data Found. Syncing Full Registry...");

                // 📊 Universal Data Mapping (Manifest v1.2 Alignment)
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
                    if(cloud[ck]) localStorage.setItem(lk, JSON.stringify(cloud[ck]));
                });

                if(cloud.all_food_logs) {
                    Object.keys(cloud.all_food_logs).forEach(k => {
                        localStorage.setItem(k, JSON.stringify(cloud.all_food_logs[k]));
                    });
                }

                if (cloud.last_update_date === this.getTodayKey()) {
                    localStorage.setItem("pegasus_today_kcal", cloud.kcal || "0"); 
                    localStorage.setItem("pegasus_today_protein", cloud.protein || "0"); 
                }

                localStorage.setItem("pegasus_last_push", cloud.last_update_ts.toString());
                
                // 🔄 Smart UI Refresh Logic
                if (typeof refreshAllUI === "function") refreshAllUI(); // Mobile Hook
                if (typeof window.updateFoodUI === "function") window.updateFoodUI(); // Desktop Hook
                if (typeof window.updateSuppUI === "function") window.updateSuppUI(); // Desktop Hook
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

        const dateStr = this.getTodayKey();
        const syncTimestamp = Date.now();
        
        const allLogs = {};
        for (let i = 0; i < localStorage.length; i++) {
            let k = localStorage.key(i);
            if (k.startsWith("food_log_")) {
                try { allLogs[k] = JSON.parse(localStorage.getItem(k)); } catch(e) {}
            }
        }

        const payload = {
            last_update_date: dateStr,
            last_update_ts: syncTimestamp,
            kcal: localStorage.getItem("pegasus_today_kcal") || "0",
            protein: localStorage.getItem("pegasus_today_protein") || "0",
            supp_inventory: this.safeParse("pegasus_supp_inventory", {prot:2500, crea:1000}),
            weekly_history: this.safeParse("pegasus_weekly_history", {}),
            muscle_targets: this.safeParse("pegasus_muscle_targets", {}),
            peg_stats: this.safeParse("pegasus_stats", {}),
            car_dates: this.safeParse("pegasus_car_dates", {}),
            car_service: this.safeParse("pegasus_car_service", []),
            car_specs: this.safeParse("pegasus_car_specs", {}),
            parking_loc: this.safeParse("pegasus_parking_loc", null),
            food_library: this.safeParse("pegasus_food_library", []),
            peg_contacts: this.safeParse("pegasus_contacts", []),
            all_food_logs: allLogs
        };

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
                localStorage.setItem("pegasus_last_push", syncTimestamp.toString());
                if (typeof setSyncStatus === "function") setSyncStatus('online');
            }
        } catch (e) {
            console.error("❌ PEGASUS Push Error:", e);
            if (typeof setSyncStatus === "function") setSyncStatus('offline');
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
   PEGASUS CLOUD SYNC - DEBOUNCE PATCH (API RATE LIMIT GUARD v13.0)
   ========================================================================== */
if (window.PegasusCloud && typeof window.PegasusCloud.push === "function") {
    
    // 1. Αποθήκευση της αρχικής (βαριάς) λειτουργίας αποστολής
    const originalPush = window.PegasusCloud.push.bind(window.PegasusCloud);
    let pushTimeout = null;

    // 2. Επικάλυψη (Override) με τον αλγόριθμο Debounce
    window.PegasusCloud.push = function(force = false) {
        
        // Αν ζητηθεί "Σκληρό" Push (π.χ. χειροκίνητο κουμπί Backup)
        if (force === "STRICT") {
            console.log("🚀 PEGASUS CLOUD: Strict Push Requested. Bypassing Debounce...");
            return originalPush();
        }

        // Αν υπάρχει ήδη προγραμματισμένη αποστολή, την ακυρώνουμε
        if (pushTimeout) {
            clearTimeout(pushTimeout);
            console.log("⏳ PEGASUS CLOUD: Multiple actions detected. Resetting Sync Timer...");
        }

        // Προγραμματίζουμε την αποστολή σε 3 δευτερόλεπτα "ησυχίας"
        pushTimeout = setTimeout(async () => {
            console.log("📡 PEGASUS CLOUD: Stable State Reached. Executing Batch Sync...");
            await originalPush();
            pushTimeout = null;
        }, 10000); 
    };
    
    console.log("🛡️ PEGASUS CLOUD: Debounce Protocol Active.");
}
