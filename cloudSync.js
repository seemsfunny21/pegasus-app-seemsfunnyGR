/* ==========================================================================
   PEGASUS CLOUD VAULT - ANALYST FIXED (v9.8)
   Protocol: Legacy Date Format Support (DD/M/YYYY) & PIN Protection
   ========================================================================== */

const PegasusCloud = {
    config: {
        binId: "69b6757ab7ec241ddc6d7230",
        encryptedPart: "$2a$10$oU/TyQjSeNEVr/k5dnFS8ulKZkbb9gUWd5xuXijAYFCBijuXrYAFC" 
    },
    
    isUnlocked: false,
    userKey: "",

    /**
     * 1. ΥΠΟΛΟΓΙΣΜΟΣ ΚΛΕΙΔΙΟΥ (Συμβατότητα με Backup 14/2/2026)
     */
    getTodayKey: function() {
        const d = new Date();
        // Επιστρέφει DD/M/YYYY για να ταυτίζεται με το ιστορικό σας [cite: 8, 21]
        return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
    },

    /**
     * 2. ΞΕΚΛΕΙΔΩΜΑ & ΑΥΤΟΜΑΤΟ PULL
     */
    unlock: function(pin) {
        const check = (input) => {
            return btoa(input) === "MjM3NQ=="; // Base64 για το PIN 2375
        };

        if (check(pin)) { 
            this.userKey = this.config.encryptedPart;
            this.isUnlocked = true;
            localStorage.setItem("pegasus_vault_pin", pin);
            console.log("PEGASUS: Vault Unlocked. Starting Sync...");
            this.checkWeeklyReset();
            this.pull();
            return true;
        }
        return false;
    },

    /**
     * 3. ΕΒΔΟΜΑΔΙΑΙΟ RESET
     */
    checkWeeklyReset: function() {
        const now = new Date();
        const dayOfWeek = now.getDay(); 
        const currentWeekKey = now.getFullYear() + "-W" + Math.ceil(now.getDate() / 7);
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

    /**
     * 4. ΛΗΨΗ ΔΕΔΟΜΕΝΩΝ (PULL)
     */
    pull: async function() {
        if (!this.isUnlocked) return;
        try {
            const res = await fetch("https://api.jsonbin.io/v3/b/" + this.config.binId + "/latest?nocache=" + Date.now(), {
                headers: { 'X-Master-Key': this.userKey, 'X-Bin-Meta': 'false' }
            });
            const cloudData = await res.json();
            this.processMerge(cloudData);
        } catch (e) { console.error("❌ PEGASUS Pull Error", e); }
    },

    /**
     * 5. ΣΥΓΧΩΝΕΥΣΗ (MERGE)
     */
processMerge: function(cloudData) {
    const todayStr = this.getTodayKey();
    const dayKey = "food_log_" + todayStr;

    // ΕΛΕΓΧΟΣ ΗΜΕΡΟΜΗΝΙΑΣ: Αν το Cloud έχει δεδομένα για σήμερα
    if (cloudData.last_update_date === todayStr) {
        // ΑΥΣΤΗΡΟ ΠΡΩΤΟΚΟΛΛΟ: Αντικατάσταση τοπικών με δεδομένα Cloud
        // Αυτό διασφαλίζει ότι αν σβήσετε κάτι σε μια συσκευή, θα σβηστεί παντού
        localStorage.setItem(dayKey, JSON.stringify(cloudData.today_food_log || []));
        
        if (typeof window.updateFoodUI === "function") window.updateFoodUI();
    }

    // Συγχρονισμός Ιστορικού Μυών
    if (cloudData.weekly_history) {
        localStorage.setItem('pegasus_weekly_history', JSON.stringify(cloudData.weekly_history));
        if (window.MuscleProgressUI) window.MuscleProgressUI.render();
    }
    
    // Συγχρονισμός Βιβλιοθήκης
    if (cloudData.food_library) {
        localStorage.setItem('pegasus_food_library', JSON.stringify(cloudData.food_library));
    }
},

    /**
     * 6. ΑΠΟΣΤΟΛΗ ΔΕΔΟΜΕΝΩΝ (PUSH)
     */
    push: async function(silent = false) {
        if (!this.isUnlocked) return;
        const todayStr = this.getTodayKey();
        const syncTimestamp = Date.now();

        const payload = {
            last_update_date: todayStr,
            last_update_ts: syncTimestamp,
            today_food_log: JSON.parse(localStorage.getItem("food_log_" + todayStr) || "[]"),
            weekly_history: JSON.parse(localStorage.getItem('pegasus_weekly_history') || "{}"),
            food_library: JSON.parse(localStorage.getItem('pegasus_food_library') || "[]")
        };

        try {
            await fetch("https://api.jsonbin.io/v3/b/" + this.config.binId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-Master-Key': this.userKey },
                body: JSON.stringify(payload)
            });
            localStorage.setItem("pegasus_last_push", syncTimestamp.toString());
            if (!silent) console.log("✅ PEGASUS Cloud Sync Success");
        } catch (e) { console.error("❌ PEGASUS Push Error", e); }
    }
};

/**
 * ΑΡΧΙΚΟΠΟΙΗΣΗ ΣΥΣΤΗΜΑΤΟΣ
 */
window.addEventListener('load', () => {
    const savedPin = localStorage.getItem("pegasus_vault_pin");
    if (savedPin) {
        PegasusCloud.unlock(savedPin);
    } else {
        setTimeout(() => {
            const pin = prompt("PEGASUS OS: Εισάγετε PIN για συγχρονισμό:");
            if (!PegasusCloud.unlock(pin)) alert("Λάθος PIN.");
        }, 2000);
    }
});
