(function () {
    const STYLE_ID = 'pegasus-adaptive-typography-style';
    console.log('🔤 PEGASUS ADAPTIVE TYPOGRAPHY: Runtime booting.');
    const RESIZE_DEBOUNCE_MS = 80;
    let resizeTimer = null;

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function roundHalf(value) {
        return Math.round(value * 2) / 2;
    }

    function isMobileRuntime() {
        const path = String(window.location.pathname || '').toLowerCase();
        return path.includes('/mobile/') || path.endsWith('/mobile.html');
    }

    function getViewportSnapshot() {
        const width = window.innerWidth || document.documentElement.clientWidth || screen.width || 390;
        const height = window.innerHeight || document.documentElement.clientHeight || screen.height || 844;
        const shortestSide = Math.min(width, height);
        const orientation = width > height ? 'landscape' : 'portrait';
        const pixelRatio = window.devicePixelRatio || 1;

        return {
            width,
            height,
            shortestSide,
            orientation,
            pixelRatio
        };
    }

    function computeMobileTypography(viewport) {
        let base = 16;
        let tier = 'mobile-standard';

        if (viewport.shortestSide <= 340) {
            base = 15;
            tier = 'mobile-compact';
        } else if (viewport.shortestSide <= 390) {
            base = 16;
            tier = 'mobile-standard';
        } else if (viewport.shortestSide <= 430) {
            base = 16.5;
            tier = 'mobile-large';
        } else if (viewport.shortestSide <= 768) {
            base = 17;
            tier = 'tablet';
        } else {
            base = 18;
            tier = 'desktop-touch';
        }

        if (viewport.orientation === 'landscape' && viewport.height <= 420) {
            base -= 0.5;
        }

        base = roundHalf(clamp(base, 15, 18));

        return {
            mode: 'mobile',
            tier,
            base,
            vars: {
                '--pg-font-body': `${base}px`,
                '--pg-font-ui': `${roundHalf(base - 0.5)}px`,
                '--pg-font-sync': `${roundHalf(base - 5)}px`,
                '--pg-font-mobile-title': `${roundHalf(clamp(base * 2.35, 33, 42))}px`,
                '--pg-font-mobile-subtitle': `${roundHalf(clamp(base - 5.5, 10, 13))}px`,
                '--pg-font-mobile-tile-icon': `${roundHalf(clamp(base + 10, 24, 30))}px`,
                '--pg-font-mobile-tile-label': `${roundHalf(clamp(base - 7, 9, 12))}px`,
                '--pg-font-mobile-button': `${roundHalf(clamp(base - 4, 11, 14))}px`,
                '--pg-font-mobile-back': `${roundHalf(clamp(base - 6, 10, 13))}px`,
                '--pg-font-mobile-mini-label': `${roundHalf(clamp(base - 7, 9, 12))}px`,
                '--pg-font-mobile-mini-value': `${roundHalf(clamp(base, 16, 20))}px`,
                '--pg-font-mobile-section-title': `${roundHalf(clamp(base - 5, 11, 14))}px`,
                '--pg-font-mobile-input-label': `${roundHalf(clamp(base - 7, 9, 12))}px`
            }
        };
    }

    function computeDesktopTypography(viewport) {
        let base = 17;
        let tier = 'desktop-standard';

        if (viewport.width <= 1180) {
            base = 16;
            tier = 'desktop-compact';
        } else if (viewport.width <= 1440) {
            base = 17;
            tier = 'desktop-standard';
        } else if (viewport.width <= 1920) {
            base = 17.5;
            tier = 'desktop-large';
        } else {
            base = 18;
            tier = 'desktop-xl';
        }

        if (viewport.height <= 760) {
            base -= 0.5;
        }

        base = roundHalf(clamp(base, 15.5, 18.5));

        return {
            mode: 'desktop',
            tier,
            base,
            vars: {
                '--pg-font-body': `${base}px`,
                '--pg-font-nav': `${roundHalf(clamp(base - 2.5, 12, 16))}px`,
                '--pg-font-ui': `${roundHalf(clamp(base - 3, 12, 16))}px`,
                '--pg-font-exercise': `${roundHalf(clamp(base - 2.5, 13, 16))}px`,
                '--pg-font-status': `${roundHalf(clamp(base - 5, 10, 13))}px`,
                '--pg-font-panel-title': `${roundHalf(clamp(base, 17, 21))}px`,
                '--pg-font-panel-number': `${roundHalf(clamp(base + 1.5, 18, 24))}px`,
                '--pg-font-input': `${roundHalf(clamp(base, 16, 18))}px`
            }
        };
    }

    function ensureStyleTag() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
html[data-pegasus-typography='desktop'] body,
html[data-pegasus-typography='desktop'] button,
html[data-pegasus-typography='desktop'] select,
html[data-pegasus-typography='desktop'] textarea {
    font-size: var(--pg-font-body, 17px);
}

html[data-pegasus-typography='desktop'] input[type='number'],
html[data-pegasus-typography='desktop'] input[type='text'],
html[data-pegasus-typography='desktop'] input[type='password'] {
    font-size: var(--pg-font-input, 16px) !important;
}

html[data-pegasus-typography='desktop'] .navbar button {
    font-size: var(--pg-font-nav, 14px) !important;
}

html[data-pegasus-typography='desktop'] .p-btn,
html[data-pegasus-typography='desktop'] .weather-text,
html[data-pegasus-typography='desktop'] .workout-count-text,
html[data-pegasus-typography='desktop'] #totalProgressContainer,
html[data-pegasus-typography='desktop'] .status,
html[data-pegasus-typography='desktop'] .control-buttons button,
html[data-pegasus-typography='desktop'] .info-display {
    font-size: var(--pg-font-ui, 13px) !important;
}

html[data-pegasus-typography='desktop'] .exercise-name {
    font-size: var(--pg-font-exercise, 14px) !important;
}

html[data-pegasus-typography='desktop'] .set-counter,
html[data-pegasus-typography='desktop'] .total-kcal-display,
html[data-pegasus-typography='desktop'] .panel-stat-number {
    font-size: var(--pg-font-panel-number, 19px) !important;
}

html[data-pegasus-typography='desktop'] .pegasus-panel h3,
html[data-pegasus-typography='desktop'] .panel-title,
html[data-pegasus-typography='desktop'] .section-title {
    font-size: var(--pg-font-panel-title, 17px) !important;
}

html[data-pegasus-typography='desktop'] .status {
    font-size: var(--pg-font-status, 11px) !important;
}

html[data-pegasus-typography='mobile'] body,
html[data-pegasus-typography='mobile'] button,
html[data-pegasus-typography='mobile'] select,
html[data-pegasus-typography='mobile'] textarea,
html[data-pegasus-typography='mobile'] input {
    font-size: var(--pg-font-body, 16px);
}

html[data-pegasus-typography='mobile'] #sync-indicator {
    font-size: var(--pg-font-sync, 10px) !important;
}

html[data-pegasus-typography='mobile'] .header h1 {
    font-size: var(--pg-font-mobile-title, 38px) !important;
}

html[data-pegasus-typography='mobile'] .header p {
    font-size: var(--pg-font-mobile-subtitle, 10px) !important;
}

html[data-pegasus-typography='mobile'] .tile-icon {
    font-size: var(--pg-font-mobile-tile-icon, 26px) !important;
}

html[data-pegasus-typography='mobile'] .tile-label {
    font-size: var(--pg-font-mobile-tile-label, 9px) !important;
}

html[data-pegasus-typography='mobile'] .primary-btn {
    font-size: var(--pg-font-mobile-button, 12px) !important;
}

html[data-pegasus-typography='mobile'] .secondary-btn,
html[data-pegasus-typography='mobile'] .btn-back {
    font-size: var(--pg-font-mobile-back, 11px) !important;
}

html[data-pegasus-typography='mobile'] .mini-label {
    font-size: var(--pg-font-mobile-mini-label, 9px) !important;
}

html[data-pegasus-typography='mobile'] .mini-val {
    font-size: var(--pg-font-mobile-mini-value, 16px) !important;
}

html[data-pegasus-typography='mobile'] .section-title {
    font-size: var(--pg-font-mobile-section-title, 11px) !important;
}

html[data-pegasus-typography='mobile'] .input-label {
    font-size: var(--pg-font-mobile-input-label, 9px) !important;
}

html[data-pegasus-typography='desktop'] #muscleProgressContainer,
html[data-pegasus-typography='desktop'] #muscleProgressContainer div,
html[data-pegasus-typography='desktop'] #muscleProgressContainer span {
    font-size: var(--pg-font-status, 11px) !important;
}

