/* ==========================================================================
   PEGASUS I18N - v1.0
   Protocol: GR / EN Runtime Translation Layer
   ========================================================================== */

(function() {
    const LANG_KEY = 'pegasus_language';
    const LEGACY_LANG_KEY = 'pegasus_lang';
    const exactPairs = [
        ['Προθέρμανση', 'Warmup'], ['Έναρξη', 'Start'], ['Παύση', 'Pause'], ['Συνέχεια', 'Continue'], ['Επόμενο', 'Next'],
        ['Ημερολόγιο', 'Calendar'], ['Επιτεύγματα', 'Achievements'], ['Διατροφή', 'Nutrition'], ['ΠΡΟΕΠΙΣΚΟΠΗΣΗ', 'PREVIEW'],
        ['Ρυθμίσεις', 'Settings'], ['EMAIL', 'EMAIL'], ['⚙️ ΕΡΓΑΛΕΙΑ', '⚙️ TOOLS'], ['Προπονήσεις:', 'Workouts:'],
        ['ΓΚΑΛΕΡΙ ΠΡΟΟΔΟΥ', 'PROGRESS GALLERY'], ['ΗΜΕΡΟΛΟΓΙΟ PEGASUS', 'PEGASUS CALENDAR'], ['ΡΥΘΜΙΣΕΙΣ PEGASUS', 'PEGASUS SETTINGS'],
        ['Βάρος (kg)', 'Weight (kg)'], ['Ύψος (cm)', 'Height (cm)'], ['Ηλικία', 'Age'], ['Φύλο', 'Gender'], ['Άνδρας', 'Male'], ['Γυναίκα', 'Female'],
        ['Στόχος Kcal', 'Kcal Goal'], ['Πρωτεΐνη (g)', 'Protein (g)'], ['WEEKLY SET TARGETS', 'WEEKLY SET TARGETS'],
        ['Στήθος', 'Chest'], ['Πλάτη', 'Back'], ['Πόδια', 'Legs'], ['Χέρια', 'Arms'], ['Ώμοι', 'Shoulders'], ['Κορμός', 'Core'],
        ['ΑΠΟΘΗΚΕΥΣΗ', 'SAVE'], ['Ημερολόγιο Διατροφής', 'Nutrition Log'], ['ΘΕΡΜΙΔΕΣ', 'CALORIES'], ['ΠΡΩΤΕΪΝΗ', 'PROTEIN'], ['ΥΠΟΛΟΙΠΟ', 'REMAINING'],
        ['ΓΕΥΜΑΤΑ', 'MEALS'], ['Φαγητό', 'Food'], ['Πρωτεΐνη (g)', 'Protein (g)'], ['Σήμερα', 'Today'], ['Συχνές Επιλογές', 'Frequent Choices'],
        ['🔍 Αναζήτηση...', '🔍 Search...'], ['ΜΕΝΟΥ ΚΟΥΚΙ', 'KOUKI MENU'], ['ΕΠΙΣΚΟΠΗΣΗ & ΠΡΟΟΔΟΣ', 'PREVIEW & PROGRESS'], ['ΑΣΚΗΣΕΙΣ ΗΜΕΡΑΣ', "TODAY'S EXERCISES"],
        ['ΚΑΤΑΓΡΑΦΗ ΠΟΔΗΛΑΣΙΑΣ', 'CYCLING LOG'], ['ΧΙΛΙΟΜΕΤΡΑ (KM):', 'DISTANCE (KM):'], ['ΘΕΡΜΙΔΕΣ (KCAL):', 'CALORIES (KCAL):'], ['ΑΚΥΡΟ', 'CANCEL'],
        ['ΗΜΕΡΟΜΗΝΙΑ ΤΕΤΑΡΤΗΣ:', 'WEDNESDAY DATE:'], ['ΜΕΣΗ ΕΝΤΑΣΗ (AVG %):', 'AVERAGE INTENSITY (AVG %):'], ['ΘΕΡΜΙΔΕΣ (e-Kcal):', 'CALORIES (e-Kcal):'],
        ['Επιλογη Προγραμματοσ', 'Choose Program'], ['5 Ημέρες Βάρη', '5 Days Weights'], ['Βάρη + IMS Τετάρτη', 'Weights + IMS Wednesday'], ['Βάρη + Ποδήλατο ΣΚ', 'Weights + Weekend Bike'], ['Βάρη + ems + ποδήλατο', 'Weights + EMS + Bike'],
        ['ΑΣΦΑΛΗΣ ΤΑΥΤΟΠΟΙΗΣΗ', 'SECURE AUTHENTICATION'], ['ΑΠΑΣΦΑΛΙΣΗ ΣΥΣΤΗΜΑΤΟΣ', 'UNLOCK SYSTEM'], ['ΕΠΙΣΤΡΟΦΗ / ΑΚΥΡΟ', 'BACK / CANCEL'], ['OFFLINE MODE', 'OFFLINE MODE'],
        ['ΛΕΙΤΟΥΡΓΙΑ OFFLINE', 'OFFLINE MODE'], ['ΑΠΑΣΦΑΛΙΣΗ', 'UNLOCK'], ['ΣΥΣΤΗΜΑ ΕΤΟΙΜΟ', 'SYSTEM READY'], ['ΣΥΓΧΡΟΝΙΣΜΟΣ...', 'SYNCING...'], ['ΣΦΑΛΜΑ SYNC', 'SYNC ERROR'], ['ΛΑΘΟΣ PIN', 'WRONG PIN'],
        ['Αερόβια', 'Cardio'], ['Γεύματα', 'Meals'], ['Στόχοι', 'Targets'], ['Έγγραφα', 'Documents'], ['Όχημα', 'Vehicle'], ['Σημειώσεις', 'Notes'],
        ['ΑΠΟΘΕΜΑ ΣΥΜΠΛΗΡΩΜΑΤΩΝ', 'SUPPLEMENT STOCK'], ['ΠΡΩΤΕΪΝΗ WHEY', 'WHEY PROTEIN'], ['ΚΡΕΑΤΙΝΗ', 'CREATINE'], ['ΑΝΑΠΛΗΡΩΣΗ', 'REFILL'],
        ['ΡΥΘΜΙΣΕΙΣ & ΒΑΡΟΣ', 'SETTINGS & WEIGHT'], ['ΛΗΨΗ BACKUP', 'DOWNLOAD BACKUP'], ['ΕΠΑΝΑΦΟΡΑ DATA', 'RESTORE DATA'], ['ΓΕΝΙΚΟ RESET ΣΥΣΤΗΜΑΤΟΣ', 'FULL SYSTEM RESET'],
        ['Maintenance (TDEE): -- kcal', 'Maintenance (TDEE): -- kcal'], ['M.O. Εβδομάδας: -- kg', 'Weekly Avg: -- kg'], ['Αναμονή δεδομένων...', 'Waiting for data...'],
        ['ONLINE', 'ONLINE'], ['OFFLINE', 'OFFLINE'], ['LOCKED', 'LOCKED'], ['Advisor Offline', 'Advisor Offline'],
        ['αρχικοποιηση συστηματος', 'system initialization'], ['ΣΩΣΕ', 'SAVE'], ['ΔΗΜΙΟΥΡΓΙΑ ΝΕΟΥ ΑΠΟΘΕΜΑΤΟΣ', 'CREATE NEW STOCK'], ['+ ΝΕΟ ΠΡΟΪΟΝ', '+ NEW PRODUCT'], ['Χ ΚΛΕΙΣΙΜΟ', 'X CLOSE'],
        ['ΑΠΟΘΗΚΕΥΣΗ ΣΤΗ ΒΑΣΗ', 'SAVE TO DATABASE'], ['ΟΙΚΟΝΟΜΙΚΗ ΔΙΑΧΕΙΡΙΣΗ', 'FINANCIAL TRACKING'], ['ΤΡΕΧΟΝ ΥΠΟΛΟΙΠΟ', 'CURRENT BALANCE'], ['ΠΕΡΙΓΡΑΦΗ ΣΥΝΑΛΛΑΓΗΣ', 'TRANSACTION DESCRIPTION'],
        ['ΠΟΣΟ ΣΕ ΕΥΡΩ (€)', 'AMOUNT IN EURO (€)'], ['+ ΕΣΟΔΟ', '+ INCOME'], ['- ΕΞΟΔΟ', '- EXPENSE'], ['ΙΣΤΟΡΙΚΟ ΣΥΝΑΛΛΑΓΩΝ', 'TRANSACTION HISTORY'], ['ΚΑΜΙΑ ΚΑΤΑΓΡΑΦΗ', 'NO ENTRIES'],
        ['ΠΡΟΣΩΠΙΚΑ ΕΓΓΡΑΦΑ', 'PERSONAL DOCUMENTS'], ['ΣΤΟΙΧΕΙΑ ΟΧΗΜΑΤΟΣ', 'VEHICLE DETAILS'], ['ΠΡΟΣΩΠΙΚΕΣ ΣΗΜΕΙΩΣΕΙΣ', 'PERSONAL NOTES'], ['ΕΝΤΟΠΙΣΜΟΣ ΟΧΗΜΑΤΟΣ', 'VEHICLE LOCATION'],
        ['ΝΕΑ ΠΕΡΙΟΧΗ / ΘΕΣΗ', 'NEW AREA / LOCATION'], ['ΑΠΟΘΗΚΕΥΣΗ ΣΤΟ CLOUD', 'SAVE TO CLOUD'], ['ΠΡΟΣΦΑΤΕΣ ΠΕΡΙΟΧΕΣ (TOP 10)', 'RECENT AREAS (TOP 10)'],
        ['ΚΑΤΑΓΡΑΦΗ ΒΑΡΟΥΣ ΣΩΜΑΤΟΣ', 'BODY WEIGHT LOG'], ['ΕΝΗΜΕΡΩΣΗ', 'UPDATE'], ['ΔΙΑΧΕΙΡΙΣΗ ΔΕΔΟΜΕΝΩΝ (CLOUD / LOCAL)', 'DATA MANAGEMENT (CLOUD / LOCAL)'],
        ['ΗΜΕΡΗΣΙΟ ΜΕΝΟΥ (ΚΟΥΚΙ)', 'DAILY MENU (KOUKI)'], ['ΣΥΝΕΔΡΙΑ IMS / EMS', 'IMS / EMS SESSION'], ['ΕΒΔΟΜΑΔΙΑΙΑ ΣΤΟΧΕΥΣΗ', 'WEEKLY TARGETING'],
        ['ΠΙΝΑΚΙΔΑ', 'PLATE'], ['ΜΟΝΤΕΛΟ', 'MODEL'], ['VIN (ΠΛΑΙΣΙΟ)', 'VIN (CHASSIS)'], ['ΚΥΒΙΚΑ (cc)', 'ENGINE (cc)'], ['ΙΠΠΟΙ (hp)', 'HORSEPOWER (hp)'], ['ΛΗΞΗ ΑΣΦΑΛΕΙΑΣ', 'INSURANCE EXPIRY'],
        ['ΛΗΞΗ ΚΤΕΟ', 'KTEO EXPIRY'], ['ΕΠΟΜΕΝΟ SERVICE (KM)', 'NEXT SERVICE (KM)'], ['ΙΣΤΟΡΙΚΟ SERVICE', 'SERVICE HISTORY'], ['Εργασία (π.χ. Λάδια)', 'Task (e.g. Oil)'], ['Χιλιόμετρα', 'Kilometers'],
        ['Πληκτρολόγησε σημείωση...', 'Type note...'], ['ΠΡΟΣΘΗΚΗ ΣΗΜΕΙΩΣΗΣ', 'ADD NOTE'], ['Παρκινγκ: --', 'Parking: --'], ['ΠΑΡΚΙΝΓΚ: --', 'PARKING: --'],
        ['TACTICAL DATA INTERFACE', 'TACTICAL DATA INTERFACE'], ['EXTENDED TACTICAL MODULES', 'EXTENDED TACTICAL MODULES'],
        ['Παρακαλώ επίλεξε πρώτα μια ημέρα!', 'Please select a day first!'], ['Σφάλμα: Το dietAdvisor.js δεν έχει φορτωθεί σωστά.', 'Error: dietAdvisor.js did not load correctly.'], ['Reporting Engine Offline', 'Reporting Engine Offline'],
        ['Δευτέρα','Monday'], ['Τρίτη','Tuesday'], ['Τετάρτη','Wednesday'], ['Πέμπτη','Thursday'], ['Παρασκευή','Friday'], ['Σάββατο','Saturday'], ['Κυριακή','Sunday'],
        ['ΔΕΥΤΕΡΑ','MONDAY'], ['ΤΡΙΤΗ','TUESDAY'], ['ΤΕΤΑΡΤΗ','WEDNESDAY'], ['ΠΕΜΠΤΗ','THURSDAY'], ['ΠΑΡΑΣΚΕΥΗ','FRIDAY'], ['ΣΑΒΒΑΤΟ','SATURDAY'], ['ΚΥΡΙΑΚΗ','SUNDAY']
    ];

    const dynamicRules = [
        { match: /^✅ Βάρος καταγράφηκε: ([\d.,]+) kg$/, en: '✅ Weight logged: $1 kg', gr: '✅ Βάρος καταγράφηκε: $1 kg' },
        { match: /^Προπονήσεις: (.+)$/, en: 'Workouts: $1', gr: 'Προπονήσεις: $1' },
        { match: /^M\.O\. Εβδομάδας: (.+)$/, en: 'Weekly Avg: $1', gr: 'M.O. Εβδομάδας: $1' },
        { match: /^✅ ΚΑΤΑΧΩΡΗΘΗΚΕ!\nΘερμίδες: (.+) kcal\nLeveling: \+18 σετ στα Πόδια\.$/, en: '✅ SAVED!\nCalories: $1 kcal\nLeveling: +18 sets to Legs.', gr: '✅ ΚΑΤΑΧΩΡΗΘΗΚΕ!\nΘερμίδες: $1 kcal\nLeveling: +18 σετ στα Πόδια.' },
        { match: /^⚡ PEGASUS SYNC: Πιστώθηκαν 36 σετ\.\nΚαύση: (.+) kcal\.\nΗ Τετάρτη ολοκληρώθηκε!$/, en: '⚡ PEGASUS SYNC: 36 sets credited.\nBurn: $1 kcal.\nWednesday completed!', gr: '⚡ PEGASUS SYNC: Πιστώθηκαν 36 σετ.\nΚαύση: $1 kcal.\nΗ Τετάρτη ολοκληρώθηκε!' }
    ];

    const lookup = new Map();
    exactPairs.forEach((pair, idx) => {
        lookup.set(pair[0], idx);
        lookup.set(pair[1], idx);
    });

    function getLanguage() { return localStorage.getItem(LANG_KEY) || localStorage.getItem(LEGACY_LANG_KEY) || 'gr'; }

    function setLanguage(lang) {
        const safeLang = lang === 'en' ? 'en' : 'gr';
        localStorage.setItem(LANG_KEY, safeLang);
        localStorage.setItem(LEGACY_LANG_KEY, safeLang);
        applyLanguage();
    }

    function translateExact(text, lang) {
        if (!text) return text;
        const trimmed = text.trim();
        const idx = lookup.get(trimmed);
        if (idx == null) return text;
        const target = lang === 'en' ? exactPairs[idx][1] : exactPairs[idx][0];
        return text.replace(trimmed, target);
    }

    function translateDynamic(text, lang) {
        for (const rule of dynamicRules) {
            if (rule.match.test(text)) return text.replace(rule.match, lang === 'en' ? rule.en : rule.gr);
        }
        return text;
    }

    function translateLoose(text, forcedLang) {
        const lang = forcedLang || getLanguage();
        let out = translateExact(String(text || ''), lang);
        out = translateDynamic(out, lang);
        return out;
    }

    function translateTextNode(node) {
        if (!node?.nodeValue) return;
        const parent = node.parentElement;
        if (!parent || ['SCRIPT','STYLE','TEXTAREA'].includes(parent.tagName)) return;
        const translated = translateLoose(node.nodeValue);
        if (translated !== node.nodeValue) node.nodeValue = translated;
    }

    function translateElementAttributes(el) {
        ['placeholder', 'title', 'aria-label'].forEach(attr => {
            const val = el.getAttribute?.(attr);
            if (!val) return;
            const translated = translateLoose(val);
            if (translated !== val) el.setAttribute(attr, translated);
        });
        if (el.tagName === 'INPUT') {
            const type = (el.getAttribute('type') || '').toLowerCase();
            if (['button','submit','reset'].includes(type) && el.value) {
                const translated = translateLoose(el.value);
                if (translated !== el.value) el.value = translated;
            }
        }
    }

    function walkAndTranslate(root) {
        if (!root) return;
        if (root.nodeType === Node.TEXT_NODE) { translateTextNode(root); return; }
        if (root.nodeType !== Node.ELEMENT_NODE) return;
        translateElementAttributes(root);
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null);
        let node = walker.currentNode;
        while (node) {
            if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
            else if (node.nodeType === Node.ELEMENT_NODE) translateElementAttributes(node);
            node = walker.nextNode();
        }
    }

    function updateLangButton() {
        document.querySelectorAll('.pegasus-lang-toggle').forEach(btn => {
            btn.textContent = getLanguage() === 'en' ? 'EN / GR' : 'GR / EN';
        });
    }

    function injectToggleButton() {
        if (document.querySelector('.pegasus-lang-toggle')) return;
        const btn = document.createElement('button');
        btn.className = 'pegasus-lang-toggle';
        btn.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top, 0px) + 12px);right:14px;z-index:1000000;background:#0c140c;color:#4CAF50;border:1px solid #4CAF50;border-radius:999px;padding:8px 12px;font-weight:900;font-size:11px;letter-spacing:1px;box-shadow:0 0 12px rgba(76,175,80,0.15);cursor:pointer;';
        btn.onclick = () => setLanguage(getLanguage() === 'en' ? 'gr' : 'en');
        document.body.appendChild(btn);
        updateLangButton();
    }

    function refreshViews() {
        try {
            window.refreshAllUI?.();
            window.updateFoodUI?.();
            window.renderFood?.();
            window.renderCalendar?.();
            window.renderAchievements?.();
            window.renderLiftingContent?.();
            window.renderSuppliesContent?.();
            window.updateSuppUI?.();
            window.PegasusInventory?.updateUI?.();
            window.PegasusDiet?.updateUI?.();
            window.PegasusDiet?.renderDailyKouki?.();
            window.PegasusMobileUI?.render?.();
        } catch (e) {
            console.warn('PEGASUS I18N refresh warning', e);
        }
    }

    function applyLanguage() {
        document.documentElement.lang = getLanguage() === 'en' ? 'en' : 'el';
        document.title = window.PEGASUS_IS_MOBILE ? 'Pegasus Mobile' : 'Pegasus Workout - Seemsfunny';
        walkAndTranslate(document.body);
        updateLangButton();
        refreshViews();
        setTimeout(() => walkAndTranslate(document.body), 50);
    }

    const observer = new MutationObserver(muts => {
        muts.forEach(m => {
            m.addedNodes.forEach(node => walkAndTranslate(node));
            if (m.type === 'characterData') translateTextNode(m.target);
        });
    });

    window.PegasusI18n = { getLanguage, setLanguage, applyLanguage, translateLoose };
    window.t = translateLoose;
    window.tr = translateLoose;

    document.addEventListener('DOMContentLoaded', () => {
        injectToggleButton();
        applyLanguage();
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    });
})();
