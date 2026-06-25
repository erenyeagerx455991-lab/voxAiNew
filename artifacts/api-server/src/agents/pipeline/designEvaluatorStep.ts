import type { Response } from "express";
import { sse } from "../streaming/sseManager.js";
import { evaluateDesign } from "../designEvaluator/evaluator.js";
import { runDesignRepair } from "../designEvaluator/repairAgent.js";
import { recordEvaluatorScore } from "../../telemetry/evaluatorMetrics.js";
import { recordComponentBuildResult } from "../../quality/componentMetrics.js";
import { recordBuildOutcome } from "../../design-rag/referenceMetrics.js";
import { recordSectionOutcome } from "../../design-rag/sectionReferenceMetrics.js";
import { normalizeSectionType } from "../../design-rag/sectionRetriever.js";
import { recordDashboardScore } from "../../telemetry/dashboardMetrics.js";
import { recordFormScore } from "../../telemetry/formMetrics.js";
import { scoreTree } from "../../component-tree/treeValidator.js";
import { validateTokenUsage } from "../../design-tokens/tokenValidator.js";
import { recordTokenBuild } from "../../telemetry/designTokenMetrics.js";
import { analyzeVisuals } from "../../visual-diff/visualAnalyzer.js";
import { recordVisualOutcome } from "../../visual-diff/visualLearning.js";
import { recordVisualBuildMetrics } from "../../telemetry/visualMetrics.js";
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
  navigationScore: number;
  accountMenuScore: number;
  authNavbarAlignmentScore: number;
  dashboardScore: number;
  formScore: number;
  motionScore: number;
  treeQualityScore: number;
  tokenQualityScore: number;
  visualQualityScore: number;
  issues: Array<{ category: string; severity: string; message: string }>;
  repairCount: number;
  repairApplied: boolean;
  componentsUsed: Array<{ componentId: string; category: string }>;
  referencesUsed: string[];
  scoreBeforeRepair: number;
  scoreAfterRepair: number;
  retrievalImpactScore: number;
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

  const authState = plan.authState ?? 'guest';

  let evalResult = evaluateDesign({
    code: currentCode,
    sectionOrder: blueprint.sectionOrder,
    designDNA: design,
    authState,
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

  const initialScore = evalResult.overallScore; // Phase 8: track score before any repair

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
        authState,
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

  // V7.2.7: record dashboard quality metrics
  const hasDashboardIssues = evalResult.issues.some(i => i.category === 'dashboard');
  const isDashboardBuild = evalResult.dashboardScore < 10 || hasDashboardIssues;
  recordDashboardScore({
    score:          evalResult.dashboardScore,
    isDashboard:    isDashboardBuild,
    datatableUsage: /\bDataTable\b/.test(currentCode),
    tabsUsage:      /\bTabsList\b|\bTabsTrigger\b/.test(currentCode),
    badgeUsage:     /\bBadge\b/.test(currentCode),
    skeletonUsage:  /\bSkeleton\b/.test(currentCode),
    commandUsage:   /\bCommandInput\b|\bCommandList\b/.test(currentCode),
    dropdownUsage:  /\bDropdownMenuContent\b/.test(currentCode),
  });

  // V7.2.8: record form quality metrics
  const hasFormIssues = evalResult.issues.some(i => i.category === 'form');
  const hasFormContent = evalResult.formScore < 10 || hasFormIssues;
  recordFormScore({
    score:              evalResult.formScore,
    hasForm:            hasFormContent,
    reactHookFormUsage: /\buseForm\b|\bhandleSubmit\b.*\bregister\b/.test(currentCode) || /formState\.errors/.test(currentCode),
    zodUsage:           /z\.object\s*\(|zodResolver|z\.string\(\)|z\.email\(\)/.test(currentCode),
    labelUsage:         /\bLabel\b/.test(currentCode) && /htmlFor=/.test(currentCode),
    errorStateUsage:    /formState\.errors|errors\.\w+/.test(currentCode),
    loadingStateUsage:  /isSubmitting|isLoading|disabled.*submit/.test(currentCode),
    multiStepUsage:     /\bProgress\b.*value=|step.*total|totalSteps/.test(currentCode),
    crudUsage:          /Dialog|Sheet/.test(currentCode) && /DataTable|<table/.test(currentCode),
  });

  // V7.1.9: feed real build outcomes back into reference performance store
  const referencesUsedIds = frontend.retrievalReferenceIds ?? [];
  if (referencesUsedIds.length > 0) {
    recordBuildOutcome(
      referencesUsedIds,
      initialScore,
      evalResult.overallScore,
      repairApplied,
    );
    log.info("REFERENCE_OUTCOME_RECORDED", {
      referenceCount: referencesUsedIds.length,
      scoreBeforeRepair: initialScore,
      scoreAfterRepair: evalResult.overallScore,
      repairApplied,
    });

    // V7.2.3: section-level outcome feedback — final score only (never pre-repair)
    for (const refId of referencesUsedIds) {
      const sectionType = normalizeSectionType(refId);
      if (sectionType) {
        recordSectionOutcome({
          referenceId:       refId,
          sectionType,
          overallScore:      evalResult.overallScore,
          heroScore:         evalResult.heroScore,
          layoutScore:       evalResult.layoutScore,
          ctaScore:          evalResult.ctaScore,
          accessibilityScore: evalResult.accessibilityScore,
          consistencyScore:  evalResult.consistencyScore,
          repairTriggered:   repairApplied,
        });
      }
    }
    log.info("SECTION_OUTCOME_RECORDED", {
      referenceCount: referencesUsedIds.length,
      finalScore:     evalResult.overallScore,
      repairTriggered: repairApplied,
    });
  }

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

  // V7.3.2: Score the component tree as an additional quality dimension
  const treeQualityScore = scoreTree(frontend.componentTree);
  log.info("TREE_QUALITY_SCORED", { treeQualityScore, hasTree: !!frontend.componentTree });

  // V7.3.3: Score token usage in generated code
  const tokenValidation = validateTokenUsage(currentCode);
  const tokenQualityScore = tokenValidation.tokenQualityScore;
  log.info("TOKEN_QUALITY_SCORED", { tokenQualityScore, violations: tokenValidation.violationCount, hardcodedColors: tokenValidation.hardcodedColorCount });

  const tokenSet = frontend.tokenSet;
  if (tokenSet) {
    recordTokenBuild({
      themeId:              tokenSet.metadata.themeId,
      mode:                 tokenSet.metadata.mode,
      dna:                  tokenSet.metadata.dna,
      tokenQualityScore,
      hardcodedColorCount:  tokenValidation.hardcodedColorCount,
      hardcodedRadiusCount: tokenValidation.hardcodedRadiusCount,
      hardcodedShadowCount: tokenValidation.hardcodedShadowCount,
      violationCount:       tokenValidation.violationCount,
      usedCSSVariables:     /var\(--/.test(currentCode),
    });
  }

  // V7.3.4: Visual quality scoring — code-structure-based visual analysis
  const visualAnalysis = analyzeVisuals(currentCode, blueprint.sectionOrder, buildId, buildId);
  const visualQualityScore = visualAnalysis.visualScore;
  log.info("VISUAL_QUALITY_SCORED", {
    visualQualityScore,
    heroScore: visualAnalysis.heroScore,
    ctaScore:  visualAnalysis.ctaScore,
    layoutScore: visualAnalysis.layoutScore,
    responsiveScore: visualAnalysis.responsiveScore,
    issueCount: visualAnalysis.issues.length,
  });

  // Record for learning loop and telemetry
  recordVisualOutcome(currentCode, visualAnalysis);
  recordVisualBuildMetrics({
    visualScore:     visualAnalysis.visualScore,
    heroScore:       visualAnalysis.heroScore,
    ctaScore:        visualAnalysis.ctaScore,
    layoutScore:     visualAnalysis.layoutScore,
    responsiveScore: visualAnalysis.responsiveScore,
  });

  const evaluationResult: EvaluatorResult = {
    ...evalResult,
    repairCount,
    repairApplied,
    componentsUsed,
    referencesUsed: frontend.retrievalReferenceIds ?? [],
    scoreBeforeRepair: initialScore,
    scoreAfterRepair: evalResult.overallScore,
    retrievalImpactScore: evalResult.overallScore,
    dashboardScore: evalResult.dashboardScore,
    formScore: evalResult.formScore,
    motionScore: evalResult.motionScore,
    treeQualityScore,
    tokenQualityScore,
    visualQualityScore,
  };

  const updatedFrontend: FrontendOutput = repairApplied
    ? { ...frontend, fixedCode: currentCode }
    : frontend;

  return { ...updatedFrontend, evaluationResult };
}
