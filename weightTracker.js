/* ==========================================================================
   PEGASUS OS - BIOMETRIC WEIGHT TRACKER (v1.8 - STABLE MOBILE SETTINGS CARD)
   Protocol: Daily Weight Logging, Moving Average & Master Variable Sync
   Status: FINAL STABLE | FIXED: MANIFEST DESYNC & EVENT FALLBACKS
   ========================================================================== */

var M = M || window.PegasusManifest;
const WEIGHT_KEY = M?.user?.weight || 'pegasus_weight';
const HISTORY_KEY = M?.user?.weight_history || 'pegasus_weight_history';


function getPegasusProteinTargetKey() {
    return window.PegasusManifest?.diet?.goalProtein || 'pegasus_goal_protein';
}

function ensureMobileWeightSettingsCard() {
    const panel = document.getElementById('settings_panel');
    if (!panel) return null;

    let card = document.getElementById('mobileBodyWeightCard');
    if (!card) {
        const firstCard = panel.querySelector('.mini-card');
        if (firstCard) {
            card = firstCard;
            card.id = 'mobileBodyWeightCard';
        }
    }
    if (!card) return null;

    const expectedMarkup = `
        <div style="position:absolute; top:-10px; right:-10px; opacity:0.05; font-size:100px; pointer-events:none;">⚖️</div>
        <span class="mini-label" style="font-size:11px; margin-bottom:15px; display:block; position:relative; z-index:1;">ΚΑΤΑΓΡΑΦΗ ΒΑΡΟΥΣ ΣΩΜΑΤΟΣ</span>
        <div id="mobileWeightRow" style="display:flex; gap:10px; align-items:center; margin-bottom:15px; position:relative; z-index:1;">
            <input type="number" id="mobileWeightInput" placeholder="74.0" step="0.1" style="margin:0; font-size:24px; font-weight:900; height:60px; color:var(--main); background:rgba(0,255,65,0.05); border:2px solid rgba(0,255,65,0.2); border-radius:14px; display:block; visibility:visible; opacity:1; width:100%; flex:1 1 auto; min-width:0;">
            <button id="mobileWeightSaveBtn" class="primary-btn" onclick="window.PegasusWeight?.save(document.getElementById('mobileWeightInput').value);" style="height:60px; margin:0; flex-shrink:0; width:120px; font-size:11px; border-radius:14px; display:inline-flex; align-items:center; justify-content:center; visibility:visible; opacity:1;">ΕΝΗΜΕΡΩΣΗ</button>
        </div>
        <div id="mobileWeightAvg" style="background:rgba(255,255,255,0.03); padding:15px; border-radius:12px; font-size:12px; color:var(--main); font-weight:900; border:1px dashed rgba(0,255,65,0.3); letter-spacing:1px; text-transform:uppercase; display:block; visibility:visible; opacity:1; position:relative; z-index:1;">
            M.O. Εβδομάδας: -- kg
        </div>
    `;

    const needsRebuild = !document.getElementById('mobileWeightInput') || !document.getElementById('mobileWeightAvg') || card.getBoundingClientRect().height < 120;
    if (needsRebuild) {
        card.innerHTML = expectedMarkup;
    }

    card.style.display = 'block';
    card.style.visibility = 'visible';
    card.style.opacity = '1';
    card.style.minHeight = '190px';
    card.style.height = 'auto';
    card.style.maxHeight = 'none';
    card.style.overflow = 'visible';
    card.style.position = 'relative';
    card.style.border = '1px solid var(--main)';
    card.style.padding = '25px 20px';
    card.style.boxShadow = '0 10px 25px rgba(0,255,65,0.05)';

    const row = document.getElementById('mobileWeightRow');
    const input = document.getElementById('mobileWeightInput');
    const saveBtn = document.getElementById('mobileWeightSaveBtn');
    const avg = document.getElementById('mobileWeightAvg');

    if (row) {
        row.style.display = 'flex';
        row.style.visibility = 'visible';
        row.style.opacity = '1';
        row.style.alignItems = 'center';
        row.style.gap = '10px';
        row.style.marginBottom = '15px';
    }
    if (input) {
        input.style.display = 'block';
        input.style.visibility = 'visible';
        input.style.opacity = '1';
        input.style.position = 'static';
        input.style.height = '60px';
    }
    if (saveBtn) {
        saveBtn.style.display = 'inline-flex';
        saveBtn.style.visibility = 'visible';
        saveBtn.style.opacity = '1';
        saveBtn.style.position = 'static';
        saveBtn.style.height = '60px';
    }
    if (avg) {
        avg.style.display = 'block';
        avg.style.visibility = 'visible';
        avg.style.opacity = '1';
        avg.style.position = 'static';
    }
    return card;
}

