/**
 * V8.1 — Design DNA Manager (Facade)
 *
 * Central coordinator for all DNA operations.
 * Orchestrates registry ↔ versioning ↔ ranking ↔ persistence.
 * This is the only public surface that build pipeline code should call.
 *
 * All DNA operations are synchronous (rankings/registry) or fire-and-forget
 * async (persistence) — they never block the SSE stream.
 */

import {
  createDnaRecord,
  registerDna,
  getDna,
  updateDna,
  getTopDnaRecords,
  getRegistryStats,
  listDnas,
} from "./dnaRegistry.js";

import {
  createVersion,
  getVersionHistory,
  getRollbackSnapshot,
  getVersioningMetrics,
} from "./dnaVersioning.js";

import {
  batchUpdateRankings,
  getRankingMetrics,
  applyRankingStatus,
  getTopLayouts,
  getTopComponents,
  getTopSections,
  getTopThemes,
  getTopMotions,
  getTopTokens,
  getTopHeroStyles,
  getTopCtaStyles,
} from "./dnaRanking.js";

import {
  scheduleSave,
  incrementEvolutionCount,
  getPersistenceMetrics,
  getEvolutionCount,
} from "./dnaPersistence.js";

import {
  computeV81Quality,
  computeConfidence,
  type DesignDNARecord,
  type BuildLearningInput,
  type CriticLearningInput,
  type BenchmarkLearningInput,
  type RepairLearningInput,
  type UserFeedbackInput,
  type VisualDiffInput,
  type RuntimeLearningInput,
  type TelemetryLearningInput,
} from "./dnaTypes.js";

import { createLogger } from "../lib/structuredLogger.js";

const log = createLogger("DesignDNA");

// ── ID → brand mapping (auto-create DNA records from build outcomes) ───────────

