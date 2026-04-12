/* ==========================================================================
   PEGASUS OS - MASTER MANIFEST & REGISTRY (v18.0)
   Protocol: Centralized Data Governance & Forensic Blueprint
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
        engine_version: "v18.0 Stable"
    },

    // ---------------------------------------------------------
    // 2. EXECUTABLE DATA KEYS (Το Λεξικό της Μνήμης)
    // ---------------------------------------------------------
    system: {
        logs: "pegasus_system_logs",
        mute: "pegasus_mute_state",
        turbo: "pegasus_turbo_state",
        lastReset: "pegasus_last_reset",
        vaultPin: "pegasus_vault_pin"
    },
    user: {
        weight: "pegasus_weight",
        weightHistory: "pegasus_weight_history",
        legacyWeight: "weight_ΑΓΓΕΛΟΣ" 
    },
    workout: {
        weekly_history: "pegasus_weekly_history",
        done: "pegasus_workouts_done",
        total: "pegasus_total_workouts",
        cardio_offset: "pegasus_cardio_offset_sets",
        cardio_history: "pegasus_cardio_history"
    },
    diet: {
        weekly_kcal: "pegasus_weekly_kcal",
        session_kcal: "pegasus_session_kcal",
        inventory: "pegasus_supp_inventory",
        foodLogPrefix: "food_log_" 
    },
    car: {
        identity: "pegasus_car_identity",
        dates: "pegasus_car_dates",
        service: "pegasus_car_service",
        legacySpecs: "pegasus_car_specs", 
        legacyService: "peg_car_service",
        legacyDates: "peg_car_dates"
    },

    // ---------------------------------------------------------
    // 3. SYSTEM ARCHITECTURE (Το Σχεδιάγραμμα του Συστήματος)
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
        "car.js": "Vehicle Management Module."
    },

    logic_gates: {
        "Midnight_Rollover": "Trigger: 00:00 -> Clearing 'cardio_offset' και ανανέωση Food UI.",
        "Refill_Stock": "Trigger: 'ΑΓΟΡΑ ΠΡΩΤΕΪΝΗΣ' -> Stock Reset.",
        "Agreement_Logic": "30 - consumed_meals = Υπόλοιπο (Εμφάνιση στο PC Inventory Panel).",
        "Auto_Cycling": "Save Cardio με Ποδηλασία -> Αυτόματο +18 Sets στα Πόδια."
    },

    // ---------------------------------------------------------
    // 4. CONSOLE FORENSIC TOOLS (Τα Εργαλεία του Analyst)
    // ---------------------------------------------------------
    inspect: function() {
        console.log("%c 🏛️ PEGASUS OS FULL SYSTEM INSPECTION", "color: #00ff41; font-size: 20px; font-weight: bold;");
        console.table(this.metadata);
        console.log("%c 📂 ARCHITECTURE:", "color: #f39c12; font-weight: bold;");
        console.table(this.architecture);
        console.log("%c 🧠 LOGIC GATES:", "color: #00bcd4; font-weight: bold;");
        console.table(this.logic_gates);
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
            // Δυναμικά κλειδιά
            if (key.startsWith("food_log_") || key.startsWith("weight_") || key.startsWith("pegasus_cardio_kcal_")) {
                validKeys.push(key); continue;
            }
            // Έλεγχος
            if (manifestStr.includes(`"${key}"`)) validKeys.push(key);
            else orphanKeys.push(key);
        }

        console.log(`✅ Καταγεγραμμένα & Έγκυρα Κλειδιά: ${validKeys.length}`);
        if (orphanKeys.length > 0) {
            console.warn(`⚠️ ΠΡΟΣΟΧΗ: Βρέθηκαν ${orphanKeys.length} Ορφανά Κλειδιά!`);
            console.table(orphanKeys.map(k => ({ "Ορφανό Κλειδί": k })));
        } else {
            console.log("%c🛡️ ΣΥΣΤΗΜΑ ΚΑΘΑΡΟ. Όλα τα δεδομένα είναι χαρτογραφημένα.", "color: #4CAF50; font-weight: bold;");
        }
    }
};

console.log("🏛️ PEGASUS MANIFEST v18.0 LOADED. Type 'PegasusManifest.inspect()' or 'PegasusManifest.auditData()'.");
