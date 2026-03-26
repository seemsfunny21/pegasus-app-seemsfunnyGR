/* ==========================================================================
   PEGASUS BACKUP & RESTORE - v6.0 (MODULAR / FULLY DECOUPLED)
   Protocol: Strict State Management - Isolated I/O Operations
   ========================================================================== */

const PegasusBackup = (function() {
    // 1. ΙΔΙΩΤΙΚΕΣ ΛΕΙΤΟΥΡΓΙΕΣ (Private Methods)
    const getLocalStorageData = () => {
        const lsData = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith("pegasus_") || key.startsWith("weight_") || key.startsWith("food_") || key.startsWith("cardio_") || key.includes("ANGELOS")) {
                lsData[key] = localStorage.getItem(key);
            }
        }
        return lsData;
    };

    const getIndexedDBData = () => {
        return new Promise((resolve, reject) => {
            const dbRequest = indexedDB.open("PegasusLevels", 1);
            dbRequest.onsuccess = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains("photos")) {
                    resolve([]);
                    return;
                }
                const tx = db.transaction("photos", "readonly");
                const store = tx.objectStore("photos");
                const photosReq = store.getAll();
                
                photosReq.onsuccess = () => resolve(photosReq.result);
                photosReq.onerror = () => reject("IDB Read Error");
            };
            dbRequest.onerror = () => reject("IDB Open Error");
        });
    };

    const restoreIndexedDBData = (photosArray) => {
        return new Promise((resolve, reject) => {
            const dbReq = indexedDB.open("PegasusLevels", 1);
            dbReq.onsuccess = (ev) => {
                const db = ev.target.result;
                if (!db.objectStoreNames.contains("photos")) {
                    resolve();
                    return;
                }
                const tx = db.transaction("photos", "readwrite");
                const store = tx.objectStore("photos");
                store.clear();
                photosArray.forEach(p => store.add(p));
                tx.oncomplete = () => resolve();
            };
            dbReq.onerror = () => reject("IDB Restore Error");
        });
    };

    const downloadFile = (data) => {
        const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `PEGASUS_FULL_BACKUP_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log("[PEGASUS BACKUP]: Full Sync (LS + IDB) exported successfully.");
    };

    // 2. PUBLIC API
    return {
        exportData: async function() {
            try {
                const data = { localStorage: getLocalStorageData(), indexedDB: [] };
                data.indexedDB = await getIndexedDBData();
                downloadFile(data);
            } catch (error) {
                console.error("[PEGASUS BACKUP]: Export failed.", error);
            }
        },

        importData: function(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const imported = JSON.parse(e.target.result);
                    if (!confirm("PEGASUS STRICT: Επιβεβαίωση πλήρους αντικατάστασης δεδομένων;")) return;

                    // Restore LocalStorage
                    if (imported.localStorage) {
                        Object.keys(imported.localStorage).forEach(k => localStorage.setItem(k, imported.localStorage[k]));
                    }

                    // Restore IndexedDB
                    if (imported.indexedDB && Array.isArray(imported.indexedDB)) {
                        await restoreIndexedDBData(imported.indexedDB);
                    }

                    alert("PEGASUS: Σύστημα Επαναφέρθηκε Επιτυχώς!");
                    window.location.reload();
                } catch (error) {
                    console.error("[PEGASUS BACKUP]: Import failed.", error);
                    alert("PEGASUS ERROR: Αποτυχία ανάγνωσης αρχείου.");
                }
            };
            reader.readAsText(file);
        },

        triggerImport: function() {
            const existingInput = document.getElementById('importFileTools');
            if (existingInput) {
                existingInput.click();
            } else {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.style.display = 'none';
                input.onchange = (e) => this.importData(e);
                document.body.appendChild(input);
                input.click();
                document.body.removeChild(input);
            }
        },
        
        init: function() {
            // UI Binding: Αντικατάσταση inline onclicks από το DOM
            const exportBtns = document.querySelectorAll('button[onclick*="exportPegasusData"]');
            exportBtns.forEach(btn => {
                btn.removeAttribute('onclick');
                btn.addEventListener('click', this.exportData);
            });

            const importTriggerBtns = document.querySelectorAll('button[onclick*="importFileTools"]');
            importTriggerBtns.forEach(btn => {
                btn.removeAttribute('onclick');
                btn.addEventListener('click', this.triggerImport.bind(this));
            });
            
            const fileInputs = document.querySelectorAll('input[onchange*="importPegasusData"]');
            fileInputs.forEach(input => {
                input.removeAttribute('onchange');
                input.addEventListener('change', (e) => this.importData(e));
            });
        }
    };
})();

// Εκκίνηση και Fallbacks
window.addEventListener('DOMContentLoaded', () => {
    PegasusBackup.init();
});
window.exportPegasusData = PegasusBackup.exportData;
window.importPegasusData = PegasusBackup.importData;
window.triggerPegasusImport = PegasusBackup.triggerImport;