/* ==========================================================================
   PEGASUS DYNAMIC OPTIMIZER & LOAD BALANCER - v1.2 (FINAL)
   Protocol: Weekly Volume Capping & Automated Load Balancing
   Target Profile: 74kg / 1.87m / 38y Male
   ========================================================================== */

const PegasusOptimizer = {
    // Κεντρικοί Στόχοι Σετ (Weekly Volume Targets)
    targets: { 
        "Στήθος": 24, "Πλάτη": 24, "Πόδια": 24, 
        "Χέρια": 16, "Ώμοι": 16, "Κορμός": 12 
    },

    /**
     * Κύρια Λειτουργία: Εφαρμογή Capping και Load Balancing
     */
    apply(day, sessionExercises) {
        console.log(`%c[OPTIMIZER] Balancing Load for: ${day}`, "color: #00bcd4; font-weight: bold;");
        
        const progress = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
        let sessionTracker = { ...progress };

        // 1. Επεξεργασία των ασκήσεων της τρέχουσας ημέρας (Capping)
        let mappedData = sessionExercises.map(ex => {
            return this.calculateExercise(ex, sessionTracker);
        });

        // 2. LOAD BALANCING LOGIC (Τετάρτη & Παρασκευή)
        // Αν η ημέρα έχει χαμηλό φόρτο (< 15 σετ), τραβάμε ασκήσεις από το Σάββατο
        const totalSetsToday = mappedData.reduce((sum, ex) => sum + ex.adjustedSets, 0);
        
        if ((day === "Τετάρτη" || day === "Παρασκευή") && totalSetsToday < 15) {
            console.log("%c[BALANCER] Low volume detected. Pulling from Saturday...", "color: #4CAF50;");
            
            const saturdayEx = window.program["Σάββατο"] || [];
            saturdayEx.forEach(sEx => {
                const group = this.getGroup(sEx.name);
                const done = sessionTracker[group] || 0;
                const target = this.targets[group] || 24;

                // Έλεγχος αν η άσκηση του Σαββάτου υπολείπεται και δεν υπάρχει ήδη σήμερα
                if (done < target && !mappedData.some(m => m.name.includes(sEx.name.trim()))) {
                    const spilloverEx = this.calculateExercise(sEx, sessionTracker);
                    
                    if (spilloverEx.adjustedSets > 0) {
                        spilloverEx.isSpillover = true;
                        spilloverEx.name = `${spilloverEx.name} ☀️`; // Σήμανση Spillover
                        mappedData.push(spilloverEx);
                    }
                }
            });
        }

        return mappedData;
    },

    /**
     * Υπολογισμός σετ βάσει υπολειπόμενου εβδομαδιαίου ορίου
     */
    calculateExercise(ex, tracker) {
        const muscleGroup = this.getGroup(ex.name);
        const target = this.targets[muscleGroup] || 24;
        const alreadyDone = tracker[muscleGroup] || 0;
        const remaining = target - alreadyDone;

        let finalSets = ex.sets;
        let isCompleted = alreadyDone >= target;

        // Logic για Ποδηλασία (18-set Credit)
        if (ex.name.includes("Ποδηλασία")) {
            finalSets = (remaining >= 18) ? 1 : 0;
            isCompleted = (remaining < 18);
        } 
        // Logic για Βάρη / EMS
        else {
            if (isCompleted) {
                finalSets = 0;
            } else if (ex.sets > remaining) {
                finalSets = remaining;
            }
        }

        // Ενημέρωση του tracker για την επόμενη άσκηση
        if (finalSets > 0) {
            const creditValue = ex.name.includes("Ποδηλασία") ? 18 : finalSets;
            tracker[muscleGroup] += creditValue;
        }

        return { 
            ...ex, 
            adjustedSets: finalSets, 
            isCompleted: isCompleted, 
            muscleGroup: muscleGroup 
        };
    },

    /**
     * Mapping Ασκήσεων σε Μυϊκές Ομάδες (Εμπλουτισμένο)
     */
    getGroup(name) {
        const n = name.toLowerCase();
        if (n.includes("chest") || n.includes("pushups") || n.includes("flys") || n.includes("στήθος") || n.includes("πιέσεις πάγκου")) return "Στήθος";
        if (n.includes("row") || n.includes("pulldown") || n.includes("back") || n.includes("πλάτη") || n.includes("έλξεις")) return "Πλάτη";
        if (n.includes("leg") || n.includes("cycling") || n.includes("πόδια") || n.includes("ποδηλασία") || n.includes("squat") || n.includes("extensions") || n.includes("kickbacks")) return "Πόδια";
        if (n.includes("bicep") || n.includes("tricep") || n.includes("χέρια") || n.includes("κάμψεις") || n.includes("εκτάσεις τρικεφάλων") || n.includes("curls") || n.includes("pulldowns")) return "Χέρια";
        if (n.includes("shoulder") || n.includes("upright") || n.includes("ώμοι") || n.includes("πιέσεις ώμων")) return "Ώμοι";
        if (n.includes("abs") || n.includes("crunch") || n.includes("situp") || n.includes("plank") || n.includes("κορμός") || n.includes("κοιλιακοί") || n.includes("raise")) return "Κορμός";
        return "Άλλο";
    }
};
