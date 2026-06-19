import { Router } from "express";
import { selectTemplatesForPrompt, buildContextFromTemplates, getTemplatesByCategory, getRegistryCatalogue } from "../components/registry";
import { strToU8, zipSync } from "fflate";
import {
  buildMinimalEditContext,
  compressProjectMemory,
  truncateForGroq,
  estimateTokenCount,
  logCompressionReport,
  GROQ_TOKEN_BUDGET,
} from "../contextManager";
import { resolveDependencies } from "../runtime/dependencyResolver.js";
import { validateFiles, computeHealthScore, detectMissingImports, parseStaticValidatorScore, computeRepairQuality } from "../runtime/runtimeValidator.js";
import * as runtimeManager from "../runtime/runtimeManager.js";
import { classifyRuntimeError, REPAIR_PROMPTS } from "../runtime/repairStrategies.js";
import { buildRuntimeDependencyGraph, resolveImports, resolveComponents, resolveRoutes, resolvePackages } from "../runtime/dependencyResolverV2.js";
import { setupWorkspace, rebuildWorkspace, teardownWorkspace, buildRepairTargets } from "../runtime/buildExecutor.js";
import type { RealBuildError } from "../runtime/buildExecutor.js";

// ── Extracted module imports ──────────────────────────────────────────────────
import type { ProjectFileSSE, ProjectBlueprint, DesignDNA, PageBlueprint } from "../agents/types.js";
import { sse } from "../agents/streaming/sseManager.js";
import {
  callGroq, callOpenRouter,
  PLANNER_MODEL, DESIGN_MODEL, CODEGEN_MODEL, CODEFIX_MODEL, BACKEND_MODEL, REPAIR_MODEL,
} from "../agents/llm/llmClient.js";
import {
  PLANNER_SYSTEM, DESIGN_SYSTEM, ARCHITECTURE_SYSTEM, CODEFIX_SYSTEM,
  EDIT_SYSTEM, INTENT_SYSTEM,
} from "../agents/llm/prompts.js";
import {
  extractDNAComposition,
  type DNAComposition,
  EMPTY_DNA, DNA_BRAND_KEYS,
  resolveSectionOwnershipServer, generateThemeTokensServer, generateMotionProfileServer,
  COMPOSITION_SECTIONS,
  selectRegistryComponentsServer, computeRegistryHealthServer, buildDNAContextString,
} from "../agents/dna/dnaAgent.js";
import {
  generateBackendFiles, generateDatabaseFiles, generateAuthFiles,
} from "../agents/backend/backendAgent.js";
import {
  validateProjectBlueprint, computeQualityScore,
  generateReplitConfig, generateReplitNix, generateEnvExample, generateReadme,
  validateProject,
} from "../agents/config/configGenerators.js";
import {
  buildKnowledgeGraphServer, resolveEditTargetsServer,
  type ServerKnowledgeGraph,
} from "../agents/knowledge/knowledgeGraph.js";
import {
  resolveAffectedFiles, validateEditFiles, extractEditFiles, extractDeletedPaths, mergeProjectFiles,
} from "../agents/context/editHelpers.js";
import {
  serverMatchTemplate, buildTemplateContextServer,
  TEMPLATE_LIBRARY_SERVER, TEMPLATE_MATCH_KEYWORDS,
} from "../agents/templates/templateAgent.js";
import {
  buildCodeSystem, DEFAULT_DESIGN, validateTsxFile, runRuntimeValidator, validateRoutes,
} from "../agents/frontend/codeSystem.js";
import { buildServerProjectFiles } from "../agents/frontend/frontendAgent.js";

// ── Local types ───────────────────────────────────────────────────────────────
interface OpenRouterError extends Error {
  status?: number;
  requestId?: string;
  model?: string;
  body?: unknown;
}

const router: Router = Router();

