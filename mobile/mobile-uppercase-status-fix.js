(function() {
    function stripGreekUpperDiacritics(text) {
        if (!text) return "";
        return String(text)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/Ά/g, 'Α')
            .replace(/Έ/g, 'Ε')
            .replace(/Ή/g, 'Η')
            .replace(/Ί/g, 'Ι')
            .replace(/Ό/g, 'Ο')
            .replace(/Ύ/g, 'Υ')
            .replace(/Ώ/g, 'Ω')
            .replace(/Ϊ/g, 'Ι')
            .replace(/Ϋ/g, 'Υ');
    }

    function toPegasusGreekCaps(text) {
        return stripGreekUpperDiacritics(text).toUpperCase();
    }

    window.PegasusMobileText = window.PegasusMobileText || {};
    window.PegasusMobileText.toPegasusGreekCaps = toPegasusGreekCaps;

    function patchOracleDashboard() {
        if (!window.PegasusOracle || window.PegasusOracle.__capsPatchInstalled) return false;

        const originalInjectDashboard = window.PegasusOracle.injectDashboard;
        if (typeof originalInjectDashboard !== 'function') return false;

        window.PegasusOracle.injectDashboard = function() {
            const grid = document.getElementById('dynamic-grid');
            if (!grid || (window.PegasusMobileUI && window.PegasusMobileUI.currentPage !== 0)) return;

            const existing = document.getElementById('oracle-dashboard');
            if (existing) existing.remove();

            const rows = typeof window.PegasusOracle.analyzeData === 'function'
                ? window.PegasusOracle.analyzeData()
                : [];

            const dashboard = document.createElement('div');
            dashboard.id = 'oracle-dashboard';
            dashboard.style.cssText = `
                grid-column: 1 / -1;
                background: linear-gradient(145deg, rgba(15,15,15,0.95) 0%, rgba(5,5,5,0.95) 100%);
                border: 1px solid var(--main);
                border-radius: 16px;
                padding: 15px;
                margin-bottom: 8px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                box-sizing: border-box;
            `;

            dashboard.innerHTML = rows.map(row => `
                <div style="display: flex; align-items: flex-start; gap: 10px; width: 100%;">
                    <div style="font-size: 16px; margin-top: -2px; flex-shrink: 0;">${row.icon}</div>
                    <div style="font-size: 11px; color: ${row.color}; font-weight: 700; line-height: 1.4; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">
                        ${toPegasusGreekCaps(row.txt)}
                    </div>
                </div>
            `).join('');

            grid.insertBefore(dashboard, grid.firstChild);
        };

        window.PegasusOracle.__capsPatchInstalled = true;
        window.PegasusOracle.__originalInjectDashboard = originalInjectDashboard;
        return true;
    }

    if (!patchOracleDashboard()) {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(patchOracleDashboard, 0);
            setTimeout(() => window.PegasusOracle?.injectDashboard?.(), 120);
        });
    }
})();
