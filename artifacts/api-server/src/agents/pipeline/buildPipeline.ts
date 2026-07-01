/**
 * V8.0 — Build Pipeline
 *
 * Orchestrates all pipeline steps in sequence.  Every step is a pure function
 * that takes its predecessor's output + shared keys + SSE response.
 *
 * Step order:
 *  1  Planner               — intent analysis, blueprint, DNA composition
 *  2  Architecture           — project blueprint, tech stack
 *  3  ComponentTree          — full page tree (deterministic, inline)
 *  4  Frontend               — React/Tailwind code generation
 *  5  CandidateSelection     — A/B/C candidates, evaluator selects best
 *  6  Repair                 — code-fix / quality gate
 *  7  DesignEvaluator        — 15-dimension quality scoring
 *  8  DesignCritic           — senior designer review + targeted repair
 *  9  ConversionIntelligence — CRO analysis + repair
 * 10  Accessibility           — WCAG 2.1 AA evaluation + repair (V8.0)
 * 11  Optimization            — bundle + render efficiency (V8.0)
 * 12  Backend (Scaffold)      — API routes, DB schema, auth files
 * 13  RuntimeValidation       — real npm install + Vite build + self-healing
 */

import type { Response } from "express";
import { sse } from "../streaming/sseManager.js";
import { runPlannerStep } from "./plannerStep.js";
import { runArchitectureStep } from "./architectureStep.js";
import { runFrontendStep } from "./frontendStep.js";
import { runCandidateSelectionStep } from "./candidateSelectionStep.js";
import { runRepairStep } from "./repairStep.js";
import { runDesignEvaluatorStep } from "./designEvaluatorStep.js";
import { runDesignCriticStep } from "./designCriticStep.js";
import { runConversionStep } from "./conversionStep.js";
import { runAccessibilityStep } from "./accessibilityStep.js";
import { runOptimizationStep } from "./optimizationStep.js";
import { runBackendStep } from "./backendStep.js";
import { runRuntimeValidationStep } from "./runtimeValidationStep.js";
import type { PipelineKeys } from "./pipelineTypes.js";
import { createTraceContext, withBuildId } from "../../telemetry/traceContext.js";
import { setLogContext, clearLogContext } from "../../lib/structuredLogger.js";
import { recordBuildStart, recordBuildSuccess, recordBuildFailure } from "../../telemetry/buildMetrics.js";
import { withAgentMetrics } from "../../telemetry/agentMetrics.js";
import { learnFromBuild } from "../../design-dna/designDNA.js";
import { buildComponentTree } from "../../component-tree/treeBuilder.js";
import { validateTree } from "../../component-tree/treeValidator.js";
import { recordTreeBuild } from "../../telemetry/componentTreeMetrics.js";
import { recordDNAOutcome } from "../../design-dna/dnaLearning.js";
import type { EvaluatorResult } from "./designEvaluatorStep.js";

export interface BuildPipelineInput {
  prompt: string;
  chatId: string;
  keys: PipelineKeys;
}

