/* ===== PEGASUS PARKING TRACKER MODULE v4.2.282 (10-slot history + select-to-top) ===== */
(function installPegasusParking() {
    const LOC_KEY = 'pegasus_parking_loc';
    const HISTORY_KEY = 'pegasus_parking_history';
    const MAX_HISTORY = 10;
    const GEOCODE_TIMEOUT_MS = 8500;
    const ADDRESS_FAIL_KEY = 'pegasus_parking_address_retry_fail_v1';
    const ADDRESS_FAIL_TTL_MS = 60 * 60 * 1000;

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

        // Strict street-only mode: do not accept city/locality/neighbourhood as a
        // parking label, because it can misleadingly show only "Ιωάννινα" while
        // the saved car position is on a specific street.
        const road = cleanAddressPart(
            a.road ||
            a.pedestrian ||
            a.footway ||
            a.path ||
            a.cycleway ||
            a.residential ||
            a.service ||
            ''
        );
        const number = cleanAddressPart(a.house_number);
        const city = cleanAddressPart(a.city || a.town || a.village || a.municipality || '');

        if (road && number && city) return `${road} ${number}, ${city}`;
        if (road && number) return `${road} ${number}`;
        if (road && city) return `${road}, ${city}`;
        if (road) return road;

        // No road found: return empty and keep coordinates instead of showing a
        // broad city/area label.
        return '';
    }


    function addressFromBigDataCloud(data) {
        if (!data || typeof data !== 'object') return '';
        const road = cleanAddressPart(data.road || data.roadName || data.street || data.streetName || '');
        const number = cleanAddressPart(data.houseNumber || data.house_number || '');
        const locality = cleanAddressPart(data.locality || data.city || data.principalSubdivision || '');

        if (road && number && locality) return `${road} ${number}, ${locality}`;
        if (road && number) return `${road} ${number}`;
        if (road && locality) return `${road}, ${locality}`;
        if (road) return road;

        // Never use locality-only labels like "Ιωάννινα" as the car position.
        return '';
    }

    function addressRetryId(item) {
        const lat = Number(item?.lat);
        const lon = Number(item?.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return '';
        return `${lat.toFixed(5)},${lon.toFixed(5)}`;
    }

    function readAddressFails() {
        return safeParse(localStorage.getItem(ADDRESS_FAIL_KEY), {});
    }

    function canRetryAddress(item) {
        const id = addressRetryId(item);
        if (!id) return false;
        const fails = readAddressFails();
        const lastFail = Number(fails[id] || 0);
        return !lastFail || (Date.now() - lastFail > ADDRESS_FAIL_TTL_MS);
    }

    function markAddressFail(item) {
        const id = addressRetryId(item);
        if (!id) return;
        const fails = readAddressFails();
        fails[id] = Date.now();
        try { localStorage.setItem(ADDRESS_FAIL_KEY, JSON.stringify(fails)); } catch (_) {}
    }

    function clearAddressFail(item) {
        const id = addressRetryId(item);
        if (!id) return;
        const fails = readAddressFails();
        if (fails[id]) {
            delete fails[id];
            try { localStorage.setItem(ADDRESS_FAIL_KEY, JSON.stringify(fails)); } catch (_) {}
        }
    }

    function hasVerifiedStreetLabel(item) {
        const label = cleanAddressPart(item?.addressLabel || item?.streetLabel || '');
        return !!label && !isCoordinateText(label) && item?.addressQuality === 'street';
    }

    function needsAddressLookup(item) {
        if (!item || !hasCoords(item)) return false;

        // Re-check old saved broad labels that did not have a street-quality flag.
        // This lets a previous "Ιωάννινα" label be replaced by a real road, or
        // hidden back to coordinates if no road is available.
        if (hasVerifiedStreetLabel(item)) return false;

        const label = displayLabel(item);
        return !!item.addressPending || !label || isCoordinateText(label) || !item.addressQuality;
    }

    async function fetchJsonWithTimeout(url, parser, label) {
        const controller = window.AbortController ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), GEOCODE_TIMEOUT_MS) : null;
        try {
            const res = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-store',
                signal: controller?.signal,
                headers: { 'Accept': 'application/json' }
            });
            if (!res.ok) throw new Error(`${label}_${res.status}`);
            const data = await res.json();
            return cleanAddressPart(parser(data));
        } finally {
            if (timer) clearTimeout(timer);
        }
    }

    function displayLabel(item) {
        if (!item) return '--';
        const street = cleanAddressPart(item.addressLabel || item.streetLabel || '');
        if (street && !isCoordinateText(street) && item.addressQuality === 'street') return street;

        // If the saved label came from an older broad reverse-geocode result, do
        // not show it as the car position. Coordinates are safer than a wrong city.
        if (hasCoords(item)) return formatCoords(item);

        const preferred = cleanAddressPart(item.label || item.loc);
        return preferred || '--';
    }

    function googleMapsWebUrl(item) {
        const normalized = normalizeHistoryItem(item) || item;
        const lat = Number(normalized?.lat);
        const lon = Number(normalized?.lon);
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lat.toFixed(6) + ',' + lon.toFixed(6))}`;
        }
        const loc = String(normalized?.addressLabel || normalized?.streetLabel || normalized?.label || normalized?.loc || normalized || '').trim();
        return loc ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}` : '';
    }

    function nativeMapUrl(item) {
        const normalized = normalizeHistoryItem(item) || item;
        const lat = Number(normalized?.lat);
        const lon = Number(normalized?.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return '';
        const label = encodeURIComponent(displayLabel(normalized) || 'Parking');
        return `geo:0,0?q=${lat.toFixed(6)},${lon.toFixed(6)}(${label})`;
    }

    function forceMapButtonLabels() {
        try {
            document.querySelectorAll('#parking_panel .parking-history-map-btn, #parking_panel .parking-action-btn[aria-label="Άνοιγμα χάρτη"]').forEach(btn => {
                if (!btn) return;
                if (btn.textContent !== 'Χάρτης') btn.textContent = 'Χάρτης';
                btn.setAttribute('data-pegasus-fixed-text', 'true');
                btn.style.textTransform = 'none';
                btn.style.fontSize = '9.5px';
                btn.style.lineHeight = '1.15';
                btn.style.letterSpacing = '0.2px';
            });
        } catch (_) {}
    }

    function openMapDirect(item) {
        const normalized = normalizeHistoryItem(item);
        const url = googleMapsWebUrl(normalized);
        if (!url) return;

        const nativeUrl = nativeMapUrl(normalized);
        const isAndroid = /Android/i.test(navigator.userAgent || '');

        // Restored from v269: try Android geo: first, then fallback to Google Maps web
        // only if the page did not leave/hide. This was the version that opened directly
        // on the user's APK/device.
        if (isAndroid && nativeUrl) {
            let pageHidden = false;
            const onVisibility = () => { if (document.hidden) pageHidden = true; };
            document.addEventListener('visibilitychange', onVisibility, { once: true });

            try {
                window.location.href = nativeUrl;
            } catch (_) {
                window.location.href = url;
                return;
            }

            window.setTimeout(() => {
                document.removeEventListener('visibilitychange', onVisibility);
                if (!pageHidden && !document.hidden) {
                    window.location.href = url;
                }
            }, 900);
            return;
        }

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
                addressQuality: item.addressQuality || '',
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

    function selectHistoryItem(index) {
        const idx = Number(index);
        if (!Number.isInteger(idx) || idx < 0) return null;

        const history = readHistory();
        const selected = normalizeHistoryItem(history[idx]);
        if (!selected) return null;

        const promoted = {
            ...selected,
            ts: selected.ts || Date.now(),
            iso: selected.iso || new Date(selected.ts || Date.now()).toISOString(),
            source: selected.source || 'parking-history-selected',
            localOnly: true
        };

        const nextHistory = [
            promoted,
            ...history.filter((item, i) => i !== idx && !samePlace(item, promoted))
        ].slice(0, MAX_HISTORY);

        localStorage.setItem(LOC_KEY, JSON.stringify(promoted));
        localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
        writePhoneLastLocation(promoted);
        window.PegasusParking?.updateUI?.();
        return promoted;
    }

    function updateSavedAddress(ts, label, source = 'nominatim') {
        const stamp = Number(ts);
        const cleanLabel = cleanAddressPart(label);
        if (!stamp || !cleanLabel || isCoordinateText(cleanLabel)) return null;

        let updatedCurrent = null;
        const current = readCurrent();
        if (current && Number(current.ts) === stamp) {
            updatedCurrent = {
                ...current,
                loc: cleanLabel,
                label: cleanLabel,
                addressLabel: cleanLabel,
                streetLabel: cleanLabel,
                addressSource: source,
                addressQuality: 'street',
                addressPending: false
            };
            localStorage.setItem(LOC_KEY, JSON.stringify(updatedCurrent));
            writePhoneLastLocation(updatedCurrent);
        }

        const history = readHistory().map(old => Number(old.ts) === stamp ? {
            ...old,
            loc: cleanLabel,
            label: cleanLabel,
            addressLabel: cleanLabel,
            streetLabel: cleanLabel,
            addressSource: source,
            addressQuality: 'street',
            addressPending: false
        } : old).slice(0, MAX_HISTORY);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

        clearAddressFail({ lat: updatedCurrent?.lat || history.find(x => Number(x.ts) === stamp)?.lat, lon: updatedCurrent?.lon || history.find(x => Number(x.ts) === stamp)?.lon });
        window.PegasusParking?.updateUI?.();
        return updatedCurrent || history.find(x => Number(x.ts) === stamp) || null;
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
            addressQuality: '',
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
        const lat = Number(item.lat);
        const lon = Number(item.lon);

        const attempts = [
            {
                label: 'nominatim-el-street',
                url: `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=19&addressdetails=1&accept-language=el,en`,
                parser: addressFromNominatim
            },
            {
                label: 'nominatim-el',
                url: `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1&accept-language=el,en`,
                parser: addressFromNominatim
            },
            {
                label: 'nominatim-en',
                url: `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1&accept-language=en,el`,
                parser: addressFromNominatim
            },
            {
                label: 'bigdatacloud',
                url: `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&localityLanguage=el`,
                parser: addressFromBigDataCloud
            }
        ];

        for (const attempt of attempts) {
            try {
                const label = await fetchJsonWithTimeout(attempt.url, attempt.parser, attempt.label);
                if (label && !isCoordinateText(label)) return label;
            } catch (e) {
                console.info('PEGASUS PARKING: street lookup attempt failed.', attempt.label, e?.message || e);
            }
        }

        console.info('PEGASUS PARKING: street lookup unavailable, keeping coordinates.');
        return '';
    }

    async function enrichAddressForSavedItem(item) {
        if (!item || !hasCoords(item) || addressInFlight) return item;
        if (!needsAddressLookup(item) || !canRetryAddress(item)) return item;
        addressInFlight = true;
        try {
            const label = await reverseGeocode(item);
            if (label) {
                const updated = updateSavedAddress(item.ts, label, 'reverse-geocode');
                if (updated) {
                    setStatus(`Τελευταία θέση parking:<br>📍 ${escapeHtml(displayLabel(updated))}<br>🕒 ${escapeHtml(formatTime(updated.ts))}`, 'ok');
                    return updated;
                }
            } else {
                markAddressFail(item);
                const current = readCurrent();
                if (current && Number(current.ts) === Number(item.ts)) {
                    const updated = {
                        ...current,
                        addressPending: false,
                        addressLabel: '',
                        streetLabel: '',
                        addressQuality: ''
                    };
                    localStorage.setItem(LOC_KEY, JSON.stringify(updated));
                }
                const history = readHistory().map(old => Number(old.ts) === Number(item.ts) ? {
                    ...old,
                    addressPending: false,
                    addressLabel: '',
                    streetLabel: '',
                    addressQuality: ''
                } : old);
                localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
            }
            return readCurrent() || item;
        } finally {
            addressInFlight = false;
        }
    }


    let addressLookupTimer = null;
    function scheduleAddressLookup() {
        if (addressInFlight) return;
        clearTimeout(addressLookupTimer);
        addressLookupTimer = setTimeout(async () => {
            if (addressInFlight) return;
            const seen = new Set();
            const candidates = [readCurrent(), ...readHistory()]
                .filter(Boolean)
                .filter(needsAddressLookup)
                .filter(canRetryAddress)
                .filter(item => {
                    const key = `${Number(item.ts) || 0}|${addressRetryId(item)}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
            if (!candidates.length) return;
            const current = candidates.find(x => Number(x.ts) === Number(readCurrent()?.ts));
            const first = current || candidates[0];
            if (first) await enrichAddressForSavedItem(first);
        }, 350);
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
                    <div class="parking-current-hint">Αποθηκευμένο τοπικά στο κινητό · ιστορικό 10 θέσεων.${escapeHtml(coords)}</div>
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
            scheduleAddressLookup();
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
                const selectedHint = index === 0 ? 'Τρέχουσα θέση' : 'Πάτημα στην κάρτα = επιλογή';
                return `
                    <div class="parking-history-card" role="button" tabindex="0" onclick="window.PegasusParking.selectFromHistory(${index})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.PegasusParking.selectFromHistory(${index});}">
                        <div class="parking-history-index">${index + 1}</div>
                        <div class="parking-history-info">
                            <div class="parking-history-title">${escapeHtml(label)}</div>
                            <div class="parking-history-meta">${escapeHtml(formatTime(item.ts))}${escapeHtml(acc)} · ${escapeHtml(selectedHint)}</div>
                        </div>
                        <button class="parking-history-map-btn" type="button" ${canMap ? `onclick="event.stopPropagation(); window.PegasusParking.openMapFromHistory(${index})"` : 'disabled'} data-pegasus-fixed-text="true" aria-label="Άνοιγμα χάρτη">Χάρτης</button>
                    </div>`;
            }).join('');
            forceMapButtonLabels();
        },

        openCurrentMap: function() { openMapDirect(readCurrent()); },
        openMapFromHistory: function(index) { openMapDirect(readHistory()[Number(index) || 0]); },
        selectFromHistory: function(index) {
            const selected = selectHistoryItem(index);
            if (selected) {
                setStatus(`Τρέχουσα θέση parking:<br>📍 ${escapeHtml(displayLabel(selected))}<br>🕒 ${escapeHtml(formatTime(selected.ts))}`, 'ok');
            }
            return selected;
        },
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
        forceMapButtonLabels();
        setTimeout(() => { window.PegasusParking.updateUI(); forceMapButtonLabels(); }, 2000);
        try {
            const panel = document.getElementById('parking_panel');
            if (panel) {
                const obs = new MutationObserver(() => forceMapButtonLabels());
                obs.observe(panel, { childList: true, subtree: true, characterData: true });
            }
        } catch (_) {}
    });

    console.log('📍 PEGASUS PARKING: 10-slot history + select-to-top active v4.2.282');
})();
