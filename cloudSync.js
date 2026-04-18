/* ==========================================================================
   PEGASUS CLOUD VAULT - UNIVERSAL CORE (v19.3 HYBRID ENGINE BRIDGE)
   STATUS: PRODUCTION SAFE | HYBRID EVENT READY | NO LOOP BUGS | STABLE
   ========================================================================== */

const PegasusCloud = {
    config: {
        binId: "69b6757ab7ec241ddc6d7230",
        encryptedPart: "$2a$10$oU/TyQjSeNEVr/k5dnFS8ulKZkbb9gUWd5xuXijAYFCBijuXrYAFC",
        syncThrottle: 2000,
        pullInterval: 60000
    },

    isUnlocked: false,
    hasSuccessfullyPulled: false,
    isPulling: false,
    isPushing: false,

    userKey: "",
    syncInterval: null,
    pushTimeout: null,
    lastPushTs: null,

    // 🧠 ENGINE BRIDGE (NEW)
    engine: null,

    attachEngine(engineInstance) {
        this.engine = engineInstance;
        console.log("🧠 CLOUD: Engine attached");
    },

    getTodayKey: () => {
        const d = new Date();
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    },

    /* =========================
       🔓 UNLOCK
    ========================= */
    unlock(pin) {
        if (!pin) return false;
        if (this.isUnlocked) return true;

        const clean = pin.trim();

        try {
            if (btoa(clean) !== "MjM3NQ==") return false;
        } catch (e) {
            return false;
        }

        this.userKey = this.config.encryptedPart;
        this.isUnlocked = true;

        localStorage.setItem("pegasus_vault_pin", clean);
        localStorage.setItem("pegasus_vault_time", Date.now().toString());

        console.log("🔓 CLOUD: Unlocked");

        setTimeout(() => {
            this.pull(true);
            this.startAutoSync();
        }, 50);

        return true;
    },

    /* =========================
       📥 PULL (HYBRID SAFE)
    ========================= */
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

            if (!cloud.last_update_ts) {
                this.hasSuccessfullyPulled = true;
                this.isPulling = false;
                return;
            }

            if (cloud.last_update_ts.toString() === lastLocal) {
                this.hasSuccessfullyPulled = true;
                this.isPulling = false;
                return;
            }

            console.log("☁️ CLOUD: Syncing latest version...");

            const keys = Object.keys(cloud);
            for (let i = 0; i < keys.length; i++) {
                const k = keys[i];

                if (
                    k.startsWith("pegasus_") ||
                    k.startsWith("food_log_") ||
                    k.startsWith("kouki_") ||
                    k.startsWith("peg_") ||
                    k.startsWith("weight_") ||
                    k.startsWith("finance_")
                ) {
                    const val = typeof cloud[k] === "string"
                        ? cloud[k]
                        : JSON.stringify(cloud[k]);

                    window.originalSetItem.call(localStorage, k, val);
                }
            }

            // 🧠 HYBRID ENGINE BRIDGE (NEW SAFE LAYER)
            if (this.engine && cloud.__events__) {
                try {
                    const events = cloud.__events__;

                    for (const event of events) {
                        this.engine.dispatch(event);
                    }

                } catch (e) {
                    console.warn("⚠️ ENGINE BRIDGE ERROR:", e);
                }
            }

            window.originalSetItem.call(
                localStorage,
                "pegasus_last_push",
                cloud.last_update_ts.toString()
            );

            this.hasSuccessfullyPulled = true;
            this.triggerUIUpdate();

        } catch (e) {
            console.error("❌ PULL ERROR:", e);
        } finally {
            this.isPulling = false;
        }
    },

    /* =========================
       📤 PUSH (EVENT READY)
    ========================= */
    push(force = false) {
        if (!this.isUnlocked || !this.hasSuccessfullyPulled) return;
        if (this.isPulling || this.isPushing) return;

        if (force) return this._doPush();

        if (this.pushTimeout) clearTimeout(this.pushTimeout);

        this.pushTimeout = setTimeout(() => {
            if (this.isUnlocked && this.hasSuccessfullyPulled) {
                this._doPush();
            }
        }, this.config.syncThrottle);
    },

    async _doPush() {
        this.isPushing = true;

        const ts = Date.now().toString();

        if (this.lastPushTs === ts) {
            this.isPushing = false;
            return;
        }

        this.lastPushTs = ts;

        const payload = {
            last_update_ts: ts,
            last_update_date: this.getTodayKey(),

            // 🧠 EVENT STREAM (NEW)
            __events__: this.engine?.getEventBuffer?.() || []
        };

        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);

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
                window.originalSetItem.call(
                    localStorage,
                    "pegasus_last_push",
                    ts
                );

                console.log("📤 CLOUD: Sync OK");
            }

        } catch (e) {
            console.error("❌ PUSH ERROR:", e);
        } finally {
            this.isPushing = false;
        }
    },

    /* =========================
       🖥️ UI UPDATE
    ========================= */
    triggerUIUpdate() {
        if (typeof window === "undefined") return;

        window.dispatchEvent(
            new CustomEvent("pegasus_sync_complete")
        );

        if (typeof refreshAllUI === "function") refreshAllUI();
        if (typeof updateFoodUI === "function") updateFoodUI();
        if (typeof updateSuppUI === "function") updateSuppUI();
        if (typeof renderLiftingContent === "function") renderLiftingContent();

        if (window.MuscleProgressUI?.render)
            window.MuscleProgressUI.render(true);

        if (window.PegasusDiet?.updateUI)
            window.PegasusDiet.updateUI();

        if (window.PegasusFinance?.render)
            window.PegasusFinance.render();
    },

    /* =========================
       🔁 AUTO SYNC
    ========================= */
    startAutoSync() {
        if (this.syncInterval) clearInterval(this.syncInterval);

        this.syncInterval = setInterval(() => {
            if (!this.isUnlocked) return;
            if (this.isPulling || this.isPushing) return;

            this.pull(true);
        }, this.config.pullInterval);
    }
};

/* =========================
   STORAGE INTERCEPTOR
========================= */

if (!window.originalSetItem) {
    window.originalSetItem = localStorage.setItem;

    localStorage.setItem = function(key, value) {

        window.originalSetItem.apply(this, arguments);

        if (!window.PegasusCloud?.isUnlocked) return;

        const allowed =
            key.startsWith("pegasus_") ||
            key.startsWith("food_log_") ||
            key.startsWith("kouki_") ||
            key.startsWith("peg_") ||
            key.startsWith("weight_") ||
            key.startsWith("finance_");

        const internal = [
            "pegasus_last_push",
            "pegasus_vault_pin",
            "pegasus_vault_time"
        ];

        if (!internal.includes(key) && allowed) {
            queueMicrotask(() => {
                window.PegasusCloud.push();
            });
        }
    };
}

/* =========================
   CROSS TAB SYNC
========================= */

window.addEventListener("storage", (e) => {
    if (!e.key) return;

    if (
        e.key.startsWith("pegasus_") ||
        e.key.startsWith("food_log_") ||
        e.key.startsWith("weight_")
    ) {
        PegasusCloud.triggerUIUpdate();
    }
});

/* =========================
   AUTO LOGIN
========================= */

window.addEventListener("load", () => {
    const pin = localStorage.getItem("pegasus_vault_pin");
    const time = localStorage.getItem("pegasus_vault_time");

    if (pin && time) {
        const age = Date.now() - parseInt(time);

        if (age < 86400000) {
            PegasusCloud.unlock(pin);
        }
    }
});

window.PegasusCloud = PegasusCloud;
