/* ===== PEGASUS PARKING TRACKER MODULE v2.8.268 (Auto GPS + Last 5 Local History) ===== */
(function installPegasusParking() {
    const LOC_KEY = 'pegasus_parking_loc';
    const HISTORY_KEY = 'pegasus_parking_history';
    const MAX_HISTORY = 5;

    let inFlight = false;
    let lastCaptureAt = 0;

    const safeParse = (raw, fallback) => {
        try { return raw ? JSON.parse(raw) : fallback; } catch (_) { return fallback; }
    };

    const escapeHtml = (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const isGeoAvailable = () => !!(navigator.geolocation && window.isSecureContext);

    function formatTime(ts) {
        if (!ts) return '--';
        try {
            return new Date(Number(ts)).toLocaleString('el-GR', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
            });
        } catch (_) {
            return '--';
        }
    }

    function coordsLabel(lat, lon) {
        const a = Number(lat);
        const b = Number(lon);
        if (!Number.isFinite(a) || !Number.isFinite(b)) return '';
        return `${a.toFixed(5)}, ${b.toFixed(5)}`;
    }

    function mapUrl(item) {
        const lat = Number(item?.lat);
        const lon = Number(item?.lon);
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
            return `https://www.google.com/maps?q=${encodeURIComponent(lat.toFixed(6) + ',' + lon.toFixed(6))}`;
        }
        const loc = String(item?.loc || item || '').trim();
        return loc ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}` : '';
    }

    function normalizeHistoryItem(item) {
        if (!item) return null;

        if (typeof item === 'string') {
            return {
                loc: item,
                label: item,
                ts: Date.now(),
                source: 'manual-legacy'
            };
        }

        if (typeof item === 'object') {
            const lat = Number(item.lat);
            const lon = Number(item.lon);
            const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);
            const label = String(item.label || item.loc || (hasCoords ? coordsLabel(lat, lon) : '')).trim();
            if (!label && !hasCoords) return null;

            return {
                loc: label || coordsLabel(lat, lon),
                label: label || coordsLabel(lat, lon),
                lat: hasCoords ? lat : null,
                lon: hasCoords ? lon : null,
                accuracy: Number.isFinite(Number(item.accuracy)) ? Number(item.accuracy) : null,
                ts: Number(item.ts || item.capturedAt || Date.now()),
                iso: item.iso || new Date(Number(item.ts || item.capturedAt || Date.now())).toISOString(),
                source: item.source || 'parking'
            };
        }

        return null;
    }

    function readCurrent() {
        const raw = localStorage.getItem(LOC_KEY);
        if (!raw || raw === '[object Object]') return null;

        const parsed = safeParse(raw, raw);
        return normalizeHistoryItem(parsed);
    }

    function readHistory() {
        const raw = safeParse(localStorage.getItem(HISTORY_KEY), []);
        const list = Array.isArray(raw) ? raw : [];
        return list.map(normalizeHistoryItem).filter(Boolean).slice(0, MAX_HISTORY);
    }

    function samePlace(a, b) {
        if (!a || !b) return false;
        const alat = Number(a.lat), alon = Number(a.lon), blat = Number(b.lat), blon = Number(b.lon);
        if ([alat, alon, blat, blon].every(Number.isFinite)) {
            return Math.abs(alat - blat) < 0.00003 && Math.abs(alon - blon) < 0.00003;
        }
        return String(a.loc || '').trim().toLowerCase() === String(b.loc || '').trim().toLowerCase();
    }

    function setStatus(message, tone = 'muted') {
        const el = document.getElementById('parkingAutoStatus');
        if (!el) return;
        const color = tone === 'ok' ? '#00ff41' : (tone === 'warn' ? '#ffb300' : (tone === 'bad' ? '#ff4444' : '#aaa'));
        el.style.color = color;
        el.innerHTML = message || '--';
    }

    function saveCurrent(item) {
        const normalized = normalizeHistoryItem(item);
        if (!normalized) return null;

        localStorage.setItem(LOC_KEY, JSON.stringify(normalized));

        let history = readHistory();
        history = history.filter(old => !samePlace(old, normalized));
        history.unshift(normalized);
        history = history.slice(0, MAX_HISTORY);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

        // Also update the local-only last phone location helper storage when GPS exists.
        if (Number.isFinite(Number(normalized.lat)) && Number.isFinite(Number(normalized.lon))) {
            try {
                localStorage.setItem('pegasus_mobile_last_location_v1', JSON.stringify({
                    lat: normalized.lat,
                    lon: normalized.lon,
                    accuracy: normalized.accuracy || 0,
                    capturedAt: normalized.ts,
                    iso: normalized.iso || new Date(normalized.ts).toISOString(),
                    source: 'parking-auto',
                    localOnly: true,
                    sync: 'never'
                }));
                localStorage.setItem('pegasus_mobile_last_location_enabled_v1', 'true');
                localStorage.setItem('pegasus_mobile_last_location_prompted_v1', 'true');
            } catch (_) {}
        }

        this.updateUI?.();
        return normalized;
    }

    function buildGpsItem(position, source = 'auto') {
        const c = position?.coords || {};
        const lat = Number(c.latitude);
        const lon = Number(c.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('invalid_coordinates');
        const now = Date.now();
        const label = `GPS ${coordsLabel(lat, lon)}`;
        return {
            loc: label,
            label,
            lat,
            lon,
            accuracy: Number.isFinite(Number(c.accuracy)) ? Number(c.accuracy) : null,
            ts: now,
            iso: new Date(now).toISOString(),
            source: source === 'manual' ? 'parking-manual-gps' : 'parking-auto-gps',
            localOnly: true
        };
    }

    window.PegasusParking = {
        save: async function() {
            const inputEl = document.getElementById('parkingInput');
            const location = inputEl ? inputEl.value.trim() : '';
            if (!location) return;

            const item = {
                loc: location,
                label: location,
                ts: Date.now(),
                iso: new Date().toISOString(),
                source: 'parking-manual-note',
                localOnly: true
            };

            saveCurrent.call(this, item);
            if (inputEl) inputEl.value = '';
            setStatus('Αποθηκεύτηκε χειροκίνητη σημείωση parking.', 'ok');
        },

        captureCurrentLocation: function(source = 'auto') {
            if (inFlight) return Promise.resolve(readCurrent());

            if (!isGeoAvailable()) {
                setStatus('Η αυτόματη τοποθεσία θέλει HTTPS/Chrome και άδεια τοποθεσίας.', 'warn');
                this.updateUI();
                return Promise.resolve(null);
            }

            // Avoid double captures caused by openView + UI refresh firing together.
            if (source === 'auto' && Date.now() - lastCaptureAt < 12000) {
                this.updateUI();
                return Promise.resolve(readCurrent());
            }

            inFlight = true;
            lastCaptureAt = Date.now();
            setStatus('Ζητάω GPS από το κινητό...', 'warn');

            return new Promise(resolve => {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        inFlight = false;
                        try {
                            const item = buildGpsItem(position, source);
                            const saved = saveCurrent.call(this, item);
                            const acc = Number.isFinite(Number(saved?.accuracy)) ? ` · ±${Math.round(Number(saved.accuracy))}m` : '';
                            setStatus(`Αποθηκεύτηκε αυτόματα η θέση parking.<br>📍 ${escapeHtml(coordsLabel(saved.lat, saved.lon))}<br>🕒 ${escapeHtml(formatTime(saved.ts))}${acc}`, 'ok');
                            resolve(saved);
                        } catch (e) {
                            setStatus('Δεν μπόρεσε να αποθηκευτεί η τοποθεσία parking.', 'bad');
                            resolve(null);
                        }
                    },
                    error => {
                        inFlight = false;
                        const msg = error?.code === 1
                            ? 'Η άδεια τοποθεσίας δεν δόθηκε στο app/browser.'
                            : 'Δεν μπόρεσε να βρεθεί GPS τώρα.';
                        setStatus(msg, 'warn');
                        this.updateUI();
                        resolve(null);
                    },
                    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
                );
            });
        },

        onOpen: function() {
            this.updateUI();
            return this.captureCurrentLocation('auto');
        },

        updateUI: function() {
            const current = readCurrent();
            const locToDisplay = current?.loc || '--';
            const statusEl = document.getElementById('parkingStatus');
            if (statusEl) statusEl.textContent = `ΠΑΡΚΙΝΓΚ: ${locToDisplay}`;

            if (current) {
                const acc = Number.isFinite(Number(current.accuracy)) ? ` · ±${Math.round(Number(current.accuracy))}m` : '';
                setStatus(
                    `Τελευταία θέση parking:<br>` +
                    `📍 ${escapeHtml(current.loc)}<br>` +
                    `🕒 ${escapeHtml(formatTime(current.ts))}${acc}`,
                    'ok'
                );
            } else if (isGeoAvailable()) {
                setStatus('Μπαίνοντας στο Parking θα αποθηκεύεται αυτόματα η τρέχουσα GPS θέση.', 'muted');
            } else {
                setStatus('Μη διαθέσιμο εδώ. Χρειάζεται HTTPS/Chrome ή APK με GPS permission.', 'warn');
            }

            this.renderHistory();
        },

        renderHistory: function() {
            const history = readHistory();
            const container = document.getElementById('parkingHistoryList');
            if (!container) return;

            if (!history.length) {
                container.innerHTML = `<div class="log-item" style="opacity:.75;">Δεν υπάρχει ακόμα ιστορικό parking.</div>`;
                return;
            }

            container.innerHTML = history.map((item, index) => {
                const acc = Number.isFinite(Number(item.accuracy)) ? ` · ±${Math.round(Number(item.accuracy))}m` : '';
                const url = mapUrl(item);
                return `
                    <div class="log-item" style="cursor:pointer; border-color:rgba(255, 152, 0, 0.42); margin-bottom:8px;">
                        <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
                            <div style="min-width:0;">
                                <div style="font-size:13px; font-weight:900; color:#fff; line-height:1.35;">📍 ${escapeHtml(item.loc)}</div>
                                <div style="font-size:10px; font-weight:800; color:#ffb300; margin-top:4px;">#${index + 1} · ${escapeHtml(formatTime(item.ts))}${acc}</div>
                            </div>
                            <button class="secondary-btn" onclick="event.stopPropagation(); window.open('${escapeHtml(url)}', '_blank', 'noopener,noreferrer');" style="width:auto; padding:7px 9px; font-size:9px;">ΧΑΡΤΗΣ</button>
                        </div>
                    </div>
                `;
            }).join('');
        },

        openCurrentMap: function() {
            const current = readCurrent();
            const url = mapUrl(current);
            if (url) window.open(url, '_blank', 'noopener,noreferrer');
        },

        readCurrent,
        readHistory
    };

    window.addEventListener('pegasus_sync_complete', () => {
        window.PegasusParking.updateUI();
    });

    document.addEventListener('DOMContentLoaded', () => {
        window.PegasusParking.updateUI();
        setTimeout(() => window.PegasusParking.updateUI(), 2000);
    });

    console.log('📍 PEGASUS PARKING: Auto GPS + last 5 local history active v2.8.268');
})();
