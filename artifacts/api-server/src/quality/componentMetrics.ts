// ── V7.1.6: Component Intelligence & Quality Scoring Engine ──────────────────
// Single source of truth for per-component performance data.
// Phases 1, 3, 5, 8 in one module.

import { MAX_DURATION_SAMPLES } from "../telemetry/constants.js";

// ── Phase 1: Data model ───────────────────────────────────────────────────────

export interface ComponentMetricsRecord {
  componentId: string;
  category: string;
  usageCount: number;
  successCount: number;   // builds where repairApplied = false
  repairCount: number;    // builds where repairApplied = true
  sumDesignScore: number;
  sumAccessibilityScore: number;
  sumOverallScore: number;
  lastUsedAt: number;
  deprecated: boolean;
}

export interface ComponentQualitySnapshot {
  componentId: string;
  category: string;
  usageCount: number;
  successRate: number;
  repairRate: number;
  averageDesignScore: number;
  averageAccessibilityScore: number;
  averageOverallScore: number;
  qualityScore: number; // 0–10 composite
  deprecated: boolean;
  lastUsedAt: number;
}

export interface ComponentBuildInput {
  componentsUsed: Array<{ componentId: string; category: string }>;
  overallScore: number;
  designScore: number;
  accessibilityScore: number;
  repairApplied: boolean;
}

// ── Internal store ────────────────────────────────────────────────────────────

const store = new Map<string, ComponentMetricsRecord>();
const recentBuildIds: string[] = []; // capped log for idempotency guard

// ── Phase 3: Quality Score formula ───────────────────────────────────────────
// 40% Design Score + 25% Accessibility Score + 20% Success Rate + 15% Low Repair Rate
// All sub-scores on 0–10 scale.

export function computeQualityScore(rec: ComponentMetricsRecord): number {
  if (rec.usageCount === 0) return 5.0;
  const n = rec.usageCount;
  const design   = rec.sumDesignScore / n;         // 0–10
  const a11y     = rec.sumAccessibilityScore / n;  // 0–10
  const succRate = rec.successCount / n;           // 0–1
  const repRate  = rec.repairCount / n;            // 0–1
  const raw = design * 0.40 + a11y * 0.25 + (succRate * 10) * 0.20 + ((1 - repRate) * 10) * 0.15;
  return Math.round(Math.min(10, Math.max(0, raw)) * 100) / 100;
}

// ── Phase 8: Auto-deprecation ─────────────────────────────────────────────────
// repairRate > 50% AND qualityScore < 6 → deprecated = true

function checkDeprecation(rec: ComponentMetricsRecord): void {
  if (rec.usageCount < 3) return; // need enough data before deprecating
  const repairRate = rec.repairCount / rec.usageCount;
  const qs = computeQualityScore(rec);
  if (repairRate > 0.5 && qs < 6) {
    rec.deprecated = true;
  } else if (repairRate <= 0.3 && qs >= 7) {
    rec.deprecated = false; // rehabilitate if quality improves
  }
}

// ── Phase 2 hook: record per-component result after evaluation ────────────────

export function recordComponentBuildResult(input: ComponentBuildInput): void {
  const { componentsUsed, overallScore, designScore, accessibilityScore, repairApplied } = input;
  const now = Date.now();

  for (const { componentId, category } of componentsUsed) {
    if (!componentId) continue;
    const existing = store.get(componentId);
    if (existing) {
      existing.usageCount++;
      existing.sumDesignScore += designScore;
      existing.sumAccessibilityScore += accessibilityScore;
      existing.sumOverallScore += overallScore;
      existing.lastUsedAt = now;
      if (repairApplied) {
        existing.repairCount++;
      } else {
        existing.successCount++;
      }
      checkDeprecation(existing);
    } else {
      const rec: ComponentMetricsRecord = {
        componentId,
        category,
        usageCount: 1,
        successCount: repairApplied ? 0 : 1,
        repairCount: repairApplied ? 1 : 0,
        sumDesignScore: designScore,
        sumAccessibilityScore: accessibilityScore,
        sumOverallScore: overallScore,
        lastUsedAt: now,
        deprecated: false,
      };
      store.set(componentId, rec);
    }
  }
}

