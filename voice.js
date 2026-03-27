/* ==========================================================================
   PEGASUS VOICE ENGINE - CLEAN SWEEP v17.0
   Protocol: Audio Guidance | Logic: Speech Queue Management (el-GR)
   ========================================================================== */

const PegasusVoice = {
    enabled: true,
    synth: window.speechSynthesis,
    voice: null,

    /**
     * Αρχικοποίηση Φωνής
     */
    init: function() {
        // Αναμονή για τη φόρτωση των διαθέσιμων φωνών
        const setVoice = () => {
            const voices = this.synth.getVoices();
            // Αναζήτηση για την καλύτερη Ελληνική φωνή (π.χ. Google Ελληνικά)
            this.voice = voices.find(v => v.lang.includes('el')) || voices[0];
        };

        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = setVoice;
        }
        setVoice();

        // Έλεγχος Mute από το UI
        const muteBtn = document.getElementById('btnMute');
        if (muteBtn) {
            muteBtn.onclick = () => {
                this.enabled = !this.enabled;
                muteBtn.innerHTML = this.enabled ? "🔊" : "🔇";
                if (window.PegasusLogger) window.PegasusLogger.log(`Voice Engine: ${this.enabled ? 'ON' : 'OFF'}`, "INFO");
            };
        }
    },

    /**
     * Κύρια συνάρτηση ομιλίας
     */
    speak: function(text) {
        if (!this.enabled || !text) return;

        // Ακύρωση προηγούμενης ομιλίας για αποφυγή καθυστερήσεων
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.voice;
        utterance.lang = 'el-GR';
        utterance.pitch = 1.0;
        utterance.rate = 1.1; // Ελαφρώς πιο γρήγορο για tactical αίσθηση

        this.synth.speak(utterance);
    },

    /**
     * Tactical Announcements
     */
    announceExercise: function(name, sets) {
        const cleanName = name.replace(/[()]/g, ""); // Αφαίρεση παρενθέσεων για καθαρή ομιλία
        this.speak(`Επόμενη άσκηση: ${cleanName}. Σετ: ${sets}. Προετοιμαστείτε.`);
    },

    announceRest: function(seconds) {
        this.speak(`Άσκηση ολοκληρώθηκε. Διάλειμμα ${seconds} δευτερόλεπτα.`);
    },

    announceTimeWarning: function(seconds) {
        this.speak(`${seconds} δευτερόλεπτα ακόμα.`);
    },

    announceFinish: function() {
        this.speak("Η προπόνηση ολοκληρώθηκε. Εξαιρετική δουλειά Άγγελε.");
    }
};

// Integration με τον κινητήρα του App (app.js Hook)
window.PegasusVoice = PegasusVoice;

window.addEventListener('load', () => {
    PegasusVoice.init();
});