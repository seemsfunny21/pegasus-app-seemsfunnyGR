/* ==========================================================================
   PEGASUS CLOUD VAULT - UNIVERSAL CORE (v20.0 STATUS RELEASE PATCH)
   STATUS: PRODUCTION SAFE | HYBRID EVENT READY | NO LOOP BUGS | STABLE
   FIXES: PULL RELEASE BEFORE ONLINE STATUS + SAFE UI UPDATE + CLEAN STATUS FLOW
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

    getAllowedStoragePrefixes() {
        return ["pegasus_", "food_log_", "kouki_", "peg_", "weight_", "finance_"];
    },

    isAllowedStorageKey(key) {
        if (!key) return false;
        return this.getAllowedStoragePrefixes().some(prefix => key.startsWith(prefix));
    },

    emitSyncStatus(status, force = false) {
        if (typeof window === "undefined") return;
        if (!status) return;

        if (!force && this.lastStatus === status) return;
        this.lastStatus = status;

        window.dispatchEvent(new CustomEvent("pegasus_sync_status", {
            detail: { status }
        }));
    },

    safeSetLocal(key, value) {
        if (window.originalSetItem) {
            window.originalSetItem.call(localStorage, key, value);
        } else {
            localStorage.setItem(key, value);
        }
    },

    safeCall(fn) {
        try {
            if (typeof fn === "function") fn();
        } catch (e) {
            console.warn("⚠️ UI SAFE CALL ERROR:", e);
        }
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

        this.safeSetLocal("pegasus_vault_pin", clean);
        this.safeSetLocal("pegasus_vault_time", Date.now().toString());

        console.log("🔓 CLOUD: Unlocked");
        this.emitSyncStatus(navigator.onLine ? "syncing" : "offline", true);

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
            this.emitSyncStatus("offline", true);
            return false;
        }

        this.isPulling = true;
        this.emitSyncStatus("syncing", true);

        let changed = false;
        let finalStatus = "online";

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
                return false;
            }

            if (cloud.last_update_ts.toString() === lastLocal) {
                this.hasSuccessfullyPulled = true;
                return false;
            }

            console.log("☁️ CLOUD: Syncing latest version...");
            changed = true;

            const keys = Object.keys(cloud);
            for (let i = 0; i < keys.length; i++) {
                const k = keys[i];

                if (this.isAllowedStorageKey(k)) {
                    const val = typeof cloud[k] === "string"
                        ? cloud[k]
                        : JSON.stringify(cloud[k]);

                    this.safeSetLocal(k, val);
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

            this.safeSetLocal("pegasus_last_push", cloud.last_update_ts.toString());
            this.hasSuccessfullyPulled = true;

            if (!silent) {
                console.log("📥 CLOUD: Pull OK");
            }

            return true;

        } catch (e) {
            console.error("❌ PULL ERROR:", e);
            finalStatus = navigator.onLine ? "error" : "offline";
            return false;

        } finally {
            this.isPulling = false;

            if (changed) {
                setTimeout(() => {
                    this.triggerUIUpdate();
                }, 0);
            }

            this.emitSyncStatus(finalStatus, true);
        }
    },

    /* =========================
       📤 PUSH (EVENT READY)
    ========================= */
    push(force = false) {
        if (!this.isUnlocked || !this.hasSuccessfullyPulled) return;
        if (this.isPulling || this.isPushing) return;

        if (!navigator.onLine) {
            this.emitSyncStatus("offline", true);
            return;
        }

        if (force) {
            return this._doPush();
        }

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
            this.emitSyncStatus("offline", true);
            return false;
        }

        this.isPushing = true;
        this.emitSyncStatus("syncing", true);

        let finalStatus = "online";

        try {
            const ts = Date.now().toString();

            if (this.lastPushTs === ts) {
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
                if (this.isAllowedStorageKey(k)) {
                    payload[k] = localStorage.getItem(k);
                }
            }

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

            this.safeSetLocal("pegasus_last_push", ts);
            console.log("📤 CLOUD: Sync OK");
            return true;

        } catch (e) {
            console.error("❌ PUSH ERROR:", e);
            finalStatus = navigator.onLine ? "error" : "offline";
            return false;

        } finally {
            this.isPushing = false;
            this.emitSyncStatus(finalStatus, true);
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

        try {
            window.dispatchEvent(new CustomEvent("pegasus_sync_complete"));
        } catch (e) {
            console.warn("⚠️ SYNC COMPLETE EVENT ERROR:", e);
        }

        this.safeCall(() => {
            if (typeof refreshAllUI === "function") refreshAllUI();
        });

        this.safeCall(() => {
            if (typeof updateFoodUI === "function") updateFoodUI();
        });

        this.safeCall(() => {
            if (typeof renderFood === "function") renderFood();
        });

        this.safeCall(() => {
            if (typeof updateSuppUI === "function") updateSuppUI();
        });

        this.safeCall(() => {
            if (typeof renderLiftingContent === "function") renderLiftingContent();
        });

        this.safeCall(() => {
            if (typeof updateKcalUI === "function") updateKcalUI();
        });

        this.safeCall(() => {
            if (typeof renderCalendar === "function") renderCalendar();
        });

        this.safeCall(() => {
            if (window.MuscleProgressUI?.render) window.MuscleProgressUI.render(true);
        });

        this.safeCall(() => {
            if (window.PegasusDiet?.updateUI) window.PegasusDiet.updateUI();
        });

        this.safeCall(() => {
            if (window.PegasusFinance?.render) window.PegasusFinance.render();
        });

        setTimeout(() => {
            this.safeCall(() => {
                if (typeof updateKcalUI === "function") updateKcalUI();
            });
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
                this.emitSyncStatus("offline", true);
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
        if (!window.PegasusCloud.isAllowedStorageKey(key)) return;

        const internal = [
            "pegasus_last_push",
            "pegasus_vault_pin",
            "pegasus_vault_time"
        ];

        if (!internal.includes(key)) {
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

    if (PegasusCloud.isAllowedStorageKey(e.key)) {
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
    if (window.PegasusCloud?.isUnlocked) {
        window.PegasusCloud.pull(true);
    }
});

window.addEventListener("offline", () => {
    PegasusCloud.emitSyncStatus("offline", true);
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
        }
    }
});

window.PegasusCloud = PegasusCloud;
