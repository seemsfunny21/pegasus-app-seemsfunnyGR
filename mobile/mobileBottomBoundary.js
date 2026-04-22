
(function () {
    const DEFAULT_RESERVE = 48;
    const EXTRA_BREATHING_ROOM = 0;

    function getViewportHeight() {
        try {
            if (window.visualViewport && window.visualViewport.height) {
                return window.visualViewport.height;
            }
        } catch (e) {}
        return window.innerHeight || document.documentElement.clientHeight || 0;
    }

    function clampReserve(value) {
        const num = Number(value) || 0;
        return Math.max(36, Math.min(140, Math.round(num)));
    }

    function applyBottomBoundary() {
        const root = document.documentElement;
        const overlay = document.querySelector('.ghost-nav-overlay');
        if (!root || !overlay) return null;

        const rect = overlay.getBoundingClientRect();
        const viewportHeight = getViewportHeight();
        const reserve = clampReserve((viewportHeight - rect.top) + EXTRA_BREATHING_ROOM);
        const buttonHeight = clampReserve(rect.height || 35);

        root.style.setProperty('--pg-ghost-nav-reserve', reserve + 'px');
        root.style.setProperty('--pg-ghost-nav-height', buttonHeight + 'px');
        root.style.setProperty('--pg-ghost-nav-bottom', Math.max(0, Math.round(viewportHeight - rect.bottom)) + 'px');
        root.setAttribute('data-mobile-bottom-boundary', 'active');

        window.PegasusMobileBottomBoundary = {
            installed: true,
            getState() {
                return {
                    reserve,
                    buttonHeight,
                    viewportHeight,
                    overlayTop: Math.round(rect.top),
                    overlayBottom: Math.round(rect.bottom)
                };
            },
            refresh: applyBottomBoundary
        };

        return window.PegasusMobileBottomBoundary.getState();
    }

    function scheduleRefresh() {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                applyBottomBoundary();
            });
        });
    }

    window.addEventListener('load', scheduleRefresh, { once: true });
    window.addEventListener('resize', scheduleRefresh);
    window.addEventListener('orientationchange', scheduleRefresh);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) scheduleRefresh();
    });

    setTimeout(scheduleRefresh, 120);
    setTimeout(scheduleRefresh, 600);

    console.log('📐 PEGASUS MOBILE BOTTOM BOUNDARY: Active.');
})();
