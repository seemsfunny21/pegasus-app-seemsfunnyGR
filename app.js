/* ==========================================================================
   PEGASUS WORKOUT ENGINE - FINAL AUDITED EDITION (V6.6 - MODULAR UI)
   Protocol: Native Metabolic Engine, Audio Unlocked, LIVE CLOUD SYNC
   + PEGASUS PATCH: Zero-Time Protocol, 18-Set Cycling Credit, External UI
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

/* === DYNAMIC PARAMETERS === */
let workoutPhases = [
    { n: "Προετοιμασία", d: 10 }, 
    { n: "Άσκηση", d: parseInt(localStorage.getItem("pegasus_ex_time")) || 45 },     
    { n: "Διάλειμμα", d: parseInt(localStorage.getItem("pegasus_rest_time")) || 60 }     
];

let userWeight = parseFloat(localStorage.getItem("pegasus_weight")) || 74;

/* ===== AUDIO (SYSTEM UNLOCK LOGIC) ===== */
let sysAudio = new Audio('videos/beep.mp3');
let audioUnlocked = false;

document.addEventListener('click', function() {
    if (!audioUnlocked) {
        sysAudio.play().then(() => {
            sysAudio.pause();
            sysAudio.currentTime = 0;
            audioUnlocked = true;
            console.log("PEGASUS OS: Audio Unlocked");
        }).catch(err => console.warn("PEGASUS OS: Audio unlock pending", err));
    }
}, { once: true });

