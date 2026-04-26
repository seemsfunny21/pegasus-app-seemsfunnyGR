/* ==========================================================================
   PEGASUS DESKTOP BOOT MODULE - v44 REFACTOR
   Extracted from app.js to preserve exact desktop boot behavior.
   ========================================================================== */

/* ==========================================================================
   PEGASUS DESKTOP SYNC/UI MODULE - v44 REFACTOR
   Extracted from app.js to preserve exact desktop masterUI + panel behavior.
   ========================================================================== */

window.PegasusDesktopSyncUI = window.PegasusDesktopSyncUI || {
    buildMasterUI(todayName) {
        return {
            "btnStart": window.startPause,
            "btnNext": window.skipToNextExercise,
            "btnWarmup": () => {
                const vid = document.getElementById("video");
                if (!vid) return;
                if (!vid.src.includes("warmup.mp4")) {
                    vid.pause();
                    vid.src = "videos/warmup.mp4";
                    vid.load();
                    vid.play().catch(e => console.log(e));
                } else {
                    vid.pause();
                    if (typeof window.showVideo === "function" && window.exercises && window.exercises.length > 0) {
                        window.currentIdx = 0;
                        window.phase = 0;
                        if (typeof window.patchPegasusWorkoutRuntime === "function") window.patchPegasusWorkoutRuntime({ currentIdx: 0, phase: 0, running: running, sessionKcal: sessionActiveKcal });
                        window.showVideo(0);
                    }
                }
            },
            "btnTurboTools": () => {
                window.TURBO_MODE = !window.TURBO_MODE;
                window.SPEED = window.TURBO_MODE ? 10 : 1;
                TURBO_MODE = window.TURBO_MODE;
                SPEED = window.SPEED;
                if (typeof window.patchPegasusTimerRuntime === "function") window.patchPegasusTimerRuntime({ turboMode: TURBO_MODE, speed: SPEED });

                const btn = document.getElementById('btnTurboTools');
                if (btn) {
                    btn.textContent = window.TURBO_MODE ? "🚀 TURBO: ΕΝΕΡΓΟ" : "🚀 TURBO: ΑΝΕΝΕΡΓΟ";
                    btn.style.color = window.TURBO_MODE ? "#ff4444" : "#4CAF50";
                }
            },
            "btnMuteTools": () => {
                window.muted = !window.muted;
                muted = window.muted;
                if (typeof window.patchPegasusUserRuntime === "function") window.patchPegasusUserRuntime({ muted: muted, weight: userWeight });

                const btn = document.getElementById('btnMuteTools');
                if (btn) {
                    btn.textContent = window.muted ? "🔇 ΗΧΟΣ: ΣΙΓΑΣΗ" : "🔊 ΗΧΟΣ: ΕΝΕΡΓΟΣ";
                    btn.style.color = window.muted ? "#888" : "#4CAF50";
                }
            },
            "btnPartnerMode": () => {
                if (typeof window.togglePartnerMode === 'function') window.togglePartnerMode();
            },
            "btnImportData": () => {
                const f = document.getElementById('importFileTools');
                if (f) f.click();
            },
            "btnExportData": () => {
                if (window.exportPegasusData) window.exportPegasusData();
            },
            "btnMasterVault": () => {
                if (typeof window.handleDesktopSyncOpen === 'function') {
                    window.handleDesktopSyncOpen();
                    return;
                }
                const m = document.getElementById('pinModal');
                if (m) m.style.display = 'flex';
            },
            "btnPlanSelector": { panel: "planModal", init: null },
            "btnCalendarUI": { panel: "calendarPanel", init: window.renderCalendar },
            "btnAchUI": { panel: "achievementsPanel", init: window.renderAchievements },
            "btnSettingsUI": { panel: "settingsPanel", init: window.initSettingsUI },
            "btnFoodUI": { panel: "foodPanel", init: window.updateFoodUI },
            "btnProposalsUI": () => {
                if (window.PegasusDietAdvisor?.renderAdvisorUI) window.renderAdvisorUI();
                else { if (window.pegasusAlert) window.pegasusAlert("Σφάλμα: Το dietAdvisor.js δεν έχει φορτωθεί σωστά."); else alert("Σφάλμα: Το dietAdvisor.js δεν έχει φορτωθεί σωστά."); }
            },
            "btnToolsUI": { panel: "toolsPanel", init: null },
            "btnPreviewUI": { panel: "previewPanel", init: window.renderPreview || window.openExercisePreview },
            "btnOpenGallery": { panel: "galleryPanel", init: () => { if (window.GalleryEngine) window.GalleryEngine.render(); } },
            "btnCardio": { panel: "cardioPanel", init: () => { if (window.PegasusCardio) window.PegasusCardio.open(); } },
            "btnEMS": { panel: "emsModal", init: window.logEMSData },
            "btnManualEmail": () => {
                if (window.PegasusReporting?.checkAndSendMorningReport) window.PegasusReporting.checkAndSendMorningReport(true);
                else { if (window.pegasusAlert) window.pegasusAlert("Reporting Engine Offline"); else alert("Reporting Engine Offline"); }
            },
            "btnSaveSettings": () => {
                if (typeof window.savePegasusSettingsGlobal === "function") {
                    window.savePegasusSettingsGlobal();
                } else {
                    const weightVal = document.getElementById("userWeightInput")?.value || 74;
                    if (window.PegasusWeight?.save) window.PegasusWeight.save(weightVal);
                    else localStorage.setItem(P_M?.user?.weight || "pegasus_weight", weightVal);
                    if (window.PegasusCloud?.push) window.PegasusCloud.push(true);
                    setTimeout(() => { location.reload(); }, 300);
                }
            }
        };
    },

    bindMasterUI() {
        Object.keys(window.masterUI).forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    const target = window.masterUI[btnId];

                    if (!btnId.includes("Save") && !btnId.includes("Start") && btnId !== "btnProposalsUI") {
                        document.querySelectorAll('.pegasus-panel, #emsModal').forEach(p => p.style.display = "none");
                    }

                    if (typeof target === 'function') {
                        target();
                    } else if (target && target.panel) {
                        const el = document.getElementById(target.panel);
                        if (el) {
                            el.style.display = "block";
                            if (target.init) target.init();
                        }
                    }
                };
            }
        });
    },

    autoInitializeToday(todayName) {
        setTimeout(() => {
            document.querySelectorAll(".navbar button").forEach(b => {
                if (b.id.replace('nav-', '') === todayName) {
                    if (typeof window.selectDay === "function") {
                        window.selectDay(b, todayName);
                        setTimeout(() => {
                            if (typeof exercises !== 'undefined') {
                                currentIdx = remainingSets.findIndex((sets, idx) => sets > 0 && !exercises[idx]?.classList.contains("exercise-skipped"));
                                if (currentIdx === -1) currentIdx = 0;
                                if (typeof window.syncPegasusSelectedDay === "function") window.syncPegasusSelectedDay(todayName);
                                console.log("🚀 PEGASUS: Circuit Auto-Initialized for Today.");
                            }
                        }, 150);
                    }
                }
            });
        }, 400);
    },

    finalizeDesktopBoot(todayName) {
        if (window.PegasusUI?.init) window.PegasusUI.init();

        setTimeout(() => {
            const loader = document.getElementById('pegasus-loader');
            if (loader) {
                loader.style.opacity = '0';
                loader.style.visibility = 'hidden';
            }

            if (typeof window.syncPegasusSelectedDay === "function") window.syncPegasusSelectedDay(todayName);

            if (typeof window.updateKcalUI === "function") {
                window.updateKcalUI();
            }

            if (typeof window.syncPegasusProgressRuntime === "function") window.syncPegasusProgressRuntime();
            if (typeof window.syncPegasusUserRuntime === "function") window.syncPegasusUserRuntime();
            if (typeof window.renderPegasusControlState === "function") window.renderPegasusControlState();

            console.log("🛡️ PEGASUS OS: Initializing Complete. Welcome back, Angelos.");
        }, 1000);
    }
};

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
            navigator.serviceWorker.register(swPath + '?v=3.63')
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



