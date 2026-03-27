/* ==========================================================================
   PEGASUS WORKOUT ENGINE - v19.0 (RESTORED FULL VERSION)
   Protocol: Full UI Integration, Native Metabolic Engine, Optimized Spillover
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

/* ===== AUDIO & CLOUD SYNC ===== */
let sysAudio = new Audio('videos/beep.mp3');
let audioUnlocked = false;

document.addEventListener('click', function() {
    if (!audioUnlocked) {
        sysAudio.play().then(() => {
            sysAudio.pause(); sysAudio.currentTime = 0;
            audioUnlocked = true;
            if (window.PegasusCloud) window.PegasusCloud.pull();
        }).catch(err => console.warn("Audio unlock pending", err));
    }
}, { once: true });

const playBeep = (volume = 1) => {
    if (!muted) {
        sysAudio.volume = volume; sysAudio.currentTime = 0; 
        sysAudio.play().catch(e => console.log("Audio blocked", e));
    }
};

/* ===== NAVIGATION & DAY SELECTION ===== */
function createNavbar() {
    const nav = document.getElementById("navbar");
    if (!nav) return;
    const days = ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο", "Κυριακή"];
    nav.innerHTML = "";
    days.forEach((d) => {
        const b = document.createElement("button");
        b.textContent = d;
        b.id = `nav-${d}`;
        b.onclick = () => selectDay(b, d);
        nav.appendChild(b);
    });
}

function selectDay(btn, day) {
    document.querySelectorAll(".navbar button").forEach(b => {
        b.classList.remove("active");
        b.style.backgroundColor = "#000"; b.style.color = "#fff";
    });
    if (btn) {
        btn.classList.add("active");
        btn.style.backgroundColor = "#4CAF50";
    }

    clearInterval(timer); timer = null; running = false; phase = 0; currentIdx = 0;
    const sBtn = document.getElementById("btnStart");
    if (sBtn) sBtn.innerHTML = "Έναρξη";

    const isRainy = (typeof window.isRaining === 'function') ? window.isRaining() : false;
    let rawBaseData = (typeof window.calculateDailyProgram !== 'undefined') ? 
                      window.calculateDailyProgram(day, isRainy) : [];

    let mappedData = window.PegasusOptimizer ? window.PegasusOptimizer.apply(day, rawBaseData) : rawBaseData;

    mappedData.sort((a, b) => (a.adjustedSets === 0) ? 1 : (b.adjustedSets === 0) ? -1 : 0);

    const list = document.getElementById("exList");
    if (!list) return;
    list.innerHTML = ""; exercises = []; remainingSets = [];

    mappedData.forEach((e, idx) => {
        const d = document.createElement("div");
        d.className = "exercise"; 
        d.dataset.total = e.adjustedSets; d.dataset.done = 0;
        
        if (e.adjustedSets === 0) {
            d.classList.add("exercise-skipped"); d.style.opacity = "0.2"; d.style.pointerEvents = "none";
        }

        const cleanName = e.name.trim();
        const savedWeight = localStorage.getItem(`weight_ANGELOS_${cleanName}`) || "";

        d.innerHTML = `
            <div class="exercise-info" onclick="window.toggleSkipExercise(${idx})">
                <div class="set-counter">0/${e.adjustedSets}</div>
                <div class="exercise-name">${cleanName}</div>
                <input type="number" class="weight-input" data-name="${cleanName}" placeholder="kg" value="${savedWeight}" onclick="event.stopPropagation()" onchange="saveWeight('${cleanName}', this.value)">
            </div>
            <div class="progress-box"><div class="progress-bar"></div></div>
        `;
        list.appendChild(d);
        exercises.push(d);
        remainingSets.push(parseInt(e.adjustedSets));
    });

    if (typeof calculateTotalTime === "function") calculateTotalTime();
    if (typeof showVideo === "function") showVideo(0);
}

/* ===== CORE ENGINE ===== */
function startPause() {
    if (exercises.length === 0) return;
    running = !running;
    document.getElementById("btnStart").innerHTML = running ? "Παύση" : "Συνέχεια";
    if (running) runPhase();
    else { clearInterval(timer); timer = null; }
}

