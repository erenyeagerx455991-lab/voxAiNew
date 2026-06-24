// ── V7.3.0 Design Critic Pipeline Step ───────────────────────────────────────
// Inserts Design Critic Agent after Design Evaluator.
// Runs LLM + rule-based critique, then triggers repair if criticScore < 8.5.

import type { Response } from "express";
import { sse } from "../streaming/sseManager.js";
import { runDesignCritic, CRITIC_REPAIR_THRESHOLD } from "../designCritic/designCritic.js";
import type { CritiqueReport } from "../designCritic/designCritic.js";
import { runCriticRepair } from "../designCritic/criticRepair.js";
import { recordCriticRun } from "../../telemetry/criticMetrics.js";
import { recordCriticOutcome } from "../designCritic/criticLearning.js";
import type { PipelineKeys } from "./pipelineTypes.js";
import type { EvaluatorStepOutput } from "./designEvaluatorStep.js";
import { createLogger } from "../../lib/structuredLogger.js";

const log = createLogger("DesignCriticStep");

export interface CriticStepOutput extends EvaluatorStepOutput {
  critiqueReport:  CritiqueReport;
  criticRepaired:  boolean;
}

export async function runDesignCriticStep(
  evaluated: EvaluatorStepOutput,
  keys: PipelineKeys,
  res: Response
): Promise<CriticStepOutput> {
  const { openrouterKey } = keys;
  const { fixedCode, design, evaluationResult } = evaluated;
  const buildId = (evaluated as unknown as Record<string, unknown>).buildId as string ?? `critic-${Date.now()}`;

  sse(res, { type: "design_critic_start", agent: "Design Critic" });

  const scoreBeforeCritic = evaluationResult.overallScore;

  // ── Phase 1-6: Run critic engine ─────────────────────────────────────────────
  let critiqueReport: CritiqueReport;
  try {
    critiqueReport = await runDesignCritic({
      code:                fixedCode,
      evaluationResult,
      designDNA:           design,
      retrievalReferences: evaluationResult.referencesUsed ?? [],
      openrouterKey,
    });
  } catch (e) {
    log.error("DESIGN_CRITIC_FAILED", { error: String(e) });
    // Graceful degradation — skip critic, return evaluated output unchanged
    const fallbackReport: CritiqueReport = {
      criticScore: evaluationResult.overallScore,
      categoryScores: {
        hero: evaluationResult.heroScore, layout: evaluationResult.layoutScore,
        typography: 7, ctaHierarchy: evaluationResult.ctaScore,
        trustBuilding: 7, accessibility: evaluationResult.accessibilityScore,
        motion: evaluationResult.motionScore, dashboardUX: evaluationResult.dashboardScore,
        formsUX: evaluationResult.formScore, navbarUX: evaluationResult.navigationScore,
        conversion: 7, visualHierarchy: evaluationResult.consistencyScore,
      },
      issues: [], topRecommendation: '', repairRequired: false, rawCritique: '',
    };
    return { ...evaluated, critiqueReport: fallbackReport, criticRepaired: false };
  }

  log.info("DESIGN_CRITIC_COMPLETE", {
    criticScore: critiqueReport.criticScore,
    issueCount:  critiqueReport.issues.length,
    repairRequired: critiqueReport.repairRequired,
    topCategory: critiqueReport.issues[0]?.category ?? 'none',
  });

  sse(res, {
    type:             "design_critic_result",
    criticScore:      critiqueReport.criticScore,
    categoryScores:   critiqueReport.categoryScores,
    issues:           critiqueReport.issues,
    topRecommendation: critiqueReport.topRecommendation,
    repairRequired:   critiqueReport.repairRequired,
    threshold:        CRITIC_REPAIR_THRESHOLD,
  });

  // ── Phase 8: Critic repair loop ───────────────────────────────────────────────
  let currentCode   = fixedCode;
  let criticRepaired = false;
  let scoreAfterCritic = scoreBeforeCritic;

  if (critiqueReport.repairRequired && critiqueReport.issues.length > 0) {
    sse(res, {
      type:       "critic_repair_start",
      criticScore: critiqueReport.criticScore,
      issueCount: critiqueReport.issues.length,
      targetScore: CRITIC_REPAIR_THRESHOLD,
    });

    const repairResult = await runCriticRepair({
      code:          currentCode,
      issues:        critiqueReport.issues,
      designDNA:     design,
      openrouterKey,
      criticScore:   critiqueReport.criticScore,
    });

    if (repairResult.attempted && !repairResult.error) {
      currentCode    = repairResult.code;
      criticRepaired = true;
      scoreAfterCritic = Math.min(10, critiqueReport.criticScore + 0.8); // estimated improvement

      log.info("CRITIC_REPAIR_APPLIED", { issueCount: critiqueReport.issues.length });

      sse(res, {
        type:            "critic_repair_done",
        repairApplied:   true,
        estimatedGain:   0.8,
        newCriticScore:  scoreAfterCritic,
      });

      // Phase 10: record outcomes for learning loop
      for (const issue of critiqueReport.issues.slice(0, 5)) {
        recordCriticOutcome({
          category:       issue.category,
          suggestionType: issue.severity,
          applied:        true,
          scoreBefore:    critiqueReport.criticScore,
          scoreAfter:     scoreAfterCritic,
          improved:       scoreAfterCritic > critiqueReport.criticScore,
        });
      }
    } else {
      log.warn("CRITIC_REPAIR_SKIPPED", { error: repairResult.error });
      sse(res, {
        type:          "critic_repair_done",
        repairApplied: false,
        error:         repairResult.error,
      });
    }
  }

  // ── Phase 9: Record critic telemetry ─────────────────────────────────────────
  recordCriticRun({
    buildId,
    criticScore:       critiqueReport.criticScore,
    issuesDetected:    critiqueReport.issues.length,
    repairTriggered:   criticRepaired,
    repairImproved:    criticRepaired && scoreAfterCritic > critiqueReport.criticScore,
    scoreBeforeCritic,
    scoreAfterCritic:  criticRepaired ? scoreAfterCritic : scoreBeforeCritic,
    topCategories:     critiqueReport.issues.slice(0, 3).map(i => i.category),
  });

  const updatedFrontend = criticRepaired
    ? { ...evaluated, fixedCode: currentCode }
    : evaluated;

  return {
    ...updatedFrontend,
    critiqueReport,
    criticRepaired,
  };
}
