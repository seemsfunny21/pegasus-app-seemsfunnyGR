/* ==========================================================================
   PEGASUS WORKOUT ENGINE - FINAL AUDITED EDITION (V6.7 - STABLE)
   Protocol: Native Metabolic Engine, Audio Unlocked, LIVE CLOUD SYNC
   FIX: Array Sync Integrity & Local Storage Commit Optimization
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

var workoutPhases = [
    { n: "Προετοιμασία", d: 10 }, 
    { n: "Άσκηση", d: parseInt(localStorage.getItem("pegasus_ex_time")) || 45 },     
    { n: "Διάλειμμα", d: parseInt(localStorage.getItem("pegasus_rest_time")) || 60 }     
];

var userWeight = parseFloat(localStorage.getItem("pegasus_weight")) || 74;

let sysAudio = new Audio('videos/beep.mp3');
let audioUnlocked = false;

document.addEventListener('click', function() {
    if (!audioUnlocked) {
        sysAudio.play().then(() => {
            sysAudio.pause();
            sysAudio.currentTime = 0;
            audioUnlocked = true;
            if (window.PegasusCloud && typeof window.PegasusCloud.pull === "function") {
                window.PegasusCloud.pull();
            }
        }).catch(err => console.warn("Audio unlock pending"));
    }
}, { once: true });

const playBeep = (volume = 1) => {
    if (!muted) {
        sysAudio.volume = volume;
        sysAudio.currentTime = 0; 
        sysAudio.play().catch(e => {});
    }
};

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

    if (window.PegasusCloud) window.PegasusCloud.push(true);

    clearInterval(timer);
    timer = null;
    running = false;
    phase = 0;
    currentIdx = 0;
    const sBtn = document.getElementById("btnStart");
    if (sBtn) sBtn.innerHTML = "Έναρξη";

    let rawBaseData = (typeof getFinalProgram !== 'undefined') ? [...getFinalProgram(day)] : [];
    let mappedData = (window.PegasusOptimizer) ? PegasusOptimizer.apply(day, rawBaseData) : rawBaseData;

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
            d.classList.add("exercise-skipped");
            d.style.pointerEvents = "none"; 
        }

        const cleanName = e.name.trim();
        const savedWeight = localStorage.getItem(`weight_ANGELOS_${cleanName}`) || localStorage.getItem(`weight_${cleanName}`) || "";

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
    if (typeof showVideo === "function") showVideo(0);
    if (typeof initDragDrop === "function") initDragDrop();
}

// FIX: Πλήρης συγχρονισμός και του remainingSets κατά το reorder
function reorderExercises() {
    const list = document.getElementById("exList");
    const newExerciseElements = Array.from(list.querySelectorAll(".exercise"));
    
    exercises = newExerciseElements;
    remainingSets = newExerciseElements.map(el => {
        return parseInt(el.dataset.total) - parseInt(el.dataset.done);
    });
    
    const newOrderNames = newExerciseElements.map(div => div.querySelector(".exercise-name").textContent.trim());
    const activeBtn = document.querySelector(".navbar button.active");
    if (activeBtn) localStorage.setItem(`pegasus_order_${activeBtn.textContent.trim()}`, JSON.stringify(newOrderNames));
}

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
    clearInterval(timer);

    if (remainingSets.every(s => s <= 0)) {
        finishWorkout();
        return;
    }

    const e = exercises[currentIdx];
    if (!e) return;
    
    const exName = e.querySelector(".exercise-name").textContent.trim();
    exercises.forEach(ex => { ex.style.borderColor = "#222"; ex.style.background = "transparent"; });
    
    const isAngelosTurn = typeof partnerData !== 'undefined' ? (!partnerData.isActive || partnerData.isUser1Turn) : true;
    e.style.borderColor = isAngelosTurn ? "#4CAF50" : "#00bcd4";

    let t = workoutPhases[phase].d;
    let localRestKcal = 0;

    timer = setInterval(() => {
        t -= 1;
        remainingSeconds = Math.max(0, remainingSeconds - 1);
        updateTotalBar();

        if (window.MetabolicEngine && phase === 1) {
            window.MetabolicEngine.updateTracking(1, exName);
        } else if (phase === 2) {
            localRestKcal += (userWeight * 0.0008);
        }

        const label = document.getElementById("phaseTimer");
        if (label) label.textContent = `ΦΑΣΗ ${phase}: ${Math.ceil(t)}s`;

        if (t <= 0) {
            clearInterval(timer);
            playBeep();
            
            if (phase === 0) { phase = 1; runPhase(); }
            else if (phase === 1) {
                let done = parseInt(e.dataset.done) + 1;
                e.dataset.done = done;
                remainingSets[currentIdx] = parseInt(e.dataset.total) - done;
                e.querySelector(".set-counter").textContent = `${done}/${e.dataset.total}`;
                
                if (window.updateAchievements) window.updateAchievements(exName);
                if (window.logPegasusSet) window.logPegasusSet(exName);
                
                phase = 2;
                runPhase();
            } else if (phase === 2) {
                if (localRestKcal > 0) {
                    let cur = parseFloat(localStorage.getItem("pegasus_today_kcal")) || 0;
                    localStorage.setItem("pegasus_today_kcal", (cur + localRestKcal).toFixed(2));
                }
                currentIdx = getNextIndexCircuit();
                if (currentIdx !== -1) { phase = 0; runPhase(); }
                else finishWorkout();
            }
        }
    }, 1000 / SPEED);
}

function getNextIndexCircuit() {
    for (let i = 1; i <= remainingSets.length; i++) {
        let idx = (currentIdx + i) % remainingSets.length;
        if (remainingSets[idx] > 0 && !exercises[idx].classList.contains("exercise-skipped")) return idx;
    }
    return -1;
}

function skipToNextExercise() {
    clearInterval(timer);
    let nextIdx = getNextIndexCircuit();
    if (nextIdx !== -1) { currentIdx = nextIdx; phase = 0; if (running) runPhase(); else showVideo(currentIdx); }
    else finishWorkout();
}

function saveWeight(exerciseName, weightValue) {
    localStorage.setItem(`weight_ANGELOS_${exerciseName}`, weightValue);
    if (window.PegasusCloud) window.PegasusCloud.push(true);
}

function showVideo(i) {
    if (!exercises[i]) return;
    const name = exercises[i].querySelector(".exercise-name").textContent.trim();
    const vid = document.getElementById("video");
    if (vid && window.videoMap) {
        const mapped = window.videoMap[name] || "default";
        vid.src = `videos/${mapped}.mp4`;
        vid.play().catch(() => {});
    }
}

function updateTotalBar() {
    const bar = document.getElementById("totalProgress");
    if (bar && totalSeconds > 0) {
        const progress = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
        bar.style.width = Math.min(100, progress) + "%";
    }
}

function finishWorkout() {
    clearInterval(timer);
    if (window.PegasusReporting) {
        const kcal = localStorage.getItem("pegasus_today_kcal") || "0";
        window.PegasusReporting.prepareAndSaveReport(kcal);
    }
    alert("Προπόνηση Ολοκληρώθηκε!");
    location.reload();
}

window.onload = () => {
    createNavbar();
    document.getElementById("btnStart").onclick = startPause;
    document.getElementById("btnNext").onclick = skipToNextExercise;
    
    // UI Panel Logic
    const uiBtns = { "btnCalendarUI": "calendarPanel", "btnAchUI": "achievementsPanel", "btnFoodUI": "foodPanel" };
    Object.keys(uiBtns).forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.onclick = () => {
            document.querySelectorAll(".pegasus-panel").forEach(p => p.style.display = "none");
            document.getElementById(uiBtns[id]).style.display = "block";
            if (id === "btnAchUI" && window.renderAchievements) window.renderAchievements();
        };
    });
};
