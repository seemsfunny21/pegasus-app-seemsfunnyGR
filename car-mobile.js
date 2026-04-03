/* ==========================================================================
   PEGASUS OS - VEHICLE MANAGEMENT MODULE (v1.2)
   Protocol: Strict Cloud Sync Alignment
   ========================================================================== */

window.PegasusCar = {
    // 1. Αποθήκευση με το ΣΩΣΤΟ KEY για το Cloud (pegasus_car_specs)
    saveSpecs: async function() {
        const identity = {
            plate: document.getElementById('carPlate').value,
            model: document.getElementById('carModel').value,
            vin: document.getElementById('carVin').value
        };
        const dates = {
            ins: document.getElementById('carIns').value,
            kteo: document.getElementById('carKteo').value,
            srv: document.getElementById('carSrv').value
        };

        // ΑΛΛΑΓΗ ΕΔΩ: Χρήση των Keys που περιμένει το cloudSync.js
        localStorage.setItem("pegasus_car_specs", JSON.stringify(identity));
        localStorage.setItem("pegasus_car_dates", JSON.stringify(dates));
        
        console.log("🚗 CAR MODULE: Data Saved with Cloud Sync Keys.");
        
        // Force Push για να κλειδώσουν στο Cloud αμέσως
        if (window.PegasusCloud && window.PegasusCloud.push) {
            await window.PegasusCloud.push();
        }

        this.load();
    },

    // 2. Φόρτωση από τα ΣΩΣΤΑ KEYS
    load: function() {
        const identity = JSON.parse(localStorage.getItem("pegasus_car_specs")) || {};
        const dates = JSON.parse(localStorage.getItem("pegasus_car_dates")) || {};
        
        if (document.getElementById('carPlate')) document.getElementById('carPlate').value = identity.plate || "";
        if (document.getElementById('carModel')) document.getElementById('carModel').value = identity.model || "";
        if (document.getElementById('carVin')) document.getElementById('carVin').value = identity.vin || "";
        if (document.getElementById('carIns')) document.getElementById('carIns').value = dates.ins || "";
        if (document.getElementById('carKteo')) document.getElementById('carKteo').value = dates.kteo || "";
        if (document.getElementById('carSrv')) document.getElementById('carSrv').value = dates.srv || "";

        this.renderServiceLog();
    },

    addService: async function() {
        const task = document.getElementById('srvTask')?.value;
        const km = document.getElementById('srvKm')?.value;
        if (!task || !km) return;

        let logs = JSON.parse(localStorage.getItem("pegasus_car_service")) || [];
        logs.unshift({ t: task, k: km, d: new Date().toLocaleDateString('el-GR') });
        localStorage.setItem("pegasus_car_service", JSON.stringify(logs));
        
        document.getElementById('srvTask').value = "";
        document.getElementById('srvKm').value = "";
        this.renderServiceLog();
        
        if (window.PegasusCloud) await window.PegasusCloud.push();
    },

    renderServiceLog: function() {
        const logs = JSON.parse(localStorage.getItem("pegasus_car_service")) || [];
        const container = document.getElementById("serviceLogList");
        if (!container) return;
        container.innerHTML = logs.map(i => `
            <div class="log-item">
                <div style="font-weight:bold; color:var(--main);">${i.t}</div>
                <div style="font-size:11px; color:#aaa;">${i.k} χλμ | ${i.d}</div>
            </div>`).join('');
    }
};

console.log("🚗 PEGASUS CAR: Module v1.2 Aligned with Cloud.");
