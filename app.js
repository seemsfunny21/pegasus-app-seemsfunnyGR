/* ==========================================================================
   PEGASUS WORKOUT ENGINE - v9.5 (FINAL REFIT EDITION)
   Protocol: Strict Data Mapping & Asset Preservation (v6.8 Logic)
   Status: Zero-Conflict Global Scope
   ========================================================================== */

// 1. GLOBAL SCOPE BRIDGE (Αποφυγή SyntaxError: Identifier M has already been declared)
var P_M = window.PegasusManifest; 
var M = P_M; // Δημιουργία τοπικής αναφοράς για συμβατότητα

if (!P_M) {
    console.error("❌ CRITICAL: PegasusManifest missing. Emergency recovery...");
    P_M = window.PegasusManifest;
}

/* ===== 1. ISSUE LOGGER (DIAGNOSTIC MODE) ===== */
window.pegasusLogs = JSON.parse(localStorage.getItem(P_M.system.logs) || "[]");
const originalError = console.error;
const originalWarn = console.warn;

console.error = function(...args) {
    window.pegasusLogs.push({ type: "ERROR", time: new Date().toLocaleTimeString(), msg: args.join(" ") });
    localStorage.setItem(P_M.system.logs, JSON.stringify(window.pegasusLogs.slice(-50)));
    originalError.apply(console, args);
};

console.warn = function(...args) {
    window.pegasusLogs.push({ type: "WARNING", time: new Date().toLocaleTimeString(), msg: args.join(" ") });
    localStorage.setItem(P_M.system.logs, JSON.stringify(window.pegasusLogs.slice(-50)));
    originalWarn.apply(console, args);
};

window.onerror = function(msg, url, line) {
    console.error(`Runtime Error: ${msg} at ${url}:${line}`);
};

/* ===== 2. CORE VARIABLES (LOGIC MIRRORING v6.8) ===== */
var exercises = [];
var remainingSets = [];
var currentIdx = 0;
var phase = 0; 
var running = false;
var timer = null;
var totalSeconds = 0;
var remainingSeconds = 0;
var muted = localStorage.getItem(P_M.system.mute) === "true";
var TURBO_MODE = localStorage.getItem(P_M.system.turbo) === "true";
var SPEED = TURBO_MODE ? 10 : 1;

/* === DYNAMIC PARAMETERS (MANIFEST SYNC) === */
var workoutPhases = [
    { n: "Προετοιμασία", d: 10 }, 
    { n: "Άσκηση", d: parseInt(localStorage.getItem("pegasus_ex_time")) || 45 },      
    { n: "Διάλειμμα", d: parseInt(localStorage.getItem("pegasus_rest_time")) || 60 }      
];

var userWeight = parseFloat(localStorage.getItem(P_M.user.weight)) || 74;

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

/* ===== 4. NAVIGATION & SELECTDAY (STRICT FILTER) ===== */
function createNavbar() {
    const nav = document.getElementById("navbar");
    if (!nav) return;
    const days = ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο", "Κυριακή"];
    nav.innerHTML = "";
    days.forEach((d) => {
        const b = document.createElement("button");
        b.textContent = d; b.id = `nav-${d}`;
        b.style.backgroundColor = "#000"; b.style.color = "#fff"; b.style.border = "none";
        b.onclick = () => selectDay(b, d);
        nav.appendChild(b);
    });
}

