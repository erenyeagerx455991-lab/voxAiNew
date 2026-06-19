import type { Response } from "express";
import { sse } from "../streaming/sseManager.js";
import { callGroq, callOpenRouter, DESIGN_MODEL, CODEGEN_MODEL, CODEFIX_MODEL } from "../llm/llmClient.js";
import { DESIGN_SYSTEM, CODEFIX_SYSTEM } from "../llm/prompts.js";
import { buildCodeSystem, DEFAULT_DESIGN } from "../frontend/codeSystem.js";
import { buildServerProjectFiles } from "../frontend/frontendAgent.js";
import { selectRegistryComponentsServer } from "../dna/dnaAgent.js";
import { selectTemplatesForPrompt, buildContextFromTemplates } from "../../components/registry.js";
import { truncateForGroq } from "../../contextManager.js";
import type { DesignDNA, ProjectFileSSE, OpenRouterError } from "../types.js";
import type { ArchitectureOutput, FrontendOutput, PipelineKeys } from "./pipelineTypes.js";

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
    const raw = await callOpenRouter(openrouterKey, DESIGN_MODEL,
      [{ role: "system", content: DESIGN_SYSTEM }, { role: "user", content: overridePrompt ?? designPrompt }],
      1500
    );
    return { raw, parsed: parseDesignRaw(raw), error: null };
  } catch (e: unknown) {
    const err = e as OpenRouterError;
    const errMsg = `Design Agent FAILED — model: ${DESIGN_MODEL}, status: ${err.status ?? "unknown"}, message: ${err.message}`;
    console.error(`[DesignAgent] ${errMsg}`);
    return { raw: "", parsed: null, error: errMsg };
  }
}

export async function runFrontendStep(
  arch: ArchitectureOutput,
  prompt: string,
  keys: PipelineKeys,
  res: Response
): Promise<FrontendOutput> {
  const { groqKey, openrouterKey } = keys;
  const { plan, projectBlueprint } = arch;
  const { blueprint, referenceSites, primaryReference, dnaComposition, dnaOwnership, dnaTheme, briefText, cleanPlan } = plan;

  sse(res, { type: "step", step: 2, agent: "Design Agent", status: "active" });

  const dnaContextStr = dnaTheme
    ? String(dnaTheme)
    : '';
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
      console.log(`[DesignAgent] Attempt 1 PASSED. refs="${referenceSites}"`);
    } else {
      console.warn(`[DesignAgent] DNA verification FAILED for [${verify.failedRefs.join(", ")}]. Retrying...`);
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
        if (!verify2.passed) console.warn(`[DesignAgent] Retry also failed for [${verify2.failedRefs.join(", ")}]. Using anyway.`);
      } else {
        designAgentStatus = "retry_failed";
        designAgentError = attempt2.error;
        console.error(`[DesignAgent] Retry failed: ${attempt2.error}`);
      }
    }
  } else {
    designAgentError = attempt1.error ?? "Design Agent returned unparseable output";
    sse(res, { type: "design_agent_error", designAgentStatus: "failed", error: designAgentError, model: DESIGN_MODEL });
    console.error(`[DesignAgent] Using DEFAULT_DESIGN. Reason: ${designAgentError}`);
  }

  console.log(`[Design DNA] status=${designAgentStatus} language=${design.designLanguage} heroStyle=${design.heroStyle} bg=${design.colorSystem.background}`);
  sse(res, { type: "step", step: 2, agent: "Design Agent", status: "done", design, designAgentStatus, designAgentError });

  const selectedTemplates = selectTemplatesForPrompt(prompt, blueprint.sectionOrder, design, referenceSites, primaryReference);
  const componentContext = buildContextFromTemplates(selectedTemplates);
  console.log(`[ComponentLib] Selected ${selectedTemplates.length} templates`);

  let registrySelection: Record<string, string> = {};
  try {
    registrySelection = selectRegistryComponentsServer(dnaComposition, blueprint, projectBlueprint);
    if (Object.keys(registrySelection).length > 0) {
      console.log(`[Registry V5.4] Selected ${Object.keys(registrySelection).length} components`);
      sse(res, { type: "registry_selection", selection: registrySelection });
    }
  } catch (e) { console.error('[Registry V5.4] Selection failed (continuing):', e); }

  sse(res, { type: "step", step: 3, agent: "Frontend Agent", status: "active" });

  const sectionCount = blueprint.sectionOrder.length;
  const isMultiPageApp = projectBlueprint.pages.length > 1;

  const codegenUserPrompt = isMultiPageApp
    ? `Build a ${projectBlueprint.projectType} with these pages: ${projectBlueprint.pages.join(', ')}.\n\nPrompt: ${prompt}\nPlan: ${cleanPlan}\n\nApply the design DNA above to ALL pages. Do not truncate.`
    : `Build a complete landing page for: ${prompt}\n\nPlan context:\n${cleanPlan}\n\nBUILD EXACTLY ${sectionCount} SECTIONS in this order: ${blueprint.sectionOrder.join(' → ')}. Apply the design DNA precisely. Do not truncate.`;

  let generatedCode = "";
  try {
    generatedCode = await callOpenRouter(openrouterKey, CODEGEN_MODEL,
      [{ role: "system", content: buildCodeSystem(design, blueprint, componentContext, projectBlueprint, registrySelection) }, { role: "user", content: codegenUserPrompt }],
      8000
    );
  } catch (e) {
    console.error("OpenRouter codegen failed, falling back to Groq:", e);
    generatedCode = await callGroq(groqKey, "llama-3.3-70b-versatile",
      [{ role: "system", content: buildCodeSystem(design, blueprint, componentContext, projectBlueprint, registrySelection) }, { role: "user", content: codegenUserPrompt }],
      false, 8000
    );
  }

  generatedCode = generatedCode.replace(/^```(?:jsx?|tsx?|javascript|typescript)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  sse(res, { type: "step", step: 3, agent: "Frontend Agent", status: "done" });

  sse(res, { type: "step", step: 4, agent: "Code Fix Agent", status: "active" });
  let fixedCode = generatedCode;
  try {
    const codeFix_userRaw = `Fix this React website code (keep all ${sectionCount} sections intact — do NOT add or remove any sections):\n\n${generatedCode}`;
    const { system: cfSystem, user: cfUser } = truncateForGroq(CODEFIX_SYSTEM, codeFix_userRaw, 5_000);
    const fixed = await callGroq(groqKey, CODEFIX_MODEL,
      [{ role: "system", content: cfSystem }, { role: "user", content: cfUser }],
      false, 5_000
    );
    if (fixed && fixed.length > 200) {
      fixedCode = fixed.replace(/^```(?:jsx?|tsx?|javascript|typescript)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    }
  } catch (e) { console.error("Code fix agent error (using generated code):", e); }
  sse(res, { type: "step", step: 4, agent: "Code Fix Agent", status: "done" });

  const projectFiles = buildServerProjectFiles(fixedCode, projectBlueprint, blueprint.sectionOrder);
  console.log(`[ProjectFiles] Generated ${projectFiles.length} files`);

  return {
    architecture: arch,
    design,
    designAgentStatus,
    designAgentError,
    projectFiles: projectFiles as ProjectFileSSE[],
    fixedCode,
    buildHealthMetrics: {},
    registrySelection,
  };
}
