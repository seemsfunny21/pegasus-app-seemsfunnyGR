/* ==========================================================================
   PEGASUS CLOUD VAULT - FINAL ANALYST EDITION (v10.1)
   Protocol: Zero-Failure Pull & Force Overwrite
   ========================================================================== */

const PegasusCloud = {
    config: {
        binId: "69b6757ab7ec241ddc6d7230",
        encryptedPart: "$2a$10$oU/TyQjSeNEVr/k5dnFS8ulKZkbb9gUWd5xuXijAYFCBijuXrYAFC" 
    },
    
    isUnlocked: false,
    userKey: "",

    getTodayKey: function() {
        const d = new Date();
        // ΔΙΟΡΘΩΣΗ: Προσθήκη return και format D/M/YYYY
        return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
    },

    unlock: function(pin) {
        if (btoa(pin) === "MjM3NQ==") { 
            this.userKey = this.config.encryptedPart;
            this.isUnlocked = true;
            localStorage.setItem("pegasus_vault_pin", pin);
            this.pull(); 
            return true;
        }
        return false;
    },

    pull: async function() {
        if (!this.isUnlocked) return;
        console.log("PEGASUS: Fetching data...");
        try {
            const res = await fetch("https://api.jsonbin.io/v3/b/" + this.config.binId + "/latest?nocache=" + Date.now(), {
                headers: { 'X-Master-Key': this.userKey, 'X-Bin-Meta': 'false' }
            });
            const cloudData = await res.json();
            
            // ΑΜΕΣΗ ΕΠΙΒΟΛΗ (Χωρίς if/else ελέγχους ημερομηνίας)
            const dayKey = "food_log_" + this.getTodayKey();
            const cloudLog = cloudData.today_food_log || [];
            
            localStorage.setItem(dayKey, JSON.stringify(cloudLog));
            
            if (cloudData.weekly_history) localStorage.setItem('pegasus_weekly_history', JSON.stringify(cloudData.weekly_history));
            if (cloudData.food_library) localStorage.setItem('pegasus_food_library', JSON.stringify(cloudData.food_library));

            console.log("✅ PEGASUS Pull Success. Items: " + cloudLog.length);
            alert("ΛΗΨΗ ΟΛΟΚΛΗΡΩΘΗΚΕ: " + cloudLog.length + " εγγραφές.");
            
            if (typeof window.updateFoodUI === "function") window.updateFoodUI();
        } catch (e) { 
            console.error("❌ PEGASUS Pull Error", e);
            alert("ΣΦΑΛΜΑ PULL: " + e.message);
        }
    },

    push: async function(silent = false) {
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
            console.log("✅ PEGASUS Push Success");
            if (!silent) alert("ΕΠΙΤΥΧΗΣ ΑΠΟΣΤΟΛΗ ΣΤΟ CLOUD");
        } catch (e) { 
            console.error("❌ PEGASUS Push Error", e);
            if (!silent) alert("ΑΠΟΤΥΧΙΑ ΑΠΟΣΤΟΛΗΣ.");
        }
    }
};

window.addEventListener('load', () => {
    const savedPin = localStorage.getItem("pegasus_vault_pin");
    if (savedPin) PegasusCloud.unlock(savedPin);
});
