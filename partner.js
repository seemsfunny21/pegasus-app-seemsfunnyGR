/* ==========================================================================
   PEGASUS PARTNER ENGINE - CLEAN SWEEP v17.0
   Protocol: Dual-Profile Isolation | Logic: Weight Key Partitioning
   ========================================================================== */

window.partnerData = {
    isActive: false,
    currentPartner: "", 
    isUser1Turn: true // True = Angelos, False = Partner
};

/**
 * 1. TURN MANAGEMENT
 * Εναλλαγή μεταξύ των χρηστών
 */
window.togglePartnerTurn = function() {
    if (!window.partnerData.isActive) return;
    
    window.partnerData.isUser1Turn = !window.partnerData.isUser1Turn;
    
    // Ενημέρωση του UI στο App Engine
    const currentName = window.partnerData.isUser1Turn ? "ΑΓΓΕΛΟΣ" : window.partnerData.currentPartner;
    
    if (window.PegasusLogger) {
        window.PegasusLogger.log(`Turn Switched to: ${currentName}`, "INFO");
    }

    // Trigger visual update στις ασκήσεις
    const activeEx = document.querySelector('.exercise[style*="rgba(76, 175, 80"]');
    if (activeEx) {
        activeEx.style.borderColor = window.partnerData.isUser1Turn ? "#4CAF50" : "#00bcd4";
    }
};

/**
 * 2. PROFILE INITIALIZATION
 */
window.activatePartnerMode = function() {
    const nameInput = document.getElementById('partnerNameInput');
    const btn = document.getElementById('btnPartnerMode');
    
    if (!window.partnerData.isActive) {
        let rawName = nameInput ? nameInput.value.trim() : "";
        let upperName = rawName.toUpperCase();

        if (rawName === "" || upperName === "ANGELOS" || upperName === "ΑΓΓΕΛΟΣ") {
            alert("PEGASUS STRICT: Εισάγετε έγκυρο όνομα συνεργάτη!");
            return;
        }

        window.partnerData.isActive = true;
        window.partnerData.currentPartner = upperName;
        
        if (btn) {
            btn.textContent = `ΣΥΝΕΡΓΑΤΗΣ: ${upperName} (ON)`;
            btn.style.background = "#4CAF50";
            btn.style.color = "#000";
        }
        
        console.log(`✅ PEGASUS: Partner Mode Active [${upperName}]`);
    } else {
        // Απενεργοποίηση
        window.partnerData.isActive = false;
        window.partnerData.isUser1Turn = true;
        if (btn) {
            btn.textContent = "PARTNER MODE (OFF)";
            btn.style.background = "#111";
            btn.style.color = "#4CAF50";
        }
    }
};

/**
 * 3. WEIGHT LOGISTICS
 * Διαχείριση αποθήκευσης βάσει του τρέχοντος Turn
 */
window.savePartnerWeight = function(exerciseName, weight) {
    const userKey = window.partnerData.isUser1Turn ? "ANGELOS" : window.partnerData.currentPartner;
    const cleanName = exerciseName.trim();
    
    // Αποθήκευση στο Partition του χρήστη
    localStorage.setItem(`weight_${userKey}_${cleanName}`, weight);
    
    // Αν είναι ο Άγγελος, ενημερώνουμε και το Master Key για συμβατότητα με το παλιό σύστημα
    if (window.partnerData.isUser1Turn) {
        localStorage.setItem(`weight_${cleanName}`, weight);
    }
    
    if (window.PegasusCloud) window.PegasusCloud.push(true);
};

window.loadPartnerWeight = function(exerciseName) {
    const userKey = window.partnerData.isUser1Turn ? "ANGELOS" : window.partnerData.currentPartner;
    const cleanName = exerciseName.trim();
    
    // Προσπάθεια ανάκτησης από το partition, αλλιώς από το master key
    return localStorage.getItem(`weight_${userKey}_${cleanName}`) || 
           localStorage.getItem(`weight_${cleanName}`) || "";
};

console.log("✅ PEGASUS: Partner Engine Operational.");