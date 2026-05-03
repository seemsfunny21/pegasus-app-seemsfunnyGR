/* ==========================================================================
   PEGASUS MOBILE WEATHER MODULE v1.0
   Modular weather box for mobile extended modules.
   ========================================================================== */
(function() {
    'use strict';

    const STORAGE = {
        temp: 'pegasus_weather_temp',
        code: 'pegasus_weather_code',
        wind: 'pegasus_weather_wind',
        updated: 'pegasus_weather_updated',
        summary: 'pegasus_weather_summary'
    };

    const IOANNINA = {
        latitude: 39.667,
        longitude: 20.850,
        labelGr: 'Ιωάννινα',
        labelEn: 'Ioannina'
    };

    function lang() {
        return window.PegasusI18n?.getLanguage?.() || localStorage.getItem('pegasus_language') || localStorage.getItem('pegasus_lang') || 'gr';
    }

    function t(gr, en) {
        return lang() === 'en' ? en : gr;
    }

    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>'"]/g, ch => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[ch]));
    }

    function codeToEmoji(code) {
        const n = Number(code);
        if (typeof window.weatherCodeToEmoji === 'function') return window.weatherCodeToEmoji(n);
        if (n === 0) return '☀️';
        if (n <= 3) return '🌤️';
        if (n === 45 || n === 48) return '🌥️';
        if ((n >= 51 && n <= 67) || (n >= 80 && n <= 82) || n >= 95) return '🌧️';
        if (n >= 71 && n <= 77) return '❄️';
        return '🌫️';
    }

    function codeToLabel(code) {
        const n = Number(code);
        if (n === 0) return t('Καθαρός', 'Clear');
        if (n === 1) return t('Κυρίως καθαρός', 'Mostly clear');
        if (n === 2) return t('Μερική συννεφιά', 'Partly cloudy');
        if (n === 3) return t('Συννεφιά', 'Cloudy');
        if (n === 45 || n === 48) return t('Ομίχλη', 'Fog');
        if (n >= 51 && n <= 57) return t('Ψιλόβροχο', 'Drizzle');
        if (n >= 61 && n <= 67) return t('Βροχή', 'Rain');
        if (n >= 71 && n <= 77) return t('Χιόνι', 'Snow');
        if (n >= 80 && n <= 82) return t('Μπόρες', 'Showers');
        if (n >= 95) return t('Καταιγίδα', 'Thunderstorm');
        return t('Μεταβλητός', 'Variable');
    }

    function getAdvice(code, wind) {
        const n = Number(code);
        const w = Number(wind) || 0;
        const badWeather = (n >= 51 && n <= 67) || (n >= 71 && n <= 77) || (n >= 80 && n <= 82) || n >= 95;
        if (badWeather) return t('Προσοχή: πιθανή βροχή. Κράτα indoor επιλογή.', 'Caution: possible rain. Keep indoor option.');
        if (w >= 30) return t('Πολύς αέρας. Το ποδήλατο θέλει προσοχή.', 'Strong wind. Bike needs caution.');
        if (w >= 20) return t('Μέτριος αέρας. Ρύθμισε ένταση ποδηλάτου.', 'Moderate wind. Adjust bike intensity.');
        return t('Καιρός ΟΚ για πρόγραμμα/ποδήλατο.', 'Weather OK for training/bike.');
    }

    function readCache() {
        const temp = localStorage.getItem(STORAGE.temp);
        const code = localStorage.getItem(STORAGE.code);
        const wind = localStorage.getItem(STORAGE.wind);
        const updated = localStorage.getItem(STORAGE.updated);
        if (temp === null && code === null && wind === null) return null;
        return {
            temp: Number(temp),
            code: Number(code),
            wind: Number(wind),
            updated: updated || '',
            label: codeToLabel(code),
            emoji: codeToEmoji(code)
        };
    }

    function formatTime(ts) {
        if (!ts) return '--';
        try {
            return new Date(ts).toLocaleTimeString(lang() === 'en' ? 'en-GB' : 'el-GR', { hour: '2-digit', minute: '2-digit' });
        } catch (_) {
            return '--';
        }
    }

    function updateTile(data) {
        const tile = document.querySelector('[data-module-id="weather_panel"]');
        if (!tile) return;
        const cached = data || readCache();
        const tempEl = tile.querySelector('.pegasus-weather-tile-temp');
        const subEl = tile.querySelector('.pegasus-weather-tile-sub');
        if (!cached) {
            if (tempEl) tempEl.textContent = '--°C';
            if (subEl) subEl.textContent = t('Καιρός', 'Weather');
            return;
        }
        if (tempEl) tempEl.textContent = `${cached.emoji} ${Math.round(cached.temp)}°C`;
        if (subEl) subEl.textContent = `${Math.round(cached.wind || 0)} km/h`;
    }

    function renderInto(container, data, loading = false) {
        if (!container) return;
        const cached = data || readCache();
        const place = lang() === 'en' ? IOANNINA.labelEn : IOANNINA.labelGr;

        if (!cached && loading) {
            container.innerHTML = `
                <div class="pegasus-weather-card is-loading">
                    <div class="pegasus-weather-main">⏳</div>
                    <div class="pegasus-weather-title">${t('Φόρτωση καιρού...', 'Loading weather...')}</div>
                </div>
            `;
            return;
        }

        if (!cached) {
            container.innerHTML = `
                <div class="pegasus-weather-card">
                    <div class="pegasus-weather-main">🌦️ --°C</div>
                    <div class="pegasus-weather-title">${escapeHTML(place)}</div>
                    <div class="pegasus-weather-advice">${t('Δεν υπάρχουν ακόμη δεδομένα καιρού.', 'No weather data yet.')}</div>
                    <button class="primary-btn pegasus-weather-refresh" onclick="window.PegasusMobileWeather.refresh(true)">${t('Ανανέωση', 'Refresh')}</button>
                </div>
            `;
            return;
        }

        const advice = getAdvice(cached.code, cached.wind);
        localStorage.setItem(STORAGE.summary, JSON.stringify({
            temp: Math.round(cached.temp),
            code: cached.code,
            wind: Math.round(cached.wind || 0),
            advice,
            updated: cached.updated || new Date().toISOString()
        }));

        container.innerHTML = `
            <div class="pegasus-weather-card">
                <div class="pegasus-weather-place">${escapeHTML(place)}</div>
                <div class="pegasus-weather-main">${cached.emoji} ${Math.round(cached.temp)}°C</div>
                <div class="pegasus-weather-title">${escapeHTML(cached.label)}</div>
                <div class="pegasus-weather-grid">
                    <div class="pegasus-weather-stat"><span>${t('Άνεμος', 'Wind')}</span><strong>${Math.round(cached.wind || 0)} km/h</strong></div>
                    <div class="pegasus-weather-stat"><span>${t('Ενημέρωση', 'Updated')}</span><strong>${formatTime(cached.updated)}</strong></div>
                </div>
                <div class="pegasus-weather-advice">${escapeHTML(advice)}</div>
                <button class="primary-btn pegasus-weather-refresh" onclick="window.PegasusMobileWeather.refresh(true)">${t('Ανανέωση', 'Refresh')}</button>
            </div>
        `;
    }

    function injectView() {
        if (document.getElementById('weather_panel')) return;
        const view = document.createElement('div');
        view.id = 'weather_panel';
        view.className = 'view';
        view.innerHTML = `
            <button class="btn-back" onclick="openView('home')">◀ ${t('Επιστροφή', 'Back')}</button>
            <div class="section-title">${t('Καιρός', 'Weather')}</div>
            <div id="weatherMobileContent" class="pegasus-weather-mobile-content"></div>
        `;
        document.body.appendChild(view);
    }

    async function fetchWeather() {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${IOANNINA.latitude}&longitude=${IOANNINA.longitude}&current_weather=true`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Weather HTTP ${res.status}`);
        const data = await res.json();
        const current = data && data.current_weather;
        if (!current) throw new Error('Missing current_weather');
        const model = {
            temp: Math.round(Number(current.temperature) || 0),
            code: Number(current.weathercode) || 0,
            wind: Math.round(Number(current.windspeed) || 0),
            updated: new Date().toISOString()
        };
        model.label = codeToLabel(model.code);
        model.emoji = codeToEmoji(model.code);
        localStorage.setItem(STORAGE.temp, String(model.temp));
        localStorage.setItem(STORAGE.code, String(model.code));
        localStorage.setItem(STORAGE.wind, String(model.wind));
        localStorage.setItem(STORAGE.updated, model.updated);
        return model;
    }

    window.PegasusMobileWeather = {
        injectView,
        render() {
            injectView();
            renderInto(document.getElementById('weatherMobileContent'), readCache());
            updateTile();
        },
        updateTile,
        async refresh(force = false) {
            injectView();
            const container = document.getElementById('weatherMobileContent');
            if (force) renderInto(container, readCache(), true);
            try {
                const data = await fetchWeather();
                renderInto(container, data);
                updateTile(data);
                window.dispatchEvent(new CustomEvent('pegasus_weather_mobile_updated', { detail: data }));
                return data;
            } catch (e) {
                console.warn('🌦️ PEGASUS MOBILE WEATHER: update failed', e);
                renderInto(container, readCache());
                updateTile();
                return null;
            }
        }
    };

    window.renderWeather_panelContent = function() {
        window.PegasusMobileWeather.render();
        window.PegasusMobileWeather.refresh(false);
    };

    document.addEventListener('DOMContentLoaded', () => {
        injectView();
        window.PegasusMobileWeather.render();

        if (window.registerPegasusModule) {
            window.registerPegasusModule({
                id: 'weather_panel',
                label: t('Καιρός', 'Weather'),
                icon: '🌦️',
                sortOrder: 10000,
                renderTile: function(tile) {
                    const cached = readCache();
                    tile.classList.add('pegasus-weather-tile');
                    tile.innerHTML = `
                        <span class="tile-icon">🌦️</span>
                        <span class="tile-label">${t('Καιρός', 'Weather')}</span>
                        <span class="pegasus-weather-tile-temp">${cached ? `${cached.emoji} ${Math.round(cached.temp)}°C` : '--°C'}</span>
                        <span class="pegasus-weather-tile-sub">${cached ? `${Math.round(cached.wind || 0)} km/h` : t('Ανανέωση', 'Refresh')}</span>
                    `;
                }
            });
        }

        window.PegasusMobileWeather.refresh(false);
        setInterval(() => window.PegasusMobileWeather.refresh(false), 30 * 60 * 1000);
    });

    window.addEventListener('pegasus_language_changed', () => {
        window.PegasusMobileWeather.render();
        window.PegasusMobileUI?.render?.();
    });
})();
