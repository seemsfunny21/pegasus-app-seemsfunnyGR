/* ==========================================================================
   PEGASUS UI MANAGER (dragdrop.js) - v4.6 CLEAN SHIELDED
   Protocol: Strict Data Analyst - Keyboard Code Validation & Clean Logic
   Features: Shift+1-9 Shortcuts, Mutation-Aware Dragging, High Z-Index Panels
   Note: Button logic delegated entirely to app.js (masterUI) to prevent click collisions.
   Status: FINAL STABLE | FIXED: SYNTAX & DRAG BOUNDARIES
   ========================================================================== */

const PegasusUI = {
    panels: ['foodPanel', 'calendarPanel', 'achievementsPanel', 'settingsPanel', 'previewPanel', 'toolsPanel', 'galleryPanel', 'cardioPanel', 'emsModal', 'planModal'],

    init() {
        this.initDraggablePanels();
        this.initClickOutside();
        this.initHotkeys(); 
        console.log("✅ PEGASUS UI MANAGER: v4.6 Operational (Button Bridge Delegated to desktopBoot.js)");
    },

    /**
     * ⌨️ PEGASUS TACTICAL HOTKEYS (v4.6 - UNIVERSAL)
     * Supports: Alt + Top Row OR Alt + Numpad
     * Fixes: Numpad Navigation Conflict & Shift Desync
     */
    initHotkeys() {
        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

            // Χρησιμοποιούμε ALT για να αποφύγουμε το "μπέρδεμα" του Shift με τα βελάκια του Numpad
            if (!e.altKey) return;

            const code = e.code; 
            console.log("⌨️ PEGASUS UI: Executing Command for " + code);

            switch(code) {
                case 'Digit1': case 'Numpad1': 
                    e.preventDefault();
                    const startBtn = document.getElementById('btnStart') || document.getElementById('btnStartTraining');
                    if (startBtn) startBtn.click();
                    break;

                case 'Digit2': case 'Numpad2': 
                    e.preventDefault();
                    if (typeof window.nextPhase === "function") window.nextPhase();
                    else if (document.getElementById('btnNext')) document.getElementById('btnNext').click();
                    break;

                case 'Digit3': case 'Numpad3': 
                    e.preventDefault();
                    this.togglePanel('calendarPanel');
                    break;

                case 'Digit4': case 'Numpad4': 
                    e.preventDefault();
                    this.togglePanel('achievementsPanel');
                    break;

                case 'Digit5': case 'Numpad5': 
                    e.preventDefault();
                    this.togglePanel('foodPanel');
                    break;

                case 'Digit6': case 'Numpad6': 
                    e.preventDefault();
                    this.togglePanel('previewPanel');
                    break;

                case 'Digit7': case 'Numpad7': 
                    e.preventDefault();
                    this.togglePanel('settingsPanel');
                    break;

                case 'Digit8': case 'Numpad8': 
                    e.preventDefault();
                    this.togglePanel('toolsPanel');
                    break;

                case 'Digit9': case 'Numpad9': 
                    e.preventDefault();
                    if (window.exportPegasusData) window.exportPegasusData();
                    if (window.PegasusCloud && window.PegasusCloud.push) window.PegasusCloud.push();
                    break;
            }
        }, true);
    },

    /**
     * 🛠️ TACTICAL PANEL TOGGLE
     * Manages Visibility, Z-Index and Logic Initialization Bridges (Triggered by app.js or Hotkeys)
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

            // Logic Bridges
            if (id === 'settingsPanel' && typeof window.initSettingsUI === 'function') window.initSettingsUI();
            if (id === 'galleryPanel' && window.GalleryEngine) window.GalleryEngine.render();
            if (id === 'foodPanel' && typeof window.updateFoodUI === "function") window.updateFoodUI();
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
        
        // 🎯 FIXED: Αρχικοποίηση θέσης αν το πάνελ δεν έχει κουνηθεί ποτέ
        if (!panel.style.top || !panel.style.left) {
            const rect = panel.getBoundingClientRect();
            panel.style.top = rect.top + "px";
            panel.style.left = rect.left + "px";
            panel.style.position = "fixed";
            panel.style.margin = "0";
            panel.style.transform = "none";
        }

        let pos3 = e.clientX, pos4 = e.clientY;
        document.querySelectorAll('.pegasus-panel').forEach(p => p.style.zIndex = "1000");
        panel.style.zIndex = "2001"; // Πάνω από το toggle
        
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
                    // Δεν κλείνει αν κάνεις κλικ μέσα του, ούτε αν κάνεις κλικ σε κάποιο κουμπί μενού (navbar/p-btn)
                    if (!panel.contains(e.target) && !e.target.closest('.p-btn') && !e.target.closest('.navbar button') && !e.altKey) {
                        panel.style.display = 'none';
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
        item.style.opacity = '0.5'; // Visual feedback
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
        if (item) {
            item.classList.remove("dragging");
            item.style.opacity = '1';
        }
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
