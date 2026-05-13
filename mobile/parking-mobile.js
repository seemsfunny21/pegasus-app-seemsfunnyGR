/* ===== PEGASUS PARKING TRACKER MODULE v3.7.277 (stable geo map open + fixed map button text) ===== */
(function installPegasusParking() {
    const LOC_KEY = 'pegasus_parking_loc';
    const HISTORY_KEY = 'pegasus_parking_history';
    const MAX_HISTORY = 5;
    const GEOCODE_TIMEOUT_MS = 8500;

    let inFlight = false;
    let addressInFlight = false;

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

    function isCoordinateText(value) {
        return /^-?\d{1,3}(?:\.\d+)?\s*,\s*-?\d{1,3}(?:\.\d+)?$/.test(String(value || '').trim());
    }

    function cleanAddressPart(value) {
        return String(value || '')
            .replace(/\s+/g, ' ')
            .replace(/,\s*,+/g, ',')
            .trim();
    }

    function addressFromNominatim(data) {
        const a = data?.address || {};
        const road = cleanAddressPart(a.road || a.pedestrian || a.footway || a.path || a.cycleway || a.neighbourhood || a.suburb || a.quarter);
        const number = cleanAddressPart(a.house_number);
        const city = cleanAddressPart(a.city || a.town || a.village || a.municipality || a.county);

        if (road && number && city) return `${road} ${number}, ${city}`;
        if (road && number) return `${road} ${number}`;
        if (road && city) return `${road}, ${city}`;
        if (road) return road;

        const fallback = cleanAddressPart(data?.name || data?.display_name || '');
        if (!fallback) return '';

        // Keep only the first useful pieces so the Parking card stays compact.
        const pieces = fallback.split(',').map(cleanAddressPart).filter(Boolean);
        return pieces.slice(0, 3).join(', ');
    }

    function displayLabel(item) {
        if (!item) return '--';
        const preferred = cleanAddressPart(item.addressLabel || item.streetLabel || item.label || item.loc);
        if (preferred && !isCoordinateText(preferred)) return preferred;
        if (hasCoords(item)) return formatCoords(item);
        return preferred || '--';
    }

    function mapQuery(item) {
        if (hasCoords(item)) return formatCoords(item).replace(/\s+/g, '');
        return String(item?.loc || item?.label || item || '').trim();
    }

    function googleMapsWebUrl(item) {
        const query = mapQuery(item);
        return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : '';
    }

    function nativeGeoUrl(item) {
        if (!hasCoords(item)) return '';
        const lat = Number(item.lat).toFixed(6);
        const lon = Number(item.lon).toFixed(6);
        const label = encodeURIComponent(displayLabel(item) || 'Parking');
        return `geo:0,0?q=${lat},${lon}(${label})`;
    }

    function openMapDirect(item) {
        const normalized = normalizeHistoryItem(item);
        const webUrl = googleMapsWebUrl(normalized);
        if (!webUrl) return;

        const isAndroid = /Android/i.test(navigator.userAgent || '');
        const geoUrl = isAndroid ? nativeGeoUrl(normalized) : '';

        // In WebView/APK, Google Maps web and package intents can route through Google Play.
        // The Android geo: URI opens the installed Maps handler directly and avoids the Play Store page.
        if (geoUrl) {
            try {
                window.location.href = geoUrl;
                return;
            } catch (_) {
                // Last resort only. Do not auto-fallback with a timer because that can steal focus back from Maps.
            }
        }

        window.location.href = webUrl;
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
            const coords = gps ? `${lat.toFixed(6)}, ${lon.toFixed(6)}` : '';
            const rawLabel = cleanAddressPart(item.addressLabel || item.streetLabel || item.label || item.loc || '');
            const label = rawLabel || coords;
            if (!label && !gps) return null;

            const ts = Number(item.ts || item.capturedAt || Date.now());
            return {
                loc: label,
                label,
                streetLabel: cleanAddressPart(item.streetLabel || ''),
                addressLabel: cleanAddressPart(item.addressLabel || ''),
                addressSource: item.addressSource || '',
                addressPending: !!item.addressPending,
                lat: gps ? lat : null,
                lon: gps ? lon : null,
                accuracy: Number.isFinite(Number(item.accuracy)) ? Number(item.accuracy) : null,
                ts,
                iso: item.iso || new Date(ts).toISOString(),
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
                label: displayLabel(normalized),
                accuracy: normalized.accuracy || 0,
                capturedAt: normalized.ts,
                iso: normalized.iso || new Date(normalized.ts).toISOString(),
                source: 'parking-manual',
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

    function updateSavedAddress(ts, label, source = 'nominatim') {
        const current = readCurrent();
        if (!current || Number(current.ts) !== Number(ts) || !label) return null;
        const updated = {
            ...current,
            loc: label,
            label,
            addressLabel: label,
            streetLabel: label,
            addressSource: source,
            addressPending: false
        };
        return saveCurrent(updated);
    }

    function buildGpsItem(position, source = 'auto') {
        const c = position?.coords || {};
        const lat = Number(c.latitude);
        const lon = Number(c.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('invalid_coordinates');
        const now = Date.now();
        const coords = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
        return {
            loc: coords,
            label: coords,
            addressLabel: '',
            streetLabel: '',
            addressPending: true,
            lat, lon,
            accuracy: Number.isFinite(Number(c.accuracy)) ? Number(c.accuracy) : null,
            ts: now,
            iso: new Date(now).toISOString(),
            source: source === 'manual' ? 'parking-manual-gps' : 'parking-auto-gps',
            localOnly: true
        };
    }

    async function reverseGeocode(item) {
        if (!hasCoords(item) || !window.fetch) return '';
        const controller = window.AbortController ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), GEOCODE_TIMEOUT_MS) : null;
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(item.lat)}&lon=${encodeURIComponent(item.lon)}&zoom=18&addressdetails=1&accept-language=el`;
        try {
            const res = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-store',
                signal: controller?.signal,
                headers: { 'Accept': 'application/json' }
            });
            if (!res.ok) throw new Error(`reverse_geocode_${res.status}`);
            const data = await res.json();
            return addressFromNominatim(data);
        } catch (e) {
            console.info('PEGASUS PARKING: street lookup unavailable, keeping coordinates.', e?.message || e);
            return '';
        } finally {
            if (timer) clearTimeout(timer);
        }
    }

    async function enrichAddressForSavedItem(item) {
        if (!item || !hasCoords(item) || addressInFlight) return item;
        addressInFlight = true;
        try {
            const label = await reverseGeocode(item);
            if (label) {
                const updated = updateSavedAddress(item.ts, label, 'nominatim');
                if (updated) {
                    setStatus(`Τελευταία θέση parking:<br>📍 ${escapeHtml(displayLabel(updated))}<br>🕒 ${escapeHtml(formatTime(updated.ts))}`, 'ok');
                    return updated;
                }
            } else {
                const current = readCurrent();
                if (current && Number(current.ts) === Number(item.ts)) {
                    current.addressPending = false;
                    saveCurrent(current);
                }
            }
            return readCurrent() || item;
        } finally {
            addressInFlight = false;
        }
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
                        <div class="parking-current-meta">Πάτα ΑΠΟΘΗΚΕΥΣΗ ΘΕΣΗΣ όταν παρκάρεις.</div>
                    </div>
                </div>`;
            return;
        }

        const acc = Number.isFinite(Number(normalized.accuracy)) ? ` · ±${Math.round(Number(normalized.accuracy))}m` : '';
        const coords = hasCoords(normalized) ? ` · ${formatCoords(normalized)}` : '';
        const pending = normalized.addressPending && isCoordinateText(displayLabel(normalized)) ? ' · εύρεση οδού...' : '';
        el.innerHTML = `
            <div class="parking-current-card">
                <div class="parking-current-icon">📍</div>
                <div class="parking-current-body">
                    <div class="parking-current-title">${escapeHtml(displayLabel(normalized))}</div>
                    <div class="parking-current-meta">${escapeHtml(formatTime(normalized.ts))}${escapeHtml(acc)}${escapeHtml(pending)}</div>
                    <div class="parking-current-hint">Αποθηκευμένο τοπικά στο κινητό · ιστορικό 5 θέσεων.${escapeHtml(coords)}</div>
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
            if (source === 'auto') {
                // Safety: never overwrite the saved car position just by opening Parking.
                this.updateUI();
                return Promise.resolve(readCurrent());
            }

            inFlight = true;
            setStatus('Εντοπισμός και αποθήκευση θέσης parking...', 'warn');

            return new Promise(resolve => {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        inFlight = false;
                        try {
                            const item = buildGpsItem(position, source);
                            const saved = saveCurrent(item);
                            const acc = Number.isFinite(Number(saved?.accuracy)) ? ` · ±${Math.round(Number(saved.accuracy))}m` : '';
                            setStatus(`Τελευταία θέση parking:<br>📍 ${escapeHtml(displayLabel(saved))}<br>🕒 ${escapeHtml(formatTime(saved.ts))}${acc}<br><span style="opacity:.75">Γίνεται εύρεση οδού...</span>`, 'ok');
                            enrichAddressForSavedItem(saved).then(finalItem => resolve(finalItem || saved));
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
            // Manual-only parking: opening the panel must not overwrite the saved car location.
            this.updateUI();
            return Promise.resolve(readCurrent());
        },

        updateUI: function() {
            const current = readCurrent();
            const locToDisplay = current ? displayLabel(current) : '--';
            const statusEl = document.getElementById('parkingStatus');
            if (statusEl) statusEl.textContent = `ΠΑΡΚΙΝΓΚ: ${locToDisplay}`;

            renderCurrentSummary(current);

            if (current) {
                const acc = Number.isFinite(Number(current.accuracy)) ? ` · ±${Math.round(Number(current.accuracy))}m` : '';
                const pending = current.addressPending && isCoordinateText(displayLabel(current)) ? '<br><span style="opacity:.75">Γίνεται εύρεση οδού...</span>' : '';
                setStatus(`Τελευταία θέση parking:<br>📍 ${escapeHtml(displayLabel(current))}<br>🕒 ${escapeHtml(formatTime(current.ts))}${acc}${pending}`, 'ok');
            } else if (isGeoAvailable()) {
                setStatus('Δεν γίνεται αυτόματη αποθήκευση. Πάτα ΑΠΟΘΗΚΕΥΣΗ ΘΕΣΗΣ όταν παρκάρεις.', 'muted');
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
                        <button class="parking-history-map-btn" type="button" ${canMap ? `onclick="window.PegasusParking.openMapFromHistory(${index})"` : 'disabled'} data-pegasus-fixed-text="true" aria-label="Άνοιγμα χάρτη">Χάρτης</button>
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

    console.log('📍 PEGASUS PARKING: stable geo map + fixed label active v3.7.277');
})();
