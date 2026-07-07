// ── V8.3 Autonomous AI Design Director — Pipeline Step ────────────────────────
// Sits between Optimization (step 11) and Backend (step 12).
// Runs all 25 strategic review categories — fast static analysis, no LLM.
// Emits SSE: director_start / director_review / director_complete / director_learning.

import type { Response } from "express";
import { sse } from "../streaming/sseManager.js";
import { runDesignDirector, buildCategoryScoreMap } from "../../design-director/designDirector.js";
import { learnFromDirector } from "../../design-director/directorLearning.js";
import { recordDirectorRun } from "../../design-director/directorMetrics.js";
import type { DirectorReview } from "../../design-director/directorTypes.js";
import type { UXReport } from "../../ux-intelligence/uxTypes.js";
import type { EvaluatorResult } from "./designEvaluatorStep.js";
import type { CritiqueReport } from "../designCritic/designCritic.js";
import type { ConversionReport } from "../conversion/conversionAnalyzer.js";
import { createLogger } from "../../lib/structuredLogger.js";

const log = createLogger("DesignDirectorStep");

// ── Output type (additive — extends prior output) ────────────────────────────

export interface DirectorStepOutput {
  directorReview: DirectorReview;
  directorScore:  number;
}

// ── Step ──────────────────────────────────────────────────────────────────────

export async function runDesignDirectorStep<T extends object>(
  optimized: T,
  buildId:   string,
  res:       Response,
): Promise<T & DirectorStepOutput> {
  const o = optimized as Record<string, unknown>;

  // Extract all available quality signals from prior steps
  const fixedCode    = (o.fixedCode    as string)  ?? '';
  const architecture = o.architecture  as Record<string, unknown> | undefined;
  const plan         = (architecture?.plan as Record<string, unknown>) ?? {};
  const blueprint    = (plan.blueprint as Record<string, unknown>) ?? {};
  const sectionOrder = (blueprint.sectionOrder as string[]) ?? [];
  const dnaComp      = plan.dnaComposition as Record<string, number> | undefined;
  const dnaTheme     = (plan.dnaTheme  as Record<string, unknown> | null) ?? null;
  const dnaMotion    = (plan.dnaMotion as Record<string, unknown> | null) ?? null;
  const authState    = (plan.authState as string) ?? 'guest';

  const primaryBrand = dnaComp
    ? (Object.entries(dnaComp).sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'generic')
    : 'generic';

  // Gather evaluator signals
  const evalResult = o.evaluationResult as EvaluatorResult | undefined;
  const critiqueReport = o.critiqueReport as CritiqueReport | undefined;
  const conversionReport = o.conversionReport as ConversionReport | undefined;
  const uxReport = o.uxReport as UXReport | undefined;

  const accessibilityResult = o.accessibilityResult as { overallScore?: number } | undefined;
  const optimizationResult  = o.optimizationResult  as { overallScore?: number } | undefined;

  sse(res, { type: "director_start", agent: "Design Director" });

  log.info("DIRECTOR_START", {
    buildId,
    sectionCount: sectionOrder.length,
    dnaId: primaryBrand,
    codeLength: fixedCode.length,
  });

  const isDashboard = sectionOrder.some(s => /dashboard|analytics|overview/i.test(s));
  const isForm      = sectionOrder.some(s => /form|signup|login|register|contact/i.test(s));
  const hasPricing  = sectionOrder.some(s => /pricing|plans?|tier/i.test(s));

  // Build critic issues list from CritiqueReport
  const criticIssues = critiqueReport?.issues?.slice(0, 5).map(i =>
    typeof i === 'object' && 'description' in i ? (i as { description: string }).description : String(i)
  ) ?? [];

  let directorReview: DirectorReview;
  try {
    directorReview = runDesignDirector({
      code:                  fixedCode,
      sectionOrder,
      dnaId:                 primaryBrand,
      dnaTheme,
      dnaMotion,
      uxScore:               uxReport?.overallUXScore,
      uxTopIssues:           uxReport?.topIssues,
      conversionPrediction:  uxReport?.conversionPrediction,
      criticScore:           critiqueReport?.criticScore,
      criticIssues,
      evaluatorScore:        evalResult?.overallScore,
      visualScore:           evalResult?.visualQualityScore,
      accessibilityScore:    evalResult?.accessibilityScore ?? accessibilityResult?.overallScore,
      motionScore:           evalResult?.motionScore,
      tokenScore:            evalResult?.tokenQualityScore,
      treeScore:             evalResult?.treeQualityScore,
      isDashboard,
      isForm,
      hasPricing,
      authState,
    });
  } catch (err) {
    // Director failure must NEVER break the SSE stream — return neutral review
    log.warn("DIRECTOR_REVIEW_FAILED_FALLBACK", { buildId, error: String(err) });
    directorReview = {
      overallScore: 7.0,
      categoryReviews: [],
      topRecommendations: [],
      criticalIssues: [],
      mostImprovedCategories: [],
      mostCommonProblems: [],
      creativeDirection: 'Design Director analysis unavailable — falling back to neutral score.',
      confidence: 0,
    };
  }

  log.info("DIRECTOR_REVIEW_COMPLETE", {
    buildId,
    overallScore:      directorReview.overallScore,
    criticalCount:     directorReview.criticalIssues.length,
    topRecommendation: directorReview.topRecommendations[0] ?? 'none',
    confidence:        directorReview.confidence,
  });

  // ── SSE: director_review ─────────────────────────────────────────────────────
  sse(res, {
    type:              "director_review",
    overallScore:      directorReview.overallScore,
    criticalIssues:    directorReview.criticalIssues.slice(0, 3),
    topRecommendations: directorReview.topRecommendations.slice(0, 3),
    creativeDirection: directorReview.creativeDirection,
    confidence:        directorReview.confidence,
    categoryCount:     directorReview.categoryReviews.length,
  });

  // ── SSE: director_complete ───────────────────────────────────────────────────
  sse(res, {
    type:              "director_complete",
    overallScore:      directorReview.overallScore,
    mostCommonProblems: directorReview.mostCommonProblems.slice(0, 3),
  });

  // ── Telemetry (non-blocking) ──────────────────────────────────────────────────
  try {
    recordDirectorRun({
      buildId,
      directorReview,
      dnaId: primaryBrand,
    });
  } catch { /* telemetry must never throw */ }

  // ── Fire-and-forget learning ───────────────────────────────────────────────────
  setImmediate(() => {
    try {
      learnFromDirector({
        buildId,
        directorReview,
        dnaId:          primaryBrand,
        evaluatorScore: evalResult?.overallScore,
      });

      sse(res, {
        type:           "director_learning",
        buildId,
        overallScore:   directorReview.overallScore,
        dnaId:          primaryBrand,
        improved:       directorReview.overallScore >= 7.0 && directorReview.criticalIssues.length === 0,
      });
    } catch { /* learning must never throw into the pipeline */ }
  });

  return {
    ...optimized,
    directorReview,
    directorScore: directorReview.overallScore,
  };
}
