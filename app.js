/* ==========================================================================
   PEGASUS WORKOUT ENGINE - v18.1 TOTAL INTEGRITY
   Protocol: Full Logic Recovery, Metabolic Sync, Achievement Bridge
   ========================================================================== */

// 1. GLOBAL STATE & PARAMETERS
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

var workoutPhases = [
    { n: "Προετοιμασία", d: 10 }, 
    { n: "Άσκηση", d: parseInt(localStorage.getItem("pegasus_ex_time")) || 45 },      
    { n: "Διάλειμμα", d: parseInt(localStorage.getItem("pegasus_rest_time")) || 60 }      
];
var userWeight = parseFloat(localStorage.getItem("pegasus_weight")) || 74;

// 2. AUDIO ENGINE
let sysAudio = new Audio('videos/beep.mp3');
let audioUnlocked = false;

document.addEventListener('click', function() {
    if (!audioUnlocked) {
        sysAudio.play().then(() => {
            sysAudio.pause(); sysAudio.currentTime = 0;
            audioUnlocked = true;
            console.log("PEGASUS: Audio Unlocked & Cloud Ready");
            if (window.PegasusCloud && typeof window.PegasusCloud.pull === "function") window.PegasusCloud.pull();
        }).catch(e => console.warn("Audio waiting for interaction"));
    }
}, { once: true });

const playBeep = (volume = 1) => {
    if (!muted) { sysAudio.volume = volume; sysAudio.currentTime = 0; sysAudio.play().catch(e => {}); }
};

// 3. NAVIGATION ENGINE
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
    document.getElementById("btnStart").innerHTML = "Έναρξη";

    const isRainy = (typeof window.isRaining === 'function') ? window.isRaining() : false;
    let rawBaseData = (typeof window.calculateDailyProgram !== 'undefined') ? 
                      window.calculateDailyProgram(day, isRainy) : (window.program[day] || []);

    let mappedData = window.PegasusOptimizer ? window.PegasusOptimizer.apply(day, rawBaseData) : 
                     rawBaseData.map(e => ({ ...e, adjustedSets: e.sets, isCompleted: false }));

    mappedData.sort((a, b) => (a.adjustedSets === 0) ? 1 : (b.adjustedSets === 0) ? -1 : 0);

    const list = document.getElementById("exList");
    if (!list) return;
    list.innerHTML = ""; exercises = []; remainingSets = [];

    mappedData.forEach((e, idx) => {
        const d = document.createElement("div");
        d.className = "exercise"; 
        d.dataset.total = e.adjustedSets; d.dataset.done = 0; d.dataset.index = idx;
        if (e.adjustedSets === 0) { d.classList.add("exercise-skipped"); d.style.opacity = "0.2"; }

        const cleanName = e.name.trim();
        const safeName = cleanName.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const savedWeight = localStorage.getItem(`weight_ANGELOS_${cleanName}`) || "";

        d.innerHTML = `
            <div class="exercise-info" onclick="window.toggleSkipExercise(${idx})">
                <div class="set-counter">0/${e.adjustedSets}</div>
                <div class="exercise-name">${e.isCompleted ? `${cleanName} 🎯` : cleanName}</div>
                <input type="number" class="weight-input" data-name="${safeName}" placeholder="kg" value="${savedWeight}" 
                onclick="event.stopPropagation()" onchange="saveWeight('${cleanName}', this.value)">
            </div>
            <div class="progress-box"><div class="progress-bar"></div></div>
        `;
        list.appendChild(d);
        exercises.push(d);
        remainingSets.push(parseInt(e.adjustedSets));
    });
    calculateTotalTime();
    showVideo(0);
}

// 4. WORKOUT ENGINE CORE
function startPause() {
    if (exercises.length === 0) return;
    running = !running;
    const sBtn = document.getElementById("btnStart");
    if (sBtn) sBtn.innerHTML = running ? "Παύση" : "Συνέχεια";
    if (running) runPhase();
    else { clearInterval(timer); timer = null; }
}

