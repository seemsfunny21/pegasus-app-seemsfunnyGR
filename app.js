/* ==========================================================================
   PEGASUS WORKOUT ENGINE - DYNAMIC SYNC VERSION
   ========================================================================== */

let exercises = [];
let remainingSets = [];
let currentIdx = 0;
let phase = 0; 
let running = false;
let timer = null;
let totalSeconds = 0;
let remainingSeconds = 0;
let muted = false;
let TURBO_MODE = false;
let SPEED = 1;

/* === INTEGRATED PROGRESS UI (DYNAMIC SYNC) === */


// ΑΛΛΑΓΗ ΑΠΟ const ΣΕ let ΓΙΑ ΔΥΝΑΜΙΚΗ ΕΝΗΜΕΡΩΣΗ
let workoutPhases = [
    { n: "Προετοιμασία", d: 10 }, 
    { n: "Άσκηση", d: parseInt(localStorage.getItem("pegasus_ex_time")) || 45 },      
    { n: "Διάλειμμα", d: parseInt(localStorage.getItem("pegasus_rest_time")) || 60 }     
];

let userWeight = parseFloat(localStorage.getItem("pegasus_weight")) || 74;

/* ===== AUDIO ===== */
const playBeep = (volume = 1) => {
    if (!muted) {
        const beepSound = new Audio('videos/beep.mp3');
        beepSound.volume = volume;
        beepSound.play().catch(e => console.log("Audio blocked"));
    }
};



/* ===== NAVIGATION (STRICT CLEAN & BLACK) ===== */
function createNavbar() {
    const nav = document.getElementById("navbar");
    if (!nav) return;
    const days = ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο", "Κυριακή"];
    nav.innerHTML = "";
    
    days.forEach((d) => {
        const b = document.createElement("button");
        b.textContent = d;
        b.id = `nav-${d}`;
        
        // ΟΥΔΕΤΕΡΟ STYLE: Όλα μαύρα κατά την εκκίνηση
        b.style.backgroundColor = "#000"; 
        b.style.color = "#fff";
        b.style.border = "none";

        b.onclick = () => selectDay(b, d);
        nav.appendChild(b);
    });
}
/* ===== PEGASUS UTILITIES: Muscle Mapper (Global Scope) ===== */
const getMuscleGroup = (exName) => {
    if (!exName) return "Άλλο";
    const name = exName.toLowerCase();
    if (name.includes("press") || name.includes("deck") || name.includes("pushups")) return "Στήθος";
    if (name.includes("pulldown") || name.includes("row")) return "Πλάτη";
    if (name.includes("curl") || name.includes("triceps")) return "Χέρια";
    if (name.includes("plank") || name.includes("leg raise")) return "Κορμός";
    return "Άλλο";
};

