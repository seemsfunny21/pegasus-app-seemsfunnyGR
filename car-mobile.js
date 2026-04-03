/* ==========================================================================
   PEGASUS OS - VEHICLE MANAGEMENT MODULE (v1.2)
   Protocol: Strict Cloud Sync & Direct UI Mapping
   Alignment: Maximalist Retention & Key Consistency
   ========================================================================== */

window.PegasusCar = {
    // 1. Αποθήκευση Τεχνικών Χαρακτηριστικών
    saveSpecs: async function() {
        // Ανάκτηση παλαιών δεδομένων για διατήρηση eng/pwr αν δεν υπάρχουν στο UI
        const oldData = JSON.parse(localStorage.getItem("pegasus_car_specs")) || {};

        const identity = {
            plate: document.getElementById('carPlate').value,
            model: document.getElementById('carModel').value,
            vin: document.getElementById('carVin').value,
            eng: oldData.eng || "", 
            pwr: oldData.pwr || ""
        };
        
        const dates = {
            ins: document.getElementById('carIns').value,
            kteo: document.getElementById('carKteo').value,
            srv: document.getElementById('carSrv').value
        };

        // Χρήση του pegasus_car_specs για αυτόματο συγχρονισμό από το cloudSync.js
        localStorage.setItem("pegasus_car_specs", JSON.stringify(identity));
        localStorage.setItem("pegasus_car_dates", JSON.stringify(dates));
        
        console.log("🚗 CAR MODULE: Identity & Dates Saved Local.");
        
        // Άμεσο Force Push στο Cloud
        if (window.PegasusCloud && window.PegasusCloud.push) {
            setSyncStatus('ΑΠΟΣΤΟΛΗ...');
            await window.PegasusCloud.push();
            setSyncStatus('online');
            console.log("☁️ CAR MODULE: Cloud Vault Updated.");
        }

        this.load();
    },

    // 2. Φόρτωση Δεδομένων (Direct DOM Mapping)
    load: function() {
        const identity = JSON.parse(localStorage.getItem("pegasus_car_specs")) || {};
        const dates = JSON.parse(localStorage.getItem("pegasus_car_dates")) || {};
        
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val || "";
        };

        setVal('carPlate', identity.plate);
        setVal('carModel', identity.model);
        setVal('carVin', identity.vin);
        setVal('carIns', dates.ins);
        setVal('carKteo', dates.kteo);
        setVal('carSrv', dates.srv);

        this.renderServiceLog();
    },

    // 3. Προσθήκη Service με Cloud Interceptor
    addService: async function() {
        const taskEl = document.getElementById('srvTask');
        const kmEl = document.getElementById('srvKm');
        
        if (!taskEl?.value || !kmEl?.value) return;

        let logs = JSON.parse(localStorage.getItem("pegasus_car_service")) || [];
        logs.unshift({
            t: taskEl.value,
            k: kmEl.value,
            d: new Date().toLocaleDateString('el-GR')
        });

        localStorage.setItem("pegasus_car_service", JSON.stringify(logs));
        
        taskEl.value = "";
        kmEl.value = "";
        
        this.renderServiceLog();
        
        if (window.PegasusCloud && window.PegasusCloud.push) {
            await window.PegasusCloud.push();
        }
    },

    // 4. Σχεδίαση Ιστορικού (Tactical Grid)
    renderServiceLog: function() {
        const logs = JSON.parse(localStorage.getItem("pegasus_car_service")) || [];
        const container = document.getElementById("serviceLogList");
        if (!container) return;

        container.innerHTML = logs.map(i => `
            <div class="log-item">
                <div style="font-weight:bold; color:var(--main); font-size:13px;">${i.t}</div>
                <div style="font-size:11px; color:#aaa; margin-top:4px;">${i.k} χλμ | ${i.d}</div>
            </div>
        `).join('');
    }
};

console.log("🚗 PEGASUS CAR: Module Operational (v1.2).");
