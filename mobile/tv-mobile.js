/* ============================================================================
   📺 PEGASUS MODULE: MOBILE TV PROGRAM (v1.1.250)
   Protocol: Separate mobile module | Six-channel live EPG cards + daily picks
   Channels: MEGA / ANT1 / ALPHA / STAR / SKAI / OPEN
   ============================================================================ */

(function() {
    'use strict';

    const TV_CACHE_KEY = 'pegasus_tv_program_cache_v2';
    const TV_PREF_KEY = 'pegasus_tv_program_pref_v2';
    const CACHE_TTL_MS = 1000 * 60 * 60 * 3;
    const CHANNELS = [
        {
            id: 'mega',
            name: 'MEGA',
            color: '#21d07a',
            aliases: [/^mega$/i, /mega channel/i, /megatv/i, /mega tv/i],
            guideUrl: 'https://www.megatv.com/tv-program/'
        },
        {
            id: 'ant1',
            name: 'ANT1',
            color: '#ff5a5f',
            aliases: [/^ant1$/i, /antenna/i, /ant1/i, /αντ1/i],
            guideUrl: 'https://www.antenna.gr/tv/program'
        },
        {
            id: 'alpha',
            name: 'ALPHA',
            color: '#f3d14b',
            aliases: [/^alpha$/i, /alpha tv/i, /alpha/i],
            guideUrl: 'https://www.alphatv.gr/show/programma/'
        },
        {
            id: 'star',
            name: 'STAR',
            color: '#4db8ff',
            aliases: [/^star$/i, /star channel/i, /star/i],
            guideUrl: 'https://www.star.gr/tv/programma'
        },
        {
            id: 'skai',
            name: 'ΣΚΑΪ',
            color: '#6ec6ff',
            aliases: [/skai/i, /σκαι/i, /σκαι/i, /σκάϊ/i, /σκαϊ/i],
            guideUrl: 'https://www.skaitv.gr/tv-program'
        },
        {
            id: 'open',
            name: 'OPEN',
            color: '#ff9f43',
            aliases: [/^open$/i, /open beyond/i, /open tv/i, /opentv/i],
            guideUrl: 'https://www.tvopen.gr/program'
        }
    ];

    const XMLTV_SOURCES = [
        {
            label: 'Greek TV App EPG',
            url: 'https://ext.greektv.app/epg/epg.xml',
            note: 'Ενημερώνεται καθημερινά'
        },
        {
            label: 'Greek XMLTV latest release',
            url: 'https://github.com/chrisliatas/greek-xmltv/releases/latest/download/grxmltv_nat_el.xml',
            note: 'Εναλλακτική XMLTV πηγή'
        }
    ];

    const FALLBACK_GUIDES = [
        { label: 'Digea EPG', url: 'https://www.digea.gr/el/tv-stations/electronic-program-guide' },
        { label: 'Programma Tileorasis', url: 'https://programmatileorasis.gr/' },
        { label: 'Zappit TV', url: 'https://www.zappit.gr/tv-program' }
    ];

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function normalizeText(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/ά/g, 'α')
            .replace(/έ/g, 'ε')
            .replace(/ή/g, 'η')
            .replace(/ί/g, 'ι')
            .replace(/ό/g, 'ο')
            .replace(/ύ/g, 'υ')
            .replace(/ώ/g, 'ω');
    }

    function readJSON(key, fallback) {
        try {
            const parsed = JSON.parse(localStorage.getItem(key) || 'null');
            return parsed == null ? fallback : parsed;
        } catch (_) {
            return fallback;
        }
    }

    function writeJSON(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
    }

    function writePref(next) {
        const pref = readJSON(TV_PREF_KEY, {}) || {};
        writeJSON(TV_PREF_KEY, {
            ...pref,
            ...(next || {}),
            updatedAt: new Date().toISOString()
        });
    }

    function nowGreekTime() {
        return new Date();
    }

    function formatClock(date) {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '--:--';
        return date.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' });
    }

    function formatDateTime(date) {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '--';
        return date.toLocaleString('el-GR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function parseXmltvTime(raw) {
        const s = String(raw || '').trim();
        const match = s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\s*([+-])(\d{2})(\d{2}))?/);
        if (!match) return null;

        const [, y, mo, d, h, mi, se, sign, tzh, tzm] = match;
        const utc = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(se));

        if (sign && tzh && tzm) {
            const offsetMinutes = Number(tzh) * 60 + Number(tzm);
            const direction = sign === '+' ? 1 : -1;
            return new Date(utc - direction * offsetMinutes * 60 * 1000);
        }

        return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(se));
    }

    function getNodeText(node, tagName) {
        const child = node.getElementsByTagName(tagName)[0];
        return child ? (child.textContent || '').trim() : '';
    }

    function getAllNodeText(node, tagName) {
        return Array.from(node.getElementsByTagName(tagName))
            .map(child => (child.textContent || '').trim())
            .filter(Boolean);
    }

    function findChannelIdMap(xmlDoc) {
        const map = {};
        const channels = Array.from(xmlDoc.getElementsByTagName('channel'));

        channels.forEach(node => {
            const id = node.getAttribute('id') || '';
            const names = getAllNodeText(node, 'display-name');
            const haystack = normalizeText([id, ...names].join(' '));

            CHANNELS.forEach(channel => {
                if (map[channel.id]) return;
                const matched = channel.aliases.some(regex => regex.test(haystack));
                if (matched) map[channel.id] = id;
            });
        });

        return map;
    }

    function isToday(date, now) {
        return date instanceof Date &&
            date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth() &&
            date.getDate() === now.getDate();
    }

    function classifyProgramme(programme) {
        const text = normalizeText(`${programme.title} ${programme.desc} ${programme.category || ''}`);
        if (/ταινια|movie|film|cinema|σινεμα|περιπετεια|δραμα|κωμωδια|θριλερ|κ12|κ16|κ18/.test(text)) return '🎬 Ταινία';
        if (/σειρα|serial|episode|επεισοδιο|σασμος|γη της ελιας|paradise|grand hotel/.test(text)) return '📺 Σειρά';
        if (/news|ειδησει|δελτιο|ενημερωση|επικαιροτητα/.test(text)) return '📰 Ενημέρωση';
        if (/show|ψυχαγωγ|τηλεπαιχνιδ|game|masterchef|survivor|voice|deal|ροκ|μουσικ/.test(text)) return '✨ Show';
        if (/αθλητικ|ποδοσφαιρο|μπασκετ|αγωνας|sports?/.test(text)) return '⚽ Αθλητικά';
        return '⭐ Επιλογή';
    }

    function scoreProgramme(programme, now) {
        const start = programme.start;
        const hour = start.getHours() + start.getMinutes() / 60;
        const text = normalizeText(`${programme.title} ${programme.desc} ${programme.category || ''}`);
        let score = 0;

        if (hour >= 20 && hour <= 23.9) score += 50;
        if (hour >= 18 && hour < 20) score += 24;
        if (hour >= 14 && hour < 18) score += 10;
        if (/ταινια|movie|film|περιπετεια|δραμα|κωμωδια|θριλερ/.test(text)) score += 42;
        if (/σειρα|serial|episode|επεισοδιο/.test(text)) score += 30;
        if (/show|ψυχαγωγ|τηλεπαιχνιδ|game|masterchef|survivor|voice|deal/.test(text)) score += 24;
        if (/news|ειδησει|δελτιο/.test(text)) score += 10;
        if (programme.start < now && programme.stop > now) score += 18;
        if (/επαναληψη|\(r\)|repeat/.test(text)) score -= 12;
        if (/τηλεπωλησ|διαφημισ|τηλεμαρκετινγκ/.test(text)) score -= 80;
        return score;
    }

    function summarizeDesc(desc) {
        const clean = String(desc || '').replace(/\s+/g, ' ').trim();
        if (!clean) return '';
        return clean.length > 92 ? clean.slice(0, 92).trim() + '…' : clean;
    }

    function parseXmltv(xmlText, sourceLabel) {
        const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
        const parserError = doc.getElementsByTagName('parsererror')[0];
        if (parserError) throw new Error('XML parse error');

        const channelMap = findChannelIdMap(doc);
        const idToChannel = {};
        CHANNELS.forEach(channel => {
            if (channelMap[channel.id]) idToChannel[channelMap[channel.id]] = channel.id;
        });

        const now = nowGreekTime();
        const dayStart = new Date(now);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(now);
        dayEnd.setHours(23, 59, 59, 999);

        const result = {};
        CHANNELS.forEach(channel => {
            result[channel.id] = {
                ...channel,
                found: Boolean(channelMap[channel.id]),
                now: null,
                picks: [],
                programmes: []
            };
        });

        Array.from(doc.getElementsByTagName('programme')).forEach(node => {
            const channelId = node.getAttribute('channel') || '';
            const targetId = idToChannel[channelId];
            if (!targetId) return;

            const start = parseXmltvTime(node.getAttribute('start'));
            const stop = parseXmltvTime(node.getAttribute('stop'));
            if (!start || !stop) return;
            if (stop < dayStart || start > dayEnd) return;

            const title = getNodeText(node, 'title') || 'Χωρίς τίτλο';
            const desc = getNodeText(node, 'desc');
            const category = getNodeText(node, 'category');
            const programme = {
                title,
                desc,
                category,
                start,
                stop,
                startTs: start.getTime(),
                stopTs: stop.getTime(),
                time: `${formatClock(start)}-${formatClock(stop)}`,
                kind: classifyProgramme({ title, desc, category })
            };

            result[targetId].programmes.push(programme);
            if (start <= now && stop > now) result[targetId].now = programme;
        });

        CHANNELS.forEach(channel => {
            const bucket = result[channel.id];
            bucket.programmes.sort((a, b) => a.startTs - b.startTs);

            let candidates = bucket.programmes
                .filter(item => item.stop >= now && isToday(item.start, now))
                .map(item => ({ ...item, score: scoreProgramme(item, now) }))
                .sort((a, b) => b.score - a.score || a.startTs - b.startTs);

            bucket.picks = candidates.slice(0, 3);

            if (bucket.picks.length < 3) {
                const existing = new Set(bucket.picks.map(item => `${item.startTs}|${item.title}`));
                bucket.programmes
                    .filter(item => item.stop >= now && !existing.has(`${item.startTs}|${item.title}`))
                    .slice(0, 3 - bucket.picks.length)
                    .forEach(item => bucket.picks.push(item));
            }
        });

        return {
            sourceLabel,
            fetchedAt: new Date().toISOString(),
            generatedAt: doc.documentElement?.getAttribute?.('date') || '',
            channels: result
        };
    }

    async function fetchWithTimeout(url, timeoutMs = 11000) {
        const controller = new AbortController();
        const t = window.setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(url, {
                cache: 'no-store',
                mode: 'cors',
                credentials: 'omit',
                signal: controller.signal
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.text();
        } finally {
            window.clearTimeout(t);
        }
    }

    async function loadProgramme(options = {}) {
        if (!options.force) {
            const cached = readJSON(TV_CACHE_KEY, null);
            if (cached?.fetchedAt && Date.now() - new Date(cached.fetchedAt).getTime() < CACHE_TTL_MS) {
                return { data: cached, fromCache: true };
            }
        }

        let lastError = null;
        for (const source of XMLTV_SOURCES) {
            try {
                const xml = await fetchWithTimeout(source.url);
                const parsed = parseXmltv(xml, source.label);
                parsed.sourceUrl = source.url;
                parsed.sourceNote = source.note;
                writeJSON(TV_CACHE_KEY, parsed);
                writePref({ lastSource: source.label, lastSourceUrl: source.url });
                return { data: parsed, fromCache: false };
            } catch (error) {
                lastError = error;
                console.warn('PEGASUS TV source failed:', source.label, error);
            }
        }

        const cached = readJSON(TV_CACHE_KEY, null);
        if (cached) return { data: cached, fromCache: true, stale: true, error: lastError };
        throw lastError || new Error('Δεν φορτώθηκε EPG');
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
                padding: 15px;
                box-sizing: border-box;
                background: linear-gradient(145deg, rgba(0,255,65,0.08), rgba(12,12,12,0.96));
                box-shadow: 0 0 22px rgba(0,255,65,0.10);
                margin-bottom: 12px;
                text-align: left;
            }
            #tv_program .pegasus-tv-live-row,
            #tv_program .pegasus-tv-toolbar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
            }
            #tv_program .pegasus-tv-title {
                font-size: 17px;
                font-weight: 900;
                color: #fff;
                letter-spacing: 0.6px;
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
                margin-top: 7px;
            }
            #tv_program .pegasus-tv-status {
                margin-top: 10px;
                border: 1px solid rgba(0,255,65,0.22);
                border-radius: 14px;
                padding: 9px 10px;
                color: #aaa;
                font-size: 10px;
                line-height: 1.4;
                font-weight: 800;
                background: rgba(0,0,0,0.35);
            }
            #tv_program .pegasus-tv-toolbar {
                margin: 12px 0;
            }
            #tv_program .pegasus-tv-toolbar button {
                padding: 12px 9px !important;
                font-size: 10px !important;
                margin: 0 !important;
            }
            #tv_program .pegasus-tv-grid {
                display: flex;
                flex-direction: column;
                gap: 12px;
                width: 100%;
                margin-bottom: 85px;
            }
            #tv_program .pegasus-tv-card {
                border: 1px solid rgba(0,255,65,0.42);
                border-radius: 19px;
                background: rgba(8,8,8,0.92);
                box-shadow: 0 0 16px rgba(0,255,65,0.08);
                padding: 13px;
                text-align: left;
                overflow: hidden;
            }
            #tv_program .pegasus-tv-channel-head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                margin-bottom: 10px;
            }
            #tv_program .pegasus-tv-channel-name {
                font-size: 17px;
                font-weight: 1000;
                color: #fff;
                letter-spacing: 0.8px;
            }
            #tv_program .pegasus-tv-live-badge {
                border: 1px solid rgba(0,255,65,0.45);
                border-radius: 999px;
                padding: 6px 9px;
                color: var(--main);
                background: rgba(0,255,65,0.09);
                font-size: 9px;
                font-weight: 1000;
                white-space: nowrap;
            }
            #tv_program .pegasus-tv-now {
                border-radius: 15px;
                border: 1px solid rgba(255,255,255,0.10);
                background: rgba(255,255,255,0.045);
                padding: 11px;
                margin-bottom: 10px;
            }
            #tv_program .pegasus-tv-now-label,
            #tv_program .pegasus-tv-picks-title {
                color: var(--main);
                font-size: 9px;
                font-weight: 1000;
                letter-spacing: 0.7px;
                text-transform: uppercase;
                margin-bottom: 5px;
            }
            #tv_program .pegasus-tv-program-title {
                color: #fff;
                font-size: 13px;
                font-weight: 950;
                line-height: 1.24;
                margin-bottom: 4px;
            }
            #tv_program .pegasus-tv-program-meta {
                color: #888;
                font-size: 9px;
                font-weight: 850;
                line-height: 1.35;
            }
            #tv_program .pegasus-tv-program-desc {
                color: #aaa;
                font-size: 9px;
                line-height: 1.35;
                font-weight: 750;
                margin-top: 5px;
            }
            #tv_program .pegasus-tv-pick-list {
                display: flex;
                flex-direction: column;
                gap: 7px;
            }
            #tv_program .pegasus-tv-pick {
                display: grid;
                grid-template-columns: 48px 1fr;
                gap: 9px;
                border-radius: 13px;
                padding: 9px;
                background: rgba(0,0,0,0.42);
                border: 1px solid rgba(255,255,255,0.07);
            }
            #tv_program .pegasus-tv-pick-time {
                color: var(--main);
                font-size: 10px;
                font-weight: 1000;
                font-variant-numeric: tabular-nums;
                line-height: 1.25;
                text-align: center;
                padding-top: 2px;
            }
            #tv_program .pegasus-tv-error {
                border: 1px solid rgba(255,68,68,0.45);
                color: #ff8888;
                background: rgba(255,68,68,0.08);
                border-radius: 15px;
                padding: 13px;
                font-size: 10px;
                font-weight: 800;
                line-height: 1.45;
                margin-bottom: 12px;
            }
            #tv_program .pegasus-tv-guide-links {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin-top: 10px;
            }
            #tv_program .pegasus-tv-guide-links button {
                margin: 0 !important;
                padding: 11px 8px !important;
                font-size: 9px !important;
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
                    <div class="pegasus-tv-title">📺 Τώρα στην TV</div>
                    <div id="pegasusTvClock" class="pegasus-tv-clock">--:--</div>
                </div>
                <div class="pegasus-tv-sub">
                    MEGA • ANT1 • ALPHA • STAR • ΣΚΑΪ • OPEN. Πάνω βλέπεις τι παίζει τώρα, κάτω τις καλύτερες επιλογές ημέρας ανά κανάλι.
                </div>
                <div id="pegasusTvStatus" class="pegasus-tv-status">Φόρτωση προγράμματος...</div>
            </div>

            <div class="pegasus-tv-toolbar compact-grid" style="width:100%; grid-template-columns: 1fr 1fr;">
                <button class="primary-btn" onclick="window.PegasusTV.refresh(true)">ΑΝΑΝΕΩΣΗ LIVE</button>
                <button class="secondary-btn" onclick="window.PegasusTV.openFallbackGuide()">ΑΝΟΙΓΜΑ ΟΔΗΓΟΥ</button>
            </div>

            <div id="pegasusTvContent" class="pegasus-tv-grid">
                <div class="pegasus-tv-status">Φόρτωση...</div>
            </div>
        `;
        document.body.appendChild(viewDiv);
    }

    function renderPick(programme) {
        if (!programme) return '';
        return `
            <div class="pegasus-tv-pick">
                <div class="pegasus-tv-pick-time">${escapeHtml(formatClock(new Date(programme.startTs || programme.start)))}<br>${escapeHtml(formatClock(new Date(programme.stopTs || programme.stop)))}</div>
                <div>
                    <div class="pegasus-tv-program-title">${escapeHtml(programme.title)}</div>
                    <div class="pegasus-tv-program-meta">${escapeHtml(programme.kind || '⭐ Επιλογή')}</div>
                    ${programme.desc ? `<div class="pegasus-tv-program-desc">${escapeHtml(summarizeDesc(programme.desc))}</div>` : ''}
                </div>
            </div>
        `;
    }

    function renderChannelCard(channel) {
        const nowProgramme = channel.now;
        const color = channel.color || '#00ff41';
        const picks = Array.isArray(channel.picks) ? channel.picks : [];
        const guideUrl = channel.guideUrl || FALLBACK_GUIDES[0].url;

        return `
            <div class="pegasus-tv-card" style="border-color:${escapeHtml(color)}88;">
                <div class="pegasus-tv-channel-head">
                    <div class="pegasus-tv-channel-name" style="color:${escapeHtml(color)};">${escapeHtml(channel.name)}</div>
                    <button class="secondary-btn" style="width:auto; margin:0; padding:7px 9px; border-radius:10px; font-size:9px;" onclick="window.PegasusTV.openUrl('${escapeHtml(guideUrl)}')">Οδηγός</button>
                </div>

                <div class="pegasus-tv-now">
                    <div class="pegasus-tv-now-label">● ΠΑΙΖΕΙ ΤΩΡΑ</div>
                    ${nowProgramme ? `
                        <div class="pegasus-tv-program-title">${escapeHtml(nowProgramme.title)}</div>
                        <div class="pegasus-tv-program-meta">${escapeHtml(nowProgramme.time)} · ${escapeHtml(nowProgramme.kind)}</div>
                        ${nowProgramme.desc ? `<div class="pegasus-tv-program-desc">${escapeHtml(summarizeDesc(nowProgramme.desc))}</div>` : ''}
                    ` : `
                        <div class="pegasus-tv-program-title">Δεν βρέθηκε τρέχουσα εκπομπή</div>
                        <div class="pegasus-tv-program-meta">Πάτα «Οδηγός» ή «Ανανέωση live».</div>
                    `}
                </div>

                <div class="pegasus-tv-picks-title">Καλύτερες επιλογές ημέρας</div>
                <div class="pegasus-tv-pick-list">
                    ${picks.length ? picks.map(renderPick).join('') : '<div class="pegasus-tv-program-meta">Δεν φορτώθηκαν επιλογές για σήμερα.</div>'}
                </div>
            </div>
        `;
    }

    function renderData(data, meta = {}) {
        const content = document.getElementById('pegasusTvContent');
        const status = document.getElementById('pegasusTvStatus');
        if (!content) return;

        const channels = CHANNELS.map(channel => {
            const item = data?.channels?.[channel.id] || {};
            return { ...channel, ...item };
        });

        content.innerHTML = channels.map(renderChannelCard).join('');

        if (status) {
            const fetched = data?.fetchedAt ? formatDateTime(new Date(data.fetchedAt)) : '--';
            const source = data?.sourceLabel || 'EPG';
            const freshness = meta.stale ? ' · παλιό cache' : meta.fromCache ? ' · cache' : ' · live';
            status.textContent = `Πηγή: ${source}${freshness} · ενημέρωση ${fetched}`;
        }
    }

    function renderError(error) {
        const content = document.getElementById('pegasusTvContent');
        const status = document.getElementById('pegasusTvStatus');
        if (status) status.textContent = 'Δεν φορτώθηκε αυτόματα το EPG. Χρησιμοποίησε τον εξωτερικό οδηγό.';
        if (!content) return;

        content.innerHTML = `
            <div class="pegasus-tv-error">
                Δεν μπόρεσε να φορτώσει live πρόγραμμα μέσα από το Pegasus. Αυτό μπορεί να συμβεί από CORS/δίκτυο ή προσωρινό θέμα της πηγής.<br><br>
                Τεχνικό: ${escapeHtml(error?.message || error || 'unknown')}
                <div class="pegasus-tv-guide-links">
                    ${FALLBACK_GUIDES.map(item => `<button class="secondary-btn" onclick="window.PegasusTV.openUrl('${escapeHtml(item.url)}')">${escapeHtml(item.label)}</button>`).join('')}
                </div>
            </div>
            ${CHANNELS.map(channel => renderChannelCard({ ...channel, now: null, picks: [] })).join('')}
        `;
    }

    window.PegasusTV = {
        clockTimer: null,
        loading: false,

        init: function() {
            injectViewLayer();
            this.startClock();
            this.refresh(false);
        },

        startClock: function() {
            if (this.clockTimer) return;
            const update = () => {
                const el = document.getElementById('pegasusTvClock');
                if (!el) return;
                el.textContent = nowGreekTime().toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' });
            };
            update();
            this.clockTimer = window.setInterval(update, 30000);
        },

        refresh: async function(force) {
            if (this.loading) return;
            this.loading = true;

            const status = document.getElementById('pegasusTvStatus');
            if (status) status.textContent = force ? 'Ανανέωση live προγράμματος...' : 'Φόρτωση προγράμματος...';

            try {
                const result = await loadProgramme({ force: Boolean(force) });
                renderData(result.data, result);
            } catch (error) {
                console.warn('PEGASUS TV load failed:', error);
                renderError(error);
            } finally {
                this.loading = false;
            }
        },

        openUrl: function(url) {
            if (!url) return;
            window.open(url, '_blank', 'noopener,noreferrer');
        },

        openFallbackGuide: function() {
            this.openUrl(FALLBACK_GUIDES[0].url);
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        window.PegasusTV.init();

        if (window.registerPegasusModule) {
            window.registerPegasusModule({
                id: 'tv_program',
                label: 'Τηλεόραση',
                icon: '📺'
            });
        }
    });
})();
