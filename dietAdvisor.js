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

window.PegasusDietAdvisor = {
    analyzeAndRecommend: function() {
        console.log("🧠 PEGASUS ADVISOR: Deep Analysis of 14-day history...");
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const todayKey = dayNames[new Date().getDay()];
        const menu = KOUKI_MASTER_MENU[todayKey];

        const history = this.getRecentHistory(14);

        // --- 1. PRIORITY LOGIC: OSPRO DEFICIT (Fiber Audit) ---
        const hasOspro = history.some(name => ["Φασολάδα", "Φακές", "Ρεβύθια", "Γίγαντες"].some(type => name.includes(type)));
        if (!hasOspro) {
            const pick = menu.find(i => i.t === "ospro");
            if (pick) return { n: pick.n, price: pick.p, msg: `⚠️ Έχεις έλλειψη σε φυτικές ίνες (0% στα όσπρια). Προτείνω: ${pick.n}.` };
        }

        // --- 2. PRIORITY LOGIC: FISH DEFICIT (Omega-3 Audit) ---
        const hasFish = history.some(name => ["Μπακαλιάρος", "Σουπιές", "Γαρίδες", "Σολομός", "Χταπόδι", "Τσιπούρα", "Πέρκα"].some(type => name.includes(type)));
        if (!hasFish) {
            const pick = menu.find(i => i.t === "psari");
            if (pick) return { n: pick.n, price: pick.p, msg: `🌊 Χρειάζεσαι Ωμέγα-3 & Ιώδιο. Η βέλτιστη επιλογή σήμερα: ${pick.n}.` };
        }

        // --- 3. TRAINING LOGIC: PROTEIN RECOVERY ---
        const recoveryPick = menu.find(i => i.t === "poulika" || i.t === "kreas") || menu[0];
        return { n: recoveryPick.n, price: recoveryPick.p, msg: `💪 Ιδανικό για μυϊκή ανάρρωση και όγκο: ${recoveryPick.n}.` };
    },

    getRecentHistory: function(days) {
        let items = [];
        for (let i = 0; i < days; i++) {
            let d = new Date();
            d.setDate(d.getDate() - i);
            let dateKey = `${d.getDate()}/${d.getMonth() + 1}/2026`;
            let log = JSON.parse(localStorage.getItem(`food_log_${dateKey}`)) || [];
            log.forEach(entry => items.push(entry.name));
        }
        return items;
    }
};

// --- GLOBAL BRIDGE: AUTO-ADD TO LOG ---
window.addKoukiToLog = function(name, price) {
    const today = new Date();
    const dateKey = `${today.getDate()}/${today.getMonth() + 1}/2026`;
    let log = JSON.parse(localStorage.getItem(`food_log_${dateKey}`)) || [];
    
    // Προσθήκη με βασικά Macros (εκτίμηση)
    log.push({
        name: name + " (Κούκι)",
        kcal: 650, // Average estimation
        pro: 35,
        car: 50,
        fat: 25,
        time: today.toLocaleTimeString()
    });

    localStorage.setItem(`food_log_${dateKey}`, JSON.stringify(log));
    alert(`✅ Το φαγητό "${name}" προστέθηκε στο ημερολόγιο!`);
    
    if (window.updateFoodUI) window.updateFoodUI();
    if (window.PegasusCloud) window.PegasusCloud.push(true);
};