/* ===== SELECTDAY (PEGASUS SMART-SYNC v2.9 - ANALYST OPTIMIZED) ===== */
function selectDay(btn, day) {
    // 1. UI RESET
    document.querySelectorAll(".navbar button").forEach(b => {
        b.classList.remove("active");
        b.style.setProperty('background-color', '#000', 'important');
        b.style.setProperty('border', 'none', 'important');
        b.style.color = "#fff";
    });
    
    // 2. ACTIVE STATE
    if (btn) {
        btn.classList.add("active");
        btn.style.setProperty('background-color', '#4CAF50', 'important');
        btn.style.color = "#fff";
    }

    // 3. Engine & Timer Reset
    clearInterval(timer);
    timer = null;
    running = false;
    phase = 0;
    currentIdx = 0;
    if (typeof resetKcal === "function") resetKcal();
    const sBtn = document.getElementById("btnStart");
    if (sBtn) sBtn.innerHTML = "Έναρξη";

    // 4. Δυναμική Λήψη Δεδομένων & Spillover Logic
    let rawBaseData = (typeof getFinalProgram !== 'undefined') ? 
                      [...getFinalProgram(day, window.program)] : 
                      ((window.program[day]) ? [...window.program[day]] : []);

    const isGoodWeather = (typeof isRaining !== 'undefined') ? !isRaining() : true;
    if (day === "Παρασκευή" && isGoodWeather && window.program["Κυριακή"]) {
        const bonus = window.program["Κυριακή"]
            .filter(ex => ex.name !== "Ποδηλασία 30km")
            .map(ex => ({...ex, isSpillover: true}));
        rawBaseData = [...rawBaseData, ...bonus];
    }

    let baseData = (window.DVS) ? window.DVS.optimize(rawBaseData, day) : rawBaseData;

    // 5. SMART TARGETS & STATUS MAPPING
    const currentHistory = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
    const settings = (typeof window.getPegasusSettings === "function") ? window.getPegasusSettings() : { muscleTargets: {} };
    const userTargets = settings.muscleTargets;

    // Εμπλουτισμός δεδομένων με κατάσταση ολοκλήρωσης
    let mappedData = baseData.map(e => {
        const muscle = e.muscle || getMuscleGroup(e.name);
        const targetLimit = userTargets[muscle] || 14; 
        const isCompleted = (currentHistory[muscle] >= targetLimit);
        return { ...e, muscleGroup: muscle, isCompleted: isCompleted };
    });

    // 6. AUTO-SORTING (Ενεργές πάνω, 0/0 κάτω)
    mappedData.sort((a, b) => {
        if (a.isCompleted && !b.isCompleted) return 1;
        if (!a.isCompleted && b.isCompleted) return -1;
        return 0; // Διατήρηση αρχικής σειράς αν η κατάσταση είναι ίδια
    });

    // 7. DOM Rendering
    const list = document.getElementById("exList");
    if (!list) return;
    list.innerHTML = ""; 
    exercises = [];
    remainingSets = [];

    mappedData.forEach((e, idx) => {
        const displayTarget = e.isCompleted ? 0 : e.sets;
        const d = document.createElement("div");
        d.className = "exercise"; 
        d.dataset.total = e.sets;
        d.dataset.done = 0;
        d.dataset.index = idx;
        d.setAttribute("draggable", "true");

        if (e.isCompleted) {
            d.style.setProperty('opacity', '0.2', 'important');
            d.style.setProperty('filter', 'grayscale(100%)', 'important');
            d.classList.add("exercise-skipped"); 
        }

        const savedWeight = localStorage.getItem(`weight_ANGELOS_${e.name}`) || 
                          localStorage.getItem(`weight_${e.name}`) || "";

        d.innerHTML = `
            <div class="exercise-info" onclick="window.toggleSkipExercise(${idx})">
                <div class="set-counter">0/${displayTarget}</div>
                <div class="exercise-name">${e.isSpillover ? `${e.name} ☀️` : e.name}</div>
                <input type="number" class="weight-input" placeholder="kg" value="${savedWeight}" 
                       onclick="event.stopPropagation()" onchange="saveWeight('${e.name}', this.value)">
            </div>
            <div class="progress-box"><div class="progress-bar"></div></div>
        `;
        list.appendChild(d);
        exercises.push(d);
        remainingSets.push(parseInt(displayTarget));
    });

    // 8. Final Sync
    if (typeof calculateTotalTime === "function") {
        setTimeout(() => { calculateTotalTime(); }, 50); 
    }
    if (typeof showVideo === "function") showVideo(0);
    if (typeof initDragDrop === "function") initDragDrop();
}

/* ===== REORDER LOGIC ===== */
function reorderExercises() {
    const list = document.getElementById("exList");
    const newOrder = Array.from(list.querySelectorAll(".exercise")).map(div => {
        // Καθαρισμός του emoji από το όνομα για την αποθήκευση
        return div.querySelector(".exercise-name").textContent.replace(" ☀️", "").trim();
    });
    
    exercises = Array.from(list.querySelectorAll(".exercise"));
    
    const activeBtn = document.querySelector(".navbar button.active");
    if (activeBtn) {
        localStorage.setItem(`pegasus_order_${activeBtn.textContent.trim()}`, JSON.stringify(newOrder));
    }
    console.log("PEGASUS: New order saved (Normalized).");
}

/* ===== CORE ENGINE ===== */
function startPause() {
    if (exercises.length === 0) return;

    // PEGASUS LOGIC: Αν η τρέχουσα άσκηση είναι σβησμένη, βρες την πρώτη διαθέσιμη
    if (!running && exercises[currentIdx].classList.contains("exercise-skipped")) {
        let firstAvailable = -1;
        for (let i = 0; i < exercises.length; i++) {
            if (!exercises[i].classList.contains("exercise-skipped") && remainingSets[i] > 0) {
                firstAvailable = i;
                break;
            }
        }

        if (firstAvailable !== -1) {
            currentIdx = firstAvailable;
            // Ενημέρωση του UI (video/highlight) στην πρώτη διαθέσιμη άσκηση
            if (typeof showVideo === "function") showVideo(currentIdx);
        } else {
            alert("PEGASUS STRICT: Όλες οι ασκήσεις είναι απενεργοποιημένες ή ολοκληρωμένες!");
            return;
        }
    }

    running = !running;
    const sBtn = document.getElementById("btnStart");
    if (sBtn) sBtn.innerHTML = running ? "Παύση" : "Συνέχεια";
    
    if (running) runPhase();
    else { clearInterval(timer); timer = null; }
}


