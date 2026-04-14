window.PegasusEMS = {
    timer: null,
    seconds: 1500, // 25 λεπτά

    start: function() {
        if (this.timer) return;
        this.timer = setInterval(() => this.tick(), 1000);
        document.getElementById('emsTimeControls').style.display = 'grid';
        console.log("⚡ EMS: Session Started.");
    },

    tick: function() {
        if (this.seconds <= 0) {
            clearInterval(this.timer);
            this.complete();
            return;
        }
        this.seconds--;
        this.updateUI();
    },

    adjust: function(secs) {
        this.seconds = Math.max(0, this.seconds + secs);
        this.updateUI();
    },

    updateUI: function() {
        const min = String(Math.floor(this.seconds/60)).padStart(2,'0');
        const sec = String(this.seconds%60).padStart(2,'0');
        document.getElementById('phaseTimer').textContent = `${min}:${sec}`;
        
        const progress = ((1500 - this.seconds) / 1500) * 100;
        document.getElementById('mainProgressBar').style.width = progress + '%';
        document.getElementById('totalProgress').textContent = Math.round(progress) + '%';
    },

    complete: async function() {
        const kcal = prompt("ΣΥΝΟΛΙΚΑ KCAL ΣΥΝΕΔΡΙΑΣ:", "747");
        if (kcal) {
            let h = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
            // Το EMS δίνει 6 σετ σε όλες τις μυϊκές ομάδες λόγω καθολικής διέγερσης
            const groups = ["Στήθος", "Πλάτη", "Πόδια", "Χέρια", "Ώμοι", "Κορμός"];
const dateStr = new Date().toLocaleDateString('el-GR');
            const hasCardio = localStorage.getItem("pegasus_cardio_kcal_" + dateStr);

            groups.forEach(g => {
                if (g === "Πόδια" && hasCardio) {
                    console.log("⚡ EMS: Παράλειψη ποδιών (Καλύφθηκαν ήδη από το Cardio).");
                } else {
                    h[g] = (h[g] || 0) + 6;
                }
            });
            localStorage.setItem('pegasus_weekly_history', JSON.stringify(h));
            console.log("⚡ EMS: Full Body Sets Logged.");
            if(window.PegasusCloud) await PegasusCloud.push();
            location.reload();
        }
    }
};
