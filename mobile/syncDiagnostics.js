/* ==========================================================================
   PEGASUS SYNC DIAGNOSTICS
   Observability layer for sync hardening and edge hardening.
   Adds combined summaries, lightweight history, and clearer classification
   without changing the sync flow or visible UI.
   ========================================================================== */

(function () {
    const MAX_HISTORY = 180;
    const POLL_MS = 1200;

    function nowIso() {
        return new Date().toISOString();
    }

    function getCloud() {
        return window.PegasusCloud || null;
    }

    function getHardening() {
        try {
            return window.PegasusSyncHardening?.getState?.() || null;
        } catch (_) {
            return null;
        }
    }

    function getEdge() {
        try {
            return window.PegasusSyncEdgeHardening?.getState?.() || null;
        } catch (_) {
            return null;
        }
    }

    function safeLastPushStorage(cloud) {
        try {
            const key = cloud?.storage?.lastPush;
            if (!key) return null;
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            const parsed = parseInt(raw, 10);
            return Number.isFinite(parsed) ? new Date(parsed).toISOString() : raw;
        } catch (_) {
            return null;
        }
    }

    function toIso(value) {
        if (!Number.isFinite(Number(value))) return null;
        try {
            return new Date(Number(value)).toISOString();
        } catch (_) {
            return null;
        }
    }

    function shallowSignature(obj) {
        try {
            return JSON.stringify(obj || null);
        } catch (_) {
            return String(Date.now());
        }
    }

    function classifySummary(snapshot) {
        const phase = String(snapshot?.sync?.phase || "unknown");
        const coarseStatus = String(snapshot?.sync?.coarseStatus || "unknown");
        const flags = snapshot?.sync?.flags || {};
        const deferred = snapshot?.sync?.deferred || {};
        const lease = snapshot?.lease || {};

        if (phase === "error" || coarseStatus === "error") {
            return { level: "error", label: "sync_error", reason: "Sync layer reported error state." };
        }

        if (phase === "offline" || flags.online === false) {
            return { level: "warning", label: "offline_wait", reason: "Browser is offline, sync work is paused." };
        }

        if (phase === "locked" && (deferred.push || deferred.sync)) {
            return { level: "warning", label: "locked_with_queue", reason: "Sync queue exists while vault is locked." };
        }

        if (lease.hasForeignLease && (lease.hasDeferredPush || lease.hasDeferredSync)) {
            return { level: "guard", label: "foreign_lease_deferred", reason: "Another tab owns the lease, work is deferred safely." };
        }

        if (deferred.push || deferred.sync || deferred.blockedRequest) {
            return { level: "guard", label: "local_queue_guard", reason: "A local sync request was safely deferred while busy." };
        }

        if (["restoring", "recovering"].includes(phase)) {
            return { level: "recovery", label: phase, reason: "Sync layer is recovering or restoring session state." };
        }

        if (["pulling", "pushing", "syncing"].includes(phase)) {
            return { level: "info", label: phase, reason: "Sync layer is actively processing normal work." };
        }

        if (phase === "online" && coarseStatus === "online") {
            return { level: "ok", label: "healthy_online", reason: "Sync layer is idle and healthy." };
        }

        return { level: "info", label: phase || "unknown", reason: "Sync state is stable but not specially classified." };
    }

    function buildSnapshot() {
        const cloud = getCloud();
        const hardening = getHardening();
        const edge = getEdge();
        const lease = edge?.latestLease || null;
        const currentTabId = edge?.tabId || null;
        const cloudLastPushTs = toIso(cloud?.lastPushTs);
        const summary = {
            capturedAt: nowIso(),
            currentTabId,
            sync: hardening ? {
                phase: hardening.phase,
                coarseStatus: hardening.coarseStatus,
                lastTransitionAt: hardening.lastTransitionAt,
                lastReason: hardening.lastReason,
                lastRequestedAction: hardening.lastRequestedAction,
                flags: { ...(hardening.flags || {}) },
                deferred: {
                    push: !!hardening?.deferred?.push,
                    sync: !!hardening?.deferred?.sync,
                    blockedRequest: hardening?.deferred?.blockedRequest || null
                },
                counters: { ...(hardening.counters || {}) }
            } : null,
            lease: {
                owner: lease?.owner || null,
                action: lease?.action || null,
                expiresAt: lease?.expiresAt ? toIso(lease.expiresAt) : null,
                hidden: lease?.hidden ?? null,
                currentTabOwnsLease: !!(lease?.owner && currentTabId && lease.owner === currentTabId),
                hasForeignLease: !!(lease?.owner && currentTabId && lease.owner !== currentTabId),
                activeLeaseAction: edge?.activeLeaseAction || null,
                hasDeferredSync: !!edge?.hasDeferredSync,
                hasDeferredPush: !!edge?.hasDeferredPush,
                counters: { ...(edge?.counters || {}) }
            },
            cloud: cloud ? {
                isUnlocked: !!cloud.isUnlocked,
                isPulling: !!cloud.isPulling,
                isPushing: !!cloud.isPushing,
                isApplyingRemote: !!cloud.isApplyingRemote,
                hasApprovedRestoreCompleted: !!cloud.hasApprovedRestoreCompleted,
                hasSuccessfullyPulled: !!cloud.hasSuccessfullyPulled,
                lastStatus: cloud.lastStatus || null,
                lastPushTs: cloudLastPushTs,
                lastPushStorage: safeLastPushStorage(cloud)
            } : null
        };
        summary.classification = classifySummary(summary);
        return summary;
    }

    const state = {
        installedAt: nowIso(),
        history: [],
        lastSummarySignature: null,
        lastEdgeSignature: null,
        lastHistoryId: 0,
        lastHealthyOnlineAt: null,
        lastLeaseOwner: null,
        pollTimer: null
    };

    function trimHistory() {
        if (state.history.length > MAX_HISTORY) {
            state.history = state.history.slice(-MAX_HISTORY);
        }
    }

    function pushHistory(entry) {
        state.lastHistoryId += 1;
        state.history.push({
            id: state.lastHistoryId,
            at: nowIso(),
            ...entry
        });
        trimHistory();
    }

    function trace(status, extra) {
        try {
            window.PegasusRuntimeMonitor?.trace?.("syncDiagnostics", "observe", status, extra);
        } catch (_) {}
    }

    function recordSummaryChange(source, summary, extras) {
        if (!summary) return;
        const signature = shallowSignature({
            phase: summary?.sync?.phase,
            coarseStatus: summary?.sync?.coarseStatus,
            reason: summary?.sync?.lastReason,
            requested: summary?.sync?.lastRequestedAction,
            deferred: summary?.sync?.deferred,
            leaseOwner: summary?.lease?.owner,
            leaseAction: summary?.lease?.action,
            activeLeaseAction: summary?.lease?.activeLeaseAction,
            edgeDeferredSync: summary?.lease?.hasDeferredSync,
            edgeDeferredPush: summary?.lease?.hasDeferredPush,
            unlocked: summary?.cloud?.isUnlocked,
            pulling: summary?.cloud?.isPulling,
            pushing: summary?.cloud?.isPushing,
            lastStatus: summary?.cloud?.lastStatus,
            classification: summary?.classification
        });

        if (signature === state.lastSummarySignature) return;
        state.lastSummarySignature = signature;

        if (summary?.classification?.label === "healthy_online") {
            state.lastHealthyOnlineAt = nowIso();
        }

        pushHistory({
            source: source || "summary",
            kind: "summary_change",
            level: summary?.classification?.level || "info",
            label: summary?.classification?.label || "summary",
            detail: {
                reason: summary?.sync?.lastReason || null,
                requestedAction: summary?.sync?.lastRequestedAction || null,
                phase: summary?.sync?.phase || null,
                coarseStatus: summary?.sync?.coarseStatus || null,
                leaseOwner: summary?.lease?.owner || null,
                leaseAction: summary?.lease?.action || null,
                currentTabOwnsLease: !!summary?.lease?.currentTabOwnsLease,
                deferred: {
                    hardeningPush: !!summary?.sync?.deferred?.push,
                    hardeningSync: !!summary?.sync?.deferred?.sync,
                    edgePush: !!summary?.lease?.hasDeferredPush,
                    edgeSync: !!summary?.lease?.hasDeferredSync
                },
                extra: extras || null
            }
        });
    }

    function recordEdgeNotes(reason) {
        const edge = getEdge();
        if (!edge) return;
        const signature = shallowSignature({
            owner: edge?.latestLease?.owner || null,
            action: edge?.latestLease?.action || null,
            expiresAt: edge?.latestLease?.expiresAt || null,
            activeLeaseAction: edge?.activeLeaseAction || null,
            hasDeferredSync: !!edge?.hasDeferredSync,
            hasDeferredPush: !!edge?.hasDeferredPush,
            counters: edge?.counters || null,
            noteTail: (edge?.recentNotes || []).slice(-3)
        });

        if (signature === state.lastEdgeSignature) return;
        state.lastEdgeSignature = signature;

        const leaseOwner = edge?.latestLease?.owner || null;
        if (leaseOwner !== state.lastLeaseOwner) {
            pushHistory({
                source: "syncEdgeHardening",
                kind: "lease_owner_change",
                level: leaseOwner ? "info" : "recovery",
                label: leaseOwner ? "lease_acquired_somewhere" : "lease_released",
                detail: {
                    reason: reason || "poll",
                    previousOwner: state.lastLeaseOwner,
                    leaseOwner,
                    leaseAction: edge?.latestLease?.action || null,
                    currentTabId: edge?.tabId || null
                }
            });
            state.lastLeaseOwner = leaseOwner;
        }

        const recent = edge?.recentNotes || [];
        const note = recent.length ? recent[recent.length - 1] : null;
        if (note) {
            pushHistory({
                source: "syncEdgeHardening",
                kind: "edge_note",
                level: /foreign_lease|deduped|scheduled/.test(String(note.type || "")) ? "guard" : "info",
                label: note.type || "edge_note",
                detail: {
                    reason: reason || "poll",
                    note
                }
            });
        }
    }

    function recordBrowserEvent(type, detail) {
        pushHistory({
            source: "browser",
            kind: "browser_event",
            level: type === "offline" ? "warning" : "info",
            label: type,
            detail: detail || null
        });
    }

    function buildPublicState() {
        const summary = buildSnapshot();
        return {
            installedAt: state.installedAt,
            lastHealthyOnlineAt: state.lastHealthyOnlineAt,
            summary,
            historySize: state.history.length
        };
    }

    function installSyncDiagnostics() {
        if (window.PegasusSyncDiagnostics) return;

        window.addEventListener("pegasus_sync_state", (event) => {
            const summary = buildSnapshot();
            recordSummaryChange(event?.detail?.source || "syncHardening", summary, {
                eventSource: event?.detail?.source || null
            });
            trace("state_event", {
                phase: summary?.sync?.phase || null,
                classification: summary?.classification?.label || null
            });
        });

        window.addEventListener("online", () => {
            recordBrowserEvent("online", { hidden: !!document.hidden });
            recordSummaryChange("browser_online", buildSnapshot());
        });

        window.addEventListener("offline", () => {
            recordBrowserEvent("offline", { hidden: !!document.hidden });
            recordSummaryChange("browser_offline", buildSnapshot());
        });

        window.addEventListener("pagehide", () => {
            recordBrowserEvent("pagehide", { hidden: !!document.hidden });
        });

        document.addEventListener("visibilitychange", () => {
            recordBrowserEvent("visibilitychange", { hidden: !!document.hidden });
            recordSummaryChange("visibilitychange", buildSnapshot(), { hidden: !!document.hidden });
        });

        window.addEventListener("storage", (e) => {
            if (!e?.key || String(e.key).indexOf("pegasus_sync_lease") === -1) return;
            pushHistory({
                source: "browser",
                kind: "storage_event",
                level: "info",
                label: "lease_storage_event",
                detail: {
                    key: e.key,
                    hasNewValue: !!e.newValue,
                    hasOldValue: !!e.oldValue
                }
            });
            recordEdgeNotes("storage_event");
            recordSummaryChange("storage_event", buildSnapshot());
        });

        state.pollTimer = setInterval(() => {
            recordEdgeNotes("poll");
            recordSummaryChange("poll", buildSnapshot());
        }, POLL_MS);

        window.PegasusSyncDiagnostics = {
            getState() {
                return buildPublicState();
            },
            summary() {
                const snapshot = buildSnapshot();
                console.log("🧭 PEGASUS SYNC DIAGNOSTICS", snapshot);
                return snapshot;
            },
            history(limit = 30) {
                const n = Math.max(1, Math.min(120, Number(limit) || 30));
                return state.history.slice(-n);
            },
            recent(limit = 12) {
                return this.history(limit || 12);
            },
            leaseView() {
                const summary = buildSnapshot();
                return {
                    currentTabId: summary.currentTabId,
                    owner: summary.lease.owner,
                    action: summary.lease.action,
                    expiresAt: summary.lease.expiresAt,
                    currentTabOwnsLease: summary.lease.currentTabOwnsLease,
                    hasForeignLease: summary.lease.hasForeignLease,
                    activeLeaseAction: summary.lease.activeLeaseAction,
                    hasDeferredSync: summary.lease.hasDeferredSync,
                    hasDeferredPush: summary.lease.hasDeferredPush
                };
            },
            classifyCurrent() {
                const summary = buildSnapshot();
                return {
                    classification: summary.classification,
                    phase: summary?.sync?.phase || null,
                    coarseStatus: summary?.sync?.coarseStatus || null,
                    reason: summary?.sync?.lastReason || null
                };
            }
        };

        recordBrowserEvent("diagnostics_installed", { installedAt: state.installedAt });
        recordSummaryChange("install", buildSnapshot());
        recordEdgeNotes("install");
        console.log("🧭 PEGASUS SYNC DIAGNOSTICS: Active");
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", installSyncDiagnostics, { once: true });
    } else {
        installSyncDiagnostics();
    }
})();
