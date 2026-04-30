/* ==========================================================================
   PEGASUS UI DIALOGS - v1.1 SAFE
   Protocol: Themed Alerts / Confirms / Prompts
   ========================================================================== */
(function() {
    if (window.pegasusAlert && window.pegasusConfirm && window.pegasusPrompt) return;

    const overlayId = 'pegasus-dialog-overlay';
    let activeResolver = null;

    function tr(text) {
        try {
            if (window.PegasusI18n?.translateLoose) return window.PegasusI18n.translateLoose(text);
        } catch (e) {}
        return text;
    }

    function ensureDialogHost() {
        let overlay = document.getElementById(overlayId);
        if (overlay) return overlay;

        const style = document.createElement('style');
        style.textContent = `
            #${overlayId} {
                position: fixed;
                inset: 0;
                display: none;
                align-items: center;
                justify-content: center;
                background: rgba(0,0,0,0.72);
                backdrop-filter: blur(8px);
                z-index: 1000001;
                padding: 20px;
            }
            #${overlayId}.open { display: flex; }
            #${overlayId} .pegasus-dialog {
                width: min(92vw, 420px);
                background: #0a0f0a;
                border: 1px solid #2e7d32;
                border-radius: 22px;
                box-shadow: 0 0 30px rgba(76,175,80,0.2), 0 10px 40px rgba(0,0,0,0.55);
                color: #ecf6ec;
                overflow: hidden;
                font-family: inherit;
            }
            #${overlayId} .pegasus-dialog-header {
                padding: 16px 20px 10px;
                color: #4CAF50;
                font-size: 13px;
                font-weight: 900;
                letter-spacing: 1.5px;
                text-transform: uppercase;
                border-bottom: 1px solid rgba(76,175,80,0.15);
            }
            #${overlayId} .pegasus-dialog-body {
                padding: 18px 20px 14px;
                font-size: 14px;
                line-height: 1.5;
                white-space: pre-line;
            }
            #${overlayId} .pegasus-dialog-input {
                width: calc(100% - 40px);
                margin: 0 20px 16px;
                padding: 12px 14px;
                background: #050805;
                color: #ecf6ec;
                border: 1px solid #355f37;
                border-radius: 14px;
                font-size: 14px;
                box-sizing: border-box;
            }
            #${overlayId} .pegasus-dialog-actions {
                display: flex;
                gap: 10px;
                padding: 0 20px 20px;
            }
            #${overlayId} .pegasus-dialog-btn {
                flex: 1;
                border: 1px solid #355f37;
                background: #101710;
                color: #dff2df;
                border-radius: 14px;
                padding: 12px 14px;
                font-weight: 800;
                cursor: pointer;
                transition: 0.2s ease;
            }
            #${overlayId} .pegasus-dialog-btn.primary {
                background: #4CAF50;
                color: #041104;
                border-color: #4CAF50;
            }
            #${overlayId} .pegasus-dialog-btn:hover { transform: translateY(-1px); }
        `;
        document.head.appendChild(style);

        overlay = document.createElement('div');
        overlay.id = overlayId;
        overlay.innerHTML = `
            <div class="pegasus-dialog" role="dialog" aria-modal="true">
                <div class="pegasus-dialog-header"></div>
                <div class="pegasus-dialog-body"></div>
                <input class="pegasus-dialog-input" style="display:none;">
                <div class="pegasus-dialog-actions"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay && activeResolver) activeResolver(null);
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && overlay.classList.contains('open') && activeResolver) {
                activeResolver(null);
            }
        });

        return overlay;
    }

    function showDialog(opts) {
        return new Promise(resolve => {
            const overlay = ensureDialogHost();
            const header = overlay.querySelector('.pegasus-dialog-header');
            const body = overlay.querySelector('.pegasus-dialog-body');
            const input = overlay.querySelector('.pegasus-dialog-input');
            const actions = overlay.querySelector('.pegasus-dialog-actions');

            header.textContent = tr(opts.title || 'PEGASUS');
            body.textContent = tr(opts.message || '');
            actions.innerHTML = '';
            input.style.display = opts.type === 'prompt' ? 'block' : 'none';
            input.value = opts.defaultValue ?? '';

            const finish = (value) => {
                overlay.classList.remove('open');
                activeResolver = null;
                resolve(value);
            };
            activeResolver = finish;

            (opts.buttons || []).forEach(btn => {
                const el = document.createElement('button');
                el.className = 'pegasus-dialog-btn' + (btn.primary ? ' primary' : '');
                el.textContent = tr(btn.label);
                el.onclick = () => finish(btn.getValue ? btn.getValue(input.value) : btn.value);
                actions.appendChild(el);
            });

            overlay.classList.add('open');
            setTimeout(() => {
                if (opts.type === 'prompt') input.focus();
                else overlay.querySelector('.pegasus-dialog-btn.primary, .pegasus-dialog-btn')?.focus();
            }, 0);
        });
    }

    window.pegasusAlert = function(message, title) {
        return showDialog({
            type: 'alert',
            title: title || 'PEGASUS',
            message,
            buttons: [{ label: 'OK', value: true, primary: true }]
        });
    };

    window.pegasusConfirm = function(message, title) {
        return showDialog({
            type: 'confirm',
            title: title || 'PEGASUS',
            message,
            buttons: [
                { label: 'ΑΚΥΡΟ', value: false },
                { label: 'OK', value: true, primary: true }
            ]
        }).then(v => !!v);
    };

    window.pegasusPrompt = function(message, defaultValue, title) {
        return showDialog({
            type: 'prompt',
            title: title || 'PEGASUS',
            message,
            defaultValue: defaultValue || '',
            buttons: [
                { label: 'ΑΚΥΡΟ', value: null },
                { label: 'ΑΠΟΘΗΚΕΥΣΗ', primary: true, getValue: (val) => val }
            ]
        });
    };

    window.alert = function(message) { return window.pegasusAlert(message); };
    window.confirm = function(message) { return window.pegasusConfirm(message); };
    window.prompt = function(message, defaultValue) { return window.pegasusPrompt(message, defaultValue); };
})();
