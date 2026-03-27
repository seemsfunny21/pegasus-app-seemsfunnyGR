/* ==========================================================================
   PEGASUS UI MANAGER - CLEAN SWEEP v17.0
   Protocol: Unified Draggable Overlays | Logic: Centralized Panel Control
   ========================================================================== */

const PegasusUI = {
    // Η επίσημη λίστα των Tactical Overlays του v17.0
    panels: [
        'foodPanel', 'calendarPanel', 'achievementsPanel', 
        'settingsPanel', 'previewPanel', 'toolsPanel', 
        'galleryPanel', 'cardioPanel', 'emsModal'
    ],

    init() {
        this.initDraggablePanels();
        this.initClickOutside();
        console.log("✅ PEGASUS UI MANAGER: Operational.");
    },

    /**
     * Διαχείριση Μετακίνησης Παραθύρων
     */
    initDraggablePanels() {
        this.panels.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (!panel) return;

            // 1. Ανάκτηση και επιβολή αποθηκευμένης θέσης
            const savedPos = JSON.parse(localStorage.getItem(`pegasus_pos_${panelId}`));
            if (savedPos) {
                Object.assign(panel.style, {
                    transform: "none", 
                    margin: "0", 
                    position: "fixed",
                    top: savedPos.top, 
                    left: savedPos.left,
                    right: "auto", 
                    bottom: "auto"
                });
            }

            // 2. Event Listeners για το Dragging (Desktop & Mobile)
            panel.addEventListener('mousedown', (e) => this.startDragging(e, panel));
            panel.addEventListener('touchstart', (e) => this.startDragging(e.touches[0], panel), { passive: false });
        });
    },

    startDragging(e, panel) {
        // Αποτροπή dragging αν ο χρήστης αλληλεπιδρά με inputs ή buttons
        if (['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

        const startX = e.clientX - panel.offsetLeft;
        const startY = e.clientY - panel.offsetTop;

        const mouseMoveHandler = (moveEvent) => {
            const ev = moveEvent.touches ? moveEvent.touches[0] : moveEvent;
            panel.style.left = (ev.clientX - startX) + 'px';
            panel.style.top = (ev.clientY - startY) + 'px';
        };

        const mouseUpHandler = () => {
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
            document.removeEventListener('touchmove', mouseMoveHandler);
            document.removeEventListener('touchend', mouseUpHandler);
            
            // Αποθήκευση νέας θέσης
            localStorage.setItem(`pegasus_pos_${panel.id}`, JSON.stringify({
                top: panel.style.top,
                left: panel.style.left
            }));
        };

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
        document.addEventListener('touchmove', mouseMoveHandler, { passive: false });
        document.addEventListener('touchend', mouseUpHandler);
    },

    /**
     * Πρωτόκολλο Click-Outside: Κλείσιμο παραθύρων με κλικ στο υπόβαθρο
     */
    initClickOutside() {
        document.addEventListener('click', (e) => {
            // Αν το κλικ δεν είναι σε panel ή σε κουμπί της Navbar
            if (!e.target.closest('.pegasus-panel') && !e.target.closest('.navbar button')) {
                this.closeAllPanels();
            }
        });
    },

    closeAllPanels() {
        this.panels.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    }
};

/**
 * Αναδιάταξη Λίστας Ασκήσεων (Drag & Drop Reordering)
 */
function initExerciseListDrag() {
    const newList = document.getElementById("exList");
    if (!newList) return;

    newList.addEventListener("dragstart", (e) => {
        // Απενεργοποίηση reordering αν η προπόνηση τρέχει
        if (window.running === true) {
            e.preventDefault();
            return;
        }
        if (e.target.classList.contains("exercise")) {
            e.target.classList.add("dragging");
        }
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
            
            // Ενημέρωση της εσωτερικής μνήμης του Engine (app.js)
            if (typeof window.exercises !== 'undefined') {
                window.exercises = [...document.querySelectorAll(".exercise")];
            }
            
            // Αποθήκευση της νέας σειράς βάσει ημέρας
            const activeBtn = document.querySelector(".navbar button.active");
            if (activeBtn) {
                const dayName = activeBtn.textContent.trim();
                const names = [...document.querySelectorAll(".exercise-name")].map(el => el.textContent.replace(" 🎯", "").trim());
                localStorage.setItem(`pegasus_order_${dayName}`, JSON.stringify(names));
            }
        }
    });
}

// Boot UI Engine
window.addEventListener('load', () => {
    PegasusUI.init();
    initExerciseListDrag();
});