/* ==========================================================================
   PEGASUS ISSUE LOGGER - v1.0 (DIAGNOSTIC MODE)
   ========================================================================== */
window.pegasusLogs = JSON.parse(localStorage.getItem("pegasus_system_logs") || "[]");

// Υποκλοπή Console Errors & Warnings
const originalError = console.error;
const originalWarn = console.warn;

console.error = function(...args) {
    window.pegasusLogs.push({ type: "ERROR", time: new Date().toLocaleTimeString(), msg: args.join(" ") });
    localStorage.setItem("pegasus_system_logs", JSON.stringify(window.pegasusLogs.slice(-50))); // Κρατάμε τα τελευταία 50
    originalError.apply(console, args);
};

console.warn = function(...args) {
    window.pegasusLogs.push({ type: "WARNING", time: new Date().toLocaleTimeString(), msg: args.join(" ") });
    localStorage.setItem("pegasus_system_logs", JSON.stringify(window.pegasusLogs.slice(-50)));
    originalWarn.apply(console, args);
};

// Global Catch για σφάλματα που "σκάνε" ξαφνικά
window.onerror = function(msg, url, line) {
    console.error(`Runtime Error: ${msg} at ${url}:${line}`);
};

/* ==========================================================================
   PEGASUS WORKOUT ENGINE - FINAL AUDITED EDITION (V6.8 - DRAGGABLE UI)
   Protocol: Native Metabolic Engine, Audio Unlocked, LIVE CLOUD SYNC
   + PEGASUS PATCH: Persistent Movable Panels, Zero-Time Protocol
   ========================================================================== */

var exercises = [];
var remainingSets = [];
var currentIdx = 0;
var phase = 0; 
var running = false;
var timer = null;
var totalSeconds = 0;
var remainingSeconds = 0;
var muted = false;
var TURBO_MODE = false;
var SPEED = 1;

/* === DYNAMIC PARAMETERS === */
var workoutPhases = [
    { n: "Προετοιμασία", d: 10 }, 
    { n: "Άσκηση", d: parseInt(localStorage.getItem("pegasus_ex_time")) || 45 },     
    { n: "Διάλειμμα", d: parseInt(localStorage.getItem("pegasus_rest_time")) || 60 }     
];

var userWeight = parseFloat(localStorage.getItem("pegasus_weight")) || 74;

/* ===== AUDIO (SYSTEM UNLOCK LOGIC) ===== */
let sysAudio = new Audio('videos/beep.mp3');
let audioUnlocked = false;