const playBeep = (volume = 1) => {
    if (!muted) {
        sysAudio.volume = volume;
        sysAudio.currentTime = 0; 
        sysAudio.play().catch(e => console.log("Audio blocked by OS", e));
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

const getMuscleGroup = (exName) => {
    if (window.exercisesDB) {
        const ex = window.exercisesDB.find(e => e.name.trim() === exName.trim());
        if (ex) return ex.muscleGroup;
    }
    return "Άλλο";
};

/* ===== SELECTDAY (V6.6 - STRICT TARGET LOCKDOWN & DVS) ===== */
function selectDay(btn, day) {
    document.querySelectorAll(".navbar button").forEach(b => {
        b.classList.remove("active");
        b.style.setProperty('background-color', '#000', 'important');
        b.style.setProperty('border', 'none', 'important');
        b.style.color = "#fff";
    });
    
    if (btn) {
        btn.classList.add("active");
        btn.style.setProperty('background-color', '#4CAF50', 'important');
        btn.style.color = "#fff";
    }

    if (window.PegasusCloud) window.PegasusCloud.push(true);

    clearInterval(timer);
    timer = null;
    running = false;
    phase = 0;
    currentIdx = 0;
    const sBtn = document.getElementById("btnStart");
    if (sBtn) sBtn.innerHTML = "Έναρξη";

    let rawBaseData = (typeof getFinalProgram !== 'undefined') ? 
                      [...getFinalProgram(day, window.program)] : 
                      ((window.program[day]) ? [...window.program[day]] : []);

    const currentHistory = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || {};
    const settings = (typeof window.getPegasusSettings === "function") ? window.getPegasusSettings() : { muscleTargets: {} };
    const userTargets = settings.muscleTargets || window.TARGET_SETS;

    let mappedData = rawBaseData.map(e => {
        const muscle = e.muscleGroup || getMuscleGroup(e.name);
        const done = currentHistory[muscle] || 0;
        const target = userTargets[muscle] || 24;

        let displaySets = e.sets;
        let isCompleted = done >= target;

        if (!isCompleted && (done + e.sets > target)) {
            displaySets = target - done;
        } else if (isCompleted) {
            displaySets = 0;
        }

        return { ...e, muscleGroup: muscle, isCompleted: isCompleted, adjustedSets: displaySets };
    });

    mappedData.sort((a, b) => (a.isCompleted === b.isCompleted) ? 0 : a.isCompleted ? 1 : -1);

    const list = document.getElementById("exList");
    if (!list) return;
    list.innerHTML = ""; 
    exercises = [];
    remainingSets = [];

    mappedData.forEach((e, idx) => {
        const d = document.createElement("div");
        d.className = "exercise"; 
        d.dataset.total = e.adjustedSets;
        d.dataset.done = 0;
        d.dataset.index = idx;
        d.setAttribute("draggable", "true");

        if (e.isCompleted || e.adjustedSets === 0) {
            d.style.setProperty('opacity', '0.2', 'important');
            d.style.setProperty('filter', 'grayscale(100%)', 'important');
            d.classList.add("exercise-skipped");
            d.style.pointerEvents = "none"; 
        }

        const cleanName = e.name.trim();
        const safeName = cleanName.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const savedWeight = localStorage.getItem(`weight_ANGELOS_${cleanName}`) || localStorage.getItem(`weight_${cleanName}`) || "";

        d.innerHTML = `
            <div class="exercise-info" onclick="window.toggleSkipExercise(${idx})">
                <div class="set-counter">0/${e.adjustedSets}</div>
                <div class="exercise-name">${e.isCompleted ? `${cleanName} 🎯` : (e.isSpillover ? `${cleanName} ☀️` : cleanName)}</div>
                <input type="number" class="weight-input" data-name="${safeName}" placeholder="kg" value="${savedWeight}" 
                       onclick="event.stopPropagation()" onchange="saveWeight('${safeName}', this.value)">
            </div>
            <div class="progress-box"><div class="progress-bar"></div></div>
        `;
        list.appendChild(d);
        exercises.push(d);
        remainingSets.push(parseInt(e.adjustedSets));
    });

    if (typeof calculateTotalTime === "function") setTimeout(() => { calculateTotalTime(); }, 50); 
    if (typeof showVideo === "function") showVideo(0);
    if (typeof initDragDrop === "function") initDragDrop();
}

function reorderExercises() {
    const list = document.getElementById("exList");
    const newOrder = Array.from(list.querySelectorAll(".exercise")).map(div => {
        const wInput = div.querySelector(".weight-input");
        return wInput ? wInput.getAttribute("data-name") : "Άγνωστο";
    });
    
    exercises = Array.from(list.querySelectorAll(".exercise"));
    
    const activeBtn = document.querySelector(".navbar button.active");
    if (activeBtn) localStorage.setItem(`pegasus_order_${activeBtn.textContent.trim()}`, JSON.stringify(newOrder));
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
    
    const wInput = e.querySelector(".weight-input");
    const exName = wInput ? wInput.getAttribute("data-name") : "Άγνωστο";

    exercises.forEach(ex => {
        ex.style.borderColor = "#222";
        ex.style.background = "transparent";
    });
    
    const isAngelosTurn = typeof partnerData !== 'undefined' ? (!partnerData.isActive || partnerData.isUser1Turn) : true;
    e.style.borderColor = isAngelosTurn ? "#4CAF50" : "#00bcd4";
    e.style.background = "rgba(76, 175, 80, 0.1)";

    let currentPhaseName = "";
    let t = 0;

    if (phase === 0) {
        currentPhaseName = `ΠΡΟΕΤΟΙΜΑΣΙΑ (ΑΓΓΕΛΟΣ)`;
        t = workoutPhases[0].d;
    } else if (phase === 1) {
        currentPhaseName = `ΑΣΚΗΣΗ (ΑΓΓΕΛΟΣ)`;
        t = workoutPhases[1].d;
    } else if (phase === 2) {
        const pName = typeof partnerData !== 'undefined' ? (partnerData.currentPartner || "ΣΥΝΕΡΓΑΤΗΣ").toUpperCase() : "ΣΥΝΕΡΓΑΤΗΣ";
        const isPartnerActive = typeof partnerData !== 'undefined' ? partnerData.isActive : false;
        currentPhaseName = isPartnerActive ? `ΑΣΚΗΣΗ (${pName})` : `ΔΙΑΛΕΙΜΜΑ (ΑΓΓΕΛΟΣ)`;
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

        const label = document.getElementById("phaseTimer");
        if (label) {
            label.textContent = `${currentPhaseName} (${Math.max(0, Math.ceil(t))})`;
            const isPartnerActive = typeof partnerData !== 'undefined' ? partnerData.isActive : false;
            label.style.color = (phase === 1) ? "#4CAF50" : (phase === 2 ? (isPartnerActive ? "#00bcd4" : "#FFC107") : "#64B5F6");
        }

        if (t <= 0) {
            clearInterval(timer);
            playBeep();
            
            if (phase === 0) {
                phase = 1;
                runPhase();
            } else if (phase === 1) {
                if (wInput) saveWeight(exName, wInput.value);

                const activeNode = document.querySelectorAll(".exercise")[currentIdx];
                if (activeNode) {
                    let done = parseInt(activeNode.dataset.done) || 0;
                    let total = parseInt(activeNode.dataset.total) || 0;
                    done++;
                    
                    activeNode.dataset.done = done;
                    remainingSets[currentIdx] = total - done;

                    const counterDiv = activeNode.querySelector(".set-counter");
                    if (counterDiv) {
                        counterDiv.textContent = `${done}/${total}`;
                        counterDiv.style.color = "#4CAF50";
                        activeNode.style.boxShadow = "0 0 15px rgba(76, 175, 80, 0.4)";
                        setTimeout(() => { activeNode.style.boxShadow = ""; }, 1500);
                    }
                    if (window.updateAchievements) window.updateAchievements(exName);
                    
                    if (window.logPegasusSet) window.logPegasusSet(exName);
                    
                    if (typeof PegasusCloud !== 'undefined' && typeof PegasusCloud.push === "function") {
                        PegasusCloud.push(true); 
                    }
                }

                phase = 2;
                if (typeof partnerData !== 'undefined' && partnerData.isActive) partnerData.isUser1Turn = false;
                runPhase();
            } else if (phase === 2) {
                if (typeof partnerData !== 'undefined' && partnerData.isActive && wInput) savePartnerWeight(exName, wInput.value);
                if (typeof partnerData !== 'undefined' && partnerData.isActive) partnerData.isUser1Turn = true; 
                
                let nextIdx = getNextIndexCircuit();
                if (nextIdx !== -1) {
                    currentIdx = nextIdx;
                    phase = 0;
                    runPhase();
                } else finishWorkout();
            }
        }
    }, 1000 / SPEED);
}

/* ===== UTILS ===== */
function saveWeight(exerciseName, weightValue) {
    const cleanName = exerciseName.trim();
    if (typeof partnerData !== 'undefined' && partnerData.isActive) {
        savePartnerWeight(cleanName, weightValue);
    } else {
        localStorage.setItem(`weight_${cleanName}`, weightValue);
        localStorage.setItem(`weight_ANGELOS_${cleanName}`, weightValue);
    }
    if (window.PegasusCloud) window.PegasusCloud.push(true);
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
        const wInput = currentExNode.querySelector(".weight-input");
        const exName = wInput ? wInput.getAttribute("data-name") : "Άγνωστο";
        
        currentExNode.dataset.done++;
        remainingSets[currentIdx]--;
        currentExNode.querySelector(".set-counter").textContent = `${currentExNode.dataset.done}/${currentExNode.dataset.total}`;

        if (window.logPegasusSet) window.logPegasusSet(exName);

        if (typeof PegasusCloud !== 'undefined' && typeof PegasusCloud.push === "function") {
            PegasusCloud.push(true);
        }
    }

    let nextIdx = getNextIndexCircuit();
    if (nextIdx !== -1) {
        currentIdx = nextIdx;
        phase = 0; 

        if (typeof partnerData !== 'undefined' && partnerData.isActive) {
            partnerData.isUser1Turn = true; 
            const nextEx = exercises[currentIdx];
            const nextWInput = nextEx.querySelector(".weight-input");
            const nextExName = nextWInput ? nextWInput.getAttribute("data-name") : "Άγνωστο";
            if (nextWInput) nextWInput.value = loadPartnerWeight(nextExName);
        }

        if (running) runPhase(); 
        else showVideo(currentIdx);
    } else finishWorkout(); 
}

