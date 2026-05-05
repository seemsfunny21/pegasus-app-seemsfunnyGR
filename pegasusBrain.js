/* ========================================================================== 
   PEGASUS BRAIN - v1.0.210 (REST-AWARE 45-MIN WEEKLY PLAN)
   Purpose: data-driven weekly training plan, weekend carry-over, recovery guard
   ========================================================================== */
(function installPegasusBrain() {
    const STRICT_GROUPS = ["Στήθος", "Πλάτη", "Πόδια", "Χέρια", "Ώμοι", "Κορμός"];
    const RECOVERY_DAYS = new Set(["Δευτέρα", "Πέμπτη"]);
    const WEEKEND_DAYS = new Set(["Σάββατο", "Κυριακή"]);
    const DAY_INDEX = { "Κυριακή": 0, "Δευτέρα": 1, "Τρίτη": 2, "Τετάρτη": 3, "Πέμπτη": 4, "Παρασκευή": 5, "Σάββατο": 6 };
    const DAY_FROM_INDEX = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];

    const defaultTemplates = {
        "Στήθος": [
            { name: "Chest Press", weight: "54" },
            { name: "Chest Flys", weight: "42" },
            { name: "Pushups", weight: "0" }
        ],
        "Πλάτη": [
            { name: "Lat Pulldowns", weight: "36" },
            { name: "Seated Rows", weight: "66" },
            { name: "Low Rows Seated", weight: "36" },
            { name: "Lat Pulldowns Close", weight: "36" }
        ],
        "Πόδια": [
            { name: "Leg Extensions", weight: "0" }
        ],
        "Χέρια": [
            { name: "Bicep Curls", weight: "30" },
            { name: "Tricep Pulldowns", weight: "20" },
            { name: "Standing Bicep Curls", weight: "30" }
        ],
        "Ώμοι": [
            { name: "Upright Rows", weight: "30" }
        ],
        "Κορμός": [
            { name: "Ab Crunches", weight: "30" },
            { name: "Plank", weight: "0" },
            { name: "Leg Raise Hip Lift", weight: "0" },
            { name: "Lying Knee Raise", weight: "0" },
            { name: "Reverse Crunch", weight: "0" }
        ]
    };

    const dayPriority = {
        // PEGASUS 209: 45-minute balanced weekly split. Cycling removes legs,
        // but upper-body volume is redistributed instead of making the week too small.
        "Τρίτη": ["Στήθος", "Ώμοι", "Χέρια", "Κορμός", "Πλάτη"],
        "Τετάρτη": ["Πόδια", "Πλάτη", "Χέρια", "Κορμός", "Στήθος", "Ώμοι"],
        "Παρασκευή": ["Πλάτη", "Στήθος", "Ώμοι", "Χέρια", "Κορμός"],
        "Σάββατο": ["Κορμός", "Στήθος", "Χέρια", "Ώμοι", "Πλάτη"],
        "Κυριακή": ["Πλάτη", "Στήθος", "Κορμός", "Χέρια", "Ώμοι"]
    };

    function safeJson(raw, fallback) {
        try {
            const parsed = JSON.parse(raw || "null");
            return parsed && typeof parsed === "object" ? parsed : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function normalizeGreekDate(d = new Date()) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }

    function dateFromKey(key) {
        const d = new Date(`${key}T12:00:00`);
        return Number.isNaN(d.getTime()) ? new Date() : d;
    }

    function addDays(dateOrKey, days) {
        const d = typeof dateOrKey === "string" ? dateFromKey(dateOrKey) : new Date(dateOrKey);
        d.setDate(d.getDate() + days);
        return d;
    }

    function getWeekKey(date = new Date()) {
        const d = typeof date === "string" ? dateFromKey(date) : new Date(date);
        const start = new Date(d);
        const daysSinceSaturday = (d.getDay() + 1) % 7;
        start.setHours(6, 0, 0, 0);
        start.setDate(d.getDate() - daysSinceSaturday);
        if (d.getDay() === 6 && d.getTime() < start.getTime()) start.setDate(start.getDate() - 7);
        return normalizeGreekDate(start);
    }

    function getNextWeekKey(date = new Date()) {
        return getWeekKey(addDays(date, 7));
    }

    function getDayName(date = new Date()) {
        const d = typeof date === "string" ? dateFromKey(date) : date;
        return DAY_FROM_INDEX[d.getDay()];
    }

    function emptyGroups(value = 0) {
        return STRICT_GROUPS.reduce((acc, group) => {
            acc[group] = value;
            return acc;
        }, {});
    }

    function getHistory() {
        const key = window.PegasusManifest?.workout?.weekly_history || "pegasus_weekly_history";
        const raw = safeJson(localStorage.getItem(key), {});
        const next = emptyGroups(0);
        STRICT_GROUPS.forEach(group => {
            const value = Number(raw?.[group]);
            next[group] = Number.isFinite(value) ? Math.max(0, value) : 0;
        });
        return next;
    }

    function getTargets() {
        if (window.PegasusOptimizer?.getTargets) return window.PegasusOptimizer.getTargets();
        const key = window.PegasusManifest?.workout?.muscleTargets || "pegasus_muscle_targets";
        const fallback = { "Στήθος": 16, "Πλάτη": 16, "Πόδια": 24, "Χέρια": 14, "Ώμοι": 12, "Κορμός": 18 };
        return safeJson(localStorage.getItem(key), fallback) || fallback;
    }

    function normalizedName(value) {
        return String(value || "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\u0370-\u03ff]+/g, "");
    }

    function resolveGroup(name, fallback = "Άλλο") {
        if (typeof window.resolvePegasusExerciseGroup === "function") return window.resolvePegasusExerciseGroup(name);
        if (typeof window.getPegasusExerciseGroup === "function") return window.getPegasusExerciseGroup(name);
        const exact = window.exercisesDB?.find(ex => String(ex.name || "").trim() === String(name || "").trim());
        return exact?.muscleGroup || fallback;
    }

    function getLedger() {
        return safeJson(localStorage.getItem("pegasus_weekly_history_counted_v2"), { weekKey: getWeekKey(), exercises: {} }) || { weekKey: getWeekKey(), exercises: {} };
    }

    function getGroupsFromLedgerDate(dateKey) {
        const ledger = getLedger();
        const result = new Set();
        const exercises = ledger?.exercises && typeof ledger.exercises === "object" ? ledger.exercises : {};
        Object.keys(exercises).forEach(key => {
            if (!key.startsWith(`${dateKey}|`)) return;
            const count = Number(exercises[key]) || 0;
            if (count <= 0) return;
            const norm = key.split("|").slice(1).join("|");
            const match = window.exercisesDB?.find(ex => normalizedName(ex.name) === norm);
            const group = match?.muscleGroup || resolveGroup(norm, "Άλλο");
            if (STRICT_GROUPS.includes(group)) result.add(group);
        });
        return result;
    }

    function getWeekendCarryover() {
        const store = safeJson(localStorage.getItem("pegasus_weekend_carryover_v1"), { weeks: {} }) || { weeks: {} };
        const weekKey = getWeekKey();
        const entry = store.weeks?.[weekKey] || null;
        const groups = emptyGroups(0);
        if (entry?.groups && typeof entry.groups === "object") {
            STRICT_GROUPS.forEach(group => {
                const value = Number(entry.groups[group]);
                groups[group] = Number.isFinite(value) ? Math.max(0, value) : 0;
            });
        }
        return { weekKey, groups, raw: entry };
    }

    function dateAliasesFromDate(date) {
        const d = date instanceof Date ? new Date(date) : dateFromKey(date);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const m = String(d.getMonth() + 1);
        const day = String(d.getDate());
        return [
            `${yyyy}-${mm}-${dd}`,
            `${dd}/${mm}/${yyyy}`,
            `${day}/${m}/${yyyy}`,
            `${yyyy}${mm}${dd}`
        ];
    }

    function readMaxNumber(prefixes, aliases) {
        let max = 0;
        prefixes.forEach(prefix => {
            aliases.forEach(alias => {
                const value = Number(localStorage.getItem(prefix + alias));
                if (Number.isFinite(value) && value > max) max = value;
            });
        });
        return max;
    }

    function getCycleDatesForWeek(weekKey = getWeekKey()) {
        const saturday = dateFromKey(weekKey);
        return Array.from({ length: 7 }, (_, index) => addDays(saturday, index));
    }

    function entryMatchesDate(entry, aliases) {
        const text = JSON.stringify(entry || {});
        return aliases.some(alias => text.includes(alias));
    }

    function getCurrentWeekWeekendCyclingLoad() {
        const weekKey = getWeekKey();
        const cycleDates = getCycleDatesForWeek(weekKey);
        const kcalPrefixes = ["pegasus_cardio_kcal_", "pegasus_cardio_offset_sets_"];
        const kmPrefixes = ["pegasus_cardio_km_", "pegasus_cardio_distance_", "pegasus_cardio_kilometers_"];
        let totalKcal = 0;
        let totalKm = 0;
        let entries = 0;

        cycleDates.forEach(date => {
            const aliases = dateAliasesFromDate(date);
            totalKcal += readMaxNumber(kcalPrefixes, aliases);
            totalKm += readMaxNumber(kmPrefixes, aliases);
        });

        const history = safeJson(localStorage.getItem("pegasus_cardio_history"), []);
        if (Array.isArray(history)) {
            cycleDates.forEach(date => {
                const aliases = dateAliasesFromDate(date);
                history.forEach(entry => {
                    if (!entryMatchesDate(entry, aliases)) return;
                    const typeText = `${entry?.type || ""} ${entry?.activity || ""} ${entry?.mode || ""}`.toLowerCase();
                    if (typeText && !/(cycling|bike|ποδηλα)/i.test(typeText)) return;
                    const km = Number(entry?.km ?? entry?.distance ?? entry?.distanceKm ?? entry?.kilometers ?? 0) || 0;
                    const kcal = Number(entry?.kcal ?? entry?.calories ?? entry?.cardioKcal ?? entry?.burnedKcal ?? 0) || 0;
                    if (km > 0 || kcal > 0) {
                        totalKm += km;
                        totalKcal += kcal;
                        entries += 1;
                    }
                });
            });
        }

        const hasCycling = totalKm >= 10 || totalKcal >= 300 || entries > 0;
        return { hasCycling, totalKm, totalKcal, entries, weekKey };
    }

    function canTrainLegsOnDay(day) {
        const cyclingLoad = getCurrentWeekWeekendCyclingLoad();
        // PEGASUS 208: Αν υπάρχει ποδηλασία σε οποιαδήποτε μέρα του τρέχοντος κύκλου,
        // τα πόδια θεωρούνται καλυμμένα από το ποδήλατο και δεν προτείνονται σε καμία μέρα.
        // Αν δεν υπάρχει ποδηλασία, τα πόδια επιτρέπονται μόνο την Τετάρτη.
        return !cyclingLoad.hasCycling && day === "Τετάρτη";
    }

    function getWeekendMode(day) {
        if (!WEEKEND_DAYS.has(day)) return "core";
        const today = window.getPegasusLocalDateKey ? window.getPegasusLocalDateKey() : normalizeGreekDate();
        const dateKey = (getDayName(today) === day) ? today : normalizeGreekDate();
        const datedKey = `pegasus_weekend_training_mode_${dateKey}`;
        return localStorage.getItem(datedKey) || localStorage.getItem(`pegasus_weekend_training_mode_${day}`) || "bike";
    }

    function setWeekendMode(day, mode) {
        if (!WEEKEND_DAYS.has(day)) return;
        const allowed = ["bike", "bike_weights", "weights"];
        const next = allowed.includes(mode) ? mode : "bike";
        const today = window.getPegasusLocalDateKey ? window.getPegasusLocalDateKey() : normalizeGreekDate();
        const dateKey = (getDayName(today) === day) ? today : normalizeGreekDate();
        localStorage.setItem(`pegasus_weekend_training_mode_${dateKey}`, next);
        localStorage.setItem(`pegasus_weekend_training_mode_${day}`, next);
        if (window.PegasusCloud?.push) {
            try { window.PegasusCloud.push(true); } catch (e) {}
        }
    }

    function getPlannedTemplateGroups(day) {
        if (RECOVERY_DAYS.has(day)) return [];
        const mode = getWeekendMode(day);
        if (day === "Σάββατο" && mode === "bike") return [];
        if (day === "Κυριακή" && mode === "bike") return [];
        const priority = dayPriority[day] || [];
        if (day === "Σάββατο") return mode === "weights" ? ["Ώμοι", "Χέρια", "Κορμός", "Στήθος"] : ["Ώμοι", "Χέρια", "Κορμός"];
        if (day === "Κυριακή") return ["Στήθος", "Πλάτη", "Κορμός"];
        return priority.slice(0, 4);
    }

    function getAdjacentPlannedGroups(day, direction) {
        const idx = DAY_INDEX[day];
        if (typeof idx !== "number") return new Set();
        const nextDay = DAY_FROM_INDEX[(idx + direction + 7) % 7];
        return new Set(getPlannedTemplateGroups(nextDay));
    }

    function getPreviousDateKeyForDay(day) {
        const today = window.getPegasusLocalDateKey ? window.getPegasusLocalDateKey() : normalizeGreekDate();
        const todayName = getDayName(today);
        const targetIdx = DAY_INDEX[day];
        const todayIdx = DAY_INDEX[todayName];
        if (typeof targetIdx !== "number" || typeof todayIdx !== "number") return normalizeGreekDate(addDays(today, -1));
        const diff = targetIdx - todayIdx;
        const targetDate = addDays(today, diff);
        return normalizeGreekDate(addDays(targetDate, -1));
    }

    function getBlockedGroups(day) {
        const blocked = new Set();
        const prevDateKey = getPreviousDateKeyForDay(day);
        // PEGASUS 209: Block only muscle groups actually trained yesterday.
        // The previous planned-template guard was too aggressive and could leave
        // Wednesday/Friday with a tiny plan even when the weekly targets were open.
        getGroupsFromLedgerDate(prevDateKey).forEach(group => blocked.add(group));
        return blocked;
    }

    function computeRemaining({ includeCarryover = true } = {}) {
        const targets = getTargets();
        const history = getHistory();
        const carry = includeCarryover ? getWeekendCarryover().groups : emptyGroups(0);
        const weekendCycling = getCurrentWeekWeekendCyclingLoad();
        const remaining = emptyGroups(0);
        STRICT_GROUPS.forEach(group => {
            const target = Math.max(0, Number(targets[group]) || 0);
            let done = Math.max(0, Number(history[group]) || 0);

            // PEGASUS 208: Ποδηλασία σε οποιαδήποτε μέρα του κύκλου καλύπτει τα πόδια.
            if (group === "Πόδια" && weekendCycling.hasCycling) {
                done = Math.max(done, target);
            }

            const carried = Math.max(0, Number(carry[group]) || 0);
            remaining[group] = Math.max(0, target - done - carried);
        });
        return { targets, history, carry, remaining, weekendCycling };
    }

    function getSessionLimit(day, mode) {
        // 45-minute target: ~23-24 quality sets using PEGASUS 1.9 min/set budget.
        if (day === "Τρίτη" || day === "Τετάρτη" || day === "Παρασκευή") return 24;
        if (day === "Σάββατο" || day === "Κυριακή") {
            if (mode === "bike_weights") return 12;
            if (mode === "weights") return 18;
            return 0;
        }
        return 0;
    }

    function rankGroups(day, remaining, blocked) {
        const priority = dayPriority[day] || STRICT_GROUPS;
        return STRICT_GROUPS
            .filter(group => (remaining[group] || 0) > 0)
            .filter(group => !blocked.has(group))
            .sort((a, b) => {
                const byNeed = (remaining[b] || 0) - (remaining[a] || 0);
                if (byNeed !== 0) return byNeed;
                return (priority.indexOf(a) === -1 ? 99 : priority.indexOf(a)) - (priority.indexOf(b) === -1 ? 99 : priority.indexOf(b));
            });
    }

    function getExerciseKind(ex) {
        const name = normalizedName(ex?.name || "");
        const weight = Number(ex?.weight);
        const floorNames = new Set([
            "pushups",
            "plank",
            "legraisehiplift",
            "lyingkneeraise",
            "reversecrunch",
            "stretching"
        ]);
        if (floorNames.has(name)) return "floor";
        if ((ex?.muscleGroup === "Κορμός" || ex?.muscleGroup === "None") && (!Number.isFinite(weight) || weight <= 0)) return "floor";
        return "weighted";
    }

    function balanceExerciseOrder(list) {
        const pending = (Array.isArray(list) ? list : []).map((ex, index) => ({ ...ex, __originalOrder: index }));
        if (pending.length <= 2) return pending.map(({ __originalOrder, ...ex }) => ex);

        const result = [];
        const runLength = (kind) => {
            let count = 0;
            for (let i = result.length - 1; i >= 0; i--) {
                if (getExerciseKind(result[i]) !== kind) break;
                count += 1;
            }
            return count;
        };

        while (pending.length) {
            const last = result[result.length - 1] || null;
            const beforeLast = result[result.length - 2] || null;

            let bestIndex = 0;
            let bestScore = Infinity;

            pending.forEach((ex, index) => {
                const kind = getExerciseKind(ex);
                let score = 0;

                if (last) {
                    const lastKind = getExerciseKind(last);
                    if (kind === lastKind) score += 18;
                    if (runLength(kind) >= 2) score += 250;
                    if (ex.muscleGroup && ex.muscleGroup === last.muscleGroup) score += 90;
                    if (beforeLast && ex.muscleGroup && ex.muscleGroup === beforeLast.muscleGroup) score += 20;
                    if (kind !== lastKind) score -= 12;
                }

                // Keep floor/core work between weighted blocks when possible, so hands/arms rest longer.
                if (kind === "floor" && last && getExerciseKind(last) === "weighted") score -= 8;
                if (kind === "weighted" && last && getExerciseKind(last) === "floor") score -= 8;

                // Stable tie-breaker: preserve the Brain's original priority as much as possible.
                score += (ex.__originalOrder || 0) * 0.01;

                if (score < bestScore) {
                    bestScore = score;
                    bestIndex = index;
                }
            });

            result.push(pending.splice(bestIndex, 1)[0]);
        }

        return result.map(({ __originalOrder, ...ex }) => ex);
    }

    function chooseExercisesForGroup(group, setsNeeded, context) {
        const templates = defaultTemplates[group] || [];
        if (!templates.length || setsNeeded <= 0) return [];

        const maxFirst = context.day === "Παρασκευή" ? 6 : 5;
        const maxSecond = context.day === "Παρασκευή" ? 5 : 4;
        const result = [];
        let remaining = Math.max(0, Math.round(setsNeeded));

        if (remaining <= maxFirst || templates.length === 1) {
            result.push({ ...templates[0], sets: remaining, muscleGroup: group });
            return result;
        }

        const firstSets = Math.min(maxFirst, remaining);
        result.push({ ...templates[0], sets: firstSets, muscleGroup: group });
        remaining -= firstSets;

        if (remaining > 0) {
            const second = templates[1] || templates[0];
            result.push({ ...second, sets: Math.min(maxSecond, remaining), muscleGroup: group });
            remaining -= Math.min(maxSecond, remaining);
        }

        if (remaining > 0 && context.day === "Παρασκευή") {
            const third = templates[2] || templates[0];
            result.push({ ...third, sets: remaining, muscleGroup: group });
        }

        return result;
    }

    function getDailyWorkout(day, options = {}) {
        if (RECOVERY_DAYS.has(day)) {
            return [{ name: "Stretching", sets: 1, muscleGroup: "None", weight: "0", brainReason: "recovery-day", brainOrder: 0 }];
        }

        const mode = getWeekendMode(day);
        if (WEEKEND_DAYS.has(day) && mode === "bike") return [];

        const { remaining } = computeRemaining({ includeCarryover: true });
        const blocked = getBlockedGroups(day);
        let orderedGroups = rankGroups(day, remaining, blocked);

        // Guard against zero plan due strict adjacency: on Friday only, allow a safe closing group if otherwise empty.
        if (!orderedGroups.length && day === "Παρασκευή") {
            orderedGroups = rankGroups(day, remaining, new Set());
        }

        // Weekend weights are optional load. If all core remaining is already covered, still offer a small non-consecutive pump session.
        if (!orderedGroups.length && WEEKEND_DAYS.has(day) && mode !== "bike") {
            const candidates = getPlannedTemplateGroups(day).filter(group => !blocked.has(group));
            orderedGroups = candidates.slice(0, mode === "bike_weights" ? 2 : 3);
            candidates.forEach(group => { if (!remaining[group]) remaining[group] = mode === "bike_weights" ? 3 : 4; });
        }

        const allowLegs = canTrainLegsOnDay(day);
        orderedGroups = orderedGroups.filter(group => group !== "Πόδια" || allowLegs);

        const limit = getSessionLimit(day, mode);
        const exercises = [];
        let allocated = 0;

        for (const group of orderedGroups) {
            if (allocated >= limit) break;
            const need = Math.max(0, Math.round(remaining[group] || 0));
            if (need <= 0) continue;

            let groupCap = Math.min(need, day === "Παρασκευή" ? 8 : 7);
            // Legs appear only on Wednesday when there is no cycling in the cycle.
            // Keep them enough to matter but not so high that they consume the whole 45-minute session.
            if (group === "Πόδια" && day === "Τετάρτη") groupCap = Math.min(need, 10);
            if (WEEKEND_DAYS.has(day)) groupCap = Math.min(groupCap, mode === "bike_weights" ? 5 : 6);
            const toAllocate = Math.min(groupCap, Math.max(0, limit - allocated));
            if (toAllocate <= 0) continue;

            chooseExercisesForGroup(group, toAllocate, { day, mode }).forEach(ex => {
                exercises.push({
                    ...ex,
                    brainManaged: true,
                    brainReason: `${group}: λείπουν ${need} σετ, δόθηκαν ${toAllocate}`,
                    brainOrder: exercises.length
                });
            });
            allocated += toAllocate;
        }

        // PEGASUS 209: Keep non-recovery core days from feeling too small.
        // If strict remaining/actual-yesterday guards made the plan under-filled,
        // add safe upper-body top-up sets inside the 45-minute cap. Legs remain governed
        // only by canTrainLegsOnDay(day), so cycling still removes all leg work.
        if (!WEEKEND_DAYS.has(day) && !RECOVERY_DAYS.has(day) && allocated < 20) {
            const fillPriority = (dayPriority[day] || STRICT_GROUPS).filter(group => group !== "Πόδια" || allowLegs);
            for (const group of fillPriority) {
                if (allocated >= 22) break;
                if (blocked.has(group)) continue;
                const already = exercises.some(ex => ex.muscleGroup === group);
                const desired = already ? 3 : 4;
                const room = Math.max(0, Math.min(desired, 22 - allocated));
                if (room <= 0) continue;
                chooseExercisesForGroup(group, room, { day, mode }).forEach(ex => {
                    exercises.push({
                        ...ex,
                        brainManaged: true,
                        brainReason: `${group}: συμπλήρωση 45λεπτου πλάνου`,
                        brainOrder: exercises.length
                    });
                });
                allocated += room;
            }
        }

        if (options.isRainy && WEEKEND_DAYS.has(day) && !exercises.length) {
            return [
                { name: "Chest Press", sets: 4, muscleGroup: "Στήθος", weight: "54", brainManaged: true, brainOrder: 0 },
                { name: "Seated Rows", sets: 4, muscleGroup: "Πλάτη", weight: "66", brainManaged: true, brainOrder: 1 },
                { name: "Ab Crunches", sets: 3, muscleGroup: "Κορμός", weight: "30", brainManaged: true, brainOrder: 2 }
            ];
        }

        const balancedExercises = balanceExerciseOrder(exercises).map((ex, index) => ({
            ...ex,
            brainOrder: index,
            brainRestAware: true
        }));

        return balancedExercises;
    }

    function recordWeekendCarryover(exName, muscle, setValue, dateKey = null) {
        const todayKey = dateKey || (window.getPegasusLocalDateKey ? window.getPegasusLocalDateKey() : normalizeGreekDate());
        const dayName = getDayName(todayKey);
        if (!WEEKEND_DAYS.has(dayName)) return false;

        const group = STRICT_GROUPS.includes(muscle) ? muscle : resolveGroup(exName, "Άλλο");
        if (!STRICT_GROUPS.includes(group)) return false;

        const value = Math.max(0, Number(setValue) || 0);
        if (value <= 0) return false;

        const nextWeekKey = getNextWeekKey(todayKey);
        const store = safeJson(localStorage.getItem("pegasus_weekend_carryover_v1"), { weeks: {} }) || { weeks: {} };
        if (!store.weeks || typeof store.weeks !== "object") store.weeks = {};
        if (!store.weeks[nextWeekKey]) store.weeks[nextWeekKey] = { weekKey: nextWeekKey, groups: emptyGroups(0), dates: {}, updatedAt: Date.now() };
        const entry = store.weeks[nextWeekKey];
        if (!entry.groups || typeof entry.groups !== "object") entry.groups = emptyGroups(0);
        if (!entry.dates || typeof entry.dates !== "object") entry.dates = {};
        if (!entry.dates[todayKey]) entry.dates[todayKey] = emptyGroups(0);

        entry.groups[group] = Math.max(0, Number(entry.groups[group] || 0)) + value;
        entry.dates[todayKey][group] = Math.max(0, Number(entry.dates[todayKey][group] || 0)) + value;
        entry.updatedAt = Date.now();
        entry.sourceWeekKey = getWeekKey(todayKey);
        store.updatedAt = Date.now();

        // Keep only current/next-ish records.
        Object.keys(store.weeks).forEach(key => {
            const ageDays = (new Date() - dateFromKey(key)) / 86400000;
            if (ageDays > 21) delete store.weeks[key];
        });

        localStorage.setItem("pegasus_weekend_carryover_v1", JSON.stringify(store));
        return true;
    }

    function renderWeekendModePanel(day, container, onChange) {
        if (!WEEKEND_DAYS.has(day) || !container) return;
        const mode = getWeekendMode(day);
        const panel = document.createElement("div");
        panel.className = "pegasus-weekend-mode-panel";
        panel.innerHTML = `
            <div class="pegasus-weekend-mode-title">Σ/Κ</div>
            <div class="pegasus-weekend-mode-options">
                <button type="button" data-mode="bike" class="${mode === "bike" ? "active" : ""}">🚴 Ποδήλατο</button>
                <button type="button" data-mode="bike_weights" class="${mode === "bike_weights" ? "active" : ""}">⚡ Ποδ. + βάρη</button>
                <button type="button" data-mode="weights" class="${mode === "weights" ? "active" : ""}">🏋️ Βάρη</button>
            </div>
        `;
        panel.querySelectorAll("button[data-mode]").forEach(btn => {
            btn.addEventListener("click", () => {
                setWeekendMode(day, btn.dataset.mode);
                if (typeof onChange === "function") onChange();
            });
        });
        container.appendChild(panel);
    }

    function isManagedDay(day) {
        return ["Τρίτη", "Τετάρτη", "Παρασκευή", "Σάββατο", "Κυριακή", "Δευτέρα", "Πέμπτη"].includes(day);
    }

    window.PegasusBrain = {
        version: "1.0.210",
        groups: STRICT_GROUPS.slice(),
        getWeekKey,
        getNextWeekKey,
        getDayName,
        getTargets,
        getHistory,
        getWeekendMode,
        setWeekendMode,
        getWeekendCarryover,
        getCurrentWeekWeekendCyclingLoad,
        canTrainLegsOnDay,
        computeRemaining,
        getDailyWorkout,
        recordWeekendCarryover,
        renderWeekendModePanel,
        isManagedDay
    };

    console.log("🧠 PEGASUS BRAIN: Dynamic weekly planner active (v1.0.209).");
})();
