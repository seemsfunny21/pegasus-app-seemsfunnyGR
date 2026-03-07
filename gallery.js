/* ==========================================================================
   PEGASUS GALLERY ENGINE - INDEXEDDB EDITION (V5.0)
   ========================================================================== */

const GalleryEngine = {
    dbName: "PegasusLevels",
    dbVersion: 1,
    db: null,
    selectedPhotos: [],

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
            this.setupUI();
        };
    },

    setupUI() {
        const btnOpen = document.getElementById('btnOpenGallery');
        if (btnOpen) {
            btnOpen.onclick = (e) => {
                if(e) e.stopPropagation();
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

    async handleUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const tx = this.db.transaction("photos", "readwrite");
            const store = tx.objectStore("photos");
            await store.add({
                id: Date.now(),
                date: new Date().toLocaleDateString('el-GR'),
                src: e.target.result // Base64
            });
            this.render();
        };
        reader.readAsDataURL(file);
    },

    async render() {
        const container = document.getElementById('progressTimeline');
        if (!container) return;

        const tx = this.db.transaction("photos", "readonly");
        const store = tx.objectStore("photos");
        const photos = await new Promise(res => {
            const req = store.getAll();
            req.onsuccess = () => res(req.result.reverse());
        });

        if (photos.length === 0) {
            container.innerHTML = `<p style="text-align:center; padding:20px; opacity:0.5;">Καμία φωτογραφία.</p>`;
            return;
        }

        container.innerHTML = `
            <div id="comparisonZone" style="display:none; margin-bottom:20px; padding:10px; background:#1a1a1a; border-radius:8px; border:1px solid #4CAF50;">
                <h4 style="margin:0 0 10px 0; font-size:12px; color:#4CAF50; text-align:center;">ΣΥΓΚΡΙΣΗ PROGRESS</h4>
                <div id="comparisonFlex" style="display:flex; gap:5px;"></div>
                <button onclick="GalleryEngine.clearComparison()" style="width:100%; margin-top:10px; background:none; border:1px solid #555; color:#aaa; cursor:pointer; font-size:10px; padding:5px;">ΑΚΥΡΩΣΗ ΣΥΓΚΡΙΣΗΣ</button>
            </div>
            <div class="photos-grid" style="display: grid; grid-template-columns: 1fr; gap: 15px;">
                ${photos.map(p => `
                    <div class="timeline-item" style="border-left: 2px solid #4CAF50; padding-left: 15px; margin-bottom: 25px; position:relative;">
                        <div style="font-size:11px; color:#4CAF50; font-weight:bold; margin-bottom:8px;">📅 ${p.date}</div>
                        <img src="${p.src}" style="width:100%; border-radius:8px; cursor:pointer;" onclick="GalleryEngine.selectForComparison('${p.src}', '${p.date}')">
                        <button onclick="GalleryEngine.delete(${p.id})" style="position:absolute; top:25px; right:5px; background:rgba(0,0,0,0.6); border:none; color:#ff4444; cursor:pointer; font-weight:bold; padding:5px; border-radius:50%; width:25px; height:25px;">✕</button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    selectForComparison(src, date) {
        if (this.selectedPhotos.length < 2) {
            this.selectedPhotos.push({ src, date });
            this.updateComparisonUI();
        } else {
            alert("Επίλεξε μέχρι 2 φωτογραφίες.");
        }
    },

    updateComparisonUI() {
        const zone = document.getElementById('comparisonZone');
        const flex = document.getElementById('comparisonFlex');
        if (!zone || !flex) return;
        zone.style.display = 'block';
        flex.innerHTML = this.selectedPhotos.map((p, i) => `
            <div style="flex:1; text-align:center;">
                <div style="font-size:10px; color:${i===0?'#aaa':'#4CAF50'}">${i===0?'BEFORE':'AFTER'}</div>
                <img src="${p.src}" style="width:100%; height:200px; object-fit:cover; border:1px solid #444;">
            </div>
        `).join('');
    },

    clearComparison() { this.selectedPhotos = []; this.render(); },

    async delete(id) {
        if (!confirm("Διαγραφή;")) return;
        const tx = this.db.transaction("photos", "readwrite");
        tx.objectStore("photos").delete(id);
        this.render();
    }
};

window.handlePhotoUpload = (e) => GalleryEngine.handleUpload(e);
document.addEventListener('DOMContentLoaded', () => GalleryEngine.init());