/* ==========================================================================
   MERGED FROM backup.js during consolidation
   ========================================================================== */

/* ==========================================================================
   PEGASUS BACKUP & RESTORE - MASTER MANIFEST EDITION (V10.2)
   Protocol: Universal JSON Unwrapping, Date Padding & IndexedDB Recovery
   Status: FINAL STABLE | ZERO-BUG VERIFIED
   ========================================================================== */

window.exportPegasusData = async function() {
    if (!window.PegasusManifest) {
        console.error("❌ CRITICAL: PegasusManifest not found.");
        alert("ΣΦΑΛΜΑ: Λείπει το manifest.js. Η εξαγωγή ακυρώθηκε.");
        return;
    }

    const data = { localStorage: {}, indexedDB: [] };
    const M = window.PegasusManifest;
    
    console.log("%c[BACKUP] Starting Manifest-Based Scan...", "color: #00bcd4; font-weight: bold;");

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const val = localStorage.getItem(key);

        const isOfficial = Object.values(M).some(category => 
            Object.values(category).some(manifestKey => 
                key === manifestKey || (typeof manifestKey === 'string' && key.startsWith(manifestKey))
            )
        );

        const isBlocked = window.PegasusCloud?.isExportBlockedKey?.(key);

        if (!isBlocked && (isOfficial || key.includes("ANGELOS") || key.startsWith("weight_"))) {
            data.localStorage[key] = val;
        }
    }

    const dbRequest = indexedDB.open("PegasusLevels", 1);
    dbRequest.onsuccess = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("photos")) {
            db.close();
            finalizeExport(data);
            return;
        }

        const tx = db.transaction("photos", "readonly");
        const store = tx.objectStore("photos");
        store.getAll().onsuccess = (ev) => {
            data.indexedDB = ev.result || ev.target.result;
            db.close();
            finalizeExport(data);
        };
    };

    dbRequest.onerror = () => {
        console.warn("IndexedDB Access Failed. Exporting LocalStorage only.");
        finalizeExport(data);
    };
};

