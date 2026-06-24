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
import { runBackendStep } from "./backendStep.js";
import { runRuntimeValidationStep } from "./runtimeValidationStep.js";
import type { PipelineKeys } from "./pipelineTypes.js";
import { createTraceContext, withBuildId } from "../../telemetry/traceContext.js";
import { setLogContext, clearLogContext } from "../../lib/structuredLogger.js";
import { recordBuildStart, recordBuildSuccess, recordBuildFailure } from "../../telemetry/buildMetrics.js";
import { withAgentMetrics } from "../../telemetry/agentMetrics.js";
import { buildComponentTree } from "../../component-tree/treeBuilder.js";
import { validateTree } from "../../component-tree/treeValidator.js";
import { recordTreeBuild } from "../../telemetry/componentTreeMetrics.js";

export interface BuildPipelineInput {
  prompt: string;
  chatId: string;
  keys: PipelineKeys;
}

export async function runBuildPipeline(
  input: BuildPipelineInput,
  res: Response
): Promise<void> {
  const { prompt, chatId, keys } = input;
  const buildId = chatId;

  const trace = withBuildId(createTraceContext({ requestId: chatId }), buildId);
  setLogContext({ traceId: trace.traceId, requestId: trace.requestId, buildId });

  recordBuildStart(buildId, trace, prompt);

  try {
    const plan = await withAgentMetrics("Planner", () =>
      runPlannerStep(prompt, keys, res)
    );

    const architecture = await withAgentMetrics("Architecture", () =>
      runArchitectureStep(plan, prompt, keys, res)
    );

    // V7.3.2: Build component tree between architecture and frontend
    const componentTree = buildComponentTree({ plan, architecture, buildId: chatId });
    const treeValidation = validateTree(componentTree);
    recordTreeBuild(componentTree, treeValidation.score, treeValidation.errors.length, treeValidation.warnings.length);

    const frontend = await withAgentMetrics("Frontend", () =>
      runFrontendStep(architecture, prompt, keys, res, componentTree)
    );

    // V7.2.0: generate B+C candidates, evaluate all 3, select best
    const { winner } = await withAgentMetrics("CandidateSelection", () =>
      runCandidateSelectionStep(frontend, prompt, keys, res, buildId)
    );

    // Phase 6: only the winning candidate enters the repair loop
    const repairedFrontend = await withAgentMetrics("Repair", () =>
      runRepairStep(winner, keys, res)
    );

    const evaluatedFrontend = await withAgentMetrics("DesignEvaluator", () =>
      runDesignEvaluatorStep(repairedFrontend, keys, res)
    );

    // V7.3.0: Design Critic Agent — human-like review + targeted repair
    const criticFrontend = await withAgentMetrics("DesignCritic", () =>
      runDesignCriticStep(evaluatedFrontend, keys, res)
    );

    // V7.3.1: Conversion Intelligence Engine — CRO analysis + targeted repair
    const conversionFrontend = await withAgentMetrics("ConversionIntelligence", () =>
      runConversionStep(criticFrontend, keys, res)
    );

    const backend = await withAgentMetrics("Scaffold", () =>
      runBackendStep(architecture, conversionFrontend, keys, res)
    );

    const runtimeResult = await withAgentMetrics("RuntimeValidation", () =>
      runRuntimeValidationStep(
        { allFiles: backend.allFiles, projectBlueprint: architecture.projectBlueprint, knowledgeGraph: backend.knowledgeGraph, chatId },
        keys,
        res
      )
    );

    recordBuildSuccess(buildId);

    const { blueprint, cleanPlan, dnaComposition, dnaOwnership, dnaTheme, dnaMotion } = plan;

    sse(res, {
      type: "done",
      code: conversionFrontend.fixedCode,
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
    });
  } catch (err) {
    const e = err as Error;
    recordBuildFailure(buildId, e?.message);
    throw err;
  } finally {
    clearLogContext();
  }
}
