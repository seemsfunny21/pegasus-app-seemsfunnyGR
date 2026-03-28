/* ==========================================================================
   PEGASUS BACKUP & RESTORE - CRASH-PROOF (V7.8)
   ========================================================================== */

window.importPegasusData = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            // 1. Safe Parse
            const imported = JSON.parse(e.target.result);
            if (!confirm("🚨 PEGASUS EMERGENCY RESTORE: Συνέχεια;")) return;

            console.log("%c[RECOVERY] Starting Isolated Restore...", "color: #4CAF50");

            // 2. Kill all potential blocking processes
            if (window.GalleryEngine && window.GalleryEngine.db) {
                window.GalleryEngine.db.close();
            }

            // 3. Clear and Inject LS (The Core Data)
            localStorage.clear();
            Object.keys(imported.localStorage).forEach(k => {
                localStorage.setItem(k, imported.localStorage[k]);
            });
            console.log("%c[RECOVERY] LocalStorage Restored.", "color: #4CAF50");

            // 4. Force Delete & Rebuild IndexedDB
            // Χρησιμοποιούμε setTimeout για να δώσουμε χρόνο στον browser να κλείσει τα locks
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
                    console.error("DB Blocked - Reloading to force close connections...");
                    location.reload();
                };
            }, 500);

        } catch (err) {
            alert("FATAL RESTORE ERROR: " + err.message);
        }
    };
    reader.readAsText(file);
};

function finalizeRecovery() {
    alert("✅ Η ΑΝΑΚΤΗΣΗ ΠΕΤΥΧΕ!\n\nΑν μετά το reload δεις πάλι σφάλματα, φταίει το αρχείο data.js που λείπει.");
    window.location.reload();
}

window.triggerPegasusImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => window.importPegasusData(e);
    input.click();
};
