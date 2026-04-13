/* ==========================================================================
   🧠 PEGASUS MODULE: ORACLE (EXECUTIVE BRIEFING)
   Protocol: Cross-Module Data Correlation & Home Dashboard
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
            
            supplies.forEach(s => {
                if ((s.amount / s.refill) < 0.15) actionItems.push(`Χαμηλό απόθεμα: ${s.label}`);
            });

            maint.forEach(t => {
                const diffDays = Math.ceil(((t.lastDone + (t.interval * oneDay)) - now) / oneDay);
                if (diffDays <= 0) actionItems.push(`Λήξη Συντήρησης: ${t.label}`);
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
                if (f.amount < 0) recentExpenses += Math.abs(f.amount); // Απλοποιημένη λογική
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
            // Επιλογή του main container αντί για το grid αν θέλουμε να είναι τελείως κάτω
            const viewHome = document.getElementById('home');
            if (!viewHome) return;

            // Έλεγχος σελίδας
            if (window.PegasusMobileUI && window.PegasusMobileUI.currentPage !== 0) return;

            // Καθαρισμός προηγούμενου
            const existingOracle = document.getElementById('oracle-dashboard');
            if (existingOracle) existingOracle.remove();

            const insights = this.analyzeData();

            // Δημιουργία Dashboard
            const dashboard = document.createElement('div');
            dashboard.id = 'oracle-dashboard';
            
            // UI Optimization: Αφαιρέσαμε το grid-column για να μπει ως αυτόνομο block κάτω από το grid
            dashboard.style.cssText = `
                width: calc(100% - 10px);
                margin: 20px auto 100px auto; 
                background: linear-gradient(145deg, rgba(15,15,15,0.98) 0%, rgba(5,5,5,0.98) 100%);
                border: 1px solid var(--main);
                border-radius: 20px;
                padding: 18px;
                box-shadow: 0 -10px 30px rgba(0,255,65,0.05);
                position: relative;
                box-sizing: border-box;
            `;

            dashboard.innerHTML = `
                <div style="position: absolute; top: -15px; right: -15px; font-size: 70px; opacity: 0.03; pointer-events: none;">👁️</div>
                <div style="font-size: 10px; color: var(--main); font-weight: 900; letter-spacing: 2px; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                    <span style="display:inline-block; width:8px; height:8px; background:var(--main); border-radius:50%; box-shadow: 0 0 10px var(--main); animation: pulse 2s infinite;"></span>
                    EXECUTIVE BRIEFING
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div style="display: flex; gap: 12px; align-items: flex-start; opacity: ${insights.hasGood ? '1' : '0.4'};">
                        <div style="font-size: 14px;">🟢</div>
                        <div style="font-size: 11px; color: #eee; font-weight: 600; line-height: 1.4;">${insights.good}</div>
                    </div>
                    <div style="display: flex; gap: 12px; align-items: flex-start; opacity: ${insights.hasBad ? '1' : '0.4'};">
                        <div style="font-size: 14px;">🔴</div>
                        <div style="font-size: 11px; color: ${insights.hasBad ? '#ff4444' : '#eee'}; font-weight: ${insights.hasBad ? '800' : '600'}; line-height: 1.4;">${insights.bad}</div>
                    </div>
                    <div style="display: flex; gap: 12px; align-items: flex-start; opacity: ${insights.hasAction ? '1' : '0.4'};">
                        <div style="font-size: 14px;">⚡</div>
                        <div style="font-size: 11px; color: ${insights.hasAction ? '#00bcd4' : '#eee'}; font-weight: ${insights.hasAction ? '800' : '600'}; line-height: 1.4;">${insights.action}</div>
                    </div>
                </div>
            `;

            // Τοποθέτηση στο τέλος του view "home", μετά το "dynamic-grid" και το "settings-anchor"
            viewHome.appendChild(dashboard);
        }
    };

    // Ενεργοποίηση "Γέφυρας" με το UI Engine (PegasusMobileUI)
    // Κάνουμε Override την υπάρχουσα render συνάρτηση για να σχεδιάζει πάντα το Oracle!
    document.addEventListener("DOMContentLoaded", () => {
        if (window.PegasusMobileUI) {
            const originalRender = window.PegasusMobileUI.render;
            window.PegasusMobileUI.render = function() {
                originalRender.apply(this, arguments);
                setTimeout(() => window.PegasusOracle.injectDashboard(), 50); // Inject after grid builds
            };
            // Force first render
            setTimeout(() => window.PegasusOracle.injectDashboard(), 100);
        }
    });

    // Προσθήκη CSS Animation για το λαμπάκι
    const style = document.createElement('style');
    style.innerHTML = `@keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.5); } 100% { opacity: 1; transform: scale(1); } }`;
    document.head.appendChild(style);
})();