/* ===== AUDIO & MOBILE SYNC INITIALIZATION ===== */
document.addEventListener('click', function() {
    if (!audioUnlocked) {
        sysAudio.play().then(() => {
            sysAudio.pause();
            sysAudio.currentTime = 0;
            audioUnlocked = true;
            console.log("PEGASUS OS: Audio Unlocked");

            if (window.PegasusCloud && typeof window.PegasusCloud.pull === "function") {
                console.log("PEGASUS MOBILE: User Interaction Detected. Initializing Cloud Sync...");
                window.PegasusCloud.pull();
            }

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

/* ===== SELECTDAY (v21.1 - CARDIO CREDIT INTEGRATED) ===== */
/* ===== SELECTDAY (v21.3 - GHOST & DEDUCTION FILTER) ===== */
function selectDay(btn, day) {
    document.querySelectorAll(".navbar button").forEach(b => {
        b.classList.remove("active");
        b.style.setProperty('background-color', '#000', 'important');
        b.style.color = "#fff";
    });
    
    if (btn) {
        btn.classList.add("active");
        btn.style.setProperty('background-color', '#4CAF50', 'important');
    }

    clearInterval(timer); timer = null; running = false; phase = 0; currentIdx = 0;
    const sBtn = document.getElementById("btnStart");
    if (sBtn) sBtn.innerHTML = "Έναρξη";

    const isRainy = (typeof window.isRaining === 'function') ? window.isRaining() : false;

    let rawBaseData = (typeof window.calculateDailyProgram !== 'undefined') ? 
                      window.calculateDailyProgram(day, isRainy) : 
                      ((window.program[day]) ? [...window.program[day]] : []);

    let mappedData = [];
    if (window.PegasusOptimizer) {
        mappedData = window.PegasusOptimizer.apply(day, rawBaseData);
    } else {
        mappedData = rawBaseData.map(e => ({ ...e, adjustedSets: e.sets, isCompleted: false }));
    }

    // === PEGASUS CARDIO CREDIT ===
    let cardioCredit = parseFloat(localStorage.getItem("pegasus_cardio_offset_sets")) || 0;

    mappedData.sort((a, b) => (a.adjustedSets === 0) ? 1 : (b.adjustedSets === 0) ? -1 : 0);

    const list = document.getElementById("exList");
    if (!list) return;
    list.innerHTML = ""; exercises = []; remainingSets = [];

    mappedData.forEach((e, idx) => {
        // [HARD FILTER] Αποκλεισμός φαντασμάτων και αερόβιας από τη λίστα
        if (!e.name || e.name === "αα" || e.name.includes("undefined") || e.name.includes("Ποδηλασία") || e.adjustedSets < 1) {
            return; 
        }

        let finalSets = parseFloat(e.adjustedSets);
        
        // Deduction Logic
        if (e.muscleGroup === "Πόδια" && cardioCredit > 0 && finalSets > 0) {
            let deduction = Math.min(finalSets, cardioCredit);
            finalSets = parseFloat((finalSets - deduction).toFixed(1));
            cardioCredit = parseFloat((cardioCredit - deduction).toFixed(1));
        }

        const d = document.createElement("div");
        d.className = "exercise"; 
        d.dataset.total = finalSets; d.dataset.done = 0; d.dataset.index = idx;

        if (finalSets <= 0) {
            d.classList.add("exercise-skipped");
            d.style.opacity = "0.2"; d.style.filter = "grayscale(100%)"; d.style.pointerEvents = "none";
        }

        const cleanName = e.name.trim();
        const safeName = cleanName.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const savedWeight = localStorage.getItem(`weight_ANGELOS_${cleanName}`) || "";

        d.innerHTML = `
            <div class="exercise-info" onclick="window.toggleSkipExercise(${idx})">
                <div class="set-counter">0/${finalSets}</div>
                <div class="exercise-name">${e.isCompleted ? `${cleanName} 🎯` : cleanName}</div>
                <input type="number" class="weight-input" data-name="${safeName}" placeholder="kg" value="${savedWeight}" 
                       onclick="event.stopPropagation()" onchange="saveWeight('${cleanName}', this.value)">
            </div>
            <div class="progress-box"><div class="progress-bar"></div></div>
        `;
        list.appendChild(d);
        exercises.push(d);
        remainingSets.push(finalSets);
    });

    if (typeof calculateTotalTime === "function") calculateTotalTime();
    if (typeof showVideo === "function") showVideo(0);
}

/* ===== CORE ENGINE ===== */
function startPause() {
    if (exercises.length === 0) return;

    const vid = document.getElementById("video");

    // 1. CLEANUP: Αν παίζει η χειροκίνητη προθέρμανση, την τερματίζουμε αμέσως
    if (vid && vid.src.includes("warmup")) {
        vid.loop = false;
        vid.pause();
    }

    // 2. SKIP SKIPPED EXERCISES
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

    // 3. DIRECT START PROTOCOL (The Fix)
    // Αν ξεκινάμε την προπόνηση, πηγαίνουμε κατευθείαν στην ΑΣΚΗΣΗ (Phase 1)
    if (!running && (phase === 0)) {
        phase = 1; 
        console.log("PEGASUS: Bypassing Phase 0. Direct Start at Phase 1 (Exercise).");
    }

    // 4. TOGGLE EXECUTION
    running = !running;
    const sBtn = document.getElementById("btnStart");
    if (sBtn) sBtn.innerHTML = running ? "Παύση" : "Συνέχεια";
    
    if (running) {
        runPhase();
    } else { 
        clearInterval(timer); 
        timer = null; 
    }
}

function runPhase() {
    if (!running) return;
    
    if (timer) {
        clearInterval(timer);
        timer = null;
    }

    if (remainingSets.every(s => s <= 0)) {
        finishWorkout();
        return;
    }

    const exTime = parseInt(localStorage.getItem("pegasus_ex_time")) || 45;
    const restTime = parseInt(localStorage.getItem("pegasus_rest_time")) || 60;
    const prepTime = 10;

    const e = exercises[currentIdx];
    if (!e) return;
    
    const wInput = e.querySelector(".weight-input");
    const exName = wInput ? wInput.getAttribute("data-name") : "Άγνωστο";

    // UI Feedback - Διατήρηση 100%
    exercises.forEach(ex => { 
        ex.style.borderColor = "#222"; 
        ex.style.background = "transparent"; 
    });
    e.style.borderColor = "#4CAF50";
    e.style.background = "rgba(76, 175, 80, 0.1)";

    // 1. ΠΡΩΤΟΚΟΛΛΟ UI SYNC (ΚΡΙΣΙΜΟ ΓΙΑ ΤΟ VIDEO)
    let t = (phase === 0) ? prepTime : (phase === 1 ? exTime : restTime);
    let currentPhaseName = (phase === 0) ? "ΠΡΟΘΕΡΜΑΝΣΗ" : (phase === 1 ? "ΑΣΚΗΣΗ" : "ΔΙΑΛΕΙΜΜΑ");

    const label = document.getElementById("phaseTimer");
    if (label) {
        label.textContent = `${currentPhaseName} (${Math.max(0, Math.ceil(t))})`;
        label.style.color = (phase === 1) ? "#4CAF50" : (phase === 2 ? "#FFC107" : "#64B5F6");
    }

    // 2. ΚΛΗΣΗ VIDEO
    if (phase !== 2) {
        showVideo(currentIdx);
    }

    timer = setInterval(() => {
        t -= 1;
        
        if (remainingSeconds > 0) {
            remainingSeconds -= 1;
            updateTotalBar();
        }

        if (window.MetabolicEngine && phase === 1) {
            window.MetabolicEngine.updateTracking(1, exName);
        }

        if (label) {
            label.textContent = `${currentPhaseName} (${Math.max(0, Math.ceil(t))})`;
        }

        if (t <= 0) {
            clearInterval(timer);
            timer = null;
            playBeep();
            
            if (phase === 0) {
                phase = 1;
                runPhase();
            } else if (phase === 1) {
                let done = parseInt(e.dataset.done) || 0;
                let total = parseInt(e.dataset.total) || 0;
                done++;
                e.dataset.done = done;
                remainingSets[currentIdx] = total - done;

                const counterDiv = e.querySelector(".set-counter");
                if (counterDiv) counterDiv.textContent = `${done}/${total}`;
                
                // === [NEW] PEGASUS ACHIEVEMENT BRIDGE ===
                if (window.updateAchievements) {
                    console.log(`[BRIDGE] Logging set for: ${exName}`);
                    window.updateAchievements(exName);
                }
                // =========================================
                
                if (window.logPegasusSet) window.logPegasusSet(exName);
                
                phase = 2;
                runPhase();
            } else if (phase === 2) {
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

/* ===== PEGASUS DUAL VIDEO ENGINE - WARMUP FIXED v2.6 ===== */
function showVideo(i) {
    const vid = document.getElementById("video");
    if (!vid) return;

    // [VISIBILITY PROTOCOL] - Εξασφαλίζουμε ότι το βίντεο είναι ορατό
    vid.style.display = "block";
    vid.style.opacity = "1";

    // 1. Καθαρισμός YouTube Iframe (Cleanup Protocol)
    const ytFrame = document.getElementById("yt-video");
    if (ytFrame) ytFrame.remove();

    let name = "";
    const label = document.getElementById("phaseTimer");
    const phaseLabel = label ? label.textContent : "";
    
    // 2. [STRICT PRIORITY LOGIC]
    if (phaseLabel.includes("Manual") || i === null || i === undefined || i === -1) {
        name = "Προθέρμανση"; 
    } 
    else {
        if (!exercises || !exercises[i]) return;
        const ex = exercises[i];
        const wInput = ex.querySelector(".weight-input");
        name = (wInput ? wInput.getAttribute("data-name") : "default").trim();
    }

    // 3. Mapping & Forced Execution
    if (typeof videoMap !== 'undefined') {
        let mappedVal = videoMap[name] || name.replace(/\s+/g, '').toLowerCase();
        
        if (name.toLowerCase().includes("ems") && !videoMap[name]) {
            mappedVal = "ems";
        }

        const newSrc = `videos/${mappedVal}.mp4`;
        
        // [ANTI-STICKY PROTOCOL]
        if (vid.getAttribute('src') !== newSrc) {
            vid.pause();
            vid.src = newSrc;
            vid.load(); 
            vid.play().catch(err => {
                console.warn(`PEGASUS: Asset ${mappedVal}.mp4 missing. Falling back to warmup.`);
                vid.src = "videos/warmup.mp4";
                vid.load();
                vid.play();
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

    let done = parseInt(exDiv.dataset.done) || 0;
    if (isSkipped) {
        exDiv.style.setProperty('opacity', '0.2', 'important');
        exDiv.style.setProperty('filter', 'grayscale(100%)', 'important');
        remainingSets[idx] = 0; 
        if (counter) counter.innerText = `${done}/${done}`;
    } else {
        exDiv.style.setProperty('opacity', '1', 'important');
        exDiv.style.setProperty('filter', 'none', 'important');
        remainingSets[idx] = originalSets - done; 
        if (counter) counter.innerText = `${done}/${originalSets}`;
    }
    
    if (typeof exercises !== 'undefined') exercises[idx] = exDiv;
    if (typeof calculateTotalTime === "function") calculateTotalTime();
};

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
        // [SYNC PATCH] Καθαρισμός από emojis καιρού για σωστό index matching
        const dayName = activeBtn.textContent.trim().split(' ')[0]; 
        const greekDays = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
        const currentDayIdx = now.getDay();
        const targetDayIdx = greekDays.indexOf(dayName);
        
        if (targetDayIdx !== -1) {
            let diff = targetDayIdx - currentDayIdx;
            const targetDate = new Date();
            targetDate.setDate(now.getDate() + diff);
            workoutKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
        }
    } 
    
    if (!workoutKey) {
        workoutKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    let data = JSON.parse(localStorage.getItem("pegasus_workouts_done") || "{}");
    data[workoutKey] = true;
    localStorage.setItem("pegasus_workouts_done", JSON.stringify(data));

    // [METABOLIC RESET] Καθαρισμός των Cardio Offsets μετά την ολοκλήρωση
    localStorage.setItem("pegasus_cardio_offset", "0");
    localStorage.setItem("pegasus_cardio_offset_sets", "0");

    if (window.updateTotalWorkoutCount) window.updateTotalWorkoutCount();
    if (window.renderCalendar) window.renderCalendar();
    if (window.PegasusCloud && typeof window.PegasusCloud.push === "function") window.PegasusCloud.push(true);

    setTimeout(() => {
        if (window.PegasusReporting) {
            const currentKcal = localStorage.getItem("pegasus_today_kcal") || "0";
            window.PegasusReporting.prepareAndSaveReport(currentKcal);
            // Μηδενισμός θερμίδων για το επόμενο report
            localStorage.setItem("pegasus_today_kcal", "0.0");
        }
        location.reload(); 
    }, 5000);
}


window.onload = () => {
    // 1. Email & Reporting Initialization
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

    // 2. MASTER UI MAPPING (The Brain of the Interface)
    const masterUI = { 
        "btnStart": startPause,
        "btnNext": skipToNextExercise,
"btnWarmup": () => { 
            const vid = document.getElementById("video");
            const label = document.getElementById("phaseTimer");
            
            if (vid && vid.src.includes("warmup") && vid.style.display !== "none") {
                // Toggle OFF: Κλείνουμε μόνο τον ήχο/κίνηση, αλλά κρατάμε το display BLOCK
                vid.pause();
                vid.loop = false;
                
                if (exercises.length > 0) {
                    const firstEx = exercises[currentIdx];
                    const wInput = firstEx ? firstEx.querySelector(".weight-input") : null;
                    const exName = wInput ? wInput.getAttribute("data-name") : "PEGASUS READY";
                    if (label) label.textContent = exName;
                    
                    // ΕΠΑΝΑΦΟΡΑ: Δείχνουμε το βίντεο της άσκησης αμέσως
                    vid.style.display = "block"; 
                    showVideo(currentIdx); 
                }
                console.log("PEGASUS: Warmup OFF -> Video Container Ready");
            } else {
                // Toggle ON
                vid.style.display = "block";
                vid.src = "videos/warmup.mp4";
                vid.loop = true; 
                vid.play();
                if (label) {
                    label.textContent = "ΠΡΟΘΕΡΜΑΝΣΗ (Manual Mode)";
                    label.style.color = "#64B5F6";
                }
            }
        },
        "btnCalendarUI": { panel: "calendarPanel", init: window.renderCalendar },
        "btnAchUI": { panel: "achievementsPanel", init: window.renderAchievements },
        "btnSettingsUI": { panel: "settingsPanel", init: window.initSettingsUI },
        "btnFoodUI": { panel: "foodPanel", init: window.updateFoodUI },
        "btnToolsUI": { panel: "toolsPanel" },
        "btnPreviewUI": { panel: "previewPanel", init: openExercisePreview },
        "btnEMS": () => { if(window.logEMSData) window.logEMSData(); },
        "btnSaveEMS": () => { if(window.saveEMSFinal) window.saveEMSFinal(); },
        "btnCloseEMS": () => { if(window.closeEMSModal) window.closeEMSModal(); },
        "btnClosePreview": () => { document.getElementById('previewPanel').style.display='none'; },
        "btnManualEmail": () => { if(window.PegasusReporting) window.PegasusReporting.checkAndSendMorningReport(true); },
        "btnExportData": () => { if(window.exportPegasusData) window.exportPegasusData(); },
        "btnImportData": () => { document.getElementById('importFileTools').click(); },
        "btnMasterVault": () => { document.getElementById('pinModal').style.display='flex'; },
        "btnSaveSettings": () => { 
            if (window.savePegasusSettingsGlobal) {
                window.savePegasusSettingsGlobal();
            } else {
                localStorage.setItem("pegasus_weight", document.getElementById("userWeightInput").value);
                location.reload();
            }
        }
    };

    // 3. EVENT DELEGATION ENGINE
    Object.keys(masterUI).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.onclick = (e) => {
                e.stopPropagation();
                
                const target = masterUI[btnId];
                
                // Πρωτόκολλο Καθαρισμού: Κλείνει τα Panels εκτός αν είναι κουμπιά εσωτερικής ενέργειας
                const isActionBtn = btnId.includes("Save") || btnId.includes("Close") || btnId.includes("btnStart") || btnId.includes("btnNext") || btnId === "btnWarmup";
                if (!isActionBtn) {
                    document.querySelectorAll('.pegasus-panel, #emsModal, #cardioPanel').forEach(p => p.style.display = "none");
                }

                if (typeof target === 'function') {
                    target();
                } else if (target.panel) {
                    const el = document.getElementById(target.panel);
                    if (el) {
                        el.style.display = "block";
                        if (target.init) target.init();
                    }
                }
            };
        }
    });

    // 4. Global Event Listeners & Utils
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

    const rainToggle = document.getElementById("rainToggle");
    if (rainToggle) {
        rainToggle.onchange = () => {
            const activeBtn = document.querySelector('.navbar button.active');
            if (activeBtn) selectDay(activeBtn, activeBtn.textContent);
        };
    }

    if (typeof fetchWeather === "function") fetchWeather();
    
    // 5. AUTO-SELECT TODAY & LABEL CLEANUP
    const greekDays = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
    const todayName = greekDays[new Date().getDay()];
    setTimeout(() => { 
        document.querySelectorAll(".navbar button").forEach(b => { 
            // Έλεγχος με trim και split για να πιάνει την ημέρα ακόμα και με emoji καιρού
            const btnText = b.textContent.trim().split(' ')[0];
            if (btnText === todayName) {
                selectDay(b, b.textContent);
                // [CLEANUP] Εξαφάνιση του "Επιλέξτε Ημέρα" κατά την αυτόματη φόρτωση
                const label = document.getElementById("phaseTimer");
                if (label) label.textContent = ""; 
            }
        }); 
    }, 300);
};
/* === PEGASUS PREVIEW ENGINE (OPTIMIZER INTEGRATED) === */
/* === PEGASUS PREVIEW ENGINE (FINAL SYNC v2.2) === */
function openExercisePreview() {
    const activeBtn = document.querySelector(".navbar button.active");
    if (!activeBtn) return alert("Παρακαλώ επίλεξε πρώτα μια ημέρα!");

    const currentDay = activeBtn.textContent.trim().replace(" ☀️", "");
    const isRainy = (typeof window.isRaining === 'function') ? window.isRaining() : false;

    let rawData = (typeof window.calculateDailyProgram !== 'undefined') ? 
                  window.calculateDailyProgram(currentDay, isRainy) : (window.program[currentDay] || []);
    
    // Εφαρμογή Optimizer στην προεπισκόπηση
    const dayExercises = window.PegasusOptimizer ? window.PegasusOptimizer.apply(currentDay, rawData) : rawData;

    const panel = document.getElementById('previewPanel');
    const content = document.getElementById('previewContent');
    if (!panel || !content) return;

    // 1. Εμφάνιση Πάνελ
    panel.style.display = 'block';

    // 2. ΚΑΘΑΡΙΣΜΟΣ ΠΕΡΙΕΧΟΜΕΝΟΥ
    // Καθαρίζουμε το UI πριν χτίσουμε το νέο περιεχόμενο
    content.innerHTML = ''; 

    // 3. FORCE RENDER MUSCLE BARS
    // Καλούμε το render χειροκίνητα ΕΔΩ για να μπουν στην κορυφή του 'content'
    if (window.MuscleProgressUI) {
        // Μηδενίζουμε το hash για να αναγκάσουμε το UI να κάνει render αμέσως
        window.MuscleProgressUI.lastDataHash = null; 
        window.MuscleProgressUI.render();
    }

    // 4. ΠΡΟΣΘΗΚΗ ΑΣΚΗΣΕΩΝ
    dayExercises.filter(ex => ex.adjustedSets > 0).forEach((ex) => {
        const cleanName = ex.name.trim();
        let videoId = (typeof videoMap !== 'undefined' && videoMap[cleanName]) ? videoMap[cleanName] : cleanName.replace(/\s+/g, '').toLowerCase();
        let ext = (videoId === "cycling") ? ".jpg" : ".png";

        content.innerHTML += `
            <div class="preview-item">
                <img src="images/${videoId}${ext}" onerror="this.src='images/placeholder.jpg'">
                <p>${cleanName} (${ex.adjustedSets} set)</p>
            </div>
        `;
    });
}

/* === DATA & TRACKING LOGIC === */
window.logPegasusSet = function(exName) {
    let history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || { 
        "Στήθος": 0, "Πλάτη": 0, "Ώμοι": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 
    };

    // 1. ΑΝΑΓΝΩΡΙΣΗ ΜΥΪΚΗΣ ΟΜΑΔΑΣ (Database check)
    let exercise = null;
    if (window.exercisesDB) {
        exercise = window.exercisesDB.find(ex => ex.name.trim() === exName.trim());
    }

    let targetMuscle = exercise ? exercise.muscleGroup : null;
    let value = 1; // Default: 1 σετ

    // 2. FORCE CREDIT PROTOCOL (Override για Ποδηλασία & EMS Ποδιών)
    const cleanName = exName.trim().toUpperCase();
    
    if (cleanName.includes("ΠΟΔΗΛΑΣΙΑ") || cleanName.includes("CYCLING")) {
        targetMuscle = "Πόδια";
        value = 18; // Πλήρης πίστωση προπόνησης
    } else if (cleanName.includes("EMS ΠΟΔΙΩΝ")) {
        targetMuscle = "Πόδια";
        value = 6;  // Πίστωση EMS sets (βάσει πρωτοκόλλου EMS)
    }

    // 3. ΕΝΗΜΕΡΩΣΗ ΜΝΗΜΗΣ
    if (targetMuscle && history.hasOwnProperty(targetMuscle)) {
        history[targetMuscle] = (history[targetMuscle] || 0) + value;
        localStorage.setItem('pegasus_weekly_history', JSON.stringify(history));
        
        console.log(`[PEGASUS AUDIT]: Credited ${value} to ${targetMuscle} from ${exName}`);

        // 4. UI SYNC & CLOUD PUSH
        if (window.MuscleProgressUI) window.MuscleProgressUI.render();
        if (window.PegasusCloud) window.PegasusCloud.push(true);
    } else {
        console.warn(`[PEGASUS]: Exercise ${exName} could not be mapped to a muscle group.`);
    }
};

window.updateTotalWorkoutCount = function() {
    const data = JSON.parse(localStorage.getItem("pegasus_workouts_done") || "{}");
    const display = document.getElementById("totalWorkoutsDisplay");
    if (display) display.textContent = `Προπονήσεις: ${Object.keys(data).length}`;
};

window.updateTotalWorkoutCount();
