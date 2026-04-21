/* ==========================================================================
   PEGASUS DESKTOP PANELS MODULE - v44 REFACTOR
   Extracted from app.js to preserve exact desktop navigation behavior.
   ========================================================================== */

function createNavbar() {
    const days = ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο", "Κυριακή"];
    days.forEach((d) => {
        const btn = document.getElementById(`nav-${d}`);
        if (btn) {
            btn.onclick = (e) => {
                if (e && e.isTrusted && window.PegasusCloud && typeof window.PegasusCloud.push === "function") {
                    window.PegasusCloud.push();
                }
                if (typeof window.selectDay === "function") window.selectDay(btn, d);
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

    clearInterval(timer);
    timer = null;
    running = false;
    phase = 0;
    phaseRemainingSeconds = null;
    currentIdx = 0;
    sessionActiveKcal = 0;
    localStorage.setItem("pegasus_session_kcal", "0.0");

    if (typeof window.renderPegasusControlState === "function") window.renderPegasusControlState();

    if (typeof window.calculatePegasusDailyTarget === "function") {
        if (!window.isCalculatingTarget) {
            window.isCalculatingTarget = true;
            window.calculatePegasusDailyTarget();
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

    let mappedData = window.PegasusOptimizer
        ? window.PegasusOptimizer.apply(day, rawBaseData)
        : rawBaseData.map(e => ({ ...e, adjustedSets: e.sets, isCompleted: false }));

    mappedData.sort((a, b) => parseFloat(b.adjustedSets || b.sets) - parseFloat(a.adjustedSets || a.sets));

    const list = document.getElementById("exList");
    if (!list) return;
    list.innerHTML = "";
    exercises = [];
    remainingSets = [];

    const todayStr = window.getPegasusLocalDateKey();
    let dailyProg = JSON.parse(localStorage.getItem('pegasus_daily_progress') || "{}");
    if (dailyProg.date !== todayStr) dailyProg = { date: todayStr, exercises: {} };

    mappedData.forEach((e) => {
        if (!e.name || e.name === "αα" || e.adjustedSets < 0.1) return;

        const cleanName = e.name.trim();
        let finalSets = parseFloat(e.adjustedSets);
        let doneSoFar = dailyProg.exercises[cleanName] || 0;
        let remSets = Math.max(0, finalSets - doneSoFar);
        const renderIdx = exercises.length;

        const d = document.createElement("div");
        d.className = "exercise";
        d.dataset.total = finalSets;
        d.dataset.done = doneSoFar;
        d.dataset.index = renderIdx;

        const savedWeight = window.getSavedWeight(cleanName);
        const displayWeight = (savedWeight && savedWeight !== "") ? savedWeight : (e.weight || "");

        d.innerHTML = `
            <div class="exercise-info">
                <div class="set-counter">${doneSoFar}/${finalSets}</div>
                <div class="exercise-name"></div>
                <input type="number" id="weight-${renderIdx}" class="weight-input" placeholder="kg">
            </div>
            <div class="progress-box"><div class="progress-bar"></div></div>
        `;

        const nameNode = d.querySelector(".exercise-name");
        if (nameNode) nameNode.textContent = cleanName;

        const weightInputEl = d.querySelector(".weight-input");
        if (weightInputEl) {
            weightInputEl.setAttribute("data-name", cleanName);
            if (displayWeight !== "") weightInputEl.value = displayWeight;

            weightInputEl.addEventListener("click", function(ev) {
                ev.stopPropagation();
            });

            weightInputEl.addEventListener("change", function() {
                window.saveWeight(cleanName, this.value);
            });
        }

        const infoNode = d.querySelector(".exercise-info");
        if (infoNode) {
            infoNode.addEventListener("click", function() {
                window.toggleSkipExercise(renderIdx);
            });
        }

        list.appendChild(d);
        exercises.push(d);
        remainingSets.push(remSets);

        if (remSets === 0) {
            d.classList.add("exercise-skipped");
            d.style.setProperty('opacity', '0.2', 'important');
            d.style.setProperty('filter', 'grayscale(100%)', 'important');
        }
    });

    if (typeof window.calculateTotalTime === "function") window.calculateTotalTime(false);
    if (typeof window.syncPegasusSelectedDay === "function") window.syncPegasusSelectedDay(day);
    if (typeof window.dispatchPegasusWorkoutAction === "function") window.dispatchPegasusWorkoutAction("WORKOUT_SELECT_DAY_RUNTIME", { workout: { selectedDay: day } });

    setTimeout(() => { window.syncSessionWithHistory(); }, 50);

    setTimeout(() => {
        if (typeof window.showVideo === "function") window.showVideo(0);
        if (exercises.length === 0) {
            list.innerHTML = `<div style="padding:20px; color:#666; text-align:center;">🌿 Ημέρα Αποθεραπείας (History: ${day})</div>`;
        }
    }, 150);
}

window.createNavbar = createNavbar;
window.selectDay = selectDay;