function runPhase() {
    if (!running) return;
    if (timer) clearInterval(timer);
    if (remainingSets.every(s => s <= 0)) { finishWorkout(); return; }

    const exTime = parseInt(localStorage.getItem("pegasus_ex_time")) || 45;
    const restTime = parseInt(localStorage.getItem("pegasus_rest_time")) || 60;
    const prepTime = 10;
    const e = exercises[currentIdx];
    if (!e) return;

    exercises.forEach(ex => { ex.style.borderColor = "#222"; ex.style.background = "transparent"; });
    e.style.borderColor = "#4CAF50"; e.style.background = "rgba(76, 175, 80, 0.1)";

    let t = (phase === 0) ? prepTime : (phase === 1 ? exTime : restTime);
    let currentPhaseName = (phase === 0) ? "ΠΡΟΘΕΡΜΑΝΣΗ" : (phase === 1 ? "ΑΣΚΗΣΗ" : "ΔΙΑΛΕΙΜΜΑ");

    const label = document.getElementById("phaseTimer");
    if (label) {
        label.textContent = `${currentPhaseName} (${Math.max(0, t)})`;
        label.style.color = (phase === 1) ? "#4CAF50" : (phase === 2 ? "#FFC107" : "#64B5F6");
    }

    if (phase !== 2) showVideo(currentIdx);

    timer = setInterval(() => {
        t -= 1;
        if (remainingSeconds > 0) { remainingSeconds -= 1; updateTotalBar(); }
        if (window.MetabolicEngine && phase === 1) {
            const exName = e.querySelector(".weight-input").getAttribute("data-name");
            window.MetabolicEngine.updateTracking(1, exName);
        }
        if (label) label.textContent = `${currentPhaseName} (${Math.max(0, t)})`;

        if (t <= 0) {
            clearInterval(timer);
            playBeep();
            if (phase === 0) { phase = 1; runPhase(); }
            else if (phase === 1) {
                let done = parseInt(e.dataset.done) + 1;
                e.dataset.done = done;
                remainingSets[currentIdx]--;
                e.querySelector(".set-counter").textContent = `${done}/${e.dataset.total}`;
                if (window.logPegasusSet) window.logPegasusSet(e.querySelector(".weight-input").getAttribute("data-name"));
                phase = 2; runPhase();
            } else {
                currentIdx = getNextIndexCircuit();
                if (currentIdx !== -1) { phase = 0; runPhase(); }
                else finishWorkout();
            }
        }
    }, 1000 / SPEED);
}

// 5. VIDEO & PREVIEW ENGINE
function showVideo(i) {
    const vid = document.getElementById("video");
    if (!vid) return;
    const phaseLabel = document.getElementById("phaseTimer") ? document.getElementById("phaseTimer").textContent : "";
    let name = (i === null || phaseLabel.includes("ΠΡΟΘΕΡΜΑΝΣΗ")) ? "Προθέρμανση" : 
               (exercises[i] ? exercises[i].querySelector(".weight-input").getAttribute("data-name") : "default");

    if (typeof videoMap !== 'undefined') {
        let mappedVal = videoMap[name] || name.replace(/\s+/g, '');
        vid.src = `videos/${mappedVal}.mp4`;
        vid.play().catch(() => { vid.src = "videos/warmup.mp4"; vid.play(); });
    }
}

function openExercisePreview() {
    const activeBtn = document.querySelector(".navbar button.active");
    if (!activeBtn) return alert("Παρακαλώ επίλεξε πρώτα μια ημέρα!");
    const currentDay = activeBtn.textContent.trim().replace(" ☀️", "");
    const isRainy = (typeof window.isRaining === 'function') ? window.isRaining() : false;
    let rawData = (typeof window.calculateDailyProgram !== 'undefined') ? 
                  window.calculateDailyProgram(currentDay, isRainy) : (window.program[currentDay] || []);
    const dayExercises = window.PegasusOptimizer ? window.PegasusOptimizer.apply(currentDay, rawData) : rawData;
    const panel = document.getElementById('previewPanel');
    const content = document.getElementById('previewContent');
    if (panel && content) {
        panel.style.display = 'block'; content.innerHTML = ''; 
        dayExercises.filter(ex => ex.adjustedSets > 0).forEach((ex) => {
            const cleanName = ex.name.trim();
            let vid = (typeof videoMap !== 'undefined' && videoMap[cleanName]) ? videoMap[cleanName] : cleanName.replace(/\s+/g, '').toLowerCase();
            content.innerHTML += `<div class="preview-item"><img src="images/${vid}${vid === 'cycling' ? '.jpg' : '.png'}" onerror="this.src='images/placeholder.jpg'"><p>${cleanName}</p></div>`;
        });
    }
}

