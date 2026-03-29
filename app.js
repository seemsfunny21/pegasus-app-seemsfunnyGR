/* ==========================================================================
   PEGASUS WORKOUT ENGINE - v10.1 (PRECISION BLOCK 1)
   Protocol: Zero-Conflict Variable Bridge & Manifest Alignment
   Status: BLOCK 1 OPERATIONAL | Surgical Fix for Constant Assignment
   ========================================================================== */

// 0. GLOBAL SCOPE BRIDGE
var P_M = window.PegasusManifest; 

// ✅ ΚΡΑΤΑΜΕ ΑΥΤΟ: Δημιουργία του Global Bridge μία φορά στην αρχή
window.masterUI = window.masterUI || {}; 

// Ελέγχουμε αν η M είναι ήδη δεσμευμένη
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

/* === PEGASUS ENGINE: SELECTDAY PROTOCOL (v10.1.2 STABLE) === */
/* === PEGASUS ENGINE: DYNAMIC SELECTDAY PROTOCOL (v10.2.3) === */
function selectDay(btn, day) {
    if (typeof window.program === 'undefined' || !window.program) {
        console.error("❌ PEGASUS CRITICAL: window.program is missing! Check data.js");
        return; 
    }

    // [PUSH TRIGGER] Συγχρονισμός πριν από κάθε αλλαγή ημέρας
    if (window.PegasusCloud) window.PegasusCloud.push(true);

    // UI: Ενημέρωση Navbar Buttons (Rollback Static Style)
    document.querySelectorAll(".navbar button").forEach(b => {
        b.classList.remove("active");
        b.style.setProperty('background-color', '#000', 'important');
        b.style.color = "#fff";
    });
    
    if (btn) {
        btn.classList.add("active");
        btn.style.setProperty('background-color', '#4CAF50', 'important');
    }

    // Engine Reset: Καθαρισμός προηγούμενης κατάστασης
    clearInterval(timer); timer = null; running = false; phase = 0; currentIdx = 0;
    const sBtn = document.getElementById("btnStart");
    if (sBtn) sBtn.innerHTML = "Έναρξη";

    // Ανάκτηση κατάστασης καιρού
    const isRainy = (typeof window.isRaining === 'function') ? window.isRaining() : false;
    
    // --- 1. DYNAMIC BASE DATA FETCHING ---
    let rawBaseData = [];
    
    // Logic: Αν είναι Σ/Κ και βρέχει, αντικατάσταση Ποδηλασίας με Βάρη
    if ((day === "Σάββατο" || day === "Κυριακή") && isRainy) {
        console.log(`[WEATHER TRIGGER]: Rain detected on ${day}. Switching to Weight Mode.`);
        rawBaseData = [
            { name: "Chest Press", sets: 5, muscleGroup: "Στήθος" },
            { name: "Low Seated Row", sets: 5, muscleGroup: "Πλάτη" },
            { name: "Ab Crunches", sets: 3, muscleGroup: "Κορμός" }
        ];
    } else {
        rawBaseData = (window.program[day]) ? [...window.program[day]] : [];
    }

    // --- 2. OPTIMIZER INTEGRATION (The Volume Engine) ---
    // Ο Optimizer v2.3 θα γεμίσει την Τρίτη (60') και την Παρασκευή (Cleanup)
    let mappedData = window.PegasusOptimizer ? 
                     window.PegasusOptimizer.apply(day, rawBaseData) : 
                     rawBaseData.map(e => ({ ...e, adjustedSets: e.sets, isCompleted: false }));

    // --- 3. UI RENDERING & DATA BINDING ---
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
        const savedWeight = localStorage.getItem(`weight_ANGELOS_${cleanName}`) || "";

d.innerHTML = `
    <div class="exercise-info" onclick="window.toggleSkipExercise(${idx})">
        <div class="set-counter">0/${finalSets}</div>
        <div class="exercise-name">${cleanName}</div> 
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
    
    // 🔥 EXECUTION BUFFER (v10.2.3): Delay 150ms για σταθερότητα DOM και Video Load
    setTimeout(() => {
        if (typeof showVideo === "function") showVideo(0);
        
        if (exercises.length === 0) {
            list.innerHTML = `<div style="padding:20px; color:#666; text-align:center;">🌿 Ημέρα Αποθεραπείας (History: ${day})</div>`;
        }
    }, 150);
    
    console.log(`[PEGASUS ENGINE]: ${day} Loaded. System state: ${isRainy ? 'Rainy' : 'Clear'}.`);
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

/* ===== 5. WORKOUT ENGINE CORE (RE-ESTABLISHED v10.2.5) ===== */
function startPause() {
    if (exercises.length === 0) return;
    const vid = document.getElementById("video");
    
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

        if (phase === 1 || phase === 2) {
            let currentKcal = parseFloat(localStorage.getItem(window.M?.nutrition.today_kcal || "pegasus_today_kcal")) || 0;
            let burnRate = (phase === 1) ? (userWeight * 0.00017) : (userWeight * 0.00008); 
            localStorage.setItem(window.M?.nutrition.today_kcal || "pegasus_today_kcal", (currentKcal + burnRate).toFixed(4));
        }

        if (label) label.textContent = `${pName} (${Math.max(0, Math.ceil(t))})`;

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



/* ===== 7. VIDEO & UI UTILS (STRICT ASSET ALIGNMENT v10.6) ===== */
function showVideo(i) {
    const vid = document.getElementById("video");
    if (!vid) return;

    // ΠΡΟΣΤΑΣΙΑ: Αν δεν υπάρχει άσκηση ή το index είναι λάθος, παίζει Warmup
    if (typeof exercises === 'undefined' || !exercises[i]) {
        vid.src = "videos/warmup.mp4";
        vid.load();
        vid.play().catch(e => {});
        return;
    }

    const weightInput = exercises[i].querySelector(".weight-input");
    if (!weightInput) return;

    const name = weightInput.getAttribute("data-name") || "";
    
    // --- 🎯 SURGICAL ASSET MAPPING (Συγχρονισμός με data.js v10.3) ---
    const videoMap = {
        "Seated Chest Press": "chestpress",
        "Pec Deck Flys": "chestflys",
        "Lat Pulldown": "latpulldowns",
        "Seated Row": "lowrowsseated",
        "Bent Over Row": "bentoverrows",
        "One Arm Pulldown": "onearmpulldowns",
        "Upright Row": "uprightrows",
        "Lateral Raises": "uprightrows",
        "Shoulder Shrugs": "uprightrows",
        "Standing Bicep Curl": "bicepcurls",
        "Triceps Pushdown": "triceppulldowns",
        "Preacher Curl": "preacherbicepcurls",
        "Ab Crunch Cable": "abcrunches",
        "Leg Extension": "legextensions",
        "Glute Kickbacks": "glutekickbacks",
        "Standing Leg Curl": "glutekickbacks",
        "Cycling": "cycling",
        "EMS Training": "ems",
        "Stretching": "stretching"
    };

    let mappedVal = videoMap[name] || name.replace(/\s+/g, '').toLowerCase();
    const newSrc = `videos/${mappedVal}.mp4`;
    
    // ⚡ RESET & LOAD PROTOCOL (Αποφυγή παγώματος)
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
/* ===== 8. FINISH & REPORTING (STRICT LOCAL-FIRST v10.6.2) ===== */
function finishWorkout() {
    // Αποτροπή διπλοεκτέλεσης αν δεν υπάρχει ενεργή προπόνηση
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

    // 1. ΤΟΠΙΚΗ ΚΑΤΑΧΩΡΗΣΗ (Ασφάλεια Δεδομένων)
    let doneKey = P_M?.workout.done || "pegasus_workouts_done";
    let data = JSON.parse(localStorage.getItem(doneKey) || "{}");
    data[workoutKey] = true;
    localStorage.setItem(doneKey, JSON.stringify(data));
    
    // 2. ΜΗΔΕΝΙΣΜΟΣ CARDIO OFFSETS
    localStorage.setItem(P_M?.workout.cardio_offset || "pegasus_cardio_offset_sets", "0");

    // 3. UI UPDATE (Total Count)
    if (window.updateTotalWorkoutCount) window.updateTotalWorkoutCount();

    // 4. ΑΠΟΠΕΙΡΑ CLOUD SYNC (Silent Fail Protocol)
    if (window.PegasusCloud) {
        try {
            window.PegasusCloud.push(true);
            console.log(`[PEGASUS FINISH]: Workout ${workoutKey} synced with Cloud.`);
        } catch(e) {
            console.warn("PEGASUS CLOUD: Sync deferred due to network/CORS error. Data saved locally.");
        }
    }

    // 5. REPORTING SEQUENCE
    setTimeout(() => {
        if (window.PegasusReporting) {
            // Ανάκτηση τελικών θερμίδων
            const kcalKey = P_M?.nutrition.today_kcal || "pegasus_today_kcal";
            const currentKcal = localStorage.getItem(kcalKey) || "0";
            
            window.PegasusReporting.prepareAndSaveReport(currentKcal);
            
            // Καθαρισμός ημερήσιων θερμίδων
            localStorage.setItem(kcalKey, "0.0");
        }
        
        console.log("PEGASUS OS: Session Terminated. Reloading...");
        location.reload(); 
    }, 4000); // Μειωμένο delay για ταχύτερη απόκριση
}

/* ===== 9. PREVIEW ENGINE (STRICT ASSET ALIGNMENT v10.5) ===== */
function openExercisePreview() {
    const activeBtn = document.querySelector(".navbar button.active");
    if (!activeBtn) return alert("Παρακαλώ επίλεξε πρώτα μια ημέρα!");

    // Καθαρισμός ονόματος από emojis για σωστό matching
    const currentDay = activeBtn.textContent.trim().split(' ')[0];
    const isRainy = (typeof window.isRaining === 'function') ? window.isRaining() : false;
    
    // Ανάκτηση δεδομένων βάσει ημέρας και καιρού
    let rawData = (typeof window.calculateDailyProgram !== 'undefined') ? 
                  window.calculateDailyProgram(currentDay, isRainy) : 
                  ((window.program[currentDay]) ? [...window.program[currentDay]] : []);

    // Ενσωμάτωση Spillover Logic (Κυριακή -> Παρασκευή) στην προεπισκόπηση
    if (currentDay === "Παρασκευή" && !isRainy && window.program["Κυριακή"]) {
        const bonus = window.program["Κυριακή"]
            .filter(ex => !ex.name.includes("Ποδηλασία") && !ex.name.includes("Cycling"))
            .map(ex => ({...ex, isSpillover: false}));
        rawData = [...rawData, ...bonus];
    }

    // Εφαρμογή Optimizer
    const dayExercises = window.PegasusOptimizer ? window.PegasusOptimizer.apply(currentDay, rawData) : 
                         rawData.map(e => ({ ...e, adjustedSets: e.sets }));

    const panel = document.getElementById('previewPanel');
    const content = document.getElementById('previewContent');
    if (!panel || !content) return;

    panel.style.display = 'block'; 
    content.innerHTML = ''; 

    // Ενημέρωση Muscle Progress UI
    if (window.MuscleProgressUI) { 
        window.MuscleProgressUI.lastDataHash = null;
        window.MuscleProgressUI.render(); 
    }

    // --- 🎯 SURGICAL IMAGE MAPPING (Συγχρονισμός με data.js v10.3) ---
    const nameMapping = {
        // ΣΤΗΘΟΣ
        "Seated Chest Press": "chestpress",
        "Pec Deck Flys": "chestflys",
        "Pushups": "pushups",

        // ΠΛΑΤΗ
        "Lat Pulldown": "latpulldowns",
        "Seated Row": "lowrowsseated",
        "Bent Over Row": "bentoverrows",
        "One Arm Pulldown": "onearmpulldowns",
        "EMS Training": "ems",

        // ΩΜΟΙ
        "Upright Row": "uprightrows",
        "Lateral Raises": "uprightrows",
        "Shoulder Shrugs": "uprightrows",

        // ΧΕΡΙΑ
        "Standing Bicep Curl": "bicepcurls",
        "Triceps Pushdown": "triceppulldowns", // Match με triceppulldowns.png
        "Preacher Curl": "preacherbicepcurls",

        // ΚΟΡΜΟΣ
        "Ab Crunch Cable": "abcrunches",
        "Plank": "plank",
        "Reverse Crunch": "reversecrunch",
        "Leg Raise Hip Lift": "legraisehiplift",

        // ΠΟΔΙΑ
        "Leg Extension": "legextensions",
        "Standing Leg Curl": "glutekickbacks", // Visual Proxy
        "Glute Kickbacks": "glutekickbacks",
        "Cycling": "cycling",

        // OTHER
        "Stretching": "stretching",
        "Warmup": "warmup"
    };

    dayExercises.filter(ex => (ex.adjustedSets || ex.sets) > 0).forEach((ex) => {
        const cleanName = ex.name.trim();
        // Αντιστοίχιση στο mapping ή μετατροπή σε lowercase χωρίς κενά αν δεν υπάρχει στη λίστα
        let imgName = nameMapping[cleanName] || cleanName.replace(/\s+/g, '').toLowerCase();
        
        // Καθορισμός επέκτασης αρχείου (Cycling = .jpg, τα υπόλοιπα .png)
        let ext = (imgName === "cycling") ? ".jpg" : ".png";

        content.innerHTML += `
            <div class="preview-item">
                <img src="images/${imgName}${ext}" onerror="this.src='images/placeholder.jpg'">
                <p>${cleanName} (${ex.adjustedSets || ex.sets} set)</p>
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

/* ==========================================================================
   PEGASUS OS - CORE BOOT SEQUENCE (v10.1 STABLE)
   Protocol: Console-Validated Global Bridge & Unified UI Mapping
   ========================================================================== */

window.onload = () => {
    // --- 0. GLOBAL CONSTANTS (Declared ONCE) ---
    const greekDays = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
    const todayObj = new Date();
    const todayName = greekDays[todayObj.getDay()];

    // --- 1. PEGASUS SATURDAY RESET PROTOCOL ---
    if (todayName === "Σάββατο") {
        const lastReset = localStorage.getItem('pegasus_last_reset');
        const todayDateStr = todayObj.toISOString().split('T')[0];
        
        if (lastReset !== todayDateStr) {
            console.log("🚀 PEGASUS: New Weekly Cycle Starting! Resetting History...");
            const freshHistory = { "Στήθος": 0, "Πλάτη": 0, "Ώμοι": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 };
            localStorage.setItem('pegasus_weekly_history', JSON.stringify(freshHistory));
            localStorage.setItem('pegasus_last_reset', todayDateStr);
            localStorage.setItem('pegasus_cardio_offset_sets', "0");
        }
    }

    // --- 2. INITIALIZATION ---
    if (typeof emailjs !== 'undefined') emailjs.init('qsfyDrneUHP7zEFui');
    createNavbar();
    if (window.updateTotalWorkoutCount) window.updateTotalWorkoutCount();

    // --- 3. MASTER UI MAPPING (Command Center) ---
    window.masterUI = {
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
            localStorage.setItem(weightKey, weightVal);
            if (window.PegasusCloud) window.PegasusCloud.push(true);
            location.reload();
        }
    };

    // --- 4. EVENT DELEGATION ---
    Object.keys(window.masterUI).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.onclick = (e) => {
                e.stopPropagation();
                const target = window.masterUI[btnId];
                if (!btnId.includes("Save") && !btnId.includes("Start")) {
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

    // --- 5. AUTO-SELECT TODAY ---
    setTimeout(() => { 
        document.querySelectorAll(".navbar button").forEach(b => { 
            if (b.textContent.trim().split(' ')[0] === todayName) {
                if (typeof selectDay === "function") {
                    selectDay(b, b.textContent);
                    setTimeout(() => {
                        remainingSets = exercises.map(ex => parseFloat(ex.dataset.total));
                        currentIdx = 0;
                        console.log("🚀 PEGASUS: Circuit Auto-Initialized for Today.");
                    }, 150);
                }
            }
        }); 
    }, 400);

    if (window.PegasusUI && typeof window.PegasusUI.init === "function") window.PegasusUI.init();
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