// ── /agents/build ─────────────────────────────────────────────────────────────
router.post("/agents/build", async (req, res) => {
  const groqKey = process.env["GROQ_API_KEY"];
  const openrouterKey = process.env["OPENROUTER_API_KEY"];
  const { prompt, chatId: reqChatId, selectedTemplateId } = req.body as { prompt: string; chatId?: string; selectedTemplateId?: string };
  const chatId = reqChatId ?? `build-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (!groqKey) return res.status(500).json({ error: "GROQ_API_KEY not set" });
  if (!openrouterKey) return res.status(500).json({ error: "OPENROUTER_API_KEY not set" });
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    // ── AGENT 1: PLANNER ─────────────────────────────────────────────────────
    sse(res, { type: "step", step: 0, agent: "Planner Agent", status: "active" });

    let planText = "";
    await callGroq(groqKey, PLANNER_MODEL,
      [
        { role: "system", content: PLANNER_SYSTEM },
        { role: "user", content: prompt },
      ],
      true, 1800,
      (token) => {
        planText += token;
        if (!planText.includes("---DESIGN_BRIEF---")) {
          sse(res, { type: "token", token });
        }
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
        console.error("Failed to parse page blueprint, using defaults:", e);
      }
    }

    console.log(`[Blueprint] websiteType=${blueprint.websiteType} sections=[${blueprint.sectionOrder.join(', ')}]`);
    console.log(`[Design] referenceSites="${referenceSites}" primaryReference="${primaryReference}"`);
    sse(res, { type: "step", step: 0, agent: "Planner Agent", status: "done", blueprint });

    // ── V4.5: DNA COMPOSITION ENGINE ──────────────────────────────────────────
    let dnaComposition: DNAComposition = { ...EMPTY_DNA };
    let dnaOwnership: Record<string, string> = {};
    let dnaTheme: ReturnType<typeof generateThemeTokensServer> | null = null;
    let dnaMotion: ReturnType<typeof generateMotionProfileServer> | null = null;

    try {
      dnaComposition = await extractDNAComposition(prompt, referenceSites, primaryReference, secondaryReferences, groqKey);
      const activeBrands = DNA_BRAND_KEYS.filter(k => dnaComposition[k] > 0);
      if (activeBrands.length > 0) {
        const sectionList = [...new Set([
          ...COMPOSITION_SECTIONS,
          ...(blueprint.sectionOrder || []).map(s => s.toLowerCase()),
        ])];
        dnaOwnership = resolveSectionOwnershipServer(dnaComposition, sectionList);
        dnaTheme     = generateThemeTokensServer(dnaComposition);
        dnaMotion    = generateMotionProfileServer(dnaComposition);
        console.log(`[DNAMixer V4.5] ${activeBrands.map(k => `${k}:${dnaComposition[k as keyof DNAComposition]}%`).join(' + ')}`);
        sse(res, {
          type: "dna_composition",
          composition:    dnaComposition,
          sectionOwnership: dnaOwnership,
          themeTokens:    dnaTheme,
          motionProfile:  dnaMotion,
        });
      }
    } catch (e) {
      console.error('[DNAMixer] Failed (continuing without composition):', e);
    }

    // ── V5.6: TEMPLATE MATCH ──────────────────────────────────────────────────
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
    console.log(`[V5.6] Template matched: ${tplMatch.template.name} (${tplMatch.confidence}% confidence)`);

    // ── AGENT 2: ARCHITECTURE ─────────────────────────────────────────────────
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

    try {
      const archResult = await callGroq(
        groqKey, PLANNER_MODEL,
        [
          { role: "system", content: ARCHITECTURE_SYSTEM },
          { role: "user", content: `Prompt: ${prompt}\nWebsite type: ${blueprint.websiteType}\nSections: ${blueprint.sectionOrder.join(', ')}\n\n${templateContext}` },
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

    // ── Phase 2: Blueprint Validation (with retry) ────────────────────────────
    let bpValidation = validateProjectBlueprint(projectBlueprint);

    if (!bpValidation.valid) {
      console.warn(`[BlueprintValidation] FAILED: ${bpValidation.errors.join('; ')}. Retrying Architecture Agent...`);
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
        res.end();
        return;
      }
    }

    console.log(`[Architecture V2] projectType=${projectBlueprint.projectType} pages=[${projectBlueprint.pages.join(', ')}] apis=[${projectBlueprint.apis.join(', ')}] tables=[${projectBlueprint.databaseTables.join(', ')}] auth=${projectBlueprint.authNeeded}(${projectBlueprint.authProvider}) entities=[${(projectBlueprint.entities || []).join(', ')}]`);

    // ── QUALITY GATE V2 ───────────────────────────────────────────────────────
    const qg = computeQualityScore(projectBlueprint);
    console.log(`[QualityGate V2] score=${qg.score} passed=${qg.passed}${qg.issues.length ? ' — ' + qg.issues.join('; ') : ''}`);
    sse(res, { type: "quality_gate", score: qg.score, passed: qg.passed, issues: qg.issues });

    if (!qg.passed) {
      console.warn(`[QualityGate V2] Score ${qg.score} < 70 — retrying Architecture Agent to resolve issues...`);
      try {
        const qgRetry = await callGroq(
          groqKey, PLANNER_MODEL,
          [
            { role: "system", content: ARCHITECTURE_SYSTEM },
            { role: "user", content: `QUALITY FIX — Resolve these issues: ${qg.issues.join('; ')}\n\nOriginal prompt: ${prompt}\nWebsite type: ${blueprint.websiteType}\nSections: ${blueprint.sectionOrder.join(', ')}\n\nPrevious blueprint scored ${qg.score}/100. Produce a corrected, complete blueprint that fixes all issues.` }
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

    // ── AGENT 3: DESIGN DNA ───────────────────────────────────────────────────
    sse(res, { type: "step", step: 2, agent: "Design Agent", status: "active" });

    // Known reference sites and their DNA verification rules
    const REFERENCE_VERIFIERS: Record<string, (d: DesignDNA) => boolean> = {
      stripe:     (d) => d.designLanguage === "premium-gradient" && d.heroStyle === "centered-gradient" && d.colorSystem.background !== "#0a0a0a",
      linear:     (d) => d.designLanguage === "minimal-flat" && d.heroStyle === "editorial-large" && d.decorationLevel === "none",
      vercel:     (d) => d.designLanguage === "monochrome" && d.heroStyle === "split-layout",
      notion:     (d) => (d.colorSystem.theme === "light" || d.theme === "light") && d.heroStyle === "editorial-large",
      framer:     (d) => d.designLanguage === "bold-motion" && d.animationPersonality === "expressive",
      cursor:     (d) => d.colorSystem.primary !== "#ffffff" && d.designLanguage !== "premium-gradient",
      perplexity: (d) => d.colorSystem.primary !== "#ffffff" && d.colorSystem.primary !== "#e5e5e5",
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
      } catch {
        return null;
      }
    }

    let design: DesignDNA = { ...DEFAULT_DESIGN };
    let designAgentStatus: "success" | "failed" | "retry_success" | "retry_failed" = "failed";
    let designAgentError: string | null = null;

    const dnaContextStr = dnaTheme
      ? buildDNAContextString(dnaComposition, dnaOwnership, dnaTheme)
      : '';
    const designPrompt = [
      `Website brief:\n${briefText || prompt}`,
      `Website type: ${blueprint.websiteType}`,
      referenceSites !== "none" ? `Design references: ${referenceSites}` : "",
      dnaContextStr,
      `\nGenerate the complete design DNA JSON for this site.`,
    ].filter(Boolean).join('\n');

    async function runDesignAgent(attempt: number, overridePrompt?: string): Promise<{ raw: string; parsed: DesignDNA | null; error: string | null }> {
      try {
        const raw = await callOpenRouter(openrouterKey as string, DESIGN_MODEL,
          [{ role: "system", content: DESIGN_SYSTEM }, { role: "user", content: overridePrompt ?? designPrompt }],
          1500
        );
        const parsed = parseDesignRaw(raw);
        return { raw, parsed, error: null };
      } catch (e: any) {
        const status = (e as OpenRouterError).status ?? "unknown";
        const reqId  = (e as OpenRouterError).requestId ?? "unknown";
        const errMsg = `Design Agent attempt ${attempt} FAILED — model: ${DESIGN_MODEL}, status: ${status}, requestId: ${reqId}, message: ${e.message}`;
        console.error(`[DesignAgent] ${errMsg}`);
        return { raw: "", parsed: null, error: errMsg };
      }
    }

    // Attempt 1
    const attempt1 = await runDesignAgent(1);
    if (attempt1.parsed) {
      const verify = verifyDNA(attempt1.parsed, referenceSites);
      if (verify.passed) {
        design = attempt1.parsed;
        designAgentStatus = "success";
        console.log(`[DesignAgent] Attempt 1 PASSED verification. refs="${referenceSites}"`);
      } else {
        console.warn(`[DesignAgent] Attempt 1 DNA VERIFICATION FAILED for refs: [${verify.failedRefs.join(", ")}]. bg=${attempt1.parsed.colorSystem.background} primary=${attempt1.parsed.colorSystem.primary} lang=${attempt1.parsed.designLanguage}. Retrying...`);
        sse(res, {
          type: "design_retry",
          reason: `DNA verification failed for references: [${verify.failedRefs.join(", ")}]`,
          failedFields: { designLanguage: attempt1.parsed.designLanguage, background: attempt1.parsed.colorSystem.background, primary: attempt1.parsed.colorSystem.primary },
        });

        const REFERENCE_DNA_REQUIREMENTS: Record<string, { designLanguage: string; heroStyle: string; extra?: string }> = {
          stripe:     { designLanguage: "premium-gradient", heroStyle: "centered-gradient",  extra: 'decorationLevel MUST be "rich", animationPersonality MUST be "expressive"' },
          linear:     { designLanguage: "minimal-flat",     heroStyle: "editorial-large",    extra: 'decorationLevel MUST be "none", animationPersonality MUST be "subtle"' },
          vercel:     { designLanguage: "monochrome",       heroStyle: "split-layout",       extra: 'decorationLevel MUST be "none", animationPersonality MUST be "subtle"' },
          framer:     { designLanguage: "bold-motion",      heroStyle: "editorial-large",    extra: 'animationPersonality MUST be "expressive"' },
          notion:     { designLanguage: "editorial",        heroStyle: "editorial-large",    extra: 'theme MUST be "light"' },
        };
        const primLower = primaryReference.toLowerCase();
        const req = REFERENCE_DNA_REQUIREMENTS[primLower];
        const retryUserPrompt = req
          ? [
              `CRITICAL: The PRIMARY reference is "${primaryReference}". You MUST output EXACTLY:`,
              `  designLanguage: "${req.designLanguage}"`,
              `  heroStyle: "${req.heroStyle}"`,
              req.extra ? `  ${req.extra}` : '',
              `Apply ONLY the ${primaryReference} DNA from the reference library. Do NOT mix with other design systems.`,
              `\n${designPrompt}`,
            ].filter(Boolean).join('\n')
          : [
              `IMPORTANT: The PRIMARY reference is "${primaryReference}". Apply its DNA EXACTLY as shown in the reference library.`,
              `Do NOT output generic defaults. Do NOT blend with other design systems.`,
              `\n${designPrompt}`,
            ].join('\n');

        const attempt2 = await runDesignAgent(2, retryUserPrompt);
        if (attempt2.parsed) {
          const verify2 = verifyDNA(attempt2.parsed, referenceSites);
          design = attempt2.parsed;
          designAgentStatus = verify2.passed ? "retry_success" : "retry_failed";
          if (!verify2.passed) {
            console.warn(`[DesignAgent] Retry also failed verification for [${verify2.failedRefs.join(", ")}]. Using retry result anyway.`);
          } else {
            console.log(`[DesignAgent] Retry PASSED verification.`);
          }
        } else {
          designAgentStatus = "retry_failed";
          designAgentError = attempt2.error;
          console.error(`[DesignAgent] Retry also failed: ${attempt2.error}`);
        }
      }
    } else {
      designAgentError = attempt1.error ?? "Design Agent returned unparseable output";
      sse(res, {
        type: "design_agent_error",
        designAgentStatus: "failed",
        error: designAgentError,
        model: DESIGN_MODEL,
      });
      console.error(`[DesignAgent] Using DEFAULT_DESIGN. Reason: ${designAgentError}`);
    }

    console.log(`[Design DNA] status=${designAgentStatus} language=${design.designLanguage} cardStyle=${design.cardStyle} heroStyle=${design.heroStyle} animation=${design.animationPersonality} bg=${design.colorSystem.background} primary=${design.colorSystem.primary}`);
    sse(res, { type: "step", step: 2, agent: "Design Agent", status: "done", design, designAgentStatus, designAgentError });

    // ── COMPONENT LIBRARY SELECTION ───────────────────────────────────────────
    const selectedTemplates = selectTemplatesForPrompt(prompt, blueprint.sectionOrder, design, referenceSites, primaryReference);
    const componentContext = buildContextFromTemplates(selectedTemplates);
    console.log(`[ComponentLib] Selected ${selectedTemplates.length} templates: ${selectedTemplates.map(t => t.id).join(', ')}`);

    // ── V5.4: COMPONENT REGISTRY SELECTION ──────────────────────────────────
    let registrySelection: Record<string, string> = {};
    try {
      registrySelection = selectRegistryComponentsServer(dnaComposition, blueprint, projectBlueprint);
      if (Object.keys(registrySelection).length > 0) {
        console.log(`[Registry V5.4] Selected ${Object.keys(registrySelection).length} components: ${Object.entries(registrySelection).map(([k, v]) => `${k}=${v.split(' ')[0]}`).join(', ')}`);
        sse(res, { type: "registry_selection", selection: registrySelection });
      }
    } catch (e) {
      console.error('[Registry V5.4] Selection failed (continuing):', e);
    }

    // ── AGENT 4: FRONTEND / CODE GENERATION ──────────────────────────────────
    sse(res, { type: "step", step: 3, agent: "Frontend Agent", status: "active" });

    const sectionCount = blueprint.sectionOrder.length;
    const isMultiPageApp = projectBlueprint.pages.length > 1;

    const codegenUserPrompt = isMultiPageApp
      ? `Build a ${projectBlueprint.projectType} with these pages from the architecture blueprint: ${projectBlueprint.pages.join(', ')}.

Output each page using FILE delimiters so files can be extracted:
${projectBlueprint.pages.map(p => `// === FILE: src/pages/${p}.tsx ===\nfunction ${p}() { /* full ${p} page */ }`).join('\n\n')}

Shared layout components (Navbar, Footer, Sidebar) use:
// === FILE: src/components/Navbar.tsx ===
function Navbar() { /* sticky navigation */ }

Architecture context: ${projectBlueprint.description}
Shared components: ${projectBlueprint.components.join(', ') || 'Navbar, Footer'}
Auth: ${projectBlueprint.authNeeded} | Dashboard: ${projectBlueprint.dashboardNeeded}

Prompt: ${prompt}
Plan: ${cleanPlan}

Apply the design DNA above to ALL pages. Make each page production-quality and visually coherent. Do not truncate.`
      : `Build a complete landing page for: ${prompt}\n\nPlan context:\n${cleanPlan}\n\nBUILD EXACTLY ${sectionCount} SECTIONS in this order: ${blueprint.sectionOrder.join(' → ')}. Use component templates as structural reference — replace ALL placeholder text with real, specific content for this site. Apply the design DNA precisely. Do not truncate.`;

    let generatedCode = "";
    try {
      generatedCode = await callOpenRouter(openrouterKey, CODEGEN_MODEL,
        [
          { role: "system", content: buildCodeSystem(design, blueprint, componentContext, projectBlueprint, registrySelection) },
          { role: "user", content: codegenUserPrompt },
        ],
        8000
      );
    } catch (e) {
      console.error("OpenRouter codegen failed, falling back to Groq:", e);
      generatedCode = await callGroq(groqKey, "llama-3.3-70b-versatile",
        [
          { role: "system", content: buildCodeSystem(design, blueprint, componentContext, projectBlueprint, registrySelection) },
          { role: "user", content: isMultiPageApp ? codegenUserPrompt : `Build a complete landing page for: ${prompt}. Build EXACTLY ${sectionCount} sections in order: ${blueprint.sectionOrder.join(' → ')}. Apply the design DNA precisely. Do not truncate.` },
        ],
        false, 8000
      );
    }

    generatedCode = generatedCode
      .replace(/^```(?:jsx?|tsx?|javascript|typescript)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();

    sse(res, { type: "step", step: 3, agent: "Frontend Agent", status: "done" });

    // ── AGENT 5: CODE FIX ─────────────────────────────────────────────────────
    sse(res, { type: "step", step: 4, agent: "Code Fix Agent", status: "active" });

    let fixedCode = generatedCode;
    try {
      const codeFix_userRaw = `Fix this React website code (keep all ${sectionCount} sections intact — do NOT add or remove any sections):\n\n${generatedCode}`;
      const { system: cfSystem, user: cfUser } = truncateForGroq(CODEFIX_SYSTEM, codeFix_userRaw, 5_000);
      const fixed = await callGroq(groqKey, CODEFIX_MODEL,
        [
          { role: "system", content: cfSystem },
          { role: "user", content: cfUser },
        ],
        false, 5_000
      );
      if (fixed && fixed.length > 200) {
        fixedCode = fixed
          .replace(/^```(?:jsx?|tsx?|javascript|typescript)?\s*\n?/i, "")
          .replace(/\n?```\s*$/i, "")
          .trim();
      }
    } catch (e) {
      console.error("Code fix agent error (using generated code):", e);
    }

    sse(res, { type: "step", step: 4, agent: "Code Fix Agent", status: "done" });

    // ── BUILD PROJECT FILES ───────────────────────────────────────────────────
    const projectFiles = buildServerProjectFiles(fixedCode, projectBlueprint, blueprint.sectionOrder);
    console.log(`[ProjectFiles] Generated ${projectFiles.length} files (${projectFiles.filter(f => f.lang === 'tsx').length} TSX, ${projectFiles.filter(f => f.lang === 'ts').length} TS)`);

    // ── V5.1: MULTI-PASS VALIDATE → REPAIR LOOP ──────────────────────────────
    const PERFILE_FIX_MODEL = "llama-3.1-8b-instant";
    const MAX_REPAIR_PASSES = 3;
    const REPAIR_SYSTEM = 'You are a React JSX repair agent. Fix ONLY the reported issues. Return the COMPLETE corrected file — no markdown fences, no explanation, no truncation.';

    let totalRepairAttempts = 0;
    let totalFilesRepaired = 0;

    const tsxTargets = projectFiles.filter(f => f.lang === 'tsx' && f.name !== 'main.tsx');

    for (let pass = 0; pass < MAX_REPAIR_PASSES; pass++) {
      const failures = tsxTargets.filter(f => !validateTsxFile(f.name, f.content).valid);
      if (failures.length === 0) {
        console.log(`[RepairLoop] All files valid after pass ${pass}. Done.`);
        break;
      }
      if (pass === MAX_REPAIR_PASSES - 1) {
        console.warn(`[RepairLoop] Pass ${pass + 1}: ${failures.length} file(s) still failing after max passes.`);
        break;
      }
      console.log(`[RepairLoop] Pass ${pass + 1}: Repairing ${failures.length} file(s)...`);

      await Promise.all(failures.map(async (file) => {
        const validation = validateTsxFile(file.name, file.content);
        console.warn(`[RepairLoop:pass${pass + 1}] ${file.name}: ${validation.issues.join('; ')}`);
        totalRepairAttempts++;
        try {
          const fixed = await callGroq(groqKey, PERFILE_FIX_MODEL,
            [
              { role: 'system', content: REPAIR_SYSTEM },
              { role: 'user', content: `File: ${file.name}\nIssues to fix:\n${validation.issues.map(i => `- ${i}`).join('\n')}\nWarnings:\n${validation.warnings.map(w => `- ${w}`).join('\n') || '(none)'}\n\nFull file:\n${file.content}` },
            ],
            false, 1500
          );
          if (fixed && fixed.length > 80) {
            const cleaned = fixed.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
            if (!validateTsxFile(file.name, cleaned).valid === false) {
              if (cleaned.length > file.content.length * 0.5) {
                file.content = cleaned;
                totalFilesRepaired++;
                console.log(`[RepairLoop] ✓ ${file.name} repaired (${cleaned.length} chars)`);
              }
            } else {
              file.content = cleaned;
              totalFilesRepaired++;
              console.log(`[RepairLoop] ✓ ${file.name} repaired (${cleaned.length} chars)`);
            }
          }
        } catch (e) {
          console.error(`[RepairLoop] ✗ ${file.name} repair failed:`, e);
        }
      }));
    }

    // ── Build Health Metrics ──────────────────────────────────────────────────
    const finalTsxFiles = projectFiles.filter(f => f.lang === 'tsx' && f.name !== 'main.tsx');
    const passedTsxFiles = finalTsxFiles.filter(f => validateTsxFile(f.name, f.content).valid);
    const validationScore = finalTsxFiles.length > 0
      ? Math.round((passedTsxFiles.length / finalTsxFiles.length) * 100)
      : 100;

    // ── V5.2: RUNTIME VALIDATION PASS ────────────────────────────────────────
    const runtimeResult = runRuntimeValidator(projectFiles);
    if (runtimeResult.issues.length > 0) {
      console.log(`[RuntimeValidator] ${runtimeResult.runtimeErrors} errors, ${runtimeResult.issues.length - runtimeResult.runtimeErrors} warnings across ${runtimeResult.filesValidated} files`);
      for (const issue of runtimeResult.issues.slice(0, 5)) {
        console.warn(`[RuntimeValidator] ${issue.severity.toUpperCase()} ${issue.file}: ${issue.message}`);
      }
    }

    // ── V5.2: ROUTE VALIDATOR ─────────────────────────────────────────────────
    const routeValidation = validateRoutes(projectFiles);
    if (!routeValidation.valid) {
      console.warn(`[RouteValidator] ${routeValidation.issues.length} route issue(s): ${routeValidation.issues.join('; ')}`);
    }

    const buildHealthMetrics = {
      validationScore,
      compileSuccessRate: validationScore,
      repairAttempts: totalRepairAttempts,
      filesRepaired: totalFilesRepaired,
      totalFiles: projectFiles.length,
      passedFiles: passedTsxFiles.length,
      failedFiles: finalTsxFiles.length - passedTsxFiles.length,
      tokenEstimate: estimateTokenCount(fixedCode),
      runtimeScore: runtimeResult.runtimeScore,
      runtimeErrors: runtimeResult.runtimeErrors,
      filesValidated: runtimeResult.filesValidated,
      runtimeRepairAttempts: 0,
      routesValid: routeValidation.valid,
    };

    console.log(`[BuildHealth] compile=${validationScore}% runtime=${runtimeResult.runtimeScore}% routes=${routeValidation.valid ? 'ok' : 'broken'} repairs=${totalRepairAttempts}`);
    sse(res, { type: "build_health", ...buildHealthMetrics });
    if (runtimeResult.issues.length > 0) {
      sse(res, { type: "runtime_validate", issues: runtimeResult.issues, runtimeScore: runtimeResult.runtimeScore, routeIssues: routeValidation.issues });
    }

    // ── V5.4: REGISTRY HEALTH SSE ────────────────────────────────────────────
    if (Object.keys(registrySelection).length > 0) {
      const regHealth = computeRegistryHealthServer(registrySelection, blueprint.sectionOrder);
      console.log(`[Registry V5.4] Health: coverage=${regHealth.coverageScore}% mapped=${regHealth.mappedSections}/${regHealth.totalSections}`);
      sse(res, { type: "registry_health", ...regHealth });
    }

    // ── AGENTS 6-8: BACKEND / DATABASE / AUTH (parallel) ─────────────────────
    let backendFiles: ProjectFileSSE[] = [];
    let dbFiles: ProjectFileSSE[] = [];
    let authFiles: ProjectFileSSE[] = [];

    const hasApis    = projectBlueprint.apis.length > 0;
    const hasTables  = projectBlueprint.databaseTables.length > 0;
    const needsAuth  = projectBlueprint.authNeeded;

    if (hasApis || hasTables || needsAuth) {
      const fullStackTasks: Promise<void>[] = [];

      if (hasApis) {
        sse(res, { type: "step", step: 5, agent: "Backend Agent", status: "active", apis: projectBlueprint.apis });
        fullStackTasks.push(
          generateBackendFiles(
            projectBlueprint.apis,
            projectBlueprint.entities || [],
            projectBlueprint.projectType,
            groqKey
          ).then(files => {
            backendFiles = files;
            console.log(`[BackendAgent] Generated ${files.length} backend files`);
            sse(res, { type: "step", step: 5, agent: "Backend Agent", status: "done", fileCount: files.length, files: files.map(f => f.path + f.name) });
          }).catch(e => {
            console.error('[BackendAgent] Failed:', e);
            sse(res, { type: "step", step: 5, agent: "Backend Agent", status: "error", error: e.message });
          })
        );
      }

      if (hasTables) {
        sse(res, { type: "step", step: 6, agent: "Database Agent", status: "active", tables: projectBlueprint.databaseTables });
        fullStackTasks.push(
          generateDatabaseFiles(
            projectBlueprint.databaseTables,
            projectBlueprint.relationships || [],
            projectBlueprint.entities || [],
            groqKey
          ).then(files => {
            dbFiles = files;
            console.log(`[DatabaseAgent] Generated ${files.length} database files`);
            sse(res, { type: "step", step: 6, agent: "Database Agent", status: "done", fileCount: files.length, files: files.map(f => f.path + f.name) });
          }).catch(e => {
            console.error('[DatabaseAgent] Failed:', e);
            sse(res, { type: "step", step: 6, agent: "Database Agent", status: "error", error: e.message });
          })
        );
      }

      if (needsAuth) {
        sse(res, { type: "step", step: 7, agent: "Auth Agent", status: "active", provider: projectBlueprint.authProvider });
        fullStackTasks.push(
          generateAuthFiles(projectBlueprint.authProvider || 'JWT', groqKey).then(files => {
            authFiles = files;
            console.log(`[AuthAgent] Generated ${files.length} auth files`);
            sse(res, { type: "step", step: 7, agent: "Auth Agent", status: "done", fileCount: files.length, files: files.map(f => f.path + f.name) });
          }).catch(e => {
            console.error('[AuthAgent] Failed:', e);
            sse(res, { type: "step", step: 7, agent: "Auth Agent", status: "error", error: e.message });
          })
        );
      }

      await Promise.all(fullStackTasks);
    }

    // ── AGENT 9: SCAFFOLD AGENT (programmatic file assembly + Replit config) ────
    sse(res, { type: "step", step: 8, agent: "Scaffold Agent", status: "active" });

    const extraFiles: ProjectFileSSE[] = [
      ...backendFiles,
      ...dbFiles,
      ...authFiles,
      ...(hasApis || hasTables || needsAuth ? [generateEnvExample(projectBlueprint)] : []),
      generateReadme(projectBlueprint),
      generateReplitConfig(projectBlueprint),
      generateReplitNix(),
    ];

    const reservedNames = new Set(['README.md', '.replit', 'replit.nix', '.env.example']);
    const allFiles = [
      ...projectFiles.filter(f => !reservedNames.has(f.name)),
      ...extraFiles,
    ];

    console.log(`[Pipeline] Total files: ${allFiles.length} (frontend: ${projectFiles.length}, backend: ${backendFiles.length}, db: ${dbFiles.length}, auth: ${authFiles.length})`);

    // ── PROJECT VALIDATOR V4 ──────────────────────────────────────────────────
    const pv = validateProject(allFiles, projectBlueprint);
    console.log(`[ProjectValidator] score=${pv.score} passed=${pv.passed}${pv.issues.length ? ' — ' + pv.issues.join('; ') : ''}`);
    sse(res, { type: "project_validate", score: pv.score, passed: pv.passed, issues: pv.issues, fileCount: allFiles.length });

    sse(res, { type: "step", step: 8, agent: "Scaffold Agent", status: "done", fileCount: allFiles.length });

    // ── KNOWLEDGE GRAPH (V5.3) ────────────────────────────────────────────────
    sse(res, { type: "graph_build_start" });
    const knowledgeGraph = buildKnowledgeGraphServer(allFiles, projectBlueprint);
    sse(res, { type: "graph_build_done", graph: knowledgeGraph });
    sse(res, { type: "graph_health", score: knowledgeGraph.graphHealthScore, pages: knowledgeGraph.pages.length, components: knowledgeGraph.components.length, apis: knowledgeGraph.apis.length, routes: knowledgeGraph.routes.length });
    console.log(`[KnowledgeGraph] Built — pages:${knowledgeGraph.pages.length} components:${knowledgeGraph.components.length} apis:${knowledgeGraph.apis.length} healthScore:${knowledgeGraph.graphHealthScore}`);

    // ── AGENT 10: RUNTIME AGENT (V6.4 — Real Build Execution) ───────────────────
    sse(res, { type: "step", step: 9, agent: "Runtime Agent", status: "active" });
    sse(res, { type: "runtime_install_start" });

    const resolvedDeps = resolveDependencies(
      projectBlueprint.features ?? [],
      {
        projectType: projectBlueprint.projectType,
        authNeeded: projectBlueprint.authNeeded,
        apis: projectBlueprint.apis,
      }
    );
    console.log(`[RuntimeAgent V6.4] Resolved ${resolvedDeps.packages.length} packages for real build`);

    const runtimeLogs: Array<{ timestamp: number; type: string; message: string }> = [];
    const rtLog = (type: 'info' | 'error' | 'warn' | 'success', message: string) => {
      const entry = { timestamp: Date.now(), type, message };
      runtimeLogs.push(entry);
      runtimeManager.addLog(chatId, type, message);
      sse(res, { type: "runtime_log", logType: type, message });
    };

    rtLog('info', `Starting real build for ${allFiles.length} files...`);
    rtLog('info', `Packages: ${resolvedDeps.packages.slice(0, 5).join(', ')}${resolvedDeps.packages.length > 5 ? '…' : ''}`);

    runtimeManager.setState(chatId, { status: 'installing', startedAt: Date.now(), dependencies: resolvedDeps });

    const MAX_REAL_PASSES = 5;
    const REAL_REPAIR_SYSTEM = 'You are a React/TypeScript build repair agent. Fix ONLY the reported build errors. Return the COMPLETE corrected file — no markdown fences, no explanation, no truncation.';

    let realBuildPassed = false;
    let realBuildErrors: RealBuildError[] = [];
    let totalRealRepairAttempts = 0;
    let workspaceDir = '';
    const realBuildStart = Date.now();

    try {
      rtLog('info', 'Creating isolated workspace...');
      const setup = await setupWorkspace(
        allFiles as Array<{ name: string; path?: string; content: string; lang: string }>,
        resolvedDeps.packages,
        rtLog
      );
      workspaceDir = setup.workspaceDir;

      sse(res, {
        type: "runtime_install_done",
        dependencies: resolvedDeps.packages,
        devDependencies: resolvedDeps.devPackages,
        packageJson: resolvedDeps.packageJson,
        warnings: resolvedDeps.warnings,
        installDurationMs: setup.installDurationMs,
        installSuccess: setup.installSuccess,
      });

      if (!setup.installSuccess) {
        realBuildErrors = setup.errors;
        sse(res, { type: "runtime_failed", errors: setup.errors, phase: 'install' });
        rtLog('error', `npm install failed after ${(setup.installDurationMs / 1000).toFixed(1)}s — ${setup.errors.map(e => e.message).slice(0, 2).join('; ')}`);
      } else {
        rtLog('info', `npm install succeeded in ${(setup.installDurationMs / 1000).toFixed(1)}s`);

        sse(res, { type: "runtime_start" });
        sse(res, { type: "runtime_build_start" });
        runtimeManager.setState(chatId, { status: 'running' });

        for (let pass = 0; pass < MAX_REAL_PASSES; pass++) {
          const buildResult = await rebuildWorkspace(
            workspaceDir,
            allFiles as Array<{ name: string; path?: string; content: string; lang: string }>,
            rtLog
          );

          if (buildResult.success) {
            realBuildPassed = true;
            realBuildErrors = [];
            sse(res, { type: "runtime_build_done", pass: pass + 1, success: true, durationMs: buildResult.durationMs });
            sse(res, { type: "runtime_passed", pass: pass + 1, totalDurationMs: Date.now() - realBuildStart });
            rtLog('success', `Real build passed on pass ${pass + 1} (${((Date.now() - realBuildStart) / 1000).toFixed(1)}s total)`);
            break;
          }

          realBuildErrors = buildResult.errors;
          sse(res, { type: "runtime_error", pass: pass + 1, errors: buildResult.errors.slice(0, 10) });
          rtLog('warn', `Pass ${pass + 1}: ${buildResult.errors.length} build error(s)`);

          if (pass === MAX_REAL_PASSES - 1) {
            sse(res, { type: "runtime_build_done", pass: pass + 1, success: false, durationMs: buildResult.durationMs });
            sse(res, { type: "runtime_failed", errors: buildResult.errors.slice(0, 10), passes: MAX_REAL_PASSES, phase: 'build' });
            rtLog('error', `Build failed after ${MAX_REAL_PASSES} repair passes`);
            break;
          }

          const repairTargets = buildRepairTargets(buildResult.errors, allFiles as any);
          sse(res, { type: "runtime_repair_start", pass: pass + 1, targets: repairTargets.length, errors: buildResult.errors.length });
          rtLog('info', `Repair pass ${pass + 1}: targeting ${repairTargets.length} file(s)...`);
          runtimeManager.setState(chatId, { status: 'repaired' });

          if (repairTargets.length === 0) {
            rtLog('warn', 'No specific files targeted — stopping repair loop');
            sse(res, { type: "runtime_failed", errors: buildResult.errors, phase: 'no-targets' });
            break;
          }

          await Promise.all(repairTargets.map(async (target) => {
            totalRealRepairAttempts++;
            try {
              const fixed = await callGroq(groqKey, REPAIR_MODEL,
                [
                  { role: 'system', content: REAL_REPAIR_SYSTEM },
                  { role: 'user', content: target.context },
                ],
                false, 2000
              );
              if (fixed && fixed.length > 80) {
                const cleaned = fixed.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
                target.file.content = cleaned;
                rtLog('success', `Repaired ${target.file.name} (${cleaned.length} chars)`);
              }
            } catch (repairErr: any) {
              rtLog('warn', `Repair skip ${target.file.name}: ${repairErr?.message ?? repairErr}`);
            }
          }));

          sse(res, { type: "runtime_repair_done", pass: pass + 1, repaired: repairTargets.length });
        }
      }
    } catch (execErr: any) {
      rtLog('error', `Runtime executor error: ${execErr?.message ?? execErr}`);
      realBuildErrors = [{ category: 'build', message: execErr?.message ?? 'Executor error', confidence: 'low' }];
    } finally {
      if (workspaceDir) await teardownWorkspace(workspaceDir).catch(() => {});
    }

    const totalRealDurationMs = Date.now() - realBuildStart;
    const healthScore = realBuildPassed
      ? 95
      : Math.max(20, 70 - Math.min(50, realBuildErrors.length * 8));

    const finalRuntimeState = runtimeManager.setState(chatId, {
      status: realBuildPassed ? 'running' : 'failed',
      buildPassed: realBuildPassed,
      runtimePassed: realBuildPassed,
      buildErrors: realBuildErrors.map(e => ({
        file: e.file ?? 'unknown',
        type: 'error' as const,
        message: e.message,
        rule: e.category,
      })),
      healthScore,
      finishedAt: Date.now(),
      repairedFiles: totalRealRepairAttempts,
    });

    sse(res, {
      type: "runtime_health",
      chatId,
      health: healthScore,
      status: finalRuntimeState.status,
      buildPassed: realBuildPassed,
      runtimePassed: realBuildPassed,
      attempts: finalRuntimeState.attempts,
      dependencies: resolvedDeps.packages,
      devDependencies: resolvedDeps.devPackages,
      packageJson: resolvedDeps.packageJson,
      logs: runtimeLogs,
      buildErrors: finalRuntimeState.buildErrors,
      warnings: [],
      missingImports: [],
      filesValidated: allFiles.length,
      filesTotal: allFiles.length,
      realBuild: true,
      totalDurationMs: totalRealDurationMs,
      repairAttempts: totalRealRepairAttempts,
    });

    sse(res, {
      type: "runtime_complete",
      chatId,
      state: finalRuntimeState,
    });

    sse(res, { type: "step", step: 9, agent: "Runtime Agent", status: realBuildPassed ? "done" : "warn" });
    console.log(`[RuntimeAgent V6.4] Done — realBuild:${realBuildPassed} health:${healthScore} repairs:${totalRealRepairAttempts} duration:${(totalRealDurationMs / 1000).toFixed(1)}s`);

    sse(res, { type: "done", code: fixedCode, plan: cleanPlan, blueprint, projectBlueprint, sectionOrder: blueprint.sectionOrder, files: allFiles, dnaComposition, sectionOwnership: dnaOwnership, themeTokens: dnaTheme, motionProfile: dnaMotion, knowledgeGraph });

  } catch (err: any) {
    sse(res, { type: "error", error: err?.message ?? "Multi-agent pipeline failed" });
  }

  res.end();
});

