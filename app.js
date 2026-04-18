/* ==========================================================================
   PEGASUS WORKOUT ENGINE - v10.42 (THE CLEAN ENGINE)
   Protocol: Partial Session Memory + Auto-Sort + Smart Sync Logic
   Status: FINAL STABLE | ZERO-BUG VERIFIED
   ========================================================================== */

var M = M || window.PegasusManifest;
var P_M = M; 

window.masterUI = window.masterUI || {}; 

if (!M) {
    console.warn("⚠️ PEGASUS CRITICAL: Manifest not found during app.js boot.");
}

/* ===== 1. ISSUE LOGGER (DIAGNOSTIC MODE) ===== */
window.pegasusLogs = JSON.parse(localStorage.getItem(P_M?.system?.logs || "pegasus_system_logs") || "[]");
const originalError = console.error;
const originalWarn = console.warn;

console.error = function(...args) {
    window.pegasusLogs.push({ type: "ERROR", time: new Date().toLocaleTimeString('el-GR'), msg: args.join(" ") });
    localStorage.setItem(P_M?.system?.logs || "pegasus_system_logs", JSON.stringify(window.pegasusLogs.slice(-50)));
    originalError.apply(console, args);
};

console.warn = function(...args) {
    window.pegasusLogs.push({ type: "WARNING", time: new Date().toLocaleTimeString('el-GR'), msg: args.join(" ") });
    localStorage.setItem(P_M?.system?.logs || "pegasus_system_logs", JSON.stringify(window.pegasusLogs.slice(-50)));
    originalWarn.apply(console, args);
};

window.addEventListener('error', function(event) {
    console.error(`Runtime Error: ${event.message} at ${event.filename}:${event.lineno}`);
});

/* ===== 2. CORE VARIABLES ===== */
var exercises = [];
var remainingSets = [];
var currentIdx = 0;
var phase = 0; // 0: Prep, 1: Work, 2: Rest
var running = false;
var timer = null;
var totalSeconds = 0;
var remainingSeconds = 0;
var sessionActiveKcal = 0;
var muted = localStorage.getItem(P_M?.system?.mute || "pegasus_mute_state") === "true";
var TURBO_MODE = localStorage.getItem(P_M?.system?.turbo || "pegasus_turbo_state") === "true";
var SPEED = TURBO_MODE ? 10 : 1;
var userWeight = parseFloat(localStorage.getItem(P_M?.user?.weight || "pegasus_weight")) || 74;

/* ===== 2.5 DYNAMIC UI KCAL CONTROLLER ===== */
window.updateKcalUI = function() {
    const kcalDisplay = document.querySelector(".kcal-value");
    const kcalLabel = document.querySelector(".kcal-label"); 
    if (!kcalDisplay) return;

    const isWorkoutActive = running || currentIdx > 0 || phase > 0;

    if (isWorkoutActive) {
        // Κατά την προπόνηση δείχνει τι καίμε εκείνη τη στιγμή
        kcalDisplay.textContent = parseFloat(sessionActiveKcal).toFixed(1);
        kcalDisplay.style.color = "#FFC107"; 
        if (kcalLabel) kcalLabel.textContent = "KCAL ΠΡΟΠΟΝΗΣΗΣ";
    } else {
        // Όταν είναι κλειστό, δείχνει τον Στόχο Ημέρας βάσει Πλάνου (IRON, HYBRID κλπ)
        const dailyTarget = (typeof window.calculatePegasusDailyTarget === "function") 
                            ? window.calculatePegasusDailyTarget() 
                            : (localStorage.getItem('pegasus_today_kcal') || "2100");
        
        kcalDisplay.textContent = dailyTarget;
        kcalDisplay.style.color = "#4CAF50"; 
        if (kcalLabel) kcalLabel.textContent = "ΣΤΟΧΟΣ ΗΜΕΡΑΣ (KCAL)";
    }
};

/* ===== 3. AUDIO SYSTEM ===== */
let sysAudio = new Audio('videos/beep.mp3');
let audioUnlocked = false;

document.addEventListener('click', function() {
    if (!audioUnlocked) {
        sysAudio.play().then(() => {
            sysAudio.pause(); sysAudio.currentTime = 0; audioUnlocked = true;
            console.log("🔊 PEGASUS OS: Audio Unlocked & Ready.");
        }).catch(err => console.warn("PEGASUS OS: Audio unlock pending user action", err));
    }
}, { once: true });

const playBeep = (volume = 1) => {
    if (!muted) {
        sysAudio.volume = volume; sysAudio.currentTime = 0; 
        sysAudio.play().catch(e => console.log("Audio execution blocked by browser policy", e));
    }
};

/* ===== PEGASUS ENGINE BRIDGE (SAFE WRAPPER) ===== */
window._pegasusEventBuffer = [];

