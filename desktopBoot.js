/* ==========================================================================
   PEGASUS DESKTOP BOOT MODULE - v44 REFACTOR
   Extracted from app.js to preserve exact desktop boot behavior.
   ========================================================================== */

window.PegasusDesktopBoot = window.PegasusDesktopBoot || {
    getTodayName() {
        const greekDays = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
        const todayObj = new Date();
        return greekDays[todayObj.getDay()];
    },

    resetWeeklyHistoryIfNeeded(todayName) {
        if (todayName === "Δευτέρα") {
            try {
                const lastReset = localStorage.getItem('pegasus_last_reset');
                const todayDateStr = window.getPegasusLocalDateKey();
                if (lastReset !== todayDateStr) {
                    const freshHistory = { "Στήθος": 0, "Πλάτη": 0, "Ώμοι": 0, "Χέρια": 0, "Κορμός": 0, "Πόδια": 0 };
                    localStorage.setItem('pegasus_weekly_history', JSON.stringify(freshHistory));
                    localStorage.setItem('pegasus_weekly_kcal', "0.0");
                    localStorage.setItem('pegasus_last_reset', todayDateStr);
                    if (window.PegasusCloud?.push) window.PegasusCloud.push();
                }
            } catch (e) {
                console.error("🛡️ PEGASUS RESET ERROR:", e);
            }
        }
    },

    alignMasterWeightLater() {
        setTimeout(() => {
            if (window.PegasusCloud?.getMasterWeight && window.PegasusWeight) {
                window.PegasusWeight.alignWithCloud(window.PegasusCloud.getMasterWeight());
            }
        }, 2000);
    },

    initImportBinding() {
        const importInput = document.getElementById('importFileTools');
        if (importInput) importInput.onchange = (e) => window.importPegasusData(e);
    },

    boot() {
        const todayName = window.PegasusDesktopBoot.getTodayName();

        window.PegasusDesktopBoot.resetWeeklyHistoryIfNeeded(todayName);
        window.PegasusDesktopBoot.alignMasterWeightLater();

        if (typeof emailjs !== 'undefined') emailjs.init('qsfyDrneUHP7zEFui');

        window.PegasusDesktopBoot.initImportBinding();

        if (typeof window.bindPegasusEngineUiBridge === "function") window.bindPegasusEngineUiBridge();
        if (typeof window.syncEngineFromLegacy === "function") window.syncEngineFromLegacy("BOOT_FROM_LEGACY", { selectedDay: todayName });

        if (typeof window.createNavbar === "function") window.createNavbar();
        if (window.updateTotalWorkoutCount) window.updateTotalWorkoutCount();
        if (window.updateKoukiBalance) window.updateKoukiBalance();

        if (typeof window.calculatePegasusDailyTarget === "function") {
            window.calculatePegasusDailyTarget();
        } else if (typeof window.updateKcalUI === "function") {
            window.updateKcalUI();
        }

        window.masterUI = window.PegasusDesktopSyncUI.buildMasterUI(todayName);
        window.PegasusDesktopSyncUI.bindMasterUI();
        window.PegasusDesktopSyncUI.autoInitializeToday(todayName);
        window.PegasusDesktopSyncUI.finalizeDesktopBoot(todayName);
    }
};

window.onload = () => {
    window.PegasusDesktopBoot.boot();
};
