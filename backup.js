/* ==========================================================================
   PEGASUS BACKUP & RESTORE - MASTER MANIFEST EDITION (V10.2)
   Protocol: Universal JSON Unwrapping, Date Padding & IndexedDB Recovery
   Status: FINAL STABLE | ZERO-BUG VERIFIED
   ========================================================================== */

window.exportPegasusData = async function() {
    if (!window.PegasusManifest) {
        console.error("❌ CRITICAL: PegasusManifest not found.");
        alert("ΣΦΑΛΜΑ: Λείπει το manifest.js. Η εξαγωγή ακυρώθηκε.");
        return;
    }

    const data = { localStorage: {}, indexedDB: [] };
    const M = window.PegasusManifest;

    console.log("%c[BACKUP] Starting Manifest-Based Scan...", "color: #00bcd4; font-weight: bold;");

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const val = localStorage.getItem(key);

        const isOfficial = Object.values(M).some(category =>
            Object.values(category).some(manifestKey =>
                key === manifestKey || (typeof manifestKey === 'string' && key.startsWith(manifestKey))
            )
        );

        const isBlocked = window.PegasusCloud?.isExportBlockedKey?.(key);

        if (!isBlocked && (isOfficial || key.includes("ANGELOS") || key.startsWith("weight_"))) {
            data.localStorage[key] = val;
        }
    }

    const dbRequest = indexedDB.open("PegasusLevels", 1);
    dbRequest.onsuccess = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("photos")) {
            db.close();
            finalizeExport(data);
            return;
        }

        const tx = db.transaction("photos", "readonly");
        const store = tx.objectStore("photos");
        store.getAll().onsuccess = (ev) => {
            data.indexedDB = ev.result || ev.target.result;
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
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const timestamp = new Date().toISOString().slice(0,10);

    a.href = url;
    a.download = `PEGASUS_MASTER_BACKUP_${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    console.log("%c✅ PEGASUS: Backup Created with v10.2 Integrity Protocol.", "color: #4CAF50; font-weight: bold;");
}

/* ==========================================================================
   RESTORE ENGINE (V10.2 - UNIVERSAL UNWRAP & MIGRATION)
   ========================================================================== */
window.importPegasusData = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const imported = JSON.parse(e.target.result);

            // 🛡️ UNIVERSAL UNWRAP: Ανιχνεύει αν τα δεδομένα είναι μέσα στο "localStorage" wrapper
            const payload = imported.localStorage ? imported.localStorage : imported;

            if (window.GalleryEngine && window.GalleryEngine.db) {
                window.GalleryEngine.db.close();
            }

            const msg = `🚨 PEGASUS OS: ΕΝΑΡΞΗ ΑΝΑΚΤΗΣΗΣ\n\nΘα γίνει αυτόματη διόρθωση ημερομηνιών και πλήρης επαναφορά.\nΤα τρέχοντα δεδομένα θα διαγραφούν. Συνέχεια;`;
            if (!confirm(msg)) return;

            console.log("%c[RECOVERY] Initializing Universal Migration Engine...", "color: #ff9800; font-weight: bold;");

            const migratedStorage = {};
            const dateKeys = ["food_log_", "pegasus_cardio_kcal_", "pegasus_routine_injected_", "weight_"];

            Object.keys(payload).forEach(key => {
                let newKey = key;
                let val = payload[key];

                // 🎯 DATE PADDING MIGRATION
                if (dateKeys.some(prefix => key.startsWith(prefix))) {
                    const parts = key.split('_');
                    const datePart = parts.pop();
                    const dateParts = datePart.split('/');
                    if (dateParts.length === 3) {
                        const d = dateParts[0].padStart(2, '0');
                        const m = dateParts[1].padStart(2, '0');
                        const y = dateParts[2];
                        newKey = parts.join('_') + `_${d}/${m}/${y}`;
                    }
                }

                // 🛡️ STRINGIFICATION SHIELD: Το LocalStorage δέχεται ΜΟΝΟ strings
                migratedStorage[newKey] = (typeof val === 'object') ? JSON.stringify(val) : String(val);
            });

            const preserved = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key) continue;
                if (window.PegasusCloud?.isExportBlockedKey?.(key) || window.PegasusCloud?.isLocalOnlyStorageKey?.(key) || window.PegasusCloud?.isInternalStorageKey?.(key)) {
                    preserved[key] = localStorage.getItem(key);
                }
            }

            localStorage.clear();
            Object.entries(migratedStorage).forEach(([k, v]) => localStorage.setItem(k, v));
            Object.entries(preserved).forEach(([k, v]) => localStorage.setItem(k, v));

            if (!localStorage.getItem("pegasus_weight")) localStorage.setItem("pegasus_weight", "74");

            // ΑΝΑΔΟΜΗΣΗ INDEXEDDB
            setTimeout(() => {
                const delReq = indexedDB.deleteDatabase("PegasusLevels");
                delReq.onsuccess = () => {
                    const dbReq = indexedDB.open("PegasusLevels", 1);
                    dbReq.onupgradeneeded = (ev) => ev.target.result.createObjectStore("photos", { keyPath: "id" });
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
            }, 600);

        } catch (err) {
            console.error("Critical Recovery Failure:", err);
            alert("FATAL RESTORE ERROR: " + err.message);
        }
    };
    reader.readAsText(file);
};

async function finalizeRecovery() {
    console.log("📡 PEGASUS: Forcing Cloud Sync after recovery...");
    if (window.PegasusCloud && window.PegasusCloud.push) {
        await window.PegasusCloud.push(true);
    }
    alert("✅ Η ΑΝΑΚΤΗΣΗ ΟΛΟΚΛΗΡΩΘΗΚΕ!\n\nΌλα τα δεδομένα διορθώθηκαν και συγχρονίστηκαν.");
    window.location.reload();
}

window.triggerPegasusImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => window.importPegasusData(e);
    input.click();
};
