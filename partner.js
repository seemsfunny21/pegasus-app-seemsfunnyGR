/* ==========================================================================
   PEGASUS PARTNER ENGINE - v3.0 (MODULAR / FULLY DECOUPLED)
   Protocol: Strict Data Analyst - Isolated Turn Management & Weight Tracking
   ========================================================================== */

const PegasusPartner = (function() {
    // 1. ΙΔΙΩΤΙΚΟ STATE (Private State)
    let state = {
        isActive: false,
        currentPartner: "", 
        isUser1Turn: true
    };

    // 2. ΕΣΩΤΕΡΙΚΕΣ ΛΕΙΤΟΥΡΓΙΕΣ (Private Methods)
    const savePartnerNameToList = (name) => {
        let list = JSON.parse(localStorage.getItem('pegasus_partner_list') || "[]");
        if (!list.includes(name)) {
            list.push(name);
            localStorage.setItem('pegasus_partner_list', JSON.stringify(list));
        }
    };

    const updatePartnerDatalist = () => {
        const dataList = document.getElementById('partnerNames');
        if (!dataList) return;
        
        let partnerNames = new Set(JSON.parse(localStorage.getItem('pegasus_partner_list') || "[]"));
        
        // Σάρωση υφιστάμενων δεδομένων (Backwards Compatibility)
        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            if (key && key.startsWith("weight_") && !key.startsWith("weight_ANGELOS_")) {
                const parts = key.split('_');
                if (parts.length >= 3) {
                    const foundName = parts[1];
                    if (foundName !== "ANGELOS" && foundName !== "" && foundName !== "ZZ") {
                        partnerNames.add(foundName);
                    }
                }
            }
        }

        dataList.innerHTML = ""; 
        partnerNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            dataList.appendChild(option);
        });
    };

    const toggleMode = () => {
        const nameInput = document.getElementById('partnerNameInput');
        const btn = document.getElementById('btnPartnerMode');
        if (!nameInput || !btn) return;
        
        if (!state.isActive) {
            let rawName = nameInput.value.trim();
            let upperName = rawName.toLocaleUpperCase('el-GR');

            // Απαγόρευση χρήσης δεσμευμένων ονομάτων
            if (rawName === "" || upperName === "ANGELOS" || upperName === "ΑΓΓΕΛΟΣ" || upperName === "ZZ") {
                alert("PEGASUS STRICT: Γράψε ένα έγκυρο όνομα συνεργάτη!");
                return;
            }

            state.isActive = true;
            state.currentPartner = upperName;
            state.isUser1Turn = true; 
            
            savePartnerNameToList(upperName);
            updatePartnerDatalist();
            
            btn.textContent = `ΣΥΝΕΡΓΑΤΗΣ: ${upperName} (ON)`;
            btn.style.setProperty('background', '#4CAF50', 'important');
            btn.style.setProperty('color', '#000', 'important');
            nameInput.disabled = true;
            
        } else {
            state.isActive = false;
            state.currentPartner = "";
            state.isUser1Turn = true;
            
            btn.textContent = "ΠΡΟΣΘΗΚΗ ΣΥΝΕΡΓΑΤΗ";
            btn.style.background = "transparent";
            btn.style.color = "#4CAF50";
            nameInput.disabled = false;
            nameInput.value = "";
        }
    };

    const saveWeight = (exerciseName, weight) => {
        if (!exerciseName) return;
        const cleanName = exerciseName.trim();
        const userKey = state.isUser1Turn ? "ANGELOS" : state.currentPartner;
        
        localStorage.setItem(`weight_${userKey}_${cleanName}`, weight);
        
        if (state.isUser1Turn) {
            localStorage.setItem(`weight_${cleanName}`, weight);
        }
    };

    const loadWeight = (exerciseName) => {
        if (!exerciseName) return "";
        const cleanName = exerciseName.trim();
        const userKey = state.isUser1Turn ? "ANGELOS" : state.currentPartner;
        
        return localStorage.getItem(`weight_${userKey}_${cleanName}`) || 
               localStorage.getItem(`weight_${cleanName}`) || "";
    };

    const initListeners = () => {
        const btn = document.getElementById('btnPartnerMode');
        if (btn) {
            btn.removeAttribute('onclick'); 
            btn.addEventListener('click', toggleMode);
        }
        updatePartnerDatalist();
    };

    // 3. PUBLIC API
    return {
        init: initListeners,
        toggle: toggleMode,
        saveWeight: saveWeight,
        loadWeight: loadWeight,
        state: state 
    };
})();

// Εξαγωγή στο Window Scope
window.addEventListener('DOMContentLoaded', PegasusPartner.init);
window.togglePartnerMode = PegasusPartner.toggle;
window.savePartnerWeight = PegasusPartner.saveWeight;
window.loadPartnerWeight = PegasusPartner.loadWeight;

// Proxy για το global partnerData που απαιτεί το app.js
window.partnerData = PegasusPartner.state;