// 6. CALCULATIONS & STATS
function calculateTotalTime() {
    totalSeconds = 0;
    exercises.forEach((exDiv) => {
        if (!exDiv.classList.contains("exercise-skipped")) {
            const sets = parseInt(exDiv.dataset.total) || 0;
            totalSeconds += sets * (10 + workoutPhases[1].d + workoutPhases[2].d);
        }
    });
    remainingSeconds = totalSeconds;
    updateTotalBar();
}

function updateTotalBar() {
    const bar = document.getElementById("totalProgress");
    const timeText = document.getElementById("totalProgressTime");
    if (bar) {
        const progress = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;
        bar.style.width = Math.max(0, Math.min(100, progress)) + "%";
    }
    if (timeText) {
        const m = Math.floor(remainingSeconds / 60);
        const s = Math.floor(remainingSeconds % 60);
        timeText.textContent = `${m}:${String(s).padStart(2, "0")}`;
    }
}

function saveWeight(exerciseName, weightValue) {
    const cleanName = exerciseName.trim();
    localStorage.setItem(`weight_ANGELOS_${cleanName}`, weightValue);
    if (window.PegasusCloud) window.PegasusCloud.push(true);
}

function getNextIndexCircuit() {
    for (let i = 1; i <= remainingSets.length; i++) {
        let idx = (currentIdx + i) % remainingSets.length;
        if (remainingSets[idx] > 0 && !exercises[idx].classList.contains("exercise-skipped")) return idx;
    }
    return -1;
}

function finishWorkout() {
    clearInterval(timer); running = false;
    const label = document.getElementById("phaseTimer");
    if (label) label.textContent = "ΟΛΟΚΛΗΡΩΣΗ...";
    let history = JSON.parse(localStorage.getItem("pegasus_workouts_done") || "{}");
    history[new Date().toISOString().split('T')[0]] = true;
    localStorage.setItem("pegasus_workouts_done", JSON.stringify(history));
    updateTotalWorkoutCount();
    if (window.PegasusCloud) window.PegasusCloud.push();
    setTimeout(() => location.reload(), 3000);
}

