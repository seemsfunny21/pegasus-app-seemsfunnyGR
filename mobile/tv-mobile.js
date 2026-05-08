/* ==========================================================================
   📺 PEGASUS MODULE: MOBILE TV PROGRAM (v1.0.249)
   Protocol: Separate mobile module | External EPG viewer + quick TV guide links
   ========================================================================== */

(function() {
    const TV_PREF_KEY = 'pegasus_tv_program_pref_v1';

    const SOURCES = [
        {
            id: 'programmatileorasis',
            label: 'Πρόγραμμα TV',
            short: 'Όλα',
            icon: '📺',
            url: 'https://programmatileorasis.gr/',
            note: 'Όλα τα κανάλια'
        },
        {
            id: 'digea',
            label: 'Digea EPG',
            short: 'Digea',
            icon: '🛰️',
            url: 'https://www.digea.gr/el/tv-stations/electronic-program-guide',
            note: 'Επίσημος οδηγός EPG'
        },
        {
            id: 'ert',
            label: 'ΕΡΤ πρόγραμμα',
            short: 'ΕΡΤ',
            icon: '🇬🇷',
            url: 'https://www.ert.gr/tv-program/',
            note: 'ΕΡΤ1 / ΕΡΤ2 / ΕΡΤ3 / ERTNEWS'
        },
        {
            id: 'athinorama',
            label: 'Ταινίες TV σήμερα',
            short: 'Ταινίες',
            icon: '🎬',
            url: 'https://www.athinorama.gr/tv/programma/simera',
            note: 'Ταινίες και σημερινό πρόγραμμα'
        },
        {
            id: 'zappit',
            label: 'Zappit TV',
            short: 'Zappit',
            icon: '🗓️',
            url: 'https://www.zappit.gr/tv-program',
            note: 'Ελεύθερα και συνδρομητικά κανάλια'
        }
    ];

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function readPref() {
        try {
            const parsed = JSON.parse(localStorage.getItem(TV_PREF_KEY) || '{}');
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (_) {
            return {};
        }
    }

    function writePref(next) {
        const payload = {
            ...(readPref() || {}),
            ...(next || {}),
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem(TV_PREF_KEY, JSON.stringify(payload));

        try {
            window.PegasusCloud?.queuePendingChange?.(TV_PREF_KEY, localStorage.getItem(TV_PREF_KEY), 'set');
        } catch (_) {}
    }

    function getSource(id) {
        return SOURCES.find(source => source.id === id) || SOURCES[0];
    }

    function injectStyles() {
        if (document.getElementById('pegasus-tv-mobile-styles')) return;

        const style = document.createElement('style');
        style.id = 'pegasus-tv-mobile-styles';
        style.textContent = `
            #tv_program .pegasus-tv-hero {
                width: 100%;
                border: 1px solid var(--main);
                border-radius: 22px;
                padding: 16px;
                box-sizing: border-box;
                background: linear-gradient(145deg, rgba(0,255,65,0.08), rgba(12,12,12,0.96));
                box-shadow: 0 0 22px rgba(0,255,65,0.10);
                margin-bottom: 14px;
                text-align: left;
            }
            #tv_program .pegasus-tv-live-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                margin-bottom: 8px;
            }
            #tv_program .pegasus-tv-title {
                font-size: 18px;
                font-weight: 900;
                color: #fff;
                letter-spacing: 0.5px;
                text-transform: none;
            }
            #tv_program .pegasus-tv-clock {
                color: var(--main);
                font-size: 12px;
                font-weight: 900;
                font-variant-numeric: tabular-nums;
                white-space: nowrap;
            }
            #tv_program .pegasus-tv-sub {
                color: #888;
                font-size: 10px;
                line-height: 1.45;
                font-weight: 800;
            }
            #tv_program .pegasus-tv-source-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 9px;
                width: 100%;
                margin: 12px 0 14px;
            }
            #tv_program .pegasus-tv-source-btn {
                border: 1px solid rgba(0,255,65,0.55);
                color: var(--main);
                background: rgba(0,0,0,0.65);
                border-radius: 14px;
                padding: 12px 8px;
                font-size: 10px;
                font-weight: 900;
                min-height: 50px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                text-transform: none;
            }
            #tv_program .pegasus-tv-source-btn.active {
                background: rgba(0,255,65,0.14);
                border-color: var(--main);
                color: #fff;
                box-shadow: 0 0 14px rgba(0,255,65,0.16);
            }
            #tv_program .pegasus-tv-viewer {
                width: 100%;
                border: 1px solid rgba(0,255,65,0.50);
                border-radius: 18px;
                background: #050505;
                overflow: hidden;
                box-sizing: border-box;
                margin-top: 10px;
            }
            #tv_program .pegasus-tv-frame-toolbar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                padding: 10px;
                border-bottom: 1px solid rgba(0,255,65,0.25);
                background: rgba(0,255,65,0.05);
            }
            #tv_program .pegasus-tv-frame-label {
                color: #fff;
                font-size: 10px;
                font-weight: 900;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                text-align: left;
            }
            #tv_program .pegasus-tv-frame {
                width: 100%;
                height: min(62vh, 520px);
                min-height: 360px;
                border: 0;
                background: #fff;
                display: block;
            }
            #tv_program .pegasus-tv-note {
                margin: 10px 0 0;
                padding: 10px 12px;
                border: 1px dashed rgba(0,255,65,0.28);
                border-radius: 14px;
                color: #888;
                background: rgba(255,255,255,0.03);
                font-size: 10px;
                line-height: 1.45;
                font-weight: 800;
                text-align: left;
            }
            #tv_program .pegasus-tv-channel-strip {
                width: 100%;
                display: flex;
                gap: 8px;
                overflow-x: auto;
                padding: 2px 0 10px;
                scrollbar-width: none;
                -webkit-overflow-scrolling: touch;
            }
            #tv_program .pegasus-tv-channel-strip::-webkit-scrollbar { display: none; }
            #tv_program .pegasus-tv-chip {
                flex: 0 0 auto;
                border: 1px solid rgba(255,255,255,0.13);
                border-radius: 999px;
                padding: 8px 11px;
                color: #ddd;
                background: rgba(255,255,255,0.05);
                font-size: 10px;
                font-weight: 900;
                letter-spacing: 0.4px;
            }
        `;
        document.head.appendChild(style);
    }

    function injectViewLayer() {
        if (document.getElementById('tv_program')) return;

        injectStyles();

        const viewDiv = document.createElement('div');
        viewDiv.id = 'tv_program';
        viewDiv.className = 'view';
        viewDiv.innerHTML = `
            <button class="btn-back" onclick="openView('home')">◀ Επιστροφή</button>
            <div class="section-title">ΠΡΟΓΡΑΜΜΑ ΤΗΛΕΟΡΑΣΗΣ</div>

            <div class="pegasus-tv-hero">
                <div class="pegasus-tv-live-row">
                    <div class="pegasus-tv-title">📺 PEGASUS TV</div>
                    <div id="pegasusTvClock" class="pegasus-tv-clock">--:--</div>
                </div>
                <div class="pegasus-tv-sub">
                    Γρήγορη προβολή οδηγού TV μέσα στο mobile. Αν κάποια σελίδα μπλοκάρει την εσωτερική προβολή, πάτα «Άνοιγμα σε Chrome».
                </div>
            </div>

            <div class="pegasus-tv-channel-strip" aria-label="Γρήγορα κανάλια">
                <span class="pegasus-tv-chip">MEGA</span>
                <span class="pegasus-tv-chip">ANT1</span>
                <span class="pegasus-tv-chip">ALPHA</span>
                <span class="pegasus-tv-chip">STAR</span>
                <span class="pegasus-tv-chip">ΣΚΑΪ</span>
                <span class="pegasus-tv-chip">OPEN</span>
                <span class="pegasus-tv-chip">ΕΡΤ</span>
            </div>

            <div id="pegasusTvSourceGrid" class="pegasus-tv-source-grid"></div>

            <div class="compact-grid" style="width:100%; gap:10px; margin-bottom: 10px;">
                <button class="primary-btn" style="padding: 13px; font-size: 10px;" onclick="window.PegasusTV.openCurrent()">Άνοιγμα σε Chrome</button>
                <button class="secondary-btn" style="padding: 13px; font-size: 10px;" onclick="window.PegasusTV.refreshFrame()">Ανανέωση</button>
            </div>

            <div class="pegasus-tv-viewer">
                <div class="pegasus-tv-frame-toolbar">
                    <div id="pegasusTvFrameLabel" class="pegasus-tv-frame-label">Φόρτωση προγράμματος...</div>
                    <button class="secondary-btn" style="width:auto; padding: 7px 10px; border-radius: 10px; font-size: 9px;" onclick="window.PegasusTV.toggleFrame()">Προβολή</button>
                </div>
                <iframe id="pegasusTvFrame" class="pegasus-tv-frame" title="Πρόγραμμα τηλεόρασης" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
            </div>

            <div class="pegasus-tv-note" style="margin-bottom: 85px;">
                Το module δεν αποθηκεύει τηλεοπτικά δεδομένα. Δείχνει live οδηγούς TV από εξωτερικές σελίδες. Ορισμένες σελίδες μπορεί να μη φορτώσουν μέσα σε iframe λόγω πολιτικής ασφαλείας· τότε χρησιμοποίησε το κουμπί Chrome.
            </div>
        `;
        document.body.appendChild(viewDiv);
    }

    window.PegasusTV = {
        activeSourceId: 'programmatileorasis',
        frameVisible: true,
        clockTimer: null,

        init: function() {
            injectViewLayer();
            const pref = readPref();
            this.activeSourceId = pref.activeSourceId || 'programmatileorasis';
            this.renderSources();
            this.updateFrame();
            this.startClock();
        },

        startClock: function() {
            if (this.clockTimer) return;
            const update = () => {
                const el = document.getElementById('pegasusTvClock');
                if (!el) return;
                const now = new Date();
                el.textContent = now.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' });
            };
            update();
            this.clockTimer = window.setInterval(update, 30000);
        },

        renderSources: function() {
            const grid = document.getElementById('pegasusTvSourceGrid');
            if (!grid) return;

            grid.innerHTML = SOURCES.map(source => `
                <button type="button" class="pegasus-tv-source-btn ${source.id === this.activeSourceId ? 'active' : ''}"
                        onclick="window.PegasusTV.setSource('${escapeHtml(source.id)}')">
                    <span>${escapeHtml(source.icon)}</span>
                    <span>${escapeHtml(source.short)}</span>
                </button>
            `).join('');
        },

        setSource: function(id) {
            const source = getSource(id);
            this.activeSourceId = source.id;
            writePref({ activeSourceId: source.id });
            this.renderSources();
            this.updateFrame();
        },

        getCurrentSource: function() {
            return getSource(this.activeSourceId);
        },

        updateFrame: function() {
            const source = this.getCurrentSource();
            const frame = document.getElementById('pegasusTvFrame');
            const label = document.getElementById('pegasusTvFrameLabel');
            if (label) label.textContent = `${source.icon} ${source.label} · ${source.note}`;
            if (frame) frame.src = source.url;
        },

        refreshFrame: function() {
            const frame = document.getElementById('pegasusTvFrame');
            if (!frame) return;
            const source = this.getCurrentSource();
            frame.src = 'about:blank';
            window.setTimeout(() => { frame.src = source.url; }, 120);
        },

        toggleFrame: function() {
            const frame = document.getElementById('pegasusTvFrame');
            if (!frame) return;
            this.frameVisible = !this.frameVisible;
            frame.style.display = this.frameVisible ? 'block' : 'none';
        },

        openCurrent: function() {
            const source = this.getCurrentSource();
            window.open(source.url, '_blank', 'noopener,noreferrer');
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        window.PegasusTV.init();

        if (window.registerPegasusModule) {
            window.registerPegasusModule({
                id: 'tv_program',
                label: 'Τηλεόραση',
                icon: '📺',
                sortOrder: 90
            });
        }
    });
})();
