/* ==========================================================================
   PEGASUS BACKUP & RESTORE - TRACEABLE FORENSIC (V7.5)
   ========================================================================== */

window.exportPegasusData = async function() {
    const data = { localStorage: {}, indexedDB: [] };
    let consolidatedWorkouts = {};

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const val = localStorage.getItem(key);
        if (key.startsWith("pegasus_history_") || key.startsWith("pegasus_day_status_")) {
            const datePart = key.match(/\d{4}-\d{2}-\d{2}/);
            if (datePart) consolidatedWorkouts[datePart[0]] = true;
        }
        if (key.startsWith("pegasus_") || key.startsWith("weight_") || key.startsWith("food_") || key.startsWith("cardio_") || key.includes("ANGELOS")) {
            data.localStorage[key] = val;
        }
    }

    const existingCentral = JSON.parse(localStorage.getItem("pegasus_workouts_done") || "{}");
    const finalWorkouts = { ...existingCentral, ...consolidatedWorkouts };
    data.localStorage["pegasus_workouts_done"] = JSON.stringify(finalWorkouts);
    data.localStorage["pegasus_total_workouts"] = Object.keys(finalWorkouts).length.toString();

    const dbRequest = indexedDB.open("PegasusLevels", 1);
    dbRequest.onsuccess = (e) => {
        const db = e.target.result;
        try {
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
        } catch (err) {
            db.close();
            finalizeExport(data);
        }
    };
};

function finalizeExport(data) {
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PEGASUS_FORENSIC_V75_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

window.importPegasusData = function(event) {
    const btnId = "btnImportData";
    if (window.PegasusTracer) window.PegasusTracer.log(btnId, "FILE_SELECT", "SUCCESS");

    const file = event.target.files[0];
    if (!file) {
        if (window.PegasusTracer) window.PegasusTracer.log(btnId, "FILE_READ", "ERROR", "No file selected");
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            if (window.PegasusTracer) window.PegasusTracer.log(btnId, "JSON_PARSE", "START");
            const imported = JSON.parse(e.target.result);
            if (window.PegasusTracer) window.PegasusTracer.log(btnId, "JSON_PARSE", "SUCCESS");

            if (!confirm("🚨 ΕΠΑΝΑΦΟΡΑ ΣΥΣΤΗΜΑΤΟΣ: Θα διαγραφούν τα πάντα. Συνέχεια;")) {
                if (window.PegasusTracer) window.PegasusTracer.log(btnId, "USER_CONFIRM", "CANCELLED");
                return;
            }

            // 1. LOCALSTORAGE RESTORE
            if (window.PegasusTracer) window.PegasusTracer.log(btnId, "LOCALSTORAGE_WRITE", "START");
            localStorage.clear();
            Object.keys(imported.localStorage).forEach(k => {
                localStorage.setItem(k, imported.localStorage[k]);
            });
            if (window.PegasusTracer) window.PegasusTracer.log(btnId, "LOCALSTORAGE_WRITE", "SUCCESS");

            // 2. INDEXEDDB RESET
            if (window.PegasusTracer) window.PegasusTracer.log(btnId, "INDEXEDDB_DELETE", "PENDING");
            
            // Κλείσιμο υπαρχουσών συνδέσεων πριν τη διαγραφή
            if (window.GalleryEngine && window.GalleryEngine.db) window.GalleryEngine.db.close();

            const delReq = indexedDB.deleteDatabase("PegasusLevels");
            
            delReq.onsuccess = () => {
                if (window.PegasusTracer) window.PegasusTracer.log(btnId, "INDEXEDDB_DELETE", "SUCCESS");
                
                const dbReq = indexedDB.open("PegasusLevels", 1);
                dbReq.onupgradeneeded = (idxEv) => {
                    idxEv.target.result.createObjectStore("photos", { keyPath: "id" });
                };

                dbReq.onsuccess = (idxEv) => {
                    const db = idxEv.target.result;
                    if (imported.indexedDB && imported.indexedDB.length > 0) {
                        if (window.PegasusTracer) window.PegasusTracer.log(btnId, "IDB_PHOTO_INJECTION", "START");
                        const tx = db.transaction("photos", "readwrite");
                        imported.indexedDB.forEach(p => tx.objectStore("photos").add(p));
                        
                        tx.oncomplete = () => {
                            if (window.PegasusTracer) window.PegasusTracer.log(btnId, "IDB_PHOTO_INJECTION", "SUCCESS");
                            db.close();
                            finalizeRestore(btnId);
                        };
                    } else {
                        db.close();
                        finalizeRestore(btnId);
                    }
                };
            };

            delReq.onblocked = () => {
                if (window.PegasusTracer) window.PegasusTracer.log(btnId, "INDEXEDDB_DELETE", "ERROR", "Database Blocked");
                alert("ΣΦΑΛΜΑ: Η βάση δεδομένων είναι κλειδωμένη. Κλείσε άλλα παράθυρα του Pegasus.");
            };

        } catch (err) {
            if (window.PegasusTracer) window.PegasusTracer.log(btnId, "RESTORE_CHAIN", "ERROR", err.message);
        }
    };
    reader.readAsText(file);
};

function finalizeRestore(btnId) {
    if (window.PegasusTracer) window.PegasusTracer.log(btnId, "RESTORE_COMPLETE", "SUCCESS");
    alert("Η επαναφορά ολοκληρώθηκε επιτυχώς!");
    window.location.reload();
}

window.triggerPegasusImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => window.importPegasusData(e);
    input.click();
};
