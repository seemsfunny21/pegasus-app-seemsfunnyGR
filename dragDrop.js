/* ==========================================================================
   PEGASUS DRAG & DROP ENGINE - v3.2 (UNIFIED ARCHITECTURE)
   Protocol: Strict Modular Design - Universal Panel Support
   ========================================================================== */

// --- ΜΕΡΟΣ 1: ΜΕΤΑΚΙΝΗΣΗ ΠΑΡΑΘΥΡΩΝ (PANELS) ---
function initDraggablePanels() {
    const movablePanels = ['foodPanel', 'calendarPanel', 'achievementsPanel', 'settingsPanel', 'previewPanel', 'toolsPanel', 'galleryPanel', 'cardioPanel', 'emsModal'];
    
    movablePanels.forEach(panelId => {
        const panel = document.getElementById(panelId);
        if (!panel) return;

        // 1. Επαναφορά θέσης από τη μνήμη
        const savedPos = JSON.parse(localStorage.getItem(`pegasus_pos_${panelId}`));
        if (savedPos) {
            panel.style.transform = "none";
            panel.style.margin = "0";
            panel.style.position = "fixed";
            panel.style.top = savedPos.top;
            panel.style.left = savedPos.left;
            panel.style.right = "auto"; 
            panel.style.bottom = "auto";
        }

        // 2. Εντοπισμός Λαβής (Header): Ψάχνει για .panel-header ή h3
        const header = panel.querySelector(".panel-header") || panel.querySelector("h3");
        if (!header) return;

        header.style.cursor = "grab";
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        header.onmousedown = function(e) {
            if (e.button !== 0) return; // Μόνο αριστερό κλικ
            
            e.preventDefault();
            header.style.cursor = "grabbing";
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            // Focus: Φέρνει το παράθυρο μπροστά
            document.querySelectorAll('.pegasus-panel').forEach(p => p.style.zIndex = "1000");
            panel.style.zIndex = "1001";

            // Anti-Stretch Protocol: Απελευθέρωση όλων των CSS περιορισμών
            panel.style.right = "auto";
            panel.style.bottom = "auto";
            panel.style.margin = "0";
            panel.style.transform = "none";

            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        };

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            panel.style.top = (panel.offsetTop - pos2) + "px";
            panel.style.left = (panel.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
            header.style.cursor = "grab";
            
            // Αποθήκευση θέσης
            localStorage.setItem(`pegasus_pos_${panelId}`, JSON.stringify({
                top: panel.style.top,
                left: panel.style.left
            }));
        }
    });
}

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
    initDraggablePanels();
    initExerciseListDrag();
    console.log("✅ PEGASUS DRAG ENGINE v3.2: Unified & Active");
});
