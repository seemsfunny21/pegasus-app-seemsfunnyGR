/* ==========================================================================
   🧠 PEGASUS MODULE: ORACLE (EXECUTIVE BRIEFING - v1.4 SLIM)
   Protocol: Compact Symmetry, Zero-Scroll Logic & Tri-State Sync
   ========================================================================== */

(function() {
    window.PegasusOracle = {
        analyzeData: function() {
            let msgGood = "Συστήματα Nominal.", msgBad = "", msgAction = "";
            let hasGood = true, hasBad = false, hasAction = false;

            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;

            // --- 1. SMART INVENTORY ---
            const supplies = JSON.parse(localStorage.getItem('pegasus_supplies_v1')) || [];
            let actions = [];
            supplies.forEach(s => {
                const rem = s.amount / s.portion;
                if (rem <= 1.1) actions.push(`🔴 ${s.label}`);
                else if (rem <= 3.1) actions.push(`🟡 ${s.label}`);
            });

            const maint = JSON.parse(localStorage.getItem('pegasus_maintenance_v1')) || [];
            maint.forEach(t => {
                const diff = Math.ceil(((t.lastDone + (t.interval * oneDay)) - now) / oneDay);
                if (diff < 0) actions.push(`🔴 ${t.label}`);
                else if (diff === 0) actions.push(`🟡 ${t.label}`);
            });

            if (actions.length > 0) {
                msgAction = actions.join(" | ");
                hasAction = true;
            }

            // --- 2. BIO & MISSIONS ---
            const bio = JSON.parse(localStorage.getItem('pegasus_biometrics_v1')) || [];
            const missions = JSON.parse(localStorage.getItem('pegasus_missions_v1')) || [];
            
            let energy = 10; if (bio.length > 0) energy = bio[0].energy;
            if (energy < 5) { msgBad = `🔴 Ενέργεια: ${energy}/10`; hasBad = true; }

            let completed = missions.filter(m => m.completed).length;
            let pct = missions.length > 0 ? (completed / missions.length) * 100 : 0;
            if (pct >= 80) msgGood = `🟢 Στόχοι: ${Math.round(pct)}%`;

            return { good: msgGood, hasGood, bad: msgBad, hasBad, action: msgAction, hasAction };
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
                background: rgba(10,10,10,0.9);
                border: 1px solid var(--main);
                border-radius: 12px;
                padding: 10px;
                margin-bottom: 8px;
                display: flex;
                flex-direction: column;
                gap: 6px;
                align-items: center;
                justify-content: center;
            `;

            let html = `
                <div style="font-size: 8px; color: var(--main); font-weight: 900; letter-spacing: 2px; opacity: 0.7; margin-bottom: 2px;">
                    — EXECUTIVE BRIEFING —
                </div>
            `;

            // 🟢 Καλή κατάσταση (Πάντα κεντραρισμένο)
            html += `<div style="font-size: 11px; font-weight: 700; color: #fff;">${insights.good}</div>`;

            // 🟡/🔴 Ειδοποιήσεις (Μόνο αν υπάρχουν, για οικονομία χώρου)
            if (insights.hasAction) {
                html += `<div style="font-size: 10px; color: #ffbb33; font-weight: 800; border-top: 1px solid #222; padding-top: 4px; width: 100%; text-align: center;">${insights.action}</div>`;
            }

            if (insights.hasBad) {
                html += `<div style="font-size: 10px; color: #ff4444; font-weight: 900; width: 100%; text-align: center;">${insights.bad}</div>`;
            }

            dashboard.innerHTML = html;
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
