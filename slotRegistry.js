/* ==========================================================================
   PEGASUS SLOT REGISTRY - v1.0
   Protocol: Shared Meal-Slot Identity for Daily + Weekly Nutrition Logic
   ========================================================================== */
(function() {
    const SLOTS = {
        breakfast_main: {
            label: 'Πρωινό βάσης',
            time: '07:00',
            environment: 'home',
            candidatePool: 'breakfast',
            defaultFamily: 'eggs',
            allowedFamilies: ['eggs', 'yogurt', 'cottage_soft_cheese', 'dairy_drinks', 'deli_protein', 'toast_bread', 'whey']
        },
        breakfast_protein: {
            label: 'Πρωινό protein slot',
            time: '08:00',
            environment: 'home',
            candidatePool: 'protein',
            defaultFamily: 'whey',
            allowedFamilies: ['whey', 'yogurt', 'cottage_soft_cheese', 'dairy_drinks', 'deli_protein', 'eggs']
        },
        work_meal: {
            label: 'Γεύμα δουλειάς',
            time: '12:00',
            environment: 'work',
            candidatePool: 'workmeal',
            defaultFamily: 'toast_bread',
            allowedFamilies: ['toast_bread', 'yogurt', 'cottage_soft_cheese', 'dairy_drinks', 'deli_protein', 'fruit']
        },
        fruit_slot: {
            label: 'Fruit slot',
            time: '14:00',
            environment: 'work',
            candidatePool: 'fruit',
            defaultFamily: 'fruit',
            allowedFamilies: ['fruit']
        },
        kouki_main: {
            label: 'Κύριο Κούκι γεύμα',
            time: '18:00',
            environment: 'home',
            candidatePool: null,
            defaultFamily: 'meat_main',
            allowedFamilies: ['legumes', 'greens', 'veg_meals', 'fish_seafood', 'meat_main']
        },
        night_meal: {
            label: 'Βραδινό slot',
            time: '22:30',
            environment: 'home',
            candidatePool: 'protein',
            defaultFamily: 'yogurt',
            allowedFamilies: ['yogurt', 'cottage_soft_cheese', 'dairy_drinks', 'deli_protein', 'eggs', 'fish_seafood', 'toast_bread']
        }
    };

    window.PegasusSlotRegistry = {
        version: 'v1.1',
        slots: SLOTS,
        getAll() { return SLOTS; },
        get(key) { return SLOTS[key] || null; },
        count() { return Object.keys(SLOTS).length; }
    };
})();