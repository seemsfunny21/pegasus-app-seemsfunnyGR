/* ==========================================================================
   🧠 PEGASUS MODULE: ORACLE (v1.6 - HYBRID STABLE DIMENSIONS)
   Protocol: Single-Line Horizontal, Auto-Scale Font, Multi-JS Data Fetch
   ========================================================================== */

(function() {
    window.PegasusOracle = {
        analyzeData: function() {
            let alerts = [];
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;

            // 1. DATA FETCH: ΑΠΟΘΕΜΑΤΑ (Supplies Logic)
            const supplies = JSON.parse(localStorage.getItem('pegasus_supplies_v1')) || [];
            supplies.forEach(s => {
                const rem = s.amount / s.portion;
                if (rem > 0 && rem <= 1.1) {
                    alerts.push({ color: '#ffbb33', icon: '🟠', txt: `1 ΔΟΣΗ ${s.label}` });
                } else if (rem <= 0) {
                    alerts.push({ color: '#ff4444', icon: '🔴', txt: `ΕΞΑΝΤΛΗΘΗΚΕ: ${s.label}` });
                }
            });

            // 2. DATA FETCH: ΣΥΝΤΗΡΗΣΗ (Maintenance Logic)
            const maint = JSON.parse(localStorage.getItem('pegasus_maintenance_v1')) || [];
            maint.forEach(t => {
                const diff = Math.ceil(((t.lastDone + (t.interval * oneDay)) - now) / oneDay);
                if (diff < 0) alerts.push({ color: '#ff4444', icon: '🔴', txt: `ΛΗΞΗ: ${t.label}` });
                else if (diff === 0) alerts.push({ color: '#ffbb33', icon: '🟡', txt: `ΣΗΜΕΡΑ: ${t.label}` });
            });

            // 3. DATA FETCH: ΥΠΝΟΣ & ΣΤΟΧΟΙ (Bio & Missions Logic)
            const bio = JSON.parse(localStorage.getItem('pegasus_biometrics_v1')) || [];
            const missions = JSON.parse(localStorage.getItem('pegasus_missions_v1')) || [];
            
            let sleep = 0; if (bio.length > 0) sleep = bio[0].sleep;
            let completed = missions.filter(m => m.completed).length;
            let total = missions.length;
            let pct = total > 0 ? (completed / total) * 100 : 0;

            if (sleep >= 9) {
                alerts.push({ color: '#00ff41', icon: '🟢', txt: `ΥΠΝΟΣ ${sleep}/10 - READY` });
            } else if (pct >= 80) {
                alerts.push({ color: '#00ff41', icon: '🟢', txt: `ΣΤΟΧΟΙ: ${Math.round(pct)}%` });
            }

            // Fallback αν δεν υπάρχει τίποτα κρίσιμο
            if (alerts.length === 0) {
                alerts.push({ color: '#ff4444', icon: '🔴', txt: "ΚΑΜΙΑ ΚΡΙΣΙΜΗ ΠΡΟΕΙΔΟΠΟΙΗΣΗ" });
            }

            return alerts;
        },

        injectDashboard: function() {
            const grid = document.getElementById('dynamic-grid');
            if (!grid || (window.PegasusMobileUI && window.PegasusMobileUI.currentPage !== 0)) return;

            const existing = document.getElementById('oracle-dashboard');
            if (existing) existing.remove();

            const insights = this.analyzeData();
            const dashboard = document.createElement('div');
            dashboard.id = 'oracle-dashboard';
            
            // 📐 STABLE DIMENSIONS STYLE
            dashboard.style.cssText = `
                grid-column: 1 / -1; 
                background: rgba(10,10,10,0.9);
                border: 1px solid #222;
                border-radius: 12px;
                height: 45px; 
                padding: 0 10px;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden; 
                box-sizing: border-box;
            `;

            // ⚡ AUTO-FONT SCALE CALCULATION
            // Όσο περισσότερες οι πληροφορίες, τόσο μικραίνει το font για να χωρέσει σε μία γραμμή
            let baseFontSize = 11;
            const totalChars = insights.reduce((sum, item) => sum + item.txt.length, 0);
            if (totalChars > 40) baseFontSize = 9;
            if (totalChars > 60) baseFontSize = 8;

            dashboard.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; width: 100%; justify-content: center; white-space: nowrap;">
                    ${insights.map(item => `
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <span style="font-size: 12px;">${item.icon}</span>
                            <span style="font-size: ${baseFontSize}px; color: ${item.color}; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase;">
                                ${item.txt}
                            </span>
                        </div>
                    `).join('<span style="color: #333; font-weight: 900;">|</span>')}
                </div>
            `;

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
