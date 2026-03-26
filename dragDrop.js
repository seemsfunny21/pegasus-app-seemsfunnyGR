/* ==========================================================================
   PEGASUS DRAG & DROP ENGINE - v3.0 (MODULAR / FULLY DECOUPLED)
   Protocol: Strict State Management - Independent DOM Tracking
   ========================================================================== */

const PegasusDragDrop = (function() {
    let listElement = null;

    // 1. ΑΝΕΞΑΡΤΗΤΟΣ ΕΛΕΓΧΟΣ ΚΑΤΑΣΤΑΣΗΣ (Decoupled from app.js window.running)
    const isWorkoutActive = () => {
        const startBtn = document.getElementById("btnStart");
        return startBtn && startBtn.innerHTML === "Παύση";
    };

    // 2. ΑΥΤΟΝΟΜΗ ΑΠΟΘΗΚΕΥΣΗ ΔΕΔΟΜΕΝΩΝ (Decoupled from global arrays)
    const commitOrderState = () => {
        const activeBtn = document.querySelector(".navbar button.active");
        if (!activeBtn) return;

        const dayName = activeBtn.textContent.trim();
        // Καθαρισμός ονόματος και εξαγωγή διάταξης απευθείας από το DOM
        const names = [...document.querySelectorAll(".exercise-name")].map(el => 
            el.textContent.replace(" ☀️", "").trim()
        );
        
        localStorage.setItem(`pegasus_order_${dayName}`, JSON.stringify(names));
        console.log(`[PEGASUS DRAG&DROP]: Order for ${dayName} strictly saved.`, names);
    };

    // 3. EVENT HANDLERS
    const handleDragStart = (e) => {
        if (isWorkoutActive()) {
            e.preventDefault();
            console.warn("[PEGASUS DRAG&DROP]: System locked during active session.");
            return;
        }

        if (e.target.classList.contains("exercise")) {
            e.target.classList.add("dragging");
        }
    };

    const handleDragOver = (e) => {
        if (isWorkoutActive()) return; // Fail-safe
        
        e.preventDefault();
        const draggingItem = document.querySelector(".dragging");
        if (!draggingItem) return;

        const siblings = [...listElement.querySelectorAll(".exercise:not(.dragging)")];
        let nextSibling = siblings.find(sibling => {
            return e.clientY <= sibling.offsetTop + sibling.offsetHeight / 2;
        });

        listElement.insertBefore(draggingItem, nextSibling);
    };

    const handleDragEnd = (e) => {
        if (isWorkoutActive()) return; // Fail-safe

        if (e.target.classList.contains("exercise")) {
            e.target.classList.remove("dragging");
            commitOrderState(); // Απευθείας εγγραφή στο LocalStorage
        }
    };

    // 4. PUBLIC API
    return {
        init: function() {
            const originalList = document.getElementById("exList");
            if (!originalList) return;

            // Αποφυγή διπλότυπων listeners μέσω clone & replace
            listElement = originalList.cloneNode(true);
            originalList.parentNode.replaceChild(listElement, originalList);

            listElement.addEventListener("dragstart", handleDragStart);
            listElement.addEventListener("dragover", handleDragOver);
            listElement.addEventListener("dragend", handleDragEnd);
        }
    };
})();

// Εξαγωγή της συνάρτησης αρχικοποίησης για κλήση κατά τη δημιουργία της λίστας
window.initDragDrop = PegasusDragDrop.init;