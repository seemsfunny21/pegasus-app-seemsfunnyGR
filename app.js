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

/* === INTEGRATED PROGRESS UI (FIXED) === */
window.MuscleProgressUI = {
    targets: { "Πλάτη": 18, "Στήθος": 14, "Χέρια": 18, "Κορμός": 15, "Πόδια": 6 },
    
    calculateStats() {
        const history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
        const mapping = { "Πλάτη": "Back", "Στήθος": "Chest", "Χέρια": "Arms", "Κορμός": "Abs", "Πόδια": "Legs" };
        
        return Object.keys(this.targets).map(group => {
            // Άθροισμα Ελληνικού + Αγγλικού κλειδιού (π.χ. Στήθος + Chest)
            const engKey = mapping[group];
            const done = (history[group] || 0) + (history[engKey] || 0);
            const target = this.targets[group];
            return { 
                name: group, 
                done: done, 
                target: target, 
                percent: Math.min(100, Math.round((done / target) * 100)) 
            };
        });
    },

    render() {
        const container = document.getElementById('previewContent');
        if (!container) return;
        const stats = this.calculateStats();
        
        let html = `<div id="muscle-progress-section" style="width:100%; background:#0a0a0a; padding:15px; border-radius:8px; margin-bottom:20px; border:1px solid #222; box-sizing:border-box;">
                    <h3 style="color:#4CAF50; text-align:center; font-size:13px; margin-bottom:15px; text-transform:uppercase; margin-top:0;">Weekly Muscle Coverage</h3>`;
        
        stats.forEach(s => {
            const color = s.percent >= 100 ? "#4CAF50" : "#ff9800";
            html += `<div style="margin-bottom:12px; width:100%;">
                        <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px; color:#eee;">
                            <span>${s.name.toUpperCase()}</span>
                            <span style="font-family:monospace;">${s.done}/${s.target} Sets (${s.percent}%)</span>
                        </div>
                        <div style="width:100%; height:6px; background:#1a1a1a; border-radius:3px; overflow:hidden; border:1px solid #333;">
                            <div style="width:${s.percent}%; height:100%; background:${color}; transition: width 1s ease-in-out;"></div>
                        </div>
                    </div>`;
        });
        html += `</div><div style="width:100%; text-align:center; color:#444; font-size:10px; margin-bottom:15px; letter-spacing:2px;">——— ΗΜΕΡΗΣΙΕΣ ΑΣΚΗΣΕΙΣ ———</div>`;
        
        container.insertAdjacentHTML('afterbegin', html);
    }
};

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
/* ===== SELECTDAY (PEGASUS NORMALIZED v2.2 - EMS OPTIMIZED) ===== */
function selectDay(btn, day) {
    // 1. UI RESET: Καθαρισμός όλων των κουμπιών (Επιστροφή σε Μαύρο)
    document.querySelectorAll(".navbar button").forEach(b => {
        b.classList.remove("active");
        b.style.setProperty('background-color', '#000', 'important');
        b.style.setProperty('border', 'none', 'important');
        b.style.setProperty('outline', 'none', 'important');
        b.style.color = "#fff";
    });
    
    // 2. ACTIVE STATE: Η επιλεγμένη μέρα γίνεται πράσινη με λευκό πλαίσιο
    if (btn) {
        btn.classList.add("active");
        btn.style.setProperty('background-color', '#4CAF50', 'important');
        btn.style.setProperty('border', '2px solid white', 'important');
    }

    // 3. Engine Reset
    clearInterval(timer);
    timer = null;
    running = false;
    phase = 0;
    currentIdx = 0;
    
    if (typeof resetKcal === "function") resetKcal();
    const sBtn = document.getElementById("btnStart");
    if (sBtn) sBtn.innerHTML = "Έναρξη";

    // 4. Δυναμική Λήψη Δεδομένων (Normalizing Spillover + DVS Optimization)
    let rawBaseData = (typeof getFinalProgram !== 'undefined') ? 
                      [...getFinalProgram(day, window.program)] : 
                      ((window.program[day]) ? [...window.program[day]] : []);

    const isGoodWeather = (typeof isRaining !== 'undefined') ? !isRaining() : true;
    
    // Έλεγχος για Spillover από Κυριακή σε Παρασκευή (αν ο καιρός είναι καλός)
    if (day === "Παρασκευή" && isGoodWeather && window.program["Κυριακή"]) {
        const sundayWeights = window.program["Κυριακή"].filter(ex => ex.name !== "Ποδηλασία 30km");
        const bonusExercises = sundayWeights.map(ex => ({...ex, isSpillover: true}));
        rawBaseData = [...rawBaseData, ...bonusExercises];
    }

    // ΕΝΕΡΓΟΠΟΙΗΣΗ DVS: Φιλτράρισμα και βελτιστοποίηση σετ. 
    // ΠΡΟΣΟΧΗ: Περνάμε το 'day' ως δεύτερη παράμετρο για να ενεργοποιηθεί ο κανόνας του Κορμού.
    let baseData = (window.DVS) ? window.DVS.optimize(rawBaseData, day) : rawBaseData;

    // 5. Ταξινόμηση (Drag & Drop) βάσει αποθηκευμένης σειράς
    const savedOrder = JSON.parse(localStorage.getItem(`pegasus_order_${day}`));
    if (savedOrder && savedOrder.length === baseData.length) {
        baseData.sort((a, b) => {
            const indexA = savedOrder.indexOf(a.name);
            const indexB = savedOrder.indexOf(b.name);
            return (indexA !== -1 && indexB !== -1) ? indexA - indexB : 0;
        });
    }

    // 6. DOM Rendering
    const list = document.getElementById("exList");
    if (!list) return;
    list.innerHTML = ""; 
    exercises = [];
    remainingSets = [];

    baseData.forEach((e, idx) => {
        const d = document.createElement("div");
        d.className = "exercise"; 
        d.dataset.total = e.sets;
        d.dataset.done = 0;
        d.dataset.index = idx;
        d.setAttribute("draggable", "true");

        // Drag & Drop Event Handlers
        d.ondragstart = (event) => { 
            event.dataTransfer.setData("text/plain", idx); 
            d.classList.add("dragging"); 
        };
        d.ondragend = () => d.classList.remove("dragging");

        let savedWeight = localStorage.getItem(`weight_${e.name}`) || "";

        // UI ΕΝΔΕΙΞΗ: Προσθήκη emoji ☀️ αν η άσκηση είναι Spillover από Κυριακή
        const displayName = e.isSpillover ? `${e.name} ☀️` : e.name;

        d.innerHTML = `
            <div class="exercise-info" onclick="window.toggleSkipExercise(${idx})">
                <div class="set-counter">0/${e.sets}</div>
                <div class="exercise-name">${displayName}</div>
                <input type="number" class="weight-input" placeholder="kg" value="${savedWeight}" 
                       onclick="event.stopPropagation()" onchange="saveWeight('${e.name}', this.value)">
            </div>
            <div class="progress-box"><div class="progress-bar"></div></div>
        `;
        list.appendChild(d);
        exercises.push(d);
        remainingSets.push(parseInt(e.sets) || 3);
    });

    // 7. Final Calculations & Media Setup
    if (typeof calculateTotalTime === "function") calculateTotalTime();
    if (typeof showVideo === "function") showVideo(0);

    console.log(`PEGASUS: Day ${day} loaded. Exercises count: ${baseData.length}`);
	// Στο τέλος της selectDay
    if (typeof initDragDrop === "function") {
        initDragDrop();
    }
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
   PEGASUS CORE ENGINE - UNIFIED LOGIC & METABOLIC SYNC
   ============================================================= */
function runPhase() {
    if (!running) return;
    clearInterval(timer);

    // 1. ΕΛΕΓΧΟΣ ΟΛΟΚΛΗΡΩΣΗΣ ΠΡΟΠΟΝΗΣΗΣ
    if (remainingSets.every(s => s <= 0)) {
        finishWorkout();
        return;
    }

    // 2. ΔΥΝΑΜΙΚΟΣ ΣΥΓΧΡΟΝΙΣΜΟΣ ΠΑΡΑΜΕΤΡΩΝ ΧΡΟΝΟΥ
    workoutPhases[1].d = parseInt(localStorage.getItem("pegasus_ex_time")) || 45;
    workoutPhases[2].d = parseInt(localStorage.getItem("pegasus_rest_time")) || 60;

    const e = exercises[currentIdx];
    if (!e) return;
    
    const exName = e.querySelector(".exercise-name").textContent.trim().replace(" ☀️", "");
    const wInput = e.querySelector(".weight-input");

    // UI STYLING
    exercises.forEach(ex => ex.style.borderColor = "#222");
    const isAngelosTurn = !partnerData.isActive || partnerData.isUser1Turn;
    e.style.borderColor = isAngelosTurn ? "#4CAF50" : "#00bcd4";

    let currentPhaseName = "";
    let t = 0;
    const partnerName = (partnerData.currentPartner || "ΣΥΝΕΡΓΑΤΗΣ").toUpperCase();

    // 3. ΕΠΙΛΟΓΗ ΧΡΟΝΟΥ ΚΑΙ ΟΝΟΜΑΤΟΣ ΦΑΣΗΣ
    if (phase === 0) {
        currentPhaseName = `ΠΡΟΕΤΟΙΜΑΣΙΑ (ΑΓΓΕΛΟΣ)`;
        t = workoutPhases[0].d;
    } 
    else if (phase === 1) {
        currentPhaseName = `ΑΣΚΗΣΗ (ΑΓΓΕΛΟΣ)`;
        t = workoutPhases[1].d;
    } 
    else if (phase === 2) {
        currentPhaseName = partnerData.isActive ? `ΑΣΚΗΣΗ (${partnerName})` : `ΔΙΑΛΕΙΜΜΑ (ΑΓΓΕΛΟΣ)`;
        t = workoutPhases[2].d; 
    }

    if (phase !== 2) showVideo(currentIdx);

    // 4. TIMER LOOP (STRICT DATA COMMIT)
    timer = setInterval(() => {
        t -= 1;
        remainingSeconds = Math.max(0, remainingSeconds - 1);
        updateTotalBar();

        // --- PEGASUS DATA ENGINE INTEGRATION ---
        // Commit θερμίδων στο LocalStorage κάθε δευτερόλεπτο στη φάση άσκησης
        if (phase === 1 && window.PegasusLogic) {
            window.PegasusLogic.updateMetabolicData();
        }
        // ---------------------------------------

        if (t <= 3 && t > 0) playBeep(0.5);
        if (t === 0) playBeep(0.9);

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
                // ΤΕΛΟΣ ΦΑΣΗΣ ΑΣΚΗΣΗΣ
                if (wInput) {
                    const weightVal = wInput.value;
                    saveWeight(exName, weightVal); 
                    if (typeof window.logPegasusSet === "function") window.logPegasusSet(exName);
                }
                
                phase = 2;
                if (partnerData.isActive) partnerData.isUser1Turn = false;
                runPhase();
            } 
            else if (phase === 2) {
                // ΤΕΛΟΣ ΦΑΣΗΣ ΔΙΑΛΕΙΜΜΑΤΟΣ
                if (partnerData.isActive && wInput) savePartnerWeight(exName, wInput.value);

                e.dataset.done++;
                remainingSets[currentIdx]--;
                e.querySelector(".set-counter").textContent = `${e.dataset.done}/${e.dataset.total}`;
                
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

/* ===== ΣΥΝΑΡΤΗΣΗ SKIP (TOGGLE STATUS) ===== */
window.toggleSkipExercise = function(idx) {
    if (!exercises[idx]) {
        console.error("PEGASUS: Exercise index not found.");
        return;
    }
    
    const exDiv = exercises[idx];
    // Εναλλαγή της κλάσης για οπτική σήμανση (γκριζάρισμα)
    exDiv.classList.toggle("exercise-skipped");
    
    // Επανυπολογισμός συνολικού χρόνου προπόνησης
    if (typeof calculateTotalTime === "function") {
        calculateTotalTime();
    }
    
    console.log(`PEGASUS: Exercise ${idx} status changed. Workout time updated.`);
};

/* === FINISH WORKOUT LOGIC - METABOLIC & REPORTING SYNC === */
function finishWorkout() {
    clearInterval(timer);
    running = false;
    
    // 1. Υπολογισμός workoutKey
    let workoutKey;
    const activeBtn = document.querySelector(".navbar button.active");
    if (activeBtn) {
        const dayName = activeBtn.textContent.trim();
        const greekDays = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
        const now = new Date();
        const currentDayIdx = now.getDay();
        const targetDayIdx = greekDays.indexOf(dayName);
        
        let diff = targetDayIdx - currentDayIdx;
        const targetDate = new Date();
        targetDate.setDate(now.getDate() + diff);
        workoutKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
    } else {
        const now = new Date();
        workoutKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    // 2. Αποθήκευση στο LocalStorage
    let data = JSON.parse(localStorage.getItem("pegasus_workouts_done") || "{}");
    data[workoutKey] = true;
    localStorage.setItem("pegasus_workouts_done", JSON.stringify(data));

    // 3. Update UI & Calendar Logic
    if (window.updateTotalWorkoutCount) window.updateTotalWorkoutCount();
    if (window.renderCalendar) window.renderCalendar();
    
    // 4. ΕΝΕΡΓΟΠΟΙΗΣΗ PEGASUS REPORTING (Filtered)
    if (window.PegasusReporting) {
        // Ανάκτηση τρεχουσών θερμίδων από τη μεταβολική μηχανή (74kg)
        const currentKcal = localStorage.getItem("pegasus_today_kcal") || "0";
        
        // Αποθήκευση ΜΟΝΟ των ασκήσεων που έγιναν σήμερα (done > 0)
        window.PegasusReporting.saveWorkout(currentKcal);
        
        // Αποστολή μέσω EmailJS
        window.PegasusReporting.checkAndSendMorningReport(true);
    } 
    else if (window.PegasusLogic && typeof window.PegasusLogic.generateDailyReport === "function") {
        window.PegasusLogic.generateDailyReport();
    }

    alert(`Η προπόνηση για την ημερομηνία ${workoutKey} καταγράφηκε επιτυχώς!`);
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

function openExercisePreview() {
    const activeBtn = document.querySelector(".navbar button.active");
    if (!activeBtn) {
        alert("Παρακαλώ επίλεξε πρώτα μια ημέρα!");
        return;
    }

    const currentDay = activeBtn.textContent;
    const dayExercises = program[currentDay];
    const panel = document.getElementById('previewPanel');
    const content = document.getElementById('previewContent');
    
    document.getElementById('previewTitle').innerText = `ΠΡΟΕΠΙΣΚΟΠΗΣΗ: ${currentDay.toUpperCase()}`;
    
    // 1. Εμφάνιση του panel
    panel.style.display = 'block';

    // 2. Καθαρισμός περιεχομένου
    content.innerHTML = ''; 

    // 3. FORCE RENDER (Διόρθωση 0% - Weekly Muscle Coverage)
    // Καλούμε το MuscleProgressUI πριν το render των ασκήσεων
    if (window.MuscleProgressUI && typeof window.MuscleProgressUI.render === "function") {
        console.log("PEGASUS ANALYST: Rendering Muscle Progress Bars...");
        window.MuscleProgressUI.render();
    } else {
        console.error("PEGASUS ANALYST: MuscleProgressUI structure is invalid or missing!");
    }

    // 4. Mapping Εικόνων (Ενσωμάτωση bikeImage)
    const smartMapping = { 
        "pulldown": "pulldownimage.png", 
        "triceps overhead extension": "tricepsoverheadimage.png", 
        "ems": "emsImage.png",
        "ποδηλασία": "bikeImage.jpg", // Σάββατο Cardio
        "cycling": "bikeImage.jpg"
    };
    
    dayExercises.forEach(ex => {
        const lowerName = ex.name.toLowerCase();
        
        // Αναζήτηση κλειδιού στο mapping
        const key = Object.keys(smartMapping).find(k => lowerName.includes(k));
        
        // Καθορισμός αρχείου εικόνας
        let imgFile;
        if (key) {
            imgFile = smartMapping[key];
        } else {
            // Δυναμικό όνομα αρχείου: αφαίρεση κενών και προσθήκη 'image.png'
            imgFile = ex.name.replace(/\s+/g, '').toLowerCase() + "image.png";
        }

        // 5. Injection στο DOM
        content.innerHTML += `
            <div class="preview-item" style="margin: 10px; text-align: center; width: 160px;">
                <img src="images/${imgFile}" onerror="this.src='images/placeholder.jpg'" 
                     style="width: 150px; height: 100px; border: 2px solid #4CAF50; border-radius: 8px; object-fit: cover; background: #222;">
                <p style="color: #4CAF50; font-weight: bold; font-size: 11px; margin-top: 5px; text-transform: uppercase;">${ex.name}</p>
            </div>
        `;
    });
}

/* === GLOBAL PANEL AUTO-CLOSE LOGIC === */
window.addEventListener('mousedown', (e) => {
    // 1. Λίστα με όλα τα IDs των παραθύρων της εφαρμογής Pegasus
    const panels = [
        'foodPanel', 
        'calendarPanel', 
        'achievementsPanel', 
        'settingsPanel', 
        'previewPanel',
        'toolsPanel',
        'galleryPanel'
    ];

    panels.forEach(id => {
        const panel = document.getElementById(id);
        
        // 2. Έλεγχος αν το panel είναι ανοιχτό
        if (panel && panel.style.display === 'block') {
            
            // 3. Αν το κλικ ΔΕΝ είναι μέσα στο panel ΚΑΙ ΔΕΝ είναι σε κάποιο κουμπί ελέγχου (p-btn)
            // Χρησιμοποιούμε e.target για να δούμε πού ακριβώς πάτησε ο χρήστης
            if (!panel.contains(e.target) && !e.target.closest('.p-btn')) {
                panel.style.display = 'none';
                console.log(`PEGASUS: Auto-closed ${id}`);
            }
        }
});
});

/* === PEGASUS WORKOUT COUNTER SYSTEM === */
window.updateTotalWorkoutCount = function() {
    const data = JSON.parse(localStorage.getItem("pegasus_workouts_done") || "{}");
    const total = Object.keys(data).length;
    const display = document.getElementById("totalWorkoutsDisplay");
    if (display) {
        display.textContent = `Προπονήσεις: ${total}`;
    }
}; // <--- ΑΥΤΗ Η ΑΓΚΥΛΗ ΕΛΕΙΠΕ ΚΑΙ ΕΙΝΑΙ ΑΠΑΡΑΙΤΗΤΗ

// Εκτέλεση μόλις φορτώσει το αρχείο
updateTotalWorkoutCount();

window.logPegasusSet = function(exName) {
    let history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || 
                  { "Στήθος": 0, "Πλάτη": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 };
    const exercise = window.exercisesDB.find(ex => ex.name === exName);
    if (exercise) {
        // Αν είναι ποδηλασία, δώσε 3 πόντους όγκου, αλλιώς 1
        const value = (exercise.name.includes("Ποδηλασία")) ? 3 : 1;
        history[exercise.muscleGroup] += value;
        localStorage.setItem('pegasus_weekly_history', JSON.stringify(history));
    }
};

// PEGASUS ANALYST: Real-time weight tracking
document.querySelectorAll('.weight-input').forEach(input => {
    input.addEventListener('change', (e) => {
        const exName = e.target.closest('.exercise-node').querySelector('.exercise-name').textContent.trim();
        const weightVal = parseFloat(e.target.value) || 0;
        
        // Άμεση αποθήκευση στο localStorage για να είναι διαθέσιμο στο MetabolicEngine
        localStorage.setItem(`weight_ANGELOS_${exName}`, weightVal);
        console.log(`PEGASUS: Weight updated for ${exName}: ${weightVal}kg`);
    });
});