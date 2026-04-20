(function(){
  const STORAGE_KEY = 'pegasus_mobile_errors';
  const LIMIT = 20;
  const MAX_TEXT = 800;
  let guard = false;

  function nowIso() {
    try { return new Date().toISOString(); } catch (_) { return String(Date.now()); }
  }

  function trimText(value) {
    const text = String(value ?? '');
    return text.length > MAX_TEXT ? text.slice(0, MAX_TEXT) + '…' : text;
  }

  function safeRead() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function safeWrite(entries) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-LIMIT)));
      return true;
    } catch (_) {
      return false;
    }
  }

  function normalizeError(error) {
    if (!error) return { message: 'Unknown error', stack: '' };
    if (typeof error === 'string') return { message: trimText(error), stack: '' };

    const message = trimText(error.message || error.reason?.message || error.reason || error.toString?.() || 'Unknown error');
    const stack = trimText(error.stack || error.reason?.stack || '');
    return { message, stack };
  }

  function buildEntry(level, moduleName, action, error, extra) {
    const n = normalizeError(error);
    return {
      ts: nowIso(),
      level: level || 'ERROR',
      module: trimText(moduleName || 'UNKNOWN'),
      action: trimText(action || 'runtime'),
      message: n.message,
      stack: n.stack,
      path: trimText(location.pathname || ''),
      online: !!navigator.onLine,
      unlocked: !!window.PegasusCloud?.isUnlocked,
      extra: extra ? trimText(typeof extra === 'string' ? extra : JSON.stringify(extra)) : ''
    };
  }

  function capture(level, moduleName, action, error, extra) {
    if (guard) return null;
    guard = true;
    try {
      const entries = safeRead();
      const entry = buildEntry(level, moduleName, action, error, extra);
      entries.push(entry);
      safeWrite(entries);
      try {
        if (level === "ERROR") window.PegasusRuntimeMonitor?.capture?.(moduleName || "UNKNOWN", action || "runtime", error, extra);
        else if (level === "WARN") window.PegasusRuntimeMonitor?.warn?.(moduleName || "UNKNOWN", action || "runtime", error, extra);
        else window.PegasusRuntimeMonitor?.info?.(moduleName || "UNKNOWN", action || "runtime", n.message, extra);
      } catch (_) {}
      return entry;
    } finally {
      guard = false;
    }
  }

  window.PegasusMobileErrors = {
    key: STORAGE_KEY,
    limit: LIMIT,
    capture(moduleName, action, error, extra) {
      return capture('ERROR', moduleName, action, error, extra);
    },
    warn(moduleName, action, error, extra) {
      return capture('WARN', moduleName, action, error, extra);
    },
    info(moduleName, action, message, extra) {
      return capture('INFO', moduleName, action, message, extra);
    },
    getAll() {
      return safeRead();
    },
    getLatest() {
      const entries = safeRead();
      return entries.length ? entries[entries.length - 1] : null;
    },
    getProblems() {
      return safeRead().filter(entry => entry.level === "WARN" || entry.level === "ERROR");
    },
    getLatestProblem() {
      const entries = safeRead().filter(entry => entry.level === "WARN" || entry.level === "ERROR");
      return entries.length ? entries[entries.length - 1] : null;
    },
    clear() {
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    }
  };

  window.addEventListener('error', function(event){
    const src = event.filename ? event.filename.split('/').pop() : 'runtime';
    capture('ERROR', src || 'runtime', 'window.error', event.error || event.message || 'Window error', {
      lineno: event.lineno || 0,
      colno: event.colno || 0
    });
  });

  window.addEventListener('unhandledrejection', function(event){
    capture('ERROR', 'promise', 'unhandledrejection', event.reason || 'Unhandled rejection');
  });
})();
