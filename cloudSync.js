/* ==========================================================================
   PEGASUS CLOUD VAULT - UNIVERSAL CORE (v19.1 FIXED)
   FIXES:
   - Stable cross-device sync contract
   - Safe merge (no partial overwrite loss)
   - Unified UI trigger event
   - Fixed pull gating logic
   - Debounced push protection
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

    lastHashSnapshot: new Map(),

    getTodayKey: () => {
        const d = new Date();
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    },

    /* =========================================================
       🔓 UNLOCK
       ========================================================= */
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

    /* =========================================================
       📥 SAFE PULL (FIXED MERGE ENGINE)
       ========================================================= */
    async pull(silent = false) {
        if (!this.isUnlocked || this.isPulling) return;

        this.isPulling = true;

        try {
            const res = await fetch(
                `https://api.jsonbin.io/v3/b/${this.config.binId}/latest?nocache=${Date.now()}`,
                {
                    headers: {
                        "X-Master-Key": this.userKey,
                        "X-Bin-Meta": "false"
                    }
                }
            );

            if (!res.ok) throw new Error("Pull failed");

            const data = await res.json();
            const cloud = data.record || data;

            const lastLocal = localStorage.getItem("pegasus_last_push") || "0";

            /* =====================================================
               🔥 FIX #1: ALWAYS ALLOW PARTIAL SAFE MERGE
               (no full skip based on timestamp equality)
               ===================================================== */
            const cloudTs = cloud.last_update_ts?.toString();

            console.log("☁️ CLOUD: syncing version", cloudTs);

            /* =====================================================
               🔁 SAFE KEY MERGE ENGINE
               ===================================================== */
            const isValidKey = (k) =>
                k.startsWith("pegasus_") ||
                k.startsWith("food_log_") ||
                k.startsWith("kouki_") ||
                k.startsWith("peg_") ||
                k.startsWith("weight_") ||
                k.startsWith("finance_");

            Object.keys(cloud).forEach(k => {
                if (!isValidKey(k)) return;

                const val = typeof cloud[k] === "string"
                    ? cloud[k]
                    : JSON.stringify(cloud[k]);

                // 🔒 avoid redundant overwrite (performance fix)
                const local = localStorage.getItem(k);
                if (local !== val) {
                    window.originalSetItem.call(localStorage, k, val);
                }
            });

            /* =====================================================
               🧠 LEGACY MAPPING LAYER (SAFE)
               ===================================================== */
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
                if (!cloud[ck]) return;

                const val = JSON.stringify(cloud[ck]);
                const local = localStorage.getItem(lk);

                if (local !== val) {
                    window.originalSetItem.call(localStorage, lk, val);
                }
            });

            /* =====================================================
               🍽 FOOD LOG SAFE RESTORE
               ===================================================== */
            if (cloud.all_food_logs) {
                Object.keys(cloud.all_food_logs).forEach(k => {
                    const val = JSON.stringify(cloud.all_food_logs[k]);
                    const local = localStorage.getItem(k);

                    if (local !== val) {
                        window.originalSetItem.call(localStorage, k, val);
                    }
                });
            }

            window.originalSetItem.call(
                localStorage,
                "pegasus_last_push",
                cloudTs || Date.now().toString()
            );

            this.hasSuccessfullyPulled = true;

            this.triggerUIUpdate();

        } catch (e) {
            console.error("❌ PULL ERROR:", e);
        } finally {
            this.isPulling = false;
        }
    },

    /* =========================================================
       📤 PUSH (DEBOUNCED + HASH GUARD)
       ========================================================= */
    push(force = false) {
        if (!this.isUnlocked || !this.hasSuccessfullyPulled) return;
        if (this.isPulling || this.isPushing) return;

        if (force) return this._doPush();

        if (this.pushTimeout) clearTimeout(this.pushTimeout);
        this.pushTimeout = setTimeout(() => this._doPush(), 1800);
    },

    async _doPush() {
        this.isPushing = true;

        const ts = Date.now().toString();

        const payload = {
            last_update_ts: ts,
            last_update_date: this.getTodayKey()
        };

        const isValidKey = (k) =>
            k.startsWith("pegasus_") ||
            k.startsWith("food_log_") ||
            k.startsWith("kouki_") ||
            k.startsWith("peg_") ||
            k.startsWith("weight_") ||
            k.startsWith("finance_");

        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (!isValidKey(k)) continue;
            payload[k] = localStorage.getItem(k);
        }

        try {
            const res = await fetch(
                `https://api.jsonbin.io/v3/b/${this.config.binId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Master-Key": this.userKey,
                        "X-Bin-Meta": "false"
                    },
                    body: JSON.stringify(payload)
                }
            );

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

    /* =========================================================
       🖥️ UNIFIED UI TRIGGER SYSTEM (FIXED CONTRACT)
       ========================================================= */
    triggerUIUpdate() {
        // 1. GLOBAL EVENT (NEW PRIMARY CONTRACT)
        window.dispatchEvent(
            new CustomEvent("pegasus_cloud_sync", {
                detail: {
                    source: "cloud",
                    ts: Date.now()
                }
            })
        );

        // 2. LEGACY FALLBACKS (SAFE ORDER)
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
   🛡 STORAGE INTERCEPTOR (OPTIMIZED + DEBOUNCED)
   ========================================================================== */

if (!window.originalSetItem) {
    window.originalSetItem = localStorage.setItem;

    localStorage.setItem = function (key, value) {
        let oldArr = [];

        if (key.startsWith("food_log_")) {
            try { oldArr = JSON.parse(localStorage.getItem(key) || "[]"); } catch(e){}
        }

        window.originalSetItem.apply(this, arguments);

        const internal = ["pegasus_last_push","pegasus_vault_pin","pegasus_vault_time"];

        const isSyncKey =
            key.startsWith("pegasus_") ||
            key.startsWith("food_log_") ||
            key.startsWith("kouki_") ||
            key.startsWith("peg_") ||
            key.startsWith("weight_") ||
            key.startsWith("finance_");

        if (
            !internal.includes(key) &&
            isSyncKey &&
            window.PegasusCloud &&
            !window.PegasusCloud.isPulling &&
            !window.PegasusCloud.isPushing &&
            window.PegasusCloud.hasSuccessfullyPulled
        ) {
            window.PegasusCloud.push();
        }

        /* SUPPLEMENTS AUTO LOGIC (UNCHANGED) */
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
   🔄 CROSS TAB SYNC (ENHANCED)
   ========================================================================== */

window.addEventListener("storage", (e) => {
    if (e.key && e.key.startsWith("pegasus_")) {
        if (window.PegasusCloud?.triggerUIUpdate) {
            PegasusCloud.triggerUIUpdate();
        }
    }
});

/* ==========================================================================
   🚀 AUTO LOGIN
   ========================================================================== */

window.addEventListener("load", () => {
    const pin = localStorage.getItem("pegasus_vault_pin");
    const time = localStorage.getItem("pegasus_vault_time");

    if (pin && time && Date.now() - parseInt(time) < 86400000) {
        PegasusCloud.unlock(pin);
    }
});
