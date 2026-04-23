        window.PEGASUS_IS_MOBILE = true;

        window.PegasusMobileSafe = window.PegasusMobileSafe || {
            escapeHtml(value) {
                return String(value ?? '').replace(/[&<>"']/g, ch => ({
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#39;'
                }[ch]));
            },
            safeJsonParse(raw, fallback) {
                if (raw == null || raw === '') return fallback;
                try {
                    return JSON.parse(raw);
                } catch (err) {
                    return fallback;
                }
            },
            safeReadStorage(key, fallback, opts = {}) {
                const parsed = this.safeJsonParse(localStorage.getItem(key), fallback);
                if (parsed === fallback && opts.repairOnFailure) {
                    try { localStorage.removeItem(key); } catch (_) {}
                }
                return parsed;
            },
            isAllowedBackupKey(key) {
                if (!key || key === '__proto__' || key === 'constructor' || key === 'prototype') return false;
                return (
                    key.startsWith('pegasus_') ||
                    key.startsWith('peg_') ||
                    key.startsWith('food_log_') ||
                    key.startsWith('kouki_') ||
                    key.startsWith('weight_') ||
                    key.startsWith('finance_')
                );
            },
            sanitizeBackupObject(input) {
                if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
                const cleaned = {};
                for (const [key, value] of Object.entries(input)) {
                    if (!this.isAllowedBackupKey(key)) continue;
                    if (typeof value !== 'string') continue;
                    if (value.length > 250000) continue;
                    if (window.PegasusCloud?.isExportBlockedKey?.(key)) continue;
                    if (window.PegasusCloud?.isLocalOnlyStorageKey?.(key)) continue;
                    if (window.PegasusCloud?.isInternalStorageKey?.(key)) continue;
                    cleaned[key] = value;
                }
                return cleaned;
            }
        };

        (function() {
            const params = new URLSearchParams(window.location.search);
            const now = Date.now();
            const hasVersion = params.has('v');
            const versionTs = hasVersion ? parseInt(params.get('v'), 10) : 0;
            const hasSwController = !!navigator.serviceWorker?.controller;

            if (
                navigator.onLine &&
                !hasSwController &&
                (!hasVersion || isNaN(versionTs) || (now - versionTs > 600000))
            ) {
                window.location.replace(window.location.pathname + '?v=' + now + window.location.hash);
            }
        })();
    


