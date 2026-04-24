
/* ==========================================================================
   PEGASUS DIET VARIATION ENGINE - v2.0
   Protocol: Weekly Meal-Slot Rotation + Kouki-First Suggestions
   ========================================================================== */
(function() {
    const PREFS_KEY = 'pegasus_diet_variation_prefs_v2';
    const HISTORY_DAYS = 7;

    const EASY_SWAP_POOLS = {
        fruit_rotation: [
            { name: 'Μήλο', protein: 0, kcal: 80, budget: 'budget', ease: 5 },
            { name: 'Πορτοκάλι', protein: 1, kcal: 70, budget: 'budget', ease: 5 },
            { name: 'Αχλάδι', protein: 1, kcal: 95, budget: 'budget', ease: 4 },
            { name: 'Μανταρίνι', protein: 1, kcal: 55, budget: 'budget', ease: 5 },
            { name: 'Ακτινίδιο', protein: 1, kcal: 60, budget: 'standard', ease: 4 },
            { name: 'Σταφύλι', protein: 1, kcal: 90, budget: 'standard', ease: 4 },
            { name: 'Ροδάκινο', protein: 1, kcal: 65, budget: 'budget', ease: 4 }
        ],
        breakfast_variation: [
            { name: '2 αυγά + γιαούρτι 2%', protein: 20, kcal: 220, budget: 'budget', ease: 5 },
            { name: 'Τοστ ολικής + γαλοπούλα', protein: 18, kcal: 260, budget: 'budget', ease: 5 },
            { name: 'Γιαούρτι 2% + whey', protein: 28, kcal: 250, budget: 'standard', ease: 4 },
            { name: '3 αυγά + 1 φρούτο', protein: 19, kcal: 290, budget: 'budget', ease: 5 },
            { name: '2 αυγά + τοστ ολικής', protein: 19, kcal: 250, budget: 'budget', ease: 5 }
        ],
        workmeal_variation: [
            { name: '2 τοστ ολικής με γαλοπούλα', protein: 24, kcal: 430, budget: 'budget', ease: 5 },
            { name: 'Τοστ ολικής + γιαούρτι 2%', protein: 22, kcal: 360, budget: 'budget', ease: 5 },
            { name: '2 τοστ ολικής με λιγότερο τυρί', protein: 22, kcal: 390, budget: 'budget', ease: 5 },
            { name: 'Τοστ ολικής + 2 αυγά βραστά', protein: 24, kcal: 370, budget: 'budget', ease: 4 },
            { name: 'Τοστ ολικής + κεφίρ', protein: 21, kcal: 340, budget: 'standard', ease: 4 }
        ],
        dinner_variation: [
            { name: 'Γιαούρτι 2% + φρούτο', protein: 20, kcal: 250, budget: 'budget', ease: 5 },
            { name: 'Γιαούρτι 2% + μέλι χωρίς whey', protein: 16, kcal: 240, budget: 'budget', ease: 5 },
            { name: 'Τοστ ολικής + γαλοπούλα', protein: 18, kcal: 260, budget: 'budget', ease: 5 },
            { name: '2 αυγά + σαλάτα', protein: 14, kcal: 200, budget: 'budget', ease: 4 },
            { name: 'Γιαούρτι 2% + αμύγδαλα', protein: 21, kcal: 310, budget: 'budget', ease: 5 }
        ],
        revythi_fallback: [
            { name: 'Ρεβύθι', protein: 18, kcal: 420, budget: 'budget', ease: 4 },
            { name: 'Ρεβύθι + σαλάτα', protein: 20, kcal: 470, budget: 'budget', ease: 4 },
            { name: 'Ρεβύθι αντί για ίδιο Κούκι κρέας', protein: 18, kcal: 420, budget: 'budget', ease: 4 }
        ]
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
            const kcal = parseFloat(m?.kcal);
            const protein = parseFloat(m?.protein);
            return {
                kcal: isNaN(kcal) ? (fallbackKcal || 0) : kcal,
                protein: isNaN(protein) ? (fallbackProtein || 0) : protein
            };
        }
        return { kcal: fallbackKcal || 0, protein: fallbackProtein || 0 };
    }

    function getTodayDayKey() {
        const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return daysMap[new Date().getDay()];
    }

    function getKoukiMenuSet() {
        const set = new Set();
        const master = window.KOUKI_MASTER_MENU || {};
        Object.values(master).forEach(list => {
            (list || []).forEach(item => {
                const name = String(item?.name || item?.n || '').trim();
                if (name) set.add(normalizeKey(name));
            });
        });
        (window.KOUKI_MASTER || []).forEach(item => {
            const name = String(item?.name || item?.n || '').trim();
            if (name) set.add(normalizeKey(name));
        });
        return set;
    }

    function getTodayKoukiCandidates() {
        const dayKey = getTodayDayKey();
        const items = (window.KOUKI_MASTER_MENU?.[dayKey] || []).map(item => {
            const name = String(item?.name || item?.n || '').trim();
            const type = item?.t || item?.type || '';
            const macros = macrosFor(name, type, item?.protein, item?.kcal);
            const cls = classifyFood(name, type);
            return {
                name,
                type,
                kcal: macros.kcal,
                protein: macros.protein,
                categories: Array.isArray(cls?.categories) ? cls.categories : []
            };
        });
        const seen = new Set();
        return items.filter(item => {
            const key = normalizeKey(item.name);
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    function inferSlot(name, categories) {
        const key = normalizeKey(name);
        if (key.includes('μπαναν')) return 'fruit_rotation';
        if (key.includes('αυγ')) return 'breakfast_variation';
        if (key.includes('τοστ')) return 'workmeal_variation';
        if (key.includes('γιαουρτ') || key.includes('whey') || key.includes('πρωτειν')) return 'dinner_variation';
        if (categories?.includes('legumes')) return 'legume_like';
        if (categories?.includes('fish')) return 'fish_like';
        return 'other';
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

    function countHistory(history) {
        const koukiSet = getKoukiMenuSet();
        const counts = {};
        const slotCounts = {
            fruit_rotation: 0,
            breakfast_variation: 0,
            workmeal_variation: 0,
            dinner_variation: 0,
            kouki_main: 0
        };
        const categoryCoverage = { greens: 0, legumes: 0, fish: 0 };
        history.forEach(day => {
            const dayHit = { greens: false, legumes: false, fish: false };
            (day.log || []).forEach(item => {
                const name = String(item?.name || item?.n || '').trim();
                const type = item?.t || item?.type || '';
                if (!name) return;
                const key = normalizeKey(name);
                const cls = classifyFood(name, type);
                const macros = macrosFor(name, type, item?.protein, item?.kcal);
                const slot = inferSlot(name, cls?.categories || []);
                const isKouki = key.includes('κουκι') || koukiSet.has(key);

                if (!counts[key]) {
                    counts[key] = {
                        name,
                        count: 0,
                        slot,
                        isKouki,
                        categories: Array.isArray(cls?.categories) ? cls.categories : [],
                        protein: macros.protein,
                        kcal: macros.kcal
                    };
                }
                counts[key].count += 1;

                if (slot in slotCounts) slotCounts[slot] += 1;
                if (isKouki) slotCounts.kouki_main += 1;

                counts[key].categories.forEach(cat => {
                    if (cat in dayHit) dayHit[cat] = true;
                });
            });
            Object.keys(dayHit).forEach(cat => {
                if (dayHit[cat]) categoryCoverage[cat] += 1;
            });
        });
        return { counts, slotCounts, categoryCoverage };
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
        return t('πιο χαμηλή / υψηλή πρωτεΐνη', 'more different protein');
    }

    function rankStaticOptions(topicKey, baseProtein) {
        const { rejected, accepted } = getTopicPrefs(topicKey);
        const rej = new Set(rejected);
        const acc = new Set(accepted);

        return (EASY_SWAP_POOLS[topicKey] || [])
            .filter(opt => !rej.has(normalizeKey(opt.name)))
            .map(opt => {
                const proteinDiff = Math.abs((opt.protein || 0) - (baseProtein || 0));
                const score =
                    (acc.has(normalizeKey(opt.name)) ? 20 : 0) +
                    (opt.budget === 'budget' ? 12 : 6) +
                    (opt.ease || 0) * 3 -
                    proteinDiff;
                return {
                    ...opt,
                    state: acc.has(normalizeKey(opt.name)) ? 'accepted' : 'candidate',
                    score,
                    note: t(`~${opt.protein}g πρωτεΐνη • ${proteinBandLabel(opt.protein, baseProtein)} • εύκολη / οικονομική`, `~${opt.protein}g protein • ${proteinBandLabel(opt.protein, baseProtein)} • easy / affordable`)
                };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
    }

    function rankKoukiOptions(baseProtein, categoryCoverage) {
        const topicKey = 'kouki_rotation';
        const { rejected, accepted } = getTopicPrefs(topicKey);
        const rej = new Set(rejected);
        const acc = new Set(accepted);
        const todayMenu = getTodayKoukiCandidates();

        return todayMenu
            .filter(opt => !rej.has(normalizeKey(opt.name)))
            .map(opt => {
                let score = 0;
                const proteinDiff = Math.abs((opt.protein || 0) - (baseProtein || 0));
                score -= proteinDiff * 0.8;
                if ((opt.protein || 0) >= 25) score += 14;
                if ((opt.protein || 0) >= getRemainingProteinNeed()) score += 8;
                if ((categoryCoverage.greens || 0) <= 1 && opt.categories.includes('greens')) score += 20;
                if ((categoryCoverage.legumes || 0) === 0 && opt.categories.includes('legumes')) score += 18;
                if ((categoryCoverage.fish || 0) === 0 && opt.categories.includes('fish')) score += 16;
                if (acc.has(normalizeKey(opt.name))) score += 10;
                score += opt.categories.includes('veg') ? 6 : 0;

                return {
                    ...opt,
                    state: acc.has(normalizeKey(opt.name)) ? 'accepted' : 'candidate',
                    score,
                    note: t(`~${Math.round(opt.protein || 0)}g πρωτεΐνη • ${proteinBandLabel(opt.protein, baseProtein)} • από το Κούκι`, `~${Math.round(opt.protein || 0)}g protein • ${proteinBandLabel(opt.protein, baseProtein)} • from Kouki`)
                };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
    }

    function buildPlan(topicKey, title, reason, options, severity) {
        return { topicKey, title, reason, options, severity };
    }

    function analyzeWeeklyVariation() {
        const history = getRecentHistory(HISTORY_DAYS);
        const { counts, categoryCoverage } = countHistory(history);
        const entries = Object.values(counts).sort((a, b) => b.count - a.count);

        const overusedFoods = entries
            .filter(entry => entry.count >= 4)
            .slice(0, 6)
            .map(entry => ({
                name: entry.name,
                count: entry.count,
                slot: entry.slot,
                isKouki: entry.isKouki,
                protein: Math.round(entry.protein || 0)
            }));

        const missingCategories = [];
        if ((categoryCoverage.greens || 0) <= 1) missingCategories.push({ key: 'greens', label: t('χόρτα / πράσινα', 'greens') });
        if ((categoryCoverage.legumes || 0) === 0) missingCategories.push({ key: 'legumes', label: t('όσπρια', 'legumes') });
        if ((categoryCoverage.fish || 0) === 0) missingCategories.push({ key: 'fish', label: t('ψάρι / θαλασσινά', 'fish / seafood') });

        const findMaxCount = matcher => entries.filter(matcher).sort((a, b) => b.count - a.count)[0] || null;

        const bananaEntry = findMaxCount(entry => entry.slot === 'fruit_rotation');
        const eggsEntry = findMaxCount(entry => entry.slot === 'breakfast_variation');
        const toastEntry = findMaxCount(entry => entry.slot === 'workmeal_variation');
        const yogurtEntry = findMaxCount(entry => entry.slot === 'dinner_variation');
        const koukiRepeat = findMaxCount(entry => entry.isKouki);

        const variationPlans = [];

        if (koukiRepeat) {
            variationPlans.push(buildPlan(
                'kouki_rotation',
                t('Κυκλική αλλαγή Κούκι', 'Kouki rotation'),
                t(`Το απογευματινό είναι πάντα από το Κούκι. Αντί να παίζεις το ίδιο, κάνε κύκλο στα πιάτα που σε κρατούν κοντά στην πρωτεΐνη στόχου.`, `Your afternoon meal is always from Kouki. Instead of repeating the same dish, rotate through dishes that keep you close to your protein target.`),
                rankKoukiOptions(koukiRepeat.protein || 28, categoryCoverage),
                'green'
            ));
        }

        if (bananaEntry && bananaEntry.count >= 4) {
            variationPlans.push(buildPlan(
                'fruit_rotation',
                t('Αλλαγή φρούτου', 'Fruit rotation'),
                t(`Η μπανάνα παίζει ${bananaEntry.count}/7 μέρες. Κράτα το φρούτο, αλλά σπάσ’ το κυκλικά την επόμενη εβδομάδα.`, `Banana appears ${bananaEntry.count}/7 days. Keep the fruit slot, but rotate it next week.`),
                rankStaticOptions('fruit_rotation', bananaEntry.protein || 1),
                'orange'
            ));
        }

        if (toastEntry && toastEntry.count >= 4) {
            variationPlans.push(buildPlan(
                'workmeal_variation',
                t('Αλλαγή τοστ στη δουλειά', 'Work meal variation'),
                t(`Τα 2 τοστ παίζουν πολύ συχνά (${toastEntry.count}/7). Οι αλλαγές μένουν εύκολες και κοντά στην πρωτεΐνη σου.`, `The 2 toasts appear very often (${toastEntry.count}/7). Swaps stay easy and close to your protein target.`),
                rankStaticOptions('workmeal_variation', toastEntry.protein || 24),
                'orange'
            ));
        }

        if (eggsEntry && eggsEntry.count >= 5) {
            variationPlans.push(buildPlan(
                'breakfast_variation',
                t('Αλλαγή πρωινού', 'Breakfast variation'),
                t(`Τα αυγά παίζουν ${eggsEntry.count}/7 μέρες. Κράτα το εύκολο πρωινό, αλλά άλλαξε 1–2 μέρες.`, `Eggs appear ${eggsEntry.count}/7 days. Keep breakfast easy, but rotate 1–2 days.`),
                rankStaticOptions('breakfast_variation', eggsEntry.protein || 18),
                'orange'
            ));
        }

        if (yogurtEntry && yogurtEntry.count >= 5) {
            variationPlans.push(buildPlan(
                'dinner_variation',
                t('Αλλαγή βραδινού', 'Dinner variation'),
                t(`Το γιαούρτι / whey παίζει πολύ συχνά (${yogurtEntry.count}/7). Οι αλλαγές κρατούν την πρωτεΐνη κοντά στον στόχο.`, `Yogurt / whey appears very often (${yogurtEntry.count}/7). Swaps keep protein close to target.`),
                rankStaticOptions('dinner_variation', yogurtEntry.protein || 24),
                'orange'
            ));
        }

        if (!variationPlans.some(p => p.topicKey === 'kouki_rotation') && missingCategories.some(x => x.key === 'legumes')) {
            variationPlans.push(buildPlan(
                'revythi_fallback',
                t('Ρεβύθι σαν fallback', 'Revythi fallback'),
                t('Αν λείπουν όσπρια και δεν σε καλύπτει το Κούκι, βάλε ρεβύθι μέσα στην εβδομάδα.', 'If legumes are missing and Kouki does not cover them, use revythi during the week.'),
                rankStaticOptions('revythi_fallback', 18),
                'green'
            ));
        }

        return {
            historyDays: HISTORY_DAYS,
            overusedFoods,
            missingCategories,
            variationPlans: variationPlans.slice(0, 5)
        };
    }

    window.PegasusDietVariationEngine = {
        analyzeWeeklyVariation,
        getTopicPrefs,
        updateTopicPreference,
        normalizeKey
    };
})();
