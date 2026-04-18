/* ==========================================================================
   PEGASUS CLOUD VAULT - UNIVERSAL CORE (v19.7 STATUS COLOR HARDENED)
   STATUS: PRODUCTION SAFE | HYBRID EVENT READY | NO LOOP BUGS | STABLE
   FIXES: SAFE UI REFRESH + SYNC STATUS EVENTS + ONLINE/OFFLINE/ERROR COLOR FLOW
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
    lastUiRefreshTs: 0,
    lastStatus: null,

    engine: null,

    attachEngine(engineInstance) {
        if (!engineInstance) return;
        this.engine = engineInstance;
        console.log("🧠 CLOUD: Engine attached");
    },

    getTodayKey() {
        const d = new Date();
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    },

    emitSyncStatus(status) {
        if (typeof window === "undefined") return;
        if (!status) return;

        if (this.lastStatus === status) return;
        this.lastStatus = status;

        window.dispatchEvent(new CustomEvent("pegasus_sync_status", {
            detail: { status: status }
        }));
    },

    /* =========================
       🔓 UNLOCK
    ========================= */
    unlock(pin) {
        if (!pin) return false;
        if (this.isUnlocked) return true;

        const clean = String(pin).trim();

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
        this.emitSyncStatus(navigator.onLine ? "syncing" : "offline");

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
        if (!this.isUnlocked || this.isPulling) return false;

        if (!navigator.onLine) {
            this.emitSyncStatus("offline");
            return false;
        }

        this.isPulling = true;
        this.emitSyncStatus("syncing");

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
                this.emitSyncStatus("online");
                return true;
            }

            if (cloud.last_update_ts.toString() === lastLocal) {
                this.hasSuccessfullyPulled = true;
                this.emitSyncStatus("online");
                return true;
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

            if (this.engine && Array.isArray(cloud.__events__)) {
                try {
                    const existingBuffer = this.engine.getEventBuffer?.() || [];
                    const existingHashes = new Set(existingBuffer.map(ev => JSON.stringify(ev)));

                    for (const event of cloud.__events__) {
                        const eventHash = JSON.stringify(event);
                        if (!existingHashes.has(eventHash)) {
                            this.engine.dispatch(event);
                        }
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

            if (!silent) {
                console.log("📥 CLOUD: Pull OK");
            }

            this.emitSyncStatus("online");
            return true;

        } catch (e) {
            console.error("❌ PULL ERROR:", e);
            this.emitSyncStatus(navigator.onLine ? "error" : "offline");
            return false;
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

        if (!navigator.onLine) {
            this.emitSyncStatus("offline");
            return;
        }

        if (force) return this._doPush();

        if (this.pushTimeout) clearTimeout(this.pushTimeout);

        this.pushTimeout = setTimeout(() => {
            if (
                this.isUnlocked &&
                this.hasSuccessfullyPulled &&
                !this.isPulling &&
                !this.isPushing &&
                navigator.onLine
            ) {
                this._doPush();
            }
        }, this.config.syncThrottle);
    },

    async _doPush() {
        if (!navigator.onLine) {
            this.emitSyncStatus("offline");
            return false;
        }

        this.isPushing = true;
        this.emitSyncStatus("syncing");

        const ts = Date.now().toString();

        if (this.lastPushTs === ts) {
            this.isPushing = false;
            this.emitSyncStatus("online");
            return true;
        }

        this.lastPushTs = ts;

        const payload = {
            last_update_ts: ts,
            last_update_date: this.getTodayKey(),
            __events__: this.engine?.getEventBuffer?.() || []
        };

        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);

            if (
                k &&
                (
                    k.startsWith("pegasus_") ||
                    k.startsWith("food_log_") ||
                    k.startsWith("kouki_") ||
                    k.startsWith("peg_") ||
                    k.startsWith("weight_") ||
                    k.startsWith("finance_")
                )
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

            if (!res.ok) throw new Error("Push failed");

            window.originalSetItem.call(localStorage, "pegasus_last_push", ts);
            console.log("📤 CLOUD: Sync OK");

            this.emitSyncStatus("online");
            return true;

        } catch (e) {
            console.error("❌ PUSH ERROR:", e);
            this.emitSyncStatus(navigator.onLine ? "error" : "offline");
            return false;
        } finally {
            this.isPushing = false;
        }
    },

    /* =========================
       🖥️ UI UPDATE
    ========================= */
    triggerUIUpdate() {
        if (typeof window === "undefined") return;

        const now = Date.now();
        if (now - this.lastUiRefreshTs < 250) return;
        this.lastUiRefreshTs = now;

        window.dispatchEvent(new CustomEvent("pegasus_sync_complete"));

        if (typeof refreshAllUI === "function") refreshAllUI();
        if (typeof updateFoodUI === "function") updateFoodUI();
        if (typeof renderFood === "function") renderFood();
        if (typeof updateSuppUI === "function") updateSuppUI();
        if (typeof renderLiftingContent === "function") renderLiftingContent();
        if (typeof updateKcalUI === "function") updateKcalUI();
        if (typeof renderCalendar === "function") renderCalendar();

        if (window.MuscleProgressUI?.render) window.MuscleProgressUI.render(true);
        if (window.PegasusDiet?.updateUI) window.PegasusDiet.updateUI();
        if (window.PegasusFinance?.render) window.PegasusFinance.render();

        setTimeout(() => {
            if (typeof updateKcalUI === "function") updateKcalUI();
        }, 120);
    },

    /* =========================
       🔁 AUTO SYNC
    ========================= */
    startAutoSync() {
        if (this.syncInterval) clearInterval(this.syncInterval);

        this.syncInterval = setInterval(() => {
            if (!this.isUnlocked) return;
            if (this.isPulling || this.isPushing) return;
            if (document.hidden) return;

            if (!navigator.onLine) {
                this.emitSyncStatus("offline");
                return;
            }

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
        e.key.startsWith("weight_") ||
        e.key.startsWith("kouki_")
    ) {
        PegasusCloud.triggerUIUpdate();
    }
});

/* =========================
   FOCUS / VISIBILITY / NETWORK SYNC
========================= */
window.addEventListener("focus", () => {
    if (window.PegasusCloud?.isUnlocked && navigator.onLine) {
        window.PegasusCloud.pull(true);
    }
});

document.addEventListener("visibilitychange", () => {
    if (!document.hidden && window.PegasusCloud?.isUnlocked && navigator.onLine) {
        window.PegasusCloud.pull(true);
    }
});

window.addEventListener("online", () => {
    PegasusCloud.emitSyncStatus("online");
    if (window.PegasusCloud?.isUnlocked) {
        window.PegasusCloud.pull(true);
    }
});

window.addEventListener("offline", () => {
    PegasusCloud.emitSyncStatus("offline");
});

/* =========================
   AUTO LOGIN
========================= */
window.addEventListener("load", () => {
    if (window.PegasusEngine && !PegasusCloud.engine) {
        PegasusCloud.attachEngine(window.PegasusEngine);
    }

    const pin = localStorage.getItem("pegasus_vault_pin");
    const time = localStorage.getItem("pegasus_vault_time");

    if (pin && time) {
        const age = Date.now() - parseInt(time, 10);

        if (age < 86400000) {
            PegasusCloud.unlock(pin);
        } else {
            PegasusCloud.emitSyncStatus(navigator.onLine ? "online" : "offline");
        }
    } else {
        PegasusCloud.emitSyncStatus(navigator.onLine ? "online" : "offline");
    }
});

window.PegasusCloud = PegasusCloud;