/* =============================================================
   PEGASUS CORE ENGINE - ULTRA-STRICT UI SYNC (OBLITERATE 1/3 BUG)
   ============================================================= */
function runPhase() {
    if (!running) return;
    clearInterval(timer);

    // 1. ΕΛΕΓΧΟΣ ΟΛΟΚΛΗΡΩΣΗΣ
    if (remainingSets.every(s => s <= 0)) {
        finishWorkout();
        return;
    }

    // 2. ΔΥΝΑΜΙΚΟΣ ΣΥΓΧΡΟΝΙΣΜΟΣ ΡΥΘΜΙΣΕΩΝ
    workoutPhases[1].d = parseInt(localStorage.getItem("pegasus_ex_time")) || 45;
    workoutPhases[2].d = parseInt(localStorage.getItem("pegasus_rest_time")) || 60;

    // Προσδιορισμός τρέχουσας άσκησης
    const e = exercises[currentIdx];
    if (!e) return;
    
    const exName = e.querySelector(".exercise-name").textContent.trim().replace(" ☀️", "");
    const wInput = e.querySelector(".weight-input");

    // UI STYLING & TURN INDICATOR
    exercises.forEach(ex => {
        ex.style.borderColor = "#222";
        ex.style.background = "transparent";
    });
    
    const isAngelosTurn = !partnerData.isActive || partnerData.isUser1Turn;
    e.style.borderColor = isAngelosTurn ? "#4CAF50" : "#00bcd4";
    e.style.background = "rgba(76, 175, 80, 0.1)";

    let currentPhaseName = "";
    let t = 0;

    if (phase === 0) {
        currentPhaseName = `ΠΡΟΕΤΟΙΜΑΣΙΑ (ΑΓΓΕΛΟΣ)`;
        t = workoutPhases[0].d;
    } 
    else if (phase === 1) {
        currentPhaseName = `ΑΣΚΗΣΗ (ΑΓΓΕΛΟΣ)`;
        t = workoutPhases[1].d;
    } 
    else if (phase === 2) {
        const pName = (partnerData.currentPartner || "ΣΥΝΕΡΓΑΤΗΣ").toUpperCase();
        currentPhaseName = partnerData.isActive ? `ΑΣΚΗΣΗ (${pName})` : `ΔΙΑΛΕΙΜΜΑ (ΑΓΓΕΛΟΣ)`;
        t = workoutPhases[2].d; 
    }

    if (phase !== 2) showVideo(currentIdx);

    timer = setInterval(() => {
        t -= 1;
        remainingSeconds = Math.max(0, remainingSeconds - 1);
        updateTotalBar();

        // Metabolic Sync
        if (phase === 1 && window.PegasusLogic) {
            window.PegasusLogic.updateMetabolicData();
        }

        const label = document.getElementById("phaseTimer");
        if (label) {
            label.textContent = `${currentPhaseName} (${Math.max(0, Math.ceil(t))})`;
            label.style.color = (phase === 1) ? "#4CAF50" : (phase === 2 ? (partnerData.isActive ? "#00bcd4" : "#FFC107") : "#64B5F6");
        }

        if (t <= 0) {
            clearInterval(timer);
            
            if (phase === 0) {
                phase = 1;
                runPhase();
            } 
            else if (phase === 1) {
                // --- ΚΡΙΣΙΜΟ ΣΗΜΕΙΟ: ΕΝΗΜΕΡΩΣΗ ΣΕΤ ---
                if (wInput) saveWeight(exName, wInput.value);

                // Re-fetch το στοιχείο από το DOM για να αποφύγουμε reference errors
                const activeNode = document.querySelectorAll(".exercise")[currentIdx];
                
                if (activeNode) {
                    let done = parseInt(activeNode.dataset.done) || 0;
                    let total = parseInt(activeNode.dataset.total) || 0;

                    done++;
                    
                    // Ενημέρωση Data
                    activeNode.dataset.done = done;
                    remainingSets[currentIdx] = total - done;

                    // Ενημέρωση UI
                    const counterDiv = activeNode.querySelector(".set-counter");
                    if (counterDiv) {
                        counterDiv.textContent = `${done}/${total}`;
                        counterDiv.style.color = "#4CAF50";
                        // Visual confirmation
                        activeNode.style.boxShadow = "0 0 15px rgba(76, 175, 80, 0.4)";
                        setTimeout(() => { activeNode.style.boxShadow = ""; }, 1500);
                    }
                    
                    // Sync με Achievements
                    if (window.updateAchievements) window.updateAchievements(exName);
                }

                phase = 2;
                if (partnerData.isActive) partnerData.isUser1Turn = false;
                runPhase();
            } 
            else if (phase === 2) {
                if (partnerData.isActive && wInput) savePartnerWeight(exName, wInput.value);
                if (partnerData.isActive) partnerData.isUser1Turn = true; 
                
                let nextIdx = getNextIndexCircuit();
                if (nextIdx !== -1) {
                    currentIdx = nextIdx;
                    phase = 0;
                    runPhase();
                } else {
                    finishWorkout();
                }
            }
        }
    }, 1000 / SPEED);
}

