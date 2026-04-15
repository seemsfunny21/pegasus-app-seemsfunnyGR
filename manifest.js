/* ==========================================================================
   PEGASUS OS - MASTER MANIFEST & REGISTRY (v18.1)
   Protocol: Zero-Orphan Key Governance & Runtime Fixes
   Status: THE SINGLE SOURCE OF TRUTH
   ========================================================================== */

window.PegasusManifest = {
    // ---------------------------------------------------------
    // 1. FORENSIC METADATA
    // ---------------------------------------------------------
    metadata: {
        os: "Pegasus OS",
        author: "Angelos & Gemini",
        last_update: "2026-04-12",
        logic_protocol: "Zero-Bug Simulation & Maximalist Retention",
        engine_version: "v18.1 Stable"
    },

    // ---------------------------------------------------------
    // 2. EXECUTABLE DATA KEYS (Το Λεξικό της Μνήμης)
    // ---------------------------------------------------------
    system: {
        logs: "pegasus_system_logs",
        mute: "pegasus_mute_state",
        turbo: "pegasus_turbo_state",
        lastReset: "pegasus_last_reset",
        vaultPin: "pegasus_vault_pin",
        vaultData: "pegasus_vault_data",
        vaultTime: "pegasus_vault_time",
        geminiKey: "pegasus_gemini_key",
        errorLog: "pegasus_error_log",
        cmdTrace: "pegasus_command_trace",
        stats: "pegasus_stats",
        lastPush: "pegasus_last_push",
        lastReport: "pegasus_last_auto_report"
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
        contacts: "pegasus_contacts"
    },
    workout: {
        weekly_history: "pegasus_weekly_history",
        done: "pegasus_workouts_done",
        total: "pegasus_total_workouts",
        cardio_offset: "pegasus_cardio_offset_sets",
        cardio_history: "pegasus_cardio_history",
        activePlan: "pegasus_active_plan",
        muscleTargets: "pegasus_muscle_targets",
        calendarHistory: "pegasus_calendar_history",
        exerciseWeights: "pegasus_exercise_weights" 
    },
    nutrition: { 
        // 🔴 CRITICAL FIX FOR food.js RUNTIME ERROR
        log_prefix: "food_log_" 
    },
    diet: {
        weekly_kcal: "pegasus_weekly_kcal",
        session_kcal: "pegasus_session_kcal",
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
        "food.js": "Nutrition Logic & Συμφωνία 30 Γευμάτων (Κούκι).",
        "protcrea.js": "Inventory Guard (Πρωτεΐνη 2500g / Κρεατίνη 1000g).",
        "weightTracker.js": "Biometric Trend Analyzer (Moving Average).",
        "dietAdvisor.js": "Nutritional Intelligence Engine (Gap Analysis).",
        "optimizer.js": "AI Training Volumizer (Dynamic Set Adjustment).",
        "cloudSync.js": "Security & Persistence Layer (API & Vault PIN).",
        "cardio.js": "Cardio Engine (+18 σετ πόδια & Kcal target modifier).",
        "car.js": "Vehicle Management Module.",
        "parking.js": "Geolocation Tracking Module.",
        "dragDrop.js": "UI Window Positioning Memory."
    },

    // ---------------------------------------------------------
    // 4. CONSOLE FORENSIC TOOLS (Τα Εργαλεία του Analyst)
    // ---------------------------------------------------------
    inspect: function() {
        console.log("%c 🏛️ PEGASUS OS FULL SYSTEM INSPECTION", "color: #00ff41; font-size: 20px; font-weight: bold;");
        console.table(this.metadata);
        console.log("%c 📂 ARCHITECTURE:", "color: #f39c12; font-weight: bold;");
        console.table(this.architecture);
    },

    whereIs: function(query) {
        const q = query.toLowerCase();
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
        let orphanKeys = [];
        let validKeys = [];

        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            
            // 🛡️ Δυναμικά Κλειδιά (Prefixes) που εξαιρούνται:
            if (key.startsWith("food_log_") || 
                key.startsWith("weight_") || 
                key.startsWith("pegasus_weight_") || 
                key.startsWith("pegasus_cardio_kcal_") ||
                key.startsWith("pegasus_pos_") || 
                key.startsWith("pegasus_routine_injected_")) {
                validKeys.push(key); 
                continue;
            }
            
            // Έλεγχος στατικού κλειδιού
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
            console.log("%c🛡️ ΣΥΣΤΗΜΑ ΚΑΘΑΡΟ. Όλα τα δεδομένα είναι χαρτογραφημένα στο Manifest.", "color: #4CAF50; font-weight: bold;");
        }
    }
};

console.log("🏛️ PEGASUS MANIFEST v18.1 LOADED. CRITICAL RUNTIME FIX APPLIED.");
