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
