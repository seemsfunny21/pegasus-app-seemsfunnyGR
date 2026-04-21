/* ==========================================================================
   PEGASUS SYNC HARDENING
   Adds public-entry guards, deferred sync recovery, and richer sync diagnostics
   without changing the visible UI flow.
   ========================================================================== */

(function () {
    function installSyncHardening() {
        const cloud = window.PegasusCloud;
        if (!cloud || cloud.__syncHardeningInstalled) return;

        const state = {
            phase: cloud.isUnlocked ? "online" : "locked",
            lastCoarseStatus: cloud.lastStatus || (cloud.isUnlocked ? "online" : "locked"),
            lastTransitionAt: Date.now(),
            lastReason: "install",
            lastRequestedAction: null,
            restoreInFlight: false,
            deferredPush: false,
            deferredSync: false,
            blockedRequest: null,
            flushTimer: null,
            recentNotes: [],
            counters: {
                blockedPush: 0,
                blockedSync: 0,
                deferredFlush: 0,
                restoreCalls: 0,
                restoreBlockedPush: 0,
                pullDuringPush: 0,
                pushQueued: 0,
                phaseCorrections: 0,
                deferredRetries: 0
            }
        };

        const originalEmitSyncStatus = cloud.emitSyncStatus.bind(cloud);
        const originalPush = cloud.push.bind(cloud);
        const originalDoPush = cloud._doPush.bind(cloud);
        const originalPull = cloud.pull.bind(cloud);
        const originalSyncNow = cloud.syncNow.bind(cloud);
        const originalRestoreApprovedDevice = cloud.restoreApprovedDevice.bind(cloud);

        function isOnline() {
            return typeof navigator === "undefined" ? true : !!navigator.onLine;
        }

        function hasDeferredWork() {
            return !!(state.deferredPush || state.deferredSync);
        }

        function trace(status, extra) {
            try {
                window.PegasusRuntimeMonitor?.trace?.("syncHardening", "state", status, extra);
            } catch (_) {}
        }

        function capture(action, error, extra) {
            try {
                window.PegasusRuntimeMonitor?.capture?.("syncHardening", action, error, extra);
            } catch (_) {}
        }

        function addNote(type, extra) {
            state.recentNotes.push({
                type,
                at: new Date().toISOString(),
                extra: extra || null
            });
            if (state.recentNotes.length > 25) {
                state.recentNotes = state.recentNotes.slice(-25);
            }
        }

        function currentSnapshot() {
            let pendingChanges = false;
            let protectedRepairPending = false;
            try {
                pendingChanges = !!cloud.hasPendingChanges?.();
                protectedRepairPending = !!cloud.hasProtectedRepairPending?.();
            } catch (_) {}

            return {
                phase: state.phase,
                coarseStatus: state.lastCoarseStatus,
                lastTransitionAt: new Date(state.lastTransitionAt).toISOString(),
                lastReason: state.lastReason,
                lastRequestedAction: state.lastRequestedAction,
                flags: {
                    isUnlocked: !!cloud.isUnlocked,
                    isPulling: !!cloud.isPulling,
                    isPushing: !!cloud.isPushing,
                    isApplyingRemote: !!cloud.isApplyingRemote,
                    restoreInFlight: !!state.restoreInFlight,
                    approvedRestoreCompleted: !!cloud.hasApprovedRestoreCompleted,
                    pendingChanges,
                    protectedRepairPending,
                    online: isOnline()
                },
                deferred: {
                    push: !!state.deferredPush,
                    sync: !!state.deferredSync,
                    blockedRequest: state.blockedRequest ? { ...state.blockedRequest } : null
                },
                counters: { ...state.counters },
                recentNotes: state.recentNotes.slice(-10)
            };
        }

        function dispatchStateEvent(source) {
            try {
                window.dispatchEvent(new CustomEvent("pegasus_sync_state", {
                    detail: {
                        source: source || "syncHardening",
                        snapshot: currentSnapshot()
                    }
                }));
            } catch (_) {}
        }

        function setPhase(phase, reason, extra) {
            if (!phase) return;
            state.phase = phase;
            state.lastReason = reason || state.lastReason || "update";
            state.lastTransitionAt = Date.now();
            trace(phase, { reason: state.lastReason, ...(extra || {}) });
            dispatchStateEvent(reason || "syncHardening");
        }

        function derivePhase() {
            if (state.restoreInFlight) return "restoring";
            if (cloud.isPushing) return "pushing";
            if (cloud.isPulling) return "pulling";
            if (!cloud.isUnlocked) return "locked";
            if (!isOnline()) return "offline";
            if (state.lastCoarseStatus === "error") return "error";
            if (hasDeferredWork()) return "recovering";
            if (state.lastCoarseStatus === "syncing") return "syncing";
            return "online";
        }

        function syncDerivedPhase(reason, extra) {
            const nextPhase = derivePhase();
            if (state.phase !== nextPhase) {
                state.counters.phaseCorrections += 1;
            }
            setPhase(nextPhase, reason, extra);
            return nextPhase;
        }

        function rememberBlockedRequest(action, reason, extra) {
            state.blockedRequest = {
                action,
                reason,
                at: new Date().toISOString(),
                extra: extra || null
            };
        }

        function clearBlockedRequest(noteType) {
            if (!state.blockedRequest) return;
            addNote(noteType || "blocked_request_cleared", {
                action: state.blockedRequest.action,
                reason: state.blockedRequest.reason
            });
            state.blockedRequest = null;
        }

        async function flushDeferred(reason) {
            if (state.flushTimer) {
                clearTimeout(state.flushTimer);
                state.flushTimer = null;
            }

            if (state.restoreInFlight || cloud.isPulling || cloud.isPushing) {
                if (hasDeferredWork()) {
                    state.counters.deferredRetries += 1;
                    scheduleDeferredFlush(`${reason || "flush"}:busy_retry`, 180);
                }
                return false;
            }

            if (!cloud.isUnlocked || !isOnline()) {
                syncDerivedPhase(reason || "flushDeferred:waiting");
                return false;
            }

            const shouldSync = state.deferredSync;
            const shouldPush = !shouldSync && state.deferredPush;
            if (!shouldSync && !shouldPush) {
                clearBlockedRequest("deferred_already_clear");
                syncDerivedPhase(reason || "flushDeferred:idle");
                return false;
            }

            state.deferredSync = false;
            state.deferredPush = false;
            state.counters.deferredFlush += 1;
            addNote("deferred_flush", { reason, action: shouldSync ? "syncNow" : "push" });
            clearBlockedRequest("deferred_flush_started");
            setPhase("recovering", reason || "deferred_flush", { action: shouldSync ? "syncNow" : "push" });

            try {
                if (shouldSync) {
                    return await originalSyncNow(true);
                }
                return await originalPush(true);
            } catch (error) {
                capture("flushDeferred", error, { reason, shouldSync, shouldPush });
                return false;
            } finally {
                syncDerivedPhase("flushDeferred:done");
            }
        }

        function scheduleDeferredFlush(reason, delay = 140) {
            if (state.flushTimer) clearTimeout(state.flushTimer);
            state.flushTimer = setTimeout(() => {
                flushDeferred(reason);
            }, delay);
        }

        cloud.emitSyncStatus = function patchedEmitSyncStatus(status, force = false) {
            const result = originalEmitSyncStatus(status, force);
            state.lastCoarseStatus = status;
            syncDerivedPhase("emitSyncStatus", { status, force: !!force });
            if (hasDeferredWork() && !state.restoreInFlight && !cloud.isPulling && !cloud.isPushing && cloud.isUnlocked && isOnline()) {
                scheduleDeferredFlush("emitSyncStatus:ready");
            }
            return result;
        };

        cloud.restoreApprovedDevice = async function patchedRestoreApprovedDevice(options = {}) {
            state.restoreInFlight = true;
            state.counters.restoreCalls += 1;
            state.lastRequestedAction = "restoreApprovedDevice";
            setPhase("restoring", "restoreApprovedDevice:start", { requireValidWindow: options?.requireValidWindow !== false });

            try {
                const result = await originalRestoreApprovedDevice(options);
                addNote("restore_complete", { result: !!result });
                syncDerivedPhase("restoreApprovedDevice:done", { result: !!result });
                return result;
            } catch (error) {
                capture("restoreApprovedDevice", error, options);
                setPhase("error", "restoreApprovedDevice:error");
                throw error;
            } finally {
                state.restoreInFlight = false;
                if (hasDeferredWork()) {
                    scheduleDeferredFlush("restore_complete");
                } else {
                    syncDerivedPhase("restoreApprovedDevice:finalize");
                }
            }
        };

        cloud.pull = async function patchedPull(silent = false) {
            state.lastRequestedAction = "pull";
            if (cloud.isPushing) {
                state.counters.pullDuringPush += 1;
                addNote("pull_during_push", { silent: !!silent });
            }
            setPhase("pulling", "pull:start", { silent: !!silent, withinPush: !!cloud.isPushing });

            try {
                return await originalPull(silent);
            } catch (error) {
                capture("pull", error, { silent });
                setPhase("error", "pull:error");
                throw error;
            } finally {
                if (hasDeferredWork()) {
                    scheduleDeferredFlush("pull_complete");
                } else {
                    syncDerivedPhase("pull:done", { silent: !!silent });
                }
            }
        };

        cloud.syncNow = async function patchedSyncNow(silent = false) {
            state.lastRequestedAction = "syncNow";
            if (state.restoreInFlight || cloud.isPulling || cloud.isPushing) {
                state.deferredSync = true;
                state.counters.blockedSync += 1;
                rememberBlockedRequest("syncNow", "syncNow:busy", {
                    silent: !!silent,
                    restoreInFlight: !!state.restoreInFlight,
                    isPulling: !!cloud.isPulling,
                    isPushing: !!cloud.isPushing
                });
                addNote("sync_blocked", {
                    silent: !!silent,
                    restoreInFlight: !!state.restoreInFlight,
                    isPulling: !!cloud.isPulling,
                    isPushing: !!cloud.isPushing
                });
                syncDerivedPhase("syncNow:busy", { silent: !!silent, deferredAction: "syncNow" });
                return false;
            }

            clearBlockedRequest("sync_request_started");
            setPhase("syncing", "syncNow:start", { silent: !!silent });
            try {
                return await originalSyncNow(silent);
            } catch (error) {
                capture("syncNow", error, { silent });
                setPhase("error", "syncNow:error");
                throw error;
            } finally {
                if (hasDeferredWork()) {
                    scheduleDeferredFlush("syncNow_complete");
                } else {
                    syncDerivedPhase("syncNow:done", { silent: !!silent });
                }
            }
        };

        cloud.push = function patchedPush(force = false) {
            state.lastRequestedAction = force ? "push(force)" : "push";

            if (state.restoreInFlight) {
                state.deferredPush = true;
                state.counters.blockedPush += 1;
                state.counters.restoreBlockedPush += 1;
                rememberBlockedRequest("push", "push:restore_in_flight", { force: !!force });
                addNote("push_blocked_restore", { force: !!force });
                syncDerivedPhase("push:restore_in_flight", { force: !!force, deferredAction: "push" });
                return false;
            }

            if (cloud.isPulling || cloud.isPushing) {
                state.deferredPush = true;
                state.counters.blockedPush += 1;
                rememberBlockedRequest("push", "push:busy", {
                    force: !!force,
                    isPulling: !!cloud.isPulling,
                    isPushing: !!cloud.isPushing
                });
                addNote("push_blocked_busy", {
                    force: !!force,
                    isPulling: !!cloud.isPulling,
                    isPushing: !!cloud.isPushing
                });
                syncDerivedPhase("push:busy", { force: !!force, deferredAction: "push" });
                return false;
            }

            clearBlockedRequest(force ? "forced_push_started" : "queued_push_started");
            if (!force) {
                state.counters.pushQueued += 1;
                setPhase("syncing", "push:queued", { force: false });
            } else {
                setPhase("pushing", "push:start", { force: true });
            }

            return originalPush(force);
        };

        cloud._doPush = async function patchedDoPush() {
            state.lastRequestedAction = "_doPush";
            if (state.restoreInFlight) {
                state.deferredPush = true;
                state.counters.blockedPush += 1;
                rememberBlockedRequest("push", "_doPush:restore_in_flight", null);
                addNote("doPush_blocked_restore", null);
                syncDerivedPhase("_doPush:restore_in_flight", { deferredAction: "push" });
                return false;
            }

            clearBlockedRequest("doPush_started");
            setPhase("pushing", "_doPush:start", {
                pendingChanges: !!cloud.hasPendingChanges?.(),
                protectedRepairPending: !!cloud.hasProtectedRepairPending?.()
            });

            try {
                return await originalDoPush();
            } catch (error) {
                capture("_doPush", error);
                setPhase("error", "_doPush:error");
                throw error;
            } finally {
                if (hasDeferredWork()) {
                    scheduleDeferredFlush("push_complete");
                } else {
                    syncDerivedPhase("_doPush:done");
                }
            }
        };

        window.PegasusSyncHardening = {
            getState() {
                return currentSnapshot();
            },
            summary() {
                const snapshot = currentSnapshot();
                console.log("🛡️ PEGASUS SYNC HARDENING", snapshot);
                return snapshot;
            },
            getRecentNotes() {
                return state.recentNotes.slice();
            },
            async flushDeferredNow() {
                return await flushDeferred("manual_flush");
            }
        };

        window.addEventListener("online", () => {
            if (hasDeferredWork()) {
                scheduleDeferredFlush("browser_online", 60);
            } else {
                syncDerivedPhase("browser_online");
            }
        });

        window.addEventListener("offline", () => {
            syncDerivedPhase("browser_offline");
        });

        cloud.__syncHardeningInstalled = true;
        cloud.__syncHardeningState = state;
        addNote("installed", { phase: state.phase });
        syncDerivedPhase("install");
        console.log("🛡️ PEGASUS SYNC HARDENING: Active");
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", installSyncHardening, { once: true });
    } else {
        installSyncHardening();
    }
})();
