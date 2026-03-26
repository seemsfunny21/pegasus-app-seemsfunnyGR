/* ==========================================================================
   PEGASUS WORKOUT ENGINE - FINAL AUDITED EDITION (V12.9 - STABLE)
   Protocol: Native Metabolic Engine, Audio Unlocked, LIVE CLOUD SYNC
   Architecture: Unified Modular Connector (Desktop Master)
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

// --- AUDIO & CLOUD UNLOCK PROTOCOL ---
document.addEventListener('click', function() {
    if (!audioUnlocked) {
        sysAudio.play().then(() => {
            sysAudio.pause();
            sysAudio.currentTime = 0;
            audioUnlocked = true;
            console.log("PEGASUS: Audio & Cloud Protocol Unlocked.");
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

// --- NAVIGATION & WORKOUT SELECTION ---
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
            <div class="exercise-info" onclick="window.toggleSkipExercise ? window.toggleSkipExercise(${idx}) : null">
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
}

// --- CORE WORKOUT ENGINE ---
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
    if (nextIdx !== -1) { 
        currentIdx = nextIdx; 
        phase = 0; 
        if (running) runPhase(); 
        else if (typeof showVideo === "function") showVideo(currentIdx); 
    }
    else finishWorkout();
}

function saveWeight(exerciseName, weightValue) {
    localStorage.setItem(`weight_ANGELOS_${exerciseName}`, weightValue);
    if (window.PegasusCloud) window.PegasusCloud.push(true);
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

// --- UI EVENT MAPPING ---
window.onload = () => {
    createNavbar();
    
    // 1. ΑΥΤΟΜΑΤΗ ΕΠΙΛΟΓΗ ΤΡΕΧΟΥΣΑΣ ΗΜΕΡΑΣ (FIX)
    const daysGR = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
    const todayIndex = new Date().getDay(); // 0 για Κυριακή, 4 για Πέμπτη κλπ.
    const todayName = daysGR[todayIndex];
    
    const targetBtn = document.getElementById(`nav-${todayName}`);
    if (targetBtn) {
        console.log(`PEGASUS: Auto-selecting Today -> ${todayName}`);
        selectDay(targetBtn, todayName);
    } else {
        // Fallback αν για κάποιο λόγο δεν βρει το ID
        const firstBtn = document.querySelector(".navbar button");
        if (firstBtn) selectDay(firstBtn, firstBtn.textContent.trim());
    }

    // 2. ΣΥΝΔΕΣΗ ΒΑΣΙΚΩΝ ΚΟΥΜΠΙΩΝ ΕΛΕΓΧΟΥ
    const btnStart = document.getElementById("btnStart");
    if (btnStart) btnStart.onclick = startPause;

    const btnNext = document.getElementById("btnNext");
    if (btnNext) btnNext.onclick = skipToNextExercise;

    const btnWarmup = document.getElementById("btnWarmup");
    if (btnWarmup && typeof startWarmup === "function") btnWarmup.onclick = startWarmup;

    // 3. MODULAR PANEL TOGGLES
    const uiBtns = { 
        "btnCalendarUI": "calendarPanel", 
        "btnAchUI": "achievementsPanel", 
        "btnFoodUI": "foodPanel",
        "btnSettingsUI": "settingsPanel",
        "btnToolsUI": "toolsPanel",
        "btnPreviewUI": "previewPanel"
    };

    Object.keys(uiBtns).forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.onclick = () => {
            const panel = document.getElementById(uiBtns[id]);
            const isVisible = panel.style.display === "block";
            
            document.querySelectorAll(".pegasus-panel").forEach(p => p.style.display = "none");
            
            panel.style.display = isVisible ? "none" : "block";
            
            if (!isVisible) {
                if (id === "btnAchUI" && window.renderAchievements) window.renderAchievements();
                if (id === "btnFoodUI" && window.updateFoodUI) window.updateFoodUI();
                if (id === "btnCalendarUI" && window.renderCalendar) window.renderCalendar();
                if (id === "btnPreviewUI" && window.showPreview) window.showPreview();
            }
        };
    });

    // 4. ΕΙΔΙΚΑ ΚΟΥΜΠΙΑ
    const btnManualEmail = document.getElementById("btnManualEmail");
    if (btnManualEmail) btnManualEmail.onclick = () => window.PegasusReporting?.sendEmail();

    const btnOpenGallery = document.getElementById("btnOpenGallery");
    if (btnOpenGallery) btnOpenGallery.onclick = () => {
        document.querySelectorAll(".pegasus-panel").forEach(p => p.style.display = "none");
        document.getElementById("galleryPanel").style.display = "block";
        window.GalleryEngine?.render();
    };

    console.log("✅ PEGASUS APP ENGINE: Unified Connector & Auto-Day Ready.");
};
