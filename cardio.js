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
        const km = parseFloat(document.getElementById("cKm").value);
        const time = document.getElementById("cTime").value;
        const kcal = document.getElementById("cKcal").value;
        const rawDate = document.getElementById("cDate").value;

        if (!route || isNaN(km) || km <= 0) {
            alert("Συμπλήρωσε Διαδρομή και έγκυρα Χιλιόμετρα!");
            return;
        }

        const d = new Date(rawDate);
        const dateKey = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
        const entry = { route, km, time, kcal, date: dateKey };

        // 1. Αποθήκευση Cardio Log
        localStorage.setItem(`cardio_log_${dateKey}`, JSON.stringify(entry));

        // 2. Αθόρυβος Υπολογισμός Προόδου Ποδιών (+1 Σετ ανά 2 Km)
        const legSetsEarned = Math.max(1, Math.round(km / 2));
        const weeklyKey = 'pegasus_weekly_history';
        let weeklyStats;
        try {
            weeklyStats = JSON.parse(localStorage.getItem(weeklyKey)) || { "Στήθος": 0, "Πλάτη": 0, "Πόδια": 0, "Χέρια": 0, "Ώμοι": 0, "Κορμός": 0 };
        } catch(e) {
            weeklyStats = { "Στήθος": 0, "Πλάτη": 0, "Πόδια": 0, "Χέρια": 0, "Ώμοι": 0, "Κορμός": 0 };
        }
        
        weeklyStats["Πόδια"] = (weeklyStats["Πόδια"] || 0) + legSetsEarned;
        localStorage.setItem(weeklyKey, JSON.stringify(weeklyStats));

        // 3. Καθαρό Μήνυμα
        alert(`Αποθηκεύτηκε: ${route}`);
        this.close();
        
        // 4. Καθαρισμός Φόρμας
        document.getElementById("cRoute").value = "";
        document.getElementById("cKm").value = "";
        document.getElementById("cTime").value = "";
        document.getElementById("cKcal").value = "";
        
        // 5. Cloud Push & Άμεσο UI Reload
        if (typeof window.PegasusCloud !== "undefined" && window.PegasusCloud.isUnlocked) {
            window.PegasusCloud.push(true).then(() => {
                window.location.reload();
            });
        } else {
            window.location.reload();
        }
    }
};

window.saveCardioData = () => PegasusCardio.save();
window.addEventListener("load", () => PegasusCardio.init());
