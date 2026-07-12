/**
 * V8.0 — Build Pipeline
 *
 * Orchestrates all pipeline steps in sequence.  Every step is a pure function
 * that takes its predecessor's output + shared keys + SSE response.
 *
 * Step order:
 *  0    ProductManager         — static product strategy
 *  0.5  FrontendArchitect     — static frontend blueprint
 *  0.6  BackendArchitect      — static backend blueprint (+ security intelligence)
 *  0.7  DevOpsArchitect       — static devops blueprint
 *  0.8  QAArchitect           — static QA/reliability blueprint
 *  0.9  RuntimeIntelligence   — V9.0 generation strategy brain (no LLM)
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
import { runUXIntelligenceStep } from "./uxIntelligenceStep.js";
import { runDesignEvaluatorStep } from "./designEvaluatorStep.js";
import { runDesignCriticStep } from "./designCriticStep.js";
import { runConversionStep } from "./conversionStep.js";
import { runAccessibilityStep } from "./accessibilityStep.js";
import { runOptimizationStep } from "./optimizationStep.js";
import { runDesignDirectorStep } from "./designDirectorStep.js";
import { runProductManagerStep } from "./productManagerStep.js";
import { runFrontendArchitectStep }  from "./frontendArchitectStep.js";
import { runBackendArchitectStep }   from "./backendArchitectStep.js";
import { runDevOpsArchitectStep }    from "./devopsArchitectStep.js";
import { runQAArchitectStep }        from "./qaArchitectStep.js";
import { runRuntimeIntelligenceStep } from "./runtimeIntelligenceStep.js";
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
    // ── Step 0: Product Manager (V8.4 — static product strategy, no LLM) ──────
    const productManagerOutput = await withAgentMetrics("ProductManager", () =>
      runProductManagerStep(prompt, buildId, res),
    );
    // Enrich prompt with product strategy context for all downstream engines
    const enrichedPromptWithProductContext = prompt + productManagerOutput.contextString;

    // ── Step 0.5: Frontend Architect (V8.5 — static architecture blueprint, no LLM) ──
    const frontendArchitectOutput = await runFrontendArchitectStep(
      prompt,
      buildId,
      res,
      productManagerOutput,
    );
    // Combine product strategy + frontend architecture blueprint for the Backend Architect
    const enrichedPromptWithFrontend =
      enrichedPromptWithProductContext + '\n' + frontendArchitectOutput.contextString;

    // ── Step 0.6: Backend Architect (V8.6 — static backend blueprint, no LLM) ──
    const backendArchitectOutput = await runBackendArchitectStep(
      prompt,
      buildId,
      res,
      productManagerOutput,
      frontendArchitectOutput,
    );

    // ── Step 0.7: DevOps Architect (V8.7 — static devops blueprint, no LLM) ───
    const devopsArchitectOutput = await runDevOpsArchitectStep(
      prompt,
      buildId,
      res,
      productManagerOutput,
      backendArchitectOutput,
    );

    // ── Step 0.8: QA Architect (V8.8 — static QA/reliability blueprint, no LLM) ─
    const qaArchitectOutput = await runQAArchitectStep(
      prompt,
      buildId,
      res,
      productManagerOutput,
      backendArchitectOutput,
      devopsArchitectOutput,
    );

    // ── Step 0.9: Runtime Intelligence (V9.0 — generation strategy brain, no LLM) ─
    const runtimeIntelligenceOutput = await runRuntimeIntelligenceStep(
      prompt,
      buildId,
      res,
      productManagerOutput,
      frontendArchitectOutput,
      backendArchitectOutput,
      devopsArchitectOutput,
      qaArchitectOutput,
    );

    // Combine all blueprints + runtime context string for downstream Planner
    const enrichedPromptWithArchitecture =
      enrichedPromptWithFrontend +
      '\n' + backendArchitectOutput.enrichedPromptWithArchitecture +
      '\n' + devopsArchitectOutput.enrichedPromptWithDevOps +
      '\n' + qaArchitectOutput.enrichedPromptWithQA +
      runtimeIntelligenceOutput.contextString;   // V9.0 runtime context

    // ── Step 1: Planner ────────────────────────────────────────────────────────
    const plan = await withAgentMetrics("Planner", () =>
      runPlannerStep(enrichedPromptWithArchitecture, keys, res),
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
    // V9.0: runtimeIntelligenceOutput.blueprint tunes candidate count/repair/evaluation.
    const { winner } = await withAgentMetrics("CandidateSelection", () =>
      runCandidateSelectionStep(frontend, prompt, keys, res, buildId, runtimeIntelligenceOutput.blueprint),
    );

    // ── Step 6: Repair Loop ────────────────────────────────────────────────────
    const repairedFrontend = await withAgentMetrics("Repair", () =>
      runRepairStep(winner, keys, res, runtimeIntelligenceOutput.blueprint),
    );

    // ── Step 6.5: UX Intelligence (V8.2 — static UX & conversion prediction) ──
    const uxFrontend = await withAgentMetrics("UXIntelligence", () =>
      runUXIntelligenceStep(repairedFrontend, buildId, res),
    );

    // ── Step 7: Design Evaluator (15-dimension scoring + V8.2 uxPredictionScore)
    const evaluatedFrontend = await withAgentMetrics("DesignEvaluator", () =>
      runDesignEvaluatorStep(uxFrontend, keys, res, runtimeIntelligenceOutput.blueprint),
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

    // ── Step 11.5: Autonomous AI Design Director (V8.3 — strategic review) ────
    const directedFrontend = await withAgentMetrics("DesignDirector", () =>
      runDesignDirectorStep(optimizedFrontend, buildId, res),
    );

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
      runBackendStep(architecture, directedFrontend, keys, res),
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

    // V8.3: extract director score for the done event
    const directorScore83 = (directedFrontend as unknown as { directorScore?: number }).directorScore ?? 0;

    sse(res, {
      type: "done",
      code: directedFrontend.fixedCode,
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
      // V8.3: director strategic review score
      directorScore: directorScore83,
      // V8.4: product manager plan (additive)
      productPlan: productManagerOutput.productPlan,
      productScore: productManagerOutput.productScore,
      // V8.5: frontend architecture blueprint (additive)
      architectureBlueprint: frontendArchitectOutput.blueprint,
      architectureScore: frontendArchitectOutput.overallScore,
      // V8.6: backend architecture blueprint (additive)
      backendBlueprint: backendArchitectOutput.blueprint,
      backendArchitectureScore: backendArchitectOutput.overallScore,
      // V8.7: devops architecture blueprint (additive)
      devopsBlueprint: devopsArchitectOutput.blueprint,
      devopsArchitectureScore: devopsArchitectOutput.overallScore,
      // V8.8: QA architecture blueprint (additive)
      qaBlueprint: qaArchitectOutput.blueprint,
      qaArchitectureScore: qaArchitectOutput.overallScore,
      // V8.9: Security architecture blueprint — from securityIntelligence embedded in backend blueprint
      securityBlueprint: backendArchitectOutput.blueprint.securityIntelligence,
      securityArchitectureScore: backendArchitectOutput.blueprint.securityIntelligence.overallScore,
      // V9.0: Runtime Intelligence blueprint — generation strategy brain
      runtimeBlueprint: runtimeIntelligenceOutput.blueprint,
      runtimeScore: runtimeIntelligenceOutput.overallScore,
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
