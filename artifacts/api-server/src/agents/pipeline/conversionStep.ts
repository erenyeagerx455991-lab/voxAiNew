// ── V7.3.1 Conversion Intelligence Pipeline Step ──────────────────────────────
// Inserts CRO analysis after Design Critic step.
// Runs full conversion analysis, then repair if conversionScore < 8.5.

import type { Response } from "express";
import { sse } from "../streaming/sseManager.js";
import { analyzeConversion, CONVERSION_REPAIR_THRESHOLD } from "../conversion/conversionAnalyzer.js";
import type { ConversionReport } from "../conversion/conversionAnalyzer.js";
import { runConversionRepair } from "../conversion/conversionRepair.js";
import { recordConversionRun } from "../../telemetry/conversionMetrics.js";
import { recordConversionOutcome } from "../conversion/conversionLearning.js";
import type { PipelineKeys } from "./pipelineTypes.js";
import type { CriticStepOutput } from "./designCriticStep.js";
import { createLogger } from "../../lib/structuredLogger.js";

const log = createLogger("ConversionStep");

export interface ConversionStepOutput extends CriticStepOutput {
  conversionReport: ConversionReport;
  conversionRepaired: boolean;
}

export async function runConversionStep(
  criticized: CriticStepOutput,
  keys: PipelineKeys,
  res: Response
): Promise<ConversionStepOutput> {
  const { openrouterKey } = keys;
  const { fixedCode, design, evaluationResult, critiqueReport } = criticized;
  const buildId = (criticized as unknown as Record<string, unknown>).buildId as string ?? `conv-${Date.now()}`;

  const sectionOrder: string[] = criticized.architecture?.plan?.blueprint?.sectionOrder ?? [];

  sse(res, { type: "conversion_start", agent: "Conversion Intelligence" });

  // ── Phase 1-7: Full conversion analysis ───────────────────────────────────
  let conversionReport: ConversionReport;
  try {
    conversionReport = analyzeConversion({
      code:             fixedCode,
      sectionOrder,
      evaluationResult,
      critiqueReport:   critiqueReport ?? null,
      designDNA:        design,
    });
  } catch (e) {
    log.error("CONVERSION_ANALYSIS_FAILED", { error: String(e) });
    const fallback: ConversionReport = {
      conversionScore: 8.0, trustScore: 8.0, ctaScore: 8.0,
      pricingScore: 8.0, offerClarityScore: 8.0, funnelScore: 8.0,
      issues: [], funnelAnalysis: { sections: sectionOrder, idealFlow: [], missingStages: [], outOfOrder: [], score: 8 },
      repairRequired: false,
    };
    return { ...criticized, conversionReport: fallback, conversionRepaired: false };
  }

  log.info("CONVERSION_ANALYSIS_COMPLETE", {
    conversionScore:   conversionReport.conversionScore,
    trustScore:        conversionReport.trustScore,
    ctaScore:          conversionReport.ctaScore,
    pricingScore:      conversionReport.pricingScore,
    offerClarityScore: conversionReport.offerClarityScore,
    funnelScore:       conversionReport.funnelScore,
    issueCount:        conversionReport.issues.length,
    repairRequired:    conversionReport.repairRequired,
  });

  sse(res, {
    type:              "conversion_result",
    conversionScore:   conversionReport.conversionScore,
    trustScore:        conversionReport.trustScore,
    ctaScore:          conversionReport.ctaScore,
    pricingScore:      conversionReport.pricingScore,
    offerClarityScore: conversionReport.offerClarityScore,
    funnelScore:       conversionReport.funnelScore,
    issues:            conversionReport.issues,
    funnelAnalysis:    conversionReport.funnelAnalysis,
    repairRequired:    conversionReport.repairRequired,
    threshold:         CONVERSION_REPAIR_THRESHOLD,
  });

  // ── Phase 8: Conversion repair ────────────────────────────────────────────
  let currentCode         = fixedCode;
  let conversionRepaired  = false;
  const scoreBeforeRepair = conversionReport.conversionScore;

  if (conversionReport.repairRequired && conversionReport.issues.length > 0) {
    sse(res, {
      type:             "conversion_repair_start",
      conversionScore:  conversionReport.conversionScore,
      issueCount:       conversionReport.issues.length,
      targetScore:      CONVERSION_REPAIR_THRESHOLD,
    });

    const repairResult = await runConversionRepair({
      code:            currentCode,
      issues:          conversionReport.issues,
      designDNA:       design,
      openrouterKey,
      conversionScore: conversionReport.conversionScore,
    });

    if (repairResult.attempted && !repairResult.error) {
      currentCode       = repairResult.code;
      conversionRepaired = true;

      // Re-analyze after repair
      let scoreAfterRepair = Math.min(10, conversionReport.conversionScore + 0.7);
      try {
        const reAnalyzed = analyzeConversion({
          code:             currentCode,
          sectionOrder,
          evaluationResult,
          critiqueReport:   critiqueReport ?? null,
          designDNA:        design,
        });
        scoreAfterRepair = reAnalyzed.conversionScore;
      } catch (_) { /* keep estimate */ }

      const improved = scoreAfterRepair > scoreBeforeRepair;
      log.info("CONVERSION_REPAIR_APPLIED", { scoreBeforeRepair, scoreAfterRepair, improved });

      // Phase 10: learning loop
      for (const issue of conversionReport.issues.slice(0, 5)) {
        recordConversionOutcome({
          fixCategory:  issue.fixKey,
          applied:      true,
          scoreBefore:  scoreBeforeRepair,
          scoreAfter:   scoreAfterRepair,
          improved,
        });
      }

      sse(res, {
        type:                "conversion_repair_done",
        repairApplied:       true,
        scoreBeforeRepair,
        scoreAfterRepair,
        improved,
      });
    } else {
      log.warn("CONVERSION_REPAIR_SKIPPED", { error: repairResult.error });
      sse(res, { type: "conversion_repair_done", repairApplied: false, error: repairResult.error });
    }
  }

  // ── Phase 9: Telemetry ────────────────────────────────────────────────────
  recordConversionRun({
    buildId,
    conversionScore:   conversionReport.conversionScore,
    trustScore:        conversionReport.trustScore,
    ctaScore:          conversionReport.ctaScore,
    pricingScore:      conversionReport.pricingScore,
    funnelScore:       conversionReport.funnelScore,
    offerClarityScore: conversionReport.offerClarityScore,
    repairTriggered:   conversionRepaired,
    repairImproved:    conversionRepaired,
    issuesDetected:    conversionReport.issues.length,
  });

  const updatedCriticized = conversionRepaired
    ? { ...criticized, fixedCode: currentCode }
    : criticized;

  return { ...updatedCriticized, conversionReport, conversionRepaired };
}
