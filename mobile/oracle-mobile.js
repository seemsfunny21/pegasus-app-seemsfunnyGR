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
            const grid = document.getElementById('dynamic-grid');
            if (!grid || (window.PegasusMobileUI && window.PegasusMobileUI.currentPage !== 0)) return;

            const existing = document.getElementById('oracle-dashboard');
            if (existing) existing.remove();

            const rows = this.analyzeData();
            const dashboard = document.createElement('div');
            dashboard.id = 'oracle-dashboard';
            
            dashboard.style.cssText = `
                grid-column: 1 / -1; 
                background: linear-gradient(145deg, rgba(15,15,15,0.95) 0%, rgba(5,5,5,0.95) 100%);
                border: 1px solid var(--main);
                border-radius: 16px;
                padding: 15px;
                margin-bottom: 8px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                box-sizing: border-box;
            `;

            dashboard.innerHTML = rows.map(row => `
                <div style="display: flex; align-items: flex-start; gap: 10px; width: 100%;">
                    <div style="font-size: 16px; margin-top: -2px; flex-shrink: 0;">${row.icon}</div>
                    <div style="font-size: 11px; color: ${row.color}; font-weight: 700; line-height: 1.4; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">
                        ${row.txt.toUpperCase()}
                    </div>
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

/* ==========================================================================
   ☀️ PEGASUS MODULE: MORNING CHECK-IN PROTOCOL (v1.0)
   Protocol: Time-Gated Prompt (After 08:00), Auto-Dismiss & Fade Logic
   ========================================================================== */

(function() {
    function triggerMorningRoutine() {
        const now = new Date();
        const today = now.toLocaleDateString('el-GR');
        const currentHour = now.getHours();
        const lastCheckin = localStorage.getItem('pegasus_morning_checkin');

        // 🛑 ΕΛΕΓΧΟΣ: Μετά τις 08:00 ΚΑΙ να μην έχει εμφανιστεί ήδη σήμερα
        if (currentHour >= 8 && lastCheckin !== today) {
            
            // Καταγραφή στο μητρώο για να μην ξαναβγεί
            localStorage.setItem('pegasus_morning_checkin', today);

            // Δημιουργία του Ghost UI
            const promptBox = document.createElement('div');
            promptBox.id = 'morning-prompt-box';
            promptBox.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 80%;
                max-width: 300px;
                background: rgba(10, 10, 10, 0.95);
                border: 2px solid #00ff41;
                border-radius: 16px;
                padding: 25px 20px;
                text-align: center;
                box-shadow: 0 0 30px rgba(0, 255, 65, 0.15);
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.5s ease-in-out;
                pointer-events: none; /* Δεν μπλοκάρει τα κλικ σου από κάτω */
            `;

            promptBox.innerHTML = `
                <div style="font-size: 35px; margin-bottom: 12px; filter: drop-shadow(0 0 10px rgba(0,255,65,0.4));">☀️</div>
                <div style="font-size: 12px; font-weight: 900; color: #00ff41; letter-spacing: 2px; margin-bottom: 8px;">
                    ΠΡΩΙΝΗ ΑΝΑΦΟΡΑ
                </div>
                <div style="font-size: 11px; color: #ddd; font-weight: 600; line-height: 1.5;">
                    Συστήματα ενεργά. Παρακαλώ μην ξεχάσετε να καταχωρήσετε το 
                    <span style="color:#00ff41; font-weight:900;">Βάρος</span> και τον 
                    <span style="color:#00ff41; font-weight:900;">Ύπνο</span> σας.
                </div>
            `;

            document.body.appendChild(promptBox);

            // ⏱️ ΧΡΟΝΟΔΙΑΓΡΑΜΜΑ (TIMELINE)
            setTimeout(() => promptBox.style.opacity = '1', 500); // 0.5s μετά: Εμφάνιση
            
            setTimeout(() => {
                promptBox.style.opacity = '0'; // Μετά από 2.5s: Σβήσιμο
                setTimeout(() => promptBox.remove(), 500); // Καθαρισμός DOM
            }, 5500); 
        }
    }

    // Εκκίνηση της ρουτίνας 1.5 δευτερόλεπτο αφού φορτώσει η εφαρμογή
    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(triggerMorningRoutine, 1500);
    });
})();
