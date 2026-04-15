/* ==========================================================================
   PEGASUS AUDIT UI - v1.0 (REAL-TIME INTEGRITY MONITOR)
   Protocol: Zero-Bug Simulation & Visual Feedback Bridge
   Status: FINAL STABLE | CORE DIAGNOSTIC ENGINE
   ========================================================================== */

// 🛡️ Global Safe Declaration
var M = M || window.PegasusManifest;

window.PegasusAuditUI = {
    btnId: "btnSystemAudit",
    
    init() {
        console.log("🛠️ PEGASUS AUDIT: UI Monitor Initializing...");
        this.injectButton();
        // Εκτέλεση ενός σιωπηλού ελέγχου στην αρχή για να χρωματιστεί το κουμπί
        setTimeout(() => this.runAudit(true), 2000);
    },

    injectButton() {
        // Αναζήτηση του Tools Panel (ή του container των εργαλείων σου)
        const toolsPanel = document.getElementById('toolsPanel') || document.querySelector('.tools-grid');
        if (!toolsPanel) {
            console.warn("⚠️ PEGASUS AUDIT: Tools Panel not found. Retrying in 3s...");
            setTimeout(() => this.injectButton(), 3000);
            return;
        }

        if (document.getElementById(this.btnId)) return;

        const btn = document.createElement('button');
        btn.id = this.btnId;
        btn.className = 'tool-button'; // Χρησιμοποιούμε την κλάση που ήδη έχεις για τα κουμπιά
        btn.style.cssText = `
            background: #222; 
            color: #4CAF50; 
            border: 1px solid #4CAF50; 
            padding: 10px; 
            border-radius: 5px; 
            cursor: pointer; 
            font-weight: bold; 
            font-size: 11px;
            transition: all 0.3s ease;
            width: 100%;
            margin-top: 10px;
            text-transform: uppercase;
        `;
        btn.innerHTML = "🔍 ΕΛΕΓΧΟΣ PEGASUS";
        btn.onclick = () => this.runAudit(false);
        
        toolsPanel.appendChild(btn);
    },

    runAudit(isSilent = false) {
        const btn = document.getElementById(this.btnId);
        if (!isSilent && btn) btn.innerHTML = "⏳ ΕΛΕΓΧΟΣ...";

        // --- CORE MODULE CHECK ---
        const modules = [
            { name: "Manifest", obj: window.PegasusManifest },
            { name: "Data", obj: window.program },
            { name: "Optimizer", obj: window.PegasusOptimizer },
            { name: "ProgressUI", obj: window.MuscleProgressUI },
            { name: "Cloud", obj: window.PegasusCloud },
            { name: "Settings", obj: window.getPegasusSettings }
        ];

        const offlineModules = modules.filter(m => !m.obj);
        const isSystemStable = offlineModules.length === 0;

        // --- UI FEEDBACK ---
        if (btn) {
            if (isSystemStable) {
                btn.style.background = "#004d00"; // Σκούρο πράσινο
                btn.style.color = "#00ff41";
                btn.style.border = "1px solid #00ff41";
                btn.innerHTML = "✅ PEGASUS: STABLE";
            } else {
                btn.style.background = "#660000"; // Σκούρο κόκκινο
                btn.style.color = "#ff4444";
                btn.style.border = "1px solid #ff4444";
                btn.innerHTML = `❌ ERRORS: ${offlineModules.length}`;
            }
        }

        // Αν ο χρήστης το πάτησε χειροκίνητα, βγάζουμε και την αναλυτική αναφορά στην κονσόλα
        if (!isSilent) {
            console.log("%c--- PEGASUS MANUAL AUDIT REPORT ---", "color: #00ff41; font-weight: bold;");
            console.table(modules.map(m => ({ Module: m.name, Status: m.obj ? "ONLINE" : "OFFLINE" })));
            
            if (!isSystemStable) {
                alert(`ΠΡΟΣΟΧΗ: Βρέθηκαν ${offlineModules.length} σφάλματα σύνδεσης. Δες την κονσόλα (F12).`);
            } else {
                console.log("%c🛡️ System is Combat Ready.", "color: #4CAF50;");
            }
        }
    }
};

// Start
document.addEventListener("DOMContentLoaded", () => window.PegasusAuditUI.init());
