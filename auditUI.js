/* ==========================================================================
   PEGASUS AUDIT UI - v1.1 (INTEGRITY MONITOR)
   Protocol: UI-Driven Diagnostic & Visual Status Bridge
   Status: FINAL STABLE | CORE DIAGNOSTIC ENGINE
   ========================================================================== */

var M = M || window.PegasusManifest;

window.PegasusAuditUI = {
    init() {
        const btn = document.getElementById('btnSystemAudit');
        if (btn) {
            btn.onclick = () => this.runAudit(false);
            // Σιωπηλός έλεγχος στο boot για να χρωματιστεί το κουμπί
            setTimeout(() => this.runAudit(true), 2500);
        }
    },

    runAudit(isSilent = false) {
        const btn = document.getElementById('btnSystemAudit');
        if (!isSilent && btn) btn.innerHTML = "⏳ ΕΛΕΓΧΟΣ...";

        // --- Λίστα Module για έλεγχο ---
        const modules = [
            { name: "Manifest", obj: window.PegasusManifest },
            { name: "Data", obj: window.program },
            { name: "Optimizer", obj: window.PegasusOptimizer },
            { name: "ProgressUI", obj: window.MuscleProgressUI },
            { name: "Settings", obj: window.getPegasusSettings },
            { name: "CloudSync", obj: window.PegasusCloud },
            { name: "Metabolic", obj: window.verifyCalorieLogic }
        ];

        const offlineModules = modules.filter(m => !m.obj);
        const isSystemStable = offlineModules.length === 0;

        // --- Οπτική Ανατροφοδότηση ---
        if (btn) {
            if (isSystemStable) {
                btn.style.borderColor = "#00ff41";
                btn.style.color = "#00ff41";
                btn.style.background = "rgba(0, 255, 65, 0.1)";
                btn.innerHTML = "✅ PEGASUS: STABLE";
            } else {
                btn.style.borderColor = "#ff4444";
                btn.style.color = "#ff4444";
                btn.style.background = "rgba(255, 68, 68, 0.1)";
                btn.innerHTML = `❌ ERRORS: ${offlineModules.length}`;
            }
        }

        // Αναλυτική αναφορά στην κονσόλα αν πατηθεί χειροκίνητα
        if (!isSilent) {
            console.log("%c--- PEGASUS AUDIT REPORT ---", "color: #00ff41; font-weight: bold;");
            console.table(modules.map(m => ({ 
                Module: m.name, 
                Status: m.obj ? "✅ ONLINE" : "❌ OFFLINE" 
            })));
            
            if (!isSystemStable) {
                console.error("⚠️ OFFLINE MODULES DETECTED:", offlineModules.map(m => m.name));
            }
        }
    }
};

// Εκκίνηση
document.addEventListener("DOMContentLoaded", () => window.PegasusAuditUI.init());
