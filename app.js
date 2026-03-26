/* ==========================================================================
   PEGASUS MASTER CONTROLLER - v24.0 (FINAL MODULAR ORCHESTRATION)
   Protocol: Strict Data Analyst - Memory-First & Event-Driven Sync
   ========================================================================== */

const PegasusCore = (function() {
    // 1. ΙΔΙΩΤΙΚΗ ΚΑΤΑΣΤΑΣΗ ΣΥΝΕΔΡΙΑΣ (Private Session State)
    let sessionState = {
        isActive: false,
        startTime: null,
        timerInterval: null,
        currentDay: "",
        currentExercises: [] // Memory-First Storage
    };

    // 2. ΕΣΩΤΕΡΙΚΕΣ ΛΕΙΤΟΥΡΓΙΕΣ (Core Internal Logic)
    const initUI = () => {
        const now = new Date();
        const days = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
        sessionState.currentDay = days[now.getDay()];
        
        const dayDisplay = document.getElementById("daySelector");
        if (dayDisplay) dayDisplay.textContent = sessionState.currentDay.toUpperCase();

        // Φόρτωση προγράμματος μέσω του WeatherHandler
        if (window.getFinalProgram) {
            sessionState.currentExercises = window.getFinalProgram(sessionState.currentDay);
            renderExerciseList();
        }

        setupMainListeners();
    };

    const renderExerciseList = () => {
        const container = document.getElementById("exList");
        if (!container) return;
        container.innerHTML = "";

        sessionState.currentExercises.forEach((ex, index) => {
            const weight = (window.loadPartnerWeight) ? window.loadPartnerWeight(ex.name) : "";
            
            const div = document.createElement("div");
            div.className = "exercise";
            div.setAttribute("data-index", index);
            div.innerHTML = `
                <div class="exercise-info">
                    <div class="set-counter" id="sets_display_${index}">${ex.sets || 4}</div>
                    <div class="exercise-name">${ex.name}</div>
                    <input type="number" class="weight-input" data-name="${ex.name}" value="${weight}" placeholder="kg">
                    <button class="skip-btn" style="background:none; border:none; cursor:pointer; margin-left:10px;">🚫</button>
                </div>
            `;

            // Event Listeners για το βάρος και το Skip
            const wInput = div.querySelector(".weight-input");
            wInput.addEventListener("change", (e) => {
                if (window.savePartnerWeight) window.savePartnerWeight(ex.name, e.target.value);
            });

            const sBtn = div.querySelector(".skip-btn");
            sBtn.addEventListener("click", () => {
                div.classList.toggle("exercise-skipped");
                sessionState.currentExercises[index].isSkipped = div.classList.contains("exercise-skipped");
            });

            container.appendChild(div);
        });
    };

    const startWorkout = () => {
        if (sessionState.isActive) return;
        
        sessionState.isActive = true;
        sessionState.startTime = Date.now();
        
        document.getElementById("btnStart").style.display = "none";
        document.getElementById("btnFinish").style.display = "block";

        // Έναρξη Metabolic Engine Ticks
        sessionState.timerInterval = setInterval(() => {
            if (window.MetabolicEngine) {
                // Τυχαία επιλογή άσκησης για το tick (προσομοίωση δραστηριότητας)
                const activeEx = sessionState.currentExercises.find(e => !e.isSkipped);
                if (activeEx) window.MetabolicEngine.updateTracking(1, activeEx.name);
            }
        }, 1000);

        console.log(`[PEGASUS CORE]: Workout Started - ${sessionState.currentDay}`);
    };

    const finishWorkout = async () => {
        clearInterval(sessionState.timerInterval);
        
        // 1. Ενημέρωση Εβδομαδιαίου Ιστορικού (Muscle History)
        let history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
        
        sessionState.currentExercises.forEach((ex, index) => {
            if (!ex.isSkipped) {
                const group = ex.muscleGroup || "Άλλο";
                const sets = parseInt(document.getElementById(`sets_display_${index}`).textContent) || 4;
                history[group] = (history[group] || 0) + sets;
            }
        });
        localStorage.setItem('pegasus_weekly_history', JSON.stringify(history));

        // 2. Ενημέρωση Ημερολογίου (Calendar Done)
        const dateKey = new Date().toISOString().split('T')[0];
        let done = JSON.parse(localStorage.getItem("pegasus_workouts_done") || "{}");
        done[dateKey] = true;
        localStorage.setItem("pegasus_workouts_done", JSON.stringify(done));

        // 3. Καταγραφή στο Reporting & Calories
        if (window.finalizeWorkoutCalories) window.finalizeWorkoutCalories();
        if (window.PegasusReporting) {
            const kcal = localStorage.getItem("pegasus_today_kcal") || "0";
            window.PegasusReporting.saveWorkout(kcal, sessionState.currentExercises);
        }

        // 4. Cloud Sync & Reload
        if (window.PegasusCloud && window.PegasusCloud.hasSuccessfullyPulled) {
            await window.PegasusCloud.push(true);
        }

        alert("PEGASUS: Η προπόνηση ολοκληρώθηκε και συγχρονίστηκε!");
        window.location.reload();
    };

    const setupMainListeners = () => {
        // Διαχείριση Tabs
        const tabs = {
            "btnNavWorkout": "workoutContainer",
            "btnNavDiet": "foodPanel",
            "btnNavTools": "toolsPanel"
        };

        Object.entries(tabs).forEach(([btnId, panelId]) => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener("click", () => {
                    document.querySelectorAll(".navbar button").forEach(b => b.classList.remove("active"));
                    document.querySelectorAll(".pegasus-panel, #workoutContainer").forEach(p => p.style.display = "none");
                    
                    btn.classList.add("active");
                    const panel = document.getElementById(panelId);
                    if (panel) panel.style.display = (panelId === "workoutContainer") ? "block" : "block";
                });
            }
        });

        // Κουμπιά ελέγχου
        document.getElementById("btnStart").addEventListener("click", startWorkout);
        document.getElementById("btnFinish").addEventListener("click", finishWorkout);
        
        // Σύνδεση Rain Toggle με τον WeatherHandler
        const rainToggle = document.getElementById("rainToggle");
        if (rainToggle) {
            rainToggle.addEventListener("change", () => {
                sessionState.currentExercises = window.getFinalProgram(sessionState.currentDay);
                renderExerciseList();
            });
        }
    };

    // 3. PUBLIC API
    return {
        init: initUI,
        getState: () => sessionState
    };
})();

// Αντικαταστήστε την τελευταία γραμμή του app.js
window.addEventListener("load", () => {
    // Μικρή καθυστέρηση 100ms για να βεβαιωθούμε ότι το Data Engine είναι έτοιμο
    setTimeout(() => {
        PegasusCore.init();
        console.log("[PEGASUS]: System fully orchestrated.");
    }, 100);
});