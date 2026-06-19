import type { Response } from "express";
import { sse } from "../streaming/sseManager.js";
import { callGroq, PLANNER_MODEL } from "../llm/llmClient.js";
import { ARCHITECTURE_SYSTEM } from "../llm/prompts.js";
import { validateProjectBlueprint, computeQualityScore } from "../config/configGenerators.js";
import type { ProjectBlueprint } from "../types.js";
import type { PlannerOutput, ArchitectureOutput, PipelineKeys } from "./pipelineTypes.js";
import { createLogger } from "../../lib/structuredLogger.js";

const log = createLogger("ArchitectureStep");

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
    log.error("ARCHITECTURE_LLM_FAILED", { error: String(e), fallback: "using defaults" });
  }

  let bpValidation = validateProjectBlueprint(projectBlueprint);
  if (!bpValidation.valid) {
    log.warn("BLUEPRINT_VALIDATION_FAILED", { errors: bpValidation.errors.join('; ') });
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
      log.error("BLUEPRINT_RETRY_FAILED", { error: String(e) });
    }

    if (!bpValidation.valid) {
      sse(res, { type: "error", error: `Blueprint validation failed after retry: ${bpValidation.errors.join(', ')}` });
      throw new Error(`Blueprint validation failed: ${bpValidation.errors.join(', ')}`);
    }
  }

  log.info("ARCHITECTURE_RESOLVED", {
    projectType: projectBlueprint.projectType,
    pages: projectBlueprint.pages,
    apis: projectBlueprint.apis,
  });

  const qg = computeQualityScore(projectBlueprint);
  log.info("QUALITY_GATE", { score: qg.score, passed: qg.passed, issues: qg.issues });
  sse(res, { type: "quality_gate", score: qg.score, passed: qg.passed, issues: qg.issues });

  if (!qg.passed) {
    log.warn("QUALITY_GATE_RETRY", { score: qg.score, issues: qg.issues });
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
        log.info("QUALITY_GATE_RETRY_RESULT", { score: qg2.score, passed: qg2.passed });
        sse(res, { type: "quality_gate_retry", score: qg2.score, passed: qg2.passed });
      }
    } catch (e) {
      log.error("QUALITY_GATE_RETRY_FAILED", { error: String(e) });
    }
  }

  sse(res, { type: "step", step: 1, agent: "Architecture Agent", status: "done", projectBlueprint });

  return { plan, projectBlueprint };
}
