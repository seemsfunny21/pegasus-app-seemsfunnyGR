/* ==========================================================================
   PEGASUS SYNC EDGE HARDENING
   Cross-tab lease coordination, silent-trigger dedupe, and reconnect guards
   for safer sync behavior in multi-tab and fresh-session scenarios.
   ========================================================================== */

(function () {
    function installSyncEdgeHardening() {
        const cloud = window.PegasusCloud;
        if (!cloud || cloud.__syncEdgeHardeningInstalled) return;

        const STORAGE_KEY = "pegasus_sync_edge_lease_v1";
        const TAB_ID = `tab_${Math.random().toString(36).slice(2)}_${Date.now()}`;
        const LEASE_TTL_MS = 9000;
        const LEASE_REFRESH_MS = 2000;
        const SILENT_SYNC_DEDUPE_MS = 1400;
        const PUSH_DEDUPE_MS = 500;
        const RETRY_JITTER_MS = 160;

        const state = {
            tabId: TAB_ID,
            installedAt: new Date().toISOString(),
            activeLeaseAction: null,
            leaseRefreshTimer: null,
            deferredSyncTimer: null,
            deferredPushTimer: null,
            lastSilentSyncAt: 0,
            lastPushRequestAt: 0,
            lastLeaseAt: 0,
            recentNotes: [],
            counters: {
                leaseAcquired: 0,
                leaseReleased: 0,
                leaseBlockedSync: 0,
                leaseBlockedPush: 0,
                silentSyncDeduped: 0,
                pushDeduped: 0,
                deferredSyncScheduled: 0,
                deferredPushScheduled: 0,
                onlineResyncQueued: 0,
                foreignLeaseObserved: 0
            }
        };

        const originalSyncNow = cloud.syncNow.bind(cloud);
        const originalDoPush = cloud._doPush.bind(cloud);
        const originalRestoreApprovedDevice = cloud.restoreApprovedDevice.bind(cloud);
        const originalPush = cloud.push.bind(cloud);

        function now() {
            return Date.now();
        }

        function isOnline() {
            return typeof navigator === "undefined" ? true : !!navigator.onLine;
        }

        function addNote(type, extra) {
            state.recentNotes.push({ type, at: new Date().toISOString(), extra: extra || null });
            if (state.recentNotes.length > 30) {
                state.recentNotes = state.recentNotes.slice(-30);
            }
        }

        function trace(action, status, extra) {
            try {
                window.PegasusRuntimeMonitor?.trace?.("syncEdgeHardening", action, status, extra);
            } catch (_) {}
        }

        function capture(action, error, extra) {
            try {
                window.PegasusRuntimeMonitor?.capture?.("syncEdgeHardening", action, error, extra);
            } catch (_) {}
        }

        function safeParseLease(raw) {
            if (!raw) return null;
            try {
                const parsed = JSON.parse(raw);
                if (!parsed || typeof parsed !== "object") return null;
                return parsed;
            } catch (_) {
                return null;
            }
        }

        function readLease() {
            return safeParseLease(localStorage.getItem(STORAGE_KEY));
        }

        function isLeaseValid(lease) {
            return !!lease && Number.isFinite(Number(lease.expiresAt)) && Number(lease.expiresAt) > now();
        }

        function isOwnLease(lease) {
            return !!lease && lease.owner === TAB_ID;
        }

        function clearLeaseIfOwned(reason) {
            const lease = readLease();
            if (!isOwnLease(lease)) return false;
            localStorage.removeItem(STORAGE_KEY);
            state.activeLeaseAction = null;
            state.lastLeaseAt = now();
            if (state.leaseRefreshTimer) {
                clearInterval(state.leaseRefreshTimer);
                state.leaseRefreshTimer = null;
            }
            state.counters.leaseReleased += 1;
            addNote("lease_released", { reason, action: lease?.action || null });
            trace("lease", "RELEASED", { reason, action: lease?.action || null });
            return true;
        }

        function writeLease(action) {
            const lease = {
                owner: TAB_ID,
                action,
                createdAt: now(),
                updatedAt: now(),
                expiresAt: now() + LEASE_TTL_MS,
                hidden: !!document.hidden
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(lease));
            return lease;
        }

        function acquireLease(action) {
            const existing = readLease();
            if (isLeaseValid(existing) && !isOwnLease(existing)) {
                state.counters.foreignLeaseObserved += 1;
                return { ok: false, lease: existing };
            }

            const written = writeLease(action);
            const confirmed = readLease();
            if (isOwnLease(confirmed)) {
                state.activeLeaseAction = action;
                state.lastLeaseAt = now();
                state.counters.leaseAcquired += 1;
                if (state.leaseRefreshTimer) clearInterval(state.leaseRefreshTimer);
                state.leaseRefreshTimer = setInterval(() => {
                    const latest = readLease();
                    if (!isOwnLease(latest)) {
                        clearInterval(state.leaseRefreshTimer);
                        state.leaseRefreshTimer = null;
                        return;
                    }
                    try {
                        writeLease(state.activeLeaseAction || action);
                    } catch (_) {}
                }, LEASE_REFRESH_MS);
                addNote("lease_acquired", { action });
                trace("lease", "ACQUIRED", { action });
                return { ok: true, lease: confirmed || written };
            }

            return { ok: false, lease: confirmed || written };
        }

        function computeRetryDelay(lease) {
            if (!lease || !Number.isFinite(Number(lease.expiresAt))) return 1200;
            return Math.max(350, Math.min(2400, Number(lease.expiresAt) - now() + RETRY_JITTER_MS));
        }

        function scheduleDeferredSync(reason, delay) {
            if (state.deferredSyncTimer) clearTimeout(state.deferredSyncTimer);
            state.counters.deferredSyncScheduled += 1;
            addNote("deferred_sync_scheduled", { reason, delay });
            state.deferredSyncTimer = setTimeout(() => {
                state.deferredSyncTimer = null;
                if (!cloud.isUnlocked || !isOnline()) return;
                cloud.syncNow(true).catch?.(() => {});
            }, delay);
        }

        function scheduleDeferredPush(reason, delay, force) {
            if (state.deferredPushTimer) clearTimeout(state.deferredPushTimer);
            state.counters.deferredPushScheduled += 1;
            addNote("deferred_push_scheduled", { reason, delay, force: !!force });
            state.deferredPushTimer = setTimeout(() => {
                state.deferredPushTimer = null;
                if (!cloud.isUnlocked || !isOnline()) return;
                cloud.push(!!force);
            }, delay);
        }

        function observeForeignLease(action, lease, kind) {
            const delay = computeRetryDelay(lease);
            addNote("foreign_lease_observed", {
                action,
                kind,
                leaseOwner: lease?.owner || null,
                leaseAction: lease?.action || null,
                retryDelay: delay
            });
            trace(action, "LEASE_BLOCKED", {
                kind,
                leaseOwner: lease?.owner || null,
                leaseAction: lease?.action || null,
                retryDelay: delay
            });
            return delay;
        }

        cloud.restoreApprovedDevice = async function patchedRestoreApprovedDevice(options = {}) {
            const leaseAttempt = acquireLease("restoreApprovedDevice");
            if (!leaseAttempt.ok) {
                const delay = observeForeignLease("restoreApprovedDevice", leaseAttempt.lease, "restore");
                state.counters.leaseBlockedSync += 1;
                scheduleDeferredSync("restore_foreign_lease", delay);
                return false;
            }

            try {
                return await originalRestoreApprovedDevice(options);
            } catch (error) {
                capture("restoreApprovedDevice", error, options);
                throw error;
            } finally {
                clearLeaseIfOwned("restoreApprovedDevice:done");
            }
        };

        cloud.syncNow = async function patchedSyncNow(silent = false) {
            const ts = now();
            if (silent && (ts - state.lastSilentSyncAt) < SILENT_SYNC_DEDUPE_MS && !cloud.hasPendingChanges?.()) {
                state.counters.silentSyncDeduped += 1;
                addNote("silent_sync_deduped", { deltaMs: ts - state.lastSilentSyncAt });
                trace("syncNow", "DEDUPED", { silent: true, deltaMs: ts - state.lastSilentSyncAt });
                return false;
            }
            if (silent) state.lastSilentSyncAt = ts;

            const leaseAttempt = acquireLease("syncNow");
            if (!leaseAttempt.ok) {
                state.counters.leaseBlockedSync += 1;
                const delay = observeForeignLease("syncNow", leaseAttempt.lease, "sync");
                scheduleDeferredSync("sync_foreign_lease", delay);
                return false;
            }

            try {
                return await originalSyncNow(silent);
            } catch (error) {
                capture("syncNow", error, { silent: !!silent });
                throw error;
            } finally {
                clearLeaseIfOwned("syncNow:done");
            }
        };

        cloud.push = function patchedPush(force = false) {
            const ts = now();
            if (!force && (ts - state.lastPushRequestAt) < PUSH_DEDUPE_MS) {
                state.counters.pushDeduped += 1;
                addNote("push_deduped", { deltaMs: ts - state.lastPushRequestAt });
                trace("push", "DEDUPED", { force: false, deltaMs: ts - state.lastPushRequestAt });
                return false;
            }
            state.lastPushRequestAt = ts;

            const activeForeignLease = readLease();
            if (isLeaseValid(activeForeignLease) && !isOwnLease(activeForeignLease)) {
                state.counters.leaseBlockedPush += 1;
                const delay = observeForeignLease("push", activeForeignLease, "push");
                scheduleDeferredPush("push_foreign_lease", delay, force);
                return false;
            }

            return originalPush(force);
        };

        cloud._doPush = async function patchedDoPush() {
            const leaseAttempt = acquireLease("_doPush");
            if (!leaseAttempt.ok) {
                state.counters.leaseBlockedPush += 1;
                const delay = observeForeignLease("_doPush", leaseAttempt.lease, "push");
                scheduleDeferredPush("doPush_foreign_lease", delay, true);
                return false;
            }

            try {
                return await originalDoPush();
            } catch (error) {
                capture("_doPush", error);
                throw error;
            } finally {
                clearLeaseIfOwned("_doPush:done");
            }
        };

        function scheduleOnlineRecovery(reason) {
            if (!cloud.isUnlocked || !isOnline()) return;
            state.counters.onlineResyncQueued += 1;
            addNote("online_recovery_scheduled", { reason });
            setTimeout(() => {
                if (!cloud.isUnlocked || !isOnline()) return;
                cloud.syncNow(true).catch?.(() => {});
            }, 220);
        }

        window.PegasusSyncEdgeHardening = {
            getState() {
                return {
                    tabId: TAB_ID,
                    installedAt: state.installedAt,
                    activeLeaseAction: state.activeLeaseAction,
                    hasDeferredSync: !!state.deferredSyncTimer,
                    hasDeferredPush: !!state.deferredPushTimer,
                    latestLease: readLease(),
                    counters: { ...state.counters },
                    recentNotes: state.recentNotes.slice(-12)
                };
            },
            summary() {
                const snapshot = this.getState();
                console.log("🛡️ PEGASUS SYNC EDGE HARDENING", snapshot);
                return snapshot;
            },
            getRecentNotes() {
                return state.recentNotes.slice();
            },
            releaseLease(reason = "manual_release") {
                return clearLeaseIfOwned(reason);
            }
        };

        window.addEventListener("storage", (e) => {
            if (e.key !== STORAGE_KEY || !e.newValue) return;
            const lease = safeParseLease(e.newValue);
            if (isLeaseValid(lease) && !isOwnLease(lease)) {
                addNote("storage_foreign_lease", { owner: lease.owner, action: lease.action || null });
            }
        });

        window.addEventListener("online", () => {
            scheduleOnlineRecovery("browser_online");
        });

        window.addEventListener("pagehide", () => {
            clearLeaseIfOwned("pagehide");
        });

        window.addEventListener("beforeunload", () => {
            clearLeaseIfOwned("beforeunload");
        });

        document.addEventListener("visibilitychange", () => {
            if (!document.hidden && cloud.isUnlocked && isOnline()) {
                scheduleOnlineRecovery("visibility_recovered");
            }
        });

        setInterval(() => {
            const lease = readLease();
            if (!isOwnLease(lease) && state.leaseRefreshTimer) {
                clearInterval(state.leaseRefreshTimer);
                state.leaseRefreshTimer = null;
                state.activeLeaseAction = null;
            }
            if (isOwnLease(lease) && !cloud.isPulling && !cloud.isPushing && !window.PegasusSyncHardening?.getState?.().flags?.restoreInFlight) {
                clearLeaseIfOwned("watchdog_idle_cleanup");
            }
        }, 4500);

        cloud.__syncEdgeHardeningInstalled = true;
        cloud.__syncEdgeHardeningState = state;
        addNote("installed", { tabId: TAB_ID });
        console.log("🧷 PEGASUS SYNC EDGE HARDENING: Active");
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", installSyncEdgeHardening, { once: true });
    } else {
        installSyncEdgeHardening();
    }
})();
