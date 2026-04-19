/* ==========================================================================
   PEGASUS I18N - v2.0
   Protocol: GR / EN Runtime Translation Layer + Display Dictionaries
   ========================================================================== */

(function() {
    const LANG_KEY = 'pegasus_language';
    const LEGACY_LANG_KEY = 'pegasus_lang';

    const EXACT_PAIRS = [
        ['Προθέρμανση', 'Warmup'], ['Έναρξη', 'Start'], ['Παύση', 'Pause'], ['Συνέχεια', 'Continue'], ['Επόμενο', 'Next'],
        ['Ημερολόγιο', 'Calendar'], ['Επιτεύγματα', 'Achievements'], ['Διατροφή', 'Nutrition'], ['ΠΡΟΕΠΙΣΚΟΠΗΣΗ', 'PREVIEW'],
        ['Ρυθμίσεις', 'Settings'], ['⚙️ ΕΡΓΑΛΕΙΑ', '⚙️ TOOLS'], ['🌐 GR / EN', '🌐 GR / EN'], ['ΕΡΓΑΛΕΙΑ PEGASUS', 'PEGASUS TOOLS'],
        ['ΣΥΝΕΡΓΑΤΗΣ: ΑΠΕΝΕΡΓΟΣ', 'PARTNER: OFF'], ['📅 ΤΥΠΟΣ ΠΡΟΓΡΑΜΜΑΤΟΣ', '📅 PROGRAM TYPE'], ['🔊 ΗΧΟΣ: ΕΝΕΡΓΟΣ', '🔊 SOUND: ON'],
        ['🔇 ΗΧΟΣ: ΣΙΓΑΣΗ', '🔇 SOUND: MUTE'], ['🚀 TURBO: ΕΝΕΡΓΟ', '🚀 TURBO: ON'], ['🚀 TURBO: ΑΝΕΝΕΡΓΟ', '🚀 TURBO: OFF'],
        ['💾 ΑΠΟΘΗΚΕΥΣΗ ΑΡΧΕΙΟΥ', '💾 EXPORT FILE'], ['📂 ΦΟΡΤΩΣΗ ΑΡΧΕΙΟΥ', '📂 IMPORT FILE'], ['🔐 ΣΥΓΧΡΟΝΙΣΜΟΣ', '🔐 SYNC'],
        ['🖼️ ΓΚΑΛΕΡΙ ΠΡΟΟΔΟΥ', '🖼️ PROGRESS GALLERY'], ['⚡ ΚΑΤΑΓΡΑΦΗ EMS', '⚡ EMS LOG'], ['🔍 ΕΛΕΓΧΟΣ PEGASUS', '🔍 PEGASUS AUDIT'],
        ['ΣΥΣΤΗΜΑ ΣΥΝΕΡΓΑΤΗ', 'PARTNER SYSTEM'], ['Όνομα συνεργάτη...', 'Partner name...'],
        ['Προπονήσεις:', 'Workouts:'], ['KCAL ΠΡΟΠΟΝΗΣΗΣ', 'WORKOUT KCAL'], ['ΣΤΟΧΟΣ ΗΜΕΡΑΣ (KCAL)', 'DAILY TARGET (KCAL)'],
        ['ΠΡΟΕΤΟΙΜΑΣΙΑ', 'PREP'], ['ΑΣΚΗΣΗ', 'WORK'], ['ΔΙΑΛΕΙΜΜΑ', 'REST'], ['ΟΛΟΚΛΗΡΩΣΗ & ΤΟΠΙΚΗ ΑΠΟΘΗΚΕΥΣΗ...', 'FINISHING & LOCAL SAVE...'],
        ['ΑΠΟΘΕΡΑΠΕΙΑ: STRETCHING', 'COOLDOWN: STRETCHING'], ['Η ΠΡΟΠΟΝΗΣΗ ΟΛΟΚΛΗΡΩΘΗΚΕ ΕΠΙΤΥΧΩΣ', 'WORKOUT COMPLETED SUCCESSFULLY'],
        ['ΓΚΑΛΕΡΙ ΠΡΟΟΔΟΥ', 'PROGRESS GALLERY'], ['ΗΜΕΡΟΛΟΓΙΟ PEGASUS', 'PEGASUS CALENDAR'], ['ΡΥΘΜΙΣΕΙΣ PEGASUS', 'PEGASUS SETTINGS'],
        ['Βάρος (kg)', 'Weight (kg)'], ['Ύψος (cm)', 'Height (cm)'], ['Ηλικία', 'Age'], ['Φύλο', 'Gender'], ['Άνδρας', 'Male'], ['Γυναίκα', 'Female'],
        ['Στόχος Kcal', 'Kcal Goal'], ['Πρωτεΐνη (g)', 'Protein (g)'], ['WEEKLY SET TARGETS', 'WEEKLY SET TARGETS'],
        ['Στήθος', 'Chest'], ['Πλάτη', 'Back'], ['Πόδια', 'Legs'], ['Χέρια', 'Arms'], ['Ώμοι', 'Shoulders'], ['Κορμός', 'Core'], ['Άλλο', 'Other'],
        ['ΑΠΟΘΗΚΕΥΣΗ', 'SAVE'], ['ΑΚΥΡΟ', 'CANCEL'], ['Ημερολόγιο Διατροφής', 'Nutrition Log'], ['ΘΕΡΜΙΔΕΣ', 'CALORIES'], ['ΠΡΩΤΕΪΝΗ', 'PROTEIN'],
        ['ΥΠΟΛΟΙΠΟ', 'REMAINING'], ['ΓΕΥΜΑΤΑ', 'MEALS'], ['Φαγητό', 'Food'], ['Σήμερα', 'Today'], ['Συχνές Επιλογές', 'Frequent Choices'],
        ['🔍 Αναζήτηση...', '🔍 Search...'], ['ΜΕΝΟΥ ΚΟΥΚΙ', 'KOUKI MENU'], ['ΕΠΙΣΚΟΠΗΣΗ & ΠΡΟΟΔΟΣ', 'PREVIEW & PROGRESS'],
        ['ΑΣΚΗΣΕΙΣ ΗΜΕΡΑΣ', "TODAY'S EXERCISES"], ['ΚΑΤΑΓΡΑΦΗ ΠΟΔΗΛΑΣΙΑΣ', 'CYCLING LOG'], ['ΧΙΛΙΟΜΕΤΡΑ (KM):', 'DISTANCE (KM):'],
        ['ΘΕΡΜΙΔΕΣ (KCAL):', 'CALORIES (KCAL):'], ['ΗΜΕΡΟΜΗΝΙΑ ΤΕΤΑΡΤΗΣ:', 'WEDNESDAY DATE:'], ['ΜΕΣΗ ΕΝΤΑΣΗ (AVG %):', 'AVERAGE INTENSITY (AVG %):'],
        ['ΘΕΡΜΙΔΕΣ (e-Kcal):', 'CALORIES (e-Kcal):'], ['Επιλογη Προγραμματοσ', 'Choose Program'], ['5 Ημέρες Βάρη', '5 Days Weights'],
        ['Βάρη + IMS Τετάρτη', 'Weights + IMS Wednesday'], ['Βάρη + Ποδήλατο ΣΚ', 'Weights + Weekend Bike'], ['Βάρη + ems + ποδήλατο', 'Weights + EMS + Bike'],
        ['ΑΣΦΑΛΗΣ ΤΑΥΤΟΠΟΙΗΣΗ', 'SECURE AUTHENTICATION'], ['ΑΠΑΣΦΑΛΙΣΗ ΣΥΣΤΗΜΑΤΟΣ', 'UNLOCK SYSTEM'], ['ΕΠΙΣΤΡΟΦΗ / ΑΚΥΡΟ', 'BACK / CANCEL'],
        ['OFFLINE MODE', 'OFFLINE MODE'], ['ΛΕΙΤΟΥΡΓΙΑ OFFLINE', 'OFFLINE MODE'], ['ΑΠΑΣΦΑΛΙΣΗ', 'UNLOCK'], ['ΣΥΣΤΗΜΑ ΕΤΟΙΜΟ', 'SYSTEM READY'],
        ['ΣΥΓΧΡΟΝΙΣΜΟΣ...', 'SYNCING...'], ['ΣΦΑΛΜΑ SYNC', 'SYNC ERROR'], ['ΛΑΘΟΣ PIN', 'WRONG PIN'], ['Αερόβια', 'Cardio'], ['Γεύματα', 'Meals'],
        ['Στόχοι', 'Targets'], ['Έγγραφα', 'Documents'], ['Όχημα', 'Vehicle'], ['Σημειώσεις', 'Notes'], ['ΑΠΟΘΕΜΑ ΣΥΜΠΛΗΡΩΜΑΤΩΝ', 'SUPPLEMENT STOCK'],
        ['ΠΡΩΤΕΪΝΗ WHEY', 'WHEY PROTEIN'], ['ΚΡΕΑΤΙΝΗ', 'CREATINE'], ['ΑΝΑΠΛΗΡΩΣΗ', 'REFILL'], ['ΡΥΘΜΙΣΕΙΣ & ΒΑΡΟΣ', 'SETTINGS & WEIGHT'],
        ['ΛΗΨΗ BACKUP', 'DOWNLOAD BACKUP'], ['ΕΠΑΝΑΦΟΡΑ DATA', 'RESTORE DATA'], ['ΓΕΝΙΚΟ RESET ΣΥΣΤΗΜΑΤΟΣ', 'FULL SYSTEM RESET'],
        ['Maintenance (TDEE): -- kcal', 'Maintenance (TDEE): -- kcal'], ['M.O. Εβδομάδας: -- kg', 'Weekly Avg: -- kg'], ['Αναμονή δεδομένων...', 'Waiting for data...'],
        ['ONLINE', 'ONLINE'], ['OFFLINE', 'OFFLINE'], ['LOCKED', 'LOCKED'], ['Advisor Offline', 'Advisor Offline'],
        ['αρχικοποιηση συστηματος', 'system initialization'], ['ΣΩΣΕ', 'SAVE'], ['ΔΗΜΙΟΥΡΓΙΑ ΝΕΟΥ ΑΠΟΘΕΜΑΤΟΣ', 'CREATE NEW STOCK'],
        ['+ ΝΕΟ ΠΡΟΪΟΝ', '+ NEW PRODUCT'], ['Χ ΚΛΕΙΣΙΜΟ', 'X CLOSE'], ['ΑΠΟΘΗΚΕΥΣΗ ΣΤΗ ΒΑΣΗ', 'SAVE TO DATABASE'],
        ['ΟΙΚΟΝΟΜΙΚΗ ΔΙΑΧΕΙΡΙΣΗ', 'FINANCIAL TRACKING'], ['ΤΡΕΧΟΝ ΥΠΟΛΟΙΠΟ', 'CURRENT BALANCE'], ['ΠΕΡΙΓΡΑΦΗ ΣΥΝΑΛΛΑΓΗΣ', 'TRANSACTION DESCRIPTION'],
        ['ΠΟΣΟ ΣΕ ΕΥΡΩ (€)', 'AMOUNT IN EURO (€)'], ['+ ΕΣΟΔΟ', '+ INCOME'], ['- ΕΞΟΔΟ', '- EXPENSE'], ['ΙΣΤΟΡΙΚΟ ΣΥΝΑΛΛΑΓΩΝ', 'TRANSACTION HISTORY'],
        ['ΚΑΜΙΑ ΚΑΤΑΓΡΑΦΗ', 'NO ENTRIES'], ['ΠΡΟΣΩΠΙΚΑ ΕΓΓΡΑΦΑ', 'PERSONAL DOCUMENTS'], ['ΣΤΟΙΧΕΙΑ ΟΧΗΜΑΤΟΣ', 'VEHICLE DETAILS'],
        ['ΠΡΟΣΩΠΙΚΕΣ ΣΗΜΕΙΩΣΕΙΣ', 'PERSONAL NOTES'], ['ΕΝΤΟΠΙΣΜΟΣ ΟΧΗΜΑΤΟΣ', 'VEHICLE LOCATION'], ['ΝΕΑ ΠΕΡΙΟΧΗ / ΘΕΣΗ', 'NEW AREA / LOCATION'],
        ['ΑΠΟΘΗΚΕΥΣΗ ΣΤΟ CLOUD', 'SAVE TO CLOUD'], ['ΠΡΟΣΦΑΤΕΣ ΠΕΡΙΟΧΕΣ (TOP 10)', 'RECENT AREAS (TOP 10)'], ['ΚΑΤΑΓΡΑΦΗ ΒΑΡΟΥΣ ΣΩΜΑΤΟΣ', 'BODY WEIGHT LOG'],
        ['ΕΝΗΜΕΡΩΣΗ', 'UPDATE'], ['ΔΙΑΧΕΙΡΙΣΗ ΔΕΔΟΜΕΝΩΝ (CLOUD / LOCAL)', 'DATA MANAGEMENT (CLOUD / LOCAL)'], ['ΗΜΕΡΗΣΙΟ ΜΕΝΟΥ (ΚΟΥΚΙ)', 'DAILY MENU (KOUKI)'],
        ['ΣΥΝΕΔΡΙΑ IMS / EMS', 'IMS / EMS SESSION'], ['ΕΒΔΟΜΑΔΙΑΙΑ ΣΤΟΧΕΥΣΗ', 'WEEKLY TARGETING'], ['ΠΙΝΑΚΙΔΑ', 'PLATE'], ['ΜΟΝΤΕΛΟ', 'MODEL'],
        ['VIN (ΠΛΑΙΣΙΟ)', 'VIN (CHASSIS)'], ['ΚΥΒΙΚΑ (cc)', 'ENGINE (cc)'], ['ΙΠΠΟΙ (hp)', 'HORSEPOWER (hp)'], ['ΛΗΞΗ ΑΣΦΑΛΕΙΑΣ', 'INSURANCE EXPIRY'],
        ['ΛΗΞΗ ΚΤΕΟ', 'KTEO EXPIRY'], ['ΕΠΟΜΕΝΟ SERVICE (KM)', 'NEXT SERVICE (KM)'], ['ΙΣΤΟΡΙΚΟ SERVICE', 'SERVICE HISTORY'],
        ['Εργασία (π.χ. Λάδια)', 'Task (e.g. Oil)'], ['Χιλιόμετρα', 'Kilometers'], ['Πληκτρολόγησε σημείωση...', 'Type note...'], ['ΠΡΟΣΘΗΚΗ ΣΗΜΕΙΩΣΗΣ', 'ADD NOTE'],
        ['Παρκινγκ: --', 'Parking: --'], ['ΠΑΡΚΙΝΓΚ: --', 'PARKING: --'], ['TACTICAL DATA INTERFACE', 'TACTICAL DATA INTERFACE'],
        ['Παρακαλώ επίλεξε πρώτα μια ημέρα!', 'Please select a day first!'], ['Σφάλμα: Το dietAdvisor.js δεν έχει φορτωθεί σωστά.', 'Error: dietAdvisor.js did not load correctly.'],
        ['Reporting Engine Offline', 'Reporting Engine Offline'], ['Δευτέρα', 'Monday'], ['Τρίτη', 'Tuesday'], ['Τετάρτη', 'Wednesday'], ['Πέμπτη', 'Thursday'],
        ['Παρασκευή', 'Friday'], ['Σάββατο', 'Saturday'], ['Κυριακή', 'Sunday'], ['ΔΕΥΤΕΡΑ', 'MONDAY'], ['ΤΡΙΤΗ', 'TUESDAY'], ['ΤΕΤΑΡΤΗ', 'WEDNESDAY'],
        ['ΠΕΜΠΤΗ', 'THURSDAY'], ['ΠΑΡΑΣΚΕΥΗ', 'FRIDAY'], ['ΣΑΒΒΑΤΟ', 'SATURDAY'], ['ΚΥΡΙΑΚΗ', 'SUNDAY'], ['Ημέρα Αποθεραπείας', 'Recovery Day'],
        ['Ολοκλήρωσε το πρώτο σου σετ!', 'Complete your first set!'], ['ΚΑΝΕΝΑ ΣΕΤ ΣΗΜΕΡΑ', 'NO SETS TODAY'], ['ΚΑΝΕΝΑ ΙΣΤΟΡΙΚΟ ΔΕΔΟΜΕΝΟ', 'NO HISTORICAL DATA'],
        ['ΔΕΝ ΕΧΕΙΣ ΟΡΙΣΕΙ ΔΡΑΣΤΗΡΙΟΤΗΤΕΣ', 'NO ACTIVITIES SET'], ['Η ΛΙΣΤΑ ΕΙΝΑΙ ΑΔΕΙΑ', 'THE LIST IS EMPTY'], ['Δεν υπάρχει καταγεγραμμένο ιστορικό.', 'No history recorded.'],
        ['Δεν υπάρχουν σημειώσεις.', 'No notes available.'], ['ΚΑΜΙΑ ΕΓΓΡΑΦΗ ΣΤΗ ΒΑΣΗ', 'NO ENTRY IN DATABASE'], ['ΔΕΝ ΒΡΕΘΗΚΑΝ ΑΠΟΤΕΛΕΣΜΑΤΑ', 'NO RESULTS FOUND'],
        ['Βάρη', 'Lifting'], ['Σώμα', 'Body'], ['Οικονομικά', 'Finance'], ['Δραστηριότητες', 'Missions'], ['Ταινίες', 'Movies'], ['Επαφές', 'Contacts'], ['Αποθέματα', 'Supplies'], ['(Κούκι)', '(Kouki)'], ['(Ρουτίνα)', '(Routine)'], ['σετ', 'sets'], ['set', 'set'], ['PEGASUS STRICT: Συμπλήρωσε έγκυρα Χιλιόμετρα και Θερμίδες.', 'PEGASUS STRICT: Enter valid Distance and Calories.'], ['ΣΦΑΛΜΑ: Συμπλήρωσε Άσκηση, Κιλά και Επαναλήψεις.', 'ERROR: Fill Exercise, Weight and Reps.'], ['Διαγραφή αυτού του σετ;', 'Delete this set?'], ['Οριστική διαγραφή αυτής της εργασίας;', 'Delete this task permanently?'], ['Οριστική διαγραφή συναλλαγής;', 'Delete this transaction permanently?'], ['ΣΦΑΛΜΑ: Συμπληρώστε έγκυρη περιγραφή και ποσό.', 'ERROR: Enter a valid description and amount.'], ['Οριστική διαγραφή αυτής της εγγραφής;', 'Delete this entry permanently?'], ['Οριστική διαγραφή αυτού του καθήκοντος;', 'Delete this task permanently?'], ['ΣΦΑΛΜΑ: Εισάγετε Περιγραφή και Συχνότητα (Ημέρες).', 'ERROR: Enter Description and Frequency (Days).'], ['ΣΦΑΛΜΑ: Εισάγετε τον τίτλο της ταινίας.', 'ERROR: Enter the movie title.'], ['Διαγραφή αυτής της ταινίας από τη βάση δεδομένων;', 'Delete this movie from the database?'], ['Τα στοιχεία αποθηκεύτηκαν επιτυχώς.', 'Details saved successfully.'], ['Διαγραφή σημείωσης;', 'Delete this note?'], ['Το PIN πρέπει να έχει τουλάχιστον 4 ψηφία.', 'PIN must have at least 4 digits.'], ['✅ Το Master PIN ορίστηκε επιτυχώς! Απομνημόνευσέ το.', '✅ Master PIN set successfully! Remember it.'], ['Επεξεργασία (Όνομα & Link):', 'Edit (Name & Link):'], ['Παρακαλώ εισάγετε τον τίτλο του στόχου.', 'Please enter the mission title.'], ['Παρακαλώ συμπληρώστε Όνομα, Σύνολο Αγοράς και Δόση Κατανάλωσης.', 'Please fill Name, Refill Amount and Portion.'], ['Σφάλμα κατά τον συγχρονισμό.', 'Sync error.'], ['Δεν υπάρχει καταγεγραμμένο ιστορικό.', 'No recorded history.'], ['❌ Μη έγκυρο αρχείο.', '❌ Invalid file.'], ['🚨 Επαναφορά δεδομένων;', '🚨 Restore data?'], ['🚨 ΠΡΟΣΟΧΗ: Διαγραφή Cache;', '🚨 WARNING: Delete cache?']
    ];

    const EXERCISE_PAIRS = [
        ['Πιέσεις Στήθους', 'Chest Press'], ['Ανοίγματα Στήθους', 'Chest Flys'], ['Κάμψεις', 'Pushups'], ['Έλξεις Τροχαλίας', 'Lat Pulldowns'],
        ['Κλειστή Τροχαλία Πλάτης', 'Lat Pulldowns Close'], ['Κωπηλατική Καθιστός', 'Seated Rows'], ['Χαμηλή Κωπηλατική', 'Low Rows Seated'],
        ['Σκυφτή Κωπηλατική', 'Bent Over Rows'], ['Τροχαλία Ίσια Χέρια', 'Straight Arm Pulldowns'], ['Όρθια Κωπηλατική', 'Upright Rows'],
        ['Κάμψεις Δικεφάλων', 'Bicep Curls'], ['Όρθιες Κάμψεις Δικεφάλων', 'Standing Bicep Curls'], ['Κάμψεις Δικεφάλων Preacher', 'Preacher Bicep Curls'],
        ['Εκτάσεις Τρικεφάλων', 'Tricep Pulldowns'], ['Κοιλιακοί Crunches', 'Ab Crunches'], ['Situps', 'Situps'], ['Σανίδα', 'Plank'],
        ['Ανάποδα Crunch', 'Reverse Crunch'], ['Άρσεις Γονάτων Ξαπλωτός', 'Lying Knee Raise'], ['Άρσεις Ποδιών & Λεκάνης', 'Leg Raise Hip Lift'],
        ['Εκτάσεις Ποδιών', 'Leg Extensions'], ['Ποδηλασία', 'Cycling'], ['Προπόνηση EMS', 'EMS Training'], ['Διατάσεις', 'Stretching'],
        ['Προθέρμανση', 'Warmup'], ['Κλειστή Έλξη', 'Close Grip Pulldown'], ['Έλξη Πίσω Από Τον Αυχένα', 'Behind the Neck Pulldown'], ['Ανάποδη Κωπηλατική', 'Reverse Row'],
        ['Κάμψεις Preacher', 'Preacher Curl'], ['Όρθια Κάμψη Δικεφάλων', 'Standing Bicep Curl'], ['Εκτάσεις Τρικεφάλων Πάνω Από Το Κεφάλι', 'Triceps Overhead Extension'],
        ['Πιέσεις Τρικεφάλων', 'Triceps Press'], ['Κοιλιακοί EMS', 'EMS Κοιλιακών'], ['Πλάτη EMS', 'EMS Πλάτης'], ['Πόδια EMS', 'EMS Ποδιών']
    ];

        const FOOD_PAIRS = [
        ['Γιαούρτι 2% + Whey (Ρουτίνα)', 'Yogurt 2% + Whey (Routine)'], ['3 Αυγά (Ρουτίνα)', '3 Eggs (Routine)'], ['Κρεατίνη 5g (Ρουτίνα)', 'Creatine 5g (Routine)'],
        ['Κοτόπουλο αλά κρεμ', 'Creamy Chicken'], ['Κοτόπουλο γλυκόξινο', 'Sweet & Sour Chicken'], ['Κοτόπουλο φούρνου', 'Baked Chicken'],
        ['Μοσχάρι κοκκινιστό', 'Beef in Tomato Sauce'], ['Μοσχάρι γιουβέτσι', 'Beef Giouvetsi'], ['Μακαρόνια με κιμά', 'Pasta with Minced Meat'],
        ['Μουσακάς', 'Moussaka'], ['Παστίτσιο', 'Pastitsio'], ['Κοτόσουπα', 'Chicken Soup'], ['Φασολάδα', 'Bean Soup'], ['Γίγαντες πλακί', 'Baked Giant Beans'],
        ['Μπάμιες με κοτόπουλο', 'Okra with Chicken'], ['Φασολάκια', 'Green Beans'], ['Μπακαλιάρος σκορδαλιά', 'Cod with Garlic Dip'], ['Μπιφτέκι μοσχαρίσιο', 'Beef Patty'],
        ['Μπριζόλα χοιρινή', 'Pork Chop'], ['Μπριζόλα μοσχαρίσια', 'Beef Steak'], ['Γεμιστά με ρύζι', 'Stuffed Vegetables with Rice'], ['Κανελόνια', 'Cannelloni'],
        ['Αρακάς', 'Peas'], ['Ρεβύθια πλακί', 'Baked Chickpeas'], ['Γεμιστά με κιμά', 'Stuffed Vegetables with Meat'], ['Κεφτεδάκια τηγανητά', 'Fried Meatballs'],
        ['Γιουβαρλάκια', 'Meatball Soup'], ['Σνίτσελ κοτόπουλο', 'Chicken Schnitzel'], ['Λαζάνια με κιμά', 'Lasagna with Minced Meat'], ['Μπιφτέκι κοτόπουλο', 'Chicken Patty'],
        ['Σολομός φούρνου', 'Baked Salmon'], ['Σουπιές με σπανάκι', 'Cuttlefish with Spinach'], ['Γαριδομακαρονάδα', 'Shrimp Pasta'], ['Παπουτσάκια', 'Stuffed Eggplants'],
        ['Σουτζουκάκια', 'Smyrna Meatballs'], ['Αρνί με πατάτες', 'Lamb with Potatoes'], ['Πέρκα φούρνου', 'Baked Perch'], ['Κοτόπουλο με κάρυ & λαχανικά', 'Chicken Curry & Vegetables'],
        ['Κοτόπουλο με χυλοπίτες', 'Chicken with Noodles'], ['Κοτόπουλο λεμονάτο', 'Lemon Chicken'], ['Χοιρινό με δαμάσκηνα & βερίκοκα', 'Pork with Prunes & Apricots'],
        ['Χοιρινό πρασοσέλινο', 'Pork with Leek & Celery'], ['Χοιρινό με σέλινο', 'Pork with Celery'], ['Μοσχαράκι κοκκινιστό', 'Braised Veal'], ['Μοσχαράκι λεμονάτο', 'Lemon Veal'],
        ['Μπιφτέκια μοσχαρίσια σχάρας', 'Grilled Beef Patties'], ['Σουτζουκάκια σμυρνέικα', 'Smyrna Sausages'], ['Γιουβαρλάκια αυγολέμονο', 'Egg-Lemon Meatball Soup'], ['Κεφτεδάκια με σάλτσα', 'Meatballs with Sauce'],
        ['Ρεβύθια με κάρυ & γάλα καρύδας', 'Chickpeas with Curry & Coconut Milk'], ['Ρεβύθια λεμονάτα με δεντρολίβανο', 'Lemon Chickpeas with Rosemary'], ['Ρεβύθια με σπανάκι', 'Chickpeas with Spinach'],
        ['Γίγαντες φούρνου', 'Baked Giant Beans'], ['Παστίτσιο λαχανικών', 'Vegetable Pastitsio'], ['Μελιτζάνες ιμάμ', 'Imam Eggplants'], ['Φασολάκια πράσινα', 'Green Beans'],
        ['Γεμιστά με ρύζι & μυρωδικά', 'Stuffed Vegetables with Rice & Herbs'], ['Μπριάμ', 'Briam'], ['Ψάρι φιλέτο (Γλώσσα) με λαχανικά', 'Sole Fillet with Vegetables'], ['Τσιπούρα ψητή', 'Grilled Sea Bream']
    ];

    const LOOKUP = new Map();
    [...EXACT_PAIRS, ...EXERCISE_PAIRS, ...FOOD_PAIRS].forEach(pair => {
        LOOKUP.set(pair[0], { gr: pair[0], en: pair[1] });
        LOOKUP.set(pair[1], { gr: pair[0], en: pair[1] });
    });

    const DYNAMIC_RULES = [
        { match: /^✅ Βάρος καταγράφηκε: ([\d.,]+) kg$/, en: '✅ Weight logged: $1 kg', gr: '✅ Βάρος καταγράφηκε: $1 kg' },
        { match: /^Workouts: (.+)$/, en: 'Workouts: $1', gr: 'Προπονήσεις: $1' },
        { match: /^Προπονήσεις: (.+)$/, en: 'Workouts: $1', gr: 'Προπονήσεις: $1' },
        { match: /^M\.O\. Εβδομάδας: (.+)$/, en: 'Weekly Avg: $1', gr: 'M.O. Εβδομάδας: $1' },
        { match: /^Weekly Avg: (.+)$/, en: 'Weekly Avg: $1', gr: 'M.O. Εβδομάδας: $1' },
        { match: /^✅ ΚΑΤΑΧΩΡΗΘΗΚΕ!\nΘερμίδες: (.+) kcal\nLeveling: \+18 σετ στα Πόδια\.$/, en: '✅ SAVED!\nCalories: $1 kcal\nLeveling: +18 sets to Legs.', gr: '✅ ΚΑΤΑΧΩΡΗΘΗΚΕ!\nΘερμίδες: $1 kcal\nLeveling: +18 σετ στα Πόδια.' },
        { match: /^⚡ PEGASUS SYNC: Πιστώθηκαν 36 σετ\.\nΚαύση: (.+) kcal\.\nΗ Τετάρτη ολοκληρώθηκε!$/, en: '⚡ PEGASUS SYNC: 36 sets credited.\nBurn: $1 kcal.\nWednesday completed!', gr: '⚡ PEGASUS SYNC: Πιστώθηκαν 36 σετ.\nΚαύση: $1 kcal.\nΗ Τετάρτη ολοκληρώθηκε!' },
        { match: /^Ημέρα Αποθεραπείας \(History: (.+)\)$/, en: 'Recovery Day (History: $1)', gr: 'Ημέρα Αποθεραπείας (History: $1)' },
        { match: /^Προπονήσεις: (\d+)$/, en: 'Workouts: $1', gr: 'Προπονήσεις: $1' },
        { match: /^PARTNER: OFF$/, en: 'PARTNER: OFF', gr: 'ΣΥΝΕΡΓΑΤΗΣ: ΑΠΕΝΕΡΓΟΣ' },
        { match: /^ΣΥΝΕΡΓΑΤΗΣ: (.+) \(ON\)$/, en: 'PARTNER: $1 (ON)', gr: 'ΣΥΝΕΡΓΑΤΗΣ: $1 (ON)' },
        { match: /^PARTNER: (.+) \(ON\)$/, en: 'PARTNER: $1 (ON)', gr: 'ΣΥΝΕΡΓΑΤΗΣ: $1 (ON)' },
        { match: /^Parking: (.+)$/, en: 'Parking: $1', gr: 'ΠΑΡΚΙΝΓΚ: $1' },
        { match: /^ΠΑΡΚΙΝΓΚ: (.+)$/, en: 'Parking: $1', gr: 'ΠΑΡΚΙΝΓΚ: $1' }
    ];

    function getLanguage() {
        return localStorage.getItem(LANG_KEY) || localStorage.getItem(LEGACY_LANG_KEY) || 'gr';
    }

    function setLanguage(lang) {
        const safeLang = lang === 'en' ? 'en' : 'gr';
        localStorage.setItem(LANG_KEY, safeLang);
        localStorage.setItem(LEGACY_LANG_KEY, safeLang);
        applyLanguage();
    }

    function translateExact(text, lang) {
        const entry = LOOKUP.get(String(text || '').trim());
        if (!entry) return text;
        const target = lang === 'en' ? entry.en : entry.gr;
        return String(text).replace(String(text).trim(), target);
    }

    function translateByContains(text, lang) {
        let out = String(text || '');
        const pairs = [...EXACT_PAIRS, ...EXERCISE_PAIRS, ...FOOD_PAIRS].sort((a, b) => b[0].length - a[0].length);
        pairs.forEach(([gr, en]) => {
            const from = lang === 'en' ? gr : en;
            const to = lang === 'en' ? en : gr;
            if (out.includes(from)) out = out.split(from).join(to);
        });
        return out;
    }

    function translateDynamic(text, lang) {
        for (const rule of DYNAMIC_RULES) {
            if (rule.match.test(text)) return text.replace(rule.match, lang === 'en' ? rule.en : rule.gr);
        }
        return text;
    }

    function translateLoose(text, forcedLang) {
        if (text == null) return text;
        const lang = forcedLang || getLanguage();
        let out = translateExact(String(text), lang);
        out = translateDynamic(out, lang);
        out = translateByContains(out, lang);
        return out;
    }

    function getDisplayText(value, kind, forcedLang) {
        const lang = forcedLang || getLanguage();
        const raw = String(value || '');
        if (!raw) return raw;
        return translateLoose(raw, lang);
    }

    function translateTextNode(node) {
        if (!node?.nodeValue) return;
        const parent = node.parentElement;
        if (!parent || ['SCRIPT', 'STYLE', 'TEXTAREA'].includes(parent.tagName)) return;
        if (parent.closest('[data-i18n-skip="true"]')) return;
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
            if (['button', 'submit', 'reset'].includes(type) && el.value) {
                const translated = translateLoose(el.value);
                if (translated !== el.value) el.value = translated;
            }
        }
        if (el.dataset?.i18nSource && el.dataset?.i18nKind) {
            const translated = getDisplayText(el.dataset.i18nSource, el.dataset.i18nKind);
            if (el.textContent !== translated) el.textContent = translated;
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

    function getLangButtons() {
        return Array.from(document.querySelectorAll('#btnLangToggle, #btnLangToggleMobile, .pegasus-lang-toggle'));
    }

    function updateLangButtons() {
        getLangButtons().forEach(btn => {
            btn.textContent = '🌐 GR / EN';
            btn.setAttribute('title', getLanguage() === 'en' ? 'Language' : 'Γλώσσα');
        });
    }

    function ensureMobileFallbackButton() {
        if (!window.PEGASUS_IS_MOBILE) return;
        if (document.getElementById('btnLangToggleMobile') || document.getElementById('btnLangToggle') || document.querySelector('.pegasus-lang-toggle')) return;
        const btn = document.createElement('button');
        btn.className = 'pegasus-lang-toggle p-btn';
        btn.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top, 0px) + 12px);right:14px;z-index:1000000;';
        btn.onclick = () => setLanguage(getLanguage() === 'en' ? 'gr' : 'en');
        document.body.appendChild(btn);
    }

    function bindLangButtons() {
        getLangButtons().forEach(btn => {
            if (btn.dataset.langBound === 'true') return;
            btn.dataset.langBound = 'true';
            btn.addEventListener('click', () => setLanguage(getLanguage() === 'en' ? 'gr' : 'en'));
        });
        updateLangButtons();
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
            window.PegasusInventoryPC?.updateUI?.();
            window.PegasusDiet?.updateUI?.();
            window.PegasusDiet?.renderDailyKouki?.();
            window.MuscleProgressUI?.render?.(true);
            if (document.getElementById('previewPanel')?.style.display === 'block') { window.openExercisePreview?.(); }
            window.PegasusMobileUI?.render?.();
        } catch (e) {
            console.warn('PEGASUS I18N refresh warning', e);
        }
    }

    function applyLanguage() {
        document.documentElement.lang = getLanguage() === 'en' ? 'en' : 'el';
        document.title = window.PEGASUS_IS_MOBILE ? 'Pegasus Mobile' : 'Pegasus Workout - Seemsfunny';
        ensureMobileFallbackButton();
        bindLangButtons();
        walkAndTranslate(document.body);
        refreshViews();
        setTimeout(() => walkAndTranslate(document.body), 50);
        setTimeout(() => walkAndTranslate(document.body), 250);
    }

    const observer = new MutationObserver(muts => {
        muts.forEach(m => {
            m.addedNodes.forEach(node => walkAndTranslate(node));
            if (m.type === 'characterData') translateTextNode(m.target);
        });
        bindLangButtons();
    });

    window.PegasusI18n = { getLanguage, setLanguage, applyLanguage, translateLoose, getDisplayText };
    window.translatePegasusUI = applyLanguage;
    window.t = translateLoose;
    window.tr = translateLoose;
    window.getPegasusDisplayText = getDisplayText;
    window.getPegasusExerciseDisplayName = function(name) { return getDisplayText(name, 'exercise'); };
    window.getPegasusFoodDisplayName = function(name) { return getDisplayText(name, 'food'); };

    document.addEventListener('DOMContentLoaded', () => {
        bindLangButtons();
        applyLanguage();
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    });
})();