function selectDay(btn, day) {
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

    clearInterval(timer); timer = null; running = false; phase = 0; currentIdx = 0;
    const sBtn = document.getElementById("btnStart");
    if (sBtn) sBtn.innerHTML = "Έναρξη";

    const isRainy = (typeof window.isRaining === 'function') ? window.isRaining() : false;
    let rawBaseData = (typeof window.calculateDailyProgram !== 'undefined') ? 
                      window.calculateDailyProgram(day, isRainy) : 
                      ((window.program[day]) ? [...window.program[day]] : []);

    let mappedData = window.PegasusOptimizer ? window.PegasusOptimizer.apply(day, rawBaseData) : 
                     rawBaseData.map(e => ({ ...e, adjustedSets: e.sets, isCompleted: false }));

    // === PEGASUS CARDIO CREDIT (MANIFEST SYNC) ===
    let cardioCredit = parseFloat(localStorage.getItem(P_M.workout.cardio_offset)) || 0;
    mappedData.sort((a, b) => (a.adjustedSets === 0) ? 1 : (b.adjustedSets === 0) ? -1 : 0);

    const list = document.getElementById("exList");
    if (!list) return;
    list.innerHTML = ""; exercises = []; remainingSets = [];

    mappedData.forEach((e, idx) => {
        if (!e.name || e.name === "αα" || e.name.includes("undefined") || e.name.includes("Ποδηλασία") || e.adjustedSets < 1) return;

        let finalSets = parseFloat(e.adjustedSets);
        const muscle = (window.exercisesDB?.find(ex => ex.name.trim() === e.name.trim()))?.muscleGroup || "Άλλο";

        if (muscle === "Πόδια" && cardioCredit > 0 && finalSets > 0) {
            let deduction = Math.min(finalSets, cardioCredit);
            finalSets = parseFloat((finalSets - deduction).toFixed(1));
            cardioCredit = parseFloat((cardioCredit - deduction).toFixed(1));
        }

        const d = document.createElement("div");
        d.className = "exercise"; d.dataset.total = finalSets; d.dataset.done = 0; d.dataset.index = idx;

        if (finalSets <= 0) {
            d.classList.add("exercise-skipped");
            d.style.opacity = "0.2"; d.style.filter = "grayscale(100%)"; d.style.pointerEvents = "none";
        }

        const cleanName = e.name.trim();
        const savedWeight = localStorage.getItem(`weight_ANGELOS_${cleanName}`) || "";

        d.innerHTML = `
            <div class="exercise-info" onclick="window.toggleSkipExercise(${idx})">
                <div class="set-counter">0/${finalSets}</div>
                <div class="exercise-name">${e.isCompleted ? `${cleanName} 🎯` : cleanName}</div>
                <input type="number" class="weight-input" data-name="${cleanName}" placeholder="kg" value="${savedWeight}" 
                       onclick="event.stopPropagation()" onchange="saveWeight('${cleanName}', this.value)">
            </div>
            <div class="progress-box"><div class="progress-bar"></div></div>
        `;
        list.appendChild(d);
        exercises.push(d);
        remainingSets.push(finalSets);
    });

    calculateTotalTime();
    showVideo(0);
}

