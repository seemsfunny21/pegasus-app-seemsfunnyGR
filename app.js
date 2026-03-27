/* ==========================================================================
   PEGASUS WORKOUT ENGINE - v17.7 FINAL STABLE
   Protocol: Full Code Delivery, Anti-Corruption, Centralized Event Bridge
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

/* ===== AUDIO & SYNC INITIALIZATION ===== */
let sysAudio = new Audio('videos/beep.mp3');
let audioUnlocked = false;

document.addEventListener('click', function() {
    if (!audioUnlocked) {
        sysAudio.play().then(() => {
            sysAudio.pause(); sysAudio.currentTime = 0;
            audioUnlocked = true;
            console.log("PEGASUS OS: Audio Unlocked & Cloud Sync Ready.");
            if (window.PegasusCloud && typeof window.PegasusCloud.pull === "function") window.PegasusCloud.pull();
        }).catch(e => console.warn("Audio unlock pending..."));
    }
}, { once: true });

const playBeep = (volume = 1) => {
    if (!muted) { 
        sysAudio.volume = volume; 
        sysAudio.currentTime = 0; 
        sysAudio.play().catch(e => {}); 
    }
};

/* ===== NAVIGATION ENGINE ===== */
function createNavbar() {
    const nav = document.getElementById("navbar");
    if (!nav) return;
    const days = ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο", "Κυριακή"];
    nav.innerHTML = "";
    days.forEach((d) => {
        const b = document.createElement("button");
        b.textContent = d; b.id = `nav-${d}`;
        b.onclick = () => selectDay(b, d);
        nav.appendChild(b);
    });
}

function selectDay(btn, day) {
    document.querySelectorAll(".navbar button").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");

    clearInterval(timer); timer = null; running = false; phase = 0; currentIdx = 0;
    const sBtn = document.getElementById("btnStart");
    if (sBtn) sBtn.innerHTML = "Έναρξη";

    const isRainy = (typeof window.isRaining === 'function') ? window.isRaining() : false;
    let rawBaseData = (typeof window.calculateDailyProgram !== 'undefined') ? 
                      window.calculateDailyProgram(day, isRainy) : (window.program[day] || []);

    let mappedData = window.PegasusOptimizer ? window.PegasusOptimizer.apply(day, rawBaseData) : 
                     rawBaseData.map(e => ({ ...e, adjustedSets: e.sets }));

    const list = document.getElementById("exList");
    if (!list) return;
    list.innerHTML = ""; exercises = []; remainingSets = [];

    mappedData.forEach((e, idx) => {
        const d = document.createElement("div");
        d.className = "exercise"; 
        d.dataset.total = e.adjustedSets; d.dataset.done = 0;
        if (e.adjustedSets === 0) d.classList.add("exercise-skipped");

        const cleanName = e.name.trim();
        const savedWeight = localStorage.getItem(`weight_ANGELOS_${cleanName}`) || "";

        d.innerHTML = `
            <div class="exercise-info" onclick="window.toggleSkipExercise(${idx})">
                <div class="set-counter">0/${e.adjustedSets}</div>
                <div class="exercise-name">${cleanName}</div>
                <input type="number" class="weight-input" data-name="${cleanName}" placeholder="kg" value="${savedWeight}" 
                onclick="event.stopPropagation()" onchange="saveWeight('${cleanName}', this.value)">
            </div>
            <div class="progress-box"><div class="progress-bar"></div></div>
        `;
        list.appendChild(d);
        exercises.push(d);
        remainingSets.push(parseInt(e.adjustedSets));
    });

    if (typeof calculateTotalTime === "function") calculateTotalTime();
    showVideo(0);
}

/* ===== WORKOUT CORE ENGINE ===== */
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
    
    let t = (phase === 0) ? prepTime : (phase === 1 ? exTime : restTime);
    let currentPhaseName = (phase === 0) ? "ΠΡΟΘΕΡΜΑΝΣΗ" : (phase === 1 ? "ΑΣΚΗΣΗ" : "ΔΙΑΛΕΙΜΜΑ");

    const label = document.getElementById("phaseTimer");
    if (label) {
        label.textContent = `${currentPhaseName} (${t})`;
        label.style.color = (phase === 1) ? "#4CAF50" : (phase === 2 ? "#FFC107" : "#64B5F6");
    }

    if (phase !== 2) showVideo(currentIdx);

    timer = setInterval(() => {
        t -= 1;
        if (remainingSeconds > 0) { remainingSeconds -= 1; updateTotalBar(); }
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
                if (window.updateAchievements) window.updateAchievements(e.querySelector(".weight-input").dataset.name);
                phase = 2; runPhase();
            } else {
                currentIdx = getNextIndexCircuit();
                if (currentIdx !== -1) { phase = 0; runPhase(); }
                else finishWorkout();
            }
        }
    }, 1000 / SPEED);
}

