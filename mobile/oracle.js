/* ==========================================================================
   🧠 PEGASUS MODULE: ORACLE (v1.5 - COMPACT TRI-COLOR)
   Protocol: Minimalist Layout, Zero-Header, Condition-Driven Colors
   ========================================================================== */

(function() {
    window.PegasusOracle = {
        analyzeData: function() {
            let results = [];
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;

            // 🟢 ΠΡΑΣΙΝΟ: Αποθεραπεία & Στόχοι
            const bio = JSON.parse(localStorage.getItem('pegasus_biometrics_v1')) || [];
            const missions = JSON.parse(localStorage.getItem('pegasus_missions_v1')) || [];
            
            let sleep = 0; if (bio.length > 0) sleep = bio[0].sleep;
            let completed = missions.filter(m => m.completed).length;
            let pct = missions.length > 0 ? (completed / missions.length) * 100 : 0;

            if (sleep >= 9) {
                results.push({ color: '#00ff41', icon: '🟢', txt: `Εξαιρετική ανάρρωση (Ύπνος ${sleep}/10). Είσαι έτοιμος για προπόνηση!` });
            } else if (pct >= 80) {
                results.push({ color: '#00ff41', icon: '🟢', txt: `Υψηλή πειθαρχία: ${Math.round(pct)}% των στόχων ολοκληρώθηκαν.` });
            }

            // 🟡/🟠 ΠΟΡΤΟΚΑΛΙ: Οριακά Αποθέματα (1 δόση)
            const supplies = JSON.parse(localStorage.getItem('pegasus_supplies_v1')) || [];
            let stockAlerts = [];
            supplies.forEach(s => {
                const rem = s.amount / s.portion;
                if (rem > 0 && rem <= 1.1) stockAlerts.push(`1 δόση ${s.label}`);
            });

            if (stockAlerts.length > 0) {
                results.push({ color: '#ffbb33', icon: '🟠', txt: `Οριακό: ${stockAlerts.join(", ")}` });
            }

            // 🔴 ΚΟΚΚΙΝΟ: Κρίσιμα & Ελλείψεις
            let criticalAlerts = [];
            supplies.forEach(s => { if (s.amount / s.portion <= 0) criticalAlerts.push(s.label); });
            
            const maint = JSON.parse(localStorage.getItem('pegasus_maintenance_v1')) || [];
            maint.forEach(t => {
                const diff = Math.ceil(((t.lastDone + (t.interval * oneDay)) - now) / oneDay);
                if (diff < 0) criticalAlerts.push(`Λήξη: ${t.label}`);
            });

            if (criticalAlerts.length > 0) {
                results.push({ color: '#ff4444', icon: '🔴', txt: criticalAlerts.join(" | ") });
            } else {
                results.push({ color: '#ff4444', icon: '🔴', txt: "Καμία κρίσιμη προειδοποίηση" });
            }

            return results;
        },

        injectDashboard: function() {
            const grid = document.getElementById('dynamic-grid');
            if (!grid || (window.PegasusMobileUI && window.PegasusMobileUI.currentPage !== 0)) return;

            const existing = document.getElementById('oracle-dashboard');
            if (existing) existing.remove();

            const insights = this.analyzeData();
            const dashboard = document.createElement('div');
            dashboard.id = 'oracle-dashboard';
            
            dashboard.style.cssText = `
                grid-column: 1 / -1; 
                background: rgba(10,10,10,0.8);
                border: 1px solid #222;
                border-radius: 12px;
                padding: 10px 15px;
                margin-bottom: 10px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            `;

            dashboard.innerHTML = insights.map(item => `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 12px;">${item.icon}</span>
                    <span style="font-size: 11px; color: ${item.color}; font-weight: 700; line-height: 1.2; text-align: left;">
                        ${item.txt.toUpperCase()}
                    </span>
                </div>
            `).join('');

            grid.insertBefore(dashboard, grid.firstChild);
        }
    };

    document.addEventListener("DOMContentLoaded", () => {
        if (window.PegasusMobileUI) {
            const originalRender = window.PegasusMobileUI.render;
            window.PegasusMobileUI.render = function() {
                originalRender.apply(this, arguments);
                setTimeout(() => window.PegasusOracle.injectDashboard(), 50);
            };
            setTimeout(() => window.PegasusOracle.injectDashboard(), 100);
        }
    });
})();
