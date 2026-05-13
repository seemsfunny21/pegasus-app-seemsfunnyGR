/* ===== PEGASUS PARKING TRACKER MODULE v3.3.273 (GPS coordinates + fixed-width UI) ===== */
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
        } catch (_) { return '--'; }
    }

    function hasCoords(item) {
        const lat = Number(item?.lat);
        const lon = Number(item?.lon);
        return Number.isFinite(lat) && Number.isFinite(lon);
    }

    function formatCoords(item) {
        const lat = Number(item?.lat);
        const lon = Number(item?.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return '--';
        return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    }

    function displayLabel(item) {
        if (!item) return '--';
        if (hasCoords(item)) return formatCoords(item);
        const raw = String(item.loc || item.label || '').trim();
        return raw || '--';
    }

    function googleMapsWebUrl(item) {
        if (hasCoords(item)) {
            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatCoords(item).replace(/\s+/g, ''))}`;
        }
        const loc = String(item?.loc || item?.label || item || '').trim();
        return loc ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}` : '';
    }

    function openMapDirect(item) {
        const url = googleMapsWebUrl(item);
        if (!url) return;
        // Use Google Maps web URL directly. This avoids geo:// fallbacks that can send APK WebView to Play Store.
        window.location.href = url;
    }

    function normalizeHistoryItem(item) {
        if (!item) return null;

        if (typeof item === 'string') {
            return { loc: item, label: item, ts: Date.now(), source: 'legacy', localOnly: true };
        }

        if (typeof item === 'object') {
            const lat = Number(item.lat);
            const lon = Number(item.lon);
            const gps = Number.isFinite(lat) && Number.isFinite(lon);
            const label = gps ? `${lat.toFixed(6)}, ${lon.toFixed(6)}` : String(item.loc || item.label || '').trim();
            if (!label && !gps) return null;

            return {
                loc: label,
                label,
                lat: gps ? lat : null,
                lon: gps ? lon : null,
                accuracy: Number.isFinite(Number(item.accuracy)) ? Number(item.accuracy) : null,
                ts: Number(item.ts || item.capturedAt || Date.now()),
                iso: item.iso || new Date(Number(item.ts || item.capturedAt || Date.now())).toISOString(),
                source: item.source || 'parking',
                localOnly: true
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

    function writePhoneLastLocation(item) {
        const normalized = normalizeHistoryItem(item);
        if (!normalized || !hasCoords(normalized)) return;
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

    function saveCurrent(item) {
        const normalized = normalizeHistoryItem(item);
        if (!normalized) return null;

        localStorage.setItem(LOC_KEY, JSON.stringify(normalized));

        let history = readHistory();
        history = history.filter(old => !samePlace(old, normalized));
        history.unshift(normalized);
        history = history.slice(0, MAX_HISTORY);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

        writePhoneLastLocation(normalized);
        window.PegasusParking?.updateUI?.();
        return normalized;
    }

    function buildGpsItem(position, source = 'auto') {
        const c = position?.coords || {};
        const lat = Number(c.latitude);
        const lon = Number(c.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('invalid_coordinates');
        const now = Date.now();
        return {
            loc: `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
            label: `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
            lat, lon,
            accuracy: Number.isFinite(Number(c.accuracy)) ? Number(c.accuracy) : null,
            ts: now,
            iso: new Date(now).toISOString(),
            source: source === 'manual' ? 'parking-manual-gps' : 'parking-auto-gps',
            localOnly: true
        };
    }

    function renderCurrentSummary(item = readCurrent()) {
        const el = document.getElementById('parkingLocationSummary');
        if (!el) return;
        const normalized = normalizeHistoryItem(item);
        if (!normalized) {
            el.innerHTML = `
                <div class="parking-current-card empty">
                    <div class="parking-current-icon">🅿️</div>
                    <div class="parking-current-body">
                        <div class="parking-current-title">Δεν έχει αποθηκευτεί θέση parking</div>
                        <div class="parking-current-meta">Μπες στο Parking για αυτόματη GPS αποθήκευση.</div>
                    </div>
                </div>`;
            return;
        }

        const acc = Number.isFinite(Number(normalized.accuracy)) ? ` · ±${Math.round(Number(normalized.accuracy))}m` : '';
        el.innerHTML = `
            <div class="parking-current-card">
                <div class="parking-current-icon">📍</div>
                <div class="parking-current-body">
                    <div class="parking-current-title">${escapeHtml(displayLabel(normalized))}</div>
                    <div class="parking-current-meta">${escapeHtml(formatTime(normalized.ts))}${escapeHtml(acc)}</div>
                    <div class="parking-current-hint">Αποθηκευμένο τοπικά στο κινητό · ιστορικό 5 θέσεων.</div>
                </div>
            </div>`;
    }

    window.PegasusParking = {
        save: function() { return saveCurrent(readCurrent()); },

        captureCurrentLocation: function(source = 'auto') {
            if (inFlight) return Promise.resolve(readCurrent());
            if (!isGeoAvailable()) {
                setStatus('Η αυτόματη τοποθεσία θέλει HTTPS/Chrome ή APK με GPS permission.', 'warn');
                this.updateUI();
                return Promise.resolve(null);
            }
            if (source === 'auto' && Date.now() - lastCaptureAt < 12000) {
                this.updateUI();
                return Promise.resolve(readCurrent());
            }

            inFlight = true;
            lastCaptureAt = Date.now();
            setStatus('Εντοπισμός θέσης parking...', 'warn');

            return new Promise(resolve => {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        inFlight = false;
                        try {
                            const item = buildGpsItem(position, source);
                            const saved = saveCurrent(item);
                            const acc = Number.isFinite(Number(saved?.accuracy)) ? ` · ±${Math.round(Number(saved.accuracy))}m` : '';
                            setStatus(`Τελευταία θέση parking:<br>📍 ${escapeHtml(displayLabel(saved))}<br>🕒 ${escapeHtml(formatTime(saved.ts))}${acc}`, 'ok');
                            resolve(saved);
                        } catch (e) {
                            setStatus('Δεν μπόρεσε να αποθηκευτεί η τοποθεσία parking.', 'bad');
                            resolve(null);
                        }
                    },
                    error => {
                        inFlight = false;
                        const msg = error?.code === 1 ? 'Η άδεια τοποθεσίας δεν δόθηκε στο app/browser.' : 'Δεν μπόρεσε να βρεθεί GPS τώρα.';
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
            const locToDisplay = current ? displayLabel(current) : '--';
            const statusEl = document.getElementById('parkingStatus');
            if (statusEl) statusEl.textContent = `ΠΑΡΚΙΝΓΚ: ${locToDisplay}`;

            renderCurrentSummary(current);

            if (current) {
                const acc = Number.isFinite(Number(current.accuracy)) ? ` · ±${Math.round(Number(current.accuracy))}m` : '';
                setStatus(`Τελευταία θέση parking:<br>📍 ${escapeHtml(displayLabel(current))}<br>🕒 ${escapeHtml(formatTime(current.ts))}${acc}`, 'ok');
            } else if (isGeoAvailable()) {
                setStatus('Μπαίνοντας στο Parking αποθηκεύεται αυτόματα η GPS θέση.', 'muted');
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
                container.innerHTML = `<div class="log-item" style="opacity:.75; font-size:11px;">Δεν υπάρχει ακόμα ιστορικό parking.</div>`;
                return;
            }
            container.innerHTML = history.map((item, index) => {
                const acc = Number.isFinite(Number(item.accuracy)) ? ` · ±${Math.round(Number(item.accuracy))}m` : '';
                const label = displayLabel(item);
                const canMap = googleMapsWebUrl(item);
                return `
                    <div class="parking-history-card">
                        <div class="parking-history-index">${index + 1}</div>
                        <div class="parking-history-info">
                            <div class="parking-history-title">${escapeHtml(label)}</div>
                            <div class="parking-history-meta">${escapeHtml(formatTime(item.ts))}${escapeHtml(acc)}</div>
                        </div>
                        <button class="parking-history-map-btn" type="button" ${canMap ? `onclick="window.PegasusParking.openMapFromHistory(${index})"` : 'disabled'}>ΧΑΡΤΗΣ</button>
                    </div>`;
            }).join('');
        },

        openCurrentMap: function() { openMapDirect(readCurrent()); },
        openMapFromHistory: function(index) { openMapDirect(readHistory()[Number(index) || 0]); },
        openMapFromItemTs: function(ts) {
            const stamp = Number(ts || 0);
            const current = readCurrent();
            if (current && Number(current.ts) === stamp) return openMapDirect(current);
            openMapDirect(readHistory().find(x => Number(x.ts) === stamp) || current);
        },

        staticMapUrl: googleMapsWebUrl,
        renderCurrentSummary,
        readCurrent,
        readHistory,
        displayLabel
    };

    window.addEventListener('pegasus_sync_complete', () => window.PegasusParking.updateUI());
    document.addEventListener('DOMContentLoaded', () => {
        window.PegasusParking.updateUI();
        setTimeout(() => window.PegasusParking.updateUI(), 2000);
    });

    console.log('📍 PEGASUS PARKING: GPS coordinates parking active v3.3.273');
})();
