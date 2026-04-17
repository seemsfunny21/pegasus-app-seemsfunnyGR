/* ==========================================================================
   PEGASUS OS - VEHICLE MODULE (v15.2 - UNIFIED CLOUD ALIGNED)
   Protocol: Strict Manifest Governance, Legacy Bridging & Date Safe Format
   ========================================================================== */

const CAR_M = window.PegasusManifest || { car: { identity: "pegasus_car_identity", dates: "pegasus_car_dates", service: "pegasus_car_service", legacySpecs: "pegasus_car_specs", legacyService: "peg_car_service", legacyDates: "peg_car_dates" }};

window.PegasusCar = {
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

        localStorage.setItem(CAR_M.car.identity, JSON.stringify(identity));
        localStorage.setItem(CAR_M.car.dates, JSON.stringify(dates));
        localStorage.setItem(CAR_M.car.legacySpecs, JSON.stringify(identity)); 
        
        document.querySelectorAll('#car input').forEach(el => el.setAttribute('readonly', true));
        
        if (window.PegasusCloud) {
            if (typeof setSyncStatus === "function") setSyncStatus('ΑΠΟΣΤΟΛΗ...');
            await window.PegasusCloud.push(true);
            if (typeof setSyncStatus === "function") setSyncStatus('online');
            console.log("📡 CAR: Cloud Sync Successful.");
        }
        
        this.load();
        alert("Τα στοιχεία του οχήματος αποθηκεύτηκαν και συγχρονίστηκαν.");
    },

    load: function() {
        const identity = JSON.parse(localStorage.getItem(CAR_M.car.identity)) || 
                         JSON.parse(localStorage.getItem(CAR_M.car.legacySpecs)) || {};
        
        const dates = JSON.parse(localStorage.getItem(CAR_M.car.dates)) || 
                      JSON.parse(localStorage.getItem(CAR_M.car.legacyDates)) || {};
        
        const fields = {
            'carPlate': identity.plate, 'carModel': identity.model,
            'carVin': identity.vin, 'carEngine': identity.eng,
            'carPower': identity.pwr, 'carIns': dates.ins,
            'carKteo': dates.kteo, 'carSrv': dates.srv
        };

        for (let id in fields) {
            const el = document.getElementById(id);
            if (el) el.value = fields[id] || "";
        }
        this.renderServiceLog();
    },

    addService: async function() {
        const t = document.getElementById('srvTask')?.value;
        const k = document.getElementById('srvKm')?.value;
        if (!t || !k) return;

        let logs = JSON.parse(localStorage.getItem(CAR_M.car.service)) || [];
        
        // 🛡️ DATE FORMAT FIX: Αποφυγή el-GR format trap
        const rawDate = new Date();
        const dateStrSafe = `${rawDate.getDate()}/${rawDate.getMonth() + 1}/${rawDate.getFullYear()}`;

        logs.unshift({ t: t.toUpperCase(), k: k.toLocaleString('el-GR'), d: dateStrSafe });
        
        localStorage.setItem(CAR_M.car.service, JSON.stringify(logs));
        
        if(document.getElementById('srvTask')) document.getElementById('srvTask').value = "";
        if(document.getElementById('srvKm')) document.getElementById('srvKm').value = "";
        
        this.renderServiceLog();
        if (window.PegasusCloud) await window.PegasusCloud.push(true);
    },

    renderServiceLog: function() {
        let logs = JSON.parse(localStorage.getItem(CAR_M.car.service));
        
        if (!logs || logs.length === 0) {
            logs = JSON.parse(localStorage.getItem(CAR_M.car.legacyService)) || [];
            if (logs.length > 0) localStorage.setItem(CAR_M.car.service, JSON.stringify(logs));
        }

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

    deleteLog: async function(idx) {
        if(!confirm("Οριστική διαγραφή αυτής της εργασίας;")) return;
        let logs = JSON.parse(localStorage.getItem(CAR_M.car.service)) || [];
        logs.splice(idx, 1);
        localStorage.setItem(CAR_M.car.service, JSON.stringify(logs));
        
        this.renderServiceLog();
        if (window.PegasusCloud) await window.PegasusCloud.push(true);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => window.PegasusCar.load(), 1500);
});

if (typeof window.registerPegasusModule === "function") {
    window.registerPegasusModule({ id: 'car', icon: '🚗', label: 'Όχημα' });
}
