/* ==========================================================================
   PEGASUS WORKOUT ENGINE - v9.0 (HYBRID SYNC + STRICT MEDIA)
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

let workoutPhases = [
    { n: "Προετοιμασία", d: 10 }, 
    { n: "Άσκηση", d: parseInt(localStorage.getItem("pegasus_ex_time")) || 45 },      
    { n: "Διάλειμμα", d: parseInt(localStorage.getItem("pegasus_rest_time")) || 60 }     
];

let userWeight = parseFloat(localStorage.getItem("pegasus_weight")) || 74;

/* ===== AUDIO UNLOCK LOGIC ===== */
let sysAudio = new Audio('videos/beep.mp3');
let audioUnlocked = false;

document.addEventListener('click', function() {
    if (!audioUnlocked) {
        sysAudio.play().then(() => {
            sysAudio.pause();
            sysAudio.currentTime = 0;
            audioUnlocked = true;
        }).catch(err => console.warn("PEGASUS: Audio unlock pending"));
    }
}, { once: true });

const playBeep = (volume = 1) => {
    if (!muted) {
        sysAudio.volume = volume;
        sysAudio.currentTime = 0; 
        sysAudio.play().catch(e => console.log("Audio blocked"));
    }
};

/* ===== NAVIGATION ===== */
function createNavbar() {
    const nav = document.getElementById("navbar");
    if (!nav) return;
    const days = ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο", "Κυριακή"];
    nav.innerHTML = "";
    
    days.forEach((d) => {
        const b = document.createElement("button");
        b.textContent = d;
        b.id = `nav-${d}`;
        b.style.backgroundColor = "#000"; 
        b.style.color = "#fff";
        b.style.border = "none";
        b.onclick = () => selectDay(b, d);
        nav.appendChild(b);
    });
}

function selectDay(btn, day) {
    document.querySelectorAll(".navbar button").forEach(b => {
        b.classList.remove("active");
        b.style.setProperty('background-color', '#000', 'important');
        b.style.setProperty('border', 'none', 'important');
        b.style.setProperty('outline', 'none', 'important');
        b.style.color = "#fff";
    });
    
    if (btn) {
        btn.classList.add("active");
        btn.style.setProperty('background-color', '#4CAF50', 'important');
        btn.style.setProperty('border', '2px solid white', 'important');
    }

    clearInterval(timer);
    timer = null;
    running = false;
    phase = 0;
    currentIdx = 0;
    
    if (typeof resetKcal === "function") resetKcal();
    const sBtn = document.getElementById("btnStart");
    if (sBtn) sBtn.innerHTML = "Έναρξη";

    // 1. Λήψη Δυναμικού Προγράμματος
    let rawBaseData = (typeof getFinalProgram !== 'undefined') ? 
                      [...getFinalProgram(day)] : 
                      ((window.program && window.program[day]) ? [...window.program[day]] : []);

    const isGoodWeather = (typeof isRaining !== 'undefined') ? !isRaining() : true;
    
    if (day === "Παρασκευή" && isGoodWeather && window.getFinalProgram) {
        const sundayData = window.getFinalProgram("Κυριακή");
        if(sundayData && sundayData.length > 0) {
            const sundayWeights = sundayData.filter(ex => !ex.name.includes("Ποδηλασία"));
            const bonusExercises = sundayWeights.map(ex => ({...ex, isSpillover: true}));
            rawBaseData = [...rawBaseData, ...bonusExercises];
        }
    }

    // 2. Εφαρμογή DVS Optimize (Αν υπάρχει)
    let baseData = (window.DVS) ? window.DVS.optimize(rawBaseData, day) : rawBaseData;

    // 3. Ταξινόμηση (Drag & Drop)
    const savedOrder = JSON.parse(localStorage.getItem(`pegasus_order_${day}`));
    if (savedOrder && savedOrder.length === baseData.length) {
        baseData.sort((a, b) => savedOrder.indexOf(a.name) - savedOrder.indexOf(b.name));
    }

    const list = document.getElementById("exList");
    if (!list) return;
    list.innerHTML = ""; 
    exercises = [];
    remainingSets = [];

    baseData.forEach((e, idx) => {
        const d = document.createElement("div");
        d.className = "exercise"; 
        d.dataset.total = e.sets || 3;
        d.dataset.done = 0;
        d.dataset.index = idx;
        d.setAttribute("draggable", "true");

        // UI Σήμανση για ολοκληρωμένες/ακυρωμένες ασκήσεις από το DVS
        if (e.sets === 0) {
            d.style.setProperty('opacity', '0.2', 'important');
            d.style.setProperty('filter', 'grayscale(100%)', 'important');
            d.classList.add("exercise-skipped");
            d.style.pointerEvents = "none";
        }

        d.ondragstart = (event) => { event.dataTransfer.setData("text/plain", idx); d.classList.add("dragging"); };
        d.ondragend = () => d.classList.remove("dragging");

        let savedWeight = localStorage.getItem(`weight_ANGELOS_${e.name}`) || localStorage.getItem(`weight_${e.name}`) || "";
        const displayName = e.isSpillover ? `${e.name} ☀️` : e.name;

        d.innerHTML = `
            <div class="exercise-info" onclick="window.toggleSkipExercise(${idx})">
                <div class="set-counter">0/${d.dataset.total}</div>
                <div class="exercise-name">${displayName}</div>
                <input type="number" class="weight-input" value="${savedWeight}" 
                       onclick="event.stopPropagation()" onchange="saveWeight('${e.name}', this.value)">
            </div>
            <div class="progress-box"><div class="progress-bar"></div></div>
        `;
        list.appendChild(d);
        exercises.push(d);
        remainingSets.push(parseInt(d.dataset.total));
    });

    if (typeof calculateTotalTime === "function") calculateTotalTime();
    if (typeof showVideo === "function") showVideo(0);
}

