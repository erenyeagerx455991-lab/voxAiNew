// ── V7.2.5 Navigation Quality Metrics ─────────────────────────────────────────
// Tracks NavigationMenu usage, Sheet mobile menus, and accessibility compliance
// per build. Feeds into GET /api/telemetry/quality.

export interface NavigationBuildRecord {
  score:                number;
  usesNavigationMenu:   boolean;
  usesSheetMobile:      boolean;
  hasAriaLabel:         boolean;
  hasFocusVisible:      boolean;
  hasMobileToggle:      boolean;
  recordedAt:           number;
}

const _navHistory: NavigationBuildRecord[] = [];

export function recordNavigationScore(record: Omit<NavigationBuildRecord, 'recordedAt'>): void {
  _navHistory.push({ ...record, recordedAt: Date.now() });
  if (_navHistory.length > 100) _navHistory.shift();
}

export function getNavigationQualityMetrics() {
  const recent = _navHistory.slice(-20);
  const total  = recent.length;

  const avgScore = total > 0
    ? Math.round(recent.reduce((s, r) => s + r.score, 0) / total * 10) / 10
    : 0;

  const pct = (key: keyof NavigationBuildRecord) =>
    total > 0 ? Math.round(recent.filter(r => r[key]).length / total * 100) : 0;

  return {
    averageNavbarScore:       avgScore,
    navigationMenuUsage:      pct('usesNavigationMenu'),
    sheetUsage:               pct('usesSheetMobile'),
    accessibilityCompliance:  pct('hasAriaLabel'),
    focusVisibleCompliance:   pct('hasFocusVisible'),
    mobileToggleCompliance:   pct('hasMobileToggle'),
    totalBuildsTracked:       _navHistory.length,
    recentScores:             recent.slice(-5).map(r => r.score),
  };
}

export function resetNavigationQualityMetrics(): void {
  _navHistory.length = 0;
}
