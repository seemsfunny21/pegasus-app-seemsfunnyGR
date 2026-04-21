/* ==========================================================================
   PEGASUS MODULE INTEGRITY
   Boot-time integrity checks for critical desktop modules and runtime bridges.
   ========================================================================== */

(function(){
    const REQUIRED_GLOBALS = [
        ["PegasusDesktopBoot.boot", () => typeof window.PegasusDesktopBoot?.boot === "function"],
        ["PegasusDesktopSyncUI.buildMasterUI", () => typeof window.PegasusDesktopSyncUI?.buildMasterUI === "function"],
        ["createNavbar", () => typeof window.createNavbar === "function"],
        ["selectDay", () => typeof window.selectDay === "function"],
        ["startPause", () => typeof window.startPause === "function"],
        ["skipToNextExercise", () => typeof window.skipToNextExercise === "function"],
        ["showVideo", () => typeof window.showVideo === "function"],
        ["openExercisePreview", () => typeof window.openExercisePreview === "function"],
        ["renderPegasusControlState", () => typeof window.renderPegasusControlState === "function"],
        ["bindPegasusEngineUiBridge", () => typeof window.bindPegasusEngineUiBridge === "function"],
        ["syncEngineFromLegacy", () => typeof window.syncEngineFromLegacy === "function"],
        ["PegasusDebug.summary", () => typeof window.PegasusDebug?.summary === "function"],
        ["PegasusSyncHardening.getState", () => typeof window.PegasusSyncHardening?.getState === "function"]
    ];

    function buildIntegrityResult() {
        const missing = [];
        REQUIRED_GLOBALS.forEach(([name, test]) => {
            try {
                if (!test()) missing.push(name);
            } catch (_) {
                missing.push(name);
            }
        });

        return {
            ok: missing.length === 0,
            checkedAt: new Date().toISOString(),
            missing,
            appState: window.PegasusAppState?.snapshot ? window.PegasusAppState.snapshot() : null
        };
    }

    function reportIntegrity(result, stage) {
        const monitor = window.PegasusRuntimeMonitor;
        if (result.ok) {
            if (monitor?.trace) monitor.trace("moduleIntegrity.js", stage || "check", "OK", { missing: 0 });
            console.log("🧩 PEGASUS MODULE CHECK: OK");
            return result;
        }

        const details = { missing: result.missing, stage: stage || "check" };
        if (monitor?.warn) monitor.warn("moduleIntegrity.js", stage || "check", "Missing required PEGASUS globals", details);
        console.warn("⚠️ PEGASUS MODULE CHECK: Missing globals", result.missing);
        return result;
    }

    window.PegasusModuleIntegrity = {
        required: REQUIRED_GLOBALS.map(([name]) => name),
        check(stage) {
            const result = buildIntegrityResult();
            return reportIntegrity(result, stage || "manual_check");
        }
    };

    window.addEventListener("load", () => {
        setTimeout(() => {
            window.PegasusModuleIntegrity.check("post_boot");
        }, 1800);
    });
})();
