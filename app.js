/* ==========================================================================
   PEGASUS WORKOUT ENGINE - CLEAN SWEEP v17.0
   Protocol: Zero-Time Logic, Metabolic Sync, Partner Awareness
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

/* ===== AUDIO SYSTEM ===== */
let sysAudio = new Audio('videos/beep.mp3');
let audioUnlocked = false;

document.addEventListener('click', function() {
    if (!audioUnlocked) {
        sysAudio.play().then(() => {
            sysAudio.pause();
            sysAudio.currentTime = 0;
            audioUnlocked = true;
            if (window.PegasusCloud) window.PegasusCloud.pull();
        }).catch(e => console.warn("Audio unlock pending"));
    }
}, { once: true });

const playBeep = (volume = 1) => {
    if (!muted) {
        sysAudio.volume = volume;
        sysAudio.currentTime = 0; 
        sysAudio.play().catch(e => {});
    }
};

/* ===== NAVIGATION & SELECTION ===== */
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
    document.querySelectorAll(".navbar button").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");

    clearInterval(timer);
    running = false;
    phase = 0;
    currentIdx = 0;
    document.getElementById("btnStart").innerHTML = "Έναρξη";

    // Λήψη προγράμματος από το Weather Handler (Dynamic Logic)
    let rawData = (window.getFinalProgram) ? window.getFinalProgram(day) : (window.program[day] || []);
    
    // Βελτιστοποίηση μέσω Optimizer
    let mappedData = window.PegasusOptimizer ? window.PegasusOptimizer.apply(day, rawData) : rawData.map(e => ({ ...e, adjustedSets: e.sets, isCompleted: false }));

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

        if (e.isCompleted || e.adjustedSets === 0) {
            d.classList.add("exercise-skipped");
        }

        const safeName = e.name.trim();
        const weightValue = (window.loadPartnerWeight) ? window.loadPartnerWeight(safeName) : (localStorage.getItem(`weight_${safeName}`) || "");

        d.innerHTML = `
            <div class="exercise-info" onclick="window.toggleSkipExercise(${idx})">
                <div class="set-counter">0/${e.adjustedSets}</div>
                <div class="exercise-name">${e.isCompleted ? `${safeName} 🎯` : safeName}</div>
                <input type="number" class="weight-input" data-name="${safeName}" placeholder="kg" value="${weightValue}" 
                       onclick="event.stopPropagation()" onchange="window.saveWeight('${safeName}', this.value)">
            </div>
            <div class="progress-box"><div class="progress-bar"></div></div>
        `;
        list.appendChild(d);
        exercises.push(d);
        remainingSets.push(parseInt(e.adjustedSets));
    });

    if (window.calculateTotalTime) window.calculateTotalTime(); 
    showVideo(0);
}

/* ===== ENGINE LOGIC ===== */
function startPause() {
    if (exercises.length === 0) return;
    running = !running;
    document.getElementById("btnStart").innerHTML = running ? "Παύση" : "Συνέχεια";
    if (running) runPhase();
    else clearInterval(timer);
}

