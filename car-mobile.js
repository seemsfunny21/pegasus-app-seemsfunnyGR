/* ==========================================================================
   PEGASUS OS - VEHICLE MANAGEMENT MODULE (v1.1)
   Protocol: Strict Cloud Sync & Direct UI Mapping
   ========================================================================== */

window.PegasusCar = {
    // 1. Αποθήκευση Τεχνικών Χαρακτηριστικών (Local Identity & Sync)
    saveSpecs: async function() {
        const identity = {
            plate: document.getElementById('carPlate').value,
            model: document.getElementById('carModel').value,
            vin: document.getElementById('carVin').value,
            // Χρήση σωστών ID βάσει mobile.html (τα carEngine/carPower λείπουν από το HTML)
            eng: identity?.eng || "", 
            pwr: identity?.pwr || ""
        };
        const dates = {
            ins: document.getElementById('carIns').value,
            kteo: document.getElementById('carKteo').value,
            srv: document.getElementById('carSrv').value
        };

        localStorage.setItem("peg_car_identity", JSON.stringify(identity));
        localStorage.setItem("pegasus_car_dates", JSON.stringify(dates));
        
        console.log("🚗 CAR MODULE: Identity Saved Local.");
        
        // Force Cloud Sync
        if (window.PegasusCloud && window.PegasusCloud.push) {
            await window.PegasusCloud.push();
            console.log("☁️ CAR MODULE: Cloud Synced.");
        }

        this.load();
    },

    // 2. Φόρτωση Δεδομένων στα Inputs (Direct DOM Access)
    load: function() {
        const identity = JSON.parse(localStorage.getItem("peg_car_identity")) || {};
        const dates = JSON.parse(localStorage.getItem("pegasus_car_dates")) || {};
        
        // Απευθείας ανάθεση αντί για bindCopy που προκαλεί σφάλματα
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

    // 3. Προσθήκη Νέας Εργασίας (Service)
    addService: async function() {
        const task = document.getElementById('srvTask')?.value;
        const km = document.getElementById('srvKm')?.value;
        
        if (!task || !km) return;

        let logs = JSON.parse(localStorage.getItem("pegasus_car_service")) || [];
        logs.unshift({
            t: task,
            k: km,
            d: new Date().toLocaleDateString('el-GR')
        });

        localStorage.setItem("pegasus_car_service", JSON.stringify(logs));
        
        if (document.getElementById('srvTask')) document.getElementById('srvTask').value = "";
        if (document.getElementById('srvKm')) document.getElementById('srvKm').value = "";
        
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

// Auto-init on script load
console.log("🚗 PEGASUS CAR: Module Operational (v1.1).");
