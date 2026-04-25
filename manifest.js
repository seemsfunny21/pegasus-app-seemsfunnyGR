(function(){
  const scope = (location.pathname || '').includes('/mobile/') ? 'mobile' : 'desktop';
  const ERROR_KEY = `pegasus_${scope}_runtime_errors`;
  const TRACE_KEY = `pegasus_${scope}_runtime_trace`;
  const MAX_ERRORS = 40;
  const MAX_TRACE = 80;
  const MAX_TEXT = 900;
  function nowIso(){ try { return new Date().toISOString(); } catch(_) { return String(Date.now()); } }
  function trimText(value){ const text = String(value ?? ''); return text.length > MAX_TEXT ? text.slice(0, MAX_TEXT) + '…' : text; }
  function safeRead(key){ try { const raw = localStorage.getItem(key); if(!raw) return []; const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; } catch(_) { return []; } }
  function safeWrite(key, entries, limit){ try { localStorage.setItem(key, JSON.stringify(entries.slice(-limit))); return true; } catch(_) { return false; } }
  function normalizeError(error){ if(!error) return { message: 'Unknown error', stack: '' }; if(typeof error === 'string') return { message: trimText(error), stack: '' }; const message = trimText(error.message || error.reason?.message || error.reason || error.toString?.() || 'Unknown error'); const stack = trimText(error.stack || error.reason?.stack || ''); return { message, stack }; }
  function getLatestTrace(){ const entries = safeRead(TRACE_KEY); return entries.length ? entries[entries.length - 1] : null; }
  function buildTrace(moduleName, action, status, extra){ return { ts: nowIso(), scope, module: trimText(moduleName || 'UNKNOWN'), action: trimText(action || 'runtime'), status: trimText(status || 'STEP'), path: trimText(location.pathname || ''), online: !!navigator.onLine, unlocked: !!window.PegasusCloud?.isUnlocked, extra: extra ? trimText(typeof extra === 'string' ? extra : JSON.stringify(extra)) : '' }; }
  function buildError(level, moduleName, action, error, extra){ const n = normalizeError(error); const latestTrace = getLatestTrace(); return { ts: nowIso(), scope, level: trimText(level || 'ERROR'), module: trimText(moduleName || 'UNKNOWN'), action: trimText(action || 'runtime'), message: n.message, stack: n.stack, path: trimText(location.pathname || ''), online: !!navigator.onLine, unlocked: !!window.PegasusCloud?.isUnlocked, lastTrace: latestTrace ? `${latestTrace.module}:${latestTrace.action}:${latestTrace.status}` : '', extra: extra ? trimText(typeof extra === 'string' ? extra : JSON.stringify(extra)) : '' }; }
  function pushTrace(moduleName, action, status, extra){ const entries = safeRead(TRACE_KEY); const entry = buildTrace(moduleName, action, status, extra); entries.push(entry); safeWrite(TRACE_KEY, entries, MAX_TRACE); return entry; }
  function pushError(level, moduleName, action, error, extra){ const entries = safeRead(ERROR_KEY); const entry = buildError(level, moduleName, action, error, extra); entries.push(entry); safeWrite(ERROR_KEY, entries, MAX_ERRORS); return entry; }
  function getLatestError(){ const entries = safeRead(ERROR_KEY); return entries.length ? entries[entries.length - 1] : null; }
  window.PegasusRuntimeMonitor = {
    scope,
    errorKey: ERROR_KEY,
    traceKey: TRACE_KEY,
    trace(moduleName, action, status, extra){ return pushTrace(moduleName, action, status || 'STEP', extra); },
    mark(moduleName, action, status, extra){ return pushTrace(moduleName, action, status || 'STEP', extra); },
    capture(moduleName, action, error, extra){ return pushError('ERROR', moduleName, action, error, extra); },
    warn(moduleName, action, error, extra){ return pushError('WARN', moduleName, action, error, extra); },
    info(moduleName, action, message, extra){ return pushError('INFO', moduleName, action, message, extra); },
    getErrors(){ return safeRead(ERROR_KEY); },
    getLatestError,
    getProblems(){ return safeRead(ERROR_KEY).filter(entry => entry.level === 'WARN' || entry.level === 'ERROR'); },
    getLatestProblem(){ const problems = safeRead(ERROR_KEY).filter(entry => entry.level === 'WARN' || entry.level === 'ERROR'); return problems.length ? problems[problems.length - 1] : null; },
    getTrace(){ return safeRead(TRACE_KEY); },
    getLatestTrace,
    clearErrors(){ try { localStorage.removeItem(ERROR_KEY); } catch(_) {} },
    clearTrace(){ try { localStorage.removeItem(TRACE_KEY); } catch(_) {} },
    clearAll(){ try { localStorage.removeItem(ERROR_KEY); } catch(_) {} try { localStorage.removeItem(TRACE_KEY); } catch(_) {} }
  };
  if(scope === 'desktop'){
    window.addEventListener('error', function(event){ const src = event.filename ? event.filename.split('/').pop() : 'runtime'; pushError('ERROR', src || 'runtime', 'window.error', event.error || event.message || 'Window error', { lineno: event.lineno || 0, colno: event.colno || 0 }); });
    window.addEventListener('unhandledrejection', function(event){ pushError('ERROR', 'promise', 'unhandledrejection', event.reason || 'Unhandled rejection'); });
  }
})();

