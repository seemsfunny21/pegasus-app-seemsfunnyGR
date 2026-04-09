/* ==========================================================================
   PEGASUS SMART DIET ADVISOR - v3.1 (STRICT NATIVE ROUTING)
   Protocol: Absolute Data Precision & Universal Macro Sourcing
   ========================================================================== */

const KOUKI_MASTER_MENU = {
    "Monday": [
        {n:"Παστίτσιο", p:6.00, t:"carb"}, {n:"Μουσακάς", p:6.00, t:"carb"}, {n:"Γίγαντες πλακί", p:6.00, t:"ospro"},
        {n:"Φασολάδα", p:4.50, t:"ospro"}, {n:"Φασολάκια", p:4.50, t:"ladero"}, {n:"Μπάμιες με κοτόπουλο", p:6.00, t:"poulika"},
        {n:"Μπιφτέκι μοσχαρίσιο", p:6.00, t:"kreas"}, {n:"Μακαρόνια με κιμά", p:5.50, t:"carb"}, {n:"Μοσχάρι κοκκινιστό", p:6.50, t:"kreas"},
        {n:"Μοσχάρι γιουβέτσι", p:6.50, t:"kreas"}, {n:"Κοτόσουπα", p:4.50, t:"soup"}, {n:"Βακαλάος σκορδαλιά", p:6.50, t:"psari"},
        {n:"Κοτόπουλο με πατάτες", p:6.00, t:"poulika"}, {n:"Κοτόπουλο με ρύζι", p:6.00, t:"poulika"}, {n:"Κοτόπουλο γλυκόξινο", p:6.00, t:"poulika"},
        {n:"Κοτόπουλο αλά κρεμ", p:6.00, t:"poulika"}, {n:"Μπριάμ", p:5.50, t:"ladero"}, {n:"Γεμιστά με ρύζι", p:5.00, t:"ladero"},
        {n:"Λαχανόπιτα", p:4.00, t:"carb"}, {n:"Γαλατόπιτα", p:4.00, t:"carb"}, {n:"Αλευρόπιτα", p:4.00, t:"carb"}
    ],
    "Tuesday": [
        {n:"Παστίτσιο", p:6.00, t:"carb"}, {n:"Μουσακάς", p:6.00, t:"carb"}, {n:"Κανελόνια", p:6.00, t:"carb"},
        {n:"Αρακάς", p:4.50, t:"ladero"}, {n:"Ρεβύθια πλακί", p:5.00, t:"ospro"}, {n:"Κεφτεδάκια τηγανητά", p:6.50, t:"kreas"},
        {n:"Γιουβαρλάκια", p:5.50, t:"kreas"}, {n:"Ψάρι φούρνου", p:7.00, t:"psari"}, {n:"Κοτόπουλο αλά κρεμ", p:6.00, t:"poulika"},
        {n:"Κοτόπουλο γλυκόξινο", p:6.00, t:"poulika"}, {n:"Μοσχάρι γιουβέτσι", p:6.50, t:"kreas"}, {n:"Μοσχάρι κοκκινιστό", p:6.50, t:"kreas"},
        {n:"Σνίτσελ κοτόπουλο", p:6.00, t:"poulika"}, {n:"Μπριζόλα χοιρινή", p:6.00, t:"kreas"}, {n:"Κοτόπουλο γιουβέτσι", p:6.00, t:"poulika"},
        {n:"Μακαρόνια με κιμά", p:5.50, t:"carb"}, {n:"Σπανακόρυζο", p:4.50, t:"ladero"}, {n:"Λαχανόπιτα", p:4.00, t:"carb"},
        {n:"Κοτόπιτα", p:4.50, t:"poulika"}, {n:"Αλευρόπιτα", p:4.00, t:"carb"}
    ],
    "Wednesday": [
        {n:"Παστίτσιο", p:6.00, t:"carb"}, {n:"Μουσακάς", p:6.00, t:"carb"}, {n:"Μπιφτέκι κοτόπουλο", p:6.00, t:"poulika"},
        {n:"Λαζάνια με κιμά", p:6.00, t:"carb"}, {n:"Γίγαντες με χόρτα", p:6.00, t:"ospro"}, {n:"Μοσχάρι βραστό", p:6.00, t:"kreas"},
        {n:"Φακές", p:4.50, t:"ospro"}, {n:"Γεμιστά με ρύζι", p:5.00, t:"ladero"}, {n:"Κοτόπουλο Φούρνου", p:6.00, t:"poulika"},
        {n:"Μπριζόλα χοιρινή", p:6.00, t:"kreas"}, {n:"Μακαρόνια με κιμά", p:5.50, t:"carb"}, {n:"Τσιπούρα φούρνου", p:8.00, t:"psari"},
        {n:"Μοσχάρι γιουβέτσι", p:6.50, t:"kreas"}, {n:"Μοσχάρι κοκκινιστό", p:6.50, t:"kreas"}, {n:"Κοτόπουλο αλά κρεμ", p:6.00, t:"poulika"},
        {n:"Κοτόπουλο γλυκόξινο", p:6.00, t:"poulika"}, {n:"Χταπόδι με κοφτό μακαρόνι", p:7.00, t:"psari"}, {n:"Μπατσαριά", p:4.00, t:"carb"},
        {n:"Κοτόπιτα", p:4.50, t:"poulika"}, {n:"Λαχανόπιτα", p:4.00, t:"carb"}, {n:"Αλευρόπιτα", p:4.00, t:"carb"}
    ],
    "Thursday": [
        {n:"Παστίτσιο", p:6.00, t:"carb"}, {n:"Μουσακάς", p:6.00, t:"carb"}, {n:"Κανελόνια", p:6.00, t:"carb"},
        {n:"Φιλέτο κοτόπουλο με καρότο", p:6.00, t:"poulika"}, {n:"Σολομός φούρνου", p:8.00, t:"psari"}, {n:"Κεφτεδάκια τηγανητά", p:6.50, t:"kreas"},
        {n:"Γεμιστά με κιμά", p:6.00, t:"kreas"}, {n:"Ρεβύθια με χόρτα φούρνου", p:5.00, t:"ospro"}, {n:"Μελιτζάνες ιμάμ", p:6.00, t:"ladero"},
        {n:"Φασολάκια", p:4.50, t:"ladero"}, {n:"Μπριάμ", p:5.50, t:"ladero"}, {n:"Σουπιές με σπανάκι", p:7.00, t:"psari"},
        {n:"Μακαρόνια με κιμά", p:5.50, t:"carb"}, {n:"Κοτόπουλο φούρνου", p:6.00, t:"poulika"}, {n:"Μοσχάρι κοκκινιστό", p:6.50, t:"kreas"},
        {n:"Μοσχάρι με μελιτζάνες", p:6.50, t:"kreas"}, {n:"Γιουβαρλάκια", p:5.50, t:"kreas"}, {n:"Κοτόπουλο αλά κρεμ", p:6.00, t:"poulika"},
        {n:"Κοτόπουλο γλυκόξινο", p:6.00, t:"poulika"}, {n:"Λαχανόπιτα", p:4.00, t:"carb"}, {n:"Γαλατόπιτα", p:4.00, t:"carb"}, {n:"Αλευρόπιτα", p:4.00, t:"carb"}
    ],
    "Friday": [
        {n:"Μουσακάς", p:6.00, t:"carb"}, {n:"Παστίτσιο", p:6.00, t:"carb"}, {n:"Μπακαλιάρος σκορδαλιά", p:6.50, t:"psari"},
        {n:"Λαζάνια με κοτόπουλο", p:6.00, t:"carb"}, {n:"Μπιφτέκι γεμιστό", p:6.50, t:"kreas"}, {n:"Σουτζουκάκια", p:6.50, t:"kreas"},
        {n:"Σπανακόρυζο", p:4.50, t:"ladero"}, {n:"Φασολάδα", p:4.50, t:"ospro"}, {n:"Γεμιστά με ρύζι", p:5.00, t:"ladero"},
        {n:"Κοτόσουπα", p:4.50, t:"soup"}, {n:"Γίγαντες πλακί", p:6.00, t:"ospro"}, {n:"Μοσχάρι κοκκινιστό", p:6.50, t:"kreas"},
        {n:"Μοσχάρι γιουβέτσι", p:6.50, t:"kreas"}, {n:"Κοτόπουλο φούρνου", p:6.00, t:"poulika"}, {n:"Μακαρόνια με κιμά", p:5.50, t:"carb"},
        {n:"Μπριζόλα χοιρινή", p:6.00, t:"kreas"}, {n:"Μελιτζάνες παπουτσάκια", p:6.00, t:"ladero"}, {n:"Γαλατόπιτα", p:4.00, t:"carb"},
        {n:"Λαχανόπιτα", p:4.00, t:"carb"}, {n:"Κοτόπιτα", p:4.50, t:"poulika"}, {n:"Αλευρόπιτα", p:4.00, t:"carb"}
    ],
    "Saturday": [
        {n:"Μουσακάς", p:6.00, t:"carb"}, {n:"Παστίτσιο", p:6.00, t:"carb"}, {n:"Μπιφτέκι κοτόπουλο", p:6.00, t:"poulika"},
        {n:"Μπάμιες", p:5.00, t:"ladero"}, {n:"Αρνί με πατάτες", p:7.50, t:"kreas"}, {n:"Γεμιστά κολοκυθάκια", p:6.00, t:"ladero"},
        {n:"Χοιρινό κοντοσούβλι", p:6.00, t:"kreas"}, {n:"Μοσχάρι γιουβέτσι", p:6.50, t:"kreas"}, {n:"Μοσχάρι κοκκινιστό", p:6.50, t:"kreas"},
        {n:"Μακαρόνια με κιμά", p:5.50, t:"carb"}, {n:"Τσιπούρα φούρνου", p:8.00, t:"psari"}, {n:"Κοτόπουλο φούρνου", p:6.00, t:"poulika"},
        {n:"Μπριζόλα χοιρινή", p:6.00, t:"kreas"}, {n:"Μπακαλιάρος με κρεμμύδια", p:6.00, t:"psari"}, {n:"Κοτόπουλο γλυκόξινο", p:6.00, t:"poulika"},
        {n:"Κοτόπουλο αλά κρεμ", p:6.00, t:"poulika"}, {n:"Φακές", p:4.50, t:"ospro"}, {n:"Γαλατόπιτα", p:4.00, t:"carb"},
        {n:"Λαχανόπιτα", p:4.00, t:"carb"}, {n:"Αλευρόπιτα", p:4.00, t:"carb"}
    ],
    "Sunday": [
        {n:"Μουσακάς", p:6.00, t:"carb"}, {n:"Παστίτσιο", p:6.00, t:"carb"}, {n:"Κανελόνια", p:6.00, t:"carb"},
        {n:"Κεφτεδάκια τηγανητά", p:6.50, t:"kreas"}, {n:"Κοτόπουλο με πέννες", p:6.00, t:"poulika"}, {n:"Γίγαντες με χόρτα", p:6.00, t:"ospro"},
        {n:"Πέρκα φούρνου", p:7.00, t:"psari"}, {n:"Μοσχάρι κοκκινιστό", p:6.50, t:"kreas"}, {n:"Μοσχάρι γιουβέτσι", p:6.50, t:"kreas"},
        {n:"Κοτόπουλο φούρνου", p:6.00, t:"poulika"}, {n:"Μακαρόνια με κιμά", p:5.50, t:"carb"}, {n:"Αρακάς", p:4.50, t:"ladero"},
        {n:"Μπιφτέκι γεμιστό", p:6.50, t:"kreas"}, {n:"Κοτόσουπα", p:4.50, t:"soup"}, {n:"Κοτόπιτα", p:4.50, t:"poulika"},
        {n:"Λαχανόπιτα", p:4.00, t:"carb"}, {n:"Αλευρόπιτα", p:4.00, t:"carb"}
    ]
};

