/* ==========================================================================
   PEGASUS I18N - v1.1 SAFE FOUNDATION
   Protocol: GR / EN Runtime Translation Layer
   ========================================================================== */
(function() {
    const LANG_KEY = 'pegasus_language';
    const LEGACY_LANG_KEY = 'pegasus_lang';
    const exactPairs = [
        ['ΕΡΓΑΛΕΙΑ PEGASUS', 'PEGASUS TOOLS'], ['ΣΥΣΤΗΜΑ ΣΥΝΕΡΓΑΤΗ', 'PARTNER SYSTEM'], ['Όνομα συνεργάτη...', 'Partner name...'],
        ['ΣΥΝΕΡΓΑΤΗΣ: ΑΠΕΝΕΡΓΟΣ', 'PARTNER: OFF'], ['📅 ΤΥΠΟΣ ΠΡΟΓΡΑΜΜΑΤΟΣ', '📅 PROGRAM TYPE'], ['🔊 ΗΧΟΣ: ΕΝΕΡΓΟΣ', '🔊 SOUND: ON'],
        ['🔇 ΗΧΟΣ: ΣΙΓΑΣΗ', '🔇 SOUND: MUTED'], ['🚀 TURBO: ΑΝΕΝΕΡΓΟ', '🚀 TURBO: OFF'], ['🚀 TURBO: ΕΝΕΡΓΟ', '🚀 TURBO: ON'],
        ['💾 ΑΠΟΘΗΚΕΥΣΗ ΑΡΧΕΙΟΥ', '💾 SAVE FILE'], ['📂 ΦΟΡΤΩΣΗ ΑΡΧΕΙΟΥ', '📂 LOAD FILE'], ['🔐 ΣΥΓΧΡΟΝΙΣΜΟΣ', '🔐 SYNC'],
        ['⚡ ΚΑΤΑΓΡΑΦΗ EMS', '⚡ EMS LOG'], ['🔍 ΕΛΕΓΧΟΣ PEGASUS', '🔍 PEGASUS CHECK'], ['➕ ΑΝΕΒΑΣΕ ΦΩΤΟΓΡΑΦΙΑ (JPG/PNG)', '➕ UPLOAD PHOTO (JPG/PNG)'],
        ['ΕΒΔΟΜΑΔΙΑΙΟΙ ΣΤΟΧΟΙ ΣΕΤ', 'WEEKLY SET TARGETS'], ['PEGASUS STRICT: Συμπλήρωσε έγκυρα Χιλιόμετρα και Θερμίδες.', 'PEGASUS STRICT: Enter valid Distance and Calories.'],
        ['✅ ΚΑΤΑΧΩΡΗΘΗΚΕ!', '✅ SAVED!'], ['PEGASUS STRICT: Συμπλήρωσε Φαγητό και Θερμίδες!', 'PEGASUS STRICT: Fill Food and Calories!'],
        ['PEGASUS STRICT: Μπορείς να συγκρίνεις μόνο 2 φωτογραφίες τη φορά.', 'PEGASUS STRICT: You can compare only 2 photos at a time.'],
        ['PEGASUS STRICT: Γράψε ένα έγκυρο όνομα συνεργάτη!', 'PEGASUS STRICT: Enter a valid partner name!'], ['Σφάλμα: Το dietAdvisor.js δεν έχει φορτωθεί σωστά.', 'Error: dietAdvisor.js did not load correctly.'],
        ['PEGASUS STRICT: Παρακαλώ εισάγετε ένα έγκυρο βάρος (30-250 kg).', 'PEGASUS STRICT: Please enter a valid weight (30-250 kg).'], ['ΣΦΑΛΜΑ: Συμπλήρωσε Άσκηση, Κιλά και Επαναλήψεις.', 'ERROR: Fill Exercise, Weight and Reps.'],
        ['Προθέρμανση', 'Warmup'], ['Έναρξη', 'Start'], ['Παύση', 'Pause'], ['Συνέχεια', 'Continue'], ['Επόμενο', 'Next'],
        ['Ημερολόγιο', 'Calendar'], ['Επιτεύγματα', 'Achievements'], ['Διατροφή', 'Nutrition'], ['ΠΡΟΕΠΙΣΚΟΠΗΣΗ', 'PREVIEW'],
        ['Ρυθμίσεις', 'Settings'], ['EMAIL', 'EMAIL'], ['⚙️ ΕΡΓΑΛΕΙΑ', '⚙️ TOOLS'], ['GR / EN', 'EN / GR'],
        ['Προπονήσεις:', 'Workouts:'], ['ΓΚΑΛΕΡΙ ΠΡΟΟΔΟΥ', 'PROGRESS GALLERY'], ['ΗΜΕΡΟΛΟΓΙΟ PEGASUS', 'PEGASUS CALENDAR'],
        ['ΡΥΘΜΙΣΕΙΣ PEGASUS', 'PEGASUS SETTINGS'], ['Βάρος (kg)', 'Weight (kg)'], ['Ύψος (cm)', 'Height (cm)'],
        ['Ηλικία', 'Age'], ['Φύλο', 'Gender'], ['Άνδρας', 'Male'], ['Γυναίκα', 'Female'], ['Στόχος Kcal', 'Kcal Goal'],
        ['Πρωτεΐνη (g)', 'Protein (g)'], ['Στήθος', 'Chest'], ['Πλάτη', 'Back'], ['Πόδια', 'Legs'], ['Χέρια', 'Arms'],
        ['Ώμοι', 'Shoulders'], ['Κορμός', 'Core'], ['ΑΠΟΘΗΚΕΥΣΗ', 'SAVE'], ['Ημερολόγιο Διατροφής', 'Nutrition Log'],
        ['ΘΕΡΜΙΔΕΣ', 'CALORIES'], ['ΠΡΩΤΕΪΝΗ', 'PROTEIN'], ['ΥΠΟΛΟΙΠΟ', 'REMAINING'], ['ΓΕΥΜΑΤΑ', 'MEALS'],
        ['Φαγητό', 'Food'], ['Σήμερα', 'Today'], ['Συχνές Επιλογές', 'Frequent Choices'], ['🔍 Αναζήτηση...', '🔍 Search...'],
        ['ΜΕΝΟΥ ΚΟΥΚΙ', 'KOUKI MENU'], ['ΕΠΙΣΚΟΠΗΣΗ & ΠΡΟΟΔΟΣ', 'PREVIEW & PROGRESS'], ['ΑΣΚΗΣΕΙΣ ΗΜΕΡΑΣ', "TODAY'S EXERCISES"],
        ['ΚΑΤΑΓΡΑΦΗ ΠΟΔΗΛΑΣΙΑΣ', 'CYCLING LOG'], ['ΧΙΛΙΟΜΕΤΡΑ (KM):', 'DISTANCE (KM):'], ['ΘΕΡΜΙΔΕΣ (KCAL):', 'CALORIES (KCAL):'],
        ['ΑΚΥΡΟ', 'CANCEL'], ['ΗΜΕΡΟΜΗΝΙΑ ΤΕΤΑΡΤΗΣ:', 'WEDNESDAY DATE:'], ['ΜΕΣΗ ΕΝΤΑΣΗ (AVG %):', 'AVERAGE INTENSITY (AVG %):'],
        ['ΘΕΡΜΙΔΕΣ (e-Kcal):', 'CALORIES (e-Kcal):'], ['Επιλογη Προγραμματοσ', 'Choose Program'], ['5 Ημέρες Βάρη', '5 Days Weights'],
        ['Βάρη + IMS Τετάρτη', 'Weights + IMS Wednesday'], ['Βάρη + Ποδήλατο ΣΚ', 'Weights + Weekend Bike'], ['Βάρη + ems + ποδήλατο', 'Weights + EMS + Bike'],
        ['ΑΣΦΑΛΗΣ ΤΑΥΤΟΠΟΙΗΣΗ', 'SECURE AUTHENTICATION'], ['ΑΠΑΣΦΑΛΙΣΗ ΣΥΣΤΗΜΑΤΟΣ', 'UNLOCK SYSTEM'], ['ΕΠΙΣΤΡΟΦΗ / ΑΚΥΡΟ', 'BACK / CANCEL'],
        ['OFFLINE MODE', 'OFFLINE MODE'], ['ΛΕΙΤΟΥΡΓΙΑ OFFLINE', 'OFFLINE MODE'], ['ΑΠΑΣΦΑΛΙΣΗ', 'UNLOCK'], ['ΣΥΣΤΗΜΑ ΕΤΟΙΜΟ', 'SYSTEM READY'],
        ['ΣΥΓΧΡΟΝΙΣΜΟΣ...', 'SYNCING...'], ['ΣΦΑΛΜΑ SYNC', 'SYNC ERROR'], ['ΛΑΘΟΣ PIN', 'WRONG PIN'], ['Αερόβια', 'Cardio'],
        ['Γεύματα', 'Meals'], ['Στόχοι', 'Targets'], ['Έγγραφα', 'Documents'], ['Όχημα', 'Vehicle'], ['Σημειώσεις', 'Notes'],
        ['ΑΠΟΘΕΜΑ ΣΥΜΠΛΗΡΩΜΑΤΩΝ', 'SUPPLEMENT STOCK'], ['ΠΡΩΤΕΪΝΗ WHEY', 'WHEY PROTEIN'], ['ΚΡΕΑΤΙΝΗ', 'CREATINE'], ['ΑΝΑΠΛΗΡΩΣΗ', 'REFILL'],
        ['ΡΥΘΜΙΣΕΙΣ & ΒΑΡΟΣ', 'SETTINGS & WEIGHT'], ['ΛΗΨΗ BACKUP', 'DOWNLOAD BACKUP'], ['ΕΠΑΝΑΦΟΡΑ DATA', 'RESTORE DATA'], ['ΓΕΝΙΚΟ RESET ΣΥΣΤΗΜΑΤΟΣ', 'FULL SYSTEM RESET'],
        ['Maintenance (TDEE): -- kcal', 'Maintenance (TDEE): -- kcal'], ['M.O. Εβδομάδας: -- kg', 'Weekly Avg: -- kg'], ['Αναμονή δεδομένων...', 'Waiting for data...'],
        ['ONLINE', 'ONLINE'], ['OFFLINE', 'OFFLINE'], ['LOCKED', 'LOCKED'], ['Advisor Offline', 'Advisor Offline'], ['αρχικοποιηση συστηματος', 'system initialization'],
        ['Δευτέρα','Monday'], ['Τρίτη','Tuesday'], ['Τετάρτη','Wednesday'], ['Πέμπτη','Thursday'], ['Παρασκευή','Friday'], ['Σάββατο','Saturday'], ['Κυριακή','Sunday'],
        ['ΔΕΥΤΕΡΑ','MONDAY'], ['ΤΡΙΤΗ','TUESDAY'], ['ΤΕΤΑΡΤΗ','WEDNESDAY'], ['ΠΕΜΠΤΗ','THURSDAY'], ['ΠΑΡΑΣΚΕΥΗ','FRIDAY'], ['ΣΑΒΒΑΤΟ','SATURDAY'], ['ΚΥΡΙΑΚΗ','SUNDAY']
    ];


    const phrasePairs = [
        ['ΣΥΝΕΡΓΑΤΗΣ:', 'PARTNER:'], ['ΑΠΕΝΕΡΓΟΣ', 'OFF'], ['ΕΝΕΡΓΟΣ', 'ON'],
        ['Συντήρηση (TDEE):', 'Maintenance (TDEE):'], ['M.O. Εβδομάδας:', 'Weekly Avg:'],
        ['ΗΧΟΣ:', 'SOUND:'], ['ΤΥΠΟΣ ΠΡΟΓΡΑΜΜΑΤΟΣ', 'PROGRAM TYPE'], ['ΣΥΓΧΡΟΝΙΣΜΟΣ', 'SYNC'],
        ['ΚΑΤΑΓΡΑΦΗ EMS', 'EMS LOG'], ['ΚΑΤΑΓΡΑΦΗ ΠΟΔΗΛΑΣΙΑΣ', 'CYCLING LOG'],
        ['ΧΙΛΙΟΜΕΤΡΑ', 'DISTANCE'], ['ΘΕΡΜΙΔΕΣ', 'CALORIES'], ['ΠΡΩΤΕΪΝΗ', 'PROTEIN'],
        ['ΑΠΟΘΗΚΕΥΣΗ', 'SAVE'], ['ΑΚΥΡΟ', 'CANCEL'], ['ΕΒΔΟΜΑΔΙΑΙΑ ΣΤΟΧΕΥΣΗ', 'WEEKLY TARGETING'],
        ['ΠΡΟΣΩΠΙΚΑ ΕΓΓΡΑΦΑ', 'PERSONAL DOCUMENTS'], ['ΣΤΟΙΧΕΙΑ ΟΧΗΜΑΤΟΣ', 'VEHICLE DETAILS'],
        ['ΗΜΕΡΟΜΗΝΙΕΣ & ΣΕΡΒΙΣ', 'DATES & SERVICE'], ['ΠΡΟΣΩΠΙΚΕΣ ΣΗΜΕΙΩΣΕΙΣ', 'PERSONAL NOTES']
    ];

    const exercisePairs = [
        ['Chest Press','Chest Press'], ['Chest Flys','Chest Flys'], ['Pushups','Pushups'], ['Lat Pulldowns','Lat Pulldowns'], ['Lat Pulldowns Close','Lat Pulldowns Close'],
        ['Seated Rows','Seated Rows'], ['Low Rows Seated','Low Rows Seated'], ['Bent Over Rows','Bent Over Rows'], ['Straight Arm Pulldowns','Straight Arm Pulldowns'],
        ['Upright Rows','Upright Rows'], ['Bicep Curls','Bicep Curls'], ['Standing Bicep Curls','Standing Bicep Curls'], ['Preacher Bicep Curls','Preacher Bicep Curls'],
        ['Tricep Pulldowns','Tricep Pulldowns'], ['Ab Crunches','Ab Crunches'], ['Situps','Situps'], ['Plank','Plank'], ['Reverse Crunch','Reverse Crunch'],
        ['Lying Knee Raise','Lying Knee Raise'], ['Leg Raise Hip Lift','Leg Raise Hip Lift'], ['Leg Extensions','Leg Extensions'], ['Cycling','Cycling'], ['Stretching','Stretching'], ['EMS Training','EMS Training']
    ];

    const lookup = new Map();
    exactPairs.forEach((pair) => {
        if (!Array.isArray(pair) || pair.length < 2) return;
        lookup.set(pair[0], pair);
        lookup.set(pair[1], pair);
    });

    const exerciseLookup = new Map();
    exercisePairs.forEach((pair) => {
        exerciseLookup.set(pair[0], pair);
        exerciseLookup.set(pair[1], pair);
    });

    function getLanguage() { return localStorage.getItem(LANG_KEY) || localStorage.getItem(LEGACY_LANG_KEY) || 'gr'; }
    function setLanguage(lang) {
        const safeLang = lang === 'en' ? 'en' : 'gr';
        localStorage.setItem(LANG_KEY, safeLang);
        localStorage.setItem(LEGACY_LANG_KEY, safeLang);
        applyLanguage();
    }

    function translatePairText(text, pair, lang) {
        return lang === 'en' ? pair[1] : pair[0];
    }

    function translateLoose(text, forcedLang) {
        const lang = forcedLang || getLanguage();
        const raw = String(text ?? '');
        const trimmed = raw.trim();
        if (!trimmed) return raw;

        const pair = lookup.get(trimmed);
        if (pair) return raw.replace(trimmed, translatePairText(trimmed, pair, lang));

        let translated = raw;
        phrasePairs.forEach((phrasePair) => {
            const from = lang === 'en' ? phrasePair[0] : phrasePair[1];
            const to = lang === 'en' ? phrasePair[1] : phrasePair[0];
            if (from && translated.includes(from)) translated = translated.split(from).join(to);
        });
        return translated;
    }

    function getExerciseDisplayName(name, forcedLang) {
        const lang = forcedLang || getLanguage();
        const raw = String(name ?? '').trim();
        const pair = exerciseLookup.get(raw);
        if (!pair) return raw;
        return lang === 'en' ? pair[1] : pair[0];
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
        if (el.dataset?.i18nKind === 'exercise' && el.dataset.i18nSource) {
            el.textContent = getExerciseDisplayName(el.dataset.i18nSource);
        }
    }

    function walkAndTranslate(root) {
        if (!root || !document.body) return;
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

    function updateLangButtons() {
        document.querySelectorAll('#btnLangToggle, .pegasus-lang-toggle').forEach(btn => {
            btn.textContent = getLanguage() === 'en' ? 'EN / GR' : 'GR / EN';
        });
    }

    function refreshViews() {
        try {
            window.refreshAllUI?.();
            window.updateFoodUI?.();
            window.renderFood?.();
            window.renderCalendar?.();
            window.renderAchievements?.();
            window.renderLiftingContent?.();
            window.updateSuppUI?.();
            window.PegasusInventory?.updateUI?.();
            window.PegasusInventoryPC?.updateUI?.();
            window.PegasusDiet?.updateUI?.();
            window.PegasusDiet?.renderDailyKouki?.();
            window.PegasusMobileUI?.render?.();
        } catch (e) {
            console.warn('PEGASUS I18N refresh warning', e);
        }
    }

    function applyLanguage() {
        try {
            document.documentElement.lang = getLanguage() === 'en' ? 'en' : 'el';
            walkAndTranslate(document.body);
            updateLangButtons();
            refreshViews();
            setTimeout(() => walkAndTranslate(document.body), 60);
        } catch (e) {
            console.warn('PEGASUS I18N apply warning', e);
        }
    }

    const observer = new MutationObserver(muts => {
        muts.forEach(m => {
            m.addedNodes.forEach(node => walkAndTranslate(node));
            if (m.type === 'characterData') translateTextNode(m.target);
        });
    });

    function toggleLanguage() { setLanguage(getLanguage() === 'en' ? 'gr' : 'en'); }

    window.PegasusI18n = { getLanguage, setLanguage, toggleLanguage, applyLanguage, translateLoose, getExerciseDisplayName };
    window.t = translateLoose;
    window.tr = translateLoose;
    window.getPegasusExerciseDisplayName = getExerciseDisplayName;
    window.translatePegasusUI = applyLanguage;
    window.setPegasusLanguage = setLanguage;
    window.togglePegasusLanguage = toggleLanguage;

    document.addEventListener('DOMContentLoaded', () => {
        updateLangButtons();
        applyLanguage();
        if (document.body) observer.observe(document.body, { childList: true, subtree: true, characterData: true });
        document.querySelectorAll('#btnLangToggle, .pegasus-lang-toggle').forEach(btn => {
            if (!btn.dataset.i18nBound) {
                btn.dataset.i18nBound = 'true';
                btn.addEventListener('click', () => toggleLanguage());
            }
        });
    });
})();
