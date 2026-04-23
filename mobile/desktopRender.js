/* ==========================================================================
   PEGASUS DESKTOP RENDER MODULE - v44 REFACTOR
   Extracted from app.js to preserve exact preview/render behavior.
   ========================================================================== */

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
            vid.pause();
            vid.src = recoverySrc;
            vid.load();
            vid.play().catch(e => console.log("Waiting for user..."));
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
    let mappedVal = window.videoMap ? window.videoMap[name.trim()] : null;
    if (!mappedVal) mappedVal = name.replace(/\s+/g, '').toLowerCase();

    const newSrc = `videos/${mappedVal}.mp4`;
    if (vid.getAttribute('src') !== newSrc) {
        vid.pause();
        vid.src = newSrc;
        vid.load();
        vid.play().catch(() => {
            vid.src = "videos/warmup.mp4";
            vid.load();
            vid.play().catch(() => {});
        });
    }
}

function calculateTotalTime(isUpdate = false) {
    const config = getPegasusTimerConfig();
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
        totalSeconds = newTotal;
        remainingSeconds = newTotal;
    }

    const timeDisplay = document.getElementById("totalProgressTime");
    if (timeDisplay) {
        const m = Math.floor(remainingSeconds / 60);
        const s = remainingSeconds % 60;
        timeDisplay.textContent = `${m}:${String(s).padStart(2, '0')}`;
    }

    syncPegasusProgressRuntime();
    if (typeof window.updateTotalBar === "function") window.updateTotalBar();
}

function updateTotalBar() {
    const bar = document.getElementById("totalProgress");
    const timeText = document.getElementById("totalProgressTime");
    const uiState = (typeof window.getPegasusUiState === "function")
        ? window.getPegasusUiState()
        : null;
    const timerDisplay = uiState?.timerDisplay || ((typeof window.getPegasusTimerDisplayState === "function")
        ? window.getPegasusTimerDisplayState()
        : { totalSeconds, remainingSeconds, progressPercent: 0, remainingText: "0:00" });

    const safeTotalSeconds = (typeof timerDisplay?.totalSeconds === "number" && timerDisplay.totalSeconds > 0) ? timerDisplay.totalSeconds : totalSeconds;
    const safeRemainingSeconds = (typeof timerDisplay?.remainingSeconds === "number") ? timerDisplay.remainingSeconds : remainingSeconds;
    if (!bar || safeTotalSeconds <= 0) return;

    const progress = typeof timerDisplay?.progressPercent === "number"
        ? timerDisplay.progressPercent
        : (((safeTotalSeconds - safeRemainingSeconds) / safeTotalSeconds) * 100);

    bar.style.width = Math.max(0, Math.min(100, progress)) + "%";

    if (timeText) {
        timeText.textContent = timerDisplay?.remainingText || `${Math.floor(safeRemainingSeconds / 60)}:${String(Math.floor(safeRemainingSeconds % 60)).padStart(2, "0")}`;
    }
}

function openExercisePreview() {
    const activeBtn = document.querySelector(".navbar button.active");
    if (!activeBtn) { if (window.pegasusAlert) window.pegasusAlert("Παρακαλώ επίλεξε πρώτα μια ημέρα!"); else alert("Παρακαλώ επίλεξε πρώτα μια ημέρα!"); return; }

    const currentDay = activeBtn.id.replace('nav-', '');
    const isRainy = (typeof window.isRaining === 'function') ? window.isRaining() : false;

    let rawData = (typeof window.calculateDailyProgram !== 'undefined')
        ? window.calculateDailyProgram(currentDay, isRainy)
        : ((window.program && window.program[currentDay]) ? [...window.program[currentDay]] : []);

    if (currentDay === "Παρασκευή" && !isRainy && window.program && window.program["Κυριακή"]) {
        const bonus = window.program["Κυριακή"]
            .filter(ex => !ex.name.includes("Ποδηλασία") && !ex.name.includes("Cycling"))
            .map(ex => ({ ...ex, isSpillover: false }));
        rawData = [...rawData, ...bonus];
    }

    const dayExercises = window.PegasusOptimizer
        ? window.PegasusOptimizer.apply(currentDay, rawData)
        : rawData.map(e => ({ ...e, adjustedSets: e.sets }));

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
        if (!imgBase) imgBase = cleanName.replace(/\s+/g, '').toLowerCase();

        const imgPath = (imgBase === "cycling") ? `images/${imgBase}.jpg` : `images/${imgBase}.png`;
        content.innerHTML += `
            <div class="preview-item">
                <img src="${imgPath}" onerror="this.onerror=null; this.src='images/placeholder.jpg';" alt="${cleanName}">
                <p>${cleanName} (${ex.adjustedSets || ex.sets} set)</p>
            </div>
        `;
    });

    if (typeof window.forcePegasusRender === "function") {
        setTimeout(() => window.forcePegasusRender(), 50);
    }
}

window.showVideo = showVideo;
window.openExercisePreview = openExercisePreview;
window.calculateTotalTime = calculateTotalTime;
window.updateTotalBar = updateTotalBar;
