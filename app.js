/* ==========================================================================
   PEGASUS MASTER CONTROLLER - v25.0 (FINAL MODULAR ORCHESTRATION)
   Protocol: Strict Data Analyst - Full Phase Engine & Dashboard Restoration
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
        speed: 1,
        audioUnlocked: false
    };

    const sysAudio = new Audio('videos/beep.mp3');

    // 2. UI & NAVIGATION
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

        // Αυτόματη επιλογή σημερινής ημέρας
        const todayName = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
        const todayBtn = document.getElementById(`nav-${todayName}`);
        if (todayBtn) window.selectDay(todayBtn, todayName);
    };

    // 3. CORE WORKOUT ENGINE
    const runPhase = () => {
        if (!state.isActive) return;
        clearInterval(state.timer);

        if (state.remainingSets.every(s => s <= 0)) {
            finishWorkout();
            return;
        }

        const exTime = parseInt(localStorage.getItem("pegasus_ex_time")) || 45;
        const restTime = parseInt(localStorage.getItem("pegasus_rest_time")) || 60;
        const phases = [ {n: "ΠΡΟΕΤΟΙΜΑΣΙΑ", d: 10}, {n: "ΑΣΚΗΣΗ", d: exTime}, {n: "ΔΙΑΛΕΙΜΜΑ", d: restTime} ];

        const currentExNode = state.exercises[state.currentIdx];
        const exName = currentExNode.querySelector(".weight-input").dataset.name;

        // Visual Updates
        state.exercises.forEach(ex => { ex.style.borderColor = "#222"; ex.style.background = "transparent"; });
        currentExNode.style.borderColor = "#4CAF50";
        currentExNode.style.background = "rgba(76, 175, 80, 0.1)";

        let t = phases[state.phase].d;
        if (state.phase !== 2) showVideo(state.currentIdx);

        state.timer = setInterval(() => {
            t--;
            state.remainingSeconds = Math.max(0, state.remainingSeconds - 1);
            updateTotalProgress();

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
                    state.currentIdx = getNextIndex();
                    state.phase = 0;
                    if (state.currentIdx !== -1) runPhase();
                    else finishWorkout();
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

        node.querySelector(".set-counter").textContent = `${done}/${total}`;
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

    const showVideo = (idx) => {
        const vid = document.getElementById("video");
        const wInput = state.exercises[idx].querySelector(".weight-input");
        const name = wInput.dataset.name.trim();
        
        // Modular Video Logic
        if (vid) {
            let fileName = name.replace(/\s+/g, '').toLowerCase();
            vid.src = `videos/${fileName}.mp4`;
            vid.play().catch(() => console.warn(`Video ${fileName} not found.`));
        }
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
            const s = state.remainingSeconds % 60;
            text.textContent = `${m}:${String(s).padStart(2, "0")}`;
        }
    };

    const finishWorkout = () => {
        clearInterval(state.timer);
        alert("ΠΡΟΠΟΝΗΣΗ ΟΛΟΚΛΗΡΩΘΗΚΕ!");
        if (window.PegasusReporting) {
            window.PegasusReporting.prepareAndSaveReport(document.querySelector(".kcal-value").textContent);
        }
        location.reload();
    };

    // 4. GLOBAL INTERFACE (For HTML Buttons)
    window.selectDay = (btn, day) => {
        document.querySelectorAll(".navbar button").forEach(b => b.classList.remove("active"));
        if (btn) btn.classList.add("active");

        clearInterval(state.timer);
        state.isActive = false;
        state.phase = 0;
        state.currentIdx = 0;

        // Fetch Data from Optimizer
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
            
            const weight = localStorage.getItem(`weight_ANGELOS_${e.name}`) || "";

            div.innerHTML = `
                <div class="exercise-info" onclick="window.toggleSkipExercise(${idx})">
                    <div class="set-counter">0/${div.dataset.total}</div>
                    <div class="exercise-name">${e.name}</div>
                    <input type="number" class="weight-input" data-name="${e.name}" value="${weight}" onclick="event.stopPropagation()">
                </div>
                <div class="progress-box"><div class="progress-bar"></div></div>
            `;
            list.appendChild(div);
            state.exercises.push(div);
            state.remainingSets.push(parseInt(div.dataset.total));
        });

        calculateTotalTime();
    };

    window.toggleSkipExercise = (idx) => {
        const ex = state.exercises[idx];
        const isSkipped = ex.classList.toggle("exercise-skipped");
        state.remainingSets[idx] = isSkipped ? 0 : parseInt(ex.dataset.total);
        calculateTotalTime();
    };

    const calculateTotalTime = () => {
        state.totalSeconds = state.remainingSets.reduce((a, b) => a + (b * 115), 0); // 115s: Avg Cycle
        state.remainingSeconds = state.totalSeconds;
        updateTotalProgress();
    };

    // 5. LISTENERS & INIT
    const init = () => {
        createNavbar();
        
        // Bind Control Bar Buttons
        document.getElementById("btnStart").onclick = () => {
            state.isActive = !state.isActive;
            document.getElementById("btnStart").textContent = state.isActive ? "Παύση" : "Συνέχεια";
            if (state.isActive) runPhase();
            else clearInterval(state.timer);
        };

        document.getElementById("btnNext").onclick = () => {
            clearInterval(state.timer);
            state.currentIdx = getNextIndex();
            state.phase = 0;
            runPhase();
        };

        // Audio Unlock
        document.addEventListener('click', () => {
            if (!state.audioUnlocked) {
                sysAudio.play().then(() => { sysAudio.pause(); state.audioUnlocked = true; });
            }
        }, { once: true });
    };

    return { init: init };
})();

// Εκκίνηση
window.addEventListener("load", PegasusCore.init);
