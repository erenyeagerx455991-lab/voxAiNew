import type { Response } from "express";
import { sse } from "../streaming/sseManager.js";
import { callAI } from "../llm/aiService.js";
import { DESIGN_SYSTEM, CODEFIX_SYSTEM } from "../llm/prompts.js";
import { buildCodeSystem, DEFAULT_DESIGN } from "../frontend/codeSystem.js";
import { buildServerProjectFiles } from "../frontend/frontendAgent.js";
import { selectRegistryComponentsServer } from "../dna/dnaAgent.js";
import { selectTemplatesForPrompt, buildContextFromTemplates } from "../../components/registry.js";
import { truncateForGroq } from "../../contextManager.js";
import type { DesignDNA, ProjectFileSSE } from "../types.js";
import type { ArchitectureOutput, FrontendOutput, PipelineKeys } from "./pipelineTypes.js";
import { createLogger } from "../../lib/structuredLogger.js";
import { isComponentDeprecated, getBestAlternativeInCategory } from "../../quality/componentMetrics.js";
import { extractRetrievalIntent } from "../../design-rag/retriever.js";
import { retrieveAllSections, buildSectionRetrievalContext } from "../../design-rag/sectionRetriever.js";
import { buildMotionContext } from "../../design-rag/motionRetriever.js";

const log = createLogger("FrontendStep");

const REFERENCE_VERIFIERS: Record<string, (d: DesignDNA) => boolean> = {
  stripe:     (d) => d.designLanguage === "premium-gradient" && d.heroStyle === "centered-gradient" && d.colorSystem.background !== "#0a0a0a",
  linear:     (d) => d.designLanguage === "minimal-flat" && d.heroStyle === "editorial-large" && d.decorationLevel === "none",
  vercel:     (d) => d.designLanguage === "monochrome" && d.heroStyle === "split-layout",
  notion:     (d) => (d.colorSystem.theme === "light" || d.theme === "light") && d.heroStyle === "editorial-large",
  framer:     (d) => d.designLanguage === "bold-motion" && d.animationPersonality === "expressive",
  cursor:     (d) => d.colorSystem.primary !== "#ffffff" && d.designLanguage !== "premium-gradient",
  perplexity: (d) => d.colorSystem.primary !== "#ffffff" && d.colorSystem.primary !== "#e5e5e5",
};

const REFERENCE_DNA_REQUIREMENTS: Record<string, { designLanguage: string; heroStyle: string; extra?: string }> = {
  stripe:  { designLanguage: "premium-gradient", heroStyle: "centered-gradient", extra: 'decorationLevel MUST be "rich", animationPersonality MUST be "expressive"' },
  linear:  { designLanguage: "minimal-flat",     heroStyle: "editorial-large",   extra: 'decorationLevel MUST be "none", animationPersonality MUST be "subtle"' },
  vercel:  { designLanguage: "monochrome",        heroStyle: "split-layout",      extra: 'decorationLevel MUST be "none", animationPersonality MUST be "subtle"' },
  framer:  { designLanguage: "bold-motion",       heroStyle: "editorial-large",   extra: 'animationPersonality MUST be "expressive"' },
  notion:  { designLanguage: "editorial",         heroStyle: "editorial-large",   extra: 'theme MUST be "light"' },
};

function detectKnownRefs(refs: string): string[] {
  const lower = refs.toLowerCase();
  return Object.keys(REFERENCE_VERIFIERS).filter(r => lower.includes(r));
}

function verifyDNA(design: DesignDNA, refs: string): { passed: boolean; failedRefs: string[] } {
  const known = detectKnownRefs(refs);
  if (known.length === 0) return { passed: true, failedRefs: [] };
  const failedRefs = known.filter(r => !REFERENCE_VERIFIERS[r](design));
  return { passed: failedRefs.length === 0, failedRefs };
}

