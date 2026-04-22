
(function () {
    const DEFAULT_RESERVE = 48;
    const EXTRA_BREATHING_ROOM = 0;
    const CONTENT_GAP = 8;
    const HOME_GRID_GAP = 2;

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

    function applyViewBoundary(activeView, overlayRect, reserve) {
        if (!activeView || !overlayRect) return null;
        const viewRect = activeView.getBoundingClientRect();
        const isHome = activeView.id === 'home';
        const availableHeight = Math.max(140, Math.round(overlayRect.top - viewRect.top - CONTENT_GAP));

        activeView.style.boxSizing = 'border-box';
        activeView.style.minHeight = '0px';
        activeView.style.overflowX = 'hidden';

        let gridHeight = null;
        let homeGap = null;

        if (isHome) {
            activeView.style.height = 'auto';
            activeView.style.maxHeight = 'none';
            activeView.style.paddingBottom = '0px';
            activeView.style.scrollPaddingBottom = '0px';
            activeView.style.overflowY = 'hidden';

            const grid = document.getElementById('dynamic-grid');
            if (grid) {
                const gridRect = grid.getBoundingClientRect();
                homeGap = Math.max(0, Math.round(overlayRect.top - gridRect.top - HOME_GRID_GAP));
                gridHeight = Math.max(120, homeGap);
                grid.style.boxSizing = 'border-box';
                grid.style.height = gridHeight + 'px';
                grid.style.maxHeight = gridHeight + 'px';
                grid.style.minHeight = gridHeight + 'px';
                grid.style.paddingBottom = '0px';
                grid.style.scrollPaddingBottom = '0px';
                grid.style.overflowY = 'auto';
                grid.style.overflowX = 'hidden';
            }
        } else {
            activeView.style.height = availableHeight + 'px';
            activeView.style.maxHeight = availableHeight + 'px';
            activeView.style.paddingBottom = (reserve + 10) + 'px';
            activeView.style.scrollPaddingBottom = (reserve + 10) + 'px';
            activeView.style.overflowY = 'auto';
        }

        return { availableHeight, viewTop: Math.round(viewRect.top), gridHeight, homeGap };
    }

    function applyBottomBoundary() {
        const root = document.documentElement;
        const overlay = document.querySelector('.ghost-nav-overlay');
        const activeView = document.querySelector('.view.active');
        if (!root || !overlay) return null;

        const rect = overlay.getBoundingClientRect();
        const viewportHeight = getViewportHeight();
        const reserve = clampReserve((viewportHeight - rect.top) + EXTRA_BREATHING_ROOM);
        const buttonHeight = clampReserve(rect.height || 35);

        root.style.setProperty('--pg-ghost-nav-reserve', reserve + 'px');
        root.style.setProperty('--pg-ghost-nav-height', buttonHeight + 'px');
        root.style.setProperty('--pg-ghost-nav-bottom', Math.max(0, Math.round(viewportHeight - rect.bottom)) + 'px');
        root.setAttribute('data-mobile-bottom-boundary', 'active');

        const viewState = applyViewBoundary(activeView, rect, reserve);

        window.PegasusMobileBottomBoundary = {
            installed: true,
            getState() {
                return {
                    reserve,
                    buttonHeight,
                    viewportHeight,
                    overlayTop: Math.round(rect.top),
                    overlayBottom: Math.round(rect.bottom),
                    activeViewId: activeView?.id || null,
                    activeViewHeight: viewState?.availableHeight || null,
                    activeViewTop: viewState?.viewTop || null,
                    gridHeight: viewState?.gridHeight || null,
                    homeGap: viewState?.homeGap || null
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

    const observer = new MutationObserver(() => scheduleRefresh());
    window.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
        scheduleRefresh();
    }, { once: true });

    const originalOpenView = window.openView;
    if (typeof originalOpenView === 'function') {
        window.openView = function patchedOpenView(id) {
            const out = originalOpenView.apply(this, arguments);
            scheduleRefresh();
            setTimeout(scheduleRefresh, 60);
            return out;
        };
    }

    setTimeout(scheduleRefresh, 120);
    setTimeout(scheduleRefresh, 600);

    console.log('📐 PEGASUS MOBILE BOTTOM BOUNDARY: Home hotfix active.');
})();
