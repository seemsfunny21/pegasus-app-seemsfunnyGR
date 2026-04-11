/* ==========================================================================
   PEGASUS WORKOUT ENGINE - v10.18 (DYNAMIC VOLUME-BASED METABOLICS)
   Protocol: Strict Data Isolation & Live Weight-Adjusted Burn Rate
   ========================================================================== */

// 0. GLOBAL SCOPE BRIDGE
var P_M = window.PegasusManifest; 

window.masterUI = window.masterUI || {}; 

if (typeof M === 'undefined') {
    window.M = P_M;
} else {
    console.log("🛡️ PEGASUS BRIDGE: M is already linked globally.");
}

if (!P_M) {
    console.warn("⚠️ Manifest not found. Initializing Emergency Link...");
    P_M = window.PegasusManifest;
    if (typeof M === 'undefined') window.M = P_M;
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

/* ===== 2. CORE VARIABLES (MANIFEST ALIGNED) ===== */
var exercises = [];
var remainingSets = [];
var currentIdx = 0;
var phase = 0; 
var running = false;
var timer = null;
var totalSeconds = 0;
var remainingSeconds = 0;

// 🎯 ΑΠΟΜΟΝΩΜΕΝΟΣ ΜΕΤΡΗΤΗΣ ΘΕΡΜΙΔΩΝ ΣΥΝΕΔΡΙΑΣ
var sessionActiveKcal = 0;

var muted = localStorage.getItem(P_M?.system.mute || "pegasus_mute_state") === "true";
var TURBO_MODE = localStorage.getItem(P_M?.system.turbo || "pegasus_turbo_state") === "true";
var SPEED = TURBO_MODE ? 10 : 1;

var workoutPhases = [
    { n: "Προετοιμασία", d: 10 }, 
    { n: "Άσκηση", d: parseInt(localStorage.getItem(P_M?.user.ex_time || "pegasus_ex_time")) || 45 },     
    { n: "Διάλειμμα", d: parseInt(localStorage.getItem(P_M?.user.rest_time || "pegasus_rest_time")) || 60 }      
];

var userWeight = parseFloat(localStorage.getItem(P_M?.user.weight || "pegasus_weight")) || 74;

/* ===== 2.5 DYNAMIC UI KCAL CONTROLLER ===== */
window.updateKcalUI = function() {
    const kcalDisplay = document.querySelector(".kcal-value");
    const kcalLabel = document.querySelector(".kcal-label"); 
    
    if (!kcalDisplay) return;

    // STATE CHECK: Είναι σε εξέλιξη η προπόνηση;
    const isWorkoutActive = running || currentIdx > 0 || phase > 0;

    if (isWorkoutActive) {
        // ACTIVE WORKOUT: Δείξε τον LIVE εσωτερικό μετρητή (Κίτρινο)
        kcalDisplay.textContent = parseFloat(sessionActiveKcal).toFixed(1);
        kcalDisplay.style.color = "#FFC107"; 
        if (kcalLabel) kcalLabel.textContent = "KCAL ΠΡΟΠΟΝΗΣΗΣ";
    } else {
        // IDLE: Δείξε τις συνολικές εβδομαδιαίες θερμίδες (Πράσινο)
        let weeklyKcal = localStorage.getItem("pegasus_weekly_kcal") || "0.0";
        kcalDisplay.textContent = parseFloat(weeklyKcal).toFixed(1);
        kcalDisplay.style.color = "#4CAF50"; 
        if (kcalLabel) kcalLabel.textContent = "KCAL ΕΒΔΟΜΑΔΑΣ";
    }
};

/* ===== 3. AUDIO SYSTEM (INTERACTION SYNC) ===== */
let sysAudio = new Audio('videos/beep.mp3');
let audioUnlocked = false;

document.addEventListener('click', function() {
    if (!audioUnlocked) {
        sysAudio.play().then(() => {
            sysAudio.pause(); 
            sysAudio.currentTime = 0;
            audioUnlocked = true;
            console.log("PEGASUS OS: Audio Unlocked & Ready.");

            if (window.PegasusCloud && typeof window.PegasusCloud.pull === "function") {
                window.PegasusCloud.pull();
            }
        }).catch(err => console.warn("PEGASUS OS: Audio unlock pending user action", err));
    }
}, { once: true });

const playBeep = (volume = 1) => {
    if (!muted) {
        sysAudio.volume = volume; 
        sysAudio.currentTime = 0; 
        sysAudio.play().catch(e => console.log("Audio execution blocked by browser policy", e));
    }
};


function selectDay(btn, day) {
    if (typeof window.program === 'undefined' || !window.program) {
        console.error("❌ PEGASUS CRITICAL: window.program is missing! Check data.js");
        return; 
    }

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

    // 🎯 HARD RESET
    clearInterval(timer); timer = null; running = false; phase = 0; currentIdx = 0;
    sessionActiveKcal = 0; 
    localStorage.setItem("pegasus_session_kcal", "0.0");
    
    const sBtn = document.getElementById("btnStart");
    if (sBtn) sBtn.innerHTML = "Έναρξη";

    if (typeof window.updateKcalUI === "function") window.updateKcalUI();

    const isRainy = (typeof window.isRaining === 'function') ? window.isRaining() : false;
    let rawBaseData = [];
    
    if ((day === "Σάββατο" || day === "Κυριακή") && isRainy) {
        rawBaseData = [
            { name: "Chest Press", sets: 5, muscleGroup: "Στήθος" },
            { name: "Low Seated Row", sets: 5, muscleGroup: "Πλάτη" },
            { name: "Ab Crunches", sets: 3, muscleGroup: "Κορμός" }
        ];
    } else {
        rawBaseData = (window.program[day]) ? [...window.program[day]] : [];
    }

    let mappedData = window.PegasusOptimizer ? 
                     window.PegasusOptimizer.apply(day, rawBaseData) : 
                     rawBaseData.map(e => ({ ...e, adjustedSets: e.sets, isCompleted: false }));

    const list = document.getElementById("exList");
    if (!list) return;
    list.innerHTML = ""; 
    
    exercises = []; 
    remainingSets = []; 

    mappedData.forEach((e, idx) => {
        if (!e.name || e.name === "αα" || e.adjustedSets < 0.1) return;

        let finalSets = parseFloat(e.adjustedSets);
        const d = document.createElement("div");
        d.className = "exercise"; 
        d.dataset.total = finalSets; 
        d.dataset.done = 0; 
        d.dataset.index = idx;

        const cleanName = e.name.trim();
        const safeName = cleanName.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const savedWeight = localStorage.getItem(`weight_ΑΓΓΕΛΟΣ_${cleanName}`) || localStorage.getItem(`weight_${cleanName}`) || "";

        d.innerHTML = `
            <div class="exercise-info" onclick="window.toggleSkipExercise(${idx})">
                <div class="set-counter">0/${finalSets}</div>
                <div class="exercise-name">${cleanName}</div> 
                <input type="number" 
                       id="weight-${idx}" 
                       name="workout-weight" 
                       class="weight-input" 
                       data-name="${safeName}" 
                       placeholder="kg" 
                       value="${savedWeight}" 
                       onclick="event.stopPropagation()" 
                       onchange="saveWeight('${cleanName}', this.value)">
            </div>
            <div class="progress-box">
                <div class="progress-bar"></div>
            </div>
        `;
        list.appendChild(d);
        exercises.push(d);
        remainingSets.push(finalSets);
    });

    if (typeof calculateTotalTime === "function") calculateTotalTime();
    
    setTimeout(() => {
        if (typeof showVideo === "function") showVideo(0);
        
        if (exercises.length === 0) {
            list.innerHTML = `<div style="padding:20px; color:#666; text-align:center;">🌿 Ημέρα Αποθεραπείας (History: ${day})</div>`;
        }
    }, 150);
}

/* ===== 4. NAVIGATION BINDING (STRICT HTML BRIDGE) ===== */
function createNavbar() {
    // Τα ονόματα ΠΡΕΠΕΙ να ταιριάζουν ακριβώς με τα id="nav-Όνομα" του HTML σου
    const days = ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο", "Κυριακή"];
    
    days.forEach((d) => {
        const btn = document.getElementById(`nav-${d}`);
        if (btn) {
            // Δίνουμε "ζωή" στο στατικό κουμπί
            btn.onclick = () => selectDay(btn, d);
        } else {
            console.warn(`[UI ALERT]: Button nav-${d} missing from HTML!`);
        }
    });
}

/* ===== 5. WORKOUT ENGINE CORE ===== */
function startPause() {
    if (exercises.length === 0) return;
    const vid = document.getElementById("video");
    
    // ZERO BLEED
    if (!running && currentIdx === 0 && phase === 0) {
        sessionActiveKcal = 0;
        localStorage.setItem("pegasus_session_kcal", "0.0");
    }

    if (vid && vid.src.includes("warmup")) { 
        vid.loop = false; 
        vid.pause(); 
    }

    if (!running && exercises[currentIdx].classList.contains("exercise-skipped")) {
        let firstAvailable = exercises.findIndex(ex => !ex.classList.contains("exercise-skipped") && remainingSets[exercises.indexOf(ex)] > 0);
        if (firstAvailable !== -1) { 
            currentIdx = firstAvailable; 
            showVideo(currentIdx); 
        } else {
            return;
        }
    }

    running = !running;
    const sBtn = document.getElementById("btnStart");
    if (sBtn) sBtn.innerHTML = running ? "Παύση" : "Συνέχεια";
    
    if (typeof window.updateKcalUI === "function") window.updateKcalUI();

    if (running) {
        runPhase(); 
    } else {
        clearInterval(timer);
        if (window.PegasusCloud) window.PegasusCloud.push(true);
    }
}

function runPhase() {
    if (!running) return;
    if (timer) clearInterval(timer);

    if (remainingSets.every(s => s <= 0)) { 
        finishWorkout(); 
        return; 
    }

    const e = exercises[currentIdx];
    if (!e) return;
    const exName = e.querySelector(".weight-input").getAttribute("data-name");
    
    // 🎯 ΥΠΟΛΟΓΙΣΜΟΣ ΕΝΤΑΣΗΣ ΒΑΣΕΙ ΒΑΡΟΥΣ (Intensity Multiplier)
    let liftedWeight = parseFloat(e.querySelector(".weight-input").value) || 0;
    
    // Βασικό MET (Μεταβολικό Ισοδύναμο) για Άρση Βαρών είναι ~3.5
    // Το προσαρμόζουμε βάσει των κιλών που σηκώνεις (Volume Load)
    let baseMET = 3.5; 
    let intensityMultiplier = 1.0;

    if (exName.toLowerCase().includes("cycling") || exName.toLowerCase().includes("ποδηλασία")) {
        // Η ποδηλασία καίει σταθερά ~8.0 METs αν είναι έντονη
        baseMET = 8.0; 
    } else if (liftedWeight > 0) {
        // Αν σηκώνεις βάρη, αυξάνουμε την καύση. 
        // Λογική: Κάθε 10 κιλά προσθέτουν 10% παραπάνω έργο/καύση
        intensityMultiplier = 1 + (liftedWeight / 100); 
    }

    // Τύπος: Kcal/min = (MET * Βάρος Χρήστη * 3.5) / 200
    let kcalPerMin = (baseMET * intensityMultiplier * userWeight * 3.5) / 200;
    let kcalPerSecond = kcalPerMin / 60;

    exercises.forEach(ex => { 
        ex.style.borderColor = "#222"; 
        ex.style.background = "transparent"; 
    });
    e.style.borderColor = "#4CAF50"; 
    e.style.background = "rgba(76, 175, 80, 0.1)";

    let t = (phase === 0) ? 10 : (phase === 1 ? workoutPhases[1].d : workoutPhases[2].d);
    let pName = (phase === 0) ? "ΠΡΟΕΤΟΙΜΑΣΙΑ" : (phase === 1 ? "ΑΣΚΗΣΗ" : "ΔΙΑΛΕΙΜΜΑ");

    const label = document.getElementById("phaseTimer");
    if (label) {
        label.textContent = `${pName} (${Math.max(0, Math.ceil(t))})`;
        label.style.color = (phase === 1) ? "#4CAF50" : (phase === 2 ? "#FFC107" : "#64B5F6");
    }

    if (phase !== 2) showVideo(currentIdx);

    timer = setInterval(() => {
        t -= 1;
        if (remainingSeconds > 0) { 
            remainingSeconds -= 1; 
            updateTotalBar(); 
        }

        // 🎯 LIVE METABOLIC TICKER (Μόνο κατά τη διάρκεια της Άσκησης - Φάση 1)
        if (phase === 1) {
            sessionActiveKcal += kcalPerSecond;
        } else if (phase === 2) {
            // Στο Διάλειμμα καίμε λιγότερο (Ενεργητική Ανάρρωση ~2.0 METs)
            let restKcalPerSec = ((2.0 * userWeight * 3.5) / 200) / 60;
            sessionActiveKcal += restKcalPerSec;
        }

        if (label) label.textContent = `${pName} (${Math.max(0, Math.ceil(t))})`;
        
        if (typeof window.updateKcalUI === "function") window.updateKcalUI();

        if (t <= 0) {
            clearInterval(timer); 
            playBeep();
            
            if (phase === 0) { 
                phase = 1; 
                runPhase(); 
            } else if (phase === 1) {
                let done = parseInt(e.dataset.done) || 0;
                done++;
                e.dataset.done = done;
                remainingSets[currentIdx] = parseFloat(e.dataset.total) - done;
                e.querySelector(".set-counter").textContent = `${done}/${e.dataset.total}`;
                
                if (window.updateAchievements) window.updateAchievements(exName);
                if (window.logPegasusSet) window.logPegasusSet(exName);

                if (window.PegasusCloud) window.PegasusCloud.push(true);

                phase = 2; 
                runPhase();
            } else {
                let next = getNextIndexCircuit();
                if (next !== -1) { 
                    currentIdx = next; 
                    phase = 0; 
                    runPhase(); 
                } else {
                    finishWorkout();
                }
            }
        }
    }, 1000 / SPEED);
}

function skipToNextExercise() {
    if (exercises.length === 0) return;
    clearInterval(timer);

    if ((phase === 1 || phase === 2) && running) {
        const currentExNode = exercises[currentIdx];
        const exName = currentExNode.querySelector(".weight-input").getAttribute("data-name");
        
        let done = parseInt(currentExNode.dataset.done) || 0;
        done++;
        currentExNode.dataset.done = done;
        remainingSets[currentIdx]--;
        
        currentExNode.querySelector(".set-counter").textContent = `${done}/${currentExNode.dataset.total}`;
        if (window.logPegasusSet) window.logPegasusSet(exName);
    }

    if (window.PegasusCloud) window.PegasusCloud.push(true);

    let nextIdx = getNextIndexCircuit();
    if (nextIdx !== -1) {
        currentIdx = nextIdx; 
        phase = 0; 
        if (running) runPhase(); 
        else showVideo(currentIdx);
    } else {
        finishWorkout();
    }
}

/* ===== 6. SAVE & SKIP ===== */
function saveWeight(name, val) {
    const cleanName = name.trim();
    localStorage.setItem(`weight_ΑΓΓΕΛΟΣ_${cleanName}`, val);
    localStorage.setItem(`weight_${cleanName}`, val);
    console.log(`[PEGASUS LOG]: Weight updated for ${cleanName}: ${val}kg`);

    if (window.MuscleProgressUI && typeof window.MuscleProgressUI.render === "function") {
        window.MuscleProgressUI.render();
    }
    if (window.PegasusCloud) window.PegasusCloud.push(true);
}

/* ===== 7. VIDEO & UI UTILS ===== */
function showVideo(i) {
    const vid = document.getElementById("video");
    const label = document.getElementById("phaseTimer");
    if (!vid) return;

    const activeBtn = document.querySelector(".navbar button.active");
    const currentDay = activeBtn ? activeBtn.textContent.trim() : "";
    const isRecoveryDay = (currentDay === "Δευτέρα" || currentDay === "Πέμπτη");

    if (isRecoveryDay || typeof exercises === 'undefined' || !exercises[i]) {
        const recoverySrc = "videos/stretching.mp4";
        if (vid.getAttribute('src') !== recoverySrc) {
            vid.pause();
            vid.src = recoverySrc;
            vid.load();
            vid.play().catch(e => console.log("Waiting for user to trigger playback..."));
            if (label && isRecoveryDay) {
                label.textContent = "ΑΠΟΘΕΡΑΠΕΙΑ: STRETCHING";
                label.style.color = "#00bcd4"; 
            }
        }
        return;
    }

    const weightInput = exercises[i].querySelector(".weight-input");
    if (!weightInput) return;

    let name = weightInput.getAttribute("data-name") || "";
    name = name.trim();
    
    let mappedVal = window.videoMap ? window.videoMap[name] : null;
    if (!mappedVal) {
        console.warn(`[PEGASUS LOGIC]: "${name}" not found in window.videoMap. Using fallback.`);
        mappedVal = name.replace(/\s+/g, '').toLowerCase();
    }

    const newSrc = `videos/${mappedVal}.mp4`;
    
    if (vid.getAttribute('src') !== newSrc) {
        vid.pause();
        vid.src = newSrc;
        vid.load(); 
        vid.play().catch(err => {
            console.warn(`Asset 404: ${mappedVal}.mp4. Fallback to warmup.`);
            vid.src = "videos/warmup.mp4";
            vid.load();
            vid.play();
        });
    }
}

function calculateTotalTime() {
    workoutPhases[1].d = parseInt(localStorage.getItem(P_M?.user.ex_time || "pegasus_ex_time")) || 45;
    workoutPhases[2].d = parseInt(localStorage.getItem(P_M?.user.rest_time || "pegasus_rest_time")) || 60;
    
    totalSeconds = exercises.reduce((acc, ex) => {
        if (ex.classList.contains("exercise-skipped")) return acc;
        let sets = parseFloat(ex.dataset.total) || 0;
        return acc + (sets * (10 + workoutPhases[1].d + workoutPhases[2].d));
    }, 0);

    remainingSeconds = totalSeconds;
    const timeDisplay = document.getElementById("totalProgressTime"); 
    if (timeDisplay) {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        timeDisplay.textContent = `${m}:${String(s).padStart(2, '0')}`;
    }
    updateTotalBar();
}

function updateTotalBar() {
    const bar = document.getElementById("totalProgress");
    const timeText = document.getElementById("totalProgressTime");
    if (!bar || totalSeconds <= 0) return;

    const progress = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
    bar.style.width = Math.max(0, Math.min(100, progress)) + "%";

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
    if (!exDiv) return;
    
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
    if (window.PegasusCloud) window.PegasusCloud.push(true);
};

/* ===== 8. FINISH & REPORTING ===== */
function finishWorkout() {
    if (!running && !timer && phase === 0) return; 
    
    clearInterval(timer); 
    running = false;

    const label = document.getElementById("phaseTimer");
    if (label) { 
        label.textContent = "ΟΛΟΚΛΗΡΩΣΗ & ΤΟΠΙΚΗ ΑΠΟΘΗΚΕΥΣΗ..."; 
        label.style.color = "#4CAF50"; 
    }

    const now = new Date();
    const workoutKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let doneKey = P_M?.workout.done || "pegasus_workouts_done";
    let data = JSON.parse(localStorage.getItem(doneKey) || "{}");
    data[workoutKey] = true;
    localStorage.setItem(doneKey, JSON.stringify(data));
    
    localStorage.setItem(P_M?.workout.cardio_offset || "pegasus_cardio_offset_sets", "0");

    if (window.updateTotalWorkoutCount) window.updateTotalWorkoutCount();

    if (window.PegasusCloud) {
        try { window.PegasusCloud.push(true); } catch(e) {}
    }

    // 🎯 REPORTING & WEEKLY ACCUMULATION
    setTimeout(() => {
        if (window.PegasusReporting) {
            let sessionKcal = sessionActiveKcal;

            let currentWeekly = parseFloat(localStorage.getItem("pegasus_weekly_kcal")) || 0;
            let newWeekly = currentWeekly + sessionKcal;
            localStorage.setItem("pegasus_weekly_kcal", newWeekly.toFixed(1));

            window.PegasusReporting.prepareAndSaveReport(sessionKcal.toFixed(1));
            
            // Μηδενισμός του εσωτερικού μετρητή
            sessionActiveKcal = 0;
            localStorage.setItem("pegasus_session_kcal", "0.0");
        } else {
            console.log("PEGASUS OS: Session Terminated. Reloading...");
            window.location.reload(); 
        }
    }, 4000);
}

/* ===== 9. PREVIEW ENGINE ===== */
function openExercisePreview() {
    const activeBtn = document.querySelector(".navbar button.active");
    if (!activeBtn) return alert("Παρακαλώ επίλεξε πρώτα μια ημέρα!");

    const currentDay = activeBtn.textContent.trim().split(' ')[0];
    const isRainy = (typeof window.isRaining === 'function') ? window.isRaining() : false;
    
    let rawData = (typeof window.calculateDailyProgram !== 'undefined') ? 
                  window.calculateDailyProgram(currentDay, isRainy) : 
                  ((window.program[currentDay]) ? [...window.program[currentDay]] : []);

    if (currentDay === "Παρασκευή" && !isRainy && window.program["Κυριακή"]) {
        const bonus = window.program["Κυριακή"]
            .filter(ex => !ex.name.includes("Ποδηλασία") && !ex.name.includes("Cycling"))
            .map(ex => ({...ex, isSpillover: false}));
        rawData = [...rawData, ...bonus];
    }

    const dayExercises = window.PegasusOptimizer ? window.PegasusOptimizer.apply(currentDay, rawData) : 
                         rawData.map(e => ({ ...e, adjustedSets: e.sets }));

    const panel = document.getElementById('previewPanel');
    const content = document.getElementById('previewContent');
    const muscleContainer = document.getElementById('muscleProgressContainer'); 

    if (!panel || !content) return;

    panel.style.display = 'block'; 
    content.innerHTML = ''; 
    if (muscleContainer) muscleContainer.innerHTML = ''; 

    dayExercises.filter(ex => (ex.adjustedSets || ex.sets) > 0).forEach((ex) => {
        const cleanName = ex.name.trim();
        
        let imgBase = window.videoMap ? window.videoMap[cleanName] : null;
        if (!imgBase) {
            imgBase = cleanName.replace(/\s+/g, '').toLowerCase();
        }

        const imgPath = (imgBase === "cycling") ? `images/${imgBase}.jpg` : `images/${imgBase}.png`;

        content.innerHTML += `
            <div class="preview-item">
                <img src="${imgPath}" onerror="this.onerror=null; this.src='images/placeholder.jpg';" alt="${cleanName}">
                <p>${cleanName} (${ex.adjustedSets || ex.sets} set)</p>
            </div>
        `;
    });
    
    if (typeof window.forcePegasusRender === "function") {
        setTimeout(() => { window.forcePegasusRender(); }, 50);
    }
}

/* ===== 10. BOOT & TRACKING ===== */
window.logPegasusSet = function(exName) {
    let historyKey = P_M?.workout.weekly_history || 'pegasus_weekly_history';
    let history = JSON.parse(localStorage.getItem(historyKey)) || { 
        "Στήθος": 0, "Πλάτη": 0, "Ώμοι": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 
    };

    let muscle = (window.exercisesDB?.find(ex => ex.name.trim() === exName.trim()))?.muscleGroup || "Άλλο";
    let value = 1;

    const cleanName = exName.trim().toUpperCase();
    if (cleanName.includes("ΠΟΔΗΛΑΣΙΑ") || cleanName.includes("CYCLING")) { 
        muscle = "Πόδια"; value = 18; 
    } else if (cleanName.includes("EMS ΠΟΔΙΩΝ")) { 
        muscle = "Πόδια"; value = 6; 
    }

    if (history.hasOwnProperty(muscle)) {
        history[muscle] += value;
        localStorage.setItem(historyKey, JSON.stringify(history));
        
        if (window.MuscleProgressUI && typeof window.MuscleProgressUI.render === "function") {
            setTimeout(() => window.MuscleProgressUI.render(), 50); 
        }
    }
};

window.updateTotalWorkoutCount = function() {
    const doneKey = P_M?.workout.done || "pegasus_workouts_done";
    const totalKey = P_M?.workout.total || "pegasus_total_workouts";
    
    const data = JSON.parse(localStorage.getItem(doneKey) || "{}");
    const count = Object.keys(data).length;
    
    localStorage.setItem(totalKey, count);
    const display = document.getElementById("totalWorkoutsDisplay");
    if (display) display.textContent = `Προπονήσεις: ${count}`;
};

/* ===== 11. BOOT SEQUENCE ===== */
window.onload = () => {
    const greekDays = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
    const todayObj = new Date();
    const todayName = greekDays[todayObj.getDay()];

    if (todayName === "Σάββατο") {
        try {
            const lastReset = localStorage.getItem('pegasus_last_reset');
            const todayDateStr = todayObj.toISOString().split('T')[0];
            
            if (lastReset !== todayDateStr) {
                const freshHistory = { "Στήθος": 0, "Πλάτη": 0, "Ώμοι": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 };
                localStorage.setItem('pegasus_weekly_history', JSON.stringify(freshHistory));
                localStorage.setItem('pegasus_weekly_kcal', "0.0");
                localStorage.setItem('pegasus_last_reset', todayDateStr);
                if (window.PegasusCloud) window.PegasusCloud.push(true);
            }
        } catch (e) {
            console.error("🛡️ PEGASUS RESET ERROR: Recovery initiated.", e);
        }
    }

    if (typeof emailjs !== 'undefined') emailjs.init('qsfyDrneUHP7zEFui');
    createNavbar();
    if (window.updateTotalWorkoutCount) window.updateTotalWorkoutCount();
    if (window.updateKoukiBalance) window.updateKoukiBalance();
    if (typeof window.updateKcalUI === "function") window.updateKcalUI();

    window.masterUI = {
        "btnStart": startPause,
        "btnNext": skipToNextExercise,
        "btnCalendarUI": { panel: "calendarPanel", init: window.renderCalendar },
        "btnAchUI": { panel: "achievementsPanel", init: window.renderAchievements },
        "btnSettingsUI": { panel: "settingsPanel", init: window.initSettingsUI },
        "btnFoodUI": { panel: "foodPanel", init: window.updateFoodUI },
        "btnProposalsUI": () => {
            if (window.PegasusDietAdvisor && typeof window.renderAdvisorUI === 'function') {
                window.renderAdvisorUI();
            } else {
                alert("Σφάλμα: Το dietAdvisor.js δεν έχει φορτωθεί σωστά.");
            }
        },
        "btnToolsUI": { panel: "toolsPanel", init: null },
        "btnPreviewUI": { panel: "previewPanel", init: window.renderPreview || openExercisePreview }, 
        "btnGallery": { panel: "galleryPanel", init: () => window.GalleryEngine.render() },
        "btnCardio": { panel: "cardioPanel", init: () => window.PegasusCardio.open() },
        "btnEMS": { panel: "emsModal", init: window.logEMSData },
        "btnManualEmail": () => {
            if (window.PegasusReporting) window.PegasusReporting.checkAndSendMorningReport(true);
            else alert("Reporting Engine Offline");
        },
        "btnSaveSettings": () => { 
            const weightVal = document.getElementById("userWeightInput")?.value || 74;
            const weightKey = window.PegasusManifest?.user.weight || "pegasus_weight";
            if (window.PegasusWeight && typeof window.PegasusWeight.save === "function") {
                window.PegasusWeight.save(weightVal);
            } else {
                localStorage.setItem(weightKey, weightVal);
            }
            if (window.PegasusCloud) window.PegasusCloud.push(true);
            setTimeout(() => { location.reload(); }, 300);
        }
    };

    Object.keys(window.masterUI).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.onclick = (e) => {
                e.stopPropagation();
                const target = window.masterUI[btnId];
                if (!btnId.includes("Save") && !btnId.includes("Start") && btnId !== "btnProposalsUI") {
                    document.querySelectorAll('.pegasus-panel, #emsModal').forEach(p => p.style.display = "none");
                }
                if (typeof target === 'function') target();
                else if (target && target.panel) {
                    const el = document.getElementById(target.panel);
                    if (el) { el.style.display = "block"; if (target.init) target.init(); }
                }
            };
        }
    });

    setTimeout(() => { 
        document.querySelectorAll(".navbar button").forEach(b => { 
            if (b.textContent.trim().split(' ')[0] === todayName) {
                if (typeof selectDay === "function") {
                    selectDay(b, b.textContent);
                    setTimeout(() => {
                        if (typeof exercises !== 'undefined') {
                            remainingSets = exercises.map(ex => parseFloat(ex.dataset.total));
                            currentIdx = 0;
                            console.log("🚀 PEGASUS: Circuit Auto-Initialized for Today.");
                        }
                    }, 150);
                }
            }
        }); 
    }, 400);

    if (window.PegasusUI && typeof window.PegasusUI.init === "function") window.PegasusUI.init();

    setTimeout(() => {
        const loader = document.getElementById('pegasus-loader');
        if (loader) {
            loader.style.opacity = '0';
            loader.style.visibility = 'hidden';
            console.log("🛡️ PEGASUS OS: Initializing Complete. Welcome back, Angelos.");
        }
    }, 1000); 
};

window.PegasusDebug = {
    state: () => ({ exercises, remainingSets, currentIdx, running, phase }),
    manifest: () => P_M,
    testImage: (name) => {
        const testImg = new Image();
        testImg.onload = () => console.log(`%c ✅ ASSET FOUND: ${name}.png`, "color: #4CAF50; font-weight: bold;");
        testImg.onerror = () => console.error(`%c ❌ ASSET 404: ${name}.png is missing from GitHub!`, "color: #ff4444;");
        testImg.src = `images/${name}.png`;
    },
    logs: () => window.pegasusLogs
};

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

    if (closedAny && window.PegasusCloud) window.PegasusCloud.push(true); 
});
