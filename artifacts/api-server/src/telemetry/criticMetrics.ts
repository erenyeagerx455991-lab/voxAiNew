// ── V7.3.0 Design Critic Quality Metrics ──────────────────────────────────────
// Tracks critic runs, scores, issue detection, and repair trigger rate.
// Feeds into GET /api/telemetry/quality → criticQuality.

export interface CriticRunRecord {
  buildId:          string;
  criticScore:      number;
  issuesDetected:   number;
  repairTriggered:  boolean;
  repairImproved:   boolean;
  scoreBeforeCritic: number;
  scoreAfterCritic:  number;
  topCategories:    string[];
  recordedAt:       number;
}

const _criticHistory: CriticRunRecord[] = [];

export function recordCriticRun(record: Omit<CriticRunRecord, 'recordedAt'>): void {
  _criticHistory.push({ ...record, recordedAt: Date.now() });
  if (_criticHistory.length > 100) _criticHistory.shift();
}

export function getCriticQualityMetrics() {
  const recent = _criticHistory.slice(-20);
  const total  = recent.length;
  if (total === 0) return { criticRunsTracked: 0, averageCriticScore: 0, repairTriggerRate: '0%', averageIssuesDetected: 0, topIssueCategories: [], recentScores: [] };

  const avgScore = Math.round(recent.reduce((s, r) => s + r.criticScore, 0) / total * 10) / 10;
  const repairCount  = recent.filter(r => r.repairTriggered).length;
  const repairRate   = Math.round(repairCount / total * 100);
  const avgIssues    = Math.round(recent.reduce((s, r) => s + r.issuesDetected, 0) / total * 10) / 10;

  const catCounts: Record<string, number> = {};
  for (const r of recent) {
    for (const cat of r.topCategories) {
      catCounts[cat] = (catCounts[cat] ?? 0) + 1;
    }
  }
  const topIssueCategories = Object.entries(catCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([cat, count]) => ({ category: cat, occurrences: count }));

  const repairImprovedCount = recent.filter(r => r.repairImproved).length;
  const repairSuccessRate = repairCount > 0
    ? Math.round(repairImprovedCount / repairCount * 100) + '%'
    : 'N/A';

  return {
    criticRunsTracked:    total,
    averageCriticScore:   avgScore,
    repairTriggerRate:    `${repairRate}%`,
    repairSuccessRate,
    averageIssuesDetected: avgIssues,
    topIssueCategories,
    recentScores: recent.slice(-5).map(r => ({
      criticScore:       r.criticScore,
      repairTriggered:   r.repairTriggered,
      issuesDetected:    r.issuesDetected,
      scoreBeforeCritic: r.scoreBeforeCritic,
      scoreAfterCritic:  r.scoreAfterCritic,
    })),
  };
}

export function resetCriticMetrics(): void {
  _criticHistory.length = 0;
}
