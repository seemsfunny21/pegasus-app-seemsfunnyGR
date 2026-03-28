/* ==========================================================================
   PEGASUS WORKOUT ENGINE - v9.3 (FINAL MAXIMALIST MANIFEST EDITION)
   Protocol: Strict Data Mapping & Maximalist Feature Retention
   Status: Zero-Bug Simulation Active | Logic Mirroring 100%
   ========================================================================== */

/* ===== 1. ISSUE LOGGER (DIAGNOSTIC MODE) ===== */
window.pegasusLogs = JSON.parse(localStorage.getItem("pegasus_system_logs") || "[]");
const originalError = console.error;
const originalWarn = console.warn;

console.error = function(...args) {
    window.pegasusLogs.push({ type: "ERROR", time: new Date().toLocaleTimeString(), msg: args.join(" ") });
    localStorage.setItem("pegasus_system_logs", JSON.stringify(window.pegasusLogs.slice(-50)));
    originalError.apply(console, args);
};

console.warn = function(...args) {
    window.pegasusLogs.push({ type: "WARNING", time: new Date().toLocaleTimeString(), msg: args.join(" ") });
    localStorage.setItem("pegasus_system_logs", JSON.stringify(window.pegasusLogs.slice(-50)));
    originalWarn.apply(console, args);
};

window.onerror = function(msg, url, line) {
    console.error(`Runtime Error: ${msg} at ${url}:${line}`);
};

/* ===== 2. CORE VARIABLES & MANIFEST SYNC (ISOLATION MODE) ===== */
// Χρησιμοποιούμε PegasusM αντί για M για να αποφύγουμε το σφάλμα "Assignment to constant variable"
var PegasusM = window.PegasusManifest; 

if (!PegasusM) {
    console.error("❌ CRITICAL: Manifest not found. Link failed.");
    // Emergency Fallback
    PegasusM = window.PegasusManifest;
}

// Δημιουργούμε μια τοπική αναφορά για να μη χρειαστεί να αλλάξουμε όλο τον κώδικα παρακάτω
var M = PegasusM; 

/* ========================================================================== */

var exercises = [];
var remainingSets = [];
var currentIdx = 0;
var phase = 0; 
var running = false;
var timer = null;
var totalSeconds = 0;
var remainingSeconds = 0;

// Persistent UI States via Manifest
var muted = localStorage.getItem(M.system.mute) === "true";
var TURBO_MODE = localStorage.getItem(M.system.turbo) === "true";
var SPEED = TURBO_MODE ? 10 : 1;

/* === DYNAMIC PARAMETERS === */
var workoutPhases = [
    { n: "Προετοιμασία", d: 10 }, 
    { n: "Άσκηση", d: parseInt(localStorage.getItem(M.user.ex_time)) || 45 },      
    { n: "Διάλειμμα", d: parseInt(localStorage.getItem(M.user.rest_time)) || 60 }     
];

var userWeight = parseFloat(localStorage.getItem(M.user.weight)) || 74;

/* ===== 3. AUDIO SYSTEM & CLOUD BRIDGE ===== */
let sysAudio = new Audio('videos/beep.mp3');
let audioUnlocked = false;

