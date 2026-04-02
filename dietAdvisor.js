/* ==========================================================================
   PEGASUS SMART DIET ADVISOR - v2.0 (FULL MENU & ANALYTICS)
   Protocol: 14-Day Nutritional Gap Analysis & Kouki Price Integration
   ========================================================================== */

const KOUKI_MASTER_MENU = {
    "Monday": [
        {n:"Μουσακάς", p:6.00, t:"carb"}, {n:"Παστίτσιο", p:6.00, t:"carb"}, {n:"Μπακαλιάρος σκορδαλιά", p:6.50, t:"psari"},
        {n:"Κοτόσουπα", p:4.50, t:"soup"}, {n:"Μοσχάρι κοκκινιστό", p:6.50, t:"kreas"}, {n:"Μοσχάρι γιουβέτσι", p:6.50, t:"kreas"},
        {n:"Γεμιστά με ρύζι", p:5.00, t:"ladero"}, {n:"Φασολάδα", p:4.50, t:"ospro"}, {n:"Γίγαντες πλακί", p:6.00, t:"ospro"},
        {n:"Μπάμιες με κοτόπουλο", p:6.00, t:"poulika"}, {n:"Μακαρόνια με κιμά", p:5.50, t:"carb"}, {n:"Φασολάκια", p:4.50, t:"ladero"},
        {n:"Κοτόπουλο αλά κρεμ", p:6.00, t:"poulika"}, {n:"Κοτόπουλο γλυκόξινο", p:6.00, t:"poulika"}, {n:"Κοτόπουλο φούρνου", p:6.00, t:"poulika"},
        {n:"Μπριζόλα χοιρινή", p:6.00, t:"kreas"}, {n:"Μπριζόλα μοσχαρίσια", p:8.50, t:"kreas"}, {n:"Μπιφτέκι μοσχαρίσιο", p:6.00, t:"kreas"}, {n:"Μπριάμ", p:5.50, t:"ladero"}
    ],
    "Tuesday": [
        {n:"Ρεβύθια πλακί", p:5.00, t:"ospro"}, {n:"Κοντοσούβλι κοτόπουλο", p:6.00, t:"poulika"}, {n:"Μουσακάς", p:6.00, t:"carb"},
        {n:"Παστίτσιο", p:6.00, t:"carb"}, {n:"Κανελόνια", p:6.00, t:"carb"}, {n:"Αρακάς", p:4.50, t:"ladero"},
        {n:"Γεμιστά με κιμά", p:6.00, t:"kreas"}, {n:"Μοσχάρι κοκκινιστό", p:6.50, t:"kreas"}, {n:"Κεφτεδάκια τηγανητά", p:6.50, t:"kreas"},
        {n:"Γιουβαρλάκια", p:5.50, t:"kreas"}, {n:"Μακαρόνια με κιμά", p:5.50, t:"carb"}, {n:"Σνίτσελ κοτόπουλο", p:6.00, t:"poulika"},
        {n:"Κοτόπουλο αλά κρεμ", p:6.00, t:"poulika"}, {n:"Κοτόπουλο γλυκόξινο", p:6.00, t:"poulika"}, {n:"Κοτόπουλο φούρνου", p:6.00, t:"poulika"}
    ],
    "Wednesday": [
        {n:"Λαζάνια με κιμά", p:6.00, t:"carb"}, {n:"Μπιφτέκι κοτόπουλο", p:6.00, t:"poulika"}, {n:"Χταπόδι με κοφτό", p:7.00, t:"psari"},
        {n:"Σολομός φούρνου", p:8.00, t:"psari"}, {n:"Γίγαντες με χόρτα", p:6.00, t:"ospro"}, {n:"Μοσχάρι βραστό", p:6.00, t:"kreas"},
        {n:"Μουσακάς", p:6.00, t:"carb"}, {n:"Παστίτσιο", p:6.00, t:"carb"}, {n:"Γεμιστά με ρύζι", p:5.00, t:"ladero"},
        {n:"Μοσχάρι κοκκινιστό", p:6.50, t:"kreas"}, {n:"Μοσχάρι γιουβέτσι", p:6.50, t:"kreas"}, {n:"Κοτόπουλο φούρνου", p:6.00, t:"poulika"}
    ],
    "Thursday": [
        {n:"Σουπιές με σπανάκι", p:7.00, t:"psari"}, {n:"Μοσχάρι με μελιτζάνες", p:6.50, t:"kreas"}, {n:"Γαριδομακαρονάδα", p:6.50, t:"psari"},
        {n:"Κανελόνια", p:6.00, t:"carb"}, {n:"Κεφτεδάκια τηγανητά", p:6.50, t:"kreas"}, {n:"Γεμιστά με κιμά", p:6.00, t:"kreas"},
        {n:"Φασολάκια", p:4.50, t:"ladero"}, {n:"Μελιτζάνες ιμάμ", p:6.00, t:"ladero"}, {n:"Κοτόσουπα", p:4.50, t:"soup"},
        {n:"Μοσχάρι κοκκινιστό", p:6.50, t:"kreas"}, {n:"Μακαρόνια με κιμά", p:5.50, t:"carb"}, {n:"Κοτόπουλο φούρνου", p:6.00, t:"poulika"},
        {n:"Φιλέτο κοτόπουλο", p:6.00, t:"poulika"}
    ],
    "Friday": [
        {n:"Μπακαλιάρος σκορδαλιά", p:6.50, t:"psari"}, {n:"Παπουτσάκια", p:6.00, t:"ladero"}, {n:"Λαζάνια με κοτόπουλο", p:6.00, t:"carb"},
        {n:"Φασολάδα", p:4.50, t:"ospro"}, {n:"Σπανακόρυζο", p:4.50, t:"ladero"}, {n:"Γεμιστά με ρύζι", p:5.00, t:"ladero"},
        {n:"Μπιφτέκι γεμιστό", p:6.50, t:"kreas"}, {n:"Γίγαντες πλακί", p:6.00, t:"ospro"}, {n:"Μοσχάρι γιουβέτσι", p:6.50, t:"kreas"},
        {n:"Μοσχάρι κοκκινιστό", p:6.50, t:"kreas"}, {n:"Σουτζουκάκια", p:6.50, t:"kreas"}, {n:"Κοτόπουλο αλά κρεμ", p:6.00, t:"poulika"}
    ],
    "Saturday": [
        {n:"Ογκρατέν ζυμαρικών", p:6.00, t:"carb"}, {n:"Αρνί με πατάτες", p:7.50, t:"kreas"}, {n:"Τσιπούρα φούρνου", p:8.00, t:"psari"},
        {n:"Μπακαλιάρος με κρεμμύδια", p:6.00, t:"psari"}, {n:"Μπάμιες", p:5.00, t:"ladero"}, {n:"Γεμιστά κολοκυθάκια", p:6.00, t:"ladero"},
        {n:"Γιουβαρλάκια", p:5.50, t:"kreas"}, {n:"Κοντοσούβλι χοιρινό", p:6.00, t:"kreas"}, {n:"Μοσχάρι γιουβέτσι", p:6.50, t:"kreas"}
    ],
    "Sunday": [
        {n:"Κανελόνια", p:6.00, t:"carb"}, {n:"Μπριζόλα μοσχαρίσια", p:8.50, t:"kreas"}, {n:"Γαριδομακαρονάδα", p:6.50, t:"psari"},
        {n:"Πέρκα φούρνου", p:7.00, t:"psari"}, {n:"Μοσχάρι γιουβέτσι", p:6.50, t:"kreas"}, {n:"Μοσχάρι κοκκινιστό", p:6.50, t:"kreas"},
        {n:"Γίγαντες με χόρτα", p:6.00, t:"ospro"}, {n:"Κοτόσουπα", p:4.50, t:"soup"}, {n:"Μπιφτέκι γεμιστό", p:6.50, t:"kreas"}
    ]
};