// ── DESIGN AUDIT ENDPOINT ─────────────────────────────────────────────────────
router.post("/agents/audit", async (req, res) => {
  const groqKey = process.env["GROQ_API_KEY"];
  const openrouterKey = process.env["OPENROUTER_API_KEY"];
  const { prompt } = req.body as { prompt: string };

  if (!groqKey) return res.status(500).json({ error: "GROQ_API_KEY not set" });
  if (!openrouterKey) return res.status(500).json({ error: "OPENROUTER_API_KEY not set" });
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  const audit: Record<string, any> = {
    prompt,
    models: { planner: PLANNER_MODEL, design: DESIGN_MODEL, codegen: CODEGEN_MODEL, codefix: CODEFIX_MODEL },
  };

  try {
    let planText = "";
    await callGroq(groqKey, PLANNER_MODEL,
      [{ role: "system", content: PLANNER_SYSTEM }, { role: "user", content: prompt }],
      true, 2500, (token) => { planText += token; }
    );
    audit.plannerOutput = { raw: planText };

    const briefMatch = planText.match(/---DESIGN_BRIEF---([\s\S]*?)---END_BRIEF---/);
    const briefText = briefMatch ? briefMatch[1].trim() : "";
    const refMatch = briefText.match(/referenceSites:\s*(.+)/);
    const referenceSites = refMatch ? refMatch[1].trim() : "none";

    let auditPrimaryRef = "none";
    const auditPrimaryRefMatch = briefText.match(/primaryReference:\s*(.+)/);
    if (auditPrimaryRefMatch) auditPrimaryRef = auditPrimaryRefMatch[1].trim();
    if (auditPrimaryRef === "none" && referenceSites !== "none") {
      auditPrimaryRef = referenceSites.split(',')[0].trim();
    }

    let auditSecondaryRefs: string[] = [];
    const auditSecondaryMatch = briefText.match(/secondaryReferences:\s*(.+)/);
    if (auditSecondaryMatch && auditSecondaryMatch[1].trim() !== "none") {
      auditSecondaryRefs = auditSecondaryMatch[1].trim().split(',').map(s => s.trim());
    }

    const blueprintMatch = planText.match(/---PAGE_BLUEPRINT---([\s\S]*?)---END_BLUEPRINT---/);
    let blueprint: PageBlueprint = { websiteType: "Generic", sectionOrder: ["Navbar", "Hero", "Features", "CTA", "Footer"] };
    if (blueprintMatch) {
      try { blueprint = JSON.parse(blueprintMatch[1].trim()); } catch {}
    }
    audit.plannerOutput.brief = briefText;
    audit.plannerOutput.referenceSites = referenceSites;
    audit.plannerOutput.primaryReference = auditPrimaryRef;
    audit.plannerOutput.secondaryReferences = auditSecondaryRefs;
    audit.plannerOutput.blueprint = blueprint;

    const designPrompt = [
      `Website brief:\n${briefText || prompt}`,
      `Website type: ${blueprint.websiteType}`,
      referenceSites !== "none" ? `Design references: ${referenceSites}` : "",
      `\nGenerate the complete design DNA JSON for this site.`,
    ].filter(Boolean).join('\n');

    audit.designAgentInput = { systemPromptLength: DESIGN_SYSTEM.length, userPrompt: designPrompt };

    let designAgentRawOutput = "";
    let parsedDNA: Partial<DesignDNA> | null = null;
    let finalDNA: DesignDNA = { ...DEFAULT_DESIGN };
    let designAgentStatus = "not_run";
    let designAgentError: string | null = null;

    try {
      designAgentRawOutput = await callOpenRouter(openrouterKey, DESIGN_MODEL,
        [{ role: "system", content: DESIGN_SYSTEM }, { role: "user", content: designPrompt }],
        1500
      );
      designAgentStatus = "success";
      const jsonMatch = designAgentRawOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedDNA = JSON.parse(jsonMatch[0]);
        finalDNA = { ...DEFAULT_DESIGN, ...(parsedDNA as any) };
        if ((parsedDNA as any).colorSystem) finalDNA.colorSystem = { ...DEFAULT_DESIGN.colorSystem, ...(parsedDNA as any).colorSystem };
        if ((parsedDNA as any).typographySystem) finalDNA.typographySystem = { ...DEFAULT_DESIGN.typographySystem, ...(parsedDNA as any).typographySystem };
        if ((parsedDNA as any).spacingSystem) finalDNA.spacingSystem = { ...DEFAULT_DESIGN.spacingSystem, ...(parsedDNA as any).spacingSystem };
      } else {
        designAgentStatus = "parse_failed";
        designAgentError = "Model response contained no JSON object";
      }
    } catch (e: any) {
      designAgentStatus = "failed";
      const orErr = e as OpenRouterError;
      designAgentError = e.message;
      audit.designAgentError = {
        message: e.message,
        model: orErr.model ?? DESIGN_MODEL,
        status: orErr.status ?? null,
        requestId: orErr.requestId ?? null,
        body: orErr.body ?? null,
      };
    }

    const KEY_FIELDS = [
      ["designLanguage"],
      ["layoutStyle"],
      ["animationPersonality"],
      ["decorationLevel"],
      ["heroStyle"],
      ["cardStyle"],
      ["colorSystem", "background"],
      ["colorSystem", "surface"],
      ["colorSystem", "primary"],
      ["colorSystem", "accent"],
      ["colorSystem", "textMuted"],
      ["colorSystem", "border"],
      ["typographySystem", "headingWeight"],
      ["typographySystem", "scale"],
      ["spacingSystem", "sectionPadding"],
    ] as const;

    const get = (obj: any, path: readonly string[]) => path.reduce((o, k) => o?.[k], obj);
    const dnaDiff: Record<string, { default: any; actual: any; changed: boolean }> = {};
    for (const path of KEY_FIELDS) {
      const key = path.join(".");
      const def = get(DEFAULT_DESIGN, path);
      const act = get(finalDNA, path);
      dnaDiff[key] = { default: def, actual: act, changed: def !== act };
    }
    const changedFields = Object.values(dnaDiff).filter(v => v.changed).length;

    audit.designAgentOutput = { raw: designAgentRawOutput, status: designAgentStatus, error: designAgentError };
    audit.parsedDNA = parsedDNA;
    audit.finalDNA = finalDNA;
    audit.dnaDiff = { fields: dnaDiff, changedFromDefault: changedFields, totalFields: KEY_FIELDS.length, collapsed: changedFields === 0 };

    const AUDIT_HERO_MAP: Record<string, string> = {
      stripe: 'hero-centered-v1', linear: 'hero-editorial-v1', vercel: 'hero-asymmetric-v1',
      framer: 'hero-bento-v1', notion: 'hero-editorial-v1', cursor: 'hero-asymmetric-v1',
    };
    const selectedTemplates = selectTemplatesForPrompt(prompt, blueprint.sectionOrder, finalDNA, referenceSites, auditPrimaryRef);
    const componentContext = buildContextFromTemplates(selectedTemplates);
    const codeGenSystemPrompt = buildCodeSystem(finalDNA, blueprint, componentContext);

    const selectedHero = selectedTemplates.find(t => t.category === 'hero')?.id ?? 'none';
    const expectedHero = AUDIT_HERO_MAP[auditPrimaryRef.toLowerCase()] ?? 'unknown';
    const heroMatch = expectedHero === 'unknown' || selectedHero === expectedHero;
    const dnaVerifiers: Record<string, (d: DesignDNA) => boolean> = {
      stripe: (d) => d.designLanguage === "premium-gradient" && d.heroStyle === "centered-gradient",
      linear: (d) => d.designLanguage === "minimal-flat" && d.heroStyle === "editorial-large",
      vercel:  (d) => d.designLanguage === "monochrome" && d.heroStyle === "split-layout",
    };
    const dnaVerifier = dnaVerifiers[auditPrimaryRef.toLowerCase()];
    const dnaPass = dnaVerifier ? dnaVerifier(finalDNA) : true;
    const validationStatus = heroMatch && dnaPass ? "pass" : !heroMatch ? "fail:hero_mismatch" : "fail:dna_mismatch";

    const SECTION_EXPECTED_FEATURES: Record<string, string> = {
      stripe: 'features-stripe-v1', paypal: 'features-stripe-v1',
      linear: 'features-editorial-v1', notion: 'features-editorial-v1',
      vercel: 'features-split-v1', netlify: 'features-split-v1',
      framer: 'features-framer-v1', webflow: 'features-framer-v1', figma: 'features-framer-v1',
    };
    const SECTION_EXPECTED_DASHBOARD: Record<string, string> = {
      stripe: 'dashboard-revenue-v1', paypal: 'dashboard-revenue-v1',
      linear: 'dashboard-kanban-v1', notion: 'dashboard-kanban-v1',
      vercel: 'dashboard-vercel-v1', netlify: 'dashboard-vercel-v1',
      framer: 'dashboard-aiflow-v1', webflow: 'dashboard-aiflow-v1',
    };
    const SECTION_EXPECTED_PRICING: Record<string, string> = {
      stripe: 'pricing-comparison-v1', paypal: 'pricing-comparison-v1',
      linear: 'pricing-minimal-v1', notion: 'pricing-minimal-v1',
      vercel: 'pricing-horizontal-v1', netlify: 'pricing-horizontal-v1',
      framer: 'pricing-cardstack-v1', webflow: 'pricing-cardstack-v1', figma: 'pricing-cardstack-v1',
    };

    const ref = auditPrimaryRef.toLowerCase();
    const selectedFeatures = selectedTemplates.find((t: any) => t.category === 'features')?.id ?? 'none';
    const selectedDashboard = selectedTemplates.find((t: any) => t.category === 'dashboard-preview')?.id ?? 'none';
    const selectedPricing = selectedTemplates.find((t: any) => t.category === 'pricing')?.id ?? 'none';
    const expectedFeatures = SECTION_EXPECTED_FEATURES[ref] ?? 'unknown';
    const expectedDashboard = SECTION_EXPECTED_DASHBOARD[ref] ?? 'unknown';
    const expectedPricing = SECTION_EXPECTED_PRICING[ref] ?? 'unknown';
    const featuresMatch = selectedFeatures === 'none' ? null : (expectedFeatures === 'unknown' || selectedFeatures === expectedFeatures);
    const dashboardMatch = selectedDashboard === 'none' ? null : (expectedDashboard === 'unknown' || selectedDashboard === expectedDashboard);
    const pricingMatch = selectedPricing === 'none' ? null : (expectedPricing === 'unknown' || selectedPricing === expectedPricing);
    const activeChecks = ([heroMatch, featuresMatch, dashboardMatch, pricingMatch] as (boolean | null)[]).filter(m => m !== null) as boolean[];
    const matchPoints = activeChecks.filter(Boolean).length;
    const architectureMatchScore = activeChecks.length > 0 ? Math.round((matchPoints / activeChecks.length) * 100) : 100;

    const diversityCounts = {
      hero:         getTemplatesByCategory('hero').length,
      features:     getTemplatesByCategory('features').length,
      pricing:      getTemplatesByCategory('pricing').length,
      dashboard:    getTemplatesByCategory('dashboard-preview').length,
      navbar:       getTemplatesByCategory('navbar').length,
      bento:        getTemplatesByCategory('bento').length,
      cta:          getTemplatesByCategory('cta').length,
      faq:          getTemplatesByCategory('faq').length,
      testimonials: getTemplatesByCategory('testimonials').length,
    };
    const catScore = (n: number) => Math.min(100, Math.round((n / 6) * 100));
    const categoryScores: Record<string, number> = {};
    for (const [cat, count] of Object.entries(diversityCounts)) {
      categoryScores[cat] = catScore(count);
    }
    const overallArchitectureScore = Math.round(
      Object.values(categoryScores).reduce((a, b) => a + b, 0) / Object.values(categoryScores).length
    );
    const routingMaps = ['hero', 'features', 'dashboard', 'pricing', 'navbar', 'bento', 'cta', 'faq'];
    const routingCoverage = [heroMatch, featuresMatch, dashboardMatch, pricingMatch]
      .filter(m => m !== null).length;

    audit.referenceRouting = {
      primaryReference: auditPrimaryRef,
      secondaryReferences: auditSecondaryRefs,
      selectedHero, selectedFeatures, selectedDashboard, selectedPricing,
      expectedHero, expectedFeatures, expectedDashboard, expectedPricing,
      heroMatch, featuresMatch, dashboardMatch, pricingMatch,
      architectureMatchScore, dnaPass, validationStatus,
    };

    audit.architectureDiversity = {
      templateCounts: diversityCounts,
      categoryScores,
      overallArchitectureScore,
      routingCoverage,
      routingMapsCount: routingMaps.length,
      target: 90,
      passing: overallArchitectureScore >= 90,
      note: overallArchitectureScore >= 90
        ? `PASS — system diversity ≥ 90 (${overallArchitectureScore})`
        : `FAIL — system diversity ${overallArchitectureScore} < 90 target. Low categories: ${Object.entries(categoryScores).filter(([,s]) => s < 90).map(([c,s]) => `${c}(${s})`).join(', ')}`,
    };

    audit.codeGeneratorPrompt = {
      systemPromptLength: codeGenSystemPrompt.length,
      systemPromptPreview: codeGenSystemPrompt.slice(0, 1200) + (codeGenSystemPrompt.length > 1200 ? "\n...[truncated]" : ""),
      userPrompt: `Build a complete landing page for: ${prompt} — ${blueprint.sectionOrder.length} sections: ${blueprint.sectionOrder.join(' → ')}`,
      selectedTemplates: selectedTemplates.map(t => t.id),
    };

    audit.summary = {
      referenceSites,
      designAgentStatus,
      dnaCollapsed: changedFields === 0,
      changedFieldsFromDefault: changedFields,
      dominantColor: finalDNA.colorSystem.primary,
      background: finalDNA.colorSystem.background,
      designLanguage: finalDNA.designLanguage,
      animationPersonality: finalDNA.animationPersonality,
    };

  } catch (e: any) {
    audit.fatalError = e.message;
  }

  res.json(audit);
});