(function(){
  const STORAGE_KEY = 'pegasus_mobile_errors';
  const LIMIT = 20;
  const MAX_TEXT = 800;
  let guard = false;

  function nowIso() {
    try { return new Date().toISOString(); } catch (_) { return String(Date.now()); }
  }

  function trimText(value) {
    const text = String(value ?? '');
    return text.length > MAX_TEXT ? text.slice(0, MAX_TEXT) + '…' : text;
  }

  function safeRead() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function safeWrite(entries) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-LIMIT)));
      return true;
    } catch (_) {
      return false;
    }
  }

  function normalizeError(error) {
    if (!error) return { message: 'Unknown error', stack: '' };
    if (typeof error === 'string') return { message: trimText(error), stack: '' };

    const message = trimText(error.message || error.reason?.message || error.reason || error.toString?.() || 'Unknown error');
    const stack = trimText(error.stack || error.reason?.stack || '');
    return { message, stack };
  }

  function buildEntry(level, moduleName, action, error, extra) {
    const n = normalizeError(error);
    return {
      ts: nowIso(),
      level: level || 'ERROR',
      module: trimText(moduleName || 'UNKNOWN'),
      action: trimText(action || 'runtime'),
      message: n.message,
      stack: n.stack,
      path: trimText(location.pathname || ''),
      online: !!navigator.onLine,
      unlocked: !!window.PegasusCloud?.isUnlocked,
      extra: extra ? trimText(typeof extra === 'string' ? extra : JSON.stringify(extra)) : ''
    };
  }

  function capture(level, moduleName, action, error, extra) {
    if (guard) return null;
    guard = true;
    try {
      const entries = safeRead();
      const entry = buildEntry(level, moduleName, action, error, extra);
      entries.push(entry);
      safeWrite(entries);
      try {
        if (level === "ERROR") window.PegasusRuntimeMonitor?.capture?.(moduleName || "UNKNOWN", action || "runtime", error, extra);
        else if (level === "WARN") window.PegasusRuntimeMonitor?.warn?.(moduleName || "UNKNOWN", action || "runtime", error, extra);
        else window.PegasusRuntimeMonitor?.info?.(moduleName || "UNKNOWN", action || "runtime", n.message, extra);
      } catch (_) {}
      return entry;
    } finally {
      guard = false;
    }
  }

  window.PegasusMobileErrors = {
    key: STORAGE_KEY,
    limit: LIMIT,
    capture(moduleName, action, error, extra) {
      return capture('ERROR', moduleName, action, error, extra);
    },
    warn(moduleName, action, error, extra) {
      return capture('WARN', moduleName, action, error, extra);
    },
    info(moduleName, action, message, extra) {
      return capture('INFO', moduleName, action, message, extra);
    },
    getAll() {
      return safeRead();
    },
    getLatest() {
      const entries = safeRead();
      return entries.length ? entries[entries.length - 1] : null;
    },
    getProblems() {
      return safeRead().filter(entry => entry.level === "WARN" || entry.level === "ERROR");
    },
    getLatestProblem() {
      const entries = safeRead().filter(entry => entry.level === "WARN" || entry.level === "ERROR");
      return entries.length ? entries[entries.length - 1] : null;
    },
    clear() {
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    }
  };

  window.addEventListener('error', function(event){
    const src = event.filename ? event.filename.split('/').pop() : 'runtime';
    capture('ERROR', src || 'runtime', 'window.error', event.error || event.message || 'Window error', {
      lineno: event.lineno || 0,
      colno: event.colno || 0
    });
  });

  window.addEventListener('unhandledrejection', function(event){
    capture('ERROR', 'promise', 'unhandledrejection', event.reason || 'Unhandled rejection');
  });
})();


    const PEGASUS = {
        key: "$2a$10$oU/TyQjSeNEVr/k5dnFS8ulKZkbb9gUWd5xuXijAYFCBijuXrYAFC",
        bin: "69b6757ab7ec241ddc6d7230"
    };

    let isUnlocked = false;

    window._pegasusMobileSyncTimer = null;
    window._pegasusMobileSyncBusy = false;
    window._pegasusLastUiRefreshTs = 0;

    function getMobileDateStr() {
        if (typeof window.getPegasusTodayDateStr === "function") {
            return window.getPegasusTodayDateStr();
        }

        const d = new Date();
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }

    function getMobileFoodLogKey(dateStr) {
        const prefix = window.PegasusManifest?.nutrition?.log_prefix || "food_log_";
        return prefix + dateStr;
    }

    function installMobileInventoryBridges() {
        window.PegasusInventory = window.PegasusInventory || {};

        if (typeof window.PegasusInventory.getInventory !== "function") {
            window.PegasusInventory.getInventory = function() {
                return JSON.parse(localStorage.getItem('pegasus_supp_inventory') || '{"prot":2500,"crea":1000}');
            };
        }

        if (typeof window.PegasusInventory.updateUI !== "function") {
            window.PegasusInventory.updateUI = function() {
                updateSuppUI();
            };
        }

        if (typeof window.PegasusInventory.refill !== "function") {
            window.PegasusInventory.refill = function(type, grams) {
                if (typeof window.restockSupplement === "function") {
                    const inv = window.restockSupplement(type, grams);
                    updateSuppUI();
                    return inv;
                }

                const stock = JSON.parse(localStorage.getItem('pegasus_supp_inventory') || '{"prot":2500,"crea":1000}');
                const key = (type === 'protein') ? 'prot' : (type === 'creatine' ? 'crea' : type);

                if (stock[key] !== undefined) {
                    stock[key] = (parseFloat(stock[key]) || 0) + (parseFloat(grams) || 0);
                    localStorage.setItem('pegasus_supp_inventory', JSON.stringify(stock));
                    updateSuppUI();
                    if (window.PegasusCloud?.push) window.PegasusCloud.push(true);
                }

                return stock;
            };
        }
    }

    async function reconcileMobileDailyRoutine() {
        const dateStr = getMobileDateStr();
        const logKey = getMobileFoodLogKey(dateStr);
        const log = window.PegasusDiet?.getLog
            ? (window.PegasusDiet.getLog(dateStr) || [])
            : JSON.parse(localStorage.getItem(logKey) || "[]");

        const hasYogurt = log.some(item => item?.name === "Γιαούρτι 2% + Whey (Ρουτίνα)");
        const hasEggs = log.some(item => item?.name === "3 Αυγά (Ρουτίνα)");
        const hasCreatine = log.some(item => item?.name === "Κρεατίνη 5g (Ρουτίνα)");

        if (!window.PegasusDiet?.add) return;

        if (!hasYogurt) {
            await window.PegasusDiet.add("Γιαούρτι 2% + Whey (Ρουτίνα)", 250, 35);
        }

        if (!hasEggs) {
            await window.PegasusDiet.add("3 Αυγά (Ρουτίνα)", 210, 18);
        }

        if (!hasCreatine) {
            await window.PegasusDiet.add("Κρεατίνη 5g (Ρουτίνα)", 0, 0);
        }

        window.PegasusInventory?.updateUI?.();
    }

    function openView(id) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const targetView = document.getElementById(id);
        if (targetView) {
            targetView.classList.add('active');
            try { targetView.scrollTop = 0; } catch (_) {}
            try {
                const nestedScrollers = targetView.querySelectorAll('#dynamic-grid, .dynamic-grid, #lift-today, #lift-history');
                nestedScrollers.forEach(el => { try { el.scrollTop = 0; } catch (_) {} });
            } catch (_) {}
            refreshUIComponent(id);

            if (id === 'diet' && window.PegasusCloud?.isUnlocked && navigator.onLine) {
                setTimeout(() => {
                    runMobileSyncHeartbeat();
                }, 50);
            }
        }
    }

    function refreshUIComponent(id) {
        try {
            if (id === 'diet') window.PegasusDiet?.updateUI();
            if (id === 'library') window.PegasusDiet?.renderDailyKouki();
            if (id === 'supps') {
                window.PegasusInventory?.updateUI?.();
                updateSuppUI();
            }
            if (id === 'preview') updateMuscleUI();
            if (id === 'profile') window.PegasusProfile?.load();
            if (id === 'car') window.PegasusCar?.load();
            if (id === 'notes') {
                const nDate = document.getElementById('nDate');
                if (nDate) nDate.value = new Date().toLocaleDateString('el-GR');
                window.PegasusProfile?.renderNotes();
            }
            if (id === 'settings_panel') { try { window.PegasusWeight?.updateUI(); } catch(_) {} try { window.PegasusWeight?.ensureSettingsCard?.(); } catch(_) {} }
            if (id === 'parking_panel') window.PegasusParking?.updateUI();

            const dynamicRenderName = `render${id.charAt(0).toUpperCase() + id.slice(1)}Content`;
            if (typeof window[dynamicRenderName] === 'function') {
                window[dynamicRenderName]();
            }
        } catch (e) {
            window.PegasusMobileErrors?.capture?.("mobileUI", `refresh:${id}`, e);
            console.error("Refresh Error:", e);
        }
    }

    function refreshAllUI() {
        window.PegasusRuntimeMonitor?.trace?.("mobileUI", "refreshAllUI", "START");
        const now = Date.now();
        if (now - window._pegasusLastUiRefreshTs < 250) return;
        window._pegasusLastUiRefreshTs = now;

        window.PegasusDiet?.updateUI();
        window.PegasusInventory?.updateUI?.();
        window.PegasusWeight?.updateUI();
        window.PegasusParking?.updateUI();
        window.PegasusCar?.load();
        window.PegasusProfile?.load();

        if (typeof updateMuscleUI === "function") updateMuscleUI();
        if (typeof updateSuppUI === "function") updateSuppUI();
    }

    function updateSuppUI() {
        const s = JSON.parse(localStorage.getItem('pegasus_supp_inventory') || '{"prot":2500,"crea":1000}');
        const pPct = Math.max(0, Math.min(100, (s.prot / 2500) * 100));
        const cPct = Math.max(0, Math.min(100, (s.crea / 1000) * 100));

        if (document.getElementById('homeProtTxt')) document.getElementById('homeProtTxt').textContent = Math.round(pPct) + '%';
        if (document.getElementById('homeProtBar')) document.getElementById('homeProtBar').style.width = pPct + '%';
        if (document.getElementById('homeCreaTxt')) document.getElementById('homeCreaTxt').textContent = Math.round(cPct) + '%';
        if (document.getElementById('homeCreaBar')) document.getElementById('homeCreaBar').style.width = cPct + '%';

        if (document.getElementById('protLevelText')) document.getElementById('protLevelText').textContent = `${Math.round(s.prot)} / 2500g`;
        if (document.getElementById('creaLevelText')) document.getElementById('creaLevelText').textContent = `${Math.round(s.crea)} / 1000g`;
        if (document.getElementById('protBar')) document.getElementById('protBar').style.width = pPct + '%';
        if (document.getElementById('creaBar')) document.getElementById('creaBar').style.width = cPct + '%';
    }

    function unlockFields(v) {
        document.querySelectorAll(`#${v} input[readonly]`).forEach(el => {
            el.removeAttribute('readonly');
            el.style.border = "1px solid #00ff41";
        });
    }

    function updateMuscleUI() {
        const h = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
        const container = document.getElementById("muscle-container");
        if (!container) return;

        const targets = typeof window.getDynamicTargets === 'function'
            ? window.getDynamicTargets()
            : { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 };

        container.innerHTML = Object.keys(targets).map(g => {
            const targetSets = targets[g];
            if (targetSets === 0) return '';

            const v = h[g] || 0;
            const p = Math.min((v / targetSets) * 100, 100);

            return `
                <div class="mini-card">
                    <span class="mini-label">${g}</span>
                    <div class="mini-val">${v} / ${targetSets}</div>
                    <div class="bar-bg">
                        <div class="bar-fill" style="width:${p}%;"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    const MOBILE_SYNC_CYCLE_MS = () => Math.max(10000, Number(window.PegasusCloud?.config?.pullInterval || 30000));
    let mobileSyncCountdownTimer = null;
    let mobileLastSyncPulseTs = 0;
    let mobileNextSyncAt = 0;

    function scheduleNextMobileSyncCycle(fromNow = true) {
        const cycleMs = MOBILE_SYNC_CYCLE_MS();
        mobileNextSyncAt = Date.now() + (fromNow ? cycleMs : 0);
    }

    function renderMobileSyncCycleStatus() {
        const e = document.getElementById("sync-indicator");
        if (!e) return;
        if (!window.PegasusCloud?.isUnlocked) {
            e.textContent = "LOCKED";
            e.style.color = "#888";
            return;
        }
        if (!navigator.onLine) {
            e.textContent = "OFFLINE";
            e.style.color = "#ff4444";
            return;
        }

        const now = Date.now();
        if (mobileLastSyncPulseTs && (now - mobileLastSyncPulseTs) < 1200) {
            e.textContent = "ΣΥΓΧΡΟΝΙΣΜΟΣ";
            e.style.color = "#00bcd4";
            return;
        }

        if (!mobileNextSyncAt || mobileNextSyncAt <= now) {
            scheduleNextMobileSyncCycle(true);
        }

        const remainingSec = Math.max(0, Math.ceil((mobileNextSyncAt - now) / 1000));
        if (remainingSec > 20) {
            e.textContent = `ΣΥΝΔΕΔΕΜΕΝΟ · ${remainingSec}s`;
            e.style.color = "#00ff41";
        } else if (remainingSec > 10) {
            e.textContent = `ΣΥΝΔΕΔΕΜΕΝΟ · ${remainingSec}s`;
            e.style.color = "#ff9800";
        } else {
            e.textContent = `ΣΥΝΔΕΔΕΜΕΝΟ · ${remainingSec}s`;
            e.style.color = "#ff4444";
        }
    }

    function startMobileSyncCountdown() {
        stopMobileSyncCountdown();
        if (!window.PegasusCloud?.isUnlocked) return;
        renderMobileSyncCycleStatus();
        mobileSyncCountdownTimer = setInterval(() => {
            renderMobileSyncCycleStatus();
        }, 1000);
    }

    function stopMobileSyncCountdown() {
        if (mobileSyncCountdownTimer) {
            clearInterval(mobileSyncCountdownTimer);
            mobileSyncCountdownTimer = null;
        }
    }

    function setSyncStatus(status) {
        const e = document.getElementById("sync-indicator");
        if (!e) return;

        if (status === 'online') {
            startMobileSyncCountdown();
            renderMobileSyncCycleStatus();
        } else if (status === 'offline') {
            stopMobileSyncCountdown();
            e.textContent = "OFFLINE";
            e.style.color = "#ff4444";
        } else if (status === 'syncing') {
            mobileLastSyncPulseTs = Date.now();
            scheduleNextMobileSyncCycle(true);
            startMobileSyncCountdown();
            e.textContent = "ΣΥΓΧΡΟΝΙΣΜΟΣ";
            e.style.color = "#00bcd4";
        } else if (status === 'error') {
            stopMobileSyncCountdown();
            e.textContent = "ΣΦΑΛΜΑ SYNC";
            e.style.color = "#ff9800";
        } else if (status === 'locked') {
            stopMobileSyncCountdown();
            e.textContent = "LOCKED";
            e.style.color = "#888";
        } else {
            stopMobileSyncCountdown();
            e.textContent = "ΣΥΣΤΗΜΑ ΕΤΟΙΜΟ";
            e.style.color = "#00bcd4";
        }
        window.PegasusRuntimeMonitor?.trace?.("mobileUI", "refreshAllUI", "DONE");
    }

    async function runMobileSyncHeartbeat() {
        window.PegasusRuntimeMonitor?.trace?.("cloudSync", "mobileHeartbeat", "START");
        if (window._pegasusMobileSyncBusy) return false;

        if (!window.PegasusCloud?.isUnlocked) {
            setSyncStatus('locked');
            return false;
        }

        if (document.hidden) return false;

        if (!navigator.onLine) {
            setSyncStatus('offline');
            return false;
        }

        window._pegasusMobileSyncBusy = true;
        setSyncStatus('syncing');

        try {
            const changed = await window.PegasusCloud.syncNow(true);

            if (changed) {
                refreshAllUI();
            }

            if (window.PegasusCloud?.isUnlocked) {
                setSyncStatus('online');
            } else {
                setSyncStatus('locked');
            }

            window.PegasusRuntimeMonitor?.trace?.("cloudSync", "mobileHeartbeat", changed ? "SYNCED" : "NO_CHANGE");
            return !!changed;
        } catch (e) {
            window.PegasusRuntimeMonitor?.capture?.("cloudSync", "mobileHeartbeat", e);
            window.PegasusMobileErrors?.capture?.("cloudSync", "mobileHeartbeat", e);
            console.error("📡 Mobile Heartbeat Error:", e);
            setSyncStatus('error');
            return false;
        } finally {
            window._pegasusMobileSyncBusy = false;
        }
    }

    function startMobileSyncHeartbeat() {
        stopMobileSyncHeartbeat();

        if (!window.PegasusCloud?.isUnlocked) return;
        if (document.hidden) return;

        scheduleNextMobileSyncCycle(true);
        startMobileSyncCountdown();

        window._pegasusMobileSyncTimer = setInterval(() => {
            if (
                !document.hidden &&
                window.PegasusCloud?.isUnlocked &&
                !window.PegasusCloud.isPulling &&
                !window.PegasusCloud.isPushing &&
                !window._pegasusMobileSyncBusy
            ) {
                runMobileSyncHeartbeat();
            }
        }, MOBILE_SYNC_CYCLE_MS());
    }

    function stopMobileSyncHeartbeat() {
        if (window._pegasusMobileSyncTimer) {
            clearInterval(window._pegasusMobileSyncTimer);
            window._pegasusMobileSyncTimer = null;
        }
        stopMobileSyncCountdown();
    }

    window.addEventListener("pegasus_sync_status", (e) => {
        const status = e.detail?.status;
        const effectivelyUnlocked = !!(isUnlocked || window.PegasusCloud?.isUnlocked);

        if (!effectivelyUnlocked && status !== "locked") {
            setSyncStatus("locked");
            return;
        }

        if (status === "online") setSyncStatus("online");
        else if (status === "offline") setSyncStatus("offline");
        else if (status === "syncing") setSyncStatus("syncing");
        else if (status === "error") setSyncStatus("error");
        else if (status === "locked") setSyncStatus("locked");
    });

    window.addEventListener("focus", () => {
        if (window.PegasusCloud?.isUnlocked) {
            runMobileSyncHeartbeat();
            startMobileSyncHeartbeat();
        }
    });

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            stopMobileSyncHeartbeat();
        } else if (window.PegasusCloud?.isUnlocked) {
            runMobileSyncHeartbeat();
            startMobileSyncHeartbeat();
        }
    });

    window.addEventListener("online", () => {
        if (window.PegasusCloud?.isUnlocked) {
            runMobileSyncHeartbeat();
            startMobileSyncHeartbeat();
        } else {
            setSyncStatus('locked');
        }
    });

    window.addEventListener("offline", () => {
        stopMobileSyncHeartbeat();
        setSyncStatus(isUnlocked ? 'offline' : 'locked');
    });

    window.addEventListener("pegasus_sync_complete", () => {
        refreshAllUI();
        mobileLastSyncPulseTs = Date.now();
        scheduleNextMobileSyncCycle(true);
        if (window.PegasusCloud?.isUnlocked && !window.PegasusCloud?.isPulling && !window.PegasusCloud?.isPushing) {
            setSyncStatus('online');
        }
    });

    async function attemptVaultUnlock() {
        window.PegasusRuntimeMonitor?.trace?.("unlock", "attemptVaultUnlock", "START");
        if (window._pegasusUnlockBusy) return;

        const pinInput = document.getElementById("pinInput");
        const masterInput = document.getElementById("masterKeyInput");
        const errorDiv = document.getElementById("pinError");
        const unlockBtn = document.getElementById("unlockBtn");
        const pin = pinInput ? pinInput.value.trim() : "";
        const masterKey = masterInput ? masterInput.value.trim() : "";

        if (errorDiv) errorDiv.textContent = "";

        if (!pin || !masterKey) {
            if (errorDiv) errorDiv.textContent = "ΣΥΜΠΛΗΡΩΣΕ PIN ΚΑΙ MASTER KEY";
            return;
        }

        window._pegasusUnlockBusy = true;
        if (unlockBtn) {
            unlockBtn.disabled = true;
            unlockBtn.style.opacity = "0.7";
            unlockBtn.textContent = "ΕΛΕΓΧΟΣ...";
        }
        if (errorDiv) errorDiv.style.color = "#ffb300";
        if (errorDiv) errorDiv.textContent = "ΣΥΝΔΕΣΗ...";
        setSyncStatus('syncing');

        await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 40)));

        try {
            const success = await window.PegasusCloud?.unlock(pin, masterKey, { deferPostUnlockSync: true });

            if (success) {
                document.getElementById("pinModal").style.display = "none";
                isUnlocked = true;
                mobileLastSyncPulseTs = Date.now();
                scheduleNextMobileSyncCycle(true);
                setSyncStatus(window.PegasusCloud?.isUnlocked ? (navigator.onLine ? 'online' : 'offline') : 'locked');

                Promise.resolve().then(() => reconcileMobileDailyRoutine()).catch(err => { window.PegasusMobileErrors?.capture?.("diet", "reconcileDailyRoutine", err); console.error("Mobile reconcile error:", err); });
                startMobileSyncHeartbeat();
                setTimeout(() => {
                    if (window.PegasusCloud?.isUnlocked && !window.PegasusCloud?.isPulling && !window.PegasusCloud?.isPushing && !window._pegasusMobileSyncBusy) {
                        runMobileSyncHeartbeat();
                    }
                }, 250);
            } else {
                window.PegasusRuntimeMonitor?.warn?.("unlock", "attemptVaultUnlock", "INVALID_PIN_OR_MASTER");
                window.PegasusMobileErrors?.warn?.("unlock", "credentials", "INVALID_PIN_OR_MASTER");
                if (errorDiv) errorDiv.style.color = "#ff4444";
                if (errorDiv) errorDiv.textContent = "ΛΑΘΟΣ PIN / MASTER KEY";
                if (pinInput) pinInput.value = "";
                if (masterInput) masterInput.value = "";
            }
        } finally {
            window._pegasusUnlockBusy = false;
            if (unlockBtn) {
                unlockBtn.disabled = false;
                unlockBtn.style.opacity = "1";
                unlockBtn.textContent = "ΑΠΑΣΦΑΛΙΣΗ";
            }
            if (errorDiv && errorDiv.textContent === "ΣΥΝΔΕΣΗ...") {
                errorDiv.textContent = "";
            }
        }
    }

    function skipVault() {
        document.getElementById("pinModal").style.display = "none";
        stopMobileSyncHeartbeat();
        isUnlocked = false;
        setSyncStatus('locked');
        refreshAllUI();
    }

    async function hardResetSystem() {
        if (confirm("🚨 ΠΡΟΣΟΧΗ: Διαγραφή Cache;")) {
            try {
                stopMobileSyncHeartbeat();

                if ('serviceWorker' in navigator) {
                    const regs = await navigator.serviceWorker.getRegistrations();
                    for (const reg of regs) {
                        await reg.unregister();
                    }
                }

                if ('caches' in window) {
                    const keys = await caches.keys();
                    await Promise.all(keys.map(key => caches.delete(key)));
                }
            } catch (e) {
                window.PegasusMobileErrors?.capture?.("system", "hardReset", e);
                console.error("Hard Reset Cleanup Error:", e);
            }

            if (window.PegasusCloud?.clearLocalSecurityState) {
                window.PegasusCloud.clearLocalSecurityState();
            }
            location.replace(location.pathname + '?v=' + Date.now());
        }
    }

    function exportData() {
        const backup = {};
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (!k) continue;

            const shouldSkip = window.PegasusCloud?.isExportBlockedKey?.(k);
            if (shouldSkip) continue;

            if (k.includes("pegasus_") || k.includes("food_log_") || k.startsWith("peg_") || k.startsWith("kouki_") || k.startsWith("weight_")) {
                backup[k] = localStorage.getItem(k);
            }
        }

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `PEGASUS_MOBILE_BKP.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const rawData = JSON.parse(event.target.result);
                const data = window.PegasusMobileSafe?.sanitizeBackupObject(rawData) || {};
                if (Object.keys(data).length === 0) {
                    throw new Error('EMPTY_OR_INVALID_BACKUP');
                }
                if (confirm("🚨 Επαναφορά δεδομένων;")) {
                    const preserved = {};
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (!key) continue;
                        if (window.PegasusCloud?.isExportBlockedKey?.(key) || window.PegasusCloud?.isLocalOnlyStorageKey?.(key) || window.PegasusCloud?.isInternalStorageKey?.(key)) {
                            preserved[key] = localStorage.getItem(key);
                        }
                    }

                    localStorage.clear();
                    Object.keys(data).forEach(k => localStorage.setItem(k, data[k]));
                    Object.keys(preserved).forEach(k => localStorage.setItem(k, preserved[k]));
                    location.reload();
                }
            } catch (err) {
                window.PegasusMobileErrors?.capture?.("backup", "import", err);
                alert("❌ Μη έγκυρο αρχείο.");
            }
        };
        reader.readAsText(file);
    }

    (async function boot() {
        window.PegasusRuntimeMonitor?.trace?.("mobileBoot", "boot", "START");
        console.log("⚡ PEGASUS: Fast Boot...");

        const modal = document.getElementById("pinModal");
        isUnlocked = false;
        if (modal) modal.style.display = "none";

        try {
            try { installMobileInventoryBridges(); } catch (e) { window.PegasusMobileErrors?.capture?.("inventory", "installBridges", e); console.error("📦 Mobile Bridge Error:", e); }
            try { refreshAllUI(); } catch (e) { window.PegasusMobileErrors?.capture?.("mobileUI", "bootRefreshAllUI", e); console.error("📱 Mobile UI Boot Error:", e); }
            try { updateSuppUI(); } catch (e) { window.PegasusMobileErrors?.capture?.("inventory", "bootUpdateSuppUI", e); console.error("📦 Mobile Supp UI Error:", e); }

            const cloud = window.PegasusCloud;
            const canRestoreApproved = !!cloud?.canRestoreApprovedDevice?.();
            const canDailyAutoUnlock = !!cloud?.canAutoUnlock?.();
            const shouldAttemptSilentRestore = canRestoreApproved || canDailyAutoUnlock;

            if (shouldAttemptSilentRestore) {
                setSyncStatus('syncing');
                const success = canDailyAutoUnlock
                    ? await cloud.tryAutoUnlock()
                    : await cloud.tryApprovedDeviceUnlock();

                if (success) {
                    window.PegasusRuntimeMonitor?.trace?.("mobileBoot", canDailyAutoUnlock ? "autoUnlock" : "approvedRestore", "SUCCESS");
                    window.PegasusMobileErrors?.info?.("cloudSync", canDailyAutoUnlock ? "autoUnlock" : "approvedRestore", "SUCCESS");
                    console.log(canDailyAutoUnlock ? "📡 Cloud Sync: Auto-Unlocked." : "📡 Cloud Sync: Approved Device Restored.");
                    isUnlocked = true;
                    if (modal) modal.style.display = "none";
                    await reconcileMobileDailyRoutine();
                    await runMobileSyncHeartbeat();
                    startMobileSyncHeartbeat();
                    setTimeout(() => {
                        try { refreshAllUI(); } catch (e) { window.PegasusMobileErrors?.capture?.("mobileUI", "postUnlockRefreshAllUI", e); console.error("📱 Mobile UI Post-Unlock Error:", e); }
                        try { updateSuppUI(); } catch (e) { window.PegasusMobileErrors?.capture?.("inventory", "postUnlockUpdateSuppUI", e); console.error("📦 Mobile Supp Post-Unlock Error:", e); }
                    }, 500);
                    return;
                }
            }

            if (modal) modal.style.display = "flex";
            isUnlocked = false;
            setSyncStatus('locked');
        } catch (e) {
            window.PegasusRuntimeMonitor?.capture?.("mobileBoot", "boot", e);
            window.PegasusMobileErrors?.capture?.("cloudSync", "mobileBoot", e);
            console.error("📡 Cloud Boot Error:", e);
            isUnlocked = false;
            setSyncStatus('locked');
            if (modal) modal.style.display = "flex";
        }
    })();


