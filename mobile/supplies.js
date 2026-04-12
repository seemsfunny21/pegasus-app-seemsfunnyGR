/**
 * 📦 PEGASUS MODULE: INVENTORY & SUPPLIES
 * Σύστημα παρακολούθησης αποθεμάτων (Δοκιμαστικό)
 */

(function() {
    const SUPPLIES_DATA_KEY = 'pegasus_supplies_v1';

    // Αρχικά δεδομένα αν δεν υπάρχουν στο LocalStorage
    const defaultSupplies = [
        { id: 'prot', label: 'Πρωτεΐνη', amount: '1.2kg', status: 'ok' },
        { id: 'amyg', label: 'Αμύγδαλα', amount: '500g', status: 'low' },
        { id: 'yog', label: 'Γιαούρτι', amount: '4 τεμ.', status: 'ok' },
        { id: 'ban', label: 'Μπανάνες', amount: '2 τεμ.', status: 'critical' },
        { id: 'crea', label: 'Κρεατίνη', amount: '300g', status: 'ok' }
    ];

    // Εγγραφή του Module στο Pegasus Mobile UI
    if (window.registerPegasusModule) {
        window.registerPegasusModule({
            id: 'supplies',
            label: 'Αποθέματα',
            icon: '📦'
        });
    }

    // Δημιουργία του View (Το παράθυρο που ανοίγει)
    window.renderSuppliesView = function() {
        const container = document.getElementById('view-content');
        const supplies = JSON.parse(localStorage.getItem(SUPPLIES_DATA_KEY)) || defaultSupplies;

        let html = `
            <div class="module-header">
                <h2>📦 Διαχείριση Αποθεμάτων</h2>
                <p>Κατάσταση προμηθειών Pegasus</p>
            </div>
            <div class="supplies-list">
        `;

        supplies.forEach(item => {
            const statusColor = item.status === 'critical' ? '#ff4444' : (item.status === 'low' ? '#ffbb33' : '#00C851');
            html += `
                <div style="background: rgba(255,255,255,0.05); margin: 10px 0; padding: 15px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid ${statusColor};">
                    <div>
                        <div style="font-weight: bold; font-size: 1.1em;">${item.label}</div>
                        <div style="font-size: 0.85em; opacity: 0.7;">Ποσότητα: ${item.amount}</div>
                    </div>
                    <div style="font-size: 0.7em; text-transform: uppercase; letter-spacing: 1px; color: ${statusColor}; font-weight: 900;">
                        ${item.status}
                    </div>
                </div>
            `;
        });

        html += `
            </div>
            <button class="action-btn" style="margin-top:20px; background: #33b5e5;" onclick="alert('Η λειτουργία επεξεργασίας θα ενεργοποιηθεί στην v2')">
                ΕΝΗΜΕΡΩΣΗ ΑΠΟΘΕΜΑΤΩΝ
            </button>
        `;

        container.innerHTML = html;
    };

    // Σύνδεση με το υπάρχον σύστημα πλοήγησης (openView)
    // Πρέπει να επεκτείνουμε την openView αν δεν την έχουμε κάνει ήδη δυναμική
    const originalOpenView = window.openView;
    window.openView = function(viewId) {
        if (viewId === 'supplies') {
            document.getElementById('main-menu').style.display = 'none';
            document.getElementById('module-view').style.display = 'block';
            renderSuppliesView();
        } else if (originalOpenView) {
            originalOpenView(viewId);
        }
    };
})();
