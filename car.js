/* ==========================================================================
   PEGASUS OS - VEHICLE MANAGEMENT MODULE (v1.0)
   Protocol: Strict Cloud Sync & Identity Mapping
   ========================================================================== */

window.PegasusCar = {
    // 1. Αποθήκευση Τεχνικών Χαρακτηριστικών (Local Identity)
    saveSpecs: function() {
        const identity = {
            plate: document.getElementById('carPlate').value,
            model: document.getElementById('carModel').value,
            vin: document.getElementById('carVin').value,
            eng: document.getElementById('carEngine').value,
            pwr: document.getElementById('carPower').value
        };
        const dates = {
            ins: document.getElementById('carIns').value,
            kteo: document.getElementById('carKteo').value,
            srv: document.getElementById('carSrv').value
        };

        localStorage.setItem("peg_car_identity", JSON.stringify(identity));
        localStorage.setItem("pegasus_car_dates", JSON.stringify(dates));
        
        console.log("🚗 CAR MODULE: Identity Saved Local.");
        this.load();
        if (window.PegasusCloud) window.PegasusCloud.push();
    },

    // 2. Φόρτωση Δεδομένων στα Inputs
    load: function() {
        const identity = JSON.parse(localStorage.getItem("peg_car_identity")) || {};
        const dates = JSON.parse(localStorage.getItem("pegasus_car_dates")) || {};
        
        // Mapping values to UI
        if(window.bindCopy) {
            bindCopy('carPlate', identity.plate);
            bindCopy('carModel', identity.model);
            bindCopy('carVin', identity.vin);
            bindCopy('carEngine', identity.eng);
            bindCopy('carPower', identity.pwr);
            bindCopy('carIns', dates.ins);
            bindCopy('carKteo', dates.kteo);
            bindCopy('carSrv', dates.srv);
        }

        this.renderServiceLog();
    },

    // 3. Προσθήκη Νέας Εργασίας (Service)
    addService: function() {
        const task = document.getElementById('srvTask').value;
        const km = document.getElementById('srvKm').value;
        
        if (!task || !km) return;

        let logs = JSON.parse(localStorage.getItem("pegasus_car_service")) || [];
        logs.unshift({
            t: task,
            k: km,
            d: new Date().toLocaleDateString('el-GR')
        });

        localStorage.setItem("pegasus_car_service", JSON.stringify(logs));
        
        // Reset inputs
        document.getElementById('srvTask').value = "";
        document.getElementById('srvKm').value = "";
        
        this.renderServiceLog();
        if (window.PegasusCloud) window.PegasusCloud.push();
    },

    // 4. Σχεδίαση Ιστορικού
    renderServiceLog: function() {
        const logs = JSON.parse(localStorage.getItem("pegasus_car_service")) || [];
        const container = document.getElementById("serviceLogList");
        if (!container) return;

        container.innerHTML = logs.map(i => `
            <div class="log-item">
                <div style="font-weight:bold; color:var(--main);">${i.t}</div>
                <div style="font-size:11px; color:#aaa;">${i.k} χλμ | ${i.d}</div>
            </div>
        `).join('');
    }
};

// Auto-init on script load
console.log("🚗 PEGASUS CAR: Module Operational.");
