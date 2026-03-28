/* ==========================================================================
   PEGASUS WORKOUT ENGINE - v9.6 (CLOUD SYNC & ASSET FIXED)
   Protocol: Strict Data Mapping & Surgical Push Integration
   Base Architecture: v6.8 (The Complete Brain)
   ========================================================================== */

// 0. GLOBAL SCOPE BRIDGE (Manifest Link)
var P_M = window.PegasusManifest; 
var M = P_M; 

if (!P_M) {
    console.warn("⚠️ Manifest not found. Initializing Emergency Link...");
    P_M = window.PegasusManifest;
}

/* ===== 1. ISSUE LOGGER (DIAGNOSTIC MODE) ===== */
window.pegasusLogs = JSON.parse(localStorage.getItem(P_M?.system.logs || "pegasus_system_logs") || "[]");
const originalError = console.error;
const originalWarn = console.warn;

console.error = function(...args) {
    window.pegasusLogs.push({ type: "ERROR", time: new Date().toLocaleTimeString(), msg: args.join(" ") });
    localStorage.setItem(P_M?.system.logs || "pegasus_system_logs", JSON.stringify(window.pegasusLogs.slice(-50)));
    originalError.apply(console, args);
};

console.warn = function(...args) {
    window.pegasusLogs.push({ type: "WARNING", time: new Date().toLocaleTimeString(), msg: args.join(" ") });
    localStorage.setItem(P_M?.system.logs || "pegasus_system_logs", JSON.stringify(window.pegasusLogs.slice(-50)));
    originalWarn.apply(console, args);
};

window.onerror = function(msg, url, line) {
    console.error(`Runtime Error: ${msg} at ${url}:${line}`);
};

/* ===== 2. CORE VARIABLES ===== */
var exercises = [];
var remainingSets = [];
var currentIdx = 0;
var phase = 0; 
var running = false;
var timer = null;
var totalSeconds = 0;
var remainingSeconds = 0;
var muted = localStorage.getItem(P_M?.system.mute || "pegasus_mute_state") === "true";
var TURBO_MODE = localStorage.getItem(P_M?.system.turbo || "pegasus_turbo_state") === "true";
var SPEED = TURBO_MODE ? 10 : 1;

/* === DYNAMIC PARAMETERS === */
var workoutPhases = [
    { n: "Προετοιμασία", d: 10 }, 
    { n: "Άσκηση", d: parseInt(localStorage.getItem(P_M?.user.ex_time || "pegasus_ex_time")) || 45 },     
    { n: "Διάλειμμα", d: parseInt(localStorage.getItem(P_M?.user.rest_time || "pegasus_rest_time")) || 60 }     
];

var userWeight = parseFloat(localStorage.getItem(P_M?.user.weight || "pegasus_weight")) || 74;

/* ===== 3. AUDIO SYSTEM ===== */
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