function runPhase() {
    if (!running) return;
    clearInterval(timer);

    if (remainingSets.every(s => s <= 0)) { finishWorkout(); return; }

    const e = exercises[currentIdx];
    const exName = e.querySelector(".weight-input").getAttribute("data-name");

    exercises.forEach(ex => { ex.style.borderColor = "#222"; ex.style.background = "transparent"; });
    
    // Χρωματική σήμανση βάσει Turn (Angelos vs Partner)
    const isAngelos = window.partnerData ? (window.partnerData.isUser1Turn) : true;
    e.style.borderColor = isAngelos ? "#4CAF50" : "#00bcd4";
    e.style.background = isAngelos ? "rgba(76, 175, 80, 0.1)" : "rgba(0, 188, 212, 0.1)";

    let t = workoutPhases[phase].d;
    let labelText = phase === 0 ? "ΠΡΟΕΤΟΙΜΑΣΙΑ" : (phase === 1 ? "ΑΣΚΗΣΗ" : "ΔΙΑΛΕΙΜΜΑ");

    timer = setInterval(() => {
        t--;
        remainingSeconds = Math.max(0, remainingSeconds - 1);
        updateTotalBar();

        const label = document.getElementById("phaseTimer");
        if (label) {
            label.textContent = `${labelText} (${Math.max(0, t)})`;
            label.style.color = phase === 1 ? "#4CAF50" : "#888";
        }

        // Live Metabolic Tracking
        if (phase === 1 && window.MetabolicEngine) {
            window.MetabolicEngine.updateTracking(1, exName);
        }

        if (t <= 0) {
            clearInterval(timer);
            playBeep();
            
            if (phase === 1) {
                let done = ++e.dataset.done;
                remainingSets[currentIdx]--;
                e.querySelector(".set-counter").textContent = `${done}/${e.dataset.total}`;
                
                if (window.updateAchievements) window.updateAchievements(exName);
                if (window.logPegasusSet) window.logPegasusSet(exName);
            }

            phase = (phase + 1) % 3;
            
            // Partner Turn Management
            if (phase === 2 && window.partnerData && window.partnerData.isActive) {
                window.partnerData.isUser1Turn = !window.partnerData.isUser1Turn;
            }

            if (phase === 0) currentIdx = getNextIndexCircuit();
            
            if (currentIdx !== -1) runPhase(); else finishWorkout();
        }
    }, 1000 / SPEED);
}

function getNextIndexCircuit() {
    for (let i = 0; i < remainingSets.length; i++) {
        let idx = (currentIdx + i + 1) % remainingSets.length;
        if (remainingSets[idx] > 0 && !exercises[idx].classList.contains("exercise-skipped")) return idx;
    }
    return -1;
}

/* ===== UTILS & UI ===== */
window.saveWeight = function(name, val) {
    if (window.savePartnerWeight) window.savePartnerWeight(name, val);
    else localStorage.setItem(`weight_${name}`, val);
    if (window.PegasusCloud) window.PegasusCloud.push(true);
};

window.calculateTotalTime = function() {
    totalSeconds = 0;
    exercises.forEach(ex => {
        if (!ex.classList.contains("exercise-skipped")) {
            const sets = parseInt(ex.dataset.total);
            totalSeconds += sets * (workoutPhases[0].d + workoutPhases[1].d + workoutPhases[2].d);
        }
    });
    remainingSeconds = totalSeconds;
    updateTotalBar();
};

function updateTotalBar() {
    const bar = document.getElementById("totalProgress");
    const text = document.getElementById("totalProgressTime");
    if (!bar || totalSeconds === 0) return;
    
    const progress = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
    bar.style.width = `${progress}%`;
    
    const m = Math.floor(remainingSeconds / 60);
    const s = remainingSeconds % 60;
    if (text) text.textContent = `${m}:${s.toString().padStart(2, '0')}`;
}

function finishWorkout() {
    clearInterval(timer);
    running = false;
    const label = document.getElementById("phaseTimer");
    if (label) { label.textContent = "ΟΛΟΚΛΗΡΩΣΗ"; label.style.color = "#4CAF50"; }
    
    if (window.PegasusReporting) {
        window.PegasusReporting.prepareAndSaveReport(localStorage.getItem("pegasus_today_kcal"));
    }
    
    setTimeout(() => location.reload(), 3000);
}

window.onload = () => {
    createNavbar();
    document.getElementById("btnStart").onclick = startPause;
    document.getElementById("btnNext").onclick = () => { clearInterval(timer); phase = 2; runPhase(); };

    // Auto-select Today
    const days = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
    const today = days[new Date().getDay()];
    setTimeout(() => {
        const btn = document.getElementById(`nav-${today}`);
        if (btn) selectDay(btn, today);
    }, 500);
};