/* ==========================================================================
   PEGASUS UI MANAGER (dragdrop.js) - v4.3 SHIELDED
   Protocol: Strict Data Analyst - Keyboard Code Validation (Digit Recognition)
   Features: Shift+1-9 Shortcuts, Mutation-Aware Dragging, High Z-Index Panels
   ========================================================================== */

const PegasusUI = {
    panels: ['foodPanel', 'calendarPanel', 'achievementsPanel', 'settingsPanel', 'previewPanel', 'toolsPanel', 'galleryPanel', 'cardioPanel', 'emsModal'],

    init() {
        this.initDraggablePanels();
        this.initClickOutside();
        this.initButtonBridge(); 
        this.initHotkeys(); 
        console.log("✅ PEGASUS UI MANAGER: v4.3 Operational (Shielded Numeric Hotkeys Enabled)");
    },

    /**
     * ⌨️ PEGASUS TACTICAL HOTKEYS (v4.3)
     * Protocol: Digit Recognition via e.code to bypass Shift-Symbol conflicts
     */
    initHotkeys() {
        window.addEventListener('keydown', (e) => {
            // Προστασία εισαγωγής: Μην ενεργοποιείς τα hotkeys αν γράφεις σε πεδία
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

            // Έλεγχος αν είναι πατημένο το Shift
            if (!e.shiftKey) return;

            // Χρήση e.code για αναγνώριση Digit πλήκτρου ανεξαρτήτως συμβόλου (!, @, # κλπ)
            const code = e.code; 

            switch(code) {
                case 'Digit1': // Shift + 1: ΕΝΑΡΞΗ / ΠΑΥΣΗ
                    e.preventDefault();
                    console.log("⌨️ Hotkey: START/PAUSE");
                    const startBtn = document.getElementById('btnStart') || document.getElementById('btnStartTraining');
                    if (startBtn) startBtn.click();
                    break;

                case 'Digit2': // Shift + 2: ΕΠΟΜΕΝΟ
                    e.preventDefault();
                    console.log("⌨️ Hotkey: NEXT");
                    if (typeof window.nextPhase === "function") window.nextPhase();
                    else if (document.getElementById('btnNext')) document.getElementById('btnNext').click();
                    break;

                case 'Digit3': // Shift + 3: ΗΜΕΡΟΛΟΓΙΟ
                    e.preventDefault();
                    this.togglePanel('calendarPanel');
                    break;

                case 'Digit4': // Shift + 4: ΕΠΙΤΕΥΓΜΑΤΑ
                    e.preventDefault();
                    this.togglePanel('achievementsPanel');
                    break;

                case 'Digit5': // Shift + 5: ΔΙΑΤΡΟΦΗ
                    e.preventDefault();
                    this.togglePanel('foodPanel');
                    break;

                case 'Digit6': // Shift + 6: ΠΡΟΕΠΙΣΚΟΠΗΣΗ (ΜΥΕΣ)
                    e.preventDefault();
                    this.togglePanel('previewPanel');
                    break;

                case 'Digit7': // Shift + 7: ΡΥΘΜΙΣΕΙΣ
                    e.preventDefault();
                    this.togglePanel('settingsPanel');
                    break;

                case 'Digit8': // Shift + 8: ΕΡΓΑΛΕΙΑ (TOOLS)
                    e.preventDefault();
                    this.togglePanel('toolsPanel');
                    break;

                case 'Digit9': // Shift + 9: MASTER SAVE & BACKUP
                    e.preventDefault();
                    console.log("⌨️ Hotkey: MASTER SAVE");
                    if (window.exportPegasusData) window.exportPegasusData();
                    if (window.PegasusCloud && window.PegasusCloud.push) window.PegasusCloud.push();
                    break;
            }
        });
    },

    /**
     * 🛠️ TACTICAL PANEL TOGGLE
     * Manages Visibility, Z-Index and Logic Initialization Bridges
     */
    togglePanel(id) {
        const panel = document.getElementById(id);
        if (!panel) {
            console.error(`❌ UI ERROR: Panel with ID '${id}' not found.`);
            return;
        }

        // Διασφάλιση αρχικής τιμής display
        if (panel.style.display === "" || !panel.style.display) {
            panel.style.display = window.getComputedStyle(panel).display;
        }

        const isVisible = panel.style.display === 'block';
        panel.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            // Φέρνει το παράθυρο μπροστά από όλα
            document.querySelectorAll('.pegasus-panel').forEach(p => p.style.zIndex = "1000");
            panel.style.zIndex = "2000";

            // Logic Bridges (v4.3)
            if (id === 'settingsPanel' && typeof window.initSettingsUI === 'function') window.initSettingsUI();
            if (id === 'galleryPanel' && window.GalleryEngine) window.GalleryEngine.render();
            if (id === 'foodPanel' && typeof window.updateFoodUI === "function") window.updateFoodUI();
        }
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
                    this.togglePanel('settingsPanel');
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
                    this.togglePanel('galleryPanel');
                    break;
                case 'btnEMS':
                    this.togglePanel('emsModal');
                    break;
                case 'btnProposalsUI':
                    if (window.masterUI && typeof window.masterUI.btnProposalsUI === 'function') {
                        window.masterUI.btnProposalsUI();
                    }
                    break;
            }
        });

        const importInput = document.getElementById('importFileTools');
        if (importInput) {
            importInput.onchange = (e) => { if (window.importPegasusData) window.importPegasusData(e); };
        }
    },

    handleWarmupToggle() {
        const vid = document.getElementById("video");
        const label = document.getElementById("phaseTimer");
        if (!vid) return;

        if (!vid.src.includes("warmup.mp4")) {
            vid.pause();
            vid.src = "videos/warmup.mp4";
            vid.load();
            vid.play().catch(e => console.log("Play interrupted"));
            if (label) {
                label.textContent = "ΠΡΟΘΕΡΜΑΝΣΗ (Manual Mode)";
                label.style.color = "#64B5F6";
            }
        } 
        else {
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
        const closeDrag = () => { 
            document.onmouseup = null; 
            document.onmousemove = null; 
            header.style.cursor = "grab"; 
            localStorage.setItem(`pegasus_pos_${panel.id}`, JSON.stringify({ top: panel.style.top, left: panel.style.left })); 
        };
        document.onmouseup = closeDrag; 
        document.onmousemove = elementDrag;
    },

    initClickOutside() {
        window.addEventListener('mousedown', (e) => {
            this.panels.forEach(id => {
                const panel = document.getElementById(id);
                if (panel && panel.style.display === 'block') {
                    if (!panel.contains(e.target) && !e.target.closest('.p-btn') && !e.target.closest('.navbar button') && !e.shiftKey) {
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