/* ===== PEGASUS DUAL VIDEO ENGINE (LOCAL & YOUTUBE) ===== */
function showVideo(i) {
    if (!exercises || !exercises[i]) return;
    
    const ex = exercises[i];
    const wInput = ex.querySelector(".weight-input");
    let name = (wInput ? wInput.getAttribute("data-name") : "default").trim();
    
    const vid = document.getElementById("video");
    if (!vid) return;

    let ytFrame = document.getElementById("yt-video");
    if (!ytFrame) {
        ytFrame = document.createElement("iframe");
        ytFrame.id = "yt-video";
        ytFrame.style.width = "100%";
        ytFrame.style.height = "100%";
        ytFrame.style.border = "none";
        ytFrame.style.borderRadius = vid.style.borderRadius || "8px";
        ytFrame.style.display = "none";
        ytFrame.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
        vid.parentNode.insertBefore(ytFrame, vid.nextSibling);
    }
    
    if (typeof videoMap !== 'undefined') {
        let mappedVal = videoMap[name] || name.replace(/\s+/g, '');
        if (name.toLowerCase().includes("ems") && !videoMap[name]) {
            mappedVal = "ems";
        }

        if (mappedVal.startsWith("yt:")) {
            const ytId = mappedVal.split("yt:")[1];
            vid.style.display = "none";
            vid.pause();
            ytFrame.style.display = "block";
            ytFrame.src = `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0`;
        } else {
            ytFrame.style.display = "none";
            ytFrame.src = "";
            vid.style.display = "block";
            vid.src = `videos/${mappedVal}.mp4`;
            vid.style.opacity = "1";
            vid.play().catch(err => {
                console.warn(`PEGASUS: Video ${mappedVal}.mp4 not found in /videos/`);
            });
        }
    }
}

