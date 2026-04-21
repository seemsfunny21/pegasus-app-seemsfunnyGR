/* ==========================================================================
   PEGASUS STORAGE HARDENING
   Safe boot-time normalization for critical localStorage keys.
   - No UI changes
   - No sync-flow changes
   - Repairs malformed/missing critical state with safe defaults
   ========================================================================== */

(function(){
    const STORAGE = window.localStorage;
    const MANIFEST = () => window.PegasusManifest || {};
    const SCHEMA_VERSION = "1";
    const SCHEMA_KEY = "pegasus_storage_schema_version";
    const REPAIR_LOG_KEY = "pegasus_storage_repair_log";
    const MAX_LOG_ENTRIES = 80;
    const ACTIVE_PLANS = ["IRON", "EMS_ONLY", "BIKE_ONLY", "HYBRID"];
    const monitor = () => window.PegasusRuntimeMonitor;

    function nowIso() { return new Date().toISOString(); }

    function safeGet(key) {
        try { return STORAGE.getItem(key); } catch (_) { return null; }
    }

    function safeSet(key, value) {
        try {
            STORAGE.setItem(key, String(value));
            return true;
        } catch (_) {
            return false;
        }
    }

    function safeRemove(key) {
        try {
            STORAGE.removeItem(key);
            return true;
        } catch (_) {
            return false;
        }
    }

    function pushRepairLog(entry) {
        try {
            const current = JSON.parse(safeGet(REPAIR_LOG_KEY) || "[]");
            const next = Array.isArray(current) ? current : [];
            next.push(entry);
            safeSet(REPAIR_LOG_KEY, JSON.stringify(next.slice(-MAX_LOG_ENTRIES)));
        } catch (_) {}
    }

    function record(kind, key, reason, details) {
        const entry = {
            at: nowIso(),
            kind,
            key,
            reason,
            details: details || null
        };
        pushRepairLog(entry);
        const rt = monitor();
        if (rt?.trace) rt.trace("storageHardening.js", kind, reason, { key, ...(details || {}) });
    }

    function preview(raw) {
        if (raw == null) return null;
        const text = String(raw);
        return text.length > 140 ? text.slice(0, 137) + "..." : text;
    }

    function parseJson(raw) {
        try { return { ok: true, value: JSON.parse(raw) }; }
        catch (error) { return { ok: false, error: error?.message || "Invalid JSON" }; }
    }

    function ensureSchemaMarker() {
        const current = safeGet(SCHEMA_KEY);
        if (current === SCHEMA_VERSION) return null;
        safeSet(SCHEMA_KEY, SCHEMA_VERSION);
        const reason = current == null ? "schema:init" : "schema:update";
        record("schema", SCHEMA_KEY, reason, { previous: current, next: SCHEMA_VERSION });
        return { key: SCHEMA_KEY, previous: current, next: SCHEMA_VERSION, reason };
    }

    function normalizeBooleanKey(key, fallback) {
        const raw = safeGet(key);
        const normalized = String(fallback ? "true" : "false");
        if (raw == null) {
            safeSet(key, normalized);
            record("repair", key, "missing:boolean_default", { next: normalized });
            return { key, repaired: true, value: normalized };
        }

        const value = String(raw).trim().toLowerCase();
        let next = null;
        if (["true", "1", "yes", "on"].includes(value)) next = "true";
        else if (["false", "0", "no", "off"].includes(value)) next = "false";

        if (next == null) {
            safeSet(key, normalized);
            record("repair", key, "invalid:boolean_default", { previous: preview(raw), next: normalized });
            return { key, repaired: true, value: normalized };
        }

        if (next !== raw) {
            safeSet(key, next);
            record("repair", key, "normalize:boolean_string", { previous: preview(raw), next });
            return { key, repaired: true, value: next };
        }

        return { key, repaired: false, value: raw };
    }

    function normalizeNumberKey(key, fallback, options) {
        const raw = safeGet(key);
        const opts = options || {};
        const min = typeof opts.min === "number" ? opts.min : -Infinity;
        const max = typeof opts.max === "number" ? opts.max : Infinity;
        const integer = !!opts.integer;
        const ensureExists = opts.ensureExists !== false;
        const fallbackText = integer ? String(Math.round(fallback)) : String(fallback);

        if (raw == null || String(raw).trim() === "") {
            if (ensureExists) {
                safeSet(key, fallbackText);
                record("repair", key, "missing:number_default", { next: fallbackText });
                return { key, repaired: true, value: fallbackText };
            }
            return { key, repaired: false, value: null };
        }

        const parsed = Number(raw);
        if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
            safeSet(key, fallbackText);
            record("repair", key, "invalid:number_default", {
                previous: preview(raw), next: fallbackText, min, max
            });
            return { key, repaired: true, value: fallbackText };
        }

        const nextValue = integer ? String(Math.round(parsed)) : String(parsed);
        if (String(raw) !== nextValue) {
            safeSet(key, nextValue);
            record("repair", key, "normalize:number_string", { previous: preview(raw), next: nextValue });
            return { key, repaired: true, value: nextValue };
        }

        return { key, repaired: false, value: raw };
    }

    function normalizeEnumKey(key, allowed, fallback, options) {
        const raw = safeGet(key);
        const opts = options || {};
        const ensureExists = opts.ensureExists !== false;
        if (raw == null || raw === "") {
            if (ensureExists) {
                safeSet(key, fallback);
                record("repair", key, "missing:enum_default", { next: fallback });
                return { key, repaired: true, value: fallback };
            }
            return { key, repaired: false, value: null };
        }

        if (!allowed.includes(raw)) {
            safeSet(key, fallback);
            record("repair", key, "invalid:enum_default", { previous: preview(raw), next: fallback, allowed });
            return { key, repaired: true, value: fallback };
        }

        return { key, repaired: false, value: raw };
    }

    function normalizeJsonKey(key, fallback, expectedType, options) {
        const raw = safeGet(key);
        const opts = options || {};
        const ensureExists = opts.ensureExists !== false;
        const fallbackValue = typeof fallback === "function" ? fallback() : fallback;
        const serializedFallback = JSON.stringify(fallbackValue);

        if (raw == null || raw === "") {
            if (ensureExists) {
                safeSet(key, serializedFallback);
                record("repair", key, "missing:json_default", { nextType: expectedType });
                return { key, repaired: true, value: fallbackValue };
            }
            return { key, repaired: false, value: null };
        }

        const parsed = parseJson(raw);
        if (!parsed.ok) {
            safeSet(key, serializedFallback);
            record("repair", key, "invalid:json_default", { previous: preview(raw), nextType: expectedType, error: parsed.error });
            return { key, repaired: true, value: fallbackValue };
        }

        const value = parsed.value;
        const isArray = Array.isArray(value);
        const isObject = value && typeof value === "object" && !isArray;
        const valid = expectedType === "array" ? isArray : isObject;
        if (!valid) {
            safeSet(key, serializedFallback);
            record("repair", key, "invalid:json_shape_default", { previousType: isArray ? "array" : typeof value, nextType: expectedType });
            return { key, repaired: true, value: fallbackValue };
        }

        return { key, repaired: false, value };
    }

    function normalizeLanguagePair() {
        const language = normalizeEnumKey("pegasus_language", ["gr", "en"], "gr", { ensureExists: true });
        const lang = normalizeEnumKey("pegasus_lang", ["gr", "en"], safeGet("pegasus_language") || "gr", { ensureExists: true });
        const current = safeGet("pegasus_language") || "gr";
        if (safeGet("pegasus_lang") !== current) {
            safeSet("pegasus_lang", current);
            record("repair", "pegasus_lang", "sync:language_mirror", { next: current });
            return [language, { key: "pegasus_lang", repaired: true, value: current }];
        }
        return [language, lang];
    }

    function getSpecs() {
        const manifest = MANIFEST();
        return {
            booleans: [
                { key: manifest.system?.mute || "pegasus_mute_state", fallback: false },
                { key: manifest.system?.turbo || "pegasus_turbo_state", fallback: false }
            ],
            numbers: [
                { key: manifest.user?.weight || "pegasus_weight", fallback: 74, min: 30, max: 300 },
                { key: manifest.diet?.todayKcal || "pegasus_today_kcal", fallback: 2800, min: 1000, max: 6000 },
                { key: manifest.diet?.todayProtein || "pegasus_today_protein", fallback: 160, min: 40, max: 400 },
                { key: "pegasus_session_kcal", fallback: 0, min: 0, max: 20000 },
                { key: "pegasus_weekly_kcal", fallback: 0, min: 0, max: 100000 },
                { key: "kouki_total_stock", fallback: 30, min: 0, max: 9999, integer: true }
            ],
            enums: [
                { key: "pegasus_active_plan", allowed: ACTIVE_PLANS, fallback: "IRON" }
            ],
            json: [
                { key: manifest.workout?.weekly_history || "pegasus_weekly_history", fallback: {}, type: "object" },
                { key: manifest.workout?.done || "pegasus_workouts_done", fallback: {}, type: "object" },
                { key: manifest.workout?.muscleTargets || "pegasus_muscle_targets", fallback: {}, type: "object" },
                { key: manifest.workout?.calendarHistory || "pegasus_calendar_history", fallback: {}, type: "object" },
                { key: manifest.user?.weight_history || "pegasus_weight_history", fallback: [], type: "array" },
                { key: manifest.diet?.foodLibrary || "pegasus_food_library", fallback: [], type: "array" },
                { key: "pegasus_cardio_history", fallback: [], type: "array" },
                { key: "pegasus_daily_progress", fallback: {}, type: "object" },
                { key: "pegasus_command_trace", fallback: [], type: "array" },
                { key: "pegasus_engine_progress_runtime_v1", fallback: {}, type: "object", ensureExists: false },
                { key: "kouki_agreement_log", fallback: [], type: "array" }
            ]
        };
    }

    function auditAndRepair(stage) {
        const specs = getSpecs();
        const repairs = [];
        const schema = ensureSchemaMarker();
        if (schema) repairs.push(schema);

        specs.booleans.forEach(spec => repairs.push(normalizeBooleanKey(spec.key, spec.fallback)));
        specs.numbers.forEach(spec => repairs.push(normalizeNumberKey(spec.key, spec.fallback, spec)));
        specs.enums.forEach(spec => repairs.push(normalizeEnumKey(spec.key, spec.allowed, spec.fallback, spec)));
        specs.json.forEach(spec => repairs.push(normalizeJsonKey(spec.key, spec.fallback, spec.type, spec)));
        repairs.push(...normalizeLanguagePair());

        const applied = repairs.filter(Boolean).filter(r => r.repaired || r.reason);
        const result = {
            ok: true,
            stage: stage || "manual",
            auditedAt: nowIso(),
            schemaVersion: safeGet(SCHEMA_KEY) || SCHEMA_VERSION,
            repairCount: applied.length,
            repairedKeys: applied.map(r => r.key),
            activePlan: safeGet("pegasus_active_plan") || "IRON",
            weight: safeGet((MANIFEST().user?.weight) || "pegasus_weight") || "74",
            language: safeGet("pegasus_language") || "gr"
        };

        window.__pegasusStorageHardeningState = result;
        const rt = monitor();
        if (applied.length > 0) {
            if (rt?.warn) rt.warn("storageHardening.js", stage || "audit", "Storage repairs applied", { count: applied.length, keys: result.repairedKeys });
            console.warn("🧰 PEGASUS STORAGE HARDENING: Repairs Applied", result);
        } else {
            if (rt?.trace) rt.trace("storageHardening.js", stage || "audit", "Storage OK", { repairCount: 0 });
            console.log("🧰 PEGASUS STORAGE HARDENING: OK");
        }
        return result;
    }

    function getRecentRepairs(limit) {
        let entries = [];
        try {
            const parsed = JSON.parse(safeGet(REPAIR_LOG_KEY) || "[]");
            entries = Array.isArray(parsed) ? parsed : [];
        } catch (_) {}
        return entries.slice(-(typeof limit === "number" ? limit : 20));
    }

    function resetRepairLog() {
        safeRemove(REPAIR_LOG_KEY);
        record("maintenance", REPAIR_LOG_KEY, "repair_log_cleared", null);
        return true;
    }

    window.PegasusStorageHardening = {
        getState() {
            return window.__pegasusStorageHardeningState || null;
        },
        summary() {
            const result = this.getState() || auditAndRepair("summary");
            console.log("🧰 PEGASUS STORAGE HARDENING", result);
            return result;
        },
        audit(stage) {
            return auditAndRepair(stage || "manual_audit");
        },
        repair(stage) {
            return auditAndRepair(stage || "manual_repair");
        },
        getRecentRepairs,
        clearRepairLog: resetRepairLog,
        safeReadJSON(key, fallback) {
            const parsed = normalizeJsonKey(key, fallback, Array.isArray(fallback) ? "array" : "object", { ensureExists: false });
            return parsed?.value ?? fallback;
        },
        safeReadNumber(key, fallback, options) {
            const raw = safeGet(key);
            if (raw == null || raw === "") return fallback;
            const value = Number(raw);
            if (!Number.isFinite(value)) return fallback;
            const min = typeof options?.min === "number" ? options.min : -Infinity;
            const max = typeof options?.max === "number" ? options.max : Infinity;
            return value < min || value > max ? fallback : value;
        },
        safeReadBoolean(key, fallback) {
            const raw = safeGet(key);
            if (raw == null) return !!fallback;
            const value = String(raw).trim().toLowerCase();
            if (["true", "1", "yes", "on"].includes(value)) return true;
            if (["false", "0", "no", "off"].includes(value)) return false;
            return !!fallback;
        }
    };

    window.addEventListener("storage", (event) => {
        const watchedKeys = new Set([
            "pegasus_active_plan",
            MANIFEST().user?.weight || "pegasus_weight",
            MANIFEST().diet?.todayKcal || "pegasus_today_kcal",
            MANIFEST().diet?.todayProtein || "pegasus_today_protein",
            MANIFEST().workout?.weekly_history || "pegasus_weekly_history",
            MANIFEST().workout?.done || "pegasus_workouts_done",
            MANIFEST().workout?.calendarHistory || "pegasus_calendar_history",
            "pegasus_daily_progress"
        ]);
        if (!watchedKeys.has(event.key)) return;
        record("observe", event.key, "storage_event_seen", { newValue: preview(event.newValue) });
    });

    auditAndRepair("boot");
})();
