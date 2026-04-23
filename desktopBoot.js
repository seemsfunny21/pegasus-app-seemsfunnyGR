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


/* ===== CONSOLIDATED FROM desktopBootEnhancements.js ===== */
    /* PEGASUS ANTI-AUTOCOMPLETE PROTOCOL */
    document.addEventListener("DOMContentLoaded", function() {
        document.querySelectorAll('input').forEach(input => {
            input.setAttribute('autocomplete', 'off');
            input.setAttribute('autocorrect', 'off');
            input.setAttribute('autocapitalize', 'off');
            input.setAttribute('spellcheck', 'false');
        });
    });

    /* 📊 DYNAMIC UI BRIDGE (v16.4 ALIGNED) */
    window.forcePegasusRender = function() {
        if (window.MuscleProgressUI && typeof window.MuscleProgressUI.render === "function") {
            window.MuscleProgressUI.render(true);
        } else {
            console.warn("⚠️ PEGASUS: MuscleProgressUI module not loaded yet.");
        }
    };

    const btnPreview = document.getElementById('btnPreviewUI');
    if (btnPreview) {
        btnPreview.addEventListener('click', () => { 
            setTimeout(window.forcePegasusRender, 200); 
        });
    }

    /* 🛡️ SERVICE WORKER & LOADER PROTOCOL */
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data && event.data.type === 'CACHE_PROGRESS') {
                const percent = event.data.percent;
                const loaderBar = document.querySelector('.loader-bar-fill');
                const loaderText = document.querySelector('.loader-text');
                if (loaderBar) loaderBar.style.width = percent + '%';
                if (loaderText) loaderText.textContent = `STORAGE INITIALIZATION: ${percent}%`;
                if (percent === 100) {
                    setTimeout(() => {
                        if (loaderText) loaderText.textContent = "SYSTEM READY - ENCRYPTED";
                    }, 500);
                }
            }
        });

        window.addEventListener('load', () => {
            const swPath = window.location.pathname.includes('mobile/') ? '../sw.js' : './sw.js';
            navigator.serviceWorker.register(swPath + '?v=3.30')
                .then(reg => reg.update())
                .catch(err => console.error("🛡️ SW Error:", err));
        });
    }



/* ===== CONSOLIDATED FROM app.js ===== */
/* ==========================================================================
   PEGASUS APP COORDINATOR
   Thin compatibility shell preserved intentionally for safe legacy wiring.
   ========================================================================== */

if (!window.PegasusAppState) {
    console.warn("⚠️ PEGASUS APP: PegasusAppState missing before app coordinator load.");
}

if (!window.PegasusDesktopBoot) {
    console.warn("⚠️ PEGASUS APP: Desktop boot module missing before app coordinator load.");
}

window.getPegasusAppCoordinatorState = function() {
    return {
        hasAppState: !!window.PegasusAppState,
        hasDesktopBoot: !!window.PegasusDesktopBoot,
        hasModuleIntegrity: !!window.PegasusModuleIntegrity,
        masterUiKeys: Object.keys(window.masterUI || {})
    };
};



/* ===== CONSOLIDATED FROM weather.js ===== */
/* ==========================================================================
   PEGASUS WEATHER WIDGET - v4.1 (DYNAMIC ROUTING EDITION)
   Protocol: Strict Analyst - Ioannina GR - UI & Logic Bridge
   Status: FINAL STABLE | FIXED: THE "isRaining" WORKOUT BRIDGE
   ========================================================================== */

function weatherCodeToEmoji(code) {
    if (code === 0) return "☀️";
    if (code <= 3) return "🌤️";
    if (code === 45 || code === 48) return "🌥️";
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return "🌧️";
    if (code >= 71 && code <= 77) return "❄️";
    return "🌫️";
}

// 🎯 FIXED: Η γέφυρα που λέει στο app.js αν πρέπει να αλλάξει το πρόγραμμα σε "Indoor"
window.isRaining = function() {
    const code = parseInt(localStorage.getItem('pegasus_weather_code')) || 0;
    // WMO Codes: 51-67 (Drizzle/Rain), 71-77 (Snow), 80-82 (Showers), 95-99 (Thunderstorm)
    const badWeather = (code >= 51 && code <= 67) || (code >= 71 && code <= 77) || (code >= 80 && code <= 82) || (code >= 95);
    
    if (badWeather) {
        console.log("🌧️ PEGASUS WEATHER: Βροχή/Κακοκαιρία ανιχνεύθηκε. Το πρόγραμμα προσαρμόζεται σε Indoor.");
    }
    return badWeather;
};

window.updateWeatherUI = async function() {
    try {
        // Ioannina Coordinates
        const url = "https://api.open-meteo.com/v1/forecast?latitude=39.667&longitude=20.850&current_weather=true";
        const res = await fetch(url);
        const data = await res.json();

        if (data && data.current_weather) {
            const temp = Math.round(data.current_weather.temperature);
            const code = data.current_weather.weathercode;
            const emoji = weatherCodeToEmoji(code);

            // 🎯 Αποθήκευση του κωδικού για άμεση χρήση (synchronous) από το app.js στο boot
            localStorage.setItem('pegasus_weather_code', code);

            const weatherEl = document.querySelector('.weather-text');
            if (weatherEl) {
                weatherEl.innerHTML = `${emoji} ${temp}°C`;
            }
            console.log(`[WEATHER UI] Sync Complete: ${temp}°C ${emoji} (Code: ${code})`);
            
            // 🎯 Αν είναι Σ/Κ και ο καιρός άλλαξε ενώ η εφαρμογή είναι ανοιχτή, κάνουμε force re-render
            const today = new Date().getDay();
            if ((today === 0 || today === 6) && window.masterUI && typeof window.forcePegasusRender === 'function') {
                // Σιωπηλό re-evaluation του πλάνου αν είμαστε σε Σ/Κ
                console.log("🔄 PEGASUS WEATHER: Re-evaluating weekend routing...");
            }
        }
    } catch (err) {
        console.error("❌ PEGASUS WEATHER ERROR:", err);
        const weatherEl = document.querySelector('.weather-text');
        if (weatherEl) weatherEl.innerText = "--°C";
    }
};

// Εκκίνηση με το φόρτωμα της σελίδας
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(window.updateWeatherUI, 1500); 
    setInterval(window.updateWeatherUI, 30 * 60 * 1000); // Ανανέωση κάθε 30 λεπτά
});

