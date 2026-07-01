/**
 * V8.2 — UX Intelligence & Conversion Prediction Step
 *
 * Pipeline position: After Repair (step 6), before Design Evaluator (step 7).
 *
 * Runs static UX heuristic analysis on the repaired code.
 * Outputs UXPredictionResult attached to FrontendOutput.
 * Never blocks SSE — fires synchronously then attaches result.
 */

import type { Response } from "express";
import { sse } from "../streaming/sseManager.js";
import { runUXPrediction } from "../../ux-intelligence/uxFacade.js";
import type { UXPredictionResult } from "../../ux-intelligence/uxTypes.js";
import type { FrontendOutput, PipelineKeys } from "./pipelineTypes.js";
import { createLogger } from "../../lib/structuredLogger.js";

const log = createLogger("UXIntelligenceStep");

// ── Output type ───────────────────────────────────────────────────────────────

export interface UXIntelligenceStepOutput extends FrontendOutput {
  uxPredictionResult: UXPredictionResult;
}

// ── Step ──────────────────────────────────────────────────────────────────────

export async function runUXIntelligenceStep(
  frontend: FrontendOutput,
  _keys: PipelineKeys,
  res: Response,
): Promise<UXIntelligenceStepOutput> {
  const buildId = (frontend as unknown as Record<string, unknown>).buildId as string
    ?? `ux-${Date.now()}`;

  sse(res, { type: "ux_intelligence_start", agent: "UX Intelligence" });

  let uxPredictionResult: UXPredictionResult;

  try {
    uxPredictionResult = runUXPrediction(frontend.fixedCode, buildId);

    log.info("UX_INTELLIGENCE_COMPLETE", {
      buildId,
      overallUXScore:  uxPredictionResult.overallUXScore,
      conversionLevel: uxPredictionResult.conversionPrediction.level,
      issueCount:      uxPredictionResult.issues.length,
      confidence:      uxPredictionResult.confidence,
    });
  } catch (err) {
    // UX prediction must never break the pipeline
    log.warn("UX_INTELLIGENCE_FAILED", { buildId, error: String(err) });
    uxPredictionResult = _buildFallbackResult();
  }

  sse(res, {
    type:             "ux_intelligence_done",
    overallUXScore:   uxPredictionResult.overallUXScore,
    conversionLevel:  uxPredictionResult.conversionPrediction.level,
    confidence:       uxPredictionResult.confidence,
    topIssues:        uxPredictionResult.issues.slice(0, 3).map(i => i.message),
    topInsights:      uxPredictionResult.topInsights.slice(0, 3),
  });

  return {
    ...frontend,
    uxPredictionResult,
  };
}

// ── Fallback result (used when analysis fails) ────────────────────────────────

function _buildFallbackResult(): UXPredictionResult {
  const neutral = 5.0;
  const dims = {
    visualClarity: neutral, cognitiveLoad: neutral, ctaDiscoverability: neutral,
    readingFlow: neutral, trust: neutral, scanningEfficiency: neutral,
    navigationSimplicity: neutral, formFriction: neutral, pricingClarity: neutral,
    dashboardUsability: neutral, informationDensity: neutral, whitespaceBalance: neutral,
    hierarchy: neutral, accessibilityConfidence: neutral, motionComfort: neutral,
    perceivedPerformance: neutral, overallConversionProbability: neutral,
  };

  return {
    dimensions:      dims,
    overallUXScore:  neutral,
    conversionPrediction: {
      level:                  "medium",
      expectedBounceRisk:     "medium",
      expectedEngagement:     "medium",
      expectedScrollDepth:    0.5,
      expectedCTAInteraction: 0.5,
      expectedFormCompletion: 0,
      expectedTrustLevel:     neutral,
    },
    confidence:   0,
    issues:       [],
    topInsights:  ["UX analysis unavailable (analysis error)"],
    analyzedAt:   new Date().toISOString(),
  };
}