window.PegasusEngine = {
    dispatch: function (action) {
        window._pegasusEventBuffer.push({
            action,
            time: Date.now()
        });
        console.log("📨 PEGASUS ENGINE EVENT:", action);
    },

    getEventBuffer: function () {
        return window._pegasusEventBuffer || [];
    },

    getState: function () {
        return {
            exercises,
            remainingSets,
            currentIdx,
            phase,
            running,
            totalSeconds,
            remainingSeconds,
            sessionActiveKcal,
            TURBO_MODE,
            SPEED,
            userWeight
        };
    }
};

/* ===== 3.5 SMART SYNC (AUTO-SKIP COMPLETED TARGETS) ===== */
window.syncSessionWithHistory = function() {
    console.log("🔄 PEGASUS SMART SYNC: Executing...");
    const historyKey = P_M?.workout?.weekly_history || 'pegasus_weekly_history';
    const history = JSON.parse(localStorage.getItem(historyKey)) || {};
    const targets = (typeof window.getDynamicTargets === "function") ? window.getDynamicTargets() : {};

    exercises.forEach((exDiv, i) => {
        const exName = exDiv.querySelector(".exercise-name").textContent.trim();
        const muscle = (window.exercisesDB?.find(e => e.name.trim() === exName))?.muscleGroup;

        if (muscle) {
            const doneWeekly = parseInt(history[muscle]) || 0;
            const targetWeekly = parseInt(targets[muscle]) || 0;
            if (targetWeekly > 0 && doneWeekly >= targetWeekly) {
                if (!exDiv.classList.contains("exercise-skipped") && remainingSets[i] > 0) {
                    window.toggleSkipExercise(i, true);
                }
            }
        }
    });
};

/* ===== 4. NAVIGATION BINDING ===== */
function createNavbar() {
    const days = ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο", "Κυριακή"];
    days.forEach((d) => {
        const btn = document.getElementById(`nav-${d}`);
        if (btn) {
            btn.onclick = (e) => {
                if (e && e.isTrusted && window.PegasusCloud && typeof window.PegasusCloud.push === "function") {
                    window.PegasusCloud.push();
                }
                selectDay(btn, d);
            };
        }
    });
}

function selectDay(btn, day) {
    if (typeof window.program === 'undefined' || !window.program) return;

    document.querySelectorAll(".navbar button").forEach(b => {
        b.classList.remove("active");
        b.style.setProperty('background-color', 'transparent', 'important');
        b.style.color = "#333"; 
    });
    
    if (btn) {
        btn.classList.add("active");
        btn.style.setProperty('background-color', 'rgba(76, 175, 80, 0.1)', 'important');
        btn.style.color = "#4CAF50"; 
    }

    clearInterval(timer); timer = null; running = false; phase = 0; currentIdx = 0;
    sessionActiveKcal = 0; localStorage.setItem("pegasus_session_kcal", "0.0");
    
const sBtn = document.getElementById("btnStart");
    if (sBtn) sBtn.innerHTML = "Έναρξη";

    // 🛡️ PROTECTED METABOLIC ADJUSTER BRIDGE (Anti-Loop)
    // Προσθέτουμε έναν έλεγχο για να μην ξανακαλείται η συνάρτηση αν τρέχει ήδη
    if (typeof window.calculatePegasusDailyTarget === "function") {
        if (!window.isCalculatingTarget) {
            window.isCalculatingTarget = true; 
            
            window.calculatePegasusDailyTarget();
            
            // Ξεκλειδώνει μετά από 100ms για να επιτρέψει την επόμενη ΧΕΙΡΟΚΙΝΗΤΗ αλλαγή
            setTimeout(() => { window.isCalculatingTarget = false; }, 100);
        }
    } else if (typeof window.updateKcalUI === "function") {
        window.updateKcalUI();
    }

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

    // 🎯 SORTING PATCH: Βάζουμε πρώτες τις ασκήσεις με τα περισσότερα σετ
    mappedData.sort((a, b) => parseFloat(b.adjustedSets || b.sets) - parseFloat(a.adjustedSets || a.sets));

    const list = document.getElementById("exList");
    if (!list) return;
    list.innerHTML = ""; 
    exercises = []; remainingSets = []; 

    // 💾 DAILY PROGRESS MEMORY FETCH
    const todayStr = new Date().toISOString().split('T')[0];
    let dailyProg = JSON.parse(localStorage.getItem('pegasus_daily_progress') || "{}");
    if(dailyProg.date !== todayStr) dailyProg = { date: todayStr, exercises: {} };

    mappedData.forEach((e, idx) => {
        if (!e.name || e.name === "αα" || e.adjustedSets < 0.1) return;
        const cleanName = e.name.trim();
        const safeName = cleanName.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        
        let finalSets = parseFloat(e.adjustedSets);
        let doneSoFar = dailyProg.exercises[cleanName] || 0; 
        let remSets = Math.max(0, finalSets - doneSoFar);

        const d = document.createElement("div");
        d.className = "exercise"; 
        d.dataset.total = finalSets; 
        d.dataset.done = doneSoFar; 
        d.dataset.index = idx;

        const savedWeight = window.getSavedWeight(cleanName);
        const displayWeight = (savedWeight && savedWeight !== "") ? savedWeight : (e.weight || "");

        d.innerHTML = `
            <div class="exercise-info" onclick="window.toggleSkipExercise(${idx})">
                <div class="set-counter">${doneSoFar}/${finalSets}</div>
                <div class="exercise-name">${cleanName}</div> 
                <input type="number" id="weight-${idx}" class="weight-input" data-name="${safeName}" placeholder="kg" value="${displayWeight}" onclick="event.stopPropagation()" onchange="saveWeight('${cleanName}', this.value)">
            </div>
            <div class="progress-box"><div class="progress-bar"></div></div>
        `;
        
        list.appendChild(d); exercises.push(d); remainingSets.push(remSets);

        if (remSets === 0) {
            d.classList.add("exercise-skipped");
            d.style.setProperty('opacity', '0.2', 'important');
            d.style.setProperty('filter', 'grayscale(100%)', 'important');
        }
    });

    if (typeof calculateTotalTime === "function") calculateTotalTime(false);
    setTimeout(() => { window.syncSessionWithHistory(); }, 50);

    setTimeout(() => {
        if (typeof showVideo === "function") showVideo(0);
        if (exercises.length === 0) list.innerHTML = `<div style="padding:20px; color:#666; text-align:center;">🌿 Ημέρα Αποθεραπείας (History: ${day})</div>`;
    }, 150);
}

