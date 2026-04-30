/* ==========================================================================
   PEGASUS VOICE ENGINE - CLEAN SWEEP v17.1 (MASTER SYNC EDITION)
   Protocol: Audio Guidance | Logic: Speech Queue Management (el-GR)
   Status: FINAL STABLE | FIXED: GLOBAL MUTE, iOS WEBKIT & PARTNER SYNC
   ========================================================================== */

const PegasusVoice = {
    synth: window.speechSynthesis,
    voice: null,

    /**
     * Αρχικοποίηση Φωνής (iOS Shielded)
     */
    init: function() {
        const setVoice = () => {
            const voices = this.synth.getVoices();
            if (voices.length === 0) return; // 🛡️ iOS WebKit Protection

            // Αναζήτηση για την καλύτερη Ελληνική φωνή (π.χ. Google Ελληνικά ή Apple Greek)
            this.voice = voices.find(v => v.lang.includes('el')) || voices[0];
            console.log(`🔊 PEGASUS VOICE: Engine locked to [${this.voice?.name || "System Default"}]`);
        };

        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = setVoice;
        }
        
        // Initial call in case voices are already loaded (Chrome/Desktop)
        setVoice();
    },

    /**
     * Κύρια συνάρτηση ομιλίας (Linked to Global Mute)
     */
    speak: function(text) {
        // 🎯 FIXED: Ακούει την κεντρική μεταβλητή window.muted του app.js
        if (window.muted || !text) return;

        // Ακύρωση προηγούμενης ομιλίας για αποφυγή καθυστερήσεων (Queue Flushing)
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Αν η φωνή δεν πρόλαβε να φορτώσει (σπάνιο σε iOS), κάνουμε force fallback στα Ελληνικά
        if (this.voice) {
            utterance.voice = this.voice;
        }
        
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
        // 🎯 FIXED: Δυναμική αναγνώριση του ενεργού αθλητή (Partner Mode Sync)
        let lifter = "Άγγελε";
        if (typeof window.getActiveLifter === "function") {
            const active = window.getActiveLifter();
            // Απλοποίηση κεφαλαίων για πιο φυσική εκφώνηση
            lifter = active.charAt(0).toUpperCase() + active.slice(1).toLowerCase(); 
        }
        
        this.speak(`Η προπόνηση ολοκληρώθηκε. Εξαιρετική δουλειά ${lifter}.`);
    }
};

// Integration με τον κινητήρα του App (app.js Hook)
window.PegasusVoice = PegasusVoice;

window.addEventListener('load', () => {
    PegasusVoice.init();
});
