/* ==========================================================================
   PEGASUS BACKUP & RESTORE - FORENSIC EDITION (V6.0)
   Feature: Auto-Migration of Legacy History Keys
   ========================================================================== */

window.exportPegasusData = async function() {
    const data = { localStorage: {}, indexedDB: [] };
    let consolidatedWorkouts = {};

    // 1. SCAN & CONSOLIDATE (Forensic Logic)
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const val = localStorage.getItem(key);

        // Αν βρει παλιά κλειδιά ιστορικού, τα ενώνει στο κεντρικό log
        if (key.startsWith("pegasus_history_") || key.startsWith("pegasus_day_status_")) {
            const datePart = key.match(/\d{4}-\d{2}-\d{2}/);
            if (datePart) consolidatedWorkouts[datePart[0]] = true;
        }

        // Φιλτράρισμα και συλλογή έγκυρων κλειδιών
        if (key.startsWith("pegasus_") || key.startsWith("weight_") || key.startsWith("food_") || key.startsWith("cardio_") || key.includes("ANGELOS")) {
            data.localStorage[key] = val;
        }
    }

    // 2. INJECT FIXED DATA: Διασφαλίζουμε ότι το backup περιέχει το κεντρικό κλειδί διορθωμένο
    const existingCentral = JSON.parse(localStorage.getItem("pegasus_workouts_done") || "{}");
    const finalWorkouts = { ...existingCentral, ...consolidatedWorkouts };
    data.localStorage["pegasus_workouts_done"] = JSON.stringify(finalWorkouts);
    data.localStorage["pegasus_total_workouts"] = Object.keys(finalWorkouts).length.toString();

    // 3. COLLECT INDEXEDDB (Photos)
    const dbRequest = indexedDB.open("PegasusLevels", 1);
    dbRequest.onsuccess = async (e) => {
        const db = e.target.result;
        try {
            const tx = db.transaction("photos", "readonly");
            const store = tx.objectStore("photos");
            const photosReq = store.getAll();
            
            photosReq.onsuccess = () => {
                data.indexedDB = photosReq.result;
                finalizeExport(data);
            };
        } catch (err) {
            console.warn("PEGASUS: IndexedDB empty or not found, exporting LS only.");
            finalizeExport(data);
        }
    };
    dbRequest.onerror = () => finalizeExport(data);
};

function finalizeExport(data) {
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PEGASUS_FORENSIC_BACKUP_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    console.log("PEGASUS: Backup v6.0 created with Auto-Fix logic.");
}

window.importPegasusData = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (!confirm("ΠΡΟΣΟΧΗ: Θα γίνει ολική αντικατάσταση δεδομένων. Συνέχεια;")) return;

            // Restore LocalStorage
            Object.keys(imported.localStorage).forEach(k => {
                localStorage.setItem(k, imported.localStorage[k]);
            });

            // Restore IndexedDB
            const dbReq = indexedDB.open("PegasusLevels", 1);
            dbReq.onupgradeneeded = (ev) => {
                const db = ev.target.result;
                if (!db.objectStoreNames.contains("photos")) {
                    db.createObjectStore("photos", { keyPath: "id", autoIncrement: true });
                }
            };
            dbReq.onsuccess = (ev) => {
                const db = ev.target.result;
                const tx = db.transaction("photos", "readwrite");
                const store = tx.objectStore("photos");
                store.clear();
                if (imported.indexedDB && imported.indexedDB.length > 0) {
                    imported.indexedDB.forEach(p => store.add(p));
                }
                alert("Συγχρονισμός και Διόρθωση Επιτυχής!");
                window.location.reload();
            };
        } catch (err) {
            alert("Σφάλμα στην ανάγνωση του αρχείου!");
            console.error(err);
        }
    };
    reader.readAsText(file);
};

window.triggerPegasusImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => window.importPegasusData(e);
    input.click();
};