html[data-pegasus-typography='mobile'] #muscleProgressContainer,
html[data-pegasus-typography='mobile'] #muscleProgressContainer div,
html[data-pegasus-typography='mobile'] #muscleProgressContainer span {
    font-size: var(--pg-font-mobile-mini-label, 10px) !important;
}
        `;

        document.head.appendChild(style);
    }

    function applyTypography() {
        ensureStyleTag();

        const viewport = getViewportSnapshot();
        const runtime = isMobileRuntime() ? computeMobileTypography(viewport) : computeDesktopTypography(viewport);
        const root = document.documentElement;

        Object.entries(runtime.vars).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });

        root.setAttribute('data-pegasus-typography', runtime.mode);
        root.setAttribute('data-pegasus-typography-tier', runtime.tier);

        window.PegasusAdaptiveTypography.state = {
            ...viewport,
            mode: runtime.mode,
            tier: runtime.tier,
            base: runtime.base,
            vars: { ...runtime.vars }
        };

        return window.PegasusAdaptiveTypography.state;
    }

    const PEGASUS_WEEKLY_GROUPS = ['Στήθος', 'Πλάτη', 'Πόδια', 'Χέρια', 'Ώμοι', 'Κορμός'];

    function normalizeExerciseName(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\u0370-\u03ff]+/g, '');
    }

    function getPegasusWeeklyHistoryKey() {
        const manifest = window.PegasusManifest || window.M || {};
        return manifest?.workout?.weekly_history || 'pegasus_weekly_history';
    }

    function getPegasusWeeklyLedgerKey() {
        return 'pegasus_weekly_history_counted_v2';
    }

    function getPegasusTodayKey() {
        if (typeof window.getPegasusLocalDateKey === 'function') return window.getPegasusLocalDateKey();
        const d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function getPegasusWeekKey() {
        const d = new Date();
        const day = d.getDay() || 7;
        const monday = new Date(d);
        monday.setHours(0, 0, 0, 0);
        monday.setDate(d.getDate() - day + 1);
        return monday.getFullYear() + '-' + String(monday.getMonth() + 1).padStart(2, '0') + '-' + String(monday.getDate()).padStart(2, '0');
    }

    function getEmptyWeeklyHistory() {
        return {
            'Στήθος': 0,
            'Πλάτη': 0,
            'Πόδια': 0,
            'Χέρια': 0,
            'Ώμοι': 0,
            'Κορμός': 0
        };
    }

    function safeReadObject(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function readWeeklyHistory() {
        const base = getEmptyWeeklyHistory();
        const parsed = safeReadObject(getPegasusWeeklyHistoryKey(), {});
        Object.keys(base).forEach(group => {
            const value = Number(parsed?.[group]);
            base[group] = Number.isFinite(value) ? Math.max(0, value) : 0;
        });
        return base;
    }

    function writeWeeklyHistory(history) {
        const clean = getEmptyWeeklyHistory();
        Object.keys(clean).forEach(group => {
            const value = Number(history?.[group]);
            clean[group] = Number.isFinite(value) ? Math.max(0, value) : 0;
        });
        localStorage.setItem(getPegasusWeeklyHistoryKey(), JSON.stringify(clean));
        localStorage.setItem('pegasus_weekly_history_week_key', getPegasusWeekKey());
        return clean;
    }

    function getWeeklyHistoryTotal(history) {
        return Object.values(history || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
    }

    function readWeeklyTargets() {
        const fallback = {
            'Στήθος': 16,
            'Πλάτη': 16,
            'Πόδια': 24,
            'Χέρια': 14,
            'Ώμοι': 12,
            'Κορμός': 18
        };

        try {
            if (window.PegasusOptimizer && typeof window.PegasusOptimizer.getTargets === 'function') {
                return { ...fallback, ...window.PegasusOptimizer.getTargets() };
            }
            const key = (window.PegasusManifest || window.M || {})?.workout?.muscleTargets || 'pegasus_muscle_targets';
            const parsed = JSON.parse(localStorage.getItem(key) || 'null');
            return parsed && typeof parsed === 'object' ? { ...fallback, ...parsed } : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function readWeeklyLedger() {
        const weekKey = getPegasusWeekKey();
        const ledger = safeReadObject(getPegasusWeeklyLedgerKey(), null);
        if (!ledger || ledger.weekKey !== weekKey || typeof ledger.exercises !== 'object') {
            return { weekKey, exercises: {}, initializedAt: Date.now() };
        }
        return ledger;
    }

    function writeWeeklyLedger(ledger) {
        const next = ledger && typeof ledger === 'object'
            ? ledger
            : { weekKey: getPegasusWeekKey(), exercises: {}, initializedAt: Date.now() };
        next.weekKey = getPegasusWeekKey();
        next.exercises = next.exercises && typeof next.exercises === 'object' ? next.exercises : {};
        localStorage.setItem(getPegasusWeeklyLedgerKey(), JSON.stringify(next));
        return next;
    }

    function getLedgerExerciseNameFromKey(key) {
        const parts = String(key || '').split('|');
        return parts.length > 1 ? parts.slice(1).join('|') : String(key || '');
    }

    function computeWeeklyHistoryFromLedger(ledger = readWeeklyLedger()) {
        const totals = getEmptyWeeklyHistory();
        if (!ledger || ledger.weekKey !== getPegasusWeekKey() || !ledger.exercises || typeof ledger.exercises !== 'object') {
            return totals;
        }

        Object.entries(ledger.exercises).forEach(([key, rawCount]) => {
            const count = Math.max(0, Number(rawCount) || 0);
            if (count <= 0) return;

            const exerciseName = getLedgerExerciseNameFromKey(key);
            const muscle = resolvePegasusMuscleGroup(exerciseName);
            if (!PEGASUS_WEEKLY_GROUPS.includes(muscle)) return;

            const perSetValue = getPegasusSetValue(exerciseName, muscle);
            if (perSetValue <= 0) return;

            totals[muscle] = Math.max(0, Number(totals[muscle] || 0)) + (count * perSetValue);
        });

        const targets = readWeeklyTargets();
        Object.keys(totals).forEach(group => {
            const target = Math.max(0, Number(targets[group]) || 0);
            if (target > 0) totals[group] = Math.min(totals[group], target);
        });

        return totals;
    }

    function repairWeeklyHistoryFromLedger(options = {}) {
        const ledger = readWeeklyLedger();
        const ledgerTotals = computeWeeklyHistoryFromLedger(ledger);
        const ledgerTotal = getWeeklyHistoryTotal(ledgerTotals);
        if (ledgerTotal <= 0) return false;

        const history = readWeeklyHistory();
        const next = { ...history };
        let changed = false;

        PEGASUS_WEEKLY_GROUPS.forEach(group => {
            const ledgerValue = Math.max(0, Number(ledgerTotals[group]) || 0);
            const currentValue = Math.max(0, Number(history[group]) || 0);
            if (ledgerValue > currentValue) {
                next[group] = ledgerValue;
                changed = true;
            }
        });

        if (!changed) return false;

        const cleanHistory = writeWeeklyHistory(next);
        window.dispatchEvent(new CustomEvent('pegasus_weekly_history_updated', {
            detail: {
                source: options.source || 'ledger-repair',
                history: { ...cleanHistory },
                ledger: { ...ledgerTotals }
            }
        }));

        if (window.MuscleProgressUI?.render) {
            setTimeout(() => window.MuscleProgressUI.render(true), 50);
        }

        if (window.PegasusCloud?.push && options.push !== false) {
            setTimeout(() => window.PegasusCloud.push(), 120);
        }

        console.log('🛡️ PEGASUS WEEKLY HISTORY: Restored progress from counted ledger.', cleanHistory);
        return true;
    }

    function hasCurrentWeekLedgerEntries() {
        const ledger = readWeeklyLedger();
        if (!ledger || ledger.weekKey !== getPegasusWeekKey() || !ledger.exercises || typeof ledger.exercises !== 'object') return false;
        return Object.values(ledger.exercises).some(value => Math.max(0, Number(value) || 0) > 0);
    }

    function collectPegasusExerciseRecords() {
        const records = [];
        if (Array.isArray(window.exercisesDB)) records.push(...window.exercisesDB);
        if (window.program && typeof window.program === 'object') {
            Object.values(window.program).forEach(items => {
                if (Array.isArray(items)) records.push(...items);
            });
        }
        return records.filter(item => item && item.name);
    }

    function resolvePegasusMuscleGroup(exerciseName) {
        const rawName = String(exerciseName || '').trim();
        const cleanName = normalizeExerciseName(rawName);
        if (!cleanName) return '';

        const record = collectPegasusExerciseRecords().find(item => {
            const itemName = normalizeExerciseName(item.name);
            return itemName && (itemName === cleanName || cleanName.includes(itemName) || itemName.includes(cleanName));
        });

        if (PEGASUS_WEEKLY_GROUPS.includes(record?.muscleGroup)) return record.muscleGroup;

        const aliases = [
            { group: 'Στήθος', keys: ['chest', 'press', 'fly', 'pushup', 'pushups', 'στηθος'] },
            { group: 'Πλάτη', keys: ['lat', 'row', 'pulldown', 'back', 'πλατη'] },
            { group: 'Πόδια', keys: ['leg', 'legs', 'cycling', 'bike', 'ποδηλα', 'ποδια'] },
            { group: 'Χέρια', keys: ['bicep', 'tricep', 'curl', 'pulldown tricep', 'χερια'] },
            { group: 'Ώμοι', keys: ['upright', 'shoulder', 'ωμοι'] },
            { group: 'Κορμός', keys: ['ab', 'crunch', 'plank', 'situp', 'knee', 'core', 'raise', 'κορμος', 'κοιλιακ'] }
        ];

        const alias = aliases.find(entry => entry.keys.some(key => cleanName.includes(normalizeExerciseName(key))));
        return alias?.group || '';
    }

    function getPegasusSetValue(exerciseName, muscle) {
        const upperName = String(exerciseName || '').trim().toUpperCase();
        if (upperName.includes('ΠΟΔΗΛΑΣΙΑ') || upperName.includes('CYCLING')) return 24;
        if (upperName.includes('EMS ΠΟΔΙΩΝ') || upperName.includes('EMS LEGS')) return 6;
        if (upperName.includes('STRETCHING') || muscle === 'None') return 0;
        return 1;
    }

    function getLedgerExerciseKey(exerciseName) {
        return normalizeExerciseName(exerciseName) || String(exerciseName || '').trim();
    }

    function recordPegasusWeeklyProgress(exerciseName, absoluteDone = null, options = {}) {
        const rawName = String(exerciseName || '').trim();
        if (!rawName) return false;

        const muscle = resolvePegasusMuscleGroup(rawName);
        if (!PEGASUS_WEEKLY_GROUPS.includes(muscle)) {
            console.warn('⚠️ PEGASUS WEEKLY HISTORY: set not counted because muscle group was not resolved:', rawName);
            return false;
        }

        const perSetValue = getPegasusSetValue(rawName, muscle);
        if (perSetValue <= 0) return false;

        const history = readWeeklyHistory();
        const historyTotal = getWeeklyHistoryTotal(history);
        const ledger = readWeeklyLedger();
        const dateKey = options.dateKey || getPegasusTodayKey();
        const key = dateKey + '|' + getLedgerExerciseKey(rawName);
        const previousCounted = Math.max(0, Number(ledger.exercises[key]) || 0);

        let nextCounted;
        if (Number.isFinite(Number(absoluteDone)) && Number(absoluteDone) >= 0) {
            nextCounted = Math.max(0, Number(absoluteDone));
        } else {
            nextCounted = previousCounted + 1;
        }

        if (previousCounted === 0 && historyTotal > 0 && Number.isFinite(Number(absoluteDone)) && Number(absoluteDone) > 1 && options.source !== 'zero-history-repair') {
            ledger.exercises[key] = Math.max(0, Number(absoluteDone) - 1);
        }

        const baselineCounted = Math.max(0, Number(ledger.exercises[key]) || 0);
        const deltaSets = Math.max(0, nextCounted - baselineCounted);
        if (deltaSets <= 0) {
            writeWeeklyLedger(ledger);
            return false;
        }

        const targets = readWeeklyTargets();
        const groupTarget = Math.max(0, Number(targets[muscle]) || 0);
        const currentGroupValue = Math.max(0, Number(history[muscle] || 0));
        const rawAddValue = deltaSets * perSetValue;
        const addValue = groupTarget > 0 ? Math.min(rawAddValue, Math.max(0, groupTarget - currentGroupValue)) : rawAddValue;

        if (addValue <= 0) {
            ledger.exercises[key] = nextCounted;
            ledger.updatedAt = Date.now();
            writeWeeklyLedger(ledger);
            return false;
        }

        history[muscle] = currentGroupValue + addValue;
        const cleanHistory = writeWeeklyHistory(history);
        ledger.exercises[key] = nextCounted;
        ledger.updatedAt = Date.now();
        writeWeeklyLedger(ledger);

        window.dispatchEvent(new CustomEvent('pegasus_weekly_history_updated', {
            detail: {
                exercise: rawName,
                muscle,
                value: addValue,
                deltaSets,
                source: options.source || 'record',
                history: { ...cleanHistory }
            }
        }));

        if (window.MuscleProgressUI?.render) {
            setTimeout(() => window.MuscleProgressUI.render(true), 50);
        }

        if (window.PegasusCloud?.push && options.push !== false) {
            setTimeout(() => window.PegasusCloud.push(), 80);
        }

        return true;
    }

    function collectDailyProgressExercises() {
        const todayKey = getPegasusTodayKey();
        const daily = safeReadObject('pegasus_daily_progress', null);
        const out = {};

        if (daily?.date === todayKey && daily.exercises && typeof daily.exercises === 'object') {
            Object.entries(daily.exercises).forEach(([name, done]) => {
                const value = Number(done);
                if (name && Number.isFinite(value) && value > 0) out[name] = Math.max(out[name] || 0, value);
            });
        }

        document.querySelectorAll?.('.exercise')?.forEach(node => {
            const name = node.querySelector('.weight-input')?.getAttribute('data-name') || node.querySelector('.exercise-name')?.textContent || '';
            const done = Number(node.dataset?.done || 0);
            if (name && Number.isFinite(done) && done > 0) out[name] = Math.max(out[name] || 0, done);
        });

        return out;
    }

    function reconcilePegasusWeeklyHistoryFromDailyProgress(options = {}) {
        let changed = repairWeeklyHistoryFromLedger({ source: options.source || 'daily-reconcile-ledger-repair', push: false });
        const history = readWeeklyHistory();
        const historyTotal = getWeeklyHistoryTotal(history);
        const dailyDone = collectDailyProgressExercises();

        Object.entries(dailyDone).forEach(([name, done]) => {
            const source = historyTotal === 0 ? 'zero-history-repair' : (options.source || 'daily-reconcile');
            const applied = recordPegasusWeeklyProgress(name, done, { source, push: false });
            changed = changed || applied;
        });

        if (changed && window.PegasusCloud?.push && options.push !== false) {
            setTimeout(() => window.PegasusCloud.push(), 120);
        }

        return changed;
    }

    function installWeeklyHistoryLoggerPatch() {
        if (window.__pegasusWeeklyHistoryLoggerPatchInstalled) return;

        window.__pegasusOriginalLogPegasusSet = typeof window.logPegasusSet === 'function'
            ? window.logPegasusSet
            : null;

        window.logPegasusSet = function patchedLogPegasusSet(exerciseName, absoluteDone) {
            return recordPegasusWeeklyProgress(exerciseName, absoluteDone, { source: 'set-completed' });
        };

        window.reconcilePegasusWeeklyHistoryFromDailyProgress = reconcilePegasusWeeklyHistoryFromDailyProgress;
        window.PegasusWeeklyProgress = {
            installed: true,
            recordSet: window.logPegasusSet,
            reconcile: reconcilePegasusWeeklyHistoryFromDailyProgress,
            repairFromLedger: repairWeeklyHistoryFromLedger,
            computeFromLedger: computeWeeklyHistoryFromLedger,
            hasCurrentWeekLedgerEntries: hasCurrentWeekLedgerEntries,
            resolveMuscleGroup: resolvePegasusMuscleGroup,
            readHistory: readWeeklyHistory
        };

        setTimeout(() => reconcilePegasusWeeklyHistoryFromDailyProgress({ source: 'boot-reconcile' }), 700);

        window.__pegasusWeeklyHistoryLoggerPatchInstalled = true;
        console.log('✅ PEGASUS WEEKLY HISTORY: Robust counted-ledger logger active.');
    }

    function normalizeMuscleProgressTypography() {
        const container = document.getElementById('muscleProgressContainer');
        if (!container) return;

        container.querySelectorAll('[style]').forEach(node => {
            if (node.style && node.style.fontSize) {
                node.style.removeProperty('font-size');
            }
        });
    }

    function installMuscleProgressTypographyPatch() {
        if (window.__pegasusMuscleProgressTypographyPatchInstalled) return;

        const wrapRender = () => {
            if (!window.MuscleProgressUI || window.MuscleProgressUI.__typographyWrapped) return;
            const originalRender = window.MuscleProgressUI.render?.bind(window.MuscleProgressUI);
            if (typeof originalRender !== 'function') return;

            window.MuscleProgressUI.render = function patchedMuscleProgressRender(...args) {
                const result = originalRender(...args);
                normalizeMuscleProgressTypography();
                applyTypography();
                return result;
            };

            window.MuscleProgressUI.__typographyWrapped = true;
            normalizeMuscleProgressTypography();
        };

        wrapRender();
        document.addEventListener('DOMContentLoaded', wrapRender, { once: true });
        window.addEventListener('pegasus_weekly_history_updated', normalizeMuscleProgressTypography);

        window.__pegasusMuscleProgressTypographyPatchInstalled = true;
        console.log('✅ PEGASUS TYPOGRAPHY: Muscle progress inline font cleanup active.');
    }

    function scheduleApply() {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(applyTypography, RESIZE_DEBOUNCE_MS);
    }

    window.PegasusAdaptiveTypography = {
        installed: true,
        state: null,
        apply: applyTypography,
        refresh: applyTypography,
        getState: function () {
            return this.state || applyTypography();
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyTypography, { once: true });
        document.addEventListener('DOMContentLoaded', installWeeklyHistoryLoggerPatch, { once: true });
        document.addEventListener('DOMContentLoaded', installMuscleProgressTypographyPatch, { once: true });
    } else {
        applyTypography();
        installWeeklyHistoryLoggerPatch();
        installMuscleProgressTypographyPatch();
    }

    window.addEventListener('load', () => {
        applyTypography();
        installWeeklyHistoryLoggerPatch();
        installMuscleProgressTypographyPatch();
        normalizeMuscleProgressTypography();
    }, { once: true });
    window.addEventListener('resize', scheduleApply);
    window.addEventListener('orientationchange', scheduleApply);
    console.log('✅ PEGASUS ADAPTIVE TYPOGRAPHY: Active.');
})();

/* ==========================================================================
   PEGASUS 133 WEEKLY PROGRESS DOUBLE-COUNT REPAIR
   Reporting no longer writes weekly sets. This one-time repair only subtracts
   the old current-day reporting duplicate when detected above the counted ledger.
   ========================================================================== */
(function () {
    const GROUPS = ['Στήθος', 'Πλάτη', 'Πόδια', 'Χέρια', 'Ώμοι', 'Κορμός'];

    function normalize(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\u0370-\u03ff]+/g, '');
    }

    function todayKey() {
        if (typeof window.getPegasusLocalDateKey === 'function') return window.getPegasusLocalDateKey();
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    function weekKey() {
        const d = new Date();
        const day = d.getDay() || 7;
        const monday = new Date(d);
        monday.setHours(0, 0, 0, 0);
        monday.setDate(d.getDate() - day + 1);
        return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    }

    function emptyHistory() {
        return { 'Στήθος': 0, 'Πλάτη': 0, 'Πόδια': 0, 'Χέρια': 0, 'Ώμοι': 0, 'Κορμός': 0 };
    }

    function readObject(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function historyKey() {
        const manifest = window.PegasusManifest || window.M || {};
        return manifest?.workout?.weekly_history || 'pegasus_weekly_history';
    }

    function readHistory() {
        const raw = readObject(historyKey(), {});
        const clean = emptyHistory();
        GROUPS.forEach(group => {
            const value = Number(raw?.[group]);
            clean[group] = Number.isFinite(value) ? Math.max(0, value) : 0;
        });
        return clean;
    }

    function writeHistory(history) {
        const clean = emptyHistory();
        GROUPS.forEach(group => {
            const value = Number(history?.[group]);
            clean[group] = Number.isFinite(value) ? Math.max(0, value) : 0;
        });
        localStorage.setItem(historyKey(), JSON.stringify(clean));
        return clean;
    }

    function collectRecords() {
        const records = [];
        if (Array.isArray(window.exercisesDB)) records.push(...window.exercisesDB);
        if (window.program && typeof window.program === 'object') {
            Object.values(window.program).forEach(items => {
                if (Array.isArray(items)) records.push(...items);
            });
        }
        return records.filter(item => item && item.name);
    }

    function resolveGroup(name) {
        const clean = normalize(name);
        if (!clean) return '';

        const record = collectRecords().find(item => {
            const itemName = normalize(item.name);
            return itemName && (itemName === clean || clean.includes(itemName) || itemName.includes(clean));
        });
        if (GROUPS.includes(record?.muscleGroup)) return record.muscleGroup;

        const aliases = [
            { group: 'Στήθος', keys: ['chest', 'press', 'fly', 'pushup', 'pushups', 'στηθος'] },
            { group: 'Πλάτη', keys: ['lat', 'row', 'pulldown', 'back', 'πλατη'] },
            { group: 'Πόδια', keys: ['leg', 'legs', 'cycling', 'bike', 'ποδηλα', 'ποδια'] },
            { group: 'Χέρια', keys: ['bicep', 'tricep', 'curl', 'χερια'] },
            { group: 'Ώμοι', keys: ['upright', 'shoulder', 'ωμοι'] },
            { group: 'Κορμός', keys: ['ab', 'crunch', 'plank', 'situp', 'knee', 'core', 'raise', 'κορμος', 'κοιλιακ'] }
        ];
        const alias = aliases.find(entry => entry.keys.some(key => clean.includes(normalize(key))));
        return alias?.group || '';
    }

    function setValue(name, group) {
        const upper = String(name || '').toUpperCase();
        if (upper.includes('ΠΟΔΗΛΑΣΙΑ') || upper.includes('CYCLING')) return 24;
        if (upper.includes('EMS ΠΟΔΙΩΝ') || upper.includes('EMS LEGS')) return 6;
        if (upper.includes('STRETCHING') || group === 'None') return 0;
        return 1;
    }

    function ledgerTotals() {
        const totals = emptyHistory();
        const ledger = readObject('pegasus_weekly_history_counted_v2', null);
        if (!ledger || ledger.weekKey !== weekKey() || typeof ledger.exercises !== 'object') return totals;

        Object.entries(ledger.exercises).forEach(([key, count]) => {
            const name = String(key || '').split('|').slice(1).join('|');
            const group = resolveGroup(name);
            const amount = Number(count) || 0;
            if (GROUPS.includes(group) && amount > 0) totals[group] += amount * setValue(name, group);
        });
        return totals;
    }

    function dailyTotals() {
        const totals = emptyHistory();
        const daily = readObject('pegasus_daily_progress', null);
        if (daily?.date === todayKey() && daily.exercises && typeof daily.exercises === 'object') {
            Object.entries(daily.exercises).forEach(([name, done]) => {
                const group = resolveGroup(name);
                const amount = Number(done) || 0;
                if (GROUPS.includes(group) && amount > 0) totals[group] += amount * setValue(name, group);
            });
        }
        return totals;
    }

    function repairOnce() {
        const marker = `pegasus_weekly_reporting_doublecount_repair_v133_${weekKey()}_${todayKey()}`;
        if (localStorage.getItem(marker) === 'done') return false;

        const history = readHistory();
        const counted = ledgerTotals();
        const daily = dailyTotals();
        const next = { ...history };
        let changed = false;

        GROUPS.forEach(group => {
            const d = Number(daily[group] || 0);
            if (d <= 0) return;
            const current = Number(history[group] || 0);
            const ledger = Number(counted[group] || 0);
            if (current === ledger + d) {
                next[group] = Math.max(0, current - d);
                changed = true;
            }
        });

        if (changed) {
            const fixed = writeHistory(next);
            window.dispatchEvent(new CustomEvent('pegasus_weekly_history_updated', {
                detail: { source: 'reporting-doublecount-repair-v133', history: fixed }
            }));
            if (window.MuscleProgressUI?.render) setTimeout(() => window.MuscleProgressUI.render(true), 50);
            if (window.PegasusCloud?.push) setTimeout(() => window.PegasusCloud.push(), 120);
        }

        localStorage.setItem(marker, 'done');
        return changed;
    }

    window.repairPegasusWeeklyProgressDoubleCount = repairOnce;
    window.addEventListener('load', () => setTimeout(repairOnce, 1200), { once: true });
})();
