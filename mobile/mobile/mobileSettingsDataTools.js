(function initPegasusMobileSettingsDataTools() {
    if (window.__pegasusMobileSettingsDataToolsInstalled) return;
    window.__pegasusMobileSettingsDataToolsInstalled = true;

    const LOG_KEY = 'pegasus_mobile_sync_debug_log_v1';
    const MAX_LOG_ENTRIES = 80;
    const FALLBACK_MODULAR_KEYS = [
        'pegasus_finance_v1',
        'pegasus_maintenance_v1',
        'pegasus_movies_v1',
        'pegasus_missions_v1',
        'pegasus_missions_date',
        'pegasus_biometrics_v1',
        'pegasus_supplies_v1',
        'pegasus_supplies_last_sync',
        'pegasus_social_v1',
        'pegasus_lifting_v1',
        'pegasus_youtube_v1',
        'pegasus_notes',
        'pegasus_supp_inventory',
        'pegasus_parking_loc',
        'pegasus_parking_history'
    ];

    function getEngineVersion() {
        return String(
            window.PegasusManifest?.metadata?.engine_version ||
            window.PegasusManifest?.engine_version ||
            'UNKNOWN'
        ).trim();
    }

    function safeJsonParse(raw, fallback) {
        if (raw == null || raw === '') return fallback;
        try {
            return JSON.parse(raw);
        } catch (e) {
            return fallback;
        }
    }

    function escapeHtml(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatTs(ts) {
        try {
            return new Date(ts).toLocaleString('el-GR');
        } catch (e) {
            return String(ts || '-');
        }
    }

    function getPendingCount() {
        const queueKey = window.PegasusCloud?.storage?.pendingQueue || 'pegasus_cloud_pending_v1';
        const parsed = safeJsonParse(localStorage.getItem(queueKey), []);
        return Array.isArray(parsed) ? parsed.length : 0;
    }

    function getModularKeys() {
        const registry = window.PegasusMobileDataRegistry;
        if (!registry) return FALLBACK_MODULAR_KEYS.slice();
        const keys = [
            ...(registry.getGeneralExactKeys?.() || []),
            ...(registry.getProtectedExactKeys?.() || [])
        ];
        const exclude = new Set([
            'pegasus_user_specs',
            'pegasus_car_identity',
            'pegasus_car_dates',
            'pegasus_car_specs',
            'pegasus_master_pin',
            LOG_KEY
        ]);
        return Array.from(new Set(keys.filter(key => !exclude.has(key))));
    }

    function readEventLog() {
        const parsed = safeJsonParse(localStorage.getItem(LOG_KEY), []);
        return Array.isArray(parsed) ? parsed : [];
    }

    function writeEventLog(entries) {
        localStorage.setItem(LOG_KEY, JSON.stringify(entries.slice(0, MAX_LOG_ENTRIES)));
    }

    function addEventLog(type, status, detail, extra = {}) {
        const now = Date.now();
        const entries = readEventLog();
        const latest = entries[0];
        if (
            latest &&
            latest.type === type &&
            latest.status === status &&
            latest.detail === detail &&
            (now - Number(latest.ts || 0)) < 8000
        ) {
            return latest;
        }

        const entry = {
            id: `${now}_${Math.random().toString(16).slice(2, 8)}`,
            ts: now,
            type,
            status,
            detail,
            extra
        };

        entries.unshift(entry);
        writeEventLog(entries);
        refreshSettingsDataToolsUI();
        return entry;
    }

    function collectModularStorage() {
        const storage = {};
        getModularKeys().forEach(key => {
            const value = localStorage.getItem(key);
            if (typeof value === 'string') {
                storage[key] = value;
            }
        });
        return storage;
    }

    function downloadJson(payload, filename) {
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }

    function exportModularData() {
        const storage = collectModularStorage();
        const payload = {
            format: 'pegasus-mobile-modular-backup-v1',
            engineVersion: getEngineVersion(),
            exportedAt: new Date().toISOString(),
            keyCount: Object.keys(storage).length,
            storage
        };
        downloadJson(payload, 'PEGASUS_MOBILE_MODULAR_BKP.json');
        addEventLog('backup', 'ok', 'MODULAR BACKUP EXPORTED', {
            keyCount: payload.keyCount,
            engineVersion: payload.engineVersion
        });
    }

    function importModularData(event) {
        const input = event?.target;
        const file = input?.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const payload = safeJsonParse(e?.target?.result, null);
                const storage = payload?.storage;
                if (!storage || typeof storage !== 'object' || Array.isArray(storage)) {
                    throw new Error('INVALID_MODULAR_BACKUP');
                }

                const allowed = new Set(getModularKeys());
                const entries = Object.entries(storage).filter(([key, value]) => allowed.has(key) && typeof value === 'string');
                if (!entries.length) throw new Error('EMPTY_MODULAR_BACKUP');

                if (!confirm(`🧩 Επαναφορά modular data (${entries.length} keys);`)) {
                    input.value = '';
                    return;
                }

                try {
                    window.PegasusMobileDataRegistry?.saveSafetySnapshot?.('manual-pre-modular-restore', { force: true, minIntervalMs: 0 });
                } catch (snapshotErr) {
                    console.warn('⚠️ MODULAR RESTORE: Pre-restore snapshot skipped.', snapshotErr);
                }

                entries.forEach(([key, value]) => localStorage.setItem(key, value));

                addEventLog('backup', 'ok', 'MODULAR RESTORE APPLIED', {
                    keyCount: entries.length,
                    importedEngineVersion: payload?.engineVersion || 'UNKNOWN'
                });

                alert(`✅ Modular data restored (${entries.length} keys).`);
                input.value = '';
                location.reload();
            } catch (err) {
                console.error('❌ MODULAR RESTORE ERROR:', err);
                addEventLog('backup', 'error', 'MODULAR RESTORE FAILED', {
                    message: String(err?.message || err)
                });
                alert('❌ Μη έγκυρο modular backup αρχείο.');
                input.value = '';
            }
        };
        reader.readAsText(file);
    }

    function clearSyncDebugLog() {
        if (!confirm('🧹 Καθαρισμός sync/debug log;')) return;
        localStorage.removeItem(LOG_KEY);
        addEventLog('debug', 'ok', 'SYNC / DEBUG LOG RESET');
        refreshSettingsDataToolsUI();
    }


    function isTestEntry(value) {
        try {
            return String(JSON.stringify(value || '')).includes('TEST_');
        } catch (e) {
            return String(value || '').includes('TEST_');
        }
    }

    function clearTestData() {
        if (!confirm('🧹 Καθαρισμός όλων των TEST entries από modular data;')) return;

        try {
            window.PegasusMobileDataRegistry?.saveSafetySnapshot?.('pre-clear-test-data', { force: true, minIntervalMs: 0 });
        } catch (snapshotErr) {
            console.warn('⚠️ TEST CLEAR: Pre-clear snapshot skipped.', snapshotErr);
        }

        const touched = [];
        let removedCount = 0;
        getModularKeys().forEach((key) => {
            const raw = localStorage.getItem(key);
            if (typeof raw !== 'string' || !raw.includes('TEST_')) return;

            const parsed = safeJsonParse(raw, null);
            if (Array.isArray(parsed)) {
                const filtered = parsed.filter(item => !isTestEntry(item));
                if (filtered.length !== parsed.length) {
                    localStorage.setItem(key, JSON.stringify(filtered));
                    removedCount += (parsed.length - filtered.length);
                    touched.push(key);
                }
                return;
            }

            if (typeof parsed === 'string' && parsed.includes('TEST_')) {
                localStorage.removeItem(key);
                removedCount += 1;
                touched.push(key);
            }
        });

        addEventLog('debug', removedCount ? 'ok' : 'info', removedCount ? 'TEST DATA CLEARED' : 'NO TEST DATA FOUND', {
            removedCount,
            keys: touched
        });

        try {
            window.PegasusCloud?.push?.();
        } catch (pushErr) {
            console.warn('⚠️ TEST CLEAR: Push skipped.', pushErr);
        }

        try {
            refreshSettingsDataToolsUI();
        } catch (refreshErr) {
            console.warn('⚠️ TEST CLEAR: UI refresh skipped.', refreshErr);
        }

        alert(removedCount ? `✅ Καθαρίστηκαν ${removedCount} TEST entries.` : 'ℹ️ Δεν βρέθηκαν TEST entries.');
    }

    function getCloudStatusLabel() {
        if (!navigator.onLine) return 'ΧΩΡΙΣ ΔΙΚΤΥΟ';
        if (window.PegasusCloud?.isUnlocked) return 'ΣΥΝΔΕΔΕΜΕΝΟ';
        return 'ΤΟΠΙΚΟ ΜΟΝΟ';
    }

    function getCloudStatusColor() {
        if (!navigator.onLine) return '#ff9800';
        if (window.PegasusCloud?.isUnlocked) return 'var(--main)';
        return '#9e9e9e';
    }

    function renderDataSafetyStatusBox() {
        const box = document.getElementById('mobileDataSafetyStatusBox');
        if (!box) return;

        const state = window.PegasusMobileDataSafety?.getState?.() || window.PegasusMobileDataRegistry?.lastBootstrapState || null;
        const meta = window.PegasusMobileDataSafety?.latestBackupMeta?.() || window.PegasusMobileDataRegistry?.getLatestBackupMeta?.() || null;
        const restoredCount = Array.isArray(state?.restoredKeys) ? state.restoredKeys.length : 0;
        const modularKeyCount = getModularKeys().length;
        const pendingCount = getPendingCount();
        const cloudLabel = getCloudStatusLabel();
        const cloudColor = getCloudStatusColor();

        box.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:12px;">
                <span class="mini-label" style="margin:0; color: var(--main);">DATA SAFETY STATUS</span>
                <span style="font-size:10px; font-weight:900; color:${cloudColor}; border:1px solid ${cloudColor}; border-radius:999px; padding:6px 10px;">${escapeHtml(cloudLabel)}</span>
            </div>
            <div style="display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:10px;">
                <div style="padding:12px; border-radius:12px; background:rgba(0,255,65,0.05); border:1px solid rgba(0,255,65,0.18);">
                    <div style="font-size:9px; color:#8fd69f; font-weight:900; margin-bottom:6px;">ENGINE</div>
                    <div style="font-size:12px; color:var(--main); font-weight:900;">${escapeHtml(getEngineVersion())}</div>
                </div>
                <div style="padding:12px; border-radius:12px; background:rgba(0,255,65,0.05); border:1px solid rgba(0,255,65,0.18);">
                    <div style="font-size:9px; color:#8fd69f; font-weight:900; margin-bottom:6px;">AUTO BACKUP</div>
                    <div style="font-size:12px; color:var(--main); font-weight:900;">${meta ? escapeHtml(formatTs(meta.capturedAt)) : '---'}</div>
                </div>
                <div style="padding:12px; border-radius:12px; background:rgba(0,255,65,0.05); border:1px solid rgba(0,255,65,0.18);">
                    <div style="font-size:9px; color:#8fd69f; font-weight:900; margin-bottom:6px;">SNAPSHOT KEYS</div>
                    <div style="font-size:12px; color:var(--main); font-weight:900;">${escapeHtml(meta?.keyCount ?? 0)}</div>
                </div>
                <div style="padding:12px; border-radius:12px; background:rgba(0,255,65,0.05); border:1px solid rgba(0,255,65,0.18);">
                    <div style="font-size:9px; color:#8fd69f; font-weight:900; margin-bottom:6px;">RESTORED KEYS</div>
                    <div style="font-size:12px; color:var(--main); font-weight:900;">${escapeHtml(restoredCount)}</div>
                </div>
                <div style="padding:12px; border-radius:12px; background:rgba(0,255,65,0.05); border:1px solid rgba(0,255,65,0.18);">
                    <div style="font-size:9px; color:#8fd69f; font-weight:900; margin-bottom:6px;">MODULAR KEYS</div>
                    <div style="font-size:12px; color:var(--main); font-weight:900;">${escapeHtml(modularKeyCount)}</div>
                </div>
                <div style="padding:12px; border-radius:12px; background:rgba(0,255,65,0.05); border:1px solid rgba(0,255,65,0.18);">
                    <div style="font-size:9px; color:#8fd69f; font-weight:900; margin-bottom:6px;">PENDING QUEUE</div>
                    <div style="font-size:12px; color:var(--main); font-weight:900;">${escapeHtml(pendingCount)}</div>
                </div>
            </div>
            <div style="margin-top:12px; font-size:10px; color:#9adca8; line-height:1.5;">
                ${meta ? `LAST REASON: <span style="color:var(--main); font-weight:900;">${escapeHtml(meta.reason || '---')}</span>` : 'NO AUTO BACKUP META YET'}
            </div>
        `;
    }

    function renderSyncDebugLogBox() {
        const box = document.getElementById('mobileSyncDebugLogBox');
        if (!box) return;

        const entries = readEventLog().slice(0, 10);
        const itemsHtml = entries.length
            ? entries.map(entry => {
                const color = entry.status === 'error'
                    ? '#ff6b6b'
                    : entry.status === 'warn'
                        ? '#ffb74d'
                        : 'var(--main)';
                const extra = entry.extra && Object.keys(entry.extra).length
                    ? `<div style="font-size:9px; color:#8fd69f; margin-top:4px; word-break:break-word;">${escapeHtml(JSON.stringify(entry.extra))}</div>`
                    : '';
                return `
                    <div style="padding:10px 12px; border-radius:12px; background:rgba(0,255,65,0.04); border:1px solid rgba(0,255,65,0.16);">
                        <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
                            <div style="font-size:11px; color:${color}; font-weight:900; line-height:1.35;">${escapeHtml(entry.detail)}</div>
                            <div style="font-size:9px; color:#8fd69f; white-space:nowrap;">${escapeHtml(formatTs(entry.ts))}</div>
                        </div>
                        <div style="font-size:9px; color:#8fd69f; margin-top:4px;">${escapeHtml(String(entry.type || '').toUpperCase())} / ${escapeHtml(String(entry.status || '').toUpperCase())}</div>
                        ${extra}
                    </div>
                `;
            }).join('')
            : '<div style="font-size:11px; color:#8fd69f;">Δεν υπάρχουν sync/debug events ακόμη.</div>';

        box.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:12px;">
                <span class="mini-label" style="margin:0; color: var(--main);">SYNC / DEBUG LOG</span>
                <div style="display:flex; gap:8px;">
                    <button class="secondary-btn" style="margin:0; padding:8px 10px; border-color: var(--main); color: var(--main); font-size:10px;" onclick="PegasusMobileSettingsDataTools.copyDebugLog()">COPY</button>
                    <button class="secondary-btn" style="margin:0; padding:8px 10px; border-color: #ff9800; color: #ff9800; font-size:10px;" onclick="PegasusMobileSettingsDataTools.clearDebugLog()">CLEAR</button>
                </div>
            </div>
            <div style="display:flex; flex-direction:column; gap:8px; max-height:320px; overflow:auto;">
                ${itemsHtml}
            </div>
        `;
    }

    function refreshSettingsDataToolsUI() {
        renderDataSafetyStatusBox();
        renderSyncDebugLogBox();
    }

    function copyDebugLog() {
        const text = JSON.stringify(readEventLog().slice(0, 20), null, 2);
        navigator.clipboard?.writeText?.(text)
            .then(() => alert('✅ Sync/debug log copied.'))
            .catch(() => alert('❌ Αποτυχία αντιγραφής log.'));
    }

    function patchDataSafetyLogging() {
        const registry = window.PegasusMobileDataRegistry;
        if (!registry || registry.__settingsToolsPatched) return;
        registry.__settingsToolsPatched = true;

        const originalSave = registry.saveSafetySnapshot?.bind(registry);
        if (originalSave) {
            registry.saveSafetySnapshot = function(reason = 'manual', options = {}) {
                const result = originalSave(reason, options);
                if (result) {
                    addEventLog('safety', 'ok', 'AUTO SNAPSHOT SAVED', {
                        reason,
                        keyCount: result.keyCount,
                        engineVersion: result.engineVersion
                    });
                }
                return result;
            };
        }

        const state = window.PegasusMobileDataSafety?.getState?.() || registry.lastBootstrapState;
        if (state) {
            addEventLog('safety', 'ok', 'DATA SAFETY BOOT OK', {
                restoredKeys: Array.isArray(state.restoredKeys) ? state.restoredKeys.length : 0,
                currentVersion: state.currentVersion || getEngineVersion()
            });
        }
    }

    function patchCloudLogging() {
        const cloud = window.PegasusCloud;
        if (!cloud || cloud.__settingsToolsPatched) return;
        cloud.__settingsToolsPatched = true;

        const originalPush = cloud.push?.bind(cloud);
        if (originalPush) {
            cloud.push = function(force = false) {
                addEventLog('sync', 'info', force ? 'PUSH REQUEST (FORCED)' : 'PUSH QUEUED', {
                    pendingCount: getPendingCount(),
                    online: navigator.onLine
                });
                return originalPush(force);
            };
        }

        const originalDoPush = cloud._doPush?.bind(cloud);
        if (originalDoPush) {
            cloud._doPush = async function() {
                addEventLog('sync', 'info', 'PUSH START', {
                    pendingCount: getPendingCount(),
                    online: navigator.onLine
                });
                try {
                    const result = await originalDoPush();
                    addEventLog('sync', result ? 'ok' : 'warn', result ? 'PUSH OK' : 'PUSH SKIPPED', {
                        pendingCount: getPendingCount()
                    });
                    return result;
                } catch (e) {
                    addEventLog('sync', 'error', 'PUSH ERROR', {
                        message: String(e?.message || e)
                    });
                    throw e;
                }
            };
        }

        const originalPull = cloud.pull?.bind(cloud);
        if (originalPull) {
            cloud.pull = async function(silent = false) {
                try {
                    const changed = await originalPull(silent);
                    addEventLog('sync', changed ? 'ok' : 'info', changed ? 'PULL CHANGED' : 'PULL OK', {
                        silent,
                        pendingCount: getPendingCount()
                    });
                    return changed;
                } catch (e) {
                    addEventLog('sync', 'error', 'PULL ERROR', {
                        silent,
                        message: String(e?.message || e)
                    });
                    throw e;
                }
            };
        }

        const originalSyncNow = cloud.syncNow?.bind(cloud);
        if (originalSyncNow) {
            cloud.syncNow = async function(silent = false) {
                addEventLog('sync', 'info', 'SYNC NOW', {
                    silent,
                    pendingCount: getPendingCount()
                });
                try {
                    const result = await originalSyncNow(silent);
                    addEventLog('sync', result ? 'ok' : 'info', result ? 'SYNC NOW CHANGED' : 'SYNC NOW NO CHANGE', {
                        silent,
                        pendingCount: getPendingCount()
                    });
                    return result;
                } catch (e) {
                    addEventLog('sync', 'error', 'SYNC NOW ERROR', {
                        silent,
                        message: String(e?.message || e)
                    });
                    throw e;
                }
            };
        }
    }

    function patchBackupLogging() {
        if (typeof window.exportData === 'function' && !window.exportData.__settingsToolsWrapped) {
            const originalExport = window.exportData;
            const wrapped = function() {
                addEventLog('backup', 'ok', 'FULL BACKUP EXPORTED');
                return originalExport.apply(this, arguments);
            };
            wrapped.__settingsToolsWrapped = true;
            window.exportData = wrapped;
        }

        if (typeof window.importData === 'function' && !window.importData.__settingsToolsWrapped) {
            const originalImport = window.importData;
            const wrapped = function(event) {
                addEventLog('backup', 'info', 'FULL BACKUP RESTORE START');
                return originalImport.apply(this, arguments);
            };
            wrapped.__settingsToolsWrapped = true;
            window.importData = wrapped;
        }
    }

    function installViewRefreshHook() {
        window.renderSettings_panelContent = refreshSettingsDataToolsUI;
        if (typeof window.openView === 'function' && !window.openView.__settingsToolsWrapped) {
            const originalOpenView = window.openView;
            const wrapped = function(id) {
                const result = originalOpenView.apply(this, arguments);
                if (id === 'settings_panel') {
                    setTimeout(refreshSettingsDataToolsUI, 0);
                }
                return result;
            };
            wrapped.__settingsToolsWrapped = true;
            window.openView = wrapped;
        }
    }

    function installLifecycleLogging() {
        window.addEventListener('online', () => addEventLog('network', 'ok', 'NETWORK ONLINE'));
        window.addEventListener('offline', () => addEventLog('network', 'warn', 'NETWORK OFFLINE'));
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                addEventLog('system', 'info', 'APP HIDDEN');
            }
        });
    }

    window.PegasusMobileSettingsDataTools = {
        installed: true,
        getModularKeys,
        getEventLog: readEventLog,
        refresh: refreshSettingsDataToolsUI,
        exportModularData,
        importModularData,
        clearDebugLog: clearSyncDebugLog,
        clearTestData,
        copyDebugLog
    };

    window.exportModularData = exportModularData;
    window.importModularData = importModularData;
    window.clearPegasusTestData = clearTestData;

    patchDataSafetyLogging();
    patchCloudLogging();
    patchBackupLogging();
    installViewRefreshHook();
    installLifecycleLogging();

    addEventLog('system', 'ok', 'SETTINGS DATA TOOLS ACTIVE', {
        engineVersion: getEngineVersion(),
        modularKeys: getModularKeys().length
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', refreshSettingsDataToolsUI, { once: true });
    } else {
        refreshSettingsDataToolsUI();
    }
})();

