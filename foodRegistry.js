
/* ==========================================================================
   PEGASUS FOOD REGISTRY - v1.0
   Protocol: Realistic Monthly Food Families + Slot-Aware Replacement Catalog
   ========================================================================== */
(function() {
    const FAMILIES = {
        eggs: { key: 'eggs', label: 'Αυγά', group: 'routine' },
        yogurt: { key: 'yogurt', label: 'Γιαούρτι', group: 'routine' },
        whey: { key: 'whey', label: 'Whey / Πρωτεΐνη', group: 'routine' },
        toast_bread: { key: 'toast_bread', label: 'Τοστ / Ψωμί ολικής', group: 'routine' },
        deli_protein: { key: 'deli_protein', label: 'Γαλοπούλα / άπαχη αλλαντική πρωτεΐνη', group: 'routine' },
        cottage_soft_cheese: { key: 'cottage_soft_cheese', label: 'Cottage / μαλακά τυριά', group: 'routine' },
        dairy_drinks: { key: 'dairy_drinks', label: 'Κεφίρ / γαλακτοκομικά ροφήματα', group: 'routine' },
        fruit: { key: 'fruit', label: 'Φρούτο', group: 'routine' },
        nuts: { key: 'nuts', label: 'Ξηροί καρποί', group: 'routine' },
        legumes: { key: 'legumes', label: 'Όσπρια', group: 'meal' },
        greens: { key: 'greens', label: 'Χόρτα / πράσινα', group: 'meal' },
        veg_meals: { key: 'veg_meals', label: 'Λαχανικά / λαδερά', group: 'meal' },
        fish_seafood: { key: 'fish_seafood', label: 'Ψάρι / θαλασσινά', group: 'meal' },
        meat_main: { key: 'meat_main', label: 'Κρέας / κοτόπουλο / κύρια πρωτεΐνη', group: 'meal' },
        outside_meals: { key: 'outside_meals', label: 'Γεύματα έξω / εύκολες λύσεις', group: 'outside' },
        oats_cereals: { key: 'oats_cereals', label: 'Βρώμη / δημητριακά', group: 'routine' },
        rice_cakes_crackers: { key: 'rice_cakes_crackers', label: 'Ρυζογκοφρέτες / κράκερ', group: 'routine' },
        cheese: { key: 'cheese', label: 'Τυρί', group: 'routine' },
        protein_pudding: { key: 'protein_pudding', label: 'Protein pudding', group: 'routine' },
        bakery_simple: { key: 'bakery_simple', label: 'Κουλούρι / αρτοσκεύασμα', group: 'outside' },
        sandwich_wrap: { key: 'sandwich_wrap', label: 'Σάντουιτς / wrap', group: 'outside' }
    };

    const ITEMS = [
        { name: '3 Αυγά', family: 'eggs', aliases: ['3 αυγα', 'αυγα', '2 αυγα', 'ομελετα', 'βραστα αυγα'], protein: 19, kcal: 210, budget: 'budget', ease: 5, slots: ['breakfast', 'dinner'], workSafe: false, homeSafe: true, odor: 'medium' },
        { name: 'Γιαούρτι 2%', family: 'yogurt', aliases: ['γιαουρτι', 'γιαουρτι 2', 'στραγγιστο γιαουρτι', 'protein yogurt', 'skyr'], protein: 20, kcal: 180, budget: 'budget', ease: 5, slots: ['breakfast', 'workmeal', 'dinner'], workSafe: true, homeSafe: true, odor: 'low' },
        { name: 'Whey', family: 'whey', aliases: ['whey', 'πρωτεινη', 'σκουπ πρωτεινη', 'protein shake'], protein: 24, kcal: 120, budget: 'standard', ease: 5, slots: ['breakfast', 'workmeal', 'dinner'], workSafe: true, homeSafe: true, odor: 'low' },
        { name: 'Τοστ ολικής', family: 'toast_bread', aliases: ['τοστ', 'τοστ ολικης', 'ψωμι ολικης', 'σαντουιτς ολικης', 'bagel ολικης'], protein: 22, kcal: 380, budget: 'budget', ease: 5, slots: ['breakfast', 'workmeal', 'dinner'], workSafe: true, homeSafe: true, odor: 'low' },
        { name: 'Γαλοπούλα φέτες', family: 'deli_protein', aliases: ['γαλοπουλα', 'γαλοπουλα φετες', 'απαχη γαλοπουλα'], protein: 18, kcal: 120, budget: 'budget', ease: 5, slots: ['breakfast', 'workmeal', 'dinner'], workSafe: true, homeSafe: true, odor: 'low' },
        { name: 'Cottage / ανθότυρο', family: 'cottage_soft_cheese', aliases: ['cottage', 'ανθοτυρο', 'μαλακο τυρι', 'τυρι υψηλης πρωτεινης'], protein: 20, kcal: 190, budget: 'standard', ease: 4, slots: ['breakfast', 'workmeal', 'dinner'], workSafe: true, homeSafe: true, odor: 'low' },
        { name: 'Κεφίρ', family: 'dairy_drinks', aliases: ['κεφιρ', 'protein drink', 'γαλακτοκομικο ροφημα'], protein: 15, kcal: 170, budget: 'standard', ease: 5, slots: ['breakfast', 'workmeal', 'dinner'], workSafe: true, homeSafe: true, odor: 'low' },
        { name: 'Μπανάνα', family: 'fruit', aliases: ['μπανανα', 'μηλο', 'πορτοκαλι', 'αχλαδι', 'ακτινιδιο', 'μανταρινι', 'σταφυλι', 'ροδακινο', 'φρουτο'], protein: 1, kcal: 90, budget: 'budget', ease: 5, slots: ['fruit', 'breakfast', 'workmeal'], workSafe: true, homeSafe: true, odor: 'low' },
        { name: 'Αμύγδαλα / ξηροί καρποί', family: 'nuts', aliases: ['αμυγδαλα', 'καρυδια', 'φουντουκια', 'ξηροι καρποι'], protein: 6, kcal: 180, budget: 'standard', ease: 5, slots: ['workmeal', 'dinner'], workSafe: true, homeSafe: true, odor: 'low' },
        { name: 'Ρεβύθια / όσπρια', family: 'legumes', aliases: ['ρεβυθι', 'ρεβυθια', 'φακες', 'φασολια', 'γιγαντες', 'φακολαδα', 'οσπρια'], protein: 18, kcal: 420, budget: 'budget', ease: 4, slots: ['kouki', 'dinner'], workSafe: false, homeSafe: true, odor: 'low' },
        { name: 'Χόρτα / πράσινα', family: 'greens', aliases: ['χορτα', 'σπανακι', 'ροκα', 'μαρουλι', 'πρασινη σαλατα', 'μπροκολο'], protein: 5, kcal: 120, budget: 'budget', ease: 4, slots: ['kouki', 'dinner'], workSafe: false, homeSafe: true, odor: 'low' },
        { name: 'Λαδερά / λαχανικά', family: 'veg_meals', aliases: ['φασολακια', 'μπαμιες', 'αρακας', 'μπριαμ', 'γεμιστα', 'λαδερα', 'λαχανικα'], protein: 10, kcal: 300, budget: 'budget', ease: 4, slots: ['kouki', 'dinner'], workSafe: false, homeSafe: true, odor: 'low' },
        { name: 'Ψάρι / θαλασσινά', family: 'fish_seafood', aliases: ['ψαρι', 'θαλασσινα', 'σουπιες', 'γαριδες', 'τονος', 'σολομος', 'μπακαλιαρος', 'περκα'], protein: 28, kcal: 320, budget: 'standard', ease: 3, slots: ['kouki', 'dinner'], workSafe: false, homeSafe: true, odor: 'high' },
        { name: 'Κρέας / κοτόπουλο', family: 'meat_main', aliases: ['κοτοπουλο', 'κρεας', 'κιμας', 'μοσχαρι', 'γυρος κοτοπουλο', 'γυρος χοιρινο'], protein: 30, kcal: 380, budget: 'standard', ease: 3, slots: ['kouki', 'dinner'], workSafe: false, homeSafe: true, odor: 'medium' },
        { name: 'Γεύματα έξω', family: 'outside_meals', aliases: ['πιτα γυρο', 'κρεπα', 'πιτσα', 'σαντουις', 'σουβλακια', 'burger', 'σφολιατα', 'delivery'], protein: 22, kcal: 550, budget: 'standard', ease: 5, slots: ['outside'], workSafe: true, homeSafe: true, odor: 'medium' }
    ];

    const SLOT_CANDIDATES = {
        breakfast: [
            { name: 'Αυγά', family: 'eggs', protein: 19, kcal: 210, budget: 'budget', ease: 5, workSafe: false, homeSafe: true, odor: 'medium' },
            { name: 'Γιαούρτι', family: 'yogurt', protein: 20, kcal: 180, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Whey', family: 'whey', protein: 24, kcal: 120, budget: 'standard', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Τοστ / ψωμί ολικής', family: 'toast_bread', protein: 22, kcal: 380, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Γαλοπούλα', family: 'deli_protein', protein: 18, kcal: 120, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Cottage / ανθότυρο', family: 'cottage_soft_cheese', protein: 20, kcal: 190, budget: 'standard', ease: 4, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Κεφίρ', family: 'dairy_drinks', protein: 15, kcal: 170, budget: 'standard', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Φρούτο', family: 'fruit', protein: 1, kcal: 80, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Ξηροί καρποί', family: 'nuts', protein: 6, kcal: 180, budget: 'standard', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Βρώμη / δημητριακά', family: 'oats_cereals', protein: 10, kcal: 260, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Ρυζογκοφρέτες / κράκερ', family: 'rice_cakes_crackers', protein: 4, kcal: 150, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Τυρί', family: 'cheese', protein: 14, kcal: 220, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Protein pudding', family: 'protein_pudding', protein: 20, kcal: 150, budget: 'standard', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Κουλούρι / αρτοσκεύασμα', family: 'bakery_simple', protein: 10, kcal: 280, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Σάντουιτς / wrap', family: 'sandwich_wrap', protein: 20, kcal: 420, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Κρέας / κοτόπουλο', family: 'meat_main', protein: 28, kcal: 330, budget: 'standard', ease: 3, workSafe: false, homeSafe: true, odor: 'medium' }
        ],
        protein: [
            { name: 'Whey', family: 'whey', protein: 24, kcal: 120, budget: 'standard', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Γιαούρτι', family: 'yogurt', protein: 20, kcal: 180, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Cottage / ανθότυρο', family: 'cottage_soft_cheese', protein: 20, kcal: 190, budget: 'standard', ease: 4, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Κεφίρ', family: 'dairy_drinks', protein: 15, kcal: 170, budget: 'standard', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Γαλοπούλα', family: 'deli_protein', protein: 18, kcal: 120, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Αυγά', family: 'eggs', protein: 19, kcal: 210, budget: 'budget', ease: 5, workSafe: false, homeSafe: true, odor: 'medium' },
            { name: 'Protein pudding', family: 'protein_pudding', protein: 20, kcal: 150, budget: 'standard', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Τυρί', family: 'cheese', protein: 14, kcal: 220, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Τοστ / ψωμί ολικής', family: 'toast_bread', protein: 22, kcal: 380, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Ρυζογκοφρέτες / κράκερ', family: 'rice_cakes_crackers', protein: 4, kcal: 150, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Βρώμη / δημητριακά', family: 'oats_cereals', protein: 10, kcal: 260, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Ξηροί καρποί', family: 'nuts', protein: 6, kcal: 180, budget: 'standard', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Κρέας / κοτόπουλο', family: 'meat_main', protein: 28, kcal: 330, budget: 'standard', ease: 3, workSafe: false, homeSafe: true, odor: 'medium' },
            { name: 'Ψάρι / θαλασσινά', family: 'fish_seafood', protein: 28, kcal: 320, budget: 'standard', ease: 3, workSafe: false, homeSafe: true, odor: 'high' },
            { name: 'Όσπρια / ρεβύθι', family: 'legumes', protein: 18, kcal: 420, budget: 'budget', ease: 4, workSafe: false, homeSafe: true, odor: 'low' },
            { name: 'Σάντουιτς / wrap', family: 'sandwich_wrap', protein: 20, kcal: 420, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' }
        ],
        workmeal: [
            { name: 'Τοστ / ψωμί ολικής', family: 'toast_bread', protein: 22, kcal: 380, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Γαλοπούλα', family: 'deli_protein', protein: 18, kcal: 120, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Γιαούρτι', family: 'yogurt', protein: 20, kcal: 180, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Cottage / ανθότυρο', family: 'cottage_soft_cheese', protein: 20, kcal: 190, budget: 'standard', ease: 4, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Κεφίρ', family: 'dairy_drinks', protein: 15, kcal: 170, budget: 'standard', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Whey', family: 'whey', protein: 24, kcal: 120, budget: 'standard', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Φρούτο', family: 'fruit', protein: 1, kcal: 80, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Ξηροί καρποί', family: 'nuts', protein: 6, kcal: 180, budget: 'standard', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Βρώμη / δημητριακά', family: 'oats_cereals', protein: 10, kcal: 260, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Ρυζογκοφρέτες / κράκερ', family: 'rice_cakes_crackers', protein: 4, kcal: 150, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Τυρί', family: 'cheese', protein: 14, kcal: 220, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Protein pudding', family: 'protein_pudding', protein: 20, kcal: 150, budget: 'standard', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Κουλούρι / αρτοσκεύασμα', family: 'bakery_simple', protein: 10, kcal: 280, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Σάντουιτς / wrap', family: 'sandwich_wrap', protein: 20, kcal: 420, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Κρέας / κοτόπουλο', family: 'meat_main', protein: 28, kcal: 330, budget: 'standard', ease: 4, workSafe: true, homeSafe: true, odor: 'medium' },
            { name: 'Όσπρια / ρεβύθι', family: 'legumes', protein: 18, kcal: 420, budget: 'budget', ease: 4, workSafe: true, homeSafe: true, odor: 'low' }
        ],
        fruit: [
            { name: 'Μήλο', family: 'fruit', protein: 0, kcal: 80, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Πορτοκάλι', family: 'fruit', protein: 1, kcal: 70, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Αχλάδι', family: 'fruit', protein: 1, kcal: 95, budget: 'budget', ease: 4, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Μανταρίνι', family: 'fruit', protein: 1, kcal: 55, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Ακτινίδιο', family: 'fruit', protein: 1, kcal: 60, budget: 'standard', ease: 4, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Ροδάκινο', family: 'fruit', protein: 1, kcal: 65, budget: 'budget', ease: 4, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Νεκταρίνι', family: 'fruit', protein: 1, kcal: 65, budget: 'budget', ease: 4, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Σταφύλι', family: 'fruit', protein: 1, kcal: 90, budget: 'standard', ease: 4, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Φράουλες', family: 'fruit', protein: 1, kcal: 50, budget: 'standard', ease: 4, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Κεράσια', family: 'fruit', protein: 1, kcal: 70, budget: 'standard', ease: 4, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Βερίκοκα', family: 'fruit', protein: 1, kcal: 55, budget: 'budget', ease: 4, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Δαμάσκηνα', family: 'fruit', protein: 1, kcal: 60, budget: 'budget', ease: 4, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Πεπόνι', family: 'fruit', protein: 1, kcal: 50, budget: 'budget', ease: 4, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Καρπούζι', family: 'fruit', protein: 1, kcal: 45, budget: 'budget', ease: 4, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Μπανάνα', family: 'fruit', protein: 1, kcal: 90, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' }
        ],
        dinner: [
            { name: 'Γιαούρτι', family: 'yogurt', protein: 20, kcal: 180, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Cottage / ανθότυρο', family: 'cottage_soft_cheese', protein: 20, kcal: 190, budget: 'standard', ease: 4, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Κεφίρ', family: 'dairy_drinks', protein: 15, kcal: 170, budget: 'standard', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Γαλοπούλα', family: 'deli_protein', protein: 18, kcal: 120, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Αυγά', family: 'eggs', protein: 19, kcal: 210, budget: 'budget', ease: 5, workSafe: false, homeSafe: true, odor: 'medium' },
            { name: 'Ψάρι / θαλασσινά', family: 'fish_seafood', protein: 28, kcal: 320, budget: 'standard', ease: 3, workSafe: false, homeSafe: true, odor: 'high' },
            { name: 'Τοστ / ψωμί ολικής', family: 'toast_bread', protein: 22, kcal: 380, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Whey', family: 'whey', protein: 24, kcal: 120, budget: 'standard', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Κρέας / κοτόπουλο', family: 'meat_main', protein: 28, kcal: 330, budget: 'standard', ease: 3, workSafe: false, homeSafe: true, odor: 'medium' },
            { name: 'Όσπρια / ρεβύθι', family: 'legumes', protein: 18, kcal: 420, budget: 'budget', ease: 4, workSafe: false, homeSafe: true, odor: 'low' },
            { name: 'Χόρτα / πράσινα', family: 'greens', protein: 5, kcal: 120, budget: 'budget', ease: 4, workSafe: false, homeSafe: true, odor: 'low' },
            { name: 'Λαχανικά / λαδερά', family: 'veg_meals', protein: 10, kcal: 300, budget: 'budget', ease: 4, workSafe: false, homeSafe: true, odor: 'low' },
            { name: 'Ξηροί καρποί', family: 'nuts', protein: 6, kcal: 180, budget: 'standard', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Φρούτο', family: 'fruit', protein: 1, kcal: 80, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Τυρί', family: 'cheese', protein: 14, kcal: 220, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Protein pudding', family: 'protein_pudding', protein: 20, kcal: 150, budget: 'standard', ease: 5, workSafe: true, homeSafe: true, odor: 'low' }
        ],
        outside: [
            { name: 'Πίτα γύρο', family: 'outside_meals', protein: 24, kcal: 520, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'medium' },
            { name: 'Κρέπα', family: 'outside_meals', protein: 20, kcal: 600, budget: 'standard', ease: 5, workSafe: true, homeSafe: true, odor: 'medium' },
            { name: 'Πίτσα', family: 'outside_meals', protein: 22, kcal: 650, budget: 'standard', ease: 5, workSafe: true, homeSafe: true, odor: 'medium' },
            { name: 'Σάντουιτς', family: 'outside_meals', protein: 20, kcal: 450, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Σουβλάκια', family: 'outside_meals', protein: 30, kcal: 620, budget: 'standard', ease: 5, workSafe: true, homeSafe: true, odor: 'medium' },
            { name: 'Burger', family: 'outside_meals', protein: 28, kcal: 700, budget: 'standard', ease: 5, workSafe: true, homeSafe: true, odor: 'medium' },
            { name: 'Club sandwich', family: 'outside_meals', protein: 24, kcal: 680, budget: 'standard', ease: 5, workSafe: true, homeSafe: true, odor: 'medium' },
            { name: 'Σφολιάτα', family: 'outside_meals', protein: 14, kcal: 450, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'medium' },
            { name: 'Τυρόπιτα', family: 'outside_meals', protein: 14, kcal: 420, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'medium' },
            { name: 'Κουλούρι + γαλοπούλα', family: 'outside_meals', protein: 18, kcal: 360, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Wrap', family: 'outside_meals', protein: 22, kcal: 480, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'low' },
            { name: 'Burrito', family: 'outside_meals', protein: 24, kcal: 620, budget: 'standard', ease: 5, workSafe: true, homeSafe: true, odor: 'medium' },
            { name: 'Hot dog', family: 'outside_meals', protein: 16, kcal: 430, budget: 'budget', ease: 5, workSafe: true, homeSafe: true, odor: 'medium' },
            { name: 'Pasta take-away', family: 'outside_meals', protein: 18, kcal: 590, budget: 'standard', ease: 5, workSafe: true, homeSafe: true, odor: 'medium' },
            { name: 'Rice bowl', family: 'outside_meals', protein: 22, kcal: 540, budget: 'standard', ease: 5, workSafe: true, homeSafe: true, odor: 'low' }
        ]
    };

    function normalize(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/\([^)]*\)/g, ' ')
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function familyLabel(key) {
        return FAMILIES[key]?.label || key;
    }

    function matchItem(name) {
        const key = normalize(name);
        let best = null;
        let bestLen = 0;
        for (const item of ITEMS) {
            for (const alias of item.aliases || []) {
                const norm = normalize(alias);
                if (!norm) continue;
                if ((key === norm || key.includes(norm)) && norm.length > bestLen) {
                    best = item;
                    bestLen = norm.length;
                }
            }
        }
        return best;
    }

    function getDayMode() {
        const d = new Date().getDay();
        return (d === 1 || d === 4) ? 'recovery' : 'training';
    }

    function scoreCandidate(candidate, baseProtein, ctx = {}) {
        const proteinDiff = Math.abs((candidate.protein || 0) - (baseProtein || 0));
        let score = 100 - proteinDiff * 3;
        score += candidate.budget === 'budget' ? 18 : 10;
        score += (candidate.ease || 0) * 4;
        if (ctx.environment === 'work') {
            score += candidate.workSafe ? 18 : -30;
            score += candidate.odor === 'low' ? 10 : (candidate.odor === 'medium' ? -6 : -24);
        } else {
            score += candidate.homeSafe ? 8 : 0;
        }
        if (ctx.dayMode === 'recovery') {
            score += (candidate.protein || 0) >= 15 ? 10 : 0;
            score -= Math.max(0, (candidate.kcal || 0) - 260) * 0.08;
        }
        if (ctx.targetFamily && candidate.family === ctx.targetFamily && ctx.allowSameFamily !== true) {
            score -= 220;
        }
        return score;
    }

    window.PegasusFoodRegistry = {
        version: 'v1.3',
        families: FAMILIES,
        items: ITEMS,
        slotCandidates: SLOT_CANDIDATES,
        normalize,
        familyLabel,
        matchItem,
        getDayMode,
        getCandidates(slotKey, baseProtein, ctx = {}) {
            return (SLOT_CANDIDATES[slotKey] || [])
                .filter(item => !(ctx.targetFamily && ctx.allowSameFamily !== true && slotKey !== 'fruit' && item.family === ctx.targetFamily))
                .map(item => ({ ...item, score: scoreCandidate(item, baseProtein, ctx) }))
                .sort((a, b) => b.score - a.score);
        }
    };
})();
