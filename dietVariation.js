
/* ==========================================================================
   PEGASUS DIET VARIATION ENGINE - v3.2
   Protocol: Family Registry + Kouki Rotation + Supermarket Replacements
   ========================================================================== */
(function() {
    const PREFS_KEY = 'pegasus_diet_variation_prefs_v3';
    const HISTORY_DAYS = 7;

    function getLang() {
        try {
            return window.PegasusI18n?.getLanguage?.() || localStorage.getItem('pegasus_language') || localStorage.getItem('pegasus_lang') || 'gr';
        } catch (_) {
            return 'gr';
        }
    }
    function isEn() { return getLang() === 'en'; }
    function t(gr, en) { return isEn() ? en : gr; }
    function normalizeKey(v) { return window.PegasusFoodRegistry?.normalize ? window.PegasusFoodRegistry.normalize(v) : String(v || '').toLowerCase().trim(); }
    function familyLabel(key) { return window.PegasusFoodRegistry?.familyLabel?.(key) || key; }
    function slotMeta(slotKey) { return window.PegasusSlotRegistry?.get?.(slotKey) || null; }
    function slotLabel(slotKey) { return slotMeta(slotKey)?.label || slotKey; }
    function slotEnvironment(slotKey) { return slotMeta(slotKey)?.environment || 'home'; }
    function slotCandidatePool(slotKey) { return slotMeta(slotKey)?.candidatePool || null; }
    function slotDefaultFamily(slotKey) { return slotMeta(slotKey)?.defaultFamily || null; }
    function pad2(n) { return String(n).padStart(2, '0'); }
    function formatDate(d) { return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`; }

    function getFoodLogByDate(dateStr) {
        const prefix = window.PegasusManifest?.nutrition?.log_prefix || 'food_log_';
        try {
            const parsed = JSON.parse(localStorage.getItem(prefix + dateStr) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (_) { return []; }
    }

    function getRecentHistory(days) {
        const out = [];
        for (let i = 0; i < days; i++) {
            const d = new Date();
            d.setHours(12, 0, 0, 0);
            d.setDate(d.getDate() - i);
            out.push({ dateStr: formatDate(d), log: getFoodLogByDate(formatDate(d)) });
        }
        return out;
    }

    function classifyFood(name, type) {
        if (window.PegasusDietAdvisor?.classifyFood) {
            return window.PegasusDietAdvisor.classifyFood(name, type);
        }
        return { categories: [] };
    }

    function macrosFor(name, type, fallbackProtein, fallbackKcal) {
        if (typeof window.getPegasusMacros === 'function') {
            const m = window.getPegasusMacros(name, type);
            return {
                kcal: parseFloat(m?.kcal || fallbackKcal || 0) || 0,
                protein: parseFloat(m?.protein || fallbackProtein || 0) || 0
            };
        }
        return { kcal: fallbackKcal || 0, protein: fallbackProtein || 0 };
    }

    function readPrefs() {
        try { const parsed = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); return parsed && typeof parsed === 'object' ? parsed : {}; }
        catch (_) { return {}; }
    }
    function writePrefs(prefs) { try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); return true; } catch (_) { return false; } }
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

    function getTodayDayKey() {
        const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return daysMap[new Date().getDay()];
    }

    function getTodayKoukiCandidates() {
        const dayKey = getTodayDayKey();
        const menu = window.KOUKI_MASTER_MENU?.[dayKey] || [];
        const seen = new Set();
        return menu.map(item => {
            const name = String(item?.name || item?.n || '').trim();
            const type = item?.t || item?.type || '';
            const macros = macrosFor(name, type, item?.protein, item?.kcal);
            const cls = classifyFood(name, type);
            return { name, type, kcal: macros.kcal, protein: macros.protein, categories: Array.isArray(cls?.categories) ? cls.categories : [] };
        }).filter(item => {
            const key = normalizeKey(item.name);
            if (!key || seen.has(key)) return false;
            seen.add(key); return true;
        });
    }

    function inferSlotByFamily(familyKey) {
        switch (familyKey) {
            case 'fruit': return 'fruit_slot';
            case 'eggs': return 'breakfast_main';
            case 'toast_bread': return 'work_meal';
            case 'whey': return 'breakfast_protein';
            case 'yogurt': return 'night_meal';
            case 'legumes':
            case 'greens':
            case 'veg_meals':
            case 'fish_seafood':
            case 'meat_main': return 'kouki_main';
            default: return 'other';
        }
    }

    function countHistory(history) {
        const familyDays = {};
        const itemDays = {};
        const categoryCoverage = { greens: 0, legumes: 0, fish: 0 };
        const familyMeta = {};
        history.forEach(day => {
            const dayFamilies = new Set();
            const dayItems = new Set();
            const dayHit = { greens: false, legumes: false, fish: false };
            (day.log || []).forEach(item => {
                const name = String(item?.name || item?.n || '').trim();
                const type = item?.t || item?.type || '';
                if (!name) return;
                const matched = window.PegasusFoodRegistry?.matchItem?.(name);
                const family = matched?.family || 'other';
                const slot = inferSlotByFamily(family);
                const macros = macrosFor(name, type, matched?.protein, matched?.kcal);
                const cls = classifyFood(name, type);
                familyMeta[family] = familyMeta[family] || { family, label: familyLabel(family), protein: macros.protein, kcal: macros.kcal, slot, example: name };
                dayFamilies.add(family);
                dayItems.add(normalizeKey(name));
                (cls.categories || []).forEach(cat => { if (cat in dayHit) dayHit[cat] = true; });
            });
            dayFamilies.forEach(family => { familyDays[family] = (familyDays[family] || 0) + 1; });
            dayItems.forEach(itemKey => { itemDays[itemKey] = (itemDays[itemKey] || 0) + 1; });
            Object.keys(dayHit).forEach(cat => { if (dayHit[cat]) categoryCoverage[cat] += 1; });
        });
        return { familyDays, itemDays, categoryCoverage, familyMeta };
    }

    function getRemainingProteinNeed() {
        const target = parseFloat(window.PegasusBridgeHub?.getNutritionContext?.()?.targetProtein || localStorage.getItem('pegasus_goal_protein') || 160) || 160;
        const consumed = parseFloat(window.PegasusBridgeHub?.getNutritionContext?.()?.protein || localStorage.getItem('pegasus_today_protein_consumed') || 0) || 0;
        return Math.max(0, target - consumed);
    }

    function proteinBandLabel(candidateProtein, targetProtein) {
        const diff = Math.abs((candidateProtein || 0) - (targetProtein || 0));
        if (diff <= 5) return t('παρόμοια πρωτεΐνη', 'similar protein');
        if (diff <= 10) return t('λίγο διαφορετική πρωτεΐνη', 'slightly different protein');
        return t('αρκετά διαφορετική πρωτεΐνη', 'more different protein');
    }

    function rankRegistryOptions(slotKey, baseProtein, sourceFamily, environment) {
        const topicKey = `${slotKey}_variation`;
        const { rejected, accepted } = getTopicPrefs(topicKey);
        const rej = new Set(rejected);
        const acc = new Set(accepted);
        const dayMode = window.PegasusFoodRegistry?.getDayMode?.() || 'training';
        const poolKey = slotCandidatePool(slotKey) || slotKey;
        const env = environment || slotEnvironment(slotKey);
        return (window.PegasusFoodRegistry?.getCandidates?.(poolKey, baseProtein, { targetFamily: sourceFamily, environment: env, dayMode }) || [])
            .filter(opt => !rej.has(normalizeKey(opt.name)))
            .map(opt => ({
                ...opt,
                state: acc.has(normalizeKey(opt.name)) ? 'accepted' : 'candidate',
                note: t(`~${Math.round(opt.protein || 0)}g πρωτεΐνη • ${proteinBandLabel(opt.protein, baseProtein)} • ${opt.budget === 'budget' ? 'οικονομική' : 'οκ κόστος'} • ${env === 'work' ? 'κατάλληλο για δουλειά' : 'για σπίτι'}`,
                        `~${Math.round(opt.protein || 0)}g protein • ${proteinBandLabel(opt.protein, baseProtein)} • ${opt.budget === 'budget' ? 'budget' : 'standard'} • ${env === 'work' ? 'work-safe' : 'home-safe'}`)
            }))
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 5);
    }

    function rankKoukiOptions(baseProtein, categoryCoverage) {
        const topicKey = 'kouki_rotation';
        const { rejected, accepted } = getTopicPrefs(topicKey);
        const rej = new Set(rejected);
        const acc = new Set(accepted);
        const remainingProtein = getRemainingProteinNeed();
        return getTodayKoukiCandidates()
            .filter(opt => !rej.has(normalizeKey(opt.name)))
            .map(opt => {
                let score = 100;
                score -= Math.abs((opt.protein || 0) - (baseProtein || 0)) * 1.6;
                if ((opt.protein || 0) >= 25) score += 18;
                if ((opt.protein || 0) >= remainingProtein) score += 10;
                if ((categoryCoverage.greens || 0) <= 1 && opt.categories.includes('greens')) score += 22;
                if ((categoryCoverage.legumes || 0) === 0 && opt.categories.includes('legumes')) score += 20;
                if ((categoryCoverage.fish || 0) === 0 && opt.categories.includes('fish')) score += 18;
                if (acc.has(normalizeKey(opt.name))) score += 8;
                return {
                    ...opt,
                    state: acc.has(normalizeKey(opt.name)) ? 'accepted' : 'candidate',
                    score,
                    note: t(`~${Math.round(opt.protein || 0)}g πρωτεΐνη • ${proteinBandLabel(opt.protein, baseProtein)} • από το Κούκι`, `~${Math.round(opt.protein || 0)}g protein • ${proteinBandLabel(opt.protein, baseProtein)} • from Kouki`)
                };
            })
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 5);
    }

    function buildPlan(topicKey, title, reason, options, severity) {
        return { topicKey, title, reason, options, severity };
    }

    function analyzeWeeklyVariation() {
        const history = getRecentHistory(HISTORY_DAYS);
        const { familyDays, itemDays, categoryCoverage, familyMeta } = countHistory(history);
        const overusedFoods = Object.entries(familyDays)
            .filter(([family, days]) => days >= 4 && family !== 'other')
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([family, days]) => ({ family, name: familyLabel(family), count: days, slot: familyMeta[family]?.slot || 'other', protein: Math.round(familyMeta[family]?.protein || 0) }));

        const missingCategories = [];
        if ((categoryCoverage.greens || 0) <= 1) missingCategories.push({ key: 'greens', label: t('χόρτα / πράσινα', 'greens') });
        if ((categoryCoverage.legumes || 0) === 0) missingCategories.push({ key: 'legumes', label: t('όσπρια', 'legumes') });
        if ((categoryCoverage.fish || 0) === 0) missingCategories.push({ key: 'fish', label: t('ψάρι / θαλασσινά', 'fish / seafood') });

        const bananaDays = Object.entries(itemDays).filter(([k]) => k.includes('μπανανα')).reduce((m, [,v]) => Math.max(m,v), 0);
        const eggsDays = familyDays.eggs || 0;
        const wheyDays = familyDays.whey || 0;
        const toastDays = familyDays.toast_bread || 0;
        const yogurtDays = familyDays.yogurt || 0;

        const variationPlans = [];

        const koukiBaseProtein = Math.max(24, getRemainingProteinNeed() || 24);
        variationPlans.push(buildPlan(
            'kouki_rotation',
            `Slot 5 · ${slotLabel('kouki_main')}`,
            t('Το απογευματινό μένει πάντα από το Κούκι. Κάνε κύκλο σε πιάτα που σε κρατούν κοντά στην πρωτεΐνη και καλύπτουν ό,τι λείπει μέσα στην εβδομάδα.', 'Your afternoon meal stays Kouki-first. Rotate through dishes that keep you close to protein and cover what has been missing this week.'),
            rankKoukiOptions(koukiBaseProtein, categoryCoverage),
            'green'
        ));

        if (bananaDays >= 4) {
            variationPlans.push(buildPlan(
                'fruit_variation',
                `Slot 4 · ${slotLabel('fruit_slot')}`,
                t(`Η μπανάνα παίζει ${bananaDays}/7 μέρες. Σπάσ’ την με άλλα φρούτα από σούπερ μάρκετ.`, `Banana appears ${bananaDays}/7 days. Break it up with other supermarket fruits.`),
                rankRegistryOptions('fruit_slot', 1, 'fruit', 'work'),
                'orange'
            ));
        }
        if (toastDays >= 4) {
            variationPlans.push(buildPlan(
                'workmeal_variation',
                `Slot 3 · ${slotLabel('work_meal')}`,
                t(`Τα τοστ παίζουν ${toastDays}/7 μέρες. Οι αλλαγές είναι low-odor, εύκολες και κοντά στην πρωτεΐνη σου.`, `Toasts appear ${toastDays}/7 days. Swaps stay low-odor, easy, and close to your protein target.`),
                rankRegistryOptions('work_meal', familyMeta.toast_bread?.protein || 22, 'toast_bread', 'work'),
                'orange'
            ));
        }
        if (eggsDays >= 5) {
            variationPlans.push(buildPlan(
                'breakfast_variation',
                `Slot 1 · ${slotLabel('breakfast_main')}`,
                t(`Τα αυγά παίζουν ${eggsDays}/7 μέρες. Αντί για άλλη εκδοχή αυγών, δες τι άλλη κατηγορία μπορείς να αγοράσεις από σούπερ μάρκετ για το πρωινό βάσης.`, `Eggs appear ${eggsDays}/7 days. Instead of another egg variant, see what else you can buy from the supermarket for your main breakfast slot.`),
                rankRegistryOptions('breakfast_main', familyMeta.eggs?.protein || 19, 'eggs', 'home'),
                'orange'
            ));
        }
        if (wheyDays >= 5) {
            variationPlans.push(buildPlan(
                'breakfast_protein_variation',
                `Slot 2 · ${slotLabel('breakfast_protein')}`,
                t(`Το protein slot παίζει πολύ συχνά με whey (${wheyDays}/7). Εδώ ψάχνουμε γρήγορες πρωτεϊνικές λύσεις από άλλη οικογένεια.`, `The protein slot uses whey very often (${wheyDays}/7). Here we look for quick protein options from a different family.`),
                rankRegistryOptions('breakfast_protein', familyMeta.whey?.protein || 24, 'whey', 'home'),
                'orange'
            ));
        }
        if (yogurtDays >= 5) {
            variationPlans.push(buildPlan(
                'dinner_variation',
                `Slot 6 · ${slotLabel('night_meal')}`,
                t(`Το γιαούρτι παίζει ${yogurtDays}/7 μέρες. Οι αλλαγές κρατούν την πρωτεΐνη σχετικά κοντά, αλλά δεν μένουν στην ίδια κατηγορία γιαουρτιού.`, `Yogurt appears ${yogurtDays}/7 days. Swaps keep protein fairly close, but do not stay inside the same yogurt family.`),
                rankRegistryOptions('night_meal', familyMeta.yogurt?.protein || 20, 'yogurt', 'home'),
                'orange'
            ));
        }
        if (missingCategories.some(x => x.key === 'legumes')) {
            variationPlans.push(buildPlan(
                'revythi_variation',
                `Slot 5 · ${t('Ρεβύθι σαν fallback', 'Revythi fallback')}`,
                t('Αν λείπουν όσπρια μέσα στην εβδομάδα, χρησιμοποίησε ρεβύθι σαν εύκολη και οικονομική λύση στο σπίτι.', 'If legumes are missing this week, use revythi as an easy and affordable at-home fallback.'),
                [{ name: 'Ρεβύθι', family: 'legumes', protein: 18, kcal: 420, budget: 'budget', ease: 4, state: 'candidate', note: t('~18g πρωτεΐνη • οικονομική λύση όσπριου για το σπίτι', '~18g protein • affordable legume fallback for home') }],
                'green'
            ));
        }

        const slotPlans = [
            { slot: 'breakfast_main', label: slotLabel('breakfast_main'), defaultFamily: slotDefaultFamily('breakfast_main'), repeatedDays: eggsDays },
            { slot: 'breakfast_protein', label: slotLabel('breakfast_protein'), defaultFamily: slotDefaultFamily('breakfast_protein'), repeatedDays: wheyDays },
            { slot: 'work_meal', label: slotLabel('work_meal'), defaultFamily: slotDefaultFamily('work_meal'), repeatedDays: toastDays },
            { slot: 'fruit_slot', label: slotLabel('fruit_slot'), defaultFamily: slotDefaultFamily('fruit_slot'), repeatedDays: bananaDays },
            { slot: 'kouki_main', label: slotLabel('kouki_main'), defaultFamily: slotDefaultFamily('kouki_main'), repeatedDays: 1 },
            { slot: 'night_meal', label: slotLabel('night_meal'), defaultFamily: slotDefaultFamily('night_meal'), repeatedDays: yogurtDays }
        ];

        return {
            historyDays: HISTORY_DAYS,
            overusedFoods,
            missingCategories,
            familyRegistryCount: Object.keys(window.PegasusFoodRegistry?.families || {}).length,
            slotRegistryCount: window.PegasusSlotRegistry?.count?.() || 0,
            slotPlans,
            variationPlans: variationPlans.slice(0, 6)
        };
    }

    window.PegasusDietVariationEngine = {
        analyzeWeeklyVariation,
        getTopicPrefs,
        updateTopicPreference,
        normalizeKey
    };
})();
