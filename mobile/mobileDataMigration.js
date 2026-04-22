(function initPegasusMobileDataMigration() {
    const registry = window.PegasusMobileDataRegistry;
    if (!registry || window.__pegasusMobileDataMigrationInstalled) return;

    function safeSnapshot(reason, force = false, minIntervalMs = 20000) {
        try {
            return registry.saveSafetySnapshot(reason, { force, minIntervalMs });
        } catch (e) {
            console.warn('⚠️ PEGASUS MOBILE DATA SAFETY: Snapshot skipped.', e);
            return false;
        }
    }

    let bootstrapState = null;
    try {
        bootstrapState = registry.bootstrap();
        console.log('🧳 PEGASUS MOBILE DATA SAFETY: Active.', bootstrapState);
    } catch (e) {
        console.error('❌ PEGASUS MOBILE DATA SAFETY: Bootstrap failed.', e);
    }

    window.__pegasusMobileDataMigrationInstalled = true;
    window.PegasusMobileDataSafety = {
        installed: true,
        getState: () => bootstrapState || registry.lastBootstrapState || null,
        snapshot: (reason = 'manual') => safeSnapshot(reason, true, 0),
        latestBackupMeta: () => registry.getLatestBackupMeta?.() || null
    };

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            safeSnapshot('visibility-hidden');
        }
    });

    window.addEventListener('pagehide', () => {
        safeSnapshot('pagehide');
    });

    window.addEventListener('beforeunload', () => {
        safeSnapshot('beforeunload');
    });
})();
