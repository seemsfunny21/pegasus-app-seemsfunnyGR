window.PegasusProfile = {
    saveSpecs: function() {
        const data = {
            pa: document.getElementById('pPA').value,
            adt: document.getElementById('pADT').value,
            afm: document.getElementById('pAFM').value,
            amka: document.getElementById('pAMKA').value,
            iban: document.getElementById('pIban').value
        };
        localStorage.setItem("peg_vault_data", JSON.stringify(data));
        console.log("👤 PROFILE: Identity Specs Saved.");
        this.load();
    },

    load: function() {
        const p = JSON.parse(localStorage.getItem("peg_vault_data")) || {};
        if(window.bindCopy) {
            bindCopy('pPA', p.pa);
            bindCopy('pADT', p.adt);
            bindCopy('pAFM', p.afm);
            bindCopy('pAMKA', p.amka);
            bindCopy('pIban', p.iban);
        }
        this.renderContacts();
    },

    addContact: function() {
        const n = document.getElementById('cName').value;
        const nu = document.getElementById('cNum').value;
        if(!n || !nu) return;
        
        let list = JSON.parse(localStorage.getItem("pegasus_contacts")) || [];
        list.push({ n, nu });
        localStorage.setItem("pegasus_contacts", JSON.stringify(list));
        
        document.getElementById('cName').value = "";
        document.getElementById('cNum').value = "";
        this.renderContacts();
        if(window.PegasusCloud) PegasusCloud.push();
    },

    deleteContact: function(idx) {
        let list = JSON.parse(localStorage.getItem("pegasus_contacts")) || [];
        list.splice(idx, 1);
        localStorage.setItem("pegasus_contacts", JSON.stringify(list));
        this.renderContacts();
        if(window.PegasusCloud) PegasusCloud.push();
    },

    renderContacts: function() {
        const list = JSON.parse(localStorage.getItem("pegasus_contacts")) || [];
        const container = document.getElementById("contactList");
        if(!container) return;
        
        container.innerHTML = list.map((i, idx) => `
            <div class="log-item" style="display:flex; justify-content:space-between; align-items:center;">
                <div><strong>${i.n}</strong><br><small>${i.nu}</small></div>
                <div style="gap:10px; display:flex;">
                    <a href="tel:${i.nu}" style="text-decoration:none; background:var(--main); color:#000; padding:8px; border-radius:50%;">📞</a>
                    <button onclick="PegasusProfile.deleteContact(${idx})" style="color:var(--danger); border:none; background:none; font-weight:900;">✕</button>
                </div>
            </div>`).join('');
    }
};