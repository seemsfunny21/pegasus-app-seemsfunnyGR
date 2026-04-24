
/* ==========================================================================
   PEGASUS DIET VARIATION ENGINE - v1.0
   Protocol: Weekly Variety Analysis + Replaceable Swap Suggestions
   ========================================================================== */
(function() {
    const PREFS_KEY = 'pegasus_diet_variation_prefs_v1';
    const HISTORY_DAYS = 7;

    const POOLS = {
        fruit_rotation: ['Μήλο', 'Πορτοκάλι', 'Ακτινίδιο', 'Αχλάδι', 'Μανταρίνι', 'Φράουλες', 'Σταφύλι', 'Ροδάκινο'],
        legumes_boost: ['Φακές', 'Ρεβύθια', 'Γίγαντες', 'Φασολάδα', 'Σαλάτα με όσπρια', 'Μαυρομάτικα'],
        greens_boost: ['Χόρτα', 'Πράσινη σαλάτα', 'Σπανάκι', 'Ρόκα / μαρούλι', 'Μπρόκολο', 'Φασολάκια'],
        fish_boost: ['Σουπιές με σπανάκι', 'Σολομός', 'Γαρίδες', 'Μπακαλιάρος', 'Τόνος', 'Πέρκα'],
        dinner_variation: ['Γιαούρτι + φρούτο', 'Γιαούρτι χωρίς whey', 'Cottage + φρούτο', '2 αυγά + σαλάτα', 'Τοστ ολικής + γαλοπούλα', 'Κεφίρ + φρούτο'],
        breakfast_variation: ['Μήλο + γιαούρτι', 'Πορτοκάλι + whey', 'Τοστ ολικής', 'Βρώμη + γιαούρτι', '2 αυγά αντί 3', 'Αχλάδι + γιαούρτι']
    };

    function getLang() {
        try {
            return window.PegasusI18n?.getLanguage?.() || localStorage.getItem('pegasus_language') || localStorage.getItem('pegasus_lang') || 'gr';
        } catch (_) {
            return 'gr';
        }
    }

    function isEn() { return getLang() === 'en'; }
    function t(gr, en) { return isEn() ? en : gr; }

    function normalizeText(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    function normalizeKey(value) {
        return normalizeText(value)
            .replace(/\([^)]*\)/g, ' ')
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function pad2(n) { return String(n).padStart(2, '0'); }
    function formatDate(d) { return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`; }

    function getFoodLogByDate(dateStr) {
        const prefix = window.PegasusManifest?.nutrition?.log_prefix || 'food_log_';
        try {
            const parsed = JSON.parse(localStorage.getItem(prefix + dateStr) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (_) {
            return [];
        }
    }

    function getRecentHistory(days) {
        const out = [];
        for (let i = 0; i < days; i++) {
            const d = new Date();
            d.setHours(12, 0, 0, 0);
            d.setDate(d.getDate() - i);
            out.push({
                dateStr: formatDate(d),
                log: getFoodLogByDate(formatDate(d))
            });
        }
        return out;
    }

    function classifyFood(name, type) {
        if (window.PegasusDietAdvisor?.classifyFood) {
            return window.PegasusDietAdvisor.classifyFood(name, type);
        }
        return { categories: [] };
    }

    function readPrefs() {
        try {
            const parsed = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (_) {
            return {};
        }
    }

    function writePrefs(prefs) {
        try {
            localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
            return true;
        } catch (_) {
            return false;
        }
    }

    function getTopicPrefs(topicKey) {
        const prefs = readPrefs();
        prefs.rejectedByTopic = prefs.rejectedByTopic || {};
        prefs.acceptedByTopic = prefs.acceptedByTopic || {};
        return {
            prefs,
            rejected: Array.isArray(prefs.rejectedByTopic[topicKey]) ? prefs.rejectedByTopic[topicKey] : [],
            accepted: Array.isArray(prefs.acceptedByTopic[topicKey]) ? prefs.acceptedByTopic[topicKey] : []
        };
    }

    function updateTopicPreference(topicKey, optionName, mode) {
        const { prefs, rejected, accepted } = getTopicPrefs(topicKey);
        const normalized = normalizeKey(optionName);
        prefs.rejectedByTopic[topicKey] = rejected.filter(v => v !== normalized);
        prefs.acceptedByTopic[topicKey] = accepted.filter(v => v !== normalized);

        if (mode === 'reject') prefs.rejectedByTopic[topicKey].push(normalized);
        if (mode === 'accept') prefs.acceptedByTopic[topicKey].push(normalized);

        prefs.rejectedByTopic[topicKey] = Array.from(new Set(prefs.rejectedByTopic[topicKey]));
        prefs.acceptedByTopic[topicKey] = Array.from(new Set(prefs.acceptedByTopic[topicKey]));
        writePrefs(prefs);
    }

    function countFoods(history) {
        const counts = {};
        const categoryDayCoverage = { greens: 0, legumes: 0, fish: 0, fruit: 0 };
        history.forEach(day => {
            const dayHit = { greens: false, legumes: false, fish: false, fruit: false };
            (day.log || []).forEach(item => {
                const name = String(item?.name || item?.n || '').trim();
                if (!name) return;
                const key = normalizeKey(name);
                counts[key] = counts[key] || { name, count: 0, categories: [], type: item?.t || item?.type || '' };
                counts[key].count += 1;
                const cls = classifyFood(name, item?.t || item?.type || '');
                counts[key].categories = Array.isArray(cls?.categories) ? cls.categories : [];
                counts[key].categories.forEach(cat => {
                    if (cat in dayHit) dayHit[cat] = true;
                });
            });
            Object.keys(dayHit).forEach(key => {
                if (dayHit[key]) categoryDayCoverage[key] += 1;
            });
        });
        return { counts, categoryDayCoverage };
    }

    function pickOptions(topicKey, pool, maxCount) {
        const { rejected, accepted } = getTopicPrefs(topicKey);
        const rejectedSet = new Set(rejected);
        const acceptedSet = new Set(accepted);

        const preferred = pool.filter(name => acceptedSet.has(normalizeKey(name)));
        const neutral = pool.filter(name => !acceptedSet.has(normalizeKey(name)) && !rejectedSet.has(normalizeKey(name)));

        return preferred.concat(neutral).slice(0, maxCount).map(name => ({
            name,
            state: acceptedSet.has(normalizeKey(name)) ? 'accepted' : 'candidate'
        }));
    }

    function buildPlan(topicKey, title, reason, poolKey, severity) {
        return {
            topicKey,
            title,
            reason,
            severity,
            options: pickOptions(topicKey, POOLS[poolKey] || [], 5)
        };
    }

    function analyzeWeeklyVariation() {
        const history = getRecentHistory(HISTORY_DAYS);
        const { counts, categoryDayCoverage } = countFoods(history);
        const entries = Object.values(counts).sort((a, b) => b.count - a.count);

        const overusedFoods = entries
            .filter(entry => entry.count >= 4)
            .filter(entry => !normalizeKey(entry.name).includes('ρουτινα'))
            .slice(0, 5)
            .map(entry => ({
                name: entry.name,
                count: entry.count,
                categories: entry.categories || []
            }));

        const missingCategories = [];
        if ((categoryDayCoverage.greens || 0) <= 1) missingCategories.push({ key: 'greens', label: t('χόρτα / πράσινα', 'greens') });
        if ((categoryDayCoverage.legumes || 0) === 0) missingCategories.push({ key: 'legumes', label: t('όσπρια', 'legumes') });
        if ((categoryDayCoverage.fish || 0) === 0) missingCategories.push({ key: 'fish', label: t('ψάρι / θαλασσινά', 'fish / seafood') });

        const bananaEntry = entries.find(entry => normalizeKey(entry.name).includes('μπαναν'));
        const yogurtWheyPattern = entries.filter(entry => {
            const key = normalizeKey(entry.name);
            return key.includes('γιαουρτ') || key.includes('whey') || key.includes('πρωτειν');
        }).reduce((acc, entry) => acc + entry.count, 0);
        const eggsEntry = entries.find(entry => normalizeKey(entry.name).includes('αυγ'));

        const variationPlans = [];

        if (bananaEntry && bananaEntry.count >= 4) {
            variationPlans.push(buildPlan(
                'fruit_rotation',
                t('Αλλαγή φρούτου', 'Fruit rotation'),
                t(`Η μπανάνα παίζει ${bananaEntry.count}/7 μέρες. Την επόμενη εβδομάδα σπάσ’ τη με άλλα φρούτα.`, `Banana appears ${bananaEntry.count}/7 days. Break it up next week with other fruits.`),
                'fruit_rotation',
                'orange'
            ));
        }

        if (yogurtWheyPattern >= 6) {
            variationPlans.push(buildPlan(
                'dinner_variation',
                t('Αλλαγή βραδινού', 'Dinner variation'),
                t(`Το βραδινό μοτίβο γιαούρτι / whey παίζει πολύ συχνά (${yogurtWheyPattern} εμφανίσεις).`, `The yogurt / whey dinner pattern appears very often (${yogurtWheyPattern} hits).`),
                'dinner_variation',
                'orange'
            ));
        }

        if (eggsEntry && eggsEntry.count >= 5) {
            variationPlans.push(buildPlan(
                'breakfast_variation',
                t('Αλλαγή πρωινού', 'Breakfast variation'),
                t(`Τα αυγά παίζουν ${eggsEntry.count}/7 μέρες. Κράτα τον κορμό, αλλά άλλαξε 1–2 πρωινά.`, `Eggs appear ${eggsEntry.count}/7 days. Keep the core, but rotate 1–2 breakfasts.`),
                'breakfast_variation',
                'orange'
            ));
        }

        if (missingCategories.some(x => x.key == 'legumes')) {
            variationPlans.push(buildPlan(
                'legumes_boost',
                t('Πρόσθεσε όσπρια', 'Add legumes'),
                t('Τα όσπρια λείπουν από τις τελευταίες 7 μέρες.', 'Legumes are missing from the last 7 days.'),
                'legumes_boost',
                'green'
            ));
        }

        if (missingCategories.some(x => x.key == 'greens')) {
            variationPlans.push(buildPlan(
                'greens_boost',
                t('Πρόσθεσε χόρτα / πράσινα', 'Add greens'),
                t('Τα χόρτα / πράσινα είναι χαμηλά την τελευταία εβδομάδα.', 'Greens are low over the last week.'),
                'greens_boost',
                'green'
            ));
        }

        if (missingCategories.some(x => x.key == 'fish')) {
            variationPlans.push(buildPlan(
                'fish_boost',
                t('Πρόσθεσε ψάρι', 'Add fish'),
                t('Δεν φαίνεται ψάρι / θαλασσινά στο πρόσφατο ιστορικό.', 'Fish / seafood does not appear in recent history.'),
                'fish_boost',
                'green'
            ));
        }

        return {
            historyDays: HISTORY_DAYS,
            overusedFoods,
            missingCategories,
            variationPlans: variationPlans.slice(0, 4)
        };
    }

    window.PegasusDietVariationEngine = {
        analyzeWeeklyVariation,
        getTopicPrefs,
        updateTopicPreference,
        normalizeKey
    };
})();