/* ===== UTILS ===== */
function saveWeight(exerciseName, weightValue) {
    if (typeof partnerData !== 'undefined' && partnerData.isActive) {
        // Αν έχουμε συνεργάτη, το partner.js αποφασίζει σε ποιο Key θα σώσει
        savePartnerWeight(exerciseName, weightValue);
    } else {
        // Solo Mode: Σώζουμε και στο κλασικό Key ΚΑΙ στο Key "ANGELOS" 
        // για να υπάρχει παντού η ίδια πληροφορία.
        localStorage.setItem(`weight_${exerciseName}`, weightValue);
        localStorage.setItem(`weight_ANGELOS_${exerciseName}`, weightValue);
    }
}

function getNextIndexCircuit() {
    for (let i = 1; i <= remainingSets.length; i++) {
        let idx = (currentIdx + i) % remainingSets.length;
        if (remainingSets[idx] > 0 && !exercises[idx].classList.contains("exercise-skipped")) return idx;
    }
    return -1;
}

function skipToNextExercise() {
    if (exercises.length === 0) return;
    clearInterval(timer);

    // 1. DATA LOGGING: Αν το σετ θεωρείται ολοκληρωμένο
    if ((phase === 1 || phase === 2) && running) {
        const currentExNode = exercises[currentIdx];
        const exName = currentExNode.querySelector(".exercise-name").textContent.trim();
        
        // Ενημέρωση τοπικού UI
        currentExNode.dataset.done++;
        remainingSets[currentIdx]--;
        currentExNode.querySelector(".set-counter").textContent = 
            `${currentExNode.dataset.done}/${currentExNode.dataset.total}`;

        // Ενημέρωση Weekly Progress (Pegasus Inventory)
        if (window.findMuscleGroup && window.saveProgress) {
            const muscleGroup = window.findMuscleGroup(exName);
            if (muscleGroup) {
                window.saveProgress(muscleGroup, 1); // Καταγραφή 1 ολοκληρωμένου σετ
                console.log(`PEGASUS ANALYST: Recorded 1 set for ${muscleGroup} (${exName})`);
            }
        }
    }

    // 2. NAVIGATION LOGIC
    let nextIdx = getNextIndexCircuit();
    if (nextIdx !== -1) {
        currentIdx = nextIdx;
        phase = 0; // Επιστροφή στην Προετοιμασία

        // --- PARTNER RESET LOGIC ---
        if (typeof partnerData !== 'undefined' && partnerData.isActive) {
            partnerData.isUser1Turn = true; 
            const nextEx = exercises[currentIdx];
            const nextExName = nextEx.querySelector(".exercise-name").textContent.trim();
            const nextInput = nextEx.querySelector(".weight-input");
            if (nextInput) {
                nextInput.value = loadPartnerWeight(nextExName);
            }
        }
        // ---------------------------

        if (running) runPhase(); 
        else showVideo(currentIdx);
    } else { 
        finishWorkout(); 
    }
}

function showVideo(i) {
    const ex = exercises[i];
    if (!ex) return;
    
    // 1. Λήψη ονόματος και καθαρισμός από το emoji "☀️"
    let name = ex.querySelector(".exercise-name").textContent.trim();
    name = name.replace(" ☀️", "").trim(); // Αφαιρεί το Sun emoji
    
    const vid = document.getElementById("video");
    
    if (vid && typeof videoMap !== 'undefined') {
        // 2. Αναζήτηση στο videoMap με το "καθαρό" όνομα
        let videoFile = videoMap[name] || "default";

        // SMART VIDEO LOGIC: EMS check
        if (name.toLowerCase().includes("ems")) {
            videoFile = "ems";
        }

        vid.src = `videos/${videoFile}.mp4`;
        vid.style.opacity = "1"; 
        vid.play().catch(() => {
            console.log(`PEGASUS ERROR: Video not found: ${videoFile}.mp4 for exercise: ${name}`);
        });
    }
}

