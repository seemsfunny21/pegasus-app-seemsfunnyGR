/* ==========================================================================
   🧠 PEGASUS MODULE: ORACLE (EXECUTIVE BRIEFING - MASTER v2.0)
   Protocol: Classic UI Shell + Smart Data Engine (Portions & Plurals)
   ========================================================================== */

(function() {
    window.PegasusOracle = {
        analyzeData: function() {
            // Προεπιλεγμένα Μηνύματα (Αν όλα είναι άδεια/ιδανικά)
            let msgGood = "Όλα τα συστήματα λειτουργούν φυσιολογικά.";
            let msgWarning = "Κανένα επικείμενο καθήκον.";
            let msgCritical = "Καμία κρίσιμη προειδοποίηση.";

            let hasGood = false;
            let hasWarning = false;
            let hasCritical = false;

            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;

            // --- 1. ΑΝΤΛΗΣΗ ΔΕΔΟΜΕΝΩΝ ΑΠΟ MODULES ---
            const supplies = JSON.parse(localStorage.getItem('pegasus_supplies_v1')) || [];
            const maint = JSON.parse(localStorage.getItem('pegasus_maintenance_v1')) || [];
            const bio = JSON.parse(localStorage.getItem('pegasus_biometrics_v1')) || [];
            const missions = JSON.parse(localStorage.getItem('pegasus_missions_v1')) || [];

            // --- 2. ΚΑΤΗΓΟΡΙΑ 1: ΠΡΑΣΙΝΟ 🟢 (Ανάρρωση & Στόχοι) ---
            let sleep = 0; if (bio.length > 0) sleep = bio[0].sleep;
            let completedMissions = missions.filter(m => m.completed).length;
            let pct = missions.length > 0 ? (completedMissions / missions.length) * 100 : 0;

            if (sleep >= 9) {
                msgGood = `Εξαιρετική ανάρρωση (Ύπνος ${sleep}/10). Έτοιμος για προπόνηση!`;
                hasGood = true;
            } else if (pct >= 80) {
                msgGood = `Υψηλή πειθαρχία: ${Math.round(pct)}% των στόχων ολοκληρώθηκαν.`;
                hasGood = true;
            }

            // --- 3. ΚΑΤΗΓΟΡΙΑ 2: ΠΟΡΤΟΚΑΛΙ 🟠 (Οριακά Αποθέματα & Σημερινές Εργασίες) ---
            let lowSupplies = [];
            let todayMaint = [];
            let warningArr = [];

            supplies.forEach(s => {
                const rem = s.amount / s.portion;
                if (rem > 0 && rem <= 1.1) lowSupplies.push(s.label); // 1 Δόση
            });

            maint.forEach(t => {
                const diffDays = Math.ceil(((t.lastDone + (t.interval * oneDay)) - now) / oneDay);
                if (diffDays === 0) todayMaint.push(t.label);
            });

            if (lowSupplies.length > 0) warningArr.push(`Οριακά (1 Δόση): ${lowSupplies.join(', ')}`);
            if (todayMaint.length > 0) warningArr.push(`Σήμερα: ${todayMaint.join(', ')}`);

            if (warningArr.length > 0) {
                msgWarning = warningArr.join(" | ");
                hasWarning = true;
            }

            // --- 4. ΚΑΤΗΓΟΡΙΑ 3: ΚΟΚΚΙΝΟ 🔴 (Εξαντλημένα & Ληγμένα) ---
            let depletedSupplies = [];
            let overdueMaint = [];
            let criticalArr = [];

            supplies.forEach(s => {
                const rem = s.amount / s.portion;
                if (rem <= 0) depletedSupplies.push(s.label); // Τέλος
            });

            maint.forEach(t => {
                const diffDays = Math.ceil(((t.lastDone + (t.interval * oneDay)) - now) / oneDay);
                if (diffDays < 0) overdueMaint.push(t.label);
            });

            // Λογική Ενικού / Πληθυντικού
            if (depletedSupplies.length === 1) {
                criticalArr.push(`Εξαντλήθηκε: ${depletedSupplies[0]}`);
            } else if (depletedSupplies.length > 1) {
                criticalArr.push(`Εξαντλήθηκαν: ${depletedSupplies.join(', ')}`);
            }

            if (overdueMaint.length === 1) {
                criticalArr.push(`Εκτός Χρόνου: ${overdueMaint[0]}`);
            } else if (overdueMaint.length > 1) {
                criticalArr.push(`Εκτός Χρόνου: ${overdueMaint.join(', ')}`);
            }

            if (criticalArr.length > 0) {
                msgCritical = criticalArr.join(" | ");
                hasCritical = true;
            }

            return {
                good: msgGood, hasGood: hasGood,
                warning: msgWarning, hasWarning: hasWarning,
                critical: msgCritical, hasCritical: hasCritical
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
            
            // Κρατάμε το αυθεντικό πράσινο περίγραμμα και gradient UI
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
                        <div style="font-size: 11px; color: #ccc; font-weight: 600; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">${insights.good}</div>
                    </div>
                    
                    <div style="display: flex; gap: 10px; align-items: flex-start; opacity: ${insights.hasWarning ? '1' : '0.5'};">
                        <div style="font-size: 16px; margin-top: -2px;">🟠</div>
                        <div style="font-size: 11px; color: ${insights.hasWarning ? '#ffbb33' : '#ccc'}; font-weight: ${insights.hasWarning ? '800' : '600'}; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">${insights.warning}</div>
                    </div>

                    <div style="display: flex; gap: 10px; align-items: flex-start; opacity: ${insights.hasCritical ? '1' : '0.5'};">
                        <div style="font-size: 16px; margin-top: -2px;">🔴</div>
                        <div style="font-size: 11px; color: ${insights.hasCritical ? '#ff4444' : '#ccc'}; font-weight: ${insights.hasCritical ? '800' : '600'}; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">${insights.critical}</div>
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

    // Δημιουργία του animation pulse αν δεν υπάρχει
    const style = document.createElement('style');
    style.innerHTML = `@keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.5); } 100% { opacity: 1; transform: scale(1); } }`;
    document.head.appendChild(style);
})();