function parseDesignRaw(raw: string): DesignDNA | null {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const merged: DesignDNA = { ...DEFAULT_DESIGN, ...parsed };
    if (parsed.colorSystem) merged.colorSystem = { ...DEFAULT_DESIGN.colorSystem, ...parsed.colorSystem };
    if (parsed.typographySystem) merged.typographySystem = { ...DEFAULT_DESIGN.typographySystem, ...parsed.typographySystem };
    if (parsed.spacingSystem) merged.spacingSystem = { ...DEFAULT_DESIGN.spacingSystem, ...parsed.spacingSystem };
    return merged;
  } catch { return null; }
}

async function runDesignAgent(
  openrouterKey: string,
  designPrompt: string,
  overridePrompt?: string
): Promise<{ raw: string; parsed: DesignDNA | null; error: string | null }> {
  try {
    const raw = await callAI(
      openrouterKey,
      [{ role: "system", content: DESIGN_SYSTEM }, { role: "user", content: overridePrompt ?? designPrompt }],
      { label: "design", maxTokens: 1500 }
    );
    return { raw, parsed: parseDesignRaw(raw), error: null };
  } catch (e: unknown) {
    const errMsg = `Design Agent FAILED: ${e instanceof Error ? e.message : String(e)}`;
    log.error("DESIGN_AGENT_FAILED", { errMsg });
    return { raw: "", parsed: null, error: errMsg };
  }
}