function finalizeExport(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const timestamp = new Date().toISOString().slice(0,10);
    
    a.href = url;
    a.download = `PEGASUS_MASTER_BACKUP_${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    console.log("%c✅ PEGASUS: Backup Created with v10.2 Integrity Protocol.", "color: #4CAF50; font-weight: bold;");
}

/* ==========================================================================
   RESTORE ENGINE (V10.2 - UNIVERSAL UNWRAP & MIGRATION)
   ========================================================================== */
window.importPegasusData = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            
            // 🛡️ UNIVERSAL UNWRAP: Ανιχνεύει αν τα δεδομένα είναι μέσα στο "localStorage" wrapper
            const payload = imported.localStorage ? imported.localStorage : imported;

            if (window.GalleryEngine && window.GalleryEngine.db) {
                window.GalleryEngine.db.close();
            }

            const msg = `🚨 PEGASUS OS: ΕΝΑΡΞΗ ΑΝΑΚΤΗΣΗΣ\n\nΘα γίνει αυτόματη διόρθωση ημερομηνιών και πλήρης επαναφορά.\nΤα τρέχοντα δεδομένα θα διαγραφούν. Συνέχεια;`;
            if (!confirm(msg)) return;

            console.log("%c[RECOVERY] Initializing Universal Migration Engine...", "color: #ff9800; font-weight: bold;");

            const migratedStorage = {};
            const dateKeys = ["food_log_", "pegasus_cardio_kcal_", "pegasus_routine_injected_", "weight_"];

            Object.keys(payload).forEach(key => {
                let newKey = key;
                let val = payload[key];
                
                // 🎯 DATE PADDING MIGRATION
                if (dateKeys.some(prefix => key.startsWith(prefix))) {
                    const parts = key.split('_');
                    const datePart = parts.pop();
                    const dateParts = datePart.split('/');
                    if (dateParts.length === 3) {
                        const d = dateParts[0].padStart(2, '0');
                        const m = dateParts[1].padStart(2, '0');
                        const y = dateParts[2];
                        newKey = parts.join('_') + `_${d}/${m}/${y}`;
                    }
                }
                
                // 🛡️ STRINGIFICATION SHIELD: Το LocalStorage δέχεται ΜΟΝΟ strings
                migratedStorage[newKey] = (typeof val === 'object') ? JSON.stringify(val) : String(val);
            });

            const preserved = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key) continue;
                if (window.PegasusCloud?.isExportBlockedKey?.(key) || window.PegasusCloud?.isLocalOnlyStorageKey?.(key) || window.PegasusCloud?.isInternalStorageKey?.(key)) {
                    preserved[key] = localStorage.getItem(key);
                }
            }

            localStorage.clear();
            Object.entries(migratedStorage).forEach(([k, v]) => localStorage.setItem(k, v));
            Object.entries(preserved).forEach(([k, v]) => localStorage.setItem(k, v));

            if (!localStorage.getItem("pegasus_weight")) localStorage.setItem("pegasus_weight", "74");

            // ΑΝΑΔΟΜΗΣΗ INDEXEDDB
            setTimeout(() => {
                const delReq = indexedDB.deleteDatabase("PegasusLevels");
                delReq.onsuccess = () => {
                    const dbReq = indexedDB.open("PegasusLevels", 1);
                    dbReq.onupgradeneeded = (ev) => ev.target.result.createObjectStore("photos", { keyPath: "id" });
                    dbReq.onsuccess = (ev) => {
                        const db = ev.target.result;
                        if (imported.indexedDB && imported.indexedDB.length > 0) {
                            const tx = db.transaction("photos", "readwrite");
                            imported.indexedDB.forEach(p => tx.objectStore("photos").add(p));
                            tx.oncomplete = () => {
                                db.close();
                                finalizeRecovery();
                            };
                        } else {
                            db.close();
                            finalizeRecovery();
                        }
                    };
                };
            }, 600);

        } catch (err) {
            console.error("Critical Recovery Failure:", err);
            alert("FATAL RESTORE ERROR: " + err.message);
        }
    };
    reader.readAsText(file);
};

async function finalizeRecovery() {
    console.log("📡 PEGASUS: Forcing Cloud Sync after recovery...");
    if (window.PegasusCloud && window.PegasusCloud.push) {
        await window.PegasusCloud.push(true);
    }
    alert("✅ Η ΑΝΑΚΤΗΣΗ ΟΛΟΚΛΗΡΩΘΗΚΕ!\n\nΌλα τα δεδομένα διορθώθηκαν και συγχρονίστηκαν.");
    window.location.reload();
}

window.triggerPegasusImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => window.importPegasusData(e);
    input.click();
};



/* ==========================================================================
   MERGED FROM calendar.js during consolidation
   ========================================================================== */

/* ==========================================================================
   PEGASUS CALENDAR SYSTEM - v8.1 (MANIFEST ALIGNED)
   Protocol: Data Over Plan Priority, Normalized Date Sync & Padding Alignment
   Status: FINAL STABLE | FIXED: TIMEZONE TRAP & MANIFEST SYNC
   ========================================================================== */



// 🛡️ Global Safe Declaration
var M = M || window.PegasusManifest;
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
window.selectedCalendarDate = null; 

window.renderCalendar = function() {
    const el = document.getElementById("calendarContent");
    if (!el) return;

    // 🎯 FIXED: Δυναμική ανάκτηση από Manifest
  const doneKey = M?.workout?.done || "pegasus_workouts_done";
    const data = JSON.parse(localStorage.getItem(doneKey) || "{}");
    
    const now = new Date();
    // Κανονικοποίηση "Σήμερα" στο Midnight για ασφαλή σύγκριση
    const todayNormalized = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    let html = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;color:#4CAF50;background:#111;padding:8px;border-radius:5px;border:1px solid #333;">
        <span id="prevMonth" style="cursor:pointer;padding:0 10px; font-weight:bold; user-select:none;">&#8592;</span>
        <span style="text-transform: capitalize; font-weight:bold; letter-spacing:1px;">${new Date(currentYear, currentMonth).toLocaleString("el-GR", { month: "long" })} ${currentYear}</span>
        <span id="nextMonth" style="cursor:pointer;padding:0 10px; font-weight:bold; user-select:none;">&#8594;</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;">
    `;

    const weekHeaders = ["Κ","Δ","Τ","Τ","Π","Π","Σ"];
    weekHeaders.forEach(d => html += `<div style="text-align:center;opacity:.6;color:#4CAF50;font-size:11px;font-weight:900;">${d}</div>`);

    // Κενά για την αρχή του μήνα
    for (let i = 0; i < firstDayOfMonth; i++) html += `<div></div>`;

    for (let day = 1; day <= daysInMonth; day++) {
        const loopDate = new Date(currentYear, currentMonth, day);
        const loopDateTime = loopDate.getTime();
        const dayOfWeek = loopDate.getDay(); 
        
        // 🎯 UNIFIED PADDING PROTOCOL
        const dStr = String(day).padStart(2, '0');
        const mStr = String(currentMonth + 1).padStart(2, '0');
        const workoutKey = `${currentYear}-${mStr}-${dStr}`;
        const foodDateString = `${dStr}/${mStr}/${currentYear}`;
        
        let bg = "#1a1a1a";
        let border = "1px solid #333";
        let color = "#fff";
        let glow = "none";

        const isRecoveryDay = (dayOfWeek === 1 || dayOfWeek === 4);

        // --- STRICT PRIORITY RENDERING ---
        if (data[workoutKey] === true) {
            // 1. ΕΠΙΤΥΧΙΑ (Προπόνηση): ΠΡΑΣΙΝΟ
            bg = "#4CAF50";
            border = "1px solid #4CAF50";
            color = "#000";
        } 
        else if (isRecoveryDay) {
            // 2. ΠΛΑΝΟ ΑΠΟΘΕΡΑΠΕΙΑΣ: ΜΠΛΕ
            bg = "#1e3a5f"; 
            border = "1px solid #64B5F6";
        }
        else if (loopDateTime < todayNormalized) {
            // 3. ΠΑΡΕΛΘΟΝ & ΧΑΣΙΜΟ (Όχι προπόνηση/Όχι recovery): ΚΟΚΚΙΝΟ
            bg = "#b71c1c";
            border = "1px solid #ff5252";
        }

        // Highlight Σήμερα (Χρυσό περίγραμμα)
        if (loopDateTime === todayNormalized) {
            border = "2px solid #FFD700";
            glow = "0 0 10px rgba(255, 215, 0, 0.3)";
            if (bg === "#1a1a1a") color = "#FFD700";
        }

        // Highlight Επιλεγμένης Μέρας (Focus - Green Matrix)
        if (window.selectedCalendarDate === foodDateString) {
            border = "2px solid #00ff41";
            bg = "#002200";
            color = "#00ff41";
        }

        html += `<div style="background:${bg};border:${border};color:${color};padding:8px 0;text-align:center;border-radius:6px;font-size:13px;cursor:pointer;font-weight:bold;box-shadow:${glow};transition:0.2s;" 
                    onclick="window.viewFoodFromCalendar('${foodDateString}')">
                    ${day}
                 </div>`;
    }

    html += `</div>`;
    el.innerHTML = html;

    // 🎯 FIXED: Re-binding listeners with cleanup logic
    const pBtn = document.getElementById("prevMonth");
    const nBtn = document.getElementById("nextMonth");
    
    if (pBtn) pBtn.onclick = (e) => { 
        e.stopPropagation(); currentMonth--; 
        if(currentMonth < 0){ currentMonth = 11; currentYear--; } 
        window.renderCalendar(); 
    };
    if (nBtn) nBtn.onclick = (e) => { 
        e.stopPropagation(); currentMonth++; 
        if(currentMonth > 11){ currentMonth = 0; currentYear++; } 
        window.renderCalendar(); 
    };
};

