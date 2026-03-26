/* --- MODULE INITIALIZATION (Modular Architecture) --- */
window.PegasusFood = {
    init: function() {
        console.log("PEGASUS: Food Module Initializing...");
        
        // Σύνδεση κεντρικού κουμπιού Διατροφής (Navbar)
        const btnUI = document.getElementById("btnFoodUI");
        if (btnUI) {
            btnUI.onclick = () => {
                const panel = document.getElementById("foodPanel");
                if (panel) {
                    const isVisible = panel.style.display === "block";
                    // Κλείσιμο άλλων panels
                    document.querySelectorAll('.pegasus-panel').forEach(p => p.style.display = 'none');
                    // Toggle current panel
                    panel.style.display = isVisible ? "none" : "block";
                    if (!isVisible) window.updateFoodUI();
                }
            };
        }

        // Σύνδεση κουμπιού Προσθήκης (+)
        const btnAdd = document.getElementById("btnAddFood");
        if (btnAdd) {
            btnAdd.onclick = () => this.executeAddFlow();
        }

        // Αρχικό Render
        window.updateFoodUI();
    },

    executeAddFlow: function() {
        const nameEl = document.getElementById('foodName');
        const kcalEl = document.getElementById('foodKcal');
        const protEl = document.getElementById('foodNote');
        
        const name = nameEl?.value;
        const kcal = kcalEl?.value;
        const protein = protEl?.value || 0;

        if (name && kcal) {
            window.addFoodItem(name, kcal, protein);
            // Καθαρισμός πεδίων
            if (nameEl) nameEl.value = "";
            if (kcalEl) kcalEl.value = "";
            if (protEl) protEl.value = "";
        } else {
            alert("PEGASUS STRICT: Συμπλήρωσε Φαγητό και Θερμίδες!");
        }
    }
};

// Εκκίνηση του Module
window.addEventListener("load", () => window.PegasusFood.init());
