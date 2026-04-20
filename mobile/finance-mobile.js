/* ==========================================================================
   💰 PEGASUS MODULE: FINANCIAL TRACKER (v1.4)
   Protocol: High-Contrast UI, Memory Protection, Double-Tap & NaN Guards
   Status: FINAL STABLE | SYSTEM LOCKED
   ========================================================================== */

(function() {
    const FINANCE_DATA_KEY = 'pegasus_finance_v1';

    function injectViewLayer() {
        if (document.getElementById('finance')) return;

        const viewDiv = document.createElement('div');
        viewDiv.id = 'finance';
        viewDiv.className = 'view';
        viewDiv.innerHTML = `
            <button class="btn-back" onclick="openView('home')">◀ ΕΠΙΣΤΡΟΦΗ</button>
            <div class="section-title">ΟΙΚΟΝΟΜΙΚΗ ΔΙΑΧΕΙΡΙΣΗ</div>
            
            <div class="mini-card" style="border-left: 4px solid var(--main); margin-bottom: 20px; background: rgba(0,255,65,0.05);">
                <span class="mini-label" style="color: var(--main); opacity: 1;">ΤΡΕΧΟΝ ΥΠΟΛΟΙΠΟ</span>
                <div id="totalBalance" class="mini-val" style="font-size: 36px; text-shadow: 0 0 15px rgba(0,255,65,0.3);">0.00€</div>
            </div>

            <div class="mini-card" style="background: rgba(15,15,15,0.95); padding: 20px; border: 1px solid #333;">
                <div style="margin-bottom: 15px;">
                    <div style="font-size: 10px; color: #777; font-weight: 800; margin-bottom: 5px; letter-spacing: 1px;">ΠΕΡΙΓΡΑΦΗ ΣΥΝΑΛΛΑΓΗΣ</div>
                    <input type="text" id="finDesc" placeholder="π.χ. Σούπερ Μάρκετ" style="opacity: 1; border: 2px solid #444; color: #fff; background: #000;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <div style="font-size: 10px; color: #777; font-weight: 800; margin-bottom: 5px; letter-spacing: 1px;">ΠΟΣΟ ΣΕ ΕΥΡΩ (€)</div>
                    <input type="number" id="finAmount" placeholder="0.00" inputmode="decimal" style="opacity: 1; border: 2px solid #444; color: #fff; background: #000; font-size: 20px; font-weight: 900;">
                </div>

                <div class="compact-grid" style="gap: 15px;">
                    <button class="primary-btn" onclick="window.PegasusFinance.addTransaction('income')" 
                        style="background: #008f25; border: 2px solid #00ff41; color: #fff; font-weight: 900; height: 55px; opacity: 1; box-shadow: 0 4px 15px rgba(0,255,65,0.2);">
                        + ΕΣΟΔΟ
                    </button>
                    <button class="primary-btn" onclick="window.PegasusFinance.addTransaction('expense')" 
                        style="background: #8f0000; border: 2px solid #ff4444; color: #fff; font-weight: 900; height: 55px; opacity: 1; box-shadow: 0 4px 15px rgba(255,68,68,0.2);">
                        - ΕΞΟΔΟ
                    </button>
                </div>
            </div>

            <div class="section-title" style="margin-top: 30px; font-size: 12px; color: #555;">ΙΣΤΟΡΙΚΟ ΣΥΝΑΛΛΑΓΩΝ</div>
            <div id="transaction-history" style="width: 100%; display: flex; flex-direction: column; gap: 10px; padding-bottom: 100px;"></div>
        `;
        document.body.appendChild(viewDiv);
    }

    window.PegasusFinance = {
        isLocked: false, // 🛡️ API SPAM GUARD (Double-Tap Protection)

        saveAndRender: function(data) {
            // 🛡️ MEMORY CAP: Κρατάμε τις τελευταίες 100 συναλλαγές (Αποτροπή QuotaExceededError)
            if (Array.isArray(data)) {
                data = data.slice(0, 100);
            }

            // Τοπική αποθήκευση
            localStorage.setItem(FINANCE_DATA_KEY, JSON.stringify(data));
            
            // Ανανέωση UI
            this.render();

            // ☁️ REAL-TIME CLOUD TRIGGER (Bypass debounce)
            if (window.PegasusCloud && typeof window.PegasusCloud.push === 'function') {
                window.PegasusCloud.push(true); 
            }
        },

        addTransaction: function(type) {
            // 🛡️ RACE CONDITION GUARD: Μπλοκάρει τα πολλαπλά γρήγορα κλικ
            if (this.isLocked) return;
            this.isLocked = true;
            setTimeout(() => this.isLocked = false, 1200); // Ξεκλειδώνει μετά από 1.2s

            const descInput = document.getElementById('finDesc');
            const amountInput = document.getElementById('finAmount');
            
            const desc = descInput.value;
            
            // 🛡️ NaN GUARD: Μετατροπή κόμματος σε τελεία πριν την ανάλυση
            const safeAmountStr = String(amountInput.value).replace(',', '.');
            const amount = parseFloat(safeAmountStr);

            if (!desc || isNaN(amount) || amount <= 0) {
                alert("ΣΦΑΛΜΑ: Συμπληρώστε έγκυρη περιγραφή και ποσό.");
                this.isLocked = false; // Απελευθέρωση κλειδώματος σε περίπτωση σφάλματος
                return;
            }

            const transactions = (window.PegasusMobileSafe?.safeReadStorage(FINANCE_DATA_KEY, [], { repairOnFailure: true })) || [];
            const newEntry = {
                id: Date.now(),
                date: new Date().toLocaleDateString('el-GR'),
                desc: desc.trim(),
                amount: type === 'expense' ? -amount : amount
            };

            transactions.unshift(newEntry);
            
            descInput.value = '';
            amountInput.value = '';
            
            this.saveAndRender(transactions);
        },

        deleteTransaction: function(id) {
            if(confirm('Οριστική διαγραφή συναλλαγής;')) {
                let transactions = (window.PegasusMobileSafe?.safeReadStorage(FINANCE_DATA_KEY, [], { repairOnFailure: true })) || [];
                transactions = transactions.filter(t => t.id !== id);
                this.saveAndRender(transactions);
            }
        },

        render: function() {
            const historyContainer = document.getElementById('transaction-history');
            const balanceDisplay = document.getElementById('totalBalance');
            if (!historyContainer) return;

            const transactions = (window.PegasusMobileSafe?.safeReadStorage(FINANCE_DATA_KEY, [], { repairOnFailure: true })) || [];
            let total = 0;
            let html = '';

            transactions.forEach(t => {
                total += t.amount;
                const color = t.amount > 0 ? '#00ff41' : '#ff4444';
                const sign = t.amount > 0 ? '+' : '';
                
                html += `
                    <div class="mini-card" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-color: #222; background: rgba(20,20,20,0.8);">
                        <div style="flex: 1; text-align: left;">
                            <div style="font-size: 14px; font-weight: 900; color: #fff; margin-bottom: 2px;">${(window.PegasusMobileSafe?.escapeHtml || (v => String(v ?? "")))(t.desc)}</div>
                            <div style="font-size: 9px; color: #555; font-weight: 800; letter-spacing: 1px;">${(window.PegasusMobileSafe?.escapeHtml || (v => String(v ?? "")))(t.date)}</div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="font-weight: 900; color: ${color}; font-size: 16px;">${sign}${t.amount.toFixed(2)}€</div>
                            <button onclick="window.PegasusFinance.deleteTransaction(${t.id})" 
                                    style="background: rgba(255,68,68,0.1); border: 1px solid #ff4444; color: #ff4444; border-radius: 8px; padding: 8px; font-size: 14px; cursor: pointer;">
                                🗑️
                            </button>
                        </div>
                    </div>
                `;
            });

            balanceDisplay.textContent = total.toFixed(2) + '€';
            balanceDisplay.style.color = total >= 0 ? '#00ff41' : '#ff4444';
            historyContainer.innerHTML = html || '<div style="color:#333; font-size:11px; text-align:center; margin-top:20px;">ΚΑΜΙΑ ΚΑΤΑΓΡΑΦΗ</div>';
        }
    };

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
