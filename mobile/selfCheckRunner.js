/* ==========================================================================
   PEGASUS SELF-CHECK RUNNER
   Read-only regression checks for modules, storage, sync visibility and runtime state.
   ========================================================================== */

(function(){
    const HISTORY_KEY = 'pegasus_self_check_history';
    const MAX_HISTORY = 30;
    let inMemoryLast = null;

    function safeNow(){ try { return new Date().toISOString(); } catch(_) { return String(Date.now()); } }
    function safeCall(fn, fallback){ try { return fn(); } catch(_) { return fallback; } }
    function safeReadHistory(){
        try {
            const raw = localStorage.getItem(HISTORY_KEY);
            if(!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch(_) {
            return [];
        }
    }
    function safeWriteHistory(entries){
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(-MAX_HISTORY)));
        } catch(_) {}
    }

    function getRuntimeSummary(){
        const monitor = window.PegasusRuntimeMonitor;
        const latestProblem = monitor?.getLatestProblem ? monitor.getLatestProblem() : null;
        const latestTrace = monitor?.getLatestTrace ? monitor.getLatestTrace() : null;
        const problemCount = monitor?.getProblems ? monitor.getProblems().length : 0;
        const traceCount = monitor?.getTrace ? monitor.getTrace().length : 0;
        return {
            problemCount,
            traceCount,
            latestProblem,
            latestTrace
        };
    }

    function summarizeSync(){
        const diagnostics = window.PegasusSyncDiagnostics;
        const syncSummary = safeCall(() => diagnostics?.summary?.(), null);
        const classification = safeCall(() => diagnostics?.classifyCurrent?.(), null);
        const leaseView = safeCall(() => diagnostics?.leaseView?.(), null);
        return { syncSummary, classification, leaseView };
    }

    function summarizeStorage(){
        return safeCall(() => window.PegasusStorageHardening?.summary?.(), null);
    }

    function summarizeModules(){
        return safeCall(() => window.PegasusModuleIntegrity?.check?.('self_check'), null);
    }

    function summarizeUi(){
        const debug = window.PegasusDebug;
        return {
            summary: safeCall(() => debug?.summary?.(), null),
            controls: safeCall(() => debug?.controls?.(), null),
            uiState: safeCall(() => debug?.uiState?.(), null),
            appCoordinator: safeCall(() => window.getPegasusAppCoordinatorState?.(), null),
            appState: safeCall(() => window.PegasusAppState?.snapshot?.(), null)
        };
    }

    function classifyVerdict(payload){
        const reasons = [];
        let verdict = 'PASS';

        if(!payload.modules?.ok){
            verdict = 'FAIL';
            reasons.push('module_integrity_failed');
        }

        if(payload.storage && payload.storage.ok === false){
            verdict = 'FAIL';
            reasons.push('storage_hardening_failed');
        }

        const latestProblem = payload.runtime?.latestProblem;
        if(latestProblem?.level === 'ERROR'){
            verdict = 'FAIL';
            reasons.push('runtime_error_present');
        } else if(latestProblem?.level === 'WARN' && verdict !== 'FAIL'){
            verdict = 'WARN';
            reasons.push('runtime_warning_present');
        }

        const currentClass = payload.sync?.classification;
        if(currentClass && typeof currentClass === 'string'){
            if(/error|failed|stuck/i.test(currentClass) && verdict !== 'FAIL'){
                verdict = 'WARN';
                reasons.push(`sync_${currentClass}`);
            } else if(/defer|lease|busy/i.test(currentClass) && verdict === 'PASS'){
                reasons.push(`sync_${currentClass}`);
            }
        }

        if(!reasons.length) reasons.push('healthy');
        return { verdict, reasons };
    }

    function buildSnapshot(stage){
        const payload = {
            checkedAt: safeNow(),
            stage: stage || 'manual',
            modules: summarizeModules(),
            storage: summarizeStorage(),
            sync: summarizeSync(),
            runtime: getRuntimeSummary(),
            ui: summarizeUi()
        };
        const classification = classifyVerdict(payload);
        payload.verdict = classification.verdict;
        payload.reasons = classification.reasons;
        return payload;
    }

    function remember(snapshot){
        inMemoryLast = snapshot;
        const history = safeReadHistory();
        history.push({
            checkedAt: snapshot.checkedAt,
            stage: snapshot.stage,
            verdict: snapshot.verdict,
            reasons: snapshot.reasons,
            moduleOk: !!snapshot.modules?.ok,
            runtimeProblemLevel: snapshot.runtime?.latestProblem?.level || null,
            syncClassification: snapshot.sync?.classification || null
        });
        safeWriteHistory(history);
        return snapshot;
    }

    function printSnapshot(snapshot){
        console.log('🩺 PEGASUS SELF CHECK', {
            checkedAt: snapshot.checkedAt,
            stage: snapshot.stage,
            verdict: snapshot.verdict,
            reasons: snapshot.reasons,
            modulesOk: !!snapshot.modules?.ok,
            storageOk: snapshot.storage?.ok !== false,
            syncClassification: snapshot.sync?.classification || null,
            runtimeProblemLevel: snapshot.runtime?.latestProblem?.level || null,
            problemCount: snapshot.runtime?.problemCount || 0,
            traceCount: snapshot.runtime?.traceCount || 0
        });
        return snapshot;
    }

    const api = {
        run(stage){
            const snapshot = remember(buildSnapshot(stage || 'manual_run'));
            return printSnapshot(snapshot);
        },
        quick(){
            return this.run('quick');
        },
        summary(){
            return inMemoryLast || this.run('summary');
        },
        latest(){
            return inMemoryLast || null;
        },
        history(limit){
            const entries = safeReadHistory();
            if(typeof limit === 'number') return entries.slice(-Math.max(1, limit));
            return entries;
        },
        recent(limit){
            return this.history(limit || 10);
        },
        clearHistory(){
            try { localStorage.removeItem(HISTORY_KEY); } catch(_) {}
            inMemoryLast = null;
            return true;
        },
        explain(){
            const latest = inMemoryLast || this.run('explain');
            return {
                verdict: latest.verdict,
                reasons: latest.reasons,
                guidance: latest.verdict === 'PASS'
                    ? 'Healthy baseline. Safe for normal testing.'
                    : latest.verdict === 'WARN'
                        ? 'Usable, but inspect warnings before deeper changes.'
                        : 'Investigate reported failures before continuing.'
            };
        }
    };

    window.PegasusSelfCheck = api;
})();
