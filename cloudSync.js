/* ==========================================================================
   PEGASUS CLOUD VAULT - SINGLE USER SECURE SYNC (v22.0)
   STATUS: SINGLE-USER | LOCAL-ONLY PRIVATES | DAILY 07:00 LOCK | OFFLINE QUEUE
   ========================================================================== */

const PegasusCloud = {
    config: {
        binId: "69b6757ab7ec241ddc6d7230",
        encryptedPart: "$2a$10$oU/TyQjSeNEVr/k5dnFS8ulKZkbb9gUWd5xuXijAYFCBijuXrYAFC",
        syncThrottle: 2000,
        pullInterval: 30000,
        dailyUnlockHour: 7,
        cryptoIterations: 120000
    },

    storage: {
        lastPush: "pegasus_last_push",
        validUntil: "pegasus_vault_valid_until",
        masterHash: "pegasus_vault_master_hash",
        wrappedMaster: "pegasus_vault_master_wrapped",
        deviceSecret: "pegasus_vault_device_secret",
        pendingQueue: "pegasus_cloud_pending_v1",
        localPinHash: "pegasus_vault_pin_hash_local",
        approvedDevice: "pegasus_device_approved",
        desktopApproved: "pegasus_desktop_device_approved",
        legacyPin: "pegasus_vault_pin",
        legacyTime: "pegasus_vault_time",
        geminiKey: "pegasus_gemini_key",
        openaiKey: "pegasus_openai_key",
        openrouterKey: "pegasus_openrouter_key",
        protectedContactsState: "pegasus_protected_contacts_state",
        protectedContactsRepair: "pegasus_protected_contacts_repair"
    },

    isUnlocked: false,
    hasSuccessfullyPulled: false,
    isPulling: false,
    isPushing: false,
    isApplyingRemote: false,

    userKey: "",
    masterKey: "",
    syncInterval: null,
    pushTimeout: null,
    lastPushTs: null,
    lastUiRefreshTs: 0,
    lastStatus: null,
    restorePromise: null,
    hasApprovedRestoreCompleted: false,

    engine: null,

    attachEngine(engineInstance) {
        if (!engineInstance) return;
        this.engine = engineInstance;
        console.log("🧠 CLOUD: Engine attached");
    },

    traceStep(moduleName, action, status, extra) {
        try { window.PegasusRuntimeMonitor?.trace?.(moduleName, action, status, extra); } catch (_) {}
    },

    traceError(moduleName, action, error, extra) {
        try { window.PegasusRuntimeMonitor?.capture?.(moduleName, action, error, extra); } catch (_) {}
    },

    getTodayKey() {
        const d = new Date();
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    },

    getNextUnlockTs() {
        const now = new Date();
        const next = new Date(now);
        next.setHours(this.config.dailyUnlockHour, 0, 0, 0);

        if (now.getTime() >= next.getTime()) {
            next.setDate(next.getDate() + 1);
        }

        return next.getTime();
    },

    hasValidSession() {
        const validUntil = parseInt(localStorage.getItem(this.storage.validUntil) || "0", 10);
        return Number.isFinite(validUntil) && validUntil > Date.now();
    },

    canAutoUnlock() {
        return this.hasValidSession() && !!localStorage.getItem(this.storage.wrappedMaster);
    },

    hasApprovedDevice() {
        return String(localStorage.getItem(this.storage.approvedDevice) || localStorage.getItem(this.storage.desktopApproved) || "") === "1";
    },

    markApprovedDevice() {
        this.safeSetLocal(this.storage.approvedDevice, "1");
        this.safeSetLocal(this.storage.desktopApproved, "1");
    },

    getProtectedContactsSignature(envelope) {
        if (!envelope || typeof envelope !== "object") return "";
        const data = String(envelope?.data || "");
        return [
            String(envelope?.iv || ""),
            String(envelope?.salt || ""),
            String(data.length),
            String(data.slice(0, 32))
        ].join("|");
    },

    hasLocalProtectedStorage() {
        return this.getLocalManagedKeys({ includeProtected: true }).some(key => this.isProtectedStorageKey(key));
    },

    hasProtectedRepairPending() {
        return String(localStorage.getItem(this.storage.protectedContactsRepair) || "") === "1";
    },

    markProtectedRepairPending() {
        this.safeSetLocal(this.storage.protectedContactsRepair, "1");
    },

    clearProtectedRepairPending() {
        this.safeRemoveLocal(this.storage.protectedContactsRepair);
    },

    markProtectedContactsUnavailable(envelope) {
        const marker = {
            sig: this.getProtectedContactsSignature(envelope),
            masterHash: String(localStorage.getItem(this.storage.masterHash) || ""),
            at: Date.now()
        };
        this.safeSetLocal(this.storage.protectedContactsState, JSON.stringify(marker));
        if (this.hasLocalProtectedStorage()) {
            this.markProtectedRepairPending();
        }
    },

    clearProtectedContactsUnavailable() {
        this.safeRemoveLocal(this.storage.protectedContactsState);
        this.clearProtectedRepairPending();
    },

    shouldSkipProtectedContactsDecrypt(envelope) {
        try {
            const raw = localStorage.getItem(this.storage.protectedContactsState);
            if (!raw) return false;
            const marker = JSON.parse(raw);
            if (!marker || typeof marker !== "object") return false;
            const currentMasterHash = String(localStorage.getItem(this.storage.masterHash) || "");
            if (!currentMasterHash || marker.masterHash !== currentMasterHash) return false;
            return marker.sig && marker.sig === this.getProtectedContactsSignature(envelope);
        } catch (e) {
            return false;
        }
    },


    needsPinBindingRepair() {
        const localPinHash = String(localStorage.getItem(this.storage.localPinHash) || '').trim();
        return this.hasApprovedDevice() && !localPinHash;
    },

    canRestoreApprovedDevice() {
        const hasMaterials = !!localStorage.getItem(this.storage.wrappedMaster) && !!localStorage.getItem(this.storage.deviceSecret);
        if (!hasMaterials) return false;
        return this.hasApprovedDevice() || this.hasValidSession() || !!localStorage.getItem(this.storage.localPinHash);
    },

    getSyncedExactKeys() {
        return [
            "pegasus_weight",
            "pegasus_weight_history",
            "pegasus_age",
            "pegasus_height",
            "pegasus_gender",
            "pegasus_language",
            "pegasus_lang",
            "pegasus_weekly_history",
            "pegasus_workouts_done",
            "pegasus_total_workouts",
            "pegasus_active_plan",
            "pegasus_muscle_targets",
            "pegasus_calendar_history",
            "pegasus_exercise_weights",
            "pegasus_ex_time",
            "pegasus_rest_time",
            "pegasus_weekly_kcal",
            "pegasus_session_kcal",
            "pegasus_supp_inventory",
            "pegasus_food_library",
            "pegasus_today_kcal",
            "pegasus_today_protein",
            "pegasus_cardio_history",
            "pegasus_daily_progress",
            "pegasus_notes",
            "pegasus_partners_list",
            "pegasus_finance_v1",
            "pegasus_maintenance_v1",
            "pegasus_movies_v1",
            "pegasus_missions_v1",
            "pegasus_biometrics_v1",
            "pegasus_supplies_v1",
            "pegasus_morning_checkin",
            "pegasus_stats",
            "pegasus_goal_protein",
            "pegasus_weather_code",
            "pegasus_mute_state",
            "pegasus_turbo_state",
            "pegasus_last_reset",
            "pegasus_command_trace",
            "pegasus_car_service",
            "peg_car_service",
            "pegasus_parking_loc",
            "pegasus_parking_history",
            "kouki_agreement_log",
            "kouki_meals_total",
            "kouki_meals_remaining",
            "kouki_total_stock"
        ];
    },

    getSyncedPrefixes() {
        return [
            "food_log_",
            "pegasus_cardio_kcal_",
            "pegasus_cardio_offset_sets_",
            "weight_",
            "pegasus_routine_injected_",
            "pegasus_history_",
            "pegasus_day_status_",
            "pegasus_pos_",
            "cardio_log_"
        ];
    },

    getProtectedExactKeys() {
        return [
            "pegasus_social_v1",
            "pegasus_contacts"
        ];
    },

    getLocalOnlyKeys() {
        return [
            "pegasus_user_specs",
            "pegasus_car_identity",
            "pegasus_car_dates",
            "pegasus_car_specs",
            "peg_car_dates",
            "pegasus_master_pin"
        ];
    },

    getInternalStorageKeys() {
        return [
            this.storage.lastPush,
            this.storage.validUntil,
            this.storage.masterHash,
            this.storage.wrappedMaster,
            this.storage.deviceSecret,
            this.storage.pendingQueue,
            this.storage.localPinHash,
            this.storage.protectedContactsState,
            this.storage.protectedContactsRepair,
            this.storage.legacyPin,
            this.storage.legacyTime,
            this.storage.geminiKey,
            this.storage.openaiKey,
            this.storage.openrouterKey
        ];
    },

    isInternalStorageKey(key) {
        if (!key) return false;
        return this.getInternalStorageKeys().includes(key);
    },

    isLocalOnlyStorageKey(key) {
        if (!key) return false;
        return this.getLocalOnlyKeys().includes(key);
    },

    isProtectedStorageKey(key) {
        if (!key) return false;
        return this.getProtectedExactKeys().includes(key);
    },

    isSensitiveStorageKey(key) {
        if (!key) return false;
        if (this.isInternalStorageKey(key)) return true;
        if (this.isLocalOnlyStorageKey(key)) return true;
        return /(vault|token|secret|api[_-]?key|gemini[_-]?key|master[_-]?key)/i.test(key);
    },

    isGeneralStorageKey(key) {
        if (!key) return false;
        if (this.isSensitiveStorageKey(key)) return false;
        if (this.getSyncedExactKeys().includes(key)) return true;
        return this.getSyncedPrefixes().some(prefix => key.startsWith(prefix));
    },

    isAllowedStorageKey(key) {
        if (!key) return false;
        if (this.isGeneralStorageKey(key)) return true;
        return this.isProtectedStorageKey(key);
    },

    isExportBlockedKey(key) {
        if (!key) return true;
        if (this.isInternalStorageKey(key)) return true;
        if (this.isLocalOnlyStorageKey(key)) return true;
        if (this.isProtectedStorageKey(key)) return true;
        return false;
    },

    getApprovalPinHash(record) {
        if (!record || typeof record !== "object") return "";
        return String(record?.approval?.pin_hash || record?.pin_hash || "").trim();
    },

    getApprovalMasterHash(record) {
        if (!record || typeof record !== "object") return "";
        return String(record?.approval?.master_hash || record?.master_hash || "").trim();
    },

    emitSyncStatus(status, force = false) {
        if (typeof window === "undefined") return;
        if (!status) return;

        if (!force && this.lastStatus === status) return;
        this.lastStatus = status;

        window.dispatchEvent(new CustomEvent("pegasus_sync_status", {
            detail: { status }
        }));
    },

    safeSetLocal(key, value) {
        const normalized = (typeof value === "string") ? value : JSON.stringify(value);
        if (window.originalSetItem) {
            window.originalSetItem.call(localStorage, key, normalized);
        } else {
            localStorage.setItem(key, normalized);
        }
    },

    safeRemoveLocal(key) {
        if (window.originalRemoveItem) {
            window.originalRemoveItem.call(localStorage, key);
        } else {
            localStorage.removeItem(key);
        }
    },

    safeCall(fn) {
        try {
            if (typeof fn === "function") fn();
        } catch (e) {
            console.warn("⚠️ UI SAFE CALL ERROR:", e);
        }
    },

    async hashString(value) {
        const input = String(value || "");

        try {
            if (globalThis.crypto?.subtle && typeof TextEncoder !== "undefined") {
                const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
                return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
            }
        } catch (e) {
            console.warn("⚠️ CLOUD: subtle hash fallback.", e);
        }

        let hash = 5381;
        for (let i = 0; i < input.length; i++) {
            hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
        }
        return `fallback_${(hash >>> 0).toString(16)}`;
    },

    async matchesStoredMasterKey(masterKey) {
        const clean = String(masterKey || "").trim();
        if (!clean) return false;

        const storedHash = localStorage.getItem(this.storage.masterHash);
        if (!storedHash) return true;

        const incomingHash = await this.hashString(clean);
        return storedHash === incomingHash;
    },

    async fetchLatestRecord() {
        const effectiveKey = this.userKey || this.config.encryptedPart;
        const res = await fetch(
            `https://api.jsonbin.io/v3/b/${this.config.binId}/latest?nocache=${Date.now()}`,
            {
                headers: {
                    "X-Master-Key": effectiveKey,
                    "X-Bin-Meta": "false"
                }
            }
        );

        if (!res.ok) throw new Error("Fetch latest failed");

        const data = await res.json();
        return data.record || data;
    },

    normalizeEngineEvent(event) {
        if (!event) return null;

        const raw = (event.action && !event.type) ? event.action : event;
        if (!raw || typeof raw !== "object") return null;
        if (!raw.type) return null;

        const normalized = { ...raw };

        if (typeof raw.__ts === "number") {
            normalized.__ts = raw.__ts;
        } else if (typeof event.__ts === "number") {
            normalized.__ts = event.__ts;
        } else if (typeof event.time === "number") {
            normalized.__ts = event.time;
        }

        return normalized;
    },

    getEventHash(event) {
        const normalized = this.normalizeEngineEvent(event);
        if (!normalized) return "";

        const hashable = { ...normalized };
        delete hashable.__ts;

        try {
            return JSON.stringify(hashable);
        } catch (e) {
            return "";
        }
    },

    getBoundedEvents() {
        const events = this.engine?.getEventBuffer?.() || [];
        if (!Array.isArray(events)) return [];

        return events
            .map(ev => this.normalizeEngineEvent(ev))
            .filter(Boolean)
            .slice(-100);
    },

    async validatePin(pin, cloudRecord = null) {
        const clean = String(pin || "").trim();
        if (!clean || clean.length < 4) return false;

        const candidateHash = await this.hashString(clean);
        const remoteHash = this.getApprovalPinHash(cloudRecord);
        const localHash = String(localStorage.getItem(this.storage.localPinHash) || "").trim();

        if (remoteHash && remoteHash === candidateHash) return true;
        if (localHash && localHash === candidateHash) return true;

        return false;
    },

    async canSecureRebindPinWithMaster(masterKey, cloudRecord = null) {
        const cleanMaster = String(masterKey || "").trim();
        if (!cleanMaster || !cloudRecord) return false;

        const prevMaster = this.masterKey;

        try {
            const candidateMasterHash = await this.hashString(cleanMaster);
            const remoteMasterHash = this.getApprovalMasterHash(cloudRecord);
            if (remoteMasterHash && candidateMasterHash === remoteMasterHash) {
                return true;
            }

            this.masterKey = cleanMaster;

            if (cloudRecord?.protected?.contacts) {
                await this.decryptCloudPayload(cloudRecord.protected.contacts);
                return true;
            }

            if (cloudRecord?.__pegasus_secure_v1 && cloudRecord?.secure_payload) {
                await this.decryptCloudPayload(cloudRecord.secure_payload);
                return true;
            }

            if (this.hasApprovedDevice()) {
                return await this.matchesStoredMasterKey(cleanMaster);
            }

            return false;
        } catch (e) {
            return false;
        } finally {
            this.masterKey = prevMaster;
        }
    },

    loadPendingChanges() {
        try {
            const raw = localStorage.getItem(this.storage.pendingQueue);
            const parsed = raw ? JSON.parse(raw) : {};
            return (parsed && typeof parsed === "object") ? parsed : {};
        } catch (e) {
            return {};
        }
    },

    savePendingChanges(queue) {
        const normalized = (queue && typeof queue === "object") ? queue : {};
        this.safeSetLocal(this.storage.pendingQueue, JSON.stringify(normalized));
    },

    hasPendingChanges() {
        return Object.keys(this.loadPendingChanges()).length > 0;
    },

    queuePendingChange(key, value, type = "set") {
        if (!this.isAllowedStorageKey(key)) return;

        const queue = this.loadPendingChanges();
        queue[key] = {
            type,
            value: type === "set" ? String(value) : null,
            ts: Date.now()
        };
        this.savePendingChanges(queue);
    },

    clearPendingChanges() {
        this.savePendingChanges({});
    },

    pruneStalePendingChanges(remoteTs) {
        const queue = this.loadPendingChanges();
        if (!queue || typeof queue !== "object") return false;

        const remoteMillis = Number(remoteTs);
        if (!Number.isFinite(remoteMillis) || remoteMillis <= 0) return false;

        let changed = false;
        for (const [key, entry] of Object.entries(queue)) {
            const entryTs = Number(entry?.ts || 0);
            if (Number.isFinite(entryTs) && entryTs > 0 && entryTs <= remoteMillis) {
                delete queue[key];
                changed = true;
            }
        }

        if (changed) {
            this.savePendingChanges(queue);
        }

        return changed;
    },

    applyPendingChangesToLocal() {
        const queue = this.loadPendingChanges();
        const entries = Object.entries(queue);
        if (!entries.length) return false;

        this.isApplyingRemote = true;
        try {
            for (const [key, entry] of entries) {
                if (!this.isAllowedStorageKey(key)) continue;

                if (entry?.type === "remove") {
                    this.safeRemoveLocal(key);
                } else if (typeof entry?.value === "string") {
                    this.safeSetLocal(key, entry.value);
                }
            }
        } finally {
            this.isApplyingRemote = false;
        }

        return true;
    },

    getLocalManagedKeys(options = {}) {
        const includeProtected = options.includeProtected !== false;
        const keys = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            if (this.isGeneralStorageKey(key)) {
                keys.push(key);
                continue;
            }
            if (includeProtected && this.isProtectedStorageKey(key)) {
                keys.push(key);
            }
        }

        return keys;
    },

    collectStorageSnapshot(options = {}) {
        const includeProtected = options.includeProtected !== false;
        const general = {};
        const protectedStorage = {};

        for (const key of this.getLocalManagedKeys({ includeProtected })) {
            const value = localStorage.getItem(key);
            if (this.isProtectedStorageKey(key)) {
                protectedStorage[key] = value;
            } else {
                general[key] = value;
            }
        }

        return { general, protectedStorage };
    },

    toBase64(bytes) {
        let binary = "";
        const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
        for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
        return btoa(binary);
    },

    fromBase64(str) {
        const binary = atob(str);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
    },

    randomBytes(length = 16) {
        const bytes = new Uint8Array(length);
        crypto.getRandomValues(bytes);
        return bytes;
    },

    async deriveAesKey(secret, saltBytes, usage = ["encrypt", "decrypt"]) {
        const encoder = new TextEncoder();
        const baseKey = await crypto.subtle.importKey(
            "raw",
            encoder.encode(String(secret || "")),
            "PBKDF2",
            false,
            ["deriveKey"]
        );

        return crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: saltBytes,
                iterations: this.config.cryptoIterations,
                hash: "SHA-256"
            },
            baseKey,
            {
                name: "AES-GCM",
                length: 256
            },
            false,
            usage
        );
    },

    async encryptString(secret, plainText) {
        const encoder = new TextEncoder();
        const iv = this.randomBytes(12);
        const salt = this.randomBytes(16);
        const key = await this.deriveAesKey(secret, salt);
        const cipher = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            key,
            encoder.encode(String(plainText || ""))
        );

        return {
            v: 1,
            salt: this.toBase64(salt),
            iv: this.toBase64(iv),
            data: this.toBase64(new Uint8Array(cipher))
        };
    },

    async decryptString(secret, envelope) {
        if (!envelope?.salt || !envelope?.iv || !envelope?.data) {
            throw new Error("INVALID_ENVELOPE");
        }

        const key = await this.deriveAesKey(secret, this.fromBase64(envelope.salt));
        const plainBuffer = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: this.fromBase64(envelope.iv) },
            key,
            this.fromBase64(envelope.data)
        );

        return new TextDecoder().decode(plainBuffer);
    },

    getOrCreateDeviceSecret() {
        let secret = localStorage.getItem(this.storage.deviceSecret);
        if (secret) return secret;

        secret = this.toBase64(this.randomBytes(32));
        this.safeSetLocal(this.storage.deviceSecret, secret);
        return secret;
    },

    async storeWrappedMaster(masterKey) {
        const secret = this.getOrCreateDeviceSecret();
        const wrapped = await this.encryptString(secret, masterKey);
        this.safeSetLocal(this.storage.wrappedMaster, JSON.stringify(wrapped));
    },

    async getStoredMasterKey() {
        const wrappedRaw = localStorage.getItem(this.storage.wrappedMaster);
        if (!wrappedRaw) return "";

        try {
            const wrapped = JSON.parse(wrappedRaw);
            const secret = this.getOrCreateDeviceSecret();
            return await this.decryptString(secret, wrapped);
        } catch (e) {
            console.warn("⚠️ CLOUD: Wrapped master unavailable.", e);
            return "";
        }
    },

    async encryptCloudPayload(payload) {
        return this.encryptString(this.masterKey, JSON.stringify(payload || {}));
    },

    async decryptCloudPayload(envelope) {
        try {
            const text = await this.decryptString(this.masterKey, envelope);
            return JSON.parse(text || "{}");
        } catch (e) {
            throw new Error("INVALID_MASTER_KEY");
        }
    },

    async extractCloudPayload(cloud) {
        if (cloud?.__pegasus_secure_v1 && cloud?.secure_payload) {
            if (!this.masterKey) {
                throw new Error("INVALID_MASTER_KEY");
            }
            const legacySecure = await this.decryptCloudPayload(cloud.secure_payload);
            return {
                storage: (legacySecure?.storage && typeof legacySecure.storage === "object") ? legacySecure.storage : {},
                protectedStorage: (legacySecure?.protectedStorage && typeof legacySecure.protectedStorage === "object") ? legacySecure.protectedStorage : {},
                events: Array.isArray(legacySecure?.events || cloud?.__events__) ? (legacySecure?.events || cloud.__events__) : [],
                hasProtectedPayload: !!(legacySecure?.protectedStorage && Object.keys(legacySecure.protectedStorage).length)
            };
        }

        const generalStorage = {};
        let protectedStorage = {};
        let hasProtectedPayload = false;

        if (cloud?.__pegasus_plain_v3 && cloud?.storage && typeof cloud.storage === "object") {
            Object.assign(generalStorage, cloud.storage);

            const protectedContacts = cloud?.protected?.contacts;
            if (protectedContacts) {
                hasProtectedPayload = true;
                if (!this.masterKey) {
                    console.warn("⚠️ CLOUD: Protected contacts present but master key is unavailable. Continuing with general storage only.");
                } else if (this.shouldSkipProtectedContactsDecrypt(protectedContacts)) {
                    protectedStorage = {};
                } else {
                    try {
                        const decryptedContacts = await this.decryptCloudPayload(protectedContacts);
                        if (decryptedContacts && typeof decryptedContacts === "object") {
                            protectedStorage = (decryptedContacts.storage && typeof decryptedContacts.storage === "object")
                                ? decryptedContacts.storage
                                : decryptedContacts;
                        }
                        this.clearProtectedContactsUnavailable();
                    } catch (e) {
                        this.markProtectedContactsUnavailable(protectedContacts);
                        if (this.hasLocalProtectedStorage() || this.hasProtectedRepairPending()) {
                            console.warn("⚠️ CLOUD: Protected contacts bucket unavailable for this unlock. Continuing with general storage only.", e);
                        }
                        protectedStorage = {};
                    }
                }
            } else {
                this.clearProtectedContactsUnavailable();
                if (this.hasLocalProtectedStorage()) {
                    this.markProtectedRepairPending();
                }
            }

            return {
                storage: generalStorage,
                protectedStorage,
                events: Array.isArray(cloud?.__events__) ? cloud.__events__ : [],
                hasProtectedPayload
            };
        }

        if (cloud?.__pegasus_plain_v2 && cloud?.storage && typeof cloud.storage === "object") {
            return {
                storage: cloud.storage,
                protectedStorage: {},
                events: Array.isArray(cloud?.__events__) ? cloud.__events__ : [],
                hasProtectedPayload: false
            };
        }

        if (cloud && typeof cloud === "object") {
            for (const key of Object.keys(cloud)) {
                if (this.isGeneralStorageKey(key)) {
                    generalStorage[key] = cloud[key];
                }
            }
        }

        return {
            storage: generalStorage,
            protectedStorage: {},
            events: Array.isArray(cloud?.__events__) ? cloud.__events__ : [],
            hasProtectedPayload: false
        };
    },

    setValidSessionWindow() {
        this.safeSetLocal(this.storage.validUntil, this.getNextUnlockTs().toString());
        this.safeRemoveLocal(this.storage.legacyPin);
        this.safeRemoveLocal(this.storage.legacyTime);
    },

    clearLocalSecurityState(options = {}) {
        const preserveDeviceSecret = options.preserveDeviceSecret === true;
        const preserveWrappedMaster = options.preserveWrappedMaster === true;
        const preserveMasterHash = options.preserveMasterHash !== false;

        this.safeRemoveLocal(this.storage.validUntil);
        this.safeRemoveLocal(this.storage.lastPush);
        this.safeRemoveLocal(this.storage.pendingQueue);
        this.safeRemoveLocal(this.storage.localPinHash);
        this.safeRemoveLocal(this.storage.protectedContactsState);
        this.safeRemoveLocal(this.storage.protectedContactsRepair);
        this.safeRemoveLocal(this.storage.approvedDevice);
        this.safeRemoveLocal(this.storage.desktopApproved);
        this.safeRemoveLocal(this.storage.legacyPin);
        this.safeRemoveLocal(this.storage.legacyTime);

        if (!preserveMasterHash) this.safeRemoveLocal(this.storage.masterHash);
        if (!preserveWrappedMaster) this.safeRemoveLocal(this.storage.wrappedMaster);
        if (!preserveDeviceSecret) this.safeRemoveLocal(this.storage.deviceSecret);

        this.isUnlocked = false;
        this.hasSuccessfullyPulled = false;
        this.masterKey = "";
        this.userKey = "";
        this.restorePromise = null;
        this.hasApprovedRestoreCompleted = false;
        this.emitSyncStatus("locked", true);
    },

    async restoreApprovedDevice(options = {}) {
        this.traceStep("cloudSync", "restoreApprovedDevice", "START", options?.requireValidWindow ? "AUTO" : "APPROVED");
        const opts = {
            requireValidWindow: true,
            logLabel: "Auto-unlocked",
            ...options
        };

        if (this.isUnlocked && this.hasApprovedRestoreCompleted) {
            return true;
        }

        if (this.restorePromise) {
            return this.restorePromise;
        }

        this.restorePromise = (async () => {
            if (opts.requireValidWindow) {
                if (!this.canAutoUnlock()) return false;
            } else {
                if (!this.canRestoreApprovedDevice()) return false;
            }

            const restoredMaster = await this.getStoredMasterKey();
            if (!restoredMaster) return false;

            const prevState = {
                isUnlocked: this.isUnlocked,
                hasSuccessfullyPulled: this.hasSuccessfullyPulled,
                userKey: this.userKey,
                masterKey: this.masterKey,
                hasApprovedRestoreCompleted: this.hasApprovedRestoreCompleted
            };

            this.userKey = this.config.encryptedPart;
            this.isUnlocked = true;
            this.masterKey = restoredMaster;
            this.emitSyncStatus(navigator.onLine ? "syncing" : "offline", true);

            try {
                const repairedMasterHash = await this.hashString(restoredMaster);
                this.safeSetLocal(this.storage.masterHash, repairedMasterHash);
                this.setValidSessionWindow();
                this.markApprovedDevice();

                if (navigator.onLine) {
                    let approvalRecord = null;
                    try {
                        approvalRecord = await this.fetchLatestRecord();
                    } catch (e) {
                        approvalRecord = null;
                    }
                    const remotePinHash = this.getApprovalPinHash(approvalRecord);
                    if (remotePinHash && !localStorage.getItem(this.storage.localPinHash)) {
                        this.safeSetLocal(this.storage.localPinHash, remotePinHash);
                    }
                    await this.pull(true);
                } else {
                    this.hasSuccessfullyPulled = !!localStorage.getItem(this.storage.lastPush);
                }

                this.startAutoSync();

                if (navigator.onLine && (this.hasPendingChanges() || this.hasProtectedRepairPending())) {
                    await this._doPush();
                }

                this.hasApprovedRestoreCompleted = true;
                console.log(`🔓 CLOUD: ${opts.logLabel}`);
                this.emitSyncStatus(navigator.onLine ? "online" : "offline", true);
                return true;
            } catch (e) {
                this.isUnlocked = prevState.isUnlocked;
                this.hasSuccessfullyPulled = prevState.hasSuccessfullyPulled;
                this.userKey = prevState.userKey;
                this.masterKey = prevState.masterKey;
                this.hasApprovedRestoreCompleted = prevState.hasApprovedRestoreCompleted;
                this.emitSyncStatus("locked", true);
                console.warn(`⚠️ CLOUD: ${opts.logLabel} failed.`, e);
                return false;
            } finally {
                this.restorePromise = null;
            }
        })();

        return this.restorePromise;
    },

    async tryAutoUnlock() {
        return this.restoreApprovedDevice({ requireValidWindow: true, logLabel: "Auto-unlocked" });
    },

    async tryApprovedDeviceUnlock() {
        if (this.isUnlocked && this.hasApprovedRestoreCompleted) return true;
        return this.restoreApprovedDevice({ requireValidWindow: false, logLabel: "Approved device restored" });
    },

    /* =========================
       🔓 UNLOCK
    ========================= */
    async unlock(pin, masterKey, options = {}) {
        this.traceStep("cloudSync", "unlock", "START", options?.autoUnlock ? "AUTO" : "MANUAL");
        if (this.isUnlocked) return true;

        const opts = {
            skipPinCheck: false,
            persistSession: true,
            autoUnlock: false,
            deferPostUnlockSync: false,
            ...options
        };

        const cleanPin = String(pin || "").trim();
        const cleanMaster = String(masterKey || "").trim();
        if (!cleanMaster) return false;

        const storedMasterHash = String(localStorage.getItem(this.storage.masterHash) || "").trim();
        const localPinHash = String(localStorage.getItem(this.storage.localPinHash) || "").trim();
        const candidatePinHash = cleanPin ? await this.hashString(cleanPin) : "";
        const candidateMasterHash = await this.hashString(cleanMaster);
        const trustedLocalMaster = storedMasterHash ? (await this.matchesStoredMasterKey(cleanMaster)) : false;
        const storedMasterMatches = storedMasterHash ? trustedLocalMaster : true;
        const fastLocalApproval = !!(opts.deferPostUnlockSync && candidatePinHash && localPinHash && candidatePinHash === localPinHash && trustedLocalMaster);

        const prevUserKey = this.userKey;
        this.userKey = this.config.encryptedPart;

        let cloudRecord = null;
        if (navigator.onLine && !fastLocalApproval) {
            try {
                cloudRecord = await this.fetchLatestRecord();
            } catch (e) {
                console.warn("⚠️ CLOUD: Approval fetch fallback.", e);
            }
        }

        const remotePinHash = this.getApprovalPinHash(cloudRecord);
        const hasBoundPin = !!(remotePinHash || localPinHash);
        let pinAccepted = !!opts.skipPinCheck || fastLocalApproval;

        if (!pinAccepted) {
            pinAccepted = await this.validatePin(cleanPin, cloudRecord);

            const canRepairMissingPinBinding = !pinAccepted
                && !hasBoundPin
                && cleanPin.length >= 4
                && trustedLocalMaster
                && this.hasApprovedDevice();

            const canSecureRebindFreshDevice = !pinAccepted
                && !hasBoundPin
                && cleanPin.length >= 4
                && await this.canSecureRebindPinWithMaster(cleanMaster, cloudRecord);

            const canSecureRebindExistingBinding = !pinAccepted
                && hasBoundPin
                && cleanPin.length >= 4
                && await this.canSecureRebindPinWithMaster(cleanMaster, cloudRecord);

            if (canRepairMissingPinBinding) {
                console.warn("⚠️ CLOUD: Approval PIN binding missing on trusted approved device. Rebinding with current PIN.");
                this.traceStep("cloudSync", "unlock", "REBIND_ALLOWED", "MISSING_PIN_BINDING_APPROVED_DEVICE");
                pinAccepted = true;
            } else if (canSecureRebindFreshDevice) {
                console.warn("⚠️ CLOUD: Fresh-device PIN binding rebuilt from successful master-key validation.");
                const remoteMasterHash = this.getApprovalMasterHash(cloudRecord);
                const rebindReason = remoteMasterHash
                    ? "MISSING_PIN_BINDING_MASTER_HASH"
                    : (cloudRecord ? "MISSING_PIN_BINDING_LEGACY_MIGRATION" : "MISSING_PIN_BINDING_FRESH_MASTER_ONLY");
                this.traceStep("cloudSync", "unlock", "REBIND_ALLOWED", rebindReason);
                pinAccepted = true;
            } else if (canSecureRebindExistingBinding) {
                console.warn("⚠️ CLOUD: Approval PIN mismatch repaired from successful master-key validation. Rebinding with current PIN.");
                this.traceStep("cloudSync", "unlock", "REBIND_ALLOWED", "PIN_MISMATCH_MASTER_HASH");
                pinAccepted = true;
            }
        }

        if (!pinAccepted) {
            this.traceStep("cloudSync", "unlock", "PIN_REJECTED", hasBoundPin ? "PIN_MISMATCH" : "PIN_BINDING_MISSING");
            this.userKey = prevUserKey;
            return false;
        }

        const prevState = {
            isUnlocked: this.isUnlocked,
            hasSuccessfullyPulled: this.hasSuccessfullyPulled,
            userKey: prevUserKey,
            masterKey: this.masterKey
        };

        this.userKey = this.config.encryptedPart;
        this.masterKey = cleanMaster;
        this.isUnlocked = true;
        this.emitSyncStatus(navigator.onLine ? "syncing" : "offline", true);

        let sessionMaterialsPersisted = false;

        try {
            this.safeSetLocal(this.storage.masterHash, candidateMasterHash);
            if (candidatePinHash) {
                this.safeSetLocal(this.storage.localPinHash, candidatePinHash);
            }
            await this.storeWrappedMaster(cleanMaster);
            this.markApprovedDevice();

            if (opts.persistSession) {
                this.setValidSessionWindow();
            }
            sessionMaterialsPersisted = true;

            if (navigator.onLine) {
                if (!fastLocalApproval) {
                    try {
                        await this.pull(true);
                    } catch (e) {
                        if (String(e?.message || "") === "INVALID_MASTER_KEY") {
                            throw e;
                        }
                        console.warn("⚠️ CLOUD: Soft unlock sync error.", e);
                    }
                } else {
                    this.hasSuccessfullyPulled = !!localStorage.getItem(this.storage.lastPush);
                }
            } else {
                this.hasSuccessfullyPulled = !!localStorage.getItem(this.storage.lastPush);
            }

            this.startAutoSync();

            if (navigator.onLine) {
                if (opts.deferPostUnlockSync || fastLocalApproval) {
                    setTimeout(() => {
                        this.syncNow(true).catch(e => console.error("❌ DEFERRED SYNC ERROR:", e));
                    }, 0);
                } else if (this.hasPendingChanges() || this.hasProtectedRepairPending()) {
                    await this._doPush();
                }
            }

            if (!storedMasterMatches) {
                console.warn("⚠️ CLOUD: Stored master hash repaired from successful unlock.");
            }
            this.hasApprovedRestoreCompleted = true;
            console.log(opts.autoUnlock ? "🔓 CLOUD: Auto-unlocked" : "🔓 CLOUD: Unlocked");
            this.traceStep("cloudSync", "unlock", "SUCCESS", opts.autoUnlock ? "AUTO" : "MANUAL");
            this.emitSyncStatus(navigator.onLine ? "online" : "offline", true);
            return true;
        } catch (e) {
            this.isUnlocked = prevState.isUnlocked;
            this.hasSuccessfullyPulled = prevState.hasSuccessfullyPulled;
            this.userKey = prevState.userKey;
            this.masterKey = prevState.masterKey;
            if (String(e?.message || "") === "INVALID_MASTER_KEY" && sessionMaterialsPersisted) {
                this.safeRemoveLocal(this.storage.validUntil);
                this.safeRemoveLocal(this.storage.wrappedMaster);
                if (!storedMasterHash) this.safeRemoveLocal(this.storage.masterHash);
            }
            this.hasApprovedRestoreCompleted = false;
            this.emitSyncStatus("locked", true);
            if (String(e?.message || "") === "INVALID_MASTER_KEY") return false;
            this.traceError("cloudSync", "unlock", e);
            console.error("❌ UNLOCK ERROR:", e);
            return false;
        }
    },

    /* =========================
       📥 PULL (SECURE + QUEUE SAFE)
    ========================= */
    async pull(silent = false) {
        this.traceStep("cloudSync", "pull", "START", silent ? "SILENT" : "VERBOSE");
        if (!this.isUnlocked || this.isPulling) return false;

        if (!navigator.onLine) {
            this.emitSyncStatus("offline", true);
            return false;
        }

        this.isPulling = true;
        this.emitSyncStatus("syncing", true);

        let changed = false;
        let finalStatus = "online";

        try {
            const cloud = await this.fetchLatestRecord();
            const lastLocal = parseInt(localStorage.getItem(this.storage.lastPush) || "0", 10);
            const remoteTs = parseInt(cloud?.last_update_ts || "0", 10);
            let pendingExists = this.hasPendingChanges();

            if (!remoteTs) {
                this.hasSuccessfullyPulled = true;
                if (pendingExists) {
                    this.applyPendingChangesToLocal();
                }
                return false;
            }

            if (remoteTs !== lastLocal) {
                if (remoteTs > lastLocal && pendingExists) {
                    this.pruneStalePendingChanges(remoteTs);
                    pendingExists = this.hasPendingChanges();
                }

                const remotePayload = await this.extractCloudPayload(cloud);
                const remoteStorage = (remotePayload?.storage && typeof remotePayload.storage === "object") ? remotePayload.storage : {};
                const remoteProtectedStorage = (remotePayload?.protectedStorage && typeof remotePayload.protectedStorage === "object") ? remotePayload.protectedStorage : {};
                const remoteEvents = Array.isArray(remotePayload?.events) ? remotePayload.events : [];
                const hasProtectedPayload = remotePayload?.hasProtectedPayload === true;

                console.log("☁️ CLOUD: Syncing latest version...");
                changed = true;

                this.isApplyingRemote = true;
                try {
                    const localGeneralKeys = this.getLocalManagedKeys({ includeProtected: false });
                    const remoteGeneralKeys = new Set(Object.keys(remoteStorage));

                    for (const key of localGeneralKeys) {
                        if (!remoteGeneralKeys.has(key)) {
                            this.safeRemoveLocal(key);
                        }
                    }

                    for (const [key, value] of Object.entries(remoteStorage)) {
                        if (this.isGeneralStorageKey(key)) {
                            this.safeSetLocal(key, value);
                        }
                    }

                    if (hasProtectedPayload) {
                        const localProtectedKeys = this.getLocalManagedKeys({ includeProtected: true }).filter(k => this.isProtectedStorageKey(k));
                        const remoteProtectedKeys = new Set(Object.keys(remoteProtectedStorage));

                        for (const key of localProtectedKeys) {
                            if (!remoteProtectedKeys.has(key)) {
                                this.safeRemoveLocal(key);
                            }
                        }

                        for (const [key, value] of Object.entries(remoteProtectedStorage)) {
                            if (this.isProtectedStorageKey(key)) {
                                this.safeSetLocal(key, value);
                            }
                        }
                    }
                } finally {
                    this.isApplyingRemote = false;
                }

                if (this.engine && remoteEvents.length) {
                    try {
                        const existingBuffer = this.engine.getEventBuffer?.() || [];
                        const existingHashes = new Set(
                            existingBuffer
                                .map(ev => this.getEventHash(ev))
                                .filter(Boolean)
                        );

                        for (const remoteEvent of remoteEvents.slice(-100)) {
                            const normalizedEvent = this.normalizeEngineEvent(remoteEvent);
                            if (!normalizedEvent) continue;

                            const eventHash = this.getEventHash(normalizedEvent);
                            if (!eventHash || existingHashes.has(eventHash)) continue;

                            this.engine.dispatch(normalizedEvent);
                            existingHashes.add(eventHash);
                        }
                    } catch (e) {
                        console.warn("⚠️ ENGINE BRIDGE ERROR:", e);
                    }
                }

                this.safeSetLocal(this.storage.lastPush, remoteTs.toString());
            }

            this.hasSuccessfullyPulled = true;

            if (pendingExists) {
                changed = this.applyPendingChangesToLocal() || changed;
            }

            if (!silent && changed) {
                console.log("📥 CLOUD: Pull OK");
            }

            this.traceStep("cloudSync", "pull", changed ? "CHANGED" : "DONE");
            return changed;
        } catch (e) {
            if (String(e?.message || "") === "INVALID_MASTER_KEY") {
                finalStatus = "locked";
                throw e;
            }

            this.traceError("cloudSync", "pull", e);
            console.error("❌ PULL ERROR:", e);
            finalStatus = navigator.onLine ? "error" : "offline";
            return false;
        } finally {
            this.isPulling = false;

            if (changed) {
                setTimeout(() => {
                    this.triggerUIUpdate();
                }, 0);
            }

            this.emitSyncStatus(finalStatus, true);
        }
    },

    /* =========================
       🔁 SYNC NOW
    ========================= */
    async syncNow(silent = false) {
        this.traceStep("cloudSync", "syncNow", "START", silent ? "SILENT" : "VERBOSE");
        if (!this.isUnlocked) {
            if (this.canRestoreApprovedDevice()) {
                const restored = await this.tryApprovedDeviceUnlock();
                if (!restored) return false;
            } else {
                return false;
            }
        }
        if (this.isPulling || this.isPushing) return false;
        if (!navigator.onLine) {
            this.emitSyncStatus("offline", true);
            return false;
        }

        const changed = await this.pull(silent);

        if (this.hasPendingChanges() || this.hasProtectedRepairPending()) {
            const pushed = await this._doPush();
            this.traceStep("cloudSync", "syncNow", pushed ? "PUSHED" : "PULL_ONLY");
            return !!(changed || pushed);
        }

        this.traceStep("cloudSync", "syncNow", changed ? "CHANGED" : "NO_CHANGE");
        return !!changed;
    },

    /* =========================
       📤 PUSH (ENCRYPTED SNAPSHOT)
    ========================= */
    push(force = false) {
        if (!this.isUnlocked) {
            if (this.canRestoreApprovedDevice()) {
                return this.tryApprovedDeviceUnlock().then(ok => {
                    if (!ok) return false;
                    return this.push(force);
                });
            }
            return false;
        }
        if (this.isPulling || this.isPushing) return false;

        if (!navigator.onLine) {
            this.emitSyncStatus("offline", true);
            return false;
        }

        if (force) {
            return this._doPush();
        }

        if (this.pushTimeout) clearTimeout(this.pushTimeout);

        this.pushTimeout = setTimeout(() => {
            if (
                this.isUnlocked &&
                !this.isPulling &&
                !this.isPushing &&
                navigator.onLine
            ) {
                this._doPush();
            }
        }, this.config.syncThrottle);
    },

    async _doPush() {
        this.traceStep("cloudSync", "push", "START");
        if (!this.isUnlocked) return false;
        if (!navigator.onLine) {
            this.emitSyncStatus("offline", true);
            return false;
        }

        this.isPushing = true;
        this.emitSyncStatus("syncing", true);

        let finalStatus = "online";

        try {
            const remote = await this.fetchLatestRecord();
            const remoteTs = parseInt(remote?.last_update_ts || "0", 10);
            const localTs = parseInt(localStorage.getItem(this.storage.lastPush) || "0", 10);
            const pendingExists = this.hasPendingChanges();
            const protectedRepairPending = this.hasProtectedRepairPending();

            if (remoteTs && remoteTs > localTs) {
                console.warn("⚠️ CLOUD: Remote is newer than local. Pulling before push...");
                await this.pull(true);
                if (!pendingExists && !protectedRepairPending) return false;
            }

            if (this.hasPendingChanges()) {
                this.applyPendingChangesToLocal();
            }

            const ts = Date.now().toString();
            if (this.lastPushTs === ts) return true;
            this.lastPushTs = ts;

            const snapshot = this.collectStorageSnapshot({ includeProtected: true });
            const storage = snapshot.general || {};
            const protectedStorage = snapshot.protectedStorage || {};
            const protectedPayload = Object.keys(protectedStorage).length
                ? await this.encryptCloudPayload({ storage: protectedStorage })
                : null;

            const payload = {
                last_update_ts: ts,
                last_update_date: this.getTodayKey(),
                __pegasus_plain_v3: true,
                approval: {
                    pin_hash: localStorage.getItem(this.storage.localPinHash) || "",
                    master_hash: localStorage.getItem(this.storage.masterHash) || ""
                },
                storage,
                protected: {
                    contacts: protectedPayload
                },
                __events__: this.getBoundedEvents()
            };

            const res = await fetch(
                `https://api.jsonbin.io/v3/b/${this.config.binId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Master-Key": this.userKey,
                        "X-Bin-Meta": "false"
                    },
                    body: JSON.stringify(payload)
                }
            );

            if (!res.ok) throw new Error("Push failed");

            this.safeSetLocal(this.storage.lastPush, ts);
            this.clearPendingChanges();
            this.clearProtectedRepairPending();
            console.log("📤 CLOUD: Secure Sync OK");
            this.traceStep("cloudSync", "push", "SUCCESS");
            return true;
        } catch (e) {
            this.traceError("cloudSync", "push", e);
            console.error("❌ PUSH ERROR:", e);
            finalStatus = navigator.onLine ? "error" : "offline";
            return false;
        } finally {
            this.isPushing = false;
            this.emitSyncStatus(finalStatus, true);
        }
    },

    /* =========================
       🖥️ UI UPDATE
    ========================= */
    triggerUIUpdate() {
        if (typeof window === "undefined") return;

        const now = Date.now();
        if (now - this.lastUiRefreshTs < 250) return;
        this.lastUiRefreshTs = now;

        try {
            window.dispatchEvent(new CustomEvent("pegasus_sync_complete"));
        } catch (e) {
            console.warn("⚠️ SYNC COMPLETE EVENT ERROR:", e);
        }

        this.safeCall(() => {
            if (typeof refreshAllUI === "function") refreshAllUI();
        });

        this.safeCall(() => {
            if (typeof updateFoodUI === "function") updateFoodUI();
        });

        this.safeCall(() => {
            if (typeof renderFood === "function") renderFood();
        });

        this.safeCall(() => {
            if (typeof updateSuppUI === "function") updateSuppUI();
        });

        this.safeCall(() => {
            if (typeof renderLiftingContent === "function") renderLiftingContent();
        });

        this.safeCall(() => {
            if (typeof updateKcalUI === "function") updateKcalUI();
        });

        this.safeCall(() => {
            if (typeof renderCalendar === "function") renderCalendar();
        });

        this.safeCall(() => {
            if (window.MuscleProgressUI?.render) window.MuscleProgressUI.render(true);
        });

        this.safeCall(() => {
            if (window.PegasusDiet?.updateUI) window.PegasusDiet.updateUI();
        });

        this.safeCall(() => {
            if (window.PegasusFinance?.render) window.PegasusFinance.render();
        });

        setTimeout(() => {
            this.safeCall(() => {
                if (typeof updateKcalUI === "function") updateKcalUI();
            });
        }, 120);
    },

    /* =========================
       🔁 AUTO SYNC
    ========================= */
    startAutoSync() {
        if (this.syncInterval) clearInterval(this.syncInterval);

        this.syncInterval = setInterval(() => {
            if (!this.isUnlocked) return;
            if (this.isPulling || this.isPushing) return;
            if (document.hidden) return;

            if (!navigator.onLine) {
                this.emitSyncStatus("offline", true);
                return;
            }

            this.syncNow(true);
        }, this.config.pullInterval);
    }
};

/* =========================
   STORAGE INTERCEPTORS
========================= */
if (!window.originalSetItem) {
    window.originalSetItem = localStorage.setItem;

    localStorage.setItem = function(key, value) {
        window.originalSetItem.apply(this, arguments);

        const cloud = window.PegasusCloud;
        if (!cloud) return;
        if (cloud.isApplyingRemote) return;
        if (!cloud.isAllowedStorageKey(key)) return;
        if (cloud.isInternalStorageKey(key)) return;
        if (!cloud.isUnlocked && !cloud.canRestoreApprovedDevice?.()) return;

        queueMicrotask(() => {
            cloud.queuePendingChange(key, value, "set");
            if (!cloud.isUnlocked) return;
            cloud.push();
        });
    };
}

if (!window.originalRemoveItem) {
    window.originalRemoveItem = localStorage.removeItem;

    localStorage.removeItem = function(key) {
        const shouldQueue = (
            !!window.PegasusCloud &&
            (window.PegasusCloud.isUnlocked || window.PegasusCloud.canRestoreApprovedDevice?.()) &&
            !window.PegasusCloud.isApplyingRemote &&
            window.PegasusCloud.isAllowedStorageKey(key) &&
            !window.PegasusCloud.isInternalStorageKey(key)
        );

        window.originalRemoveItem.apply(this, arguments);

        if (shouldQueue) {
            queueMicrotask(() => {
                window.PegasusCloud.queuePendingChange(key, null, "remove");
                if (!window.PegasusCloud.isUnlocked) return;
                window.PegasusCloud.push();
            });
        }
    };
}

/* =========================
   CROSS TAB SYNC
========================= */
window.addEventListener("storage", (e) => {
    if (!e.key) return;

    if (PegasusCloud.isAllowedStorageKey(e.key)) {
        PegasusCloud.triggerUIUpdate();
    }
});

/* =========================
   FOCUS / VISIBILITY / NETWORK SYNC
========================= */
window.addEventListener("focus", () => {
    if (window.PegasusCloud?.isUnlocked && navigator.onLine) {
        window.PegasusCloud.syncNow(true);
    }
});

document.addEventListener("visibilitychange", () => {
    if (!document.hidden && window.PegasusCloud?.isUnlocked && navigator.onLine) {
        window.PegasusCloud.syncNow(true);
    }
});

window.addEventListener("online", () => {
    if (window.PegasusCloud?.isUnlocked) {
        window.PegasusCloud.syncNow(true);
    }
});

window.addEventListener("offline", () => {
    PegasusCloud.emitSyncStatus("offline", true);
});

/* =========================
   ENGINE ATTACH ONLY
========================= */
window.addEventListener("load", () => {
    if (window.PegasusEngine && !PegasusCloud.engine) {
        PegasusCloud.attachEngine(window.PegasusEngine);
    }
});

window.PegasusCloud = PegasusCloud;
