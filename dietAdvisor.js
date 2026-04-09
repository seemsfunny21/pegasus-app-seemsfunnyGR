/* ==========================================================================
   PEGASUS SMART DIET ADVISOR - v2.8 (FUTURE-PROOF & STRICT CALORIE PATCH)
   Protocol: Nutritional Gap & Category Menu Integration
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
            // 🎯 FIXED PATCH: Δυναμική ημερομηνία χωρίς "2026" για το Ιστορικό
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
        html += `<div style="display: flex; justify-content: space-between; align-items: center; background: #000; padding: 8px 12px; border-radius: 4px; border: 1px solid #333;">
                    <div style="text-align: left;">
                        <div style="color: #fff; font-weight: bold; font-size: 0.9em;">${opt.n}</div>
                        <div style="color: #4CAF50; font-size: 0.8em; font-weight: 900;">${opt.p.toFixed(2)}€</div>
                    </div>
                    <button onclick="window.addKoukiToLog('${opt.n}', ${opt.p})" style="background: #4CAF50; color: #000; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.8em;">ΠΡΟΣΘΗΚΗ</button>
                </div>`;
    });
    html += `</div></div>`;
    content.innerHTML = html;
};

window.addKoukiToLog = function(name, price) {
    const today = new Date();
    // 🎯 FIXED PATCH: Δυναμική ημερομηνία χωρίς "2026" για το Σημερινό Log
    const dateKey = (typeof P_M !== "undefined" && P_M.getStrictDate) ? P_M.getStrictDate() : today.toLocaleDateString('el-GR');
    const logKey = `food_log_${dateKey}`;
    let log = JSON.parse(localStorage.getItem(logKey)) || [];
    
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayKey = dayNames[today.getDay()];
    const menuItem = KOUKI_MASTER_MENU[todayKey].find(i => i.n === name);
    const tag = menuItem ? menuItem.t : "default";

    let protein = 25, kcal = 550;
    if (tag === 'kreas' || tag === 'poulika') { protein = 45; kcal = 680; }
    else if (tag === 'psari') { protein = 35; kcal = 580; }
    else if (tag === 'ospro') { protein = 18; kcal = 500; }
    else if (tag === 'carb') { protein = 22; kcal = 720; }
    else if (tag === 'soup') { protein = 30; kcal = 400; }

    // 🚨 STRICT DATA OVERRIDE: Κλείδωμα πραγματικών θερμίδων για Μουσακά (Visual Audit)
    if (name === "Μουσακάς") {
        kcal = 830;
        protein = 26;
    }

    log.push({ name: name + " (Κούκι)", kcal: kcal, protein: protein, time: today.toLocaleTimeString() });
    localStorage.setItem(logKey, JSON.stringify(log));
    
    if (window.updateFoodUI) window.updateFoodUI();
    if (window.PegasusCloud) window.PegasusCloud.push(true);
    
    const proposals = document.getElementById("proposalsContent");
    if (proposals) proposals.innerHTML = `<div style="color:#4CAF50; padding:20px; text-align:center; font-weight:bold;">✅ ΠΡΟΣΤΕΘΗΚΕ ΣΤΟ LOG! (${kcal} kcal)</div>`;
};
