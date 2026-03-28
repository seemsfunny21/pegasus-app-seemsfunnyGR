/* ==========================================================================
   PEGASUS BACKUP & RESTORE - FINAL FORENSIC (V8.5)
   Protocol: Crash-Proof Isolation & Data Consolidation
   ========================================================================== */

window.exportPegasusData = async function() {
    const data = { localStorage: {}, indexedDB: [] };
    let consolidatedWorkouts = {};

    // 1. ΣΑΡΩΣΗ & ΕΝΟΠΟΙΗΣΗ (Forensic Scan)
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const val = localStorage.getItem(key);

        // Ανίχνευση παλαιών κλειδιών ιστορικού και μετατροπή σε format YYYY-MM-DD
        if (key.startsWith("pegasus_history_") || key.startsWith("pegasus_day_status_")) {
            const dateMatch = key.match(/\d{4}-\d{2}-\d{2}/);
            if (dateMatch) consolidatedWorkouts[dateMatch[0]] = true;
        }

        // Επιλογή έγκυρων κλειδιών Pegasus
        if (key.startsWith("pegasus_") || key.startsWith("weight_") || key.startsWith("food_") || key.startsWith("cardio_") || key.includes("ANGELOS")) {
            data.localStorage[key] = val;
        }
    }

    // 2. ΔΙΟΡΘΩΣΗ ΚΕΝΤΡΙΚΟΥ ΙΣΤΟΡΙΚΟΥ
    const existingHistory = JSON.parse(localStorage.getItem("pegasus_workouts_done") || "{}");
    const finalHistory = { ...existingHistory, ...consolidatedWorkouts };
    data.localStorage["pegasus_workouts_done"] = JSON.stringify(finalHistory);
    data.localStorage["pegasus_total_workouts"] = Object.keys(finalHistory).length.toString();

    // 3. ΕΞΑΓΩΓΗ INDEXEDDB (Φωτογραφίες)
    const dbRequest = indexedDB.open("PegasusLevels", 1);
    dbRequest.onsuccess = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("photos")) {
            db.close();
            finalizeExport(data);
            return;
        }
        const tx = db.transaction("photos", "readonly");
        tx.objectStore("photos").getAll().onsuccess = (ev) => {
            data.indexedDB = ev.target.result;
            db.close();
            finalizeExport(data);
        };
    };
    dbRequest.onerror = () => finalizeExport(data);
};

function finalizeExport(data) {
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PEGASUS_FULL_BACKUP_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    console.log("✅ PEGASUS: Forensic Backup Created.");
}

/* ==========================================================================
   RESTORE ENGINE (CRASH-PROOF)
   ========================================================================== */
window.importPegasusData = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (!confirm("🚨 PEGASUS EMERGENCY RESTORE: Θα διαγραφούν τα τρέχοντα δεδομένα για την επαναφορά. Συνέχεια;")) return;

            console.log("%c[RECOVERY] Starting Isolated Restore Protocol...", "color: #4CAF50; font-weight: bold;");

            // 1. ΑΠΕΝΕΡΓΟΠΟΙΗΣΗ ΣΥΝΔΕΣΕΩΝ
            if (window.GalleryEngine && window.GalleryEngine.db) {
                window.GalleryEngine.db.close();
            }

            // 2. ΚΑΘΑΡΙΣΜΟΣ & ΕΝΕΣΗ LOCALSTORAGE
            localStorage.clear();
            Object.keys(imported.localStorage).forEach(k => {
                localStorage.setItem(k, imported.localStorage[k]);
            });

            // Δικλείδα ασφαλείας για το βάρος αν λείπει
            if (!localStorage.getItem("pegasus_weight")) localStorage.setItem("pegasus_weight", "74");

            console.log("%c[RECOVERY] LocalStorage Injected Successfully.", "color: #4CAF50");

            // 3. ΑΝΑΔΟΜΗΣΗ INDEXEDDB (Με καθυστέρηση για αποδέσμευση locks)
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
                    alert("Η βάση δεδομένων είναι μπλοκαρισμένη. Κλείσε άλλα tabs και δοκίμασε ξανά.");
                    location.reload();
                };
            }, 600);

        } catch (err) {
            alert("FATAL RESTORE ERROR: " + err.message);
        }
    };
    reader.readAsText(file);
};

function finalizeRecovery() {
    alert("✅ Η ΑΝΑΚΤΗΣΗ ΠΕΤΥΧΕ!\n\nΌλες οι προπονήσεις και οι φωτογραφίες επανήλθαν.");
    window.location.reload();
}

window.triggerPegasusImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => window.importPegasusData(e);
    input.click();
};
