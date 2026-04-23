/* ==========================================================================
   PEGASUS OS - BIOMETRIC WEIGHT TRACKER (v2.0 - HISTORY NORMALIZATION SAFE)
   Protocol: Daily Weight Logging, Moving Average & Master Variable Sync
   Status: FINAL STABLE | FIXED: LEGACY HISTORY PRESERVATION + SAFE NORMALIZATION
   ========================================================================== */

var M = M || window.PegasusManifest;
const WEIGHT_KEY = M?.user?.weight || 'pegasus_weight';
const HISTORY_KEY = M?.user?.weight_history || M?.user?.weightHistory || 'pegasus_weight_history';
const HISTORY_BACKUP_KEY = HISTORY_KEY + '_backup';

function toISODateKey(value) {
    if (value == null) return null;
    if (typeof value === 'string') {
        const s = value.trim();
        if (!s) return null;
        const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
        const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (dmy) return `${dmy[3]}-${String(dmy[2]).padStart(2,'0')}-${String(dmy[1]).padStart(2,'0')}`;
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function normalizeWeightHistory(raw) {
    if (!raw) return {};
    const normalized = {};

    const applyEntry = (dateCandidate, valueCandidate, fallbackKey = null) => {
        const dateKey = toISODateKey(dateCandidate) || toISODateKey(fallbackKey);
        const value = parseFloat(valueCandidate);
        if (dateKey && !isNaN(value)) normalized[dateKey] = value;
    };

    if (Array.isArray(raw)) {
        for (const entry of raw) {
            if (entry == null) continue;
            if (typeof entry === 'object') {
                applyEntry(entry.date || entry.dateKey || entry.day || entry.ts || entry.timestamp, entry.weight ?? entry.value ?? entry.kg, entry.key);
            }
        }
        return normalized;
    }

    if (typeof raw === 'object') {
        Object.keys(raw).forEach(key => {
            const item = raw[key];
            if (item && typeof item === 'object') {
                applyEntry(item.date || item.dateKey || item.day || item.ts || item.timestamp || key, item.weight ?? item.value ?? item.kg, key);
            } else {
                applyEntry(key, item, key);
            }
        });
        return normalized;
    }

    return normalized;
}

function tryParseHistoryKey(key) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const normalized = normalizeWeightHistory(parsed);
        return Object.keys(normalized).length ? normalized : null;
    } catch (e) {
        return null;
    }
}

function saveWeightHistoryObject(history) {
    const safeHistory = normalizeWeightHistory(history);
    const serialized = JSON.stringify(safeHistory);
    localStorage.setItem(HISTORY_KEY, serialized);
    localStorage.setItem(HISTORY_BACKUP_KEY, serialized);
    return safeHistory;
}

function loadWeightHistory() {
    const candidates = [
        HISTORY_KEY,
        M?.user?.weightHistory,
        M?.user?.weight_history,
        HISTORY_BACKUP_KEY,
        'pegasus_weight_history',
        'pegasus_weight_history_backup'
    ].filter(Boolean);

    for (const key of [...new Set(candidates)]) {
        const history = tryParseHistoryKey(key);
        if (history && Object.keys(history).length) {
            saveWeightHistoryObject(history);
            return history;
        }
    }

    // keep the current storage untouched if unreadable; initialize only when truly empty
    if (!localStorage.getItem(HISTORY_KEY)) {
        saveWeightHistoryObject({});
    }
    return {};
}


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
        
        let history = loadWeightHistory();
        history[dateKey] = weight;
        history = saveWeightHistoryObject(history);
        
        // Αποθήκευση τοπικά μέσω Manifest Keys
        localStorage.setItem(WEIGHT_KEY, String(weight));
        
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
        const history = loadWeightHistory();
        
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
        
        const history = loadWeightHistory();
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

console.log("⚖️ PEGASUS WEIGHT: Module Operational & Hardened (v2.0).");


window.addEventListener('pageshow', () => { try { ensureMobileWeightSettingsCard(); window.PegasusWeight.updateUI(); } catch(_) {} });

window.addEventListener('pageshow', () => { try { ensureMobileWeightSettingsCard(); window.PegasusWeight.updateUI(); } catch(_) {} });


/* ===== MERGED FROM weightState.js ===== */
/* ==========================================================================
   PEGASUS WEIGHT STATE
   Active lifter and per-exercise saved weight persistence.
   ========================================================================== */

window.getActiveLifter = function() {
    if (window.partnerData && window.partnerData.isActive && window.partnerData.currentPartner !== "") {
        return window.partnerData.currentPartner;
    }
    return "ΑΓΓΕΛΟΣ";
};

window.getSavedWeight = function(exerciseName) {
    const cleanName = exerciseName.trim();
    const lifter = window.getActiveLifter();
    let allWeights = JSON.parse(localStorage.getItem(M?.workout?.exerciseWeights || "pegasus_exercise_weights") || "{}");

    if (allWeights[lifter] && allWeights[lifter][cleanName] !== undefined) return allWeights[lifter][cleanName];

    if (lifter === "ΑΓΓΕΛΟΣ") {
        let old1 = localStorage.getItem(`weight_ΑΓΓΕΛΟΣ_${cleanName}`);
        let old2 = localStorage.getItem(`weight_${cleanName}`);
        if (old1) return old1;
        if (old2) return old2;
    }
    return "";
};

window.saveWeight = function(name, val) {
    const cleanName = name.trim();
    const lifter = window.getActiveLifter();
    let allWeights = JSON.parse(localStorage.getItem(M?.workout?.exerciseWeights || "pegasus_exercise_weights") || "{}");

    if (!allWeights[lifter]) allWeights[lifter] = {};
    allWeights[lifter][cleanName] = val;
    localStorage.setItem(M?.workout?.exerciseWeights || "pegasus_exercise_weights", JSON.stringify(allWeights));

    if (lifter === "ΑΓΓΕΛΟΣ") {
        localStorage.setItem(`weight_ΑΓΓΕΛΟΣ_${cleanName}`, val);
    }

    syncPegasusUserRuntime();

    if (window.MuscleProgressUI?.render) window.MuscleProgressUI.render();
    if (window.PegasusCloud?.push) window.PegasusCloud.push();
};
