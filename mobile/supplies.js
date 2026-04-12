/* ==========================================================================
   📦 PEGASUS MODULE: INVENTORY & SUPPLIES (v2.0)
   Protocol: Self-Injecting View & Dynamic Grid Integration
   ========================================================================== */

(function() {
    const SUPPLIES_DATA_KEY = 'pegasus_supplies_v1';

    // 1. Αρχικά δεδομένα (Δοκιμαστικά)
    const defaultSupplies = [
        { id: 'prot', label: 'Πρωτεΐνη', amount: '1.2kg', status: 'ok' },
        { id: 'amyg', label: 'Αμύγδαλα', amount: '500g', status: 'low' },
        { id: 'yog', label: 'Γιαούρτι', amount: '4 τεμ.', status: 'ok' },
        { id: 'ban', label: 'Μπανάνες', amount: '2 τεμ.', status: 'critical' },
        { id: 'crea', label: 'Κρεατίνη', amount: '300g', status: 'ok' }
    ];

    // 2. Ο Κατασκευαστής της Οθόνης (View Injector)
    function injectViewLayer() {
        // Αν υπάρχει ήδη η οθόνη, σταματάμε για αποφυγή διπλότυπων
        if (document.getElementById('supplies')) return;

        // Δημιουργούμε το Layer
        const viewDiv = document.createElement('div');
        viewDiv.id = 'supplies';
        viewDiv.className = 'view';
        
        // Χτίζουμε το σκελετό του UI σύμφωνα με το Pegasus Design
        viewDiv.innerHTML = `
            <button class="btn-back" onclick="openView('home')">◀ ΕΠΙΣΤΡΟΦΗ</button>
            <div class="section-title">ΔΙΑΧΕΙΡΙΣΗ ΑΠΟΘΕΜΑΤΩΝ</div>
            <div id="supplies-content" style="width: 100%;"></div>
            <button class="primary-btn" style="margin-top:20px;" onclick="window.renderSuppliesContent()">ΑΝΑΝΕΩΣΗ</button>
        `;
        
        // Φυτεύουμε την οθόνη κρυφά στο σύστημα
        document.body.appendChild(viewDiv);
    }

    // 3. Η Μηχανή Σχεδίασης Δεδομένων
    window.renderSuppliesContent = function() {
        const container = document.getElementById('supplies-content');
        if (!container) return;

        const supplies = JSON.parse(localStorage.getItem(SUPPLIES_DATA_KEY)) || defaultSupplies;
        let html = '';

        supplies.forEach(item => {
            // Υπολογισμός χρωμάτων ανάλογα την κατάσταση
            const statusColor = item.status === 'critical' ? '#ff4444' : (item.status === 'low' ? '#ffbb33' : '#00ff41');
            const statusText = item.status === 'critical' ? 'ΚΡΙΣΙΜΟ' : (item.status === 'low' ? 'ΧΑΜΗΛΟ' : 'ΟΚ');
            
            html += `
                <div style="background: rgba(255,255,255,0.03); margin-bottom: 10px; padding: 15px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid ${statusColor}; border-top: 1px solid #1a1a1a; border-right: 1px solid #1a1a1a; border-bottom: 1px solid #1a1a1a;">
                    <div>
                        <div style="font-weight: 900; font-size: 14px; color: #fff; text-align: left;">${item.label}</div>
                        <div style="font-size: 11px; color: var(--main); font-weight: 800; margin-top: 4px; text-align: left;">ΠΟΣΟΤΗΤΑ: ${item.amount}</div>
                    </div>
                    <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: ${statusColor}; font-weight: 900; background: rgba(255,255,255,0.05); padding: 5px 10px; border-radius: 8px;">
                        ${statusText}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    };

    // 4. Η διαδικασία Φόρτωσης (Boot Sequence)
    document.addEventListener("DOMContentLoaded", () => {
        injectViewLayer(); // Φτιάχνει την οθόνη
        window.renderSuppliesContent(); // Τη γεμίζει με τα δεδομένα
        
        // Ειδοποιεί τον Αρχιτέκτονα να βγάλει το Κουμπί στο Home
        if (window.registerPegasusModule) {
            window.registerPegasusModule({
                id: 'supplies',
                label: 'Αποθέματα',
                icon: '📦'
            });
        }
    });
})();
