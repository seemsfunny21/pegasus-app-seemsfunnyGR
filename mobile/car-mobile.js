/* ==========================================================================
   PEGASUS OS - VEHICLE MANAGEMENT MODULE (MOBILE EDITION v14.7)
   Protocol: Strict Identity Mapping, Key Bridging & Async Cloud Render
   Status: OPTIMIZED FOR MOBILE SYNC
   ========================================================================== */

window.PegasusCar = {
    // 1. Αποθήκευση Τεχνικών Χαρακτηριστικών & Ημερομηνιών
    saveSpecs: async function() {
        console.log("🚗 CAR: Initiating Save Protocol...");
        
        // Identity Mapping (Πινακίδα, Μοντέλο, VIN, Κινητήρας, Ισχύς)
        const identity = {
            plate: document.getElementById('carPlate')?.value || "",
            model: document.getElementById('carModel')?.value || "",
            vin: document.getElementById('carVin')?.value || "",
            eng: document.getElementById('carEngine')?.value || "",
            pwr: document.getElementById('carPower')?.value || ""
        };

        // Dates Mapping (Ασφάλεια, ΚΤΕΟ, Service)
        const dates = {
            ins: document.getElementById('carIns')?.value || "",
            kteo: document.getElementById('carKteo')?.value || "",
            srv: document.getElementById('carSrv')?.value || ""
        };

        // Τοπική Αποθήκευση (Διπλή εγγραφή για ασφάλεια)
        localStorage.setItem("peg_car_identity", JSON.stringify(identity));
        localStorage.setItem("pegasus_car_identity", JSON.stringify(identity));
        localStorage.setItem("pegasus_car_dates", JSON.stringify(dates));
        localStorage.setItem("peg_car_dates", JSON.stringify(dates));
        
        // Κλείδωμα πεδίων μετά την αποθήκευση
        document.querySelectorAll('#car input').forEach(el => el.setAttribute('readonly', true));
        
        console.log("✅ CAR: Specs Secured Locally.");

        // Συγχρονισμός με Cloud
        if (window.PegasusCloud) {
            await window.PegasusCloud.push(true);
            console.log("📡 CAR: Cloud Sync Successful.");
        }
        
        this.load(); // Επαναφόρτωση για UI Consistency
        alert("Τα στοιχεία του οχήματος ενημερώθηκαν.");
    },

    // 2. Φόρτωση Δεδομένων στα Inputs του UI (Bridged Reading)
    load: function() {
        // Διαβάζει από το νέο ή το παλιό κλειδί για να μη χάσει τίποτα
        const identity = JSON.parse(localStorage.getItem("pegasus_car_identity")) || JSON.parse(localStorage.getItem("peg_car_identity")) || {};
        const dates = JSON.parse(localStorage.getItem("pegasus_car_dates")) || JSON.parse(localStorage.getItem("peg_car_dates")) || {};
        
        // Mapping τιμών στα IDs του mobile.html
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
            if (el) {
                el.value = fields[id] || "";
            }
        }

        this.renderServiceLog();
    },

    // 3. Προσθήκη Νέας Εργασίας στο Ιστορικό
    addService: async function() {
        const task = document.getElementById('srvTask')?.value;
        const km = document.getElementById('srvKm')?.value;
        
        if (!task || !km) {
            alert("Παρακαλώ συμπληρώστε Εργασία και Χιλιόμετρα.");
            return;
        }

        // Maximalist Retention: Λήψη υπάρχοντος ιστορικού (Bridged)
        let logs = JSON.parse(localStorage.getItem("pegasus_car_service"));
        if (!logs || logs.length === 0) logs = JSON.parse(localStorage.getItem("peg_car_service")) || [];
        
        // Προσθήκη στην αρχή (Newest First)
        logs.unshift({
            t: task.toUpperCase(),
            k: km.toLocaleString('el-GR'),
            d: new Date().toLocaleDateString('el-GR')
        });

        localStorage.setItem("pegasus_car_service", JSON.stringify(logs));
        localStorage.setItem("peg_car_service", JSON.stringify(logs)); // Mirror key
        
        // Reset Inputs
        if(document.getElementById('srvTask')) document.getElementById('srvTask').value = "";
        if(document.getElementById('srvKm')) document.getElementById('srvKm').value = "";
        
        console.log(`🔧 CAR: New Service Logged - ${task} @ ${km} km`);
        
        this.renderServiceLog();
        
        if (window.PegasusCloud) await window.PegasusCloud.push(true);
    },

    // 4. Σχεδίαση του Ιστορικού (Service Log) στην οθόνη (Bridged Reading)
    renderServiceLog: function() {
        // 🟢 ΑΣΠΙΔΑ: Έλεγχος στο νέο κλειδί, αλλιώς ψάχνει στο παλιό (Legacy Backup)
        let logs = JSON.parse(localStorage.getItem("pegasus_car_service"));
        if (!logs || logs.length === 0) {
            logs = JSON.parse(localStorage.getItem("peg_car_service")) || [];
            // Αν τα βρει στο παλιό, τα γράφει στο νέο για μελλοντική ταχύτητα
            if (logs.length > 0) localStorage.setItem("pegasus_car_service", JSON.stringify(logs));
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

    // 5. Διαγραφή Εγγραφής από το Ιστορικό
    deleteLog: async function(idx) {
        if(!confirm("Οριστική διαγραφή αυτής της εργασίας;")) return;
        
        let logs = JSON.parse(localStorage.getItem("pegasus_car_service")) || JSON.parse(localStorage.getItem("peg_car_service")) || [];
        logs.splice(idx, 1);
        
        localStorage.setItem("pegasus_car_service", JSON.stringify(logs));
        localStorage.setItem("peg_car_service", JSON.stringify(logs));
        
        this.renderServiceLog();
        if (window.PegasusCloud) await window.PegasusCloud.push(true);
    }
};

// Initial Load - Αυξημένος χρόνος (1.8s) για να προλάβει το Cloud να φέρει τα δεδομένα στο κινητό
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => window.PegasusCar.load(), 1800);
});
