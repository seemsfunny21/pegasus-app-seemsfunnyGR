/* ==========================================================================
   PEGASUS UI MANAGER - v3.5 (FINAL CONVERGENCE)
   Protocol: Strict Modular Design - Centralized Event Delegation
   Features: Turbo, Mute, Partner, Settings Bridge, Warmup Toggle
   Status: LINE-BY-LINE VERIFIED | NO LOGIC LOSS
   ========================================================================== */

const PegasusUI = {
    panels: ['foodPanel', 'calendarPanel', 'achievementsPanel', 'settingsPanel', 'previewPanel', 'toolsPanel', 'galleryPanel', 'cardioPanel', 'emsModal'],
    warmupState: 0, // 0: Video, 1: First Exercise

    init() {
        this.initDraggablePanels();
        this.initClickOutside();
        this.initButtonBridge(); 
        console.log("✅ PEGASUS UI MANAGER: Unified Protocol v3.5 Active");
    },

    // --- ΜΗΧΑΝΙΣΜΟΣ ΣΥΝΔΕΣΗΣ ΚΟΥΜΠΙΩΝ (BRIDGE) ---
    initButtonBridge() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn || !btn.id) return;

            const targetId = btn.id;

            // Καταγραφή στο Tracer αν υπάρχει
            if (window.PegasusTracer) {
                window.PegasusTracer.log(targetId, "UI_BRIDGE_CLICK", "START");
            }

            switch(targetId) {
                // 1. TURBO MODE (Σύνδεση με Global Engine)
                case 'btnTurboTools':
                    window.TURBO_MODE = !window.TURBO_MODE;
                    window.SPEED = window.TURBO_MODE ? 10 : 1;
                    btn.textContent = window.TURBO_MODE ? "Turbo: ΕΝΕΡΓΟ" : "Turbo: ΑΝΕΝΕΡΓΟ";
                    btn.style.color = window.TURBO_MODE ? "#ff4444" : "#4CAF50";
                    console.log("🚀 Bridge: Turbo Mode Toggle");
                    break;

                // 2. MUTE/SOUND (Σύνδεση με Global Engine)
                case 'btnMuteTools':
                    window.muted = !window.muted;
                    btn.textContent = window.muted ? "Ήχος: ΣΙΓΑΣΗ" : "Ήχος: ΕΝΕΡΓΟΣ";
                    btn.style.color = window.muted ? "#888" : "#4CAF50";
                    console.log("🔇 Bridge: Sound Toggle");
                    break;

                // 3. PARTNER MODE BRIDGE
                case 'btnPartnerMode':
                    if (typeof window.togglePartnerMode === 'function') {
                        window.togglePartnerMode();
                        console.log("👥 Bridge: Partner Mode Toggle");
                    } else {
                        console.warn("Partner Engine Missing!");
                    }
                    break;

                // 4. SETTINGS INITIALIZER (Fix για κενά πεδία)
                case 'btnSettingsUI':
                    if (typeof window.initSettingsUI === 'function') {
                        window.initSettingsUI();
                    }
                    break;

                // 5. WARMUP TOGGLE (1-click: Video, 2-click: Exercise)
                case 'btnWarmup':
                    this.handleWarmupToggle();
                    break;

                // 6. DATA & VAULT ACTIONS
                case 'btnImportData':
                    const fileInput = document.getElementById('importFileTools');
                    if (fileInput) fileInput.click();
                    break;

                case 'btnExportData':
                    if (window.exportPegasusData) window.exportPegasusData();
                    break;

                case 'btnMasterVault':
                    const modal = document.getElementById('pinModal');
                    if (modal) modal.style.display = 'flex';
                    break;

                // 7. GALLERY & EMS
                case 'btnOpenGallery':
                    const gp = document.getElementById('galleryPanel');
                    if (gp) {
                        gp.style.display = 'block';
                        if (window.GalleryEngine) window.GalleryEngine.render();
                    }
                    break;

                case 'btnEMS':
                    const ems = document.getElementById('emsModal');
                    if (ems) ems.style.display = 'block';
                    break;
            }
        });

        // Σύνδεση του File Input με τη συνάρτηση του backup.js
        const importInput = document.getElementById('importFileTools');
        if (importInput) {
            importInput.onchange = (e) => {
                if (window.importPegasusData) window.importPegasusData(e);
            };
        }
    },

    // Helper για τη λειτουργία εναλλαγής Προθέρμανσης
    handleWarmupToggle() {
        const vid = document.getElementById("video");
        const label = document.getElementById("phaseTimer");
        if (this.warmupState === 0) {
            // 1ο Πάτημα: Βίντεο Προθέρμανσης
            if (vid) { 
                vid.src = "videos/warmup.mp4"; 
                vid.play(); 
            }
            if (label) label.textContent = "Προθέρμανση...";
            this.warmupState = 1;
        } else {
            // 2ο Πάτημα: Επιστροφή στην 1η Άσκηση της ημέρας
            if (typeof window.showVideo === "function") window.showVideo(0);
            if (label) label.textContent = "Έτοιμος για έναρξη";
            this.warmupState = 0;
        }
    },

    // --- ΜΗΧΑΝΙΣΜΟΣ ΜΕΤΑΚΙΝΗΣΗΣ ---
    initDraggablePanels() {
        this.panels.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (!panel) return;

            const savedPos = JSON.parse(localStorage.getItem(`pegasus_pos_${panelId}`));
            if (savedPos) {
                Object.assign(panel.style, {
                    transform: "none", margin: "0", position: "fixed",
                    top: savedPos.top, left: savedPos.left,
                    right: "auto", bottom: "auto"
                });
            }

            const header = panel.querySelector(".panel-header") || panel.querySelector("h3");
            if (!header) return;

            header.style.cursor = "grab";
            header.onmousedown = (e) => this.startDrag(e, panel, header);
        });
    },

    startDrag(e, panel, header) {
        if (e.button !== 0) return;
        e.preventDefault();
        header.style.cursor = "grabbing";
        let pos3 = e.clientX, pos4 = e.clientY;
        
        document.querySelectorAll('.pegasus-panel').forEach(p => p.style.zIndex = "1000");
        panel.style.zIndex = "1001";

        const elementDrag = (e) => {
            const pos1 = pos3 - e.clientX;
            const pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            panel.style.top = (panel.offsetTop - pos2) + "px";
            panel.style.left = (panel.offsetLeft - pos1) + "px";
        };

        const closeDrag = () => {
            document.onmouseup = null;
            document.onmousemove = null;
            header.style.cursor = "grab";
            localStorage.setItem(`pegasus_pos_${panel.id}`, JSON.stringify({
                top: panel.style.top, left: panel.style.left
            }));
        };

        document.onmouseup = closeDrag;
        document.onmousemove = elementDrag;
    },

    initClickOutside() {
        window.addEventListener('mousedown', (e) => {
            this.panels.forEach(id => {
                const panel = document.getElementById(id);
                if (panel && panel.style.display === 'block') {
                    if (!panel.contains(e.target) && !e.target.closest('.p-btn') && !e.target.closest('.navbar button')) {
                        panel.style.display = 'none';
                        if (window.PegasusCloud) window.PegasusCloud.push(true);
                    }
                }
            });
        });
    }
};

function initExerciseListDrag() {
    const list = document.getElementById("exList");
    if (!list) return;
    const newList = list.cloneNode(true);
    list.parentNode.replaceChild(newList, list);

    newList.addEventListener("dragstart", (e) => {
        if (window.running) { e.preventDefault(); return; }
        if (e.target.classList.contains("exercise")) e.target.classList.add("dragging");
    });

    newList.addEventListener("dragover", (e) => {
        e.preventDefault();
        const draggingItem = document.querySelector(".dragging");
        if (!draggingItem) return;
        const siblings = [...newList.querySelectorAll(".exercise:not(.dragging)")];
        let nextSibling = siblings.find(sibling => e.clientY <= sibling.offsetTop + sibling.offsetHeight / 2);
        newList.insertBefore(draggingItem, nextSibling);
    });

    newList.addEventListener("dragend", (e) => {
        if (e.target.classList.contains("exercise")) {
            e.target.classList.remove("dragging");
            if (typeof exercises !== 'undefined') {
                exercises = [...document.querySelectorAll(".exercise")];
            }
        }
    });
}

window.addEventListener('load', () => {
    PegasusUI.init();
    initExerciseListDrag();
});
