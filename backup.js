/* ==========================================================================
   PEGASUS BACKUP & RESTORE - CLEAN SWEEP v17.0
   Protocol: Full Vault Sync (LS + IndexedDB) | Logic: Secure JSON Export
   ========================================================================== */

window.exportPegasusData = async function() {
    const data = { 
        localStorage: {}, 
        indexedDB: [],
        exportDate: new Date().toISOString(),
        version: "17.0"
    };
    
    // 1. Συλλογή LocalStorage (Weights, Food, Goals, Partner Data)
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // Φιλτράρισμα κλειδιών PEGASUS για καθαρό backup
        if (key.startsWith("pegasus_") || 
            key.startsWith("weight_") || 
            key.startsWith("food_") || 
            key.startsWith("cardio_") || 
            key.includes("ANGELOS") ||
            key.includes("PARTNER")) {
            data.localStorage[key] = localStorage.getItem(key);
        }
    }

    // 2. Συλλογή IndexedDB (Φωτογραφίες Προόδου)
    const dbRequest = indexedDB.open("PegasusLevels", 1);
    dbRequest.onsuccess = async (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("photos")) {
            this.finalizeExport(data);
            return;
        }
        
        const tx = db.transaction("photos", "readonly");
        const store = tx.objectStore("photos");
        const photosReq = store.getAll();
        
        photosReq.onsuccess = () => {
            data.indexedDB = photosReq.result;
            this.finalizeExport(data);
        };
    };
    
    dbRequest.onerror = () => this.finalizeExport(data);
};

window.finalizeExport = function(data) {
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PEGASUS_OS_BKP_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    
    if (window.PegasusLogger) {
        window.PegasusLogger.log("Full System Backup Exported Successfully", "INFO");
    }
    console.log("PEGASUS: Full Backup Completed.");
};

/**
 * Διαδικασία Εισαγωγής Δεδομένων
 */
window.importPegasusData = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (!confirm("ΠΡΟΣΟΧΗ: Αυτή η ενέργεια θα αντικαταστήσει ΟΛΑ τα τρέχοντα δεδομένα. Συνέχεια;")) return;

            // 1. Επαναφορά LocalStorage
            localStorage.clear();
            Object.keys(imported.localStorage).forEach(k => {
                localStorage.setItem(k, imported.localStorage[k]);
            });

            // 2. Επαναφορά IndexedDB
            const dbReq = indexedDB.open("PegasusLevels", 1);
            dbReq.onsuccess = (ev) => {
                const db = ev.target.result;
                const tx = db.transaction("photos", "readwrite");
                const store = tx.objectStore("photos");
                store.clear();
                
                if (imported.indexedDB && imported.indexedDB.length > 0) {
                    imported.indexedDB.forEach(p => store.add(p));
                }
                
                alert("ΣΥΓΧΡΟΝΙΣΜΟΣ ΕΠΙΤΥΧΗΣ: Το σύστημα θα επανεκκινήσει.");
                window.location.reload();
            };
        } catch (err) {
            alert("ΣΦΑΛΜΑ: Το αρχείο backup δεν είναι έγκυρο.");
            console.error(err);
        }
    };
    reader.readAsText(file);
};

window.triggerPegasusImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => window.importPegasusData(e);
    input.click();
};