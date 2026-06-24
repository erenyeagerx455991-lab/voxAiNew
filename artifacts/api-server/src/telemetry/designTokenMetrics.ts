// ── V7.3.3 Design Token Metrics ───────────────────────────────────────────────
// Tracks token usage, violations, and theme distribution across builds.

interface TokenBuildRecord {
  themeId:             string;
  mode:                string;
  dna:                 string;
  tokenQualityScore:   number;
  hardcodedColorCount: number;
  hardcodedRadiusCount: number;
  hardcodedShadowCount: number;
  violationCount:      number;
  usedCSSVariables:    boolean;
}

interface DesignTokenMetrics {
  totalBuilds:            number;
  averageTokenScore:      number;
  tokenViolations:        number;
  hardcodedColorUsage:    number;
  hardcodedRadiusUsage:   number;
  hardcodedShadowUsage:   number;
  cssVariableAdoptionRate: number;
  themeDistribution:      Record<string, number>;
  modeDistribution:       Record<string, number>;
  mostUsedTheme:          string;
  leastUsedTheme:         string;
  violationTrend:         number;
}

// ── In-memory store ───────────────────────────────────────────────────────────

const buildRecords: TokenBuildRecord[] = [];

// ── Record a build ────────────────────────────────────────────────────────────

export function recordTokenBuild(record: TokenBuildRecord): void {
  buildRecords.push(record);
  // Cap at 500
  if (buildRecords.length > 500) buildRecords.splice(0, buildRecords.length - 500);
}

// ── Metrics snapshot ──────────────────────────────────────────────────────────

export function getDesignTokenMetrics(): DesignTokenMetrics {
  if (buildRecords.length === 0) {
    return {
      totalBuilds:             0,
      averageTokenScore:       0,
      tokenViolations:         0,
      hardcodedColorUsage:     0,
      hardcodedRadiusUsage:    0,
      hardcodedShadowUsage:    0,
      cssVariableAdoptionRate: 0,
      themeDistribution:       {},
      modeDistribution:        {},
      mostUsedTheme:           '',
      leastUsedTheme:          '',
      violationTrend:          0,
    };
  }

  const n = buildRecords.length;
  const avgScore = buildRecords.reduce((s, r) => s + r.tokenQualityScore, 0) / n;
  const totalViolations    = buildRecords.reduce((s, r) => s + r.violationCount, 0);
  const totalColorViolations  = buildRecords.reduce((s, r) => s + r.hardcodedColorCount, 0);
  const totalRadiusViolations = buildRecords.reduce((s, r) => s + r.hardcodedRadiusCount, 0);
  const totalShadowViolations = buildRecords.reduce((s, r) => s + r.hardcodedShadowCount, 0);
  const cssAdoptionCount = buildRecords.filter(r => r.usedCSSVariables).length;

  const themeDist: Record<string, number> = {};
  const modeDist: Record<string, number> = {};
  for (const r of buildRecords) {
    themeDist[r.themeId] = (themeDist[r.themeId] ?? 0) + 1;
    modeDist[r.mode]     = (modeDist[r.mode]     ?? 0) + 1;
  }

  const themeEntries = Object.entries(themeDist).sort(([, a], [, b]) => b - a);
  const mostUsed  = themeEntries[0]?.[0] ?? '';
  const leastUsed = themeEntries[themeEntries.length - 1]?.[0] ?? '';

  // Violation trend: compare last 10 vs prev 10
  let violationTrend = 0;
  if (n >= 20) {
    const last10  = buildRecords.slice(-10).reduce((s, r) => s + r.violationCount, 0) / 10;
    const prev10  = buildRecords.slice(-20, -10).reduce((s, r) => s + r.violationCount, 0) / 10;
    violationTrend = Math.round((last10 - prev10) * 10) / 10;
  }

  return {
    totalBuilds:             n,
    averageTokenScore:       Math.round(avgScore * 10) / 10,
    tokenViolations:         totalViolations,
    hardcodedColorUsage:     totalColorViolations,
    hardcodedRadiusUsage:    totalRadiusViolations,
    hardcodedShadowUsage:    totalShadowViolations,
    cssVariableAdoptionRate: Math.round((cssAdoptionCount / n) * 100) / 100,
    themeDistribution:       themeDist,
    modeDistribution:        modeDist,
    mostUsedTheme:           mostUsed,
    leastUsedTheme:          leastUsed,
    violationTrend,
  };
}

export function resetDesignTokenMetrics(): void {
  buildRecords.length = 0;
}