// 🎯 THE PEGASUS MACRO ENGINE (Global Scope for Logic Mirroring)
window.getPegasusMacros = function(name, tag) {
    let baseK = 0, baseP = 0;
    const n = name.toLowerCase();

    // 1. OUTLIERS & HEAVY CARBS (Δεν παίρνουν έξτρα ρύζι λόγω φύσης)
    if (n.includes("μουσακάς")) return { kcal: 830, protein: 26 };
    if (n.includes("παστίτσιο") && !n.includes("λαχανικών")) return { kcal: 750, protein: 35 };
    if (n.includes("μακαρόνια") || n.includes("λαζάνια") || n.includes("κανελόνια")) return { kcal: 650, protein: 30 };
    if (n.includes("πίτα") || n.includes("μπατσαριά") || n.includes("μπριάμ")) return { kcal: 450, protein: (n.includes("κοτό") ? 25 : 12) };

    // 2. BASE MEAL MACROS (Καθαρό Βάρος Μερίδας χωρίς συνοδευτικό)
    if (tag === 'kreas') {
        if (n.includes("μοσχάρι")) { baseK = 480; baseP = 42; }
        else if (n.includes("χοιριν") || n.includes("αρνί")) { baseK = 580; baseP = 45; }
        else { baseK = 500; baseP = 40; } // Κιμάδες, Μπιφτέκια
    }
    else if (tag === 'poulika') {
        if (n.includes("αλά κρεμ") || n.includes("γλυκόξινο")) { baseK = 550; baseP = 40; }
        else { baseK = 420; baseP = 48; } // Φούρνου, Λεμονάτο
    }
    else if (tag === 'psari') {
        if (n.includes("τηγαν") || n.includes("σκορδαλιά")) { baseK = 550; baseP = 30; }
        else { baseK = 380; baseP = 38; } // Φούρνου, Ψητά
    }
    else if (tag === 'ospro') {
        baseK = 420; baseP = 18;
    }
    else if (tag === 'ladero' || tag === 'veggies') {
        if (n.includes("γεμιστά με κιμά")) { baseK = 500; baseP = 25; }
        else { baseK = 420; baseP = 8; }
    }
    else if (tag === 'soup') {
        baseK = 380; baseP = 30;
    } else {
        baseK = 450; baseP = 20; // Fallback
    }

    // 3. THE RICE OFFSET PROTOCOL
    return { 
        kcal: baseK + 280, // Προσθήκη Μερίδας Ρυζιού
        protein: baseP + 6 
    };
};

