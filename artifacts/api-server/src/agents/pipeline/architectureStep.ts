import type { Response } from "express";
import { sse } from "../streaming/sseManager.js";
import { callGroq, PLANNER_MODEL } from "../llm/llmClient.js";
import { ARCHITECTURE_SYSTEM } from "../llm/prompts.js";
import { validateProjectBlueprint, computeQualityScore } from "../config/configGenerators.js";
import type { ProjectBlueprint } from "../types.js";
import type { PlannerOutput, ArchitectureOutput, PipelineKeys } from "./pipelineTypes.js";

export async function runArchitectureStep(
  plan: PlannerOutput,
  prompt: string,
  keys: PipelineKeys,
  res: Response
): Promise<ArchitectureOutput> {
  const { groqKey } = keys;
  const { blueprint, templateContext } = plan;

  sse(res, { type: "step", step: 1, agent: "Architecture Agent", status: "active" });

  let projectBlueprint: ProjectBlueprint = {
    projectType: blueprint.websiteType || "Landing Page",
    pages: ["Landing"],
    components: blueprint.sectionOrder || [],
    databaseTables: [],
    apis: [],
    authNeeded: false,
    authProvider: "",
    dashboardNeeded: false,
    entities: [],
    relationships: [],
    navigation: [],
    features: [],
    techStack: {
      frontend: "React + TypeScript + Tailwind CSS",
      routing: "React Router v6",
      ui: "shadcn/ui + Lucide Icons",
      backend: "Express.js + TypeScript",
      database: "PostgreSQL + Prisma",
    },
    description: "",
  };

  const userContent = `Prompt: ${prompt}\nWebsite type: ${blueprint.websiteType}\nSections: ${blueprint.sectionOrder.join(', ')}\n\n${templateContext}`;

  try {
    const archResult = await callGroq(
      groqKey, PLANNER_MODEL,
      [
        { role: "system", content: ARCHITECTURE_SYSTEM },
        { role: "user", content: userContent },
      ],
      false, 700
    );
    const archJsonMatch = archResult.match(/\{[\s\S]*\}/);
    if (archJsonMatch) {
      const parsed = JSON.parse(archJsonMatch[0]);
      projectBlueprint = { ...projectBlueprint, ...parsed };
    }
  } catch (e) {
    console.error("[ArchitectureAgent] Failed (using defaults):", e);
  }

  let bpValidation = validateProjectBlueprint(projectBlueprint);
  if (!bpValidation.valid) {
    console.warn(`[BlueprintValidation] FAILED: ${bpValidation.errors.join('; ')}. Retrying...`);
    sse(res, { type: "blueprint_validation_retry", errors: bpValidation.errors });
    try {
      const archRetry = await callGroq(
        groqKey, PLANNER_MODEL,
        [
          { role: "system", content: ARCHITECTURE_SYSTEM },
          { role: "user", content: `RETRY — previous blueprint was invalid (${bpValidation.errors.join(', ')}). Generate a complete valid blueprint.\n\nPrompt: ${prompt}\nWebsite type: ${blueprint.websiteType}` },
        ],
        false, 2000
      );
      const retryJsonMatch = archRetry.match(/\{[\s\S]*\}/);
      if (retryJsonMatch) {
        const retryParsed = JSON.parse(retryJsonMatch[0]);
        projectBlueprint = { ...projectBlueprint, ...retryParsed };
        bpValidation = validateProjectBlueprint(projectBlueprint);
      }
    } catch (e) {
      console.error('[BlueprintValidation] Retry failed:', e);
    }

    if (!bpValidation.valid) {
      sse(res, { type: "error", error: `Blueprint validation failed after retry: ${bpValidation.errors.join(', ')}` });
      throw new Error(`Blueprint validation failed: ${bpValidation.errors.join(', ')}`);
    }
  }

  console.log(`[Architecture V2] projectType=${projectBlueprint.projectType} pages=[${projectBlueprint.pages.join(', ')}] apis=[${projectBlueprint.apis.join(', ')}]`);

  const qg = computeQualityScore(projectBlueprint);
  console.log(`[QualityGate V2] score=${qg.score} passed=${qg.passed}${qg.issues.length ? ' — ' + qg.issues.join('; ') : ''}`);
  sse(res, { type: "quality_gate", score: qg.score, passed: qg.passed, issues: qg.issues });

  if (!qg.passed) {
    console.warn(`[QualityGate V2] Score ${qg.score} < 70 — retrying Architecture Agent...`);
    try {
      const qgRetry = await callGroq(
        groqKey, PLANNER_MODEL,
        [
          { role: "system", content: ARCHITECTURE_SYSTEM },
          { role: "user", content: `QUALITY FIX — Resolve: ${qg.issues.join('; ')}\n\nPrompt: ${prompt}\nWebsite type: ${blueprint.websiteType}\nSections: ${blueprint.sectionOrder.join(', ')}\n\nPrevious blueprint scored ${qg.score}/100.` },
        ],
        false, 2000
      );
      const qgJson = qgRetry.match(/\{[\s\S]*\}/);
      if (qgJson) {
        const qgParsed = JSON.parse(qgJson[0]);
        projectBlueprint = { ...projectBlueprint, ...qgParsed };
        const qg2 = computeQualityScore(projectBlueprint);
        console.log(`[QualityGate V2] Retry score=${qg2.score}`);
        sse(res, { type: "quality_gate_retry", score: qg2.score, passed: qg2.passed });
      }
    } catch (e) {
      console.error('[QualityGate V2] Retry failed:', e);
    }
  }

  sse(res, { type: "step", step: 1, agent: "Architecture Agent", status: "done", projectBlueprint });

  return { plan, projectBlueprint };
}
