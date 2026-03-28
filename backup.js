/* ==========================================================================
   PEGASUS BACKUP & RESTORE - MASTER MANIFEST EDITION (V9.0)
   Protocol: Strict Data Mapping, Forensic Integrity & Anti-Silent Fail
   ========================================================================== */

window.exportPegasusData = async function() {
    // Έλεγχος ύπαρξης Μανιφέστου
    if (!window.PegasusManifest) {
        console.error("❌ CRITICAL: PegasusManifest not found. Export aborted.");
        alert("ΣΦΑΛΜΑ: Λείπει το manifest.js. Η εξαγωγή ακυρώθηκε.");
        return;
    }

    const data = { localStorage: {}, indexedDB: [] };
    const M = window.PegasusManifest;
    
    console.log("%c[BACKUP] Starting Manifest-Based Scan...", "color: #00bcd4; font-weight: bold;");

    // 1. ΔΥΝΑΜΙΚΗ ΣΥΛΛΟΓΗ ΒΑΣΕΙ ΜΑΝΙΦΕΣΤΟΥ
    // Σαρώνουμε όλο το LocalStorage και κρατάμε μόνο ό,τι ορίζει το Μανιφέστο
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const val = localStorage.getItem(key);

        // Έλεγχος αν το κλειδί είναι επίσημο ή ξεκινάει με εγκεκριμένο πρόθεμα (prefix)
        const isOfficial = Object.values(M).some(category => 
            Object.values(category).some(manifestKey => 
                key === manifestKey || (typeof manifestKey === 'string' && key.startsWith(manifestKey))
            )
        );

        // Συμπερίληψη κλειδιών βάρους (Legacy support) και επίσημων κλειδιών
        if (isOfficial || key.includes("ANGELOS") || key.startsWith("weight_")) {
            data.localStorage[key] = val;
        }
    }

    // 2. ΕΞΑΓΩΓΗ INDEXEDDB (Φωτογραφίες Προόδου)
    const dbRequest = indexedDB.open("PegasusLevels", 1);
    dbRequest.onsuccess = (e) => {
        const db = e.target.result;
        
        // Αν δεν υπάρχει το store των φωτογραφιών, κλείνουμε και εξάγουμε μόνο LS
        if (!db.objectStoreNames.contains("photos")) {
            db.close();
            finalizeExport(data);
            return;
        }

        const tx = db.transaction("photos", "readonly");
        const store = tx.objectStore("photos");
        
        store.getAll().onsuccess = (ev) => {
            data.indexedDB = ev.target.result;
            db.close();
            finalizeExport(data);
        };
    };

    dbRequest.onerror = () => {
        console.warn("IndexedDB Access Failed. Exporting LocalStorage only.");
        finalizeExport(data);
    };
};

function finalizeExport(data) {
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const timestamp = new Date().toISOString().slice(0,10);
    
    a.href = url;
    a.download = `PEGASUS_V9_MASTER_${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    console.log("%c✅ PEGASUS: Manifest-Based Backup Created Successfully.", "color: #4CAF50; font-weight: bold;");
}

/* ==========================================================================
   RESTORE ENGINE (V9.0 - CRASH-PROOF ISOLATION)
   ========================================================================== */
window.importPegasusData = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            
            const msg = `🚨 PEGASUS OS: ΕΝΑΡΞΗ ΑΝΑΚΤΗΣΗΣ\n\n` +
                        `Θα γίνει πλήρης επαναφορά δεδομένων και φωτογραφιών.\n` +
                        `Τα τρέχοντα δεδομένα θα διαγραφούν. Συνέχεια;`;
            
            if (!confirm(msg)) return;

            console.log("%c[RECOVERY] Initializing Manifest Sync...", "color: #ff9800; font-weight: bold;");

            // 1. ΑΠΕΝΕΡΓΟΠΟΙΗΣΗ ΣΥΝΔΕΣΕΩΝ GALLERY
            if (window.GalleryEngine && window.GalleryEngine.db) {
                window.GalleryEngine.db.close();
            }

            // 2. ΚΑΘΑΡΙΣΜΟΣ & ΕΓΧΥΣΗ LOCALSTORAGE
            localStorage.clear();
            Object.keys(imported.localStorage).forEach(k => {
                localStorage.setItem(k, imported.localStorage[k]);
            });

            // 3. ΔΙΚΛΕΙΔΑ ΑΣΦΑΛΕΙΑΣ (Weight Protection)
            if (!localStorage.getItem("pegasus_weight")) {
                localStorage.setItem("pegasus_weight", "74");
            }

            console.log("%c[RECOVERY] LocalStorage Synchronized.", "color: #4CAF50");

            // 4. ΑΝΑΔΟΜΗΣΗ INDEXEDDB (Με καθυστέρηση 600ms για αποδέσμευση Locks)
            setTimeout(() => {
                const delReq = indexedDB.deleteDatabase("PegasusLevels");
                
                delReq.onsuccess = () => {
                    const dbReq = indexedDB.open("PegasusLevels", 1);
                    
                    dbReq.onupgradeneeded = (ev) => {
                        ev.target.result.createObjectStore("photos", { keyPath: "id" });
                    };
                    
                    dbReq.onsuccess = (ev) => {
                        const db = ev.target.result;
                        if (imported.indexedDB && imported.indexedDB.length > 0) {
                            const tx = db.transaction("photos", "readwrite");
                            imported.indexedDB.forEach(p => tx.objectStore("photos").add(p));
                            tx.oncomplete = () => {
                                db.close();
                                finalizeRecovery();
                            };
                        } else {
                            db.close();
                            finalizeRecovery();
                        }
                    };
                };

                delReq.onblocked = () => {
                    alert("🚨 ΣΦΑΛΜΑ: Η βάση δεδομένων είναι μπλοκαρισμένη.\nΚλείσε άλλα tabs του Pegasus και δοκίμασε ξανά.");
                    location.reload();
                };
            }, 600);

        } catch (err) {
            console.error("Critical Recovery Failure:", err);
            alert("FATAL RESTORE ERROR: " + err.message);
        }
    };
    reader.readAsText(file);
};

function finalizeRecovery() {
    alert("✅ Η ΑΝΑΚΤΗΣΗ ΟΛΟΚΛΗΡΩΘΗΚΕ!\n\nΌλες οι προπονήσεις και οι φωτογραφίες επανήλθαν.");
    window.location.reload();
}

// Global Trigger για το UI
window.triggerPegasusImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => window.importPegasusData(e);
    input.click();
};
