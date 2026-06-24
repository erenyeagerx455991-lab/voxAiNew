// ── V7.2.6 Navigation Quality Metrics ─────────────────────────────────────────
// Tracks NavigationMenu, Sheet, Avatar, DropdownMenu, Command usage per build.
// Feeds into GET /api/telemetry/quality → navigationQuality.

export interface NavigationBuildRecord {
  score:                number;
  usesNavigationMenu:   boolean;
  usesSheetMobile:      boolean;
  hasAriaLabel:         boolean;
  hasFocusVisible:      boolean;
  hasMobileToggle:      boolean;
  // V7.2.6 auth-aware intelligence fields
  avatarUsage:          boolean;
  dropdownUsage:        boolean;
  commandUsage:         boolean;
  accountMenuScore:     number;
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

  const avgAccountMenuScore = total > 0
    ? Math.round(recent.reduce((s, r) => s + (r.accountMenuScore ?? 0), 0) / total * 10) / 10
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
    // V7.2.6 auth-aware intelligence
    navigationIntelligence: {
      avatarUsage:          pct('avatarUsage'),
      dropdownUsage:        pct('dropdownUsage'),
      commandUsage:         pct('commandUsage'),
      accountMenuScore:     avgAccountMenuScore,
    },
    totalBuildsTracked:       _navHistory.length,
    recentScores:             recent.slice(-5).map(r => r.score),
  };
}

export function resetNavigationQualityMetrics(): void {
  _navHistory.length = 0;
}