// ── ZIP EXPORT ────────────────────────────────────────────────────────────────
router.post("/agents/export", (req, res) => {
  try {
    const { files, projectName = "nexogen-project" } = req.body as {
      files: Array<{ path: string; name: string; content: string }>;
      projectName?: string;
    };

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files provided" });
    }

    const safeName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const zipData: Record<string, Uint8Array> = {};

    for (const file of files) {
      const key = `${safeName}/${file.path || ""}${file.name}`.replace(/\/\//g, "/");
      zipData[key] = strToU8(file.content || "");
    }

    const zipped = zipSync(zipData, { level: 6 });

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}.zip"`);
    res.send(Buffer.from(zipped));
  } catch (e: any) {
    console.error("[Export] ZIP error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ── V5.5: DYNAMIC EDIT SYSTEM (locked component injection) ───────────────────
function buildEditSystem(lockedComponents: string[], isRetry = false, prevViolations = ''): string {
  if (lockedComponents.length === 0) return EDIT_SYSTEM;
  const lockedList = lockedComponents.map(c => `  • ${c.toUpperCase()}`).join('\n');
  const violationNote = prevViolations
    ? `\nPREVIOUS ATTEMPT INCORRECTLY MODIFIED: ${prevViolations}\nDo NOT output FILE blocks for these.`
    : '';
  const strictNote = isRetry
    ? '\nFINAL WARNING — any locked file output causes complete edit rejection.'
    : '';
  return EDIT_SYSTEM + `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPONENT LOCK ENFORCEMENT (V5.5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LOCKED SECTIONS — DO NOT TOUCH:
${lockedList}
${violationNote}
ABSOLUTE RULES:
1. DO NOT output a FILE block for any file that belongs to a locked section
2. DO NOT refactor, rename, or restructure locked component files
3. If the edit request targets a locked section, edit around it instead
4. Only unlocked sections may appear in your output${strictNote}

These rules override all other instructions. Violation = failed edit.`;
}

// ── V5.5: EDIT IMPACT ANALYZER ───────────────────────────────────────────────
function analyzeEditImpactServer(
  prompt: string,
  registryFileMap: Record<string, string[]>,
  lockedComponents: string[]
): { affectedSections: string[]; affectedFiles: string[]; lockedConflicts: string[]; replacementMode: string | null } {
  const p = prompt.toLowerCase();
  const SECTION_KEYWORDS: Record<string, string[]> = {
    hero:         ['hero', 'headline', 'banner', 'above the fold', 'main heading'],
    pricing:      ['pricing', 'price', 'plan', 'billing', 'subscription', 'yearly', 'monthly', 'tier'],
    navbar:       ['navbar', 'nav bar', 'navigation menu', 'top menu', 'header nav'],
    features:     ['feature', 'benefit', 'what we offer', 'capability', 'functionality'],
    faq:          ['faq', 'frequently asked', 'question'],
    testimonials: ['testimonial', 'review', 'social proof', 'customer quote'],
    cta:          ['call to action', ' cta', 'get started button', 'sign up button'],
    footer:       ['footer', 'bottom section', 'bottom of page'],
    dashboard:    ['dashboard', 'analytics page', 'metrics page', 'stats page'],
    auth:         ['login page', 'signup page', 'auth page', 'sign in page'],
  };
  const replaceMatch = /\breplace\s+(?:the\s+)?(\w+)/i.exec(prompt);
  const replacementMode = replaceMatch ? replaceMatch[1].toLowerCase() : null;
  const affectedSections: string[] = [];
  const affectedFiles: string[] = [];
  for (const [section, keywords] of Object.entries(SECTION_KEYWORDS)) {
    if (keywords.some(kw => p.includes(kw))) {
      affectedSections.push(section);
      affectedFiles.push(...(registryFileMap[section] ?? []));
    }
  }
  if (replacementMode && !affectedSections.includes(replacementMode)) affectedSections.push(replacementMode);
  const lockedConflicts = affectedSections.filter(s => lockedComponents.includes(s));
  return { affectedSections, affectedFiles: [...new Set(affectedFiles)], lockedConflicts, replacementMode };
}

// ── EDIT AGENT ────────────────────────────────────────────────────────────────
router.post("/agents/edit", async (req, res) => {
  const groqKey = process.env["GROQ_API_KEY"];
  if (!groqKey) return res.status(500).json({ error: "GROQ_API_KEY not set" });

  const { prompt, projectFiles = [], projectMemory, componentRegistry, themeTokens, knowledgeGraph, lockedComponents = [], registryFileMap = {} } = req.body as {
    prompt: string;
    projectFiles: ProjectFileSSE[];
    projectMemory?: Record<string, any>;
    componentRegistry?: Record<string, string>;
    themeTokens?: Record<string, any>;
    knowledgeGraph?: ServerKnowledgeGraph;
    lockedComponents?: string[];
    registryFileMap?: Record<string, string[]>;
  };

  if (!prompt) return res.status(400).json({ error: "prompt required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    // ── STEP 0: Intent Detection ────────────────────────────────────────────
    sse(res, { type: "step", step: 0, agent: "Intent Detector", status: "active" });

    const fileList = projectFiles.map((f) => f.path + f.name).join("\n");
    let intentResult = { editType: "component", targetFiles: [] as string[], newFiles: [] as string[], reason: prompt };

    try {
      const { system: intentSys, user: intentUser } = truncateForGroq(
        INTENT_SYSTEM,
        `PROJECT FILES:\n${fileList}\n\nEDIT REQUEST: ${prompt}`,
        600
      );
      const intentRaw = await callGroq(
        groqKey, PLANNER_MODEL,
        [
          { role: "system", content: intentSys },
          { role: "user", content: intentUser },
        ],
        false, 600
      );
      const cleaned = intentRaw.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      intentResult = { ...intentResult, ...parsed };
    } catch { /* keep defaults */ }

    sse(res, { type: "intent_detected", ...intentResult });
    sse(res, { type: "step", step: 0, agent: "Intent Detector", status: "done" });

    // ── V5.5: Edit Impact Analysis ──────────────────────────────────────────
    const editImpact = analyzeEditImpactServer(prompt, registryFileMap, lockedComponents);
    sse(res, { type: "edit_impact", affectedSections: editImpact.affectedSections, affectedFiles: editImpact.affectedFiles, lockedConflicts: editImpact.lockedConflicts, replacementMode: editImpact.replacementMode });
    if (editImpact.lockedConflicts.length > 0) {
      console.log(`[V5.5] Impact: locked conflicts detected — ${editImpact.lockedConflicts.join(', ')}`);
    }

    // ── STEP 1: File Resolution ─────────────────────────────────────────────
    sse(res, { type: "step", step: 1, agent: "File Resolver", status: "active" });

    const depGraph = (projectMemory?.dependencyGraph as Record<string, string[]>) ?? {};
    const resolvedFiles = resolveAffectedFiles(intentResult.targetFiles, depGraph, projectFiles);

    let graphResolvedFiles: string[] = [];
    if (knowledgeGraph && knowledgeGraph.components.length > 0) {
      const graphResolution = resolveEditTargetsServer(knowledgeGraph, prompt, projectFiles);
      if (graphResolution.resolved && graphResolution.targetFiles.length > 0) {
        graphResolvedFiles = graphResolution.targetFiles.map(f => f.path + f.name);
        sse(res, { type: "graph_context", filesLoaded: graphResolution.filesLoaded, filesSkipped: graphResolution.filesSkipped, tokensSaved: graphResolution.tokensSaved, resolvedNodes: graphResolution.graphNodes });
        console.log(`[KnowledgeGraph] Edit context: loaded=${graphResolution.filesLoaded} skipped=${graphResolution.filesSkipped} saved≈${graphResolution.tokensSaved} tokens`);
        for (const gf of graphResolvedFiles) { if (!intentResult.targetFiles.includes(gf)) intentResult.targetFiles.push(gf); }
      }
    }

    sse(res, { type: "file_targets", files: resolvedFiles, originalTargets: intentResult.targetFiles });
    sse(res, { type: "step", step: 1, agent: "File Resolver", status: "done" });

    // ── V5.5: Locked Component Enforcement ──────────────────────────────────
    const lockedFilePaths = new Set<string>();
    for (const cat of lockedComponents) {
      for (const fp of (registryFileMap[cat] ?? [])) lockedFilePaths.add(fp);
    }
    const filteredResolvedFiles = lockedFilePaths.size > 0
      ? resolvedFiles.filter(fp => !lockedFilePaths.has(fp))
      : resolvedFiles;
    if (filteredResolvedFiles.length < resolvedFiles.length) {
      const excluded = resolvedFiles.filter(fp => lockedFilePaths.has(fp));
      sse(res, { type: "locked_excluded", excluded, preservedCategories: lockedComponents });
      console.log(`[V5.5] Locked enforcement: excluded ${excluded.length} locked files from context`);
    }

    // ── STEP 2: Patch Generation ──────────────────────────────────────────────
    sse(res, { type: "step", step: 2, agent: "Patch Generator", status: "active" });

    const EDIT_RESPONSE_TOKENS = 4_000;
    const sysTokens = estimateTokenCount(EDIT_SYSTEM);
    const fileContextBudget = GROQ_TOKEN_BUDGET - EDIT_RESPONSE_TOKENS - sysTokens - 400;
    const compressedMem = projectMemory ? compressProjectMemory(projectMemory) : null;
    const projectSummary = compressedMem
      ? `Project: ${compressedMem["projectType"] || "App"} | Pages: ${(compressedMem["pages"] as string[] || []).join(", ")} | Entities: ${(compressedMem["entities"] as string[] || []).join(", ")}\n`
      : `Files: ${projectFiles.map((f) => f.path + f.name).join(", ")}\n`;
    const designCtx = themeTokens
      ? `\nDesign tokens (PRESERVE): primary=${themeTokens.primary}, surface=${themeTokens.surface}, isDark=${themeTokens.isDark}`
      : "";
    const registryCtx = componentRegistry && Object.keys(componentRegistry).length > 0
      ? `\nComponents: ${Object.keys(componentRegistry).slice(0, 20).join(", ")}`
      : "";

    let modifiedFiles: ProjectFileSSE[] = [];
    let deletedPaths: string[] = [];
    let qualityResult: ReturnType<typeof validateEditFiles> = { score: 0, passed: false, issues: [], warnings: [] };

    for (let diffAttempt = 0; diffAttempt < 3; diffAttempt++) {
      const prevViolations = diffAttempt > 0
        ? modifiedFiles.filter(f => lockedFilePaths.has(f.path + f.name)).map(f => f.name).join(', ')
        : '';
      const dynamicEditSystem = buildEditSystem(lockedComponents, diffAttempt > 0, prevViolations);

      const allTargets = [...filteredResolvedFiles, ...(intentResult.newFiles ?? []), "App.tsx"];
      const { context: fileContext, meta: ctxMeta } = buildMinimalEditContext(projectFiles, allTargets, fileContextBudget);
      if (diffAttempt === 0) logCompressionReport("EditPatch", ctxMeta);

      const userMessageRaw = `${projectSummary}${designCtx}${registryCtx}
EDIT REQUEST: ${prompt}
INTENT: ${intentResult.editType} — ${intentResult.reason}
TARGET FILES: ${filteredResolvedFiles.join(", ")}${intentResult.newFiles?.length ? `\nNEW FILES: ${intentResult.newFiles.join(", ")}` : ""}
ALL PROJECT FILES (do not modify unless listed above): ${projectFiles.map((f) => f.path + f.name).join(", ")}

CURRENT FILE CONTEXT:
${fileContext}`;

      const { system: editSystem, user: userMessage, truncated: wasTruncated } =
        truncateForGroq(dynamicEditSystem, userMessageRaw, EDIT_RESPONSE_TOKENS);
      if (wasTruncated && diffAttempt === 0) {
        console.warn("[EditPatch] Context truncated by safety net");
        sse(res, { type: "debug", message: "context_compressed" });
      }

      const editRaw = await callGroq(
        groqKey, BACKEND_MODEL,
        [{ role: "system", content: editSystem }, { role: "user", content: userMessage }],
        false, EDIT_RESPONSE_TOKENS
      );

      modifiedFiles = extractEditFiles(editRaw);
      deletedPaths  = extractDeletedPaths(editRaw);
      qualityResult = validateEditFiles(modifiedFiles, projectFiles, filteredResolvedFiles);

      if (lockedFilePaths.size > 0) {
        const violations = modifiedFiles.filter(f => lockedFilePaths.has(f.path + f.name));
        if (violations.length > 0 && diffAttempt < 2) {
          sse(res, { type: "locked_protection", retryAttempt: diffAttempt + 1, violations: violations.map(f => f.path + f.name) });
          console.log(`[V5.5] Diff protection retry ${diffAttempt + 1}: ${violations.map(f => f.name).join(', ')} violated`);
          continue;
        }
        modifiedFiles = modifiedFiles.filter(f => !lockedFilePaths.has(f.path + f.name));
        deletedPaths  = deletedPaths.filter(fp => !lockedFilePaths.has(fp));
      }
      break;
    }

    sse(res, { type: "step", step: 2, agent: "Patch Generator", status: "done" });

    // ── STEP 3: Quality Gate ────────────────────────────────────────────────
    sse(res, { type: "step", step: 3, agent: "Quality Gate", status: "active" });

    console.log(`[EditAgent V5.5] modified=${modifiedFiles.length} deleted=${deletedPaths.length} quality=${qualityResult.score}`);
    sse(res, { type: "quality_check", ...qualityResult });
    sse(res, { type: "step", step: 3, agent: "Quality Gate", status: qualityResult.passed ? "done" : "warn" });

    // ── STEP 4: Merge Engine ────────────────────────────────────────────────
    sse(res, { type: "step", step: 4, agent: "Merge Engine", status: "active" });

    const mergedFiles = mergeProjectFiles(projectFiles, modifiedFiles, deletedPaths);

    const existingPaths = new Set(projectFiles.map((f) => f.path + f.name));
    const diff = {
      changedFiles: modifiedFiles.filter((f) => existingPaths.has(f.path + f.name)).map((f) => f.path + f.name),
      createdFiles: modifiedFiles.filter((f) => !existingPaths.has(f.path + f.name)).map((f) => f.path + f.name),
      deletedFiles: deletedPaths,
    };

    // ── V5.5: Registry Health V2 ───────────────────────────────────────────
    const preservedComponents = lockedComponents.filter(cat => {
      const catFiles = registryFileMap[cat] ?? [];
      return catFiles.length > 0 && catFiles.every(fp =>
        !diff.changedFiles.includes(fp) && !diff.deletedFiles.includes(fp)
      );
    });
    const replacedComponents = lockedComponents.filter(cat => {
      const catFiles = registryFileMap[cat] ?? [];
      return catFiles.some(fp => diff.changedFiles.includes(fp));
    });
    const editSafetyScore = lockedComponents.length > 0
      ? Math.round((preservedComponents.length / lockedComponents.length) * 100)
      : 100;
    sse(res, {
      type: "registry_health_v2",
      registryCoverage: Object.keys(registryFileMap).length,
      lockedComponents: lockedComponents.length,
      preservedComponents: preservedComponents.length,
      replacedComponents: replacedComponents.length,
      editSafetyScore,
      preservedList: preservedComponents,
      replacedList: replacedComponents,
      modifiedSections: diff.changedFiles.map(fp => {
        for (const [cat, files] of Object.entries(registryFileMap)) {
          if (files.includes(fp)) return cat;
        }
        return null;
      }).filter(Boolean),
    });
    console.log(`[V5.5] Registry Health V2: safety=${editSafetyScore}% preserved=${preservedComponents.length} replaced=${replacedComponents.length}`);

    sse(res, {
      type: "edit_identified",
      modifiedCount: modifiedFiles.length,
      deletedCount: deletedPaths.length,
      files: modifiedFiles.map((f) => f.path + f.name),
    });

    sse(res, { type: "step", step: 4, agent: "Merge Engine", status: "done" });

    sse(res, {
      type: "edit_done",
      files: mergedFiles,
      diff,
      intentResult,
    });

    res.end();
  } catch (e: any) {
    console.error("[EditAgent V5] Error:", e);
    sse(res, { type: "error", error: e.message });
    res.end();
  }
});

// ── V6.1: RUNTIME REPAIR & SELF-HEALING ENGINE ───────────────────────────────
function resolveAffectedFilesFromGraph(
  error: { file: string; message: string },
  files: ProjectFileSSE[],
  knowledgeGraph?: any
): string[] {
  const result: string[] = [];

  const directFile = files.find(f =>
    f.name === error.file ||
    (f.path + f.name).includes(error.file) ||
    (error.file && error.file.includes(f.name))
  );
  if (directFile) result.push(directFile.path + directFile.name);

  if (knowledgeGraph && directFile) {
    const baseName = directFile.name.replace(/\.(tsx?|jsx?)$/, '');
    const usedBy = (knowledgeGraph.components ?? [])
      .filter((c: any) => c.name === baseName || (c.usedBy ?? []).includes(baseName))
      .flatMap((c: any) => [c.file, ...(c.usedBy ?? [])]);
    for (const fp of usedBy) {
      const f = files.find(fi => fi.path + fi.name === fp || fi.name === fp);
      if (f && !result.includes(f.path + f.name)) result.push(f.path + f.name);
    }
  }

  if (result.length === 0) {
    const appFile = files.find(f => f.name === 'App.tsx');
    if (appFile) result.push(appFile.path + appFile.name);
  }

  return result;
}

router.post("/agents/runtime-repair", async (req, res) => {
  const groqKey = process.env["GROQ_API_KEY"];
  if (!groqKey) return res.status(500).json({ error: "GROQ_API_KEY not set" });

  const {
    files,
    error,
    repairAttempt = 0,
    knowledgeGraph,
    lockedComponents = [],
    chatId,
  } = req.body as {
    files: ProjectFileSSE[];
    error: { file: string; message: string; stack?: string; component?: string };
    repairAttempt: number;
    knowledgeGraph?: any;
    lockedComponents?: string[];
    chatId?: string;
  };

  if (!files || !error) return res.status(400).json({ error: "files and error required" });

  if (repairAttempt >= 3) {
    return res.status(200).json({ files, repaired: false, message: "Max repair attempts (3) reached" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const maxLoopAttempts = 3 - repairAttempt;
  const startTime = Date.now();

  try {
    sse(res, {
      type: "repair_start",
      attempt: repairAttempt + 1,
      maxAttempts: 3,
      errorMessage: error.message?.slice(0, 200) ?? "Unknown error",
    });

    const classified = classifyRuntimeError(error);
    sse(res, {
      type: "repair_classify",
      category: classified.category,
      confidence: classified.confidence,
      hint: classified.hint,
    });
    console.log(`[RuntimeRepair V6.1] category="${classified.category}" confidence=${classified.confidence}%`);

    const allAffected = resolveAffectedFilesFromGraph(error, files, knowledgeGraph);

    const lockedFilePaths = new Set<string>();
    for (const cat of lockedComponents) {
      const catLower = cat.toLowerCase();
      for (const f of files) {
        const fp = f.path + f.name;
        if (f.name.toLowerCase().includes(catLower) || fp.toLowerCase().includes(catLower)) {
          lockedFilePaths.add(fp);
        }
      }
    }

    const safeAffected = allAffected.filter(fp => !lockedFilePaths.has(fp));
    sse(res, {
      type: "repair_targets",
      affectedFiles: safeAffected,
      totalResolved: allAffected.length,
      skippedLocked: allAffected.length - safeAffected.length,
    });
    console.log(`[RuntimeRepair V6.1] targets=${safeAffected.length} locked_skipped=${lockedFilePaths.size}`);

    let currentFiles = [...files];
    let repairedSuccessfully = false;
    let lastRepairedFile = '';
    let lastQualityScore = 0;
    const repairStrategy = REPAIR_PROMPTS[classified.category];

    for (let loop = 0; loop < maxLoopAttempts && !repairedSuccessfully; loop++) {
      const attemptNumber = repairAttempt + loop + 1;

      sse(res, {
        type: "repair_generate",
        attempt: attemptNumber,
        category: classified.category,
        strategy: classified.hint ?? '',
      });

      const failingFile = currentFiles.find(f =>
        f.name === error.file ||
        (f.path + f.name).includes(error.file) ||
        (error.file && error.file.includes(f.name))
      ) ?? currentFiles.find(f => f.name === 'App.tsx');

      if (!failingFile) {
        sse(res, { type: "repair_failed", reason: `File "${error.file}" not found`, attempt: attemptNumber });
        break;
      }

      if (lockedFilePaths.has(failingFile.path + failingFile.name)) {
        sse(res, { type: "repair_failed", reason: `"${failingFile.name}" is locked`, attempt: attemptNumber });
        break;
      }

      const depContext = currentFiles
        .filter(f =>
          (f.lang === 'tsx' || f.lang === 'ts') &&
          f !== failingFile &&
          (safeAffected.includes(f.path + f.name) || f.name === 'App.tsx')
        )
        .slice(0, 3)
        .map(f => `// ${f.path}${f.name}\n${f.content.slice(0, 500)}`)
        .join('\n\n');

      const repairSystem = `You are NexoGen Runtime Repair Agent V6.1 — precision surgical code repair.
Error Category: ${classified.category.toUpperCase()} (attempt ${loop + 1}/${maxLoopAttempts})

REPAIR STRATEGY:
${repairStrategy}

MANDATORY SAFE CODING RULES:
- Replace arr.map(…) with (Array.isArray(arr) ? arr : []).map(…)
- Replace obj.prop with obj?.prop for all nullable access
- Replace useState() with typed defaults: useState([]), useState({}), useState(null)
- Add prop defaults: function Comp({ items = [], title = '' })
- NEVER call hooks conditionally or inside loops

Return ONLY the complete corrected file. No markdown, no explanation, no truncation.`;

      const repairPrompt = `Error (${classified.category}): "${error.message}"
${error.stack ? `Stack: ${error.stack.slice(0, 500)}` : ''}
${error.component ? `Component: ${error.component.slice(0, 200)}` : ''}

FILE TO REPAIR (${failingFile.name}):
${failingFile.content}
${depContext ? `\nCONTEXT FILES:\n${depContext}` : ''}

Return the complete repaired file:`;

      const repairedRaw = await callGroq(
        groqKey, REPAIR_MODEL,
        [{ role: "system", content: repairSystem }, { role: "user", content: repairPrompt }],
        false, 3000
      );

      sse(res, { type: "repair_apply", attempt: attemptNumber, file: failingFile.name });

      if (repairedRaw && repairedRaw.trim().length > 80) {
        const cleaned = repairedRaw
          .replace(/^```[a-z]*\r?\n?/im, '')
          .replace(/\r?\n?```$/m, '')
          .trim();

        currentFiles = currentFiles.map(f => f === failingFile ? { ...f, content: cleaned } : f);
        lastRepairedFile = failingFile.name;

        const qualityScore = computeRepairQuality(cleaned, failingFile.content, classified.category);
        lastQualityScore = qualityScore;

        sse(res, {
          type: "repair_validate",
          score: qualityScore,
          passed: qualityScore >= 80,
          attempt: attemptNumber,
          file: failingFile.name,
          checks: {
            hasCode: cleaned.includes('function') || cleaned.includes('const') || cleaned.includes('=>'),
            noMarkdown: !cleaned.includes('```'),
            hasReturn: cleaned.includes('return'),
            sizeRatio: Math.round((cleaned.length / Math.max(1, failingFile.content.length)) * 100),
          },
        });
        console.log(`[RuntimeRepair V6.1] attempt=${attemptNumber} quality=${qualityScore} file=${failingFile.name}`);

        if (qualityScore >= 80) {
          repairedSuccessfully = true;
          sse(res, {
            type: "repair_success",
            attempt: attemptNumber,
            file: failingFile.name,
            score: qualityScore,
            duration: Date.now() - startTime,
            category: classified.category,
          });
        } else {
          sse(res, {
            type: "repair_failed",
            reason: `Quality score ${qualityScore} below 80 threshold`,
            attempt: attemptNumber,
          });
        }
      } else {
        sse(res, { type: "repair_failed", reason: "Repair agent returned insufficient output", attempt: attemptNumber });
      }
    }

    if (chatId) {
      runtimeManager.addRepairRecord(chatId, {
        id: `repair-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: startTime,
        errorType: classified.category,
        errorMessage: (error.message ?? '').slice(0, 200),
        filesChanged: repairedSuccessfully ? [lastRepairedFile] : [],
        attempt: repairAttempt + 1,
        success: repairedSuccessfully,
        qualityScore: lastQualityScore,
        duration: Date.now() - startTime,
      });
    }

    const repairMetrics = chatId ? runtimeManager.getRepairMetrics(chatId) : null;

    sse(res, {
      type: "repair_complete",
      repaired: repairedSuccessfully,
      totalAttempts: repairAttempt + 1,
      category: classified.category,
      file: lastRepairedFile,
      qualityScore: lastQualityScore,
      duration: Date.now() - startTime,
      metrics: repairMetrics,
    });

    sse(res, {
      type: "runtime_repair_done",
      files: currentFiles,
      repaired: repairedSuccessfully,
      repairedFile: lastRepairedFile,
      category: classified.category,
      qualityScore: lastQualityScore,
      message: repairedSuccessfully
        ? `Repaired ${lastRepairedFile} (quality: ${lastQualityScore})`
        : "Repair unsuccessful after all attempts",
    });

    res.end();
  } catch (e: any) {
    console.error("[RuntimeRepair V6.1] Error:", e);
    sse(res, { type: "error", error: e.message ?? "Runtime repair failed" });
    res.end();
  }
});

// GET /agents/repair-history/:chatId
router.get("/agents/repair-history/:chatId", (req, res) => {
  const { chatId } = req.params;
  const history = runtimeManager.getRepairHistory(chatId);
  const metrics = runtimeManager.getRepairMetrics(chatId);
  const healthV2 = runtimeManager.computeHealthV2(runtimeManager.getState(chatId));
  res.json({ history, metrics, healthV2 });
});

// ── NexoGen V5.6: Template Marketplace API ────────────────────────────────────
router.get("/agents/templates", (_req, res) => {
  res.json({ templates: TEMPLATE_LIBRARY_SERVER });
});

router.get("/agents/templates/:id", (req, res) => {
  const template = TEMPLATE_LIBRARY_SERVER.find(t => t.id === req.params.id);
  if (!template) return res.status(404).json({ error: 'Template not found' });
  return res.json({ template });
});

router.post("/agents/templates/match", (req, res) => {
  const { prompt } = req.body as { prompt: string };
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  const result = serverMatchTemplate(prompt);
  const allResults = TEMPLATE_LIBRARY_SERVER.map(t => {
    const lower = prompt.toLowerCase();
    let score = 0;
    for (const kw of TEMPLATE_MATCH_KEYWORDS[t.id] ?? []) { if (lower.includes(kw)) score += kw.split(' ').length > 1 ? 20 : 10; }
    return { templateId: t.id, confidence: Math.min(99, Math.max(10, 50 + score * 3)), template: t };
  }).sort((a, b) => b.confidence - a.confidence);
  return res.json({ best: result, all: allResults });
});

router.post("/agents/templates/preview", (req, res) => {
  const { templateId } = req.body as { templateId: string };
  const template = TEMPLATE_LIBRARY_SERVER.find(t => t.id === templateId);
  if (!template) return res.status(404).json({ error: 'Template not found' });
  const pages = template.pages.length;
  const apis = template.apis.length;
  const tables = template.databaseTables.length;
  const overallScore = Math.round(
    (Math.min(100, pages * 10) * 0.3) + (Math.min(100, (apis / 8) * 100) * 0.35) + (Math.min(100, (tables / 8) * 100) * 0.35)
  );
  return res.json({ template, health: { overallScore, passed: overallScore >= 70, pages, apis, tables }, context: buildTemplateContextServer(template) });
});

router.post("/agents/templates/merge", (req, res) => {
  const { templateIds, weights } = req.body as { templateIds: string[]; weights?: Record<string, number> };
  if (!templateIds?.length) return res.status(400).json({ error: 'templateIds required' });
  const templates = templateIds.map(id => TEMPLATE_LIBRARY_SERVER.find(t => t.id === id)).filter(Boolean) as typeof TEMPLATE_LIBRARY_SERVER;
  if (!templates.length) return res.status(404).json({ error: 'No templates found' });
  const totalWeight = templateIds.reduce((acc, id) => acc + (weights?.[id] ?? 50), 0);
  const templateDna: Record<string, number> = {};
  for (const id of templateIds) templateDna[id] = Math.round(((weights?.[id] ?? 50) / totalWeight) * 100);
  const merged = {
    pages: [...new Set(templates.flatMap(t => t.pages))],
    routes: [...new Set(templates.flatMap(t => t.routes))],
    apis: [...new Set(templates.flatMap(t => t.apis))],
    databaseTables: [...new Set(templates.flatMap(t => t.databaseTables))],
    features: [...new Set(templates.flatMap(t => t.features))],
    authRequired: templates.some(t => t.authRequired),
    templateDna,
  };
  const dnaStr = Object.entries(merged.templateDna).map(([id, pct]) => `${id} (${pct}%)`).join(' + ');
  const context = `HYBRID TEMPLATE DNA: ${dnaStr}\nMerged architecture:\n- Pages: ${merged.pages.join(', ')}\n- APIs: ${merged.apis.join(', ')}\n- Database Tables: ${merged.databaseTables.join(', ')}\n- Features: ${merged.features.join(', ')}`;
  return res.json({ merged, context });
});

// ── V6.2: AUTONOMOUS RUNTIME BUILDER ─────────────────────────────────────────
router.post("/agents/autonomous-build", async (req, res) => {
  const groqKey = process.env["GROQ_API_KEY"];
  if (!groqKey) return res.status(500).json({ error: "GROQ_API_KEY not set" });

  const {
    chatId,
    files: rawFiles = [],
    resolvedDeps: rawResolvedDeps,
  } = req.body as {
    chatId?: string;
    files: Array<{ name: string; content: string; lang: string; path?: string }>;
    resolvedDeps?: { packages: string[]; devPackages: string[]; packageJson: string; warnings: string[] };
  };

  if (!rawFiles.length) return res.status(400).json({ error: "files required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sseAB = (data: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const resolvedDeps = rawResolvedDeps ?? { packages: [], devPackages: [], packageJson: '{}', warnings: [] };
    let workingFiles = rawFiles.map(f => ({ ...f }));

    const cid = chatId ?? `anon-${Date.now()}`;
    runtimeManager.initTimeline(cid);

    // ── Phase 1: Dependency Intelligence ──────────────────────────────────────
    sseAB({ type: "autonomous_phase", phase: "deps", label: "Dependency Intelligence Engine" });
    const depGraph = buildRuntimeDependencyGraph(workingFiles, resolvedDeps);
    runtimeManager.addTimelineEvent(cid, { phase: 'deps', label: 'Dependency Intelligence', status: depGraph.healthScore >= 80 ? 'pass' : 'warn', score: depGraph.healthScore, detail: `${depGraph.totalImports} imports, ${depGraph.totalComponents} components, ${depGraph.totalRoutes} routes` });
    sseAB({
      type: "dependency_plan",
      depGraph,
      summary: {
        imports: `${depGraph.resolvedImports}/${depGraph.totalImports} resolved`,
        components: `${depGraph.resolvedComponents}/${depGraph.totalComponents} resolved`,
        routes: `${depGraph.resolvedRoutes}/${depGraph.totalRoutes} resolved`,
        packages: `${depGraph.resolvedPackages}/${depGraph.totalPackages} resolved`,
        health: depGraph.healthScore,
        injected: depGraph.injectedImports,
      }
    });
    console.log(`[AutonomousBuild] Dep graph — health:${depGraph.healthScore} imports:${depGraph.totalImports} components:${depGraph.totalComponents} routes:${depGraph.totalRoutes}`);

    // ── Phase 2: Import Resolver ───────────────────────────────────────────────
    sseAB({ type: "autonomous_phase", phase: "imports", label: "Import Resolver" });
    const { resolutions: importResolutions, patchedFiles: afterImports } = resolveImports(workingFiles, resolvedDeps);
    workingFiles = afterImports;
    const autoInjected = importResolutions.filter(r => r.autoInjected).length;
    runtimeManager.addTimelineEvent(cid, { phase: 'imports', label: 'Import Resolver', status: autoInjected > 0 ? 'warn' : 'pass', score: undefined, detail: `${autoInjected} imports auto-injected` });
    sseAB({ type: "imports_resolved", resolutions: importResolutions.slice(0, 50), autoInjected, total: importResolutions.length });

    // ── Phase 3: Component Resolver ────────────────────────────────────────────
    sseAB({ type: "autonomous_phase", phase: "components", label: "Component Resolver" });
    const { resolutions: compResolutions } = resolveComponents(workingFiles);
    const missingComps = compResolutions.filter(c => !c.resolved).length;
    runtimeManager.addTimelineEvent(cid, { phase: 'components', label: 'Component Resolver', status: missingComps > 0 ? 'warn' : 'pass', detail: `${missingComps} unresolved components` });
    sseAB({ type: "components_resolved", resolutions: compResolutions.slice(0, 50), missing: missingComps, total: compResolutions.length });

    // ── Phase 4: Route Resolver ────────────────────────────────────────────────
    sseAB({ type: "autonomous_phase", phase: "routes", label: "Route Resolver" });
    const { resolutions: routeResolutions } = resolveRoutes(workingFiles);
    const missingRoutes = routeResolutions.filter(r => !r.resolved).length;
    runtimeManager.addTimelineEvent(cid, { phase: 'routes', label: 'Route Resolver', status: missingRoutes > 0 ? 'warn' : 'pass', detail: `${routeResolutions.length} routes, ${missingRoutes} missing` });
    sseAB({ type: "routes_resolved", resolutions: routeResolutions, missing: missingRoutes, total: routeResolutions.length });

    // ── Phase 5: Package Resolver ──────────────────────────────────────────────
    sseAB({ type: "autonomous_phase", phase: "packages", label: "Package Resolver" });
    const pkgResolutions = resolvePackages(workingFiles, resolvedDeps);
    const missingPkgs = pkgResolutions.filter(p => !p.inResolved).length;
    runtimeManager.addTimelineEvent(cid, { phase: 'packages', label: 'Package Resolver', status: missingPkgs > 0 ? 'warn' : 'pass', detail: `${pkgResolutions.length} detected, ${missingPkgs} missing from resolved` });
    sseAB({ type: "packages_resolved", resolutions: pkgResolutions, missing: missingPkgs, total: pkgResolutions.length });

    // ── Phase 6: Runtime Sandbox ───────────────────────────────────────────────
    sseAB({ type: "autonomous_phase", phase: "sandbox", label: "Runtime Sandbox Validation" });
    let sandboxResult = validateFiles(workingFiles as Array<{ name: string; content: string; lang: string }>);
    runtimeManager.addTimelineEvent(cid, {
      phase: 'sandbox',
      label: 'Runtime Sandbox',
      status: sandboxResult.passed ? 'pass' : 'fail',
      score: sandboxResult.score,
      detail: `${sandboxResult.filesPassed}/${sandboxResult.filesChecked} files passed`,
    });
    sseAB({ type: "sandbox_result", passed: sandboxResult.passed, runtimeScore: sandboxResult.score, filesPassed: sandboxResult.filesPassed, filesChecked: sandboxResult.filesChecked, errors: sandboxResult.errors.slice(0, 5) });

    // ── Phase 7: Autonomous Build Loop (max 5 passes, stop at ≥95) ────────────
    sseAB({ type: "autonomous_phase", phase: "loop", label: "Autonomous Build Loop" });
    const MAX_AUTO_PASSES = 5;
    const PASS_TARGET = 95;
    const REPAIR_SYSTEM_AB = 'You are a React JSX repair agent. Fix ONLY the reported issues. Return the COMPLETE corrected file — no markdown fences, no explanation, no truncation.';
    let passScores: number[] = [];
    let currentHealth = sandboxResult.score;

    for (let pass = 0; pass < MAX_AUTO_PASSES; pass++) {
      const failures = workingFiles.filter(f =>
        (f.lang === 'tsx' || f.lang === 'jsx') &&
        f.name !== 'main.tsx' &&
        !validateFiles([f] as Array<{ name: string; content: string; lang: string }>).passed
      );

      if (failures.length === 0 && currentHealth >= PASS_TARGET) {
        passScores.push(currentHealth);
        runtimeManager.addTimelineEvent(cid, { phase: `loop_pass_${pass + 1}`, label: `Pass ${pass + 1} — Target reached`, status: 'pass', score: currentHealth });
        sseAB({ type: "autonomous_build_pass", pass: pass + 1, health: currentHealth, repairedCount: 0, status: "target_reached", passScores });
        break;
      }

      if (failures.length === 0) {
        passScores.push(currentHealth);
        runtimeManager.addTimelineEvent(cid, { phase: `loop_pass_${pass + 1}`, label: `Pass ${pass + 1} — No failures`, status: 'pass', score: currentHealth });
        sseAB({ type: "autonomous_build_pass", pass: pass + 1, health: currentHealth, repairedCount: 0, status: "no_failures", passScores });
        break;
      }

      sseAB({ type: "autonomous_build_pass", pass: pass + 1, health: currentHealth, repairedCount: failures.length, status: "repairing", passScores });
      let repairedCount = 0;

      await Promise.all(failures.slice(0, 4).map(async (file) => {
        const validation = validateFiles([file] as Array<{ name: string; content: string; lang: string }>);
        const issues = validation.errors.slice(0, 3).map(e => e.message).join('; ') || 'JSX/syntax errors';
        try {
          const repaired = await callGroq(groqKey, REPAIR_MODEL,
            [
              { role: 'system', content: REPAIR_SYSTEM_AB },
              { role: 'user', content: `File: ${file.name}\nIssues: ${issues}\n\nFull file:\n${file.content.slice(0, 3000)}` },
            ],
            false, 1500
          );
          if (repaired && repaired.length > 80) {
            const cleaned = repaired.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
            if (cleaned.length > file.content.length * 0.3) {
              file.content = cleaned;
              repairedCount++;
            }
          }
        } catch (e) {
          console.error(`[AutonomousBuild:pass${pass + 1}] repair failed for ${file.name}:`, e);
        }
      }));

      const postRepair = validateFiles(workingFiles as Array<{ name: string; content: string; lang: string }>);
      currentHealth = postRepair.score;
      passScores.push(currentHealth);

      runtimeManager.addTimelineEvent(cid, {
        phase: `loop_pass_${pass + 1}`,
        label: `Pass ${pass + 1} — ${repairedCount} files repaired`,
        status: currentHealth >= PASS_TARGET ? 'pass' : currentHealth >= 80 ? 'warn' : 'fail',
        score: currentHealth,
        detail: `${repairedCount}/${failures.length} repaired`,
      });
      sseAB({ type: "autonomous_build_pass", pass: pass + 1, health: currentHealth, repairedCount, status: currentHealth >= PASS_TARGET ? "target_reached" : "pass_complete", passScores });
      sandboxResult = postRepair;

      if (currentHealth >= PASS_TARGET) break;
    }

    const tl = runtimeManager.getTimeline(cid);
    if (tl) tl.totalPasses = passScores.length;

    // ── Phase 8: Compute RuntimeHealthV3 ──────────────────────────────────────
    sseAB({ type: "autonomous_phase", phase: "health", label: "Runtime Health V3" });
    const runtimeStateForV3 = runtimeManager.getState(cid);
    const healthV3 = runtimeManager.computeHealthV3(runtimeStateForV3, depGraph);
    if (currentHealth > 0) {
      const blendedOverall = Math.round((healthV3.overall * 0.6) + (currentHealth * 0.4));
      (healthV3 as { overall: number }).overall = Math.min(100, blendedOverall);
    }

    runtimeManager.addTimelineEvent(cid, { phase: 'health_v3', label: 'Runtime Health V3', status: healthV3.overall >= 90 ? 'pass' : healthV3.overall >= 70 ? 'warn' : 'fail', score: healthV3.overall });
    sseAB({ type: "runtime_health_v3", healthV3, passScores, finalHealth: healthV3.overall });
    console.log(`[AutonomousBuild] HealthV3 overall:${healthV3.overall} compile:${healthV3.compile} runtime:${healthV3.runtime} imports:${healthV3.imports} packages:${healthV3.packages} components:${healthV3.components}`);

    // ── Phase 9: Runtime Timeline ──────────────────────────────────────────────
    sseAB({ type: "autonomous_phase", phase: "timeline", label: "Runtime Timeline" });
    const finalTimeline = runtimeManager.finalizeTimeline(cid, healthV3.overall);
    if (finalTimeline) {
      sseAB({ type: "runtime_timeline", timeline: finalTimeline });
    }

    // ── Phase 10: Autonomous Preview Gate ─────────────────────────────────────
    sseAB({ type: "autonomous_phase", phase: "gate", label: "Preview Gate" });
    const gatePass = healthV3.overall >= 90;

    if (!gatePass) {
      const criticalFiles = workingFiles.filter(f =>
        (f.lang === 'tsx' || f.lang === 'jsx') &&
        !validateFiles([f] as Array<{ name: string; content: string; lang: string }>).passed
      );
      if (criticalFiles.length > 0) {
        sseAB({ type: "preview_gate_fail", health: healthV3.overall, threshold: 90, repairingFiles: criticalFiles.length });
        await Promise.all(criticalFiles.slice(0, 3).map(async (file) => {
          try {
            const repaired = await callGroq(groqKey, REPAIR_MODEL,
              [
                { role: 'system', content: REPAIR_SYSTEM_AB },
                { role: 'user', content: `CRITICAL: Fix ALL errors in this file for production preview.\nFile: ${file.name}\n\nFull file:\n${file.content.slice(0, 3000)}` },
              ],
              false, 1500
            );
            if (repaired && repaired.length > 80) {
              const cleaned = repaired.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
              if (cleaned.length > file.content.length * 0.3) file.content = cleaned;
            }
          } catch { /* best effort */ }
        }));
        const afterGate = validateFiles(workingFiles as Array<{ name: string; content: string; lang: string }>);
        healthV3.overall = Math.min(100, Math.round((healthV3.overall * 0.6) + (afterGate.score * 0.4)));
        runtimeManager.addTimelineEvent(cid, { phase: 'gate', label: 'Preview Gate — Repaired', status: healthV3.overall >= 90 ? 'pass' : 'warn', score: healthV3.overall });
        sseAB({ type: "preview_gate_repaired", health: healthV3.overall, gatePass: healthV3.overall >= 90 });
      } else {
        sseAB({ type: "preview_gate_fail", health: healthV3.overall, threshold: 90, repairingFiles: 0 });
      }
    } else {
      runtimeManager.addTimelineEvent(cid, { phase: 'gate', label: 'Preview Gate — Passed', status: 'pass', score: healthV3.overall });
      sseAB({ type: "preview_gate_pass", health: healthV3.overall });
    }

    sseAB({
      type: "autonomous_build_done",
      chatId: cid,
      healthV3,
      depGraph,
      passScores,
      timeline: runtimeManager.getTimeline(cid),
      gatePass: healthV3.overall >= 90,
      files: workingFiles,
    });

    console.log(`[AutonomousBuild] Done — final health:${healthV3.overall} passes:${passScores.length} gate:${healthV3.overall >= 90}`);

  } catch (err: any) {
    sseAB({ type: "autonomous_build_error", error: err?.message ?? "Autonomous build failed" });
  }

  res.end();
});

export default router;
