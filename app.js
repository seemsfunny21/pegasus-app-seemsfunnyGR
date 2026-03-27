/* ==========================================================================
   PEGASUS OS CORE ENGINE - LEGACY RESTORATION v17.0
   Protocol: Full UI Matching | Target: Screenshot 104313 Compatibility
   ========================================================================== */

const PegasusApp = {
    currentDay: "ΔΕΥΤΕΡΑ",
    sessionExercises: [],
    currentIndex: 0,
    currentSet: 1,
    isWorkoutRunning: false,
    timerInterval: null,
    totalSeconds: 0,

    /**
     * 1. BOOT SEQUENCE
     */
    init: async function() {
        console.log("🛡️ PEGASUS: Legacy UI Booting...");
        try {
            this.renderNavbar(); // Δημιουργία ημερών (Δευτέρα - Κυριακή)
            await this.selectDay(this.getTodayGreek());
            this.bindControls();
            
            if (window.PegasusLogger) window.PegasusLogger.log("Legacy System Operational", "SUCCESS");
        } catch (e) {
            console.error("Critical Boot Error:", e);
        }
    },

    /**
     * 2. DAY NAVIGATION (Top Bar)
     */
    renderNavbar: function() {
        const days = ["ΔΕΥΤΕΡΑ", "ΤΡΙΤΗ", "ΤΕΤΑΡΤΗ", "ΠΕΜΠΤΗ", "ΠΑΡΑΣΚΕΥΗ", "ΣΑΒΒΑΤΟ", "ΚΥΡΙΑΚΗ"];
        const nav = document.getElementById('navbar');
        if (!nav) return;

        nav.innerHTML = days.map(day => `
            <button class="${day === this.currentDay ? 'active' : ''}" 
                    onclick="PegasusApp.selectDay('${day}')">${day}</button>
        `).join('');
    },

    /**
     * 3. SELECT DAY & LOAD PROGRAM
     */
    selectDay: async function(day) {
        this.currentDay = day;
        this.currentIndex = 0;
        this.currentSet = 0; // Ξεκινάμε από το "Ready" state
        this.isWorkoutRunning = false;
        clearInterval(this.timerInterval);

        this.renderNavbar();

        // Λήψη προγράμματος με έλεγχο καιρού
        if (window.getFinalProgram) {
            this.sessionExercises = await window.getFinalProgram(day);
        } else {
            this.sessionExercises = window.calculateDailyProgram(day);
        }

        this.renderExerciseList();
        this.updateMediaDisplay();
        this.resetTimerDisplay();
    },

    /**
     * 4. RENDER EXERCISE CARDS (Left Column)
     * Αναπαραγωγή του Look: [0/2 | Name | kg]
     */
    renderExerciseList: function() {
        const container = document.getElementById('exList');
        if (!container) return;

        if (!this.sessionExercises || this.sessionExercises.length === 0) {
            container.innerHTML = '<div style="color:#444; padding:10px;">RECOVERY DAY</div>';
            return;
        }

        container.innerHTML = this.sessionExercises.map((ex, idx) => {
            const isActive = idx === this.currentIndex;
            // Υπολογισμός προόδου σετ (π.χ. 0/4)
            const progress = isActive && this.isWorkoutRunning ? this.currentSet : 0;
            
            return `
                <div class="ex-card ${isActive ? 'active' : ''}" id="ex-${idx}">
                    <div class="ex-progress">${progress}/${ex.sets}</div>
                    <div class="ex-name">${ex.name}</div>
                    <div class="ex-weight">
                        <input type="text" placeholder="kg" id="weight-${idx}">
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * 5. MEDIA ENGINE (Center Video/Image)
     */
    updateMediaDisplay: function() {
        const media = document.getElementById('mainMedia');
        const overlay = document.getElementById('exerciseOverlay');
        
        if (!this.sessionExercises[this.currentIndex]) return;
        
        const current = this.sessionExercises[this.currentIndex];
        const fileName = current.name.replace(/\s+/g, '_').toLowerCase();

        // Ενημέρωση Media
        if (media) {
            media.src = `videos/${fileName}.mp4`;
            media.onerror = () => { media.src = `images/${fileName}.jpg`; };
        }

        // Ενημέρωση Μπλε Overlay
        if (overlay) {
            overlay.textContent = current.name;
        }
    },

    /**
     * 6. WORKOUT CONTROLS
     */
    bindControls: function() {
        document.getElementById('btnStart').onclick = () => this.startWorkout();
        document.getElementById('btnNext').onclick = () => this.nextStep();
    },

    startWorkout: function() {
        if (this.sessionExercises.length === 0) return;
        this.isWorkoutRunning = true;
        this.currentSet = 1;
        this.renderExerciseList();
        this.startTimer();
        
        if (window.PegasusVoice) window.PegasusVoice.announceExercise(this.sessionExercises[0].name, this.sessionExercises[0].sets);
    },

    nextStep: function() {
        if (!this.isWorkoutRunning) return;

        const currentEx = this.sessionExercises[this.currentIndex];

        if (this.currentSet < currentEx.sets) {
            this.currentSet++;
            this.renderExerciseList();
        } else {
            if (this.currentIndex < this.sessionExercises.length - 1) {
                this.currentIndex++;
                this.currentSet = 1;
                this.renderExerciseList();
                this.updateMediaDisplay();
                if (window.PegasusVoice) window.PegasusVoice.announceExercise(this.sessionExercises[this.currentIndex].name, this.sessionExercises[this.currentIndex].sets);
            } else {
                this.finishWorkout();
            }
        }
    },

    /**
     * 7. TIMER & CALORIES
     */
    startTimer: function() {
        const timerEl = document.getElementById('phaseTimer');
        this.totalSeconds = 0;
        clearInterval(this.timerInterval);

        this.timerInterval = setInterval(() => {
            this.totalSeconds++;
            const mins = Math.floor(this.totalSeconds / 60);
            const secs = this.totalSeconds % 60;
            if (timerEl) timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            
            // Κάθε 30" ενημέρωση θερμίδων
            if (this.totalSeconds % 30 === 0 && window.PegasusMetabolic) {
                window.PegasusMetabolic.updateLiveKcal();
            }
        }, 1000);
    },

    resetTimerDisplay: function() {
        const timerEl = document.getElementById('phaseTimer');
        if (timerEl) timerEl.textContent = "00:00";
    },

    finishWorkout: function() {
        this.isWorkoutRunning = false;
        clearInterval(this.timerInterval);
        alert("ΣΥΣΤΗΜΑ: Προπόνηση Ολοκληρώθηκε.");
        if (window.PegasusReporting) window.PegasusReporting.saveWorkout(document.querySelector('.kcal-value').textContent);
    },

    getTodayGreek: function() {
        const days = ["ΚΥΡΙΑΚΗ", "ΔΕΥΤΕΡΑ", "ΤΡΙΤΗ", "ΤΕΤΑΡΤΗ", "ΠΕΜΠΤΗ", "ΠΑΡΑΣΚΕΥΗ", "ΣΑΒΒΑΤΟ"];
        return days[new Date().getDay()];
    }
};

window.PegasusApp = PegasusApp;
window.addEventListener('load', () => PegasusApp.init());