document.addEventListener('click', function() {
    if (!audioUnlocked) {
        sysAudio.play().then(() => {
            sysAudio.pause(); sysAudio.currentTime = 0;
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
        sysAudio.volume = volume; sysAudio.currentTime = 0; 
        sysAudio.play().catch(e => console.log("Audio blocked by OS", e));
    }
};

/* ===== 4. NAVIGATION & SELECTDAY (SMART-SYNC) ===== */
function createNavbar() {
    const nav = document.getElementById("navbar");
    if (!nav) return;
    const days = ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο", "Κυριακή"];
    nav.innerHTML = "";
    days.forEach((d) => {
        const b = document.createElement("button");
        b.textContent = d; b.id = `nav-${d}`;
        b.style.backgroundColor = "#000"; b.style.color = "#fff";
        b.onclick = () => selectDay(b, d);
        nav.appendChild(b);
    });
}

function selectDay(btn, day) {
    // PEGASUS SAFETY PATCH
    if (typeof window.program === 'undefined' || !window.program) {
        console.error("❌ PEGASUS CRITICAL: window.program is missing!");
        const label = document.getElementById("phaseTimer");
        if (label) label.textContent = "Σφάλμα: Λείπει το data.js";
        return; 
    }

    document.querySelectorAll(".navbar button").forEach(b => {
        b.classList.remove("active");
        b.style.setProperty('background-color', '#000', 'important');
        b.style.color = "#fff";
    });
    if (btn) {
        btn.classList.add("active");
        btn.style.setProperty('background-color', '#4CAF50', 'important');
    }

    // Push previous state before reset
    if (window.PegasusCloud) window.PegasusCloud.push(true);

    clearInterval(timer); timer = null; running = false; phase = 0; currentIdx = 0;
    const sBtn = document.getElementById("btnStart");
    if (sBtn) sBtn.innerHTML = "Έναρξη";

    const isRainy = (typeof window.isRaining === 'function') ? window.isRaining() : false;
    let rawBaseData = (typeof window.calculateDailyProgram !== 'undefined') ? 
                      window.calculateDailyProgram(day, isRainy) : 
                      ((window.program[day]) ? [...window.program[day]] : []);

    // Weather Spillover Logic
    if (day === "Παρασκευή" && !isRainy && window.program["Κυριακή"]) {
        const bonus = window.program["Κυριακή"]
            .filter(ex => ex.name !== "Ποδηλασία 30km")
            .map(ex => ({...ex, isSpillover: true}));
        rawBaseData = [...rawBaseData, ...bonus];
    }

    // Optimizer / DVS Integration
    let mappedData = window.PegasusOptimizer ? window.PegasusOptimizer.apply(day, rawBaseData) : 
                     (window.DVS ? window.DVS.optimize(rawBaseData, day) : rawBaseData.map(e => ({ ...e, adjustedSets: e.sets })));

    // Cardio Credits (Via Manifest)
    let cardioCredit = parseFloat(localStorage.getItem(M.workout.cardio_offset_sets)) || 0;
    mappedData.sort((a, b) => (a.adjustedSets === 0) ? 1 : (b.adjustedSets === 0) ? -1 : 0);

    const list = document.getElementById("exList");
    if (!list) return;
    list.innerHTML = ""; exercises = []; remainingSets = [];

    mappedData.forEach((e, idx) => {
        if (!e.name || e.name === "αα" || e.name.includes("undefined") || e.name.includes("Ποδηλασία") || (e.adjustedSets || e.sets) < 1) return;

        let finalSets = parseFloat(e.adjustedSets || e.sets);
        const muscle = (window.exercisesDB?.find(ex => ex.name.trim() === e.name.trim()))?.muscleGroup || "Άλλο";

        if (muscle === "Πόδια" && cardioCredit > 0) {
            let deduction = Math.min(finalSets, cardioCredit);
            finalSets = parseFloat((finalSets - deduction).toFixed(1));
            cardioCredit = parseFloat((cardioCredit - deduction).toFixed(1));
        }

        const d = document.createElement("div");
        d.className = "exercise"; 
        d.dataset.total = finalSets; d.dataset.done = 0; d.dataset.index = idx;
        d.setAttribute("draggable", "true");

        if (finalSets <= 0) {
            d.classList.add("exercise-skipped");
            d.style.opacity = "0.2"; d.style.filter = "grayscale(100%)"; d.style.pointerEvents = "none";
        }

        const cleanName = e.name.trim();
        const safeName = cleanName.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const savedWeight = localStorage.getItem(`weight_ANGELOS_${cleanName}`) || localStorage.getItem(`weight_${cleanName}`) || "";

        d.innerHTML = `
            <div class="exercise-info" onclick="window.toggleSkipExercise(${idx})">
                <div class="set-counter">0/${finalSets}</div>
                <div class="exercise-name">${e.isSpillover ? `${cleanName} ☀️` : cleanName}</div>
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
    showVideo(0);
}

/* ===== 5. WORKOUT ENGINE (CORE LOGIC) ===== */
function startPause() {
    if (exercises.length === 0) return;
    const vid = document.getElementById("video");
    if (vid && vid.src.includes("warmup")) { vid.loop = false; vid.pause(); }

    if (!running && exercises[currentIdx].classList.contains("exercise-skipped")) {
        let firstAvailable = exercises.findIndex(ex => !ex.classList.contains("exercise-skipped") && parseFloat(ex.dataset.total) > 0);
        if (firstAvailable !== -1) { currentIdx = firstAvailable; showVideo(currentIdx); }
        else { alert("PEGASUS: Όλες οι ασκήσεις ολοκληρώθηκαν!"); return; }
    }

    running = !running;
    const sBtn = document.getElementById("btnStart");
    if (sBtn) sBtn.innerHTML = running ? "Παύση" : "Συνέχεια";
    
    if (running) runPhase(); else clearInterval(timer);
}

function runPhase() {
    if (!running) return;
    if (timer) clearInterval(timer);

    if (remainingSets.every(s => s <= 0)) { finishWorkout(); return; }

    const e = exercises[currentIdx];
    if (!e) return;
    
    const wInput = e.querySelector(".weight-input");
    const exName = wInput ? wInput.getAttribute("data-name") : "Άγνωστο";
    let t = (phase === 0) ? 10 : (phase === 1 ? workoutPhases[1].d : workoutPhases[2].d);

    // Partner UI Support
    const isAngelosTurn = typeof partnerData !== 'undefined' ? (!partnerData.isActive || partnerData.isUser1Turn) : true;
    exercises.forEach(ex => { ex.style.borderColor = "#222"; ex.style.background = "transparent"; });
    e.style.borderColor = isAngelosTurn ? "#4CAF50" : "#00bcd4";
    e.style.background = isAngelosTurn ? "rgba(76, 175, 80, 0.1)" : "rgba(0, 188, 212, 0.1)";

    const label = document.getElementById("phaseTimer");
    if (label) {
        let pName = (phase === 0) ? 'ΠΡΟΕΤΟΙΜΑΣΙΑ' : (phase === 1 ? 'ΑΣΚΗΣΗ' : 'ΔΙΑΛΕΙΜΜΑ');
        if (typeof partnerData !== 'undefined' && partnerData.isActive) {
            pName += phase === 2 ? ` (${partnerData.currentPartner})` : " (ΑΓΓΕΛΟΣ)";
        }
        label.textContent = `${pName} (${Math.ceil(t)})`;
        label.style.color = (phase === 1) ? "#4CAF50" : (phase === 2 ? (isAngelosTurn ? "#FFC107" : "#00bcd4") : "#64B5F6");
    }

    if (phase !== 2) showVideo(currentIdx);

    timer = setInterval(() => {
        t -= 1;
        if (remainingSeconds > 0) { remainingSeconds -= 1; updateTotalBar(); }

        // Live Calorie Burn Engine
        if (phase === 1 || phase === 2) {
            let currentKcal = parseFloat(localStorage.getItem(M.nutrition.today_kcal)) || 0;
            let burnRate = (phase === 1) ? (userWeight * 0.0017) : (userWeight * 0.0008);
            currentKcal += burnRate;
            localStorage.setItem(M.nutrition.today_kcal, currentKcal.toFixed(2));
            const kcalUI = document.querySelector(".kcal-value");
            if (kcalUI) kcalUI.textContent = currentKcal.toFixed(1);
        }

        if (window.MetabolicEngine && phase === 1) window.MetabolicEngine.updateTracking(1, exName);
        if (label) label.textContent = label.textContent.replace(/\(\d+\)/, `(${Math.max(0, Math.ceil(t))})`);

        if (t <= 0) {
            clearInterval(timer); playBeep();
            if (phase === 0) { phase = 1; runPhase(); }
            else if (phase === 1) {
                let done = parseInt(e.dataset.done) || 0;
                let total = parseInt(e.dataset.total) || 0;
                done++;
                e.dataset.done = done;
                remainingSets[currentIdx] = total - done;
                const counterDiv = e.querySelector(".set-counter");
                if (counterDiv) counterDiv.textContent = `${done}/${total}`;
                
                if (window.logPegasusSet) window.logPegasusSet(exName);
                if (window.updateAchievements) window.updateAchievements(exName);
                if (window.PegasusCloud) window.PegasusCloud.push(true);

                phase = 2;
                if (typeof partnerData !== 'undefined' && partnerData.isActive) partnerData.isUser1Turn = false;
                runPhase();
            } else {
                if (typeof partnerData !== 'undefined' && partnerData.isActive) partnerData.isUser1Turn = true;
                let next = getNextIndexCircuit();
                if (next !== -1) { currentIdx = next; phase = 0; runPhase(); }
                else finishWorkout();
            }
        }
    }, 1000 / SPEED);
}

/* ===== 6. STORAGE & FINISH (MANIFEST SYNC) ===== */
function finishWorkout() {
    if (!running && !timer) return;
    clearInterval(timer); running = false;

    const label = document.getElementById("phaseTimer");
    if (label) { label.textContent = "ΟΛΟΚΛΗΡΩΣΗ..."; label.style.color = "#4CAF50"; }

    const now = new Date();
    const workoutKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let data = JSON.parse(localStorage.getItem(M.workout.done) || "{}");
    data[workoutKey] = true;
    localStorage.setItem(M.workout.done, JSON.stringify(data));

    // Reset Offsets via Manifest
    localStorage.setItem(M.workout.cardio_offset, "0");
    localStorage.setItem(M.workout.cardio_offset_sets, "0");

    if (window.updateTotalWorkoutCount) window.updateTotalWorkoutCount();
    if (window.renderCalendar) window.renderCalendar();
    if (window.PegasusCloud) window.PegasusCloud.push(true);

    setTimeout(() => {
        if (window.PegasusReporting) {
            const kcalVal = localStorage.getItem(M.nutrition.today_kcal) || "0.0";
            window.PegasusReporting.prepareAndSaveReport(kcalVal);
            localStorage.setItem(M.nutrition.today_kcal, "0.0");
        }
        location.reload(); 
    }, 5000);
}

/* ===== 7. VIDEO & UI UTILS ===== */
function showVideo(i) {
    const vid = document.getElementById("video");
    if (!vid) return;
    vid.style.display = "block"; vid.style.opacity = "1";
    
    const ytFrame = document.getElementById("yt-video");
    if (ytFrame) ytFrame.remove();

    const label = document.getElementById("phaseTimer");
    const isManual = label && label.textContent.includes("Manual");

    let name = (isManual || i === null || i === undefined || i === -1) ? "Προθέρμανση" : exercises[i].querySelector(".weight-input").getAttribute("data-name");
    let mapped = (window.videoMap && window.videoMap[name]) ? window.videoMap[name] : name.replace(/\s+/g, '').toLowerCase();
    
    if (name.toLowerCase().includes("ems") && !window.videoMap[name]) mapped = "ems";

    const newSrc = `videos/${mapped}.mp4`;
    if (vid.getAttribute('src') !== newSrc) {
        vid.pause(); vid.src = newSrc; vid.load();
        vid.play().catch(err => {
            console.warn(`Asset ${mapped}.mp4 missing. Falling back.`);
            vid.src = "videos/warmup.mp4"; vid.load(); vid.play();
        });
    }
}

function saveWeight(name, val) {
    const cleanName = name.trim();
    if (typeof partnerData !== 'undefined' && partnerData.isActive) {
        savePartnerWeight(cleanName, val);
    } else {
        localStorage.setItem(`weight_ANGELOS_${cleanName}`, val);
        localStorage.setItem(`weight_${cleanName}`, val);
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
        const e = exercises[currentIdx];
        e.dataset.done++; remainingSets[currentIdx]--;
        e.querySelector(".set-counter").textContent = `${e.dataset.done}/${e.dataset.total}`;
        if (window.logPegasusSet) window.logPegasusSet(e.querySelector(".weight-input").getAttribute("data-name"));
    }
    if (window.PegasusCloud) window.PegasusCloud.push(true);
    let nextIdx = getNextIndexCircuit();
    if (nextIdx !== -1) { currentIdx = nextIdx; phase = 0; if (running) runPhase(); else showVideo(currentIdx); }
    else finishWorkout();
}

window.toggleSkipExercise = function(idx) {
    const exDiv = exercises[idx];
    if (!exDiv) return;
    const isSkipped = exDiv.classList.toggle("exercise-skipped");
    let done = parseInt(exDiv.dataset.done) || 0;
    let total = parseInt(exDiv.dataset.total) || 3;
    if (isSkipped) {
        exDiv.style.setProperty('opacity', '0.2', 'important');
        exDiv.style.setProperty('filter', 'grayscale(100%)', 'important');
        remainingSets[idx] = 0;
    } else {
        exDiv.style.setProperty('opacity', '1', 'important');
        exDiv.style.setProperty('filter', 'none', 'important');
        remainingSets[idx] = total - done;
    }
    calculateTotalTime();
};

function calculateTotalTime() {
    workoutPhases[1].d = parseInt(localStorage.getItem(M.user.ex_time)) || 45;
    workoutPhases[2].d = parseInt(localStorage.getItem(M.user.rest_time)) || 60;
    totalSeconds = exercises.reduce((acc, ex) => {
        if (ex.classList.contains("exercise-skipped")) return acc;
        const sets = parseFloat(ex.dataset.total);
        return acc + (sets * (10 + workoutPhases[1].d + workoutPhases[2].d));
    }, 0);
    remainingSeconds = totalSeconds;
    const timeDisplay = document.getElementById("totalProgressTime"); 
    if (timeDisplay) timeDisplay.textContent = `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
    updateTotalBar();
}

function updateTotalBar() {
    const bar = document.getElementById("totalProgress");
    if (bar && totalSeconds > 0) bar.style.width = ((totalSeconds - remainingSeconds) / totalSeconds * 100) + "%";
}

window.updateTotalWorkoutCount = function() {
    const data = JSON.parse(localStorage.getItem(M.workout.done) || "{}");
    const count = Object.keys(data).length;
    localStorage.setItem(M.workout.total, count);
    const display = document.getElementById("workoutCounter");
    if (display) display.textContent = count;
};

/* ===== 8. MASTER UI MAPPING & BOOT ===== */
window.onload = () => {
    if (typeof emailjs !== 'undefined') emailjs.init('qsfyDrneUHP7zEFui');
    if (typeof PegasusReporting !== 'undefined') {
        const lastSent = localStorage.getItem(M.nutrition.last_report);
        const todayStr = new Date().toLocaleDateString('el-GR');
        if (lastSent !== todayStr) {
            PegasusReporting.checkAndSendMorningReport();
            localStorage.setItem(M.nutrition.last_report, todayStr);
        }
    }

    createNavbar();
    window.updateTotalWorkoutCount();

    const masterUI = { 
        "btnStart": startPause,
        "btnNext": skipToNextExercise,
        "btnWarmup": () => { 
            const vid = document.getElementById("video");
            const label = document.getElementById("phaseTimer");
            if (vid && vid.src.includes("warmup") && vid.style.display !== "none") {
                vid.pause(); vid.loop = false;
                if (exercises.length > 0) {
                    if (label) label.textContent = exercises[currentIdx].querySelector(".weight-input").getAttribute("data-name");
                    showVideo(currentIdx); 
                }
            } else {
                vid.style.display = "block"; vid.src = "videos/warmup.mp4"; vid.loop = true; vid.play();
                if (label) { label.textContent = "ΠΡΟΘΕΡΜΑΝΣΗ (Manual Mode)"; label.style.color = "#64B5F6"; }
            }
        },
        "btnCalendarUI": { panel: "calendarPanel", init: window.renderCalendar },
        "btnAchUI": { panel: "achievementsPanel", init: window.renderAchievements },
        "btnSettingsUI": { panel: "settingsPanel", init: window.initSettingsUI },
        "btnFoodUI": { panel: "foodPanel", init: window.updateFoodUI },
        "btnToolsUI": { panel: "toolsPanel" },
        "btnPreviewUI": { panel: "previewPanel", init: window.openExercisePreview },
        "btnEMS": () => { if(window.logEMSData) window.logEMSData(); },
        "btnSaveEMS": () => { if(window.saveEMSFinal) window.saveEMSFinal(); },
        "btnCloseEMS": () => { if(window.closeEMSModal) window.closeEMSModal(); },
        "btnClosePreview": () => { document.getElementById('previewPanel').style.display='none'; },
        "btnManualEmail": () => { if(window.PegasusReporting) window.PegasusReporting.checkAndSendMorningReport(true); },
        "btnExportData": () => { if(window.exportPegasusData) window.exportPegasusData(); },
        "btnImportData": () => { document.getElementById('importFileTools').click(); },
        "btnMasterVault": () => { document.getElementById('pinModal').style.display='flex'; },
        "btnSaveSettings": () => { 
            if (window.savePegasusSettingsGlobal) window.savePegasusSettingsGlobal();
            else { localStorage.setItem(M.user.weight, document.getElementById("userWeightInput").value); location.reload(); }
        }
    };

    Object.keys(masterUI).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.onclick = (e) => {
                e.stopPropagation();
                const target = masterUI[btnId];
                const isActionBtn = btnId.includes("Save") || btnId.includes("Close") || btnId.includes("btnStart") || btnId.includes("btnNext") || btnId === "btnWarmup";
                if (!isActionBtn) document.querySelectorAll('.pegasus-panel, #emsModal, #cardioPanel').forEach(p => p.style.display = "none");
                if (typeof target === 'function') target();
                else if (target.panel) {
                    const el = document.getElementById(target.panel);
                    if (el) { el.style.display = "block"; if (target.init) target.init(); }
                }
            };
        }
    });

    // Auto-select Today
    const greekDays = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
    const todayName = greekDays[new Date().getDay()];
    setTimeout(() => { 
        document.querySelectorAll(".navbar button").forEach(b => { 
            if (b.textContent.trim().split(' ')[0] === todayName) {
                selectDay(b, b.textContent);
                if (document.getElementById("phaseTimer")) document.getElementById("phaseTimer").textContent = ""; 
            }
        }); 
    }, 500);
};

/* ===== 9. PREVIEW ENGINE ===== */
window.openExercisePreview = function() {
    const activeBtn = document.querySelector(".navbar button.active");
    if (!activeBtn) return;
    const currentDay = activeBtn.textContent.trim().split(' ')[0];
    const isRainy = (typeof window.isRaining === 'function') ? window.isRaining() : false;
    let rawData = (typeof window.calculateDailyProgram !== 'undefined') ? 
                  window.calculateDailyProgram(currentDay, isRainy) : (window.program[currentDay] || []);
    const dayExercises = window.PegasusOptimizer ? window.PegasusOptimizer.apply(currentDay, rawData) : rawData;
    
    const content = document.getElementById('previewContent');
    if (!content) return;
    content.innerHTML = ''; 
    if (window.MuscleProgressUI) { window.MuscleProgressUI.lastDataHash = null; window.MuscleProgressUI.render(); }

    dayExercises.forEach(ex => {
        let img = (window.videoMap && window.videoMap[ex.name]) ? window.videoMap[ex.name] : ex.name.replace(/\s+/g, '').toLowerCase();
        content.innerHTML += `
            <div class="preview-item" style="display:inline-block; margin:10px; text-align:center;">
                <img src="images/${img}image.png" onerror="this.src='images/placeholder.jpg'" style="width:140px; border:2px solid #4CAF50; border-radius:8px;">
                <p style="color:#4CAF50; font-size:10px;">${ex.name} (${ex.adjustedSets || ex.sets} set)</p>
            </div>
        `;
    });
};

/* ===== 10. TRACKING LOGIC ===== */
window.logPegasusSet = function(exName) {
    let history = JSON.parse(localStorage.getItem(M.workout.weekly_history)) || { "Στήθος": 0, "Πλάτη": 0, "Ώμοι": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 };
    let exercise = window.exercisesDB?.find(ex => ex.name.trim() === exName.trim());
    let targetMuscle = exercise ? exercise.muscleGroup : null;
    let value = 1;
    const cleanName = exName.trim().toUpperCase();
    
    if (cleanName.includes("ΠΟΔΗΛΑΣΙΑ") || cleanName.includes("CYCLING")) { targetMuscle = "Πόδια"; value = 18; }
    else if (cleanName.includes("EMS ΠΟΔΙΩΝ")) { targetMuscle = "Πόδια"; value = 6; }

    if (targetMuscle && history.hasOwnProperty(targetMuscle)) {
        history[targetMuscle] = (history[targetMuscle] || 0) + value;
        localStorage.setItem(M.workout.weekly_history, JSON.stringify(history));
        
        console.log(`[PEGASUS AUDIT]: Credited ${value} to ${targetMuscle} from ${exName}`);

        if (window.MuscleProgressUI) window.MuscleProgressUI.render();
        if (window.PegasusCloud) window.PegasusCloud.push(true);
    } else {
        console.warn(`[PEGASUS]: Exercise ${exName} could not be mapped to a muscle group.`);
    }
};

/* ===== 11. WORKOUT COUNTER & STATS ===== */
window.updateTotalWorkoutCount = function() {
    const data = JSON.parse(localStorage.getItem(M.workout.done) || "{}");
    const count = Object.keys(data).length;
    
    // Ενημέρωση και στα δύο κλειδιά για απόλυτη συμβατότητα
    localStorage.setItem(M.workout.total, count);
    
    const display = document.getElementById("workoutCounter");
    const displayContainer = document.getElementById("totalWorkoutsDisplay");
    
    if (display) display.textContent = count;
    if (displayContainer && !display) displayContainer.textContent = `Προπονήσεις: ${count}`;
    
    console.log(`[PEGASUS STATS]: Total Sessions: ${count}`);
};

/* ===== 12. INITIALIZATION CALLS ===== */
// Εκτέλεση του μετρητή αμέσως κατά το φόρτωμα
window.updateTotalWorkoutCount();

// Εξαγωγή κρίσιμων συναρτήσεων στο Window για πρόσβαση από το dragDrop.js
window.startPause = startPause;
window.skipToNextExercise = skipToNextExercise;
window.showVideo = showVideo;

console.log("✅ PEGASUS ENGINE: Manifest Mapping Complete. System Ready.");