window.PegasusDietAdvisor = {
    analyzeAndRecommend: function() {
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const todayKey = dayNames[new Date().getDay()];
        const menu = KOUKI_MASTER_MENU[todayKey] || [];
        const history = this.getRecentHistory(14);

        const hasOspro = history.some(name => ["Φασολάδα", "Φακές", "Ρεβύθια", "Γίγαντες"].some(type => name.includes(type)));
        if (!hasOspro) {
            const options = menu.filter(i => i.t === "ospro");
            if (options.length > 0) return { type: "ospro", options: options, msg: "⚠️ Έχεις έλλειψη σε φυτικές ίνες (0% στα όσπρια). Επίλεξε ένα από τα σημερινά όσπρια:" };
        }

        const hasFish = history.some(name => ["Μπακαλιάρος", "Σουπιές", "Γαρίδες", "Σολομός", "Χταπόδι", "Τσιπούρα", "Πέρκα"].some(type => name.includes(type)));
        if (!hasFish) {
            const options = menu.filter(i => i.t === "psari");
            if (options.length > 0) return { type: "psari", options: options, msg: "🌊 Χρειάζεσαι Ωμέγα-3 & Ιώδιο. Επιλογές ψαριού για σήμερα:" };
        }

        const options = menu.filter(i => i.t === "poulika" || i.t === "kreas");
        return { type: "protein", options: options.slice(0, 3), msg: "💪 Ιδανικό για μυϊκή ανάρρωση και όγκο:" };
    },

    getRecentHistory: function(days) {
        let items = [];
        const today = new Date();
        for (let i = 0; i < days; i++) {
            let d = new Date();
            d.setDate(today.getDate() - i);
            let dateKey = d.toLocaleDateString('el-GR');
            let log = JSON.parse(localStorage.getItem(`food_log_${dateKey}`)) || [];
            log.forEach(entry => items.push(entry.name));
        }
        return items;
    }
};

