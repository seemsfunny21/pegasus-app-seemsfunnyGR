    /* PEGASUS ANTI-AUTOCOMPLETE PROTOCOL */
    document.addEventListener("DOMContentLoaded", function() {
        document.querySelectorAll('input').forEach(input => {
            input.setAttribute('autocomplete', 'off');
            input.setAttribute('autocorrect', 'off');
            input.setAttribute('autocapitalize', 'off');
            input.setAttribute('spellcheck', 'false');
        });
    });

    /* 📊 DYNAMIC UI BRIDGE (v16.4 ALIGNED) */
    window.forcePegasusRender = function() {
        if (window.MuscleProgressUI && typeof window.MuscleProgressUI.render === "function") {
            window.MuscleProgressUI.render(true);
        } else {
            console.warn("⚠️ PEGASUS: MuscleProgressUI module not loaded yet.");
        }
    };

    const btnPreview = document.getElementById('btnPreviewUI');
    if (btnPreview) {
        btnPreview.addEventListener('click', () => { 
            setTimeout(window.forcePegasusRender, 200); 
        });
    }

    /* 🛡️ SERVICE WORKER & LOADER PROTOCOL */
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data && event.data.type === 'CACHE_PROGRESS') {
                const percent = event.data.percent;
                const loaderBar = document.querySelector('.loader-bar-fill');
                const loaderText = document.querySelector('.loader-text');
                if (loaderBar) loaderBar.style.width = percent + '%';
                if (loaderText) loaderText.textContent = `STORAGE INITIALIZATION: ${percent}%`;
                if (percent === 100) {
                    setTimeout(() => {
                        if (loaderText) loaderText.textContent = "SYSTEM READY - ENCRYPTED";
                    }, 500);
                }
            }
        });

        window.addEventListener('load', () => {
            const swPath = window.location.pathname.includes('mobile/') ? '../sw.js' : './sw.js';
            navigator.serviceWorker.register(swPath + '?v=3.20')
                .then(reg => reg.update())
                .catch(err => console.error("🛡️ SW Error:", err));
        });
    }
