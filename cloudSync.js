/* ==========================================================================
   PEGASUS CLOUD VAULT - PUBLIC REPO EDITION (v9.6)
   Includes: Smart Merge, PIN Lock (2375), & Weekly Reset
   ========================================================================== */

const PegasusCloud = {
    config: {
        binId: "69b6757ab7ec241ddc6d7230",
        encryptedPart: "$2a$10$oU/TyQjSeNEVr/k5dnFS8ulKZkbb9gUWd5xuXijAYFCBijuXrYAFC" 
    },
    
    isUnlocked: false,
    userKey: "",

    /**
     * ΞΕΚΛΕΙΔΩΜΑ ΜΕ PIN
     */
    unlock: function(pin) {
        if (pin === "2375") { 
            this.userKey = this.config.encryptedPart;
            this.isUnlocked = true;
            localStorage.setItem("pegasus_vault_pin", pin);
            this.checkWeeklyReset(); // Έλεγχος για reset Δευτέρας
            this.pull();
            return true;
        }
        return false;
    },

    /**
     * ΕΒΔΟΜΑΔΙΑΙΟ RESET (Κάθε Δευτέρα)
     */
    checkWeeklyReset: function() {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 1 = Δευτέρα
        const currentWeekKey = `${now.getFullYear()}-W${Math.ceil(now.getDate() / 7)}`;
        const lastReset = localStorage.getItem('pegasus_last_weekly_reset');

        if (dayOfWeek === 1 && lastReset !== currentWeekKey) {
            console.log("PEGASUS: Monday detected. Resetting Weekly History...");
            const emptyHistory = {
                "Στήθος": 0, "Πλάτη": 0, "Πόδια": 0, "Χέρια": 0, "Ώμοι": 0, "Κορμός": 0
            };
            localStorage.setItem('pegasus_weekly_history', JSON.stringify(emptyHistory));
            localStorage.setItem('pegasus_last_weekly_reset', currentWeekKey);
            this.push(true); // Ενημέρωση Cloud
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
        const today = new Date().toISOString().split('T')[0];
        const dayKey = `food_log_${today}`;

        // Μηδενισμός ημέρας: Αν ο Cloud έχει παλιά ημερομηνία, δεν κάνουμε merge γεύματα
        if (cloudData.last_update_date === today) {
            let localLog = JSON.parse(localStorage.getItem(dayKey) || "[]");
            let cloudLog = cloudData.today_food_log || [];
            
            const uniqueMap = new Map();
            [...localLog, ...cloudLog].forEach(item => {
                uniqueMap.set(`${item.name}_${item.kcal}_${item.protein}`, item);
            });

            localStorage.setItem(dayKey, JSON.stringify(Array.from(uniqueMap.values())));
            if (typeof window.updateFoodUI === "function") window.updateFoodUI();
        }

        // Συγχρονισμός εβδομαδιαίου ιστορικού (ανεξαρτήτως ημέρας)
        if (cloudData.weekly_history) {
            localStorage.setItem('pegasus_weekly_history', JSON.stringify(cloudData.weekly_history));
            if (window.MuscleProgressUI) window.MuscleProgressUI.render();
        }
    },

    push: async function(silent = false) {
        if (!this.isUnlocked) return;
        const today = new Date().toISOString().split('T')[0];
        const syncTimestamp = Date.now();

        const payload = {
            last_update_date: today,
            last_update_ts: syncTimestamp,
            today_food_log: JSON.parse(localStorage.getItem(`food_log_${today}`) || "[]"),
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