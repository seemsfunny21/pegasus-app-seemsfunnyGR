/* ==========================================================================
   PEGASUS OS - MOBILE DIET DELETE ROUTINE FIX v1.0
   Purpose: Allow same-day deletion of auto-injected routine meals on mobile
   Scope: Mobile diet only | Non-invasive patch layer
   ========================================================================== */

(function installMobileDietDeleteRoutineFix() {
    if (!window.PegasusDiet || window.PegasusDiet.__routineDeleteFixInstalled) return;

    const diet = window.PegasusDiet;
    const originalGetRoutineTemplates = typeof diet.getRoutineTemplates === "function"
        ? diet.getRoutineTemplates.bind(diet)
        : () => [];
    const originalAdd = typeof diet.add === "function"
        ? diet.add.bind(diet)
        : null;
    const originalDelete = typeof diet.delete === "function"
        ? diet.delete.bind(diet)
        : null;

    const suppressionKey = (dateStr) => `pegasus_mobile_deleted_routine_${dateStr}`;

    function getDateStr() {
        return typeof diet.getStrictDateStr === "function"
            ? diet.getStrictDateStr()
            : `${String(new Date().getDate()).padStart(2, '0')}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;
    }

    function safeParse(raw) {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    function getSuppressed(dateStr) {
        return safeParse(localStorage.getItem(suppressionKey(dateStr)));
    }

    function setSuppressed(dateStr, names) {
        const uniqueNames = Array.from(new Set((names || []).filter(Boolean)));
        localStorage.setItem(suppressionKey(dateStr), JSON.stringify(uniqueNames));
    }

    function addSuppressed(dateStr, name) {
        const next = getSuppressed(dateStr);
        next.push(name);
        setSuppressed(dateStr, next);
    }

    function removeSuppressed(dateStr, name) {
        const next = getSuppressed(dateStr).filter(entry => entry !== name);
        setSuppressed(dateStr, next);
    }

    function isRoutineName(name) {
        const allRoutineNames = originalGetRoutineTemplates().map(item => item?.name).filter(Boolean);
        return allRoutineNames.includes(String(name || ""));
    }

    diet.getRoutineTemplates = function() {
        const dateStr = getDateStr();
        const blocked = new Set(getSuppressed(dateStr));
        return originalGetRoutineTemplates().filter(item => !blocked.has(item?.name));
    };

    if (originalAdd) {
        diet.add = async function(n, k, p) {
            const dateStr = getDateStr();
            const name = String(n || document.getElementById("fName")?.value || "").trim();

            if (name && isRoutineName(name)) {
                const blocked = new Set(getSuppressed(dateStr));
                if (blocked.has(name)) {
                    console.log("🛡️ DIET MOBILE PATCH: Suppressed routine re-add blocked:", name);
                    return false;
                }

                removeSuppressed(dateStr, name);
            }

            return originalAdd(n, k, p);
        };
    }

    if (originalDelete) {
        diet.delete = async function(idx) {
            const dateStr = getDateStr();
            const log = typeof diet.getLog === "function" ? (diet.getLog(dateStr) || []) : [];
            const target = log[idx];

            if (target?.name && isRoutineName(target.name)) {
                addSuppressed(dateStr, target.name);
            }

            return originalDelete(idx);
        };
    }

    diet.__routineDeleteFixInstalled = true;
    console.log("✅ DIET MOBILE PATCH: Routine delete suppression active.");
})();
