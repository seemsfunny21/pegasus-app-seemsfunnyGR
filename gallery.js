/* ==========================================================================
   PEGASUS GALLERY ENGINE - CLEAN SWEEP v17.0
   Protocol: IndexedDB Local Vault | Logic: Comparison Matrix & Binary Sync
   ========================================================================== */

window.GalleryEngine = {
    dbName: "PegasusLevels",
    dbVersion: 1,
    db: null,
    selectedPhotos: [],

    /**
     * Αρχικοποίηση Βάσης Δεδομένων
     */
    async init() {
        const request = indexedDB.open(this.dbName, this.dbVersion);
        
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("photos")) {
                db.createObjectStore("photos", { keyPath: "id" });
            }
        };

        request.onsuccess = (e) => {
            this.db = e.target.result;
            console.log("✅ PEGASUS: Gallery Engine (IndexedDB) Online.");
            this.setupUI();
        };

        request.onerror = (e) => {
            if (window.PegasusLogger) window.PegasusLogger.log("Gallery DB Error", "CRITICAL");
        };
    },

    setupUI() {
        const btnOpen = document.getElementById('btnOpenGallery');
        if (btnOpen) {
            btnOpen.onclick = (e) => {
                e.stopPropagation();
                // Κλείσιμο toolsPanel πριν το άνοιγμα της Gallery
                const tools = document.getElementById('toolsPanel');
                if (tools) tools.style.display = 'none';
                
                const gp = document.getElementById('galleryPanel');
                if (gp) {
                    gp.style.display = 'block';
                    this.render();
                }
            };
        }
    },

    /**
     * Καταγραφή νέας φωτογραφίας προόδου
     */
    async upload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const photoData = {
                id: Date.now(),
                src: e.target.result,
                date: new Date().toLocaleDateString('el-GR'),
                timestamp: Date.now()
            };

            const tx = this.db.transaction("photos", "readwrite");
            const store = tx.objectStore("photos");
            await store.add(photoData);
            
            if (window.PegasusLogger) window.PegasusLogger.log("New Progress Photo Vaulted", "INFO");
            this.render();
        };
        reader.readAsDataURL(file);
    },

    /**
     * Σχεδίαση UI - Strict Green Matrix
     */
    async render() {
        const container = document.getElementById('galleryContent');
        if (!container) return;

        const tx = this.db.transaction("photos", "readonly");
        const store = tx.objectStore("photos");
        const photos = await new Promise(resolve => {
            store.getAll().onsuccess = (e) => resolve(e.target.result);
        });

        // Ταξινόμηση: Νεότερες πρώτες
        photos.sort((a, b) => b.timestamp - a.timestamp);

        let html = `
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; margin-bottom:15px;">
                <label style="background:#111; border:1px dashed #4CAF50; aspect-ratio:1; display:flex; align-items:center; justify-content:center; cursor:pointer; border-radius:8px;">
                    <span style="font-size:24px; color:#4CAF50;">+</span>
                    <input type="file" hidden accept="image/*" onchange="window.GalleryEngine.upload(event)">
                </label>
        `;

        photos.forEach(p => {
            html += `
                <div style="position:relative; aspect-ratio:1; border:1px solid #222; border-radius:8px; overflow:hidden; background:#000;">
                    <img src="${p.src}" style="width:100%; height:100%; object-fit:cover; cursor:pointer;" onclick="window.GalleryEngine.selectForComparison('${p.src}', '${p.date}')">
                    <div style="position:absolute; bottom:0; width:100%; background:rgba(0,0,0,0.7); color:#4CAF50; font-size:8px; text-align:center; padding:2px 0; font-weight:bold;">${p.date}</div>
                    <button onclick="window.GalleryEngine.delete(${p.id})" style="position:absolute; top:2px; right:2px; background:rgba(255,0,0,0.5); border:none; color:#fff; border-radius:50%; width:16px; height:16px; font-size:10px; cursor:pointer;">✕</button>
                </div>
            `;
        });

        html += `</div>`;
        
        // Ζώνη Σύγκρισης (Before/After)
        html += `
            <div id="comparisonZone" style="display:${this.selectedPhotos.length > 0 ? 'block' : 'none'}; border-top:1px solid #4CAF50; padding-top:15px; margin-top:10px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span style="color:#4CAF50; font-size:10px; font-weight:900; letter-spacing:1px;">COMPARISON MATRIX</span>
                    <span onclick="window.GalleryEngine.clearComparison()" style="color:#666; font-size:10px; cursor:pointer;">CLEAR</span>
                </div>
                <div id="comparisonFlex" style="display:flex; gap:10px;"></div>
            </div>
        `;

        container.innerHTML = html;
        if (this.selectedPhotos.length > 0) this.updateComparisonUI();
    },

    selectForComparison(src, date) {
        if (this.selectedPhotos.length < 2) {
            this.selectedPhotos.push({ src, date });
            this.updateComparisonUI();
        } else {
            alert("PEGASUS: Επιλέξτε έως 2 φωτογραφίες για σύγκριση.");
        }
    },

    updateComparisonUI() {
        const zone = document.getElementById('comparisonZone');
        const flex = document.getElementById('comparisonFlex');
        if (!zone || !flex) return;
        
        zone.style.display = 'block';
        flex.innerHTML = this.selectedPhotos.map((p, i) => `
            <div style="flex:1; text-align:center; background:#0a0a0a; border:1px solid #333; padding:5px; border-radius:6px;">
                <div style="font-size:9px; color:${i===0?'#888':'#4CAF50'}; font-weight:bold; margin-bottom:5px;">${i===0?'BEFORE':'AFTER'} (${p.date})</div>
                <img src="${p.src}" style="width:100%; aspect-ratio:3/4; object-fit:cover; border-radius:4px;">
            </div>
        `).join('');
    },

    clearComparison() { 
        this.selectedPhotos = []; 
        this.render(); 
    },

    async delete(id) {
        if (!confirm("PEGASUS: Οριστική διαγραφή φωτογραφίας;")) return;
        const tx = this.db.transaction("photos", "readwrite");
        const store = tx.objectStore("photos");
        await store.delete(id);
        this.render();
    }
};

// Boot Gallery
window.addEventListener('load', () => window.GalleryEngine.init());