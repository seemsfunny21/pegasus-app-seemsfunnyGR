/* ==========================================================================
   PEGASUS CLOUD VAULT - AUTO-SYNC FINAL (v11.2)
   FIX: GLOBAL SCOPE EXPORT & PIN PROMPT INTEGRATION
   ========================================================================== */

// ΔΗΛΩΣΗ ΩΣ GLOBAL WINDOW OBJECT (Κρίσιμο για την επικοινωνία με το food.js)
window.PegasusCloud = {
    config: {
        binId: "69b6757ab7ec241ddc6d7230",
        encryptedPart: "$2a$10$oU/TyQjSeNEVr/k5dnFS8ulKZkbb9gUWd5xuXijAYFCBijuXrYAFC" 
    },
    
    isUnlocked: false,
    userKey: "",

    getTodayKey: function() {
        const d = new Date();
        return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
    },

    unlock: function(pin) {
        if (btoa(pin) === "MjM3NQ==") { 
            this.userKey = this.config.encryptedPart;
            this.isUnlocked = true;
            localStorage.setItem("pegasus_vault_pin", pin);
            console.log("PEGASUS: Vault Unlocked. Triggering Initial Pull...");
            this.pull(true); // Silent pull κατά την είσοδο
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
            
            const dayKey = "food_log_" + this.getTodayKey();
            const cloudLog = cloudData.today_food_log || [];
            
            // BACKUP ΠΡΙΝ ΤΗΝ ΑΝΤΙΚΑΤΑΣΤΑΣΗ
            const localBefore = localStorage.getItem(dayKey);
            if (localBefore) localStorage.setItem(dayKey + "_backup", localBefore);

            localStorage.setItem(dayKey, JSON.stringify(cloudLog));
            
            if (cloudData.weekly_history) localStorage.setItem('pegasus_weekly_history', JSON.stringify(cloudData.weekly_history));
            if (cloudData.food_library) localStorage.setItem('pegasus_food_library', JSON.stringify(cloudData.food_library));

            console.log("✅ Auto-Pull Complete. Items: " + cloudLog.length);
            if (!silent) alert("Ο συγχρονισμός ολοκληρώθηκε (" + cloudLog.length + " εγγραφές)");
            
            if (typeof window.updateFoodUI === "function") window.updateFoodUI();
        } catch (e) { console.error("❌ Pull Error", e); }
    },

    push: async function(silent = true) {
        if (!this.isUnlocked) return;
        const todayStr = this.getTodayKey();
        const payload = {
            last_update_date: todayStr,
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
            console.log("✅ PEGASUS Auto-Push Success");
        } catch (e) { console.error("❌ Push Error", e); }
    }
};

// ΕΚΚΙΝΗΣΗ & ΕΛΕΓΧΟΣ PIN
window.addEventListener('load', () => {
    const savedPin = localStorage.getItem("pegasus_vault_pin");
    if (savedPin) {
        window.PegasusCloud.unlock(savedPin);
    } else {
        // Καθυστέρηση για φόρτωση του UI πριν ζητηθεί το PIN
        setTimeout(() => {
            const pin = prompt("PEGASUS VAULT: Εισάγετε PIN για συγχρονισμό:");
            if (pin && !window.PegasusCloud.unlock(pin)) {
                alert("ΛΑΘΟΣ PIN. Ανανεώστε τη σελίδα για νέα προσπάθεια.");
            }
        }, 1500);
    }
});
