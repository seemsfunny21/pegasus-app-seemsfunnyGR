/* ==========================================================================
   PEGASUS MOBILE SHELL LAYOUT v1.0.261
   Three-zone mobile layout: top controls, middle scroll content, bottom ghost zone.
   ========================================================================== */
(function () {
    'use strict';

    const MID_CLASS = 'pegasus-mobile-mid';
    const TOP_SELECTORS = ['.btn-back', '.header'];

    function isViewNode(node) {
        return !!(node && node.nodeType === 1 && (node.classList?.contains('view') || node.classList?.contains('view-layer')));
    }

    function getTopNode(view) {
        const children = Array.from(view.children || []);
        return children.find(child => TOP_SELECTORS.some(selector => child.matches?.(selector))) || null;
    }

    function ensureMidWrapper(view) {
        if (!isViewNode(view)) return null;
        if (view.id === 'pinModal') return null;

        const topNode = getTopNode(view);
        let mid = Array.from(view.children || []).find(child => child.classList?.contains(MID_CLASS)) || null;

        if (!mid) {
            mid = document.createElement('div');
            mid.className = MID_CLASS;
            mid.setAttribute('data-pegasus-scroll-zone', 'middle');

            if (topNode && topNode.parentNode === view) {
                topNode.insertAdjacentElement('afterend', mid);
            } else if (view.firstChild) {
                view.insertBefore(mid, view.firstChild);
            } else {
                view.appendChild(mid);
            }
        }

        Array.from(view.children || []).forEach(child => {
            if (child === topNode || child === mid) return;
            if (child.classList?.contains(MID_CLASS)) return;
            mid.appendChild(child);
        });

        view.classList.add('pegasus-shell-view');
        return mid;
    }

    function applyShellLayout() {
        document.querySelectorAll('.view, .view-layer').forEach(ensureMidWrapper);
    }

    let scheduled = false;
    function scheduleApply() {
        if (scheduled) return;
        scheduled = true;
        window.requestAnimationFrame(() => {
            scheduled = false;
            applyShellLayout();
        });
    }

    function installObserver() {
        if (!document.body || document.body.__pegasusShellLayoutObserver) return;
        document.body.__pegasusShellLayoutObserver = true;

        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (!mutation.addedNodes?.length) continue;
                for (const node of mutation.addedNodes) {
                    if (isViewNode(node) || node.querySelector?.('.view, .view-layer')) {
                        scheduleApply();
                        return;
                    }
                    if (node.parentElement && isViewNode(node.parentElement)) {
                        scheduleApply();
                        return;
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    window.PegasusMobileShellLayout = {
        version: '1.0.261',
        refresh: applyShellLayout,
        wrapView: ensureMidWrapper
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            applyShellLayout();
            installObserver();
            window.setTimeout(applyShellLayout, 0);
            window.setTimeout(applyShellLayout, 250);
        }, { once: true });
    } else {
        applyShellLayout();
        installObserver();
        window.setTimeout(applyShellLayout, 0);
        window.setTimeout(applyShellLayout, 250);
    }

    console.log('🧱 PEGASUS MOBILE SHELL: Three-zone layout active (v1.0.261).');
})();
