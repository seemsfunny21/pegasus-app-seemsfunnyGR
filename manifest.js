/* ==========================================================================
   PEGASUS OS - MASTER DATA MANIFEST (v1.0)
   The "Single Source of Truth" for all LocalStorage Keys
   ========================================================================== */

window.PegasusManifest = {
    // 1. ΒΑΣΙΚΟ ΠΡΟΦΙΛ (Owner: settings.js)
    user: {
        weight: "pegasus_weight",
        height: "pegasus_height",
        age: "pegasus_age",
        gender: "pegasus_gender",
        kcal_target: "pegasus_target_kcal",
        protein_target: "pegasus_target_protein"
    },

    // 2. ΠΡΟΠΟΝΗΣΗ & ΙΣΤΟΡΙΚΟ (Owner: app.js / calendar.js / achievements.js)
    workout: {
        done: "pegasus_workouts_done",       // Το ημερολόγιο (45 sessions)
        total: "pegasus_total_workouts",     // Ο μετρητής
        weekly_history: "pegasus_weekly_history", // Οι μπάρες μυϊκών ομάδων
        order_prefix: "pegasus_order_",      // Η σειρά των ασκήσεων ανά ημέρα
        cardio_offset: "pegasus_cardio_offset_sets", // Πίστωση από ποδήλατο
        ems_log_prefix: "pegasus_ems_log_"   // Ιστορικό EMS
    },

    // 3. ΔΙΑΤΡΟΦΗ (Owner: food.js)
    nutrition: {
        log_prefix: "food_log_",             // Τα γεύματα (π.χ. food_log_28/3/2026)
        library: "pegasus_food_library",     // Συχνές επιλογές
        today_kcal: "pegasus_today_kcal",    // Τρέχουσες θερμίδες ημέρας
        today_protein: "pegasus_today_protein", // Τρέχουσα πρωτεΐνη ημέρας
        last_report: "pegasus_last_auto_report" // Πότε στάλθηκε το πρωινό email
    },

    // 4. ΕΞΟΠΛΙΣΜΟΣ & INVENTORY (Owner: inventoryHandler.js)
    inventory: {
        supplements: "pegasus_supp_inventory", // Πρωτεΐνη/Κρεατίνη (grams)
        contacts: "pegasus_contacts"           // Επαφές/Συνεργάτες
    },

    // 5. ΣΥΣΤΗΜΑ & UI STATE (Owner: dragDrop.js / cloudSync.js)
    system: {
        vault_pin: "pegasus_vault_pin",      // Cloud PIN
        last_push: "pegasus_last_push",      // Timestamp τελευταίου συγχρονισμού
        logs: "pegasus_system_logs",         // Logs σφαλμάτων
        trace: "pegasus_command_trace",      // Tracer (αυτό που φτιάξαμε σήμερα)
        pos_prefix: "pegasus_pos_",          // Θέσεις των panels (draggable)
        mute: "pegasus_mute_state",          // On/Off ήχος
        turbo: "pegasus_turbo_state"         // Ταχύτητα χρονομέτρου
    }
};

console.log("🛡️ PEGASUS MANIFEST: All Data Keys Globally Mapped.");
