// ── V6.4.6: Security Metrics (Phase 10) ──────────────────────────────────────
// In-memory security telemetry — no UI, no persistence, no external deps.

export interface SecurityMetricsSnapshot {
  authSuccess: number;
  authFailure: number;
  blockedRequests: number;
  corsViolations: number;
  rateLimitHits: number;
  cleanupRuns: number;
  workspacesDeleted: number;
  startedAt: string;
}

const _m: SecurityMetricsSnapshot = {
  authSuccess: 0,
  authFailure: 0,
  blockedRequests: 0,
  corsViolations: 0,
  rateLimitHits: 0,
  cleanupRuns: 0,
  workspacesDeleted: 0,
  startedAt: new Date().toISOString(),
};

export function recordAuthSuccess(): void       { _m.authSuccess++; }
export function recordAuthFailure(): void       { _m.authFailure++; }
export function recordBlockedRequest(): void    { _m.blockedRequests++; }
export function recordCorsViolation(): void     { _m.corsViolations++; }
export function recordRateLimitHit(): void      { _m.rateLimitHits++; }
export function recordCleanupRun(deleted: number): void {
  _m.cleanupRuns++;
  _m.workspacesDeleted += deleted;
}

export function getSecurityMetrics(): Readonly<SecurityMetricsSnapshot> {
  return { ..._m };
}