/* ==========================================================================
   PEGASUS OS - MASTER MANIFEST & REGISTRY (v24.0)
   Protocol: Global Variable Re-declaration (Unlock M)
   Status: THE SINGLE SOURCE OF TRUTH | HARDENED: KEY CONSISTENCY + AUDIT SAFETY
   ========================================================================== */

window.PegasusManifest = {
    // ---------------------------------------------------------
    // 1. FORENSIC METADATA
    // ---------------------------------------------------------
    metadata: {
        os: "Pegasus OS",
        author: "Angelos & Gemini",
        last_update: "2026-04-23",
        logic_protocol: "Zero-Bug Simulation & Global Scope Shielding",
        engine_version: "v24.0 Stable"
    },

    // ---------------------------------------------------------
    // 2. EXECUTABLE DATA KEYS (Το Λεξικό της Μνήμης)
    // ---------------------------------------------------------
    system: {
        logs: "pegasus_system_logs",
        mute: "pegasus_mute_state",
        turbo: "pegasus_turbo_state",
        lastReset: "pegasus_last_reset",
        lastResetTimestamp: "pegasus_last_reset_timestamp",
        vaultPin: "pegasus_vault_pin",
        vaultData: "pegasus_vault_data",
        vaultTime: "pegasus_vault_time",
        geminiKey: "pegasus_gemini_key",
        errorLog: "pegasus_error_log",
        cmdTrace: "pegasus_command_trace",
        stats: "pegasus_stats",
        lastPush: "pegasus_last_push",
        lastReport: "pegasus_last_auto_report",
        lastEmailSent: "pegasus_last_email_sent_date",
        weatherCode: "pegasus_weather_code"
    },

    user: {
        weight: "pegasus_weight",
        weightHistory: "pegasus_weight_history",
        legacyWeight: "weight_ΑΓΓΕΛΟΣ",
        age: "pegasus_age",
        height: "pegasus_height",
        gender: "pegasus_gender",
        specs: "pegasus_user_specs",
        notes: "pegasus_notes",
        contacts: "pegasus_contacts",
        partners: "pegasus_partners_list"
    },

    workout: {
        weekly_history: "pegasus_weekly_history",
        done: "pegasus_workouts_done",
        total: "pegasus_total_workouts",

        // legacy compatibility key base
        cardio_offset: "pegasus_cardio_offset_sets",

        // canonical per-day cardio key prefix
        cardio_daily_prefix: "pegasus_cardio_kcal_",

        cardio_history: "pegasus_cardio_history",
        activePlan: "pegasus_active_plan",
        muscleTargets: "pegasus_muscle_targets",
        calendarHistory: "pegasus_calendar_history",
        exerciseWeights: "pegasus_exercise_weights",
        ex_time: "pegasus_ex_time",
        rest_time: "pegasus_rest_time"
    },

    nutrition: {
        log_prefix: "food_log_"
    },

    diet: {
        weekly_kcal: "pegasus_weekly_kcal",
        weeklyKcal: "pegasus_weekly_kcal",      // alias compatibility

        session_kcal: "pegasus_session_kcal",
        sessionKcal: "pegasus_session_kcal",    // alias compatibility

        inventory: "pegasus_supp_inventory",
        foodLibrary: "pegasus_food_library",
        todayKcal: "pegasus_today_kcal",
        todayProtein: "pegasus_today_protein",
        goalProtein: "pegasus_goal_protein"
    },

    kouki: {
        agreement: "kouki_agreement_log",
        totalMeals: "kouki_meals_total",
        remaining: "kouki_meals_remaining",
        totalStock: "kouki_total_stock"
    },

    car: {
        identity: "pegasus_car_identity",
        dates: "pegasus_car_dates",
        service: "pegasus_car_service",
        legacySpecs: "pegasus_car_specs",
        legacyService: "peg_car_service",
        legacyDates: "peg_car_dates"
    },

    parking: {
        loc: "pegasus_parking_loc",
        history: "pegasus_parking_history"
    },

    // ---------------------------------------------------------
    // 3. SYSTEM ARCHITECTURE
    // ---------------------------------------------------------
    architecture: {
        "manifest.js": "Κεντρικός ορισμός LocalStorage keys, aliases και System Blueprint.",
        "sw.js": "PWA service worker για precache, offline fallback και cache hygiene.",
        "runtimeBridge.js": "Bridge μεταξύ legacy UI flow και Pegasus core runtime state.",
        
        "calorieRuntime.js": "Dynamic calorie/protein target calculation και UI runtime sync.",
        
        
        
        
                                "storageHardening.js": "LocalStorage audit/repair layer με safe defaults και schema guards.",
        "selfCheckRunner.js": "Regression/self-check runner για quick health snapshots.",
        "programGuide.js": "Interactive in-app How-To / system map / file reference guide.",
        
        "desktopPanels.js": "Desktop panel open/render helpers για major UI windows.",
        "desktopActions.js": "Desktop action handlers για buttons και workout commands.",
                "desktopBoot.js": "Desktop startup bootstrap, app coordination και weather adaptation layer.",
        
        "pegasusCore.js": "Core training engine, session logic και canonical workout state.",
        "data.js": "Master training data, program plans και day-by-day exercise definitions.",
        "settings.js": "User settings defaults, persistence helpers και configuration access.",
        "dialogs.js": "Shared dialog/modal rendering helpers και confirmations.",
        "i18n.js": "Translation and language mapping layer για GR/EN strings.",
        "dynamic.js": "Dynamic UI helpers και adaptive display utilities.",
        "progressUI.js": "Muscle progress / status rendering helpers για workout progress UI.",
        "cloudSync.js": "Security & persistence layer για cloud sync, vault και approved devices.",
        "food.js": "Nutrition logging logic & Συμφωνία 30 Γευμάτων (Κούκι).",
        "protcrea.js": "Inventory guard για πρωτεΐνη / κρεατίνη stock tracking.",
        "dietAdvisor.js": "Nutritional intelligence engine και gap analysis layer.",
        "optimizer.js": "AI training optimizer και dynamic weekly/workout adjustment logic.",
        "extensions.js": "Extra productivity/routine modules και auxiliary daily logic.",
        "ems.js": "Electro-Muscle Stimulation tracker, plan support και sync hooks.",
        "cardio.js": "Cardio engine, offsets και target modifier logic.",
        "gallery.js": "IndexedDB gallery engine και media storage/view logic.",
        "dragDrop.js": "Draggable window positioning και UI memory persistence.",
        "reporting.js": "Automated reporting/email dispatcher timing layer.",
        "metabolicEngine.js": "Metabolic calculations and body-composition support logic.",
        "weightTracker.js": "Biometric trend analyzer, weight history helpers και partner/co-lifter memory logic.",
        "auditUI.js": "Real-time system integrity monitor και diagnostic overlay.",
        "debug.js": "Tracer, health checks, calorie audit και runtime diagnostics tools.",
        "mobile/mobileDataRegistry.js": "Registry για persistent mobile module keys, backup contracts και sync-safe merge rules.",
        "mobile/mobileDataMigration.js": "Automatic mobile data safety bootstrap, migration restore και upgrade snapshots.",
        "mobile/mobileSettingsDataTools.js": "Mobile settings data safety status, modular backup/restore tools και sync/debug event log.",
                "mobile/mobileApp.js": "Main mobile app bootstrap, wiring και route behavior.",
        "mobile/diet-mobile.js": "Mobile nutrition/diet panel logic.",
        "mobile/cardio-mobile.js": "Mobile cardio panel and flow logic.",
        "mobile/profile-mobile.js": "Mobile profile/user info management views.",
        "mobile/car-mobile.js": "Mobile vehicle information and maintenance views.",
        "mobile/parking-mobile.js": "Mobile parking/location history views.",
        "mobile/inventory-mobile.js": "Mobile inventory and stock management views.",
        "mobile/ems-mobile.js": "Mobile EMS tracking and control views.",
        "mobile/supplies-mobile.js": "Mobile supplies/resource management views.",
        "mobile/finance-mobile.js": "Mobile finance/expense tracking views.",
        "mobile/social-mobile.js": "Mobile contacts/social utility views.",
        "mobile/movies-mobile.js": "Mobile movies/media list utility views.",
        "mobile/missions-mobile.js": "Mobile missions/tasks utility views.",
        "mobile/biometrics-mobile.js": "Mobile biometrics/history views.",
        "mobile/maintenance-mobile.js": "Mobile maintenance checklist/service views.",
        "mobile/oracle-mobile.js": "Mobile oracle/assistant utility panel.",
        "mobile/lifting-mobile.js": "Mobile lifting/workout quick-access views."
    },

    // ---------------------------------------------------------
    // 4. CONSOLE FORENSIC TOOLS
    // ---------------------------------------------------------
    inspect: function() {
        console.log("%c 🏛️ PEGASUS OS FULL SYSTEM INSPECTION", "color: #00ff41; font-size: 20px; font-weight: bold;");
        console.table(this.metadata);
        console.log("%c 📂 ARCHITECTURE:", "color: #f39c12; font-weight: bold;");
        console.table(this.architecture);
    },

    whereIs: function(query) {
        const q = String(query || "").toLowerCase();

        for (let file in this.architecture) {
            if (this.architecture[file].toLowerCase().includes(q)) {
                return `📍 Η λογική '${query}' βρίσκεται στο: ${file}`;
            }
        }

        return "❌ Δεν βρέθηκε αναφορά στο System Blueprint.";
    },

    auditData: function() {
        console.log("%c🔍 PEGASUS DATA AUDIT STARTING...", "color: #00bcd4; font-weight: bold; font-size: 14px;");

        const manifestStr = JSON.stringify(this);
        const legacyCardioPrefix = (this.workout?.cardio_offset || "pegasus_cardio_offset_sets") + "_";
        const canonicalCardioPrefix = this.workout?.cardio_daily_prefix || "pegasus_cardio_kcal_";

        let orphanKeys = [];
        let validKeys = [];

        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            if (!key) continue;

            if (
                key.startsWith("food_log_") ||
                key.startsWith("weight_") ||
                key.startsWith("pegasus_weight_") ||
                key.startsWith(canonicalCardioPrefix) ||
                key.startsWith(legacyCardioPrefix) ||
                key.startsWith("pegasus_pos_") ||
                key.startsWith("pegasus_routine_injected_") ||
                key.startsWith("pegasus_history_") ||
                key.startsWith("pegasus_day_status_") ||
                key.startsWith("cardio_log_")
            ) {
                validKeys.push(key);
                continue;
            }

            if (manifestStr.includes(`"${key}"`)) {
                validKeys.push(key);
            } else {
                orphanKeys.push(key);
            }
        }

        console.log(`✅ Καταγεγραμμένα & Έγκυρα Κλειδιά: ${validKeys.length}`);

        if (orphanKeys.length > 0) {
            console.warn(`⚠️ ΠΡΟΣΟΧΗ: Βρέθηκαν ${orphanKeys.length} Ορφανά Κλειδιά!`);
            console.table(orphanKeys.map(k => ({ "Ορφανό Κλειδί": k })));
        } else {
            console.log("%c🛡️ ΣΥΣΤΗΜΑ ΚΑΘΑΡΟ.", "color: #4CAF50; font-weight: bold;");
        }
    }
};

// 🛡️ ΤΟ ΚΛΕΙΔΙ ΤΟΥ UNLOCK
var M = window.PegasusManifest;

console.log(`🏛️ PEGASUS MANIFEST ${window.PegasusManifest?.metadata?.engine_version || "UNKNOWN"} LOADED. GLOBAL UNLOCK ACTIVE.`);
