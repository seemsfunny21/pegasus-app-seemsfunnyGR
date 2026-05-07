/* ==========================================================================
   PEGASUS MOBILE WEATHER MODULE v1.2.227
   Mobile weather box with current, hourly and 3-day forecast; auto-refreshes on open without manual button.
   ========================================================================== */
(function() {
    'use strict';

    const STORAGE = {
        temp: 'pegasus_weather_temp',
        code: 'pegasus_weather_code',
        wind: 'pegasus_weather_wind',
        updated: 'pegasus_weather_updated',
        summary: 'pegasus_weather_summary',
        forecast: 'pegasus_weather_forecast_v1'
    };

    const IOANNINA = {
        latitude: 39.667,
        longitude: 20.850,
        labelGr: 'Ιωάννινα',
        labelEn: 'Ioannina'
    };

    const MAX_HOURLY_ITEMS = 8;
    const MAX_DAILY_ITEMS = 3;
    const FORECAST_MAX_AGE_MS = 30 * 60 * 1000;

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

    function safeNumber(value, fallback = 0) {
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
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

    function getAdvice(code, wind, rainProb) {
        const n = Number(code);
        const w = Number(wind) || 0;
        const rp = Number(rainProb) || 0;
        const badWeather = (n >= 51 && n <= 67) || (n >= 71 && n <= 77) || (n >= 80 && n <= 82) || n >= 95;
        if (badWeather || rp >= 55) return t('Προσοχή: πιθανή βροχή. Κράτα indoor επιλογή.', 'Caution: possible rain. Keep indoor option.');
        if (w >= 30) return t('Πολύς αέρας. Το ποδήλατο θέλει προσοχή.', 'Strong wind. Bike needs caution.');
        if (w >= 20) return t('Μέτριος αέρας. Ρύθμισε ένταση ποδηλάτου.', 'Moderate wind. Adjust bike intensity.');
        return t('Καιρός ΟΚ για πρόγραμμα/ποδήλατο.', 'Weather OK for training/bike.');
    }

    function safeParseJSON(raw, fallback = null) {
        try {
            return raw ? JSON.parse(raw) : fallback;
        } catch (_) {
            return fallback;
        }
    }

    function readStoredForecast() {
        const forecast = safeParseJSON(localStorage.getItem(STORAGE.forecast), null);
        if (!forecast || typeof forecast !== 'object') return null;
        if (!Array.isArray(forecast.hourly)) forecast.hourly = [];
        if (!Array.isArray(forecast.daily)) forecast.daily = [];
        return forecast;
    }

    function readCache() {
        const temp = localStorage.getItem(STORAGE.temp);
        const code = localStorage.getItem(STORAGE.code);
        const wind = localStorage.getItem(STORAGE.wind);
        const updated = localStorage.getItem(STORAGE.updated);
        const forecast = readStoredForecast();
        const currentFromForecast = forecast && forecast.current ? forecast.current : null;

        if (temp === null && code === null && wind === null && !currentFromForecast) return null;

        const current = {
            temp: safeNumber(temp, currentFromForecast ? currentFromForecast.temp : 0),
            code: safeNumber(code, currentFromForecast ? currentFromForecast.code : 0),
            wind: safeNumber(wind, currentFromForecast ? currentFromForecast.wind : 0),
            rain: currentFromForecast ? safeNumber(currentFromForecast.rain, 0) : 0,
            updated: updated || (forecast ? forecast.fetchedAt : '') || '',
            hourly: forecast ? forecast.hourly : [],
            daily: forecast ? forecast.daily : []
        };

        current.label = codeToLabel(current.code);
        current.emoji = codeToEmoji(current.code);
        return current;
    }

    function formatTime(ts) {
        if (!ts) return '--';
        try {
            return new Date(ts).toLocaleTimeString(lang() === 'en' ? 'en-GB' : 'el-GR', { hour: '2-digit', minute: '2-digit' });
        } catch (_) {
            return '--';
        }
    }

    function formatHour(ts) {
        return formatTime(ts);
    }

    function formatDay(ts, index) {
        if (!ts) return index === 0 ? t('Σήμερα', 'Today') : '--';
        if (index === 0) return t('Σήμερα', 'Today');
        if (index === 1) return t('Αύριο', 'Tomorrow');
        try {
            return new Date(ts + 'T12:00:00').toLocaleDateString(lang() === 'en' ? 'en-GB' : 'el-GR', { weekday: 'short' });
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
        const rainText = Number(cached.rain) > 0 ? ` · ${Math.round(cached.rain)}%` : '';
        if (tempEl) tempEl.textContent = `${cached.emoji} ${Math.round(cached.temp)}°C`;
        if (subEl) subEl.textContent = `${Math.round(cached.wind || 0)} km/h${rainText}`;
    }

    function renderHourly(hourly) {
        if (!Array.isArray(hourly) || !hourly.length) {
            return `<div class="pegasus-weather-empty">${t('Δεν υπάρχει ακόμη ωριαία πρόγνωση.', 'No hourly forecast yet.')}</div>`;
        }

        return `
            <div class="pegasus-weather-hourly-strip">
                ${hourly.slice(0, MAX_HOURLY_ITEMS).map(item => `
                    <div class="pegasus-weather-hour-card">
                        <strong>${escapeHTML(formatHour(item.time))}</strong>
                        <span class="pegasus-weather-hour-emoji">${codeToEmoji(item.code)}</span>
                        <b>${Math.round(safeNumber(item.temp))}°</b>
                        <small>💧 ${Math.round(safeNumber(item.rain))}%</small>
                        <small>💨 ${Math.round(safeNumber(item.wind))}</small>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderDaily(daily) {
        if (!Array.isArray(daily) || !daily.length) {
            return `<div class="pegasus-weather-empty">${t('Δεν υπάρχει ακόμη πρόγνωση 3 ημερών.', 'No 3-day forecast yet.')}</div>`;
        }

        return `
            <div class="pegasus-weather-daily-list">
                ${daily.slice(0, MAX_DAILY_ITEMS).map((item, index) => `
                    <div class="pegasus-weather-day-card">
                        <div>
                            <strong>${escapeHTML(formatDay(item.date, index))}</strong>
                            <span>${codeToEmoji(item.code)} ${escapeHTML(codeToLabel(item.code))}</span>
                        </div>
                        <div class="pegasus-weather-day-metrics">
                            <b>${Math.round(safeNumber(item.max))}°/${Math.round(safeNumber(item.min))}°</b>
                            <small>💧 ${Math.round(safeNumber(item.rain))}% · 💨 ${Math.round(safeNumber(item.wind))}</small>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
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
                    <div class="pegasus-weather-auto-refresh-note">${t('Ανανεώνεται αυτόματα κάθε φορά που ανοίγεις τον καιρό.', 'Updates automatically whenever you open Weather.')}</div>
                </div>
            `;
            return;
        }

        const nextRain = Array.isArray(cached.hourly) && cached.hourly.length ? Math.max(...cached.hourly.slice(0, 4).map(h => safeNumber(h.rain))) : cached.rain;
        const advice = getAdvice(cached.code, cached.wind, nextRain);
        localStorage.setItem(STORAGE.summary, JSON.stringify({
            temp: Math.round(cached.temp),
            code: cached.code,
            wind: Math.round(cached.wind || 0),
            rain: Math.round(nextRain || 0),
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
                    <div class="pegasus-weather-stat"><span>${t('Βροχή', 'Rain')}</span><strong>${Math.round(nextRain || 0)}%</strong></div>
                    <div class="pegasus-weather-stat"><span>${t('Ενημέρωση', 'Updated')}</span><strong>${formatTime(cached.updated)}</strong></div>
                    <div class="pegasus-weather-stat"><span>${t('Τοποθεσία', 'Place')}</span><strong>${escapeHTML(place)}</strong></div>
                </div>
                <div class="pegasus-weather-advice">${escapeHTML(advice)}</div>

                <div class="pegasus-weather-section-title">${t('Επόμενες ώρες', 'Next hours')}</div>
                ${renderHourly(cached.hourly)}

                <div class="pegasus-weather-section-title">${t('Πρόγνωση 3 ημερών', '3-day forecast')}</div>
                ${renderDaily(cached.daily)}

                <div class="pegasus-weather-auto-refresh-note">${t('Ανανεώνεται αυτόματα με το άνοιγμα του καιρού.', 'Updates automatically when Weather opens.')}</div>
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

    function buildHourlyForecast(hourly) {
        if (!hourly || !Array.isArray(hourly.time)) return [];
        const now = Date.now() - (20 * 60 * 1000);
        const rows = hourly.time.map((time, index) => ({
            time,
            temp: safeNumber(hourly.temperature_2m?.[index]),
            code: safeNumber(hourly.weathercode?.[index]),
            rain: safeNumber(hourly.precipitation_probability?.[index]),
            wind: safeNumber(hourly.windspeed_10m?.[index])
        }));

        const upcoming = rows.filter(row => {
            const ts = Date.parse(row.time);
            return Number.isFinite(ts) ? ts >= now : true;
        });

        return (upcoming.length ? upcoming : rows).slice(0, MAX_HOURLY_ITEMS);
    }

    function buildDailyForecast(daily) {
        if (!daily || !Array.isArray(daily.time)) return [];
        return daily.time.slice(0, MAX_DAILY_ITEMS).map((date, index) => ({
            date,
            code: safeNumber(daily.weathercode?.[index]),
            max: safeNumber(daily.temperature_2m_max?.[index]),
            min: safeNumber(daily.temperature_2m_min?.[index]),
            rain: safeNumber(daily.precipitation_probability_max?.[index]),
            wind: safeNumber(daily.windspeed_10m_max?.[index])
        }));
    }

    async function fetchWeather() {
        const params = new URLSearchParams({
            latitude: String(IOANNINA.latitude),
            longitude: String(IOANNINA.longitude),
            current_weather: 'true',
            hourly: 'temperature_2m,weathercode,precipitation_probability,windspeed_10m',
            daily: 'weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max',
            timezone: 'auto',
            forecast_days: String(MAX_DAILY_ITEMS)
        });
        const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Weather HTTP ${res.status}`);
        const data = await res.json();
        const current = data && data.current_weather;
        const hourly = buildHourlyForecast(data.hourly);
        const daily = buildDailyForecast(data.daily);

        if (!current && !hourly.length && !daily.length) throw new Error('Missing weather data');

        const firstHour = hourly[0] || {};
        const model = {
            temp: Math.round(safeNumber(current?.temperature, firstHour.temp || 0)),
            code: safeNumber(current?.weathercode, firstHour.code || 0),
            wind: Math.round(safeNumber(current?.windspeed, firstHour.wind || 0)),
            rain: Math.round(safeNumber(firstHour.rain, 0)),
            updated: new Date().toISOString(),
            hourly,
            daily
        };
        model.label = codeToLabel(model.code);
        model.emoji = codeToEmoji(model.code);

        const forecastPayload = {
            fetchedAt: model.updated,
            current: {
                temp: model.temp,
                code: model.code,
                wind: model.wind,
                rain: model.rain
            },
            hourly,
            daily
        };

        localStorage.setItem(STORAGE.temp, String(model.temp));
        localStorage.setItem(STORAGE.code, String(model.code));
        localStorage.setItem(STORAGE.wind, String(model.wind));
        localStorage.setItem(STORAGE.updated, model.updated);
        localStorage.setItem(STORAGE.forecast, JSON.stringify(forecastPayload));
        return model;
    }

    function shouldRefreshForecast(force) {
        if (force) return true;
        const forecast = readStoredForecast();
        const at = forecast && forecast.fetchedAt ? Date.parse(forecast.fetchedAt) : 0;
        if (!Number.isFinite(at) || !at) return true;
        return Date.now() - at > FORECAST_MAX_AGE_MS;
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

            if (!shouldRefreshForecast(force)) {
                const cached = readCache();
                renderInto(container, cached);
                updateTile(cached);
                return cached;
            }

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
        // User-facing Weather button: always force a fresh update on open,
        // because the panel may be checked only once per day.
        window.PegasusMobileWeather.refresh(true);
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
                        <span class="pegasus-weather-tile-sub">${cached ? `${Math.round(cached.wind || 0)} km/h${Number(cached.rain) > 0 ? ` · ${Math.round(cached.rain)}%` : ''}` : t('Άνοιγμα', 'Open')}</span>
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
