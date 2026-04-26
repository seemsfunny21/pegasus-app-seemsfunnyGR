/* ==========================================================================
   PEGASUS DIET ADVISOR - v2.0 (SHARED DESKTOP / MOBILE)
   Protocol: History-Based Deficit Analysis + Kouki Daily Recommendation Engine
   ========================================================================== */
(function() {
    var M = M || window.PegasusManifest;

    const HISTORY_WINDOWS = { short: 3, mid: 5, long: 7 };
    const CATEGORY_CONFIG = {
        greens:   { gr: 'χόρτα / πράσινα',          en: 'greens',                 min3: 1, min5: 2, min7: 3, priority: 5 },
        veg:      { gr: 'λαχανικά',                 en: 'vegetables',             min3: 1, min5: 3, min7: 4, priority: 4 },
        fruit:    { gr: 'φρούτα',                   en: 'fruit',                  min3: 1, min5: 3, min7: 4, priority: 3 },
        legumes:  { gr: 'όσπρια',                   en: 'legumes',                min3: 0, min5: 1, min7: 1, priority: 5 },
        fish:     { gr: 'ψάρι / θαλασσινά',         en: 'fish / seafood',         min3: 0, min5: 1, min7: 1, priority: 4 },
        fiber:    { gr: 'φυτικές ίνες / ποικιλία',  en: 'fiber / variety',        min3: 1, min5: 3, min7: 4, priority: 3 }
    };

    const KEYWORD_MAP = [
        { key: 'greens',  words: ['χορτ', 'σπανακ', 'μαρουλ', 'ροκα', 'λαχαν', 'σαλατ', 'μπαμι', 'φασολακι', 'χορτο', 'λαχανο', 'παπουτσακ'] },
        { key: 'veg',     words: ['λαχαν', 'σαλατ', 'γεμιστ', 'αρακα', 'μπαμι', 'φασολακι', 'παπουτσακ', 'σπανακ', 'κολοκυθ', 'μελιτζαν', 'πιπερ'] },
        { key: 'fruit',   words: ['μπαναν', 'μηλ', 'πορτοκαλ', 'αχλαδ', 'ακτιν', 'kiwi', 'φρουτ', 'μανταριν', 'ροδακιν', 'καρπουζ'] },
        { key: 'legumes', words: ['φασολαδ', 'γιγαντ', 'ρεβυθ', 'φακ', 'οσπρ'] },
        { key: 'fish',    words: ['μπακαλιαρ', 'σολομ', 'περκα', 'σουπι', 'γαριδ', 'ψαρ', 'θαλασ'] },
        { key: 'eggs',    words: ['αυγ'] },
        { key: 'whey',    words: ['whey', 'πρωτειν'] },
        { key: 'dairy',   words: ['γιαουρτ', 'γκουντα', 'τυρ', 'γαλα', 'κεφιρ'] },
        { key: 'nuts',    words: ['αμυγδαλ', 'καρυδ', 'φουντουκ', 'φιστικ'] },
        { key: 'poultry', words: ['κοτοπουλ', 'γαλοπουλ', 'σνιτσελ κοτοπουλο'] },
        { key: 'meat',    words: ['μοσχ', 'χοιριν', 'αρν', 'σουτζουκ', 'κεφτε', 'μπιφτεκ', 'κιμα', 'γιουβαρλ', 'μπριζολ'] },
        { key: 'fiber',   words: ['ολικ', 'βρωμη', 'βρωμ', 'αμυγδαλ', 'φασολ', 'ρεβυθ', 'φακ', 'φρουτ', 'σαλατ', 'λαχαν'] }
    ];

    function getLang() {
        try {
            return window.PegasusI18n?.getLanguage?.() || localStorage.getItem('pegasus_language') || localStorage.getItem('pegasus_lang') || 'gr';
        } catch (e) {
            return 'gr';
        }
    }

    function isEn() {
        return getLang() === 'en';
    }

    function t(gr, en) {
        return isEn() ? en : gr;
    }

    function normalizeText(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    function pad2(n) {
        return String(n).padStart(2, '0');
    }

    function getDateObjOffset(offsetDays) {
        const d = new Date();
        d.setHours(12, 0, 0, 0);
        d.setDate(d.getDate() - offsetDays);
        return d;
    }

    function formatStrictDate(d) {
        return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
    }

    function getDateStr() {
        if (typeof window.PegasusDiet?.getStrictDateStr === 'function') return window.PegasusDiet.getStrictDateStr();
        if (typeof window.getStrictDateStr === 'function') return window.getStrictDateStr();
        if (typeof window.getPegasusTodayDateStr === 'function') return window.getPegasusTodayDateStr();
        return formatStrictDate(new Date());
    }

    function getFoodLogByDate(dateStr) {
        const prefix = M?.nutrition?.log_prefix || M?.diet?.log_prefix || 'food_log_';
        try {
            const parsed = JSON.parse(localStorage.getItem(prefix + dateStr) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    function getRecentHistory(days) {
        const out = [];
        for (let i = 0; i < days; i++) {
            const d = getDateObjOffset(i);
            out.push({
                dateStr: formatStrictDate(d),
                log: getFoodLogByDate(formatStrictDate(d))
            });
        }
        return out;
    }

    function getTotals() {
        const log = getFoodLogByDate(getDateStr());
        return log.reduce((acc, item) => {
            acc.kcal += parseFloat(item?.kcal || 0) || 0;
            acc.protein += parseFloat(item?.protein || 0) || 0;
            return acc;
        }, { kcal: 0, protein: 0, log: log });
    }

    function getTargets() {
        let kcal = 2800;
        let protein = 160;

        try {
            const settings = typeof window.getPegasusSettings === 'function' ? window.getPegasusSettings() : null;
            if (settings?.goalKcal) kcal = parseFloat(settings.goalKcal) || kcal;
            if (settings?.goalProtein) protein = parseFloat(settings.goalProtein) || protein;
        } catch (e) {}

        if (typeof window.PegasusDiet?.getEffectiveTarget === 'function') {
            kcal = parseFloat(window.PegasusDiet.getEffectiveTarget()) || kcal;
        } else if (typeof window.getPegasusEffectiveDailyTarget === 'function') {
            kcal = parseFloat(window.getPegasusEffectiveDailyTarget()) || kcal;
        } else {
            kcal = parseFloat(
                localStorage.getItem(M?.diet?.effectiveTodayKcal || 'pegasus_effective_today_kcal') ||
                localStorage.getItem(M?.diet?.todayKcal || 'pegasus_today_kcal')
            ) || kcal;
        }

        return { kcal: Math.round(kcal), protein: Math.round(protein) };
    }

    function getTodayDayKey() {
        const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return daysMap[new Date().getDay()];
    }


    function getTodayDayLabel() {
        const labels = {
            Sunday: 'Κυριακή',
            Monday: 'Δευτέρα',
            Tuesday: 'Τρίτη',
            Wednesday: 'Τετάρτη',
            Thursday: 'Πέμπτη',
            Friday: 'Παρασκευή',
            Saturday: 'Σάββατο'
        };
        const key = getTodayDayKey();
        return isEn() ? key : (labels[key] || key);
    }

    function normalizeDishKey(value) {
        return normalizeText(value)
            .replace(/\([^)]*\)/g, ' ')
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    const FAMILY_STOPWORDS = new Set(['με', 'και', 'στο', 'στη', 'στην', 'στον', 'των', 'των', 'του', 'της', 'το', 'τα', 'την', 'τις', 'σε']);

    function getDishFamilyTokens(value) {
        return normalizeDishKey(value)
            .split(' ')
            .map(token => token.trim())
            .filter(token => token.length >= 4 && !FAMILY_STOPWORDS.has(token));
    }

    function getItemCounts(days) {
        const exactCounts = {};
        const familyCounts = {};
        getRecentHistory(days).forEach(day => {
            (day.log || []).forEach(item => {
                const key = normalizeDishKey(item?.name || item?.n || '');
                if (!key) return;
                exactCounts[key] = (exactCounts[key] || 0) + 1;

                const uniqueTokens = Array.from(new Set(getDishFamilyTokens(key)));
                uniqueTokens.forEach(token => {
                    familyCounts[token] = (familyCounts[token] || 0) + 1;
                });
            });
        });
        return { exactCounts, familyCounts };
    }

    function getMacros(name, type, fallbackKcal, fallbackProtein) {
        if (typeof window.getPegasusMacros === 'function') {
            const macros = window.getPegasusMacros(name, type);
            return {
                kcal: parseFloat(macros?.kcal || fallbackKcal || 0) || 0,
                protein: parseFloat(macros?.protein || fallbackProtein || 0) || 0
            };
        }
        return {
            kcal: parseFloat(fallbackKcal || 550) || 550,
            protein: parseFloat(fallbackProtein || 35) || 35
        };
    }

    function classifyFood(rawName, rawType) {
        const name = normalizeText(rawName);
        const categories = new Set();
        const detail = new Set();

        KEYWORD_MAP.forEach(rule => {
            if (rule.words.some(word => name.includes(word))) categories.add(rule.key);
        });

        const type = normalizeText(rawType);
        if (type === 'ospro') {
            categories.add('legumes');
            categories.add('fiber');
            categories.add('veg');
        }
        if (type === 'ladero') {
            categories.add('veg');
            categories.add('fiber');
            if (name.includes('σπανακ') || name.includes('φασολακ') || name.includes('μπαμι')) categories.add('greens');
        }
        if (type === 'psari') categories.add('fish');
        if (type === 'poulika') categories.add('poultry');
        if (type === 'kreas') categories.add('meat');
        if (type === 'carb' && (name.includes('ολικ') || name.includes('λαχαν') || name.includes('γεμιστ'))) categories.add('fiber');

        if (categories.has('greens')) categories.add('veg');
        if (categories.has('fruit') || categories.has('legumes') || categories.has('greens') || categories.has('veg') || categories.has('nuts')) categories.add('fiber');
        if (categories.has('whey') || categories.has('eggs') || categories.has('poultry') || categories.has('meat') || categories.has('dairy')) detail.add('protein_base');

        return { name: rawName, type: rawType || '', categories: Array.from(categories), detail: Array.from(detail) };
    }

    function getHistoryStats(days) {
        const history = getRecentHistory(days);
        const stats = { days, categories: {}, dayCoverage: {}, itemCounts: {}, history };
        Object.keys(CATEGORY_CONFIG).forEach(key => {
            stats.categories[key] = 0;
            stats.dayCoverage[key] = 0;
        });

        history.forEach(day => {
            const dayHits = new Set();
            day.log.forEach(item => {
                const name = String(item?.name || item?.n || '').trim();
                if (!name) return;
                const cls = classifyFood(name, item?.t || item?.type || '');
                const normName = normalizeText(name);
                stats.itemCounts[normName] = (stats.itemCounts[normName] || 0) + 1;
                cls.categories.forEach(cat => {
                    if (!(cat in stats.categories)) return;
                    stats.categories[cat] += 1;
                    dayHits.add(cat);
                });
            });
            dayHits.forEach(cat => { stats.dayCoverage[cat] += 1; });
        });

        return stats;
    }

    function getProteinBaseSummary(stats) {
        const keys = Object.keys(stats.itemCounts || {});
        const parts = [];
        if (keys.some(k => k.includes('αυγ'))) parts.push(t('αυγά', 'eggs'));
        if (keys.some(k => k.includes('whey') || k.includes('πρωτειν'))) parts.push('whey');
        if (keys.some(k => k.includes('γαλοπου'))) parts.push(t('γαλοπούλα', 'turkey'));
        if (keys.some(k => k.includes('γιαουρτ'))) parts.push(t('γιαούρτι', 'yogurt'));
        if (keys.some(k => k.includes('τοστ') || k.includes('ολικ'))) parts.push(t('τοστ ολικής', 'wholegrain toast'));
        return parts;
    }

    function buildDeficits(stats3, stats5, stats7) {
        return Object.keys(CATEGORY_CONFIG).map(key => {
            const cfg = CATEGORY_CONFIG[key];
            const misses =
                Math.max(0, cfg.min3 - (stats3.dayCoverage[key] || 0)) * 1.5 +
                Math.max(0, cfg.min5 - (stats5.dayCoverage[key] || 0)) * 2.5 +
                Math.max(0, cfg.min7 - (stats7.dayCoverage[key] || 0)) * 1.5;
            return {
                key,
                label: t(cfg.gr, cfg.en),
                days3: stats3.dayCoverage[key] || 0,
                days5: stats5.dayCoverage[key] || 0,
                days7: stats7.dayCoverage[key] || 0,
                score: misses * cfg.priority
            };
        }).sort((a, b) => b.score - a.score);
    }

    function pushCandidate(list, seen, raw) {
        const name = String(raw?.name || raw?.n || '').trim();
        if (!name) return;
        const norm = normalizeText(name);
        if (seen.has(norm)) return;
        const type = raw?.t || raw?.type || 'kreas';
        const macros = getMacros(name, type, raw?.kcal, raw?.protein);
        seen.add(norm);
        list.push({
            n: name,
            t: type,
            kcal: macros.kcal,
            protein: macros.protein,
            categories: classifyFood(name, type).categories
        });
    }

    function getTodayKoukiCandidates() {
        const list = [];
        const seen = new Set();
        const todayKey = getTodayDayKey();
        (window.KOUKI_MASTER_MENU?.[todayKey] || []).forEach(item => pushCandidate(list, seen, item));
        return list;
    }

    function scoreCandidate(item, deficits, consumed, targets, repeatSignal7) {
        const deficitMap = deficits.reduce((acc, d) => { acc[d.key] = d.score; return acc; }, {});
        const categories = item.categories || [];
        let score = 0;
        categories.forEach(cat => { score += deficitMap[cat] || 0; });
        if (categories.includes('greens')) score += 14;
        if (categories.includes('legumes')) score += 12;
        if (categories.includes('fish')) score += 10;
        if (categories.includes('veg')) score += 8;
        if (categories.includes('fiber')) score += 6;

        const proteinNeed = Math.max(0, targets.protein - consumed.protein);
        const kcalNeed = Math.max(0, targets.kcal - consumed.kcal);
        const proteinDensity = (item.protein || 0) / Math.max(item.kcal || 1, 1);
        score += Math.min(item.protein || 0, proteinNeed) * 0.6;
        score += Math.min(item.kcal || 0, kcalNeed) / 180;
        score += proteinDensity * 18;

        if (proteinNeed <= 15 && (categories.includes('meat') || categories.includes('poultry')) && !categories.includes('veg') && !categories.includes('greens') && !categories.includes('legumes') && !categories.includes('fish')) score -= 10;
        score -= Math.min(repeatSignal7 || 0, 3) * 8;
        if (!categories.length) score -= 4;
        return score;
    }

    function buildTopReasons(item, deficits, exactRepeatCount7, familyRepeatCount7) {
        const labels = deficits.filter(d => d.score > 0 && item.categories.includes(d.key)).slice(0, 2).map(d => d.label);
        let reason = '';
        if (labels.length) reason = t(`Καλύπτει κενό σε ${labels.join(' / ')}.`, `Covers a gap in ${labels.join(' / ')}.`);
        else if (item.categories.includes('greens') || item.categories.includes('veg')) reason = t('Δίνει περισσότερη ποικιλία σε λαχανικά.', 'Adds more vegetable variety.');
        else if (item.categories.includes('legumes')) reason = t('Βάζει όσπρια που σου λείπουν εύκολα.', 'Adds legumes that are easy to miss.');
        else if (item.categories.includes('fish')) reason = t('Σου δίνει ψάρι/θαλασσινά αντί για ίδια πρωτεΐνη.', 'Gives you fish/seafood instead of repeating the same protein.');
        else reason = t('Είναι η πιο ισορροπημένη επιλογή για σήμερα.', 'It is the most balanced choice for today.');

        if ((exactRepeatCount7 || 0) >= 2) {
            reason += ' ' + t(`Το έχεις ήδη φάει ${exactRepeatCount7} φορές τις τελευταίες 7 μέρες.`, `You already had it ${exactRepeatCount7} times over the last 7 days.`);
        } else if ((exactRepeatCount7 || 0) >= 1) {
            reason += ' ' + t('Το έχεις ήδη φάει πρόσφατα αυτή την εβδομάδα.', 'You already ate it recently this week.');
        } else if ((familyRepeatCount7 || 0) >= 2) {
            reason += ' ' + t(`Παίζει πολύ συχνά παρόμοιο πιάτο (${familyRepeatCount7}x / 7 ημέρες).`, `A very similar dish appears often (${familyRepeatCount7}x / 7 days).`);
        }

        return reason.trim();
    }

    function buildDeficitSummary(deficits) {
        const topDeficits = deficits.filter(d => d.score > 0).slice(0, 3);
        if (!topDeficits.length) {
            return t('Δεν φαίνεται σοβαρό διατροφικό κενό στο πρόσφατο ιστορικό.', 'No major dietary gap appears in recent history.');
        }
        return t(
            `Λείπουν περισσότερο: ${topDeficits.map(d => `${d.label} (${d.days5}/5)`).join(', ')}.`,
            `Biggest gaps: ${topDeficits.map(d => `${d.label} (${d.days5}/5)`).join(', ')}.`
        );
    }

    function buildProteinProgressLine(consumed, targets) {
        return t(
            `${Math.round(consumed.protein)}/${Math.round(targets.protein)} γρ πρωτεΐνης σήμερα (ρουτίνα + log ημέρας).`,
            `${Math.round(consumed.protein)}/${Math.round(targets.protein)}g protein today (routine + daily log).`
        );
    }

    function getOptionToneMeta(rank, exactRepeatCount7, familyRepeatCount7) {
        if ((exactRepeatCount7 || 0) >= 2) {
            return {
                tone: 'red',
                toneLabel: t(`Συχνή επανάληψη • ${exactRepeatCount7}x / 7 ημέρες`, `Frequent repeat • ${exactRepeatCount7}x / 7 days`)
            };
        }
        if ((exactRepeatCount7 || 0) >= 1) {
            return {
                tone: 'red',
                toneLabel: t('Το έχεις ήδη φάει', 'Already eaten recently')
            };
        }
        if ((familyRepeatCount7 || 0) >= 2 && rank > 0) {
            return {
                tone: 'red',
                toneLabel: t(`Παρόμοιο μοτίβο • ${familyRepeatCount7}x / 7 ημέρες`, `Similar pattern • ${familyRepeatCount7}x / 7 days`)
            };
        }
        if (rank === 0) {
            return {
                tone: 'green',
                toneLabel: t('Top επιλογή σήμερα', 'Top choice today')
            };
        }
        return {
            tone: 'orange',
            toneLabel: t('ΟΚ αλλά όχι κορυφαία', 'Okay, but not top-tier')
        };
    }

    function buildMessage(consumed, targets, deficits, stats5) {
        const topDeficits = deficits.filter(d => d.score > 0).slice(0, 3);
        const proteinBase = getProteinBaseSummary(stats5);
        const intro = proteinBase.length
            ? t(`Η σταθερή σου βάση πρωτεΐνης φαίνεται καλυμμένη από ${proteinBase.join(' / ')}.`, `Your protein base already looks covered by ${proteinBase.join(' / ')}.`)
            : t('Η βάση πρωτεΐνης σου φαίνεται σχετικά σταθερή.', 'Your protein base looks relatively stable.');

        if (!topDeficits.length) {
            return t(`${intro} Δεν φαίνεται σοβαρό διατροφικό κενό τις τελευταίες μέρες. Σήμερα προτίμησε ποικιλία και κάτι πιο ελαφρύ αν δεν πεινάς πολύ.`, `${intro} No major dietary gap appears in recent days. Today prefer variety and something lighter if you are not very hungry.`);
        }

        const needProtein = Math.max(0, targets.protein - consumed.protein);
        const needKcal = Math.max(0, targets.kcal - consumed.kcal);
        const tail = needProtein > 25
            ? t(` Σήμερα σου λείπουν ακόμη περίπου ${needProtein}g πρωτεΐνης και ${needKcal} kcal, αλλά η προτεραιότητα είναι να καλύψεις και τα κενά ποικιλίας.`, ` You still need about ${needProtein}g protein and ${needKcal} kcal today, but the priority is to also cover variety gaps.`)
            : t(' Μην κυνηγήσεις μόνο παραπάνω πρωτεΐνη· κυνηγά και το κενό που λείπει από τις τελευταίες μέρες.', ' Do not chase extra protein only; cover what has been missing across recent days too.');

        return `${intro}${tail}`;
    }

    function buildGeneralSuggestions(deficits) {
        return deficits.filter(d => d.score > 0).slice(0, 3).map(d => {
            switch (d.key) {
                case 'greens': return t('Βάλε σήμερα χόρτα, σαλάτα ή κάτι πράσινο.', 'Add greens or salad today.');
                case 'veg': return t('Προτίμησε πιάτο με περισσότερα λαχανικά.', 'Prefer a dish with more vegetables.');
                case 'fruit': return t('Βάλε ένα επιπλέον φρούτο μέσα στη μέρα.', 'Add one extra fruit today.');
                case 'legumes': return t('Αν υπάρχει όσπριο σήμερα, προτίμησέ το.', 'If there is a legume option today, prefer it.');
                case 'fish': return t('Αν υπάρχει ψάρι σήμερα, είναι καλύτερη αλλαγή από το ίδιο κρέας.', 'If fish is available today, it is a better change than repeating meat.');
                case 'fiber': return t('Κυνήγα περισσότερη φυτική ίνα και ποικιλία.', 'Aim for more fiber and variety.');
                default: return '';
            }
        }).filter(Boolean);
    }

    function analyzeAndRecommend() {
        const consumed = getTotals();
        const targets = getTargets();
        const stats3 = getHistoryStats(HISTORY_WINDOWS.short);
        const stats5 = getHistoryStats(HISTORY_WINDOWS.mid);
        const stats7 = getHistoryStats(HISTORY_WINDOWS.long);
        const deficits = buildDeficits(stats3, stats5, stats7);
        const itemCounts7 = getItemCounts(HISTORY_WINDOWS.long);

        const options = getTodayKoukiCandidates()
            .map(item => {
                const normalizedName = normalizeDishKey(item.n);
                const exactRepeatCount7 = itemCounts7.exactCounts[normalizedName] || 0;
                const familyRepeatCount7 = getDishFamilyTokens(item.n).reduce((maxCount, token) => {
                    return Math.max(maxCount, itemCounts7.familyCounts[token] || 0);
                }, 0);
                const repeatSignal7 = Math.max(exactRepeatCount7, familyRepeatCount7);
                return {
                    ...item,
                    exactRepeatCount7,
                    familyRepeatCount7,
                    repeatSignal7,
                    score: scoreCandidate(item, deficits, consumed, targets, repeatSignal7)
                };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 4)
            .map((item, index) => {
                const toneMeta = getOptionToneMeta(index, item.exactRepeatCount7, item.familyRepeatCount7);
                return {
                    n: item.n,
                    t: item.t,
                    kcal: item.kcal,
                    protein: item.protein,
                    reason: buildTopReasons(item, deficits, item.exactRepeatCount7, item.familyRepeatCount7),
                    categories: item.categories,
                    repeatCount7: item.exactRepeatCount7,
                    familyRepeatCount7: item.familyRepeatCount7,
                    tone: toneMeta.tone,
                    toneLabel: toneMeta.toneLabel
                };
            });

        return {
            msg: buildMessage(consumed, targets, deficits, stats5),
            proteinLine: buildProteinProgressLine(consumed, targets),
            deficitLine: buildDeficitSummary(deficits),
            options,
            consumed: { kcal: Math.round(consumed.kcal), protein: Math.round(consumed.protein) },
            targets,
            deficits,
            suggestions: buildGeneralSuggestions(deficits),
            history: { days3: stats3.dayCoverage, days5: stats5.dayCoverage, days7: stats7.dayCoverage },
            todayMenuDay: getTodayDayKey(),
            todayMenuDayLabel: getTodayDayLabel()
        };
    }

    function renderAdvisorUI() {
        const advice = analyzeAndRecommend();
        const lines = [advice.msg, ''];
        if (advice.suggestions.length) {
            lines.push(t('Προτεραιότητες σήμερα:', 'Today priorities:'));
            advice.suggestions.slice(0, 3).forEach(s => lines.push(`• ${s}`));
            lines.push('');
        }
        if (advice.options.length) {
            lines.push(t(`Σήμερα από το Κούκι (${advice.todayMenuDayLabel || advice.todayMenuDay}):`, `Today from Kouki (${advice.todayMenuDayLabel || advice.todayMenuDay}):`));
            advice.options.forEach((opt, index) => {
                lines.push(`${index + 1}. ${opt.n} — ${opt.kcal} kcal | ${opt.protein}g P`);
                if (opt.reason) lines.push(`   ${opt.reason}`);
            });
        }

        const title = t('PEGASUS ADVISOR', 'PEGASUS ADVISOR');
        if (typeof window.pegasusAlert === 'function') return window.pegasusAlert(lines.join('\n'), title);
        return alert(lines.join('\n'));
    }

    window.PegasusDietAdvisor = { analyzeAndRecommend, renderAdvisorUI, classifyFood, getHistoryStats };
    window.renderAdvisorUI = renderAdvisorUI;
})();
