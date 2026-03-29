/* ==========================================================================
   PEGASUS CLOUD VAULT - CORE SYNC (v14.6 - TOTAL DATA INTEGRITY)
   Protocol: Strict Data Analyst - Maximalist Retention Edition
   Integrity Status: 100% RECOVERY (No data categories omitted)
   ========================================================================== */

const PegasusCloud = {
    config: {
        binId: "69b6757ab7ec241ddc6d7230",
        encryptedPart: "$2a$10$oU/TyQjSeNEVr/k5dnFS8ulKZkbb9gUWd5xuXijAYFCBijuXrYAFC" 
    },
    
    isUnlocked: false,
    hasSuccessfullyPulled: true, // 🛡️ GUARD DISARMED
    userKey: "$2a$10$oU/TyQjSeNEVr/k5dnFS8ulKZkbb9gUWd5xuXijAYFCBijuXrYAFC",
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
            this.isUnlocked = true;
            localStorage.setItem("pegasus_vault_pin", cleanPin);
            this.pull(true);
            if (!this.syncInterval) {
                this.syncInterval = setInterval(() => { if (this.isUnlocked) this.pull(true); }, 30000); 
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
            const cloud = (await res.json()).record;
            
            // 1. ANCHOR: CORE RECOVERY (Muscle, Stats, Targets)
            if (cloud.muscle_targets) localStorage.setItem('pegasus_muscle_targets', JSON.stringify(cloud.muscle_targets));
            if (cloud.peg_stats) localStorage.setItem('pegasus_stats', JSON.stringify(cloud.peg_stats));
            if (cloud.weekly_history) localStorage.setItem('pegasus_weekly_history', JSON.stringify(cloud.weekly_history));
            if (cloud.workouts_done) localStorage.setItem('pegasus_workouts_done', JSON.stringify(cloud.workouts_done));
            localStorage.setItem("pegasus_goal_kcal", cloud.goal_kcal || "2800");
            localStorage.setItem("pegasus_goal_protein", cloud.goal_protein || "160");

            // 2. ANCHOR: LOGISTICS & CAR (RECOVERED)
            if (cloud.supp_inventory) localStorage.setItem('pegasus_supp_inventory', JSON.stringify(cloud.supp_inventory));
            if (cloud.peg_contacts) localStorage.setItem('pegasus_contacts', JSON.stringify(cloud.peg_contacts));
            if (cloud.car_identity) localStorage.setItem('peg_car_identity', JSON.stringify(cloud.car_identity));
            if (cloud.car_dates) localStorage.setItem('pegasus_car_dates', JSON.stringify(cloud.car_dates));
            if (cloud.car_service) localStorage.setItem('pegasus_car_service', JSON.stringify(cloud.car_service));
            if (cloud.vault_data) localStorage.setItem('peg_vault_data', JSON.stringify(cloud.vault_data));

            // 3. ANCHOR: NUTRITION MAPPING
            if (cloud.food_library) localStorage.setItem('pegasus_food_library', JSON.stringify(cloud.food_library));
            if (cloud.all_food_logs) {
                Object.keys(cloud.all_food_logs).forEach(k => localStorage.setItem(k, JSON.stringify(cloud.all_food_logs[k])));
            }
            if (cloud.last_update_date === this.getTodayKey()) {
                localStorage.setItem("pegasus_today_kcal", cloud.kcal || "0"); 
                localStorage.setItem("pegasus_today_protein", cloud.protein || "0"); 
            }

            // 4. ANCHOR: CARDIO & HISTORY LOGS
            if (cloud.cardio_logs) Object.keys(cloud.cardio_logs).forEach(k => localStorage.setItem(k, JSON.stringify(cloud.cardio_logs[k])));
            if (cloud.history_logs) {
                Object.keys(cloud.history_logs).forEach(k => {
                    let val = cloud.history_logs[k];
                    localStorage.setItem(k, typeof val === 'string' ? val : JSON.stringify(val));
                });
            }

            localStorage.setItem("pegasus_last_push", cloud.last_update_ts?.toString() || Date.now().toString());
            
            // REFRESH UI
            if (typeof window.updateFoodUI === "function") window.updateFoodUI();
            if (typeof window.renderCalendar === "function") window.renderCalendar();
            if (window.MuscleProgressUI) window.MuscleProgressUI.render();
            
            this.hasSuccessfullyPulled = true;
            return true;
        } catch (e) { console.error("PEGASUS PULL ERR:", e); return false; }
    },

    push: async function(silent = true) {
        if (!this.isUnlocked || !this.hasSuccessfullyPulled) return;

        const syncTimestamp = Date.now();
        const cardioLogs = {}, historyLogs = {}, allFoodLogs = {};
        
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
            last_update_date: this.getTodayKey(), last_update_ts: syncTimestamp,
            kcal: localStorage.getItem("pegasus_today_kcal") || "0",
            protein: localStorage.getItem("pegasus_today_protein") || "0",
            goal_kcal: localStorage.getItem("pegasus_goal_kcal") || "2800",
            goal_protein: localStorage.getItem("pegasus_goal_protein") || "160",
            weekly_history: this.safeParse("pegasus_weekly_history", {}),
            workouts_done: this.safeParse("pegasus_workouts_done", {}),
            muscle_targets: this.safeParse("pegasus_muscle_targets", {}),
            peg_stats: this.safeParse("pegasus_stats", {}),
            supp_inventory: this.safeParse("pegasus_supp_inventory", {prot:2500, crea:1000}),
            peg_contacts: this.safeParse("pegasus_contacts", []),
            car_identity: this.safeParse("peg_car_identity", {}),
            car_dates: this.safeParse("pegasus_car_dates", {}),
            car_service: this.safeParse("pegasus_car_service", []),
            vault_data: this.safeParse("peg_vault_data", {}),
            food_library: this.safeParse("pegasus_food_library", []),
            all_food_logs: allFoodLogs,
            cardio_logs: cardioLogs,
            history_logs: historyLogs
        };

        try {
            await fetch("https://api.jsonbin.io/v3/b/" + this.config.binId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': this.userKey },
                body: JSON.stringify(payload)
            });
            localStorage.setItem("pegasus_last_push", syncTimestamp.toString());
        } catch (e) { console.error("PEGASUS PUSH ERR:", e); }
    }
};

window.PegasusCloud = PegasusCloud;

/* === DATABASE INTERCEPTOR (RESTORED) === */
if (!window.originalSetItem) {
    window.originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        window.originalSetItem.apply(this, arguments);
        if (key.startsWith("food_log_") || key === "pegasus_workouts_done") {
            if (window.PegasusCloud && window.PegasusCloud.isUnlocked) window.PegasusCloud.push(true);
        }
    };
}