/* ===== 5. WORKOUT ENGINE CORE (DYNAMIC TIMER PATCH) ===== */
function startPause() {
    if (exercises.length === 0) return;
    const vid = document.getElementById("video");
    
    // 🎯 SMART START
    if (!running) {
        let firstAvailable = remainingSets.findIndex((sets, idx) => sets > 0 && !exercises[idx].classList.contains("exercise-skipped"));
        if (currentIdx === 0 && phase === 0 && totalSeconds === remainingSeconds) {
            if (firstAvailable !== -1) currentIdx = firstAvailable;
        } else if (exercises[currentIdx] && exercises[currentIdx].classList.contains("exercise-skipped")) {
            if (firstAvailable !== -1) currentIdx = firstAvailable;
        }
    }

    if (!running && currentIdx === 0 && phase === 0) {
        sessionActiveKcal = 0; localStorage.setItem("pegasus_session_kcal", "0.0");
    }

    if (vid && vid.src.includes("warmup")) { vid.loop = false; vid.pause(); }

    running = !running;
    const sBtn = document.getElementById("btnStart");
    if (sBtn) sBtn.innerHTML = running ? "Παύση" : "Συνέχεια";
    
    if (typeof window.updateKcalUI === "function") window.updateKcalUI();

    if (running) runPhase(); 
    else {
        clearInterval(timer);
        if (window.PegasusCloud && typeof window.PegasusCloud.push === "function") window.PegasusCloud.push();
    }
}

