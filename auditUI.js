/* ==========================================================================
   PEGASUS OMNI-AUDIT - v2.0 (MAXIMUM INTEGRITY)
   Protocol: Deep Trace, Memory Scan & Metabolic Validation
   Status: ULTIMATE DIAGNOSTIC ENGINE | ZERO-BUG SHIELD
   ========================================================================== */

var M = M || window.PegasusManifest;

window.PegasusAuditUI = {
    lastAudit: null,

    init() {
        const btn = document.getElementById('btnSystemAudit');
        if (btn) {
            btn.onclick = () => this.runFullDiagnostic(false);
            // Boot Scan: 3 δευτερόλεπτα μετά το φόρτωμα
            setTimeout(() => this.runFullDiagnostic(true), 3000);
        }
    },

    async runFullDiagnostic(isSilent = false) {
        const start = performance.now();
        const btn = document.getElementById('btnSystemAudit');
        let report = { errors: [], warnings: [], score: 100 };

        // --- 1. MODULE PULSE (CRITICAL) ---
        const criticalModules = [
            { id: "Manifest", obj: window.PegasusManifest },
            { id: "DataEngine", obj: window.program },
            { id: "AppCore", obj: window.masterUI || window.app },
            { id: "Optimizer", obj: window.PegasusOptimizer },
            { id: "Settings", obj: window.getPegasusSettings },
            { id: "CloudSync", obj: window.PegasusCloud }
        ];
        criticalModules.forEach(m => {
            if (!m.obj) { report.errors.push(`Module Offline: ${m.id}`); report.score -= 20; }
        });

        // --- 2. STORAGE SCAN (DEEP) ---
        let totalChars = 0;
        for (let i = 0; i < localStorage.length; i++) {
            totalChars += localStorage.getItem(localStorage.key(i)).length;
        }
        const storageMB = (totalChars * 2) / 1024 / 1024; // Approx MB
        if (storageMB > 4) report.warnings.push(`Storage High: ${storageMB.toFixed(2)}MB`);
        
        // Έλεγχος για NaN σε κρίσιμα κλειδιά
        const keysToTest = ['pegasus_weight', 'pegasus_today_kcal', 'pegasus_weekly_kcal'];
        keysToTest.forEach(k => {
            if (isNaN(parseFloat(localStorage.getItem(k)))) {
                report.warnings.push(`Data Corruption: ${k} is NaN`);
                report.score -= 5;
            }
        });

        // --- 3. METABOLIC PULSE ---
        const weight = parseFloat(localStorage.getItem(M?.user?.weight || "pegasus_weight")) || 74;
        const targetKcal = parseInt(localStorage.getItem(M?.diet?.todayKcal || "pegasus_today_kcal")) || 2800;
        if (targetKcal < 1500 || targetKcal > 5000) {
            report.warnings.push("Metabolic Outlier: Kcal target suspicious.");
            report.score -= 10;
        }

        // --- 4. DOM INTEGRITY ---
        const domElements = ["exList", "video", "totalProgress", "btnStart", "kcalBtn"];
        domElements.forEach(id => {
            if (!document.getElementById(id)) {
                report.errors.push(`DOM Missing: #${id}`);
                report.score -= 15;
            }
        });

        // --- UI UPDATER ---
        if (btn) {
            this.updateButtonVisuals(btn, report);
        }

        // --- LOGGING ---
        if (!isSilent) {
            const end = performance.now();
            this.printDetailedReport(report, (end - start).toFixed(2));
        }
    },

    updateButtonVisuals(btn, report) {
        if (report.errors.length > 0) {
            btn.style.borderColor = "#ff4444";
            btn.style.color = "#ff4444";
            btn.style.background = "rgba(255, 68, 68, 0.15)";
            btn.innerHTML = `❌ CRITICAL: ${report.errors.length} ERRORS`;
        } else if (report.warnings.length > 0) {
            btn.style.borderColor = "#ffa500";
            btn.style.color = "#ffa500";
            btn.style.background = "rgba(255, 165, 0, 0.15)";
            btn.innerHTML = `⚠️ WARNINGS: ${report.warnings.length}`;
        } else {
            btn.style.borderColor = "#00ff41";
            btn.style.color = "#00ff41";
            btn.style.background = "rgba(0, 255, 65, 0.1)";
            btn.innerHTML = `✅ SYSTEM: STABLE (${report.score}%)`;
        }
    },

    printDetailedReport(report, time) {
        console.log(`%c 🏛️ PEGASUS OMNI-AUDIT v2.0 RESULT (${time}ms)`, "color: #00ff41; font-weight: bold; font-size: 14px;");
        
        if (report.errors.length === 0 && report.warnings.length === 0) {
            console.log("%c > STATUS: ALL SYSTEMS COMBAT READY. ZERO ANOMALIES.", "color: #4CAF50;");
        }

        if (report.errors.length > 0) {
            console.log("%c > ERRORS FOUND:", "color: #ff4444; font-weight: bold;");
            report.errors.forEach(e => console.log(`   - ${e}`));
        }

        if (report.warnings.length > 0) {
            console.log("%c > WARNINGS:", "color: #ffa500; font-weight: bold;");
            report.warnings.forEach(w => console.log(`   - ${w}`));
        }

        console.log(`%c > FINAL INTEGRITY SCORE: ${report.score}/100`, "color: #00bcd4; font-weight: bold;");
        
        if (report.score < 100 && typeof M.auditData === "function") {
            console.log("%c > TRACING ORPHAN KEYS...", "color: #888;");
            M.auditData();
        }
    }
};

// Auto-Start
document.addEventListener("DOMContentLoaded", () => window.PegasusAuditUI.init());
