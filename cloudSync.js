/* ==========================================================================
   PEGASUS CLOUD VAULT - COMPATIBILITY EDITION (v9.7)
   Fix: DD/M/YYYY Date Format Support
   ========================================================================== */

const PegasusCloud = {
    config: {
        binId: "69b6757ab7ec241ddc6d7230",
        encryptedPart: "$2a$10$oU/TyQjSeNEVr/k5dnFS8ulKZkbb9gUWd5xuXijAYFCBijuXrYAFC" 
    },
    
    isUnlocked: false,
    userKey: "",

    /**
     * Υπολογισμός κλειδιού ημερομηνίας (Συμβατότητα με Backup)
     */
    getTodayKey: function() {
        const d = new Date();
        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    },

    unlock: function(pin) {
        const check = (input) => {
            return btoa(input) === "MjM3NQ=="; 
        };

        if (check(pin)) { 
            this.userKey = this.config.encryptedPart;
            this.isUnlocked = true;
            localStorage.setItem("pegasus_vault_pin", pin);
            this.checkWeeklyReset();
            this.pull();
            return true;
        }
        return false;
    },

    checkWeeklyReset: function() {
        const now = new Date();
        const dayOfWeek = now.getDay(); 
        const currentWeekKey = `${now.getFullYear()}-W${Math.ceil(now.getDate() / 7)}`;
        const lastReset = localStorage.getItem('pegasus_last_weekly_reset');

        if (dayOfWeek === 1 && lastReset !== currentWeekKey) {
            const emptyHistory = {
                "Στήθος": 0, "Πλάτη": 0, "Πόδια": 0, "Χέρια": 0, "Ώμοι": 0, "Κορμός": 0
            };
            localStorage.setItem('pegasus_weekly_history', JSON.stringify(emptyHistory));
            localStorage.setItem('pegasus_last_weekly_reset', currentWeekKey);
            this.push(true); 
        }
    },

    pull: async function(silent = false) {
        if (!this.isUnlocked) return;
        try {
            const res = await fetch(`https://api.jsonbin.io/v3/b/${this.config.binId}/latest?nocache=${Date.now()}`, {
                headers: { 'X-Master-Key': this.userKey, 'X-Bin-Meta': 'false' }
            });
            const cloudData = await res.json();
            this.processMerge(cloudData);
        } catch (e) { console.error("❌ Pull Error", e); }
    },

    processMerge: function(cloudData) {
        const todayStr = this.getTodayKey();
        const dayKey = `food_log_${todayStr}`;

        // Merge ΜΟΝΟ αν ο Cloud έχει δεδομένα για τη σημερινή ημερομηνία
        if (cloudData.last_update_date === todayStr) {
            let localLog = JSON.parse(localStorage.getItem(dayKey) || "[]");
            let cloudLog = cloudData.today_food_log || [];
            
            const uniqueMap = new Map();
            [...localLog, ...cloudLog].forEach(item => {
                uniqueMap.set(`${item.name}_${item.kcal}_${item.protein}`, item);
            });

            localStorage.setItem(dayKey, JSON.stringify(Array.from(uniqueMap.values())));
            if (typeof window.updateFoodUI === "function") window.updateFoodUI();
        }

        if (cloudData.weekly_history) {
            localStorage.setItem('pegasus_weekly_history', JSON.stringify(cloudData.weekly_history));
            if (window.MuscleProgressUI) window.MuscleProgressUI.render();
        }
        
        // Συγχρονισμός Βιβλιοθήκης (Πολύ σημαντικό για τα παλιά logs)
        if (cloudData.food_library) {
            localStorage.setItem('pegasus_food_library', JSON.stringify(cloudData.food_library));
        }
    },

    push: async function(silent = false) {
        if (!this.isUnlocked) return;
        const todayStr = this.getTodayKey();
        const syncTimestamp = Date.now();

        const payload = {
            last_update_date: todayStr,
            last_update_ts: syncTimestamp,
            today_food_log: JSON.parse(localStorage.getItem(`food_log_${todayStr}`) || "[]"),
            weekly_history: JSON.parse(localStorage.getItem('pegasus_weekly_history') || "{}"),
            food_library: JSON.parse(localStorage.getItem('pegasus_food_library') || "[]")
        };

        try {
            await fetch(`https://api.jsonbin.io/v3/b/${this.config.binId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': this.userKey },
                body: JSON.stringify(payload)
            });
            localStorage.setItem("pegasus_last_push", syncTimestamp.toString());
            if (!silent) console.log("✅ Cloud Sync Success");
        } catch (e) { console.error("❌ Push Error", e); }
    }
};
