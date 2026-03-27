/* ==========================================================================
   PEGASUS OS CORE ENGINE - CLEAN SWEEP v17.0
   Protocol: Master Orchestration | UI: Legacy Tactical Replica
   Logic: Syncs Data, Weather, Calories, and Voice Engines
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
     * 1. INITIALIZATION
     * Η εκκίνηση του συστήματος και η σύνδεση με το DOM
     */
    init: async function() {
        console.log("🚀 PEGASUS OS: Booting Master Orchestrator...");
        
        try {
            this.renderNavbar();
            await this.selectDay(this.getTodayGreek());
            this.bindButtons();
            
            if (window.PegasusLogger) window.PegasusLogger.log("System Nominal: All modules operational.", "SUCCESS");
        } catch (error) {
            console.error("❌ PEGASUS BOOT ERROR:", error);
        }
    },

    /**
     * 2. NAVBAR GENERATION
     * Δημιουργία των κουμπιών ημερών βάσει του Legacy UI
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
     * 3. DAY SELECTION LOGIC
     * Ενσωμάτωση του WeatherHandler για προσαρμογή προγράμματος
     */
    selectDay: async function(day) {
        this.currentDay = day;
        this.currentIndex = 0;
        this.currentSet = 1;
        this.isWorkoutRunning = false;
        clearInterval(this.timerInterval);

        // Update UI
        this.renderNavbar();
        
        // Λήψη προγράμματος με έλεγχο καιρού
        if (window.getFinalProgram) {
            this.sessionExercises = await window.getFinalProgram(day);
        } else {
            // Fallback αν λείπει ο weatherHandler
            this.sessionExercises = window.calculateDailyProgram(day);
        }

        this.renderExerciseList();
        this.updateMediaDisplay();
        
        if (window.PegasusLogger) window.PegasusLogger.log(`Program loaded for ${day}`, "INFO");
    },

    /**
     * 4. EXERCISE LIST RENDERING (Left Column)
     */
    renderExerciseList: function() {
        const container = document.getElementById('exList');
        if (!container) return;

        if (!Array.isArray(this.sessionExercises) || this.sessionExercises.length === 0) {
            container.innerHTML = '<div style="color:#666; padding:20px;">RECOVERY DAY / NO DATA</div>';
            return;
        }

        container.innerHTML = this.sessionExercises.map((ex, idx) => `
            <div class="exercise ${idx === this.currentIndex ? 'active' : ''}" id="ex-${idx}">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:900; font-size:13px; color:${idx === this.currentIndex ? '#4CAF50' : '#eee'};">
                        ${ex.name}
                    </span>
                    <span style="font-family:monospace; font-size:11px; color:#666;">
                        ${ex.sets} SETS
                    </span>
                </div>
                <div style="margin-top:5px; font-size:10px; color:#444;">
                    ${ex.muscleGroup} | ${ex.note || ''}
                </div>
            </div>
        `).join('');
    },

    /**
     * 5. WORKOUT CONTROLS
     */
    bindButtons: function() {
        const startBtn = document.getElementById('btnStart');
        const nextBtn = document.getElementById('btnNext');

        if (startBtn) startBtn.onclick = () => this.startWorkout();
        if (nextBtn) nextBtn.onclick = () => this.nextStep();
    },

    startWorkout: function() {
        if (this.sessionExercises.length === 0) return;
        
        this.isWorkoutRunning = true;
        this.startTimer();
        
        // Voice Notification
        if (window.PegasusVoice) {
            window.PegasusVoice.announceExercise(
                this.sessionExercises[this.currentIndex].name, 
                this.sessionExercises[this.currentIndex].sets
            );
        }
    },

    nextStep: function() {
        if (!this.isWorkoutRunning) return;

        const currentEx = this.sessionExercises[this.currentIndex];

        if (this.currentSet < currentEx.sets) {
            // Επόμενο Σετ
            this.currentSet++;
            if (window.PegasusLogger) window.PegasusLogger.log(`Set ${this.currentSet} initiated`, "INFO");
        } else {
            // Επόμενη Άσκηση
            if (this.currentIndex < this.sessionExercises.length - 1) {
                this.currentIndex++;
                this.currentSet = 1;
                this.updateMediaDisplay();
                this.renderExerciseList();
                
                if (window.PegasusVoice) {
                    window.PegasusVoice.announceExercise(
                        this.sessionExercises[this.currentIndex].name, 
                        this.sessionExercises[this.currentIndex].sets
                    );
                }
            } else {
                this.finishWorkout();
            }
        }
    },

    /**
     * 6. MEDIA & TIMER UPDATES
     */
    updateMediaDisplay: function() {
        const media = document.getElementById('mainMedia');
        if (!media || this.sessionExercises.length === 0) return;

        const currentEx = this.sessionExercises[this.currentIndex];
        
        // Αναζήτηση βίντεο/εικόνας βάσει ονόματος άσκησης
        // Αν δεν υπάρχει βίντεο, χρησιμοποιούμε το default poster
        const fileName = currentEx.name.replace(/\s+/g, '_').toLowerCase();
        media.src = `videos/${fileName}.mp4`;
        
        // Fallback σε JPG αν το MP4 αποτύχει (handled by browser or error event)
        media.onerror = () => {
            media.src = `images/${fileName}.jpg`;
            media.onerror = () => { media.src = 'images/poster.jpg'; };
        };
    },

    startTimer: function() {
        const timerDisplay = document.getElementById('phaseTimer');
        this.totalSeconds = 0;
        
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            this.totalSeconds++;
            const mins = Math.floor(this.totalSeconds / 60);
            const secs = this.totalSeconds % 60;
            if (timerDisplay) {
                timerDisplay.textContent = 
                    `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }
            
            // Metabolic Calculation every 30 seconds
            if (this.totalSeconds % 30 === 0 && window.PegasusMetabolic) {
                window.PegasusMetabolic.updateLiveKcal();
            }
        }, 1000);
    },

    finishWorkout: function() {
        this.isWorkoutRunning = false;
        clearInterval(this.timerInterval);
        
        if (window.PegasusVoice) window.PegasusVoice.announceFinish();
        if (window.PegasusReporting) window.PegasusReporting.saveWorkout(document.querySelector('.kcal-value').textContent);
        
        alert("ΣΥΣΤΗΜΑ: Η προπόνηση ολοκληρώθηκε επιτυχώς.");
    },

    getTodayGreek: function() {
        const days = ["ΚΥΡΙΑΚΗ", "ΔΕΥΤΕΡΑ", "ΤΡΙΤΗ", "ΤΕΤΑΡΤΗ", "ΠΕΜΠΤΗ", "ΠΑΡΑΣΚΕΥΗ", "ΣΑΒΒΑΤΟ"];
        return days[new Date().getDay()];
    }
};

// Global Access
window.PegasusApp = PegasusApp;
window.selectDay = (day) => PegasusApp.selectDay(day);

// Boot Logic
window.addEventListener('load', () => {
    PegasusApp.init();
});
