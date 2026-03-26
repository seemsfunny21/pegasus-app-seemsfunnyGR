/* ==========================================================================
   PEGASUS CLOUD VAULT - CORE SYNC (v13.9 - SYNC GUARD ENABLED)
   Protocol: Strict Data Analyst - Full Data Payload & UI Modal Integration
   ========================================================================== */

const PegasusCloud = {
    config: {
        binId: "69b6757ab7ec241ddc6d7230",
        encryptedPart: "$2a$10$oU/TyQjSeNEVr/k5dnFS8ulKZkbb9gUWd5xuXijAYFCBijuXrYAFC" 
    },
    
    isUnlocked: false,
    hasSuccessfullyPulled: false, // ΔΙΑΚΟΠΤΗΣ ΑΣΦΑΛΕΙΑΣ
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
                }, 30000); // 30s interval
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

                // Sync Core Params
                if (cloud.muscle_targets) localStorage.setItem('pegasus_muscle_targets', JSON.stringify(cloud.muscle_targets));
                if (cloud.peg_stats) localStorage.setItem('pegasus_stats', JSON.stringify(cloud.peg_stats));

                if (cloud.weekly_history) {
                    localStorage.setItem('pegasus_weekly_history', JSON.stringify(cloud.weekly_history));
                    requiresUIReload = true;
                }
                
                // Sync Mobile Extracted Params (Ακόμα κι αν το Desktop δεν τα δείχνει, πρέπει να τα κρατάει)
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
                
                if (requiresUIReload && typeof window.updateFoodUI === "function") window.updateFoodUI();
                if (typeof window.updateSuppUI === "function") window.updateSuppUI();
                if (window.MuscleProgressUI) window.MuscleProgressUI.render();
            }
            
            this.hasSuccessfullyPulled = true; 
            
        } catch (e) {
            this.hasSuccessfullyPulled = false; 
            console.error("PEGASUS Cloud Pull Error:", e);
        }
    },

    push: async function(silent = true) {
        if (!this.isUnlocked) return;
        
        // DATA GUARD: ΑΠΑΓΟΡΕΥΣΗ PUSH ΧΩΡΙΣ PULL
        if (!this.hasSuccessfullyPulled) {
            console.error("PEGASUS GUARD: Το Push ακυρώθηκε. Αποτροπή υπερεγγραφής του Cloud.");
            return;
        }

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
                if (!silent) console.log("✅ PEGASUS Cloud Sync: Push Success");
            }
        } catch (e) {
            console.error("❌ PEGASUS Cloud Sync: Push Failed", e);
        }
    }
};

window.PegasusCloud = PegasusCloud;

// DYNAMIC UI BINDING ΑΝΤΙ ΓΙΑ PROMPT
window.addEventListener('load', () => {
    const savedPin = localStorage.getItem("pegasus_vault_pin");
    if (savedPin) {
        window.PegasusCloud.unlock(savedPin);
    } else {
        // Ελέγχει αν υπάρχει το Modal του Desktop (αν το προσθέσουμε στο index.html)
        const vaultModal = document.getElementById("pinModal");
        if (vaultModal) {
            vaultModal.style.display = "flex";
        } else {
            console.warn("PEGASUS: Απουσιάζει το PIN Modal. Το σύστημα τρέχει σε Offline/Guest mode.");
        }
    }
});
