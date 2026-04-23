/* ==========================================================================
   PEGASUS PROGRAM GUIDE / HOW TO PANEL
   Informational in-app guide for usage, file responsibilities and system map.
   ========================================================================== */

(function () {
    const PANEL_ID = 'programGuidePanel';
    const BTN_ID = 'btnProgramGuide';
    const SEARCH_ID = 'pegasusGuideSearch';
    const CONTENT_ID = 'pegasusGuideContent';

    const QUICK_START = [
        'Επίλεξε ημέρα από το navbar για να δεις το πρόγραμμα της ημέρας.',
        'Πάτησε ΕΝΑΡΞΗ για να αρχίσει ο κύκλος προπόνησης, ΠΑΥΣΗ για προσωρινή διακοπή και ΕΠΟΜΕΝΟ για να προχωρήσεις φάση ή άσκηση.',
        'Το PREVIEW δείχνει συνοπτικά την ημέρα και τις ασκήσεις, ενώ το click στο exercise info ανοίγει πιο αναλυτική προεπισκόπηση.',
        'Στα Ρυθμίσεις αλλάζεις κιλά, timers και βασικές τιμές προφίλ. Στα Εργαλεία έχεις πλάνο, ήχο, turbo, backup, import/export, gallery, EMS και συγχρονισμό.',
        'Ο συγχρονισμός γίνεται από το κουμπί ΣΥΓΧΡΟΝΙΣΜΟΣ και προστατεύεται από cloud guards, cross-tab hardening και diagnostics.'
    ];

    const MAIN_AREAS = [
        { name: 'Navbar / Ημέρες', role: 'Αλλάζει την ενεργή ημέρα και ξαναζωγραφίζει το πρόγραμμα της ημέρας.' },
        { name: 'Workout Engine', role: 'Τρέχει phases, exercise index, timers, progress και state της προπόνησης.' },
        { name: 'Preview Panel', role: 'Δείχνει γρήγορα την ημέρα, τις ασκήσεις και βοηθά στο visual check πριν την έναρξη.' },
        { name: 'Food Panel', role: 'Καταγραφή φαγητού, θερμίδων και πρωτεΐνης για την ημέρα.' },
        { name: 'Tools Panel', role: 'Κεντρικό πάνελ βοηθητικών εργαλείων, backup, import/export, sync, EMS, gallery και diagnostics.' },
        { name: 'Calendar', role: 'Ιστορικό, ημερολόγιο και καθημερινή παρακολούθηση προπονήσεων και προόδου.' },
        { name: 'Gallery', role: 'Ανεβάζει και οργανώνει φωτογραφίες προόδου.' },
        { name: 'Sync / Master Vault', role: 'Cloud sync, approved device restore, προστασία PIN και ασφαλές push/pull.' }
    ];

    const PROGRAM_MODES = [
        { code: 'IRON', role: 'Το βασικό split βαρών με έμφαση στον κορμό/κοιλιακούς και ισορροπημένο upper body.' },
        { code: 'EMS_ONLY', role: 'Συνδυασμός βαρών με σταθερό EMS block στη μέση της εβδομάδας.' },
        { code: 'BIKE_ONLY', role: 'Δίνει χώρο για ποδήλατο στο Σαββατοκύριακο και κρατά τα πόδια χαμηλότερα.' },
        { code: 'HYBRID', role: 'Μίξη βαρών, EMS και cycling με χαμηλότερο leg fatigue και καλή κατανομή μέσα στην εβδομάδα.' }
    ];

    const DEBUG_COMMANDS = [
        {
            title: 'Γενικός έλεγχος build',
            desc: 'Γρήγορος τεχνικός έλεγχος για modules, storage, sync diagnostics και συνολική υγεία του build.',
            code: 'window.PegasusSelfCheck.run()\nwindow.PegasusSelfCheck.summary()\nwindow.PegasusSelfCheck.explain()'
        },
        {
            title: 'Runtime traces / τελευταία προβλήματα',
            desc: 'Δείχνει το τελευταίο πρόβλημα, το πιο πρόσφατο trace και ολόκληρο το trace history για debugging.',
            code: 'window.PegasusRuntimeMonitor.getLatestProblem()\nwindow.PegasusRuntimeMonitor.getLatestTrace()\nwindow.PegasusRuntimeMonitor.getTrace()'
        },
        {
            title: 'Sync diagnostics snapshot',
            desc: 'Πλήρης εικόνα για sync phase, lease owner, cloud state και classification του current tab.',
            code: 'window.PegasusSyncDiagnostics.summary()\nwindow.PegasusSyncDiagnostics.classifyCurrent()\nwindow.PegasusSyncDiagnostics.leaseView()\nwindow.PegasusSyncDiagnostics.recent(12)'
        },
        {
            title: 'Storage audit / repair',
            desc: 'Έλεγχος και επισκευή malformed localStorage values με ασφαλή defaults.',
            code: 'window.PegasusStorageHardening.summary()\nwindow.PegasusStorageHardening.audit()\nwindow.PegasusStorageHardening.getRecentRepairs(20)'
        },
        {
            title: 'Force sync test',
            desc: 'Πιέζει το sync layer για γρήγορο functional test μετά από αλλαγές ή σε δεύτερο tab.',
            code: 'window.PegasusCloud.push(true)\nwindow.PegasusCloud.syncNow(true)\nwindow.PegasusSyncDiagnostics.summary()'
        },
        {
            title: 'UI / workout state snapshot',
            desc: 'Γρήγορη εικόνα για selected day, controls, progress και τρέχουσα φάση της προπόνησης.',
            code: 'window.PegasusDebug.summary()\nwindow.PegasusDebug.controls()\nwindow.PegasusDebug.uiState()'
        }
    ];

    const FILE_MAP = {
        'index.html': { category: 'Boot / Shell', role: 'Το βασικό HTML shell του desktop UI. Περιέχει τα panels, τα βασικά κουμπιά και το script order.' },
        'style.css': { category: 'Boot / Shell', role: 'Κοινό styling για panels, buttons, layout και γενική οπτική του PEGASUS.' },
        'manifest.js': { category: 'Core Foundation', role: 'Ο master manifest του προγράμματος: metadata, canonical keys, system constants και source of truth για storage/cloud naming.' },
        'storageHardening.js': { category: 'Hardening', role: 'Ελέγχει localStorage/session assumptions, επισκευάζει malformed keys και βάζει ασφαλή defaults πριν φορτώσουν τα υπόλοιπα modules.' },
        'dialogs.js': { category: 'Core Foundation', role: 'Κοινά dialogs, alerts και helper modals που χρησιμοποιούνται από το app.' },
        'i18n.js': { category: 'Core Foundation', role: 'Διαχειρίζεται ελληνικά/αγγλικά labels και μεταφράσεις στο UI.' },
        'data.js': { category: 'Training Data', role: 'Περιέχει τα προγράμματα, τις ημέρες, τις ασκήσεις και τη δομή των splits όπως IRON, EMS_ONLY, BIKE_ONLY, HYBRID.' },
        'settings.js': { category: 'Core Foundation', role: 'Φορτώνει, αποθηκεύει και εφαρμόζει ρυθμίσεις χρήστη και desktop επιλογές.' },
        'optimizer.js': { category: 'Training Logic', role: 'Reset λογικής εβδομάδας, optimization helpers και αυτοματισμοί κύκλου.' },
        'dynamic.js': { category: 'UI Runtime', role: 'Δυναμικές UI ενημερώσεις, lightweight refreshes και responsive runtime adjustments.' },
        'progressUI.js': { category: 'UI Runtime', role: 'Μπάρες προόδου, indicators και οπτική παρακολούθηση της κατάστασης της προπόνησης.' },
        'weather.js': { category: 'Environment', role: 'Φέρνει και εφαρμόζει weather-based προσαρμογές, ειδικά για indoor/outdoor λογική.' },
        'pegasusCore.js': { category: 'Core Engine', role: 'Ο βασικός engine της προπόνησης: state, progress, phase logic, persistable runtime snapshots και πυρήνας workout flow.' },
        'cloudSync.js': { category: 'Cloud Sync', role: 'Ο cloud κινητήρας για push, pull, unlock, approved device restore, secure sync και conflict-aware συγχρονισμό.' },
        'protcrea.js': { category: 'Inventory', role: 'Παρακολουθεί αποθέματα πρωτεΐνης/κρεατίνης και ενημερώνει labels/stock.' },
        'food.js': { category: 'Nutrition', role: 'Το panel καταγραφής φαγητού, θερμίδων και πρωτεΐνης της ημέρας.' },
        'dietAdvisor.js': { category: 'Nutrition', role: 'Ο diet advisor που προτείνει/παρουσιάζει διαιτητικές συμβουλές στο app.' },
        'extensions.js': { category: 'Training Logic', role: 'Επεκτάσεις workout logic, daily routine helpers και side systems που συμπληρώνουν τον πυρήνα.' },
        'ems.js': { category: 'Feature Module', role: 'Το EMS panel και η καταγραφή EMS συνεδριών με τις σχετικές ενέργειες.' },
        'cardio.js': { category: 'Feature Module', role: 'Cardio panel, cardio kcal logging και σύνδεση καρδιο με το ημερήσιο target.' },
        'gallery.js': { category: 'Feature Module', role: 'Gallery engine για αποθήκευση και απεικόνιση φωτογραφιών προόδου.' },
        'partner.js': { category: 'Feature Module', role: 'Σύστημα συνεργάτη/partner mode και σχετική λογική panel/tools.' },
        'achievements.js': { category: 'Feature Module', role: 'Leveling, achievements και reward/progress layer.' },
        'dragDrop.js': { category: 'UI Runtime', role: 'Draggable panels, panel toggles, click-outside behavior και hotkeys του desktop UI.' },
        'reporting.js': { category: 'Reporting', role: 'Morning report / manual report sending και reporting windows του συστήματος.' },
        'metabolicEngine.js': { category: 'Nutrition', role: 'Υπολογισμοί metabolism/targets και σταθεροποίηση related inputs.' },
        'weightTracker.js': { category: 'Tracking', role: 'Weight tracking module, sync-friendly καταγραφή βάρους και προβολή ιστορικού.' },
        'desktopPanels.js': { category: 'App Coordination', role: 'Shared mutable state για το thin shell και τα runtime coordinator pieces.' },
        'desktopPanels.js': { category: 'Desktop UI', role: 'Desktop panel helpers, ανοίγματα/κλεισίματα και panel-side wiring.' },
        'desktopActions.js': { category: 'Desktop UI', role: 'Desktop button actions και flows που συνδέουν UI με engine behaviors.' },
        'desktopRender.js': { category: 'Desktop UI', role: 'Desktop rendering του κύριου interface, labels, exercise list και visual refreshes.' },
        'desktopBoot.js': { category: 'Desktop Boot', role: 'Το βασικό desktop boot sequence: navbar, initial render, daily load και onload coordination.' },
        'workoutTracking.js': { category: 'Tracking', role: 'Καταγράφει sets/workouts, total workout count και related training metrics.' },
        'app.js': { category: 'App Coordination', role: 'Thin coordinator shell που δένει τα submodules χωρίς να κρατά το παλιό monolith logic.' },
        'calorieRuntime.js': { category: 'Nutrition', role: 'Ημερήσιο kcal/protein runtime, labels, targets και calorie UI ενημερώσεις.' },
        'audioRuntime.js': { category: 'UI Runtime', role: 'Audio unlock, beeps και mute-aware ηχητικό runtime.' },
        'runtimeBridge.js': { category: 'App Coordination', role: 'Bridge ανάμεσα σε legacy runtime/UI και στο νέο engine state. Κρατά snapshots και control state sync.' },
        'weightState.js': { category: 'Tracking', role: 'State για αποθηκευμένα exercise weights και related helpers.' },
        'diagnosticsRuntime.js': { category: 'Diagnostics', role: 'Runtime logger, warning/error routing και debug-oriented console integration.' },
        'selfCheckRunner.js': { category: 'Diagnostics', role: 'Regression/self-check runner που κάνει γρήγορο PASS/WARN health check του build.' },
        'moduleIntegrity.js': { category: 'Diagnostics', role: 'Επιβεβαιώνει ότι κρίσιμα globals και modules έχουν φορτώσει σωστά.' },
        'debug.js': { category: 'Diagnostics', role: 'Debug helpers, manual summaries, controls/uiState outputs και extra console utilities.' },
        'auditUI.js': { category: 'Diagnostics', role: 'Το SYSTEM STABLE / audit κουμπί και η λογική ελέγχου σταθερότητας του build.' },
        'desktopSyncController.js': { category: 'Cloud Sync', role: 'Desktop-specific sync orchestration και glue γύρω από cloud entry points.' },
        'pegasusRuntimeMonitor.js': { category: 'Diagnostics', role: 'Κρατά runtime traces, latest problems, latest trace και συνολικά forensic στοιχεία.' },
        'sw.js': { category: 'PWA', role: 'Service worker για ασφαλή caching/PWA λειτουργία.' }
    };

    function getLoadedScriptNames() {
        const seen = new Set();
        return Array.from(document.querySelectorAll('script[src]'))
            .map(s => (s.getAttribute('src') || '').split('/').pop())
            .filter(Boolean)
            .filter(name => {
                if (seen.has(name)) return false;
                seen.add(name);
                return true;
            });
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function buildFileCards() {
        const loadedScripts = getLoadedScriptNames();
        return loadedScripts.map(file => {
            const info = FILE_MAP[file] || {
                category: 'Support Module',
                role: 'Υποστηρικτικό module του current build. Δεν έχει ακόμη ειδική περιγραφή στον οδηγό.'
            };
            const isExternal = /^https?:/i.test(file) || file.includes('emailjs');
            const category = isExternal ? 'External Dependency' : info.category;
            const role = isExternal ? 'Εξωτερική βιβλιοθήκη που χρησιμοποιείται από το PEGASUS build.' : info.role;
            return `
                <div class="pegasus-guide-card" data-guide-search="${escapeHtml((file + ' ' + category + ' ' + role).toLowerCase())}" style="background:#111; border:1px solid #2c2c2c; border-radius:10px; padding:12px; margin-bottom:10px; text-align:center;">
                    <div style="display:flex; justify-content:center; gap:12px; align-items:flex-start; flex-wrap:wrap;">
                        <div style="font-weight:900; color:#4CAF50; font-size:13px;">${escapeHtml(file)}</div>
                        <div style="font-size:10px; color:#9ad29d; letter-spacing:0.8px;">${escapeHtml(category)}</div>
                    </div>
                    <div style="margin-top:6px; color:#ddd; font-size:12px; line-height:1.5;">${escapeHtml(role)}</div>
                </div>
            `;
        }).join('');
    }

    function buildGuideHtml() {
        const manifestMeta = window.PegasusManifest?.metadata || {};
        const buildInfo = [manifestMeta.os, manifestMeta.engine_version, manifestMeta.last_update].filter(Boolean).join(' • ');
        return `
            <div style="display:flex; flex-direction:column; gap:14px;">
                <div style="background:#0f0f0f; border:1px solid #333; border-radius:12px; padding:14px; text-align:center;">
                    <div style="display:flex; justify-content:center; gap:10px; align-items:flex-start; flex-wrap:wrap;">
                        <div>
                            <div style="color:#4CAF50; font-size:18px; font-weight:900; letter-spacing:1px;">PEGASUS HOW TO / SYSTEM MAP</div>
                            <div style="color:#bbb; font-size:11px; margin-top:4px;">Ο οδηγός αυτός είναι μόνο ενημερωτικός. Δεν αλλάζει δεδομένα και εξηγεί τι κάνει κάθε βασικό κομμάτι του συστήματος.</div>
                        </div>
                        <div style="font-size:10px; color:#8a8a8a; text-align:center;">${escapeHtml(buildInfo || 'PEGASUS build')}</div>
                    </div>
                </div>

                <div style="background:#101010; border:1px solid #2d2d2d; border-radius:12px; padding:14px; text-align:center;">
                    <div style="color:#4CAF50; font-weight:900; margin-bottom:10px; font-size:14px;">ΠΩΣ ΧΡΗΣΙΜΟΠΟΙΕΙΣ ΤΟ PEGASUS</div>
                    <ol style="margin:0; padding-left:0; color:#ddd; font-size:12px; line-height:1.7; text-align:center; list-style-position:inside;">
                        ${QUICK_START.map(step => `<li style="margin-bottom:6px;">${escapeHtml(step)}</li>`).join('')}
                    </ol>
                </div>

                <div style="background:#101010; border:1px solid #2d2d2d; border-radius:12px; padding:14px; text-align:center;">
                    <div style="color:#4CAF50; font-weight:900; margin-bottom:10px; font-size:14px;">ΒΑΣΙΚΑ ΣΗΜΕΙΑ ΤΟΥ ΠΡΟΓΡΑΜΜΑΤΟΣ</div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:10px;">
                        ${MAIN_AREAS.map(area => `
                            <div class="pegasus-guide-card" data-guide-search="${escapeHtml((area.name + ' ' + area.role).toLowerCase())}" style="background:#111; border:1px solid #2c2c2c; border-radius:10px; padding:12px;">
                                <div style="color:#4CAF50; font-size:13px; font-weight:900; margin-bottom:6px;">${escapeHtml(area.name)}</div>
                                <div style="color:#ddd; font-size:12px; line-height:1.5;">${escapeHtml(area.role)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div style="background:#101010; border:1px solid #2d2d2d; border-radius:12px; padding:14px; text-align:center;">
                    <div style="color:#4CAF50; font-weight:900; margin-bottom:10px; font-size:14px;">ΤΥΠΟΙ ΠΡΟΓΡΑΜΜΑΤΩΝ</div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); gap:10px;">
                        ${PROGRAM_MODES.map(mode => `
                            <div class="pegasus-guide-card" data-guide-search="${escapeHtml((mode.code + ' ' + mode.role).toLowerCase())}" style="background:#111; border:1px solid #2c2c2c; border-radius:10px; padding:12px;">
                                <div style="color:#4CAF50; font-size:13px; font-weight:900; margin-bottom:6px;">${escapeHtml(mode.code)}</div>
                                <div style="color:#ddd; font-size:12px; line-height:1.5;">${escapeHtml(mode.role)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div style="background:#101010; border:1px solid #2d2d2d; border-radius:12px; padding:14px; text-align:center;">
                    <div style="color:#4CAF50; font-weight:900; margin-bottom:10px; font-size:14px;">DEBUG / TESTING COMMANDS</div>
                    <div style="color:#aaa; font-size:11px; margin-bottom:10px;">Έτοιμες console εντολές για health checks, sync tests, diagnostics και forensic debugging μετά από αλλαγές.</div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:10px;">
                        ${DEBUG_COMMANDS.map(item => `
                            <div class="pegasus-guide-card" data-guide-search="${escapeHtml((item.title + ' ' + item.desc + ' ' + item.code).toLowerCase())}" style="background:#111; border:1px solid #2c2c2c; border-radius:10px; padding:12px;">
                                <div style="color:#4CAF50; font-size:13px; font-weight:900; margin-bottom:6px;">${escapeHtml(item.title)}</div>
                                <div style="color:#ddd; font-size:12px; line-height:1.5; margin-bottom:8px;">${escapeHtml(item.desc)}</div>
                                <pre style="margin:0; background:#0a0a0a; border:1px solid #2b2b2b; border-radius:8px; padding:10px; color:#9fe8a9; font-size:11px; line-height:1.5; white-space:pre-wrap; word-break:break-word;">${escapeHtml(item.code)}</pre>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div style="background:#101010; border:1px solid #2d2d2d; border-radius:12px; padding:14px; text-align:center;">
                    <div style="display:flex; justify-content:center; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:10px; text-align:center;">
                        <div style="color:#4CAF50; font-weight:900; font-size:14px;">ΑΡΧΕΙΟ -> ΔΟΥΛΕΙΑ ΠΟΥ ΚΑΝΕΙ</div>
                        <input id="${SEARCH_ID}" type="text" placeholder="Ψάξε αρχείο, λειτουργία ή debug command..." style="min-width:220px; flex:1; max-width:320px; background:#0a0a0a; color:#4CAF50; border:1px solid #4CAF50; border-radius:8px; padding:8px 10px; text-align:center;">
                    </div>
                    <div style="color:#aaa; font-size:11px; margin-bottom:10px;">Ο παρακάτω κατάλογος εξηγεί τι κάνει κάθε βασικό script που φορτώνεται στο current build.</div>
                    <div id="${CONTENT_ID}" style="max-height:420px; overflow-y:auto; padding-right:4px;">${buildFileCards()}</div>
                </div>
            </div>
        `;
    }

    function wireSearch() {
        const input = document.getElementById(SEARCH_ID);
        const content = document.getElementById(CONTENT_ID);
        if (!input || !content || input.dataset.bound === '1') return;
        input.dataset.bound = '1';
        input.addEventListener('input', () => {
            const term = (input.value || '').trim().toLowerCase();
            content.querySelectorAll('.pegasus-guide-card').forEach(card => {
                const hay = (card.getAttribute('data-guide-search') || '').toLowerCase();
                card.style.display = !term || hay.includes(term) ? '' : 'none';
            });
        });
    }

    function ensurePanel() {
        let panel = document.getElementById(PANEL_ID);
        if (panel) return panel;

        panel = document.createElement('div');
        panel.id = PANEL_ID;
        panel.className = 'pegasus-panel';
        panel.style.cssText = 'display:none; width:min(860px,92vw); height:min(780px,88vh); z-index:1002; overflow:hidden;';
        panel.innerHTML = `
            <div style="display:flex; justify-content:center; align-items:center; gap:10px; margin-bottom:10px;">
                <h3 style="text-align:center; margin:0 auto; width:100%;">📘 ΟΔΗΓΟΣ PEGASUS</h3>
            </div>
            <div id="pegasusProgramGuideRoot" style="height:calc(100% - 42px); overflow-y:auto; padding-right:6px;"></div>
        `;
        document.body.appendChild(panel);

        if (window.PegasusUI?.panels && !window.PegasusUI.panels.includes(PANEL_ID)) {
            window.PegasusUI.panels.push(PANEL_ID);
        }

        try {
            window.PegasusUI?.initDraggablePanels?.();
        } catch (_) {}

        return panel;
    }

    function render() {
        const panel = ensurePanel();
        const root = panel.querySelector('#pegasusProgramGuideRoot');
        if (!root) return;
        root.innerHTML = buildGuideHtml();
        wireSearch();
    }

    function close() {
        const panel = document.getElementById(PANEL_ID);
        if (!panel) return;
        panel.style.display = 'none';
    }

    function handleOutsideClose(event) {
        const panel = document.getElementById(PANEL_ID);
        const btn = document.getElementById(BTN_ID);
        if (!panel || panel.style.display === 'none') return;
        const target = event.target;
        if (panel.contains(target)) return;
        if (btn && btn.contains(target)) return;
        close();
    }

    function open() {
        render();
        document.querySelectorAll('.pegasus-panel, #emsModal').forEach(p => {
            if (p && p.id !== PANEL_ID) p.style.display = 'none';
        });
        const panel = ensurePanel();
        panel.style.display = 'block';
        panel.style.zIndex = '2001';
    }

    function ensureButton() {
        if (document.getElementById(BTN_ID)) return;
        const anchor = document.getElementById('btnSystemAudit');
        if (!anchor || !anchor.parentNode) return;

        const btn = document.createElement('button');
        btn.id = BTN_ID;
        btn.className = 'p-btn tools-btn';
        btn.textContent = '📘 ΟΔΗΓΟΣ / HOW TO PEGASUS';
        btn.style.cssText = 'border-color:#00bcd4; color:#00bcd4; margin-top:8px; font-weight:900;';
        btn.onclick = (e) => {
            e.stopPropagation();
            open();
        };

        anchor.insertAdjacentElement('afterend', btn);
    }

    function install() {
        ensurePanel();
        ensureButton();
        if (!document.body.dataset.pegasusGuideOutsideCloseBound) {
            document.body.dataset.pegasusGuideOutsideCloseBound = '1';
            document.addEventListener('mousedown', handleOutsideClose, true);
            document.addEventListener('touchstart', handleOutsideClose, true);
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') close();
            });
        }
        if (window.PegasusRuntimeMonitor?.trace) {
            window.PegasusRuntimeMonitor.trace('programGuide.js', 'install', 'Program guide installed', { buttonId: BTN_ID, panelId: PANEL_ID });
        }
    }

    window.PegasusProgramGuide = {
        open,
        close,
        render,
        rebuild: render,
        installed: () => ({
            button: !!document.getElementById(BTN_ID),
            panel: !!document.getElementById(PANEL_ID)
        }),
        sections: () => ({
            quickStart: QUICK_START.length,
            mainAreas: MAIN_AREAS.length,
            programModes: PROGRAM_MODES.length,
            debugCommands: DEBUG_COMMANDS.length,
            fileEntries: getLoadedScriptNames().length
        })
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', install);
    } else {
        install();
    }

    window.addEventListener('load', () => setTimeout(install, 250));
})();
