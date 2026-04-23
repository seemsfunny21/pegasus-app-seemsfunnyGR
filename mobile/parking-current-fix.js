(function initPegasusParkingCurrentFix() {
    const LOC_KEY = 'pegasus_parking_loc';
    const HISTORY_KEY = 'pegasus_parking_history';
    const PUSH_DEBOUNCE_MS = 800;
    let healPushTimer = null;

    function safeParseJson(raw, fallback) {
        if (raw == null || raw === '') return fallback;
        try { return JSON.parse(raw); } catch (e) { return fallback; }
    }

    function readHistory() {
        const parsed = safeParseJson(localStorage.getItem(HISTORY_KEY), []);
        if (!Array.isArray(parsed)) return [];
        return parsed.map(item => String(item || '').trim()).filter(Boolean);
    }

    function parseDisplayTs(str) {
        if (!str || typeof str !== 'string') return 0;
        const m = str.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?.*?(\d{1,2}):(\d{2})/);
        if (!m) return 0;
        const day = Number(m[1]);
        const month = Number(m[2]);
        const year = m[3] ? Number(m[3].length === 2 ? '20' + m[3] : m[3]) : new Date().getFullYear();
        const hour = Number(m[4]);
        const minute = Number(m[5]);
        const ts = new Date(year, month - 1, day, hour, minute).getTime();
        return Number.isFinite(ts) ? ts : 0;
    }

    function normalizeParkingLoc(raw) {
        if (raw == null || raw === '') return null;
        if (raw === '[object Object]') return null;

        const parsed = safeParseJson(raw, raw);
        if (typeof parsed === 'string') {
            const loc = parsed.trim();
            return loc ? { loc, ts: '', updatedAt: 0, source: 'legacy-string' } : null;
        }

        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
        const loc = String(parsed.loc || '').trim();
        if (!loc) return null;
        const updatedAt = Number(parsed.updatedAt || parsed.savedAt || parsed.lastUpdatedAt || 0) || 0;
        return {
            loc,
            ts: String(parsed.ts || ''),
            updatedAt,
            source: String(parsed.source || '')
        };
    }

    function formatParkingPayload(loc, reason, prev) {
        const now = Date.now();
        const safeLoc = String(loc || '').trim();
        const payload = {
            loc: safeLoc,
            ts: new Date(now).toLocaleString('el-GR', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }),
            updatedAt: now,
            source: reason || prev?.source || 'parking'
        };
        return payload;
    }

    function stringifyParkingPayload(payload) {
        return JSON.stringify(payload || {});
    }

    function getParkingScore(item) {
        if (!item) return 0;
        return Number(item.updatedAt) || parseDisplayTs(item.ts) || 0;
    }

    function choosePreferredParking(localRaw, remoteRaw) {
        const local = normalizeParkingLoc(localRaw);
        const remote = normalizeParkingLoc(remoteRaw);
        if (!local && !remote) return remoteRaw;
        if (local && !remote) return stringifyParkingPayload(local.updatedAt ? local : formatParkingPayload(local.loc, 'parking-local-heal', local));
        if (remote && !local) return stringifyParkingPayload(remote.updatedAt ? remote : formatParkingPayload(remote.loc, 'parking-remote-heal', remote));

        const localScore = getParkingScore(local);
        const remoteScore = getParkingScore(remote);
        if (remoteScore > localScore) return stringifyParkingPayload(remote.updatedAt ? remote : formatParkingPayload(remote.loc, 'parking-remote-heal', remote));
        if (localScore > remoteScore) return stringifyParkingPayload(local.updatedAt ? local : formatParkingPayload(local.loc, 'parking-local-heal', local));

        // When legacy payloads tie, prefer remote to avoid stale local current parking overriding newer cloud state.
        return stringifyParkingPayload(remote.updatedAt ? remote : formatParkingPayload(remote.loc, 'parking-remote-legacy-heal', remote));
    }

    function scheduleHealPush() {
        if (!window.PegasusCloud?.push || !window.PegasusCloud?.isUnlocked) return;
        clearTimeout(healPushTimer);
        healPushTimer = setTimeout(() => {
            try { window.PegasusCloud.push(); } catch (e) {}
        }, PUSH_DEBOUNCE_MS);
    }

    function ensureCurrentMatchesHistory(reason = 'parking-history-heal') {
        const history = readHistory();
        const top = history[0] || '';
        const current = normalizeParkingLoc(localStorage.getItem(LOC_KEY));
        if (!top) return { changed: false, top: '', current: current?.loc || '' };

        if (!current || current.loc !== top || !current.updatedAt) {
            localStorage.setItem(LOC_KEY, stringifyParkingPayload(formatParkingPayload(top, reason, current)));
            return { changed: true, top, current: top };
        }

        return { changed: false, top, current: current.loc };
    }

    function patchCloudMerge() {
        if (!window.PegasusCloud || window.PegasusCloud.__parkingCurrentFixInstalled) return;
        const originalMerge = window.PegasusCloud.mergeManagedStorageValue?.bind(window.PegasusCloud);
        if (typeof originalMerge !== 'function') return;

        window.PegasusCloud.mergeManagedStorageValue = function(key, localValue, remoteValue) {
            if (key === LOC_KEY) return choosePreferredParking(localValue, remoteValue);
            return originalMerge(key, localValue, remoteValue);
        };
        window.PegasusCloud.__parkingCurrentFixInstalled = true;
    }

    function patchParkingModule() {
        if (!window.PegasusParking || window.PegasusParking.__currentFixInstalled) return false;

        const originalUpdateUI = window.PegasusParking.updateUI?.bind(window.PegasusParking);
        window.PegasusParking.updateUI = function() {
            const healed = ensureCurrentMatchesHistory('parking-ui-heal');
            const output = originalUpdateUI ? originalUpdateUI() : undefined;
            if (healed.changed) {
                console.log('📍 PEGASUS PARKING FIX: Current parking healed from history top.');
                scheduleHealPush();
            }
            return output;
        };

        window.PegasusParking.save = async function() {
            const inputEl = document.getElementById('parkingInput');
            const location = inputEl ? inputEl.value.trim() : '';
            if (!location) return;

            localStorage.setItem(LOC_KEY, stringifyParkingPayload(formatParkingPayload(location, 'parking-save')));

            let history = [];
            try { history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch (e) { history = []; }
            if (!Array.isArray(history)) history = [];
            history = history.map(item => String(item || '').trim()).filter(Boolean);
            history = history.filter(item => item !== location);
            history.unshift(location);
            if (history.length > 10) history = history.slice(0, 10);
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

            try { window.PegasusParking.renderHistory?.(); } catch (e) {}
            try { originalUpdateUI?.(); } catch (e) {}

            if (window.PegasusCloud?.push) {
                if (typeof setSyncStatus === 'function') setSyncStatus('ΑΠΟΣΤΟΛΗ...');
                await window.PegasusCloud.push();
                if (typeof setSyncStatus === 'function') setSyncStatus('online');
            }

            if (inputEl) inputEl.value = '';
            if (typeof openView === 'function') openView('home');
        };

        window.PegasusParking.ensureCurrentMatchesHistory = ensureCurrentMatchesHistory;
        window.PegasusParking.__currentFixInstalled = true;
        console.log('📍 PEGASUS PARKING FIX: Current parking sync alignment active.');
        return true;
    }

    function install() {
        patchCloudMerge();
        patchParkingModule();
        const healed = ensureCurrentMatchesHistory('parking-boot-heal');
        if (healed.changed) scheduleHealPush();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', install, { once: true });
    } else {
        install();
    }

    window.addEventListener('pegasus_sync_complete', () => {
        const healed = ensureCurrentMatchesHistory('parking-sync-heal');
        if (healed.changed) scheduleHealPush();
    });
})();