function runPhase() {
    if (!running) return;
    clearInterval(timer);
    if (remainingSets.every(s => s <= 0)) return finishWorkout();

    const e = exercises[currentIdx];
    const wInput = e.querySelector(".weight-input");
    const exName = wInput ? wInput.getAttribute("data-name") : "Άγνωστο";

    exercises.forEach(ex => { ex.style.borderColor = "#222"; ex.style.background = "transparent"; });
    e.style.borderColor = "#4CAF50"; e.style.background = "rgba(76, 175, 80, 0.1)";

    let t = phase === 0 ? workoutPhases[0].d : (phase === 1 ? workoutPhases[1].d : workoutPhases[2].d);
    let currentPhaseName = phase === 0 ? "ΠΡΟΕΤΟΙΜΑΣΙΑ" : (phase === 1 ? "ΑΣΚΗΣΗ" : "ΔΙΑΛΕΙΜΜΑ");

    if (phase !== 2) showVideo(currentIdx);

    timer = setInterval(() => {
        t--; remainingSeconds = Math.max(0, remainingSeconds - 1); updateTotalBar();

        if (window.MetabolicEngine && phase === 1) window.MetabolicEngine.updateTracking(1, exName);

        const label = document.getElementById("phaseTimer");
        if (label) {
            label.textContent = `${currentPhaseName} (${Math.ceil(t)})`;
            label.style.color = phase === 1 ? "#4CAF50" : (phase === 2 ? "#FFC107" : "#64B5F6");
        }

        if (t <= 0) {
            clearInterval(timer); playBeep();
            if (phase === 0) { phase = 1; runPhase(); }
            else if (phase === 1) {
                let done = ++e.dataset.done;
                e.querySelector(".set-counter").textContent = `${done}/${e.dataset.total}`;
                remainingSets[currentIdx] = parseInt(e.dataset.total) - done;
                if (window.logPegasusSet) window.logPegasusSet(exName);
                phase = 2; runPhase();
            } else {
                let nextIdx = remainingSets.findIndex((s, i) => s > 0 && i >= (currentIdx + 1) % remainingSets.length);
                if (nextIdx === -1) nextIdx = remainingSets.findIndex(s => s > 0);
                if (nextIdx !== -1) { currentIdx = nextIdx; phase = 0; runPhase(); }
                else finishWorkout();
            }
        }
    }, 1000 / SPEED);
}

/* ===== UI MODAL CONTROLS (RESTORED) ===== */
window.onload = () => {
    createNavbar();
    document.getElementById("btnStart").onclick = startPause;
    document.getElementById("btnNext").onclick = () => { clearInterval(timer); phase = 2; runPhase(); };

    const uiBtns = { 
        "btnCalendarUI": "calendarPanel", "btnAchUI": "achievementsPanel", 
        "btnSettingsUI": "settingsPanel", "btnFoodUI": "foodPanel", 
        "btnToolsUI": "toolsPanel", "btnPreviewUI": "previewPanel",
        "btnCardioUI": "cardioPanel", "btnGalleryUI": "galleryPanel", "btnEMSUI": "emsModal"
    };

    Object.keys(uiBtns).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.onclick = (e) => {
                e.stopPropagation();
                Object.values(uiBtns).forEach(id => { const el = document.getElementById(id); if (el) el.style.display = "none"; });
                const targetPanel = document.getElementById(uiBtns[btnId]);
                if (targetPanel) {
                    targetPanel.style.display = "block";
                    if (uiBtns[btnId] === "previewPanel") openExercisePreview();
                    if (uiBtns[btnId] === "calendarPanel" && window.renderCalendar) window.renderCalendar();
                    if (uiBtns[btnId] === "foodPanel" && window.renderFood) window.renderFood();
                }
            };
        }
    });

    if (typeof fetchWeather === "function") fetchWeather();
    const todayName = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"][new Date().getDay()];
    setTimeout(() => { document.querySelectorAll(".navbar button").forEach(b => { if (b.textContent === todayName) selectDay(b, todayName); }); }, 300);
};

