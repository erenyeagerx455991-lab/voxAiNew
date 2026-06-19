// ── V6.4.6: Security Baseline (Phase 1) ──────────────────────────────────────
// Collects request patterns to inform data-driven rate limits.
// No enforcement here — observation only.

export interface RouteStats {
  hits: number;
  lastSeen: string;
  avgGapMs: number;
}

export interface SecurityBaselineReport {
  collectedAt: string;
  uptimeMs: number;
  totalRequests: number;
  routeBreakdown: Record<string, RouteStats>;
  originBreakdown: Record<string, number>;
  recommendedLimits: {
    build: number;
    chat: number;
    general: number;
  };
}

const _startTime = Date.now();
const _routeHits: Map<string, { count: number; lastMs: number; gapSum: number }> = new Map();
const _originHits: Map<string, number> = new Map();
let _totalRequests = 0;

export function recordBaselineRequest(route: string, origin: string): void {
  _totalRequests++;

  // Route tracking
  const now = Date.now();
  const existing = _routeHits.get(route);
  if (existing) {
    const gap = now - existing.lastMs;
    existing.count++;
    existing.gapSum += gap;
    existing.lastMs = now;
  } else {
    _routeHits.set(route, { count: 1, lastMs: now, gapSum: 0 });
  }

  // Origin tracking
  _originHits.set(origin, (_originHits.get(origin) ?? 0) + 1);
}

export function generateBaselineReport(): SecurityBaselineReport {
  const now = Date.now();
  const uptimeMs = now - _startTime;
  const uptimeMins = uptimeMs / 60_000;

  const routeBreakdown: Record<string, RouteStats> = {};
  for (const [route, data] of _routeHits.entries()) {
    routeBreakdown[route] = {
      hits: data.count,
      lastSeen: new Date(data.lastMs).toISOString(),
      avgGapMs: data.count > 1 ? Math.round(data.gapSum / (data.count - 1)) : 0,
    };
  }

  const originBreakdown: Record<string, number> = {};
  for (const [origin, count] of _originHits.entries()) {
    originBreakdown[origin] = count;
  }

  // Derive recommendations from observed rates (per minute, with 2x headroom)
  function limitFor(pattern: string): number {
    const matched = [..._routeHits.entries()]
      .filter(([r]) => r.includes(pattern))
      .reduce((sum, [, d]) => sum + d.count, 0);
    const ratePerMin = uptimeMins > 0 ? matched / uptimeMins : 0;
    // 3× headroom over observed peak, minimum sensible floors
    return Math.max(Math.ceil(ratePerMin * 3), pattern === 'agents' ? 10 : pattern === 'chat' ? 30 : 60);
  }

  return {
    collectedAt: new Date().toISOString(),
    uptimeMs,
    totalRequests: _totalRequests,
    routeBreakdown,
    originBreakdown,
    recommendedLimits: {
      build: limitFor('agents'),
      chat: limitFor('chat'),
      general: limitFor('general'),
    },
  };
}
