/* ==========================================================================
   PEGASUS BACKUP & RESTORE - INDEXEDDB COMPATIBLE (V5.0)
   ========================================================================== */

window.exportPegasusData = async function() {
    const data = { localStorage: {}, indexedDB: [] };
    
    // 1. Collect LocalStorage (Weights, Food, Goals)
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("pegasus_") || key.startsWith("weight_") || key.startsWith("food_") || key.startsWith("cardio_") || key.includes("ANGELOS")) {
            data.localStorage[key] = localStorage.getItem(key);
        }
    }

    // 2. Collect IndexedDB (Photos)
    const dbRequest = indexedDB.open("PegasusLevels", 1);
    dbRequest.onsuccess = async (e) => {
        const db = e.target.result;
        const tx = db.transaction("photos", "readonly");
        const store = tx.objectStore("photos");
        const photosReq = store.getAll();
        
        photosReq.onsuccess = () => {
            data.indexedDB = photosReq.result;
            
            // 3. Create File
            const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `PEGASUS_FULL_BACKUP_${new Date().toISOString().slice(0,10)}.json`;
            a.click();
            console.log("PEGASUS: Full Sync (LS + IDB) completed.");
        };
    };
};

window.importPegasusData = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const imported = JSON.parse(e.target.result);
        if (!confirm("Overwrite All Data?")) return;

        // Restore LocalStorage
        Object.keys(imported.localStorage).forEach(k => localStorage.setItem(k, imported.localStorage[k]));

        // Restore IndexedDB
        const dbReq = indexedDB.open("PegasusLevels", 1);
        dbReq.onsuccess = (ev) => {
            const db = ev.target.result;
            const tx = db.transaction("photos", "readwrite");
            const store = tx.objectStore("photos");
            store.clear();
            imported.indexedDB.forEach(p => store.add(p));
            alert("Συγχρονισμός Επιτυχής!");
            window.location.reload();
        };
    };
    reader.readAsText(file);
};

window.triggerPegasusImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => window.importPegasusData(e);
    input.click();
};