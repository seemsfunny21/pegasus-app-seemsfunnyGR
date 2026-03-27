/* ==========================================================================
   PEGASUS UI MANAGER - v3.3 (UNIFIED DRAG & CLOSE)
   Protocol: Strict Modular Design - Centralized Panel Management
   ========================================================================== */

const PegasusUI = {
    // Η επίσημη λίστα των Tactical Overlays που επιτρέπεται να κλείνουν και να μετακινούνται
    panels: ['foodPanel', 'calendarPanel', 'achievementsPanel', 'settingsPanel', 'previewPanel', 'toolsPanel', 'galleryPanel', 'cardioPanel', 'emsModal'],

    init() {
        this.initDraggablePanels();
        this.initClickOutside();
        console.log("✅ PEGASUS UI MANAGER: Unified Protocol Active");
    },

    // --- ΜΗΧΑΝΙΣΜΟΣ ΜΕΤΑΚΙΝΗΣΗΣ ---
    initDraggablePanels() {
        this.panels.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (!panel) return;

            // 1. Επαναφορά θέσης
            const savedPos = JSON.parse(localStorage.getItem(`pegasus_pos_${panelId}`));
            if (savedPos) {
                Object.assign(panel.style, {
                    transform: "none", margin: "0", position: "fixed",
                    top: savedPos.top, left: savedPos.left,
                    right: "auto", bottom: "auto"
                });
            }

            // 2. Εντοπισμός Λαβής (Header)
            const header = panel.querySelector(".panel-header") || panel.querySelector("h3");
            if (!header) return;

            header.style.cursor = "grab";
            header.onmousedown = (e) => this.startDrag(e, panel, header);
        });
    },

    startDrag(e, panel, header) {
        if (e.button !== 0) return; // Μόνο αριστερό κλικ
        e.preventDefault();
        header.style.cursor = "grabbing";
        
        let pos3 = e.clientX, pos4 = e.clientY;
        
        // Z-Index Focus Management
        document.querySelectorAll('.pegasus-panel').forEach(p => p.style.zIndex = "1000");
        panel.style.zIndex = "1001";

        const elementDrag = (e) => {
            const pos1 = pos3 - e.clientX;
            const pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            // Anti-Stretch Protocol
            panel.style.right = "auto";
            panel.style.bottom = "auto";
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

    // --- ΜΗΧΑΝΙΣΜΟΣ ΚΛΕΙΣΙΜΑΤΟΣ (CLICK OUTSIDE) ---
    initClickOutside() {
        window.addEventListener('mousedown', (e) => {
            let closedAny = false;
            
            this.panels.forEach(id => {
                const panel = document.getElementById(id);
                // Αν το πάνελ είναι ανοιχτό...
                if (panel && panel.style.display === 'block') {
                    // ...και το κλικ είναι ΕΞΩ από αυτό ΚΑΙ όχι σε κουμπιά της Navbar
                    if (!panel.contains(e.target) && !e.target.closest('.p-btn') && !e.target.closest('.navbar button')) {
                        panel.style.display = 'none';
                        closedAny = true;
                    }
                }
            });

            // Αν έκλεισε κάτι, κάνουμε push για να σωθεί η κατάσταση στο Cloud
            if (closedAny && window.PegasusCloud) window.PegasusCloud.push(true);
        });
    }
};

// --- ΜΕΡΟΣ 2: ΑΝΑΔΙΑΤΑΞΗ ΑΣΚΗΣΕΩΝ (EXERCISES) ---
function initExerciseListDrag() {
    const list = document.getElementById("exList");
    if (!list) return;

    const newList = list.cloneNode(true);
    list.parentNode.replaceChild(newList, list);

    newList.addEventListener("dragstart", (e) => {
        if (window.running === true) { e.preventDefault(); return; }
        if (e.target.classList.contains("exercise")) e.target.classList.add("dragging");
    });

    newList.addEventListener("dragover", (e) => {
        if (window.running === true) return;
        e.preventDefault();
        const draggingItem = document.querySelector(".dragging");
        if (!draggingItem) return;
        const siblings = [...newList.querySelectorAll(".exercise:not(.dragging)")];
        let nextSibling = siblings.find(sibling => e.clientY <= sibling.offsetTop + sibling.offsetHeight / 2);
        newList.insertBefore(draggingItem, nextSibling);
    });

    newList.addEventListener("dragend", (e) => {
        if (window.running === true) return;
        if (e.target.classList.contains("exercise")) {
            e.target.classList.remove("dragging");
            if (typeof exercises !== 'undefined') {
                exercises = [...document.querySelectorAll(".exercise")];
                remainingSets = exercises.map(el => parseInt(el.dataset.total) - parseInt(el.dataset.done));
            }
            const activeBtn = document.querySelector(".navbar button.active");
            if (activeBtn) {
                const dayName = activeBtn.textContent.trim();
                const names = [...document.querySelectorAll(".exercise-name")].map(el => el.textContent.replace(" ☀️", "").trim());
                localStorage.setItem(`pegasus_order_${dayName}`, JSON.stringify(names));
            }
        }
    });
}

// BOOT ENGINE
window.addEventListener('load', () => {
    PegasusUI.init();
    initExerciseListDrag();
});

/* ===== PEGASUS UI WATCHER (DRAGDROP LAYER) ===== */
document.addEventListener('click', function(e) {
    // Αν πατηθεί το κουμπί Προθέρμανση στο Control Bar
    if (e.target && e.target.id === 'btnWarmup') {
        console.log("PEGASUS UI: Warmup Trigger Detected via DragDrop Layer");
        
        // 1. Ενημέρωση Label
        const label = document.getElementById("phaseTimer");
        if (label) label.textContent = "ΠΡΟΘΕΡΜΑΝΣΗ (Standby)";

        // 2. Force Video Call
        if (typeof showVideo === 'function') {
            showVideo(null); 
        }
    }
});
