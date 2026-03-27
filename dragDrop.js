/* ==========================================================================
   PEGASUS DRAG & DROP ENGINE - v2.1 (ACTIVE SESSION GUARD)
   Protocol: Strict State Management - Lock UI during active workout
   ========================================================================== */

function initDragDrop() {
    const list = document.getElementById("exList");
    if (!list) return;

    // Αποφυγή διπλότυπων listeners
    const newList = list.cloneNode(true);
    list.parentNode.replaceChild(newList, list);

    newList.addEventListener("dragstart", (e) => {
        // SAFETY GUARD: Απαγόρευση αναδιάταξης αν η προπόνηση είναι ενεργή (app.js)
        if (window.running === true) {
            e.preventDefault();
            console.warn("PEGASUS: Drag & Drop locked during active session.");
            return;
        }

        if (e.target.classList.contains("exercise")) {
            e.target.classList.add("dragging");
        }
    });

    newList.addEventListener("dragover", (e) => {
        if (window.running === true) return; // Fail-safe
        
        e.preventDefault();
        const draggingItem = document.querySelector(".dragging");
        if (!draggingItem) return;

        const siblings = [...newList.querySelectorAll(".exercise:not(.dragging)")];
        let nextSibling = siblings.find(sibling => {
            return e.clientY <= sibling.offsetTop + sibling.offsetHeight / 2;
        });

        newList.insertBefore(draggingItem, nextSibling);
    });

    newList.addEventListener("dragend", (e) => {
        if (window.running === true) return; // Fail-safe

        if (e.target.classList.contains("exercise")) {
            e.target.classList.remove("dragging");
            
            // 1. Συγχρονισμός πινάκων app.js
            if (typeof exercises !== 'undefined') {
                exercises = [...document.querySelectorAll(".exercise")];
                remainingSets = exercises.map(el => parseInt(el.dataset.total) - parseInt(el.dataset.done));
            }

            // 2. Μόνιμη αποθήκευση με το σωστό κλειδί
            const activeBtn = document.querySelector(".navbar button.active");
            if (activeBtn) {
                const dayName = activeBtn.textContent.trim();
                // Καθαρισμός ονόματος από το emoji ☀️ για σωστό sorting αργότερα
                const names = [...document.querySelectorAll(".exercise-name")].map(el => 
                    el.textContent.replace(" ☀️", "").trim()
                );
                
                // Αποθήκευση στο κλειδί που περιμένει η selectDay
                localStorage.setItem(`pegasus_order_${dayName}`, JSON.stringify(names));
                console.log(`PEGASUS: Order for ${dayName} strictly saved!`, names);
            }
        }
    });
}

/* ==========================================================================
   UNIVERSAL FLOATING PANELS ENGINE (Moved from app.js & Patched)
   Protocol: CSS Anchor Release (Zero-Stretching)
   ========================================================================== */
function initDraggablePanels() {
    const movablePanels = ['foodPanel', 'calendarPanel', 'achievementsPanel', 'settingsPanel', 'previewPanel', 'toolsPanel', 'galleryPanel', 'cardioPanel', 'emsModal'];
    
    movablePanels.forEach(panelId => {
        const panel = document.getElementById(panelId);
        if (!panel) return;

        // 1. Restore Position & Release Anchors on Load
        const savedPos = JSON.parse(localStorage.getItem(`pegasus_pos_${panelId}`));
        if (savedPos) {
            panel.style.transform = "none";
            panel.style.margin = "0";
            panel.style.position = "fixed";
            panel.style.top = savedPos.top;
            panel.style.left = savedPos.left;
            // Απεμπλοκή για να μην τεντώνει όταν φορτώνει
            panel.style.right = "auto";
            panel.style.bottom = "auto";
        }

        // 2. Identify Drag Handle
        const header = panel.querySelector("h3") || panel.querySelector(".panel-header");
        if (!header) return;

        header.style.cursor = "grab";
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        header.onmousedown = function(e) {
            e.preventDefault();
            header.style.cursor = "grabbing";
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            // Z-Index Focus: Φέρνει το πάνελ που πιάνεις μπροστά από όλα
            document.querySelectorAll('.pegasus-panel').forEach(p => p.style.zIndex = "1000");
            panel.style.zIndex = "1001";

            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        };

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            panel.style.transform = "none";
            panel.style.margin = "0";
            panel.style.position = "fixed";
            
            // ΚΡΙΣΙΜΗ ΕΠΙΛΥΣΗ (Stretching Fix): 
            // Σπάμε τις άγκυρες του CSS (right/bottom) για να επιτρέψουμε ελεύθερη κίνηση
            panel.style.right = "auto";
            panel.style.bottom = "auto";
            
            panel.style.top = (panel.offsetTop - pos2) + "px";
            panel.style.left = (panel.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
            header.style.cursor = "grab";
            
            // 3. Save Position to LocalStorage
            localStorage.setItem(`pegasus_pos_${panelId}`, JSON.stringify({
                top: panel.style.top,
                left: panel.style.left
            }));
        }
    });
}

// Αυτόματη αρχικοποίηση όταν φορτώνει το DOM
window.addEventListener('load', initDraggablePanels);
