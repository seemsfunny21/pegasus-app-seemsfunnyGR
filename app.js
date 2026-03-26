/* ==========================================================================
   PEGASUS MASTER CONTROLLER - v29.0 (STRICT UI BINDING)
   Protocol: Full Dashboard Orchestration & Panel Linkage
   ========================================================================== */

const PegasusCore = (function() {
    let state = {
        isActive: false, timer: null, phase: 0, currentIdx: 0,
        exercises: [], remainingSets: [], totalSeconds: 0, 
        remainingSeconds: 0, muted: false, audioUnlocked: false
    };

    const sysAudio = new Audio('videos/beep.mp3');

    // 1. ΔΗΜΙΟΥΡΓΙΑ NAVBAR (Ημέρες)
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
        const todayIdx = new Date().getDay();
        const adjustedIdx = todayIdx === 0 ? 6 : todayIdx - 1;
        const todayBtn = document.getElementById(`nav-${days[adjustedIdx]}`);
        if (todayBtn) window.selectDay(todayBtn, days[adjustedIdx]);
    };

    // 2. ΔΙΑΧΕΙΡΙΣΗ PANEL (Εμφάνιση/Απόκρυψη)
    const togglePanel = (panelId) => {
        const panels = ["foodPanel", "calendarPanel", "achievementsPanel", "settingsPanel", "previewPanel", "toolsPanel", "galleryPanel", "cardioPanel", "emsModal"];
        panels.forEach(id => {
            const p = document.getElementById(id);
            if (p) p.style.display = (id === panelId) ? "block" : "none";
        });

        // Trigger Module Renders
        if (panelId === "foodPanel" && window.renderFood) window.renderFood();
        if (panelId === "calendarPanel" && window.renderCalendar) window.renderCalendar();
        if (panelId === "achievementsPanel" && window.renderAchievements) window.renderAchievements();
        if (panelId === "previewPanel") window.openExercisePreview();
    };

    // 3. ΣΥΝΔΕΣΗ ΚΟΥΜΠΙΩΝ (UI Binding)
    const bindDashboardButtons = () => {
        const mapping = {
            "btnWarmup": () => { const v = document.getElementById("video"); if(v){ v.src="videos/warmup.mp4"; v.load(); v.play(); } },
            "btnStart": () => toggleStartPause(),
            "btnNext": () => window.skipToNext(),
            "btnCalendarUI": () => togglePanel("calendarPanel"),
            "btnAchUI": () => togglePanel("achievementsPanel"),
            "btnFoodUI": () => togglePanel("foodPanel"),
            "btnPreviewUI": () => togglePanel("previewPanel"),
            "btnSettingsUI": () => togglePanel("settingsPanel"),
            "btnToolsUI": () => togglePanel("toolsPanel"),
            "btnManualEmail": () => { if(window.PegasusReporting) window.PegasusReporting.checkAndSendMorningReport(true); },
            "totalWorkoutsDisplay": () => { if(window.openCardio) window.openCardio(); else togglePanel("cardioPanel"); },
            "btnEMS": () => { if(window.logEMSData) window.logEMSData(); else togglePanel("emsModal"); },
            "btnOpenGallery": () => togglePanel("galleryPanel")
        };

        Object.entries(mapping).forEach(([id, func]) => {
            const btn = document.getElementById(id);
            if (btn) btn.onclick = (e) => { e.stopPropagation(); func(); };
        });
    };

    // 4. WORKOUT ENGINE LOGIC
    const toggleStartPause = () => {
        state.isActive = !state.isActive;
        const btn = document.getElementById("btnStart");
        if (btn) btn.textContent = state.isActive ? "Παύση" : "Συνέχεια";
        if (state.isActive) runEngine(); else clearInterval(state.timer);
    };

    const runEngine = () => {
        if (!state.isActive) return;
        clearInterval(state.timer);

        const phases = [ {n: "ΠΡΟΕΤΟΙΜΑΣΙΑ", d: 10}, {n: "ΑΣΚΗΣΗ", d: 45}, {n: "ΔΙΑΛΕΙΜΜΑ", d: 60} ];
        let t = phases[state.phase].d;
        
        window.showVideo(state.currentIdx);

        state.timer = setInterval(() => {
            t--;
            state.remainingSeconds = Math.max(0, state.remainingSeconds - 1);
            updateUI();

            const label = document.getElementById("phaseTimer");
            if (label) label.textContent = `${phases[state.phase].n} (${t})`;

            if (t <= 0) {
                clearInterval(state.timer);
                playBeep();
                if (state.phase === 1) {
                    state.phase = 2;
                    recordSet();
                } else if (state.phase === 2) {
                    state.phase = 0;
                    state.currentIdx = (state.currentIdx + 1) % state.exercises.length;
                } else {
                    state.phase = 1;
                }
                runEngine();
            }
        }, 1000);
    };

    const recordSet = () => {
        const node = state.exercises[state.currentIdx];
        const name = node.querySelector(".weight-input").dataset.name;
        let done = parseInt(node.dataset.done) + 1;
        node.dataset.done = done;
        node.querySelector(".set-counter").textContent = `${done}/${node.dataset.total}`;
        if (window.logPegasusSet) window.logPegasusSet(name);
    };

    const playBeep = () => { if (!state.muted) sysAudio.play().catch(() => {}); };

    const updateUI = () => {
        // Update Progress Bar
        const bar = document.getElementById("totalProgress");
        if (bar && state.totalSeconds > 0) {
            bar.style.width = `${((state.totalSeconds - state.remainingSeconds) / state.totalSeconds) * 100}%`;
        }
        // Update Timer Text
        const timerTxt = document.getElementById("totalProgressTime");
        if (timerTxt) {
            const m = Math.floor(state.remainingSeconds / 60);
            const s = state.remainingSeconds % 60;
            timerTxt.textContent = `${m}:${String(s).padStart(2, '0')}`;
        }
    };

    // 5. GLOBAL ACCESSORS
    window.selectDay = (btn, day) => {
        document.querySelectorAll(".navbar button").forEach(b => b.classList.remove("active"));
        if (btn) btn.classList.add("active");
        
        let data = window.calculateDailyProgram ? window.calculateDailyProgram(day) : [];
        const list = document.getElementById("exList");
        list.innerHTML = "";
        state.exercises = [];
        
        data.forEach((ex, i) => {
            const div = document.createElement("div");
            div.className = "exercise";
            div.dataset.total = ex.sets || 4;
            div.dataset.done = 0;
            div.innerHTML = `
                <div class="exercise-info" onclick="window.toggleSkipExercise(${i})">
                    <div class="set-counter">0/${ex.sets || 4}</div>
                    <div class="exercise-name">${ex.name}</div>
                    <input type="number" class="weight-input" data-name="${ex.name}" value="${localStorage.getItem('weight_'+ex.name)||''}" onclick="event.stopPropagation()">
                </div>
            `;
            list.appendChild(div);
            state.exercises.push(div);
        });
        state.totalSeconds = state.exercises.length * 4 * 115;
        state.remainingSeconds = state.totalSeconds;
        updateUI();
    };

    window.skipToNext = () => {
        clearInterval(state.timer);
        state.phase = 0;
        state.currentIdx = (state.currentIdx + 1) % state.exercises.length;
        runEngine();
    };

    // 6. INITIALIZATION
    return {
        init: () => {
            // Force Profile for Calorie Audit
            if (!localStorage.getItem("pegasus_weight") || localStorage.getItem("pegasus_weight") === "0") {
                localStorage.setItem("pegasus_weight", "74");
                localStorage.setItem("pegasus_height", "187");
                localStorage.setItem("pegasus_age", "38");
            }
            createNavbar();
            bindDashboardButtons();
            
            // Initial UI Sync
            if (window.updateTotalWorkoutCount) window.updateTotalWorkoutCount();
            if (window.fetchWeather) window.fetchWeather();
            
            // Click outside to close panels
            window.onclick = (e) => {
                if (!e.target.closest('.pegasus-panel') && !e.target.closest('.p-btn') && !e.target.closest('.navbar')) {
                    togglePanel(null);
                }
            };
        }
    };
})();

window.addEventListener("load", PegasusCore.init);
