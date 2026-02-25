function initDragDrop() {
    const list = document.getElementById("exList");
    if (!list) return;

    // Αφαιρούμε παλιούς listeners αν υπάρχουν (για αποφυγή διπλότυπων)
    list.replaceWith(list.cloneNode(true));
    const newList = document.getElementById("exList");

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
            
            // 1. Ενημέρωση των πινάκων στη μνήμη του app.js
            if (typeof exercises !== 'undefined') {
                exercises = [...document.querySelectorAll(".exercise")];
                remainingSets = exercises.map(el => parseInt(el.dataset.total) - parseInt(el.dataset.done));
                
                // 2. Μόνιμη αποθήκευση (Χρήση του ίδιου κλειδιού με το app.js)
                const activeBtn = document.querySelector(".navbar button.active");
                if (activeBtn) {
                    const dayName = activeBtn.textContent;
                    const names = [...document.querySelectorAll(".exercise-name")].map(el => el.textContent.trim());
                    
                    let orders = JSON.parse(localStorage.getItem("pegasus_custom_orders") || "{}");
                    orders[dayName] = names;
                    localStorage.setItem("pegasus_custom_orders", JSON.stringify(orders));
                    console.log(`Η σειρά για τη μέρα ${dayName} αποθηκεύτηκε!`);
                }
            }
        }
    });
}