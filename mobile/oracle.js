/* ==========================================================================
   🧠 PEGASUS MODULE: ORACLE (EXECUTIVE BRIEFING - v1.1 SYNCED)
   Protocol: Predictive Warning, Cross-Module Data Correlation
   ========================================================================== */

(function() {
    window.PegasusOracle = {
        analyzeData: function() {
            let msgGood = "Όλα τα συστήματα λειτουργούν φυσιολογικά.";
            let msgBad = "Καμία κρίσιμη προειδοποίηση.";
            let msgAction = "Κανένα άμεσο καθήκον.";

            let hasGood = false;
            let hasBad = false;
            let hasAction = false;

            const today = new Date().toLocaleDateString('el-GR');
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;

            // --- 1. ΑΝΑΛΥΣΗ ΑΠΟΘΕΜΑΤΩΝ & ΣΥΝΤΗΡΗΣΗΣ (ACTION ITEMS ⚡) ---
            const supplies = JSON.parse(localStorage.getItem('pegasus_supplies_v1')) || [];
            const maint = JSON.parse(localStorage.getItem('pegasus_maintenance_v1')) || [];
            
            let actionItems = [];
            
            // 🎯 PREDICTIVE WARNING PROTOCOL (Sync with supplies.js)
            supplies.forEach(s => {
                let pct = s.amount / s.refill;
                if (pct < 0.15) {
                    actionItems.push(`🔴 Οριακό: ${s.label}`);
                } else if (pct < 0.40) {
                    actionItems.push(`🟠 Χαμηλό: ${s.label}`);
                }
            });

            maint.forEach(t => {
                const diffDays = Math.ceil(((t.lastDone + (t.interval * oneDay)) - now) / oneDay);
                if (diffDays < 0) {
                    actionItems.push(`🔴 Ληγμένο: ${t.label}`);
                } else if (diffDays === 0) {
                    actionItems.push(`🟠 Σήμερα: ${t.label}`);
                }
            });

            if (actionItems.length > 0) {
                msgAction = actionItems.join(" | ");
                hasAction = true;
            }

            // --- 2. ΑΝΑΛΥΣΗ ΒΙΟΜΕΤΡΙΚΩΝ & ΟΙΚΟΝΟΜΙΚΩΝ (WARNINGS 🔴) ---
            const bio = JSON.parse(localStorage.getItem('pegasus_biometrics_v1')) || [];
            const finance = JSON.parse(localStorage.getItem('pegasus_finance_v1')) || [];
            
            let recentEnergy = 10;
            if (bio.length > 0) recentEnergy = bio[0].energy;

            // Έλεγχος εξόδων τελευταίων 3 ημερών
            let recentExpenses = 0;
            finance.forEach(f => {
                if (f.amount < 0) recentExpenses += Math.abs(f.amount); 
            });

            if (recentEnergy < 5 && recentExpenses > 50) {
                msgBad = `Χαμηλή ενέργεια (${recentEnergy}/10) και αυξημένα έξοδα. Απέφυγε τις αγορές σήμερα!`;
                hasBad = true;
            } else if (recentEnergy < 5) {
                msgBad = `Η ενέργειά σου είναι στο ${recentEnergy}/10. Προτεραιότητα στην αποθεραπεία.`;
                hasBad = true;
            } else if (recentExpenses > 150) {
                msgBad = `Υψηλές δαπάνες καταγράφηκαν πρόσφατα. Σταθεροποίησε τα έξοδα.`;
                hasBad = true;
            }

            // --- 3. ΑΝΑΛΥΣΗ ΗΜΕΡΗΣΙΩΝ ΣΤΟΧΩΝ & ΥΠΝΟΥ (REWARDS 🟢) ---
            const missions = JSON.parse(localStorage.getItem('pegasus_missions_v1')) || [];
            let completedMissions = missions.filter(m => m.completed).length;
            let totalMissions = missions.length;
            let missionPct = totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;

            let recentSleep = 0;
            if (bio.length > 0) recentSleep = bio[0].sleep;

            if (missionPct >= 80 && recentSleep >= 7) {
                msgGood = `Άριστη πειθαρχία (${Math.round(missionPct)}% Στόχοι) & καλός ύπνος. Βέλτιστη ημέρα!`;
                hasGood = true;
            } else if (missionPct == 100) {
                msgGood = `Απόλυτη πειθαρχία: Ολοκλήρωσες το 100% των στόχων σου.`;
                hasGood = true;
            } else if (recentSleep >= 8) {
                msgGood = `Εξαιρετική ανάρρωση (Ύπνος ${recentSleep}/10). Είσαι έτοιμος για προπόνηση.`;
                hasGood = true;
            }

            return {
                good: msgGood, hasGood: hasGood,
                bad: msgBad, hasBad: hasBad,
                action: msgAction, hasAction: hasAction
            };
        },

        injectDashboard: function() {
            const grid = document.getElementById('dynamic-grid');
            if (!grid) return;

            if (window.PegasusMobileUI && window.PegasusMobileUI.currentPage !== 0) return;

            const existingOracle = document.getElementById('oracle-dashboard');
            if (existingOracle) existingOracle.remove();

            const insights = this.analyzeData();

            const dashboard = document.createElement('div');
            dashboard.id = 'oracle-dashboard';
            
            dashboard.style.cssText = `
                grid-column: 1 / -1; 
                background: linear-gradient(145deg, rgba(15,15,15,0.95) 0%, rgba(5,5,5,0.95) 100%);
                border: 1px solid var(--main);
                border-radius: 16px;
                padding: 15px;
                margin-bottom: 5px;
                box-shadow: 0 10px 25px rgba(0,255,65,0.05);
                position: relative;
                overflow: hidden;
            `;

            dashboard.innerHTML = `
                <div style="position: absolute; top: -20px; right: -20px; font-size: 80px; opacity: 0.03; pointer-events: none;">👁️</div>
                <div style="font-size: 10px; color: var(--main); font-weight: 900; letter-spacing: 2px; margin-bottom: 12px; display: flex; align-items: center; gap: 5px;">
                    <span style="display:inline-block; width:8px; height:8px; background:var(--main); border-radius:50%; box-shadow: 0 0 8px var(--main); animation: pulse 2s infinite;"></span>
                    EXECUTIVE BRIEFING
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <div style="display: flex; gap: 10px; align-items: flex-start; opacity: ${insights.hasGood ? '1' : '0.5'};">
                        <div style="font-size: 16px; margin-top: -2px;">🟢</div>
                        <div style="font-size: 11px; color: #ccc; font-weight: 600; line-height: 1.4;">${insights.good}</div>
                    </div>
                    
                    <div style="display: flex; gap: 10px; align-items: flex-start; opacity: ${insights.hasBad ? '1' : '0.5'};">
                        <div style="font-size: 16px; margin-top: -2px;">🔴</div>
                        <div style="font-size: 11px; color: ${insights.hasBad ? '#ff4444' : '#ccc'}; font-weight: ${insights.hasBad ? '800' : '600'}; line-height: 1.4;">${insights.bad}</div>
                    </div>

                    <div style="display: flex; gap: 10px; align-items: flex-start; opacity: ${insights.hasAction ? '1' : '0.5'};">
                        <div style="font-size: 16px; margin-top: -2px;">⚡</div>
                        <div style="font-size: 11px; color: ${insights.hasAction ? '#00bcd4' : '#ccc'}; font-weight: ${insights.hasAction ? '800' : '600'}; line-height: 1.4;">${insights.action}</div>
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

    const style = document.createElement('style');
    style.innerHTML = `@keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.5); } 100% { opacity: 1; transform: scale(1); } }`;
    document.head.appendChild(style);
})();