function reorderExercises() {
    const list = document.getElementById("exList");
    const newOrder = Array.from(list.querySelectorAll(".exercise")).map(div => {
        return div.querySelector(".exercise-name").textContent.replace(" ☀️", "").trim();
    });
    
    exercises = Array.from(list.querySelectorAll(".exercise"));
    
    const activeBtn = document.querySelector(".navbar button.active");
    if (activeBtn) {
        localStorage.setItem(`pegasus_order_${activeBtn.textContent.trim()}`, JSON.stringify(newOrder));
    }
}

/* ===== CORE ENGINE ===== */
function startPause() {
    if (exercises.length === 0) return;

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

function runPhase() {
    if (!running) return;
    clearInterval(timer);

    if (remainingSets.every(s => s <= 0)) {
        finishWorkout();
        return;
    }

    workoutPhases[1].d = parseInt(localStorage.getItem("pegasus_ex_time")) || 45;
    workoutPhases[2].d = parseInt(localStorage.getItem("pegasus_rest_time")) || 60;

    const e = exercises[currentIdx];
    if (!e) return;
    
    const exName = e.querySelector(".exercise-name").textContent.trim().replace(" ☀️", "");
    const wInput = e.querySelector(".weight-input");

    exercises.forEach(ex => ex.style.borderColor = "#222");
    
    const isPartnerActive = typeof partnerData !== 'undefined' ? partnerData.isActive : false;
    const isUser1Turn = typeof partnerData !== 'undefined' ? partnerData.isUser1Turn : true;
    const isAngelosTurn = !isPartnerActive || isUser1Turn;
    
    e.style.borderColor = isAngelosTurn ? "#4CAF50" : "#00bcd4";

    let currentPhaseName = "";
    let t = 0;
    const partnerName = isPartnerActive ? (partnerData.currentPartner || "ΣΥΝΕΡΓΑΤΗΣ").toUpperCase() : "ΣΥΝΕΡΓΑΤΗΣ";

    if (phase === 0) {
        currentPhaseName = `ΠΡΟΕΤΟΙΜΑΣΙΑ (ΑΓΓΕΛΟΣ)`;
        t = workoutPhases[0].d;
    } 
    else if (phase === 1) {
        currentPhaseName = `ΑΣΚΗΣΗ (ΑΓΓΕΛΟΣ)`;
        t = workoutPhases[1].d;
    } 
    else if (phase === 2) {
        currentPhaseName = isPartnerActive ? `ΑΣΚΗΣΗ (${partnerName})` : `ΔΙΑΛΕΙΜΜΑ (ΑΓΓΕΛΟΣ)`;
        t = workoutPhases[2].d; 
    }

    if (phase !== 2) showVideo(currentIdx);

    timer = setInterval(() => {
        t -= 1;
        remainingSeconds = Math.max(0, remainingSeconds - 1);
        updateTotalBar();

        if (phase === 1 || phase === 2) {
            let currentKcal = parseFloat(localStorage.getItem("pegasus_today_kcal")) || 0;
            let burnRate = (phase === 1) ? (userWeight * 0.0017) : (userWeight * 0.0008);
            currentKcal += burnRate;
            localStorage.setItem("pegasus_today_kcal", currentKcal.toFixed(2));
            
            const kcalUI = document.querySelector(".kcal-value");
            if (kcalUI) kcalUI.textContent = currentKcal.toFixed(1);
        }

        if (t <= 3 && t > 0) playBeep(0.5);
        if (t === 0) playBeep(0.9);

        const label = document.getElementById("phaseTimer");
        if (label) {
            label.textContent = `${currentPhaseName} (${Math.max(0, Math.ceil(t))})`;
            label.style.color = (phase === 1) ? "#4CAF50" : (phase === 2 ? (isPartnerActive ? "#00bcd4" : "#FFC107") : "#64B5F6");
        }

        if (t <= 0) {
            clearInterval(timer);
            
            if (phase === 0) {
                phase = 1;
                runPhase();
            } 
            else if (phase === 1) {
                if (wInput) {
                    saveWeight(exName, wInput.value); 
                    if (typeof window.logPegasusSet === "function") window.logPegasusSet(exName);
                    
                    if (typeof PegasusCloud !== 'undefined') window.PegasusCloud.push(true);
                }
                
                phase = 2;
                if (isPartnerActive) partnerData.isUser1Turn = false;
                runPhase();
            } 
            else if (phase === 2) {
                if (isPartnerActive && wInput) savePartnerWeight(exName, wInput.value);

                e.dataset.done++;
                remainingSets[currentIdx]--;
                e.querySelector(".set-counter").textContent = `${e.dataset.done}/${e.dataset.total}`;
                
                if (isPartnerActive) partnerData.isUser1Turn = true; 
                
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
        savePartnerWeight(exerciseName, weightValue);
    } else {
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

    if ((phase === 1 || phase === 2) && running) {
        const currentExNode = exercises[currentIdx];
        const exName = currentExNode.querySelector(".exercise-name").textContent.trim().replace(" ☀️", "");
        
        currentExNode.dataset.done++;
        remainingSets[currentIdx]--;
        currentExNode.querySelector(".set-counter").textContent = `${currentExNode.dataset.done}/${currentExNode.dataset.total}`;

        if (window.logPegasusSet) window.logPegasusSet(exName);
        if (typeof PegasusCloud !== 'undefined') window.PegasusCloud.push(true);
    }

    let nextIdx = getNextIndexCircuit();
    if (nextIdx !== -1) {
        currentIdx = nextIdx;
        phase = 0; 

        if (typeof partnerData !== 'undefined' && partnerData.isActive) {
            partnerData.isUser1Turn = true; 
            const nextEx = exercises[currentIdx];
            const nextExName = nextEx.querySelector(".exercise-name").textContent.trim().replace(" ☀️", "");
            const nextInput = nextEx.querySelector(".weight-input");
            if (nextInput) {
                nextInput.value = loadPartnerWeight(nextExName);
            }
        }

        if (running) runPhase(); 
        else showVideo(currentIdx);
    } else { 
        finishWorkout(); 
    }
}

/* ===== STRICT MEDIA HANDLING (ORIGINAL ALGORITHM PRESERVED) ===== */
function showVideo(i) {
    const ex = exercises[i];
    if (!ex) return;
    
    let name = ex.querySelector(".exercise-name").textContent.trim();
    name = name.replace(" ☀️", "").trim(); 
    
    const vid = document.getElementById("video");
    
    if (vid && typeof videoMap !== 'undefined') {
        let videoFile = videoMap[name] || "default";

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

function openExercisePreview() {
    const activeBtn = document.querySelector(".navbar button.active");
    if (!activeBtn) {
        alert("Παρακαλώ επίλεξε πρώτα μια ημέρα!");
        return;
    }

    const currentDay = activeBtn.textContent.trim();
    let dayExercises = window.getFinalProgram ? window.getFinalProgram(currentDay) : [];
    
    const isGoodWeather = (typeof isRaining !== 'undefined') ? !isRaining() : true;
    if (currentDay === "Παρασκευή" && isGoodWeather && window.getFinalProgram) {
        const sundayData = window.getFinalProgram("Κυριακή");
        if(sundayData && sundayData.length > 0) {
            const sundayWeights = sundayData.filter(ex => !ex.name.includes("Ποδηλασία"));
            const bonus = sundayWeights.map(ex => ({...ex, isSpillover: true}));
            dayExercises = [...dayExercises, ...bonus];
        }
    }

    const panel = document.getElementById('previewPanel');
    const content = document.getElementById('previewContent');
    
    document.getElementById('previewTitle').innerText = `ΠΡΟΕΠΙΣΚΟΠΗΣΗ: ${currentDay.toUpperCase()}`;
    panel.style.display = 'block';
    content.innerHTML = ''; 

    if (window.MuscleProgressUI && typeof window.MuscleProgressUI.render === "function") {
        window.MuscleProgressUI.render();
    }

    // ORIGINAL SMART MAPPING ΓΙΑ ΣΤΑΤΙΚΕΣ ΕΙΚΟΝΕΣ
    const smartMapping = { 
        "pulldown": "pulldownimage.png", 
        "triceps overhead extension": "tricepsoverheadimage.png", 
        "ems": "emsImage.png",
        "ποδηλασία": "bikeImage.jpg", 
        "cycling": "bikeImage.jpg"
    };
    
    dayExercises.forEach(ex => {
        let cleanName = ex.name.replace(" ☀️", "").trim();
        const lowerName = cleanName.toLowerCase();
        
        const key = Object.keys(smartMapping).find(k => lowerName.includes(k));
        
        let imgFile;
        if (key) {
            imgFile = smartMapping[key];
        } else {
            imgFile = cleanName.replace(/\s+/g, '').toLowerCase() + "image.png";
        }

        content.innerHTML += `
            <div class="preview-item" style="margin: 10px; text-align: center; width: 160px; display: inline-block; vertical-align: top;">
                <img src="images/${imgFile}" onerror="this.src='images/placeholder.jpg'" 
                     style="width: 150px; height: 100px; border: 2px solid #4CAF50; border-radius: 8px; object-fit: cover; background: #222;">
                <p style="color: #4CAF50; font-weight: bold; font-size: 11px; margin-top: 5px; text-transform: uppercase;">${cleanName}</p>
            </div>
        `;
    });
}

/* ===== UTILS & TIMERS ===== */
window.calculateTotalTime = function() {
    workoutPhases[1].d = parseInt(localStorage.getItem("pegasus_ex_time")) || 45;
    workoutPhases[2].d = parseInt(localStorage.getItem("pegasus_rest_time")) || 60;

    totalSeconds = 0;
    
    exercises.forEach((exDiv) => {
        if (exDiv.classList.contains("exercise-skipped")) return;
        const sets = parseInt(exDiv.dataset.total) || 0;
        const cycleTime = workoutPhases[0].d + workoutPhases[1].d + workoutPhases[2].d;
        totalSeconds += sets * cycleTime;
    });

    remainingSeconds = totalSeconds;

    const timeDisplay = document.getElementById("totalProgressTime"); 
    if (timeDisplay) {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        timeDisplay.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
    }

    if (typeof updateTotalBar === "function") updateTotalBar();
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

    const progress = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
    bar.style.width = Math.max(0, Math.min(100, progress)) + "%";

    if (timeText) {
        const m = Math.floor(remainingSeconds / 60);
        const s = Math.floor(remainingSeconds % 60);
        timeText.textContent = `${m}:${String(s).padStart(2, "0")}`;
    }
}

window.toggleSkipExercise = function(idx) {
    if (!exercises[idx]) return;
    
    const exDiv = exercises[idx];
    exDiv.classList.toggle("exercise-skipped");
    
    if (typeof calculateTotalTime === "function") {
        calculateTotalTime();
    }
};

/* === FINISH WORKOUT LOGIC === */
function finishWorkout() {
    clearInterval(timer);
    running = false;
    
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

    let data = JSON.parse(localStorage.getItem("pegasus_workouts_done") || "{}");
    data[workoutKey] = true;
    localStorage.setItem("pegasus_workouts_done", JSON.stringify(data));

    if (window.updateTotalWorkoutCount) window.updateTotalWorkoutCount();
    if (window.renderCalendar) window.renderCalendar();
    
    if (window.PegasusCloud) window.PegasusCloud.push(false);

    if (window.PegasusReporting) {
        const currentKcal = localStorage.getItem("pegasus_today_kcal") || "0";
        window.PegasusReporting.saveWorkout(currentKcal);
        window.PegasusReporting.checkAndSendMorningReport(true);
    } 
    else if (window.PegasusLogic && typeof window.PegasusLogic.generateDailyReport === "function") {
        window.PegasusLogic.generateDailyReport();
    }

    alert(`Η προπόνηση για την ημερομηνία ${workoutKey} καταγράφηκε επιτυχώς!`);
}

window.updateTotalWorkoutCount = function() {
    const data = JSON.parse(localStorage.getItem("pegasus_workouts_done") || "{}");
    const count = Object.keys(data).length;
    console.log(`PEGASUS: Total workouts in history: ${count}`);
};

/* ===== INITIALIZATION ===== */
window.onload = () => {
    if (typeof emailjs !== 'undefined') emailjs.init('qsfyDrneUHP7zEFui');
    
    if (typeof PegasusReporting !== 'undefined') {
        const lastSent = localStorage.getItem("pegasus_last_auto_report");
        const todayStr = new Date().toLocaleDateString('el-GR');
        if (lastSent !== todayStr) {
            PegasusReporting.checkAndSendMorningReport();
            localStorage.setItem("pegasus_last_auto_report", todayStr);
        }
    }

    createNavbar();
    updateTotalWorkoutCount();
    
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

    const btnEmail = document.getElementById("btnManualEmail");
    if (btnEmail) {
        btnEmail.onclick = function() {
            if (window.PegasusReporting) {
                const kcalVal = document.querySelector(".kcal-value")?.textContent || "0";
                window.PegasusReporting.saveWorkout(kcalVal);
                window.PegasusReporting.checkAndSendMorningReport(true);
            } else {
                alert("Σφάλμα: Το reporting.js δεν έχει φορτωθεί.");
            }
        };
    }

    const uiBtns = { 
        "btnCalendarUI": "calendarPanel", "btnAchUI": "achievementsPanel", 
        "btnSettingsUI": "settingsPanel", "btnFoodUI": "foodPanel", 
        "btnToolsUI": "toolsPanel", "btnPreviewUI": "previewPanel" 
    };

    Object.keys(uiBtns).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.onclick = (e) => {
                e.stopPropagation();
                Object.values(uiBtns).forEach(id => { 
                    const el = document.getElementById(id); 
                    if (el) el.style.display = "none"; 
                });
                const targetPanel = document.getElementById(uiBtns[btnId]);
                if (targetPanel) {
                    targetPanel.style.display = "block";
                    if (btnId === "btnPreviewUI") openExercisePreview();
                }
                if (btnId === "btnCalendarUI" && window.renderCalendar) window.renderCalendar();
                if (btnId === "btnAchUI" && window.renderAchievements) window.renderAchievements();
                if (btnId === "btnFoodUI" && window.renderFood) window.renderFood();
            };
        }
    });
    
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

    if (typeof fetchWeather === "function") fetchWeather();
    const greekDays = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
    const todayName = greekDays[new Date().getDay()];
    setTimeout(() => { 
        document.querySelectorAll(".navbar button").forEach(b => { 
            if (b.textContent === todayName) selectDay(b, todayName); 
        }); 
    }, 300);
};

window.addEventListener('mousedown', (e) => {
    const panels = ['foodPanel', 'calendarPanel', 'achievementsPanel', 'settingsPanel', 'previewPanel', 'toolsPanel', 'galleryPanel'];
    let closedAny = false;
    panels.forEach(id => {
        const panel = document.getElementById(id);
        if (panel && panel.style.display === 'block') {
            if (!panel.contains(e.target) && !e.target.closest('.p-btn') && !e.target.closest('.navbar button')) {
                panel.style.display = 'none';
                closedAny = true;
            }
        }
    });
    if (closedAny && window.PegasusCloud) window.PegasusCloud.push(true);
});

window.logPegasusSet = function(exName) {
    let history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || 
                  { "Στήθος": 0, "Πλάτη": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0, "Ώμοι": 0 };
    
    if (!window.exercisesDB) return;
    
    const exercise = window.exercisesDB.find(ex => ex.name === exName);
    if (exercise && exercise.muscleGroup) {
        const value = (exercise.name.includes("Ποδηλασία")) ? 3 : 1;
        history[exercise.muscleGroup] = (history[exercise.muscleGroup] || 0) + value;
        localStorage.setItem('pegasus_weekly_history', JSON.stringify(history));
    }
};

document.querySelectorAll('.weight-input').forEach(input => {
    input.addEventListener('change', (e) => {
        const exName = e.target.closest('.exercise-node')?.querySelector('.exercise-name')?.textContent.trim();
        if (exName) {
            const weightVal = parseFloat(e.target.value) || 0;
            localStorage.setItem(`weight_ANGELOS_${exName}`, weightVal);
        }
    });
});