/* ===== CONSOLIDATED FROM mobileBottomBoundary.js ===== */

(function () {
    const DEFAULT_RESERVE = 48;
    const EXTRA_BREATHING_ROOM = 0;
    const CONTENT_GAP = 8;
    const HOME_GRID_GAP = 2;

    function getViewportHeight() {
        try {
            if (window.visualViewport && window.visualViewport.height) {
                return window.visualViewport.height;
            }
        } catch (e) {}
        return window.innerHeight || document.documentElement.clientHeight || 0;
    }

    function clampReserve(value) {
        const num = Number(value) || 0;
        return Math.max(36, Math.min(140, Math.round(num)));
    }

    function applyViewBoundary(activeView, overlayRect, reserve) {
        if (!activeView || !overlayRect) return null;
        const viewRect = activeView.getBoundingClientRect();
        const isHome = activeView.id === 'home';
        const availableHeight = Math.max(140, Math.round(overlayRect.top - viewRect.top - CONTENT_GAP));

        activeView.style.boxSizing = 'border-box';
        activeView.style.minHeight = '0px';
        activeView.style.overflowX = 'hidden';

        let gridHeight = null;
        let homeGap = null;

        if (isHome) {
            activeView.style.height = 'auto';
            activeView.style.maxHeight = 'none';
            activeView.style.paddingBottom = '0px';
            activeView.style.scrollPaddingBottom = '0px';
            activeView.style.overflowY = 'hidden';

            const grid = document.getElementById('dynamic-grid');
            if (grid) {
                const gridRect = grid.getBoundingClientRect();
                homeGap = Math.max(0, Math.round(overlayRect.top - gridRect.top - HOME_GRID_GAP));
                gridHeight = Math.max(120, homeGap);
                grid.style.boxSizing = 'border-box';
                grid.style.height = gridHeight + 'px';
                grid.style.maxHeight = gridHeight + 'px';
                grid.style.minHeight = gridHeight + 'px';
                grid.style.paddingBottom = '0px';
                grid.style.scrollPaddingBottom = '0px';
                grid.style.overflowY = 'auto';
                grid.style.overflowX = 'hidden';
            }
        } else {
            activeView.style.height = availableHeight + 'px';
            activeView.style.maxHeight = availableHeight + 'px';
            activeView.style.paddingBottom = (reserve + 10) + 'px';
            activeView.style.scrollPaddingBottom = (reserve + 10) + 'px';
            activeView.style.overflowY = 'auto';
        }

        return { availableHeight, viewTop: Math.round(viewRect.top), gridHeight, homeGap };
    }

    function applyBottomBoundary() {
        const root = document.documentElement;
        const overlay = document.querySelector('.ghost-nav-overlay');
        const activeView = document.querySelector('.view.active');
        if (!root || !overlay) return null;

        const rect = overlay.getBoundingClientRect();
        const viewportHeight = getViewportHeight();
        const reserve = clampReserve((viewportHeight - rect.top) + EXTRA_BREATHING_ROOM);
        const buttonHeight = clampReserve(rect.height || 35);

        root.style.setProperty('--pg-ghost-nav-reserve', reserve + 'px');
        root.style.setProperty('--pg-ghost-nav-height', buttonHeight + 'px');
        root.style.setProperty('--pg-ghost-nav-bottom', Math.max(0, Math.round(viewportHeight - rect.bottom)) + 'px');
        root.setAttribute('data-mobile-bottom-boundary', 'active');

        const viewState = applyViewBoundary(activeView, rect, reserve);

        window.PegasusMobileBottomBoundary = {
            installed: true,
            getState() {
                return {
                    reserve,
                    buttonHeight,
                    viewportHeight,
                    overlayTop: Math.round(rect.top),
                    overlayBottom: Math.round(rect.bottom),
                    activeViewId: activeView?.id || null,
                    activeViewHeight: viewState?.availableHeight || null,
                    activeViewTop: viewState?.viewTop || null,
                    gridHeight: viewState?.gridHeight || null,
                    homeGap: viewState?.homeGap || null
                };
            },
            refresh: applyBottomBoundary
        };

        return window.PegasusMobileBottomBoundary.getState();
    }

    function scheduleRefresh() {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                applyBottomBoundary();
            });
        });
    }

    window.addEventListener('load', scheduleRefresh, { once: true });
    window.addEventListener('resize', scheduleRefresh);
    window.addEventListener('orientationchange', scheduleRefresh);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) scheduleRefresh();
    });

    const observer = new MutationObserver(() => scheduleRefresh());
    window.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
        scheduleRefresh();
    }, { once: true });

    const originalOpenView = window.openView;
    if (typeof originalOpenView === 'function') {
        window.openView = function patchedOpenView(id) {
            const out = originalOpenView.apply(this, arguments);
            scheduleRefresh();
            setTimeout(scheduleRefresh, 60);
            return out;
        };
    }

    setTimeout(scheduleRefresh, 120);
    setTimeout(scheduleRefresh, 600);

    console.log('📐 PEGASUS MOBILE BOTTOM BOUNDARY: Home hotfix active.');
})();


