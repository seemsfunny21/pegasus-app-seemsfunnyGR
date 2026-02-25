/* ==========================================================================
   PEGASUS BACKUP & RESTORE SYSTEM - FULL DATA EDITION
   ========================================================================== */

/**
 * 1. Εξαγωγή όλων των δεδομένων σε αρχείο .json
 * Περιλαμβάνει: Ρυθμίσεις, Βάρη, Διατροφή και Γκαλερί.
 */
window.exportPegasusData = function() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        // Φίλτρο για να παίρνει ΟΛΑ τα σχετικά δεδομένα του Pegasus
        if (
            key.startsWith("pegasus_") || 
            key.startsWith("weight_") || 
            key.startsWith("food_") || 
            key.startsWith("gallery_")
        ) {
            data[key] = localStorage.getItem(key);
        }
    }
    
    // Έλεγχος αν υπάρχουν δεδομένα
    if (Object.keys(data).length === 0) {
        alert("PEGASUS STRICT: Δεν βρέθηκαν δεδομένα για αποθήκευση!");
        return;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    
    // Όνομα αρχείου με τη σημερινή ημερομηνία
    const timestamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `pegasus_full_backup_${timestamp}.json`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log("Backup completed successfully.");
};

/**
 * 2. Εισαγωγή δεδομένων από αρχείο
 * Φορτώνει τα πάντα και κάνει ανανέωση της εφαρμογής.
 */
window.importPegasusData = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Επιβεβαίωση από τον χρήστη
            const confirmImport = confirm(
                "ΠΡΟΣΟΧΗ: Η εισαγωγή θα συγχωνεύσει τα δεδομένα του αρχείου με τα τρέχοντα. Συνέχεια;"
            );

            if (confirmImport) {
                Object.keys(importedData).forEach(key => {
                    localStorage.setItem(key, importedData[key]);
                });
                
                alert("PEGASUS: Τα δεδομένα εισήχθησαν με επιτυχία! Η εφαρμογή θα κάνει ανανέωση.");
                window.location.reload();
            }
        } catch (err) {
            alert("PEGASUS ERROR: Το αρχείο δεν είναι έγκυρο ή είναι κατεστραμμένο.");
            console.error(err);
        }
    };
    reader.readAsText(file);
};