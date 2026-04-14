/* ==========================================================================
   📦 PEGASUS MODULE: DYNAMIC INVENTORY & AUTO-CRON SYSTEM (v4.0)
   Protocol: Automated Daily Depletion based on Last-Sync Timestamp
   ========================================================================== */

(function() {
    const SUPPLIES_DATA_KEY = 'pegasus_supplies_v1';
    const LAST_AUTO_SYNC_KEY = 'pegasus_supplies_last_sync';

    const defaultSupplies = [
        { id: 'yog', label: 'Γιαούρτι', amount: 1000, unit: 'g', portion: 250, refill: 1000, icon: '🥣' },
        { id: 'ban', label: 'Μπανάνες', amount: 5, unit: 'τεμ', portion: 1, refill: 5, icon: '🍌' },
        { id: 'amyg', label: 'Αμύγδαλα', amount: 500, unit: 'g', portion: 30, refill: 500, icon: '🥜' },
        { id: 'honey', label: 'Μέλι', amount: 1000, unit: 'g', portion: 20, refill: 1000, icon: '🍯' },
        { id: 'eggs', label: 'Αυγά', amount: 30, unit: 'τεμ', portion: 3, refill: 30, icon: '🥚' }
    ];

    window.PegasusSupplies = {
        // 🚀 ΑΥΤΟΜΑΤΗ ΑΦΑΙΡΕΣΗ ΒΑΣΕΙ ΗΜΕΡΟΜΗΝΙΑΣ
        checkAndAutomate: function() {
            const now = new Date();
            const todayStr = now.toDateString(); // π.χ. "Tue Apr 14 2026"
            const lastSync = localStorage.getItem(LAST_AUTO_SYNC_KEY);

            if (lastSync === todayStr) return; // Ήδη ενημερωμένο για σήμερα

            let supplies = JSON.parse(localStorage.getItem(SUPPLIES_DATA_KEY)) || defaultSupplies;
            
            // Υπολογισμός ημερών που μεσολάβησαν (σε περίπτωση που δεν άνοιξες το app για μέρες)
            let daysDiff = 1;
            if (lastSync) {
                const lastDate = new Date(lastSync);
                const timeDiff = now.getTime() - lastDate.getTime();
                daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
            }

            if (daysDiff > 0) {
                console.log(`⚡ PEGASUS AUTO-INVENTORY: Αφαίρεση αποθεμάτων για ${daysDiff} ημέρες.`);
                supplies = supplies.map(item => {
                    const totalConsumption = item.portion * daysDiff;
                    return {
                        ...item,
                        amount: Math.max(0, item.amount - totalConsumption)
                    };
                });

                localStorage.setItem(LAST_AUTO_SYNC_KEY, todayStr);
                this.saveAndRender(supplies);
            }
        },

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
            const newVal = prompt(`Ενημέρωση αποθέματος για: ${supplies[idx].label}`, supplies[idx].amount);
            if (newVal !== null && !isNaN(newVal) && newVal.trim() !== '') {
                supplies[idx].amount = parseFloat(newVal);
                this.saveAndRender(supplies);
            }
        },

        deleteItem: function(id) {
            if(confirm('Διαγραφή;')) {
                let supplies = JSON.parse(localStorage.getItem(SUPPLIES_DATA_KEY)) || defaultSupplies;
                supplies = supplies.filter(i => i.id !== id);
                this.saveAndRender(supplies);
            }
        },

        toggleAddForm: function() {
            const form = document.getElementById('addSupplyForm');
            form.style.display = (form.style.display === 'none') ? 'block' : 'none';
        },

        addNewItem: function() {
            const icon = document.getElementById('newIcon').value || '📦';
            const label = document.getElementById('newLabel').value;
            const unit = document.getElementById('newUnit').value || 'τεμ';
            const refill = parseFloat(document.getElementById('newRefill').value);
            const portion = parseFloat(document.getElementById('newPortion').value);

            if(!label || isNaN(refill) || isNaN(portion)) return;

            let supplies = JSON.parse(localStorage.getItem(SUPPLIES_DATA_KEY)) || defaultSupplies;
            supplies.push({ id: 'sup_' + Date.now(), label, amount: refill, unit, portion, refill, icon });
            this.saveAndRender(supplies);
            this.toggleAddForm();
        },

        saveAndRender: function(data) {
            localStorage.setItem(SUPPLIES_DATA_KEY, JSON.stringify(data));
            if (typeof window.renderSuppliesContent === 'function') window.renderSuppliesContent();
            if (window.PegasusCloud?.push) window.PegasusCloud.push();
        }
    };

    function injectViewLayer() {
        if (document.getElementById('supplies')) return;
        const viewDiv = document.createElement('div');
        viewDiv.id = 'supplies';
        viewDiv.className = 'view';
        viewDiv.innerHTML = `
            <button class="btn-back" onclick="openView('home')">◀ ΕΠΙΣΤΡΟΦΗ</button>
            <button id="btnAddSupply" class="primary-btn" onclick="window.PegasusSupplies.toggleAddForm()">+ ΝΕΟ ΠΡΟΪΟΝ</button>
            <div id="addSupplyForm" class="mini-card" style="display: none; padding: 15px;">
                <input type="text" id="newIcon" placeholder="🥛">
                <input type="text" id="newLabel" placeholder="Όνομα">
                <input type="number" id="newRefill" placeholder="Σύνολο Αγοράς">
                <input type="text" id="newUnit" placeholder="Μονάδα">
                <input type="number" id="newPortion" placeholder="Ημερήσια Δόση">
                <button class="primary-btn" onclick="window.PegasusSupplies.addNewItem()">ΑΠΟΘΗΚΕΥΣΗ</button>
            </div>
            <div id="supplies-content" style="padding-bottom: 80px;"></div>
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
                <div class="mini-card" style="border-left: 4px solid ${statusColor};">
                    <div style="display:flex; justify-content:space-between;">
                        <div>
                            <div style="font-weight:900;">${item.icon} ${item.label}</div>
                            <div style="font-size:11px;">ΑΠΟΘΕΜΑ: ${item.amount}${item.unit}</div>
                        </div>
                        <button onclick="window.PegasusSupplies.deleteItem('${item.id}')">🗑️</button>
                    </div>
                    <div class="bar-bg"><div class="bar-fill" style="width:${Math.min(pct, 100)}%; background:${statusColor};"></div></div>
                    <div style="display:flex; gap:5px; margin-top:10px;">
                        <button class="secondary-btn" onclick="window.PegasusSupplies.updateAmount('${item.id}', 'consume')">-${item.portion}</button>
                        <button class="primary-btn" onclick="window.PegasusSupplies.updateAmount('${item.id}', 'refill')">REFILL</button>
                    </div>
                </div>`;
        }).join('');
    };

    document.addEventListener("DOMContentLoaded", () => {
        injectViewLayer();
        window.PegasusSupplies.checkAndAutomate(); // 🟢 ΕΝΕΡΓΟΠΟΙΗΣΗ ΑΥΤΟΜΑΤΙΣΜΟΥ
        window.renderSuppliesContent();
        if (window.registerPegasusModule) {
            window.registerPegasusModule({ id: 'supplies', label: 'Αποθέματα', icon: '📦' });
        }
    });
})();
