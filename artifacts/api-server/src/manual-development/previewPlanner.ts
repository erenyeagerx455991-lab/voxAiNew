// ── V10.2 Preview Planner — Deterministic ────────────────────────────────────
//
// Plans live preview state and update routing. Zero LLM calls. Never throws.

export type PreviewStatus = 'idle' | 'loading' | 'ready' | 'error' | 'compiling';

export interface PreviewState {
  status:       PreviewStatus;
  url:          string;
  port:         number;
  errorMessage: string | null;
  lastUpdateMs: number;
  reloadCount:  number;
  latencyMs:    number;
}

export function createPreviewState(port: number): PreviewState {
  return {
    status:       'idle',
    url:          `http://localhost:${port}`,
    port,
    errorMessage: null,
    lastUpdateMs: 0,
    reloadCount:  0,
    latencyMs:    0,
  };
}

export function setPreviewStatus(
  state:   PreviewState,
  status:  PreviewStatus,
  error?: string,
): PreviewState {
  return {
    ...state,
    status,
    errorMessage: error ?? null,
    lastUpdateMs: Date.now(),
  };
}

export function recordPreviewReload(
  state:     PreviewState,
  latencyMs: number,
): PreviewState {
  return {
    ...state,
    status:      'ready',
    reloadCount: state.reloadCount + 1,
    latencyMs,
    lastUpdateMs: Date.now(),
    errorMessage: null,
  };
}

// ── Reload strategy ────────────────────────────────────────────────────────────

export type ReloadStrategy = 'hot' | 'soft' | 'full';

export function determineReloadStrategy(
  changedFiles: string[],
): ReloadStrategy {
  if (changedFiles.length === 0) return 'hot';
  const hasStyleOnly = changedFiles.every(f => /\.(css|scss|sass)$/.test(f));
  if (hasStyleOnly) return 'hot';

  const hasConfigChange = changedFiles.some(f =>
    /vite\.config|tailwind\.config|tsconfig|package\.json|\.env/.test(f),
  );
  if (hasConfigChange) return 'full';

  const hasRouteChange = changedFiles.some(f =>
    /router|routes?|App\.(tsx?|jsx?)/.test(f),
  );
  if (hasRouteChange) return 'soft';

  return 'hot';
}

// ── Error overlay ──────────────────────────────────────────────────────────────

export interface PreviewError {
  type:      'compile' | 'runtime' | 'network';
  message:   string;
  stack?:    string;
  filePath?: string;
  line?:     number;
  column?:   number;
}

export function parsePreviewError(rawError: string): PreviewError {
  // Compile error pattern
  const compileMatch = rawError.match(/([^:]+\.tsx?):(\d+):(\d+):\s*(.+)/);
  if (compileMatch) {
    return {
      type:     'compile',
      message:  compileMatch[4].trim(),
      filePath: compileMatch[1],
      line:     parseInt(compileMatch[2], 10),
      column:   parseInt(compileMatch[3], 10),
    };
  }
  // Network error
  if (/ECONNREFUSED|ETIMEDOUT|fetch failed/.test(rawError)) {
    return { type: 'network', message: rawError.trim() };
  }
  // Runtime error
  return { type: 'runtime', message: rawError.trim() };
}

// ── Preview metrics ────────────────────────────────────────────────────────────

export interface PreviewMetrics {
  totalReloads:    number;
  avgLatencyMs:    number;
  errorCount:      number;
  hotReloadCount:  number;
  fullReloadCount: number;
}

export function aggregatePreviewMetrics(
  latencies:    number[],
  errorCount:   number,
  hotReloads:   number,
  fullReloads:  number,
): PreviewMetrics {
  const totalReloads = latencies.length;
  const avgLatencyMs = totalReloads > 0
    ? Math.round(latencies.reduce((s, l) => s + l, 0) / totalReloads)
    : 0;
  return { totalReloads, avgLatencyMs, errorCount, hotReloadCount: hotReloads, fullReloadCount: fullReloads };
}
