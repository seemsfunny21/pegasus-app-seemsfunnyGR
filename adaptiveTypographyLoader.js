(function () {
    const VERSION = '19.8';
    const LOADER_FLAG = '__pegasusAdaptiveTypographyLoaderInstalled';
    const SCRIPT_FLAG = 'pegasus-adaptive-typography-runtime';

    if (window[LOADER_FLAG]) return;
    window[LOADER_FLAG] = true;

    function getRuntimePath() {
        const path = String(window.location.pathname || '').toLowerCase();
        return path.includes('/mobile/') || path.endsWith('/mobile.html')
            ? '../adaptiveTypography.js?v=' + VERSION
            : './adaptiveTypography.js?v=' + VERSION;
    }

    function ensureLoaded() {
        if (window.PegasusAdaptiveTypography) {
            try { window.PegasusAdaptiveTypography.refresh?.(); } catch (e) {}
            return;
        }

        if (document.getElementById(SCRIPT_FLAG)) return;

        const script = document.createElement('script');
        script.id = SCRIPT_FLAG;
        script.src = getRuntimePath();
        script.onload = function () {
            console.log('🔤 PEGASUS TYPOGRAPHY LOADER: Runtime attached.');
            try { window.PegasusAdaptiveTypography?.refresh?.(); } catch (e) {}
        };
        script.onerror = function (err) {
            console.error('❌ PEGASUS TYPOGRAPHY LOADER: Failed to load runtime.', err);
        };
        document.head.appendChild(script);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureLoaded, { once: true });
    } else {
        ensureLoaded();
    }

    window.addEventListener('load', ensureLoaded, { once: true });
})();
