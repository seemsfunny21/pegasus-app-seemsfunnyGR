/* ==========================================================================
   PEGASUS BRIDGE HUB - v19.3
   Protocol: Cross-module intelligence bridges without core behavior rewrites.
   Scope: Desktop workout ↔ mobile lifting/diet/preview/supplies/biometrics.
   Status: TARGETED FEATURE LAYER | SEPARATE BRIDGE FILE
   ========================================================================== */

(function () {
    const BRIDGE_EVENT = 'pegasus:bridge:update';
    const SUPPLY_STATE_KEY = 'pegasus_bridge_supply_state_v1';
    const MISSION_KEY = 'pegasus_missions_v1';
    const MISSION_DATE_KEY = 'pegasus_missions_date';
    const NOTES_KEY = 'pegasus_notes';
    const BRIDGE_NOTE_PREFIX = 'PEGASUS BRIDGE:';
    const BRIDGE_MISSION_TAG = 'pegasus-bridge-supply';
    const GREEK_DAYS = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];

    function safeJSON(raw, fallback) {
        try {
            const parsed = JSON.parse(raw);
            return parsed === null || parsed === undefined ? fallback : parsed;
        } catch (e) {
            return fallback;
        }
    }

    function readLS(key, fallback) {
        return safeJSON(localStorage.getItem(key), fallback);
    }

    function writeLS(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function stripDiacritics(str) {
        return String(str || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function normalizeSpace(str) {
        return String(str || '').replace(/\s+/g, ' ').trim();
    }

    function normalizeExerciseName(str) {
        return stripDiacritics(normalizeSpace(str))
            .replace(/[()\[\]{}.,:;!?'"`~@#$%^&*_+=<>\\/|-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toUpperCase();
    }

    const aliasMap = {
        'ΠΙΕΣΕΙΣ ΣΤΗΘΟΥΣ': 'CHEST PRESS',
        'ΣΤΗΘΟΣ PRESS': 'CHEST PRESS',
        'CHEST PRESS': 'CHEST PRESS',
        'CHEST FLY': 'CHEST FLYS',
        'CHEST FLYS': 'CHEST FLYS',
        'PUSH UP': 'PUSHUPS',
        'PUSHUPS': 'PUSHUPS',
        'ΚΩΠΗΛΑΤΙΚΗ ΚΑΘΙΣΤΟΣ': 'SEATED ROWS',
        'SEATED ROW': 'SEATED ROWS',
        'SEATED ROWS': 'SEATED ROWS',
        'LOW ROW': 'LOW ROWS SEATED',
        'LOW ROWS SEATED': 'LOW ROWS SEATED',
        'LAT PULLDOWN': 'LAT PULLDOWNS',
        'LAT PULLDOWNS': 'LAT PULLDOWNS',
        'LAT PULLDOWNS CLOSE': 'LAT PULLDOWNS CLOSE',
        'BICEP CURL': 'BICEP CURLS',
        'BICEP CURLS': 'BICEP CURLS',
        'STANDING BICEP CURLS': 'STANDING BICEP CURLS',
        'PREACHER BICEP CURLS': 'PREACHER BICEP CURLS',
        'TRICEP PULLDOWNS': 'TRICEP PULLDOWNS',
        'AB CRUNCHES': 'AB CRUNCHES',
        'SITUPS': 'SITUPS',
        'PLANK': 'PLANK',
        'REVERSE CRUNCH': 'REVERSE CRUNCH',
        'REVERSE CRUNCHES': 'REVERSE CRUNCH',
        'LYING KNEE RAISE': 'LYING KNEE RAISE',
        'LEG RAISE HIP LIFT': 'LEG RAISE HIP LIFT',
        'LEG EXTENSIONS': 'LEG EXTENSIONS',
        'UPRIGHT ROWS': 'UPRIGHT ROWS',
        'CYCLING': 'CYCLING',
        'ΠΟΔΗΛΑΣΙΑ': 'CYCLING'
    };

    function resolveCanonicalExerciseName(str) {
        const normalized = normalizeExerciseName(str);
        if (!normalized) return '';
        if (aliasMap[normalized]) return aliasMap[normalized];

        const db = Array.isArray(window.exercisesDB) ? window.exercisesDB : [];
        const direct = db.find(item => normalizeExerciseName(item?.name) === normalized);
        if (direct?.name) return normalizeExerciseName(direct.name);

        for (const [key, value] of Object.entries(aliasMap)) {
            if (normalized.includes(key) || key.includes(normalized)) return value;
        }

        const partial = db.find(item => {
            const itemName = normalizeExerciseName(item?.name);
            return normalized.includes(itemName) || itemName.includes(normalized);
        });

        return partial?.name ? normalizeExerciseName(partial.name) : normalized;
    }

    function getActiveLifterName() {
        try {
            return typeof window.getActiveLifter === 'function' ? window.getActiveLifter() : 'ΑΓΓΕΛΟΣ';
        } catch (e) {
            return 'ΑΓΓΕΛΟΣ';
        }
    }

    function getExerciseWeightStore() {
        const key = window.PegasusManifest?.workout?.exerciseWeights || 'pegasus_exercise_weights';
        return readLS(key, {});
    }

    function getWeightMapForLifter() {
        const all = getExerciseWeightStore();
        const lifter = getActiveLifterName();
        return all?.[lifter] && typeof all[lifter] === 'object' ? all[lifter] : {};
    }

    function getDesktopWeightSuggestion(exerciseName) {
        const target = resolveCanonicalExerciseName(exerciseName);
        if (!target) return null;

        const weightMap = getWeightMapForLifter();
        const entries = Object.entries(weightMap || {});
        if (!entries.length) return null;

        for (const [name, value] of entries) {
            if (resolveCanonicalExerciseName(name) === target) {
                return {
                    source: 'desktop',
                    matchedName: name,
                    canonicalName: target,
                    value: parseFloat(value)
                };
            }
        }

        const partial = entries.find(([name]) => {
            const candidate = resolveCanonicalExerciseName(name);
            return candidate.includes(target) || target.includes(candidate);
        });

        return partial ? {
            source: 'desktop',
            matchedName: partial[0],
            canonicalName: target,
            value: parseFloat(partial[1])
        } : null;
    }

    function getRecentLiftingSuggestion(exerciseName) {
        const target = resolveCanonicalExerciseName(exerciseName);
        if (!target) return null;
        const logs = readLS('pegasus_lifting_v1', []);
        if (!Array.isArray(logs) || !logs.length) return null;

        const hit = logs.find(entry => resolveCanonicalExerciseName(entry?.exercise) === target);
        if (!hit) return null;
        return {
            source: 'lifting-history',
            matchedName: hit.exercise,
            canonicalName: target,
            value: parseFloat(hit.weight),
            reps: parseInt(hit.reps || 0, 10) || 0,
            timestamp: Number(hit.timestamp || 0) || 0,
            date: hit.date || ''
        };
    }

    function getExerciseWeightBridge(exerciseName) {
        return getDesktopWeightSuggestion(exerciseName) || getRecentLiftingSuggestion(exerciseName) || null;
    }

    function getTodayGreekDayName() {
        return GREEK_DAYS[new Date().getDay()];
    }

    function getTodayDateStr() {
        if (typeof window.getPegasusTodayDateStr === 'function') return window.getPegasusTodayDateStr();
        const now = new Date();
        return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    }

    function getTodayKey() {
        if (typeof window.getPegasusLocalDateKey === 'function') return window.getPegasusLocalDateKey();
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    function getTodayFoodLog() {
        const prefix = window.PegasusManifest?.nutrition?.log_prefix || 'food_log_';
        return readLS(prefix + getTodayDateStr(), []);
    }

    function sumFoodLog(log) {
        return (Array.isArray(log) ? log : []).reduce((acc, item) => {
            acc.kcal += parseFloat(item?.kcal || 0) || 0;
            acc.protein += parseFloat(item?.protein || 0) || 0;
            return acc;
        }, { kcal: 0, protein: 0 });
    }

    function getTodayCardioContext() {
        const dateStr = getTodayDateStr();
        const history = readLS('pegasus_cardio_history', []);
        const todayEntries = Array.isArray(history) ? history.filter(entry => entry?.date === dateStr) : [];
        const km = todayEntries.reduce((sum, entry) => sum + (parseFloat(entry?.km || 0) || 0), 0);
        const historyKcal = todayEntries.reduce((sum, entry) => sum + (parseFloat(entry?.kcal || 0) || 0), 0);
        const unified = parseFloat(localStorage.getItem('pegasus_cardio_kcal_' + dateStr));
        const legacy = parseFloat(localStorage.getItem((window.PegasusManifest?.workout?.cardio_offset || 'pegasus_cardio_offset_sets') + '_' + dateStr));
        const kcal = !isNaN(unified) ? unified : (!isNaN(legacy) ? legacy : historyKcal);
        const heavy = (km >= 15) || (kcal >= 400);
        return {
            dateStr,
            entries: todayEntries,
            km: Math.round(km * 10) / 10,
            kcal: Math.round((kcal || 0) * 10) / 10,
            heavy,
            nextDayGuidance: heavy ? 'ΑΥΡΙΟ: ΧΑΜΗΛΟΤΕΡΟ ΦΟΡΤΙΟ ΠΟΔΙΩΝ' : 'ΑΥΡΙΟ: ΚΑΝΟΝΙΚΗ ΕΠΙΒΑΡΥΝΣΗ'
        };
    }

    function getWorkoutContext() {
        const persisted = readLS('pegasus_engine_progress_runtime_v1', {});
        const doneMap = readLS(window.PegasusManifest?.workout?.done || 'pegasus_workouts_done', {});
        const todayKey = getTodayKey();
        const remaining = Array.isArray(persisted?.remainingSets) ? persisted.remainingSets : [];
        const remainingCount = remaining.reduce((sum, value) => sum + Math.max(0, Number(value || 0)), 0);
        const totalCount = remaining.reduce((sum, value) => sum + Math.max(0, Number(value || 0)), 0);
        const selectedDay = persisted?.todayKey === todayKey ? (persisted.selectedDay || getTodayGreekDayName()) : getTodayGreekDayName();
        const plan = Array.isArray(window.program?.[selectedDay]) ? window.program[selectedDay] : [];
        const savedWeights = plan
            .filter(item => item?.name && item.name !== 'Stretching')
            .map(item => {
                const bridge = getExerciseWeightBridge(item.name);
                return {
                    name: item.name,
                    sets: Number(item.sets || 0) || 0,
                    muscleGroup: item.muscleGroup || '',
                    savedWeight: bridge?.value ?? (parseFloat(item.weight || 0) || 0),
                    bridgeSource: bridge?.source || (item.weight ? 'plan' : null)
                };
            });

        const totalPlannedSets = plan.reduce((sum, item) => sum + Math.max(0, Number(item?.sets || 0)), 0);
        const remainingRuntimeSets = Array.isArray(persisted?.remainingSets)
            ? persisted.remainingSets.reduce((sum, value) => sum + Math.max(0, Number(value || 0)), 0)
            : 0;
        const doneSets = Math.max(0, totalPlannedSets - remainingRuntimeSets);
        const completionPct = totalPlannedSets > 0 ? Math.round((doneSets / totalPlannedSets) * 100) : 0;

        return {
            todayKey,
            todayDayName: getTodayGreekDayName(),
            selectedDay,
            runtimeDateMatchesToday: persisted?.todayKey === todayKey,
            hasRemainingWork: remainingRuntimeSets > 0,
            remainingSetsCount: remainingRuntimeSets,
            totalPlannedSets,
            doneSets,
            completionPct,
            remainingSeconds: Number(persisted?.remainingSeconds || 0) || 0,
            totalSeconds: Number(persisted?.totalSeconds || 0) || 0,
            sessionKcal: Number(persisted?.sessionKcal || localStorage.getItem('pegasus_session_kcal') || 0) || 0,
            completedToday: !!doneMap?.[todayKey],
            plan: savedWeights
        };
    }

    function getNutritionContext() {
        const log = getTodayFoodLog();
        const totals = sumFoodLog(log);
        const effectiveTarget = typeof window.getPegasusEffectiveDailyTarget === 'function'
            ? Number(window.getPegasusEffectiveDailyTarget()) || 0
            : (window.PegasusDiet?.getEffectiveTarget ? Number(window.PegasusDiet.getEffectiveTarget()) || 0 : 0);
        const proteinTarget = parseFloat(localStorage.getItem('pegasus_goal_protein') || '160') || 160;
        const cardio = getTodayCardioContext();
        const workout = getWorkoutContext();
        return {
            kcal: Math.round(totals.kcal),
            protein: Math.round(totals.protein),
            targetKcal: Math.round(effectiveTarget || 0),
            targetProtein: Math.round(proteinTarget),
            remainingKcal: Math.max(0, Math.round((effectiveTarget || 0) - totals.kcal)),
            remainingProtein: Math.max(0, Math.round(proteinTarget - totals.protein)),
            trainingDay: workout.todayDayName !== 'Δευτέρα' && workout.todayDayName !== 'Πέμπτη',
            cardioKcal: cardio.kcal,
            cardioKm: cardio.km
        };
    }

    function getBodyContext() {
        const weightKey = window.PegasusManifest?.user?.weight || 'pegasus_weight';
        const historyKey = window.PegasusManifest?.user?.weightHistory || 'pegasus_weight_history';
        const currentWeight = parseFloat(localStorage.getItem(weightKey) || '0') || 0;
        const history = readLS(historyKey, {});
        const sortedKeys = Object.keys(history || {}).sort();
        const last7 = sortedKeys.slice(-7).map(k => parseFloat(history[k] || 0) || 0).filter(Boolean);
        const averageWeight = last7.length ? Math.round((last7.reduce((a, b) => a + b, 0) / last7.length) * 10) / 10 : currentWeight || 0;
        const bio = readLS('pegasus_biometrics_v1', []);
        const latestBio = Array.isArray(bio) && bio.length ? bio[0] : null;
        const bioScore = latestBio
            ? Math.round(((Number(latestBio.sleep || 0) + Number(latestBio.energy || 0) + Number(latestBio.recovery || 0)) / 3) * 10) / 10
            : null;
        const workout = getWorkoutContext();
        const cardio = getTodayCardioContext();
        let guidance = 'ΣΤΑΘΕΡΟ ΦΟΡΤΙΟ.';
        if (bioScore !== null && bioScore <= 4) guidance = 'ΗΠΙΟΤΕΡΗ ΜΕΡΑ / ΠΕΡΙΣΣΟΤΕΡΗ ΑΝΑΡΡΩΣΗ.';
        else if (cardio.heavy) guidance = 'ΚΡΑΤΑ ΧΑΜΗΛΑ ΤΑ ΠΟΔΙΑ ΣΤΟ ΕΠΟΜΕΝΟ SESSION.';
        else if (workout.hasRemainingWork) guidance = 'ΥΠΑΡΧΕΙ ΥΠΟΛΟΙΠΟ ΠΡΟΠΟΝΗΣΗΣ ΣΗΜΕΡΑ.';
        return {
            currentWeight,
            averageWeight,
            latestBio,
            bioScore,
            guidance
        };
    }

    function getSupplyContext() {
        const inventory = window.PegasusInventory?.getState
            ? window.PegasusInventory.getState()
            : readLS('pegasus_supp_inventory', { prot: 2500, crea: 1000 });
        const log = getTodayFoodLog();
        let wheyHits = 0;
        let creatineHits = 0;
        (Array.isArray(log) ? log : []).forEach(item => {
            const name = String(item?.name || '').toLowerCase();
            if (name.includes('whey') || name.includes('πρωτεΐνη') || name.includes('πρωτεινη')) wheyHits += 1;
            if (name.includes('κρεατίνη') || name.includes('κρεατινη') || name.includes('creatine')) creatineHits += 1;
        });

        const proteinThreshold = 30 * 12;
        const creatineThreshold = 5 * 12;
        const alerts = [];
        if ((inventory?.prot || 0) <= proteinThreshold) alerts.push({ key: 'prot', title: 'Αγορά Πρωτεΐνης WHEY', note: `Χαμηλό απόθεμα πρωτεΐνης: ${Math.round(inventory.prot || 0)}g.` });
        if ((inventory?.crea || 0) <= creatineThreshold) alerts.push({ key: 'crea', title: 'Αγορά Κρεατίνης', note: `Χαμηλό απόθεμα κρεατίνης: ${Math.round(inventory.crea || 0)}g.` });

        return {
            inventory,
            wheyHits,
            creatineHits,
            alerts
        };
    }

    function ensureBridgeNotesAndMissions() {
        const supply = getSupplyContext();
        const state = readLS(SUPPLY_STATE_KEY, {});
        let missions = readLS(MISSION_KEY, []);
        let notes = readLS(NOTES_KEY, []);
        let touched = false;
        const todayDate = getTodayDateStr();

        supply.alerts.forEach(alert => {
            const missionExists = Array.isArray(missions) && missions.some(item => item?.bridgeTag === `${BRIDGE_MISSION_TAG}:${alert.key}` || item?.title === alert.title);
            if (!missionExists) {
                missions.push({
                    id: 'bridge_mis_' + alert.key,
                    title: alert.title,
                    completed: false,
                    bridgeTag: `${BRIDGE_MISSION_TAG}:${alert.key}`,
                    autoCreated: true
                });
                touched = true;
            }

            const noteText = `${BRIDGE_NOTE_PREFIX} ${alert.note}`;
            const noteExists = Array.isArray(notes) && notes.some(item => item?.bridgeTag === `${BRIDGE_MISSION_TAG}:${alert.key}` || item?.t === noteText);
            if (!noteExists) {
                notes.unshift({ d: todayDate, t: noteText, bridgeTag: `${BRIDGE_MISSION_TAG}:${alert.key}`, autoCreated: true });
                touched = true;
            }

            state[alert.key] = { active: true, lastSeen: Date.now() };
        });

        ['prot', 'crea'].forEach(key => {
            if (!supply.alerts.some(item => item.key === key) && state[key]?.active) {
                missions = missions.filter(item => item?.bridgeTag !== `${BRIDGE_MISSION_TAG}:${key}`);
                notes = notes.filter(item => item?.bridgeTag !== `${BRIDGE_MISSION_TAG}:${key}`);
                state[key] = { active: false, clearedAt: Date.now() };
                touched = true;
            }
        });

        if (touched) {
            writeLS(MISSION_KEY, missions);
            localStorage.setItem(MISSION_DATE_KEY, todayDate);
            writeLS(NOTES_KEY, notes.slice(0, 200));
            writeLS(SUPPLY_STATE_KEY, state);
            if (typeof window.renderMissionsContent === 'function') window.renderMissionsContent();
            if (window.PegasusProfile?.renderNotes) window.PegasusProfile.renderNotes();
        }

        return { touched, alerts: supply.alerts };
    }

    function dispatchBridgeUpdate(reason, payload = {}) {
        window.dispatchEvent(new CustomEvent(BRIDGE_EVENT, {
            detail: {
                reason,
                payload,
                ts: Date.now()
            }
        }));
    }

    function wrapOnce(objectRef, methodName, afterFn) {
        const obj = objectRef();
        if (!obj || typeof obj[methodName] !== 'function' || obj[methodName].__pegasusBridgeWrapped) return false;
        const original = obj[methodName];
        obj[methodName] = function wrappedPegasusBridgeMethod() {
            const result = original.apply(this, arguments);
            Promise.resolve(result).finally(() => {
                try { afterFn.apply(this, arguments); } catch (e) { console.warn('PEGASUS BRIDGE afterFn failed:', methodName, e); }
            });
            return result;
        };
        obj[methodName].__pegasusBridgeWrapped = true;
        return true;
    }

    function patchBridges() {
        wrapOnce(() => window, 'saveWeight', function () {
            dispatchBridgeUpdate('desktop-weight-save');
        });

        wrapOnce(() => window.PegasusInventory, 'consume', function () {
            ensureBridgeNotesAndMissions();
            dispatchBridgeUpdate('inventory-consume');
        });

        wrapOnce(() => window.PegasusInventory, 'refill', function () {
            ensureBridgeNotesAndMissions();
            dispatchBridgeUpdate('inventory-refill');
        });

        wrapOnce(() => window.PegasusDiet, 'add', function () {
            ensureBridgeNotesAndMissions();
            dispatchBridgeUpdate('diet-add');
        });

        wrapOnce(() => window.PegasusDiet, 'delete', function () {
            dispatchBridgeUpdate('diet-delete');
        });

        wrapOnce(() => window.PegasusCardio, 'save', function () {
            dispatchBridgeUpdate('cardio-save');
        });

        wrapOnce(() => window.PegasusWeight, 'save', function () {
            dispatchBridgeUpdate('body-weight-save');
        });

        wrapOnce(() => window.PegasusBio, 'saveAndRender', function () {
            dispatchBridgeUpdate('biometrics-save');
        });

        wrapOnce(() => window.PegasusLifting, 'saveAndRender', function () {
            dispatchBridgeUpdate('lifting-save');
        });

        wrapOnce(() => window, 'selectDay', function () {
            dispatchBridgeUpdate('desktop-select-day');
        });

        wrapOnce(() => window, 'addFoodItem', function () {
            ensureBridgeNotesAndMissions();
            dispatchBridgeUpdate('desktop-food-add');
        });
    }

    const Bridge = {
        installed: true,
        normalizeExerciseName,
        resolveCanonicalExerciseName,
        getExerciseWeightBridge,
        getDesktopWeightSuggestion,
        getRecentLiftingSuggestion,
        getWorkoutContext,
        getNutritionContext,
        getTodayCardioContext,
        getBodyContext,
        getSupplyContext,
        ensureBridgeNotesAndMissions,
        dispatchBridgeUpdate,
        getBridgeSnapshot() {
            return {
                workout: getWorkoutContext(),
                nutrition: getNutritionContext(),
                cardio: getTodayCardioContext(),
                body: getBodyContext(),
                supplies: getSupplyContext()
            };
        },
        getCurrentPlanExerciseWeights() {
            return getWorkoutContext().plan;
        },
        prefillMobileLiftingWeight(exerciseName, opts = {}) {
            const suggestion = getExerciseWeightBridge(exerciseName);
            const weightInput = document.getElementById('liftWeight');
            if (!weightInput || !suggestion || isNaN(suggestion.value)) return null;
            if (!opts.force && String(weightInput.value || '').trim() !== '') return suggestion;
            weightInput.value = suggestion.value;
            return suggestion;
        },
        getDietBridgeStatus() {
            const workout = getWorkoutContext();
            const nutrition = getNutritionContext();
            const cardio = getTodayCardioContext();
            return {
                workout,
                nutrition,
                cardio,
                headline: workout.hasRemainingWork
                    ? `ΥΠΑΡΧΕΙ ΥΠΟΛΟΙΠΟ ΠΡΟΠΟΝΗΣΗΣ ${workout.selectedDay.toUpperCase()}`
                    : (workout.completedToday ? 'Η ΠΡΟΠΟΝΗΣΗ ΣΗΜΕΡΑ ΕΧΕΙ ΣΗΜΑΝΘΕΙ ΟΛΟΚΛΗΡΩΜΕΝΗ' : `ΣΗΜΕΡΙΝΟ ΠΡΟΓΡΑΜΜΑ: ${workout.todayDayName.toUpperCase()}`)
            };
        }
    };

    window.PegasusBridgeHub = Bridge;

    let patchAttempts = 0;
    const patchTimer = setInterval(() => {
        patchAttempts += 1;
        patchBridges();
        ensureBridgeNotesAndMissions();
        if (patchAttempts >= 30) clearInterval(patchTimer);
    }, 400);

    document.addEventListener('DOMContentLoaded', () => {
        patchBridges();
        ensureBridgeNotesAndMissions();
        dispatchBridgeUpdate('bridge-boot');
    }, { once: true });

    console.log('🌉 PEGASUS BRIDGE HUB: Active.');
})();
