/* ==========================================================================
   PEGASUS OS - PROFILE & NOTES MODULE (MOBILE EDITION v14.1 CLEAN)
   Protocol: Document Recovery & Tactical Notes Integration
   Features: Specs Loading, Auto-Sync, Note Management
   Status: FINAL STABLE | FIXED: NOISY LOGS + SAFE STORAGE + CLEAN UI LOAD
   ========================================================================== */

window.PegasusProfile = {
    _lastSpecsSnapshot: "",

    safeParse: function(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            console.warn(`⚠️ PROFILE: Corrupted storage at ${key}`, e);
            return fallback;
        }
    },

    // 1. Φόρτωση Εγγράφων (ADT, AFM, AMKA κλπ) από το LocalStorage
    load: function(forceLog = false) {
        const specs = this.safeParse('pegasus_user_specs', {}) || {};

        const snapshot = JSON.stringify(specs);
        if (forceLog || this._lastSpecsSnapshot !== snapshot) {
            console.log("👤 PEGASUS PROFILE: Data loaded.");
            this._lastSpecsSnapshot = snapshot;
        }

        const fields = {
            pPA: specs.pa,
            pADT: specs.adt,
            pAFM: specs.afm,
            pAMKA: specs.amka,
            pIban: specs.iban
        };

        Object.keys(fields).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = fields[id] || "";
        });

        this.renderNotes();
    },

    // 2. Αποθήκευση Προσωπικών Στοιχείων
    saveSpecs: async function() {
        const specs = {
            pa: document.getElementById('pPA')?.value?.trim() || "",
            adt: document.getElementById('pADT')?.value?.trim() || "",
            afm: document.getElementById('pAFM')?.value?.trim() || "",
            amka: document.getElementById('pAMKA')?.value?.trim() || "",
            iban: document.getElementById('pIban')?.value?.trim() || ""
        };

        localStorage.setItem('pegasus_user_specs', JSON.stringify(specs));
        this._lastSpecsSnapshot = JSON.stringify(specs);

        document.querySelectorAll('#profile input').forEach(el => {
            el.setAttribute('readonly', true);
            el.style.border = "";
        });

        console.log("✅ PROFILE: Specs secured locally.");

        if (window.PegasusCloud) {
            await window.PegasusCloud.push(true);
            console.log("📡 PROFILE: Cloud Sync Complete.");
        }

        alert("Τα στοιχεία αποθηκεύτηκαν επιτυχώς.");
    },

    // 3. Προσθήκη Νέας Σημείωσης
    addNote: async function() {
        const dateVal = document.getElementById('nDate')?.value || new Date().toLocaleDateString('el-GR');
        const textInput = document.getElementById('nText');
        const textVal = textInput?.value?.trim() || "";

        if (!textVal) return;

        let list = this.safeParse("pegasus_notes", []) || [];
        list.unshift({ d: dateVal, t: textVal });

        localStorage.setItem("pegasus_notes", JSON.stringify(list));

        if (textInput) textInput.value = "";

        this.renderNotes();

        if (window.PegasusCloud) {
            await window.PegasusCloud.push(true);
        }
    },

    // 4. Διαγραφή Σημείωσης
    deleteNote: async function(idx) {
        if (!confirm("Διαγραφή σημείωσης;")) return;

        let list = this.safeParse("pegasus_notes", []) || [];

        if (idx < 0 || idx >= list.length) return;

        list.splice(idx, 1);
        localStorage.setItem("pegasus_notes", JSON.stringify(list));

        this.renderNotes();

        if (window.PegasusCloud) {
            await window.PegasusCloud.push(true);
        }
    },

    // 5. Rendering του UI των Σημειώσεων
    renderNotes: function() {
        const list = this.safeParse("pegasus_notes", []) || [];
        const container = document.getElementById("notesList");
        if (!container) return;

        if (list.length === 0) {
            container.innerHTML = `<div style="color:#555; font-size:12px; margin-top:10px;">Δεν υπάρχουν σημειώσεις.</div>`;
            return;
        }

        container.innerHTML = list.map((i, idx) => `
            <div class="log-item" style="border-left: 4px solid var(--main); margin-bottom: 12px; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
                    <span style="font-size:11px; color:var(--main); font-weight:900; letter-spacing:1px;">📅 ${i.d || "-"}</span>
                    <button onclick="window.PegasusProfile.deleteNote(${idx})" style="background:none; border:none; color:var(--danger, #ff4444); font-size:16px; font-weight:bold; cursor:pointer;">✕</button>
                </div>
                <div style="font-size:15px; color:#fff; line-height:1.5; text-align:left;">${i.t || ""}</div>
            </div>
        `).join('');
    }
};