/* ===== PREVIEW & VIDEO ===== */
function openExercisePreview() {
    const activeBtn = document.querySelector(".navbar button.active");
    if (!activeBtn) return;
    const day = activeBtn.textContent.trim();
    const isRainy = (typeof window.isRaining === 'function') ? window.isRaining() : false;
    let raw = window.calculateDailyProgram(day, isRainy);
    const data = window.PegasusOptimizer ? window.PegasusOptimizer.apply(day, raw) : raw;
    const content = document.getElementById('previewContent');
    content.innerHTML = '';
    data.filter(ex => ex.adjustedSets > 0).forEach(ex => {
        let vidId = (typeof videoMap !== 'undefined' && videoMap[ex.name]) ? videoMap[ex.name] : ex.name.replace(/\s+/g, '').toLowerCase();
        let ext = (vidId === "cycling") ? ".jpg" : ".png";
        content.innerHTML += `<div class="preview-item"><img src="images/${vidId}${ext}" onerror="this.src='images/placeholder.jpg'"><p>${ex.name} (${ex.adjustedSets} set)</p></div>`;
    });
    document.getElementById('previewPanel').style.display = 'block';
}

function showVideo(i) {
    if (!exercises[i]) return;
    const name = exercises[i].querySelector(".weight-input").getAttribute("data-name");
    const vid = document.getElementById("video");
    if (typeof videoMap !== 'undefined') {
        let m = videoMap[name] || name.replace(/\s+/g, '').toLowerCase();
        vid.src = `videos/${m}.mp4`; vid.play().catch(() => {});
    }
}

/* ===== TRACKING & UTILS ===== */
function saveWeight(n, v) { localStorage.setItem(`weight_ANGELOS_${n}`, v); if (window.PegasusCloud) window.PegasusCloud.push(true); }

window.calculateTotalTime = function() {
    totalSeconds = exercises.reduce((acc, ex) => acc + (ex.classList.contains("exercise-skipped") ? 0 : parseInt(ex.dataset.total) * (workoutPhases[0].d + workoutPhases[1].d + workoutPhases[2].d)), 0);
    remainingSeconds = totalSeconds; updateTotalBar();
};

function updateTotalBar() {
    const bar = document.getElementById("totalProgress");
    if (bar) bar.style.width = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 + "%" : "0%";
    const timeText = document.getElementById("totalProgressTime");
    if (timeText) { const m = Math.floor(remainingSeconds / 60); const s = remainingSeconds % 60; timeText.textContent = `${m}:${String(s).padStart(2, "0")}`; }
}

window.logPegasusSet = function(exName) {
    let h = JSON.parse(localStorage.getItem('pegasus_weekly_history')) || { "Στήθος": 0, "Πλάτη": 0, "Ώμοι": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 };
    const ex = window.exercisesDB?.find(e => e.name.trim() === exName.trim());
    if (ex) { h[ex.muscleGroup] += (exName.includes("Ποδηλασία") ? 18 : 1); localStorage.setItem('pegasus_weekly_history', JSON.stringify(h)); if (window.MuscleProgressUI) window.MuscleProgressUI.render(); }
};

function finishWorkout() { clearInterval(timer); running = false; document.getElementById("phaseTimer").textContent = "ΟΛΟΚΛΗΡΩΣΗ..."; if (window.PegasusReporting) window.PegasusReporting.prepareAndSaveReport(localStorage.getItem("pegasus_today_kcal")); setTimeout(() => location.reload(), 3000); }

window.toggleSkipExercise = function(idx) {
    const exDiv = exercises[idx]; if (!exDiv) return;
    exDiv.classList.toggle("exercise-skipped");
    let skipped = exDiv.classList.contains("exercise-skipped");
    exDiv.style.opacity = skipped ? "0.2" : "1";
    remainingSets[idx] = skipped ? 0 : (parseInt(exDiv.dataset.total) - parseInt(exDiv.dataset.done));
    calculateTotalTime();
};
