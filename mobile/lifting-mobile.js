/* ======================================================================
   PEGASUS MOBILE LIFTING - Workout Weight Mirror & Log (v1.1)
   Purpose: show current workout exercises + saved weights, keep manual log
   ====================================================================== */
(function() {
    "use strict";

    const LIFTING_DATA_KEY = "pegasus_lifting_v1";
    const EXERCISE_WEIGHTS_KEY = "pegasus_exercise_weights";
    const DAILY_PROGRESS_KEY = "pegasus_daily_progress";
    const DAY_NAMES = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];

    function safeReadJSON(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            const parsed = JSON.parse(raw);
            return parsed ?? fallback;
        } catch (e) {
            return fallback;
        }
    }

    function safeWriteJSON(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>'"]/g, ch => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "'": "&#39;",
            '"': "&quot;"
        }[ch]));
    }

    function getDateDisplay() {
        return new Date().toLocaleDateString('el-GR');
    }

    function getDateKey() {
        if (typeof window.getPegasusLocalDateKey === "function") {
            return window.getPegasusLocalDateKey();
        }
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    }

    function normalizeExerciseName(name) {
        return String(name || "").trim();
    }

    function isLegacyTestEntry(entry) {
        const text = normalizeExerciseName(entry?.exercise || entry?.name).toLowerCase();
        if (!text) return true;
        return /(^|\s)(test|aa|αα)(\s|$)/i.test(text) || /τεστ|δοκιμ/.test(text);
    }

    function readLogs() {
        const data = safeReadJSON(LIFTING_DATA_KEY, []);
        return Array.isArray(data) ? data : [];
    }

    function writeLogs(logs) {
        safeWriteJSON(LIFTING_DATA_KEY, logs);
    }

    function cleanupLegacyTestData() {
        const logs = readLogs();
        const cleaned = logs.filter(entry => !isLegacyTestEntry(entry));
        if (cleaned.length !== logs.length) writeLogs(cleaned);
        return cleaned;
    }

    function getActiveLifterName() {
        try {
            if (typeof window.getActiveLifter === "function") return window.getActiveLifter();
        } catch (e) {}
        return "ΑΓΓΕΛΟΣ";
    }

    function readSavedWeight(exerciseName, fallback) {
        const cleanName = normalizeExerciseName(exerciseName);
        if (!cleanName) return fallback || "";

        const allWeights = safeReadJSON(EXERCISE_WEIGHTS_KEY, {});
        const activeLifter = getActiveLifterName();
        const candidate = allWeights?.[activeLifter]?.[cleanName]
            ?? allWeights?.["ΑΓΓΕΛΟΣ"]?.[cleanName]
            ?? allWeights?.["ANGELOS"]?.[cleanName]
            ?? allWeights?.default?.[cleanName];

        if (candidate !== undefined && candidate !== null && String(candidate).trim() !== "") {
            return candidate;
        }

        const legacyKeys = [
            `weight_${activeLifter}_${cleanName}`,
            `weight_ΑΓΓΕΛΟΣ_${cleanName}`,
            `weight_ANGELOS_${cleanName}`,
            `weight_${cleanName}`
        ];

        for (const key of legacyKeys) {
            const raw = localStorage.getItem(key);
            if (raw !== null && String(raw).trim() !== "") return raw;
        }

        return fallback || "";
    }

    function getSelectedDayName() {
        try {
            if (window.PegasusEngine && typeof window.PegasusEngine.getSnapshot === "function") {
                const snap = window.PegasusEngine.getSnapshot();
                if (snap?.workout?.selectedDay) return snap.workout.selectedDay;
            }
            if (window.PegasusEngine && typeof window.PegasusEngine.getSelectedDay === "function") {
                const day = window.PegasusEngine.getSelectedDay();
                if (day) return day;
            }
        } catch (e) {}
        return DAY_NAMES[new Date().getDay()];
    }

    function getExerciseGroup(name, fallback) {
        try {
            if (typeof window.getPegasusExerciseGroup === "function") {
                const group = window.getPegasusExerciseGroup(name);
                if (group && group !== "Unknown") return group;
            }
        } catch (e) {}
        return fallback || "--";
    }

    function shouldShowWorkoutExercise(exercise) {
        const name = normalizeExerciseName(exercise?.name || exercise?.exercise);
        if (!name || isLegacyTestEntry({ exercise: name })) return false;
        const group = String(exercise?.muscleGroup || getExerciseGroup(name, "")).toLowerCase();
        if (group === "none" || group === "--") return false;
        if (/cycling|ποδήλα|cardio|stretch|διατάσ|ems/i.test(name)) return false;
        return true;
    }

    function getTodayDoneSets(name) {
        const daily = safeReadJSON(DAILY_PROGRESS_KEY, {});
        const todayKey = getDateKey();
        const todayDisplay = getDateDisplay();
        const isToday = daily?.date === todayKey || daily?.date === todayDisplay;
        if (!isToday || !daily?.exercises) return 0;
        return Number(daily.exercises[name] || 0) || 0;
    }

    function getWorkoutExercises() {
        const selectedDay = getSelectedDayName();
        let raw = [];

        try {
            if (typeof window.getPegasusProgramSnapshot === "function") {
                raw = window.getPegasusProgramSnapshot(selectedDay) || [];
            } else if (window.program && Array.isArray(window.program[selectedDay])) {
                raw = window.program[selectedDay];
            }
        } catch (e) {
            raw = [];
        }

        return raw
            .filter(shouldShowWorkoutExercise)
            .map(exercise => {
                const name = normalizeExerciseName(exercise.name || exercise.exercise);
                const sets = Number(exercise.sets || exercise.targetSets || 0) || 0;
                const weight = readSavedWeight(name, exercise.weight || "");
                return {
                    name,
                    group: getExerciseGroup(name, exercise.muscleGroup),
                    sets,
                    done: getTodayDoneSets(name),
                    weight
                };
            });
    }

    function prefillExercise(name, weight) {
        const nameInput = document.getElementById('liftName');
        const weightInput = document.getElementById('liftWeight');
        if (nameInput) nameInput.value = name || "";
        if (weightInput && weight !== undefined && weight !== null && String(weight).trim() !== "") {
            weightInput.value = weight;
        }
        document.getElementById('liftReps')?.focus();
    }

    function renderWorkoutPlan() {
        const container = document.getElementById('lift-plan');
        if (!container) return;

        const selectedDay = getSelectedDayName();
        const rows = getWorkoutExercises();

        if (!rows.length) {
            container.innerHTML = `
                <div style="padding: 12px; border: 1px dashed var(--border); border-radius: 12px; color: var(--muted); font-size: 11px; text-align: center;">
                    Δεν βρέθηκαν ασκήσεις με βάρη για ${escapeHtml(selectedDay)}.
                </div>`;
            return;
        }

        container.innerHTML = rows.map((row, index) => {
            const doneTxt = row.sets ? `${row.done}/${row.sets}` : `${row.done}`;
            const weightTxt = row.weight !== "" ? `${escapeHtml(row.weight)} kg` : "-- kg";
            return `
                <button class="lift-plan-row" data-index="${index}" style="width:100%; margin-bottom:8px; text-align:left; border:1px solid var(--border); background:rgba(0,255,65,0.05); color:#fff; border-radius:12px; padding:10px; display:flex; justify-content:space-between; gap:8px; align-items:center;">
                    <span style="display:flex; flex-direction:column; gap:3px; min-width:0;">
                        <b style="color:var(--main); font-size:12px; white-space:normal;">${escapeHtml(row.name)}</b>
                        <small style="color:var(--muted); font-size:9px;">${escapeHtml(row.group)} • Σετ σήμερα ${escapeHtml(doneTxt)}</small>
                    </span>
                    <span style="font-size:13px; font-weight:900; color:#fff; white-space:nowrap;">${weightTxt}</span>
                </button>`;
        }).join('');

        container.querySelectorAll('.lift-plan-row').forEach(button => {
            button.addEventListener('click', () => {
                const row = rows[Number(button.dataset.index)];
                if (row) prefillExercise(row.name, row.weight);
            });
        });
    }

    function renderManualLogs() {
        const todayBox = document.getElementById('lift-today');
        const historyBox = document.getElementById('lift-history');
        if (!todayBox || !historyBox) return;

        const logs = cleanupLegacyTestData();
        const today = getDateDisplay();
        const todayLogs = logs.filter(l => l.date === today);
        const pastLogs = logs.filter(l => l.date !== today);

        todayBox.innerHTML = todayLogs.length ? todayLogs.map(l => `
            <div style="display:flex; justify-content:space-between; align-items:center; border:1px solid var(--border); border-radius:12px; padding:9px; margin-bottom:7px; background:rgba(0,0,0,0.45);">
                <span style="display:flex; flex-direction:column; gap:2px;">
                    <b style="color:var(--main); font-size:12px;">${escapeHtml(l.exercise)}</b>
                    <small style="color:var(--muted); font-size:9px;">${escapeHtml(l.weight)}kg × ${escapeHtml(l.reps)} reps</small>
                </span>
                <button onclick="window.PegasusLifting.deleteSet('${escapeHtml(l.id)}')" style="background:transparent; color:#ff4b4b; border:1px solid #ff4b4b; border-radius:8px; padding:5px 7px; font-size:10px;">ΔΙΑΓΡ.</button>
            </div>
        `).join('') : `<div style="color:var(--muted); font-size:11px; text-align:center; padding:10px;">Δεν έχεις χειροκίνητη καταγραφή σήμερα.</div>`;

        const prMap = {};
        pastLogs.forEach(l => {
            const name = normalizeExerciseName(l.exercise);
            const weight = Number(l.weight || 0) || 0;
            if (!name || !weight) return;
            prMap[name] = Math.max(prMap[name] || 0, weight);
        });

        const prs = Object.entries(prMap).sort((a, b) => a[0].localeCompare(b[0], 'el'));
        historyBox.innerHTML = prs.length ? prs.map(([name, max]) => `
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(0,255,65,0.15); padding:7px 0; font-size:11px;">
                <span>${escapeHtml(name)}</span><b style="color:var(--main);">${escapeHtml(max)}kg</b>
            </div>
        `).join('') : `<div style="color:var(--muted); font-size:11px; text-align:center; padding:10px;">Δεν υπάρχει ιστορικό βαρών.</div>`;
    }

    window.PegasusLifting = {
        isLocked: false,

        cleanupLegacyTestData,
        prefillExercise,

        addSet: function() {
            if (this.isLocked) return;
            this.isLocked = true;

            try {
                const name = normalizeExerciseName(document.getElementById('liftName')?.value).toUpperCase();
                const weight = String(document.getElementById('liftWeight')?.value || "").trim();
                const reps = String(document.getElementById('liftReps')?.value || "").trim();

                if (!name || !weight || !reps || isLegacyTestEntry({ exercise: name })) {
                    alert('Συμπλήρωσε πραγματική άσκηση, κιλά και επαναλήψεις.');
                    return;
                }

                const logs = cleanupLegacyTestData();
                logs.unshift({
                    id: `lift_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                    date: getDateDisplay(),
                    date_key: getDateKey(),
                    timestamp: new Date().toISOString(),
                    exercise: name,
                    weight,
                    reps
                });

                writeLogs(logs);

                const nameInput = document.getElementById('liftName');
                const weightInput = document.getElementById('liftWeight');
                const repsInput = document.getElementById('liftReps');
                if (nameInput) nameInput.value = '';
                if (weightInput) weightInput.value = '';
                if (repsInput) repsInput.value = '';

                window.renderLiftingContent();
                if (window.PegasusCloud && typeof window.PegasusCloud.push === 'function') {
                    window.PegasusCloud.push(true);
                }
            } finally {
                this.isLocked = false;
            }
        },

        deleteSet: function(id) {
            if (!confirm('Διαγραφή καταγραφής;')) return;
            const logs = cleanupLegacyTestData().filter(l => l.id !== id);
            writeLogs(logs);
            window.renderLiftingContent();
            if (window.PegasusCloud && typeof window.PegasusCloud.push === 'function') {
                window.PegasusCloud.push(true);
            }
        },

        saveAndRender: function(data) {
            const clean = Array.isArray(data) ? data.filter(entry => !isLegacyTestEntry(entry)) : [];
            writeLogs(clean);
            window.renderLiftingContent();
            if (window.PegasusCloud && typeof window.PegasusCloud.push === 'function') {
                window.PegasusCloud.push(true);
            }
        }
    };

    function injectViewLayer() {
        if (document.getElementById('lifting')) return;
        const layer = document.createElement('div');
        layer.className = 'view-layer';
        layer.id = 'lifting';
        layer.innerHTML = `
            <button class="back-btn" onclick="openView('home')">‹</button>
            <div class="view-title">🏋️ ΒΑΡΗ</div>
            <div style="padding: 16px; display: flex; flex-direction: column; gap: 14px;">
                <div style="border:1px solid var(--border); border-radius:16px; padding:12px; background:rgba(0,0,0,0.45);">
                    <div style="font-size:11px; color:var(--main); font-weight:900; margin-bottom:8px;">+ ΧΕΙΡΟΚΙΝΗΤΗ ΚΑΤΑΓΡΑΦΗ</div>
                    <input id="liftName" placeholder="Άσκηση" style="width:100%; margin-bottom:8px; padding:10px; border-radius:10px; border:1px solid var(--border); background:#050505; color:#fff; box-sizing:border-box;">
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                        <input id="liftWeight" type="number" inputmode="decimal" placeholder="Κιλά" style="padding:10px; border-radius:10px; border:1px solid var(--border); background:#050505; color:#fff;">
                        <input id="liftReps" type="number" inputmode="numeric" placeholder="Επαναλ." style="padding:10px; border-radius:10px; border:1px solid var(--border); background:#050505; color:#fff;">
                    </div>
                    <button onclick="window.PegasusLifting.addSet()" style="width:100%; margin-top:10px; padding:11px; border-radius:12px; border:1px solid var(--main); background:rgba(0,255,65,0.12); color:var(--main); font-weight:900;">ΠΡΟΣΘΗΚΗ ΣΕΤ</button>
                </div>

                <div>
                    <div style="font-size:11px; color:var(--main); font-weight:900; margin-bottom:8px;">ΑΣΚΗΣΕΙΣ ΠΡΟΠΟΝΗΣΗΣ</div>
                    <div id="lift-plan"></div>
                </div>

                <div>
                    <div style="font-size:11px; color:var(--main); font-weight:900; margin-bottom:8px;">ΣΗΜΕΡΙΝΗ ΚΑΤΑΓΡΑΦΗ</div>
                    <div id="lift-today"></div>
                </div>

                <div>
                    <div style="font-size:11px; color:var(--main); font-weight:900; margin-bottom:8px;">ΙΣΤΟΡΙΚΟ / PR</div>
                    <div id="lift-history"></div>
                </div>
            </div>
        `;
        document.querySelector('.mobile-wrapper')?.appendChild(layer);
    }

    window.renderLiftingContent = function() {
        cleanupLegacyTestData();
        renderWorkoutPlan();
        renderManualLogs();
    };

    document.addEventListener('DOMContentLoaded', () => {
        injectViewLayer();
        cleanupLegacyTestData();
        if (window.PegasusMobileUI && typeof window.PegasusMobileUI.registerModule === 'function') {
            window.PegasusMobileUI.registerModule({ id: 'lifting', icon: '🏋️', label: 'Βάρη' });
        }
    });

    document.addEventListener('pegasus_sync_complete', () => {
        if (document.getElementById('lifting')?.classList.contains('active')) {
            window.renderLiftingContent();
        } else {
            cleanupLegacyTestData();
        }
    });

    console.log('🏋️ PEGASUS MOBILE LIFTING: Workout weight mirror active (v1.1).');
})();
