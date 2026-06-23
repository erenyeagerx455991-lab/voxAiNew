import type { Response } from "express";
import { sse } from "../streaming/sseManager.js";
import { evaluateDesign } from "../designEvaluator/evaluator.js";
import { runDesignRepair } from "../designEvaluator/repairAgent.js";
import { recordEvaluatorScore } from "../../telemetry/evaluatorMetrics.js";
import { recordComponentBuildResult } from "../../quality/componentMetrics.js";
import type { FrontendOutput, PipelineKeys } from "./pipelineTypes.js";
import { createLogger } from "../../lib/structuredLogger.js";

const log = createLogger("DesignEvaluatorStep");

export const REPAIR_THRESHOLD = 8.0;
export const MAX_DESIGN_REPAIR_PASSES = 2;

export interface EvaluatorResult {
  overallScore: number;
  heroScore: number;
  layoutScore: number;
  ctaScore: number;
  accessibilityScore: number;
  shadcnScore: number;
  consistencyScore: number;
  issues: Array<{ category: string; severity: string; message: string }>;
  repairCount: number;
  repairApplied: boolean;
  componentsUsed: Array<{ componentId: string; category: string }>;
}

export interface EvaluatorStepOutput extends FrontendOutput {
  evaluationResult: EvaluatorResult;
}

export async function runDesignEvaluatorStep(
  frontend: FrontendOutput,
  keys: PipelineKeys,
  res: Response
): Promise<EvaluatorStepOutput> {
  const { openrouterKey } = keys;
  const { fixedCode, design, architecture } = frontend;
  const { plan } = architecture;
  const { blueprint } = plan;
  const buildId = (frontend as unknown as Record<string, unknown>).buildId as string ?? "unknown";

  sse(res, { type: "design_eval_start", agent: "Design Evaluator" });

  let currentCode = fixedCode;
  let repairCount = 0;
  let repairApplied = false;

  let evalResult = evaluateDesign({
    code: currentCode,
    sectionOrder: blueprint.sectionOrder,
    designDNA: design,
  });

  log.info("DESIGN_EVAL_INITIAL", {
    overallScore: evalResult.overallScore,
    heroScore: evalResult.heroScore,
    layoutScore: evalResult.layoutScore,
    ctaScore: evalResult.ctaScore,
    accessibilityScore: evalResult.accessibilityScore,
    shadcnScore: evalResult.shadcnScore,
    consistencyScore: evalResult.consistencyScore,
    issueCount: evalResult.issues.length,
    repairRequired: evalResult.overallScore < REPAIR_THRESHOLD,
  });

  sse(res, {
    type: "design_eval_result",
    overallScore: evalResult.overallScore,
    heroScore: evalResult.heroScore,
    layoutScore: evalResult.layoutScore,
    ctaScore: evalResult.ctaScore,
    accessibilityScore: evalResult.accessibilityScore,
    shadcnScore: evalResult.shadcnScore,
    consistencyScore: evalResult.consistencyScore,
    issues: evalResult.issues,
    repairRequired: evalResult.overallScore < REPAIR_THRESHOLD,
    threshold: REPAIR_THRESHOLD,
  });

  while (evalResult.overallScore < REPAIR_THRESHOLD && repairCount < MAX_DESIGN_REPAIR_PASSES) {
    repairCount++;

    sse(res, {
      type: "design_repair_start",
      pass: repairCount,
      maxPasses: MAX_DESIGN_REPAIR_PASSES,
      currentScore: evalResult.overallScore,
      issueCount: evalResult.issues.length,
      targetScore: REPAIR_THRESHOLD,
    });

    log.info("DESIGN_REPAIR_PASS_START", { pass: repairCount, score: evalResult.overallScore });

    const repairResult = await runDesignRepair({
      code: currentCode,
      issues: evalResult.issues,
      scores: evalResult,
      openrouterKey,
      designDNA: design,
      pass: repairCount,
    });

    if (repairResult.attempted && !repairResult.error) {
      const prevScore = evalResult.overallScore;
      currentCode = repairResult.code;
      repairApplied = true;

      evalResult = evaluateDesign({
        code: currentCode,
        sectionOrder: blueprint.sectionOrder,
        designDNA: design,
      });

      const improvement = Math.round((evalResult.overallScore - prevScore) * 10) / 10;
      log.info("DESIGN_REPAIR_PASS_DONE", {
        pass: repairCount,
        prevScore,
        newScore: evalResult.overallScore,
        improvement,
        repairSucceeded: evalResult.overallScore >= REPAIR_THRESHOLD,
      });

      sse(res, {
        type: "design_repair_done",
        pass: repairCount,
        prevScore,
        newScore: evalResult.overallScore,
        improvement,
        remainingIssues: evalResult.issues.length,
        scoreImproved: evalResult.overallScore > prevScore,
        thresholdMet: evalResult.overallScore >= REPAIR_THRESHOLD,
      });
    } else {
      log.warn("DESIGN_REPAIR_PASS_SKIPPED", { pass: repairCount, error: repairResult.error });
      sse(res, {
        type: "design_repair_done",
        pass: repairCount,
        prevScore: evalResult.overallScore,
        newScore: evalResult.overallScore,
        improvement: 0,
        remainingIssues: evalResult.issues.length,
        error: repairResult.error,
        scoreImproved: false,
        thresholdMet: false,
      });
      break;
    }
  }

  recordEvaluatorScore({
    buildId,
    overallScore: evalResult.overallScore,
    heroScore: evalResult.heroScore,
    layoutScore: evalResult.layoutScore,
    ctaScore: evalResult.ctaScore,
    accessibilityScore: evalResult.accessibilityScore,
    shadcnScore: evalResult.shadcnScore,
    consistencyScore: evalResult.consistencyScore,
    repairCount,
    repairApplied,
  });

  // ── V7.1.6 Phase 2+6: Record per-component metrics from registry selection ──
  const registrySelection = frontend.registrySelection ?? {};
  const componentsUsed = Object.entries(registrySelection)
    .filter(([, hint]) => typeof hint === "string" && hint.length > 0)
    .map(([category, hint]) => ({
      category,
      componentId: hint.split(/\s/)[0] ?? hint,
    }));

  if (componentsUsed.length > 0) {
    const designScore =
      (evalResult.heroScore + evalResult.layoutScore + evalResult.ctaScore +
       evalResult.shadcnScore + evalResult.consistencyScore) / 5;
    recordComponentBuildResult({
      componentsUsed,
      overallScore: evalResult.overallScore,
      designScore,
      accessibilityScore: evalResult.accessibilityScore,
      repairApplied,
    });
    log.info("COMPONENT_METRICS_RECORDED", { count: componentsUsed.length, repairApplied });
  }

  log.info("DESIGN_EVAL_COMPLETE", {
    finalScore: evalResult.overallScore,
    repairCount,
    repairApplied,
    thresholdMet: evalResult.overallScore >= REPAIR_THRESHOLD,
  });

  const evaluationResult: EvaluatorResult = {
    ...evalResult,
    repairCount,
    repairApplied,
    componentsUsed,
  };

  const updatedFrontend: FrontendOutput = repairApplied
    ? { ...frontend, fixedCode: currentCode }
    : frontend;

  return { ...updatedFrontend, evaluationResult };
}
