/* ==========================================================================
   🧠 PEGASUS MODULE: ORACLE (v2.2 - RADICAL MINIMALISM)
   Protocol: Color-Synced Text, Left Alignment, No-Header UI
   ========================================================================== */

(function() {
    window.PegasusOracle = {
        analyzeData: function() {
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;

            const supplies = JSON.parse(localStorage.getItem('pegasus_supplies_v1')) || [];
            const maint = JSON.parse(localStorage.getItem('pegasus_maintenance_v1')) || [];
            const bio = JSON.parse(localStorage.getItem('pegasus_biometrics_v1')) || [];
            const missions = JSON.parse(localStorage.getItem('pegasus_missions_v1')) || [];

            // --- 1. ΥΠΝΟΣ & ΣΤΟΧΟΙ (🟢 / 🟠 / 🔴) ---
            let sleep = 0; if (bio.length > 0) sleep = bio[0].sleep;
            let completed = missions.filter(m => m.completed).length;
            let pct = missions.length > 0 ? (completed / missions.length) * 100 : 0;

            let row1 = { icon: '🟢', color: '#00ff41', txt: "Όλα τα συστήματα λειτουργούν φυσιολογικά." };

            if (sleep >= 9) {
                row1 = { icon: '🟢', color: '#00ff41', txt: `Εξαιρετική ανάρρωση (Ύπνος ${sleep}/10). Έτοιμος για προπόνηση!` };
            } else if (sleep >= 6) {
                row1 = { icon: '🟠', color: '#ffbb33', txt: `Μέτρια ανάρρωση (Ύπνος ${sleep}/10). Προσοχή στην ένταση.` };
            } else if (sleep > 0) {
                row1 = { icon: '🔴', color: '#ff4444', txt: `Κακός ύπνος (${sleep}/10). Προτεραιότητα στην ξεκούραση.` };
            } else if (pct >= 80) {
                row1 = { icon: '🟢', color: '#00ff41', txt: `Υψηλή πειθαρχία: ${Math.round(pct)}% των στόχων ολοκληρώθηκαν.` };
            }

            // --- 2. ΕΠΙΚΕΙΜΕΝΑ ΚΑΘΗΚΟΝΤΑ (🟠) ---
            let low = supplies.filter(s => { const r = s.amount/s.portion; return r > 0 && r <= 1.1; }).map(s => s.label);
            let todayMaint = maint.filter(t => Math.ceil(((t.lastDone + (t.interval * oneDay)) - now) / oneDay) === 0).map(t => t.label);

            let warningTxt = "Κανένα επικείμενο καθήκον.";
            let hasWarning = low.length > 0 || todayMaint.length > 0;

            if (hasWarning) {
                let parts = [];
                if (low.length > 0) parts.push(`Οριακά: ${low.join(', ')}`);
                if (todayMaint.length > 0) parts.push(`Σήμερα: ${todayMaint.join(', ')}`);
                warningTxt = parts.join(" | ");
            }

            // --- 3. ΚΡΙΣΙΜΑ (🔴) ---
            let empty = supplies.filter(s => (s.amount/s.portion) <= 0).map(s => s.label);
            let overdue = maint.filter(t => Math.ceil(((t.lastDone + (t.interval * oneDay)) - now) / oneDay) < 0).map(t => t.label);

            let criticalTxt = "Καμία κρίσιμη προειδοποίηση.";
            let hasCritical = empty.length > 0 || overdue.length > 0;

            if (hasCritical) {
                let parts = [];
                if (empty.length > 0) {
                    const verb = empty.length === 1 ? "Εξαντλήθηκε" : "Εξαντλήθηκαν";
                    parts.push(`${verb}: ${empty.join(', ')}`);
                }
                if (overdue.length > 0) {
                    const verb = overdue.length === 1 ? "Εργασία" : "Εργασίες";
                    parts.push(`Εκτός χρόνου ${verb}: ${overdue.join(', ')}`);
                }
                criticalTxt = parts.join(" | ");
            }

            return [
                row1,
                { icon: '🟠', color: hasWarning ? '#ffbb33' : '#666', txt: warningTxt, active: hasWarning },
                { icon: '🔴', color: hasCritical ? '#ff4444' : '#666', txt: criticalTxt, active: hasCritical }
            ];
        },

        injectDashboard: function() {
            const anchor = document.getElementById('mobileStaticDashboard');
            const home = document.getElementById('home');
            if (!anchor || !home) return;

            const rows = this.analyzeData();
            anchor.innerHTML = `
                <div id="oracle-dashboard" class="oracle-dashboard-static">
                    ${rows.map(row => `
                        <div class="oracle-dashboard-row">
                            <div class="oracle-dashboard-icon">${row.icon}</div>
                            <div class="oracle-dashboard-text" style="color: ${row.color};">
                                ${row.txt.toUpperCase()}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
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
