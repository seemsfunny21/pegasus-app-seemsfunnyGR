/* ==========================================================================
   PEGASUS OS - MASTER MANIFEST & REGISTRY (v18.6)
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
        last_update: "2026-04-21",
        logic_protocol: "Zero-Bug Simulation & Global Scope Shielding",
        engine_version: "v18.6 Stable"
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
        todayProtein: "pegasus_today_protein"
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
        "manifest.js": "Κεντρικός ορισμός LocalStorage keys & System Blueprint.",
        "app.js": "Master Orchestrator / Event Bus (UI & Workout Timer).",
        "appState.js": "Shared runtime state container for app/session coordination.",
        "runtimeBridge.js": "Bridge μεταξύ legacy UI flow και Pegasus core runtime state.",
        "calorieRuntime.js": "Dynamic calorie/protein target calculation and UI runtime sync.",
        "audioRuntime.js": "Audio unlock and beep/runtime sound state manager.",
        "weightState.js": "Saved exercise weights and active lifter state access layer.",
        "diagnosticsRuntime.js": "Runtime warning/error bridge and high-level diagnostics hooks.",
        "moduleIntegrity.js": "Checks whether critical modules/globals are loaded and healthy.",
        "syncHardening.js": "Primary sync guard/state machine for overlapping sync prevention.",
        "syncEdgeHardening.js": "Cross-tab lease, dedupe and online/visibility sync edge-case protection.",
        "syncDiagnostics.js": "High-level sync observability and lease/deferred diagnostics layer.",
        "storageHardening.js": "LocalStorage audit/repair layer with safe defaults and schema guards.",
        "selfCheckRunner.js": "Regression/self-check runner for quick health snapshots.",
        "programGuide.js": "Interactive in-app How-To / system map / file reference guide.",
        "food.js": "Nutrition Logic & Συμφωνία 30 Γευμάτων (Κούκι).",
        "protcrea.js": "Inventory Guard (Πρωτεΐνη 2500g / Κρεατίνη 1000g).",
        "weightTracker.js": "Biometric Trend Analyzer (Moving Average).",
        "dietAdvisor.js": "Nutritional Intelligence Engine (Gap Analysis).",
        "optimizer.js": "AI Training Volumizer (Dynamic Set Adjustment).",
        "cloudSync.js": "Security & Persistence Layer (API & Vault PIN).",
        "cardio.js": "Cardio Engine (+18 σετ πόδια & Kcal target modifier).",
        "auditUI.js": "Real-time System Integrity Monitor & Diagnostic Tool.",
        "debug.js": "Tracer, health checks, calorie audit and runtime diagnostics.",
        "car.js": "Vehicle Management Module.",
        "parking.js": "Geolocation Tracking Module.",
        "dragDrop.js": "UI Window Positioning Memory.",
        "desktopBoot.js": "Desktop startup bootstrap and initial app boot orchestration.",
        "desktopPanels.js": "Desktop panel open/render helpers for major UI windows.",
        "desktopActions.js": "Desktop action handlers for buttons and workout commands.",
        "desktopRender.js": "Desktop-specific render/update helpers for workout UI.",
        "desktopSyncUI.js": "Desktop sync panel rendering and initialization status UI.",
        "desktopRoute.js": "Desktop route/bootstrap branching and mode selection logic.",
        "desktopSyncController.js": "Desktop sync controller hooks and higher-level sync entry wiring.",
        "desktopBootEnhancements.js": "Boot polish helpers, loader updates and service worker registration.",
        "ems.js": "Electro-Muscle Stimulation Tracker & Sync.",
        "partner.js": "Smart Co-Lifter Logic & Dual Weight Memory.",
        "reporting.js": "EmailJS Automated Morning Dispatcher."
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

console.log("🏛️ PEGASUS MANIFEST v18.6 LOADED. GLOBAL UNLOCK ACTIVE.");