/* ===== ΥΠΟΛΟΓΙΣΜΟΣ ΣΥΝΟΛΙΚΟΥ ΧΡΟΝΟΥ (FIXED FOR SPILLOVER) ===== */
window.calculateTotalTime = function() {
    // 1. Συγχρονισμός τιμών από settings
    workoutPhases[1].d = parseInt(localStorage.getItem("pegasus_ex_time")) || 45;
    workoutPhases[2].d = parseInt(localStorage.getItem("pegasus_rest_time")) || 60;

    totalSeconds = 0;
    
    // 2. Υπολογισμός βάσει των φορτωμένων ασκήσεων (DOM Elements)
    exercises.forEach((exDiv) => {
        // Αν η άσκηση έχει γίνει skip, αγνοούμε τον χρόνο της
        if (exDiv.classList.contains("exercise-skipped")) return;
        
        // Λήψη αριθμού σετ από το data-total που ορίστηκε στο selectDay
        const sets = parseInt(exDiv.dataset.total) || 0;
        
        // Υπολογισμός πλήρους κύκλου: Προετοιμασία + Άσκηση + Διάλειμμα
        const cycleTime = workoutPhases[0].d + workoutPhases[1].d + workoutPhases[2].d;
        
        totalSeconds += sets * cycleTime;
    });

    remainingSeconds = totalSeconds;

    // 3. ΕΝΗΜΕΡΩΣΗ UI
    const timeDisplay = document.getElementById("totalProgressTime"); 
    if (timeDisplay) {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        timeDisplay.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
    }

    // 4. Ενημέρωση της μπάρας προόδου
    if (typeof updateTotalBar === "function") {
        updateTotalBar();
    }
    
    console.log(`PEGASUS ANALYST: Total time sync complete. Total: ${totalSeconds}s`);
};

function updateTotalBar() {
    const bar = document.getElementById("totalProgress");
    const timeText = document.getElementById("totalProgressTime");
    if (!bar) return;

    if (totalSeconds <= 0) {
        bar.style.width = "0%";
        if (timeText) timeText.textContent = "0:00";
        return;
    }

    // 1. Υπολογισμός και ενημέρωση μπάρας (width %)
    const progress = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
    bar.style.width = Math.max(0, Math.min(100, progress)) + "%";

    // 2. ΕΝΗΜΕΡΩΣΗ ΡΟΛΟΓΙΟΥ (Πάντα, όχι μόνο όταν running)
    if (timeText) {
        const m = Math.floor(remainingSeconds / 60);
        const s = Math.floor(remainingSeconds % 60);
        timeText.textContent = `${m}:${String(s).padStart(2, "0")}`;
    }
}

/* ===== ΣΥΝΑΡΤΗΣΗ SKIP (FINAL ANALYST FIX: Visual + Time Sync) ===== */
window.toggleSkipExercise = function(idx) {
    // 1. Εύρεση του στοιχείου στο DOM
    const exDiv = document.querySelectorAll('.exercise')[idx];
    if (!exDiv) return;
    
    const counter = exDiv.querySelector(".set-counter");
    // Χρησιμοποιούμε το dataset.total που ορίσαμε στη selectDay
    const originalSets = parseInt(exDiv.dataset.total) || 3;

    // 2. Εναλλαγή κλάσης και κατάστασης
    const isSkipped = exDiv.classList.toggle("exercise-skipped");

    // 3. Εφαρμογή αλλαγών (Visual + Data)
    if (isSkipped) {
        // ΚΑΤΑΣΤΑΣΗ: SKIP
        exDiv.style.setProperty('opacity', '0.2', 'important');
        exDiv.style.setProperty('filter', 'grayscale(100%)', 'important');
        
        // ΕΝΗΜΕΡΩΣΗ ΔΕΔΟΜΕΝΩΝ ΓΙΑ ΤΟ ΧΡΟΝΟ
        remainingSets[idx] = 0; 
        if (counter) counter.innerText = `0/0`;
    } else {
        // ΚΑΤΑΣΤΑΣΗ: ACTIVE
        exDiv.style.setProperty('opacity', '1', 'important');
        exDiv.style.setProperty('filter', 'none', 'important');
        
        // ΕΠΑΝΑΦΟΡΑ ΔΕΔΟΜΕΝΩΝ ΓΙΑ ΤΟ ΧΡΟΝΟ
        remainingSets[idx] = originalSets; 
        if (counter) counter.innerText = `0/${originalSets}`;
    }
    
    // 4. ΕΠΙΒΟΛΗ ΕΠΑΝΥΠΟΛΟΓΙΣΜΟΥ ΧΡΟΝΟΥ
    // Σιγουρευόμαστε ότι η Global μεταβλητή exercises είναι συγχρονισμένη
    if (typeof exercises !== 'undefined') {
        exercises[idx] = exDiv;
    }

    if (typeof calculateTotalTime === "function") {
        console.log(`PEGASUS: Recalculating time. Set at index ${idx} is now ${remainingSets[idx]}`);
        calculateTotalTime();
    }
};

