/* ==========================================================================
   PEGASUS MASTER CONTROLLER - v30.0 (FINAL CUMULATIVE EDITION)
   Protocol: Strict Data Analyst - Full UI Binding & Metabolic Integration
   ========================================================================== */

const PegasusCore = (function() {
    // 1. ΙΔΙΩΤΙΚΟ STATE (Private Engine State)
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
        speed: 1, // Για Turbo Mode (10x)
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

    // 3. ΔΙΑΧΕΙΡΙΣΗ PANEL (UI Logic)
    const togglePanel = (panelId) => {
        const panels = ["foodPanel", "calendarPanel", "achievementsPanel", "settingsPanel", "previewPanel", "toolsPanel", "galleryPanel", "cardioPanel", "emsModal"];
        panels.forEach(id => {
            const p = document.getElementById(id);
            if (p) p.style.display = (id === panelId) ? "block" : "none";
        });

        // Trigger Module-Specific Renders
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

        // Visual Reset
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
            updateUI();

            // Metabolic / Calorie Tracking (Real-time)
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
        if (window.PegasusCloud) window.PegasusCloud.push(true);
    };

    const playBeep = () => { if (!state.muted && state.audioUnlocked) sysAudio.play().catch(() => {}); };

    const updateUI = () => {
        // Progress Bar Update
        const bar = document.getElementById("totalProgress");
        if (bar && state.totalSeconds > 0) {
            const pct = ((state.totalSeconds - state.remainingSeconds) / state.totalSeconds) * 100;
            bar.style.width = `${Math.min(100, pct)}%`;
        }
        // Timer Text Update
        const timerTxt = document.getElementById("totalProgressTime");
        if (timerTxt) {
            const m = Math.floor(state.remainingSeconds / 60);
            const s = state.remainingSeconds % 60;
            timerTxt.textContent = `${m}:${String(s).padStart(2, "0")}`;
        }
    };

    // 5. GLOBAL ACCESSORS (Visible to HTML)
    window.selectDay = (btn, day) => {
        document.querySelectorAll(".navbar button").forEach(b => b.classList.remove("active"));
        if (btn) btn.classList.add("active");

        clearInterval(state.timer);
        state.isActive = false;
        state.phase = 0;
        state.currentIdx = 0;
        const startBtn = document.getElementById("btnStart");
        if (startBtn) startBtn.textContent = "Έναρξη";

        // Logic Fetch
        let rawData = window.getFinalProgram ? window.getFinalProgram(day) : [];
        let mappedData = window.PegasusOptimizer ? window.PegasusOptimizer.apply(day, rawData) : rawData;

        const list = document.getElementById("exList");
        list.innerHTML = "";
        state.exercises = [];
        state.remainingSets = [];

        mappedData.forEach((e, idx) => {
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
        
        let fileName = name.replace(/\s+/g, '').toLowerCase();
        if (window.videoMap && window.videoMap[name]) {
            fileName = window.videoMap[name];
        }

        const path = `videos/${fileName}.mp4?v=${Date.now()}`;
        vid.src = path;
        vid.load();
        vid.play().catch(() => {
            if (fileName !== 'warmup') {
                vid.src = 'videos/warmup.mp4';
                vid.load();
                vid.play();
            }
        });
    };

    window.toggleSkipExercise = (idx) => {
        const ex = state.exercises[idx];
        if (!ex) return;
        const isSkipped = ex.classList.toggle("exercise-skipped");
        state.remainingSets[idx] = isSkipped ? 0 : parseInt(ex.dataset.total);
        window.calculateTotalTime();
    };

    window.calculateTotalTime = () => {
        const cycle = 10 + (parseInt(localStorage.getItem("pegasus_ex_time")) || 45) + (parseInt(localStorage.getItem("pegasus_rest_time")) || 60);
        state.totalSeconds = state.remainingSets.reduce((a, b) => a + (b * cycle), 0);
        state.remainingSeconds = state.totalSeconds;
        updateUI();
    };

    window.finishWorkout = () => {
        clearInterval(state.timer);
        const kcal = document.querySelector(".kcal-value")?.textContent || "0";
        if (window.PegasusReporting) window.PegasusReporting.prepareAndSaveReport(kcal);
        alert("PEGASUS: Η ΠΡΟΠΟΝΗΣΗ ΟΛΟΚΛΗΡΩΘΗΚΕ!");
        location.reload();
    };

    window.saveWeight = (name, val) => {
        localStorage.setItem(`weight_ANGELOS_${name}`, val);
        localStorage.setItem(`weight_${name}`, val);
        if (window.PegasusCloud) window.PegasusCloud.push(true);
    };

    // 6. INITIALIZATION
    return {
        init: () => {
            // Strict Profile Setup
            if (!localStorage.getItem("pegasus_weight") || localStorage.getItem("pegasus_weight") === "0") {
                localStorage.setItem("pegasus_weight", "74");
                localStorage.setItem("pegasus_height", "187");
                localStorage.setItem("pegasus_age", "38");
            }
            
            createNavbar();

            // Bind Control Buttons
            const mapping = {
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
                "btnCalendarUI": () => togglePanel("calendarPanel"),
                "btnAchUI": () => togglePanel("achievementsPanel"),
                "btnFoodUI": () => togglePanel("foodPanel"),
                "btnPreviewUI": () => togglePanel("previewPanel"),
                "btnSettingsUI": () => togglePanel("settingsPanel"),
                "btnToolsUI": () => togglePanel("toolsPanel"),
                "btnManualEmail": () => { if (window.PegasusReporting) window.PegasusReporting.checkAndSendMorningReport(true); },
                "totalWorkoutsDisplay": () => { if (window.openCardio) window.openCardio(); else togglePanel("cardioPanel"); },
                "btnEMS": () => { if (window.logEMSData) window.logEMSData(); else togglePanel("emsModal"); },
                "btnOpenGallery": () => togglePanel("galleryPanel")
            };

            Object.entries(mapping).forEach(([id, func]) => {
                const btn = document.getElementById(id);
                if (btn) btn.onclick = (e) => { e.stopPropagation(); func(); };
            });

            // Audio Unlock Gesture
            document.addEventListener('click', () => {
                if (!state.audioUnlocked) {
                    sysAudio.play().then(() => { sysAudio.pause(); state.audioUnlocked = true; });
                }
            }, { once: true });

            if (window.updateTotalWorkoutCount) window.updateTotalWorkoutCount();
            if (window.fetchWeather) window.fetchWeather();
        }
    };
})();

window.addEventListener("load", PegasusCore.init);