// --- GLOBAL BRIDGE: AUTO-ADD TO LOG ---
// --- GLOBAL BRIDGE: AUTO-ADD TO LOG (DYNAMIC MACROS v2.1) ---
window.addKoukiToLog = function(name, price) {
    const today = new Date();
    const dateKey = `${today.getDate()}/${today.getMonth() + 1}/2026`;
    const logKey = `food_log_${dateKey}`;
    let log = JSON.parse(localStorage.getItem(logKey)) || [];
    
    // 🔍 Εύρεση του αντικειμένου από το Master Menu για τα Tags
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayKey = dayNames[today.getDay()];
    const menuItem = KOUKI_MASTER_MENU[todayKey].find(i => i.n === name);
    const tag = menuItem ? menuItem.t : "default";

    // 📊 Dynamic Macro Calculation Logic
    let protein = 25; // Default
    let kcal = 550;   // Default

    if (tag === 'kreas' || tag === 'poulika') { protein = 45; kcal = 680; }
    else if (tag === 'psari') { protein = 35; kcal = 580; }
    else if (tag === 'ospro') { protein = 18; kcal = 500; }
    else if (tag === 'carb') { protein = 22; kcal = 720; }
    else if (tag === 'soup') { protein = 30; kcal = 400; }

    // Προσθήκη στο Log με τα υπολογισμένα Macros
    log.push({
        name: name + " (Κούκι)",
        kcal: kcal,
        protein: protein, // Χρήση του "protein" για συμβατότητα με το food.js
        time: today.toLocaleTimeString()
    });

    localStorage.setItem(logKey, JSON.stringify(log));
    
    // 🔊 Feedback & Sync
    console.log(`[PEGASUS ADVISOR]: Added ${name} with ${kcal}kcal and ${protein}g protein.`);
    
    if (window.updateFoodUI) window.updateFoodUI();
    if (window.PegasusCloud) window.PegasusCloud.push(true);
    

};
