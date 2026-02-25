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

// ΜΟΝΑΔΙΚΗ ΔΗΛΩΣΗ ΤΩΝ PHASES
const workoutPhases = [
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

/* ===== NAVIGATION & RENDER ===== */
function createNavbar() {
    const nav = document.getElementById("navbar");
    if (!nav) return;
    const days = ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο", "Κυριακή"];
    nav.innerHTML = "";
    days.forEach(d => {
        const b = document.createElement("button");
        b.textContent = d;
        b.onclick = () => selectDay(b, d);
        nav.appendChild(b);
    });
}

/* ===== SELECTDAY (PARTNER UPDATED) ===== */
function selectDay(btn, day) {
    document.querySelectorAll(".navbar button").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");

    clearInterval(timer);
    timer = null;
    running = false;
    phase = 0;
    currentIdx = 0;
    
    if (typeof resetKcal === "function") resetKcal();
    const sBtn = document.getElementById("btnStart");
    if (sBtn) sBtn.innerHTML = "Έναρξη";

    let listData = (typeof program !== 'undefined' && program[day]) ? [...program[day]] : [];
    const savedOrder = JSON.parse(localStorage.getItem(`pegasus_order_${day}`));
    if (savedOrder && savedOrder.length === listData.length) {
        listData.sort((a, b) => savedOrder.indexOf(a.name) - savedOrder.indexOf(b.name));
    }

    const list = document.getElementById("exList");
    if (!list) return;
    list.innerHTML = ""; 

    exercises = [];
    remainingSets = [];

    listData.forEach((e, idx) => {
        const d = document.createElement("div");
        d.className = "exercise"; 
        d.dataset.total = e.sets;
        d.dataset.done = 0;
        d.dataset.index = idx; 
        d.setAttribute("draggable", "true");

        d.ondragstart = (event) => {
            event.dataTransfer.setData("text/plain", idx);
            d.classList.add("dragging");
        };
        d.ondragend = () => d.classList.remove("dragging");

        let savedWeight;
        if (typeof partnerData !== 'undefined' && partnerData.isActive) {
            partnerData.isUser1Turn = true;
            savedWeight = loadPartnerWeight(e.name);
        } else {
            savedWeight = localStorage.getItem(`weight_${e.name}`) || "";
        }

        // ΕΔΩ ΕΙΝΑΙ Η ΣΥΝΔΕΣΗ ΜΕ ΤΟ TOGGLE
d.innerHTML = `
            <div class="exercise-info" onclick="window.toggleSkipExercise(${idx})">
                <div class="set-counter">0/${e.sets}</div>
                <div class="exercise-name">${e.name}</div>
                <input type="number" class="weight-input" placeholder="kg" value="${savedWeight}" 
                       onclick="event.stopPropagation()" onchange="saveWeight('${e.name}', this.value)">
            </div>
            <div class="progress-box"><div class="progress-bar"></div></div>
            <div class="status">Αναμονή</div>
        `;
        list.appendChild(d);
        exercises.push(d);
        remainingSets.push(parseInt(e.sets));
    });

    list.ondragover = (e) => {
        e.preventDefault();
        const draggingItem = document.querySelector(".dragging");
        const siblings = [...list.querySelectorAll(".exercise:not(.dragging)")];
        const nextSibling = siblings.find(sibling => e.clientY <= sibling.offsetTop + sibling.offsetHeight / 2);
        list.insertBefore(draggingItem, nextSibling);
    };
    list.ondrop = () => reorderExercises();

    calculateTotalTime();
    updateTotalBar();
    showVideo(0);
}

// 2. Η ΣΥΝΑΡΤΗΣΗ ΠΟΥ ΕΛΕΙΠΕ (Πρόσθεσέ την αμέσως μετά τη selectDay)
window.toggleSkipExercise = function(idx) {
    const exDiv = exercises[idx];
    if (exDiv) {
        exDiv.classList.toggle("exercise-skipped");
        // Επανυπολογισμός χρόνου Pegasus
        window.calculateTotalTime(); 
        console.log(`Pegasus: Exercise ${idx} skipped/unskipped. Time updated.`);
    }
};

/* ===== CORE ENGINE ===== */
function startPause() {
    if (exercises.length === 0) return;

    // ΠΡΟΣΘΗΚΗ: Αν η τρέχουσα άσκηση είναι σβησμένη, βρες την επόμενη διαθέσιμη πριν ξεκινήσεις
    if (!running && exercises[currentIdx].classList.contains("exercise-skipped")) {
        let nextValid = getNextIndexCircuit();
        if (nextValid !== -1) {
            currentIdx = nextValid;
        } else {
            alert("Όλες οι ασκήσεις είναι απενεργοποιημένες!");
            return;
        }
    }

    running = !running;
    const sBtn = document.getElementById("btnStart");
    if (sBtn) sBtn.innerHTML = running ? "Παύση" : "Συνέχεια";
    
    if (running) runPhase();
    else { clearInterval(timer); timer = null; }
}


/* ===== RUNPHASE (PEGASUS STRICT FINAL) ===== */
function runPhase() {
    if (!running) return;
    clearInterval(timer);

    // 1. ΕΛΕΓΧΟΣ ΑΝ ΤΕΛΕΙΩΣΑΝ ΤΑ ΣΕΤ
    if (remainingSets.every(s => s <= 0)) {
        finishWorkout();
        return;
    }

    // 2. ΔΥΝΑΜΙΚΟΣ ΣΥΓΧΡΟΝΙΣΜΟΣ ΧΡΟΝΩΝ
    workoutPhases[1].d = parseInt(localStorage.getItem("pegasus_ex_time")) || 45;
    workoutPhases[2].d = parseInt(localStorage.getItem("pegasus_rest_time")) || 60;

    const e = exercises[currentIdx];
    if (!e) return;
    const exName = e.querySelector(".exercise-name").textContent.trim();
    const wInput = e.querySelector(".weight-input");

    // UI Styling
    exercises.forEach(ex => ex.style.borderColor = "#222");
    const isAngelosTurn = !partnerData.isActive || partnerData.isUser1Turn;
    e.style.borderColor = isAngelosTurn ? "#4CAF50" : "#00bcd4";

    let currentPhaseName = "";
    let t = 0;
    const partnerName = (partnerData.currentPartner || "ΣΥΝΕΡΓΑΤΗΣ").toUpperCase();

    // ΕΠΙΛΟΓΗ ΧΡΟΝΟΥ ΦΑΣΗΣ
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

    // TIMER LOOP
    timer = setInterval(() => {
        t -= 1;
        remainingSeconds = Math.max(0, remainingSeconds - 1);
        updateTotalBar();

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
                // ΚΑΤΑΓΡΑΦΗ ΒΑΡΟΥΣ
                if (wInput) {
                    const weightVal = wInput.value;
                    saveWeight(exName, weightVal); 
                    if (typeof window.logPegasusSet === "function") window.logPegasusSet(exName, weightVal);
                }
                
                // --- PEGASUS STRICT CALORIE TRACKING ---
                if (typeof trackSetCalories === "function") {
                    // Χρησιμοποιούμε το δικό σου βάρος 74kg και τον χρόνο που μόλις τελείωσε
                    trackSetCalories(74, workoutPhases[1].d);
                }

                phase = 2;
                if (partnerData.isActive) partnerData.isUser1Turn = false;
                runPhase();
            } 
            else if (phase === 2) {
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

    // Αν κάνεις skip ενώ τρέχει η άσκηση (Phase 1 ή 2), θεωρούμε το σετ ολοκληρωμένο
    if ((phase === 1 || phase === 2) && running) {
        exercises[currentIdx].dataset.done++;
        remainingSets[currentIdx]--;
        exercises[currentIdx].querySelector(".set-counter").textContent = 
            `${exercises[currentIdx].dataset.done}/${exercises[currentIdx].dataset.total}`;
    }

    let nextIdx = getNextIndexCircuit();
    if (nextIdx !== -1) {
        currentIdx = nextIdx;
        phase = 0; // Επιστροφή στην Προετοιμασία

        // --- PARTNER RESET LOGIC ---
        if (typeof partnerData !== 'undefined' && partnerData.isActive) {
            partnerData.isUser1Turn = true; // Η νέα άσκηση ξεκινάει πάντα από σένα (Άγγελος)
            
            // Ενημέρωση του input με τα δικά σου κιλά για τη νέα άσκηση
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
    const name = ex.querySelector(".exercise-name").textContent.trim();
    const vid = document.getElementById("video");
    
    if (vid && typeof videoMap !== 'undefined') {
        let videoFile = videoMap[name] || "default";

        // SMART VIDEO LOGIC: Αν το όνομα της άσκησης περιέχει "EMS", δείξε το ems.mp4
        if (name.toLowerCase().includes("ems")) {
            videoFile = "ems";
        }

        vid.src = `videos/${videoFile}.mp4`;
        vid.style.opacity = "1"; 
        vid.play().catch(() => {
            console.log(`Video not found: ${videoFile}.mp4`);
        });
    }
}

/* ===== ΥΠΟΛΟΓΙΣΜΟΣ ΣΥΝΟΛΙΚΟΥ ΧΡΟΝΟΥ (FULL SYNC & UI UPDATE) ===== */
window.calculateTotalTime = function() {
    // 1. Συγχρονισμός τιμών
    workoutPhases[1].d = parseInt(localStorage.getItem("pegasus_ex_time")) || 45;
    workoutPhases[2].d = parseInt(localStorage.getItem("pegasus_rest_time")) || 60;

    totalSeconds = 0;
    const activeDay = document.querySelector(".navbar button.active")?.textContent;
    const dayData = (activeDay && program[activeDay]) ? program[activeDay] : [];
    
    exercises.forEach((exDiv, idx) => {
        if (exDiv.classList.contains("exercise-skipped")) return;
        const data = dayData[idx];
        if (!data) return;
        
        const currentExDuration = workoutPhases[1].d;
        const cycleTime = workoutPhases[0].d + currentExDuration + workoutPhases[2].d;
        totalSeconds += parseInt(data.sets) * cycleTime;
    });

    remainingSeconds = totalSeconds;

    // 2. ΕΝΗΜΕΡΩΣΗ ΤΟΥ ΚΕΙΜΕΝΟΥ (Στο σωστό ID: totalProgressTime)
    const timeDisplay = document.getElementById("totalProgressTime"); 
    if (timeDisplay) {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        // Ενημερώνουμε το ρολόι που βλέπεις στην οθόνη
        timeDisplay.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
    }

    // 3. Ενημέρωση της μπάρας
    if (typeof updateTotalBar === "function") {
        updateTotalBar();
    }
    
    console.log(`Pegasus Engine: Total time set to ${totalSeconds}s`);
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

function finishWorkout() {
    running = false;
    if (timer) clearInterval(timer);

    // 1. Πάρε τις θερμίδες από την οθόνη
    const kcalDisplay = document.querySelector(".kcal-value")?.textContent || "0";

    // 2. Ενημέρωσε το Reporting για θερμίδες και βάρη
    if (window.PegasusReporting) {
        window.PegasusReporting.saveWorkout(kcalDisplay);
    }

    // 3. Πρασίνισμα Ημερολογίου
    const now = new Date();
    const workoutKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    let data = JSON.parse(localStorage.getItem("pegasus_workouts_done") || "{}");
    data[workoutKey] = true;
    localStorage.setItem("pegasus_workouts_done", JSON.stringify(data));

    // 4. Update UI & Αποστολή Email
    if(window.updateTotalWorkoutCount) window.updateTotalWorkoutCount();
    if(window.renderCalendar) window.renderCalendar();
    
    // Στέλνουμε το report για ΣΗΜΕΡΑ (true) για να συμπεριλάβει τα αυγά
    if(window.PegasusReporting) window.PegasusReporting.checkAndSendMorningReport(true);

    alert("Η προπόνηση ολοκληρώθηκε! Το ημερολόγιο πρασίνισε και η αναφορά στάλθηκε.");
}


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
    content.innerHTML = ''; 

    // SMART MAPPING - Εδώ ορίζουμε τις ειδικές εικόνες
    const smartMapping = {
        "pulldown": "pulldownimage.png",
        "triceps overhead extension": "tricepsoverheadimage.png",
        "ems": "emsImage.png" // Κλειδώνει όλες τις ασκήσεις EMS στην ίδια εικόνα
    };

    dayExercises.forEach(ex => {
        const lowerName = ex.name.toLowerCase();
        let imgFile = "";

        // Αναζήτηση αν το όνομα της άσκησης περιέχει κάποια λέξη-κλειδί από το smartMapping
        const key = Object.keys(smartMapping).find(k => lowerName.includes(k));
        
        if (key) {
            imgFile = smartMapping[key];
        } else {
            // Αν δεν υπάρχει στο smartMapping, φτιάχνει το όνομα αυτόματα (π.χ. Pec Deck -> pecdeckimage.png)
            imgFile = ex.name.replace(/\s+/g, '').toLowerCase() + "image.png";
        }

        const imgPath = `images/${imgFile}`;
        
        // Κατασκευή του UI για την κάθε άσκηση
        content.innerHTML += `
            <div class="preview-item" style="margin: 10px; text-align: center; width: 160px;">
                <img src="${imgPath}" 
                     onerror="this.src='images/placeholder.jpg'" 
                     style="width: 150px; height: 100px; border: 2px solid #4CAF50; border-radius: 8px; object-fit: cover; background: #222;">
                <p style="color: #4CAF50; font-weight: bold; font-size: 11px; margin-top: 5px; text-transform: uppercase; line-height: 1.2;">${ex.name}</p>
            </div>
        `;
    });

    panel.style.display = 'block';
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
};

// Εκτέλεση μόλις φορτώσει το αρχείο
updateTotalWorkoutCount();