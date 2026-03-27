/* ==========================================================================
   PEGASUS PARTNER ENGINE - ULTIMATE SMART LIST (STRICT)
   ========================================================================== */

let partnerData = {
    isActive: false,
    currentPartner: "", 
    isUser1Turn: true
};

// 1. ΕΝΕΡΓΟΠΟΙΗΣΗ / ΑΠΕΝΕΡΓΟΠΟΙΗΣΗ
function togglePartnerMode() {
    const nameInput = document.getElementById('partnerNameInput');
    const btn = document.getElementById('btnPartnerMode');
    
    if (!partnerData.isActive) {
        let rawName = nameInput.value.trim();
        let upperName = rawName.toLocaleUpperCase('el-GR');

        if (rawName === "" || upperName === "ANGELOS" || upperName === "ΑΓΓΕΛΟΣ" || upperName === "ZZ") {
            alert("PEGASUS STRICT: Γράψε ένα έγκυρο όνομα συνεργάτη!");
            return;
        }

        partnerData.isActive = true;
        partnerData.currentPartner = upperName;
        
        // ΑΠΟΘΗΚΕΥΣΗ ΣΤΗ ΛΙΣΤΑ ΟΝΟΜΑΤΩΝ
        savePartnerNameToList(upperName);
        
        updatePartnerDatalist();
        
        btn.textContent = `ΣΥΝΕΡΓΑΤΗΣ: ${upperName} (ON)`;
        btn.style.background = "#4CAF50";
        btn.style.color = "#000";
        nameInput.disabled = true;
    } else {
        partnerData.isActive = false;
        btn.textContent = "ΣΥΝΕΡΓΑΤΗΣ: ΑΠΕΝΕΡΓΟΣ";
        btn.style.background = "#222";
        btn.style.color = "#4CAF50";
        nameInput.disabled = false;
        nameInput.value = ""; 
    }
}

// 2. ΑΠΟΘΗΚΕΥΣΗ ΟΝΟΜΑΤΟΣ ΣΕ ΕΙΔΙΚΗ ΛΙΣΤΑ
function savePartnerNameToList(name) {
    let list = JSON.parse(localStorage.getItem("pegasus_partners_list") || "[]");
    if (!list.includes(name)) {
        list.push(name);
        localStorage.setItem("pegasus_partners_list", JSON.stringify(list));
    }
}

// 3. ΑΝΑΝΕΩΣΗ ΤΗΣ ΛΙΣΤΑΣ ΠΡΟΤΑΣΕΩΝ
function updatePartnerDatalist() {
    const dataList = document.getElementById('partnerList');
    if (!dataList) return;

    // Περνάμε τα ονόματα από 2 φίλτρα για να είμαστε σίγουροι
    let partnerNames = new Set();

    // Φίλτρο Α: Από την ειδική λίστα ονομάτων
    let list = JSON.parse(localStorage.getItem("pegasus_partners_list") || "[]");
    list.forEach(n => {
        if(n !== "ZZ" && n !== "ANGELOS") partnerNames.add(n);
    });

    // Φίλτρο Β: Από υπάρχοντα βάρη (για παλιούς συνεργάτες)
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith("weight_") && !key.startsWith("weight_ANGELOS_")) {
            const parts = key.split('_');
            if (parts.length >= 3) {
                const foundName = parts[1];
                if (foundName !== "ANGELOS" && foundName !== "" && foundName !== "ZZ") {
                    partnerNames.add(foundName);
                }
            }
        }
    });

    dataList.innerHTML = ""; 
    partnerNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        dataList.appendChild(option);
    });
}

// 4. ΑΠΟΘΗΚΕΥΣΗ / ΦΟΡΤΩΣΗ ΚΙΛΩΝ
function savePartnerWeight(exerciseName, weight) {
    const userKey = partnerData.isUser1Turn ? "ANGELOS" : partnerData.currentPartner;
    localStorage.setItem(`weight_${userKey}_${exerciseName.trim()}`, weight);
    if (partnerData.isUser1Turn) localStorage.setItem(`weight_${exerciseName.trim()}`, weight);
}

function loadPartnerWeight(exerciseName) {
    const userKey = partnerData.isUser1Turn ? "ANGELOS" : partnerData.currentPartner;
    return localStorage.getItem(`weight_${userKey}_${exerciseName.trim()}`) || localStorage.getItem(`weight_${exerciseName.trim()}`) || "";
}

// 5. INITIALIZATION
window.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('partnerNameInput');
    if (nameInput) nameInput.value = ""; 
    updatePartnerDatalist();
});