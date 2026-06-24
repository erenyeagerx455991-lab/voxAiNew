// ── V7.2.6.1 Auth Routing Metrics ─────────────────────────────────────────────
// Tracks which auth state / navbar variant was selected for each build.

import type { AuthState } from "./authStateClassifier.js";

interface AuthRoutingRecord {
  authState: AuthState;
  navbarVariant: string;
  confidence: number;
  recordedAt: number;
}

const _routingHistory: AuthRoutingRecord[] = [];
const MAX_HISTORY = 200;

export function recordAuthRouting(record: {
  authState: AuthState;
  navbarVariant: string;
  confidence: number;
}): void {
  _routingHistory.push({ ...record, recordedAt: Date.now() });
  if (_routingHistory.length > MAX_HISTORY) _routingHistory.shift();
}

export function getAuthRoutingMetrics() {
  const recent = _routingHistory.slice(-50);
  const total = recent.length;

  function pct(state: AuthState): number {
    if (total === 0) return 0;
    return Math.round(recent.filter(r => r.authState === state).length / total * 100);
  }

  const variantCounts: Record<string, number> = {};
  for (const r of recent) {
    variantCounts[r.navbarVariant] = (variantCounts[r.navbarVariant] ?? 0) + 1;
  }

  const topWinningNavbar = Object.entries(variantCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([variant, count]) => ({ variant, count }));

  const avgConfidence = total > 0
    ? Math.round(recent.reduce((s, r) => s + r.confidence, 0) / total * 100) / 100
    : 0;

  // Routing accuracy: admin → admin navbar, dashboard → dashboard navbar
  const adminBuilds    = recent.filter(r => r.authState === 'admin');
  const dashBuilds     = recent.filter(r => r.authState === 'dashboard');
  const authBuilds     = recent.filter(r => r.authState === 'authenticated');

  const adminCorrect   = adminBuilds.filter(r => r.navbarVariant.includes('admin')).length;
  const dashCorrect    = dashBuilds.filter(r => r.navbarVariant.includes('dashboard') || r.navbarVariant.includes('command')).length;
  const authCorrect    = authBuilds.filter(r => r.navbarVariant.includes('auth') || r.navbarVariant.includes('dashboard') || r.navbarVariant.includes('command')).length;

  const correctTotal   = adminCorrect + dashCorrect + authCorrect;
  const trackedTotal   = adminBuilds.length + dashBuilds.length + authBuilds.length;
  const authRoutingAccuracy = trackedTotal > 0
    ? Math.round(correctTotal / trackedTotal * 100)
    : 100; // default 100% if no data yet

  return {
    guestSelections:         pct('guest'),
    authenticatedSelections: pct('authenticated'),
    dashboardSelections:     pct('dashboard'),
    adminSelections:         pct('admin'),
    navbarVariantUsage:      variantCounts,
    topWinningNavbar,
    averageConfidence:       avgConfidence,
    authRoutingAccuracy,
    totalRoutingsTracked:    _routingHistory.length,
  };
}

export function resetAuthRoutingMetrics(): void {
  _routingHistory.length = 0;
}