function dnaIdFromBrand(brand: string): string {
  return `dna-${brand.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
}

function ensureDna(brand: string, industry?: string): DesignDNARecord {
  const id = dnaIdFromBrand(brand);
  let record = getDna(id);
  if (!record) {
    record = createDnaRecord({
      id,
      brand,
      industry: industry ?? "saas",
      name: `${brand} DNA`,
    });
    registerDna(record);
    log.info("DNA_AUTO_CREATED", { id, brand });
  }
  return record;
}

// ── Phase 10: Promotion / Demotion Rules ─────────────────────────────────────

interface StatusInput {
  rankingScore:      number;
  repairRate:        number;   // 0–1 fraction
  accessibilityScore: number;
  performanceScore:  number;
  visualScore:       number;
  criticSeverityHigh?: boolean;
  visualRegressionHigh?: boolean;
}

function computeDnaStatus(
  input: StatusInput,
): DesignDNARecord["status"] {
  // All 5 promotion criteria must be met simultaneously
  const promoted =
    input.rankingScore      >= 9.0 &&
    input.repairRate         < 0.15 &&
    input.accessibilityScore >= 9.0 &&
    input.performanceScore   >= 8.5 &&
    input.visualScore        >= 9.0;

  if (promoted) return "promoted";

  // Any single demotion criterion demotes
  const demoted =
    input.repairRate         > 0.50 ||
    input.accessibilityScore < 7.0  ||
    input.performanceScore   < 7.0  ||
    input.criticSeverityHigh === true ||
    input.visualRegressionHigh === true;

  if (demoted) return "demoted";
  return "active";
}

// ── Core evolution: apply a score patch and create a version ──────────────────

function evolve(
  dnaId: string,
  patch: Partial<DesignDNARecord>,
  changes: string[],
  reason: string,
): DesignDNARecord | null {
  const current = getDna(dnaId);
  if (!current) return null;

  const previousScore = current.rankingScore;
  const updated = updateDna(dnaId, patch);
  if (!updated) return null;

  createVersion(updated, changes, reason, previousScore);
  incrementEvolutionCount();
  applyRankingStatus();
  scheduleSave();

  log.info("DNA_EVOLVED", { dnaId, reason, prevScore: previousScore, newScore: updated.rankingScore });
  return updated;
}

// ── Phase 5 Learning Functions ────────────────────────────────────────────────

/** Learn from a completed build (primary learning source) */
export function learnFromBuild(input: BuildLearningInput): void {
  const record = ensureDna(input.dnaId.startsWith("dna-") ? input.dnaId.slice(4) : input.dnaId);

  const newUsage   = record.usageCount + 1;
  const newSuccess = input.success ? record.successCount + 1 : record.successCount;
  const newRepairs = input.repairTriggered ? record.repairCount + 1 : record.repairCount;
  const newFailure = input.success ? record.failureCount : record.failureCount + 1;

  // Rolling averages for each score dimension
  const n = newUsage;
  const ema = (prev: number, next: number) => Math.round(((prev * (n - 1) + next) / n) * 100) / 100;

  const newEvaluator    = ema(record.evaluatorScore,    input.evaluatorScore);
  const newCritic       = ema(record.criticScore,       input.criticScore);
  const newA11y         = ema(record.accessibilityScore, input.accessibilityScore);
  const newPerformance  = ema(record.performanceScore,  input.optimizationScore);
  const newVisual       = ema(record.visualScore,       input.visualScore);
  const newConversion   = ema(record.conversionScore,   input.conversionScore);

  const avgRepairLoops =
    (record.averageRepairLoops * (n - 1) + input.repairLoops) / n;

  const rankingScore = computeV81Quality({
    evaluatorScore:    newEvaluator,
    criticScore:       newCritic,
    accessibilityScore: newA11y,
    performanceScore:  newPerformance,
    visualScore:       newVisual,
    runtimeStability:  input.success ? 10 : 3,
    userFeedbackScore: 5, // neutral until user feedback arrives
    benchmarkScore:    5, // neutral until benchmark runs
  });

  // Phase 10 — all 5 criteria required for promotion; any one triggers demotion
  const repairRate = newUsage > 0 ? newRepairs / newUsage : 0;
  const status = computeDnaStatus({
    rankingScore,
    repairRate,
    accessibilityScore: newA11y,
    performanceScore:   newPerformance,
    visualScore:        newVisual,
  });

  evolve(
    record.id,
    {
      evaluatorScore:    newEvaluator,
      criticScore:       newCritic,
      accessibilityScore: newA11y,
      performanceScore:  newPerformance,
      visualScore:       newVisual,
      conversionScore:   newConversion,
      overallScore:      rankingScore,
      rankingScore,
      usageCount:        newUsage,
      successCount:      newSuccess,
      repairCount:       newRepairs,
      failureCount:      newFailure,
      averageRepairLoops: Math.round(avgRepairLoops * 100) / 100,
      confidence:        computeConfidence(newUsage, newSuccess),
      status,
    },
    [`evaluator:${newEvaluator}`, `critic:${newCritic}`, `a11y:${newA11y}`, `ranking:${rankingScore}`],
    `Build outcome — score ${rankingScore.toFixed(2)}`,
  );

  // Update category rankings
  batchUpdateRankings([
    { category: "heroStyles",  id: input.dnaId, score: newEvaluator,   success: input.success },
    { category: "motions",     id: input.dnaId, score: newVisual,       success: input.success },
    { category: "themes",      id: input.dnaId, score: newConversion,   success: input.success },
    { category: "layouts",     id: input.dnaId, score: rankingScore,    success: input.success },
  ]);
}

/** Learn from design critic analysis */
export function learnFromCritic(input: CriticLearningInput): void {
  const record = getDna(input.dnaId);
  if (!record) return;

  const n = Math.max(1, record.usageCount);
  const newCritic = Math.round(
    ((record.criticScore * (n - 1) + input.criticScore) / n) * 100,
  ) / 100;

  const severityPenalty = input.severity === "high" ? -0.5 : input.severity === "medium" ? -0.2 : 0;
  const repairBonus     = input.repairApplied ? 0.2 : 0;
  const adjustedCritic  = Math.max(0, Math.min(10, newCritic + severityPenalty + repairBonus));

  const newRanking = computeV81Quality({
    evaluatorScore:    record.evaluatorScore,
    criticScore:       adjustedCritic,
    accessibilityScore: record.accessibilityScore,
    performanceScore:  record.performanceScore,
    visualScore:       record.visualScore,
    runtimeStability:  5,
    userFeedbackScore: 5,
    benchmarkScore:    5,
  });

  // Phase 10: "Critic Severity High" is an independent demotion trigger
  const repairRate = record.usageCount > 0 ? record.repairCount / record.usageCount : 0;
  const statusAfterCritic = computeDnaStatus({
    rankingScore:        newRanking,
    repairRate,
    accessibilityScore:  record.accessibilityScore,
    performanceScore:    record.performanceScore,
    visualScore:         record.visualScore,
    criticSeverityHigh:  input.severity === "high",
  });

  evolve(
    input.dnaId,
    {
      criticScore:  adjustedCritic,
      rankingScore: newRanking,
      status:       statusAfterCritic,
    },
    [`critic:${adjustedCritic}`, `severity:${input.severity}`, ...input.categories.slice(0, 3)],
    `Critic feedback — ${input.severity} severity`,
  );
}

/** Learn from benchmark results */
export function learnFromBenchmark(input: BenchmarkLearningInput): void {
  const record = getDna(input.dnaId);
  if (!record) return;

  const newRankingScore = computeV81Quality({
    evaluatorScore:    record.evaluatorScore,
    criticScore:       record.criticScore,
    accessibilityScore: record.accessibilityScore,
    performanceScore:  record.performanceScore,
    visualScore:       record.visualScore,
    runtimeStability:  5,
    userFeedbackScore: 5,
    benchmarkScore:    input.benchmarkScore,
  });

  evolve(
    input.dnaId,
    { rankingScore: newRankingScore },
    [`benchmark:${input.category}`, `score:${input.benchmarkScore}`, `delta:${input.delta}`],
    `Benchmark result — ${input.category}`,
  );

  batchUpdateRankings([
    { category: "templates", id: `${input.dnaId}:${input.category}`, score: input.benchmarkScore },
  ]);
}

/** Learn from repair loops */
export function learnFromRepair(input: RepairLearningInput): void {
  const record = getDna(input.dnaId);
  if (!record) return;

  const n = Math.max(1, record.repairCount + 1);
  const avgLoops = Math.round(
    ((record.averageRepairLoops * (n - 1) + input.loopsUsed) / n) * 100,
  ) / 100;

  // High repair count degrades ranking
  const runtimeStability = input.repairSuccess
    ? Math.max(0, 10 - input.loopsUsed * 1.5)
    : 2;

  const newRepairRankingScore = computeV81Quality({
    evaluatorScore:    record.evaluatorScore,
    criticScore:       record.criticScore,
    accessibilityScore: record.accessibilityScore,
    performanceScore:  record.performanceScore,
    visualScore:       record.visualScore,
    runtimeStability,
    userFeedbackScore: 5,
    benchmarkScore:    5,
  });

  // Phase 10: re-evaluate status after each repair (repairRate > 50% triggers demotion)
  const newRepairCount = record.repairCount + 1;
  const repairRateAfterRepair = record.usageCount > 0 ? newRepairCount / record.usageCount : 0;
  const statusAfterRepair = computeDnaStatus({
    rankingScore:       newRepairRankingScore,
    repairRate:         repairRateAfterRepair,
    accessibilityScore: record.accessibilityScore,
    performanceScore:   record.performanceScore,
    visualScore:        record.visualScore,
  });

  evolve(
    input.dnaId,
    {
      repairCount:        newRepairCount,
      averageRepairLoops: avgLoops,
      rankingScore:       newRepairRankingScore,
      status:             statusAfterRepair,
    },
    [`repair:${input.errorCategory}`, `loops:${input.loopsUsed}`, `success:${input.repairSuccess}`],
    `Repair outcome — ${input.errorCategory}`,
  );
}

/** Learn from user feedback (explicit ratings / accept/edit/reject) */
export function learnFromUserFeedback(input: UserFeedbackInput): void {
  const record = getDna(input.dnaId);
  if (!record) return;

  // Normalise 1–5 rating → 0–10
  const feedbackScore = ((input.rating - 1) / 4) * 10;

  // Adjust section preferences based on edited sections
  const sectionPatch: Record<string, number> = { ...record.sectionPreferences };
  if (input.action === "edited" && input.editedSections) {
    for (const sec of input.editedSections) {
      sectionPatch[sec] = Math.max(0, (sectionPatch[sec] ?? 5) - 1);
    }
  } else if (input.action === "accepted") {
    for (const key of Object.keys(sectionPatch)) {
      sectionPatch[key] = Math.min(10, (sectionPatch[key] ?? 5) + 0.5);
    }
  }

  evolve(
    input.dnaId,
    {
      sectionPreferences: sectionPatch,
      rankingScore: computeV81Quality({
        evaluatorScore:    record.evaluatorScore,
        criticScore:       record.criticScore,
        accessibilityScore: record.accessibilityScore,
        performanceScore:  record.performanceScore,
        visualScore:       record.visualScore,
        runtimeStability:  5,
        userFeedbackScore: feedbackScore,
        benchmarkScore:    5,
      }),
    },
    [`feedback:${input.action}`, `rating:${input.rating}`],
    `User ${input.action} — rating ${input.rating}/5`,
  );
}

/** Learn from visual diff analysis */
export function learnFromVisualDiff(input: VisualDiffInput): void {
  const record = getDna(input.dnaId);
  if (!record) return;

  const regressionPenalty =
    (input.layoutRegression ? 1 : 0) + (input.spacingRegression ? 0.5 : 0);

  const adjustedVisual = Math.max(0, input.visualScore - regressionPenalty);

  const newRankingScore = computeV81Quality({
    evaluatorScore:    record.evaluatorScore,
    criticScore:       record.criticScore,
    accessibilityScore: record.accessibilityScore,
    performanceScore:  record.performanceScore,
    visualScore:       adjustedVisual,
    runtimeStability:  5,
    userFeedbackScore: 5,
    benchmarkScore:    5,
  });

  // Phase 10: "Visual Regression High" is an independent demotion trigger
  const repairRate = record.usageCount > 0 ? record.repairCount / record.usageCount : 0;
  const statusAfterVisualDiff = computeDnaStatus({
    rankingScore:        newRankingScore,
    repairRate,
    accessibilityScore:  record.accessibilityScore,
    performanceScore:    record.performanceScore,
    visualScore:         adjustedVisual,
    // layoutRegression alone triggers demotion regardless of overall score
    visualRegressionHigh: input.layoutRegression,
  });

  evolve(
    input.dnaId,
    {
      visualScore:  adjustedVisual,
      rankingScore: newRankingScore,
      status:       statusAfterVisualDiff,
    },
    [`visualDiff:${(input.pixelDiff * 100).toFixed(1)}%`, `layoutRegression:${input.layoutRegression}`],
    "Visual diff analysis",
  );
}

/** Learn from runtime build results */
export function learnFromRuntime(input: RuntimeLearningInput): void {
  const record = getDna(input.dnaId);
  if (!record) return;

  const runtimeStability = input.buildSuccess
    ? Math.max(0, 10 - input.errorCount * 1.5)
    : 2;

  evolve(
    input.dnaId,
    {
      performanceScore: Math.round(
        ((record.performanceScore * record.usageCount + input.runtimeScore) /
          Math.max(1, record.usageCount + 1)) * 100,
      ) / 100,
      rankingScore: computeV81Quality({
        evaluatorScore:    record.evaluatorScore,
        criticScore:       record.criticScore,
        accessibilityScore: record.accessibilityScore,
        performanceScore:  input.runtimeScore,
        visualScore:       record.visualScore,
        runtimeStability,
        userFeedbackScore: 5,
        benchmarkScore:    5,
      }),
    },
    [`runtime:${input.buildSuccess}`, `errors:${input.errorCount}`],
    "Runtime validation outcome",
  );
}

/** Learn from telemetry signals */
export function learnFromTelemetry(input: TelemetryLearningInput): void {
  const record = getDna(input.dnaId);
  if (!record) return;

  const trendBonus =
    input.qualityTrend === "improving" ? 0.3 :
    input.qualityTrend === "degrading" ? -0.3 : 0;

  const adjustedScore = Math.max(0, Math.min(10, record.rankingScore + trendBonus));

  evolve(
    input.dnaId,
    { rankingScore: adjustedScore },
    [`trend:${input.qualityTrend}`, `successRate:${input.successRate}`],
    "Telemetry signal update",
  );
}

// ── Rollback ──────────────────────────────────────────────────────────────────

export function rollbackDna(dnaId: string, targetVersion: number): DesignDNARecord | null {
  const snapshot = getRollbackSnapshot(dnaId, targetVersion);
  if (!snapshot) return null;

  const current = getDna(dnaId);
  const previousScore = current?.rankingScore ?? 0;

  // updateDna increments version, so set version = snapshot.version to keep lineage
  const restored = updateDna(dnaId, { ...snapshot, version: snapshot.version });
  if (restored) {
    createVersion(
      restored,
      [`rollback:v${targetVersion}`],
      `Rolled back to version ${targetVersion}`,
      previousScore,
    );
    scheduleSave();
    log.info("DNA_ROLLED_BACK", { dnaId, targetVersion });
  }
  return restored;
}

// ── Telemetry facade ──────────────────────────────────────────────────────────

export function getDNAManagerMetrics() {
  const registry = getRegistryStats();
  const versioning = getVersioningMetrics();
  const ranking = getRankingMetrics();
  const persistence = getPersistenceMetrics();

  return {
    // Phase 12 required fields
    currentVersion:    versioning.trackedDnas > 0 ? "v8.1" : "v8.1-empty",
    evolutionCount:    getEvolutionCount(),
    averageQuality:    registry.averageRankingScore,
    topLayouts:        getTopLayouts(5),
    topComponents:     getTopComponents(5),
    topSections:       getTopSections(5),
    topThemes:         getTopThemes(5),
    topMotions:        getTopMotions(5),
    topTokens:         getTopTokens(5),
    promotionCount:    registry.promotedDnas,
    demotionCount:     registry.demotedDnas,
    learningRate:      persistence.evolutionCount > 0
      ? Math.min(1, persistence.evolutionCount / 100)
      : 0,
    confidence:        registry.usedDnas > 0
      ? Math.round(listDnas().filter(r => r.usageCount > 0).reduce((s, r) => s + r.confidence, 0)
          / registry.usedDnas * 1000) / 1000
      : 0,
    lastEvolution:     persistence.lastSaveAt,

    // Extended detail
    registry,
    versioning,
    ranking,
    persistence,
    topDnaRecords:     getTopDnaRecords(10),
    versionHistory:    getVersionHistory("").length > 0 ? "available" : "empty",
  };
}

// ── Public re-exports ─────────────────────────────────────────────────────────

export {
  getDna,
  updateDna,
  listDnas,
  getTopDnaRecords,
  ensureDna,
  getVersionHistory,
  getRollbackSnapshot,
  getTopHeroStyles,
  getTopCtaStyles,
  getTopLayouts,
  getTopComponents,
  getTopSections,
  getTopThemes,
  getTopMotions,
  getTopTokens,
};