/* =============================================================
   PEGASUS FINISH LOGIC - AUTO-COMMIT & MORNING REPORT SYNC
   ============================================================= */
function finishWorkout() {
    if (!running && !timer) return; // Αποφυγή διπλοεκτέλεσης
    
    clearInterval(timer);
    running = false;

    const label = document.getElementById("phaseTimer");
    if (label) {
        label.textContent = "ΟΛΟΚΛΗΡΩΣΗ...";
        label.style.color = "#4CAF50";
    }

    // 1. Υπολογισμός workoutKey (Ημερομηνία)
    let workoutKey;
    const activeBtn = document.querySelector(".navbar button.active");
    const now = new Date();
    
    if (activeBtn) {
        const dayName = activeBtn.textContent.trim();
        const greekDays = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
        const currentDayIdx = now.getDay();
        const targetDayIdx = greekDays.indexOf(dayName);
        
        let diff = targetDayIdx - currentDayIdx;
        const targetDate = new Date();
        targetDate.setDate(now.getDate() + diff);
        workoutKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
    } else {
        workoutKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    // 2. Αποθήκευση Ολοκλήρωσης στο Ημερολόγιο
    let data = JSON.parse(localStorage.getItem("pegasus_workouts_done") || "{}");
    data[workoutKey] = true;
    localStorage.setItem("pegasus_workouts_done", JSON.stringify(data));

    // 3. Update UI
    if (window.updateTotalWorkoutCount) window.updateTotalWorkoutCount();
    if (window.renderCalendar) window.renderCalendar();

    // 4. AUTO-COMMIT & CLOUD SYNC
    console.log("PEGASUS: Workout complete. Syncing with Cloud...");

    // ΠΡΟΣΘΗΚΗ: Άμεση αποστολή της προόδου στο Cloud πριν το reload
    if (window.PegasusCloud && typeof window.PegasusCloud.push === "function") {
        window.PegasusCloud.push();
    }

    setTimeout(() => {
        if (window.PegasusReporting) {
            const currentKcal = localStorage.getItem("pegasus_today_kcal") || "0";
            
            // ΚΛΕΙΔΩΜΑ ΔΕΔΟΜΕΝΩΝ: Προετοιμασία για το αυριανό πρωινό email
            window.PegasusReporting.prepareAndSaveReport(currentKcal);
            
            // Μηδενισμός θερμίδων για τη νέα ημέρα
            localStorage.setItem("pegasus_today_kcal", "0.0");
        }

        // Τελική ειδοποίηση και ανανέωση
        console.log(`Η προπόνηση (${workoutKey}) αποθηκεύτηκε. Τα λέμε αύριο το πρωί!`);
        
        // Reload για να καθαρίσει το state και να επιστρέψει στην αρχική
        location.reload(); 
    }, 5000);
}

/* === PEGASUS WORKOUT COUNTER SYSTEM === */
window.updateTotalWorkoutCount = function() {
    const data = JSON.parse(localStorage.getItem("pegasus_workouts_done") || "{}");
    const count = Object.keys(data).length;
    console.log(`PEGASUS: Total workouts in history: ${count}`);
};


/* ===== INITIALIZATION - PEGASUS STRICT EDITION (CLEAN & FINAL) ===== */
window.onload = () => {
    // 1. Αρχικοποίηση EmailJS
    if (typeof emailjs !== 'undefined') {
        emailjs.init('qsfyDrneUHP7zEFui');
    }
    
// 2. Έλεγχος για αυτόματη αποστολή (Μόνο αν δεν έχει σταλεί σήμερα)
if (typeof PegasusReporting !== 'undefined') {
    const lastSent = localStorage.getItem("pegasus_last_auto_report");
    const todayStr = new Date().toLocaleDateString('el-GR');
    
    if (lastSent !== todayStr) {
        PegasusReporting.checkAndSendMorningReport();
        localStorage.setItem("pegasus_last_auto_report", todayStr);
        console.log("PEGASUS: Αυτόματη αναφορά χθεσινής ημέρας εστάλη.");
    } else {
        console.log("PEGASUS: Η αυτόματη αναφορά έχει ήδη σταλεί για σήμερα.");
    }
}

    // 3. Βασικά UI Στοιχεία & Navigation
    createNavbar();
    
    const btnStart = document.getElementById("btnStart");
    if (btnStart) btnStart.onclick = startPause;

    const btnNext = document.getElementById("btnNext");
    if (btnNext) btnNext.onclick = skipToNextExercise;
    
    const btnPreview = document.getElementById("btnPreviewUI");
    if (btnPreview) btnPreview.onclick = openExercisePreview;

    const warmupBtn = document.getElementById("btnWarmup");
    if (warmupBtn) {
        warmupBtn.onclick = () => {
            const vid = document.getElementById("video");
            if (vid) {
                vid.src = "videos/warmup.mp4";
                vid.play().catch(e => console.log("Warmup error"));
                if (document.getElementById("phaseTimer")) {
                    document.getElementById("phaseTimer").textContent = "Προθέρμανση...";
                }
            }
        };
    }

    // 4. Manual Email Button - Συγχρονίζει Φαγητό & Γυμναστική μέσω Reporting.js
    const btnEmail = document.getElementById("btnManualEmail");
    if (btnEmail) {
        btnEmail.onclick = function() {
            if (window.PegasusReporting) {
                // Συλλογή θερμίδων από την οθόνη
                const kcalVal = document.querySelector(".kcal-value")?.textContent || "0";
                
                // Αποθήκευση τρεχόντων δεδομένων
                window.PegasusReporting.saveWorkout(kcalVal);
                
                // Αποστολή ΜΙΑΣ ολοκληρωμένης αναφοράς
                window.PegasusReporting.checkAndSendMorningReport(true);
            } else {
                alert("Σφάλμα: Το reporting.js δεν έχει φορτωθεί.");
            }
        };
    }

    // 5. UI Panels Handler
    const uiBtns = { 
        "btnCalendarUI": "calendarPanel", 
        "btnAchUI": "achievementsPanel", 
        "btnSettingsUI": "settingsPanel", 
        "btnFoodUI": "foodPanel", 
        "btnToolsUI": "toolsPanel",
        "btnPreviewUI": "previewPanel" 
    };

    Object.keys(uiBtns).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.onclick = (e) => {
                e.stopPropagation();
                // Κλείσιμο όλων των άλλων panels
                Object.values(uiBtns).forEach(id => { 
                    const el = document.getElementById(id); 
                    if (el) el.style.display = "none"; 
                });
                // Άνοιγμα του επιλεγμένου panel
                const targetPanel = document.getElementById(uiBtns[btnId]);
                if (targetPanel) {
                    targetPanel.style.display = "block";
                    if (btnId === "btnPreviewUI") openExercisePreview();
                }
                // Ανανέωση περιεχομένου
                if (btnId === "btnCalendarUI" && window.renderCalendar) window.renderCalendar();
                if (btnId === "btnAchUI" && window.renderAchievements) window.renderAchievements();
                if (btnId === "btnFoodUI" && window.renderFood) window.renderFood();
            };
        }
    });
    
    // 6. Λοιπές ρυθμίσεις (Ήχος, Turbo, Βάρος)
    const mainVideo = document.getElementById("video");
    if (mainVideo) mainVideo.oncontextmenu = (e) => e.preventDefault();

    const btnMuteTools = document.getElementById("btnMuteTools");
    if (btnMuteTools) { 
        btnMuteTools.onclick = function() { 
            muted = !muted; 
            this.innerHTML = muted ? "Ήχος: OFF" : "Ήχος: ON"; 
        }; 
    }

    const btnTurboTools = document.getElementById("btnTurboTools");
    if (btnTurboTools) { 
        btnTurboTools.onclick = function() { 
            TURBO_MODE = !TURBO_MODE; 
            SPEED = TURBO_MODE ? 10 : 1; 
            this.innerHTML = TURBO_MODE ? "Turbo: ON" : "Turbo: OFF"; 
            if (running) runPhase(); 
        }; 
    }

    const weightInp = document.getElementById("userWeightInput");
    if (weightInp) {
        weightInp.value = userWeight;
        weightInp.onchange = (e) => { 
            userWeight = parseFloat(e.target.value) || 80; 
            localStorage.setItem("pegasus_weight", userWeight); 
        };
    }

    // 7. Auto-Select Today
    if (typeof fetchWeather === "function") fetchWeather();
    const greekDays = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
    const todayName = greekDays[new Date().getDay()];
    setTimeout(() => { 
        document.querySelectorAll(".navbar button").forEach(b => { 
            if (b.textContent === todayName) selectDay(b, todayName); 
        }); 
    }, 300);
};

