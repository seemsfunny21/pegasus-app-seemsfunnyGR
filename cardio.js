const PegasusCardio = {
    init: function() {
        const btn = document.getElementById("totalWorkoutsDisplay");
        if (btn) {
            btn.onclick = () => this.open();
        }
    },

    open: function() {
        document.getElementById("cardioPanel").style.display = "block";
        const today = new Date().toISOString().split('T')[0];
        document.getElementById("cDate").value = today;
    },

    close: function() {
        document.getElementById("cardioPanel").style.display = "none";
    },

    save: function() {
        const route = document.getElementById("cRoute").value;
        const km = document.getElementById("cKm").value;
        const time = document.getElementById("cTime").value;
        const kcal = document.getElementById("cKcal").value;
        const rawDate = document.getElementById("cDate").value;

        if (!route || !km) {
            alert("Συμπλήρωσε Διαδρομή και Χιλιόμετρα!");
            return;
        }

        const d = new Date(rawDate);
        const dateKey = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;

        const entry = {
            route: route,
            km: km,
            time: time,
            kcal: kcal,
            date: dateKey
        };

        // Αποθήκευση για το Reporting
        localStorage.setItem(`cardio_log_${dateKey}`, JSON.stringify(entry));

        alert(`Η διαδρομή "${route}" αποθηκεύτηκε!`);
        this.close();
        
        // Καθαρισμός φορμας
        document.getElementById("cRoute").value = "";
        document.getElementById("cKm").value = "";
        document.getElementById("cTime").value = "";
        document.getElementById("cKcal").value = "";
    }
};

// Αυτό συνδέει το onclick="saveCardioData()" του HTML σου
window.saveCardioData = () => PegasusCardio.save();

window.addEventListener("load", () => PegasusCardio.init());