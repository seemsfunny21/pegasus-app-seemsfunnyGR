/* ==========================================================================
   PEGASUS OS - PROFILE & NOTES MODULE (MOBILE EDITION v14.0)
   Protocol: Document Recovery & Tactical Notes Integration
   Features: Specs Loading, Auto-Sync, Note Management
   ========================================================================== */

window.PegasusProfile = {
    // 1. Φόρτωση Εγγράφων (ADT, AFM, AMKA κλπ) από το LocalStorage
    load: function() {
        console.log("👤 PEGASUS: Initializing Profile & Notes...");
        const specs = JSON.parse(localStorage.getItem('pegasus_user_specs')) || {};
        
        // Γέμισμα των input fields αν υπάρχουν στο DOM
        const fields = {
            'pPA': specs.pa,
            'pADT': specs.adt,
            'pAFM': specs.afm,
            'pAMKA': specs.amka,
            'pIban': specs.iban
        };

        for (let id in fields) {
            const el = document.getElementById(id);
            if (el) el.value = fields[id] || "";
        }
        
        // Ταυτόχρονο rendering των σημειώσεων
        this.renderNotes();
    },

    // 2. Αποθήκευση Προσωπικών Στοιχείων
    saveSpecs: async function() {
        const specs = {
            pa: document.getElementById('pPA')?.value || "",
            adt: document.getElementById('pADT')?.value || "",
            afm: document.getElementById('pAFM')?.value || "",
            amka: document.getElementById('pAMKA')?.value || "",
            iban: document.getElementById('pIban')?.value || ""
        };
        
        localStorage.setItem('pegasus_user_specs', JSON.stringify(specs));
        
        // Κλείδωμα των πεδίων (Readonly) μετά την αποθήκευση για ασφάλεια
        document.querySelectorAll('#profile input').forEach(el => el.setAttribute('readonly', true));
        
        console.log("✅ PROFILE: Specs secured locally.");
        
        if (window.PegasusCloud) {
            await window.PegasusCloud.push();
            console.log("📡 PROFILE: Cloud Sync Complete.");
        }
        alert("Τα στοιχεία αποθηκεύτηκαν επιτυχώς.");
    },

    // 3. Προσθήκη Νέας Σημείωσης
    addNote: async function() {
        const dateVal = document.getElementById('nDate')?.value || new Date().toLocaleDateString('el-GR');
        const textVal = document.getElementById('nText')?.value;
        
        if(!textVal || textVal.trim() === "") return;
        
        let list = JSON.parse(localStorage.getItem("pegasus_notes")) || [];
        // Προσθήκη στην αρχή της λίστας
        list.unshift({ d: dateVal, t: textVal }); 
        localStorage.setItem("pegasus_notes", JSON.stringify(list));
        
        // Καθαρισμός input
        if(document.getElementById('nText')) document.getElementById('nText').value = "";
        
        this.renderNotes();
        
        if(window.PegasusCloud) await window.PegasusCloud.push();
    },

    // 4. Διαγραφή Σημείωσης
    deleteNote: async function(idx) {
        if(!confirm("Διαγραφή σημείωσης;")) return;
        
        let list = JSON.parse(localStorage.getItem("pegasus_notes")) || [];
        list.splice(idx, 1);
        localStorage.setItem("pegasus_notes", JSON.stringify(list));
        
        this.renderNotes();
        if(window.PegasusCloud) await window.PegasusCloud.push();
    },

    // 5. Rendering του UI των Σημειώσεων
    renderNotes: function() {
        const list = JSON.parse(localStorage.getItem("pegasus_notes")) || [];
        const container = document.getElementById("notesList");
        if(!container) return;
        
        if(list.length === 0) {
            container.innerHTML = `<div style="color:#555; font-size:12px; margin-top:10px;">Δεν υπάρχουν σημειώσεις.</div>`;
            return;
        }

        container.innerHTML = list.map((i, idx) => `
            <div class="log-item" style="border-left: 4px solid var(--main); margin-bottom: 12px; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
                    <span style="font-size:11px; color:var(--main); font-weight:900; letter-spacing:1px;">📅 ${i.d}</span>
                    <button onclick="window.PegasusProfile.deleteNote(${idx})" style="background:none; border:none; color:var(--danger); font-size:16px; font-weight:bold; cursor:pointer;">✕</button>
                </div>
                <div style="font-size:15px; color:#fff; line-height:1.5; text-align:left;">${i.t}</div>
            </div>
        `).join('');
    }
};
