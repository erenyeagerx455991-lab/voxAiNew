import type { Response } from "express";
import { sse } from "../streaming/sseManager.js";
import { callAI } from "../llm/aiService.js";
import { PLANNER_SYSTEM } from "../llm/prompts.js";
import {
  extractDNAComposition, EMPTY_DNA, DNA_BRAND_KEYS,
  resolveSectionOwnershipServer, generateThemeTokensServer, generateMotionProfileServer,
  COMPOSITION_SECTIONS, buildDNAContextString,
} from "../dna/dnaAgent.js";
import { serverMatchTemplate, buildTemplateContextServer } from "../templates/templateAgent.js";
import type { PageBlueprint } from "../types.js";
import type { PlannerOutput, PipelineKeys } from "./pipelineTypes.js";
import { classifyAuthState } from "../../auth/authStateClassifier.js";
import { recordAuthRouting } from "../../auth/authRoutingMetrics.js";
import { createLogger } from "../../lib/structuredLogger.js";

const log = createLogger("PlannerStep");

export async function runPlannerStep(
  prompt: string,
  keys: PipelineKeys,
  res: Response
): Promise<PlannerOutput> {
  const { openrouterKey } = keys;

  sse(res, { type: "step", step: 0, agent: "Planner Agent", status: "active" });

  let planText = "";
  await callAI(
    openrouterKey,
    [{ role: "system", content: PLANNER_SYSTEM }, { role: "user", content: prompt }],
    {
      label: "planner",
      maxTokens: 1800,
      stream: true,
      onToken: (token) => {
        planText += token;
        if (!planText.includes("---DESIGN_BRIEF---")) sse(res, { type: "token", token });
      },
    }
  );

  let briefText = "";
  const briefMatch = planText.match(/---DESIGN_BRIEF---([\s\S]*?)---END_BRIEF---/);
  if (briefMatch) briefText = briefMatch[1].trim();

  let referenceSites = "none";
  const refMatch = briefText.match(/referenceSites:\s*(.+)/);
  if (refMatch) referenceSites = refMatch[1].trim();

  let primaryReference = "none";
  const primaryRefMatch = briefText.match(/primaryReference:\s*(.+)/);
  if (primaryRefMatch) primaryReference = primaryRefMatch[1].trim();
  if (primaryReference === "none" && referenceSites !== "none") {
    primaryReference = referenceSites.split(',')[0].trim();
  }

  let secondaryReferences: string[] = [];
  const secondaryRefMatch = briefText.match(/secondaryReferences:\s*(.+)/);
  if (secondaryRefMatch && secondaryRefMatch[1].trim() !== "none") {
    secondaryReferences = secondaryRefMatch[1].trim().split(',').map(s => s.trim());
  }

  const cleanPlan = planText
    .replace(/---DESIGN_BRIEF---[\s\S]*?---END_BRIEF---/, "")
    .replace(/---PAGE_BLUEPRINT---[\s\S]*?---END_BLUEPRINT---/, "")
    .trim();

  let blueprint: PageBlueprint = {
    websiteType: "Generic",
    sectionOrder: ["Navbar", "Hero", "Features", "Testimonials", "CTA", "Footer"],
  };
  const blueprintMatch = planText.match(/---PAGE_BLUEPRINT---([\s\S]*?)---END_BLUEPRINT---/);
  if (blueprintMatch) {
    try {
      const raw = blueprintMatch[1].trim();
      const parsed = JSON.parse(raw);
      if (parsed.sectionOrder && Array.isArray(parsed.sectionOrder) && parsed.sectionOrder.length >= 3) {
        blueprint = parsed as PageBlueprint;
      }
    } catch (e) {
      log.error("BLUEPRINT_PARSE_FAILED", { error: String(e) });
    }
  }

  log.info("BLUEPRINT_RESOLVED", { websiteType: blueprint.websiteType, sections: blueprint.sectionOrder });
  log.info("DESIGN_REFERENCES", { referenceSites, primaryReference });
  sse(res, { type: "step", step: 0, agent: "Planner Agent", status: "done", blueprint });

  let dnaComposition = { ...EMPTY_DNA };
  let dnaOwnership: Record<string, string> = {};
  let dnaTheme: ReturnType<typeof generateThemeTokensServer> | null = null;
  let dnaMotion: ReturnType<typeof generateMotionProfileServer> | null = null;

  try {
    dnaComposition = await extractDNAComposition(prompt, referenceSites, primaryReference, secondaryReferences, openrouterKey);
    const activeBrands = DNA_BRAND_KEYS.filter(k => dnaComposition[k] > 0);
    if (activeBrands.length > 0) {
      const sectionList = [...new Set([
        ...COMPOSITION_SECTIONS,
        ...(blueprint.sectionOrder || []).map(s => s.toLowerCase()),
      ])];
      dnaOwnership = resolveSectionOwnershipServer(dnaComposition, sectionList);
      dnaTheme = generateThemeTokensServer(dnaComposition);
      dnaMotion = generateMotionProfileServer(dnaComposition);
      log.info("DNA_COMPOSITION", { brands: activeBrands.map(k => `${k}:${dnaComposition[k as keyof typeof dnaComposition]}%`).join(' + ') });
      sse(res, {
        type: "dna_composition",
        composition: dnaComposition,
        sectionOwnership: dnaOwnership,
        themeTokens: dnaTheme,
        motionProfile: dnaMotion,
      });
    }
  } catch (e) {
    log.error("DNA_MIXER_FAILED", { error: String(e) });
  }

  const tplMatch = serverMatchTemplate(prompt);
  const templateContext = buildTemplateContextServer(tplMatch.template);
  sse(res, {
    type: "template_selected",
    templateId: tplMatch.templateId,
    templateName: tplMatch.template.name,
    confidence: tplMatch.confidence,
    pages: tplMatch.template.pages,
    apis: tplMatch.template.apis,
    databaseTables: tplMatch.template.databaseTables,
    features: tplMatch.template.features,
  });
  log.info("TEMPLATE_MATCHED", { templateName: tplMatch.template.name, confidence: tplMatch.confidence });

  const dnaContextStr = dnaTheme
    ? buildDNAContextString(dnaComposition, dnaOwnership, dnaTheme)
    : '';

  const authClassification = classifyAuthState(prompt, dnaComposition as unknown as Record<string, number>);
  recordAuthRouting(authClassification);
  log.info("AUTH_STATE_CLASSIFIED", {
    authState: authClassification.authState,
    navbarVariant: authClassification.navbarVariant,
    confidence: authClassification.confidence,
  });
  sse(res, {
    type: "auth_state_classified",
    authState: authClassification.authState,
    navbarVariant: authClassification.navbarVariant,
    confidence: authClassification.confidence,
    allScores: authClassification.allScores,
  });

  return {
    cleanPlan,
    briefText,
    referenceSites,
    primaryReference,
    secondaryReferences,
    blueprint,
    dnaComposition,
    dnaOwnership,
    dnaTheme: dnaTheme as Record<string, unknown> | null,
    dnaMotion: dnaMotion as Record<string, unknown> | null,
    templateContext,
    templateMatch: {
      templateId: tplMatch.templateId,
      template: tplMatch.template as unknown as Record<string, unknown>,
      confidence: tplMatch.confidence,
      pages: tplMatch.template.pages,
      apis: tplMatch.template.apis,
      databaseTables: tplMatch.template.databaseTables,
      features: tplMatch.template.features,
    },
    authState: authClassification.authState,
    navbarVariant: authClassification.navbarVariant,
    authConfidence: authClassification.confidence,
  };
}
