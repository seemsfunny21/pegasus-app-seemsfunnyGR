/* ===== PEGASUS OS - VEHICLE MANAGEMENT MODULE v1.2 ===== */
window.PegasusCar = {
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

        // Key Alignment με το cloudSync.js
        localStorage.setItem("pegasus_car_specs", JSON.stringify(identity));
        localStorage.setItem("pegasus_car_dates", JSON.stringify(dates));
        
        if (window.PegasusCloud && window.PegasusCloud.push) {
            if (typeof setSyncStatus === "function") setSyncStatus('ΑΠΟΣΤΟΛΗ...');
            await window.PegasusCloud.push();
            if (typeof setSyncStatus === "function") setSyncStatus('online');
        }
        this.load();
    },

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

    addService: async function() {
        const t = document.getElementById('srvTask')?.value;
        const k = document.getElementById('srvKm')?.value;
        if (!t || !k) return;

        let logs = JSON.parse(localStorage.getItem("pegasus_car_service")) || [];
        logs.unshift({ t, k, d: new Date().toLocaleDateString('el-GR') });
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
