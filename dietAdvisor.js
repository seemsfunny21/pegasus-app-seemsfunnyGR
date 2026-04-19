/* ==========================================================================
   PEGASUS DIET ADVISOR - v1.0 (SHARED DESKTOP / MOBILE)
   Protocol: Daily Deficit Analysis + Kouki Recommendation Engine
   ========================================================================== */
(function() {
    var M = M || window.PegasusManifest;

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

    function getDateStr() {
        if (typeof window.PegasusDiet?.getStrictDateStr === 'function') return window.PegasusDiet.getStrictDateStr();
        if (typeof window.getStrictDateStr === 'function') return window.getStrictDateStr();
        if (typeof window.getPegasusTodayDateStr === 'function') return window.getPegasusTodayDateStr();

        const d = new Date();
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }

    function getFoodLog() {
        const dateStr = getDateStr();
        const prefix = M?.nutrition?.log_prefix || M?.diet?.log_prefix || 'food_log_';
        try {
            return JSON.parse(localStorage.getItem(prefix + dateStr) || '[]');
        } catch (e) {
            return [];
        }
    }

    function getTotals() {
        const log = getFoodLog();
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
            kcal = parseFloat(localStorage.getItem(M?.diet?.todayKcal || 'pegasus_today_kcal')) || kcal;
        }

        return { kcal: Math.round(kcal), protein: Math.round(protein) };
    }

    function getTodayDayKey() {
        const daysMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return daysMap[new Date().getDay()];
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

    function pushCandidate(list, seen, raw) {
        const name = String(raw?.name || raw?.n || '').trim();
        if (!name) return;
        if (seen.has(name.toLowerCase())) return;

        const type = raw?.t || raw?.type || 'kreas';
        const macros = getMacros(name, type, raw?.kcal, raw?.protein);
        if (!macros.kcal && !macros.protein) return;

        seen.add(name.toLowerCase());
        list.push({
            n: name,
            t: type,
            kcal: macros.kcal,
            protein: macros.protein
        });
    }

    function getCandidates() {
        const candidates = [];
        const seen = new Set();

        const todayKey = getTodayDayKey();
        const todayMenu = window.KOUKI_MASTER_MENU?.[todayKey] || [];
        todayMenu.forEach(item => pushCandidate(candidates, seen, item));

        const dbMenu = Array.isArray(window.PegasusKoukiDB) ? window.PegasusKoukiDB : [];
        dbMenu.forEach(item => pushCandidate(candidates, seen, item));

        try {
            const libKey = M?.diet?.foodLibrary || 'pegasus_food_library';
            const library = JSON.parse(localStorage.getItem(libKey) || '[]');
            library.forEach(item => pushCandidate(candidates, seen, item));
        } catch (e) {}

        return candidates;
    }

    function scoreCandidate(item, needKcal, needProtein) {
        const kcal = item.kcal || 0;
        const protein = item.protein || 0;
        const proteinDensity = protein / Math.max(kcal, 1);
        const kcalFit = needKcal > 0 ? Math.min(kcal, needKcal) : Math.max(0, 350 - Math.abs(kcal - 350));
        const proteinFit = needProtein > 0 ? Math.min(protein, needProtein) : protein;
        const kcalOvershoot = Math.max(0, kcal - Math.max(needKcal, 1));

        return (
            proteinFit * 4.5 +
            (kcalFit / 45) +
            (proteinDensity * 180) -
            (kcalOvershoot / 90)
        );
    }

    function buildMessage(consumed, targets) {
        const needKcal = Math.max(0, targets.kcal - consumed.kcal);
        const needProtein = Math.max(0, targets.protein - consumed.protein);

        if (needKcal <= 120 && needProtein <= 10) {
            return t(
                `Είσαι πολύ κοντά στον στόχο. Υπολείπονται περίπου ${needKcal} kcal και ${needProtein}g πρωτεΐνης.`,
                `You are very close to target. You are missing about ${needKcal} kcal and ${needProtein}g protein.`
            );
        }

        return t(
            `Σου λείπουν περίπου ${needKcal} kcal και ${needProtein}g πρωτεΐνης. Αυτές είναι οι καλύτερες επιλογές για τώρα.`,
            `You are missing about ${needKcal} kcal and ${needProtein}g protein. These are the best options right now.`
        );
    }

    function analyzeAndRecommend() {
        const consumed = getTotals();
        const targets = getTargets();
        const needKcal = Math.max(0, targets.kcal - consumed.kcal);
        const needProtein = Math.max(0, targets.protein - consumed.protein);

        const options = getCandidates()
            .map(item => ({ ...item, score: scoreCandidate(item, needKcal, needProtein) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 4)
            .map(item => ({ n: item.n, t: item.t, kcal: item.kcal, protein: item.protein }));

        return {
            msg: buildMessage(consumed, targets),
            options,
            consumed: { kcal: Math.round(consumed.kcal), protein: Math.round(consumed.protein) },
            targets,
            deficits: { kcal: needKcal, protein: needProtein }
        };
    }

    function renderAdvisorUI() {
        const advice = analyzeAndRecommend();
        const lines = [advice.msg, ''];

        advice.options.forEach((opt, index) => {
            lines.push(`${index + 1}. ${opt.n} — ${opt.kcal} kcal | ${opt.protein}g P`);
        });

        const title = t('PEGASUS ADVISOR', 'PEGASUS ADVISOR');
        if (typeof window.pegasusAlert === 'function') {
            return window.pegasusAlert(lines.join('\n'), title);
        }
        return alert(lines.join('\n'));
    }

    window.PegasusDietAdvisor = {
        analyzeAndRecommend,
        renderAdvisorUI
    };
    window.renderAdvisorUI = renderAdvisorUI;
})();