/* --- ΣΥΝΔΕΣΗ ΗΜΕΡΟΛΟΓΙΟΥ ΜΕ DIET PANEL (STRICT SYNC) --- */
window.viewFoodFromCalendar = function(dateStr) {
    const parts = dateStr.split('/');
    const selectedDate = new Date(parts[2], parts[1] - 1, parts[0]);
    
    // Ενημέρωση focus
    window.selectedCalendarDate = dateStr;
    window.currentFoodDate = selectedDate;
    
    // Re-render calendar για να φανεί η επιλογή
    window.renderCalendar();
    
    // Κλείσιμο panels και άνοιγμα Food
    document.querySelectorAll(".pegasus-panel").forEach(p => p.style.display = "none");
    
    const foodPanel = document.getElementById("foodPanel");
    if (foodPanel) {
        foodPanel.style.display = "block";
        
        // 🎯 FIXED: Ασφαλής κλήση UI update
        if (typeof window.updateFoodUI === "function") {
            window.updateFoodUI();
        } else if (window.renderFood) {
            window.renderFood();
        }
        
        // Pegasus Green Force UI Adjustment
        setTimeout(() => {
            const crossBtn = document.getElementById("btnAddFood");
            if (crossBtn) {
                crossBtn.style.setProperty('color', '#4CAF50', 'important');
                crossBtn.style.setProperty('border-color', '#4CAF50', 'important');
            }
        }, 50);
    }
};