/* ===== VIDEO ENGINE ===== */
function showVideo(i) {
    const vid = document.getElementById("video");
    if (!vid) return;
    const phaseLabel = document.getElementById("phaseTimer") ? document.getElementById("phaseTimer").textContent : "";
    let name = (i === null || phaseLabel.includes("ΠΡΟΘΕΡΜΑΝΣΗ")) ? "Προθέρμανση" : 
               (exercises[i] ? exercises[i].querySelector(".weight-input").dataset.name : "default");

    if (typeof videoMap !== 'undefined') {
        let mappedVal = videoMap[name] || name.replace(/\s+/g, '');
        vid.src = `videos/${mappedVal}.mp4`;
        vid.play().catch(() => { vid.src = "videos/warmup.mp4"; vid.play(); });
    }
}

/* ===== UTILS ===== */
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

function skipToNextExercise() {
    if (exercises.length === 0) return;
    clearInterval(timer);
    currentIdx = getNextIndexCircuit();
    if (currentIdx !== -1) { phase = 0; if (running) runPhase(); else showVideo(currentIdx); }
    else finishWorkout();
}

function finishWorkout() {
    clearInterval(timer);
    const label = document.getElementById("phaseTimer");
    if (label) label.textContent = "ΟΛΟΚΛΗΡΩΣΗ...";
    if (window.PegasusCloud) window.PegasusCloud.push();
    setTimeout(() => location.reload(), 3000);
}

/* ===== CENTRALIZED INITIALIZATION (v17.7) ===== */
window.onload = () => {
    if (typeof emailjs !== 'undefined') emailjs.init('qsfyDrneUHP7zEFui');
    createNavbar();

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
        "btnSaveSettings": () => {
            localStorage.setItem("pegasus_weight", document.getElementById("userWeightInput").value);
            localStorage.setItem("pegasus_ex_time", document.getElementById("exerciseTimeInput").value);
            localStorage.setItem("pegasus_rest_time", document.getElementById("restTimeInput").value);
            alert("PEGASUS OS: Ρυθμίσεις Σώθηκαν!");
        },
        "btnSaveEMS": () => { if(window.saveEMSFinal) window.saveEMSFinal(); },
        "btnCloseEMS": () => { document.getElementById("emsModal").style.display = "none"; },
        "btnVaultUnlock": () => { if(window.attemptVaultUnlock) window.attemptVaultUnlock(); },
        "btnVaultSkip": () => { document.getElementById("pinModal").style.display = "none"; },
        "btnPhotoUploadTrigger": () => document.getElementById("photoUpload").click(),
        "btnClosePreview": () => { document.getElementById("previewPanel").style.display = "none"; }
    };

    Object.keys(masterUI).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.onclick = (e) => {
                e.stopPropagation();
                document.querySelectorAll('.pegasus-panel, #emsModal, #cardioPanel, #toolsPanel, #previewPanel').forEach(p => p.style.display = "none");
                const target = masterUI[btnId];
                if (typeof target === 'function') target();
                else {
                    const el = document.getElementById(target.id);
                    if (el) { el.style.display = "block"; if (target.init) target.init(); }
                }
            };
        }
    });

    // Hardware/Weather Sync
    const rainToggle = document.getElementById("rainToggle");
    if (rainToggle) rainToggle.onchange = () => {
        const activeBtn = document.querySelector('.navbar button.active');
        if (activeBtn) selectDay(activeBtn, activeBtn.textContent);
    };

    const libSearch = document.getElementById("librarySearch");
    if (libSearch) libSearch.onkeyup = () => { if(window.filterLibrary) window.filterLibrary(); };

    if (typeof fetchWeather === "function") fetchWeather();

    // Today selection logic
    const today = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"][new Date().getDay()];
    setTimeout(() => {
        document.querySelectorAll(".navbar button").forEach(b => { if (b.textContent === today) selectDay(b, today); });
    }, 300);
};

/* ===== GLOBAL HELPERS ===== */
window.saveWeight = saveWeight;
window.toggleSkipExercise = function(idx) {
    const exDiv = exercises[idx];
    if (!exDiv) return;
    exDiv.classList.toggle("exercise-skipped");
    remainingSets[idx] = exDiv.classList.contains("exercise-skipped") ? 0 : parseInt(exDiv.dataset.total);
    if (typeof calculateTotalTime === "function") calculateTotalTime();
};
