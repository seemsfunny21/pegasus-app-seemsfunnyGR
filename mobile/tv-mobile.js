/* ============================================================================
   📺 PEGASUS MODULE: MOBILE TV PROGRAM (v1.4.253)
   Protocol: Separate mobile module | Clean card UI | Quiet external-guide fallback
   Channels: MEGA / ANT1 / ALPHA / STAR / SKAI / OPEN
   ============================================================================ */

(function() {
    'use strict';

    const TV_CACHE_KEY = 'pegasus_tv_program_cache_v3';
    const TV_PREF_KEY = 'pegasus_tv_program_pref_v2';
    const TV_FAILURE_KEY = 'pegasus_tv_program_last_failure_v1';
    const CACHE_TTL_MS = 1000 * 60 * 60 * 3;

    const ATHINORAMA_PROGRAM_URL = 'https://www.athinorama.gr/tv/programma/olatakanalia/';
    const ATHINORAMA_PICKS_URL = 'https://www.athinorama.gr/tv/programma/simera';
    const ATHINORAMA_PROGRAM_READER_URL = 'https://r.jina.ai/https://www.athinorama.gr/tv/programma/olatakanalia/';
    const ATHINORAMA_PICKS_READER_URL = 'https://r.jina.ai/https://www.athinorama.gr/tv/programma/simera';

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
        { label: 'Αθηνόραμα TV', url: ATHINORAMA_PICKS_URL },
        { label: 'Αθηνόραμα Κανάλια', url: ATHINORAMA_PROGRAM_URL },
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


    function tvDebugEnabled() {
        return localStorage.getItem('pegasus_tv_debug') === '1';
    }

    function tvDebug(...args) {
        if (tvDebugEnabled()) console.info(...args);
    }

    function rememberSourceFailure(source, error) {
        writeJSON(TV_FAILURE_KEY, {
            source: String(source || 'EPG'),
            message: String(error?.message || error || 'unknown'),
            at: new Date().toISOString()
        });
    }

    function createGuideFallbackData(error) {
        const channels = {};
        CHANNELS.forEach(channel => {
            channels[channel.id] = {
                ...channel,
                found: false,
                now: null,
                next: null,
                programmes: [],
                picks: []
            };
        });

        return {
            sourceLabel: 'Εξωτερικοί οδηγοί TV',
            sourceUrl: ATHINORAMA_PICKS_URL,
            sourceNote: 'Το live EPG χρειάζεται proxy/worker όταν οι πηγές μπλοκάρουν fetch/CORS.',
            fetchedAt: new Date().toISOString(),
            generatedAt: '',
            guideFallback: true,
            reason: String(error?.message || error || 'blocked'),
            channels
        };
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


    function cleanGuideLine(line) {
        return String(line || '')
            .replace(/\u00a0/g, ' ')
            .replace(/\【\d+†([^\】]*)\】/g, '$1')
            .replace(/!\[[^\]]*\]\([^\)]*\)/g, '')
            .replace(/\[([^\]]+)\]\([^\)]*\)/g, '$1')
            .replace(/^[-*]\s+/, '')
            .replace(/^#{1,6}\s*/, '')
            .replace(/\s*Image\s*$/i, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function isClockLine(line) {
        return /^\d{1,2}:\d{2}$/.test(String(line || '').trim());
    }

    function clockMinutes(value) {
        const m = String(value || '').match(/^(\d{1,2}):(\d{2})$/);
        if (!m) return null;
        return Number(m[1]) * 60 + Number(m[2]);
    }

    function normalizeStation(value) {
        const clean = normalizeText(value).replace(/[^a-z0-9\u0370-\u03ff]+/g, ' ').trim();
        if (/mega/.test(clean)) return 'mega';
        if (/ant1|antenna|αντ1/.test(clean)) return 'ant1';
        if (/alpha/.test(clean)) return 'alpha';
        if (/star/.test(clean)) return 'star';
        if (/skai|σκαι/.test(clean)) return 'skai';
        if (/open/.test(clean)) return 'open';
        return '';
    }

    function getChannelFromHeading(line) {
        const clean = cleanGuideLine(line);
        const n = normalizeText(clean);
        if (/^(mega|mega hd|mega tv)$/.test(n)) return 'mega';
        if (/^(ant1|αντ1|antenna)$/.test(n)) return 'ant1';
        if (/^alpha$/.test(n)) return 'alpha';
        if (/^star$/.test(n)) return 'star';
        if (/^σκαι$|^skai$/.test(n)) return 'skai';
        if (/^open$|^open beyond$/.test(n)) return 'open';
        return '';
    }

    function isGuideNoise(line) {
        const clean = cleanGuideLine(line);
        const n = normalizeText(clean);
        if (!clean) return true;
        if (/^\d+(?:[,.]\d+)?$/.test(clean)) return true;
        if (/^(τηλεοραση|προγραμμα καναλιων|πληρες προγραμμα|ταινιες tv σημερα|αθλητικες μεταδοσεις|παιζουν τωρα|tv αξιζει να δειτε|το προγραμμα των καναλιων|my αθηνοραμα|more|sign in)$/.test(n)) return true;
        if (/^(σινεμα|θεατρο|μουσικη|εστιατορια|bars|clubs|nightlife|τεχνες|παιδι|travel|winebox)$/i.test(n)) return true;
        if (/^προγραμμα \d{1,2}\/\d{1,2}/.test(n)) return true;
        if (/^παρασκευη|^σαββατο|^κυριακη|^δευτερα|^τριτη|^τεταρτη|^πεμπτη/.test(n) && clean.length < 35) return true;
        return false;
    }

    function makeProgrammeDate(clock, dayOffset) {
        const mins = clockMinutes(clock);
        const d = nowGreekTime();
        d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
        if (dayOffset) d.setDate(d.getDate() + dayOffset);
        return d;
    }

    function finishAthinoramaProgrammeItems(rawItems) {
        const now = nowGreekTime();
        const result = {};
        CHANNELS.forEach(channel => {
            result[channel.id] = {
                ...channel,
                found: false,
                now: null,
                picks: [],
                programmes: []
            };
        });

        CHANNELS.forEach(channel => {
            const items = (rawItems[channel.id] || []).filter(item => item && item.title && isClockLine(item.time));
            const unique = [];
            const seen = new Set();
            let lastMinutes = null;
            let dayOffset = 0;

            items.forEach(item => {
                const mins = clockMinutes(item.time);
                if (lastMinutes != null && mins < lastMinutes && lastMinutes >= 20 * 60 && mins <= 8 * 60) dayOffset = 1;
                lastMinutes = mins;
                const key = `${item.time}|${normalizeText(item.title)}`;
                if (seen.has(key)) return;
                seen.add(key);
                unique.push({ ...item, start: makeProgrammeDate(item.time, dayOffset) });
            });

            unique.forEach((item, index) => {
                const next = unique[index + 1];
                const stop = next ? new Date(next.start) : new Date(item.start.getTime() + 75 * 60 * 1000);
                const programme = {
                    title: item.title,
                    desc: '',
                    category: '',
                    start: item.start,
                    stop,
                    startTs: item.start.getTime(),
                    stopTs: stop.getTime(),
                    time: `${formatClock(item.start)}-${formatClock(stop)}`,
                    kind: classifyProgramme({ title: item.title, desc: '', category: '' }),
                    source: 'Athinorama'
                };
                result[channel.id].found = true;
                result[channel.id].programmes.push(programme);
                if (programme.start <= now && programme.stop > now) result[channel.id].now = programme;
            });
        });

        return result;
    }

    function parseAthinoramaProgrammeText(text) {
        const lines = String(text || '').split(/\r?\n/).map(cleanGuideLine).filter(Boolean);
        const raw = {};
        CHANNELS.forEach(channel => raw[channel.id] = []);

        let currentChannel = '';
        let pendingTime = '';

        lines.forEach(line => {
            const headingChannel = getChannelFromHeading(line);
            if (headingChannel) {
                currentChannel = headingChannel;
                pendingTime = '';
                return;
            }

            if (!currentChannel) return;

            if (isClockLine(line)) {
                pendingTime = line;
                return;
            }

            if (!pendingTime) return;
            if (isGuideNoise(line)) return;
            if (getChannelFromHeading(line)) return;

            const title = cleanGuideLine(line)
                .replace(/\s*\d+†?\s*$/g, '')
                .replace(/\s+/g, ' ')
                .trim();

            if (!title || title.length < 2 || isClockLine(title)) return;
            raw[currentChannel].push({ time: pendingTime, title });
            pendingTime = '';
        });

        return finishAthinoramaProgrammeItems(raw);
    }

    function parseChannelTimeLine(line) {
        const clean = cleanGuideLine(line).replace(/\s+/g, ' ').trim();
        const match = clean.match(/^(MEGA(?:\s+HD)?|ΑΝΤ1|ANT1|ALPHA|STAR|ΣΚΑΪ|ΣΚΑΙ|SKAI|OPEN(?:\s+BEYOND)?)\s+(\d{1,2}:\d{2})$/i);
        if (!match) return null;
        const channelId = normalizeStation(match[1]);
        return channelId ? { channelId, time: match[2] } : null;
    }

    function looksLikePickTitle(line) {
        const clean = cleanGuideLine(line);
        const n = normalizeText(clean);
        if (!clean || clean.length < 2) return false;
        if (isGuideNoise(clean) || isClockLine(clean) || parseChannelTimeLine(clean)) return false;
        if (/^(animation|κωμωδια|δραματικη|περιπετεια|κομεντι|φαντασιας|αστυνομικη|εγχρ|α\/μ|\d{4}|διαρκεια)/i.test(n)) return false;
        if (clean.length > 90) return false;
        return true;
    }

    function parseAthinoramaPicksText(text) {
        const rawLines = String(text || '').split(/\r?\n/);
        const picksByChannel = {};
        CHANNELS.forEach(channel => picksByChannel[channel.id] = []);

        let title = '';
        let descParts = [];
        let armed = false;

        const reset = () => {
            title = '';
            descParts = [];
            armed = false;
        };

        rawLines.forEach(raw => {
            const line = cleanGuideLine(raw);
            if (!line) return;

            const channelTime = parseChannelTimeLine(line);
            if (channelTime && title) {
                const start = makeProgrammeDate(channelTime.time, clockMinutes(channelTime.time) < 5 * 60 ? 1 : 0);
                const stop = new Date(start.getTime() + 120 * 60 * 1000);
                const desc = descParts
                    .filter(part => !isGuideNoise(part))
                    .filter(part => !/^\d+(?:[,.]\d+)?$/.test(part))
                    .filter(part => !parseChannelTimeLine(part))
                    .slice(0, 4)
                    .join(' ')
                    .replace(/\s+/g, ' ')
                    .trim();

                const key = `${channelTime.time}|${normalizeText(title)}`;
                const exists = picksByChannel[channelTime.channelId].some(item => item.key === key);
                if (!exists) {
                    picksByChannel[channelTime.channelId].push({
                        key,
                        title,
                        desc,
                        category: '',
                        start,
                        stop,
                        startTs: start.getTime(),
                        stopTs: stop.getTime(),
                        time: `${formatClock(start)}`,
                        kind: classifyProgramme({ title, desc, category: '' }),
                        source: 'Athinorama επιλογή'
                    });
                }
                reset();
                return;
            }

            const rawTrim = String(raw || '').trim();
            const isHeading = /^#{1,6}\s+/.test(rawTrim) || /^####?\s+/.test(rawTrim);
            if (isHeading && looksLikePickTitle(line)) {
                title = line;
                descParts = [];
                armed = true;
                return;
            }

            if (!armed) return;
            if (looksLikePickTitle(line) && descParts.length === 0 && title && normalizeText(line) !== normalizeText(title)) {
                // Often Athinorama gives an English/original title below the Greek title. Keep the Greek title, but do not use it as description.
                return;
            }
            if (!isGuideNoise(line) && !isClockLine(line)) descParts.push(line);
        });

        return picksByChannel;
    }

    function fillPicksFromProgramme(data) {
        const now = nowGreekTime();
        CHANNELS.forEach(channel => {
            const bucket = data.channels[channel.id];
            if (!bucket) return;
            if (Array.isArray(bucket.picks) && bucket.picks.length) return;

            const candidates = (bucket.programmes || [])
                .filter(item => item.stop >= now && isToday(item.start, now))
                .map(item => ({ ...item, score: scoreProgramme(item, now) }))
                .sort((a, b) => b.score - a.score || a.startTs - b.startTs);
            bucket.picks = candidates.slice(0, 3);
        });
    }

    function mergeAthinoramaPicks(data, picksByChannel) {
        CHANNELS.forEach(channel => {
            const incoming = picksByChannel?.[channel.id] || [];
            const bucket = data.channels[channel.id];
            if (!bucket) return;
            if (!incoming.length) return;

            const now = nowGreekTime();
            const filtered = incoming
                .filter(item => item.stop >= now || isToday(item.start, now))
                .slice(0, 4);
            if (filtered.length) bucket.picks = filtered;
        });
        fillPicksFromProgramme(data);
    }

    function hasUsableAthinoramaData(channels) {
        return CHANNELS.some(channel => {
            const bucket = channels?.[channel.id];
            return bucket && ((bucket.programmes || []).length || (bucket.picks || []).length);
        });
    }

    async function loadAthinoramaProgramme() {
        const attempts = [
            {
                label: 'Athinorama',
                programUrl: ATHINORAMA_PROGRAM_URL,
                picksUrl: ATHINORAMA_PICKS_URL,
                note: 'Πρόγραμμα καναλιών + Αξίζει να δείτε'
            },
            {
                label: 'Athinorama Reader',
                programUrl: ATHINORAMA_PROGRAM_READER_URL,
                picksUrl: ATHINORAMA_PICKS_READER_URL,
                note: 'Reader fallback για CORS/HTML parsing'
            }
        ];

        let lastError = null;
        for (const attempt of attempts) {
            try {
                const programText = await fetchWithTimeout(attempt.programUrl, 14000);
                const channels = parseAthinoramaProgrammeText(programText);
                const data = {
                    sourceLabel: attempt.label,
                    sourceUrl: attempt.programUrl,
                    sourceNote: attempt.note,
                    fetchedAt: new Date().toISOString(),
                    generatedAt: '',
                    channels
                };

                try {
                    const picksText = await fetchWithTimeout(attempt.picksUrl, 14000);
                    mergeAthinoramaPicks(data, parseAthinoramaPicksText(picksText));
                } catch (pickError) {
                    rememberSourceFailure('Athinorama picks', pickError); tvDebug('PEGASUS TV Athinorama picks skipped:', pickError);
                    fillPicksFromProgramme(data);
                }

                if (!hasUsableAthinoramaData(data.channels)) throw new Error('Athinorama parse returned no target channels');
                return data;
            } catch (error) {
                lastError = error;
                rememberSourceFailure(attempt.label, error); tvDebug('PEGASUS TV Athinorama source unavailable:', attempt.label, error);
            }
        }
        throw lastError || new Error('Athinorama failed');
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

        try {
            const athinorama = await loadAthinoramaProgramme();
            writeJSON(TV_CACHE_KEY, athinorama);
            writePref({ lastSource: athinorama.sourceLabel, lastSourceUrl: athinorama.sourceUrl });
            return { data: athinorama, fromCache: false };
        } catch (error) {
            lastError = error;
            rememberSourceFailure('Athinorama primary', error); tvDebug('PEGASUS TV Athinorama primary unavailable:', error);
        }

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
                rememberSourceFailure(source.label, error); tvDebug('PEGASUS TV XMLTV source unavailable:', source.label, error);
            }
        }

        const cached = readJSON(TV_CACHE_KEY, null);
        if (cached) return { data: cached, fromCache: true, stale: true, error: lastError };
        const fallbackData = createGuideFallbackData(lastError || new Error('Δεν φορτώθηκε EPG'));
        writePref({ lastSource: fallbackData.sourceLabel, lastSourceUrl: fallbackData.sourceUrl, guideFallback: true });
        return { data: fallbackData, fromCache: false, guideFallback: true, error: lastError };
    }

    function injectStyles() {
        if (document.getElementById('pegasus-tv-mobile-styles')) return;
        const style = document.createElement('style');
        style.id = 'pegasus-tv-mobile-styles';
        style.textContent = `
            #tv_program {
                --tv-card-bg: rgba(10, 18, 12, 0.88);
                --tv-soft-bg: rgba(0, 255, 65, 0.065);
                --tv-border: rgba(0, 255, 65, 0.20);
            }
            #tv_program .pegasus-tv-shell {
                width: 100%;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                gap: 11px;
                padding-bottom: 4px;
            }
            #tv_program .pegasus-tv-hero {
                width: 100%;
                border: 1px solid var(--tv-border);
                border-radius: 22px;
                padding: 14px;
                box-sizing: border-box;
                background:
                    radial-gradient(circle at top left, rgba(0,255,65,0.16), transparent 42%),
                    linear-gradient(145deg, rgba(0,255,65,0.07), rgba(8,8,8,0.96));
                box-shadow: 0 0 22px rgba(0,255,65,0.10);
                text-align: left;
            }
            #tv_program .pegasus-tv-live-row,
            #tv_program .pegasus-tv-toolbar,
            #tv_program .pegasus-tv-titlebar,
            #tv_program .pegasus-tv-channel-head,
            #tv_program .pegasus-tv-meta-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
            }
            #tv_program .pegasus-tv-title {
                font-size: 17px;
                font-weight: 1000;
                color: #fff;
                letter-spacing: 0.5px;
                line-height: 1.1;
            }
            #tv_program .pegasus-tv-clock {
                color: var(--main);
                font-size: 12px;
                font-weight: 1000;
                font-variant-numeric: tabular-nums;
                white-space: nowrap;
                border: 1px solid rgba(0,255,65,0.25);
                border-radius: 999px;
                padding: 5px 9px;
                background: rgba(0,0,0,0.28);
            }
            #tv_program .pegasus-tv-sub {
                color: #9a9a9a;
                font-size: 10px;
                line-height: 1.45;
                font-weight: 850;
                margin-top: 8px;
            }
            #tv_program .pegasus-tv-status {
                margin-top: 10px;
                border: 1px solid rgba(0,255,65,0.18);
                border-radius: 14px;
                padding: 8px 10px;
                color: #aaa;
                font-size: 9.5px;
                line-height: 1.35;
                font-weight: 850;
                background: rgba(0,0,0,0.32);
            }
            #tv_program .pegasus-tv-toolbar {
                width: 100%;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }
            #tv_program .pegasus-tv-toolbar button {
                margin: 0 !important;
                min-height: 38px;
                font-size: 9px !important;
                border-radius: 14px !important;
            }
            #tv_program .pegasus-tv-chipbar {
                width: 100%;
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 7px;
            }
            #tv_program .pegasus-tv-chip {
                border-radius: 999px;
                border: 1px solid rgba(0,255,65,0.25);
                background: rgba(0,0,0,0.35);
                color: #e8e8e8;
                font-size: 9px;
                font-weight: 1000;
                padding: 8px 6px;
                text-align: center;
                letter-spacing: .35px;
            }
            #tv_program .pegasus-tv-panel-title {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                margin-top: 2px;
                color: #fff;
                font-size: 12px;
                font-weight: 1000;
                letter-spacing: 0.55px;
            }
            #tv_program .pegasus-tv-panel-title span:last-child {
                color: var(--main);
                font-size: 9px;
                font-weight: 950;
            }
            #tv_program .pegasus-tv-now-grid,
            #tv_program .pegasus-tv-best-grid {
                width: 100%;
                display: flex;
                flex-direction: column;
                gap: 9px;
            }
            #tv_program .pegasus-tv-card,
            #tv_program .pegasus-tv-best-group {
                width: 100%;
                box-sizing: border-box;
                border-radius: 18px;
                padding: 12px;
                background: var(--tv-card-bg);
                border: 1px solid rgba(255,255,255,0.08);
                box-shadow: inset 0 0 0 1px rgba(255,255,255,0.02), 0 10px 24px rgba(0,0,0,0.22);
                text-align: left;
            }
            #tv_program .pegasus-tv-card {
                scroll-margin-top: 12px;
            }
            #tv_program .pegasus-tv-channel-name {
                font-size: 13px;
                font-weight: 1000;
                letter-spacing: 0.7px;
                line-height: 1;
                display: flex;
                align-items: center;
                gap: 7px;
            }
            #tv_program .pegasus-tv-dot {
                width: 8px;
                height: 8px;
                border-radius: 99px;
                display: inline-block;
                box-shadow: 0 0 12px currentColor;
            }
            #tv_program .pegasus-tv-live-badge,
            #tv_program .pegasus-tv-source-badge {
                border: 1px solid rgba(0,255,65,0.35);
                border-radius: 999px;
                padding: 5px 8px;
                color: var(--main);
                background: rgba(0,255,65,0.07);
                font-size: 8px;
                font-weight: 1000;
                white-space: nowrap;
                letter-spacing: .35px;
            }
            #tv_program .pegasus-tv-now-label,
            #tv_program .pegasus-tv-next-label,
            #tv_program .pegasus-tv-picks-title {
                color: var(--main);
                font-size: 8.5px;
                font-weight: 1000;
                letter-spacing: 0.75px;
                text-transform: uppercase;
                margin-top: 9px;
                margin-bottom: 4px;
            }
            #tv_program .pegasus-tv-program-title {
                color: #fff;
                font-size: 13px;
                font-weight: 1000;
                line-height: 1.23;
                margin-bottom: 4px;
            }
            #tv_program .pegasus-tv-card .pegasus-tv-program-title {
                font-size: 14px;
            }
            #tv_program .pegasus-tv-program-meta {
                color: #909090;
                font-size: 9px;
                font-weight: 850;
                line-height: 1.35;
            }
            #tv_program .pegasus-tv-program-desc {
                color: #aaa;
                font-size: 9px;
                line-height: 1.35;
                font-weight: 760;
                margin-top: 5px;
            }
            #tv_program .pegasus-tv-progress-wrap {
                margin-top: 8px;
                height: 5px;
                border-radius: 999px;
                background: rgba(255,255,255,0.08);
                overflow: hidden;
            }
            #tv_program .pegasus-tv-progress-bar {
                height: 100%;
                border-radius: inherit;
                background: linear-gradient(90deg, rgba(0,255,65,0.45), rgba(0,255,65,0.95));
                width: 0%;
            }
            #tv_program .pegasus-tv-next {
                border-radius: 13px;
                border: 1px solid rgba(255,255,255,0.07);
                background: rgba(255,255,255,0.035);
                padding: 9px;
                margin-top: 9px;
            }
            #tv_program .pegasus-tv-pick-list {
                display: flex;
                flex-direction: column;
                gap: 7px;
            }
            #tv_program .pegasus-tv-pick {
                display: grid;
                grid-template-columns: 54px 1fr;
                gap: 9px;
                border-radius: 13px;
                padding: 9px;
                background: rgba(0,0,0,0.38);
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
            #tv_program .pegasus-tv-best-group-head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                margin-bottom: 8px;
            }
            #tv_program .pegasus-tv-empty {
                color: #888;
                font-size: 9.5px;
                font-weight: 850;
                padding: 9px;
                border-radius: 12px;
                border: 1px dashed rgba(255,255,255,0.10);
                background: rgba(0,0,0,0.22);
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
            #tv_program .pegasus-tv-notice,
            #tv_program .pegasus-tv-error {
                border: 1px solid rgba(0,255,65,0.24);
                color: #dfffe8;
                background: linear-gradient(145deg, rgba(0,255,65,0.08), rgba(0,0,0,0.34));
                border-radius: 15px;
                padding: 13px;
                font-size: 10px;
                font-weight: 850;
                line-height: 1.45;
            }
            #tv_program .pegasus-tv-notice-title {
                color: var(--main);
                font-size: 11px;
                font-weight: 1000;
                margin-bottom: 5px;
                letter-spacing: .45px;
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

            <div class="pegasus-tv-shell">
                <div class="pegasus-tv-hero">
                    <div class="pegasus-tv-live-row">
                        <div class="pegasus-tv-title">📺 Τηλεόραση σήμερα</div>
                        <div id="pegasusTvClock" class="pegasus-tv-clock">--:--</div>
                    </div>
                    <div class="pegasus-tv-sub">
                        Καθαρή προβολή για MEGA, ANT1, ALPHA, STAR, ΣΚΑΪ και OPEN: πρώτα τι παίζει τώρα, μετά οι καλύτερες επιλογές ημέρας ανά κανάλι.
                    </div>
                    <div id="pegasusTvStatus" class="pegasus-tv-status">Έλεγχος live πηγών...</div>
                </div>

                <div class="pegasus-tv-toolbar">
                    <button class="primary-btn" onclick="window.PegasusTV.refresh(true)">ΑΝΑΝΕΩΣΗ</button>
                    <button class="secondary-btn" onclick="window.PegasusTV.openFallbackGuide()">ΑΘΗΝΟΡΑΜΑ</button>
                </div>

                <div id="pegasusTvContent" class="pegasus-tv-content">
                    <div class="pegasus-tv-status">Έλεγχος πηγών...</div>
                </div>
            </div>
        `;
        document.body.appendChild(viewDiv);
    }

    function toDate(value) {
        if (value instanceof Date) return value;
        if (typeof value === 'number') return new Date(value);
        const d = new Date(value || 0);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    function getProgrammeStart(programme) {
        return toDate(programme?.startTs || programme?.start);
    }

    function getProgrammeStop(programme) {
        return toDate(programme?.stopTs || programme?.stop);
    }

    function getProgress(programme) {
        const start = getProgrammeStart(programme);
        const stop = getProgrammeStop(programme);
        const now = nowGreekTime();
        if (!start || !stop || stop <= start) return 0;
        return Math.max(0, Math.min(100, Math.round(((now - start) / (stop - start)) * 100)));
    }

    function getNextProgramme(channel) {
        const now = nowGreekTime();
        const current = channel?.now || null;
        const currentTitle = normalizeText(current?.title || '');
        return (channel?.programmes || [])
            .map(item => ({ ...item, _start: getProgrammeStart(item), _stop: getProgrammeStop(item) }))
            .filter(item => item._start && item._start > now)
            .filter(item => normalizeText(item.title || '') !== currentTitle)
            .sort((a, b) => a._start - b._start)[0] || null;
    }

    function renderChannelChips(channels) {
        return `
            <div class="pegasus-tv-chipbar">
                ${channels.map(channel => `
                    <button class="pegasus-tv-chip" onclick="window.PegasusTV.jumpToChannel('${escapeHtml(channel.id)}')">${escapeHtml(channel.name)}</button>
                `).join('')}
            </div>
        `;
    }

    function renderProgrammeTime(programme) {
        const start = getProgrammeStart(programme);
        const stop = getProgrammeStop(programme);
        if (programme?.time && String(programme.time).includes('-')) return programme.time;
        if (!start) return '--:--';
        return stop ? `${formatClock(start)}-${formatClock(stop)}` : formatClock(start);
    }

    function renderPick(programme) {
        if (!programme) return '';
        const start = getProgrammeStart(programme);
        const stop = getProgrammeStop(programme);
        return `
            <div class="pegasus-tv-pick">
                <div class="pegasus-tv-pick-time">
                    ${escapeHtml(start ? formatClock(start) : '--:--')}${stop ? `<br>${escapeHtml(formatClock(stop))}` : ''}
                </div>
                <div>
                    <div class="pegasus-tv-program-title">${escapeHtml(programme.title || 'Χωρίς τίτλο')}</div>
                    <div class="pegasus-tv-program-meta">${escapeHtml(programme.kind || '⭐ Επιλογή')}</div>
                    ${programme.desc ? `<div class="pegasus-tv-program-desc">${escapeHtml(summarizeDesc(programme.desc))}</div>` : ''}
                </div>
            </div>
        `;
    }

    function renderChannelNowCard(channel) {
        const nowProgramme = channel.now;
        const nextProgramme = getNextProgramme(channel);
        const color = channel.color || '#00ff41';
        const progress = nowProgramme ? getProgress(nowProgramme) : 0;
        const guideUrl = channel.guideUrl || FALLBACK_GUIDES[0].url;

        return `
            <div id="pegasus-tv-channel-${escapeHtml(channel.id)}" class="pegasus-tv-card" style="border-color:${escapeHtml(color)}66;">
                <div class="pegasus-tv-channel-head">
                    <div class="pegasus-tv-channel-name" style="color:${escapeHtml(color)};">
                        <span class="pegasus-tv-dot" style="background:${escapeHtml(color)};"></span>${escapeHtml(channel.name)}
                    </div>
                    <button class="secondary-btn" style="width:auto; margin:0; padding:7px 9px; border-radius:10px; font-size:8.5px;" onclick="window.PegasusTV.openUrl('${escapeHtml(guideUrl)}')">Οδηγός</button>
                </div>

                <div class="pegasus-tv-now-label">● ΤΩΡΑ ΠΑΙΖΕΙ</div>
                ${nowProgramme ? `
                    <div class="pegasus-tv-program-title">${escapeHtml(nowProgramme.title || 'Χωρίς τίτλο')}</div>
                    <div class="pegasus-tv-meta-row">
                        <div class="pegasus-tv-program-meta">${escapeHtml(renderProgrammeTime(nowProgramme))} · ${escapeHtml(nowProgramme.kind || 'Πρόγραμμα')}</div>
                        <div class="pegasus-tv-live-badge">${progress}%</div>
                    </div>
                    <div class="pegasus-tv-progress-wrap"><div class="pegasus-tv-progress-bar" style="width:${progress}%;"></div></div>
                    ${nowProgramme.desc ? `<div class="pegasus-tv-program-desc">${escapeHtml(summarizeDesc(nowProgramme.desc))}</div>` : ''}
                ` : `
                    <div class="pegasus-tv-program-title">Δεν βρέθηκε τρέχουσα εκπομπή</div>
                    <div class="pegasus-tv-program-meta">Πάτα ανανέωση ή άνοιξε τον οδηγό.</div>
                `}

                <div class="pegasus-tv-next">
                    <div class="pegasus-tv-next-label">ΜΕΤΑ</div>
                    ${nextProgramme ? `
                        <div class="pegasus-tv-program-title">${escapeHtml(nextProgramme.title || 'Χωρίς τίτλο')}</div>
                        <div class="pegasus-tv-program-meta">${escapeHtml(renderProgrammeTime(nextProgramme))} · ${escapeHtml(nextProgramme.kind || 'Πρόγραμμα')}</div>
                    ` : `
                        <div class="pegasus-tv-program-meta">Δεν φορτώθηκε επόμενο πρόγραμμα.</div>
                    `}
                </div>
            </div>
        `;
    }

    function renderBestGroups(channels) {
        return channels.map(channel => {
            const color = channel.color || '#00ff41';
            const picks = Array.isArray(channel.picks) ? channel.picks.slice(0, 3) : [];
            return `
                <div class="pegasus-tv-best-group" style="border-color:${escapeHtml(color)}55;">
                    <div class="pegasus-tv-best-group-head">
                        <div class="pegasus-tv-channel-name" style="color:${escapeHtml(color)};">
                            <span class="pegasus-tv-dot" style="background:${escapeHtml(color)};"></span>${escapeHtml(channel.name)}
                        </div>
                        <span class="pegasus-tv-source-badge">${picks.length ? `${picks.length} επιλογές` : '—'}</span>
                    </div>
                    <div class="pegasus-tv-pick-list">
                        ${picks.length ? picks.map(renderPick).join('') : '<div class="pegasus-tv-empty">Δεν φορτώθηκαν προτάσεις για σήμερα.</div>'}
                    </div>
                </div>
            `;
        }).join('');
    }


    function renderGuideFallbackNotice(data) {
        if (!data?.guideFallback) return '';
        return `
            <div class="pegasus-tv-notice">
                <div class="pegasus-tv-notice-title">Live πρόγραμμα: χρειάζεται εξωτερική πηγή</div>
                Οι οδηγοί TV δεν επιτρέπουν πάντα απευθείας ανάγνωση μέσα από browser/PWA. Για αυτό κρατάμε τις καθαρές κάρτες καναλιών και ανοίγουμε τον οδηγό με ένα πάτημα. Όταν μπει proxy/worker, το ίδιο module θα δείχνει ξανά “τώρα παίζει” μέσα στο Pegasus.
                <div class="pegasus-tv-guide-links">
                    ${FALLBACK_GUIDES.map(item => `<button class="secondary-btn" onclick="window.PegasusTV.openUrl('${escapeHtml(item.url)}')">${escapeHtml(item.label)}</button>`).join('')}
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

        content.innerHTML = `
            <div class="pegasus-tv-shell">
                ${renderGuideFallbackNotice(data)}
                ${renderChannelChips(channels)}

                <div class="pegasus-tv-panel-title">
                    <span>● Τώρα παίζει</span>
                    <span>6 κανάλια</span>
                </div>
                <div class="pegasus-tv-now-grid">
                    ${channels.map(renderChannelNowCard).join('')}
                </div>

                <div class="pegasus-tv-panel-title">
                    <span>⭐ Καλύτερες επιλογές ημέρας</span>
                    <span>ανά κανάλι</span>
                </div>
                <div class="pegasus-tv-best-grid">
                    ${renderBestGroups(channels)}
                </div>
            </div>
        `;

        if (status) {
            const fetched = data?.fetchedAt ? formatDateTime(new Date(data.fetchedAt)) : '--';
            const source = data?.sourceLabel || 'EPG';
            const freshness = data?.guideFallback ? ' · άνοιγμα οδηγού' : meta.stale ? ' · παλιό cache' : meta.fromCache ? ' · cache' : ' · live';
            status.textContent = `Πηγή: ${source}${freshness} · ενημέρωση ${fetched}`;
        }
    }

    function renderError(error) {
        const content = document.getElementById('pegasusTvContent');
        const status = document.getElementById('pegasusTvStatus');
        if (status) status.textContent = 'Το live EPG δεν είναι διαθέσιμο εδώ. Άνοιξε εξωτερικό οδηγό.';
        if (!content) return;

        const fallbackData = createGuideFallbackData(error);
        const emptyChannels = CHANNELS.map(channel => ({ ...channel, now: null, picks: [], programmes: [] }));
        content.innerHTML = `
            <div class="pegasus-tv-shell">
                ${renderGuideFallbackNotice(fallbackData)}
                ${renderChannelChips(emptyChannels)}
                <div class="pegasus-tv-panel-title"><span>● Τώρα παίζει</span><span>οδηγοί</span></div>
                <div class="pegasus-tv-now-grid">
                    ${emptyChannels.map(renderChannelNowCard).join('')}
                </div>
            </div>
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
            if (status) status.textContent = force ? 'Ανανέωση live προγράμματος...' : 'Έλεγχος live πηγών...';

            try {
                const result = await loadProgramme({ force: Boolean(force) });
                renderData(result.data, result);
            } catch (error) {
                rememberSourceFailure('TV module', error); tvDebug('PEGASUS TV load fallback:', error);
                renderError(error);
            } finally {
                this.loading = false;
            }
        },

        jumpToChannel: function(id) {
            const el = document.getElementById('pegasus-tv-channel-' + id);
            if (el?.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },

        openUrl: function(url) {
            if (!url) return;
            window.open(url, '_blank', 'noopener,noreferrer');
        },

        openFallbackGuide: function() {
            this.openUrl(ATHINORAMA_PICKS_URL);
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
