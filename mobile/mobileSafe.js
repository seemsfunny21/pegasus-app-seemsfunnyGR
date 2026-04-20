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
    
