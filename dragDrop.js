/* ==========================================================================
   PEGASUS UI MANAGER - v3.5 (FINAL BRIDGE)
   Protocol: Strict Modular Design - Centralized Event Delegation
   Features: Turbo, Mute, Partner & Sync Implementation
   ========================================================================== */

const PegasusUI = {
    panels: ['foodPanel', 'calendarPanel', 'achievementsPanel', 'settingsPanel', 'previewPanel', 'toolsPanel', 'galleryPanel', 'cardioPanel', 'emsModal'],

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

            if (window.PegasusTracer) {
                window.PegasusTracer.log(targetId, "UI_BRIDGE_CLICK", "START");
            }

            switch(targetId) {
                // 1. TURBO MODE LOGIC
                case 'btnTurboTools':
                    const isTurbo = localStorage.getItem("pegasus_turbo") === "true";
                    localStorage.setItem("pegasus_turbo", !isTurbo);
                    btn.textContent = !isTurbo ? "Turbo: ΕΝΕΡΓΟ" : "Turbo: ΑΝΕΝΕΡΓΟ";
                    btn.style.borderColor = !isTurbo ? "#ff4444" : "";
                    // Ενημέρωση της παγκόσμιας μεταβλητής SPEED αν υπάρχει
                    if (typeof SPEED !== 'undefined') window.SPEED = !isTurbo ? 10 : 1;
                    break;

                // 2. MUTE LOGIC
                case 'btnMuteTools':
                    const isMuted = localStorage.getItem("pegasus_mute") === "true";
                    localStorage.setItem("pegasus_mute", !isMuted);
                    btn.textContent = !isMuted ? "Ήχος: ΣΙΓΑΣΗ" : "Ήχος: ΕΝΕΡΓΟΣ";
                    if (typeof muted !== 'undefined') window.muted = !isMuted;
                    break;

                // 3. PARTNER MODE BRIDGE
                case 'btnPartnerMode':
                    if (typeof window.togglePartnerMode === 'function') {
                        window.togglePartnerMode();
                    } else {
                        console.warn("Partner Engine not found.");
                    }
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

                case 'btnWarmup':
                    const label = document.getElementById("phaseTimer");
                    if (label) label.textContent = "ΠΡΟΘΕΡΜΑΝΣΗ (Manual Mode)";
                    if (typeof showVideo === 'function') showVideo(null);
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