/* ===== CONSOLIDATED FROM mobileServiceWorker.js ===== */
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('../sw.js?v=3.37')
                    .then(reg => {
                        console.log('📡 PEGASUS: Service Worker Registered.');
                        reg.update();

                        reg.onupdatefound = () => {
                            const installingWorker = reg.installing;
                            if (!installingWorker) return;

                            installingWorker.onstatechange = () => {
                                if (installingWorker.state === 'installed') {
                                    if (navigator.serviceWorker.controller) {
                                        console.log('🔄 Νέο update στο background. Θα εφαρμοστεί στο επόμενο άνοιγμα.');
                                    }
                                }
                            };
                        };
                    })
                    .catch(err => console.error('❌ SW Registration Failed:', err));
            }, { once: true });
        }
    



/* ===== CONSOLIDATED FROM mobileUI.js ===== */
        window.PegasusMobileUI = {
            currentPage: 0,
            modulesPerPage: 10,

            coreModules: [
                { id: 'diet', icon: '🥗', label: 'Διατροφή' },
                { id: 'library', icon: '🍽️', label: 'Γεύματα' },
                { id: 'cardio', icon: '🚴', label: 'Αερόβια' },
                { id: 'ems_panel', icon: '⚡', label: 'EMS' },
                { id: 'preview', icon: '🎯', label: 'Στόχοι' },
                { id: 'profile', icon: '👤', label: 'Έγγραφα' },
                { id: 'car', icon: '🚗', label: 'Όχημα' },
                { id: 'notes', icon: '📝', label: 'Σημειώσεις' }
            ],

            extraModules: [],

            registerModule: function(module) {
                if (this.coreModules.some(m => m.id === module.id)) return;
                if (this.extraModules.some(m => m.id === module.id)) return;

                this.extraModules.push(module);

                if (document.readyState === "loading") {
                    document.addEventListener("DOMContentLoaded", () => this.render(), { once: true });
                } else {
                    this.render();
                }
            },

            changePage: function(direction) {
                const extraPages = Math.ceil(this.extraModules.length / this.modulesPerPage);
                const maxPages = Math.max(1, 1 + extraPages);

                this.currentPage = Math.max(0, Math.min(this.currentPage + direction, maxPages - 1));
                this.render();
            },

            render: function() {
                const grid = document.getElementById('dynamic-grid');
                const pageTxt = document.getElementById('pageIndicator');
                const btnPrev = document.getElementById('prevPage');
                const btnNext = document.getElementById('nextPage');
                if (!grid) return;

                const extraPages = Math.ceil(this.extraModules.length / this.modulesPerPage);
                const maxPages = Math.max(1, 1 + extraPages);

                if (this.currentPage >= maxPages) this.currentPage = Math.max(0, maxPages - 1);

                grid.innerHTML = "";

                if (this.currentPage === 0) {
                    this.coreModules.forEach(m => this.createTile(grid, m));
                    this.injectParkingTile(grid);
                    this.injectSuppsTile(grid);
                    this.injectSettingsTile(grid);
                } else {
                    const start = (this.currentPage - 1) * this.modulesPerPage;
                    const end = start + this.modulesPerPage;
                    const pageItems = this.extraModules.slice(start, end);
                    pageItems.forEach(m => this.createTile(grid, m));
                }

                if (pageTxt) {
                    if (this.currentPage === 0) {
                        pageTxt.textContent = "ΚΕΝΤΡΟ ΔΕΔΟΜΕΝΩΝ / DATA INTERFACE";
                    } else {
                        pageTxt.textContent = `ΕΠΕΚΤΑΣΙΜΑ MODULES / EXTENDED MODULES (${this.currentPage + 1}/${maxPages})`;
                    }
                }

                if (btnPrev) {
                    btnPrev.style.opacity = this.currentPage === 0 ? "0.1" : "1";
                    btnPrev.style.pointerEvents = this.currentPage === 0 ? "none" : "auto";
                }

                if (btnNext) {
                    btnNext.style.opacity = this.currentPage >= maxPages - 1 ? "0.1" : "1";
                    btnNext.style.pointerEvents = this.currentPage >= maxPages - 1 ? "none" : "auto";
                }

                if (window.PegasusInventory && typeof window.PegasusInventory.updateUI === "function") {
                    window.PegasusInventory.updateUI();
                }
            },

            createTile: function(container, m) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.onclick = () => openView(m.id);
                tile.innerHTML = `<span class="tile-icon">${m.icon}</span><span class="tile-label">${m.label}</span>`;
                container.appendChild(tile);
            },

            injectParkingTile: function(container) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.onclick = () => openView('parking_panel');
                tile.innerHTML = `<span class="tile-icon icon-parking">P</span><span id="parkingStatus" class="tile-label">ΠΑΡΚΙΝΓΚ: --</span>`;
                container.appendChild(tile);
            },

            injectSuppsTile: function(container) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.onclick = () => openView('supps');
                tile.style.padding = "10px 8px";
                tile.innerHTML = `
                    <div style="width: 100%; display: flex; flex-direction: column; gap: 4px;">
                        <div style="font-size: 7px; color: #fff; display: flex; justify-content: space-between; font-weight: 900;">
                            <span>WHEY</span><span id="homeProtTxt" style="color: var(--main);">--%</span>
                        </div>
                        <div class="bar-bg" style="height: 4px; margin: 0; background: rgba(0,0,0,0.5);">
                            <div id="homeProtBar" class="bar-fill" style="background: var(--main); box-shadow: 0 0 8px var(--main);"></div>
                        </div>
                        <div style="font-size: 7px; color: #fff; display: flex; justify-content: space-between; font-weight: 900;">
                            <span>CREA</span><span id="homeCreaTxt" style="color: var(--main);">--%</span>
                        </div>
                        <div class="bar-bg" style="height: 4px; margin: 0; background: rgba(0,0,0,0.5);">
                            <div id="homeCreaBar" class="bar-fill" style="background: var(--main); box-shadow: 0 0 8px var(--main);"></div>
                        </div>
                    </div>
                `;
                container.appendChild(tile);
            },

            injectSettingsTile: function(container) {
                const settingsTile = document.createElement('div');
                settingsTile.className = 'tile full-width';
                settingsTile.onclick = () => openView('settings_panel');
                settingsTile.style.borderColor = "var(--main)";
                settingsTile.innerHTML = `
                    <div style="display: flex; flex-direction: row; align-items: center; justify-content: center; width: 100%; height: 100%;">
                        <span class="tile-icon" style="font-size: 20px; margin-right: 10px; margin-bottom: 0;">⚙️</span>
                        <span class="tile-label" style="color: var(--main); font-weight: 900; text-align: center;">ΡΥΘΜΙΣΕΙΣ & ΒΑΡΟΣ ΣΩΜΑΤΟΣ</span>
                    </div>
                `;
                container.appendChild(settingsTile);
            }
        };

        window.registerPegasusModule = function(module) {
            window.PegasusMobileUI.registerModule(module);
        };

        document.addEventListener("DOMContentLoaded", () => {
            window.PegasusMobileUI.render();
        }, { once: true });
    


