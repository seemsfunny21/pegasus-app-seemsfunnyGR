/* ==========================================================================
   PEGASUS APP COORDINATOR
   Thin compatibility shell preserved intentionally for safe legacy wiring.
   ========================================================================== */

if (!window.PegasusAppState) {
    console.warn("⚠️ PEGASUS APP: PegasusAppState missing before app coordinator load.");
}

if (!window.PegasusDesktopBoot) {
    console.warn("⚠️ PEGASUS APP: Desktop boot module missing before app coordinator load.");
}

window.getPegasusAppCoordinatorState = function() {
    return {
        hasAppState: !!window.PegasusAppState,
        hasDesktopBoot: !!window.PegasusDesktopBoot,
        hasModuleIntegrity: !!window.PegasusModuleIntegrity,
        masterUiKeys: Object.keys(window.masterUI || {})
    };
};