/* ===== 4. NAVIGATION & SELECTDAY (PUSH INTEGRATED) ===== */
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
        return; 
    }

    // [PUSH TRIGGER] Συγχρονισμός πριν την αλλαγή ημέρας
    if (window.PegasusCloud) window.PegasusCloud.push(true);

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

    // Weather Spillover Logic
    if (day === "Παρασκευή" && !isRainy && window.program["Κυριακή"]) {
        const bonus = window.program["Κυριακή"].filter(ex => !ex.name.includes("Ποδηλασία")).map(ex => ({...ex, isSpillover: true}));
        rawBaseData = [...rawBaseData, ...bonus];
    }

    let mappedData = window.PegasusOptimizer ? window.PegasusOptimizer.apply(day, rawBaseData) : 
                     rawBaseData.map(e => ({ ...e, adjustedSets: e.sets, isCompleted: false }));

    let cardioCredit = parseFloat(localStorage.getItem(P_M?.workout.cardio_offset || "pegasus_cardio_offset_sets")) || 0;
    mappedData.sort((a, b) => (a.adjustedSets === 0) ? 1 : (b.adjustedSets === 0) ? -1 : 0);

    const list = document.getElementById("exList");
    if (!list) return;
    list.innerHTML = ""; exercises = []; remainingSets = [];

    mappedData.forEach((e, idx) => {
        if (!e.name || e.name === "αα" || e.adjustedSets < 1) return;

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
        const safeName = cleanName.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const savedWeight = localStorage.getItem(`weight_ANGELOS_${cleanName}`) || "";

        d.innerHTML = `
            <div class="exercise-info" onclick="window.toggleSkipExercise(${idx})">
                <div class="set-counter">0/${finalSets}</div>
                <div class="exercise-name">${cleanName}${e.isSpillover ? " ☀️" : ""}</div>
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

/* ===== 5. WORKOUT ENGINE (PUSH AT SET END) ===== */
function startPause() {
    if (exercises.length === 0) return;
    const vid = document.getElementById("video");
    if (vid && vid.src.includes("warmup")) { vid.loop = false; vid.pause(); }

    if (!running && exercises[currentIdx].classList.contains("exercise-skipped")) {
        let firstAvailable = exercises.findIndex(ex => !ex.classList.contains("exercise-skipped") && remainingSets[exercises.indexOf(ex)] > 0);
        if (firstAvailable !== -1) { currentIdx = firstAvailable; showVideo(currentIdx); }
        else return;
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
                let done = parseInt(e.dataset.done) || 0;
                done++;
                e.dataset.done = done;
                remainingSets[currentIdx] = parseFloat(e.dataset.total) - done;
                e.querySelector(".set-counter").textContent = `${done}/${e.dataset.total}`;
                
                if (window.updateAchievements) window.updateAchievements(exName);
                if (window.logPegasusSet) window.logPegasusSet(exName);

                // [PUSH TRIGGER] Συγχρονισμός μετά από κάθε ολοκληρωμένο σετ
                if (window.PegasusCloud) window.PegasusCloud.push(true);

                phase = 2; runPhase();
            } else {
                let next = getNextIndexCircuit();
                if (next !== -1) { currentIdx = next; phase = 0; runPhase(); }
                else finishWorkout();
            }
        }
    }, 1000 / SPEED);
}

/* ===== 6. SAVE & SKIP (PUSH INTEGRATED) ===== */
function saveWeight(name, val) {
    const cleanName = name.trim();
    localStorage.setItem(`weight_ANGELOS_${cleanName}`, val);
    localStorage.setItem(`weight_${cleanName}`, val);
    
    // [PUSH TRIGGER] Συγχρονισμός αμέσως μόλις αλλάξεις κιλά
    if (window.PegasusCloud) window.PegasusCloud.push(true);
}

function skipToNextExercise() {
    if (exercises.length === 0) return;
    clearInterval(timer);

    if ((phase === 1 || phase === 2) && running) {
        const currentExNode = exercises[currentIdx];
        const exName = currentExNode.querySelector(".weight-input").getAttribute("data-name");
        currentExNode.dataset.done++;
        remainingSets[currentIdx]--;
        currentExNode.querySelector(".set-counter").textContent = `${currentExNode.dataset.done}/${currentExNode.dataset.total}`;
        if (window.logPegasusSet) window.logPegasusSet(exName);
    }

    // [PUSH TRIGGER] Συγχρονισμός κατά το skip
    if (window.PegasusCloud) window.PegasusCloud.push(true);

    let nextIdx = getNextIndexCircuit();
    if (nextIdx !== -1) {
        currentIdx = nextIdx; phase = 0;
        if (running) runPhase(); else showVideo(currentIdx);
    } else finishWorkout();
}

/* ===== 7. VIDEO & UI UTILS (ASSET FIXED) ===== */
function showVideo(i) {
    const vid = document.getElementById("video");
    if (!vid) return;
    vid.style.display = "block"; vid.style.opacity = "1";
    const ytFrame = document.getElementById("yt-video");
    if (ytFrame) ytFrame.remove();

    const label = document.getElementById("phaseTimer");
    const phaseLabel = label ? label.textContent : "";
    
    let name = (phaseLabel.includes("Manual") || i === null || i === undefined || i === -1) ? "Προθέρμανση" : exercises[i].querySelector(".weight-input").getAttribute("data-name");
    
    if (typeof videoMap !== 'undefined') {
        let mappedVal = videoMap[name] || name.replace(/\s+/g, '').toLowerCase();
        if (name.toLowerCase().includes("ems") && !videoMap[name]) mappedVal = "ems";

        const newSrc = `videos/${mappedVal}.mp4`;
        if (vid.getAttribute('src') !== newSrc) {
            vid.pause(); vid.src = newSrc; vid.load();
            vid.play().catch(() => { vid.src = "videos/warmup.mp4"; vid.load(); vid.play(); });
        }
    }
}

function calculateTotalTime() {
    workoutPhases[1].d = parseInt(localStorage.getItem(P_M?.user.ex_time || "pegasus_ex_time")) || 45;
    workoutPhases[2].d = parseInt(localStorage.getItem(P_M?.user.rest_time || "pegasus_rest_time")) || 60;
    totalSeconds = exercises.reduce((acc, ex) => {
        if (ex.classList.contains("exercise-skipped")) return acc;
        return acc + (parseFloat(ex.dataset.total) * (10 + workoutPhases[1].d + workoutPhases[2].d));
    }, 0);
    remainingSeconds = totalSeconds;
    const timeDisplay = document.getElementById("totalProgressTime"); 
    if (timeDisplay) timeDisplay.textContent = `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
    updateTotalBar();
}

function updateTotalBar() {
    const bar = document.getElementById("totalProgress");
    const timeText = document.getElementById("totalProgressTime");
    if (!bar || totalSeconds <= 0) return;
    bar.style.width = ((totalSeconds - remainingSeconds) / totalSeconds * 100) + "%";
    if (timeText) {
        const m = Math.floor(remainingSeconds / 60);
        const s = Math.floor(remainingSeconds % 60);
        timeText.textContent = `${m}:${String(s).padStart(2, "0")}`;
    }
}

function getNextIndexCircuit() {
    for (let i = 1; i <= remainingSets.length; i++) {
        let idx = (currentIdx + i) % remainingSets.length;
        if (remainingSets[idx] > 0 && !exercises[idx].classList.contains("exercise-skipped")) return idx;
    }
    return -1;
}

window.toggleSkipExercise = function(idx) {
    const exDiv = exercises[idx];
    const originalSets = parseFloat(exDiv.dataset.total);
    const isSkipped = exDiv.classList.toggle("exercise-skipped");
    let done = parseInt(exDiv.dataset.done) || 0;

    if (isSkipped) {
        exDiv.style.setProperty('opacity', '0.2', 'important');
        exDiv.style.setProperty('filter', 'grayscale(100%)', 'important');
        remainingSets[idx] = 0;
    } else {
        exDiv.style.setProperty('opacity', '1', 'important');
        exDiv.style.setProperty('filter', 'none', 'important');
        remainingSets[idx] = originalSets - done;
    }
    calculateTotalTime();
};

/* ===== 8. FINISH & REPORTING ===== */
function finishWorkout() {
    if (!running && !timer) return; 
    clearInterval(timer); running = false;

    const label = document.getElementById("phaseTimer");
    if (label) { label.textContent = "ΟΛΟΚΛΗΡΩΣΗ..."; label.style.color = "#4CAF50"; }

    const now = new Date();
    const workoutKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let data = JSON.parse(localStorage.getItem(P_M?.workout.done || "pegasus_workouts_done") || "{}");
    data[workoutKey] = true;
    localStorage.setItem(P_M?.workout.done || "pegasus_workouts_done", JSON.stringify(data));

    localStorage.setItem(P_M?.workout.cardio_offset || "pegasus_cardio_offset_sets", "0");

    if (window.updateTotalWorkoutCount) window.updateTotalWorkoutCount();
    if (window.PegasusCloud) window.PegasusCloud.push(true);

    setTimeout(() => {
        if (window.PegasusReporting) {
            const currentKcal = localStorage.getItem(P_M?.nutrition.today_kcal || "pegasus_today_kcal") || "0";
            window.PegasusReporting.prepareAndSaveReport(currentKcal);
            localStorage.setItem(P_M?.nutrition.today_kcal || "pegasus_today_kcal", "0.0");
        }
        location.reload(); 
    }, 5000);
}

/* ===== 9. PREVIEW ENGINE (ASSET GITHUB SYNC) ===== */
function openExercisePreview() {
    const activeBtn = document.querySelector(".navbar button.active");
    if (!activeBtn) return alert("Επίλεξε ημέρα!");

    const currentDay = activeBtn.textContent.trim().split(' ')[0];
    const isRainy = (typeof window.isRaining === 'function') ? window.isRaining() : false;
    let rawData = (window.program[currentDay]) ? [...window.program[currentDay]] : [];
    const dayExercises = window.PegasusOptimizer ? window.PegasusOptimizer.apply(currentDay, rawData) : rawData;

    const panel = document.getElementById('previewPanel');
    const content = document.getElementById('previewContent');
    if (!panel || !content) return;

    panel.style.display = 'block'; content.innerHTML = ''; 

    if (window.MuscleProgressUI) {
        window.MuscleProgressUI.lastDataHash = null; 
        window.MuscleProgressUI.render();
    }

    // GitHub Asset Mapping
    const nameMapping = {
        "Low Seated Row": "lowrowsseated",
        "Close Grip Pulldown": "latpulldownsclose",
        "Tricep Extensions": "triceppulldowns",
        "Chest Press": "chestpress",
        "Lateral Raises": "lateralraises",
        "Shoulder Press": "uprightrows"
    };

    dayExercises.filter(ex => (ex.adjustedSets || ex.sets) > 0).forEach((ex) => {
        const cleanName = ex.name.trim();
        let img = nameMapping[cleanName] || cleanName.replace(/\s+/g, '').toLowerCase();
        let ext = (img === "cycling") ? ".jpg" : ".png";

        content.innerHTML += `
            <div class="preview-item">
                <img src="images/${img}${ext}" onerror="this.src='images/placeholder.jpg'">
                <p>${cleanName} (${ex.adjustedSets || ex.sets} set)</p>
            </div>
        `;
    });
}

/* ===== 10. BOOT & TRACKING ===== */
window.logPegasusSet = function(exName) {
    let history = JSON.parse(localStorage.getItem(P_M?.workout.weekly_history || 'pegasus_weekly_history')) || { "Στήθος": 0, "Πλάτη": 0, "Ώμοι": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 };
    let muscle = (window.exercisesDB?.find(ex => ex.name.trim() === exName.trim()))?.muscleGroup || "Άλλο";
    let value = 1;

    const cleanName = exName.trim().toUpperCase();
    if (cleanName.includes("ΠΟΔΗΛΑΣΙΑ") || cleanName.includes("CYCLING")) { muscle = "Πόδια"; value = 18; }
    else if (cleanName.includes("EMS ΠΟΔΙΩΝ")) { muscle = "Πόδια"; value = 6; }

    if (history.hasOwnProperty(muscle)) {
        history[muscle] += value;
        localStorage.setItem(P_M?.workout.weekly_history || 'pegasus_weekly_history', JSON.stringify(history));
        if (window.MuscleProgressUI) window.MuscleProgressUI.render();
    }
};

window.updateTotalWorkoutCount = function() {
    const data = JSON.parse(localStorage.getItem(P_M?.workout.done || "pegasus_workouts_done") || "{}");
    const count = Object.keys(data).length;
    localStorage.setItem(P_M?.workout.total || "pegasus_total_workouts", count);
    const display = document.getElementById("totalWorkoutsDisplay");
    if (display) display.textContent = `Προπονήσεις: ${count}`;
};

window.onload = () => {
    if (typeof emailjs !== 'undefined') emailjs.init('qsfyDrneUHP7zEFui');
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
                    label.textContent = exercises[currentIdx].querySelector(".weight-input").getAttribute("data-name");
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
        "btnPreviewUI": { panel: "previewPanel", init: openExercisePreview },
        "btnSaveSettings": () => { 
            localStorage.setItem(P_M?.user.weight || "pegasus_weight", document.getElementById("userWeightInput").value);
            if (window.PegasusCloud) window.PegasusCloud.push(true);
            location.reload();
        }
    };

    Object.keys(masterUI).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.onclick = (e) => {
                e.stopPropagation();
                const target = masterUI[btnId];
                if (!btnId.includes("Save") && !btnId.includes("Start")) document.querySelectorAll('.pegasus-panel, #emsModal').forEach(p => p.style.display = "none");
                if (typeof target === 'function') target();
                else if (target.panel) {
                    const el = document.getElementById(target.panel);
                    if (el) { el.style.display = "block"; if (target.init) target.init(); }
                }
            };
        }
    });

    const greekDays = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
    const today = greekDays[new Date().getDay()];
    setTimeout(() => { 
        document.querySelectorAll(".navbar button").forEach(b => { 
            if (b.textContent.trim().split(' ')[0] === today) selectDay(b, b.textContent);
        }); 
    }, 300);
};

/* ===== CLOUD SYNC EVENT (PUSH ON CLOSE) ===== */
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

    if (closedAny && window.PegasusCloud) {
        window.PegasusCloud.push(true); 
    }
});
