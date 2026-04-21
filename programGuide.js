/* ==========================================================================
   PEGASUS PROGRAM GUIDE / HOW TO PANEL
   Informational in-app guide for usage, file responsibilities and system map.
   ========================================================================== */

(function () {
    const PANEL_ID = 'programGuidePanel';
    const BTN_ID = 'btnProgramGuide';
    const SEARCH_ID = 'pegasusGuideSearch';
    const CONTENT_ID = 'pegasusGuideContent';
    const CARD_STYLE = 'background:linear-gradient(180deg,#141414 0%,#101010 100%); border:1px solid rgba(111,255,163,0.14); border-radius:14px; padding:14px; box-shadow:0 10px 28px rgba(0,0,0,0.28);';
    const SECTION_STYLE = 'background:linear-gradient(180deg,#121212 0%,#0d0d0d 100%); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:16px; text-align:left; box-shadow:0 10px 24px rgba(0,0,0,0.26);';

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
        'backup.js': { category: 'Tools / Safety', role: 'Export/backup του προγράμματος και των δεδομένων με integrity-aware packaging.' },
        'inventoryHandler.js': { category: 'Inventory', role: 'Χειρίζεται βοηθητικά inventories και εσωτερική λογική αποθήκης/consumables.' },
        'pegasusCore.js': { category: 'Core Engine', role: 'Ο βασικός engine της προπόνησης: state, progress, phase logic, persistable runtime snapshots και πυρήνας workout flow.' },
        'cloudSync.js': { category: 'Cloud Sync', role: 'Ο cloud κινητήρας για push, pull, unlock, approved device restore, secure sync και conflict-aware συγχρονισμό.' },
        'protcrea.js': { category: 'Inventory', role: 'Παρακολουθεί αποθέματα πρωτεΐνης/κρεατίνης και ενημερώνει labels/stock.' },
        'food.js': { category: 'Nutrition', role: 'Το panel καταγραφής φαγητού, θερμίδων και πρωτεΐνης της ημέρας.' },
        'dietAdvisor.js': { category: 'Nutrition', role: 'Ο diet advisor που προτείνει/παρουσιάζει διαιτητικές συμβουλές στο app.' },
        'extensions.js': { category: 'Training Logic', role: 'Επεκτάσεις workout logic, daily routine helpers και side systems που συμπληρώνουν τον πυρήνα.' },
        'ems.js': { category: 'Feature Module', role: 'Το EMS panel και η καταγραφή EMS συνεδριών με τις σχετικές ενέργειες.' },
        'cardio.js': { category: 'Feature Module', role: 'Cardio panel, cardio kcal logging και σύνδεση καρδιο με το ημερήσιο target.' },
        'calendar.js': { category: 'Feature Module', role: 'Ημερολόγιο PEGASUS με ιστορικό και visual tracking ημερών/δραστηριοτήτων.' },
        'gallery.js': { category: 'Feature Module', role: 'Gallery engine για αποθήκευση και απεικόνιση φωτογραφιών προόδου.' },
        'partner.js': { category: 'Feature Module', role: 'Σύστημα συνεργάτη/partner mode και σχετική λογική panel/tools.' },
        'achievements.js': { category: 'Feature Module', role: 'Leveling, achievements και reward/progress layer.' },
        'dragDrop.js': { category: 'UI Runtime', role: 'Draggable panels, panel toggles, click-outside behavior και hotkeys του desktop UI.' },
        'reporting.js': { category: 'Reporting', role: 'Morning report / manual report sending και reporting windows του συστήματος.' },
        'metabolicEngine.js': { category: 'Nutrition', role: 'Υπολογισμοί metabolism/targets και σταθεροποίηση related inputs.' },
        'weightTracker.js': { category: 'Tracking', role: 'Weight tracking module, sync-friendly καταγραφή βάρους και προβολή ιστορικού.' },
        'appState.js': { category: 'App Coordination', role: 'Shared mutable state για το thin shell και τα runtime coordinator pieces.' },
        'desktopPanels.js': { category: 'Desktop UI', role: 'Desktop panel helpers, ανοίγματα/κλεισίματα και panel-side wiring.' },
        'desktopActions.js': { category: 'Desktop UI', role: 'Desktop button actions και flows που συνδέουν UI με engine behaviors.' },
        'desktopRender.js': { category: 'Desktop UI', role: 'Desktop rendering του κύριου interface, labels, exercise list και visual refreshes.' },
        'desktopSyncUI.js': { category: 'Desktop UI', role: 'Master UI button map για desktop panels, tools, gallery, cardio, sync και κεντρικά bindings.' },
        'desktopBoot.js': { category: 'Desktop Boot', role: 'Το βασικό desktop boot sequence: navbar, initial render, daily load και onload coordination.' },
        'workoutTracking.js': { category: 'Tracking', role: 'Καταγράφει sets/workouts, total workout count και related training metrics.' },
        'app.js': { category: 'App Coordination', role: 'Thin coordinator shell που δένει τα submodules χωρίς να κρατά το παλιό monolith logic.' },
        'calorieRuntime.js': { category: 'Nutrition', role: 'Ημερήσιο kcal/protein runtime, labels, targets και calorie UI ενημερώσεις.' },
        'audioRuntime.js': { category: 'UI Runtime', role: 'Audio unlock, beeps και mute-aware ηχητικό runtime.' },
        'runtimeBridge.js': { category: 'App Coordination', role: 'Bridge ανάμεσα σε legacy runtime/UI και στο νέο engine state. Κρατά snapshots και control state sync.' },
        'weightState.js': { category: 'Tracking', role: 'State για αποθηκευμένα exercise weights και related helpers.' },
        'diagnosticsRuntime.js': { category: 'Diagnostics', role: 'Runtime logger, warning/error routing και debug-oriented console integration.' },
        'syncHardening.js': { category: 'Hardening', role: 'Guards για overlapping sync requests, phase state machine και defer/recovery handling.' },
        'syncEdgeHardening.js': { category: 'Hardening', role: 'Cross-tab lease, dedupe bursts, online/visibility recovery και edge-case sync protection.' },
        'syncDiagnostics.js': { category: 'Diagnostics', role: 'Καθαρά diagnostics για sync/lease state, classification και history notes.' },
        'selfCheckRunner.js': { category: 'Diagnostics', role: 'Regression/self-check runner που κάνει γρήγορο PASS/WARN health check του build.' },
        'moduleIntegrity.js': { category: 'Diagnostics', role: 'Επιβεβαιώνει ότι κρίσιμα globals και modules έχουν φορτώσει σωστά.' },
        'debug.js': { category: 'Diagnostics', role: 'Debug helpers, manual summaries, controls/uiState outputs και extra console utilities.' },
        'auditUI.js': { category: 'Diagnostics', role: 'Το SYSTEM STABLE / audit κουμπί και η λογική ελέγχου σταθερότητας του build.' },
        'desktopBootEnhancements.js': { category: 'Desktop Boot', role: 'Συμπληρωματικά boot enhancements μετά το βασικό desktop load.' },
        'desktopRoute.js': { category: 'Desktop Boot', role: 'Route helpers και desktop path decisions όπου χρειάζεται.' },
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
                <div class="pegasus-guide-card" data-guide-search="${escapeHtml((file + ' ' + category + ' ' + role).toLowerCase())}" style="${CARD_STYLE} margin-bottom:12px; text-align:left; position:relative; overflow:hidden;">
                    <div style="position:absolute; inset:0 auto auto 0; width:100%; height:1px; background:linear-gradient(90deg,rgba(76,175,80,0) 0%, rgba(76,175,80,0.55) 50%, rgba(76,175,80,0) 100%);"></div>
                    <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start; flex-wrap:wrap; position:relative;">
                        <div style="font-weight:900; color:#7CFFB2; font-size:13px; letter-spacing:0.3px;">${escapeHtml(file)}</div>
                        <div style="font-size:10px; color:#b5f0bf; letter-spacing:0.9px; background:rgba(76,175,80,0.09); border:1px solid rgba(76,175,80,0.18); padding:4px 8px; border-radius:999px;">${escapeHtml(category)}</div>
                    </div>
                    <div style="margin-top:8px; color:#e5e5e5; font-size:12px; line-height:1.6; position:relative;">${escapeHtml(role)}</div>
                </div>
            `;
        }).join('');
    }

    function buildGuideHtml() {
        const manifestMeta = window.PegasusManifest?.metadata || {};
        const buildInfo = [manifestMeta.os, manifestMeta.engine_version, manifestMeta.last_update].filter(Boolean).join(' • ');
        return `
            <div style="display:flex; flex-direction:column; gap:14px;">
                <div style="${SECTION_STYLE} position:relative; overflow:hidden;">
                    <div style="position:absolute; inset:0 0 auto 0; height:2px; background:linear-gradient(90deg,#2f6bff 0%, #7cffb2 55%, #2f6bff 100%);"></div>
                    <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start; flex-wrap:wrap;">
                        <div>
                            <div style="color:#7CFFB2; font-size:20px; font-weight:900; letter-spacing:1.1px;">PEGASUS HOW TO / SYSTEM MAP</div>
                            <div style="color:#c9c9c9; font-size:11px; margin-top:6px; line-height:1.6; max-width:640px;">Ο οδηγός αυτός είναι μόνο ενημερωτικός. Δεν αλλάζει δεδομένα και εξηγεί τι κάνει κάθε βασικό κομμάτι του συστήματος, ώστε να ξέρεις πού βρίσκεται κάθε λειτουργία και ποιο αρχείο ευθύνεται για αυτήν.</div>
                        </div>
                        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; justify-content:flex-end;">
                            <div style="font-size:10px; color:#d6d6d6; text-align:right; padding:6px 10px; border-radius:999px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08);">${escapeHtml(buildInfo || 'PEGASUS build')}</div>
                            <div style="font-size:10px; color:#7cffb2; text-align:right; padding:6px 10px; border-radius:999px; background:rgba(124,255,178,0.08); border:1px solid rgba(124,255,178,0.18);">READ-ONLY GUIDE</div>
                        </div>
                    </div>
                </div>

                <div style="${SECTION_STYLE}">
                    <div style="color:#7CFFB2; font-weight:900; margin-bottom:12px; font-size:14px; letter-spacing:0.4px;">ΠΩΣ ΧΡΗΣΙΜΟΠΟΙΕΙΣ ΤΟ PEGASUS</div>
                    <ol style="margin:0; padding-left:18px; color:#ececec; font-size:12px; line-height:1.8;">
                        ${QUICK_START.map(step => `<li style="margin-bottom:7px;">${escapeHtml(step)}</li>`).join('')}
                    </ol>
                </div>

                <div style="${SECTION_STYLE}">
                    <div style="color:#7CFFB2; font-weight:900; margin-bottom:12px; font-size:14px; letter-spacing:0.4px;">ΒΑΣΙΚΑ ΣΗΜΕΙΑ ΤΟΥ ΠΡΟΓΡΑΜΜΑΤΟΣ</div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:12px;">
                        ${MAIN_AREAS.map(area => `
                            <div class="pegasus-guide-card" data-guide-search="${escapeHtml((area.name + ' ' + area.role).toLowerCase())}" style="${CARD_STYLE}">
                                <div style="color:#7CFFB2; font-size:13px; font-weight:900; margin-bottom:6px;">${escapeHtml(area.name)}</div>
                                <div style="color:#e4e4e4; font-size:12px; line-height:1.6;">${escapeHtml(area.role)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div style="${SECTION_STYLE}">
                    <div style="color:#7CFFB2; font-weight:900; margin-bottom:12px; font-size:14px; letter-spacing:0.4px;">ΤΥΠΟΙ ΠΡΟΓΡΑΜΜΑΤΩΝ</div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); gap:12px;">
                        ${PROGRAM_MODES.map(mode => `
                            <div class="pegasus-guide-card" data-guide-search="${escapeHtml((mode.code + ' ' + mode.role).toLowerCase())}" style="${CARD_STYLE}">
                                <div style="color:#7CFFB2; font-size:13px; font-weight:900; margin-bottom:6px;">${escapeHtml(mode.code)}</div>
                                <div style="color:#e4e4e4; font-size:12px; line-height:1.6;">${escapeHtml(mode.role)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div style="${SECTION_STYLE}">
                    <div style="display:flex; justify-content:space-between; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:10px;">
                        <div style="color:#7CFFB2; font-weight:900; font-size:14px; letter-spacing:0.4px;">ΑΡΧΕΙΟ -> ΔΟΥΛΕΙΑ ΠΟΥ ΚΑΝΕΙ</div>
                        <input id="${SEARCH_ID}" type="text" placeholder="Ψάξε αρχείο ή λειτουργία..." style="min-width:220px; flex:1; max-width:340px; background:linear-gradient(180deg,#0f1113 0%,#0b0c0d 100%); color:#7CFFB2; border:1px solid rgba(124,255,178,0.35); border-radius:12px; padding:10px 12px; box-shadow:inset 0 1px 0 rgba(255,255,255,0.04); outline:none;">
                    </div>
                    <div style="color:#b5b5b5; font-size:11px; margin-bottom:12px; line-height:1.55;">Ο παρακάτω κατάλογος εξηγεί τι κάνει κάθε βασικό script που φορτώνεται στο current build.</div>
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
        panel.style.cssText = 'display:none; width:min(920px,92vw); height:min(790px,88vh); z-index:1002; overflow:hidden; border:1px solid rgba(124,255,178,0.16); border-radius:18px; background:linear-gradient(180deg,#111214 0%,#090909 100%); box-shadow:0 26px 80px rgba(0,0,0,0.48);';
        panel.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:12px; padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.06);">
                <h3 style="text-align:left; margin:0; color:#f3f3f3; letter-spacing:0.6px;">📘 ΟΔΗΓΟΣ PEGASUS</h3>
                <button id="btnCloseProgramGuide" class="p-btn tools-btn" style="width:auto; min-width:132px; border-radius:12px; border:1px solid rgba(255,255,255,0.14); background:linear-gradient(180deg,#1d1f22 0%,#121314 100%); color:#f1f1f1; box-shadow:0 10px 24px rgba(0,0,0,0.24); font-weight:900; letter-spacing:0.6px;">ΚΛΕΙΣΙΜΟ</button>
            </div>
            <div id="pegasusProgramGuideRoot" style="height:calc(100% - 58px); overflow-y:auto; padding-right:6px;"></div>
        `;
        document.body.appendChild(panel);

        const closeBtn = panel.querySelector('#btnCloseProgramGuide');
        if (closeBtn) {
            closeBtn.onclick = (e) => {
                e.stopPropagation();
                panel.style.display = 'none';
            };
        }

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

    function open() {
        render();
        document.querySelectorAll('.pegasus-panel, #emsModal').forEach(p => {
            if (p && p.id !== PANEL_ID) p.style.display = 'none';
        });
        const panel = ensurePanel();
        panel.style.display = 'block';
        panel.style.zIndex = '2001';
        const root = panel.querySelector('#pegasusProgramGuideRoot');
        if (root) root.scrollTop = 0;
    }

    function ensureButton() {
        if (document.getElementById(BTN_ID)) return;
        const anchor = document.getElementById('btnSystemAudit');
        if (!anchor || !anchor.parentNode) return;

        const btn = document.createElement('button');
        btn.id = BTN_ID;
        btn.className = 'p-btn tools-btn';
        btn.textContent = '📘 ΟΔΗΓΟΣ / HOW TO PEGASUS';
        btn.style.cssText = 'margin-top:10px; font-weight:900; color:#7CFFB2; border:1px solid rgba(124,255,178,0.28); background:linear-gradient(180deg,#151817 0%,#0f1110 100%); box-shadow:0 12px 24px rgba(0,0,0,0.22); letter-spacing:0.4px;';
        btn.onclick = (e) => {
            e.stopPropagation();
            open();
        };

        anchor.insertAdjacentElement('afterend', btn);
    }

    function install() {
        ensurePanel();
        ensureButton();
        if (window.PegasusRuntimeMonitor?.trace) {
            window.PegasusRuntimeMonitor.trace('programGuide.js', 'install', 'Program guide installed', { buttonId: BTN_ID, panelId: PANEL_ID });
        }
    }

    window.PegasusProgramGuide = {
        open,
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