// ── Phase 5: Category Rankings ───────────────────────────────────────────────

export function getCategoryRanking(category: string): ComponentQualitySnapshot[] {
  return [...store.values()]
    .filter(r => r.category === category)
    .map(r => toSnapshot(r))
    .sort((a, b) => b.qualityScore - a.qualityScore);
}

export function getAllRankings(): Record<string, ComponentQualitySnapshot[]> {
  const categories = new Set([...store.values()].map(r => r.category));
  const result: Record<string, ComponentQualitySnapshot[]> = {};
  for (const cat of categories) {
    result[cat] = getCategoryRanking(cat);
  }
  return result;
}

// ── Phase 4: Planner intelligence helpers ────────────────────────────────────

export function isComponentDeprecated(componentId: string): boolean {
  return store.get(componentId)?.deprecated ?? false;
}

export function getBestAlternativeInCategory(
  category: string,
  excludeComponentId: string
): string | null {
  const ranked = getCategoryRanking(category)
    .filter(s => s.componentId !== excludeComponentId && !s.deprecated);
  return ranked[0]?.componentId ?? null;
}

export function getQualityScore(componentId: string): number {
  const rec = store.get(componentId);
  return rec ? computeQualityScore(rec) : 5.0;
}

// ── Snapshot helpers ─────────────────────────────────────────────────────────

function toSnapshot(rec: ComponentMetricsRecord): ComponentQualitySnapshot {
  const n = rec.usageCount;
  return {
    componentId: rec.componentId,
    category: rec.category,
    usageCount: n,
    successRate: n > 0 ? Math.round((rec.successCount / n) * 1000) / 1000 : 1,
    repairRate: n > 0 ? Math.round((rec.repairCount / n) * 1000) / 1000 : 0,
    averageDesignScore: n > 0 ? Math.round((rec.sumDesignScore / n) * 100) / 100 : 5,
    averageAccessibilityScore: n > 0 ? Math.round((rec.sumAccessibilityScore / n) * 100) / 100 : 5,
    averageOverallScore: n > 0 ? Math.round((rec.sumOverallScore / n) * 100) / 100 : 5,
    qualityScore: computeQualityScore(rec),
    deprecated: rec.deprecated,
    lastUsedAt: rec.lastUsedAt,
  };
}

// ── Phase 7: Telemetry export ─────────────────────────────────────────────────

export function getComponentQualityMetrics() {
  const all = [...store.values()].map(toSnapshot);

  const sorted = [...all].sort((a, b) => b.qualityScore - a.qualityScore);
  const byRepairRate = [...all]
    .filter(s => s.usageCount >= 2)
    .sort((a, b) => b.repairRate - a.repairRate);

  const topComponents     = sorted.filter(s => !s.deprecated).slice(0, 10);
  const worstComponents   = [...sorted].reverse().filter(s => !s.deprecated).slice(0, 10);
  const mostRepaired      = byRepairRate.slice(0, 10);
  const leastRepaired     = [...byRepairRate].reverse().slice(0, 10);
  const deprecatedList    = all.filter(s => s.deprecated);
  const categoryRankings  = getAllRankings();

  return {
    totalTracked: store.size,
    totalDeprecated: deprecatedList.length,
    topComponents,
    worstComponents,
    mostRepaired,
    leastRepaired,
    deprecated: deprecatedList,
    categoryRankings,
  };
}

// ── Reset (for tests) ─────────────────────────────────────────────────────────

export function resetComponentMetrics(): void {
  store.clear();
  recentBuildIds.length = 0;
}

// ── Raw store access (for tests) ──────────────────────────────────────────────

export function getComponentRecord(componentId: string): ComponentMetricsRecord | undefined {
  return store.get(componentId);
}

export function getAllComponentRecords(): ComponentMetricsRecord[] {
  return [...store.values()];
}