/* ===== CONSOLIDATED FROM mobileBridgeViews.js ===== */
/* ==========================================================================
   PEGASUS MOBILE BRIDGE VIEWS - v19.3
   Protocol: Mobile-only UI surfaces for shared bridge intelligence.
   Scope: lifting autofill, diet context, preview context, supplies bridge box.
   Status: TARGETED FEATURE LAYER | SEPARATE MOBILE FILE
   ========================================================================== */

(function () {
    function esc(value) {
        if (window.PegasusMobileSafe?.escapeHtml) return window.PegasusMobileSafe.escapeHtml(value);
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function ensureNode(parent, id, beforeNode = null) {
        let node = document.getElementById(id);
        if (node) return node;
        node = document.createElement('div');
        node.id = id;
        if (beforeNode) parent.insertBefore(node, beforeNode); else parent.appendChild(node);
        return node;
    }

    function formatSeconds(sec) {
        const total = Math.max(0, Math.round(Number(sec || 0)));
        const m = Math.floor(total / 60);
        const s = total % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function renderLiftingBridge() {
        const input = document.getElementById('liftName');
        if (!input || !window.PegasusBridgeHub) return;
        const parentCard = input.closest('.mini-card') || input.parentElement;
        if (!parentCard) return;
        const weightInput = document.getElementById('liftWeight');
        const helper = ensureNode(parentCard, 'liftingBridgeHint');
        helper.style.cssText = 'margin-top:10px; padding:10px 12px; border:1px dashed rgba(0,255,65,0.35); border-radius:12px; background:rgba(0,255,65,0.04); font-size:11px; color:var(--main); font-weight:800; letter-spacing:0.5px;';

        const suggestion = window.PegasusBridgeHub.getExerciseWeightBridge(input.value);
        if (!input.value.trim()) {
            helper.textContent = 'ΣΥΝΔΕΣΗ: ΓΡΑΨΕ ΑΣΚΗΣΗ ΚΑΙ ΤΟ PEGASUS ΘΑ ΠΡΟΤΕΙΝΕΙ ΤΑ ΤΕΛΕΥΤΑΙΑ ΚΙΛΑ ΑΠΟ DESKTOP / ΙΣΤΟΡΙΚΟ.';
            return;
        }

        if (!suggestion || isNaN(suggestion.value)) {
            helper.textContent = 'ΣΥΝΔΕΣΗ: ΔΕΝ ΒΡΕΘΗΚΑΝ ΑΠΟΘΗΚΕΥΜΕΝΑ ΚΙΛΑ ΓΙΑ ΑΥΤΗ ΤΗΝ ΑΣΚΗΣΗ.';
            return;
        }

        if (weightInput && !String(weightInput.value || '').trim()) {
            window.PegasusBridgeHub.prefillMobileLiftingWeight(input.value, { force: false });
        }

        helper.textContent = `ΣΥΝΔΕΣΗ: ${suggestion.source === 'desktop' ? 'DESKTOP' : 'ΙΣΤΟΡΙΚΟ ΒΑΡΩΝ'} → ${suggestion.matchedName} · ${suggestion.value}kg`;
    }

    function attachLiftingListeners() {
        const input = document.getElementById('liftName');
        if (!input || input.dataset.bridgeBound === 'true') return;
        input.dataset.bridgeBound = 'true';
        ['input', 'change', 'blur'].forEach(evt => input.addEventListener(evt, () => {
            setTimeout(renderLiftingBridge, 20);
        }));
    }

    function renderDietBridge() {
        const dietView = document.getElementById('diet');
        if (!dietView || !window.PegasusBridgeHub) return;
        const advisorBtn = dietView.querySelector('.secondary-btn');
        const box = ensureNode(dietView, 'mobileDietBridgeBox', advisorBtn ? advisorBtn.nextSibling : null);
        box.className = 'mini-card';
        box.style.cssText = 'margin: 12px 0 16px 0; padding: 14px; border-color: var(--main); background: rgba(0,255,65,0.05);';

        const state = window.PegasusBridgeHub.getDietBridgeStatus();
        const n = state.nutrition;
        const c = state.cardio;
        box.innerHTML = `
            <div style="font-size:10px; color:var(--main); font-weight:900; letter-spacing:1px; margin-bottom:8px;">ΣΥΝΔΕΣΗ · ΠΡΟΠΟΝΗΣΗ / ΔΙΑΤΡΟΦΗ</div>
            <div style="font-size:12px; color:#fff; font-weight:800; line-height:1.45; margin-bottom:10px;">${esc(state.headline)}</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:11px;">
                <div style="padding:10px; border:1px solid #173b1c; border-radius:10px; background:rgba(255,255,255,0.02);">
                    <div style="color:#777; font-weight:800; margin-bottom:4px;">ΥΠΟΛΕΙΠΟ ΚCAL</div>
                    <div style="color:#fff; font-weight:900;">${n.remainingKcal}</div>
                </div>
                <div style="padding:10px; border:1px solid #173b1c; border-radius:10px; background:rgba(255,255,255,0.02);">
                    <div style="color:#777; font-weight:800; margin-bottom:4px;">ΥΠΟΛΕΙΠΟ ΠΡΩΤΕΙΝΗΣ</div>
                    <div style="color:#fff; font-weight:900;">${n.remainingProtein}g</div>
                </div>
            </div>
            <div style="margin-top:10px; font-size:11px; color:#9adf9e; font-weight:700;">ΚΑΡΔΙΟ ΣΗΜΕΡΑ: ${c.km}km · ${Math.round(c.kcal)} kcal</div>
        `;
    }

    function renderPreviewBridge() {
        const previewView = document.getElementById('preview');
        const anchor = document.getElementById('muscle-container');
        if (!previewView || !anchor || !window.PegasusBridgeHub) return;

        const workoutBox = ensureNode(previewView, 'mobilePreviewWorkoutBridgeBox');
        const bodyBox = ensureNode(previewView, 'mobilePreviewBodyBridgeBox');
        workoutBox.className = 'mini-card';
        bodyBox.className = 'mini-card';
        workoutBox.style.cssText = 'margin-top:15px; padding:16px; border-color: var(--main); background: rgba(0,255,65,0.05);';
        bodyBox.style.cssText = 'margin-top:12px; padding:16px; border-color: var(--main); background: rgba(0,255,65,0.04);';

        const workout = window.PegasusBridgeHub.getWorkoutContext();
        const body = window.PegasusBridgeHub.getBodyContext();
        const cardio = window.PegasusBridgeHub.getTodayCardioContext();
        const planLines = workout.plan.slice(0, 6).map(item => `
            <div style="display:flex; justify-content:space-between; gap:10px; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.04);">
                <span style="color:#fff; font-size:11px; font-weight:800;">${esc(item.name)}</span>
                <span style="color:var(--main); font-size:11px; font-weight:900;">${item.savedWeight ? `${item.savedWeight}kg` : '--'}</span>
            </div>
        `).join('');

        workoutBox.innerHTML = `
            <div style="font-size:10px; color:var(--main); font-weight:900; letter-spacing:1px; margin-bottom:8px;">ΣΥΝΔΕΣΗ · DESKTOP ΠΡΟΓΡΑΜΜΑ / ΚΙΛΑ</div>
            <div style="display:flex; justify-content:space-between; gap:10px; margin-bottom:8px;">
                <div style="font-size:12px; color:#fff; font-weight:900;">ΣΗΜΕΡΑ: ${esc(workout.todayDayName)}</div>
                <div style="font-size:11px; color:#9adf9e; font-weight:800;">${workout.completedToday ? 'ΟΛΟΚΛΗΡΩΜΕΝΟ' : (workout.hasRemainingWork ? `${workout.remainingSetsCount} σετ υπολοιπο` : 'χωρις runtime υπολοιπο')}</div>
            </div>
            <div style="font-size:11px; color:#aaa; margin-bottom:8px;">ΧΡΟΝΟΣ ΥΠΟΛΟΙΠΟΥ: ${formatSeconds(workout.remainingSeconds)} · SESSION KCAL: ${Math.round(workout.sessionKcal || 0)}</div>
            <div style="font-size:11px; color:#777; font-weight:800; margin-bottom:6px;">ΣΗΜΕΡΙΝΑ ΑΠΟΘΗΚΕΥΜΕΝΑ ΚΙΛΑ ΑΣΚΗΣΕΩΝ</div>
            <div>${planLines || '<div style="color:#555; font-size:11px;">ΔΕΝ ΥΠΑΡΧΟΥΝ ΑΣΚΗΣΕΙΣ ΓΙΑ ΣΗΜΕΡΑ.</div>'}</div>
        `;

        const bioText = body.latestBio
            ? `ΥΠΝΟΣ ${Number(body.latestBio.sleep || 0)}/10 · ΕΝΕΡΓΕΙΑ ${Number(body.latestBio.energy || 0)}/10 · ΑΝΑΡΡΩΣΗ ${Number(body.latestBio.recovery || 0)}/10`
            : 'ΔΕΝ ΥΠΑΡΧΕΙ ΣΗΜΕΡΙΝΗ / ΤΕΛΕΥΤΑΙΑ ΒΙΟΜΕΤΡΙΚΗ ΚΑΤΑΓΡΑΦΗ.';

        bodyBox.innerHTML = `
            <div style="font-size:10px; color:var(--main); font-weight:900; letter-spacing:1px; margin-bottom:8px;">ΣΥΝΔΕΣΗ · ΣΩΜΑ / ΑΝΑΡΡΩΣΗ / CARDIO</div>
            <div style="font-size:12px; color:#fff; font-weight:900; margin-bottom:6px;">ΒΑΡΟΣ: ${body.currentWeight || '--'}kg · M.O. 7ΗΜ: ${body.averageWeight || '--'}kg</div>
            <div style="font-size:11px; color:#aaa; margin-bottom:6px;">${esc(bioText)}</div>
            <div style="font-size:11px; color:#9adf9e; margin-bottom:6px;">ΚΑΡΔΙΟ ΣΗΜΕΡΑ: ${cardio.km}km · ${Math.round(cardio.kcal)} kcal</div>
            <div style="font-size:11px; color:#fff; font-weight:800;">ΟΔΗΓΙΑ: ${esc(body.guidance || cardio.nextDayGuidance)}</div>
        `;
    }

    function renderSuppsBridge() {
        const suppsView = document.getElementById('supps');
        if (!suppsView || !window.PegasusBridgeHub) return;
        const box = ensureNode(suppsView, 'mobileSuppsBridgeBox');
        box.className = 'mini-card';
        box.style.cssText = 'margin-top:14px; padding:16px; border-color: var(--main); background: rgba(0,255,65,0.05);';

        const supplies = window.PegasusBridgeHub.getSupplyContext();
        const alertLines = supplies.alerts.map(item => `<div style="color:#ffb74d; font-weight:800; font-size:11px; margin-top:6px;">• ${esc(item.title)}</div>`).join('');
        box.innerHTML = `
            <div style="font-size:10px; color:var(--main); font-weight:900; letter-spacing:1px; margin-bottom:8px;">ΣΥΝΔΕΣΗ · ΣΥΜΠΛΗΡΩΜΑΤΑ / ΑΠΟΘΕΜΑ / ΑΠΟΣΤΟΛΕΣ</div>
            <div style="font-size:11px; color:#fff; line-height:1.5;">
                ΣΗΜΕΡΙΝΗ ΚΑΤΑΝΑΛΩΣΗ: WHEY ${supplies.wheyHits}x · ΚΡΕΑΤΙΝΗ ${supplies.creatineHits}x
            </div>
            <div style="font-size:11px; color:#9adf9e; line-height:1.5; margin-top:6px;">
                ΑΠΟΘΕΜΑ: ${Math.round(supplies.inventory?.prot || 0)}g WHEY · ${Math.round(supplies.inventory?.crea || 0)}g CREA
            </div>
            ${alertLines || '<div style="color:#777; font-size:11px; margin-top:6px;">ΧΩΡΙΣ ΕΝΕΡΓΕΣ ΥΠΕΝΘΥΜΙΣΕΙΣ ΑΠΟΘΕΜΑΤΟΣ.</div>'}
        `;
    }

    function renderAll() {
        renderLiftingBridge();
        try { window.renderLiftingQuickPicks?.(); } catch (_) {}
        renderDietBridge();
        renderPreviewBridge();
        renderSuppsBridge();
    }

    function patchOpenView() {
        if (typeof window.openView !== 'function' || window.openView.__pegasusBridgeWrapped) return;
        const original = window.openView;
        window.openView = function patchedOpenView() {
            const result = original.apply(this, arguments);
            setTimeout(renderAll, 60);
            return result;
        };
        window.openView.__pegasusBridgeWrapped = true;
    }

    function boot() {
        attachLiftingListeners();
        patchOpenView();
        renderAll();
    }

    window.addEventListener('pegasus:bridge:update', () => {
        setTimeout(boot, 40);
    });

    document.addEventListener('DOMContentLoaded', () => {
        boot();
        setTimeout(boot, 250);
        setTimeout(boot, 1200);
    }, { once: true });

    console.log('📲 PEGASUS MOBILE BRIDGE VIEWS: Active.');
})();

