/* ==========================================================================
   PEGASUS UI MANAGER - v3.6 (DYNAMIC DRAG & BRIDGE)
   Protocol: Strict Modular Design - Centralized Event Delegation
   Features: Mutation-Aware Dragging, Turbo, Mute, Partner, Settings, Warmup
   Status: LINE-BY-LINE VERIFIED | PERSISTENCE READY
   ========================================================================== */

const PegasusUI = {
    panels: ['foodPanel', 'calendarPanel', 'achievementsPanel', 'settingsPanel', 'previewPanel', 'toolsPanel', 'galleryPanel', 'cardioPanel', 'emsModal'],
    warmupState: 0, // 0: Video, 1: First Exercise

    init() {
        this.initDraggablePanels();
        this.initClickOutside();
        this.initButtonBridge(); 
        console.log("✅ PEGASUS UI MANAGER: Unified Protocol v3.6 Active");
    },

    // --- ΜΗΧΑΝΙΣΜΟΣ ΣΥΝΔΕΣΗΣ ΚΟΥΜΠΙΩΝ (BRIDGE) ---
    initButtonBridge() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn || !btn.id) return;

            const targetId = btn.id;

            if (window.PegasusTracer) {
                window.PegasusTracer.log(targetId, "UI_BRIDGE_CLICK", "START");
            }

            switch(targetId) {
                case 'btnTurboTools':
                    window.TURBO_MODE = !window.TURBO_MODE;
                    window.SPEED = window.TURBO_MODE ? 10 : 1;
                    btn.textContent = window.TURBO_MODE ? "Turbo: ΕΝΕΡΓΟ" : "Turbo: ΑΝΕΝΕΡΓΟ";
                    btn.style.color = window.TURBO_MODE ? "#ff4444" : "#4CAF50";
                    break;

                case 'btnMuteTools':
                    window.muted = !window.muted;
                    btn.textContent = window.muted ? "Ήχος: ΣΙΓΑΣΗ" : "Ήχος: ΕΝΕΡΓΟΣ";
                    btn.style.color = window.muted ? "#888" : "#4CAF50";
                    break;

                case 'btnPartnerMode':
                    if (typeof window.togglePartnerMode === 'function') {
                        window.togglePartnerMode();
                    }
                    break;

                case 'btnSettingsUI':
                    if (typeof window.initSettingsUI === 'function') {
                        window.initSettingsUI();
                    }
                    break;

                case 'btnWarmup':
                    this.handleWarmupToggle();
                    break;

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

        const importInput = document.getElementById('importFileTools');
        if (importInput) {
            importInput.onchange = (e) => {
                if (window.importPegasusData) window.importPegasusData(e);
            };
        }
    },

    handleWarmupToggle() {
        const vid = document.getElementById("video");
        const label = document.getElementById("phaseTimer");
        if (this.warmupState === 0) {
            if (vid) { vid.src = "videos/warmup.mp4"; vid.play(); }
            if (label) label.textContent = "Προθέρμανση...";
            this.warmupState = 1;
        } else {
            if (typeof window.showVideo === "function") window.showVideo(0);
            if (label) label.textContent = "Έτοιμος για έναρξη";
            this.warmupState = 0;
        }
    },

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
            document.onmouseup = null; document.onmousemove = null;
            header.style.cursor = "grab";
            localStorage.setItem(`pegasus_pos_${panel.id}`, JSON.stringify({ top: panel.style.top, left: panel.style.left }));
        };
        document.onmouseup = closeDrag; document.onmousemove = elementDrag;
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

/**
 * EXERCISE LIST DRAG - v3.6 (THE MUTATION PATCH)
 */
function initExerciseListDrag() {
    const list = document.getElementById("exList");
    if (!list) return;

    // Εξασφάλιση Draggable status σε κάθε αλλαγή του Optimizer
    const applyDraggable = () => {
        list.querySelectorAll(".exercise").forEach(el => el.setAttribute("draggable", "true"));
    };

    list.addEventListener("dragstart", (e) => {
        const item = e.target.closest(".exercise");
        if (!item || window.running) return;
        item.classList.add("dragging");
    });

    list.addEventListener("dragover", (e) => {
        e.preventDefault();
        const draggingItem = list.querySelector(".dragging");
        if (!draggingItem) return;
        const siblings = [...list.querySelectorAll(".exercise:not(.dragging)")];
        let nextSibling = siblings.find(sibling => e.clientY <= sibling.offsetTop + sibling.offsetHeight / 2);
        list.insertBefore(draggingItem, nextSibling);
    });

    list.addEventListener("dragend", (e) => {
        const item = e.target.closest(".exercise");
        if (item) item.classList.remove("dragging");
        if (typeof exercises !== 'undefined') {
            window.exercises = [...list.querySelectorAll(".exercise")];
        }
    });

    // MUTATION OBSERVER: Αν ο Optimizer ξαναγράψει το HTML, ξανακάνουμε τις ασκήσεις Draggable
    const observer = new MutationObserver(() => applyDraggable());
    observer.observe(list, { childList: true });
    
    applyDraggable();
}

window.addEventListener('load', () => {
    PegasusUI.init();
    initExerciseListDrag();
});
