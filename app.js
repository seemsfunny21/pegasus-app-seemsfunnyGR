/* ==========================================================================
   PEGASUS WORKOUT ENGINE - v10.1 (PRECISION BLOCK 1)
   Protocol: Zero-Conflict Variable Bridge & Manifest Alignment
   Status: BLOCK 1 OPERATIONAL | Surgical Fix for Constant Assignment
   ========================================================================== */

// 0. GLOBAL SCOPE BRIDGE (Surgical Fix for TypeError)
// Χρησιμοποιούμε το P_M ως την επίσημη τοπική αναφορά
var P_M = window.PegasusManifest; 

// Ελέγχουμε αν η M είναι ήδη δεσμευμένη (π.χ. ως const στο manifest.js)
if (typeof M === 'undefined') {
    window.M = P_M;
} else {
    // Αν η M υπάρχει ήδη, δεν την πειράζουμε για να αποφύγουμε το Crash
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

// Χρήση P_M για τις ρυθμίσεις συστήματος
var muted = localStorage.getItem(P_M?.system.mute || "pegasus_mute_state") === "true";
var TURBO_MODE = localStorage.getItem(P_M?.system.turbo || "pegasus_turbo_state") === "true";
var SPEED = TURBO_MODE ? 10 : 1;

/* === DYNAMIC PARAMETERS (MANIFEST STRICT) === */
var workoutPhases = [
    { n: "Προετοιμασία", d: 10 }, 
    { n: "Άσκηση", d: parseInt(localStorage.getItem(P_M?.user.ex_time || "pegasus_ex_time")) || 45 },      
    { n: "Διάλειμμα", d: parseInt(localStorage.getItem(P_M?.user.rest_time || "pegasus_rest_time")) || 60 }      
];

// Το βάρος χρήστη αντλείται αποκλειστικά από το Manifest Key
var userWeight = parseFloat(localStorage.getItem(P_M?.user.weight || "pegasus_weight")) || 74;

/* ===== 3. AUDIO SYSTEM (INTERACTION SYNC) ===== */
let sysAudio = new Audio('videos/beep.mp3');
let audioUnlocked = false;

// Πρωτόκολλο Ξεκλειδώματος Ήχου & Cloud Pull
document.addEventListener('click', function() {
    if (!audioUnlocked) {
        sysAudio.play().then(() => {
            sysAudio.pause(); 
            sysAudio.currentTime = 0;
            audioUnlocked = true;
            console.log("PEGASUS OS: Audio Unlocked & Ready.");

            // Αυτόματο Pull από το Cloud κατά το πρώτο κλικ
            if (window.PegasusCloud && typeof window.PegasusCloud.pull === "function") {
                console.log("PEGASUS CLOUD: User interaction detected. Syncing...");
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

/* ===== 4. NAVIGATION & SELECTDAY (STRICT SPILLOVER LOGIC) ===== */
function createNavbar() {
    const nav = document.getElementById("navbar");
    if (!nav) return;
    const days = ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο", "Κυριακή"];
    nav.innerHTML = "";
    days.forEach((d) => {
        const b = document.createElement("button");
        b.textContent = d; 
        b.id = `nav-${d}`;
        b.style.backgroundColor = "#000"; 
        b.style.color = "#fff"; 
        b.style.border = "none";
        b.onclick = () => selectDay(b, d);
        nav.appendChild(b);
    });
}

function selectDay(btn, day) {
    if (typeof window.program === 'undefined' || !window.program) {
        console.error("❌ PEGASUS CRITICAL: window.program is missing! Check data.js");
        return; 
    }

    // [PUSH TRIGGER] Συγχρονισμός πριν από κάθε αλλαγή ημέρας
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

    // Engine Reset
    clearInterval(timer); timer = null; running = false; phase = 0; currentIdx = 0;
    const sBtn = document.getElementById("btnStart");
    if (sBtn) sBtn.innerHTML = "Έναρξη";

    const isRainy = (typeof window.isRaining === 'function') ? window.isRaining() : false;
    
    // Base Data Fetching
    let rawBaseData = (typeof window.calculateDailyProgram !== 'undefined') ? 
                      window.calculateDailyProgram(day, isRainy) : 
                      ((window.program[day]) ? [...window.program[day]] : []);

    // FRIDAY SPILLOVER LOGIC: Αν Παρασκευή & ΟΧΙ βροχή -> Πρόσθεσε Κυριακή (εκτός Ποδηλασίας)
    if (day === "Παρασκευή" && !isRainy && window.program["Κυριακή"]) {
        const bonus = window.program["Κυριακή"]
            .filter(ex => !ex.name.includes("Ποδηλασία") && !ex.name.includes("Cycling"))
            .map(ex => ({...ex, isSpillover: true}));
        rawBaseData = [...rawBaseData, ...bonus];
        console.log("PEGASUS: Sunday Exercises Added to Friday (No Rain detected).");
    }

    // Optimizer Integration
    let mappedData = window.PegasusOptimizer ? window.PegasusOptimizer.apply(day, rawBaseData) : 
                     rawBaseData.map(e => ({ ...e, adjustedSets: e.sets, isCompleted: false }));

    // Cardio Deduction Logic (Manifest Keys)
    let cardioCredit = parseFloat(localStorage.getItem(P_M?.workout.cardio_offset || "pegasus_cardio_offset_sets")) || 0;
    
    // Sort: Skip exercises with 0 sets to the bottom
    mappedData.sort((a, b) => (a.adjustedSets === 0) ? 1 : (b.adjustedSets === 0) ? -1 : 0);

    const list = document.getElementById("exList");
    if (!list) return;
    list.innerHTML = ""; exercises = []; remainingSets = [];

    mappedData.forEach((e, idx) => {
        if (!e.name || e.name === "αα" || e.adjustedSets < 1) return;

        let finalSets = parseFloat(e.adjustedSets);
        const muscle = (window.exercisesDB?.find(ex => ex.name.trim() === e.name.trim()))?.muscleGroup || "Άλλο";

        // Deduction logic for Legs based on Cardio Credit
        if (muscle === "Πόδια" && cardioCredit > 0 && finalSets > 0) {
            let deduction = Math.min(finalSets, cardioCredit);
            finalSets = parseFloat((finalSets - deduction).toFixed(1));
            cardioCredit = parseFloat((cardioCredit - deduction).toFixed(1));
        }

        const d = document.createElement("div");
        d.className = "exercise"; 
        d.dataset.total = finalSets; 
        d.dataset.done = 0; 
        d.dataset.index = idx;

        if (finalSets <= 0) {
            d.classList.add("exercise-skipped");
            d.style.opacity = "0.2"; d.style.filter = "grayscale(100%)"; d.style.pointerEvents = "none";
        }

        const cleanName = e.name.trim();
        const safeName = cleanName.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const savedWeight = localStorage.getItem(`weight_ANGELOS_${cleanName}`) || "";

// Εντολή εντός της mappedData.forEach:
d.innerHTML = `
    <div class="exercise-info" onclick="window.toggleSkipExercise(${idx})">
        <div class="set-counter">0/${finalSets}</div>
        <div class="exercise-name">${cleanName}${e.isSpillover ? " (BONUS)" : ""}</div> 
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

/* ===== 5. WORKOUT ENGINE (METABOLIC & CLOUD INTEGRATED) ===== */
function startPause() {
    if (exercises.length === 0) return;
    const vid = document.getElementById("video");
    
    // Διακοπή Manual Προθέρμανσης αν ξεκινήσει η κανονική ροή
    if (vid && vid.src.includes("warmup")) { 
        vid.loop = false; 
        vid.pause(); 
    }

    // Skip αν η τρέχουσα άσκηση είναι απενεργοποιημένη
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
    
    if (running) {
        runPhase(); 
    } else {
        clearInterval(timer);
        // [PUSH TRIGGER] Sync κατά την παύση για ασφάλεια
        if (window.PegasusCloud) window.PegasusCloud.push(true);
    }
}

function runPhase() {
    if (!running) return;
    if (timer) clearInterval(timer);

    // Έλεγχος ολοκλήρωσης
    if (remainingSets.every(s => s <= 0)) { 
        finishWorkout(); 
        return; 
    }

    const e = exercises[currentIdx];
    if (!e) return;
    const exName = e.querySelector(".weight-input").getAttribute("data-name");

    // UI Highlight τρέχουσας άσκησης
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

        // --- METABOLIC ENGINE (LIVE CALORIE BURN) ---
        // Formula: weight * constant per second (Exercise vs Rest)
        if (phase === 1 || phase === 2) {
            let currentKcal = parseFloat(localStorage.getItem(P_M?.nutrition.today_kcal || "pegasus_today_kcal")) || 0;
            let burnRate = (phase === 1) ? (userWeight * 0.00017) : (userWeight * 0.00008); 
            localStorage.setItem(P_M?.nutrition.today_kcal || "pegasus_today_kcal", (currentKcal + burnRate).toFixed(4));
        }

        if (window.MetabolicEngine && phase === 1) window.MetabolicEngine.updateTracking(1, exName);
        if (label) label.textContent = `${pName} (${Math.max(0, Math.ceil(t))})`;

        if (t <= 0) {
            clearInterval(timer); 
            playBeep();
            
            if (phase === 0) { 
                phase = 1; 
                runPhase(); 
            } else if (phase === 1) {
                // Ολοκλήρωση Σετ
                let done = parseInt(e.dataset.done) || 0;
                done++;
                e.dataset.done = done;
                remainingSets[currentIdx] = parseFloat(e.dataset.total) - done;
                e.querySelector(".set-counter").textContent = `${done}/${e.dataset.total}`;
                
                // Achievement & Logic Bridge
                if (window.updateAchievements) window.updateAchievements(exName);
                if (window.logPegasusSet) window.logPegasusSet(exName);

                // [PUSH TRIGGER] Αυτόματο Cloud Sync μετά από κάθε σετ
                if (window.PegasusCloud) window.PegasusCloud.push(true);

                phase = 2; 
                runPhase();
            } else {
                // Μετάβαση στην επόμενη άσκηση (Circuit Logic)
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

/* ===== 6. SAVE & SKIP (DATA PERSISTENCE) ===== */
function saveWeight(name, val) {
    const cleanName = name.trim();
    
    // Διπλή αποθήκευση για συμβατότητα με παλαιότερα reports και το νέο Manifest
    localStorage.setItem(`weight_ANGELOS_${cleanName}`, val);
    localStorage.setItem(`weight_${cleanName}`, val);
    
    console.log(`[PEGASUS LOG]: Weight updated for ${cleanName}: ${val}kg`);

    // [PUSH TRIGGER] Άμεσος συγχρονισμός στο Cloud μετά την αλλαγή βάρους
    if (window.PegasusCloud) window.PegasusCloud.push(true);
}

function skipToNextExercise() {
    if (exercises.length === 0) return;
    
    // Διακοπή τρέχοντος χρονομέτρου
    clearInterval(timer);

    // Αν ο χρήστης κάνει skip ενώ η άσκηση "τρέχει", θεωρούμε το σετ ως ολοκληρωμένο (Pegasus Logic)
    if ((phase === 1 || phase === 2) && running) {
        const currentExNode = exercises[currentIdx];
        const exName = currentExNode.querySelector(".weight-input").getAttribute("data-name");
        
        let done = parseInt(currentExNode.dataset.done) || 0;
        done++;
        currentExNode.dataset.done = done;
        remainingSets[currentIdx]--;
        
        currentExNode.querySelector(".set-counter").textContent = `${done}/${currentExNode.dataset.total}`;
        
        // Καταγραφή στο ιστορικό προόδου
        if (window.logPegasusSet) window.logPegasusSet(exName);
    }

    // [PUSH TRIGGER] Συγχρονισμός κατά την παράκαμψη
    if (window.PegasusCloud) window.PegasusCloud.push(true);

    // Εύρεση επόμενης διαθέσιμης άσκησης στο κύκλωμα
    let nextIdx = getNextIndexCircuit();
    if (nextIdx !== -1) {
        currentIdx = nextIdx; 
        phase = 0; // Επαναφορά στην Προετοιμασία για τη νέα άσκηση
        
        if (running) {
            runPhase(); 
        } else {
            showVideo(currentIdx);
        }
    } else {
        // Αν δεν υπάρχουν άλλες ασκήσεις, τερματισμός
        finishWorkout();
    }
}

/* ===== 7. VIDEO & UI UTILS (ASSET ALIGNED) ===== */
function showVideo(i) {
    const vid = document.getElementById("video");
    if (!vid) return;
    vid.style.display = "block"; vid.style.opacity = "1";
    
    const ytFrame = document.getElementById("yt-video");
    if (ytFrame) ytFrame.remove();

    const label = document.getElementById("phaseTimer");
    const phaseLabel = label ? label.textContent : "";
    
    // Προσδιορισμός ονόματος άσκησης
    let name = (phaseLabel.includes("Manual") || i === null || i === undefined || i === -1) ? 
               "Προθέρμανση" : exercises[i].querySelector(".weight-input").getAttribute("data-name");
    
    // --- SURGICAL ASSET MAPPING (GitHub Sync) ---
    // Αντιστοίχιση ονομάτων data.js με τα πραγματικά .mp4 αρχεία
    const videoMap = {
        "Low Seated Row": "lowrowsseated",
        "Close Grip Pulldown": "latpulldownsclose",
        "Lateral Raises": "uprightrows",
        "Shoulder Press": "uprightrows",
        "Tricep Extensions": "triceppulldowns",
        "Incline Chest Press": "chestpress",
        "Chest Press": "chestpress",
        "Bicep Curls": "bicepcurls"
    };

    let mappedVal = videoMap[name] || name.replace(/\s+/g, '').toLowerCase();
    
    // Force "ems" mapping
    if (name.toLowerCase().includes("ems")) mappedVal = "ems";

    const newSrc = `videos/${mappedVal}.mp4`;
    
    if (vid.getAttribute('src') !== newSrc) {
        vid.pause();
        vid.src = newSrc;
        vid.load();
        
        // Fallback Protocol: Αν το βίντεο λείπει, δείξε την προθέρμανση αντί για μαύρη οθόνη
        vid.play().catch(() => { 
            console.warn(`PEGASUS ASSET 404: ${mappedVal}.mp4 not found. Falling back to warmup.`);
            vid.src = "videos/warmup.mp4"; 
            vid.load(); 
            vid.play(); 
        });
    }
}

function calculateTotalTime() {
    // Sync χρονισμών με Manifest
    workoutPhases[1].d = parseInt(localStorage.getItem(P_M?.user.ex_time || "pegasus_ex_time")) || 45;
    workoutPhases[2].d = parseInt(localStorage.getItem(P_M?.user.rest_time || "pegasus_rest_time")) || 60;
    
    totalSeconds = exercises.reduce((acc, ex) => {
        if (ex.classList.contains("exercise-skipped")) return acc;
        let sets = parseFloat(ex.dataset.total) || 0;
        // Κύκλος: Προετοιμασία(10) + Άσκηση + Διάλειμμα
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
    
    // Επαναυπολογισμός συνολικού χρόνου μετά την αλλαγή
    calculateTotalTime();
    
    // [PUSH TRIGGER] Συγχρονισμός στο Cloud
    if (window.PegasusCloud) window.PegasusCloud.push(true);
};

/* ===== 8. FINISH & REPORTING (MANIFEST COMPLIANT) ===== */
function finishWorkout() {
    // Αποτροπή διπλοεκτέλεσης αν δεν υπάρχει ενεργή προπόνηση
    if (!running && !timer && phase === 0) return; 
    
    clearInterval(timer); 
    running = false;

    const label = document.getElementById("phaseTimer");
    if (label) { 
        label.textContent = "ΟΛΟΚΛΗΡΩΣΗ & ΣΥΓΧΡΟΝΙΣΜΟΣ..."; 
        label.style.color = "#4CAF50"; 
    }

    const now = new Date();
    // Format: YYYY-MM-DD για συμβατότητα με το Calendar
    const workoutKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Ενημέρωση ολοκληρωμένων προπονήσεων στο Manifest Key
    let data = JSON.parse(localStorage.getItem(P_M?.workout.done || "pegasus_workouts_done") || "{}");
    data[workoutKey] = true;
    localStorage.setItem(P_M?.workout.done || "pegasus_workouts_done", JSON.stringify(data));
    
    // Μηδενισμός Cardio Offsets (Burn-after-use protocol)
    localStorage.setItem(P_M?.workout.cardio_offset || "pegasus_cardio_offset_sets", "0");

    // UI & Cloud Update
    if (window.updateTotalWorkoutCount) window.updateTotalWorkoutCount();
    if (window.PegasusCloud) window.PegasusCloud.push(true);

    console.log(`[PEGASUS FINISH]: Workout ${workoutKey} saved. Preparing report...`);

    setTimeout(() => {
        if (window.PegasusReporting) {
            // Ανάκτηση τελικών θερμίδων από το Metabolic Engine
            const currentKcal = localStorage.getItem(P_M?.nutrition.today_kcal || "pegasus_today_kcal") || "0";
            window.PegasusReporting.prepareAndSaveReport(currentKcal);
            
            // Καθαρισμός ημερήσιων θερμίδων για την επόμενη ημέρα
            localStorage.setItem(P_M?.nutrition.today_kcal || "pegasus_today_kcal", "0.0");
        }
        
        // Ολική επαναφορά συστήματος
        location.reload(); 
    }, 5000);
}

/* ===== 9. PREVIEW ENGINE (v10.4 - MUSCLE BARS INTEGRATION) ===== */
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
            .map(ex => ({...ex, isSpillover: true}));
        rawData = [...rawData, ...bonus];
    }

    const dayExercises = window.PegasusOptimizer ? window.PegasusOptimizer.apply(currentDay, rawData) : 
                         rawData.map(e => ({ ...e, adjustedSets: e.sets }));

    const panel = document.getElementById('previewPanel');
    const content = document.getElementById('previewContent');
    if (!panel || !content) return;

    panel.style.display = 'block'; 
    content.innerHTML = ''; 

    // --- 🔥 PEGASUS MUSCLE STATUS GRID ---
    if (window.MuscleProgressUI) {
        const stats = window.MuscleProgressUI.calculateStats();
        let gridHtml = `
            <div style="width:100%; margin-bottom:20px; padding:12px; background:rgba(76, 175, 80, 0.05); border:1px solid #222; border-radius:10px;">
                <p style="color:#4CAF50; font-size:11px; font-weight:bold; margin:0 0 10px 0; text-align:center; letter-spacing:1px;">WEEKLY MUSCLE COVERAGE</p>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">`;
        stats.forEach(s => {
            gridHtml += `
                <div style="font-size:10px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:3px; color:#eee;">
                        <span>${s.name.toUpperCase()}</span>
                        <span style="color:#4CAF50;">${s.percent}%</span>
                    </div>
                    <div style="width:100%; height:4px; background:#111; border-radius:2px; overflow:hidden; border:1px solid #333;">
                        <div style="width:${s.percent}%; height:100%; background:#4CAF50; transition: width 1s ease;"></div>
                    </div>
                </div>`;
        });
        gridHtml += `</div></div><hr style="border:0; border-top:1px solid #333; margin:15px 0; width:100%;">`;
        content.innerHTML = gridHtml;
    }

    const nameMapping = {
        "Low Seated Row": "lowrowsseated",
        "Close Grip Pulldown": "latpulldownsclose",
        "Lateral Raises": "uprightrows",
        "Shoulder Press": "uprightrows",
        "Tricep Extensions": "triceppulldowns",
        "Incline Chest Press": "chestpress",
        "Chest Press": "chestpress",
        "Bicep Curls": "bicepcurls"
    };

    dayExercises.filter(ex => (ex.adjustedSets || ex.sets) > 0).forEach((ex) => {
        const cleanName = ex.name.trim();
        let imgName = nameMapping[cleanName] || cleanName.replace(/\s+/g, '').toLowerCase();
        let ext = (imgName === "cycling") ? ".jpg" : ".png";
// Εντολή εντός της dayExercises.forEach:
content.innerHTML += `
    <div class="preview-item">
        <img src="images/${imgName}${ext}" onerror="this.src='images/placeholder.jpg'">
        <p>${cleanName}${ex.isSpillover ? " (BONUS)" : ""} (${ex.adjustedSets || ex.sets} set)</p>
    </div>
`;
    });
}

/* ===== 10. BOOT & TRACKING (STRICT MANIFEST ALIGNED) ===== */
window.logPegasusSet = function(exName) {
    // Ανάκτηση ιστορικού από το Manifest Key
    let historyKey = P_M?.workout.weekly_history || 'pegasus_weekly_history';
    let history = JSON.parse(localStorage.getItem(historyKey)) || { 
        "Στήθος": 0, "Πλάτη": 0, "Ώμοι": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 
    };

    // Αναγνώριση Μυϊκής Ομάδας από την Database
    let muscle = (window.exercisesDB?.find(ex => ex.name.trim() === exName.trim()))?.muscleGroup || "Άλλο";
    let value = 1;

    const cleanName = exName.trim().toUpperCase();
    // Special Credits Protocol
    if (cleanName.includes("ΠΟΔΗΛΑΣΙΑ") || cleanName.includes("CYCLING")) { 
        muscle = "Πόδια"; value = 18; 
    } else if (cleanName.includes("EMS ΠΟΔΙΩΝ")) { 
        muscle = "Πόδια"; value = 6; 
    }

    if (history.hasOwnProperty(muscle)) {
        history[muscle] += value;
        localStorage.setItem(historyKey, JSON.stringify(history));
        console.log(`[PEGASUS TRACKER]: ${value} set(s) added to ${muscle}`);
        
        // Live UI Update των Muscle Bars
        if (window.MuscleProgressUI) window.MuscleProgressUI.render();
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

window.onload = () => {
    // 1. EmailJS Initialization
    if (typeof emailjs !== 'undefined') emailjs.init('qsfyDrneUHP7zEFui');
    
    // 2. UI Construction
    createNavbar();
    window.updateTotalWorkoutCount();

    // 3. MASTER UI MAPPING (Event Delegation)
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
                if (label) { 
                    label.textContent = "ΠΡΟΘΕΡΜΑΝΣΗ (Manual Mode)"; 
                    label.style.color = "#64B5F6"; 
                }
            }
        },
        "btnCalendarUI": { panel: "calendarPanel", init: window.renderCalendar },
        "btnAchUI": { panel: "achievementsPanel", init: window.renderAchievements },
        "btnSettingsUI": { panel: "settingsPanel", init: window.initSettingsUI },
        "btnFoodUI": { panel: "foodPanel", init: window.updateFoodUI },
        "btnToolsUI": { panel: "toolsPanel" },
        "btnPreviewUI": { panel: "previewPanel", init: openExercisePreview },
        "btnSaveSettings": () => { 
            const weightVal = document.getElementById("userWeightInput")?.value || 74;
            localStorage.setItem(P_M?.user.weight || "pegasus_weight", weightVal);
            if (window.PegasusCloud) window.PegasusCloud.push(true);
            console.log("PEGASUS SETTINGS: Data saved & synced.");
            location.reload();
        }
    };

    Object.keys(masterUI).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.onclick = (e) => {
                e.stopPropagation();
                const target = masterUI[btnId];
                
                // Αυτόματο κλείσιμο άλλων panels
                if (!btnId.includes("Save") && !btnId.includes("Start")) {
                    document.querySelectorAll('.pegasus-panel, #emsModal').forEach(p => p.style.display = "none");
                }

                if (typeof target === 'function') {
                    target();
                } else if (target.panel) {
                    const el = document.getElementById(target.panel);
                    if (el) { 
                        el.style.display = "block"; 
                        if (target.init) target.init(); 
                    }
                }
            };
        }
    });

    // 4. AUTO-SELECT TODAY PROTOCOL
    const greekDays = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
    const today = greekDays[new Date().getDay()];
    setTimeout(() => { 
        document.querySelectorAll(".navbar button").forEach(b => { 
            if (b.textContent.trim().split(' ')[0] === today) selectDay(b, b.textContent);
        }); 
    }, 400);
};

/* ===== 11. DEBUG BRIDGE (FIXED & FULL ACCESS) ===== */
window.PegasusDebug = {
    // Κατάσταση Engine: PegasusDebug.state()
    state: () => ({ exercises, remainingSets, currentIdx, running, phase }),
    
    // Έλεγχος Manifest: PegasusDebug.manifest()
    manifest: () => P_M,
    
    // Έλεγχος Assets: PegasusDebug.testImage('uprightrows')
    testImage: (name) => {
        const testImg = new Image();
        testImg.onload = () => console.log(`%c ✅ ASSET FOUND: ${name}.png`, "color: #4CAF50; font-weight: bold;");
        testImg.onerror = () => console.error(`%c ❌ ASSET 404: ${name}.png is missing from GitHub!`, "color: #ff4444;");
        testImg.src = `images/${name}.png`;
    },
    
    // Πρόσφατα Logs: PegasusDebug.logs()
    logs: () => window.pegasusLogs
};

/* ===== CLOUD SYNC EVENT (PUSH ON PANEL CLOSE) ===== */
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
