// ── V8.3 Autonomous AI Design Director — Telemetry Metrics ────────────────────
// Tracks director review quality per build for GET /api/telemetry/quality.
// Follows the VoxAI standard metrics module pattern.

import type { DirectorReview } from './directorTypes.js';
import type { DirectorCategory } from './directorTypes.js';
import { getDirectorLearningTrend } from './directorLearning.js';

// ── Run Record ────────────────────────────────────────────────────────────────

interface DirectorRunRecord {
  buildId:       string;
  overallScore:  number;
  criticalCount: number;
  highCount:     number;
  topCategory:   string;
  confidence:    number;
  dnaId:         string;
  recordedAt:    number;
}

// ── In-memory State ───────────────────────────────────────────────────────────

const _history: DirectorRunRecord[] = [];
const MAX_HISTORY = 100;

// Category problem frequency tracker
const _problemFrequency = new Map<DirectorCategory, number>();

// ── Record API ─────────────────────────────────────────────────────────────────

export interface RecordDirectorRunInput {
  buildId:        string;
  directorReview: DirectorReview;
  dnaId?:         string;
}

export function recordDirectorRun(input: RecordDirectorRunInput): void {
  const { buildId, directorReview, dnaId = 'generic' } = input;

  const criticalIssues  = directorReview.categoryReviews.filter(r => r.severity === 'Critical');
  const highIssues      = directorReview.categoryReviews.filter(r => r.severity === 'High');
  const worstCategory   = directorReview.categoryReviews
    .sort((a, b) => a.score - b.score)[0]?.category ?? 'unknown';

  // Track problem frequencies
  for (const r of directorReview.categoryReviews) {
    if (r.score < 6.5) {
      _problemFrequency.set(r.category, (_problemFrequency.get(r.category) ?? 0) + 1);
    }
  }

  _history.push({
    buildId,
    overallScore:  directorReview.overallScore,
    criticalCount: criticalIssues.length,
    highCount:     highIssues.length,
    topCategory:   worstCategory,
    confidence:    directorReview.confidence,
    dnaId,
    recordedAt:    Date.now(),
  });

  if (_history.length > MAX_HISTORY) _history.shift();
}

// ── Telemetry Snapshot ─────────────────────────────────────────────────────────

export function getDirectorMetrics() {
  const recent = _history.slice(-20);
  const total  = recent.length;

  if (total === 0) {
    return {
      runsTracked:           0,
      averageDirectorScore:  0,
      averageCriticalIssues: 0,
      averageHighIssues:     0,
      topRecommendations:    [] as string[],
      criticalIssues:        [] as string[],
      mostCommonProblems:    [] as string[],
      learningTrend:         'stable',
      confidence:            0,
      reviewDistribution:    { critical: 0, high: 0, medium: 0, low: 0 },
      recentScores:          [] as object[],
    };
  }

  const avg = (key: keyof DirectorRunRecord) =>
    Math.round(recent.reduce((s, r) => s + (r[key] as number), 0) / total * 10) / 10;

  // Most common problem categories
  const mostCommonProblems = [..._problemFrequency.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([cat]) => cat);

  // Distribution from last run
  const lastRun = _history[_history.length - 1];

  return {
    runsTracked:           total,
    averageDirectorScore:  avg('overallScore'),
    averageCriticalIssues: avg('criticalCount'),
    averageHighIssues:     avg('highCount'),
    topRecommendations:    [] as string[],   // populated per-build via SSE
    criticalIssues:        [] as string[],   // populated per-build via SSE
    mostCommonProblems,
    mostImprovedCategories: [] as string[],  // populated by learning loop
    learningTrend:         getDirectorLearningTrend(),
    confidence:            avg('confidence'),
    reviewDistribution: lastRun
      ? { critical: lastRun.criticalCount, high: lastRun.highCount, medium: 0, low: 0 }
      : { critical: 0, high: 0, medium: 0, low: 0 },
    recentScores: recent.slice(-5).map(r => ({
      overallScore:  r.overallScore,
      criticalCount: r.criticalCount,
      confidence:    r.confidence,
      dnaId:         r.dnaId,
    })),
  };
}

export function resetDirectorMetrics(): void {
  _history.length = 0;
  _problemFrequency.clear();
}
