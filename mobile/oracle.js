/* ==========================================================================
   🧠 PEGASUS MODULE: ORACLE (v1.7 - SMART GROUPING PROTOCOL)
   Protocol: Plural/Singular Logic, Vertical Ellipsis, Maintenance Sync
   ========================================================================== */

(function() {
    window.PegasusOracle = {
        analyzeData: function() {
            let lines = [];
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;

            // 🟢 1. ΥΠΝΟΣ & ΣΤΟΧΟΙ (Bio & Missions)
            const bio = JSON.parse(localStorage.getItem('pegasus_biometrics_v1')) || [];
            const missions = JSON.parse(localStorage.getItem('pegasus_missions_v1')) || [];
            
            let sleep = 0; if (bio.length > 0) sleep = bio[0].sleep;
            let completed = missions.filter(m => m.completed).length;
            let total = missions.length;
            let pct = total > 0 ? (completed / total) * 100 : 0;

            if (sleep >= 9) {
                lines.push({ color: '#00ff41', icon: '🟢', txt: `ΕΞΑΙΡΕΤΙΚΗ ΑΝΑΡΡΩΣΗ (ΥΠΝΟΣ ${sleep}/10). ΕΤΟΙΜΟΣ ΓΙΑ ΠΡΟΠΟΝΗΣΗ!` });
            } else if (pct >= 80) {
                lines.push({ color: '#00ff41', icon: '🟢', txt: `ΥΨΗΛΗ ΠΕΙΘΑΡΧΙΑ ΣΤΟΧΩΝ: ${Math.round(pct)}% ΟΛΟΚΛΗΡΩΜΕΝΟΙ` });
            }

            // 🔴/🟠 2. ΑΠΟΘΕΜΑΤΑ (Supplies)
            const supplies = JSON.parse(localStorage.getItem('pegasus_supplies_v1')) || [];
            let depleted = [];
            let low = [];
            
            supplies.forEach(s => {
                const rem = s.amount / s.portion;
                if (rem <= 0) depleted.push(s.label);
                else if (rem > 0 && rem <= 1.1) low.push(s.label);
            });

            if (depleted.length === 1) {
                lines.push({ color: '#ff4444', icon: '🔴', txt: `ΕΞΑΝΤΛΗΘΗΚΕ: ${depleted[0]}` });
            } else if (depleted.length > 1) {
                lines.push({ color: '#ff4444', icon: '🔴', txt: `ΕΞΑΝΤΛΗΘΗΚΑΝ: ${depleted.join(', ')}` });
            }

            if (low.length > 0) {
                lines.push({ color: '#ffbb33', icon: '🟠', txt: `ΟΡΙΑΚΑ (1 ΔΟΣΗ): ${low.join(', ')}` });
            }

            // 🔴/🟡 3. ΡΟΥΤΙΝΑ ΕΡΓΑΣΙΩΝ (Maintenance)
            const maint = JSON.parse(localStorage.getItem('pegasus_maintenance_v1')) || [];
            let overdue = [];
            let todayMaint = [];
            
            maint.forEach(t => {
                const diff = Math.ceil(((t.lastDone + (t.interval * oneDay)) - now) / oneDay);
                if (diff < 0) overdue.push(t.label);
                else if (diff === 0) todayMaint.push(t.label);
            });

            if (overdue.length === 1) {
                lines.push({ color: '#ff4444', icon: '🔴', txt: `ΕΚΤΟΣ ΧΡΟΝΟΥ ΕΡΓΑΣΙΑ: ${overdue[0]}` });
            } else if (overdue.length > 1) {
                lines.push({ color: '#ff4444', icon: '🔴', txt: `ΕΚΤΟΣ ΧΡΟΝΟΥ ΕΡΓΑΣΙΕΣ: ${overdue.join(', ')}` });
            }

            if (todayMaint.length > 0) {
                lines.push({ color: '#ffbb33', icon: '🟡', txt: `ΕΡΓΑΣΙΕΣ ΣΗΜΕΡΑ: ${todayMaint.join(', ')}` });
            }

            // 🟢 FALLBACK: Αν δεν υπάρχει τίποτα να δείξει
            if (lines.length === 0) {
                lines.push({ color: '#00ff41', icon: '🟢', txt: `ΟΛΑ ΤΑ ΣΥΣΤΗΜΑΤΑ ΛΕΙΤΟΥΡΓΟΥΝ ΚΑΝΟΝΙΚΑ` });
            }

            return lines;
        },

        injectDashboard: function() {
            const grid = document.getElementById('dynamic-grid');
            if (!grid || (window.PegasusMobileUI && window.PegasusMobileUI.currentPage !== 0)) return;

            const existing = document.getElementById('oracle-dashboard');
            if (existing) existing.remove();

            const insights = this.analyzeData();
            const dashboard = document.createElement('div');
            dashboard.id = 'oracle-dashboard';
            
            // 📐 COMPACT STACK STYLE WITH TEXT-OVERFLOW
            dashboard.style.cssText = `
                grid-column: 1 / -1; 
                background: rgba(10,10,10,0.85);
                border: 1px solid #222;
                border-radius: 12px;
                padding: 10px 12px;
                margin-bottom: 8px;
                display: flex;
                flex-direction: column;
                gap: 6px;
                justify-content: center;
                box-sizing: border-box;
            `;

            dashboard.innerHTML = insights.map(item => `
                <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
                    <span style="font-size: 11px; flex-shrink: 0;">${item.icon}</span>
                    <span style="font-size: 10px; color: ${item.color}; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: 0.5px;">
                        ${item.txt}
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