window.PegasusWeight = {
    // 1. Καταγραφή βάρους (Συμβατό με Mobile & Desktop)
    save: function(val) {
        // 🎯 FIXED: Αν κληθεί χωρίς τιμή (ή με Event object από το UI), ψάχνει αυτόματα τα inputs
        let rawVal = val;
        if (rawVal === undefined || typeof rawVal === 'object') {
            const inputEl = document.getElementById('mobileWeightInput') || document.getElementById('userWeightInput');
            rawVal = inputEl ? inputEl.value : null;
        }

        if (!rawVal) return;

        // 🛡️ RANGE & NaN GUARD: Μετατροπή και αυστηρός έλεγχος
        const safeVal = String(rawVal).replace(',', '.');
        const weight = parseFloat(safeVal);
        
        // Αποκλεισμός εξωπραγματικών τιμών
        if (isNaN(weight) || weight < 30 || weight > 250) {
            if (window.PegasusLogger) window.PegasusLogger.log(`Invalid weight input: ${rawVal}`, "WARNING");
            alert("PEGASUS STRICT: Παρακαλώ εισάγετε ένα έγκυρο βάρος (30-250 kg).");
            return;
        }

        const now = new Date();
        const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}");
        history[dateKey] = weight;
        
        // Αποθήκευση τοπικά μέσω Manifest Keys
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        localStorage.setItem(WEIGHT_KEY, weight);
        
        // 🟢 FORCE UPDATE: Ενημέρωση της κεντρικής μεταβλητής του app.js και της μηχανής μεταβολισμού
        if (typeof window !== 'undefined') {
            window.userWeight = weight;
            if (window.PegasusMetabolic) window.PegasusMetabolic.renderUI();
            if (typeof window.verifyCalorieLogic === "function") window.verifyCalorieLogic(); // 🎯 Health Check Sync
        }
        
        console.log(`⚖️ PEGASUS DATA: Weight logged: ${weight}kg`);
        
        // Αποστολή στο Cloud
        if (window.PegasusCloud && typeof window.PegasusCloud.push === "function") {
            window.PegasusCloud.push(true);
        }
        
        this.updateUI();
        alert(`✅ Βάρος καταγράφηκε: ${weight} kg`);
    },

    // 2. Υπολογισμός μέσου όρου με Χρονολογική Ταξινόμηση
    getWeeklyAverage: function() {
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}");
        
        const sortedKeys = Object.keys(history).sort();
        if (sortedKeys.length === 0) return null;

        const last7Keys = sortedKeys.slice(-7);
        const last7Values = last7Keys.map(k => history[k]);
        
        const sum = last7Values.reduce((acc, val) => acc + val, 0);
        return (sum / last7Values.length).toFixed(1);
    },

    // 3. Ενημέρωση UI 
    updateUI: function() {
        ensureMobileWeightSettingsCard();
        const avg = this.getWeeklyAverage();
        const display = document.getElementById('mobileWeightAvg') || document.getElementById('weeklyWeightAvg');
        const inputEl = document.getElementById('mobileWeightInput') || document.getElementById('userWeightInput');
        
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}");
        const sortedKeys = Object.keys(history).sort();

        // Ενημέρωση ένδειξης Μέσου Όρου
        if (display) {
            display.textContent = avg ? `M.O. Εβδομάδας: ${avg} kg` : "Αναμονή δεδομένων...";
        }
        
        // Αυτόματο γέμισμα του input με το τελευταίο βάρος (αν είναι άδειο)
        if (inputEl && sortedKeys.length > 0 && !inputEl.value) {
            const lastKey = sortedKeys[sortedKeys.length - 1];
            inputEl.value = history[lastKey];
        }
    },

    ensureSettingsCard: function() {
        return ensureMobileWeightSettingsCard();
    },

    // 4. 🛡️ MASTER CLOUD ALIGNMENT
    alignWithCloud: function(cloudWeight) {
        if (!cloudWeight) return;
        const weight = parseFloat(cloudWeight);
        if (isNaN(weight)) return;

        const localWeight = parseFloat(localStorage.getItem(WEIGHT_KEY)) || 0;
        
        if (Math.abs(localWeight - weight) > 0.01) {
            console.log(`%c ⚖️ PEGASUS ALIGNMENT: Cloud (${weight}kg) overrides Local (${localWeight}kg)`, "color: #ff9800; font-weight: bold;");
            
            localStorage.setItem(WEIGHT_KEY, weight);
            if (typeof window !== 'undefined') window.userWeight = weight; 
            
            this.updateUI();
            
            // Ενημέρωση UI θερμίδων & Health Check
            if (typeof window.updateKcalUI === "function") window.updateKcalUI();
            if (window.PegasusMetabolic) window.PegasusMetabolic.renderUI();
            if (typeof window.verifyCalorieLogic === "function") window.verifyCalorieLogic();
        }
    }
};

// 5. AUTO-BOOT BRIDGE
document.addEventListener('DOMContentLoaded', () => {
    ensureMobileWeightSettingsCard();
    window.PegasusWeight.updateUI();
});

console.log("⚖️ PEGASUS WEIGHT: Module Operational & Hardened (v1.8).");


window.addEventListener('pageshow', () => { try { ensureMobileWeightSettingsCard(); window.PegasusWeight.updateUI(); } catch(_) {} });

window.addEventListener('pageshow', () => { try { ensureMobileWeightSettingsCard(); window.PegasusWeight.updateUI(); } catch(_) {} });
