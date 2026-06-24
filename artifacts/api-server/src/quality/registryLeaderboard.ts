// V7.3.1 — Premium Registry Leaderboard
// Phase 9: Per-template usage tracking + combined score ranking.
// Exposes top-20 templates and telemetry via getPremiumRegistryQuality().

import {
  qualityRegistryScore,
  recordRegistryQuality,
  getAllRegistryQualityRecords,
  getAverageRegistryQuality,
  type RegistryQualityBreakdown,
} from './registryQuality.js';
import { COMPONENT_TEMPLATES } from '../components/registry.js';
import { SECTION_TEMPLATES } from '../components/section-templates.js';
import { DIVERSITY_TEMPLATES } from '../components/diversity-templates.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  templateId: string;
  category: string;
  name: string;
  registryQualityScore: number;
  breakdown: RegistryQualityBreakdown;
  usageCount: number;
  repairCount: number;
  repairRate: number;       // 0–1
  avgEvaluatorScore: number; // 0–10
  combinedScore: number;    // final weighted rank score (0–10)
}

interface RuntimeEntry {
  usageCount: number;
  repairCount: number;
  sumEvaluatorScore: number;
}

// ── Internal stores ───────────────────────────────────────────────────────────

const runtimeStore = new Map<string, RuntimeEntry>();
let leaderboardInitialized = false;

// ── Init: seed from COMPONENT_TEMPLATES at startup ───────────────────────────

export function initLeaderboard(templates: Array<{
  id: string; name: string; category: string; standaloneCode: string;
}>): void {
  for (const t of templates) {
    recordRegistryQuality(t.id, t.category, t.name, t.standaloneCode);
    if (!runtimeStore.has(t.id)) {
      runtimeStore.set(t.id, { usageCount: 0, repairCount: 0, sumEvaluatorScore: 0 });
    }
  }
  leaderboardInitialized = true;
}

// ── Runtime: record when a build uses a template ─────────────────────────────

export function recordTemplateUsage(
  templateId: string,
  evaluatorScore: number,
  repairApplied: boolean,
): void {
  const entry = runtimeStore.get(templateId) ?? { usageCount: 0, repairCount: 0, sumEvaluatorScore: 0 };
  entry.usageCount++;
  entry.sumEvaluatorScore += Math.max(0, Math.min(10, evaluatorScore));
  if (repairApplied) entry.repairCount++;
  runtimeStore.set(templateId, entry);
}

// ── Combined score ─────────────────────────────────────────────────────────

function computeCombinedScore(
  registryQuality: number,
  avgEvaluatorScore: number,
  repairRate: number,
  usageCount: number,
): number {
  // 50% static quality, 30% evaluator performance, 20% low repair rate
  // New templates (usageCount === 0) score purely on static quality
  if (usageCount === 0) return registryQuality;
  const raw =
    registryQuality    * 0.50 +
    avgEvaluatorScore  * 0.30 +
    (1 - repairRate) * 10 * 0.20;
  return Math.round(Math.min(10, Math.max(0, raw)) * 10) / 10;
}

// ── Leaderboard export ────────────────────────────────────────────────────────

export function getLeaderboard(topN = 20): LeaderboardEntry[] {
  const qualityRecords = getAllRegistryQualityRecords();

  const entries: Omit<LeaderboardEntry, 'rank'>[] = qualityRecords.map(qr => {
    const rt = runtimeStore.get(qr.templateId) ?? { usageCount: 0, repairCount: 0, sumEvaluatorScore: 0 };
    const repairRate = rt.usageCount > 0 ? rt.repairCount / rt.usageCount : 0;
    const avgEvaluatorScore = rt.usageCount > 0 ? rt.sumEvaluatorScore / rt.usageCount : qr.breakdown.overallScore;
    const combinedScore = computeCombinedScore(qr.breakdown.overallScore, avgEvaluatorScore, repairRate, rt.usageCount);
    return {
      templateId: qr.templateId,
      category: qr.category,
      name: qr.name,
      registryQualityScore: qr.breakdown.overallScore,
      breakdown: qr.breakdown,
      usageCount: rt.usageCount,
      repairCount: rt.repairCount,
      repairRate: Math.round(repairRate * 1000) / 1000,
      avgEvaluatorScore: Math.round(avgEvaluatorScore * 10) / 10,
      combinedScore,
    };
  });

  entries.sort((a, b) => b.combinedScore - a.combinedScore);

  return entries.slice(0, topN).map((e, i) => ({ rank: i + 1, ...e }));
}

// ── Category breakdown ────────────────────────────────────────────────────────

export function getLeaderboardByCategory(): Record<string, LeaderboardEntry[]> {
  const full = getLeaderboard(200);
  const result: Record<string, LeaderboardEntry[]> = {};
  for (const entry of full) {
    if (!result[entry.category]) result[entry.category] = [];
    result[entry.category].push(entry);
  }
  return result;
}

// ── Telemetry export ─────────────────────────────────────────────────────────

export function getPremiumRegistryQuality() {
  const top20 = getLeaderboard(20);
  const all   = getLeaderboard(200);

  const avgRegistryScore    = getAverageRegistryQuality();
  const avgCombinedScore    = all.length > 0
    ? Math.round((all.reduce((s, e) => s + e.combinedScore, 0) / all.length) * 10) / 10
    : 0;

  const templateCount       = all.length;
  const usedCount           = all.filter(e => e.usageCount > 0).length;
  const highQualityCount    = all.filter(e => e.registryQualityScore >= 7).length;

  const byCategory          = getLeaderboardByCategory();
  const categoryAverages    = Object.fromEntries(
    Object.entries(byCategory).map(([cat, entries]) => [
      cat,
      {
        count: entries.length,
        avgScore: entries.length > 0
          ? Math.round((entries.reduce((s, e) => s + e.combinedScore, 0) / entries.length) * 10) / 10
          : 0,
        bestTemplate: entries[0]?.templateId ?? null,
      },
    ])
  );

  return {
    initialized: leaderboardInitialized,
    templateCount,
    usedCount,
    highQualityCount,
    averages: {
      registryQualityScore: avgRegistryScore,
      combinedScore: avgCombinedScore,
    },
    top20,
    categoryAverages,
  };
}

// ── Auto-init at module load ──────────────────────────────────────────────────

(function autoInit() {
  const allTemplates = [
    ...COMPONENT_TEMPLATES,
    ...SECTION_TEMPLATES,
    ...DIVERSITY_TEMPLATES,
  ];
  initLeaderboard(allTemplates);
})();

// ── Reset (for tests) ─────────────────────────────────────────────────────────

export function resetLeaderboard(): void {
  runtimeStore.clear();
  leaderboardInitialized = false;
}