/* ===== 5. CORE ENGINE & LOGIC MIRRORING ===== */
function startPause() {
    if (exercises.length === 0) return;
    const vid = document.getElementById("video");
    if (vid && vid.src.includes("warmup")) { vid.loop = false; vid.pause(); }

    if (!running && exercises[currentIdx].classList.contains("exercise-skipped")) {
        let firstAvail = exercises.findIndex(ex => !ex.classList.contains("exercise-skipped") && remainingSets[exercises.indexOf(ex)] > 0);
        if (firstAvail !== -1) { currentIdx = firstAvail; showVideo(currentIdx); }
        else return alert("Όλες οι ασκήσεις ολοκληρώθηκαν!");
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
    const exName = e.querySelector(".weight-input").getAttribute("data-name");

    exercises.forEach(ex => { ex.style.borderColor = "#222"; ex.style.background = "transparent"; });
    e.style.borderColor = "#4CAF50"; e.style.background = "rgba(76, 175, 80, 0.1)";

    let t = (phase === 0) ? 10 : (phase === 1 ? workoutPhases[1].d : workoutPhases[2].d);
    let pName = (phase === 0) ? "ΠΡΟΘΕΡΜΑΝΣΗ" : (phase === 1 ? "ΑΣΚΗΣΗ" : "ΔΙΑΛΕΙΜΜΑ");

    const label = document.getElementById("phaseTimer");
    if (label) {
        label.textContent = `${pName} (${Math.max(0, Math.ceil(t))})`;
        label.style.color = (phase === 1) ? "#4CAF50" : (phase === 2 ? "#FFC107" : "#64B5F6");
    }

    if (phase !== 2) showVideo(currentIdx);

    timer = setInterval(() => {
        t -= 1;
        if (remainingSeconds > 0) { remainingSeconds -= 1; updateTotalBar(); }
        if (window.MetabolicEngine && phase === 1) window.MetabolicEngine.updateTracking(1, exName);
        if (label) label.textContent = `${pName} (${Math.max(0, Math.ceil(t))})`;

        if (t <= 0) {
            clearInterval(timer); playBeep();
            if (phase === 0) { phase = 1; runPhase(); }
            else if (phase === 1) {
                let done = ++e.dataset.done;
                remainingSets[currentIdx] = e.dataset.total - done;
                e.querySelector(".set-counter").textContent = `${done}/${e.dataset.total}`;
                if (window.updateAchievements) window.updateAchievements(exName);
                if (window.logPegasusSet) window.logPegasusSet(exName);
                phase = 2; runPhase();
            } else {
                let next = getNextIndexCircuit();
                if (next !== -1) { currentIdx = next; phase = 0; runPhase(); }
                else finishWorkout();
            }
        }
    }, 1000 / SPEED);
}

/* ===== 6. VIDEO ENGINE (ASSET PRESERVATION) ===== */
function showVideo(i) {
    const vid = document.getElementById("video");
    if (!vid) return;
    vid.style.display = "block"; vid.style.opacity = "1";
    const ytFrame = document.getElementById("yt-video");
    if (ytFrame) ytFrame.remove();

    const label = document.getElementById("phaseTimer");
    const phaseLabel = label ? label.textContent : "";

    if (phaseLabel.includes("Manual") || i === null || i === undefined || !exercises[i]) {
        vid.src = "videos/warmup.mp4";
    } else {
        const name = exercises[i].querySelector(".weight-input").getAttribute("data-name");
        let mapped = (window.videoMap && window.videoMap[name]) ? window.videoMap[name] : name.replace(/\s+/g, '').toLowerCase();
        vid.src = `videos/${mapped}.mp4`;
    }
    vid.play().catch(() => { vid.src = "videos/warmup.mp4"; vid.play(); });
}

/* ===== 7. STORAGE & FINISH (MANIFEST SYNC) ===== */
function finishWorkout() {
    clearInterval(timer); running = false;
    const now = new Date();
    const workoutKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let data = JSON.parse(localStorage.getItem(P_M.workout.done) || "{}");
    data[workoutKey] = true;
    localStorage.setItem(P_M.workout.done, JSON.stringify(data));
    localStorage.setItem(P_M.workout.cardio_offset, "0");

    if (window.updateTotalWorkoutCount) window.updateTotalWorkoutCount();
    if (window.PegasusCloud) window.PegasusCloud.push(true);

    setTimeout(() => {
        if (window.PegasusReporting) {
            const kcal = localStorage.getItem(P_M.nutrition.today_kcal) || "0";
            window.PegasusReporting.prepareAndSaveReport(kcal);
        }
        location.reload(); 
    }, 5000);
}

/* ===== 8. UTILS & UI ===== */
function saveWeight(name, val) {
    localStorage.setItem(`weight_ANGELOS_${name}`, val);
    if (window.PegasusCloud) window.PegasusCloud.push(true);
}

function getNextIndexCircuit() {
    for (let i = 1; i <= remainingSets.length; i++) {
        let idx = (currentIdx + i) % remainingSets.length;
        if (remainingSets[idx] > 0 && !exercises[idx].classList.contains("exercise-skipped")) return idx;
    }
    return -1;
}

function calculateTotalTime() {
    workoutPhases[1].d = parseInt(localStorage.getItem("pegasus_ex_time")) || 45;
    workoutPhases[2].d = parseInt(localStorage.getItem("pegasus_rest_time")) || 60;
    totalSeconds = exercises.reduce((acc, ex) => {
        if (ex.classList.contains("exercise-skipped")) return acc;
        return acc + (parseFloat(ex.dataset.total) * (10 + workoutPhases[1].d + workoutPhases[2].d));
    }, 0);
    remainingSeconds = totalSeconds;
    const display = document.getElementById("totalProgressTime");
    if (display) display.textContent = `${Math.floor(totalSeconds/60)}:${String(totalSeconds%60).padStart(2,'0')}`;
    updateTotalBar();
}

function updateTotalBar() {
    const bar = document.getElementById("totalProgress");
    if (bar && totalSeconds > 0) bar.style.width = ((totalSeconds - remainingSeconds) / totalSeconds * 100) + "%";
}

window.toggleSkipExercise = function(idx) {
    const exDiv = exercises[idx];
    const isSkipped = exDiv.classList.toggle("exercise-skipped");
    let done = parseInt(exDiv.dataset.done) || 0;
    let total = parseInt(exDiv.dataset.total) || 3;
    if (isSkipped) {
        exDiv.style.opacity = "0.2"; exDiv.style.filter = "grayscale(100%)";
        remainingSets[idx] = 0;
    } else {
        exDiv.style.opacity = "1"; exDiv.style.filter = "none";
        remainingSets[idx] = total - done;
    }
    calculateTotalTime();
};

window.updateTotalWorkoutCount = function() {
    const data = JSON.parse(localStorage.getItem(P_M.workout.done) || "{}");
    const count = Object.keys(data).length;
    localStorage.setItem(P_M.workout.total, count);
    const display = document.getElementById("totalWorkoutsDisplay");
    if (display) display.textContent = `Προπονήσεις: ${count}`;
};

/* ===== 9. PREVIEW ENGINE (ASSET FIXED) ===== */
function openExercisePreview() {
    const activeBtn = document.querySelector(".navbar button.active");
    if (!activeBtn) return alert("Επίλεξε ημέρα!");
    const currentDay = activeBtn.textContent.trim().split(' ')[0];
    const rawData = window.program[currentDay] || [];
    const dayEx = window.PegasusOptimizer ? window.PegasusOptimizer.apply(currentDay, rawData) : rawData;

    const panel = document.getElementById('previewPanel');
    const content = document.getElementById('previewContent');
    if (!panel || !content) return;

    panel.style.display = 'block'; content.innerHTML = ''; 
    if (window.MuscleProgressUI) window.MuscleProgressUI.render();

    dayEx.filter(ex => (ex.adjustedSets || ex.sets) > 0).forEach((ex) => {
        const name = ex.name.trim();
        // ASSET MAPPING
        const nameMap = { "Low Seated Row": "lowrowsseated", "Close Grip Pulldown": "latpulldownsclose" };
        let img = nameMap[name] || name.replace(/\s+/g, '').toLowerCase();
        content.innerHTML += `
            <div class="preview-item">
                <img src="images/${img}.png" onerror="this.src='images/placeholder.jpg'">
                <p>${name} (${ex.adjustedSets || ex.sets} set)</p>
            </div>`;
    });
}

/* ===== 10. TRACKING & BOOT ===== */
window.logPegasusSet = function(exName) {
    let history = JSON.parse(localStorage.getItem(P_M.workout.weekly_history)) || { "Στήθος": 0, "Πλάτη": 0, "Ώμοι": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 };
    let muscle = (window.exercisesDB?.find(ex => ex.name.trim() === exName.trim()))?.muscleGroup;
    let value = 1;
    if (exName.toUpperCase().includes("ΠΟΔΗΛΑΣΙΑ")) { muscle = "Πόδια"; value = 18; }
    if (muscle && history.hasOwnProperty(muscle)) {
        history[muscle] += value;
        localStorage.setItem(P_M.workout.weekly_history, JSON.stringify(history));
        if (window.MuscleProgressUI) window.MuscleProgressUI.render();
        if (window.PegasusCloud) window.PegasusCloud.push(true);
    }
};

window.onload = () => {
    if (typeof emailjs !== 'undefined') emailjs.init('qsfyDrneUHP7zEFui');
    createNavbar();
    window.updateTotalWorkoutCount();
    
    // Auto-select Today
    const greekDays = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
    const today = greekDays[new Date().getDay()];
    setTimeout(() => { 
        document.querySelectorAll(".navbar button").forEach(b => { 
            if (b.textContent.trim().split(' ')[0] === today) {
                selectDay(b, b.textContent);
                const label = document.getElementById("phaseTimer");
                if (label) label.textContent = ""; 
            }
        }); 
    }, 500);
};

// Global Bridge
window.startPause = startPause;
window.showVideo = showVideo;
window.openExercisePreview = openExercisePreview;
