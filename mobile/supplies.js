/* ==========================================================================
   📦 PEGASUS MODULE: ADVANCED INVENTORY & STOCK AUDIT (v2.2)
   ========================================================================== */

(function() {
    const SUPPLIES_DATA_KEY = 'pegasus_supplies_v1';

    const defaultSupplies = [
        { id: 'yog', label: 'Γιαούρτι', amount: 1000, unit: 'g', portion: 250, refill: 1000, icon: '🥣' },
        { id: 'ban', label: 'Μπανάνες', amount: 5, unit: 'τεμ', portion: 1, refill: 5, icon: '🍌' },
        { id: 'amyg', label: 'Αμύγδαλα', amount: 500, unit: 'g', portion: 30, refill: 500, icon: '🥜' },
        { id: 'honey', label: 'Μέλι', amount: 1000, unit: 'g', portion: 20, refill: 1000, icon: '🍯' },
        { id: 'eggs', label: 'Αυγά', amount: 30, unit: 'τεμ', portion: 3, refill: 30, icon: '🥚' }
    ];

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

            this.saveAndRender(supplies);
        },

        setManualAmount: function(id) {
            let supplies = JSON.parse(localStorage.getItem(SUPPLIES_DATA_KEY)) || defaultSupplies;
            const idx = supplies.findIndex(i => i.id === id);
            
            const newVal = prompt(`Ενημέρωση αποθέματος για: ${supplies[idx].label} (${supplies[idx].unit})`, supplies[idx].amount);
            
            if (newVal !== null && !isNaN(newVal)) {
                supplies[idx].amount = parseFloat(newVal);
                this.saveAndRender(supplies);
            }
        },

        saveAndRender: function(data) {
            localStorage.setItem(SUPPLIES_DATA_KEY, JSON.stringify(data));
            window.renderSuppliesContent();
            if (window.updateSuppUI) window.updateSuppUI();
        }
    };

    function injectViewLayer() {
        if (document.getElementById('supplies')) return;
        const viewDiv = document.createElement('div');
        viewDiv.id = 'supplies';
        viewDiv.className = 'view';
        viewDiv.innerHTML = `
            <button class="btn-back" onclick="openView('home')">◀ ΕΠΙΣΤΡΟΦΗ</button>
            <div class="section-title">ΔΙΑΧΕΙΡΙΣΗ ΑΠΟΘΕΜΑΤΩΝ</div>
            <div id="supplies-content" style="width: 100%; display: flex; flex-direction: column; gap: 12px; padding-bottom: 80px;"></div>
        `;
        document.body.appendChild(viewDiv);
    }

    window.renderSuppliesContent = function() {
        const container = document.getElementById('supplies-content');
        if (!container) return;

        const supplies = JSON.parse(localStorage.getItem(SUPPLIES_DATA_KEY)) || defaultSupplies;
        
        container.innerHTML = supplies.map(item => {
            const pct = (item.amount / item.refill) * 100;
            const statusColor = pct < 15 ? '#ff4444' : (pct < 40 ? '#ffbb33' : '#00ff41');

            return `
                <div class="mini-card" style="border-left: 4px solid ${statusColor}; padding: 15px; position: relative;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                        <div>
                            <div style="font-weight: 900; font-size: 16px; color: #fff;">${item.icon} ${item.label}</div>
                            <div style="font-size: 11px; color: #555; font-weight: 800;">
                                ΣΥΝΟΛΟ: <span style="color:${statusColor}">${item.amount}${item.unit}</span>
                            </div>
                        </div>
                        <button onclick="window.PegasusSupplies.setManualAmount('${item.id}')" 
                                style="background: rgba(255,255,255,0.05); border: 1px solid #333; color: #777; border-radius: 8px; padding: 5px 8px; font-size: 12px;">
                            ⚙️
                        </button>
                    </div>

                    <div class="bar-bg" style="height: 4px; margin-bottom: 12px;">
                        <div class="bar-fill" style="width: ${Math.min(pct, 100)}%; background: ${statusColor};"></div>
                    </div>

                    <div style="display: flex; gap: 8px;">
                        <button class="secondary-btn" style="flex: 2; padding: 10px; font-size: 10px; border-color: #222;" 
                                onclick="window.PegasusSupplies.updateAmount('${item.id}', 'consume')">
                            ΦΑΓΕ -${item.portion}${item.unit}
                        </button>
                        <button class="primary-btn" style="flex: 1; padding: 10px; font-size: 10px;" 
                                onclick="window.PegasusSupplies.updateAmount('${item.id}', 'refill')">
                            +${item.refill}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    };

    document.addEventListener("DOMContentLoaded", () => {
        injectViewLayer();
        window.renderSuppliesContent();
        if (window.registerPegasusModule) {
            window.registerPegasusModule({ id: 'supplies', label: 'Αποθέματα', icon: '📦' });
        }
    });
})();
