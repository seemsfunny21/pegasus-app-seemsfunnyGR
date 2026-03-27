/* ==========================================================================
   PEGASUS SETTINGS ENGINE - CLEAN SWEEP v17.0
   Protocol: Bio-Data Sync & Target Injection | Logic: Local Vault Config
   ========================================================================== */

const PegasusSettings = {
    // Master Keys βάσει PegasusStore Protocol
    keys: {
        targets: "pegasus_muscle_targets",
        profile: "pegasus_user_profile",
        weight: "pegasus_weight",
        height: "pegasus_height",
        age: "pegasus_age"
    },

    /**
     * 1. INITIALIZATION
     * Επιβολή Master Profile αν δεν υπάρχουν αποθηκευμένα δεδομένα
     */
    init: function() {
        if (!localStorage.getItem(this.keys.targets)) {
            // Default εβδομαδιαίοι στόχοι (Strict Hypertrophy Protocol)
            const defaultTargets = { "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 };
            localStorage.setItem(this.keys.targets, JSON.stringify(defaultTargets));
        }

        if (!localStorage.getItem(this.keys.weight)) {
            localStorage.setItem(this.keys.weight, "74");
            localStorage.setItem(this.keys.height, "187");
            localStorage.setItem(this.keys.age, "38");
        }

        this.bindUI();
        console.log("✅ PEGASUS: Settings Engine Operational.");
    },

    /**
     * 2. UI BINDING
     * Σύνδεση των inputs του settingsPanel με το LocalStorage
     */
    bindUI: function() {
        const panel = document.getElementById('settingsPanel');
        if (!panel) return;

        // Φόρτωση τρεχουσών τιμών στα inputs
        const targets = JSON.parse(localStorage.getItem(this.keys.targets));
        Object.keys(targets).forEach(group => {
            const input = document.getElementById(`target-${group}`);
            if (input) input.value = targets[group];
        });

        const wInput = document.getElementById('setWeight');
        const hInput = document.getElementById('setHeight');
        const aInput = document.getElementById('setAge');

        if (wInput) wInput.value = localStorage.getItem(this.keys.weight);
        if (hInput) hInput.value = localStorage.getItem(this.keys.height);
        if (aInput) aInput.value = localStorage.getItem(this.keys.age);
    },

    /**
     * 3. DATA PERSISTENCE
     */
    saveAll: function() {
        // Αποθήκευση Στόχων
        const targets = {};
        ["Στήθος", "Πλάτη", "Πόδια", "Χέρια", "Ώμοι", "Κορμός"].forEach(group => {
            const val = document.getElementById(`target-${group}`)?.value;
            targets[group] = parseInt(val) || 0;
        });
        localStorage.setItem(this.keys.targets, JSON.stringify(targets));

        // Αποθήκευση Βιομετρικών
        const w = document.getElementById('setWeight')?.value;
        const h = document.getElementById('setHeight')?.value;
        const a = document.getElementById('setAge')?.value;

        localStorage.setItem(this.keys.weight, w);
        localStorage.setItem(this.keys.height, h);
        localStorage.setItem(this.keys.age, a);

        // Ενημέρωση του Global Profile για τον MetabolicEngine
        if (window.USER_PROFILE) {
            window.USER_PROFILE.weight = parseFloat(w);
            window.USER_PROFILE.height = parseFloat(h);
            window.USER_PROFILE.age = parseInt(a);
        }

        if (window.PegasusLogger) window.PegasusLogger.log("Settings Updated & Profile Synced", "INFO");
        
        // Αυτόματο Cloud Push
        if (window.PegasusCloud && window.PegasusCloud.isUnlocked) {
            window.PegasusCloud.push(true);
        }

        alert("PEGASUS: Οι ρυθμίσεις αποθηκεύτηκαν.");
        location.reload(); 
    },

    /**
     * 4. PANIC RESET PROTOCOL
     * Πλήρης εκκαθάριση για αντιμετώπιση data corruption
     */
    panicReset: function() {
        if (confirm("ΠΡΟΣΟΧΗ: Θα διαγραφούν ΟΛΑ τα δεδομένα και οι φωτογραφίες. Είστε σίγουροι;")) {
            localStorage.clear();
            
            // Διαγραφή IndexedDB
            const deleteRequest = indexedDB.deleteDatabase("PegasusLevels");
            deleteRequest.onsuccess = () => {
                alert("ΣΥΣΤΗΜΑ: Πλήρης επαναφορά ολοκληρώθηκε.");
                location.reload();
            };
        }
    }
};

window.saveSettings = () => PegasusSettings.saveAll();
window.panicReset = () => PegasusSettings.panicReset();

// Boot Sequence
window.addEventListener('load', () => PegasusSettings.init());