// 7. UI BRIDGE & INITIALIZATION
window.onload = () => {
    console.log("PEGASUS OS: Initializing Unified Bridge v18.2...");

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

    // MASTER UI MAPPING - Ευθυγραμμισμένο με το Full Index.html
    const masterUI = {
        "btnStart": startPause,
        "btnNext": skipToNextExercise,
        "btnWarmup": () => { phase = 0; currentIdx = 0; showVideo(null); },
        "btnCalendarUI": { id: "calendarPanel", init: window.renderCalendar },
        "btnAchUI": { id: "achievementsPanel", init: window.renderAchievements },
        "btnSettingsUI": { id: "settingsPanel" },
        "btnFoodUI": { id: "foodPanel", init: window.renderFood },
        "btnToolsUI": { id: "toolsPanel" },
        "btnPreviewUI": { id: "previewPanel", init: openExercisePreview },
        "btnEMSUI": { id: "emsModal" },
        "btnManualEmail": () => { if(window.PegasusReporting) window.PegasusReporting.sendManualReport(); },
        
        // ΔΙΟΡΘΩΣΗ IDs ΕΡΓΑΛΕΙΩΝ (Tools)
        "btnMuteTools": () => { muted = !muted; const b = document.getElementById("btnMuteTools"); if(b) b.innerHTML = muted ? "Ήχος: OFF" : "Ήχος: ON"; },
        "btnTurboTools": () => { TURBO_MODE = !TURBO_MODE; SPEED = TURBO_MODE ? 10 : 1; const b = document.getElementById("btnTurboTools"); if(b) b.innerHTML = TURBO_MODE ? "Turbo: ON" : "Turbo: OFF"; if(running) runPhase(); },
        "btnExportData": () => { if(window.exportPegasusData) window.exportPegasusData(); },
        "btnImportData": () => { document.getElementById('importFileTools').click(); },
        "btnMasterVault": () => { document.getElementById('pinModal').style.display='flex'; },
        "btnOpenGallery": { id: "galleryPanel", init: window.renderGallery },
        
        // ΕΣΩΤΕΡΙΚΑ ΚΟΥΜΠΙΑ (Modals)
        "btnSaveSettings": () => {
            localStorage.setItem("pegasus_weight", document.getElementById("userWeightInput").value);
            localStorage.setItem("pegasus_ex_time", document.getElementById("exerciseTimeInput")?.value || 45);
            localStorage.setItem("pegasus_rest_time", document.getElementById("restTimeInput")?.value || 60);
            alert("PEGASUS: Ρυθμίσεις Σώθηκαν!");
            location.reload();
        },
        "btnSaveEMS": () => { if(window.saveEMSFinal) window.saveEMSFinal(); },
        "btnCloseEMS": () => { document.getElementById("emsModal").style.display = "none"; },
        "btnSaveCardio": () => { if(window.saveCardioData) window.saveCardioData(); },
        "btnCloseCardio": () => { document.getElementById("cardioPanel").style.display = "none"; },
        "btnVaultUnlock": () => { if(window.attemptVaultUnlock) window.attemptVaultUnlock(); },
        "btnVaultSkip": () => { document.getElementById("pinModal").style.display = "none"; },
        "btnPhotoUploadTrigger": () => document.getElementById("photoUpload").click(),
        "btnClosePreview": () => { document.getElementById("previewPanel").style.display = "none"; }
    };

    // ΕΚΤΕΛΕΣΗ EVENT BRIDGE
    Object.keys(masterUI).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.onclick = (e) => {
                e.stopPropagation();
                // Κλείνει τα πάντα εκτός από το Tools αν πατάμε εσωτερικό κουμπί
                if (!btnId.includes("Save") && !btnId.includes("Close") && btnId !== "btnMuteTools" && btnId !== "btnTurboTools") {
                    document.querySelectorAll('.pegasus-panel, #emsModal, #cardioPanel').forEach(p => p.style.display = "none");
                }
                
                const target = masterUI[btnId];
                if (typeof target === 'function') {
                    target();
                    console.log(`PEGASUS: Logic Executed for ${btnId}`);
                } else {
                    const el = document.getElementById(target.id);
                    if (el) {
                        el.style.display = "block";
                        if (target.init) target.init();
                        console.log(`PEGASUS: Panel Opened for ${btnId}`);
                    }
                }
            };
        } else {
            console.warn(`PEGASUS AUDIT: Missing Element #${btnId}`);
        }
    });

    // WEATHER & SEARCH LOGIC
    const rainToggle = document.getElementById("rainToggle");
    if (rainToggle) rainToggle.onchange = () => {
        const activeBtn = document.querySelector('.navbar button.active');
        if (activeBtn) selectDay(activeBtn, activeBtn.textContent);
    };

    const libSearch = document.getElementById("librarySearch");
    if (libSearch) libSearch.onkeyup = () => { if(window.filterLibrary) window.filterLibrary(); };

    if (typeof fetchWeather === "function") fetchWeather();

    const today = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"][new Date().getDay()];
    setTimeout(() => {
        document.querySelectorAll(".navbar button").forEach(b => { if (b.textContent === today) selectDay(b, today); });
    }, 300);
};

// 8. GLOBAL LOGIC & TRACKING
window.logPegasusSet = function(exName) {
    let history = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || { "Στήθος": 0, "Πλάτη": 0, "Ώμοι": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 };
    if (!window.exercisesDB) return;
    const exercise = window.exercisesDB.find(ex => ex.name.trim() === exName.trim());
    if (exercise && exercise.muscleGroup) {
        history[exercise.muscleGroup] = (history[exercise.muscleGroup] || 0) + 1;
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

window.toggleSkipExercise = (idx) => {
    const exDiv = exercises[idx];
    if (exDiv) {
        exDiv.classList.toggle("exercise-skipped");
        remainingSets[idx] = exDiv.classList.contains("exercise-skipped") ? 0 : parseInt(exDiv.dataset.total);
        calculateTotalTime();
    }
};

window.updateTotalWorkoutCount();
