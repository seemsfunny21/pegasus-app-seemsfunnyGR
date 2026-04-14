/* ==========================================================================
   🧠 PEGASUS MODULE: ORACLE (EXECUTIVE BRIEFING - v1.3 SYMMETRY)
   Protocol: Centered UI, Tri-State Alerts & Smart Portions
   ========================================================================== */

(function() {
    window.PegasusOracle = {
        analyzeData: function() {
            let msgGood = "Όλα τα συστήματα λειτουργούν φυσιολογικά.";
            let msgBad = "Καμία κρίσιμη προειδοποίηση.";
            let msgAction = "Κανένα άμεσο καθήκον.";

            let hasGood = false, hasBad = false, hasAction = false;
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;

            // --- 1. SMART INVENTORY ANALYSIS ---
            const supplies = JSON.parse(localStorage.getItem('pegasus_supplies_v1')) || [];
            let actionItems = [];
            
            supplies.forEach(s => {
                const rem = s.amount / s.portion;
                if (rem <= 1.1) {
                    actionItems.push(`🔴 ΟΡΙΑΚΟ: ${s.label}`); // Κρίσιμο (1 δόση)
                } else if (rem <= 3.1) {
                    actionItems.push(`🟡 ΧΑΜΗΛΟ: ${s.label}`); // Ενδιάμεσο (2-3 δόσεις)
                }
            });

            const maint = JSON.parse(localStorage.getItem('pegasus_maintenance_v1')) || [];
            maint.forEach(t => {
                const diff = Math.ceil(((t.lastDone + (t.interval * oneDay)) - now) / oneDay);
                if (diff < 0) actionItems.push(`🔴 ΛΗΓΜΕΝΟ: ${t.label}`);
                else if (diff === 0) actionItems.push(`🟡 ΣΗΜΕΡΑ: ${t.label}`);
            });

            if (actionItems.length > 0) {
                msgAction = actionItems.join(" | ");
                hasAction = true;
            }

            // --- 2. BIO & FINANCE ---
            const bio = JSON.parse(localStorage.getItem('pegasus_biometrics_v1')) || [];
            let energy = 10; if (bio.length > 0) energy = bio[0].energy;
            
            if (energy < 5) {
                msgBad = `Χαμηλή ενέργεια (${energy}/10). Προτεραιότητα στην αποθεραπεία.`;
                hasBad = true;
            }

            // --- 3. MISSIONS ---
            const missions = JSON.parse(localStorage.getItem('pegasus_missions_v1')) || [];
            let completed = missions.filter(m => m.completed).length;
            let pct = missions.length > 0 ? (completed / missions.length) * 100 : 0;

            if (pct >= 80) {
                msgGood = `Άριστη πειθαρχία (${Math.round(pct)}% Στόχοι). Βέλτιστη ημέρα!`;
                hasGood = true;
            }

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
                background: linear-gradient(145deg, rgba(15,15,15,0.98) 0%, rgba(5,5,5,1) 100%);
                border: 1px solid var(--main);
                border-radius: 20px;
                padding: 18px 10px;
                margin-bottom: 10px;
                box-shadow: 0 10px 30px rgba(0,255,65,0.1);
                text-align: center; /* 🎯 CENTER ALIGNMENT */
            `;

            dashboard.innerHTML = `
                <div style="font-size: 9px; color: var(--main); font-weight: 900; letter-spacing: 3px; margin-bottom: 15px; text-transform: uppercase;">
                    — EXECUTIVE BRIEFING —
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 14px; align-items: center;">
                    
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; opacity: ${insights.hasGood ? '1' : '0.3'};">
                        <div style="font-size: 18px;">🟢</div>
                        <div style="font-size: 11px; color: #fff; font-weight: 600; max-width: 280px;">${insights.good}</div>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; opacity: ${insights.hasAction ? '1' : '0.3'};">
                        <div style="font-size: 18px;">🟡</div>
                        <div style="font-size: 11px; color: #ffbb33; font-weight: 700; max-width: 280px; line-height:1.3;">${insights.action}</div>
                    </div>

                    <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; opacity: ${insights.hasBad ? '1' : '0.3'};">
                        <div style="font-size: 18px;">🔴</div>
                        <div style="font-size: 11px; color: #ff4444; font-weight: 800; max-width: 280px;">${insights.bad}</div>
                    </div>

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
