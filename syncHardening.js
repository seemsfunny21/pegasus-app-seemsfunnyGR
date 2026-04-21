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
            flushTimer: null,
            recentNotes: [],
            counters: {
                blockedPush: 0,
                blockedSync: 0,
                deferredFlush: 0,
                restoreCalls: 0,
                restoreBlockedPush: 0,
                pullDuringPush: 0,
                pushQueued: 0
            }
        };

        const STICKY_PHASES = new Set(["restoring", "pulling", "pushing", "recovering", "blocked"]);
        const originalEmitSyncStatus = cloud.emitSyncStatus.bind(cloud);
        const originalPush = cloud.push.bind(cloud);
        const originalDoPush = cloud._doPush.bind(cloud);
        const originalPull = cloud.pull.bind(cloud);
        const originalSyncNow = cloud.syncNow.bind(cloud);
        const originalRestoreApprovedDevice = cloud.restoreApprovedDevice.bind(cloud);

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
                    online: typeof navigator === "undefined" ? true : !!navigator.onLine
                },
                deferred: {
                    push: !!state.deferredPush,
                    sync: !!state.deferredSync
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

        function coarseStatusToPhase(status) {
            switch (status) {
                case "syncing": return "syncing";
                case "offline": return "offline";
                case "error": return "error";
                case "locked": return "locked";
                case "online": return "online";
                default: return status || "unknown";
            }
        }

        async function flushDeferred(reason) {
            if (state.flushTimer) {
                clearTimeout(state.flushTimer);
                state.flushTimer = null;
            }

            if (state.restoreInFlight) return false;
            if (cloud.isPulling || cloud.isPushing) return false;
            if (!cloud.isUnlocked) return false;
            if (typeof navigator !== "undefined" && !navigator.onLine) return false;

            const shouldSync = state.deferredSync;
            const shouldPush = !shouldSync && state.deferredPush;
            if (!shouldSync && !shouldPush) return false;

            state.deferredSync = false;
            state.deferredPush = false;
            state.counters.deferredFlush += 1;
            addNote("deferred_flush", { reason, action: shouldSync ? "syncNow" : "push" });
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
                dispatchStateEvent("flushDeferred:done");
            }
        }

        function scheduleDeferredFlush(reason) {
            if (state.flushTimer) clearTimeout(state.flushTimer);
            state.flushTimer = setTimeout(() => {
                flushDeferred(reason);
            }, 140);
        }

        cloud.emitSyncStatus = function patchedEmitSyncStatus(status, force = false) {
            const result = originalEmitSyncStatus(status, force);
            state.lastCoarseStatus = status;
            const mappedPhase = coarseStatusToPhase(status);
            const stickyActive = STICKY_PHASES.has(state.phase) && (cloud.isPulling || cloud.isPushing || state.restoreInFlight || state.deferredPush || state.deferredSync);
            if (!stickyActive || force) {
                setPhase(mappedPhase, "emitSyncStatus", { status, force: !!force });
            } else {
                dispatchStateEvent("emitSyncStatus:sticky");
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
                setPhase(result ? (cloud.isUnlocked ? "online" : "locked") : "locked", "restoreApprovedDevice:done", { result: !!result });
                return result;
            } catch (error) {
                capture("restoreApprovedDevice", error, options);
                setPhase("error", "restoreApprovedDevice:error");
                throw error;
            } finally {
                state.restoreInFlight = false;
                scheduleDeferredFlush("restore_complete");
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
                if (!cloud.isPushing && !state.restoreInFlight) {
                    const nextPhase = !cloud.isUnlocked ? "locked" : ((typeof navigator !== "undefined" && !navigator.onLine) ? "offline" : (state.lastCoarseStatus === "error" ? "error" : "online"));
                    setPhase(nextPhase, "pull:done", { silent: !!silent });
                }
                scheduleDeferredFlush("pull_complete");
            }
        };

        cloud.syncNow = async function patchedSyncNow(silent = false) {
            state.lastRequestedAction = "syncNow";
            if (state.restoreInFlight || cloud.isPulling || cloud.isPushing) {
                state.deferredSync = true;
                state.counters.blockedSync += 1;
                addNote("sync_blocked", {
                    silent: !!silent,
                    restoreInFlight: !!state.restoreInFlight,
                    isPulling: !!cloud.isPulling,
                    isPushing: !!cloud.isPushing
                });
                setPhase("blocked", "syncNow:busy", { silent: !!silent });
                return false;
            }

            setPhase("syncing", "syncNow:start", { silent: !!silent });
            try {
                return await originalSyncNow(silent);
            } catch (error) {
                capture("syncNow", error, { silent });
                setPhase("error", "syncNow:error");
                throw error;
            } finally {
                scheduleDeferredFlush("syncNow_complete");
            }
        };

        cloud.push = function patchedPush(force = false) {
            state.lastRequestedAction = force ? "push(force)" : "push";

            if (state.restoreInFlight) {
                state.deferredPush = true;
                state.counters.blockedPush += 1;
                state.counters.restoreBlockedPush += 1;
                addNote("push_blocked_restore", { force: !!force });
                setPhase("blocked", "push:restore_in_flight", { force: !!force });
                return false;
            }

            if (cloud.isPulling || cloud.isPushing) {
                state.deferredPush = true;
                state.counters.blockedPush += 1;
                addNote("push_blocked_busy", {
                    force: !!force,
                    isPulling: !!cloud.isPulling,
                    isPushing: !!cloud.isPushing
                });
                setPhase("blocked", "push:busy", { force: !!force });
                return false;
            }

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
                addNote("doPush_blocked_restore", null);
                setPhase("blocked", "_doPush:restore_in_flight");
                return false;
            }

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
                scheduleDeferredFlush("push_complete");
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

        cloud.__syncHardeningInstalled = true;
        cloud.__syncHardeningState = state;
        addNote("installed", { phase: state.phase });
        setPhase(state.phase, "install");
        console.log("🛡️ PEGASUS SYNC HARDENING: Active");
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", installSyncHardening, { once: true });
    } else {
        installSyncHardening();
    }
})();
