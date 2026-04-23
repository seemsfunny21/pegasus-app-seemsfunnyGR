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
            if (id === 'settings_panel') window.PegasusWeight?.updateUI();
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
