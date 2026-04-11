/* ==========================================================================
   PEGASUS OS - VEHICLE MANAGEMENT MODULE (MOBILE EDITION v14.8)
   Protocol: Ultimate Legacy Key Bridging (pegasus_car_specs) & Cloud Async
   ========================================================================== */

window.PegasusCar = {
    // 1. Αποθήκευση (Γράφει ΚΑΙ στο παλιό κλειδί για απόλυτη συμβατότητα)
    saveSpecs: async function() {
        console.log("🚗 CAR: Initiating Save Protocol...");
        
        const identity = {
            plate: document.getElementById('carPlate')?.value || "",
            model: document.getElementById('carModel')?.value || "",
            vin: document.getElementById('carVin')?.value || "",
            eng: document.getElementById('carEngine')?.value || "",
            pwr: document.getElementById('carPower')?.value || ""
        };

        const dates = {
            ins: document.getElementById('carIns')?.value || "",
            kteo: document.getElementById('carKteo')?.value || "",
            srv: document.getElementById('carSrv')?.value || ""
        };

        // Γράφει σε ΟΛΑ τα πιθανά κλειδιά (Legacy & New)
        localStorage.setItem("pegasus_car_specs", JSON.stringify(identity)); // Το παλιό σου κλειδί!
        localStorage.setItem("pegasus_car_identity", JSON.stringify(identity));
        localStorage.setItem("pegasus_car_dates", JSON.stringify(dates));
        
        document.querySelectorAll('#car input').forEach(el => el.setAttribute('readonly', true));
        console.log("✅ CAR: Specs Secured Locally.");

        if (window.PegasusCloud) {
            if (typeof setSyncStatus === "function") setSyncStatus('ΑΠΟΣΤΟΛΗ...');
            await window.PegasusCloud.push(true);
            if (typeof setSyncStatus === "function") setSyncStatus('online');
            console.log("📡 CAR: Cloud Sync Successful.");
        }
        
        this.load();
        alert("ΣΤΟΙΧΕΙΑ ΟΧΗΜΑΤΟΣ ΕΝΗΜΕΡΩΘΗΚΑΝ");
    },

    // 2. Φόρτωση (Ψάχνει ΠΡΩΤΑ το παλιό σου κλειδί pegasus_car_specs)
    load: function() {
        // 🟢 THE MISSING LINK: Διαβάζει το παλιό 'pegasus_car_specs'
        const identity = JSON.parse(localStorage.getItem("pegasus_car_specs")) || 
                         JSON.parse(localStorage.getItem("pegasus_car_identity")) || {};
                         
        const dates = JSON.parse(localStorage.getItem("pegasus_car_dates")) || {};
        
        const fields = {
            'carPlate': identity.plate,
            'carModel': identity.model,
            'carVin': identity.vin,
            'carEngine': identity.eng,
            'carPower': identity.pwr,
            'carIns': dates.ins,
            'carKteo': dates.kteo,
            'carSrv': dates.srv
        };

        for (let id in fields) {
            const el = document.getElementById(id);
            if (el) el.value = fields[id] || "";
        }

        this.renderServiceLog();
    },

    // 3. Προσθήκη Service
    addService: async function() {
        const t = document.getElementById('srvTask')?.value;
        const k = document.getElementById('srvKm')?.value;
        
        if (!t || !k) return;

        let logs = JSON.parse(localStorage.getItem("pegasus_car_service")) || [];
        
        logs.unshift({
            t: t.toUpperCase(),
            k: k.toLocaleString('el-GR'),
            d: new Date().toLocaleDateString('el-GR')
        });

        localStorage.setItem("pegasus_car_service", JSON.stringify(logs));
        
        if(document.getElementById('srvTask')) document.getElementById('srvTask').value = "";
        if(document.getElementById('srvKm')) document.getElementById('srvKm').value = "";
        
        this.renderServiceLog();
        if (window.PegasusCloud) await window.PegasusCloud.push(true);
    },

    // 4. Σχεδίαση Ιστορικού (Με το σύγχρονο UI)
    renderServiceLog: function() {
        const logs = JSON.parse(localStorage.getItem("pegasus_car_service")) || [];
        const container = document.getElementById("serviceLogList");
        
        if (!container) return;

        if (logs.length === 0) {
            container.innerHTML = `<div style="color:#555; font-size:12px; margin-top:10px;">Δεν υπάρχει καταγεγραμμένο ιστορικό.</div>`;
            return;
        }

        container.innerHTML = logs.map((i, idx) => `
            <div class="log-item" style="border-left: 4px solid var(--main); margin-bottom: 10px; padding: 12px; background: rgba(255,255,255,0.03);">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="font-weight:900; font-size:13px; color:#fff; text-align:left; flex:1;">${i.t}</div>
                    <button onclick="window.PegasusCar.deleteLog(${idx})" style="background:none; border:none; color:var(--danger); font-weight:bold; padding: 0 5px;">✕</button>
                </div>
                <div style="font-size:11px; color:var(--main); font-weight:800; margin-top:5px; text-align:left;">
                    📍 ${i.k} KM | 📅 ${i.d}
                </div>
            </div>
        `).join('');
    },

    // 5. Διαγραφή
    deleteLog: async function(idx) {
        if(!confirm("Οριστική διαγραφή αυτής της εργασίας;")) return;
        
        let logs = JSON.parse(localStorage.getItem("pegasus_car_service")) || [];
        logs.splice(idx, 1);
        
        localStorage.setItem("pegasus_car_service", JSON.stringify(logs));
        
        this.renderServiceLog();
        if (window.PegasusCloud) await window.PegasusCloud.push(true);
    }
};

// Initial Load - Περιμένει 1.5s για να κατέβει το αρχείο του παλιού v1.3 από το Cloud!
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => window.PegasusCar.load(), 1500);
});
