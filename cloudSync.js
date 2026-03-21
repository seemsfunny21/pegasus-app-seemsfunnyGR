/* ==========================================================================
   PEGASUS CLOUD VAULT - FINAL ANALYST EDITION (v10.0)
   Protocol: Force Overwrite, Direct Pull & Status Reporting
   ========================================================================== */

const PegasusCloud = {
    config: {
        binId: "69b6757ab7ec241ddc6d7230",
        encryptedPart: "$2a$10$oU/TyQjSeNEVr/k5dnFS8ulKZkbb9gUWd5xuXijAYFCBijuXrYAFC" 
    },
    
    isUnlocked: false,
    userKey: "",

    /**
     * 1. ΥΠΟΛΟΓΙΣΜΟΣ ΚΛΕΙΔΙΟΥ (Συμβατότητα με Legacy Backup DD/M/YYYY)
     */
    getTodayKey: function() {
        const d = new Date();
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
            this.pull(); // Αυτόματο Pull κατά την είσοδο
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
     * 4. ΛΗΨΗ ΔΕΔΟΜΕΝΩΝ (PULL) - FORCE OVERWRITE PROTOCOL
     */
    pull: async function() {
        if (!this.isUnlocked) return;
        console.log("PEGASUS: Force Pull Initiated...");
        try {
            const res = await fetch("https://api.jsonbin.io/v3/b/" + this.config.binId + "/latest?nocache=" + Date.now(), {
                headers: { 'X-Master-Key': this.userKey, 'X-Bin-Meta': 'false' }
            });
            const cloudData = await res.json();
            
            console.log("✅ PEGASUS: Cloud Data Received", cloudData);
            this.processMerge(cloudData);
        } catch (e) { 
            console.error("❌ PEGASUS Pull Error", e);
            alert("ΣΦΑΛΜΑ ΛΗΨΗΣ: Ελέγξτε τη σύνδεση ή το Bin ID.");
        }
    },

    /**
     * 5. ΕΠΕΞΕΡΓΑΣΙΑ & ΕΠΙΒΟΛΗ (MERGE/OVERWRITE)
     */
    processMerge: function(cloudData) {
        const todayStr = this.getTodayKey();
        const dayKey = "food_log_" + todayStr;

        // Επιβολή δεδομένων Cloud (Overwrite) για αποφυγή ghost items
        if (cloudData.last_update_date === todayStr) {
            const cloudLog = cloudData.today_food_log || [];
            
            localStorage.setItem(dayKey, JSON.stringify(cloudLog));
            
            console.log("🔄 PEGASUS: Local storage overwritten with " + cloudLog.length + " items.");
            alert("ΛΗΨΗ ΟΛΟΚΛΗΡΩΘΗΚΕ: " + cloudLog.length + " εγγραφές από το Cloud.");
            
            if (typeof window.updateFoodUI === "function") window.updateFoodUI();
        } else {
            console.warn("⚠️ PEGASUS: Date Mismatch. Cloud: " + cloudData.last_update_date + " | Local: " + todayStr);
            alert("ΠΡΟΣΟΧΗ: Τα δεδομένα στο Cloud αφορούν άλλη ημερομηνία (" + cloudData.last_update_date + ").");
        }

        // Συγχρονισμός ιστορικού και βιβλιοθήκης
        if (cloudData.weekly_history) {
            localStorage.setItem('pegasus_weekly_history', JSON.stringify(cloudData.weekly_history));
            if (window.MuscleProgressUI) window.MuscleProgressUI.render();
        }
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
            
            console.log("✅ PEGASUS Cloud Push Success");
            if (!silent) alert("ΕΠΙΤΥΧΗΣ ΑΠΟΣΤΟΛΗ ΣΤΟ CLOUD");
        } catch (e) { 
            console.error("❌ PEGASUS Push Error", e);
            if (!silent) alert("ΑΠΟΤΥΧΙΑ ΑΠΟΣΤΟΛΗΣ ΔΕΔΟΜΕΝΩΝ.");
        }
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