window.renderAdvisorUI = function() {
    const advice = window.PegasusDietAdvisor.analyzeAndRecommend();
    const content = document.getElementById("proposalsContent");
    if (!content) return;

    let html = `<div style="background: #1a1a1a; border-left: 4px solid #4CAF50; padding: 15px; border-radius: 5px; margin-top: 10px;">
                <h3 style="color: #4CAF50; margin: 0 0 10px 0; font-size: 1.1em;">🧠 Pegasus Nutrition Logic</h3>
                <p style="color: #ccc; margin-bottom: 15px; font-size: 0.9em; line-height: 1.4;">${advice.msg}</p>
                <div style="display: flex; flex-direction: column; gap: 8px;">`;

    advice.options.forEach(opt => {
        // Υπολογισμός των Macros σε πραγματικό χρόνο για το UI
        const macros = window.getPegasusMacros(opt.n, opt.t);
        
        html += `<div style="display: flex; justify-content: space-between; align-items: center; background: #000; padding: 8px 12px; border-radius: 4px; border: 1px solid #333;">
                    <div style="text-align: left;">
                        <div style="color: #fff; font-weight: bold; font-size: 0.9em;">${opt.n}</div>
                        <div style="color: #4CAF50; font-size: 0.75em; font-weight: 900; margin-top: 3px;">🔥 ${macros.kcal} kcal | 🍗 ${macros.protein}g</div>
                    </div>
                    <button onclick="window.addKoukiToLog('${opt.n}', '${opt.t}')" style="background: #4CAF50; color: #000; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.8em;">ΠΡΟΣΘΗΚΗ</button>
                </div>`;
    });
    html += `</div></div>`;
    content.innerHTML = html;
};