export async function runFrontendStep(
  arch: ArchitectureOutput,
  prompt: string,
  keys: PipelineKeys,
  res: Response
): Promise<FrontendOutput> {
  const { openrouterKey } = keys;
  const { plan, projectBlueprint } = arch;
  const { blueprint, referenceSites, primaryReference, dnaComposition, dnaOwnership, dnaTheme, briefText, cleanPlan } = plan;

  sse(res, { type: "step", step: 2, agent: "Design Agent", status: "active" });

  const dnaContextStr = dnaTheme ? String(dnaTheme) : '';
  const designPrompt = [
    `Website brief:\n${briefText || prompt}`,
    `Website type: ${blueprint.websiteType}`,
    referenceSites !== "none" ? `Design references: ${referenceSites}` : "",
    dnaContextStr,
    `\nGenerate the complete design DNA JSON for this site.`,
  ].filter(Boolean).join('\n');

  let design: DesignDNA = { ...DEFAULT_DESIGN };
  let designAgentStatus: "success" | "failed" | "retry_success" | "retry_failed" = "failed";
  let designAgentError: string | null = null;

  const attempt1 = await runDesignAgent(openrouterKey, designPrompt);
  if (attempt1.parsed) {
    const verify = verifyDNA(attempt1.parsed, referenceSites);
    if (verify.passed) {
      design = attempt1.parsed;
      designAgentStatus = "success";
      log.info("DESIGN_DNA_PASSED", { attempt: 1, refs: referenceSites });
    } else {
      log.warn("DESIGN_DNA_VERIFY_FAILED", { attempt: 1, failedRefs: verify.failedRefs });
      sse(res, { type: "design_retry", reason: `DNA verification failed for: [${verify.failedRefs.join(", ")}]`, failedFields: { designLanguage: attempt1.parsed.designLanguage, background: attempt1.parsed.colorSystem.background } });
      const primLower = primaryReference.toLowerCase();
      const req = REFERENCE_DNA_REQUIREMENTS[primLower];
      const retryUserPrompt = req
        ? [`CRITICAL: The PRIMARY reference is "${primaryReference}". You MUST output EXACTLY:`, `  designLanguage: "${req.designLanguage}"`, `  heroStyle: "${req.heroStyle}"`, req.extra ? `  ${req.extra}` : '', `\n${designPrompt}`].filter(Boolean).join('\n')
        : [`IMPORTANT: The PRIMARY reference is "${primaryReference}". Apply its DNA EXACTLY.`, `\n${designPrompt}`].join('\n');
      const attempt2 = await runDesignAgent(openrouterKey, designPrompt, retryUserPrompt);
      if (attempt2.parsed) {
        const verify2 = verifyDNA(attempt2.parsed, referenceSites);
        design = attempt2.parsed;
        designAgentStatus = verify2.passed ? "retry_success" : "retry_failed";
        if (!verify2.passed) log.warn("DESIGN_DNA_RETRY_FAILED", { failedRefs: verify2.failedRefs });
      } else {
        designAgentStatus = "retry_failed";
        designAgentError = attempt2.error;
        log.error("DESIGN_AGENT_RETRY_FAILED", { error: attempt2.error });
      }
    }
  } else {
    designAgentError = attempt1.error ?? "Design Agent returned unparseable output";
    sse(res, { type: "design_agent_error", designAgentStatus: "failed", error: designAgentError });
    log.error("DESIGN_AGENT_DEFAULT", { reason: designAgentError });
  }

  log.info("DESIGN_DNA_RESOLVED", { status: designAgentStatus, language: design.designLanguage, heroStyle: design.heroStyle });
  sse(res, { type: "step", step: 2, agent: "Design Agent", status: "done", design, designAgentStatus, designAgentError });

  const selectedTemplates = selectTemplatesForPrompt(prompt, blueprint.sectionOrder, design, referenceSites, primaryReference);
  const componentContext = buildContextFromTemplates(selectedTemplates);
  log.info("COMPONENT_TEMPLATES_SELECTED", { count: selectedTemplates.length });

  let registrySelection: Record<string, string> = {};
  try {
    registrySelection = selectRegistryComponentsServer(dnaComposition, blueprint, projectBlueprint);

    // ── V7.1.6 Phase 4: Swap deprecated components with best alternatives ──
    for (const [category, hint] of Object.entries(registrySelection)) {
      const componentId = hint.split(/\s/)[0];
      if (componentId && isComponentDeprecated(componentId)) {
        const alt = getBestAlternativeInCategory(category, componentId);
        if (alt) {
          registrySelection[category] = alt;
          log.warn("REGISTRY_DEPRECATED_SWAPPED", { category, from: componentId, to: alt });
        } else {
          delete registrySelection[category];
          log.warn("REGISTRY_DEPRECATED_REMOVED", { category, componentId });
        }
      }
    }

    if (Object.keys(registrySelection).length > 0) {
      log.info("REGISTRY_SELECTED", { count: Object.keys(registrySelection).length });
      sse(res, { type: "registry_selection", selection: registrySelection });
    }
  } catch (e) { log.error("REGISTRY_SELECTION_FAILED", { error: String(e) }); }

  // ── V7.2.9: Motion RAG context ───────────────────────────────────────────────
  let motionCtx = '';
  try {
    motionCtx = buildMotionContext(design.designLanguage ?? 'minimal-flat', blueprint.sectionOrder);
    log.info("MOTION_RAG_BUILT", { designLanguage: design.designLanguage, sections: blueprint.sectionOrder.length });
  } catch (e) { log.error("MOTION_RAG_FAILED", { error: String(e) }); }

  // ── V7.2.2 Phase 4+5: Section-Level Design RAG retrieval ─────────────────
  let retrievalCtx = '';
  let retrievalReferenceIds: string[] = [];
  try {
    const ragIntent = extractRetrievalIntent(
      prompt,
      blueprint.sectionOrder,
      design.designLanguage ?? 'monochrome',
      dnaComposition as Record<string, number>,
      arch.plan.authState ?? 'guest',
    );
    const sectionResult = retrieveAllSections(blueprint.sectionOrder, {
      dna:            (dnaComposition as Record<string, number>) ?? {},
      designLanguage: design.designLanguage ?? 'monochrome',
      industry:       ragIntent.industry,
      keywords:       ragIntent.keywords,
      prompt,
    });
    retrievalCtx = buildSectionRetrievalContext(sectionResult);
    retrievalReferenceIds = sectionResult.allReferenceIds;
    log.info("SECTION_RAG_RETRIEVED", {
      sections: sectionResult.totalRetrievals,
      refs:     sectionResult.allReferenceIds.length,
      hitRate:  sectionResult.hitRate,
    });
  } catch (e) { log.error("DESIGN_RAG_FAILED", { error: String(e) }); }

  sse(res, { type: "step", step: 3, agent: "Frontend Agent", status: "active" });

  const sectionCount = blueprint.sectionOrder.length;
  const isMultiPageApp = projectBlueprint.pages.length > 1;

  // V7.2.6.1: inject auth routing context so codegen uses the correct navbar variant
  const authState = arch.plan.authState ?? 'guest';
  const navbarVariant = arch.plan.navbarVariant ?? 'navbar-navigation-saas-v1';
  const authNavbarInstruction = authState !== 'guest'
    ? `\n\nNAVBAR REQUIREMENT (auth-routing): Auth state detected as "${authState}". Use navbar variant "${navbarVariant}". This means:${
        authState === 'admin'
          ? ' Include <Command> palette (⌘K), <Avatar>+<DropdownMenu> for profile, <Badge> for environment indicator, <Sheet> for mobile/workspace drawer.'
          : authState === 'dashboard'
          ? ' Include <Avatar>+<DropdownMenu> for profile, <Sheet> for workspace/mobile drawer, optional <Command> for search.'
          : ' Include <Avatar>+<DropdownMenu> for user profile menu with Profile/Settings/Logout items.'
      } Do NOT generate a plain marketing navbar (no auth components) for an authenticated product.`
    : '';

  const codegenUserPrompt = isMultiPageApp
    ? `Build a ${projectBlueprint.projectType} with these pages: ${projectBlueprint.pages.join(', ')}.\n\nPrompt: ${prompt}\nPlan: ${cleanPlan}${authNavbarInstruction}\n\nApply the design DNA above to ALL pages. Do not truncate.`
    : `Build a complete landing page for: ${prompt}\n\nPlan context:\n${cleanPlan}${authNavbarInstruction}\n\nBUILD EXACTLY ${sectionCount} SECTIONS in this order: ${blueprint.sectionOrder.join(' → ')}. Apply the design DNA precisely. Do not truncate.`;

  let generatedCode = "";
  try {
    const codegenSystemParts = [buildCodeSystem(design, blueprint, componentContext, projectBlueprint, registrySelection)];
    if (retrievalCtx) codegenSystemParts.push(retrievalCtx);
    if (motionCtx) codegenSystemParts.push(motionCtx);
    generatedCode = await callAI(
      openrouterKey,
      [{ role: "system", content: codegenSystemParts.join('\n\n') }, { role: "user", content: codegenUserPrompt }],
      { label: "codegen", maxTokens: 8000, stream: true, onToken: (t) => sse(res, { type: "codegen_token", token: t }) }
    );
  } catch (e) {
    log.error("CODEGEN_ALL_MODELS_FAILED", { error: String(e) });
  }

  generatedCode = generatedCode.replace(/^```(?:jsx?|tsx?|javascript|typescript)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  sse(res, { type: "step", step: 3, agent: "Frontend Agent", status: "done" });

  sse(res, { type: "step", step: 4, agent: "Code Fix Agent", status: "active" });
  let fixedCode = generatedCode;
  try {
    const codeFix_userRaw = `Fix this React website code (keep all ${sectionCount} sections intact — do NOT add or remove any sections):\n\n${generatedCode}`;
    const { system: cfSystem, user: cfUser } = truncateForGroq(CODEFIX_SYSTEM, codeFix_userRaw, 5_000);
    const fixed = await callAI(
      openrouterKey,
      [{ role: "system", content: cfSystem }, { role: "user", content: cfUser }],
      { label: "codefix", maxTokens: 5_000 }
    );
    if (fixed && fixed.length > 200) {
      fixedCode = fixed.replace(/^```(?:jsx?|tsx?|javascript|typescript)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    }
  } catch (e) { log.error("CODEFIX_AGENT_FAILED", { error: String(e) }); }
  sse(res, { type: "step", step: 4, agent: "Code Fix Agent", status: "done" });

  const projectFiles = buildServerProjectFiles(fixedCode, projectBlueprint, blueprint.sectionOrder);
  log.info("PROJECT_FILES_GENERATED", { count: projectFiles.length });

  return {
    architecture: arch,
    design,
    designAgentStatus,
    designAgentError,
    projectFiles: projectFiles as ProjectFileSSE[],
    fixedCode,
    buildHealthMetrics: {},
    registrySelection,
    retrievalContext: retrievalCtx,
    retrievalReferenceIds,
  };
}
