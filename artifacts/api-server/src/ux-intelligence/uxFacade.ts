/**
 * V8.2 — UX Intelligence Facade
 *
 * The only public surface that pipeline and telemetry code should call.
 * Coordinates: prediction → metrics → ranking → learning → persistence.
 */

import { predictUX } from "./uxPrediction.js";
import {
  learnFromBuildOutcome,
  learnFromRepair,
  learnFromUserFeedback,
  learnFromBenchmark,
  learnFromVisualDiff,
  getLearningTrend,
  getLearningMetrics,
} from "./uxLearning.js";
import {
  recordUXPrediction,
  getUXQualitySnapshot,
  getTotalPredictions,
  getUXDimAverages,
} from "./uxMetrics.js";
import {
  addUXRecord,
  getRecentRecords,
  getRecordCount,
  initUXPersistence,
  getUXPersistenceMetrics,
} from "./uxPersistence.js";
import {
  recordUXPattern,
  getTopPatterns,
  getLowestPatterns,
  getRankingMetrics,
} from "./uxRanking.js";
import type {
  UXPredictionResult,
  UXBuildLearningInput,
  UXFeedbackInput,
  UXBenchmarkInput,
  UXVisualDiffInput,
  UXQualitySnapshot,
} from "./uxTypes.js";
import { createLogger } from "../lib/structuredLogger.js";

const log = createLogger("UxFacade");

// ── Core prediction ───────────────────────────────────────────────────────────

export function runUXPrediction(
  code: string,
  buildId: string,
): UXPredictionResult {
  const result = predictUX(code, { totalPriorPredictions: getTotalPredictions() });

  // Record in metrics store
  recordUXPrediction(result);

  // Record in persistence (non-blocking)
  addUXRecord(buildId, result);

  // Record dominant UX patterns for ranking
  recordUXPattern(
    "ux-overall",
    buildId,
    `Build ${buildId.slice(0, 8)}`,
    result.overallUXScore,
    result.conversionPrediction.level,
    result.overallUXScore >= 7.0,
  );
  // Record CTA/trust patterns specifically
  if (result.dimensions.ctaDiscoverability > 0) {
    recordUXPattern(
      "cta",
      `cta-${Math.round(result.dimensions.ctaDiscoverability)}`,
      `CTA score ${result.dimensions.ctaDiscoverability}`,
      result.dimensions.ctaDiscoverability,
      result.conversionPrediction.level,
      result.dimensions.ctaDiscoverability >= 7,
    );
  }
  if (result.dimensions.trust > 0) {
    recordUXPattern(
      "trust",
      `trust-${Math.round(result.dimensions.trust)}`,
      `Trust score ${result.dimensions.trust}`,
      result.dimensions.trust,
      result.conversionPrediction.level,
      result.dimensions.trust >= 7,
    );
  }

  log.info("UX_PREDICTION_COMPLETE", {
    buildId,
    overallUXScore: result.overallUXScore,
    conversionLevel: result.conversionPrediction.level,
    issueCount: result.issues.length,
  });

  return result;
}

// ── Phase 5: DNA integration learning hook ────────────────────────────────────
// Called by designDNA.ts learnFromUX() — exposed here for clarity

export function notifyDNAOfUXOutcome(dnaId: string, uxScore: number): void {
  // learnFromUX in designDNA.ts is wired to call this
  // The actual DNA update happens inside designDNA.ts
  log.info("UX_DNA_NOTIFIED", { dnaId, uxScore });
}

// ── Phase 11: Learning API ────────────────────────────────────────────────────

export {
  learnFromBuildOutcome as uxLearnFromBuildOutcome,
  learnFromRepair as uxLearnFromRepair,
  learnFromUserFeedback as uxLearnFromFeedback,
  learnFromBenchmark as uxLearnFromBenchmark,
  learnFromVisualDiff as uxLearnFromVisualDiff,
};

// ── Phase 9: Telemetry ────────────────────────────────────────────────────────

export function getFullUXMetrics(): UXQualitySnapshot & {
  learning: ReturnType<typeof getLearningMetrics>;
  persistence: ReturnType<typeof getUXPersistenceMetrics>;
  ranking: ReturnType<typeof getRankingMetrics>;
  dimAverages: ReturnType<typeof getUXDimAverages>;
  recentRecords: ReturnType<typeof getRecentRecords>;
} {
  const snapshot = getUXQualitySnapshot();

  // Enrich with ranking data
  const topPatterns    = getTopPatterns(5).map(p => p.label);
  const lowestPatterns = getLowestPatterns(5).map(p => p.label);

  return {
    ...snapshot,
    topPerformingPatterns: topPatterns,
    lowestPatterns,
    learningTrend:         getLearningTrend(),
    learning:              getLearningMetrics(),
    persistence:           getUXPersistenceMetrics(),
    ranking:               getRankingMetrics(),
    dimAverages:           getUXDimAverages(),
    recentRecords:         getRecentRecords(10),
  };
}

// ── Startup ───────────────────────────────────────────────────────────────────

export { initUXPersistence };

// ── UX issue summary for critic context (Phase 7) ─────────────────────────────

export function buildUXCriticContext(result: UXPredictionResult): string {
  if (result.issues.length === 0) return "";

  const lines = [
    `/* UX INTELLIGENCE REPORT (V8.2):`,
    `Overall UX Score: ${result.overallUXScore}/10 | Conversion: ${result.conversionPrediction.level.replace("_", " ")}`,
    `Bounce Risk: ${result.conversionPrediction.expectedBounceRisk.replace("_", " ")} | ` +
    `CTA Interaction: ${(result.conversionPrediction.expectedCTAInteraction * 100).toFixed(0)}%`,
    ``,
    `UX Issues (${result.issues.length}) — address in next repair pass:`,
  ];

  for (const issue of result.issues.slice(0, 6)) {
    lines.push(`  [${issue.severity.toUpperCase()}] ${issue.message}`);
    lines.push(`    → ${issue.recommendation}`);
  }

  if (result.topInsights.length > 0) {
    lines.push(``, `Key UX Insights:`);
    for (const insight of result.topInsights.slice(0, 3)) {
      lines.push(`  • ${insight}`);
    }
  }

  lines.push(`*/`);
  return lines.join('\n');
}

// ── Re-exports for pipeline types ─────────────────────────────────────────────

export type { UXPredictionResult, UXBuildLearningInput, UXFeedbackInput, UXBenchmarkInput, UXVisualDiffInput };
