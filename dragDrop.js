function initDragDrop() {
    const list = document.getElementById("exList");
    if (!list) return;

    // Αποφυγή διπλότυπων listeners
    const newList = list.cloneNode(true);
    list.parentNode.replaceChild(newList, list);

    newList.addEventListener("dragstart", (e) => {
        if (e.target.classList.contains("exercise")) {
            e.target.classList.add("dragging");
        }
    });

    newList.addEventListener("dragover", (e) => {
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