/* ==========================================================================
   PEGASUS GALLERY ENGINE - v6.0 (MODULAR / FULLY DECOUPLED)
   Protocol: Strict Data Analyst - Isolated IndexedDB Management
   ========================================================================== */

const PegasusGallery = (function() {
    // 1. ΙΔΙΩΤΙΚΟ STATE & ΡΥΘΜΙΣΕΙΣ (Private State)
    const DB_NAME = "PegasusLevels";
    const DB_VERSION = 1;
    let db = null;
    let selectedPhotos = [];

    // 2. ΕΣΩΤΕΡΙΚΕΣ ΛΕΙΤΟΥΡΓΙΕΣ (Private Methods)
    const setupUI = () => {
        const btnOpen = document.getElementById('btnOpenGallery');
        if (btnOpen) {
            btnOpen.removeAttribute('onclick');
            btnOpen.addEventListener('click', (e) => {
                if (e) e.stopPropagation();
                const tools = document.getElementById('toolsPanel');
                if (tools) tools.style.display = 'none';
                openGallery();
            });
        }
        
        const btnClear = document.getElementById('btnClearComparison');
        if (btnClear) {
            btnClear.removeAttribute('onclick');
            btnClear.addEventListener('click', clearComparison);
        }
    };

    const openGallery = () => {
        const gp = document.getElementById('galleryPanel');
        if (gp) {
            gp.style.display = 'block';
            render();
        }
    };

    const render = () => {
        if (!db) return;
        const tx = db.transaction("photos", "readonly");
        const store = tx.objectStore("photos");
        const req = store.getAll();

        req.onsuccess = () => {
            const photos = req.result.sort((a, b) => b.timestamp - a.timestamp);
            const grid = document.getElementById('galleryGrid');
            if (!grid) return;

            grid.innerHTML = photos.map(p => `
                <div style="position:relative; background:#111; padding:5px; border-radius:5px; border:1px solid #333;">
                    <img src="${p.data}" style="width:100%; height:120px; object-fit:cover; border-radius:3px; cursor:pointer;" onclick="PegasusGallery.selectForComparison('${p.data}', '${p.date}')">
                    <div style="text-align:center; font-size:11px; color:#aaa; margin-top:5px; font-weight:bold;">${p.date}</div>
                    <button onclick="PegasusGallery.deletePhoto(${p.id})" style="position:absolute; top:5px; right:5px; background:rgba(255,0,0,0.7); color:#fff; border:none; border-radius:50%; width:25px; height:25px; cursor:pointer; font-weight:bold;">✕</button>
                </div>
            `).join('');
        };
    };

    const selectForComparison = (src, date) => {
        if (selectedPhotos.length < 2) {
            selectedPhotos.push({ src, date });
            updateComparisonUI();
        } else {
            alert("PEGASUS STRICT: Επίλεξε μέχρι 2 φωτογραφίες.");
        }
    };

    const updateComparisonUI = () => {
        const zone = document.getElementById('comparisonZone');
        const flex = document.getElementById('comparisonFlex');
        if (!zone || !flex) return;

        zone.style.display = 'block';
        flex.innerHTML = selectedPhotos.map((p, i) => `
            <div style="flex:1; text-align:center;">
                <div style="font-size:10px; font-weight:bold; color:${i === 0 ? '#aaa' : '#4CAF50'}">${i === 0 ? 'BEFORE' : 'AFTER'}</div>
                <img src="${p.src}" style="width:100%; height:200px; object-fit:cover; border:1px solid #444; border-radius:5px; margin-top:5px;">
            </div>
        `).join('');
    };

    const clearComparison = () => {
        selectedPhotos = [];
        const zone = document.getElementById('comparisonZone');
        if (zone) zone.style.display = 'none';
        render();
    };

    const deletePhoto = (id) => {
        if (!confirm("PEGASUS STRICT: Επιβεβαίωση διαγραφής;")) return;
        const tx = db.transaction("photos", "readwrite");
        const store = tx.objectStore("photos");
        store.delete(id);
        
        tx.oncomplete = () => {
            render();
            // Ασφαλής επικοινωνία με το Cloud Vault (αν υπάρχει)
            if (typeof window.PegasusCloud !== 'undefined' && window.PegasusCloud.hasSuccessfullyPulled) {
                window.PegasusCloud.push(true);
            }
        };
    };

    // 3. PUBLIC API & INITIALIZATION
    return {
        init: function() {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onupgradeneeded = (e) => {
                const database = e.target.result;
                if (!database.objectStoreNames.contains("photos")) {
                    database.createObjectStore("photos", { keyPath: "id" });
                }
            };
            
            request.onsuccess = (e) => {
                db = e.target.result;
                console.log("[PEGASUS GALLERY]: IndexedDB Vault Online.");
                setupUI();
            };
            
            request.onerror = (e) => {
                console.error("[PEGASUS GALLERY]: Database Initialization Error", e);
            };
        },
        selectForComparison: selectForComparison,
        deletePhoto: deletePhoto,
        clearComparison: clearComparison
    };
})();

// Εξαγωγή στο Window Scope για διασύνδεση με το παραγόμενο HTML
window.addEventListener('DOMContentLoaded', PegasusGallery.init);
window.PegasusGallery = PegasusGallery;