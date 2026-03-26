/* ==========================================================================
   PEGASUS CLOUD VAULT - v14.0 (MODULAR / FULLY DECOUPLED)
   Protocol: Strict State Management - Isolated Scope & Sync Guard
   ========================================================================== */

const PegasusCloud = (function() {
    // 1. ΙΔΙΩΤΙΚΟ STATE (Private State & Config)
    const config = {
        binId: "69b6757ab7ec241ddc6d7230",
        // Κρυπτογραφημένο κλειδί ασφαλείας
        encryptedPart: "$2a$10$oU/TyQjSeNEVr/k5dnFS8ulKZkbb9gUWd5xuXijAYFCBijuXrYAFC" 
    };
    
    let state = {
        isUnlocked: false,
        hasSuccessfullyPulled: false, // ΔΙΑΚΟΠΤΗΣ ΑΣΦΑΛΕΙΑΣ
        userKey: "",
        syncInterval: null
    };

    // 2. ΙΔΙΩΤΙΚΕΣ ΛΕΙΤΟΥΡΓΙΕΣ (Private Methods)
    const getTodayKey = () => {
        const d = new Date();
        return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
    };

    const safeParse = (key, fallback) => {
        try {
            const val = localStorage.getItem(key);
            return val ? JSON.parse(val) : fallback;
        } catch (e) { return fallback; }
    };

    const pullData = async (silent = false) => {
        if (!state.isUnlocked) return;
        try {
            const res = await fetch("https://api.jsonbin.io/v3/b/" + config.binId + "/latest?nocache=" + Date.now(), {
                headers: { 'X-Master-Key': state.userKey, 'X-Bin-Meta': 'false' }
            });
            const cloudData = await res.json();
            const cloud = cloudData.record || cloudData;
            
            const dateStr = getTodayKey();
            const lastPush = localStorage.getItem("pegasus_last_push") || "0";

            if (cloud.last_update_ts && cloud.last_update_ts.toString() !== lastPush) {
                let requiresUIReload = false;

                // Συγχρονισμός στόχων, στατιστικών και δεδομένων οχημάτων/διατροφής
                if (cloud.muscle_targets) localStorage.setItem('pegasus_muscle_targets', JSON.stringify(cloud.muscle_targets));
                if (cloud.peg_stats) localStorage.setItem('pegasus_stats', JSON.stringify(cloud.peg_stats));

                if (cloud.weekly_history) {
                    localStorage.setItem('pegasus_weekly_history', JSON.stringify(cloud.weekly_history));
                    requiresUIReload = true;
                }
                
                if (cloud.supp_inventory) localStorage.setItem('pegasus_supp_inventory', JSON.stringify(cloud.supp_inventory));
                if (cloud.peg_contacts) localStorage.setItem('pegasus_contacts', JSON.stringify(cloud.peg_contacts));
                if (cloud.car_dates) localStorage.setItem('pegasus_car_dates', JSON.stringify(cloud.car_dates));
                if (cloud.car_service) localStorage.setItem('pegasus_car_service', JSON.stringify(cloud.car_service));
                
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
                
                // Ασφαλής κλήση εξωτερικών συναρτήσεων UI
                if (requiresUIReload && typeof window.updateFoodUI === "function") window.updateFoodUI();
                if (typeof window.updateSuppUI === "function") window.updateSuppUI();
            }
            
            state.hasSuccessfullyPulled = true; // ΕΠΙΒΕΒΑΙΩΣΗ ΛΗΨΗΣ
            
        } catch (e) {
            state.hasSuccessfullyPulled = false; // ΑΣΦΑΛΙΣΗ
            console.error("[PEGASUS CLOUD]: Pull Error:", e);
        }
    };

    const pushData = async (silent = true) => {
        if (!state.isUnlocked) return;
        
        // DATA GUARD: ΑΠΑΓΟΡΕΥΣΗ PUSH ΧΩΡΙΣ PULL
        if (!state.hasSuccessfullyPulled) {
            console.error("[PEGASUS CLOUD GUARD]: Το Push ακυρώθηκε. Αποτροπή υπερεγγραφής του Cloud.");
            return;
        }

        const dateStr = getTodayKey();
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
            weekly_history: safeParse("pegasus_weekly_history", {}), 
            food_library: safeParse("pegasus_food_library", []), 
            muscle_targets: safeParse("pegasus_muscle_targets", {}),
            peg_stats: safeParse("pegasus_stats", {}),
            supp_inventory: safeParse("pegasus_supp_inventory", {prot:2500, crea:1000}),
            peg_contacts: safeParse("pegasus_contacts", []),
            car_dates: safeParse("pegasus_car_dates", {}),
            car_service: safeParse("pegasus_car_service", []),
            today_food_log: safeParse(`food_log_${dateStr}`, []),
            all_food_logs: allFoodLogs,
            cardio_logs: cardioLogs,
            history_logs: historyLogs
        };

        try {
            const res = await fetch("https://api.jsonbin.io/v3/b/" + config.binId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': state.userKey },
                body: JSON.stringify(payload)
            });
            
            if (res.ok) {
                localStorage.setItem("pegasus_last_push", syncTimestamp.toString());
                console.log("✅ [PEGASUS CLOUD]: Push Success");
            }
        } catch (e) {
            console.error("❌ [PEGASUS CLOUD]: Push Failed", e);
        }
    };

    const unlockVault = (pin) => {
        if (!pin) return false;
        const cleanPin = pin.trim();
        // Base64 validation PIN
        if (btoa(cleanPin) === "MjM3NQ==") { 
            state.userKey = config.encryptedPart;
            state.isUnlocked = true;
            localStorage.setItem("pegasus_vault_pin", cleanPin);
            
            pullData(true);
            
            if (!state.syncInterval) {
                state.syncInterval = setInterval(() => {
                    if (state.isUnlocked) pullData(true);
                }, 30000); 
            }
            return true;
        }
        return false;
    };

    const init = () => {
        const savedPin = localStorage.getItem("pegasus_vault_pin");
        if (savedPin) {
            unlockVault(savedPin);
        } else {
            setTimeout(() => {
                const pin = prompt("PEGASUS VAULT: Εισάγετε PIN:");
                if (pin && !unlockVault(pin)) alert("ΛΑΘΟΣ PIN.");
            }, 1000);
        }
    };

    // 3. PUBLIC API
    return {
        init: init,
        unlock: unlockVault,
        pull: pullData,
        push: pushData,
        get hasSuccessfullyPulled() { return state.hasSuccessfullyPulled; },
        get isUnlocked() { return state.isUnlocked; }
    };
})();

// Εξαγωγή αντικειμένου και σύνδεση Listener
window.PegasusCloud = PegasusCloud;
window.addEventListener('DOMContentLoaded', PegasusCloud.init);