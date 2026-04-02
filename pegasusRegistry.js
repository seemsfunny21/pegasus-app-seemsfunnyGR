/* ==========================================================================
   PEGASUS OS - ULTIMATE FORENSIC REGISTRY & SYSTEM BLUEPRINT (v5.0)
   Protocol: 10000% Information Density & Variable Traceability
   Status: MASTER REFERENCE | VERIFIED FOR PEGASUS v12.1
   ========================================================================== */

window.PegasusRegistry = {
    metadata: {
        os: "Pegasus OS",
        author: "Angelos & Gemini",
        last_update: "2026-04-02",
        logic_protocol: "Zero-Bug Simulation & Maximalist Retention",
        engine_version: "v12.1 Stable"
    },

    system_architecture: {
        "manifest.js": {
            role: "Global Configuration Provider",
            logic: "Κεντρικός ορισμός των LocalStorage keys. Αποτρέπει το 'Variable Overwriting'.",
            keys: {
                "P_M.user.weight": "Κλειδί για το τρέχον βάρος.",
                "P_M.nutrition.log_prefix": "Πρόθεμα για τα καθημερινά log φαγητού.",
                "P_M.workout.done": "Object με τις ολοκληρωμένες προπονήσεις ανά ημερομηνία."
            }
        },
        "app.js": {
            role: "Master Orchestrator / Event Bus",
            logic: "Διαχειρίζεται το UI State (panels) και τη ροή του Workout Timer.",
            functions: ["selectDay()", "runPhase()", "togglePanel()", "btnSaveSettings"],
            dependencies: ["data.js", "optimizer.js", "calories.js", "weightTracker.js"]
        },
        "food.js": {
            role: "Nutrition & Agreement Logic Engine",
            logic: "Υπολογίζει Macros και διαχειρίζεται τη 'Συμφωνία 30 Γευμάτων'.",
            storage: {
                "food_log_DD/MM/YYYY": "Array με αντικείμενα γευμάτων.",
                "kouki_agreement_log": "Ιστορικό αφαίρεσης από τα προπληρωμένα γεύματα."
            },
            auto_triggers: {
                "Midnight_Reset": "Στις 00:00 μηδενίζει το cardio offset και ανανεώνει το UI.",
                "Kouki_Detection": "Αν το όνομα περιέχει '(Κούκι)', αφαιρεί από τη συμφωνία."
            }
        },
        "protcrea.js": {
            role: "Inventory Guard (Supplements)",
            logic: "Διαχείριση αποθέματος σκόνης πρωτεΐνης και κρεατίνης σε γραμμάρια.",
            keys: ["pegasus_supp_inventory (Object)"],
            refill_logic: "Λέξη-κλειδί 'ΑΓΟΡΑ' στο food input -> Reset stock στα 2500g/1000g.",
            consumption: "Πρωτεΐνη: -30g ανά scoop | Κρεατίνη: -5g ανά scoop."
        },
        "weightTracker.js": {
            role: "Biometric Trend Analyzer",
            logic: "Καταγράφει το βάρος και παράγει τον 'Moving Average' 7 ημερών.",
            storage: ["pegasus_weight_history (JSON Date-Map)"],
            stats: "getWeeklyAverage() -> Φιλτράρει τις κατακρατήσεις υγρών."
        },
        "dietAdvisor.js": {
            role: "Nutritional Intelligence Engine",
            data: "KOUKI_MASTER_MENU (Εβδομαδιαίος κατάλογος φαγητών).",
            algorithm: "analyzeAndRecommend() -> Gap Analysis 14 ημερών βάσει Tags (ospro, psari, kreas).",
            ui_output: "Εμφανίζει το 🧠 AI ADVISOR πάνω από το μενού στο food panel."
        },
        "optimizer.js": {
            role: "AI Training Volumizer",
            logic: "Προσαρμόζει τα σετ βάσει απόδοσης. Μεταφέρει ασκήσεις από Κυριακή σε Παρασκευή αν υπάρχει κενό.",
            impact: "Τροποποιεί το 'remainingSets' array του app.js."
        },
        "cloudSync.js": {
            role: "Security & Persistence Layer",
            logic: "Συγχρονισμός LocalStorage με το API. Διαχειρίζεται το Master Vault & PIN.",
            functions: ["push()", "pull()", "unlock(pin)"]
        },
        "calories.js": {
            role: "Live Metabolic Burn Rate Calculator",
            formula: "(MET 5.0 * 3.5 * weight / 200) * duration_seconds.",
            sync: "Προσθέτει αρνητικές θερμίδες στο food log μετά το workout."
        },
        "cardio.js": {
            role: "Cardio & Weather Integration",
            logic: "Καταγράφει ποδηλασία/τρέξιμο. Προσθέτει τις θερμίδες στο 'cardio_offset' του φαγητού.",
            storage: ["pegasus_cardio_history"]
        },
        "ems.js": {
            role: "Specialized EMS Logger",
            logic: "Αποκλειστικό για Τετάρτες. Καταγράφει Intensity Avg % και e-Kcal."
        }
    },

    logic_gates: {
        "Midnight_Rollover": "Trigger: 00:00 -> Clearing 'cardio_offset' και ανανέωση Food UI.",
        "Refill_Stock": "Trigger: Food entry 'ΑΓΟΡΑ ΠΡΩΤΕΪΝΗΣ' ή 'ΑΓΟΡΑ ΚΡΕΑΤΙΝΗΣ' -> Stock Reset.",
        "Weight_Safety": "Range: 40kg - 200kg. Αν εκτός, ο BMR αλγόριθμος παγώνει για προστασία.",
        "Agreement_Logic": "30 - consumed_meals = Υπόλοιπο (Εμφάνιση στο PC Inventory Panel)."
    },

    measurement_units: {
        "Weight": "kg (Kilograms)",
        "Supplements": "g (Grams)",
        "Energy": "kcal (Kilocalories)",
        "Distance": "km (Kilometers)",
        "Time": "Seconds (Timer) / HH:MM (Cardio)"
    },

    // 🛠️ ΣΥΣΤΗΜΑ ΕΠΙΘΕΩΡΗΣΗΣ (Console Commands)
    inspect: function() {
        console.log("%c 🏛️ PEGASUS OS FULL SYSTEM INSPECTION", "color: #00ff41; font-size: 20px; font-weight: bold;");
        console.table(this.system_architecture);
        console.log("%c LOGIC GATES:", "color: #f39c12; font-weight: bold;");
        console.table(this.logic_gates);
    },

    whereIs: function(query) {
        const q = query.toLowerCase();
        for (let file in this.system_architecture) {
            if (JSON.stringify(this.system_architecture[file]).toLowerCase().includes(q)) {
                return `📍 Το '${query}' διαχειρίζεται στο: ${file}`;
            }
        }
        return "❌ Δεν βρέθηκε αναφορά.";
    }
};

console.log("🏛️ PEGASUS REGISTRY v5.0 LOADED. Type 'PegasusRegistry.inspect()' for full breakdown.");