/* ==========================================================================
   PEGASUS WORKOUT SYSTEM - CORE LOGIC UPDATE (v5.2)
   Protocol: Strict Data Analyst
   ========================================================================== */

function openExercisePreview() {
    const activeBtn = document.querySelector(".navbar button.active");
    if (!activeBtn) {
        alert("Παρακαλώ επίλεξε πρώτα μια ημέρα!");
        return;
    }

    const currentDay = activeBtn.textContent.trim().replace(" ☀️", "");
    const dayExercises = program[currentDay];
    const panel = document.getElementById('previewPanel');
    const content = document.getElementById('previewContent');
    
    if (!panel || !content) return;

    document.getElementById('previewTitle').innerText = `ΠΡΟΕΠΙΣΚΟΠΗΣΗ: ${currentDay.toUpperCase()}`;
    panel.style.display = 'block';
    content.innerHTML = ''; 

    // 1. Force Render Muscle Progress
    if (window.MuscleProgressUI && typeof window.MuscleProgressUI.render === "function") {
        window.MuscleProgressUI.render();
    }

    // 2. Mapping & Rendering
    const smartMapping = { 
        "pulldown": "pulldownimage.png", 
        "triceps overhead extension": "tricepsoverheadimage.png", 
        "ems": "emsImage.png",
        "ποδηλασία": "bikeImage.jpg",
        "cycling": "bikeImage.jpg"
    };
    
    dayExercises.forEach(ex => {
        const lowerName = ex.name.toLowerCase();
        const key = Object.keys(smartMapping).find(k => lowerName.includes(k));
        
        let imgFile = key ? smartMapping[key] : (ex.name.replace(/\s+/g, '').toLowerCase() + "image.png");

        content.innerHTML += `
            <div class="preview-item" style="margin: 10px; text-align: center; width: 160px; display: inline-block; vertical-align: top;">
                <img src="images/${imgFile}" onerror="this.src='images/placeholder.jpg'" 
                     style="width: 150px; height: 100px; border: 2px solid #4CAF50; border-radius: 8px; object-fit: cover; background: #222;">
                <p style="color: #4CAF50; font-weight: bold; font-size: 11px; margin-top: 5px; text-transform: uppercase;">${ex.name}</p>
            </div>
        `;
    });
}
/* === GLOBAL PANEL AUTO-CLOSE LOGIC === */
window.addEventListener('mousedown', (e) => {
    const panels = ['foodPanel', 'calendarPanel', 'achievementsPanel', 'settingsPanel', 'previewPanel', 'toolsPanel', 'galleryPanel'];

    panels.forEach(id => {
        const panel = document.getElementById(id);
        if (panel && panel.style.display === 'block') {
            if (!panel.contains(e.target) && !e.target.closest('.p-btn') && !e.target.closest('.navbar button')) {
                panel.style.display = 'none';
            }
        }
    });
});

