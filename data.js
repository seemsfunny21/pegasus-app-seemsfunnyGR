/* ==========================================================================
   PEGASUS BACKUP & RESTORE - ULTIMATE PROTOCOL (V7.0)
   Features: Cloud-Lock, Connection-Kill, Forensic-Import
   ========================================================================== */

window.exportPegasusData = async function() {
    const data = { localStorage: {}, indexedDB: [] };
    
    // 1. Collect LS
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("pegasus_") || key.startsWith("weight_") || key.startsWith("food_") || key.startsWith("cardio_") || key.includes("ANGELOS")) {
            data.localStorage[key] = localStorage.getItem(key);
        }
    }

    // 2. Collect IndexedDB
    const dbRequest = indexedDB.open("PegasusLevels", 1);
    dbRequest.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction("photos", "readonly");
        tx.objectStore("photos").getAll().onsuccess = (ev) => {
            data.indexedDB = ev.target.result;
            const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `PEGASUS_V7_BACKUP_${new Date().toISOString().slice(0,10)}.json`;
            a.click();
            db.close();
        };
    };
};

window.importPegasusData = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const imported = JSON.parse(e.target.result);
        if (!confirm("🚨 ΚΡΙΣΙΜΟ: Θα διαγραφούν τα πάντα για να μπουν οι 44 προπονήσεις. Συνέχεια;")) return;

        // ΒΗΜΑ 1: Απενεργοποίηση Cloud Key (για να μην κάνει Pull μετά το reload)
        const cloudKey = localStorage.getItem("pegasus_vault_pin");
        localStorage.removeItem("pegasus_vault_pin");

        // ΒΗΜΑ 2: Καθαρισμός LocalStorage
        localStorage.clear();

        // ΒΗΜΑ 3: Injection Δεδομένων
        Object.keys(imported.localStorage).forEach(k => {
            localStorage.setItem(k, imported.localStorage[k]);
        });

        // ΒΗΜΑ 4: IndexedDB Force Rebuild (Safe Mode)
        // Κλείνουμε τη σύνδεση της Gallery αν υπάρχει
        if (window.GalleryEngine && window.GalleryEngine.db) {
            window.GalleryEngine.db.close();
        }

        const deleteReq = indexedDB.deleteDatabase("PegasusLevels");
        deleteReq.onsuccess = () => {
            const dbReq = indexedDB.open("PegasusLevels", 1);
            dbReq.onupgradeneeded = (ev) => {
                ev.target.result.createObjectStore("photos", { keyPath: "id" });
            };
            dbReq.onsuccess = (ev) => {
                const db = ev.target.result;
                if (imported.indexedDB && imported.imported.indexedDB.length > 0) {
                    const tx = db.transaction("photos", "readwrite");
                    imported.indexedDB.forEach(p => tx.objectStore("photos").add(p));
                    tx.oncomplete = () => finalizeRestore();
                } else {
                    finalizeRestore();
                }
            };
        };
    };
    reader.readAsText(file);
};

function finalizeRestore() {
    alert("✅ ΕΠΙΤΥΧΙΑ! Ο Pegasus OS θα κάνει επανεκκίνηση. \n\nΜΟΛΙΣ ΦΟΡΤΩΣΕΙ: Βάλε το PIN σου και πάτα αμέσως 'Push' για να ενημερωθεί το Cloud με τις 44 προπονήσεις.");
    window.location.reload();
}

window.triggerPegasusImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => window.importPegasusData(e);
    input.click();
};