// 🎯 THE STRICT NATIVE BRIDGE: H addKoukiToLog γίνεται απλώς αναμεταδότης!
window.addKoukiToLog = function(name, tag) {
    const macros = window.getPegasusMacros(name, tag);

    if (typeof window.addFoodItem === "function") {
        window.addFoodItem(name + " (Κούκι)", macros.kcal, macros.protein);
    } else {
        // Fallback ΜΟΝΟ αν το food.js δεν υπάρχει (απίθανο)
        const today = new Date();
        const dateKey = (typeof window.getStrictDateStr === "function") ? window.getStrictDateStr() : today.toLocaleDateString('el-GR');
        const logPrefix = (typeof M !== 'undefined' && M.nutrition) ? M.nutrition.log_prefix : "food_log_";
        const logKey = logPrefix + dateKey;
        
        let log = JSON.parse(localStorage.getItem(logKey)) || [];
        log.push({ name: name + " (Κούκι)", kcal: macros.kcal, protein: macros.protein, time: today.toLocaleTimeString() });
        localStorage.setItem(logKey, JSON.stringify(log));
        
        if (window.updateFoodUI) window.updateFoodUI();
        if (window.PegasusCloud) window.PegasusCloud.push(true);
    }
    
    const proposals = document.getElementById("proposalsContent");
    if (proposals) proposals.innerHTML = `<div style="color:#4CAF50; padding:20px; text-align:center; font-weight:bold;">✅ ΠΡΟΣΤΕΘΗΚΕ ΣΤΟ LOG! (${macros.kcal} kcal)</div>`;
};
