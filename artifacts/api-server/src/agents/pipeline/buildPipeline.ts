import type { Response } from "express";
import { sse } from "../streaming/sseManager.js";
import { runPlannerStep } from "./plannerStep.js";
import { runArchitectureStep } from "./architectureStep.js";
import { runFrontendStep } from "./frontendStep.js";
import { runRepairStep } from "./repairStep.js";
import { runBackendStep } from "./backendStep.js";
import { runRuntimeValidationStep } from "./runtimeValidationStep.js";
import type { PipelineKeys } from "./pipelineTypes.js";

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

  const plan = await runPlannerStep(prompt, keys, res);

  const architecture = await runArchitectureStep(plan, prompt, keys, res);

  const frontend = await runFrontendStep(architecture, prompt, keys, res);

  const repairedFrontend = await runRepairStep(frontend, keys, res);

  const backend = await runBackendStep(architecture, repairedFrontend, keys, res);

  const runtimeResult = await runRuntimeValidationStep(
    {
      allFiles: backend.allFiles,
      projectBlueprint: architecture.projectBlueprint,
      knowledgeGraph: backend.knowledgeGraph,
      chatId,
    },
    keys,
    res
  );

  const { blueprint, cleanPlan, dnaComposition, dnaOwnership, dnaTheme, dnaMotion } = plan;

  sse(res, {
    type: "done",
    code: repairedFrontend.fixedCode,
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
}