window.calculateTotalTime = function() {
    workoutPhases[1].d = parseInt(localStorage.getItem("pegasus_ex_time")) || 45;
    workoutPhases[2].d = parseInt(localStorage.getItem("pegasus_rest_time")) || 60;
    totalSeconds = 0;
    
    exercises.forEach((exDiv) => {
        if (exDiv.classList.contains("exercise-skipped")) return;
        
        const nameNode = exDiv.querySelector(".exercise-name");
        const name = nameNode ? nameNode.textContent : "";
        if (name.includes("Ποδηλασία") || name.toUpperCase().includes("EMS")) return;

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
    const exDiv = document.querySelectorAll('.exercise')[idx];
    if (!exDiv) return;
    
    const counter = exDiv.querySelector(".set-counter");
    const originalSets = parseInt(exDiv.dataset.total) || 3;
    const isSkipped = exDiv.classList.toggle("exercise-skipped");

    if (isSkipped) {
        exDiv.style.setProperty('opacity', '0.2', 'important');
        exDiv.style.setProperty('filter', 'grayscale(100%)', 'important');
        remainingSets[idx] = 0; 
        if (counter) counter.innerText = `0/0`;
    } else {
        exDiv.style.setProperty('opacity', '1', 'important');
        exDiv.style.setProperty('filter', 'none', 'important');
        remainingSets[idx] = originalSets; 
        if (counter) counter.innerText = `0/${originalSets}`;
    }
    
    if (typeof exercises !== 'undefined') exercises[idx] = exDiv;
    if (typeof calculateTotalTime === "function") calculateTotalTime();
};

/* ===== FINISH LOGIC ===== */
function finishWorkout() {
    if (!running && !timer) return; 
    
    clearInterval(timer);
    running = false;

    const label = document.getElementById("phaseTimer");
    if (label) {
        label.textContent = "ΟΛΟΚΛΗΡΩΣΗ...";
        label.style.color = "#4CAF50";
    }

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

    let data = JSON.parse(localStorage.getItem("pegasus_workouts_done") || "{}");
    data[workoutKey] = true;
    localStorage.setItem("pegasus_workouts_done", JSON.stringify(data));

    if (window.updateTotalWorkoutCount) window.updateTotalWorkoutCount();
    if (window.renderCalendar) window.renderCalendar();

    if (window.PegasusCloud && typeof window.PegasusCloud.push === "function") window.PegasusCloud.push();

    setTimeout(() => {
        if (window.PegasusReporting) {
            const currentKcal = localStorage.getItem("pegasus_today_kcal") || "0";
            window.PegasusReporting.prepareAndSaveReport(currentKcal);
            localStorage.setItem("pegasus_today_kcal", "0.0");
        }
        location.reload(); 
    }, 5000);
}

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
                if (document.getElementById("phaseTimer")) document.getElementById("phaseTimer").textContent = "Προθέρμανση...";
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
            } else alert("Σφάλμα: Το reporting.js δεν έχει φορτωθεί.");
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

/* ===== UI & PREVIEW LOGIC ===== */
function openExercisePreview() {
    const activeBtn = document.querySelector(".navbar button.active");
    if (!activeBtn) return alert("Παρακαλώ επίλεξε πρώτα μια ημέρα!");

    const currentDay = activeBtn.textContent.trim().replace(" ☀️", "");
    const dayExercises = typeof window.program !== 'undefined' ? window.program[currentDay] : [];
    const panel = document.getElementById('previewPanel');
    const content = document.getElementById('previewContent');
    
    if (!panel || !content) return;

    document.getElementById('previewTitle').innerText = `ΠΡΟΕΠΙΣΚΟΠΗΣΗ: ${currentDay.toUpperCase()}`;
    panel.style.display = 'block';
    content.innerHTML = ''; 

    if (window.MuscleProgressUI && typeof window.MuscleProgressUI.render === "function") {
        window.MuscleProgressUI.render();
    }

    const smartMapping = { 
        "pulldown": "pulldownimage.png", 
        "triceps overhead extension": "tricepsoverheadimage.png", 
        "ems": "emsImage.png",
        "ποδηλασία": "bikeImage.jpg", 
        "cycling": "bikeImage.jpg"
    };

    if(dayExercises) {
        dayExercises.forEach(ex => {
            const cleanName = ex.name.trim();
            const lowerName = cleanName.toLowerCase();
            
            const key = Object.keys(smartMapping).find(k => lowerName.includes(k));
            
            let imgFileName;
            if (key) {
                imgFileName = smartMapping[key];
            } else {
                imgFileName = (typeof videoMap !== 'undefined' && videoMap[cleanName] && !videoMap[cleanName].startsWith("yt:")) 
                              ? (videoMap[cleanName] + "Image.png") 
                              : (cleanName.replace(/\s+/g, '') + "Image.png");
            }

            let finalSrc = imgFileName.includes('.') ? imgFileName : imgFileName + '.png';

            content.innerHTML += `
                <div class="preview-item" style="margin: 10px; text-align: center; width: 160px; display: inline-block; vertical-align: top;">
                    <img src="images/${finalSrc}" 
                         onerror="this.src='images/placeholder.jpg'"
                         style="width: 150px; height: 100px; border: 2px solid #4CAF50; border-radius: 8px; object-fit: cover; background: #222;">
                    <p style="color: #4CAF50; font-weight: bold; font-size: 11px; margin-top: 5px; text-transform: uppercase;">${cleanName}</p>
                </div>
            `;
        });
    }
}

window.addEventListener('mousedown', (e) => {
    const panels = ['foodPanel', 'calendarPanel', 'achievementsPanel', 'settingsPanel', 'previewPanel', 'toolsPanel', 'galleryPanel', 'cardioPanel'];
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
    let history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || { "Στήθος": 0, "Πλάτη": 0, "Ώμοι": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 };
    if (!window.exercisesDB) return;
    const exercise = window.exercisesDB.find(ex => ex.name.trim() === exName.trim());
    if (exercise && exercise.muscleGroup) {
        // PEGASUS PATCH: 18-Set Cycling Credit
        const value = (exercise.name.includes("Ποδηλασία")) ? 18 : 1;
        history[exercise.muscleGroup] = (history[exercise.muscleGroup] || 0) + value;
        localStorage.setItem('pegasus_weekly_history', JSON.stringify(history));
        if (window.MuscleProgressUI) window.MuscleProgressUI.render();
        if (window.PegasusCloud) window.PegasusCloud.push(true);
    }
};

window.updateTotalWorkoutCount = function() {
    const data = JSON.parse(localStorage.getItem("pegasus_workouts_done") || "{}");
    const display = document.getElementById("totalWorkoutsDisplay");
    if (display) display.textContent = `Προπονήσεις: ${Object.keys(data).length}`;
};

window.updateTotalWorkoutCount();