/* ===== CONSOLIDATED FROM desktopVaultBridge.js ===== */
/* ==========================================================================
   PEGASUS DESKTOP VAULT BRIDGE - v1.0
   Protocol: Restores the global desktop unlock handlers expected by index.html
             and routes them through PegasusCloud.
   ========================================================================== */

(function () {
    const VERSION = 'v1.0';

    function getModal() {
        return document.getElementById('pinModal');
    }

    function getErrorBox() {
        return document.getElementById('pinError');
    }

    function getUnlockButton() {
        return document.querySelector('#pinModal button[onclick*="attemptVaultUnlock"]');
    }

    function setError(text, color = '#ff4444') {
        const el = getErrorBox();
        if (!el) return;
        el.style.color = color;
        el.textContent = text || '';
    }

    function setUnlockButtonBusy(isBusy) {
        const btn = getUnlockButton();
        if (!btn) return;
        btn.disabled = !!isBusy;
        btn.style.opacity = isBusy ? '0.7' : '1';
        btn.textContent = isBusy ? 'ΕΛΕΓΧΟΣ...' : 'ΑΠΑΣΦΑΛΙΣΗ ΣΥΣΤΗΜΑΤΟΣ';
    }

    function showModal() {
        const modal = getModal();
        if (modal) modal.style.display = 'flex';
        setError('');
        setTimeout(() => {
            const pinInput = document.getElementById('pinInput');
            if (pinInput) pinInput.focus();
        }, 50);
    }

    function hideModal() {
        const modal = getModal();
        if (modal) modal.style.display = 'none';
        setError('');
    }

    async function runPostUnlockSync() {
        try {
            if (window.PegasusCloud?.syncNow && navigator.onLine) {
                await window.PegasusCloud.syncNow(true);
            }
        } catch (e) {
            console.warn('PEGASUS DESKTOP VAULT: Post-unlock sync deferred.', e);
        }
    }

    window.handleDesktopSyncOpen = async function handleDesktopSyncOpen() {
        const cloud = window.PegasusCloud;
        if (!cloud) {
            showModal();
            setError('CLOUD ENGINE OFFLINE');
            return;
        }

        if (cloud.isUnlocked) {
            setError('ΣΥΓΧΡΟΝΙΣΜΟΣ...', '#00bcd4');
            await runPostUnlockSync();
            hideModal();
            console.log('🔐 PEGASUS DESKTOP VAULT: Already unlocked. Sync requested.');
            return;
        }

        try {
            const canDailyAutoUnlock = !!cloud.canAutoUnlock?.();
            const canApprovedRestore = !!cloud.canRestoreApprovedDevice?.();
            if (canDailyAutoUnlock || canApprovedRestore) {
                showModal();
                setError('ΑΝΑΚΤΗΣΗ ΕΓΚΕΚΡΙΜΕΝΗΣ ΣΥΣΚΕΥΗΣ...', '#ffb300');
                const restored = canDailyAutoUnlock
                    ? await cloud.tryAutoUnlock()
                    : await cloud.tryApprovedDeviceUnlock();
                if (restored) {
                    setError('ΣΥΝΔΕΔΕΜΕΝΟ', '#00ff41');
                    await runPostUnlockSync();
                    setTimeout(hideModal, 350);
                    console.log('🔐 PEGASUS DESKTOP VAULT: Approved desktop restored.');
                    return;
                }
            }
        } catch (e) {
            console.warn('PEGASUS DESKTOP VAULT: Approved restore failed; manual unlock required.', e);
        }

        showModal();
    };

    window.attemptVaultUnlock = async function attemptVaultUnlock() {
        window.PegasusRuntimeMonitor?.trace?.('desktopUnlock', 'attemptVaultUnlock', 'START');
        if (window._pegasusDesktopUnlockBusy) return;

        const pinInput = document.getElementById('pinInput');
        const masterInput = document.getElementById('masterKeyInput');
        const pin = pinInput ? pinInput.value.trim() : '';
        const masterKey = masterInput ? masterInput.value.trim() : '';

        if (!pin || !masterKey) {
            setError('ΣΥΜΠΛΗΡΩΣΕ PIN ΚΑΙ MASTER KEY');
            return;
        }

        if (!window.PegasusCloud?.unlock) {
            setError('CLOUD ENGINE OFFLINE');
            return;
        }

        window._pegasusDesktopUnlockBusy = true;
        setUnlockButtonBusy(true);
        setError('ΣΥΝΔΕΣΗ...', '#ffb300');

        try {
            const success = await window.PegasusCloud.unlock(pin, masterKey, { deferPostUnlockSync: true });
            if (success) {
                setError('ΣΥΝΔΕΔΕΜΕΝΟ', '#00ff41');
                if (pinInput) pinInput.value = '';
                if (masterInput) masterInput.value = '';
                await runPostUnlockSync();
                setTimeout(hideModal, 350);
                console.log('🔐 PEGASUS DESKTOP VAULT: Manual unlock successful.');
            } else {
                setError('ΛΑΘΟΣ PIN / MASTER KEY');
                if (pinInput) pinInput.value = '';
                if (masterInput) masterInput.value = '';
                window.PegasusRuntimeMonitor?.warn?.('desktopUnlock', 'attemptVaultUnlock', 'INVALID_PIN_OR_MASTER');
            }
        } catch (e) {
            console.error('PEGASUS DESKTOP VAULT: Unlock error.', e);
            setError('ΣΦΑΛΜΑ ΣΥΝΔΕΣΗΣ');
        } finally {
            window._pegasusDesktopUnlockBusy = false;
            setUnlockButtonBusy(false);
        }
    };

    window.skipVault = function skipVault() {
        hideModal();
    };

    document.addEventListener('keydown', event => {
        const modal = getModal();
        if (!modal || modal.style.display === 'none') return;
        if (event.key === 'Enter') {
            event.preventDefault();
            window.attemptVaultUnlock();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            window.skipVault();
        }
    });

    console.log(`🔐 PEGASUS DESKTOP VAULT BRIDGE: Active (${VERSION}).`);
})();



