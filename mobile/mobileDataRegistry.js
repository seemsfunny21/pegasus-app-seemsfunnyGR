(function initPegasusMobileDataRegistry() {
    const INTERNAL_KEYS = {
        lastVersion: 'pegasus_mobile_last_engine_version',
        latestBackup: 'pegasus_mobile_upgrade_backup_latest_v1',
        previousBackup: 'pegasus_mobile_upgrade_backup_prev_v1',
        olderBackup: 'pegasus_mobile_upgrade_backup_older_v1',
        latestMeta: 'pegasus_mobile_upgrade_backup_latest_meta_v1',
        previousMeta: 'pegasus_mobile_upgrade_backup_prev_meta_v1',
        olderMeta: 'pegasus_mobile_upgrade_backup_older_meta_v1',
        state: 'pegasus_mobile_data_registry_state_v1'
    };

    const PREFIX_REGISTRY = {
        general: [
            'pegasus_mobile_deleted_routine_'
        ],
        protected: [],
        backupOnly: []
    };

    const REGISTRY = [
        {
            key: 'pegasus_finance_v1',
            scope: 'general',
            kind: 'array',
            defaultValue: [],
            idFields: ['id'],
            timestampFields: ['id']
        },
        {
            key: 'pegasus_maintenance_v1',
            scope: 'general',
            kind: 'array',
            defaultValue: [],
            idFields: ['id'],
            timestampFields: ['lastDone', 'id']
        },
        {
            key: 'pegasus_movies_v1',
            scope: 'general',
            kind: 'array',
            defaultValue: [],
            idFields: ['id'],
            timestampFields: ['id'],
            fallbackFields: ['title']
        },
        {
            key: 'pegasus_missions_v1',
            scope: 'general',
            kind: 'array',
            defaultValue: [],
            idFields: ['id'],
            timestampFields: ['id'],
            fallbackFields: ['title']
        },
        {
            key: 'pegasus_missions_date',
            scope: 'general',
            kind: 'string',
            defaultValue: ''
        },
        {
            key: 'pegasus_biometrics_v1',
            scope: 'general',
            kind: 'array',
            defaultValue: [],
            idFields: ['id'],
            timestampFields: ['date', 'id'],
            fallbackFields: ['date']
        },
        {
            key: 'pegasus_supplies_v1',
            scope: 'general',
            kind: 'array',
            defaultValue: [],
            idFields: ['id'],
            timestampFields: ['id'],
            fallbackFields: ['label']
        },
        {
            key: 'pegasus_supplies_last_sync',
            scope: 'general',
            kind: 'string',
            defaultValue: ''
        },
        {
            key: 'pegasus_social_v1',
            scope: 'protected',
            kind: 'array',
            defaultValue: [],
            idFields: ['id'],
            timestampFields: ['lastUpdated', 'id'],
            fallbackFields: ['name']
        },
        {
            key: 'pegasus_lifting_v1',
            scope: 'general',
            kind: 'array',
            defaultValue: [],
            idFields: ['id'],
            timestampFields: ['timestamp', 'id'],
            fallbackFields: ['exercise', 'date']
        },
        {
            key: 'pegasus_youtube_v1',
            scope: 'general',
            kind: 'array',
            defaultValue: [],
            idFields: ['id'],
            timestampFields: ['id'],
            fallbackFields: ['url']
        },
        {
            key: 'pegasus_user_specs',
            scope: 'local-only',
            kind: 'object',
            defaultValue: {}
        },
        {
            key: 'pegasus_notes',
            scope: 'general',
            kind: 'array',
            defaultValue: [],
            idFields: ['d', 't']
        },
        {
            key: 'pegasus_car_identity',
            scope: 'local-only',
            kind: 'object',
            defaultValue: {}
        },
        {
            key: 'pegasus_car_dates',
            scope: 'local-only',
            kind: 'object',
            defaultValue: {}
        },
        {
            key: 'pegasus_car_specs',
            scope: 'local-only',
            kind: 'object',
            defaultValue: {}
        },
        {
            key: 'pegasus_master_pin',
            scope: 'local-only',
            kind: 'string',
            defaultValue: ''
        },
        {
            key: 'pegasus_supp_inventory',
            scope: 'general',
            kind: 'object',
            defaultValue: { prot: 2500, crea: 1000 }
        },
        {
            key: 'pegasus_parking_loc',
            scope: 'general',
            kind: 'object',
            defaultValue: {}
        },
        {
            key: 'pegasus_parking_history',
            scope: 'general',
            kind: 'array',
            defaultValue: [],
            idFields: ['lat', 'lng', 'ts'],
            timestampFields: ['ts']
        }
    ];

    function cloneDefault(value) {
        if (Array.isArray(value) || (value && typeof value === 'object')) {
            return JSON.parse(JSON.stringify(value));
        }
        return value;
    }

    function getDescriptor(key) {
        return REGISTRY.find(item => item.key === key) || null;
    }

    function safeJsonParse(raw, fallback) {
        if (raw == null || raw === '') return cloneDefault(fallback);
        try {
            const parsed = JSON.parse(raw);
            return (parsed === undefined || parsed === null) ? cloneDefault(fallback) : parsed;
        } catch (e) {
            return cloneDefault(fallback);
        }
    }

    function normalizeStringValue(raw, fallback = '') {
        if (raw == null) return String(fallback || '');
        return String(raw);
    }

    function normalizeParsedValue(descriptor, parsedValue) {
        if (!descriptor) return parsedValue;

        if (descriptor.kind === 'array') {
            return Array.isArray(parsedValue) ? parsedValue : cloneDefault(descriptor.defaultValue || []);
        }

        if (descriptor.kind === 'object') {
            return (parsedValue && typeof parsedValue === 'object' && !Array.isArray(parsedValue))
                ? parsedValue
                : cloneDefault(descriptor.defaultValue || {});
        }

        if (descriptor.kind === 'string') {
            return normalizeStringValue(parsedValue, descriptor.defaultValue || '');
        }

        return parsedValue;
    }

    function parseManagedRaw(key, rawValue) {
        const descriptor = getDescriptor(key);
        if (!descriptor) return rawValue;
        if (descriptor.kind === 'string') return normalizeStringValue(rawValue, descriptor.defaultValue || '');
        return normalizeParsedValue(descriptor, safeJsonParse(rawValue, descriptor.defaultValue));
    }

    function stringifyManagedValue(key, parsedValue) {
        const descriptor = getDescriptor(key);
        if (!descriptor) {
            return typeof parsedValue === 'string' ? parsedValue : JSON.stringify(parsedValue);
        }
        if (descriptor.kind === 'string') return normalizeStringValue(parsedValue, descriptor.defaultValue || '');
        return JSON.stringify(normalizeParsedValue(descriptor, parsedValue));
    }

    function getTimestampScore(item, descriptor) {
        if (!item || typeof item !== 'object') return 0;
        const fields = Array.isArray(descriptor?.timestampFields) ? descriptor.timestampFields : [];
        let best = 0;
        for (const field of fields) {
            const value = item[field];
            if (typeof value === 'number' && isFinite(value)) {
                best = Math.max(best, value);
                continue;
            }
            if (typeof value === 'string') {
                const numeric = parseFloat(value);
                if (isFinite(numeric)) best = Math.max(best, numeric);
                const dateTs = Date.parse(value);
                if (isFinite(dateTs)) best = Math.max(best, dateTs);
            }
        }
        return best;
    }

    function getCompletenessScore(item) {
        if (!item || typeof item !== 'object') return 0;
        let score = 0;
        Object.values(item).forEach(value => {
            if (value === null || value === undefined) return;
            if (typeof value === 'string' && value.trim() === '') return;
            if (Array.isArray(value) && value.length === 0) return;
            if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return;
            score += 1;
        });
        return score;
    }

    function getIdentityFromItem(item, descriptor) {
        if (item == null) return '';
        if (typeof item !== 'object') return String(item);

        const fieldGroups = [
            descriptor?.idFields || [],
            descriptor?.fallbackFields || [],
            ['id'],
            ['url'],
            ['name'],
            ['title'],
            ['label'],
            ['exercise', 'date'],
            ['desc', 'date'],
            ['d', 't']
        ];

        for (const fields of fieldGroups) {
            if (!Array.isArray(fields) || !fields.length) continue;
            const values = fields
                .map(field => item[field])
                .filter(value => value !== undefined && value !== null && String(value).trim() !== '');
            if (values.length === fields.length && values.length > 0) {
                return fields.map((field, idx) => `${field}:${String(values[idx]).trim()}`).join('|');
            }
        }

        try {
            return JSON.stringify(item);
        } catch (e) {
            return String(item);
        }
    }

    function choosePreferredItem(existing, incoming, descriptor) {
        const existingTs = getTimestampScore(existing, descriptor);
        const incomingTs = getTimestampScore(incoming, descriptor);

        if (incomingTs && (!existingTs || incomingTs > existingTs)) return incoming;
        if (existingTs && (!incomingTs || existingTs > incomingTs)) return existing;

        const existingScore = getCompletenessScore(existing);
        const incomingScore = getCompletenessScore(incoming);
        if (incomingScore > existingScore) return incoming;
        if (existingScore > incomingScore) return existing;

        return incoming;
    }

    function mergeArrayValues(localValue, remoteValue, descriptor) {
        const local = Array.isArray(localValue) ? localValue : [];
        const remote = Array.isArray(remoteValue) ? remoteValue : [];
        const merged = new Map();

        const ingest = (items) => {
            items.forEach(item => {
                const identity = getIdentityFromItem(item, descriptor);
                if (!merged.has(identity)) {
                    merged.set(identity, item);
                } else {
                    merged.set(identity, choosePreferredItem(merged.get(identity), item, descriptor));
                }
            });
        };

        ingest(remote);
        ingest(local);

        const output = Array.from(merged.values());
        output.sort((a, b) => getTimestampScore(b, descriptor) - getTimestampScore(a, descriptor));
        return output;
    }

    function mergeObjectValues(localValue, remoteValue) {
        const local = (localValue && typeof localValue === 'object' && !Array.isArray(localValue)) ? localValue : {};
        const remote = (remoteValue && typeof remoteValue === 'object' && !Array.isArray(remoteValue)) ? remoteValue : {};
        return { ...remote, ...local };
    }

    function mergeManagedParsedValue(key, localValue, remoteValue) {
        const descriptor = getDescriptor(key);
        if (!descriptor) return remoteValue;

        if (descriptor.kind === 'array') {
            return mergeArrayValues(localValue, remoteValue, descriptor);
        }

        if (descriptor.kind === 'object') {
            return mergeObjectValues(localValue, remoteValue);
        }

        if (descriptor.kind === 'string') {
            const localText = normalizeStringValue(localValue, descriptor.defaultValue || '').trim();
            const remoteText = normalizeStringValue(remoteValue, descriptor.defaultValue || '').trim();
            return localText || remoteText || descriptor.defaultValue || '';
        }

        return remoteValue;
    }

    function mergeManagedRawValue(key, localRaw, remoteRaw) {
        const descriptor = getDescriptor(key);
        if (!descriptor) return remoteRaw;

        const mergedParsed = mergeManagedParsedValue(
            key,
            parseManagedRaw(key, localRaw),
            parseManagedRaw(key, remoteRaw)
        );

        return stringifyManagedValue(key, mergedParsed);
    }

    function getEngineVersion() {
        return String(
            window.PegasusManifest?.metadata?.engine_version ||
            window.PegasusManifest?.engine_version ||
            'UNKNOWN'
        ).trim();
    }

    function getBackupSnapshotKeys() {
        return [INTERNAL_KEYS.latestBackup, INTERNAL_KEYS.previousBackup, INTERNAL_KEYS.olderBackup];
    }

    function getBackupMetaKeys() {
        return [INTERNAL_KEYS.latestMeta, INTERNAL_KEYS.previousMeta, INTERNAL_KEYS.olderMeta];
    }

    function computeSimpleHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
        }
        return String(hash >>> 0);
    }

    function getBackupCandidateKeys() {
        const keys = new Set(REGISTRY.map(item => item.key));
        PREFIX_REGISTRY.general.forEach(prefix => {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) keys.add(key);
            }
        });
        return Array.from(keys);
    }

    function collectSafetySnapshot() {
        const payload = {};
        getBackupCandidateKeys().forEach(key => {
            const value = localStorage.getItem(key);
            if (value == null) return;
            payload[key] = value;
        });
        return payload;
    }

    function rotateBackupSlots(snapshotStr, metaStr) {
        const snapshotKeys = getBackupSnapshotKeys();
        const metaKeys = getBackupMetaKeys();

        for (let i = snapshotKeys.length - 1; i > 0; i--) {
            const prevSnapshot = localStorage.getItem(snapshotKeys[i - 1]);
            const prevMeta = localStorage.getItem(metaKeys[i - 1]);
            if (prevSnapshot != null) localStorage.setItem(snapshotKeys[i], prevSnapshot);
            if (prevMeta != null) localStorage.setItem(metaKeys[i], prevMeta);
        }

        localStorage.setItem(snapshotKeys[0], snapshotStr);
        localStorage.setItem(metaKeys[0], metaStr);
    }

    function getLatestBackupSnapshot() {
        const raw = localStorage.getItem(INTERNAL_KEYS.latestBackup);
        return safeJsonParse(raw, {});
    }

    const registryApi = {
        version: '1.0',
        internalKeys: INTERNAL_KEYS,
        entries: REGISTRY.slice(),
        prefixRegistry: PREFIX_REGISTRY,
        lastSnapshotHash: '',
        lastSnapshotTs: 0,
        lastBootstrapState: null,

        getDescriptor,
        parseManagedRaw,
        stringifyManagedValue,
        mergeManagedRawValue,

        getExactKeysByScope(scope) {
            return REGISTRY.filter(item => item.scope === scope).map(item => item.key);
        },

        getGeneralExactKeys() {
            return this.getExactKeysByScope('general');
        },

        getProtectedExactKeys() {
            return this.getExactKeysByScope('protected');
        },

        getLocalOnlyExactKeys() {
            return this.getExactKeysByScope('local-only');
        },

        getGeneralPrefixes() {
            return PREFIX_REGISTRY.general.slice();
        },

        getProtectedPrefixes() {
            return PREFIX_REGISTRY.protected.slice();
        },

        getInternalKeys() {
            return Object.values(INTERNAL_KEYS);
        },

        shouldPreserveOnMissing(key) {
            const descriptor = getDescriptor(key);
            return !!descriptor;
        },

        hasBackups() {
            return !!localStorage.getItem(INTERNAL_KEYS.latestBackup);
        },

        getLatestBackupMeta() {
            return safeJsonParse(localStorage.getItem(INTERNAL_KEYS.latestMeta), null);
        },

        saveSafetySnapshot(reason = 'manual', options = {}) {
            const force = options.force === true;
            const minIntervalMs = Number(options.minIntervalMs || 20000);
            const now = Date.now();
            const snapshot = collectSafetySnapshot();
            const snapshotStr = JSON.stringify(snapshot);
            const snapshotHash = computeSimpleHash(snapshotStr);

            if (!force) {
                if (snapshotHash === this.lastSnapshotHash) return false;
                if ((now - this.lastSnapshotTs) < minIntervalMs) return false;
            }

            const meta = {
                reason,
                capturedAt: new Date(now).toISOString(),
                engineVersion: getEngineVersion(),
                keyCount: Object.keys(snapshot).length,
                hash: snapshotHash
            };

            rotateBackupSlots(snapshotStr, JSON.stringify(meta));
            this.lastSnapshotHash = snapshotHash;
            this.lastSnapshotTs = now;

            return meta;
        },

        restoreMissingFromBackups() {
            const snapshots = getBackupSnapshotKeys()
                .map(key => safeJsonParse(localStorage.getItem(key), null))
                .filter(value => value && typeof value === 'object' && !Array.isArray(value));

            if (!snapshots.length) return [];

            const restoredKeys = [];
            const candidates = getBackupCandidateKeys();

            candidates.forEach(key => {
                const descriptor = getDescriptor(key);
                const currentRaw = localStorage.getItem(key);
                const isMissing = currentRaw == null || currentRaw === '';
                let isInvalid = false;

                if (!isMissing && descriptor) {
                    const parsed = parseManagedRaw(key, currentRaw);
                    if (descriptor.kind === 'array' && !Array.isArray(parsed)) isInvalid = true;
                    if (descriptor.kind === 'object' && (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))) isInvalid = true;
                }

                if (!isMissing && !isInvalid) return;

                for (const snapshot of snapshots) {
                    if (typeof snapshot[key] !== 'string' || snapshot[key] === '') continue;
                    localStorage.setItem(key, snapshot[key]);
                    restoredKeys.push(key);
                    break;
                }
            });

            return Array.from(new Set(restoredKeys));
        },

        bootstrap() {
            const previousVersion = String(localStorage.getItem(INTERNAL_KEYS.lastVersion) || '').trim();
            const currentVersion = getEngineVersion();
            const restoredKeys = this.restoreMissingFromBackups();
            const needsVersionSnapshot = previousVersion !== currentVersion || !this.hasBackups();
            const snapshotMeta = this.saveSafetySnapshot(
                needsVersionSnapshot
                    ? (previousVersion ? `upgrade-guard:${previousVersion}→${currentVersion}` : `baseline:${currentVersion}`)
                    : 'boot-refresh',
                { force: needsVersionSnapshot, minIntervalMs: 0 }
            );

            localStorage.setItem(INTERNAL_KEYS.lastVersion, currentVersion);

            const state = {
                ok: true,
                currentVersion,
                previousVersion,
                restoredKeys,
                snapshotMeta,
                protectedKeys: this.getProtectedExactKeys(),
                generalKeys: this.getGeneralExactKeys(),
                localOnlyKeys: this.getLocalOnlyExactKeys()
            };

            this.lastBootstrapState = state;
            localStorage.setItem(INTERNAL_KEYS.state, JSON.stringify(state));
            return state;
        }
    };

    window.PegasusMobileDataRegistry = registryApi;
})();
