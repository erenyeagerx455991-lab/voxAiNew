// ── V8.2 UX Intelligence Pipeline Step ───────────────────────────────────────
// Sits between Repair (step 6) and Design Evaluator (step 7).
// Runs static UX analysis — no LLM, no blocking I/O — always fast.
// Emits SSE events: ux_intelligence_start / ux_intelligence_result.

import type { Response } from "express";
import { sse } from "../streaming/sseManager.js";
import { predictUX } from "../../ux-intelligence/uxPrediction.js";
import { learnFromUX } from "../../ux-intelligence/uxLearning.js";
import { recordUXRun } from "../../ux-intelligence/uxMetrics.js";
import type { UXReport } from "../../ux-intelligence/uxTypes.js";
import type { FrontendOutput } from "./pipelineTypes.js";
import { createLogger } from "../../lib/structuredLogger.js";

const log = createLogger("UXIntelligenceStep");

// ── Output type (extends FrontendOutput additively) ───────────────────────────

export interface UXStepOutput extends FrontendOutput {
  uxReport: UXReport;
}

// ── Step ──────────────────────────────────────────────────────────────────────

export async function runUXIntelligenceStep(
  repaired: FrontendOutput,
  buildId: string,
  res: Response,
): Promise<UXStepOutput> {
  const { fixedCode, architecture } = repaired;
  const { plan } = architecture;
  const { blueprint } = plan;
  const sectionOrder = blueprint?.sectionOrder ?? [];
  const authState    = plan.authState ?? "guest";

  sse(res, { type: "ux_intelligence_start", agent: "UX Intelligence" });

  log.info("UX_INTELLIGENCE_START", {
    buildId,
    sectionCount: sectionOrder.length,
    authState,
    codeLength: fixedCode.length,
  });

  const isDashboard = sectionOrder.some(s => /dashboard|analytics|overview/i.test(s));
  const isForm      = sectionOrder.some(s => /form|signup|login|register|contact/i.test(s));
  const hasPricing  = sectionOrder.some(s => /pricing|plans?|tier/i.test(s));

  let uxReport: UXReport;
  try {
    uxReport = predictUX({
      code: fixedCode,
      sectionOrder,
      authState,
      isDashboard,
      isForm,
      hasPricing,
    });
  } catch (err) {
    // Prediction failure must never break the SSE stream — return neutral report
    log.warn("UX_PREDICTION_FAILED_FALLBACK", { buildId, error: String(err) });
    uxReport = {
      metrics: {
        visualClarity: 5, cognitiveLoad: 5, ctaDiscoverability: 5, readingFlow: 5,
        trust: 5, scanningEfficiency: 5, navigationSimplicity: 5, formFriction: 6,
        pricingClarity: 6, dashboardUsability: 6, informationDensity: 5,
        whitespaceBalance: 5, hierarchy: 5, accessibilityConfidence: 5,
        motionComfort: 7, perceivedPerformance: 5,
      },
      overallUXScore: 5,
      conversionPrediction: "Medium",
      confidence: 0,
      behaviorPredictions: { bounceRisk: 5, engagement: 5, scrollDepth: 5, ctaInteraction: 5, formCompletion: 5, trustLevel: 5 },
      topIssues: [],
      strengths: [],
    };
  }

  log.info("UX_INTELLIGENCE_RESULT", {
    buildId,
    overallUXScore:       uxReport.overallUXScore,
    conversionPrediction: uxReport.conversionPrediction,
    confidence:           uxReport.confidence,
    topIssueCount:        uxReport.topIssues.length,
    strengthCount:        uxReport.strengths.length,
  });

  // Emit SSE result (additive — new event type, no existing contract change)
  sse(res, {
    type:                 "ux_intelligence_result",
    overallUXScore:       uxReport.overallUXScore,
    conversionPrediction: uxReport.conversionPrediction,
    confidence:           uxReport.confidence,
    bounceRisk:           uxReport.behaviorPredictions.bounceRisk,
    engagement:           uxReport.behaviorPredictions.engagement,
    topIssues:            uxReport.topIssues.slice(0, 3),
    strengths:            uxReport.strengths.slice(0, 2),
  });

  // Record telemetry (non-blocking)
  try {
    recordUXRun({
      buildId,
      uxReport,
      repairTriggered: false, // repair already ran before this step
    });
  } catch { /* telemetry must never throw */ }

  // Fire-and-forget learning (never blocks SSE stream)
  setImmediate(() => {
    try {
      const dnaComp = plan.dnaComposition as unknown as Record<string, number> | undefined;
      const primaryBrand = dnaComp
        ? (Object.entries(dnaComp).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "generic")
        : "generic";

      learnFromUX({
        buildId,
        uxReport,
        evaluatorScore: 5, // evaluator hasn't run yet; neutral placeholder
        repairTriggered: false,
        sectionOrder,
        dnaId: primaryBrand,
      });
    } catch { /* learning must never throw */ }
  });

  return { ...repaired, uxReport };
}
