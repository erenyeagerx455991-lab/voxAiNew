// ── V7.2.7 Dashboard Quality Metrics ──────────────────────────────────────────
// Tracks DataTable, Tabs, Badge, Skeleton, Command usage per dashboard build.
// Feeds into GET /api/telemetry/quality → dashboardQuality.

export interface DashboardBuildRecord {
  score:          number;
  isDashboard:    boolean;
  datatableUsage: boolean;
  tabsUsage:      boolean;
  badgeUsage:     boolean;
  skeletonUsage:  boolean;
  commandUsage:   boolean;
  dropdownUsage:  boolean;
  recordedAt:     number;
}

const _dashboardHistory: DashboardBuildRecord[] = [];

export function recordDashboardScore(record: Omit<DashboardBuildRecord, 'recordedAt'>): void {
  _dashboardHistory.push({ ...record, recordedAt: Date.now() });
  if (_dashboardHistory.length > 100) _dashboardHistory.shift();
}

export function getDashboardQualityMetrics() {
  const recent      = _dashboardHistory.slice(-20);
  const total       = recent.length;
  const dashboards  = recent.filter(r => r.isDashboard);
  const dTotal      = dashboards.length;

  const avgScore = total > 0
    ? Math.round(recent.reduce((s, r) => s + r.score, 0) / total * 10) / 10
    : 0;

  const avgDashboardScore = dTotal > 0
    ? Math.round(dashboards.reduce((s, r) => s + r.score, 0) / dTotal * 10) / 10
    : 0;

  const pct = (key: keyof DashboardBuildRecord) =>
    dTotal > 0 ? Math.round(dashboards.filter(r => r[key]).length / dTotal * 100) : 0;

  return {
    averageDashboardScore:  avgDashboardScore,
    averageAllBuildsScore:  avgScore,
    dashboardBuildsTracked: dTotal,
    totalBuildsTracked:     total,
    componentAdoption: {
      datatableUsage: pct('datatableUsage'),
      tabsUsage:      pct('tabsUsage'),
      badgeUsage:     pct('badgeUsage'),
      skeletonUsage:  pct('skeletonUsage'),
      commandUsage:   pct('commandUsage'),
      dropdownUsage:  pct('dropdownUsage'),
    },
    recentScores: recent.slice(-5).map(r => ({ score: r.score, isDashboard: r.isDashboard })),
  };
}

export function resetDashboardQualityMetrics(): void {
  _dashboardHistory.length = 0;
}