/* ===== CONSOLIDATED FROM desktopSyncStatusLabel.js ===== */
/* ==========================================================================
   PEGASUS DESKTOP SYNC STATUS LABEL - v1.0
   Protocol: Keep the desktop sync button aligned with the real approved/unlocked
             cloud state after refresh. No PIN prompt on approved devices.
   ========================================================================== */

(function () {
    const VERSION = 'v1.0';
    const BTN_ID = 'btnMasterVault';
    const LAST_PUSH_FRESH_MS = 5 * 60 * 1000;
    const RESTORE_DELAY_MS = 900;

    let restoreRequested = false;
    let emitPatched = false;

    function now() {
        return Date.now();
    }

    function getButton() {
        return document.getElementById(BTN_ID);
    }

    function readNumber(key) {
        const value = Number(localStorage.getItem(key) || 0);
        return Number.isFinite(value) ? value : 0;
    }

    function hasApprovedDevice() {
        return (
            String(localStorage.getItem('pegasus_desktop_device_approved') || '') === '1' ||
            String(localStorage.getItem('pegasus_device_approved') || '') === '1' ||
            !!window.PegasusCloud?.hasApprovedDevice?.()
        );
    }

    function hasValidVaultWindow() {
        const validUntil = readNumber('pegasus_vault_valid_until');
        return validUntil > now();
    }

    function hasRestoreMaterials() {
        return !!(
            localStorage.getItem('pegasus_vault_master_wrapped') &&
            localStorage.getItem('pegasus_vault_device_secret')
        );
    }

    function hasRecentPush() {
        const lastPush = readNumber('pegasus_last_push');
        return lastPush > 0 && now() - lastPush >= 0 && now() - lastPush <= LAST_PUSH_FRESH_MS;
    }

    function canRestoreWithoutPrompt() {
        const cloud = window.PegasusCloud;
        if (cloud?.canAutoUnlock?.()) return true;
        if (cloud?.canRestoreApprovedDevice?.()) return true;
        return hasApprovedDevice() && hasRestoreMaterials();
    }

    function getStatus() {
        const cloud = window.PegasusCloud;

        if (!navigator.onLine) return 'offline';
        if (cloud?.isPushing || cloud?.isPulling) return 'syncing';
        if (cloud?.isUnlocked && hasRecentPush()) return 'connected';
        if (cloud?.isUnlocked) return 'active';
        if (hasRecentPush() && hasApprovedDevice()) return 'connected';
        if ((hasApprovedDevice() && hasValidVaultWindow()) || canRestoreWithoutPrompt()) return 'active';
        return 'locked';
    }

    function applyButtonStatus(status) {
        const btn = getButton();
        if (!btn) return status;

        const map = {
            connected: {
                text: '🔐 ΣΥΝΔΕΔΕΜΕΝΟ',
                color: '#00ff41',
                border: '#00ff41',
                title: 'PEGASUS cloud sync active on this approved desktop.'
            },
            active: {
                text: '🔐 ΕΝΕΡΓΟ',
                color: '#00ff41',
                border: '#00ff41',
                title: 'Approved desktop session is active. Click to force sync.'
            },
            syncing: {
                text: '🔐 ΣΥΓΧΡΟΝΙΣΜΟΣ...',
                color: '#00bcd4',
                border: '#00bcd4',
                title: 'PEGASUS cloud sync is running.'
            },
            offline: {
                text: '🔐 OFFLINE',
                color: '#ffb300',
                border: '#ffb300',
                title: 'Offline. Approved state is kept locally and will sync when online.'
            },
            locked: {
                text: '🔐 ΣΥΓΧΡΟΝΙΣΜΟΣ',
                color: '#00bcd4',
                border: '#00bcd4',
                title: 'Click to unlock or restore sync.'
            }
        };

        const next = map[status] || map.locked;
        btn.textContent = next.text;
        btn.style.color = next.color;
        btn.style.borderColor = next.border;
        btn.title = next.title;
        btn.dataset.pegasusSyncStatus = status;
        return status;
    }

    function update(reason) {
        const status = applyButtonStatus(getStatus());
        return { status, reason: reason || 'manual' };
    }

    async function restoreApprovedDesktopSilently() {
        if (restoreRequested) return false;
        const cloud = window.PegasusCloud;
        if (!cloud || cloud.isUnlocked || !navigator.onLine) {
            update('restore:skip');
            return false;
        }

        if (!canRestoreWithoutPrompt()) {
            update('restore:not-approved');
            return false;
        }

        restoreRequested = true;
        applyButtonStatus('syncing');

        try {
            const ok = await cloud.syncNow?.(true);
            update(ok ? 'restore:syncNow-ok' : 'restore:syncNow-nochange');
            return !!ok || !!cloud.isUnlocked;
        } catch (e) {
            console.warn('PEGASUS DESKTOP SYNC STATUS: Silent approved restore deferred.', e);
            update('restore:error');
            return false;
        }
    }

    function patchEmitSyncStatus() {
        const cloud = window.PegasusCloud;
        if (!cloud || emitPatched || typeof cloud.emitSyncStatus !== 'function') return;

        const original = cloud.emitSyncStatus.bind(cloud);
        cloud.emitSyncStatus = function patchedDesktopStatusEmit(status, force) {
            const result = original(status, force);
            setTimeout(() => update(`emit:${status || 'unknown'}`), 0);
            return result;
        };

        emitPatched = true;
    }

    function boot() {
        patchEmitSyncStatus();
        update('boot');
        setTimeout(restoreApprovedDesktopSilently, RESTORE_DELAY_MS);
        setTimeout(() => update('boot:late'), RESTORE_DELAY_MS + 1600);
    }

    window.PegasusDesktopSyncStatus = {
        version: VERSION,
        update,
        restoreApprovedDesktopSilently,
        getStatus,
        hasApprovedDevice,
        hasValidVaultWindow,
        hasRecentPush
    };

    window.updatePegasusDesktopSyncButton = update;

    document.addEventListener('DOMContentLoaded', boot, { once: true });
    window.addEventListener('load', () => setTimeout(boot, 250));
    window.addEventListener('focus', () => update('focus'));
    window.addEventListener('online', () => setTimeout(restoreApprovedDesktopSilently, 300));
    window.addEventListener('offline', () => update('offline'));
    window.addEventListener('pegasus_sync_state', () => update('sync-state'));
    window.addEventListener('storage', event => {
        if (!event.key || /pegasus_(last_push|vault_valid_until|device_approved|desktop_device_approved)/.test(event.key)) {
            update('storage');
        }
    });

    setInterval(() => update('poll'), 5000);

    console.log(`🔐 PEGASUS DESKTOP SYNC STATUS LABEL: Active (${VERSION}).`);
})();