/* === PEGASUS DATA TRACKING === */
window.updateTotalWorkoutCount = function() {
    const data = JSON.parse(localStorage.getItem("pegasus_workouts_done") || "{}");
    const total = Object.keys(data).length;
    const display = document.getElementById("totalWorkoutsDisplay");
    if (display) display.textContent = `Προπονήσεις: ${total}`;
};

window.logPegasusSet = function(exName) {
    let history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || 
                  { "Στήθος": 0, "Πλάτη": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0, "Ώμοι": 0 };
    
    if (!window.exercisesDB) return;
    
    const exercise = window.exercisesDB.find(ex => ex.name === exName);
    if (exercise && exercise.muscleGroup) {
        const value = (exercise.name.includes("Ποδηλασία")) ? 3 : 1;
        history[exercise.muscleGroup] = (history[exercise.muscleGroup] || 0) + value;
        localStorage.setItem('pegasus_weekly_history', JSON.stringify(history));
        if (window.MuscleProgressUI) window.MuscleProgressUI.render();
    }
};

/* === REAL-TIME WEIGHT MONITORING === */
// Πρέπει να καλείται μετά το render των ασκήσεων
window.initWeightListeners = function() {
    document.querySelectorAll('.weight-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const node = e.target.closest('.exercise-node') || e.target.closest('.exercise');
            if (!node) return;
            
            const nameEl = node.querySelector('.exercise-name');
            if (!nameEl) return;
            
            const exName = nameEl.textContent.trim().replace(" ☀️", "");
            const weightVal = parseFloat(e.target.value) || 0;
            
            localStorage.setItem(`weight_ANGELOS_${exName}`, weightVal);
            console.log(`PEGASUS: Weight sync -> ${exName}: ${weightVal}kg`);
        });
    });
};

// Initial calls
updateTotalWorkoutCount();