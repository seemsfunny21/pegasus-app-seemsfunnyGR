/* ==========================================================================
   PEGASUS GALLERY ENGINE - Progress Tracking & Comparison
   ========================================================================== */

const GalleryEngine = {
    selectedPhotos: [], // Για τη σύγκριση

    init() {
        const btnOpen = document.getElementById('btnOpenGallery');
        if (btnOpen) {
            btnOpen.onclick = (e) => {
                // Σταματάμε το propagation για να μην κλείσει το panel από το window listener
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

    handleUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const photos = JSON.parse(localStorage.getItem('pegasus_photos') || '[]');
            photos.unshift({
                id: Date.now(),
                date: new Date().toLocaleDateString('el-GR'),
                src: e.target.result
            });
            localStorage.setItem('pegasus_photos', JSON.stringify(photos));
            this.render();
        };
        reader.readAsDataURL(file);
    },

    render() {
        const container = document.getElementById('progressTimeline');
        if (!container) return;
        const photos = JSON.parse(localStorage.getItem('pegasus_photos') || '[]');
        
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
                        <img src="${p.src}" style="width:100%; border-radius:8px; cursor:pointer; transition:0.3s;" onclick="GalleryEngine.selectForComparison('${p.src}', '${p.date}')">
                        <button onclick="GalleryEngine.delete(${p.id})" style="position:absolute; top:25px; right:5px; background:rgba(0,0,0,0.6); border:none; color:#ff4444; cursor:pointer; font-weight:bold; padding:5px; border-radius:50%; width:25px; height:25px; line-height:1;">✕</button>
                    </div>
                `).join('')}
            </div>
        `;

        // Αν υπάρχουν ήδη επιλεγμένες φωτό (π.χ. μετά από upload), ξαναδείξε το UI
        if (this.selectedPhotos.length > 0) this.updateComparisonUI();
    },

    selectForComparison(src, date) {
        if (this.selectedPhotos.length < 2) {
            this.selectedPhotos.push({ src, date });
            this.updateComparisonUI();
            
            if (this.selectedPhotos.length === 2) {
                const container = document.getElementById('progressTimeline');
                container.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } else {
            alert("Επίλεξε μέχρι 2 φωτογραφίες για σύγκριση.");
        }
    }, // <-- ΑΥΤΟ ΤΟ ΚΟΜΜΑ ΕΛΕΙΠΕ

updateComparisonUI() {
    const zone = document.getElementById('comparisonZone');
    const flex = document.getElementById('comparisonFlex');
    if (!zone || !flex) return;

    if (this.selectedPhotos.length > 0) {
        zone.style.display = 'block';
        // Αυξάνουμε το padding και το μέγεθος
        flex.innerHTML = this.selectedPhotos.map((p, index) => {
            const label = index === 0 ? "BEFORE" : "AFTER";
            const labelColor = index === 0 ? "#aaa" : "#4CAF50";

            return `
                <div style="flex:1; position:relative; text-align:center;">
                    <div style="font-size:11px; font-weight:bold; color:${labelColor}; margin-bottom:6px; letter-spacing:1px;">${label}</div>
                    <div style="width:100%; height:300px; overflow:hidden; border-radius:6px; border:2px solid ${labelColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
                        <img src="${p.src}" style="width:100%; height:100%; object-fit:cover; display:block;">
                    </div>
                    <span style="position:absolute; bottom:8px; left:8px; font-size:10px; background:rgba(0,0,0,0.8); padding:3px 6px; color:#fff; border-radius:3px;">${p.date}</span>
                </div>
            `;
        }).join('');
    }
},

    clearComparison() {
        this.selectedPhotos = [];
        this.render();
    },

    delete(id) {
        if (!confirm("Διαγραφή φωτογραφίας;")) return;
        let photos = JSON.parse(localStorage.getItem('pegasus_photos') || '[]');
        photos = photos.filter(p => p.id !== id);
        localStorage.setItem('pegasus_photos', JSON.stringify(photos));
        this.render();
    }
};

window.handlePhotoUpload = (e) => GalleryEngine.handleUpload(e);
document.addEventListener('DOMContentLoaded', () => GalleryEngine.init());