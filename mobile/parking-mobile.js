/* ===== PEGASUS PARKING TRACKER MODULE v3.2.272 (street labels + manual area, no map preview) ===== */
(function installPegasusParking() {
    const LOC_KEY = 'pegasus_parking_loc';
    const HISTORY_KEY = 'pegasus_parking_history';
    const ADDRESS_CACHE_KEY = 'pegasus_parking_address_cache_v1';
    const MAX_HISTORY = 5;

    let inFlight = false;
    let lastCaptureAt = 0;
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

    function isCoordinateLike(value) {
        const s = String(value || '').trim();
        return /^GPS\s*-?\d/i.test(s) || /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(s);
    }

    function displayLabel(item) {
        if (!item) return '--';
        const address = String(item.address || item.street || '').trim();
        if (address) return address;

        const raw = String(item.label || item.loc || '').trim();
        if (raw && !isCoordinateLike(raw) && raw !== 'Εύρεση οδού...') return raw;

        if (item.addressStatus === 'pending') return 'Εύρεση οδού...';
        if (Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lon))) return 'GPS θέση · γράψε περιοχή αν δεν βρεθεί οδός';
        return raw || '--';
    }

    function googleMapsWebUrl(item) {
        const lat = Number(item?.lat);
        const lon = Number(item?.lon);
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lat.toFixed(6) + ',' + lon.toFixed(6))}`;
        }
        const loc = String(item?.address || item?.street || item?.loc || item || '').trim();
        return loc ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}` : '';
    }

    function nativeMapUrl(item) {
        const lat = Number(item?.lat);
        const lon = Number(item?.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return '';
        const label = encodeURIComponent(displayLabel(item) || 'Parking');
        return `geo:0,0?q=${lat.toFixed(6)},${lon.toFixed(6)}(${label})`;
    }

    function hasCoords(item) {
        const lat = Number(item?.lat);
        const lon = Number(item?.lon);
        return Number.isFinite(lat) && Number.isFinite(lon);
    }

    function openMapDirect(item) {
        const url = googleMapsWebUrl(item);
        if (!url) return;

        const nativeUrl = nativeMapUrl(item);
        const isAndroid = /Android/i.test(navigator.userAgent || '');

        if (isAndroid && nativeUrl) {
            let pageHidden = false;
            const onVisibility = () => { if (document.hidden) pageHidden = true; };
            document.addEventListener('visibilitychange', onVisibility, { once: true });

            try { window.location.href = nativeUrl; } catch (_) { window.location.href = url; return; }

            window.setTimeout(() => {
                document.removeEventListener('visibilitychange', onVisibility);
                if (!pageHidden && !document.hidden) window.location.href = url;
            }, 900);
            return;
        }

        window.location.href = url;
    }

    function normalizeHistoryItem(item) {
        if (!item) return null;

        if (typeof item === 'string') {
            return { loc: item, label: item, address: item, street: item, ts: Date.now(), source: 'manual-legacy', addressStatus: 'manual', localOnly: true };
        }

        if (typeof item === 'object') {
            const lat = Number(item.lat);
            const lon = Number(item.lon);
            const hasGps = Number.isFinite(lat) && Number.isFinite(lon);
            const address = String(item.address || item.street || '').trim();
            const rawLabel = String(item.label || item.loc || '').trim();
            const label = address || rawLabel || (hasGps ? 'GPS θέση' : '');
            if (!label && !hasGps) return null;

            return {
                loc: label,
                label,
                address: address || '',
                street: String(item.street || address || '').trim(),
                lat: hasGps ? lat : null,
                lon: hasGps ? lon : null,
                accuracy: Number.isFinite(Number(item.accuracy)) ? Number(item.accuracy) : null,
                ts: Number(item.ts || item.capturedAt || Date.now()),
                iso: item.iso || new Date(Number(item.ts || item.capturedAt || Date.now())).toISOString(),
                source: item.source || 'parking',
                addressStatus: item.addressStatus || (address ? 'ok' : (hasGps ? 'pending' : 'manual')),
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

    function addressCacheKey(lat, lon) {
        return `${Number(lat).toFixed(5)},${Number(lon).toFixed(5)}`;
    }

    function readAddressCache() {
        const data = safeParse(localStorage.getItem(ADDRESS_CACHE_KEY), {});
        return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    }

    function writeAddressCache(cache) {
        try { localStorage.setItem(ADDRESS_CACHE_KEY, JSON.stringify(cache || {})); } catch (_) {}
    }

    function addressFromNominatim(data) {
        const a = data?.address || {};
        const road = a.road || a.pedestrian || a.footway || a.path || a.cycleway || a.residential || a.neighbourhood || '';
        const number = a.house_number || '';
        const area = a.suburb || a.neighbourhood || a.city_district || '';
        const city = a.city || a.town || a.village || a.municipality || a.county || '';

        const street = [road, number].filter(Boolean).join(' ').trim();
        const parts = [];
        if (street) parts.push(street);
        if (area && area !== street) parts.push(area);
        if (city && city !== area) parts.push(city);

        const short = parts.join(', ').trim();
        if (short) return short;

        const display = String(data?.display_name || '').split(',').slice(0, 3).join(', ').trim();
        return display || '';
    }

    async function reverseGeocode(lat, lon) {
        const key = addressCacheKey(lat, lon);
        const cache = readAddressCache();
        const cached = cache[key];
        if (cached?.address && Date.now() - Number(cached.ts || 0) < 14 * 24 * 60 * 60 * 1000) return cached.address;

        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 8000);
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1&accept-language=el`;
            const res = await fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } });
            if (!res.ok) throw new Error('reverse_geocode_http_' + res.status);
            const data = await res.json();
            const address = addressFromNominatim(data);
            if (address) {
                cache[key] = { address, ts: Date.now() };
                writeAddressCache(cache);
            }
            return address;
        } finally { window.clearTimeout(timer); }
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
                address: normalized.address || '',
                street: normalized.street || '',
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
        this.updateUI?.();
        return normalized;
    }

    function updateManualAddress(baseItem, manualText) {
        const normalized = normalizeHistoryItem(baseItem);
        const address = String(manualText || '').trim();
        if (!address) return null;

        const enriched = normalized ? {
            ...normalized,
            loc: address,
            label: address,
            address,
            street: address,
            addressStatus: 'manual'
        } : {
            loc: address,
            label: address,
            address,
            street: address,
            addressStatus: 'manual',
            ts: Date.now(),
            iso: new Date().toISOString(),
            source: 'parking-manual-area',
            localOnly: true
        };

        localStorage.setItem(LOC_KEY, JSON.stringify(enriched));

        let matched = false;
        let history = readHistory().map(old => {
            if (normalized && (old.ts === normalized.ts || samePlace(old, normalized))) {
                matched = true;
                return { ...old, ...enriched };
            }
            return old;
        });
        if (!matched) history.unshift(enriched);
        history = history.filter(Boolean).slice(0, MAX_HISTORY);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

        if (hasCoords(enriched)) writePhoneLastLocation(enriched);
        window.PegasusParking?.updateUI?.();
        return enriched;
    }

    function updateStoredAddress(baseItem, address) {
        const normalized = normalizeHistoryItem(baseItem);
        if (!normalized || !address) return;

        // Do not overwrite a manual label with reverse-geocode text.
        if (normalized.addressStatus === 'manual' && normalized.address) return;

        const enriched = { ...normalized, loc: address, label: address, address, street: address, addressStatus: 'ok' };

        const current = readCurrent();
        if (current && (current.ts === normalized.ts || samePlace(current, normalized)) && current.addressStatus !== 'manual') {
            localStorage.setItem(LOC_KEY, JSON.stringify(enriched));
        }

        const history = readHistory().map(old => {
            if ((old.ts === normalized.ts || samePlace(old, normalized)) && old.addressStatus !== 'manual') return { ...old, ...enriched };
            return old;
        }).slice(0, MAX_HISTORY);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        writePhoneLastLocation(enriched);
        window.PegasusParking?.updateUI?.();
    }

    async function hydrateAddress(item) {
        const normalized = normalizeHistoryItem(item);
        if (!normalized || addressInFlight) return normalized;
        if (normalized.addressStatus === 'manual') return normalized;
        const lat = Number(normalized.lat);
        const lon = Number(normalized.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon) || normalized.address) return normalized;

        addressInFlight = true;
        try {
            const address = await reverseGeocode(lat, lon);
            if (address) updateStoredAddress(normalized, address);
            else {
                const current = readCurrent();
                if (current && (current.ts === normalized.ts || samePlace(current, normalized))) {
                    current.addressStatus = 'failed';
                    localStorage.setItem(LOC_KEY, JSON.stringify(current));
                }
            }
        } catch (e) {
            console.warn('PEGASUS PARKING: reverse geocode unavailable:', e?.message || e);
        } finally {
            addressInFlight = false;
            window.PegasusParking?.updateUI?.();
        }
        return readCurrent() || normalized;
    }

    function buildGpsItem(position, source = 'auto') {
        const c = position?.coords || {};
        const lat = Number(c.latitude);
        const lon = Number(c.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('invalid_coordinates');
        const now = Date.now();
        return {
            loc: 'Εύρεση οδού...', label: 'Εύρεση οδού...', address: '', street: '', addressStatus: 'pending',
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
                    <div>
                        <div class="parking-current-title">Δεν έχει αποθηκευτεί θέση parking</div>
                        <div class="parking-current-meta">Μπες στο Parking για αυτόματη GPS αποθήκευση.</div>
                    </div>
                </div>`;
            return;
        }

        const acc = Number.isFinite(Number(normalized.accuracy)) ? ` · ±${Math.round(Number(normalized.accuracy))}m` : '';
        const hint = normalized.addressStatus === 'pending'
            ? 'Γίνεται αναζήτηση οδού. Μπορείς να γράψεις χειροκίνητα περιοχή από κάτω.'
            : (normalized.addressStatus === 'failed' ? 'Δεν βρέθηκε οδός. Γράψε χειροκίνητα περιοχή από κάτω.' : 'Αποθηκευμένο τοπικά στο κινητό.');

        el.innerHTML = `
            <div class="parking-current-card">
                <div class="parking-current-icon">📍</div>
                <div class="parking-current-body">
                    <div class="parking-current-title">${escapeHtml(displayLabel(normalized))}</div>
                    <div class="parking-current-meta">${escapeHtml(formatTime(normalized.ts))}${escapeHtml(acc)}</div>
                    <div class="parking-current-hint">${escapeHtml(hint)}</div>
                </div>
            </div>`;
    }

    window.PegasusParking = {
        save: async function() {
            const inputEl = document.getElementById('parkingInput');
            const location = inputEl ? inputEl.value.trim() : '';
            if (!location) return;
            const saved = updateManualAddress(readCurrent(), location);
            if (inputEl) inputEl.value = '';
            if (saved) setStatus(`Περιοχή parking:<br>📍 ${escapeHtml(displayLabel(saved))}`, 'ok');
        },

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
                            const saved = saveCurrent.call(this, item);
                            const acc = Number.isFinite(Number(saved?.accuracy)) ? ` · ±${Math.round(Number(saved.accuracy))}m` : '';
                            setStatus(`Τελευταία θέση parking:<br>📍 ${escapeHtml(displayLabel(saved))}<br>🕒 ${escapeHtml(formatTime(saved.ts))}${acc}`, 'ok');
                            hydrateAddress(saved).then(finalItem => {
                                const final = finalItem || readCurrent();
                                if (final) {
                                    const finalAcc = Number.isFinite(Number(final.accuracy)) ? ` · ±${Math.round(Number(final.accuracy))}m` : '';
                                    setStatus(`Τελευταία θέση parking:<br>📍 ${escapeHtml(displayLabel(final))}<br>🕒 ${escapeHtml(formatTime(final.ts))}${finalAcc}`, 'ok');
                                }
                            });
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
                if (current.addressStatus === 'pending') hydrateAddress(current);
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
                container.innerHTML = `<div class="log-item" style="opacity:.75;">Δεν υπάρχει ακόμα ιστορικό parking.</div>`;
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

    console.log('📍 PEGASUS PARKING: Street/manual label parking active v3.2.272');
})();
