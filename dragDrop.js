/* ==========================================================================
   PEGASUS UI MANAGER - v3.9 (STATE-LESS WARMUP & DRAG)
   Protocol: Strict Data Analyst - Real-time DOM Validation
   Features: Direct Source Check, Mutation-Aware Dragging, Turbo, Mute
   Status: FINAL STABLE | NO MORE STICKY WARMUP
   ========================================================================== */

const PegasusUI = {
    panels: ['foodPanel', 'calendarPanel', 'achievementsPanel', 'settingsPanel', 'previewPanel', 'toolsPanel', 'galleryPanel', 'cardioPanel', 'emsModal'],

    init() {
        this.initDraggablePanels();
        this.initClickOutside();
        this.initButtonBridge(); 
        console.log("✅ PEGASUS UI MANAGER: v3.9 Operational (Centralized Logic)");
    },

    initButtonBridge() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn || !btn.id) return;
            const targetId = btn.id;

            switch(targetId) {
                case 'btnWarmup':
                    this.handleWarmupToggle();
                    break;
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
                    if (typeof window.togglePartnerMode === 'function') window.togglePartnerMode();
                    break;
                case 'btnSettingsUI':
                    if (typeof window.initSettingsUI === 'function') window.initSettingsUI();
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
                    if (gp) { gp.style.display = 'block'; if (window.GalleryEngine) window.GalleryEngine.render(); }
                    break;
                case 'btnEMS':
                    const ems = document.getElementById('emsModal');
                    if (ems) ems.style.display = 'block';
                    break;
            }
        });

        const importInput = document.getElementById('importFileTools');
        if (importInput) {
            importInput.onchange = (e) => { if (window.importPegasusData) window.importPegasusData(e); };
        }
    },

    /**
     * MASTER WARMUP CONTROLLER - v3.9
     * Ελέγχει το βίντεο βάσει πραγματικής πηγής (src) και όχι μεταβλητής.
     */
    handleWarmupToggle() {
        const vid = document.getElementById("video");
        const label = document.getElementById("phaseTimer");
        if (!vid) return;

        // Αν το βίντεο ΔΕΝ είναι το warmup, το ξεκινάμε
        if (!vid.src.includes("warmup.mp4")) {
            console.log("🏃 UI: Starting Warmup");
            vid.pause();
            vid.src = "videos/warmup.mp4";
            vid.load();
            vid.play().catch(e => console.log("Play interrupted"));
            
            if (label) {
                label.textContent = "ΠΡΟΘΕΡΜΑΝΣΗ (Manual Mode)";
                label.style.color = "#64B5F6";
            }
        } 
        // Αν παίζει ΗΔΗ το warmup, το κλείνουμε και πάμε στην 1η άσκηση
        else {
            console.log("🔄 UI: Warmup Active -> Switching to Workout");
            vid.pause();
            
            if (typeof window.showVideo === "function" && window.exercises && window.exercises.length > 0) {
                window.currentIdx = 0;
                window.phase = 0;
                window.showVideo(0);
                if (label) {
                    const firstEx = window.exercises[0].querySelector(".exercise-name")?.textContent || "Έτοιμος";
                    label.textContent = firstEx;
                    label.style.color = "#4CAF50";
                }
            }
        }
    },

    initDraggablePanels() {
        this.panels.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (!panel) return;
            const savedPos = JSON.parse(localStorage.getItem(`pegasus_pos_${panelId}`));
            if (savedPos) {
                Object.assign(panel.style, { transform: "none", margin: "0", position: "fixed", top: savedPos.top, left: savedPos.left, right: "auto", bottom: "auto" });
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
            const pos1 = pos3 - e.clientX; const pos2 = pos4 - e.clientY;
            pos3 = e.clientX; pos4 = e.clientY;
            panel.style.top = (panel.offsetTop - pos2) + "px";
            panel.style.left = (panel.offsetLeft - pos1) + "px";
        };
        const closeDrag = () => { document.onmouseup = null; document.onmousemove = null; header.style.cursor = "grab"; localStorage.setItem(`pegasus_pos_${panel.id}`, JSON.stringify({ top: panel.style.top, left: panel.style.left })); };
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

function initExerciseListDrag() {
    const list = document.getElementById("exList");
    if (!list) return;
    const applyDraggable = () => { list.querySelectorAll(".exercise").forEach(el => el.setAttribute("draggable", "true")); };
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
        if (typeof window.exercises !== 'undefined') window.exercises = [...list.querySelectorAll(".exercise")];
    });
    const observer = new MutationObserver(() => applyDraggable());
    observer.observe(list, { childList: true });
    applyDraggable();
}

window.addEventListener('load', () => {
    PegasusUI.init();
    initExerciseListDrag();
});
