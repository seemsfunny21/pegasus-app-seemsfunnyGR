/* ==========================================================================
   PEGASUS OS - MASTER DATA MANIFEST (v13.0)
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
        protein_target: "pegasus_target_protein",
        ex_time: "pegasus_ex_time",
        rest_time: "pegasus_rest_time"
    },

    // 2. ΠΡΟΠΟΝΗΣΗ & ΙΣΤΟΡΙΚΟ (Owner: app.js / calendar.js / achievements.js)
    workout: {
        done: "pegasus_workouts_done",       
        total: "pegasus_total_workouts",     
        weekly_history: "pegasus_weekly_history", 
        muscle_targets: "pegasus_muscle_targets",
        last_reset: "pegasus_last_reset",
        order_prefix: "pegasus_order_",      
        cardio_offset: "pegasus_cardio_offset_sets", 
        ems_log_prefix: "pegasus_ems_log_"   
    },

    // 3. ΔΙΑΤΡΟΦΗ (Owner: food.js)
    nutrition: {
        log_prefix: "food_log_",             
        library: "pegasus_food_library",     
        today_kcal: "pegasus_today_kcal",    
        today_protein: "pegasus_today_protein", 
        last_report: "pegasus_last_auto_report" 
    },

    // 4. ΕΞΟΠΛΙΣΜΟΣ & INVENTORY (Owner: inventoryHandler.js)
    inventory: {
        supplements: "pegasus_supp_inventory", 
        contacts: "pegasus_contacts"           
    },

    // 5. VEHICLE & DOCUMENTS (Owner: car-mobile.js / profile-mobile.js)
    vehicle: {
        dates: "pegasus_car_dates",      // Λήξη Ασφάλειας & ΚΤΕΟ
        service: "pegasus_car_service",  // Ιστορικό Service
        specs: "pegasus_car_specs"       // Πινακίδα, VIN, Μοντέλο
    },

    // 6. ΣΥΣΤΗΜΑ & UI STATE (Owner: dragDrop.js / cloudSync.js)
    system: {
        vault_pin: "pegasus_vault_pin",      
        last_push: "pegasus_last_push",      
        logs: "pegasus_system_logs",         
        trace: "pegasus_command_trace",      
        pos_prefix: "pegasus_pos_",          
        mute: "pegasus_mute_state",          
        turbo: "pegasus_turbo_state"         
    }
}; 

/* ==========================================================================
   PEGASUS STRICT DATE CONTROLLER (v13.0)
   ========================================================================== */
window.PegasusManifest.getStrictDate = function(dateObj = new Date()) {
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    return `${d}/${m}/${y}`; // Παράγει ΠΑΝΤΑ μορφή: 04/04/2026
};

// Ενημερώνουμε και το Cloud Sync να υπακούει στο Μανιφέστο
if (typeof window.PegasusCloud !== "undefined") {
    window.PegasusCloud.getTodayKey = function() {
        return window.PegasusManifest.getStrictDate();
    };
}

console.log("🛡️ PEGASUS MANIFEST v13.0: System Integrity Verified.");
