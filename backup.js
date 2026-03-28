/* ==========================================================================
   PEGASUS BACKUP & RESTORE - FORENSIC EDITION (V6.1)
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
    dbRequest.onsuccess = async (e) => {
        const db = e.target.result;
        try {
            if (!db.objectStoreNames.contains("photos")) {
                finalizeExport(data);
                return;
            }
            const tx = db.transaction("photos", "readonly");
            const store = tx.objectStore("photos");
            const photosReq = store.getAll();
            photosReq.onsuccess = () => {
                data.indexedDB = photosReq.result;
                finalizeExport(data);
            };
        } catch (err) {
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
}

window.importPegasusData = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (!confirm("ΠΡΟΣΟΧΗ: Ολική αντικατάσταση. Συνέχεια;")) return;

            // 1. Καθαρισμός και Restore LocalStorage
            localStorage.clear(); 
            Object.keys(imported.localStorage).forEach(k => localStorage.setItem(k, imported.localStorage[k]));

            // 2. Robust IndexedDB Restore
            console.log("PEGASUS: Rebuilding IndexedDB...");
            const deleteReq = indexedDB.deleteDatabase("PegasusLevels"); // Διαγραφή για καθαρό build

            deleteReq.onsuccess = () => {
                const dbReq = indexedDB.open("PegasusLevels", 1);
                
                dbReq.onupgradeneeded = (ev) => {
                    const db = ev.target.result;
                    db.createObjectStore("photos", { keyPath: "id", autoIncrement: true });
                };

                dbReq.onsuccess = (ev) => {
                    const db = ev.target.result;
                    if (imported.indexedDB && imported.indexedDB.length > 0) {
                        const tx = db.transaction("photos", "readwrite");
                        const store = tx.objectStore("photos");
                        imported.indexedDB.forEach(p => store.add(p));
                        tx.oncomplete = () => {
                            alert("Συγχρονισμός Επιτυχής (LS + Photos)!");
                            window.location.reload();
                        };
                    } else {
                        alert("Συγχρονισμός Επιτυχής (LS Only)!");
                        window.location.reload();
                    }
                };
            };
        } catch (err) {
            alert("Σφάλμα στο Restore!");
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
