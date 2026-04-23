(function(){
  const scope = (location.pathname || '').includes('/mobile/') ? 'mobile' : 'desktop';
  const ERROR_KEY = `pegasus_${scope}_runtime_errors`;
  const TRACE_KEY = `pegasus_${scope}_runtime_trace`;
  const MAX_ERRORS = 40;
  const MAX_TRACE = 80;
  const MAX_TEXT = 900;
  function nowIso(){ try { return new Date().toISOString(); } catch(_) { return String(Date.now()); } }
  function trimText(value){ const text = String(value ?? ''); return text.length > MAX_TEXT ? text.slice(0, MAX_TEXT) + '…' : text; }
  function safeRead(key){ try { const raw = localStorage.getItem(key); if(!raw) return []; const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; } catch(_) { return []; } }
  function safeWrite(key, entries, limit){ try { localStorage.setItem(key, JSON.stringify(entries.slice(-limit))); return true; } catch(_) { return false; } }
  function normalizeError(error){ if(!error) return { message: 'Unknown error', stack: '' }; if(typeof error === 'string') return { message: trimText(error), stack: '' }; const message = trimText(error.message || error.reason?.message || error.reason || error.toString?.() || 'Unknown error'); const stack = trimText(error.stack || error.reason?.stack || ''); return { message, stack }; }
  function getLatestTrace(){ const entries = safeRead(TRACE_KEY); return entries.length ? entries[entries.length - 1] : null; }
  function buildTrace(moduleName, action, status, extra){ return { ts: nowIso(), scope, module: trimText(moduleName || 'UNKNOWN'), action: trimText(action || 'runtime'), status: trimText(status || 'STEP'), path: trimText(location.pathname || ''), online: !!navigator.onLine, unlocked: !!window.PegasusCloud?.isUnlocked, extra: extra ? trimText(typeof extra === 'string' ? extra : JSON.stringify(extra)) : '' }; }
  function buildError(level, moduleName, action, error, extra){ const n = normalizeError(error); const latestTrace = getLatestTrace(); return { ts: nowIso(), scope, level: trimText(level || 'ERROR'), module: trimText(moduleName || 'UNKNOWN'), action: trimText(action || 'runtime'), message: n.message, stack: n.stack, path: trimText(location.pathname || ''), online: !!navigator.onLine, unlocked: !!window.PegasusCloud?.isUnlocked, lastTrace: latestTrace ? `${latestTrace.module}:${latestTrace.action}:${latestTrace.status}` : '', extra: extra ? trimText(typeof extra === 'string' ? extra : JSON.stringify(extra)) : '' }; }
  function pushTrace(moduleName, action, status, extra){ const entries = safeRead(TRACE_KEY); const entry = buildTrace(moduleName, action, status, extra); entries.push(entry); safeWrite(TRACE_KEY, entries, MAX_TRACE); return entry; }
  function pushError(level, moduleName, action, error, extra){ const entries = safeRead(ERROR_KEY); const entry = buildError(level, moduleName, action, error, extra); entries.push(entry); safeWrite(ERROR_KEY, entries, MAX_ERRORS); return entry; }
  function getLatestError(){ const entries = safeRead(ERROR_KEY); return entries.length ? entries[entries.length - 1] : null; }
  window.PegasusRuntimeMonitor = {
    scope,
    errorKey: ERROR_KEY,
    traceKey: TRACE_KEY,
    trace(moduleName, action, status, extra){ return pushTrace(moduleName, action, status || 'STEP', extra); },
    mark(moduleName, action, status, extra){ return pushTrace(moduleName, action, status || 'STEP', extra); },
    capture(moduleName, action, error, extra){ return pushError('ERROR', moduleName, action, error, extra); },
    warn(moduleName, action, error, extra){ return pushError('WARN', moduleName, action, error, extra); },
    info(moduleName, action, message, extra){ return pushError('INFO', moduleName, action, message, extra); },
    getErrors(){ return safeRead(ERROR_KEY); },
    getLatestError,
    getProblems(){ return safeRead(ERROR_KEY).filter(entry => entry.level === 'WARN' || entry.level === 'ERROR'); },
    getLatestProblem(){ const problems = safeRead(ERROR_KEY).filter(entry => entry.level === 'WARN' || entry.level === 'ERROR'); return problems.length ? problems[problems.length - 1] : null; },
    getTrace(){ return safeRead(TRACE_KEY); },
    getLatestTrace,
    clearErrors(){ try { localStorage.removeItem(ERROR_KEY); } catch(_) {} },
    clearTrace(){ try { localStorage.removeItem(TRACE_KEY); } catch(_) {} },
    clearAll(){ try { localStorage.removeItem(ERROR_KEY); } catch(_) {} try { localStorage.removeItem(TRACE_KEY); } catch(_) {} }
  };
  if(scope === 'desktop'){
    window.addEventListener('error', function(event){ const src = event.filename ? event.filename.split('/').pop() : 'runtime'; pushError('ERROR', src || 'runtime', 'window.error', event.error || event.message || 'Window error', { lineno: event.lineno || 0, colno: event.colno || 0 }); });
    window.addEventListener('unhandledrejection', function(event){ pushError('ERROR', 'promise', 'unhandledrejection', event.reason || 'Unhandled rejection'); });
  }
})();
