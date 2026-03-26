/* ==========================================================================
   PEGASUS MASTER CONTROLLER - v31.0 (ULTIMATE CUMULATIVE EDITION)
   Protocol: Strict Data Analyst - Full UI Orchestration & Event Binding
   ========================================================================== */

const PegasusCore = (function() {
    // 1. ΙΔΙΩΤΙΚΟ STATE (Engine State)
    let state = {
        isActive: false,
        timer: null,
        phase: 0, // 0: Προετοιμασία, 1: Άσκηση, 2: Διάλειμμα
        currentIdx: 0,
        exercises: [],
        remainingSets: [],
        totalSeconds: 0,
        remainingSeconds: 0,
        muted: false,
        speed: 1,
        audioUnlocked: false,
        userWeight: parseFloat(localStorage.getItem("pegasus_weight")) || 74
    };

    const sysAudio = new Audio('videos/beep.mp3');

    // 2. UI: ΔΗΜΙΟΥΡΓΙΑ NAVBAR (Ημέρες)
    const createNavbar = () => {
        const nav = document.getElementById("navbar");
        if (!nav) return;
        const days = ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο", "Κυριακή"];
        nav.innerHTML = "";
        
        days.forEach((d) => {
            const b = document.createElement("button");
            b.textContent = d;
            b.id = `nav-${d}`;
            b.onclick = () => window.selectDay(b, d);
            nav.appendChild(b);
        });

        // Αυτόματη επιλογή σημερινής ημέρας (Greek Time)
        const todayIdx = new Date().getDay();
        const adjustedIdx = todayIdx === 0 ? 6 : todayIdx - 1;
        const todayName = days[adjustedIdx];
        const todayBtn = document.getElementById(`nav-${todayName}`);
        if (todayBtn) window.selectDay(todayBtn, todayName);
    };

    // 3. ΔΙΑΧΕΙΡΙΣΗ PANEL (Show/Hide Modals)
/* === ΔΙΟΡΘΩΣΗ ΣΤΟ app.js === */

const togglePanel = (panelId) => {
    const panels = ["foodPanel", "calendarPanel", "achievementsPanel", "settingsPanel", "previewPanel", "toolsPanel", "galleryPanel", "cardioPanel", "emsModal"];
    panels.forEach(id => {
        const p = document.getElementById(id);
        if (p) p.style.display = (id === panelId) ? "block" : "none";
    });

    // ΕΝΕΡΓΟΠΟΙΗΣΗ RENDERING ΑΝΑ MODULE
    if (panelId === "foodPanel" && window.renderFood) window.renderFood();
    if (panelId === "calendarPanel" && window.renderCalendar) window.renderCalendar();
    if (panelId === "achievementsPanel" && window.renderAchievements) window.renderAchievements();
    if (panelId === "previewPanel" && window.openExercisePreview) window.openExercisePreview();
    
    // ΠΡΟΣΘΗΚΗ: Ενεργοποίηση ρυθμίσεων
    if (panelId === "settingsPanel" && window.PegasusSettings) {
        window.PegasusSettings.render(); 
    }
};

// Ενημέρωση στο bindDashboardButtons
"btnSettingsUI": () => togglePanel("settingsPanel"),

        // Trigger Module Renders
        if (panelId === "foodPanel" && window.renderFood) window.renderFood();
        if (panelId === "calendarPanel" && window.renderCalendar) window.renderCalendar();
        if (panelId === "achievementsPanel" && window.renderAchievements) window.renderAchievements();
        if (panelId === "previewPanel" && window.openExercisePreview) window.openExercisePreview();
    };

    // 4. CORE ENGINE: PHASES & TIMER
    const runPhase = () => {
        if (!state.isActive) return;
        clearInterval(state.timer);

        if (state.remainingSets.every(s => s <= 0)) {
            window.finishWorkout();
            return;
        }

        const exTime = parseInt(localStorage.getItem("pegasus_ex_time")) || 45;
        const restTime = parseInt(localStorage.getItem("pegasus_rest_time")) || 60;
        const phases = [ 
            {n: "ΠΡΟΕΤΟΙΜΑΣΙΑ", d: 10}, 
            {n: "ΑΣΚΗΣΗ", d: exTime}, 
            {n: "ΔΙΑΛΕΙΜΜΑ", d: restTime} 
        ];

        const currentExNode = state.exercises[state.currentIdx];
        const wInput = currentExNode.querySelector(".weight-input");
        const exName = wInput ? wInput.dataset.name : "Unknown";

        // Visual Reset & Focus
        state.exercises.forEach(ex => { 
            ex.style.borderColor = "#222"; 
            ex.style.background = "transparent"; 
        });
        currentExNode.style.borderColor = "#4CAF50";
        currentExNode.style.background = "rgba(76, 175, 80, 0.1)";

        let t = phases[state.phase].d;
        if (state.phase !== 2) window.showVideo(state.currentIdx);

        state.timer = setInterval(() => {
            t--;
            state.remainingSeconds = Math.max(0, state.remainingSeconds - 1);
            updateProgressBar();

            // Metabolic Tracking
            if (state.phase === 1 && window.MetabolicEngine) {
                window.MetabolicEngine.updateTracking(1, exName);
            }

            const label = document.getElementById("phaseTimer");
            if (label) {
                label.textContent = `${phases[state.phase].n} (${Math.max(0, t)})`;
                label.style.color = (state.phase === 1) ? "#4CAF50" : (state.phase === 2 ? "#FFC107" : "#64B5F6");
            }

            if (t <= 0) {
                clearInterval(state.timer);
                playBeep();
                
                if (state.phase === 0) {
                    state.phase = 1;
                    runPhase();
                } else if (state.phase === 1) {
                    completeSet(currentExNode, exName);
                    state.phase = 2;
                    runPhase();
                } else if (state.phase === 2) {
                    state.currentIdx = (state.currentIdx + 1) % state.exercises.length;
                    state.phase = 0;
                    runPhase();
                }
            }
        }, 1000 / state.speed);
    };

    const completeSet = (node, name) => {
        let done = (parseInt(node.dataset.done) || 0) + 1;
        let total = parseInt(node.dataset.total) || 4;
        node.dataset.done = done;
        state.remainingSets[state.currentIdx] = Math.max(0, total - done);

        const counter = node.querySelector(".set-counter");
        if (counter) counter.textContent = `${done}/${total}`;
        
        if (window.logPegasusSet) window.logPegasusSet(name);
    };

    const playBeep = () => { if (!state.muted && state.audioUnlocked) sysAudio.play().catch(() => {}); };

    const updateProgressBar = () => {
        const bar = document.getElementById("totalProgress");
        const text = document.getElementById("totalProgressTime");
        if (!bar || state.totalSeconds <= 0) return;

        const pct = ((state.totalSeconds - state.remainingSeconds) / state.totalSeconds) * 100;
        bar.style.width = `${Math.min(100, pct)}%`;

        if (text) {
            const m = Math.floor(state.remainingSeconds / 60);
            const s = state.remainingSeconds % 60;
            text.textContent = `${m}:${String(s).padStart(2, "0")}`;
        }
    };

    // 5. GLOBAL BRIDGES
    window.selectDay = (btn, day) => {
        document.querySelectorAll(".navbar button").forEach(b => b.classList.remove("active"));
        if (btn) btn.classList.add("active");

        clearInterval(state.timer);
        state.isActive = false;
        state.phase = 0;
        state.currentIdx = 0;
        const startBtn = document.getElementById("btnStart");
        if (startBtn) startBtn.textContent = "Έναρξη";

        let data = window.getFinalProgram ? window.getFinalProgram(day) : [];
        const list = document.getElementById("exList");
        list.innerHTML = "";
        state.exercises = [];
        state.remainingSets = [];

        data.forEach((e, idx) => {
            const div = document.createElement("div");
            div.className = "exercise";
            div.dataset.total = e.sets || 4;
            div.dataset.done = 0;
            
            const weight = localStorage.getItem(`weight_ANGELOS_${e.name}`) || localStorage.getItem(`weight_${e.name}`) || "";

            div.innerHTML = `
                <div class="exercise-info" onclick="window.toggleSkipExercise(${idx})">
                    <div class="set-counter">0/${div.dataset.total}</div>
                    <div class="exercise-name">${e.name}</div>
                    <input type="number" class="weight-input" data-name="${e.name}" value="${weight}" 
                           onclick="event.stopPropagation()" onchange="window.saveWeight('${e.name}', this.value)">
                </div>
                <div class="progress-box"><div class="progress-bar"></div></div>
            `;
            list.appendChild(div);
            state.exercises.push(div);
            state.remainingSets.push(parseInt(div.dataset.total));
        });

        window.calculateTotalTime();
        window.showVideo(0);
    };

    window.showVideo = (idx) => {
        const vid = document.getElementById("video");
        if (!vid || !state.exercises[idx]) return;
        const name = state.exercises[idx].querySelector(".weight-input").dataset.name;
        
        let file = name.replace(/\s+/g, '').toLowerCase();
        if (window.videoMap && window.videoMap[name]) file = window.videoMap[name];

        vid.src = `videos/${file}.mp4?v=${Date.now()}`;
        vid.load();
        vid.play().catch(() => {
            if (file !== 'warmup') { vid.src = 'videos/warmup.mp4'; vid.load(); vid.play(); }
        });
    };

    window.calculateTotalTime = () => {
        const cycle = 10 + (parseInt(localStorage.getItem("pegasus_ex_time")) || 45) + (parseInt(localStorage.getItem("pegasus_rest_time")) || 60);
        state.totalSeconds = state.remainingSets.reduce((a, b) => a + (b * cycle), 0);
        state.remainingSeconds = state.totalSeconds;
        updateProgressBar();
    };

    window.toggleSkipExercise = (idx) => {
        const ex = state.exercises[idx];
        if (!ex) return;
        const isSkipped = ex.classList.toggle("exercise-skipped");
        state.remainingSets[idx] = isSkipped ? 0 : parseInt(ex.dataset.total);
        window.calculateTotalTime();
    };

    window.saveWeight = (name, val) => {
        localStorage.setItem(`weight_ANGELOS_${name}`, val);
        localStorage.setItem(`weight_${name}`, val);
    };

    window.finishWorkout = () => {
        clearInterval(state.timer);
        const kcal = document.querySelector(".kcal-value")?.textContent || "0";
        if (window.PegasusReporting) window.PegasusReporting.prepareAndSaveReport(kcal);
        alert("ΠΡΟΠΟΝΗΣΗ ΟΛΟΚΛΗΡΩΘΗΚΕ!");
        location.reload();
    };

    // 6. INITIALIZATION & BINDING
    const init = () => {
        // Strict Profile Injection
        if (!localStorage.getItem("pegasus_weight") || localStorage.getItem("pegasus_weight") === "0") {
            localStorage.setItem("pegasus_weight", "74");
            localStorage.setItem("pegasus_height", "187");
            localStorage.setItem("pegasus_age", "38");
        }

        createNavbar();

        // BINDING MAP (IDs to Functions)
        const uiMap = {
            "btnStart": () => {
                state.isActive = !state.isActive;
                document.getElementById("btnStart").textContent = state.isActive ? "Παύση" : "Συνέχεια";
                if (state.isActive) runPhase(); else clearInterval(state.timer);
            },
            "btnNext": () => {
                clearInterval(state.timer);
                state.phase = 0;
                state.currentIdx = (state.currentIdx + 1) % state.exercises.length;
                runPhase();
            },
            "btnWarmup": () => {
                const v = document.getElementById("video");
                if (v) { v.src = "videos/warmup.mp4"; v.load(); v.play(); }
            },
            "btnFoodUI": () => togglePanel("foodPanel"),
            "btnCalendarUI": () => togglePanel("calendarPanel"),
            "btnAchUI": () => togglePanel("achievementsPanel"),
            "btnSettingsUI": () => togglePanel("settingsPanel"),
            "btnToolsUI": () => togglePanel("toolsPanel"),
            "btnPreviewUI": () => togglePanel("previewPanel"),
            "btnOpenGallery": () => togglePanel("galleryPanel"),
            "btnEMS": () => { if(window.logEMSData) window.logEMSData(); else togglePanel("emsModal"); },
            "totalWorkoutsDisplay": () => { if(window.openCardio) window.openCardio(); else togglePanel("cardioPanel"); },
            "btnManualEmail": () => { if(window.PegasusReporting) window.PegasusReporting.checkAndSendMorningReport(true); },
            "btnSaveEMS": () => { if(window.saveEMSFinal) window.saveEMSFinal(); },
            "btnCloseEMS": () => togglePanel(null),
            "btnSaveCardio": () => { if(window.saveCardioData) window.saveCardioData(); },
            "btnCloseCardio": () => togglePanel(null),
            "btnSaveSettings": () => { if(window.PegasusSettings) window.PegasusSettings.save(); }
        };

        // Attach Listeners
        Object.entries(uiMap).forEach(([id, func]) => {
            const el = document.getElementById(id);
            if (el) el.onclick = (e) => { e.stopPropagation(); func(); };
        });

        // Audio Unlock
        document.addEventListener('click', () => {
            if (!state.audioUnlocked) {
                sysAudio.play().then(() => { sysAudio.pause(); state.audioUnlocked = true; });
            }
        }, { once: true });

        // Initial Data Fetch
        if (window.updateTotalWorkoutCount) window.updateTotalWorkoutCount();
        if (window.fetchWeather) window.fetchWeather();
    };

    return { init: init };
})();

// LAUNCH
window.addEventListener("load", PegasusCore.init);
