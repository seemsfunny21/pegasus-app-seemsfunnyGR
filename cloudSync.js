/* ==========================================================================
   PEGASUS CLOUD VAULT - UNIFIED SYNC (v13.8)
   FIX: FULL DATA PAYLOAD & KEY UNIFICATION (Supps, Contacts, Car, Food)
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

            // Έλεγχος αν τα δεδομένα στο Cloud είναι νεότερα από τα τοπικά
            if (cloud.last_update_ts && cloud.last_update_ts.toString() !== lastPush) {
                let requiresUIReload = false;

                // 1. Εβδομαδιαίο Ιστορικό (Sets)
                if (cloud.weekly_history) {
                    localStorage.setItem('pegasus_weekly_history', JSON.stringify(cloud.weekly_history));
                    requiresUIReload = true;
                }
                
                // 2. Συμπληρώματα, Επαφές & Αυτοκίνητο (Ενοποιημένα Κλειδιά)
                if (cloud.supp_inventory) localStorage.setItem('pegasus_supp_inventory', JSON.stringify(cloud.supp_inventory));
                if (cloud.peg_contacts) localStorage.setItem('pegasus_contacts', JSON.stringify(cloud.peg_contacts));
                if (cloud.car_dates) localStorage.setItem('pegasus_car_dates', JSON.stringify(cloud.car_dates));
                if (cloud.car_service) localStorage.setItem('pegasus_car_service', JSON.stringify(cloud.car_service));
                
                // 3. Βιβλιοθήκη Φαγητών & Όλα τα Logs Φαγητού
                if (cloud.food_library) localStorage.setItem('pegasus_food_library', JSON.stringify(cloud.food_library));
                if (cloud.all_food_logs) {
                    Object.keys(cloud.all_food_logs).forEach(k => {
                        localStorage.setItem(k, JSON.stringify(cloud.all_food_logs[k]));
                    });
                }

                // 4. Θερμίδες & Πρωτεΐνη Ημέρας
                if (cloud.last_update_date === dateStr) {
                    localStorage.setItem("pegasus_today_kcal", cloud.kcal || "0"); 
                    localStorage.setItem("pegasus_today_protein", cloud.protein || "0"); 
                    requiresUIReload = true;
                }

                // 5. Logs Αερόβιας & Ιστορικού
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
                
                // Ενημέρωση UI αν υπάρχουν ανοιχτά panels
                if (requiresUIReload && typeof window.updateFoodUI === "function") window.updateFoodUI();
                if (typeof window.updateSuppUI === "function") window.updateSuppUI();
            }
        } catch (e) {
            console.error("PEGASUS Cloud Pull Error:", e);
        }
    },

    push: async function(silent = true) {
        if (!this.isUnlocked) return;
        const dateStr = this.getTodayKey();
        const syncTimestamp = Date.now();
        
        const cardioLogs = {};
        const historyLogs = {};
        const allFoodLogs = {};
        
        // Συλλογή όλων των δυναμικών logs από το LocalStorage
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
            supp_inventory: this.safeParse("pegasus_supp_inventory", {prot:2500, crea:1000}),
            peg_contacts: this.safeParse("pegasus_contacts", []),
            car_dates: this.safeParse("pegasus_car_dates", {}),
            car_service: this.safeParse("pegasus_car_service", []),
            today_food_log: this.safeParse(`food_log_${dateStr}`, []),
            all_food_logs: allFoodLogs,
            cardio_logs: cardioLogs,
            history_logs: historyLogs
        };

        try {
            const res = await fetch("https://api.jsonbin.io/v3/b/" + this.config.binId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': this.userKey },
                body: JSON.stringify(payload)
            });
            
            if (res.ok) {
                localStorage.setItem("pegasus_last_push", syncTimestamp.toString());
                console.log("✅ PEGASUS Cloud Sync: Push Success");
            }
        } catch (e) {
            console.error("❌ PEGASUS Cloud Sync: Push Failed", e);
        }
    }
};

window.PegasusCloud = PegasusCloud;

// Αυτόματη εκκίνηση κατά τη φόρτωση
window.addEventListener('load', () => {
    const savedPin = localStorage.getItem("pegasus_vault_pin");
    if (savedPin) {
        window.PegasusCloud.unlock(savedPin);
    } else {
        setTimeout(() => {
            const pin = prompt("PEGASUS VAULT: Εισάγετε PIN:");
            if (pin && !window.PegasusCloud.unlock(pin)) alert("ΛΑΘΟΣ PIN.");
        }, 1000);
    }
});
