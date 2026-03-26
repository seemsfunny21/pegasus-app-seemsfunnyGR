/* ==========================================================================
   PEGASUS MASTER CONTROLLER - v28.0 (FINAL MODULAR ORCHESTRATION)
   Protocol: Strict Data Analyst - Full Dashboard & Global Bridge Restoration
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

        // Αυτόματη επιλογή σημερινής ημέρας βάσει ελληνικής ώρας
        const todayIdx = new Date().getDay();
        const adjustedIdx = todayIdx === 0 ? 6 : todayIdx - 1;
        const todayName = days[adjustedIdx];
        const todayBtn = document.getElementById(`nav-${todayName}`);
        if (todayBtn) window.selectDay(todayBtn, todayName);
    };

    // 3. CORE ENGINE: PHASES & TIMER
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
            {n: "ΑΣΚΗΣΗ (ΑΓΓΕΛΟΣ)", d: exTime}, 
            {n: "ΔΙΑΛΕΙΜΜΑ", d: restTime} 
        ];

        const currentExNode = state.exercises[state.currentIdx];
        const wInput = currentExNode.querySelector(".weight-input");
        const exName = wInput ? wInput.dataset.name : "Unknown";

        // Visual Reset & Highlighting
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
            updateTotalProgress();

            // Metabolic / Calorie Tracking
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
                    state.currentIdx = getNextIndex();
                    state.phase = 0;
                    if (state.currentIdx !== -1) runPhase();
                    else window.finishWorkout();
                }
            }
        }, 1000 / state.speed);
    };

    const completeSet = (node, name) => {
        let done = parseInt(node.dataset.done) || 0;
        let total = parseInt(node.dataset.total) || 0;
        done++;
        node.dataset.done = done;
        state.remainingSets[state.currentIdx] = total - done;

        const counter = node.querySelector(".set-counter");
        if (counter) counter.textContent = `${done}/${total}`;
        
        if (window.logPegasusSet) window.logPegasusSet(name);
        if (window.PegasusCloud) window.PegasusCloud.push(true);
    };

    const getNextIndex = () => {
        for (let i = 1; i <= state.remainingSets.length; i++) {
            let idx = (state.currentIdx + i) % state.remainingSets.length;
            if (state.remainingSets[idx] > 0 && !state.exercises[idx].classList.contains("exercise-skipped")) return idx;
        }
        return -1;
    };

    const playBeep = () => {
        if (!state.muted) {
            sysAudio.currentTime = 0;
            sysAudio.play().catch(() => {});
        }
    };

    const updateTotalProgress = () => {
        const bar = document.getElementById("totalProgress");
        const text = document.getElementById("totalProgressTime");
        if (state.totalSeconds <= 0) return;

        const progress = ((state.totalSeconds - state.remainingSeconds) / state.totalSeconds) * 100;
        if (bar) bar.style.width = `${progress}%`;
        if (text) {
            const m = Math.floor(state.remainingSeconds / 60);
            const s = Math.floor(state.remainingSeconds % 60);
            text.textContent = `${m}:${String(s).padStart(2, "0")}`;
        }
    };

    // 4. GLOBAL BRIDGE (HTML-Visible Functions)
    window.selectDay = (btn, day) => {
        document.querySelectorAll(".navbar button").forEach(b => b.classList.remove("active"));
        if (btn) btn.classList.add("active");

        clearInterval(state.timer);
        state.isActive = false;
        state.phase = 0;
        state.currentIdx = 0;
        document.getElementById("btnStart").textContent = "Έναρξη";

        let rawData = window.getFinalProgram ? window.getFinalProgram(day) : [];
        let mappedData = window.PegasusOptimizer ? window.PegasusOptimizer.apply(day, rawData) : rawData;

        const list = document.getElementById("exList");
        list.innerHTML = "";
        state.exercises = [];
        state.remainingSets = [];

        mappedData.forEach((e, idx) => {
            const div = document.createElement("div");
            div.className = "exercise";
            div.dataset.total = e.adjustedSets || 4;
            div.dataset.done = 0;
            
            const weight = localStorage.getItem(`weight_ANGELOS_${e.name}`) || localStorage.getItem(`weight_${e.name}`) || "";

            div.innerHTML = `
                <div class="exercise-info" onclick="window.toggleSkipExercise(${idx})">
                    <div class="set-counter">0/${div.dataset.total}</div>
                    <div class="exercise-name">${e.name}</div>
                    <input type="number" class="weight-input" data-name="${e.name}" value="${weight}" onclick="event.stopPropagation()" onchange="window.saveWeight('${e.name}', this.value)">
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
        const label = document.getElementById("phaseTimer");
        if (!vid || !state.exercises[idx]) return;

        const wInput = state.exercises[idx].querySelector(".weight-input");
        const originalName = wInput.dataset.name.trim();

        let fileName = originalName.replace(/\s+/g, '').toLowerCase();
        if (window.videoMap && window.videoMap[originalName]) {
            fileName = window.videoMap[originalName];
        }

        const videoPath = `videos/${fileName}.mp4?v=${Date.now()}`;

        vid.pause();
        vid.src = videoPath;
        vid.load();
        
        vid.play().then(() => {
            if (label && state.phase === 0) label.textContent = originalName;
        }).catch(() => {
            if (fileName !== 'warmup') {
                vid.src = 'videos/warmup.mp4';
                vid.load();
                vid.play();
            }
        });
    };

    window.saveWeight = (name, val) => {
        localStorage.setItem(`weight_ANGELOS_${name}`, val);
        localStorage.setItem(`weight_${name}`, val);
        if (window.PegasusCloud) window.PegasusCloud.push(true);
    };

    window.toggleSkipExercise = (idx) => {
        const ex = state.exercises[idx];
        if (!ex) return;
        const isSkipped = ex.classList.toggle("exercise-skipped");
        state.remainingSets[idx] = isSkipped ? 0 : parseInt(ex.dataset.total);
        window.calculateTotalTime();
    };

    window.calculateTotalTime = () => {
        const exT = parseInt(localStorage.getItem("pegasus_ex_time")) || 45;
        const restT = parseInt(localStorage.getItem("pegasus_rest_time")) || 60;
        const cycle = 10 + exT + restT; 
        
        state.totalSeconds = state.remainingSets.reduce((a, b) => a + (b * cycle), 0);
        state.remainingSeconds = state.totalSeconds;
        updateTotalProgress();
    };

    window.finishWorkout = () => {
        clearInterval(state.timer);
        const kcal = document.querySelector(".kcal-value")?.textContent || "0";
        if (window.PegasusReporting) {
            window.PegasusReporting.prepareAndSaveReport(kcal);
        }
        alert("ΠΡΟΠΟΝΗΣΗ ΟΛΟΚΛΗΡΩΘΗΚΕ!");
        location.reload();
    };

    // 5. INITIALIZATION
    const init = () => {
        // Defaults για νέους χρήστες / Καθαρισμένα Storage
        if (!localStorage.getItem("pegasus_weight")) {
            localStorage.setItem("pegasus_weight", "74");
            localStorage.setItem("pegasus_height", "187");
            localStorage.setItem("pegasus_age", "38");
            localStorage.setItem("pegasus_ex_time", "45");
            localStorage.setItem("pegasus_rest_time", "60");
        }

        createNavbar();
        
        // Button Listeners (Bind IDs from Final HTML)
        const btnStart = document.getElementById("btnStart");
        if (btnStart) {
            btnStart.onclick = () => {
                state.isActive = !state.isActive;
                btnStart.textContent = state.isActive ? "Παύση" : "Συνέχεια";
                if (state.isActive) runPhase();
                else clearInterval(state.timer);
            };
        }

        const btnNext = document.getElementById("btnNext");
        if (btnNext) {
            btnNext.onclick = () => {
                clearInterval(state.timer);
                state.currentIdx = getNextIndex();
                state.phase = 0;
                if (state.currentIdx !== -1) runPhase();
                else window.finishWorkout();
            };
        }

        const btnWarmup = document.getElementById("btnWarmup");
        if (btnWarmup) {
            btnWarmup.onclick = () => {
                const vid = document.getElementById("video");
                if (vid) { vid.src = "videos/warmup.mp4"; vid.load(); vid.play(); }
            };
        }

        // Audio Unlock Gesture
        document.addEventListener('click', () => {
            if (!state.audioUnlocked) {
                sysAudio.play().then(() => { sysAudio.pause(); state.audioUnlocked = true; });
            }
        }, { once: true });

        // Update Workout Stats UI
        if (window.updateTotalWorkoutCount) window.updateTotalWorkoutCount();
    };

    return { init: init };
})();

// Εκκίνηση Συστήματος
window.addEventListener("load", PegasusCore.init);
