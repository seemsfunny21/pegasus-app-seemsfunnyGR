/* ==========================================================================
   💰 PEGASUS MODULE: FINANCIAL TRACKER (v1.0)
   Protocol: Transaction Ledger & Balance Analytics
   ========================================================================== */

(function() {
    const FINANCE_DATA_KEY = 'pegasus_finance_v1';

    // 1. Αρχικοποίηση Οθόνης (View Injector)
    function injectViewLayer() {
        if (document.getElementById('finance')) return;

        const viewDiv = document.createElement('div');
        viewDiv.id = 'finance';
        viewDiv.className = 'view';
        viewDiv.innerHTML = `
            <button class="btn-back" onclick="openView('home')">◀ ΕΠΙΣΤΡΟΦΗ</button>
            <div class="section-title">ΟΙΚΟΝΟΜΙΚΗ ΔΙΑΧΕΙΡΙΣΗ</div>
            
            <div class="mini-card" style="border-left: 4px solid var(--main); margin-bottom: 20px;">
                <span class="mini-label">ΤΡΕΧΟΝ ΥΠΟΛΟΙΠΟ</span>
                <div id="totalBalance" class="mini-val" style="font-size: 32px;">0.00€</div>
            </div>

            <div class="mini-card" style="background: rgba(255,255,255,0.02); padding: 20px;">
                <input type="text" id="finDesc" placeholder="Περιγραφή (π.χ. Σούπερ Μάρκετ)">
                <input type="number" id="finAmount" placeholder="Ποσό (€)" inputmode="decimal">
                <div class="compact-grid" style="margin-top: 10px;">
                    <button class="primary-btn" onclick="window.PegasusFinance.addTransaction('income')" style="background: #00ff4133; border-color: #00ff41;">+ ΕΣΟΔΟ</button>
                    <button class="primary-btn" onclick="window.PegasusFinance.addTransaction('expense')" style="background: #ff444433; border-color: #ff4444;">- ΕΞΟΔΟ</button>
                </div>
            </div>

            <div class="section-title" style="margin-top: 30px; font-size: 12px; color: #555;">ΠΡΟΣΦΑΤΕΣ ΣΥΝΑΛΛΑΓΕΣ</div>
            <div id="transaction-history" style="width: 100%; display: flex; flex-direction: column; gap: 8px;"></div>
        `;
        document.body.appendChild(viewDiv);
    }

    // 2. Μηχανή Συναλλαγών
    window.PegasusFinance = {
        addTransaction: function(type) {
            const desc = document.getElementById('finDesc').value;
            const amount = parseFloat(document.getElementById('finAmount').value);

            if (!desc || isNaN(amount)) {
                alert("Σφάλμα: Εισάγετε έγκυρα δεδομένα.");
                return;
            }

            const transactions = JSON.parse(localStorage.getItem(FINANCE_DATA_KEY)) || [];
            const newEntry = {
                id: Date.now(),
                date: new Date().toLocaleDateString('el-GR'),
                desc: desc,
                amount: type === 'expense' ? -amount : amount,
                type: type
            };

            transactions.unshift(newEntry);
            localStorage.setItem(FINANCE_DATA_KEY, JSON.stringify(transactions.slice(0, 50))); // Κρατάμε τις τελευταίες 50
            
            document.getElementById('finDesc').value = '';
            document.getElementById('finAmount').value = '';
            this.render();
        },

        render: function() {
            const historyContainer = document.getElementById('transaction-history');
            const balanceDisplay = document.getElementById('totalBalance');
            if (!historyContainer) return;

            const transactions = JSON.parse(localStorage.getItem(FINANCE_DATA_KEY)) || [];
            let total = 0;
            let html = '';

            transactions.forEach(t => {
                total += t.amount;
                const color = t.amount > 0 ? '#00ff41' : '#ff4444';
                const sign = t.amount > 0 ? '+' : '';
                
                html += `
                    <div class="mini-card" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; border-color: #1a1a1a;">
                        <div style="text-align: left;">
                            <div style="font-size: 13px; font-weight: 800; color: #fff;">${t.desc}</div>
                            <div style="font-size: 9px; color: #555;">${t.date}</div>
                        </div>
                        <div style="font-weight: 900; color: ${color};">${sign}${t.amount.toFixed(2)}€</div>
                    </div>
                `;
            });

            balanceDisplay.textContent = total.toFixed(2) + '€';
            balanceDisplay.style.color = total >= 0 ? '#00ff41' : '#ff4444';
            historyContainer.innerHTML = html || '<div style="color:#333; font-size:11px; text-align:center; margin-top:20px;">ΚΑΜΙΑ ΣΥΝΑΛΛΑΓΗ</div>';
        }
    };

    // 3. Boot Sequence
    document.addEventListener("DOMContentLoaded", () => {
        injectViewLayer();
        window.PegasusFinance.render();

        if (window.registerPegasusModule) {
            window.registerPegasusModule({
                id: 'finance',
                label: 'Οικονομικά',
                icon: '💰'
            });
        }
    });
})();
