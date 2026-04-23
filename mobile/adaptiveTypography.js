(function () {
    const STYLE_ID = 'pegasus-adaptive-typography-style';
    console.log('🔤 PEGASUS ADAPTIVE TYPOGRAPHY: Runtime booting.');
    const RESIZE_DEBOUNCE_MS = 80;
    let resizeTimer = null;

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function roundHalf(value) {
        return Math.round(value * 2) / 2;
    }

    function isMobileRuntime() {
        const path = String(window.location.pathname || '').toLowerCase();
        return path.includes('/mobile/') || path.endsWith('/mobile.html');
    }

    function getViewportSnapshot() {
        const width = window.innerWidth || document.documentElement.clientWidth || screen.width || 390;
        const height = window.innerHeight || document.documentElement.clientHeight || screen.height || 844;
        const shortestSide = Math.min(width, height);
        const orientation = width > height ? 'landscape' : 'portrait';
        const pixelRatio = window.devicePixelRatio || 1;

        return {
            width,
            height,
            shortestSide,
            orientation,
            pixelRatio
        };
    }

    function computeMobileTypography(viewport) {
        let base = 16;
        let tier = 'mobile-standard';

        if (viewport.shortestSide <= 340) {
            base = 15;
            tier = 'mobile-compact';
        } else if (viewport.shortestSide <= 390) {
            base = 16;
            tier = 'mobile-standard';
        } else if (viewport.shortestSide <= 430) {
            base = 16.5;
            tier = 'mobile-large';
        } else if (viewport.shortestSide <= 768) {
            base = 17;
            tier = 'tablet';
        } else {
            base = 18;
            tier = 'desktop-touch';
        }

        if (viewport.orientation === 'landscape' && viewport.height <= 420) {
            base -= 0.5;
        }

        base = roundHalf(clamp(base, 15, 18));

        return {
            mode: 'mobile',
            tier,
            base,
            vars: {
                '--pg-font-body': `${base}px`,
                '--pg-font-ui': `${roundHalf(base - 0.5)}px`,
                '--pg-font-sync': `${roundHalf(base - 5)}px`,
                '--pg-font-mobile-title': `${roundHalf(clamp(base * 2.35, 33, 42))}px`,
                '--pg-font-mobile-subtitle': `${roundHalf(clamp(base - 5.5, 10, 13))}px`,
                '--pg-font-mobile-tile-icon': `${roundHalf(clamp(base + 10, 24, 30))}px`,
                '--pg-font-mobile-tile-label': `${roundHalf(clamp(base - 7, 9, 12))}px`,
                '--pg-font-mobile-button': `${roundHalf(clamp(base - 4, 11, 14))}px`,
                '--pg-font-mobile-back': `${roundHalf(clamp(base - 6, 10, 13))}px`,
                '--pg-font-mobile-mini-label': `${roundHalf(clamp(base - 7, 9, 12))}px`,
                '--pg-font-mobile-mini-value': `${roundHalf(clamp(base, 16, 20))}px`,
                '--pg-font-mobile-section-title': `${roundHalf(clamp(base - 5, 11, 14))}px`,
                '--pg-font-mobile-input-label': `${roundHalf(clamp(base - 7, 9, 12))}px`
            }
        };
    }

    function computeDesktopTypography(viewport) {
        let base = 17;
        let tier = 'desktop-standard';

        if (viewport.width <= 1180) {
            base = 16;
            tier = 'desktop-compact';
        } else if (viewport.width <= 1440) {
            base = 17;
            tier = 'desktop-standard';
        } else if (viewport.width <= 1920) {
            base = 17.5;
            tier = 'desktop-large';
        } else {
            base = 18;
            tier = 'desktop-xl';
        }

        if (viewport.height <= 760) {
            base -= 0.5;
        }

        base = roundHalf(clamp(base, 15.5, 18.5));

        return {
            mode: 'desktop',
            tier,
            base,
            vars: {
                '--pg-font-body': `${base}px`,
                '--pg-font-nav': `${roundHalf(clamp(base - 2.5, 12, 16))}px`,
                '--pg-font-ui': `${roundHalf(clamp(base - 3, 12, 16))}px`,
                '--pg-font-exercise': `${roundHalf(clamp(base - 2.5, 13, 16))}px`,
                '--pg-font-status': `${roundHalf(clamp(base - 5, 10, 13))}px`,
                '--pg-font-panel-title': `${roundHalf(clamp(base, 17, 21))}px`,
                '--pg-font-panel-number': `${roundHalf(clamp(base + 1.5, 18, 24))}px`,
                '--pg-font-input': `${roundHalf(clamp(base, 16, 18))}px`
            }
        };
    }

    function ensureStyleTag() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
html[data-pegasus-typography='desktop'] body,
html[data-pegasus-typography='desktop'] button,
html[data-pegasus-typography='desktop'] select,
html[data-pegasus-typography='desktop'] textarea {
    font-size: var(--pg-font-body, 17px);
}

html[data-pegasus-typography='desktop'] input[type='number'],
html[data-pegasus-typography='desktop'] input[type='text'],
html[data-pegasus-typography='desktop'] input[type='password'] {
    font-size: var(--pg-font-input, 16px) !important;
}

html[data-pegasus-typography='desktop'] .navbar button {
    font-size: var(--pg-font-nav, 14px) !important;
}

html[data-pegasus-typography='desktop'] .p-btn,
html[data-pegasus-typography='desktop'] .weather-text,
html[data-pegasus-typography='desktop'] .workout-count-text,
html[data-pegasus-typography='desktop'] #totalProgressContainer,
html[data-pegasus-typography='desktop'] .status,
html[data-pegasus-typography='desktop'] .control-buttons button,
html[data-pegasus-typography='desktop'] .info-display {
    font-size: var(--pg-font-ui, 13px) !important;
}

html[data-pegasus-typography='desktop'] .exercise-name {
    font-size: var(--pg-font-exercise, 14px) !important;
}

html[data-pegasus-typography='desktop'] .set-counter,
html[data-pegasus-typography='desktop'] .total-kcal-display,
html[data-pegasus-typography='desktop'] .panel-stat-number {
    font-size: var(--pg-font-panel-number, 19px) !important;
}

html[data-pegasus-typography='desktop'] .pegasus-panel h3,
html[data-pegasus-typography='desktop'] .panel-title,
html[data-pegasus-typography='desktop'] .section-title {
    font-size: var(--pg-font-panel-title, 17px) !important;
}

html[data-pegasus-typography='desktop'] .status {
    font-size: var(--pg-font-status, 11px) !important;
}

html[data-pegasus-typography='mobile'] body,
html[data-pegasus-typography='mobile'] button,
html[data-pegasus-typography='mobile'] select,
html[data-pegasus-typography='mobile'] textarea,
html[data-pegasus-typography='mobile'] input {
    font-size: var(--pg-font-body, 16px);
}

html[data-pegasus-typography='mobile'] #sync-indicator {
    font-size: var(--pg-font-sync, 10px) !important;
}

html[data-pegasus-typography='mobile'] .header h1 {
    font-size: var(--pg-font-mobile-title, 38px) !important;
}

html[data-pegasus-typography='mobile'] .header p {
    font-size: var(--pg-font-mobile-subtitle, 10px) !important;
}

html[data-pegasus-typography='mobile'] .tile-icon {
    font-size: var(--pg-font-mobile-tile-icon, 26px) !important;
}

html[data-pegasus-typography='mobile'] .tile-label {
    font-size: var(--pg-font-mobile-tile-label, 9px) !important;
}

html[data-pegasus-typography='mobile'] .primary-btn {
    font-size: var(--pg-font-mobile-button, 12px) !important;
}

html[data-pegasus-typography='mobile'] .secondary-btn,
html[data-pegasus-typography='mobile'] .btn-back {
    font-size: var(--pg-font-mobile-back, 11px) !important;
}

html[data-pegasus-typography='mobile'] .mini-label {
    font-size: var(--pg-font-mobile-mini-label, 9px) !important;
}

html[data-pegasus-typography='mobile'] .mini-val {
    font-size: var(--pg-font-mobile-mini-value, 16px) !important;
}

html[data-pegasus-typography='mobile'] .section-title {
    font-size: var(--pg-font-mobile-section-title, 11px) !important;
}

html[data-pegasus-typography='mobile'] .input-label {
    font-size: var(--pg-font-mobile-input-label, 9px) !important;
}
        `;

        document.head.appendChild(style);
    }

    function applyTypography() {
        ensureStyleTag();

        const viewport = getViewportSnapshot();
        const runtime = isMobileRuntime() ? computeMobileTypography(viewport) : computeDesktopTypography(viewport);
        const root = document.documentElement;

        Object.entries(runtime.vars).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });

        root.setAttribute('data-pegasus-typography', runtime.mode);
        root.setAttribute('data-pegasus-typography-tier', runtime.tier);

        window.PegasusAdaptiveTypography.state = {
            ...viewport,
            mode: runtime.mode,
            tier: runtime.tier,
            base: runtime.base,
            vars: { ...runtime.vars }
        };

        return window.PegasusAdaptiveTypography.state;
    }

    function scheduleApply() {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(applyTypography, RESIZE_DEBOUNCE_MS);
    }

    window.PegasusAdaptiveTypography = {
        installed: true,
        state: null,
        apply: applyTypography,
        refresh: applyTypography,
        getState: function () {
            return this.state || applyTypography();
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyTypography, { once: true });
    } else {
        applyTypography();
    }

    window.addEventListener('load', applyTypography, { once: true });
    window.addEventListener('resize', scheduleApply);
    window.addEventListener('orientationchange', scheduleApply);
    console.log('✅ PEGASUS ADAPTIVE TYPOGRAPHY: Active.');
})();
