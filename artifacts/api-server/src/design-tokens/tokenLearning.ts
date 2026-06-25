// ── V7.3.5 Token Theme Learning ────────────────────────────────────────────────
// Tracks which token themes produce the best design quality scores.
// Feeds back into future theme selection for improved defaults.
// No LLM calls — purely in-memory, deterministic.

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TokenThemeOutcome {
  themeId:           string;
  tokenQualityScore: number;
  overallScore:      number;
  repairTriggered:   boolean;
  recordedAt:        number;
}

interface ThemeMetrics {
  themeId:         string;
  usageCount:      number;
  avgTokenScore:   number;
  avgOverallScore: number;
  successCount:    number;
  repairCount:     number;
  qualityScore:    number;
  _n:              number;
  _sumTokenScore:  number;
  _sumOverall:     number;
}

// ── In-memory store ───────────────────────────────────────────────────────────

const _themeStore = new Map<string, ThemeMetrics>();

// ── Quality formula ───────────────────────────────────────────────────────────
//
// qualityScore =
//   avgTokenScore   × 0.50
// + avgOverallScore × 0.40
// + (1 - repairRate) × 10 × 0.10
//
// New themes start at 5.0 (neutral, no cold-start penalty).

function computeQuality(m: ThemeMetrics): number {
  if (m._n === 0) return 5.0;
  const repairRate = m.repairCount / m._n;
  const raw =
    m.avgTokenScore   * 0.50 +
    m.avgOverallScore * 0.40 +
    (1 - Math.min(1, repairRate)) * 10 * 0.10;
  return Math.round(Math.max(0, Math.min(10, raw)) * 100) / 100;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function recordTokenThemeOutcome(outcome: TokenThemeOutcome): void {
  let m = _themeStore.get(outcome.themeId);
  if (!m) {
    m = {
      themeId:         outcome.themeId,
      usageCount:      0,
      avgTokenScore:   0,
      avgOverallScore: 0,
      successCount:    0,
      repairCount:     0,
      qualityScore:    5.0,
      _n:              0,
      _sumTokenScore:  0,
      _sumOverall:     0,
    };
    _themeStore.set(outcome.themeId, m);
  }

  m.usageCount++;
  m._n++;
  m._sumTokenScore  += outcome.tokenQualityScore;
  m._sumOverall     += outcome.overallScore;
  m.avgTokenScore   = m._sumTokenScore  / m._n;
  m.avgOverallScore = m._sumOverall     / m._n;

  if (outcome.overallScore >= 8.5) m.successCount++;
  if (outcome.repairTriggered)     m.repairCount++;

  m.qualityScore = computeQuality(m);
}

export function getTokenThemeQualityScore(themeId: string): number {
  return _themeStore.get(themeId)?.qualityScore ?? 5.0;
}

export function getTopTokenThemes(limit = 10): Array<{
  themeId:       string;
  qualityScore:  number;
  usageCount:    number;
  avgTokenScore: number;
  successRate:   number;
}> {
  return [..._themeStore.values()]
    .filter(m => m._n > 0)
    .sort((a, b) => b.qualityScore - a.qualityScore)
    .slice(0, limit)
    .map(m => ({
      themeId:       m.themeId,
      qualityScore:  m.qualityScore,
      usageCount:    m.usageCount,
      avgTokenScore: Math.round(m.avgTokenScore   * 100) / 100,
      successRate:   Math.round((m.successCount / m._n) * 1000) / 1000,
    }));
}

export function getTokenLearningMetrics() {
  const all       = [..._themeStore.values()];
  const withData  = all.filter(m => m._n > 0);
  const avgToken  = withData.length > 0
    ? Math.round(withData.reduce((s, m) => s + m.avgTokenScore, 0) / withData.length * 100) / 100
    : 0;
  const avgOverall = withData.length > 0
    ? Math.round(withData.reduce((s, m) => s + m.avgOverallScore, 0) / withData.length * 100) / 100
    : 0;

  return {
    themesTracked:    all.length,
    topThemes:        getTopTokenThemes(10),
    averageTokenScore:  avgToken,
    averageOverallScore: avgOverall,
  };
}

// ── Test helper ───────────────────────────────────────────────────────────────

export function resetTokenLearning(): void {
  _themeStore.clear();
}

export function getTokenThemeEntry(themeId: string): ThemeMetrics | undefined {
  return _themeStore.get(themeId);
}

export function getTokenThemeStoreSize(): number {
  return _themeStore.size;
}