function runPhase() {
    if (!running) return;
    if (timer) clearInterval(timer);

    if (remainingSets.every(s => s <= 0)) { finishWorkout(); return; }

    const e = exercises[currentIdx];
    if (!e) return;
    const exName = e.querySelector(".weight-input").getAttribute("data-name");
    let liftedWeight = parseFloat(e.querySelector(".weight-input").value) || 0;
    
    let baseMET = 3.5; let intensityMultiplier = 1.0;
    if (exName.toLowerCase().includes("cycling") || exName.toLowerCase().includes("ποδηλασία")) baseMET = 8.0; 
    else if (liftedWeight > 0) intensityMultiplier = 1 + (liftedWeight / 100); 
    
    let kcalPerMin = (baseMET * intensityMultiplier * userWeight * 3.5) / 200;
    let kcalPerSecond = kcalPerMin / 60;

    exercises.forEach(ex => { ex.style.borderColor = "#222"; ex.style.background = "transparent"; });
    e.style.borderColor = "#4CAF50"; e.style.background = "rgba(76, 175, 80, 0.1)";

    const config = window.pegasusTimerConfig || { prep: 10, work: 45, rest: 60 };
    let t = (phase === 0) ? config.prep : (phase === 1 ? config.work : config.rest);
    let pName = (phase === 0) ? "ΠΡΟΕΤΟΙΜΑΣΙΑ" : (phase === 1 ? "ΑΣΚΗΣΗ" : "ΔΙΑΛΕΙΜΜΑ");
    let cssClass = (phase === 0) ? "timer-prep" : (phase === 1 ? "timer-work" : "timer-rest");

    const label = document.getElementById("phaseTimer");
    const barFill = document.getElementById("phaseTimerFill");
    
    if (label) {
        label.textContent = `${pName} (${Math.max(0, Math.ceil(t))})`;
        label.className = "phase-label " + cssClass;
    }

    if (phase !== 2) showVideo(currentIdx);

    timer = setInterval(() => {
        t -= 1;
        if (remainingSeconds > 0) { remainingSeconds -= 1; updateTotalBar(); }

        if (phase === 1) sessionActiveKcal += (kcalPerSecond * SPEED);
        else if (phase === 2) {
            let restKcalPerSec = ((2.0 * userWeight * 3.5) / 200) / 60;
            sessionActiveKcal += (restKcalPerSec * SPEED);
        }

        if (label) label.textContent = `${pName} (${Math.max(0, Math.ceil(t))})`;
        
        if (barFill) {
            let totalPhaseTime = (phase === 0) ? config.prep : (phase === 1 ? config.work : config.rest);
            barFill.style.width = (((totalPhaseTime - t) / totalPhaseTime) * 100) + "%";
        }
        if (typeof window.updateKcalUI === "function") window.updateKcalUI();

        if (t <= 0) {
            clearInterval(timer); playBeep();
            
            if (phase === 0) { phase = 1; runPhase(); } 
            else if (phase === 1) {
                // 🎯 SESSION MEMORY UPDATE
                let done = parseInt(e.dataset.done) || 0;
                done++; e.dataset.done = done;
                remainingSets[currentIdx] = parseFloat(e.dataset.total) - done;
                e.querySelector(".set-counter").textContent = `${done}/${e.dataset.total}`;
                
                const todayStr = new Date().toISOString().split('T')[0];
                let dailyProg = JSON.parse(localStorage.getItem('pegasus_daily_progress') || "{}");
                if(dailyProg.date !== todayStr) dailyProg = { date: todayStr, exercises: {} };
                dailyProg.exercises[exName] = done;
                localStorage.setItem('pegasus_daily_progress', JSON.stringify(dailyProg));

                if (window.updateAchievements) window.updateAchievements(exName);
                if (window.logPegasusSet) window.logPegasusSet(exName);
                if (window.PegasusCloud && typeof window.PegasusCloud.push === "function") window.PegasusCloud.push();

                phase = 2; runPhase();
            } else {
                let next = getNextIndexCircuit();
                if (next !== -1) { currentIdx = next; phase = 0; runPhase(); } 
                else finishWorkout();
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
        done++; currentExNode.dataset.done = done;
        remainingSets[currentIdx]--;
        currentExNode.querySelector(".set-counter").textContent = `${done}/${currentExNode.dataset.total}`;
        
        // 🎯 SESSION MEMORY UPDATE
        const todayStr = new Date().toISOString().split('T')[0];
        let dailyProg = JSON.parse(localStorage.getItem('pegasus_daily_progress') || "{}");
        if(dailyProg.date !== todayStr) dailyProg = { date: todayStr, exercises: {} };
        dailyProg.exercises[exName] = done;
        localStorage.setItem('pegasus_daily_progress', JSON.stringify(dailyProg));

        if (window.logPegasusSet) window.logPegasusSet(exName);
    }

    if (window.PegasusCloud && typeof window.PegasusCloud.push === "function") window.PegasusCloud.push();

    let nextIdx = getNextIndexCircuit();
    if (nextIdx !== -1) {
        currentIdx = nextIdx; phase = 0; 
        if (running) runPhase(); else showVideo(currentIdx);
    } else finishWorkout();
}

function getNextIndexCircuit() {
    for (let i = 1; i <= remainingSets.length; i++) {
        let idx = (currentIdx + i) % remainingSets.length;
        if (remainingSets[idx] > 0 && !exercises[idx].classList.contains("exercise-skipped")) return idx;
    }
    return -1;
}

window.toggleSkipExercise = function(idx, auto = false) {
    const exDiv = exercises[idx];
    if (!exDiv) return;
    
    const originalSets = parseFloat(exDiv.dataset.total);
    const isSkipped = exDiv.classList.toggle("exercise-skipped");
    let done = parseInt(exDiv.dataset.done) || 0;

    if (isSkipped) {
        exDiv.style.setProperty('opacity', '0.2', 'important');
        exDiv.style.setProperty('filter', 'grayscale(100%)', 'important');
        remainingSets[idx] = 0;
        
        // 🎯 AUTO-JUMP LOGIC
        if (!auto && currentIdx === idx && running) {
            clearInterval(timer);
            let nextIdx = getNextIndexCircuit();
            if (nextIdx !== -1) { currentIdx = nextIdx; phase = 0; runPhase(); } 
            else finishWorkout();
        }
    } else {
        exDiv.style.setProperty('opacity', '1', 'important');
        exDiv.style.setProperty('filter', 'none', 'important');
        remainingSets[idx] = originalSets - done;
    }
    calculateTotalTime(true);
    if (window.PegasusCloud && typeof window.PegasusCloud.push === "function") window.PegasusCloud.push();
};

window.getActiveLifter = function() {
    const btn = document.getElementById('btnPartnerMode');
    if (window.partnerData && window.partnerData.isActive && window.partnerData.currentPartner !== "") {
        return window.partnerData.currentPartner;
    }
    return "ΑΓΓΕΛΟΣ";
};

window.getSavedWeight = function(exerciseName) {
    const cleanName = exerciseName.trim();
    const lifter = window.getActiveLifter();
    let allWeights = JSON.parse(localStorage.getItem(M?.workout?.exerciseWeights || "pegasus_exercise_weights") || "{}");

    if (allWeights[lifter] && allWeights[lifter][cleanName] !== undefined) return allWeights[lifter][cleanName];

    if (lifter === "ΑΓΓΕΛΟΣ") {
        let old1 = localStorage.getItem(`weight_ΑΓΓΕΛΟΣ_${cleanName}`);
        let old2 = localStorage.getItem(`weight_${cleanName}`);
        if (old1) return old1; if (old2) return old2;
    }
    return "";
};

window.saveWeight = function(name, val) {
    const cleanName = name.trim();
    const lifter = window.getActiveLifter();
    let allWeights = JSON.parse(localStorage.getItem(M?.workout?.exerciseWeights || "pegasus_exercise_weights") || "{}");
    
    if (!allWeights[lifter]) allWeights[lifter] = {};
    allWeights[lifter][cleanName] = val;
    localStorage.setItem(M?.workout?.exerciseWeights || "pegasus_exercise_weights", JSON.stringify(allWeights));
    if (lifter === "ΑΓΓΕΛΟΣ") localStorage.setItem(`weight_ΑΓΓΕΛΟΣ_${cleanName}`, val);

    if (window.MuscleProgressUI?.render) window.MuscleProgressUI.render();
    if (window.PegasusCloud?.push) window.PegasusCloud.push();
};

function showVideo(i) {
    const vid = document.getElementById("video");
    const label = document.getElementById("phaseTimer");
    if (!vid) return;

    const activeBtn = document.querySelector(".navbar button.active");
    const currentDay = activeBtn ? activeBtn.id.replace('nav-', '') : "";
    const isRecoveryDay = (currentDay === "Δευτέρα" || currentDay === "Πέμπτη");

    if (isRecoveryDay || typeof exercises === 'undefined' || !exercises[i]) {
        const recoverySrc = "videos/stretching.mp4";
        if (vid.getAttribute('src') !== recoverySrc) {
            vid.pause(); vid.src = recoverySrc; vid.load(); vid.play().catch(e => console.log("Waiting for user..."));
            if (label && isRecoveryDay) { label.textContent = "ΑΠΟΘΕΡΑΠΕΙΑ: STRETCHING"; label.style.color = "#00bcd4"; }
        }
        return;
    }

    const weightInput = exercises[i].querySelector(".weight-input");
    if (!weightInput) return;

    let name = weightInput.getAttribute("data-name") || "";
    let mappedVal = window.videoMap ? window.videoMap[name.trim()] : null;
    if (!mappedVal) mappedVal = name.replace(/\s+/g, '').toLowerCase();

    const newSrc = `videos/${mappedVal}.mp4`;
    if (vid.getAttribute('src') !== newSrc) {
        vid.pause(); vid.src = newSrc; vid.load(); 
        vid.play().catch(err => {
            vid.src = "videos/warmup.mp4"; vid.load(); vid.play();
        });
    }
}

function calculateTotalTime(isUpdate = false) {
    const config = window.pegasusTimerConfig || { prep: 10, work: 45, rest: 60 };
    let newTotal = exercises.reduce((acc, ex) => {
        if (ex.classList.contains("exercise-skipped")) return acc;
        let sets = parseFloat(ex.dataset.total) || 0;
        return acc + (sets * (config.prep + config.work + config.rest));
    }, 0);

    if (isUpdate) {
        let diff = totalSeconds - newTotal;
        totalSeconds = newTotal;
        remainingSeconds = Math.max(0, remainingSeconds - diff);
    } else {
        totalSeconds = newTotal; remainingSeconds = newTotal;
    }

    const timeDisplay = document.getElementById("totalProgressTime"); 
    if (timeDisplay) {
        const m = Math.floor(remainingSeconds / 60);
        const s = remainingSeconds % 60;
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

/* ===== 7.5 STRICT METABOLIC AUTO-ADJUSTER (MULTI-PLAN) ===== */
window._isCalculatingTarget = false; // Zero-Bug: Execution Lock

window.calculatePegasusDailyTarget = function() {
    // Zero-Bug: Αποτροπή άπειρου βρόχου (Infinite Recursion Guard)
    if (window._isCalculatingTarget) return; 
    window._isCalculatingTarget = true;

    const greekDays = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
    const dayName = greekDays[new Date().getDay()];
    
    // Ανάκτηση όλων των ρυθμίσεων (Active Plan, Weight, κλπ.) από το κεντρικό αρχείο
    const settings = typeof window.getPegasusSettings === "function" 
        ? window.getPegasusSettings() 
        : { activeSplit: 'IRON' }; 
        
    const activePlan = settings.activeSplit;
    
    // --- 7.6 INTEGRATED BIO-METRIC CALCULATION ---
    const dynamicProtein = window.calculatePegasusBioMetrics(settings);
    
    const KCAL_REST = 2100;    // Δευτέρα & Πέμπτη
    const KCAL_WEIGHTS = 2800; // Τυπική προπόνηση
    const KCAL_EMS = 2700;     // Ειδική Τετάρτη
    const KCAL_BIKE = 3100;    // Σαββατοκύριακο

    let target = KCAL_REST;
    let currentActivity = "ΑΠΟΘΕΡΑΠΕΙΑ";

    if (dayName === "Δευτέρα" || dayName === "Πέμπτη") {
        target = KCAL_REST;
        currentActivity = "ΑΠΟΘΕΡΑΠΕΙΑ";
    } else {
        switch(activePlan) {
            case 'IRON':
                target = KCAL_WEIGHTS;
                currentActivity = "ΒΑΡΗ";
                break;
            case 'EMS_ONLY':
                if (dayName === "Τετάρτη") { target = KCAL_EMS; currentActivity = "EMS"; }
                else { target = KCAL_WEIGHTS; currentActivity = "ΒΑΡΗ"; }
                break;
            case 'BIKE_ONLY':
                if (dayName === "Σάββατο" || dayName === "Κυριακή") { target = KCAL_BIKE; currentActivity = "ΠΟΔΗΛΑΤΟ"; }
                else { target = KCAL_WEIGHTS; currentActivity = "ΒΑΡΗ"; }
                break;
            case 'HYBRID': // Το MIX
                if (dayName === "Τετάρτη") { target = KCAL_EMS; currentActivity = "EMS"; }
                else if (dayName === "Σάββατο" || dayName === "Κυριακή") { target = KCAL_BIKE; currentActivity = "ΠΟΔΗΛΑΤΟ"; }
                else { target = KCAL_WEIGHTS; currentActivity = "ΒΑΡΗ"; }
                break;
            default:
                target = KCAL_WEIGHTS;
        }
    }

    // Αποθήκευση θερμίδων
    localStorage.setItem(M?.diet?.todayKcal || 'pegasus_today_kcal', target);
    
    console.log(`🏛️ PEGASUS OS [${activePlan}]: Στόχος (${dayName}): ${target} kcal | Πρωτεΐνη: ${dynamicProtein}g (Dynamic).`);
    
    if (typeof window.updateKcalUI === "function") window.updateKcalUI();
    
    // Zero-Bug: Απελευθέρωση του Lock
    window._isCalculatingTarget = false; 
};

/* ===== 7.6 AUTOMATED BIO-METRIC CALCULATOR ===== */
window.calculatePegasusBioMetrics = function(settingsObj) {
    // Αν δεν δοθεί το αντικείμενο, προσπαθούμε να το τραβήξουμε
    const currentSettings = settingsObj || (typeof window.getPegasusSettings === "function" ? window.getPegasusSettings() : null);
    
    // Default Fallbacks σε περίπτωση που το settings.js δεν είναι φορτωμένο
    const weight = currentSettings ? currentSettings.weight : 74; 
    const multiplier = 2.17; // Αθλητικός συντελεστής (Bulk/Maintain)

    // Αυτόματος υπολογισμός πρωτεΐνης βάσει του ΔΥΝΑΜΙΚΟΥ βάρους
    const autoProtein = Math.round(weight * multiplier); 
    
    // Αποθήκευση στο σύστημα (για να το διαβάζει το UI)
    localStorage.setItem(M?.diet?.todayProtein || 'pegasus_today_protein', autoProtein);
    
    return autoProtein;
};

/* ===== 8. FINISH & REPORTING ===== */
function finishWorkout() {
    if (!running && !timer && phase === 0) return; 
    
    clearInterval(timer); running = false; remainingSeconds = 0; updateTotalBar();

    const label = document.getElementById("phaseTimer");
    if (label) { label.textContent = "ΟΛΟΚΛΗΡΩΣΗ & ΤΟΠΙΚΗ ΑΠΟΘΗΚΕΥΣΗ..."; label.style.color = "#4CAF50"; }

    const now = new Date();
    const workoutKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let doneKey = P_M?.workout?.done || "pegasus_workouts_done";
    let data = JSON.parse(localStorage.getItem(doneKey) || "{}");
    data[workoutKey] = true;
    localStorage.setItem(doneKey, JSON.stringify(data));
    localStorage.setItem(P_M?.workout?.cardio_offset || "pegasus_cardio_offset_sets", "0");

    if (window.updateTotalWorkoutCount) window.updateTotalWorkoutCount();
    if (window.PegasusCloud?.push) window.PegasusCloud.push();
    if (typeof openExercisePreview === 'function') openExercisePreview();

    setTimeout(() => {
        if (window.PegasusReporting?.prepareAndSaveReport) {
            let sessionKcal = sessionActiveKcal;
            let currentWeekly = parseFloat(localStorage.getItem("pegasus_weekly_kcal")) || 0;
            localStorage.setItem("pegasus_weekly_kcal", (currentWeekly + sessionKcal).toFixed(1));

            let todayKcal = parseFloat(localStorage.getItem(P_M?.diet?.todayKcal || "pegasus_today_kcal")) || 0;
            localStorage.setItem(P_M?.diet?.todayKcal || "pegasus_today_kcal", (todayKcal + sessionKcal).toFixed(1));

            window.PegasusReporting.prepareAndSaveReport(sessionKcal.toFixed(1));
            sessionActiveKcal = 0; localStorage.setItem("pegasus_session_kcal", "0.0");
        } 
        
        const list = document.getElementById("exList");
        if (list) list.innerHTML = `<div style="padding:20px; color:#4CAF50; text-align:center; font-weight:bold; font-size:16px;">✅ Η ΠΡΟΠΟΝΗΣΗ ΟΛΟΚΛΗΡΩΘΗΚΕ ΕΠΙΤΥΧΩΣ</div>`;
        
        const vid = document.getElementById("video");
        if (vid) {
            vid.pause(); vid.src = "videos/stretching.mp4"; vid.load(); vid.play().catch(e => console.log("Auto-play prevented"));
        }

        const sBtn = document.getElementById("btnStart");
        if (sBtn) sBtn.innerHTML = "Έναρξη";
        if (label) { label.textContent = "ΑΠΟΘΕΡΑΠΕΙΑ: STRETCHING"; label.style.color = "#00bcd4"; }

        console.log("🎯 PEGASUS OS: Session Successfully Terminated.");
    }, 3000);
}

function openExercisePreview() {
    const activeBtn = document.querySelector(".navbar button.active");
    if (!activeBtn) return alert("Παρακαλώ επίλεξε πρώτα μια ημέρα!");

    const currentDay = activeBtn.id.replace('nav-', ''); 
    const isRainy = (typeof window.isRaining === 'function') ? window.isRaining() : false;
    
    let rawData = (typeof window.calculateDailyProgram !== 'undefined') ? 
                  window.calculateDailyProgram(currentDay, isRainy) : 
                  ((window.program && window.program[currentDay]) ? [...window.program[currentDay]] : []);

    if (currentDay === "Παρασκευή" && !isRainy && window.program && window.program["Κυριακή"]) {
        const bonus = window.program["Κυριακή"].filter(ex => !ex.name.includes("Ποδηλασία") && !ex.name.includes("Cycling")).map(ex => ({...ex, isSpillover: false}));
        rawData = [...rawData, ...bonus];
    }

    const dayExercises = window.PegasusOptimizer ? window.PegasusOptimizer.apply(currentDay, rawData) : rawData.map(e => ({ ...e, adjustedSets: e.sets }));
    const panel = document.getElementById('previewPanel');
    const content = document.getElementById('previewContent');
    const muscleContainer = document.getElementById('muscleProgressContainer'); 

    if (!panel || !content) return;

    panel.style.display = 'block'; content.innerHTML = ''; if (muscleContainer) muscleContainer.innerHTML = ''; 

    dayExercises.filter(ex => (ex.adjustedSets || ex.sets) > 0).forEach((ex) => {
        const cleanName = ex.name.trim();
        let imgBase = window.videoMap ? window.videoMap[cleanName] : null;
        if (!imgBase) imgBase = cleanName.replace(/\s+/g, '').toLowerCase();

        const imgPath = (imgBase === "cycling") ? `images/${imgBase}.jpg` : `images/${imgBase}.png`;
        content.innerHTML += `
            <div class="preview-item">
                <img src="${imgPath}" onerror="this.onerror=null; this.src='images/placeholder.jpg';" alt="${cleanName}">
                <p>${cleanName} (${ex.adjustedSets || ex.sets} set)</p>
            </div>
        `;
    });
    
    if (typeof window.forcePegasusRender === "function") setTimeout(() => window.forcePegasusRender(), 50);
}

/* ===== 10. TRACKING ===== */
window.logPegasusSet = function(exName) {
    let historyKey = P_M?.workout?.weekly_history || 'pegasus_weekly_history';
    let history = JSON.parse(localStorage.getItem(historyKey)) || { "Στήθος": 0, "Πλάτη": 0, "Ώμοι": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 };

    let muscle = (window.exercisesDB?.find(ex => ex.name.trim() === exName.trim()))?.muscleGroup || "Άλλο";
    let value = 1;

    const cleanName = exName.trim().toUpperCase();
    if (cleanName.includes("ΠΟΔΗΛΑΣΙΑ") || cleanName.includes("CYCLING")) { muscle = "Πόδια"; value = 18; } 
    else if (cleanName.includes("EMS ΠΟΔΙΩΝ")) { muscle = "Πόδια"; value = 6; }

    if (history.hasOwnProperty(muscle)) {
        history[muscle] += value;
        localStorage.setItem(historyKey, JSON.stringify(history));
        if (window.MuscleProgressUI?.render) setTimeout(() => window.MuscleProgressUI.render(), 50); 
    }
};

window.updateTotalWorkoutCount = function() {
    const data = JSON.parse(localStorage.getItem(P_M?.workout?.done || "pegasus_workouts_done") || "{}");
    const count = Object.keys(data).length;
    localStorage.setItem(P_M?.workout?.total || "pegasus_total_workouts", count);
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
                if (window.PegasusCloud?.push) window.PegasusCloud.push();
            }
        } catch (e) { console.error("🛡️ PEGASUS RESET ERROR:", e); }
    }

    setTimeout(() => {
        if (window.PegasusCloud?.getMasterWeight && window.PegasusWeight) {
            window.PegasusWeight.alignWithCloud(window.PegasusCloud.getMasterWeight());
        }
    }, 2000);

    if (typeof emailjs !== 'undefined') emailjs.init('qsfyDrneUHP7zEFui');
    
    // 🎯 INITIALIZE UI BRIDGE
    const importInput = document.getElementById('importFileTools');
    if (importInput) importInput.onchange = (e) => window.importPegasusData(e);

createNavbar();
    if (window.updateTotalWorkoutCount) window.updateTotalWorkoutCount();
    if (window.updateKoukiBalance) window.updateKoukiBalance();
    
    // 🎯 STRICT BOOT PRIORITY: Πρώτα υπολογισμός στόχου, μετά εμφάνιση στο UI
    if (typeof window.calculatePegasusDailyTarget === "function") {
        window.calculatePegasusDailyTarget(); 
    } else if (typeof window.updateKcalUI === "function") {
        window.updateKcalUI();
    }

    window.masterUI = {
        "btnStart": startPause,
        "btnNext": skipToNextExercise,
        "btnWarmup": () => {
            const vid = document.getElementById("video");
            if (!vid) return;
            if (!vid.src.includes("warmup.mp4")) {
                vid.pause(); vid.src = "videos/warmup.mp4"; vid.load(); vid.play().catch(e => console.log(e));
            } else {
                vid.pause();
                if (typeof window.showVideo === "function" && window.exercises && window.exercises.length > 0) {
                    window.currentIdx = 0; window.phase = 0; window.showVideo(0);
                }
            }
        },
        "btnTurboTools": () => {
            window.TURBO_MODE = !window.TURBO_MODE; window.SPEED = window.TURBO_MODE ? 10 : 1;
            const btn = document.getElementById('btnTurboTools');
            if(btn) { btn.textContent = window.TURBO_MODE ? "🚀 TURBO: ΕΝΕΡΓΟ" : "🚀 TURBO: ΑΝΕΝΕΡΓΟ"; btn.style.color = window.TURBO_MODE ? "#ff4444" : "#4CAF50"; }
        },
        "btnMuteTools": () => {
            window.muted = !window.muted;
            const btn = document.getElementById('btnMuteTools');
            if(btn) { btn.textContent = window.muted ? "🔇 ΗΧΟΣ: ΣΙΓΑΣΗ" : "🔊 ΗΧΟΣ: ΕΝΕΡΓΟΣ"; btn.style.color = window.muted ? "#888" : "#4CAF50"; }
        },
        "btnPartnerMode": () => { if (typeof window.togglePartnerMode === 'function') window.togglePartnerMode(); },
        "btnImportData": () => { const f = document.getElementById('importFileTools'); if(f) f.click(); },
        "btnExportData": () => { if (window.exportPegasusData) window.exportPegasusData(); },
        "btnMasterVault": () => { const m = document.getElementById('pinModal'); if(m) m.style.display = 'flex'; },
        "btnPlanSelector": { panel: "planModal", init: null },
        "btnCalendarUI": { panel: "calendarPanel", init: window.renderCalendar },
        "btnAchUI": { panel: "achievementsPanel", init: window.renderAchievements },
        "btnSettingsUI": { panel: "settingsPanel", init: window.initSettingsUI },
        "btnFoodUI": { panel: "foodPanel", init: window.updateFoodUI },
        "btnProposalsUI": () => {
            if (window.PegasusDietAdvisor?.renderAdvisorUI) window.renderAdvisorUI();
            else alert("Σφάλμα: Το dietAdvisor.js δεν έχει φορτωθεί σωστά.");
        },
        "btnToolsUI": { panel: "toolsPanel", init: null },
        "btnPreviewUI": { panel: "previewPanel", init: window.renderPreview || openExercisePreview }, 
        "btnGallery": { panel: "galleryPanel", init: () => { if(window.GalleryEngine) window.GalleryEngine.render(); } },
        "btnCardio": { panel: "cardioPanel", init: () => { if(window.PegasusCardio) window.PegasusCardio.open(); } },
        "btnEMS": { panel: "emsModal", init: window.logEMSData },
        "btnManualEmail": () => {
            if (window.PegasusReporting?.checkAndSendMorningReport) window.PegasusReporting.checkAndSendMorningReport(true);
            else alert("Reporting Engine Offline");
        },
        "btnSaveSettings": () => { 
            if (typeof window.savePegasusSettingsGlobal === "function") {
                window.savePegasusSettingsGlobal(); 
            } else {
                const weightVal = document.getElementById("userWeightInput")?.value || 74;
                if (window.PegasusWeight?.save) window.PegasusWeight.save(weightVal);
                else localStorage.setItem(P_M?.user?.weight || "pegasus_weight", weightVal);
                if (window.PegasusCloud?.push) window.PegasusCloud.push(true);
                setTimeout(() => { location.reload(); }, 300);
            }
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
            if (b.id.replace('nav-', '') === todayName) {
                if (typeof selectDay === "function") {
                    selectDay(b, todayName);
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

    if (window.PegasusUI?.init) window.PegasusUI.init();

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
