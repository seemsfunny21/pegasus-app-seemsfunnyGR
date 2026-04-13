/* ==========================================================================
   📦 PEGASUS MODULE: DYNAMIC INVENTORY & PORTION CONTROL (v2.1)
   ========================================================================== */

(function() {
    const SUPPLIES_DATA_KEY = 'pegasus_supplies_v1';

    // 1. Ρύθμιση Προτύπων & Δοσολογίας
    const defaultSupplies = [
        { id: 'yog', label: 'Γιαούρτι', amount: 1000, unit: 'g', portion: 250, refill: 1000, icon: '🥣' },
        { id: 'ban', label: 'Μπανάνες', amount: 5, unit: 'τεμ', portion: 1, refill: 5, icon: '🍌' },
        { id: 'amyg', label: 'Αμύγδαλα', amount: 500, unit: 'g', portion: 30, refill: 500, icon: '🥜' },
        { id: 'honey', label: 'Μέλι', amount: 1000, unit: 'g', portion: 20, refill: 1000, icon: '🍯' }
    ];

    // 2. Μηχανή Δεδομένων (Logic Engine)
    window.PegasusSupplies = {
        updateAmount: function(id, type) {
            let supplies = JSON.parse(localStorage.getItem(SUPPLIES_DATA_KEY)) || defaultSupplies;
            const idx = supplies.findIndex(i => i.id === id);
            
            if (idx === -1) return;

            if (type === 'consume') {
                supplies[idx].amount = Math.max(0, supplies[idx].amount - supplies[idx].portion);
            } else if (type === 'refill') {
                supplies[idx].amount += supplies[idx].refill;
            }

            localStorage.setItem(SUPPLIES_DATA_KEY, JSON.stringify(supplies));
            window.renderSuppliesContent();
            
            // Mirroring: Ενημέρωση αν υπάρχει component στο Home
            if (window.updateSuppUI) window.updateSuppUI();
        }
    };

    // 3. Κατασκευαστής Οθόνης
    function injectViewLayer() {
        if (document.getElementById('supplies')) return;

        const viewDiv = document.createElement('div');
        viewDiv.id = 'supplies';
        viewDiv.className = 'view';
        viewDiv.innerHTML = `
            <button class="btn-back" onclick="openView('home')">◀ ΕΠΙΣΤΡΟΦΗ</button>
            <div class="section-title">ΔΙΑΧΕΙΡΙΣΗ ΑΠΟΘΕΜΑΤΩΝ</div>
            <div id="supplies-content" style="width: 100%; display: flex; flex-direction: column; gap: 12px;"></div>
        `;
        document.body.appendChild(viewDiv);
    }

    // 4. Rendering Engine
    window.renderSuppliesContent = function() {
        const container = document.getElementById('supplies-content');
        if (!container) return;

        const supplies = JSON.parse(localStorage.getItem(SUPPLIES_DATA_KEY)) || defaultSupplies;
        
        container.innerHTML = supplies.map(item => {
            const pct = (item.amount / item.refill) * 100;
            const statusColor = pct < 20 ? '#ff4444' : (pct < 50 ? '#ffbb33' : '#00ff41');

            return `
                <div class="mini-card" style="border-left: 4px solid ${statusColor}; padding: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                        <div>
                            <div style="font-weight: 900; font-size: 16px; color: #fff;">${item.icon} ${item.label}</div>
                            <div style="font-size: 11px; color: #555; font-weight: 800; letter-spacing:1px;">
                                ΑΠΟΘΕΜΑ: <span style="color:${statusColor}">${item.amount}${item.unit}</span>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 10px; font-weight: 900; color: ${statusColor};">${Math.round(pct)}%</div>
                        </div>
                    </div>

                    <div class="bar-bg" style="height: 6px; margin-bottom: 15px;">
                        <div class="bar-fill" style="width: ${Math.min(pct, 100)}%; background: ${statusColor}; box-shadow: 0 0 10px ${statusColor}44;"></div>
                    </div>

                    <div style="display: flex; gap: 10px;">
                        <button class="secondary-btn" style="flex: 1; padding: 12px; font-size: 10px; border-color: #333;" 
                                onclick="window.PegasusSupplies.updateAmount('${item.id}', 'consume')">
                            - ${item.portion}${item.unit}
                        </button>
                        <button class="primary-btn" style="flex: 1; padding: 12px; font-size: 10px;" 
                                onclick="window.PegasusSupplies.updateAmount('${item.id}', 'refill')">
                            + ${item.refill}${item.unit}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    };

    // 5. Boot Sequence
    document.addEventListener("DOMContentLoaded", () => {
        injectViewLayer();
        window.renderSuppliesContent();

        if (window.registerPegasusModule) {
            window.registerPegasusModule({
                id: 'supplies',
                label: 'Αποθέματα',
                icon: '📦'
            });
        }
    });
})();
