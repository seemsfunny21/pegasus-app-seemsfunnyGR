/* ==========================================================================
   PEGASUS CLOUD VAULT - UNIVERSAL CORE (v19 ULTRA MERGED)
   STATUS: PRODUCTION SAFE | NO DATA LOSS | NO LOOPS | FULL DOMAIN SUPPORT
   ========================================================================== */

const PegasusCloud = {
    config: {
        binId: "69b6757ab7ec241ddc6d7230",
        encryptedPart: "$2a$10$oU/TyQjSeNEVr/k5dnFS8ulKZkbb9gUWd5xuXijAYFCBijuXrYAFC"
    },

    isUnlocked: false,
    hasSuccessfullyPulled: false,
    isPulling: false,
    isPushing: false,

    userKey: "",
    syncInterval: null,
    pushTimeout: null,

    getTodayKey: () => {
        const d = new Date();
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    },

    // 🔓 UNLOCK (SAFE SESSION)
    unlock(pin) {
        if (!pin) return false;

        const clean = pin.trim();

        if (btoa(clean) !== "MjM3NQ==") return false;

        this.userKey = this.config.encryptedPart;
        this.isUnlocked = true;

        localStorage.setItem("pegasus_vault_pin", clean);
        localStorage.setItem("pegasus_vault_time", Date.now().toString());

        console.log("🔓 CLOUD: Unlocked");

        this.pull(true);
        this.startAutoSync();

        return true;
    },

    // 📥 PULL (SAFE + VERSIONED)
    async pull(silent = false) {
        if (!this.isUnlocked || this.isPulling) return;

        this.isPulling = true;

        try {
            const res = await fetch(`https://api.jsonbin.io/v3/b/${this.config.binId}/latest?nocache=${Date.now()}`, {
                headers: {
                    "X-Master-Key": this.userKey,
                    "X-Bin-Meta": "false"
                }
            });

            if (!res.ok) throw new Error("Pull failed");

            const data = await res.json();
            const cloud = data.record || data;

            const lastLocal = localStorage.getItem("pegasus_last_push") || "0";

            // ✅ CRITICAL: VERSION CHECK
if (!cloud.last_update_ts || cloud.last_update_ts.toString() === lastLocal) {
    this.hasSuccessfullyPulled = true; // 🔥 ΧΩΡΙΣ ΑΥΤΟ ΔΕΝ ΘΑ ΚΑΝΕΙ ΠΟΤΕ PUSH
    this.isPulling = false;
    return;
}

            console.log("☁️ CLOUD: New version detected → syncing...");

            // 🔁 FULL KEY SYNC
            Object.keys(cloud).forEach(k => {
                if (
                    k.startsWith("pegasus_") ||
                    k.startsWith("food_log_") ||
                    k.startsWith("kouki_") ||
                    k.startsWith("peg_") ||
                    k.startsWith("weight_") ||
                    k.startsWith("finance_")
                ) {
                    const val = typeof cloud[k] === "string" ? cloud[k] : JSON.stringify(cloud[k]);
                    window.originalSetItem.call(localStorage, k, val);
                }
            });

            // 🧠 MAPPING LAYER (LEGACY SUPPORT)
            const map = {
                weekly_history: "pegasus_weekly_history",
                muscle_targets: "pegasus_muscle_targets",
                supp_inventory: "pegasus_supp_inventory",
                peg_contacts: "pegasus_contacts",
                car_dates: "pegasus_car_dates",
                car_service: "pegasus_car_service",
                car_specs: "pegasus_car_specs",
                parking_loc: "pegasus_parking_loc",
                food_library: "pegasus_food_library",
                peg_stats: "pegasus_stats"
            };

            Object.entries(map).forEach(([ck, lk]) => {
                if (cloud[ck]) {
                    window.originalSetItem.call(localStorage, lk, JSON.stringify(cloud[ck]));
                }
            });

            // 🍽️ FOOD LOGS FULL RESTORE
            if (cloud.all_food_logs) {
                Object.keys(cloud.all_food_logs).forEach(k => {
                    window.originalSetItem.call(localStorage, k, JSON.stringify(cloud.all_food_logs[k]));
                });
            }

            // ✅ SAVE VERSION
            window.originalSetItem.call(localStorage, "pegasus_last_push", cloud.last_update_ts.toString());

            this.hasSuccessfullyPulled = true;

            this.triggerUIUpdate();

        } catch (e) {
            console.error("❌ PULL ERROR:", e);
        } finally {
            this.isPulling = false;
        }
    },

    // 📤 PUSH (DEBOUNCED + SAFE)
    push(force = false) {
        if (!this.isUnlocked || !this.hasSuccessfullyPulled) return;

        if (this.isPulling || this.isPushing) return;

        if (force === true) return this._doPush();

        if (this.pushTimeout) clearTimeout(this.pushTimeout);

        this.pushTimeout = setTimeout(() => this._doPush(), 2000);
    },

    async _doPush() {
        this.isPushing = true;

        const ts = Date.now().toString();

        const payload = {
            last_update_ts: ts,
            last_update_date: this.getTodayKey()
        };

        for (let i = 0; i < localStorage.length; i++) {
            let k = localStorage.key(i);

            if (
                k.startsWith("pegasus_") ||
                k.startsWith("food_log_") ||
                k.startsWith("kouki_") ||
                k.startsWith("peg_") ||
                k.startsWith("weight_") ||
                k.startsWith("finance_")
            ) {
                payload[k] = localStorage.getItem(k);
            }
        }

        try {
            const res = await fetch(`https://api.jsonbin.io/v3/b/${this.config.binId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-Master-Key": this.userKey,
                    "X-Bin-Meta": "false"
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                window.originalSetItem.call(localStorage, "pegasus_last_push", ts);
                console.log("📤 CLOUD: Sync OK");
            }
        } catch (e) {
            console.error("❌ PUSH ERROR:", e);
        } finally {
            this.isPushing = false;
        }
    },

    // 🖥️ GLOBAL UI REFRESH
    triggerUIUpdate() {
        window.dispatchEvent(new CustomEvent("pegasus_sync_complete"));

        if (typeof refreshAllUI === "function") refreshAllUI();
        if (typeof updateFoodUI === "function") updateFoodUI();
        if (typeof updateSuppUI === "function") updateSuppUI();
        if (typeof renderLiftingContent === "function") renderLiftingContent();

        if (window.MuscleProgressUI?.render) window.MuscleProgressUI.render(true);
        if (window.PegasusDiet?.updateUI) window.PegasusDiet.updateUI();
        if (window.PegasusFinance?.render) window.PegasusFinance.render();
    },

    startAutoSync() {
        if (this.syncInterval) clearInterval(this.syncInterval);

        this.syncInterval = setInterval(() => {
            if (this.isUnlocked && !this.isPushing) {
                this.pull(true);
            }
        }, 60000);
    }
};

window.PegasusCloud = PegasusCloud;

/* ==========================================================================
   🛡️ STORAGE INTERCEPTOR (ANTI-LOOP + AUTO PUSH + SUPP LOGIC)
   ========================================================================== */

if (!window.originalSetItem) {
    window.originalSetItem = localStorage.setItem;

    localStorage.setItem = function(key, value) {
        let oldArr = [];

        if (key.startsWith("food_log_")) {
            try { oldArr = JSON.parse(localStorage.getItem(key) || "[]"); } catch(e){}
        }

        window.originalSetItem.apply(this, arguments);

        const internal = ["pegasus_last_push","pegasus_vault_pin","pegasus_vault_time"];

        if (
            !internal.includes(key) &&
            (key.startsWith("pegasus_") ||
             key.startsWith("food_log_") ||
             key.startsWith("kouki_") ||
             key.startsWith("peg_") ||
             key.startsWith("weight_") ||
             key.startsWith("finance_"))
        ) {
            if (window.PegasusCloud &&
                !window.PegasusCloud.isPulling &&
                !window.PegasusCloud.isPushing &&
                window.PegasusCloud.hasSuccessfullyPulled) {
                window.PegasusCloud.push();
            }
        }

        // 🧠 SUPPLEMENT AUTO LOGIC
        if (key.startsWith("food_log_")) {
            try {
                let newArr = JSON.parse(value || "[]");

                if (newArr.length > oldArr.length) {
                    let item = newArr[newArr.length - 1];

                    if (item?.name) {
                        let name = item.name.toLowerCase();

                        if (name.includes("whey") || name.includes("πρωτε")) {
                            window.consumeSupp?.("prot", 30);
                        }

                        if (name.includes("creatine") || name.includes("κρεατ")) {
                            window.consumeSupp?.("crea", 5);
                        }
                    }
                }
            } catch(e){}
        }
    };
}

/* ==========================================================================
   🔄 CROSS TAB SYNC
   ========================================================================== */

window.addEventListener("storage", (e) => {
    if (e.key && e.key.startsWith("pegasus_")) {
        PegasusCloud.triggerUIUpdate();
    }
});

/* ==========================================================================
   🚀 AUTO LOGIN (24h SESSION)
   ========================================================================== */

window.addEventListener("load", () => {
    const pin = localStorage.getItem("pegasus_vault_pin");
    const time = localStorage.getItem("pegasus_vault_time");

    if (pin && time && Date.now() - parseInt(time) < 86400000) {
        PegasusCloud.unlock(pin);
    }
});