export async function runBuildPipeline(
  input: BuildPipelineInput,
  res: Response,
): Promise<void> {
  const { prompt, chatId, keys } = input;
  const buildId = chatId;

  const trace = withBuildId(createTraceContext({ requestId: chatId }), buildId);
  setLogContext({ traceId: trace.traceId, requestId: trace.requestId, buildId });

  recordBuildStart(buildId, trace, prompt);

  try {
    // ── Step 1: Planner ────────────────────────────────────────────────────────
    const plan = await withAgentMetrics("Planner", () =>
      runPlannerStep(prompt, keys, res),
    );

    // ── Step 2: Architecture ───────────────────────────────────────────────────
    const architecture = await withAgentMetrics("Architecture", () =>
      runArchitectureStep(plan, prompt, keys, res),
    );

    // ── Step 3: Component Tree (deterministic, no LLM call) ────────────────────
    const componentTree = buildComponentTree({ plan, architecture, buildId: chatId });
    const treeValidation = validateTree(componentTree);
    recordTreeBuild(
      componentTree,
      treeValidation.score,
      treeValidation.errors.length,
      treeValidation.warnings.length,
    );

    // ── Step 4: Frontend Code Generation ──────────────────────────────────────
    const frontend = await withAgentMetrics("Frontend", () =>
      runFrontendStep(architecture, prompt, keys, res, componentTree),
    );

    // ── Step 5: Multi-Candidate Selection (V7.2.0) ─────────────────────────────
    const { winner } = await withAgentMetrics("CandidateSelection", () =>
      runCandidateSelectionStep(frontend, prompt, keys, res, buildId),
    );

    // ── Step 6: Repair Loop ────────────────────────────────────────────────────
    const repairedFrontend = await withAgentMetrics("Repair", () =>
      runRepairStep(winner, keys, res),
    );

    // ── Step 7: Design Evaluator (15-dimension scoring) ────────────────────────
    const evaluatedFrontend = await withAgentMetrics("DesignEvaluator", () =>
      runDesignEvaluatorStep(repairedFrontend, keys, res),
    );

    // ── Step 8: Design Critic (senior designer review) ─────────────────────────
    const criticFrontend = await withAgentMetrics("DesignCritic", () =>
      runDesignCriticStep(evaluatedFrontend, keys, res),
    );

    // ── Step 9: Conversion Intelligence (CRO) ─────────────────────────────────
    const conversionFrontend = await withAgentMetrics("ConversionIntelligence", () =>
      runConversionStep(criticFrontend, keys, res),
    );

    // ── Step 10: Accessibility (V8.0 — WCAG 2.1 AA) ───────────────────────────
    const accessibilityFrontend = await runAccessibilityStep(conversionFrontend, keys, res);

    // ── Step 11: Optimization (V8.0 — bundle + render) ────────────────────────
    const optimizedFrontend = await runOptimizationStep(accessibilityFrontend, keys, res);

    // ── V7.3.5: DNA Outcome Recording (self-learning) ──────────────────────────
    const evalRes = (
      conversionFrontend as unknown as Record<string, unknown>
    ).evaluationResult as EvaluatorResult | undefined;

    if (evalRes) {
      const designDNA = optimizedFrontend.design;
      const dnaComp = plan.dnaComposition as unknown as Record<string, number>;
      const primaryBrand = dnaComp
        ? (
            Object.entries(dnaComp).sort(
              ([, a], [, b]) => (b as number) - (a as number),
            )[0]?.[0] ?? ""
          )
        : "";
      recordDNAOutcome({
        primaryBrand,
        heroStyle:      designDNA?.heroStyle ?? "",
        ctaStyle:       designDNA?.buttonStyle ?? "",
        layoutStyle:    designDNA?.layoutStyle ?? "",
        motionStyle:    designDNA?.animationPersonality ?? "",
        navbarStyle:    plan.navbarVariant ?? "",
        formStyle:      "",
        dashboardStyle: "",
        pricingStyle:   "",
        overallScore:    evalRes.overallScore ?? 0,
        visualScore:     evalRes.visualQualityScore ?? 5,
        criticScore:     evalRes.treeQualityScore ?? 5,
        conversionScore: evalRes.tokenQualityScore ?? 5,
        motionScore:     evalRes.motionScore ?? 5,
        tokenScore:      evalRes.tokenQualityScore ?? 5,
        treeScore:       evalRes.treeQualityScore ?? 5,
        repairTriggered: evalRes.repairApplied ?? false,
      });
    }

    // ── Step 12: Backend Scaffold ──────────────────────────────────────────────
    const backend = await withAgentMetrics("Scaffold", () =>
      runBackendStep(architecture, optimizedFrontend, keys, res),
    );

    // ── Step 13: Runtime Validation (real Vite build + self-healing) ───────────
    const runtimeResult = await withAgentMetrics("RuntimeValidation", () =>
      runRuntimeValidationStep(
        {
          allFiles: backend.allFiles,
          projectBlueprint: architecture.projectBlueprint,
          knowledgeGraph: backend.knowledgeGraph,
          chatId,
        },
        keys,
        res,
      ),
    );

    recordBuildSuccess(buildId);

    // ── V8.1: Async DNA Evolution (non-blocking — fires after SSE done) ────────
    const evalResForV81 = (conversionFrontend as unknown as Record<string, unknown>)
      .evaluationResult as EvaluatorResult | undefined;
    const accessibilityScore81 = (accessibilityFrontend as { accessibilityResult?: { overallScore: number } })
      .accessibilityResult?.overallScore ?? 5;
    const optimizationScore81 = (optimizedFrontend as { optimizationResult?: { overallScore: number } })
      .optimizationResult?.overallScore ?? 5;

    const { blueprint, cleanPlan, dnaComposition, dnaOwnership, dnaTheme, dnaMotion } = plan;

    sse(res, {
      type: "done",
      code: optimizedFrontend.fixedCode,
      plan: cleanPlan,
      blueprint,
      projectBlueprint: architecture.projectBlueprint,
      sectionOrder: blueprint.sectionOrder,
      files: runtimeResult.allFiles,
      dnaComposition,
      sectionOwnership: dnaOwnership,
      themeTokens: dnaTheme,
      motionProfile: dnaMotion,
      knowledgeGraph: backend.knowledgeGraph,
      // V8.0: surface new quality signals
      accessibilityScore: accessibilityScore81,
      optimizationScore:  optimizationScore81,
    });

    // ── V8.1: Fire-and-forget DNA learning (never blocks SSE stream) ───────────
    setImmediate(() => {
      try {
        const dnaComp81 = plan.dnaComposition as unknown as Record<string, number>;
        const primaryBrand81 = dnaComp81
          ? (Object.entries(dnaComp81).sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] ?? "generic")
          : "generic";
        learnFromBuild({
          dnaId:               primaryBrand81,
          evaluatorScore:      evalResForV81?.overallScore        ?? 5,
          // criticScore is neutral here — the Design Critic agent delivers
          // its score separately via learnFromCritic() when wired
          criticScore:         5,
          accessibilityScore:  accessibilityScore81,
          optimizationScore:   optimizationScore81,
          visualScore:         evalResForV81?.visualQualityScore  ?? 5,
          repairTriggered:     evalResForV81?.repairApplied       ?? false,
          repairLoops:         evalResForV81?.repairCount         ?? 0,
          conversionScore:     evalResForV81?.tokenQualityScore   ?? 5,
          success:             true,
        });
      } catch { /* DNA learning must never throw into the pipeline */ }
    });
  } catch (err) {
    const e = err as Error;
    recordBuildFailure(buildId, e?.message);
    throw err;
  } finally {
    clearLogContext();
  }
}
