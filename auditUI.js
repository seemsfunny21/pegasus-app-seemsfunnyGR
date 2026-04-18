/* ==========================================================================
   PEGASUS OMNI-AUDIT - v2.1 (DYNAMIC METABOLIC ALIGNMENT PATCH)
   Protocol: Deep Trace, Memory Scan & Dynamic Target Validation
   Status: ULTIMATE DIAGNOSTIC ENGINE | ZERO-BUG SHIELD
   ========================================================================== */

var M = M || window.PegasusManifest;

window.PegasusAuditUI = {
    lastAudit: null,

    init() {
        const btn = document.getElementById('btnSystemAudit');
        if (btn) {
            btn.onclick = () => this.runFullDiagnostic(false);
            setTimeout(() => this.runFullDiagnostic(true), 3000);
        }
    },

    getGreekDayName() {
        const greekDays = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
        return greekDays[new Date().getDay()];
    },

    getExpectedBaseTarget() {
        const dayName = this.getGreekDayName();

        const settings = (typeof window.getPegasusSettings === "function")
            ? window.getPegasusSettings()
            : { activeSplit: "IRON" };

        const activePlan = settings?.activeSplit || "IRON";

        const KCAL_REST = 2100;
        const KCAL_WEIGHTS = 2800;
        const KCAL_EMS = 2700;
        const KCAL_BIKE = 3100;

        if (dayName === "Δευτέρα" || dayName === "Πέμπτη") return KCAL_REST;

        switch (activePlan) {
            case "EMS_ONLY":
                return dayName === "Τετάρτη" ? KCAL_EMS : KCAL_WEIGHTS;

            case "BIKE_ONLY":
                return (dayName === "Σάββατο" || dayName === "Κυριακή") ? KCAL_BIKE : KCAL_WEIGHTS;

            case "HYBRID":
                if (dayName === "Τετάρτη") return KCAL_EMS;
                if (dayName === "Σάββατο" || dayName === "Κυριακή") return KCAL_BIKE;
                return KCAL_WEIGHTS;

            case "UPPER_LOWER":
            case "IRON":
            default:
                return KCAL_WEIGHTS;
        }
    },

    getTodayDateStr() {
        const d = new Date();
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    },

    getTodayCardioOffset() {
        const dateStr = this.getTodayDateStr();

        const unified = parseFloat(localStorage.getItem("pegasus_cardio_kcal_" + dateStr));
        if (!isNaN(unified)) return unified;

        const legacy = parseFloat(localStorage.getItem((M?.workout?.cardio_offset || "pegasus_cardio_offset_sets") + "_" + dateStr));
        if (!isNaN(legacy)) return legacy;

        return 0;
    },

    getEffectiveTargetKcal() {
        if (typeof window.calculatePegasusDailyTarget === "function") {
            const base = parseFloat(window.calculatePegasusDailyTarget());
            const cardio = this.getTodayCardioOffset();
            return Math.round((isNaN(base) ? 0 : base) + cardio);
        }

        const stored = parseFloat(localStorage.getItem(M?.diet?.todayKcal || "pegasus_today_kcal"));
        const cardio = this.getTodayCardioOffset();
        return Math.round((isNaN(stored) ? 2800 : stored) + cardio);
    },

    async runFullDiagnostic(isSilent = false) {
        const start = performance.now();
        const btn = document.getElementById('btnSystemAudit');
        let report = { errors: [], warnings: [], score: 100 };

        /* --- 1. MODULE PULSE (CRITICAL) --- */
        const criticalModules = [
            { id: "Manifest", obj: window.PegasusManifest },
            { id: "DataEngine", obj: window.program },
            { id: "AppCore", obj: window.masterUI || window.app },
            { id: "Optimizer", obj: window.PegasusOptimizer },
            { id: "Settings", obj: window.getPegasusSettings },
            { id: "CloudSync", obj: window.PegasusCloud }
        ];

        criticalModules.forEach(m => {
            if (!m.obj) {
                report.errors.push(`Module Offline: ${m.id}`);
                report.score -= 20;
            }
        });

        /* --- 2. STORAGE SCAN (DEEP) --- */
        let totalChars = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            totalChars += value ? value.length : 0;
        }

        const storageMB = (totalChars * 2) / 1024 / 1024;
        if (storageMB > 4) {
            report.warnings.push(`Storage High: ${storageMB.toFixed(2)}MB`);
        }

        const keysToTest = ['pegasus_weight', 'pegasus_today_kcal', 'pegasus_weekly_kcal'];
        keysToTest.forEach(k => {
            const raw = localStorage.getItem(k);
            if (raw !== null && raw !== "" && isNaN(parseFloat(raw))) {
                report.warnings.push(`Data Corruption: ${k} is NaN`);
                report.score -= 5;
            }
        });

        /* --- 3. METABOLIC PULSE (DYNAMIC) --- */
        const weight = parseFloat(localStorage.getItem(M?.user?.weight || "pegasus_weight")) || 74;
        const baseTarget = this.getExpectedBaseTarget();
        const cardioOffset = this.getTodayCardioOffset();
        const targetKcal = this.getEffectiveTargetKcal();
        const expectedTarget = Math.round(baseTarget + cardioOffset);

        const isRecoveryDay = ["Δευτέρα", "Πέμπτη"].includes(this.getGreekDayName());
        let isAnomalous = false;

        if (Math.abs(targetKcal - expectedTarget) > 25) {
            isAnomalous = true;
            report.warnings.push(`Metabolic Drift: effective target ${targetKcal} differs from expected ${expectedTarget}.`);
            report.score -= 10;
        }

        if (isRecoveryDay && (targetKcal < 1800 || targetKcal > 2600 + cardioOffset)) {
            isAnomalous = true;
            report.warnings.push(`Metabolic Shift: Recovery-day kcal (${targetKcal}) outside safe protocol.`);
            report.score -= 10;
        }

        if (!isRecoveryDay && (targetKcal < 2300 || targetKcal > 3800)) {
            isAnomalous = true;
            report.warnings.push(`Metabolic Shift: Training-day kcal (${targetKcal}) outside safe protocol.`);
            report.score -= 10;
        }

        if (!isAnomalous) {
            console.log(
                `%c 🟢 AUDIT: Metabolic Alignment OK (${targetKcal} kcal | base ${baseTarget} + cardio ${cardioOffset})`,
                "color: #4CAF50"
            );
        }

        /* --- 4. DOM INTEGRITY --- */
        const domElements = ["exList", "video", "totalProgress", "btnStart"];
        domElements.forEach(id => {
            if (!document.getElementById(id)) {
                report.errors.push(`DOM Missing: #${id}`);
                report.score -= 15;
            }
        });

        /* --- 5. MUSCLE UI PULSE --- */
        const muscleBox = document.getElementById("muscleProgressContainer");
        if (!muscleBox) {
            report.warnings.push("Muscle UI container missing.");
            report.score -= 5;
        }

        this.lastAudit = {
            time: new Date().toLocaleTimeString('el-GR'),
            weight,
            baseTarget,
            cardioOffset,
            effectiveTarget: targetKcal,
            expectedTarget
        };

        /* --- UI UPDATER --- */
        if (btn) {
            this.updateButtonVisuals(btn, report);
        }

        /* --- LOGGING --- */
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
        console.log(`%c 🏛️ PEGASUS OMNI-AUDIT v2.1 RESULT (${time}ms)`, "color: #00ff41; font-weight: bold; font-size: 14px;");

        if (this.lastAudit) {
            console.log("%c > METABOLIC SNAPSHOT:", "color: #00bcd4; font-weight: bold;");
            console.table([
                { Metric: "Weight", Value: `${this.lastAudit.weight} kg` },
                { Metric: "Base Target", Value: `${this.lastAudit.baseTarget} kcal` },
                { Metric: "Cardio Offset", Value: `${this.lastAudit.cardioOffset} kcal` },
                { Metric: "Expected Target", Value: `${this.lastAudit.expectedTarget} kcal` },
                { Metric: "Effective Target", Value: `${this.lastAudit.effectiveTarget} kcal` }
            ]);
        }

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

document.addEventListener("DOMContentLoaded", () => window.PegasusAuditUI.init());
